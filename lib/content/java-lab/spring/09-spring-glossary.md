# Spring Boot Terminology — Interview Reference

## Why this matters in interviews

Senior Java interviews consistently probe Spring internals: proxy mechanics, transaction propagation, auto-configuration bootstrapping, and security filter chains. Interviewers expect you to explain not just what an annotation does but why the underlying mechanism works that way — and where it silently breaks. Mastering this vocabulary lets you reason through novel scenarios instead of reciting memorized answers.

## Concept

### IoC & Dependency Injection

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| IoC (Inversion of Control) container | The framework controls object creation and wiring; your code declares dependencies rather than constructing them | "The IoC container reads your `@Component` classes and wires their dependencies at startup." |
| `ApplicationContext` | Full-featured IoC container with event publishing, AOP, i18n, and web support; extends `BeanFactory` | "We inject `ApplicationContext` to programmatically retrieve beans at runtime." |
| `BeanFactory` | Minimal, lazy IoC container; the root interface — rarely used directly in modern Spring | "BeanFactory is the lowest-level abstraction; ApplicationContext adds enterprise features on top." |
| Constructor injection | Dependencies passed as constructor parameters — preferred; makes dependencies explicit, enables immutability, and fails fast on missing beans | "`@Service` classes with `final` fields use constructor injection so Spring fails startup if a dependency is absent." |
| Setter injection | Spring calls a setter after construction — allows optional dependencies but makes the object mutable | "Use setter injection only when the dependency is genuinely optional or has a circular dependency that can't be resolved otherwise." |
| Field injection | `@Autowired` on a private field — concise but hides dependencies, prevents `final`, and breaks unit testing without a Spring context | "We refactored away from field injection so the service could be unit-tested with a plain `new` call." |
| `@Autowired` | Instructs Spring to resolve and inject the matching bean by type | "`@Autowired` on a constructor is implicit in Spring 4.3+ if only one constructor exists." |
| `@Qualifier` | Disambiguates when multiple beans of the same type exist, by specifying the bean name | "`@Qualifier(\"primaryDataSource\")` selects the correct `DataSource` when two are registered." |
| `@Primary` | Marks a bean as the default candidate when multiple beans of the same type exist | "Annotate the main `DataSource` with `@Primary` so all unqualified injection points receive it." |
| Circular dependency | Bean A depends on B and B depends on A — constructor injection throws `BeanCurrentlyInCreationException`; setter/field injection allows it via proxy | "We resolved the circular dependency by converting one side to setter injection, letting Spring inject a partially initialized proxy." |
| `@Component` | Generic stereotype; marks a class for component scanning | "Any class with `@Component` is detected and registered as a singleton bean by default." |
| `@Service` | Semantic stereotype for service-layer classes; functionally identical to `@Component` | "We use `@Service` on business logic classes to communicate intent — Spring treats it exactly like `@Component`." |
| `@Repository` | Stereotype for persistence-layer classes; additionally enables `PersistenceExceptionTranslation` | "`@Repository` converts JDBC `SQLExceptions` into Spring's `DataAccessException` hierarchy automatically." |
| `@Controller` | Stereotype for MVC controllers; enables `@RequestMapping` handler detection | "`@Controller` tells `DispatcherServlet` that this class contains request-handler methods." |
| `@Bean` | Method-level in a `@Configuration` class; the return value is registered as a Spring bean | "Use `@Bean` when you need to register a third-party class you cannot annotate with `@Component`." |
| `@Configuration` (full mode) | Class is proxied by CGLIB; inter-bean method calls return the same singleton bean instead of creating new instances | "Because `@Configuration` uses CGLIB, calling `dataSource()` inside `entityManagerFactory()` returns the existing bean, not a new object." |
| `@Configuration` lite mode / `@Component` | No CGLIB proxy; inter-bean method calls are plain Java calls — a new instance is returned each time | "Annotating a factory class with only `@Component` means `dataSource()` is called as a regular method, creating a second `DataSource` instance." |

---

