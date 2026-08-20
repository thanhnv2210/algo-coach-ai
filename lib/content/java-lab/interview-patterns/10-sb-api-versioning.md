# API Versioning — Fixing the Single-Endpoint Trap

## Your Pain Point

You described it exactly:

> *"We try to keep only one endpoint and check the API version from the client to customize logic. Sometimes we have more than 2 active app versions on iOS/Android, making some customers upgrade just to fix an issue."*

That's the **version branching inside a handler** antipattern. It creates cognitive debt that compounds with every new version. This lesson shows how to evolve away from it.

---

## The Problem Illustrated

```java
// MISTAKE: Single endpoint with version branching
@PostMapping("/remittance/submit")
public ResponseEntity<?> submit(@RequestHeader("X-App-Version") String version,
                                @RequestBody Map<String, Object> rawRequest) {
    if (version.startsWith("1.")) {
        // v1 logic: amount is String, no beneficiary object
        String amount = (String) rawRequest.get("amount");
        String beneficiaryId = (String) rawRequest.get("beneficiaryId");
        return processV1(amount, beneficiaryId);

    } else if (version.startsWith("2.")) {
        // v2 logic: amount is BigDecimal, has nested beneficiary
        BigDecimal amount = new BigDecimal(rawRequest.get("amount").toString());
        Map<?,?> beneficiary = (Map<?,?>) rawRequest.get("beneficiary");
        return processV2(amount, beneficiary);

    } else if (version.startsWith("3.")) {
        // v3 added FX rate lock — now there are 3 branches
        // ...
    }
    return ResponseEntity.badRequest().build();
}
```

**Problems:**
- Impossible to test each version in isolation
- Cannot deprecate v1 without touching the same method
- Business logic scattered across `if` chains
- Breaks open/closed principle — adding v4 touches production code

---

## Solution 1: URI Versioning (Recommended for APIs with breaking changes)

```java
@RestController
@RequestMapping("/api/v1/remittance")
public class RemittanceV1Controller {
    @PostMapping("/submit")
    public ResponseEntity<RemittanceResponseV1> submit(@RequestBody RemittanceRequestV1 req) {
        // v1 logic only — clean, independent
        return ResponseEntity.accepted().body(service.submitV1(req));
    }
}

@RestController
@RequestMapping("/api/v2/remittance")
public class RemittanceV2Controller {
    @PostMapping("/submit")
    public ResponseEntity<RemittanceResponseV2> submit(@RequestBody RemittanceRequestV2 req) {
        // v2 logic only
        return ResponseEntity.accepted().body(service.submitV2(req));
    }
}
```

**Mobile team points old apps to `/api/v1`, new apps to `/api/v2`.**
You can sunset `/api/v1` when < 5% of traffic uses it.

---

## Solution 2: Request Mapper Delegation (Minimal refactor from your current setup)

If introducing new endpoints is politically difficult, use **request mappers** to isolate version logic from business logic:

```java
@RestController
@RequestMapping("/remittance/submit")
public class RemittanceSubmitController {

    private final Map<Integer, RemittanceRequestMapper> mappers;
    private final RemittanceService service;

    public RemittanceSubmitController(List<RemittanceRequestMapper> mapperList,
                                      RemittanceService service) {
        this.mappers = mapperList.stream()
            .collect(Collectors.toMap(RemittanceRequestMapper::version, m -> m));
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<RemittanceResponse> submit(
            @RequestHeader(value = "X-App-Version", defaultValue = "3") int version,
            @RequestBody JsonNode rawRequest) {

        RemittanceRequestMapper mapper = mappers.getOrDefault(version, mappers.get(3));
        RemittanceCommand command = mapper.toCommand(rawRequest); // normalized internal model
        return ResponseEntity.accepted().body(service.submit(command));
    }
}

// Each version has its own mapper — business logic is isolated
public interface RemittanceRequestMapper {
    int version();
    RemittanceCommand toCommand(JsonNode raw);
}

@Component
public class RemittanceRequestMapperV1 implements RemittanceRequestMapper {
    public int version() { return 1; }
    public RemittanceCommand toCommand(JsonNode raw) {
        return RemittanceCommand.builder()
            .amount(new BigDecimal(raw.get("amount").asText())) // v1: amount is String
            .beneficiaryId(raw.get("beneficiaryId").asText())
            .build();
    }
}

@Component
public class RemittanceRequestMapperV2 implements RemittanceRequestMapper {
    public int version() { return 2; }
    public RemittanceCommand toCommand(JsonNode raw) {
        return RemittanceCommand.builder()
            .amount(raw.get("amount").decimalValue()) // v2: already decimal
            .beneficiaryId(raw.get("beneficiary").get("id").asText())
            .beneficiaryName(raw.get("beneficiary").get("name").asText())
            .build();
    }
}
```

Now adding v3 = writing one new `RemittanceRequestMapperV3` class. Zero changes to the controller or service.

---

## Solution 3: Content Negotiation (Accept header versioning)

```java
@PostMapping(value = "/remittance/submit",
             consumes = "application/vnd.remittance.v2+json",
             produces = "application/vnd.remittance.v2+json")
public ResponseEntity<RemittanceResponseV2> submitV2(@RequestBody RemittanceRequestV2 req) { ... }

@PostMapping(value = "/remittance/submit",
             consumes = "application/vnd.remittance.v1+json",
             produces = "application/vnd.remittance.v1+json")
public ResponseEntity<RemittanceResponseV1> submitV1(@RequestBody RemittanceRequestV1 req) { ... }
```

Clean at the HTTP level, but harder to test from mobile clients (custom media types).

---

## Deprecation Strategy

```java
@GetMapping("/remittance/submit")
@Deprecated(since = "2025-01", forRemoval = true)
public ResponseEntity<?> submitV1Legacy(...) {
    response.setHeader("Deprecation", "2025-01-01");
    response.setHeader("Sunset", "2025-07-01");
    response.setHeader("Link", "</api/v2/remittance/submit>; rel=\"successor-version\"");
    // ... forward to v1 handler
}
```

Add a Dynatrace alert: "if `/api/v1/` traffic > 0 after sunset date → alert."

---

## Handling Multiple Active App Versions (Your Specific Problem)

The root issue is not about which versioning strategy you pick — it's about **not having a migration path**. The key rule:

> **Never remove a version until telemetry confirms < 1% of production traffic uses it.**

Practical steps:
1. Log `X-App-Version` header for every request → Dynatrace dashboard
2. Set a sunset date per version (minimum 6 months for mobile apps — app store review cycles)
3. Use in-app banners to prompt upgrades before sunset
4. Keep N+1 versions live at all times (current + previous)

---

## Interview Talking Points

- "Our current pain point is a single endpoint with `if version == X` branches inside the handler. We're moving to request mapper delegation because it lets each version have its own mapper class without touching the controller or business service."
- "For backward compatibility: we never remove a version until Dynatrace shows < 1% traffic. We add `Deprecation` and `Sunset` headers so API consumers get early warning."
- "For mobile apps, sunset is minimum 6 months because we can't force upgrades—users on old App Store versions still need the API to work."
