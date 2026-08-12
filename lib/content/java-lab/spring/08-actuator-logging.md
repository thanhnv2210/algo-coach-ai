# Production-Ready: Actuator & Logging

## Why this matters in interviews

Senior engineers are expected to operate their services, not just write them. Interviewers ask about observability — health checks, metrics, and structured logging — because these are what keep production stable and debuggable. Spring Boot Actuator is the standard answer for health and metrics exposure; MDC-based structured logging is the standard for correlating log lines across a distributed request.

## Concept

### Spring Boot Actuator

Actuator exposes **endpoints** over HTTP (or JMX) that give operational visibility into a running application. Add `spring-boot-starter-actuator` to unlock them.

Key endpoints:

| Endpoint | URL | Purpose |
|----------|-----|---------|
| Health | `/actuator/health` | Liveness + readiness (used by K8s probes) |
| Info | `/actuator/info` | App version, git commit, custom info |
| Metrics | `/actuator/metrics` | Micrometer counters, timers, gauges |
| Env | `/actuator/env` | All environment properties |
| Loggers | `/actuator/loggers` | View/change log levels at runtime |
| Thread dump | `/actuator/threaddump` | All thread stack traces |
| Heap dump | `/actuator/heapdump` | Binary heap dump |

### Health indicators

Spring Boot auto-configures indicators for: DataSource, Redis, Elasticsearch, RabbitMQ, Kafka, and Disk Space. You can add custom ones:

```java
@Component
public class PaymentGatewayHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        boolean reachable = checkGateway();
        return reachable
            ? Health.up().withDetail("latencyMs", 12).build()
            : Health.down().withDetail("error", "timeout").build();
    }
}
```

Kubernetes uses `/actuator/health/liveness` and `/actuator/health/readiness` probes separately.

### Micrometer metrics

Actuator uses Micrometer as a vendor-neutral metrics facade. Metrics are exported to backends: Prometheus, Datadog, CloudWatch, etc.

```java
@Service
public class OrderService {
    private final Counter orderCounter;
    private final Timer orderTimer;

    public OrderService(MeterRegistry registry) {
        this.orderCounter = registry.counter("orders.created", "env", "prod");
        this.orderTimer   = registry.timer("orders.processing.time");
    }

    public void placeOrder(Order o) {
        orderTimer.record(() -> {
            processOrder(o);
            orderCounter.increment();
        });
    }
}
```

### Structured logging with MDC

MDC (Mapped Diagnostic Context) attaches key-value pairs to the current thread's log context. Every log line written while MDC is populated automatically includes those fields — without passing them as parameters.

```java
// In a filter or interceptor:
MDC.put("requestId", UUID.randomUUID().toString());
MDC.put("userId", String.valueOf(userId));
try {
    chain.doFilter(request, response);
} finally {
    MDC.clear(); // always clear — thread may be reused
}

// Any logger in the call stack picks up the context:
log.info("Order placed"); // outputs: {..., "requestId":"abc", "userId":"42", "msg":"Order placed"}
```

Logback JSON encoder (Logstash encoder) outputs structured JSON automatically when MDC values are present.

### Log levels at runtime

Actuator's `/actuator/loggers` endpoint lets you change log levels without restart:

```bash
curl -X POST /actuator/loggers/com.example.service \
  -H 'Content-Type: application/json' \
  -d '{"configuredLevel":"DEBUG"}'
```

## Key rules / gotchas

- **Secure Actuator endpoints in production.** By default, only `health` and `info` are exposed. Exposing `env`, `heapdump`, or `threaddump` publicly leaks sensitive data. Use Spring Security to restrict access: `management.endpoints.web.exposure.include=health,info,metrics`.
- **MDC must be cleared after each request** — servlet threads are reused from a pool. Stale MDC values from the previous request will appear on unrelated log lines.
- **MDC is thread-local** — it doesn't propagate to `@Async` threads, `CompletableFuture`, or reactive chains automatically. Use `MDC.getCopyOfContextMap()` and restore it in child threads.
- **`/actuator/health` returns 200 even when components are DOWN** unless configured with `management.endpoint.health.show-details=always` and `management.health.defaults.enabled=true`.
- **Micrometer tag cardinality**: never use unbounded values (user IDs, request URLs) as metric tags — it creates millions of time series and crashes your monitoring backend.
- **Log level hierarchy**: setting `DEBUG` on `com.example` also enables it for `com.example.service`, `com.example.controller`, etc. — the hierarchy is package-based.

## Code example

