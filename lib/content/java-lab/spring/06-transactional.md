# @Transactional Internals

## Why this matters in interviews

`@Transactional` is one of the most misunderstood Spring annotations. Developers use it everywhere without knowing how it actually works — proxy-based AOP — which causes silent failures. The self-invocation bug, wrong propagation, checked exception rollback, and testing pitfalls are all popular senior interview topics because they have burned real teams in production.

## Concept

### How @Transactional works

Spring wraps your bean in a **CGLIB proxy** (or JDK dynamic proxy for interfaces). The proxy intercepts the method call, starts a transaction, delegates to your method, then commits or rolls back.

```
Client code
  │
  ▼
OrderService$$SpringCGLIB (proxy)
  │  ← proxy intercepts call, begins TX
  ▼
OrderService.placeOrder()   ← your actual code
  │
  ▼
proxy commits or rolls back
```

### Propagation types

| Propagation | Behaviour |
|-------------|-----------|
| `REQUIRED` (default) | Join existing TX; create new one if none exists |
| `REQUIRES_NEW` | Always create a new TX; suspend the current one |
| `NESTED` | Execute within a nested TX (savepoint); only for JDBC |
| `SUPPORTS` | Join existing TX; run non-transactionally if none exists |
| `NOT_SUPPORTED` | Suspend current TX; run non-transactionally |
| `MANDATORY` | Must run within an existing TX; throws if none |
| `NEVER` | Must NOT run in a TX; throws if one exists |

### Isolation levels

| Level | Prevents |
|-------|---------|
| `READ_UNCOMMITTED` | Nothing — sees dirty reads |
| `READ_COMMITTED` (typical default) | Dirty reads |
| `REPEATABLE_READ` | Dirty reads + non-repeatable reads |
| `SERIALIZABLE` | All anomalies — slowest |

### Rollback rules

By default, Spring **only rolls back on `RuntimeException` (unchecked).** Checked exceptions do **not** trigger rollback unless explicitly declared.

```java
@Transactional(rollbackFor = Exception.class)         // rollback on any exception
@Transactional(noRollbackFor = ValidationException.class) // don't rollback this one
```

### The self-invocation trap

`@Transactional` only works through the Spring proxy. A method calling another method on **the same object** bypasses the proxy entirely.

```java
@Service
public class OrderService {
    @Transactional
    public void placeOrder(Order o) {
        // ... saves order ...
        sendConfirmation(o); // DANGER: calls this.sendConfirmation, not the proxy!
    }

    @Transactional(propagation = REQUIRES_NEW) // IGNORED — not called through proxy
    public void sendConfirmation(Order o) {
        // runs in the SAME transaction as placeOrder, not a new one
    }
}
```

**Fix**: inject the service into itself via `@Autowired`, use `AopContext.currentProxy()`, or extract `sendConfirmation` to a separate Spring bean.

## Key rules / gotchas

- **Self-invocation bypasses the proxy** — this is the most common `@Transactional` bug in production.
- **Checked exceptions do not roll back by default.** Always use `@Transactional(rollbackFor = Exception.class)` or only throw `RuntimeException` subclasses.
- **`@Transactional` on `private` methods is silently ignored** — CGLIB cannot override private methods.
- **`REQUIRES_NEW` suspends the outer transaction**, commits independently, and cannot be rolled back if the outer TX fails — useful for audit logs that must persist even on failure.
- **Avoid `@Transactional` on controller methods** — transactions belong in the service layer. A long transaction held during HTTP request processing degrades database performance.
- **`readOnly = true` disables dirty checking** and can improve performance significantly for read-heavy queries. Hibernate skips building entity snapshots.
- **Testing**: `@Transactional` on a `@Test` method auto-rolls back after the test — great for test isolation, but means you're testing within a transaction, which can hide lazy loading bugs.

## Code example