### Bean Lifecycle & Scopes

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| Singleton scope (default) | One bean instance per `ApplicationContext`; shared by all injection points | "A singleton `UserService` holds shared state — ensure it is thread-safe." |
| Prototype scope | A new bean instance is created every time it is requested or injected | "Use `@Scope(\"prototype\")` for stateful beans like command objects that must not be shared." |
| Request scope | One instance per HTTP request; requires a web-aware `ApplicationContext` | "A `@RequestScope` bean stores request-specific data without servlet-API coupling." |
| Session scope | One instance per HTTP session | "Shopping-cart beans are often session-scoped to survive across multiple requests." |
| Application scope | One instance per `ServletContext` — effectively a Singleton scoped to the web application | "Application-scoped beans hold data shared across all sessions for the lifetime of the app." |
| `@PostConstruct` | Method called after dependency injection is complete, before the bean enters service | "`@PostConstruct` is the right place to validate configuration or prime a cache." |
| `@PreDestroy` | Method called just before the bean is removed from the context (shutdown hook) | "Close file handles or flush buffers in `@PreDestroy` to avoid resource leaks." |
| `InitializingBean.afterPropertiesSet()` | Spring callback interface alternative to `@PostConstruct` — couples the class to Spring API | "We migrated from `InitializingBean` to `@PostConstruct` to remove the Spring API dependency." |
| `DisposableBean.destroy()` | Spring callback interface alternative to `@PreDestroy` | "Legacy code still uses `DisposableBean`; prefer `@PreDestroy` in new code." |
| `BeanPostProcessor` | Intercepts every bean after instantiation but before/after initialization — used internally for AOP, `@Autowired` processing, etc. | "`AutowiredAnnotationBeanPostProcessor` is a `BeanPostProcessor` that processes `@Autowired` annotations." |
| `BeanFactoryPostProcessor` | Intercepts and modifies bean *definitions* before any bean is instantiated | "`PropertySourcesPlaceholderConfigurer` is a `BeanFactoryPostProcessor` that resolves `${...}` placeholders in bean definitions." |
| `@Lazy` | Defers bean creation until first use instead of at `ApplicationContext` startup | "Mark expensive infrastructure beans `@Lazy` to speed up startup in test environments." |

---

### AOP (Aspect-Oriented Programming)

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| Aspect | A module that encapsulates cross-cutting concerns (logging, security, transactions) | "Our `AuditAspect` writes an audit log entry for every public `@Service` method call." |
| Join point | A specific point in program execution where an aspect can be applied — in Spring AOP always a method execution | "Every public method of a Spring-managed bean is a potential join point." |
| Pointcut | An expression that selects a set of join points | "`execution(* com.example.service.*.*(..))` is a pointcut that matches all service methods." |
| Advice | The action taken at a join point — Before, After, AfterReturning, AfterThrowing, or Around | "`@Around` advice can short-circuit execution by not calling `proceed()` on the `ProceedingJoinPoint`." |
| Weaving | The process of linking aspects with target objects to create an advised object | "Spring performs weaving at runtime using proxies, unlike AspectJ which weaves at compile time." |
| JDK dynamic proxy | Interface-based proxy; Spring creates a `java.lang.reflect.Proxy` that implements the same interfaces as the target | "If `UserService` implements `UserServiceApi`, Spring wraps it in a JDK proxy by default." |
| CGLIB proxy | Subclass-based proxy; Spring subclasses the target class using CGLIB — used when the target has no interface or `proxyTargetClass=true` | "CGLIB proxies cannot proxy `final` classes or `final` methods — annotate them carefully." |
| Self-invocation problem | A bean calling its own method via `this` bypasses the proxy — no aspect (including `@Transactional`) is applied | "Calling `this.validateOrder()` from within `OrderService` skips `@Transactional`, causing silent data corruption." |
| `@EnableAspectJAutoProxy(proxyTargetClass=true)` | Forces CGLIB proxies for all beans even when interfaces are present | "Set `proxyTargetClass=true` when a bean must be injected as its concrete class rather than an interface." |

---

