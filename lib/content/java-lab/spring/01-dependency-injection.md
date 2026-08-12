# Dependency Injection Deep Dive

## Why this matters in interviews

DI is the foundation of every Spring application. Senior interviews always probe whether you understand *why* DI exists (inversion of control, testability, loose coupling), the difference between injection styles, and common pitfalls like circular dependencies and field injection. Knowing the trade-offs between constructor, setter, and field injection separates engineers who use Spring from those who understand it.

## Concept

**Dependency Injection** means that an object's dependencies are provided externally rather than created internally. Spring's IoC container manages this automatically.

### Three injection styles

**Constructor injection** (recommended)

```java
@Service
public class OrderService {
    private final NotificationService notifier; // final = immutable after construction

    @Autowired // optional since Spring 4.3 if single constructor
    public OrderService(NotificationService notifier) {
        this.notifier = notifier;
    }
}
```

**Setter injection** (optional dependencies)

```java
@Service
public class ReportService {
    private EmailService emailService;

    @Autowired(required = false)
    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }
}
```

**Field injection** (avoid in production)

```java
@Service
public class UserService {
    @Autowired // hidden dependency, not testable without Spring context
    private UserRepository repository;
}
```

### Why constructor injection wins

| | Constructor | Setter | Field |
|--|--|--|--|
| Immutability | ✅ `final` fields | ❌ | ❌ |
| Testability | ✅ plain `new` | ✅ | ❌ requires reflection |
| Fail-fast | ✅ at startup | ❌ at use time | ❌ at use time |
| Circular dep detection | ✅ immediate error | ❌ silent | ❌ silent |
| Required vs optional | ✅ explicit | ✅ `required=false` | ❌ less clear |

### `@Qualifier` — resolving ambiguity

When multiple beans of the same type exist:

```java
@Autowired
@Qualifier("emailNotifier")
private NotificationService notifier;
```

Or use `@Primary` on the preferred implementation.

### Circular dependency

Constructor injection makes circular deps fail at startup with `BeanCurrentlyInCreationException` — which is the correct behaviour (a circular dep is usually a design smell). Fix: extract a third bean, or use `@Lazy` on one injection point.

## Key rules / gotchas

- **Field injection breaks unit testing.** You can't instantiate the class without a Spring context or reflection hacks.
- **Constructor injection enforces required dependencies.** If a dependency is missing, the application won't start — fail fast beats fail late.
- **`@Autowired` on constructor is optional** since Spring 4.3 when there is exactly one constructor — Spring injects it automatically.
- **`@Qualifier` is case-sensitive** and matches the bean name (default: class name with lowercase first letter).
- **Circular deps with constructor injection** cause immediate startup failure. With field/setter injection, Spring resolves them silently using partially constructed proxies — dangerous.
- **Prototype-scoped beans injected into singletons** only get created once. Use `ApplicationContext.getBean()` or `@Lookup` to get a new instance per call.

## Code example

```java
// Note: This lesson is conceptual — Spring beans require a Spring context.
// The code below illustrates the DI pattern without a framework.

public class JavaLabRunner {
    interface NotificationService { void send(String msg); }

    static class EmailService implements NotificationService {
        public void send(String msg) { System.out.println("Email: " + msg); }
    }

    static class SmsService implements NotificationService {
        public void send(String msg) { System.out.println("SMS: " + msg); }
    }

    // Constructor injection (Spring @Autowired preferred style)
    static class OrderService {
        private final NotificationService notifier;

        OrderService(NotificationService notifier) {
            this.notifier = notifier;
        }

        void placeOrder(String item) {
            System.out.println("Placing order: " + item);
            notifier.send("Order placed: " + item);
        }
    }

    // @Qualifier simulation: inject different implementations
    static class OrderServiceFactory {
        static OrderService withEmail() { return new OrderService(new EmailService()); }
        static OrderService withSms()   { return new OrderService(new SmsService()); }
    }

    public static void main(String[] args) {
        // Spring would do this automatically via @Autowired
        OrderService emailOrder = OrderServiceFactory.withEmail();
        OrderService smsOrder   = OrderServiceFactory.withSms();

        emailOrder.placeOrder("Laptop");
        smsOrder.placeOrder("Phone");

        // Demonstrates why field injection breaks tests:
        // With constructor injection you can test without Spring:
        OrderService testService = new OrderService(msg -> System.out.println("Test stub: " + msg));
        testService.placeOrder("TestItem");
    }
}
```

## Interview questions you should be able to answer

- **Q:** Why is constructor injection preferred over field injection?
  > Constructor injection makes dependencies explicit, enables `final` fields for immutability, allows plain `new` in tests without a Spring context, and causes missing dependencies to fail at startup rather than at runtime.

- **Q:** How does Spring resolve a circular dependency with constructor injection?
  > It doesn't — it throws `BeanCurrentlyInCreationException` at startup. This is intentional: a circular dependency usually indicates a design flaw. With field/setter injection, Spring resolves it using partially-initialised proxies, which can cause subtle bugs.

- **Q:** What is the difference between `@Autowired` and `@Inject`?
  > `@Inject` is the JSR-330 standard annotation; `@Autowired` is Spring-specific. Both work the same way. `@Autowired` has a `required` attribute (default `true`); `@Inject` does not — you use `@Nullable` or `Optional` instead. Prefer `@Autowired` in Spring-only projects.

- **Q:** When would you use `@Qualifier` over `@Primary`?
  > Use `@Primary` when there is a clear default implementation that most consumers should receive. Use `@Qualifier` when different consumers need different implementations — `@Primary` is too coarse when you need per-injection-point control.

- **Q:** How do you inject a prototype-scoped bean into a singleton?
  > Inject `ApplicationContext` and call `ctx.getBean(MyPrototype.class)` each time, or annotate a method with `@Lookup` (Spring replaces the method body at runtime with a bean lookup). Simply `@Autowiring` the prototype into a singleton gives you only one instance — the singleton's.

## Further reading

- [Spring DI documentation](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-dependencies)
- [Baeldung: Spring Dependency Injection](https://www.baeldung.com/spring-dependency-injection)
- [Constructor vs Field Injection — Olivér Getz](https://odrotbohm.de/2013/11/why-field-injection-is-evil/)