```java
import java.util.*;
import java.time.Instant;

// Simulates Spring Boot Actuator health checks and structured logging with MDC.
public class JavaLabRunner {
    // ── Health indicators ──────────────────────────────────────
    interface HealthIndicator {
        record Health(String status, Map<String, Object> details) {}
        Health health();
    }

    static class DatabaseHealthIndicator implements HealthIndicator {
        private final boolean connected;
        DatabaseHealthIndicator(boolean connected) { this.connected = connected; }
        public Health health() {
            return connected
                ? new Health("UP",   Map.of("pool", "10/10", "responseMs", 2))
                : new Health("DOWN", Map.of("error", "Connection refused"));
        }
    }

    static class ExternalApiHealthIndicator implements HealthIndicator {
        private final boolean reachable;
        ExternalApiHealthIndicator(boolean reachable) { this.reachable = reachable; }
        public Health health() {
            return reachable
                ? new Health("UP",   Map.of("latencyMs", 45))
                : new Health("DOWN", Map.of("error", "Timeout after 5000ms"));
        }
    }

    // ── Micrometer counters ────────────────────────────────────
    static final Map<String, Long>   COUNTERS = new HashMap<>();
    static final Map<String, Long>   TIMINGS  = new LinkedHashMap<>();

    static void increment(String metric) { COUNTERS.merge(metric, 1L, Long::sum); }
    static void recordTime(String metric, long ms) { TIMINGS.put(metric, ms); }

    // ── MDC-style structured logging ──────────────────────────
    static final ThreadLocal<Map<String, String>> MDC = ThreadLocal.withInitial(HashMap::new);
    static void mdcPut(String k, String v) { MDC.get().put(k, v); }
    static void mdcClear() { MDC.get().clear(); }
    static void log(String level, String msg) {
        String ctx = MDC.get().isEmpty() ? "" : ", \"ctx\":" + MDC.get();
        System.out.printf("{\"ts\":\"%s\",\"level\":\"%s\",\"msg\":\"%s\"%s}%n",
            Instant.now().toString().substring(11, 23), level, msg, ctx);
    }

    public static void main(String[] args) throws InterruptedException {
        // ── /actuator/health ───────────────────────────────────
        System.out.println("=== /actuator/health ===");
        List<HealthIndicator> indicators = List.of(
            new DatabaseHealthIndicator(true),
            new ExternalApiHealthIndicator(false)
        );
        String overall = "UP";
        for (HealthIndicator hi : indicators) {
            HealthIndicator.Health h = hi.health();
            if ("DOWN".equals(h.status())) overall = "DOWN";
            System.out.printf("  %-35s %s %s%n",
                hi.getClass().getSimpleName(), h.status(), h.details());
        }
        System.out.println("  Overall: " + overall);

        // ── /actuator/metrics ──────────────────────────────────
        System.out.println("\n=== Simulated request processing ===");
        // Request 1
        mdcPut("requestId", "req-a1b2");
        mdcPut("userId",    "user-42");
        log("INFO", "Request received: POST /orders");
        long start = System.currentTimeMillis();
        Thread.sleep(12); // simulate work
        increment("orders.created");
        increment("http.requests.total");
        recordTime("orders.processing.time.ms", System.currentTimeMillis() - start);
        log("INFO", "Order created successfully");
        mdcClear();

        // Request 2 (different user — MDC cleared, no bleed-over)
        mdcPut("requestId", "req-c3d4");
        mdcPut("userId",    "user-99");
        log("INFO", "Request received: GET /orders/42");
        increment("http.requests.total");
        log("WARN", "Order not found, returning 404");
        increment("http.errors.404");
        mdcClear();

        // ── /actuator/metrics snapshot ─────────────────────────
        System.out.println("\n=== /actuator/metrics ===");
        COUNTERS.forEach((k, v) -> System.out.printf("  %-30s %d%n", k, v));
        TIMINGS.forEach((k, v)  -> System.out.printf("  %-30s %dms%n", k, v));
    }
}
```

## Interview questions you should be able to answer

- **Q:** What is the difference between liveness and readiness probes in Kubernetes, and how does Actuator support them?
  > Liveness: "is the app alive, or should Kubernetes restart it?" Readiness: "is the app ready to receive traffic?" Spring Boot exposes `/actuator/health/liveness` (fails if JVM is stuck) and `/actuator/health/readiness` (fails if a dependency like the database is unreachable). Kubernetes should restart on liveness failure but only remove from load balancer on readiness failure.

- **Q:** Why is MDC important in microservices, and what is its main pitfall?
  > MDC attaches a correlation ID (e.g., `requestId`, `traceId`) to every log line in the thread, allowing you to trace a single request across hundreds of log lines — essential in microservices where logs from many services are aggregated. The main pitfall: MDC is thread-local and must be cleared after each request (threads are reused from a pool), and it doesn't propagate to child threads or reactive chains without explicit handling.

- **Q:** How do you expose and secure Actuator endpoints in production?
  > In `application.yml`: `management.endpoints.web.exposure.include: health,info,metrics,prometheus`. Restrict sensitive endpoints with Spring Security: map `/actuator/**` to require `ROLE_OPS` or restrict to internal network only (ingress rules / firewall). Never expose `env`, `heapdump`, or `configprops` publicly.

- **Q:** What is Micrometer and how does it relate to Spring Boot Actuator?
  > Micrometer is a vendor-neutral metrics instrumentation library — the SLF4J equivalent for metrics. Spring Boot Actuator uses Micrometer to collect metrics (counters, timers, gauges) and can export them to Prometheus, Datadog, CloudWatch, or InfluxDB by adding the relevant `micrometer-registry-*` dependency.

- **Q:** Why is high-cardinality metric tagging dangerous?
  > Each unique combination of tag values creates a separate time series in your monitoring backend. Tagging with a user ID, request URL, or order ID creates millions of series — this is called cardinality explosion. Prometheus, Datadog, and others have hard limits and will degrade or drop data. Always use bounded values (status codes, endpoint names, regions) as metric tags.

## Further reading

- [Spring Boot Actuator docs](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
- [Micrometer documentation](https://micrometer.io/docs)
- [Baeldung: Spring Boot Actuator](https://www.baeldung.com/spring-boot-actuators)
- [Logstash Logback Encoder (structured JSON logging)](https://github.com/logfellow/logstash-logback-encoder)
