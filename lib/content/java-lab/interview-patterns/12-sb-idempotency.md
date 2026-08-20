# 2-Layer Idempotency: Redis + Database

## Why This Matters

In a payment system, the worst outcome is a **double charge**. Network retries, mobile app reconnects after timeout, and queue reprocessing all create duplicate requests. Idempotency is your defense.

You described the exact production pattern: **Redis as first gate, DB as fallback, 429 for in-flight duplicates.**

---

## The Problem

```
Mobile app → POST /submit (202 Accepted)
Mobile network drops...
Mobile app → POST /submit (RETRY with same payload)
             ^ DANGER: Is this a retry or a new transaction?
```

Without idempotency: two transactions created, customer charged twice.
With idempotency key: second request returns the exact same response as the first.

---

## The 2-Layer Architecture

```
Request → Redis GET idempotency-key
            ↓ HIT (response cached)         → return cached response (200 or 202)
            ↓ MISS

         Redis SET idempotency-key = "IN_FLIGHT" (with 30s TTL)
            ↓ SET succeeded (first to arrive)
            ↓ CONFLICT (another thread already set it)  → return 429

         [Process request]
         DB upsert: INSERT ... ON CONFLICT DO NOTHING
            ↓ row inserted (true first time)
            ↓ row existed (means Redis expired but request was already processed)  → read existing row

         Redis SET idempotency-key = serialized_response (24h TTL)
         return 202 Accepted
```

---

## 1. Idempotency Service

```java
@Service
@Slf4j
public class IdempotencyService {

    private static final String PREFIX = "idem:";
    private static final String IN_FLIGHT_MARKER = "__IN_FLIGHT__";
    private static final Duration IN_FLIGHT_TTL = Duration.ofSeconds(30);
    private static final Duration RESPONSE_TTL = Duration.ofHours(24);

    private final RedisTemplate<String, String> redis;
    private final ObjectMapper objectMapper;

    /**
     * Attempt to claim the idempotency key.
     * Returns: empty = new request (claimed), present = cached response (duplicate).
     * Throws DuplicateInFlightException if another thread is currently processing this key.
     */
    public <T> Optional<T> claimOrGet(String key, Class<T> responseType) {
        String redisKey = PREFIX + key;
        String value = redis.opsForValue().get(redisKey);

        if (value == null) {
            // Not seen before — set IN_FLIGHT marker with 30s TTL
            Boolean set = redis.opsForValue().setIfAbsent(redisKey, IN_FLIGHT_MARKER, IN_FLIGHT_TTL);
            if (Boolean.TRUE.equals(set)) {
                return Optional.empty(); // caller should process the request
            } else {
                // Another thread won the race for this key — return 429
                throw new DuplicateInFlightException("Request is already being processed: " + key);
            }
        }

        if (IN_FLIGHT_MARKER.equals(value)) {
            // Still processing — return 429
            throw new DuplicateInFlightException("Request is already being processed: " + key);
        }

        // Cached response found — deserialize and return
        try {
            return Optional.of(objectMapper.readValue(value, responseType));
        } catch (JsonProcessingException e) {
            log.warn("Failed to deserialize cached idempotency response key={}", key, e);
            return Optional.empty();
        }
    }

    /**
     * Store the response after successful processing.
     */
    public <T> void complete(String key, T response) {
        try {
            String json = objectMapper.writeValueAsString(response);
            redis.opsForValue().set(PREFIX + key, json, RESPONSE_TTL);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize idempotency response key={}", key, e);
            // Non-critical: next duplicate will process again but DB upsert protects consistency
        }
    }

    /**
     * Remove IN_FLIGHT marker on failure (so the client can retry cleanly).
     */
    public void release(String key) {
        redis.delete(PREFIX + key);
    }
}
```

---

## 2. DB-Level Idempotency (Second Layer)

Redis can evict entries under memory pressure. The DB is the source of truth:

```java
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {

    // Check if transaction already exists by idempotency key
    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);
}
```

```sql
-- Schema: unique constraint on idempotency_key
ALTER TABLE transactions
ADD COLUMN idempotency_key VARCHAR(255) UNIQUE;

-- PostgreSQL upsert: first insert wins, second is no-op
INSERT INTO transactions (id, customer_id, amount, idempotency_key, status, created_at)
VALUES (:id, :customerId, :amount, :idempotencyKey, 'PENDING', now())
ON CONFLICT (idempotency_key) DO NOTHING;
```