### Spring MVC

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| `DispatcherServlet` | Front controller; receives all HTTP requests and delegates to `HandlerMapping`, `HandlerAdapter`, and `ViewResolver` | "All Spring MVC requests funnel through a single `DispatcherServlet` registered at `/`." |
| `HandlerMapping` | Determines which controller method handles an incoming request | "`RequestMappingHandlerMapping` maps URLs to `@RequestMapping`-annotated methods." |
| `HandlerAdapter` | Invokes the selected handler with correct argument resolution and return type handling | "`RequestMappingHandlerAdapter` resolves `@RequestBody`, `@PathVariable`, and `@ModelAttribute` parameters." |
| `ViewResolver` | Resolves logical view names to actual `View` implementations for HTML rendering | "In REST APIs, `ViewResolver` is replaced by `HttpMessageConverter`s that serialize to JSON." |
| `@RequestMapping` | Maps a URL (and optional HTTP method) to a controller method | "`@RequestMapping(method = GET, value = \"/users/{id}\")` is the verbose form of `@GetMapping(\"/users/{id}\")`." |
| `@PathVariable` | Binds a URI template variable to a method parameter | "`@PathVariable Long id` extracts `123` from `/users/123`." |
| `@RequestBody` | Deserializes the HTTP request body into a Java object using `HttpMessageConverter` | "`@RequestBody CreateUserRequest req` reads JSON from the POST body into the DTO." |
| `@ResponseBody` | Serializes the return value to the HTTP response body instead of resolving a view | "Combine `@Controller` + `@ResponseBody` on every method, or just use `@RestController`." |
| `@RestController` | Composed annotation = `@Controller` + `@ResponseBody`; all methods write directly to the response | "Every endpoint in our REST API uses `@RestController` so no method needs `@ResponseBody`." |
| `Filter` | Servlet-level component; runs *before* `DispatcherServlet` is invoked | "JWT parsing often lives in a `Filter` so unauthenticated requests are rejected before Spring routing." |
| `HandlerInterceptor` | Spring MVC interceptor; runs after `DispatcherServlet` selects the handler but before/after execution | "Use an `HandlerInterceptor` for request logging that needs access to handler metadata." |
| `@ControllerAdvice` | Global component applied to all `@Controller` classes for exception handling, model attributes, and data binding | "`@ControllerAdvice` with `@ExceptionHandler` centralizes HTTP error responses across all controllers." |
| `@ExceptionHandler` | Handles a specific exception type thrown from a controller method | "`@ExceptionHandler(EntityNotFoundException.class)` returns a 404 response automatically." |
| `@ResponseStatus` | Sets the HTTP status code on a controller method or exception class | "Annotate a custom exception with `@ResponseStatus(HttpStatus.CONFLICT)` for a 409 response." |
| `ResponseEntity` | Wrapper for the full HTTP response (status, headers, body) — gives maximum control | "Return `ResponseEntity.created(location).body(dto)` to set both 201 status and `Location` header." |

---

### Transactions

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| `@Transactional` | Declares that a method (or all methods on a class) must run inside a transaction | "Annotate `@Transactional` at the service layer, never on the repository layer, to keep transaction boundaries clear." |
| REQUIRED (default propagation) | Join the current transaction if one exists; create a new one if not | "Most service methods use REQUIRED so they participate in a caller's transaction without starting a new one." |
| REQUIRES_NEW | Always start a new transaction, suspending the outer one if present | "Use REQUIRES_NEW for audit logging so the audit record commits even if the outer transaction rolls back." |
| SUPPORTS | Run in a transaction if one exists; run non-transactionally if not | "Read-only helper methods can use SUPPORTS to avoid forcing a transaction when called standalone." |
| MANDATORY | Must execute within an existing transaction; throws if none exists | "Mark internal repository calls MANDATORY to enforce that callers always provide a transaction context." |
| NEVER | Must NOT execute within a transaction; throws if one exists | "Use NEVER on operations that must not be wrapped in a transaction, like schema-altering DDL." |
| NESTED | Execute within a nested transaction (savepoint) inside the existing one | "NESTED allows partial rollback — roll back the savepoint without cancelling the outer transaction." |
| READ_UNCOMMITTED | Lowest isolation; allows dirty reads (reading uncommitted data from other transactions) | "READ_UNCOMMITTED is almost never used in production due to the risk of reading phantom or rolled-back data." |
| READ_COMMITTED | Default in most RDBMS; prevents dirty reads but allows non-repeatable reads | "READ_COMMITTED ensures you only read committed data but a second read in the same transaction may return different rows." |
| REPEATABLE_READ | Prevents dirty reads and non-repeatable reads; MySQL InnoDB default | "With REPEATABLE_READ, re-reading the same row in a transaction always returns the same data, but phantom rows can appear." |
| SERIALIZABLE | Highest isolation; prevents dirty reads, non-repeatable reads, and phantom reads — at the cost of performance | "Use SERIALIZABLE only for critical financial transactions where phantom reads would cause incorrect results." |
| Dirty read | Reading data written by another transaction that has not yet committed | "If transaction A writes a row and transaction B reads it before A commits, B has performed a dirty read." |
| Non-repeatable read | The same row returns different values on two reads within a transaction because another transaction committed a change in between | "Between two `SELECT` calls in transaction A, transaction B updates the row — A experiences a non-repeatable read." |
| Phantom read | The same range query returns a different number of rows on two reads because another transaction inserted or deleted rows | "Transaction A queries `WHERE status='pending'` twice; transaction B inserts a pending row between those queries — A sees a phantom." |
| Rollback rules | Unchecked exceptions (`RuntimeException`, `Error`) trigger rollback by default; checked exceptions do NOT | "A `@Transactional` method that throws `IOException` commits unless you add `rollbackFor = IOException.class`." |
| Self-invocation pitfall | Calling a `@Transactional` method from another method in the same class bypasses the proxy — transaction is ignored | "`orderService.placeOrder()` calling `this.chargePayment()` (also `@Transactional(REQUIRES_NEW)`) runs in the *same* transaction — the annotation has no effect." |

