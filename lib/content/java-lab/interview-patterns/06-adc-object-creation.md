# ADC-06: Singleton & Object Creation Patterns — When to Use Which

## Why It Matters

Object creation strategy is one of the most common senior interview topics because the wrong choice causes real production bugs: thread-safety races, memory leaks, untestable code, and brittle APIs. Understanding *when* to pick each pattern — not just *how* to implement it — separates senior engineers from mid-level ones.

---

## Decision Matrix

| Pattern | Thread-Safe | Lazy | No Sync Cost | Constructor Args | Immutable | Testable |
|---|---|---|---|---|---|---|
| Enum Singleton | Yes | No | Yes | No | Yes | Limited |
| Holder (IODH) | Yes | Yes | Yes | No | — | Limited |
| DCL Singleton | Yes (w/ volatile) | Yes | Mostly | Yes | — | Limited |
| Factory Method | — | — | — | Yes | — | Yes |
| Abstract Factory | — | — | — | Yes | — | Yes |
| Builder | — | — | — | Yes | Optional | Yes |
| `record` | — | — | — | Yes | Yes | Yes |

---

## Trade-off Analysis

### 1. Enum Singleton

**Context:** You need exactly one instance of a stateless service or configuration holder.

**Trade-off:**
- Serialization is guaranteed by the JVM — you cannot accidentally create a second instance via `ObjectInputStream`.
- Reflection attacks (`setAccessible`) are blocked at the JVM level.
- Cannot accept constructor arguments, so initialization must be entirely self-contained.
- Cannot lazy-load; the instance is created when the enum class is loaded.

**Decision rule:** Default to enum singleton. Only deviate when you need lazy initialization or constructor arguments.

---

### 2. Initialization-on-Demand Holder (IODH)

**Context:** The singleton is expensive to create and may never be needed in every execution path.

**Trade-off:**
- Leverages the JVM class-loading guarantee: the inner `Holder` class is only loaded when `getInstance()` is first called.
- Zero synchronization cost after initialization — no `volatile`, no `synchronized`.
- Cannot pass arguments to the constructor without additional complexity.
- Slightly more boilerplate than enum but still clean.

**Decision rule:** Use Holder when the singleton is expensive (opens a connection, loads a large resource) and may not always be needed.

---

### 3. Double-Checked Locking (DCL)

**Context:** You need a lazily initialized singleton that requires constructor arguments decided at runtime.

**Trade-off:**
- `volatile` is non-negotiable. Without it, the JIT can reorder the three sub-steps of `new MyClass()`: (1) allocate memory, (2) invoke constructor, (3) assign reference. Another thread can see a non-null but partially constructed object.
- Has synchronization overhead on the first call only; subsequent reads are lock-free.
- More error-prone than Holder or Enum — easy to forget `volatile`.
- Should be a last resort: prefer Enum or Holder whenever possible.

**Decision rule:** Use DCL only when enum and Holder are inapplicable (i.e., constructor arguments are required at initialization time).

---

### 4. Factory Method

**Context:** Creation logic may vary, or the caller should not depend on a concrete class.

**Trade-off:**
- The factory returns an interface or abstract type, so the caller is decoupled from the implementation.
- Enables easy substitution in tests (return a mock/stub from the factory).
- Adds one indirection layer; can be overkill for simple cases.

**Decision rule:** Use Factory Method when: (a) you need to hide the concrete class from callers, (b) the creation logic is non-trivial, or (c) testability requires injection of a fake.

---

### 5. Abstract Factory

**Context:** You need to create a *family* of related objects that must be consistent with each other.

**Trade-off:**
- Enforces that related objects (e.g., `Connection`, `Statement`, `ResultSet` in JDBC) come from the same provider.
- Adding a new product type requires changing the factory interface and all implementations.
- Higher complexity; justified only when multiple coherent implementation families exist.