In JPA:
```java
@Column(unique = true)
private String idempotencyKey;
```

---

## 3. Full Integration in the Controller

```java
@PostMapping("/submit")
public ResponseEntity<SubmitResponse> submit(
        @RequestHeader("X-Idempotency-Key") String idempotencyKey,
        @RequestBody RemittanceRequestV2 request,
        Authentication auth) {

    // --- Layer 1: Redis gate ---
    try {
        Optional<SubmitResponse> cached = idempotencyService.claimOrGet(idempotencyKey, SubmitResponse.class);
        if (cached.isPresent()) {
            log.info("[IDEMPOTENCY] Cache hit key={}", idempotencyKey);
            return ResponseEntity.accepted().body(cached.get());
        }
    } catch (DuplicateInFlightException ex) {
        log.warn("[IDEMPOTENCY] In-flight duplicate key={}", idempotencyKey);
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header("Retry-After", "30")
            .body(null); // or a structured error body
    }

    try {
        // --- Layer 2: DB upsert ---
        Transaction txn = txnRepo.findByIdempotencyKey(idempotencyKey)
            .orElseGet(() -> {
                Transaction newTxn = Transaction.builder()
                    .id(UUID.randomUUID().toString())
                    .customerId(auth.getName())
                    .amount(request.getAmount())
                    .idempotencyKey(idempotencyKey)
                    .status(TxnStatus.PENDING)
                    .createdAt(Instant.now())
                    .build();
                return txnRepo.save(newTxn); // throws DataIntegrityViolationException on race
            });

        kafka.send("remittance.submit", txn.getId(), RemittanceEvent.of(txn.getId(), EventType.SUBMITTED));

        SubmitResponse response = new SubmitResponse(txn.getId(),
            "/api/v2/remittance/" + txn.getId() + "/journey");

        idempotencyService.complete(idempotencyKey, response); // update Redis with real response
        return ResponseEntity.accepted().body(response);

    } catch (DataIntegrityViolationException ex) {
        // Race condition: DB unique constraint fired → another thread created the txn first
        Transaction existing = txnRepo.findByIdempotencyKey(idempotencyKey)
            .orElseThrow(() -> new IllegalStateException("Race condition: txn not found after constraint violation"));
        SubmitResponse response = new SubmitResponse(existing.getId(),
            "/api/v2/remittance/" + existing.getId() + "/journey");
        idempotencyService.complete(idempotencyKey, response);
        return ResponseEntity.accepted().body(response);

    } catch (Exception ex) {
        // Release IN_FLIGHT so the client can retry
        idempotencyService.release(idempotencyKey);
        throw ex;
    }
}
```

---

## 4. What Happens in Each Scenario

| Scenario | Redis | DB | Response |
|----------|-------|----|----------|
| First request | MISS → sets IN_FLIGHT | INSERT succeeds | 202 |
| Retry within 30s | IN_FLIGHT | not reached | 429 + Retry-After: 30 |
| Retry after processing | HIT (cached response) | not reached | 202 (same as first) |
| Redis evicted, DB exists | MISS → sets IN_FLIGHT | row exists → read existing | 202 (from existing txn) |
| Two requests at exact same ms | One sets IN_FLIGHT, other gets 429 | not reached | 202 + 429 |

---

## 5. Idempotency Key Best Practices

- **Client generates the key**, not the server — the client must reuse the same key across retries
- Use `UUID v4` format: `X-Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000`
- TTL: 24 hours is standard for payments (covers end-of-day batch reconciliation)
- Scope: per customer + operation type (a customer can have multiple in-flight transfers)
- Log the key at EVERY step so you can trace duplicates in Dynatrace

---

## Interview Talking Points

- "We implement 2-layer idempotency. Redis is the fast gate: `setIfAbsent` with 30s TTL marks the key IN_FLIGHT. If a second request arrives while processing, we return 429 with `Retry-After: 30` instead of letting it queue."
- "After processing, we update Redis with the real response. Next retries get the cached 202 instantly."
- "The DB has a unique constraint on `idempotency_key`. This is the fallback if Redis loses the key. We handle `DataIntegrityViolationException` and read the existing row."
- "On failure, we release the IN_FLIGHT key so the client can retry cleanly — otherwise the customer would be locked out for 30 seconds and have to wait."
- "Clients must use the same UUID across retries. We document this in our mobile SDK wrapper so the frontend team doesn't need to think about it."