---

### Spring Boot Specifics

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| Auto-configuration | Spring Boot automatically configures beans based on the classpath, existing beans, and properties using `@Conditional` logic | "Adding `spring-boot-starter-data-jpa` to the classpath triggers auto-configuration of `DataSource`, `EntityManagerFactory`, and `TransactionManager`." |
| `@EnableAutoConfiguration` | Triggers the auto-configuration mechanism; included in `@SpringBootApplication` | "Exclude specific auto-configs with `@EnableAutoConfiguration(exclude = DataSourceAutoConfiguration.class)`." |
| `spring.factories` / `AutoConfiguration.imports` | Java SPI file listing auto-configuration classes; Spring Boot reads this at startup (the file moved to `AutoConfiguration.imports` in Boot 2.7+) | "Third-party starters register their `AutoConfiguration` class in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`." |
| `@ConditionalOnClass` | Registers the bean only if the specified class is on the classpath | "`DataSourceAutoConfiguration` uses `@ConditionalOnClass(DataSource.class)` to remain dormant when no JDBC driver is present." |
| `@ConditionalOnMissingBean` | Registers the bean only if no bean of that type is already defined — allows user-defined beans to override auto-configured ones | "Define your own `ObjectMapper` bean and Boot's auto-configured one is skipped due to `@ConditionalOnMissingBean`." |
| `@ConditionalOnProperty` | Registers the bean only if the specified property has the expected value | "`@ConditionalOnProperty(\"feature.flag.enabled\")` activates a feature bean without code changes." |
| `@SpringBootApplication` | Composed annotation = `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan` | "Place `@SpringBootApplication` on the main class at the root package to scan all sub-packages." |
| `application.properties` / `application.yml` | Externalized configuration files loaded at startup | "Store environment-specific config in `application-{profile}.yml` to keep the main file clean." |
| `@Profile` | Restricts a bean or configuration class to specific active profiles | "`@Profile(\"test\")` activates an in-memory `DataSource` only during test runs." |
| `spring.profiles.active` | Property that selects which profile(s) are active | "Set `SPRING_PROFILES_ACTIVE=prod` in the environment to activate the production configuration." |
| Externalized config precedence | Environment variables > JVM system properties > `application.yml` > `@PropertySource` files > defaults | "An environment variable `SERVER_PORT=9090` overrides `server.port=8080` in `application.yml`." |
| Actuator | Production-ready endpoints exposing health, metrics, environment, and bean information | "Expose only `/actuator/health` and `/actuator/info` publicly; protect the rest with security rules." |
| `/actuator/health` | Reports application health (UP/DOWN) and optionally the health of each component | "Kubernetes liveness and readiness probes call `/actuator/health` to determine pod status." |
| `/actuator/metrics` | Exposes Micrometer metrics (JVM, HTTP, custom) in a queryable format | "Use `/actuator/metrics/http.server.requests` to inspect request counts and latency percentiles." |
| `/actuator/env` | Shows all `Environment` properties and their sources — useful for debugging config resolution | "Use `/actuator/env` to verify which value wins when a property is defined in multiple sources." |
| `/actuator/beans` | Lists all beans in the `ApplicationContext` with their types and dependencies | "Check `/actuator/beans` when troubleshooting auto-configuration to confirm which beans are registered." |
| Embedded server | Spring Boot packages Tomcat (default), Jetty, or Undertow inside the fat JAR — no external server needed | "Swap Tomcat for Undertow by excluding `spring-boot-starter-tomcat` and adding `spring-boot-starter-undertow`." |
| Fat JAR | Self-contained executable JAR containing application classes, all dependencies, and the embedded server | "Deploy by running `java -jar myapp.jar` — no application server installation required." |