**Decision rule:** Use Abstract Factory when you have multiple interchangeable implementation families (JDBC drivers, UI themes, cloud provider SDKs).

---

### 6. Builder

**Context:** A class has more than three parameters, or many parameters are optional.

**Trade-off:**
- Eliminates telescoping constructors and eliminates the need to remember parameter order.
- Enables immutable objects without a constructor with ten arguments.
- Java 16+ `record` can host an inner `Builder` to combine immutability with ergonomic construction.
- Adds boilerplate (mitigated by Lombok's `@Builder` or IDE generation).

**Decision rule:** Use Builder when you have more than three constructor parameters, or when multiple parameters are optional.

---

### 7. `record`

**Context:** You need an immutable value object (DTO, configuration struct, coordinate, money).

**Trade-off:**
- Auto-generates `equals`, `hashCode`, `toString`, and accessors.
- Canonical constructor validation is clean and explicit.
- Cannot extend another class (records implicitly extend `java.lang.Record`).
- Cannot be mutable; all components are final.
- Works excellently as the target class inside a Builder pattern.

**Decision rule:** Use `record` for immutable value objects. Combine with an inner Builder when construction is complex.

---

## Decision Rules — Quick Reference

```
If singleton             → Enum first.
If lazy expensive singleton → Initialization-on-Demand Holder.
If singleton needs constructor args → DCL + volatile (last resort).
If >3 params or optional fields     → Builder.
If immutable value object           → record.
If caller must not depend on impl   → Factory Method.
If family of related objects        → Abstract Factory.
```

---

## Code Example

```java
import java.util.Objects;

public class JavaLabRunner {

    // ─────────────────────────────────────────────────────────────────────────
    // PATTERN 1: Enum Singleton
    // Thread-safe, serialization-safe, reflection-safe — the default choice.
    // ─────────────────────────────────────────────────────────────────────────
    enum AppConfig {
        INSTANCE;

        private final String environment = System.getProperty("env", "development");

        public String getEnvironment() { return environment; }

        @Override
        public String toString() { return "AppConfig[env=" + environment + "]"; }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATTERN 2: Initialization-on-Demand Holder (IODH)
    // Lazy, no synchronization cost, no volatile — use for expensive singletons.
    // ─────────────────────────────────────────────────────────────────────────
    static class ExpensiveService {
        private ExpensiveService() {
            // Simulate expensive initialization (DB pool, heavy resource, etc.)
            System.out.println("  [ExpensiveService] Initialized (expensive operation)");
        }

        public String query() { return "result-from-expensive-service"; }

        // Inner Holder — loaded only when getInstance() is first called.
        private static final class Holder {
            static final ExpensiveService INSTANCE = new ExpensiveService();
        }

        public static ExpensiveService getInstance() {
            return Holder.INSTANCE;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATTERN 3: Double-Checked Locking (DCL)
    // Use ONLY when constructor args are required. volatile is non-negotiable.
    // ─────────────────────────────────────────────────────────────────────────
    static class ConfigurableCache {
        // volatile prevents JIT from reordering: allocate → construct → assign.
        // Without volatile, another thread may see a non-null but partially
        // constructed object after the reference is assigned but before the
        // constructor body finishes.
        private static volatile ConfigurableCache instance;

        private final int maxSize;

        private ConfigurableCache(int maxSize) {
            this.maxSize = maxSize;
            System.out.println("  [ConfigurableCache] Created with maxSize=" + maxSize);
        }

        public static ConfigurableCache getInstance(int maxSize) {
            if (instance == null) {                   // first check (no lock)
                synchronized (ConfigurableCache.class) {
                    if (instance == null) {           // second check (with lock)
                        instance = new ConfigurableCache(maxSize);
                    }
                }
            }
            return instance;
        }

        public int getMaxSize() { return maxSize; }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATTERN 4a: record — immutable value object
    // Auto-generates equals / hashCode / toString; no inheritance allowed.
    // ─────────────────────────────────────────────────────────────────────────
    record DatabaseConfig(
            String host,
            int port,
            String database,
            int poolSize,
            boolean sslEnabled
    ) {
        // Compact canonical constructor — validation without boilerplate.
        DatabaseConfig {
            Objects.requireNonNull(host, "host must not be null");
            if (port < 1 || port > 65535) throw new IllegalArgumentException("Invalid port: " + port);
            if (poolSize < 1)             throw new IllegalArgumentException("poolSize must be >= 1");
        }

        // ─────────────────────────────────────────────────────────────────
        // PATTERN 4b: Builder — avoids telescoping constructors for complex objects
        // Pairs naturally with record: Builder assembles, record holds immutably.
        // ─────────────────────────────────────────────────────────────────
        static Builder builder() { return new Builder(); }

        static final class Builder {
            private String  host       = "localhost";
            private int     port       = 5432;
            private String  database   = "mydb";
            private int     poolSize   = 10;
            private boolean sslEnabled = false;

            public Builder host(String host)             { this.host = host;             return this; }
            public Builder port(int port)                { this.port = port;             return this; }
            public Builder database(String database)     { this.database = database;     return this; }
            public Builder poolSize(int poolSize)        { this.poolSize = poolSize;     return this; }
            public Builder sslEnabled(boolean ssl)       { this.sslEnabled = ssl;        return this; }

            public DatabaseConfig build() {
                return new DatabaseConfig(host, port, database, poolSize, sslEnabled);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEMO
    // ─────────────────────────────────────────────────────────────────────────
    public static void main(String[] args) {
        System.out.println("=== Pattern 1: Enum Singleton ===");
        AppConfig cfg1 = AppConfig.INSTANCE;
        AppConfig cfg2 = AppConfig.INSTANCE;
        System.out.println("  Same instance? " + (cfg1 == cfg2));   // true
        System.out.println("  " + cfg1);

        System.out.println("\n=== Pattern 2: Initialization-on-Demand Holder ===");
        System.out.println("  (Service not yet loaded)");
        ExpensiveService svc = ExpensiveService.getInstance();       // loaded here
        System.out.println("  Query: " + svc.query());
        System.out.println("  Same instance? " + (svc == ExpensiveService.getInstance()));

        System.out.println("\n=== Pattern 3: Double-Checked Locking (DCL) ===");
        ConfigurableCache cache1 = ConfigurableCache.getInstance(256);
        ConfigurableCache cache2 = ConfigurableCache.getInstance(512); // ignored; already created
        System.out.println("  Same instance? " + (cache1 == cache2));
        System.out.println("  maxSize = " + cache1.getMaxSize());     // 256

        System.out.println("\n=== Pattern 4: record + Builder ===");
        DatabaseConfig dbCfg = DatabaseConfig.builder()
                .host("db.prod.example.com")
                .port(5432)
                .database("algo_coach")
                .poolSize(20)
                .sslEnabled(true)
                .build();

        System.out.println("  " + dbCfg);                              // auto-generated toString
        System.out.println("  host=" + dbCfg.host() + ", ssl=" + dbCfg.sslEnabled());

        // record equality is structural (all components), not reference
        DatabaseConfig dbCfgCopy = DatabaseConfig.builder()
                .host("db.prod.example.com")
                .port(5432)
                .database("algo_coach")
                .poolSize(20)
                .sslEnabled(true)
                .build();
        System.out.println("  Structural equality: " + dbCfg.equals(dbCfgCopy)); // true
        System.out.println("  Same reference?      " + (dbCfg == dbCfgCopy));     // false

        System.out.println("\nDone.");
    }
}
```

**Expected output:**
```
=== Pattern 1: Enum Singleton ===
  Same instance? true
  AppConfig[env=development]

=== Pattern 2: Initialization-on-Demand Holder ===
  (Service not yet loaded)
  [ExpensiveService] Initialized (expensive operation)
  Query: result-from-expensive-service
  Same instance? true

=== Pattern 3: Double-Checked Locking (DCL) ===
  [ConfigurableCache] Created with maxSize=256
  Same instance? true
  maxSize = 256

=== Pattern 4: record + Builder ===
  DatabaseConfig[host=db.prod.example.com, port=5432, database=algo_coach, poolSize=20, sslEnabled=true]
  host=db.prod.example.com, ssl=true
  Structural equality: true
  Same reference?      false

Done.
```

---

## Interview Q&As

**Q1: Why does DCL need `volatile`?**

Without `volatile`, the JIT compiler (and the CPU's memory model) can reorder the three micro-operations that make up `new MyClass()`:

1. Allocate memory and get a reference
2. Invoke the constructor (write fields)
3. Assign the reference to the variable

The JIT may reorder steps 2 and 3 because, from a single-thread perspective, the order does not matter. However, in a multi-threaded context, a second thread performing the first `null` check can observe the variable as non-null (step 3 completed) while the object's fields are still in an uninitialized state (step 2 not yet complete). `volatile` inserts a memory barrier that prevents this reordering and guarantees that all writes to the object's fields are visible before the reference is published.

---

**Q2: Why is an enum singleton better than a `static final` field?**

A `static final` field singleton (`private static final MyClass INSTANCE = new MyClass()`) fails in two scenarios:

1. **Serialization:** When a serializable class is deserialized via `ObjectInputStream`, Java invokes `readObject` and creates a *new* object — breaking the singleton guarantee. You must manually implement `readResolve()` to return `INSTANCE`. With an enum, the JVM guarantees at the spec level that deserialization always returns the existing enum constant; no `readResolve` is needed.

2. **Reflection attacks:** `Constructor.setAccessible(true)` can invoke a private constructor on a regular class, creating a second instance. The JVM explicitly prohibits this for enum types — attempting it throws `IllegalArgumentException`.

Enum singletons get both guarantees for free, with less code and no risk of forgetting the workarounds.

---

**Q3: When would you use Factory Method over direct instantiation?**

Use Factory Method when one or more of the following are true:

- **The concrete class should be hidden from the caller.** The factory returns an interface (`List`, `Connection`, `PaymentGateway`), so callers depend only on the abstraction. Swapping implementations (e.g., from `ArrayList` to `LinkedList`, or from Stripe to PayPal) requires no change at call sites.
- **Creation logic is conditional or non-trivial.** If the right implementation depends on runtime state (environment variables, feature flags, input data), centralizing that logic in a factory keeps call sites clean.
- **Testability is required.** In tests, the factory can be replaced or overridden to return mocks or stubs without the caller knowing. Direct `new ConcreteClass()` calls make this impossible without bytecode manipulation.

---

**Q4: What does `record` give you, and what are its limitations?**

**What you get:**
- Auto-generated `equals()` and `hashCode()` based on all components (structural equality by default).
- Auto-generated `toString()` that includes all component names and values.
- Auto-generated public accessor methods (`host()`, `port()`, etc.) — no `get` prefix.
- Compact canonical constructor syntax for adding validation.
- Immutability: all components are implicitly `private final`.
- Concise syntax that communicates intent ("this is a value object") clearly to readers.

**Limitations:**
- **No inheritance.** A record implicitly extends `java.lang.Record` and cannot extend any other class. It can implement interfaces.
- **No mutability.** All fields are final; there are no setters. If you need a modified copy, you must construct a new instance.
- **All fields are exposed.** The canonical constructor and all accessors are public by default. You cannot have hidden internal state as a component.
- **No lazy initialization of components.** Since components are final and set in the constructor, you cannot defer field computation the way you can in a regular class.

For most DTO, configuration, and value-object use cases in senior Java interviews, `record` is the correct choice and demonstrates awareness of modern Java idioms.
