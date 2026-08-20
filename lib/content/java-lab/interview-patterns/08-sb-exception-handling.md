# Exception Handling + Dynatrace Alerting in Financial APIs

## Why This Matters

Your team has `@ControllerAdvice` for logging but is missing the **alert layer**. In a financial domain (remittance, AML, fund pull), missing an alert means your team discovers outages from angry customers—not from Dynatrace. This lesson covers the full exception handling chain from request to alert.

---

## The Architecture

```
HTTP Request
    ↓
Controller
    ↓ throws
Service / Repository
    ↓
@ControllerAdvice ←— catch, classify, mask PII, log
    ↓
Dynatrace Custom Event / Metric ←— THIS IS THE MISSING PIECE
    ↓
HTTP Response (standardized error body)
```

---

## 1. @ControllerAdvice With Masking and Log Levels

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(RemittanceBusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(RemittanceBusinessException ex,
                                                        HttpServletRequest request) {
        // Milestone log — INFO is enough, expected business rule violation
        log.info("[MILESTONE] Business exception on {}: code={}, msg={}",
                 request.getRequestURI(), ex.getErrorCode(), ex.getMessage());

        dynatraceAlert(ex, AlertSeverity.INFO, request);
        return ResponseEntity.unprocessableEntity()
                .body(ErrorResponse.of(ex.getErrorCode(), ex.getMessage()));
    }

    @ExceptionHandler(FundPullException.class)
    public ResponseEntity<ErrorResponse> handleFundPull(FundPullException ex,
                                                        HttpServletRequest request) {
        // Fund pull failure is a CRITICAL milestone — always WARN+
        String maskedAccount = mask(ex.getAccountNumber()); // ****1234
        log.warn("[MILESTONE][FUND_PULL] Failed for account={} txnId={} reason={}",
                 maskedAccount, ex.getTxnId(), ex.getReason());

        dynatraceAlert(ex, AlertSeverity.CRITICAL, request);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ErrorResponse.of("FUND_PULL_FAILED", "Unable to pull funds. Please retry."));
    }

    @ExceptionHandler(ThirdPartyApiException.class)
    public ResponseEntity<ErrorResponse> handleThirdParty(ThirdPartyApiException ex,
                                                          HttpServletRequest request) {
        log.error("[MILESTONE][THIRD_PARTY] provider={} status={} correlationId={}",
                  ex.getProviderName(), ex.getHttpStatus(), ex.getCorrelationId());

        dynatraceAlert(ex, AlertSeverity.HIGH, request);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ErrorResponse.of("PROVIDER_ERROR", "Third-party service unavailable."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex,
                                                          HttpServletRequest request) {
        // Never log the full stack in INFO — only ERROR for unexpected
        log.error("[MILESTONE][UNEXPECTED] uri={} type={}",
                  request.getRequestURI(), ex.getClass().getSimpleName(), ex);

        dynatraceAlert(ex, AlertSeverity.CRITICAL, request);
        return ResponseEntity.internalServerError()
                .body(ErrorResponse.of("INTERNAL_ERROR", "An unexpected error occurred."));
    }

    // PII masking utility
    private String mask(String value) {
        if (value == null || value.length() < 4) return "****";
        return "*".repeat(value.length() - 4) + value.substring(value.length() - 4);
    }
}
```

---

## 2. Dynatrace Integration — Three Options

### Option A: Dynatrace OneAgent SDK (Java)

Add to `pom.xml`:
```xml
<dependency>
    <groupId>com.dynatrace.oneagent.sdk.java</groupId>
    <artifactId>oneagent-sdk</artifactId>
    <version>1.9.0</version>
</dependency>
```

```java
@Component
public class DynatraceAlerter {

    private final OneAgentSDK sdk = OneAgentSDKFactory.createInstance();

    public void sendCustomEvent(String title, Map<String, String> props) {
        CustomRequestAttribute attr = sdk.addCustomRequestAttribute(title, "custom-event");
        // The SDK auto-attaches to the current OneAgent trace context
        // Dynatrace picks this up as a custom attribute on the active request
    }