---

### Spring Security

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| `SecurityFilterChain` | Defines the ordered chain of `Filter`s applied to HTTP requests; configured programmatically in a `@Bean` method | "Define multiple `SecurityFilterChain` beans with different request matchers to apply different security rules per URL prefix." |
| `UsernamePasswordAuthenticationFilter` | Processes form-login requests; extracts credentials and delegates to `AuthenticationManager` | "For REST APIs, disable the default `UsernamePasswordAuthenticationFilter` and add a custom JWT filter instead." |
| `OncePerRequestFilter` | Base class guaranteeing your filter is invoked exactly once per request, even across dispatches | "Extend `OncePerRequestFilter` for JWT validation to avoid processing the token twice on a forward." |
| `Authentication` | Represents the authenticated principal, their credentials, and granted authorities | "After successful JWT validation, construct an `UsernamePasswordAuthenticationToken` and store it as the `Authentication`." |
| `SecurityContext` | Holder for the current `Authentication` object within a request | "Access the logged-in user via `SecurityContextHolder.getContext().getAuthentication().getPrincipal()`." |
| `SecurityContextHolder` | ThreadLocal-based store for the `SecurityContext` — provides `getContext()` anywhere in the call stack | "Clear the `SecurityContextHolder` in a `finally` block to prevent context leaking between requests in thread pool environments." |
| JWT filter flow | Extract the `Authorization: Bearer <token>` header → validate signature and expiry → load `UserDetails` → set `Authentication` in `SecurityContext` | "The JWT filter must run *before* `UsernamePasswordAuthenticationFilter` in the filter chain order." |
| `@PreAuthorize` | Method-level security using SpEL expressions evaluated before the method executes | "`@PreAuthorize(\"hasRole('ADMIN')\")` blocks the method call if the current user lacks the ADMIN role." |
| `@Secured` | Method-level security using simple role strings (less powerful than `@PreAuthorize`) | "`@Secured(\"ROLE_USER\")` is equivalent to `@PreAuthorize(\"hasRole('USER')\")` but without SpEL support." |
| `UserDetailsService` | Interface with `loadUserByUsername(String)` — Spring Security calls this to retrieve user info for authentication | "Implement `UserDetailsService` to load users from your database rather than in-memory user stores." |
| `PasswordEncoder` | Encodes and verifies passwords; BCrypt is the recommended implementation | "Never store plain-text passwords — inject `PasswordEncoder` and call `encode()` on registration, `matches()` on login." |

---

## Key rules / gotchas

- **Constructor injection prevents circular dependencies at startup:** Spring cannot build the proxy chain if A→B→A all use constructor injection. The error surfaces immediately, which is the correct behavior — fix the design rather than masking it with setter injection.
- **`@Transactional` on `private` methods is silently ignored:** Spring's proxy can only intercept `public` (or at minimum `protected` for CGLIB) methods. A `private @Transactional` method compiles and runs — just without a transaction.
- **`@Configuration` vs `@Component` CGLIB behavior changes inter-bean calls:** Two `@Bean` methods calling each other inside a `@Component`-annotated class create two separate bean instances, potentially wiring two different `DataSource` connections to one `EntityManagerFactory`.
- **Checked exceptions do NOT roll back by default:** `@Transactional` rolls back on `RuntimeException` and `Error` only. A service throwing `IOException` will commit. Always set `rollbackFor` explicitly for checked exceptions.
- **Prototype beans injected into singletons are created only once:** A singleton bean captures its prototype dependency at injection time — it holds the same prototype instance for its lifetime. Use `ApplicationContext.getBean()` or `@Lookup` to get a fresh prototype each time.
- **Profiles and auto-configuration interact:** A `@ConditionalOnProperty` check is evaluated *before* profile-specific beans are loaded. Ensure your property is set in the correct profile file, not just the active profile bean.
- **Filter vs Interceptor order matters for security:** `Filter`s run before the servlet context — including `DispatcherServlet`. Place security-critical logic in a `Filter` (or `SecurityFilterChain`) so it cannot be bypassed by Spring routing.
- **`REQUIRES_NEW` suspends, not cancels, the outer transaction:** The outer transaction is paused and resumes when the inner one completes. Both transactions are independent — a rollback in the inner does not roll back the outer, and vice versa.
- **`proxyTargetClass=true` breaks injection by interface:** When CGLIB is forced, injecting a bean by its interface may fail if the concrete class is `final` or if Spring cannot subclass it. Ensure target classes are non-final and have a no-arg constructor (or use Objenesis).
- **ThreadLocal `SecurityContext` leaks in async code:** `SecurityContextHolder` is ThreadLocal by default. In `@Async` or reactive streams, the context is not propagated automatically — use `SecurityContextHolder.setStrategyName(MODE_INHERITABLETHREADLOCAL)` or reactive `ReactiveSecurityContextHolder`.

