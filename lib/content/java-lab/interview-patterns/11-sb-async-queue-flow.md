# Async Queue + Callback Pattern — Send Money Journey

## Your Flow

You described the exact production flow:

1. Customer inputs amount → clicks Next → sees **draft transaction** (preview, fee, FX rate)
2. Customer clicks **Submit** → saved to queue → **202 Accepted** → shows transaction journey
3. System runs **AML Scan** → **Forter check**
4. Calls **fund pull API**
5. Calls **third-party remittance API**
6. Waits for **callback** from third-party
7. Sends **success email** + **push notification**

This is a classic **async orchestration** pattern. Let's implement it correctly.

---

## Architecture

```
[Mobile/Web] --POST /submit--> [API Gateway]
                                     |
                           [Remittance Service]
                                     |
                          save to DB (PENDING) + publish to queue
                                     |
                          return 202 Accepted + txnId
                                     |
                    [Kafka Consumer / Worker Thread]
                              AML Scan
                              Forter Check
                              Fund Pull
                              Third-party Call
                              Save status (CALLBACK_PENDING)
                                     |
                    [Callback Endpoint] <--- Third-party provider
                              set COMPLETED
                              send email
                              push notification
```

---

## 1. Submit Endpoint (Fast Path — Must Return in < 200ms)

```java
@RestController
@RequestMapping("/api/v2/remittance")
@Slf4j
public class RemittanceSubmitController {

    private final TransactionRepository txnRepo;
    private final KafkaTemplate<String, RemittanceEvent> kafka;
    private final IdempotencyService idempotencyService;

    @PostMapping("/submit")
    public ResponseEntity<SubmitResponse> submit(
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @RequestBody RemittanceRequestV2 request,
            Authentication auth) {

        String customerId = auth.getName();

        // 1. Check idempotency (Redis first)
        Optional<SubmitResponse> cached = idempotencyService.get(idempotencyKey);
        if (cached.isPresent()) {
            log.info("[SUBMIT] Duplicate request idempotencyKey={} — returning cached response", idempotencyKey);
            return ResponseEntity.accepted().body(cached.get());
        }

        // 2. Validate + create transaction in DB (PENDING)
        Transaction txn = Transaction.builder()
            .id(UUID.randomUUID().toString())
            .customerId(customerId)
            .amount(request.getAmount())
            .currency(request.getCurrency())
            .beneficiaryId(request.getBeneficiaryId())
            .status(TxnStatus.PENDING)
            .idempotencyKey(idempotencyKey)
            .createdAt(Instant.now())
            .build();
        txnRepo.save(txn);

        // 3. Publish to Kafka (async processing starts here)
        kafka.send("remittance.submit", txn.getId(),
            RemittanceEvent.of(txn.getId(), EventType.SUBMITTED));

        // 4. Cache the response for idempotency
        SubmitResponse response = new SubmitResponse(txn.getId(), "/api/v2/remittance/" + txn.getId() + "/journey");
        idempotencyService.set(idempotencyKey, response, Duration.ofHours(24));

        log.info("[SUBMIT] Accepted txnId={} customerId={}", txn.getId(), customerId);
        return ResponseEntity.accepted()
            .header("Location", response.journeyUrl())
            .body(response);
    }
}
```

---

## 2. Kafka Consumer (Async Processing)

```java
@Component
@Slf4j
public class RemittanceProcessingConsumer {

    private final RemittanceOrchestrator orchestrator;

    @KafkaListener(
        topics = "remittance.submit",
        groupId = "remittance-processor",
        concurrency = "5"            // 5 consumer threads
    )
    public void process(ConsumerRecord<String, RemittanceEvent> record) {
        String txnId = record.key();
        MDC.put("txnId", txnId);     // structured logging for all downstream calls

        try {
            log.info("[CONSUMER] Processing txnId={}", txnId);
            orchestrator.process(txnId);
        } catch (Exception ex) {
            log.error("[CONSUMER] Failed to process txnId={}", txnId, ex);
            // Let Kafka retry (throw to trigger requeue) or send to DLQ
            throw ex; // Spring Kafka will retry based on RetryTopicConfiguration
        } finally {
            MDC.clear();
        }
    }
}
```

Retry configuration:
```java
@Bean
public RetryTopicConfiguration retryTopicConfig(KafkaTemplate<String, RemittanceEvent> template) {
    return RetryTopicConfigurationBuilder
        .newInstance()
        .fixedBackOff(5_000)             // 5s between retries
        .maxAttempts(3)
        .includeTopic("remittance.submit")
        .dltSuffix(".DLT")               // dead letter topic
        .create(template);
}
```