```java
import java.util.*;

// Simulates @Transactional behaviour and common pitfalls without Spring.
public class JavaLabRunner {
    static class TransactionException extends RuntimeException {
        TransactionException(String msg) { super(msg); }
    }
    static class CheckedException extends Exception {
        CheckedException(String msg) { super(msg); }
    }

    static class TransactionManager {
        private final List<String> log = new ArrayList<>();
        private boolean active = false;

        void begin() { active = true; log.clear(); System.out.println("[TX] BEGIN"); }
        void commit() { active = false; System.out.println("[TX] COMMIT — ops: " + log); }
        void rollback() { active = false; log.clear(); System.out.println("[TX] ROLLBACK"); }
        void execute(String op) {
            if (!active) throw new IllegalStateException("No active transaction!");
            log.add(op); System.out.println("[TX] " + op);
        }
    }

    static TransactionManager tx = new TransactionManager();

    // REQUIRED (default): joins existing or creates new
    static void placeOrder(String item) {
        tx.execute("INSERT orders SET item=" + item);
        tx.execute("UPDATE inventory SET stock=stock-1 WHERE item=" + item);
    }

    // REQUIRES_NEW: always its own transaction
    static void auditLog(String event) {
        System.out.println("[REQUIRES_NEW TX] BEGIN audit");
        tx.execute("INSERT audit_log SET event=" + event);
        System.out.println("[REQUIRES_NEW TX] COMMIT audit");
        // committed independently — survives outer rollback
    }

    // Checked exception — does NOT rollback by default
    static void riskyOperation() throws CheckedException {
        tx.execute("UPDATE accounts SET balance=balance-100");
        throw new CheckedException("Validation failed");
        // in real Spring: no rollback! data is committed unless rollbackFor=Exception.class
    }

    // Self-invocation pitfall
    static class PaymentService {
        void processPayment(String item) {
            System.out.println("[Service] processPayment — proxy would start TX here");
            validate(item); // calls this.validate — bypasses @Transactional on validate!
        }
        void validate(String item) {
            System.out.println("[Service] validate — @Transactional(REQUIRES_NEW) ignored!");
        }
    }

    public static void main(String[] args) throws Exception {
        // ── Success path ───────────────────────────────────────
        System.out.println("=== Successful order ===");
        tx.begin();
        try {
            placeOrder("Laptop");
            tx.commit();
        } catch (Exception e) { tx.rollback(); }

        // ── RuntimeException → rollback ────────────────────────
        System.out.println("\n=== RuntimeException → rollback ===");
        tx.begin();
        try {
            placeOrder("Phone");
            throw new TransactionException("Payment declined");
        } catch (TransactionException e) {
            System.out.println("Caught: " + e.getMessage());
            tx.rollback();
        }

        // ── CheckedException — no rollback by default ──────────
        System.out.println("\n=== CheckedException (no rollback by default!) ===");
        tx.begin();
        try {
            riskyOperation();
            tx.commit();
        } catch (CheckedException e) {
            System.out.println("Checked exception — in Spring, this commits unless rollbackFor=Exception.class!");
            tx.commit(); // demonstrates default Spring behaviour
        }

        // ── Self-invocation pitfall ────────────────────────────
        System.out.println("\n=== Self-invocation pitfall ===");
        new PaymentService().processPayment("Tablet");
    }
}
```

## Interview questions you should be able to answer

- **Q:** Why does `@Transactional` not work on `private` methods?
  > Spring creates a CGLIB subclass proxy that overrides your bean's methods to add transaction logic. Since `private` methods cannot be overridden in Java, the proxy cannot intercept them — the annotation is silently ignored.

- **Q:** What is the self-invocation problem with `@Transactional`?
  > When a method calls another method on the same object (`this.method()`), it bypasses the Spring proxy. The called method's `@Transactional` annotation is never intercepted. Fix: inject the bean itself (Spring detects the cycle), use `AopContext.currentProxy()`, or move the method to a separate Spring-managed bean.

- **Q:** Why doesn't `@Transactional` roll back on a checked exception by default?
  > Spring follows the EJB convention: checked exceptions signal recoverable conditions that the caller is expected to handle, so they don't trigger rollback. Only `RuntimeException` (and `Error`) trigger rollback by default. Add `@Transactional(rollbackFor = Exception.class)` to include checked exceptions.

- **Q:** What is `REQUIRES_NEW` and when do you use it?
  > `REQUIRES_NEW` suspends the current transaction and starts a completely independent one. It commits or rolls back on its own. Use it for audit logs, notification events, or any side effect that must persist even if the outer transaction rolls back.

- **Q:** How does `@Transactional` on a `@Test` method affect the database?
  > Spring rolls back the transaction after the test completes. This provides test isolation without needing to manually clean up data. The downside: you're always testing within a transaction, which can hide issues that only appear when the transaction commits (e.g., constraint violations, lazy loading problems).

## Further reading

- [Spring Transaction Management — official docs](https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html#transaction)
- [Baeldung: @Transactional explained](https://www.baeldung.com/transaction-configuration-with-jpa-and-spring)
- [Vlad Mihalcea: Spring @Transactional pitfalls](https://vladmihalcea.com/spring-transactional-annotation/)