## Code example

```java
import java.util.function.Supplier;

/**
 * Runnable plain-Java simulation of four Spring concepts:
 *  1. Constructor DI (vs field injection)
 *  2. AOP proxy self-invocation pitfall
 *  3. Transaction propagation (REQUIRED vs REQUIRES_NEW)
 *  4. Bean lifecycle phases (@PostConstruct → use → @PreDestroy)
 */
public class JavaLabRunner {

    // ─── 1. CONSTRUCTOR DI ───────────────────────────────────────────────────

    interface PaymentGateway {
        String charge(double amount);
    }

    static class StripeGateway implements PaymentGateway {
        @Override
        public String charge(double amount) {
            return "Stripe charged $" + amount;
        }
    }

    /**
     * Good: constructor injection — dependency is explicit, final, and
     * testable without a Spring context.
     */
    static class OrderService {
        private final PaymentGateway paymentGateway;   // final — immutable

        // Spring would call this constructor automatically (single constructor rule)
        OrderService(PaymentGateway paymentGateway) {
            this.paymentGateway = paymentGateway;
        }

        String placeOrder(double amount) {
            return paymentGateway.charge(amount);
        }
    }

    // ─── 2. AOP SELF-INVOCATION PITFALL ─────────────────────────────────────

    /**
     * In Spring, @Transactional and @Cacheable work through a proxy wrapping
     * the bean. When a method calls *this*.otherMethod(), it bypasses the proxy
     * — no transaction / cache is applied.
     *
     * This simulation shows the difference between proxy-mediated calls and
     * direct self-calls.
     */
    interface InvoiceService {
        void processInvoice(int id);
        void sendNotification(int id);   // should be "transactional"
    }

    static class InvoiceServiceImpl implements InvoiceService {
        private boolean inTransaction = false;

        @Override
        public void processInvoice(int id) {
            System.out.println("[processInvoice] transaction active? " + inTransaction);
            // PITFALL: direct `this` call — bypasses any proxy wrapping
            this.sendNotification(id);
            System.out.println("[sendNotification via self-invocation] transaction active? " + inTransaction);
        }

        @Override
        public void sendNotification(int id) {
            // In real Spring this would be @Transactional(REQUIRES_NEW)
            // but self-invocation means the proxy is never entered
            System.out.println("  Sending notification for invoice " + id + " (no new transaction started!)");
        }
    }

    /**
     * Proxy wrapper simulating what Spring's CGLIB proxy does when you call
     * through the bean reference (not `this`).
     */
    static class InvoiceServiceProxy implements InvoiceService {
        private final InvoiceServiceImpl target;

        InvoiceServiceProxy(InvoiceServiceImpl target) {
            this.target = target;
        }

        @Override
        public void processInvoice(int id) {
            System.out.println("[PROXY] entering outer transaction (REQUIRED)");
            target.inTransaction = true;
            target.processInvoice(id);
            target.inTransaction = false;
            System.out.println("[PROXY] outer transaction committed");
        }

        @Override
        public void sendNotification(int id) {
            // Called via proxy reference — a NEW transaction would be started here
            System.out.println("[PROXY] suspending outer tx, starting REQUIRES_NEW transaction");
            target.inTransaction = false;   // simulate suspended outer
            target.sendNotification(id);
            target.inTransaction = true;    // resume outer
            System.out.println("[PROXY] REQUIRES_NEW committed, outer tx resumed");
        }
    }

    // ─── 3. TRANSACTION PROPAGATION SIMULATION ──────────────────────────────

    static class TransactionSimulator {
        private String currentTx = null;

        /**
         * REQUIRED: join existing or create new.
         */
        void required(String txName, Runnable work) {
            boolean isNew = (currentTx == null);
            if (isNew) {
                currentTx = txName;
                System.out.println("  [REQUIRED] started new transaction: " + currentTx);
            } else {
                System.out.println("  [REQUIRED] joined existing transaction: " + currentTx);
            }
            work.run();
            if (isNew) {
                System.out.println("  [REQUIRED] committed transaction: " + currentTx);
                currentTx = null;
            }
        }

        /**
         * REQUIRES_NEW: suspend outer, start fresh, resume outer.
         */
        void requiresNew(String txName, Runnable work) {
            String suspended = currentTx;
            if (suspended != null) {
                System.out.println("  [REQUIRES_NEW] suspending '" + suspended + "'");
            }
            currentTx = txName;
            System.out.println("  [REQUIRES_NEW] started new transaction: " + currentTx);
            work.run();
            System.out.println("  [REQUIRES_NEW] committed independent transaction: " + currentTx);
            currentTx = suspended;
            if (suspended != null) {
                System.out.println("  [REQUIRES_NEW] resumed '" + suspended + "'");
            }
        }
    }

    // ─── 4. BEAN LIFECYCLE PHASES ────────────────────────────────────────────

    static class ReportingBean {
        private String dataSource;

        // Simulates @Autowired constructor injection
        ReportingBean(String dataSource) {
            this.dataSource = dataSource;
            System.out.println("[Lifecycle] 1. Constructor called — dataSource injected");
        }

        // Simulates @PostConstruct
        void postConstruct() {
            System.out.println("[Lifecycle] 2. @PostConstruct — validating dataSource: " + dataSource);
            if (dataSource == null || dataSource.isBlank()) {
                throw new IllegalStateException("dataSource must be configured");
            }
        }

        String generateReport() {
            System.out.println("[Lifecycle] 3. Bean in use — generating report from: " + dataSource);
            return "REPORT[" + dataSource + "]";
        }

        // Simulates @PreDestroy
        void preDestroy() {
            System.out.println("[Lifecycle] 4. @PreDestroy — releasing resources for: " + dataSource);
            dataSource = null;
        }
    }

    // ─── MAIN ────────────────────────────────────────────────────────────────

    public static void main(String[] args) {
        System.out.println("═══ 1. CONSTRUCTOR DI ═══");
        PaymentGateway gateway = new StripeGateway();
        OrderService orderService = new OrderService(gateway);   // no Spring needed for unit tests
        System.out.println(orderService.placeOrder(99.99));

        System.out.println("\n═══ 2. AOP SELF-INVOCATION PITFALL ═══");
        InvoiceServiceImpl rawImpl = new InvoiceServiceImpl();
        InvoiceService proxy = new InvoiceServiceProxy(rawImpl);

        System.out.println("-- Called through proxy (correct behavior) --");
        proxy.processInvoice(42);   // outer via proxy → self-call bypasses proxy for sendNotification

        System.out.println("\n-- Called through proxy reference for sendNotification (what you SHOULD do) --");
        proxy.sendNotification(42);  // new transaction starts correctly

        System.out.println("\n═══ 3. TRANSACTION PROPAGATION ═══");
        TransactionSimulator tx = new TransactionSimulator();

        System.out.println("Scenario A: outer REQUIRED → inner REQUIRED (joins)");
        tx.required("TX-outer", () ->
            tx.required("TX-inner", () ->
                System.out.println("  [work] running inside shared transaction")
            )
        );

        System.out.println("\nScenario B: outer REQUIRED → inner REQUIRES_NEW (independent)");
        tx.required("TX-outer", () ->
            tx.requiresNew("TX-audit", () ->
                System.out.println("  [audit] writing audit log in independent transaction")
            )
        );

        System.out.println("\n═══ 4. BEAN LIFECYCLE ═══");
        ReportingBean bean = new ReportingBean("jdbc:postgresql://localhost/mydb");
        bean.postConstruct();
        System.out.println(bean.generateReport());
        bean.preDestroy();
    }
}
```