---

## 3. Transaction Journey API (Polling / SSE)

The mobile app shows the customer a live journey. Two approaches:

### Option A: Polling (Simpler)
```java
@GetMapping("/{txnId}/journey")
public ResponseEntity<JourneyResponse> getJourney(@PathVariable String txnId,
                                                   Authentication auth) {
    Transaction txn = txnRepo.findByIdAndCustomerId(txnId, auth.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    List<TxnStatusHistory> history = historyRepo.findByTxnIdOrderByOccurredAt(txnId);
    return ResponseEntity.ok(JourneyResponse.of(txn, history));
}
```
Mobile polls every 3–5 seconds until status is `COMPLETED` or `FAILED`.

### Option B: Server-Sent Events (Better UX)
```java
@GetMapping(value = "/{txnId}/journey/stream",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter streamJourney(@PathVariable String txnId) {
    SseEmitter emitter = new SseEmitter(30_000L); // 30s timeout
    journeyStreamService.subscribe(txnId, emitter);
    return emitter;
}
```

---

## 4. Callback Endpoint (Third-Party Signals Completion)

```java
@RestController
@RequestMapping("/internal/callback/remittance")
@Slf4j
public class RemittanceCallbackController {

    private final RemittanceOrchestrator orchestrator;
    private final CallbackAuthenticator auth;

    @PostMapping
    public ResponseEntity<Void> callback(
            @RequestHeader("X-Provider-Signature") String signature,
            @RequestBody CallbackPayload payload) {

        // Always verify provider signature
        if (!auth.verify(payload, signature)) {
            log.warn("[CALLBACK] Invalid signature providerRef={}", payload.getProviderRef());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("[CALLBACK] Received providerRef={} status={}", payload.getProviderRef(), payload.getStatus());
        orchestrator.handleCallback(payload.getInternalTxnId(), payload);

        return ResponseEntity.ok().build();
    }
}
```

---

## 5. Notification (Email + Push)

```java
@Service
public class NotificationService {

    private final EmailClient emailClient;
    private final PushNotificationClient pushClient;

    @Async("notificationExecutor")  // don't block the callback response
    public void sendSuccessEmail(Transaction txn) {
        try {
            emailClient.send(EmailRequest.builder()
                .to(txn.getCustomerEmail())
                .subject("Your transfer is complete!")
                .template("remittance-success")
                .params(Map.of("amount", txn.getAmount(), "beneficiary", txn.getBeneficiaryName()))
                .build());
        } catch (Exception e) {
            log.error("[NOTIFY] Email failed txnId={}", txn.getId(), e);
            // Log and swallow — notification failure must not fail the transaction
        }
    }

    @Async("notificationExecutor")
    public void pushMobileNotification(Transaction txn) {
        pushClient.send(PushRequest.of(txn.getCustomerId(),
            "Transfer Complete", "Your RM " + txn.getAmount() + " has been sent."));
    }
}
```

Key rule: **notification failures must never propagate back to the saga orchestrator.**

---

## Sequence Diagram

```
Customer → POST /submit → 202 Accepted + txnId
Customer ← Journey URL (polling starts)

[Background]
  Queue Consumer
    → AML Scan          (PENDING → AML_SCANNING → FORTER_CHECKING)
    → Forter Check      (→ FUND_PULLING)
    → Fund Pull         (→ REMITTANCE_IN_PROGRESS)
    → Third-party Call  (→ CALLBACK_PENDING)

Third-party → POST /internal/callback/remittance
  → COMPLETED
  → Email sent async
  → Push notification sent async

Customer sees journey: "Submitted → AML Passed → Fund Deducted → Sent → Complete"
```

---

## Interview Talking Points

- "Submit returns 202 immediately after saving to DB and publishing to Kafka. The consumer handles all async steps."
- "We set `CALLBACK_PENDING` after the third-party submission. The callback endpoint updates to `COMPLETED`. This decouples our success state from their response latency."
- "Notifications are `@Async` — they never block the callback response. Failure of a notification is logged and swallowed."
- "We persist every status transition to `txn_status_history` so the customer-facing journey screen always has accurate, timestamped steps."
- "Idempotency key on submit prevents double charges if the mobile app retries the 202."