    // For metric ingest (counts, gauges):
    public void incrementErrorMetric(String errorType) {
        // Use OneAgent metric API to push: remittance.errors[type=errorType] += 1
        sdk.createIntegerCounterMetric("remittance.errors", MetricUnit.NONE)
           .value(1, Collections.singletonMap("type", errorType));
    }
}
```

### Option B: Dynatrace HTTP Events API (No SDK dependency)

Better for services where you can't use the OneAgent SDK.

```java
@Component
@Slf4j
public class DynatraceEventPusher {

    @Value("${dynatrace.url}")        // https://<env>.live.dynatrace.com
    private String dynatraceUrl;

    @Value("${dynatrace.api-token}")  // scope: events.ingest, metrics.ingest
    private String apiToken;

    private final RestTemplate rest = new RestTemplate();

    public void pushEvent(String title, String description, AlertSeverity severity) {
        String url = dynatraceUrl + "/api/v2/events/ingest";
        Map<String, Object> body = Map.of(
            "eventType", toEventType(severity),
            "title", title,
            "properties", Map.of("description", description, "source", "remittance-service")
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            rest.postForEntity(url, new HttpEntity<>(body, headers), String.class);
        } catch (Exception e) {
            // Never let alerting break the main response path
            log.warn("Failed to push Dynatrace event: {}", e.getMessage());
        }
    }

    private String toEventType(AlertSeverity severity) {
        return switch (severity) {
            case CRITICAL -> "ERROR_EVENT";
            case HIGH     -> "PERFORMANCE_EVENT";
            default       -> "CUSTOM_INFO";
        };
    }
}
```

### Option C: Micrometer + Dynatrace Metrics Exporter (Recommended for Spring Boot)

```yaml
# application.yml
management:
  dynatrace:
    metrics:
      export:
        uri: ${DYNATRACE_URL}/api/v2/metrics/ingest
        api-token: ${DYNATRACE_API_TOKEN}
        enabled: true
```

```java
@Component
public class RemittanceMetrics {

    private final Counter fundPullErrors;
    private final Counter amlRejections;
    private final Counter thirdPartyErrors;

    public RemittanceMetrics(MeterRegistry registry) {
        this.fundPullErrors  = Counter.builder("remittance.fund_pull.errors").register(registry);
        this.amlRejections   = Counter.builder("remittance.aml.rejections").register(registry);
        this.thirdPartyErrors= Counter.builder("remittance.third_party.errors").register(registry);
    }

    public void recordFundPullError()   { fundPullErrors.increment(); }
    public void recordAmlRejection()    { amlRejections.increment(); }
    public void recordThirdPartyError() { thirdPartyErrors.increment(); }
}
```

Then in Dynatrace UI: create **Custom Chart** from `remittance.fund_pull.errors` and set a **Davis Anomaly Detector** or a **Fixed Threshold Alert** (`> 5 in 5 min → alert`).

---

## 3. Log Level Strategy for Milestones

| Milestone | Condition | Log Level |
|-----------|-----------|-----------|
| Request received | Always | `DEBUG` (trace id only) |
| AML scan started | Always | `INFO` |
| AML scan result | Approved | `INFO`, Rejected → `WARN` |
| Fund pull attempt | Always | `INFO` |
| Fund pull success | — | `INFO` |
| Fund pull failure | — | `ERROR` + Dynatrace |
| Third-party call | Always | `INFO` with provider name |
| Third-party timeout | — | `WARN` + retry count |
| Third-party failure (no retry left) | — | `ERROR` + Dynatrace |
| Saga rollback triggered | — | `ERROR` + Dynatrace |
| Callback received | Always | `INFO` |
| Transaction complete | — | `INFO` |

---

## 4. Standard Error Response

```java
public record ErrorResponse(
    String code,
    String message,
    String traceId,    // from MDC — lets ops team correlate with Dynatrace
    Instant timestamp
) {
    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(code, message,
            MDC.get("traceId"), Instant.now());
    }
}
```

---

## Interview Talking Points

- "We have `@ControllerAdvice` as a global handler. Each exception type maps to a log level—INFO for expected business rules, WARN for retryable externals, ERROR for unexpected or financial-critical failures."
- "We mask PII (account numbers, phone) before logging—only last 4 digits are visible."
- "We're integrating Dynatrace via Micrometer metrics export. Each critical exception increments a counter, and we set anomaly alerts in Dynatrace UI."
- "We always include `traceId` in the response body so the ops team can find the Dynatrace trace in one click."