## Interview questions you should be able to answer

- **Q:** Why is constructor injection preferred over field injection in Spring?
  > Constructor injection makes dependencies explicit (visible in the constructor signature), allows fields to be `final` (ensuring immutability and thread safety), and enables the class to be instantiated and unit-tested without a Spring context. Field injection hides dependencies, prevents `final`, and requires reflection or a Spring container to inject, making isolated unit tests painful. Additionally, missing required dependencies fail fast at application startup with constructor injection rather than at runtime.

- **Q:** You annotate a private method with `@Transactional`. The method is called from a public method in the same class. Why is no transaction started?
  > Spring's `@Transactional` works through a proxy — either a JDK dynamic proxy or a CGLIB subclass. The proxy intercepts calls to *public* methods made through the bean reference. When a method calls `this.privateMethod()`, it bypasses the proxy entirely and invokes the concrete implementation directly. No proxy interception occurs, so no transaction is started. The fix is to either make the method public and move the call through a separate Spring-managed bean reference, or to use AspectJ compile-time or load-time weaving which is not proxy-based.

- **Q:** What is the difference between `REQUIRES_NEW` and `REQUIRED` transaction propagation?
  > `REQUIRED` (the default) joins the current transaction if one exists; if not, it starts a new one. Both the outer and inner operations commit or roll back together. `REQUIRES_NEW` always starts a brand-new, independent transaction, suspending the outer transaction if one is active. The inner transaction commits or rolls back independently — a rollback in the inner does not affect the outer and vice versa. Use `REQUIRES_NEW` for operations like audit logging that must persist even if the main business transaction rolls back.

- **Q:** How does Spring Boot auto-configuration work?
  > At startup, Spring Boot reads `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` (Boot 2.7+; previously `spring.factories`). This file lists `@Configuration` classes from all starters on the classpath. Spring Boot imports each one, but each class is guarded by `@Conditional` annotations — `@ConditionalOnClass` checks for a required class, `@ConditionalOnMissingBean` skips the auto-configured bean if you already defined your own, and `@ConditionalOnProperty` checks a configuration flag. This allows starters to register sensible defaults that your own beans or properties can override without touching starter code.

- **Q:** Why does `@Configuration` require CGLIB proxying, and what breaks if you use `@Component` instead?
  > A `@Configuration` class is proxied by CGLIB so that calls between `@Bean` methods return the same singleton bean rather than a new object each time. For example, if `entityManagerFactory()` calls `dataSource()` and `transactionManager()` also calls `dataSource()`, both get the *same* `DataSource` instance because CGLIB intercepts the call and returns the existing bean from the context. If you use `@Component` (lite mode, no CGLIB), `dataSource()` is a plain Java method call — each invocation creates a new `DataSource` instance, resulting in multiple connections, uncommitted transactions, and potential data corruption.

- **Q:** What is the difference between `READ_COMMITTED` and `REPEATABLE_READ` isolation levels, and when would you choose each?
  > `READ_COMMITTED` prevents dirty reads (you only see committed data) but allows non-repeatable reads — if you `SELECT` the same row twice in one transaction and another transaction commits a change between those reads, you see different values. `REPEATABLE_READ` additionally prevents non-repeatable reads: once a row is read in a transaction, subsequent reads of that row return the same value even if another transaction commits changes. However, `REPEATABLE_READ` still allows phantom reads (new rows inserted by other transactions appearing in range queries). Choose `READ_COMMITTED` for most OLTP workloads where performance matters and stale reads of the same row are acceptable. Choose `REPEATABLE_READ` (or `SERIALIZABLE`) when consistency within a single transaction is critical — for example, reading an account balance twice to validate and then deduct an amount.

## Further reading

- Spring Framework Reference — Core: IoC Container — https://docs.spring.io/spring-framework/docs/current/reference/html/core.html
- Spring Framework Reference — AOP — https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop
- Spring Framework Reference — Data Access / Transactions — https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html#transaction
- Spring Boot Reference — Auto-configuration — https://docs.spring.io/spring-boot/docs/current/reference/html/using.html#using.auto-configuration
- Spring Security Reference — Architecture — https://docs.spring.io/spring-security/reference/servlet/architecture.html
- Baeldung — Spring `@Transactional` Propagation and Isolation — https://www.baeldung.com/spring-transactional-propagation-isolation
- Baeldung — Spring AOP Self-invocation — https://www.baeldung.com/spring-aop-self-invocation
- Baeldung — `@Configuration` vs `@Component` — https://www.baeldung.com/spring-configuration-vs-component
