# Core Java & OOP Terminology — Interview Reference

## Why this matters in interviews

Senior interviewers use precise OOP and core Java vocabulary to separate engineers who can write working code from those who understand *why* the language behaves the way it does. Misusing terms like "overriding" vs "overloading," or conflating "abstraction" with "encapsulation," signals surface-level knowledge that does not hold up under follow-up questioning. Mastery of these definitions — including edge cases like type erasure, the PECS rule, and Liskov Substitution violations — demonstrates the depth expected of engineers designing production systems and reviewing others' code.

---

## Concept

### OOP Fundamentals

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Encapsulation** | Bundling data and the methods that operate on it within a class, exposing only a controlled public interface via access modifiers | "We violated encapsulation by making the `balance` field public instead of exposing it through a validated `deposit()` method." |
| **Abstraction** | Hiding implementation details behind a well-defined contract (interface or abstract class), so callers depend on *what* something does, not *how* | "The `List` interface provides abstraction — callers don't know whether the backing store is an array or a linked list." |
| **Inheritance** | A subclass acquiring the fields and methods of a superclass via `extends`, enabling code reuse and an is-a relationship | "Using inheritance to make `Stack` extend `Vector` was a design mistake because it exposed irrelevant `Vector` methods and broke the is-a contract." |
| **Polymorphism** | The ability of a single reference type to behave differently depending on the runtime type of the object it points to | "Polymorphism lets us call `animal.speak()` on a `List<Animal>` and have each subclass execute its own override at runtime." |
| **Method overloading** | Multiple methods in the same class with the same name but different parameter lists; resolved at **compile time** (static/early binding) | "Overloading `add(int)` and `add(long)` is resolved at compile time based on the declared argument type, not the runtime value." |
| **Method overriding** | A subclass providing its own implementation of a method declared in a superclass or interface; resolved at **runtime** (dynamic/late binding) | "Overriding `toString()` in a subclass is resolved at runtime via the vtable, so even a superclass reference calls the subclass version." |
| **Covariant return type** | An overriding method is allowed to declare a return type that is a subtype of the return type declared in the superclass method | "Since Java 5, `clone()` can be overridden with a covariant return type — `Animal.clone()` returns `Animal` while `Dog.clone()` returns `Dog`." |
| **Dynamic dispatch** | The JVM resolves which overriding method to invoke at runtime based on the actual type of the object, not the declared type of the reference | "Dynamic dispatch means that `Shape s = new Circle(); s.area()` always calls `Circle.area()` even though `s` is declared as `Shape`." |
| **Virtual method table (vtable)** | A per-class table maintained by the JVM that maps each virtual method to the address of the most-derived override; looked up on every virtual call | "Each object carries a pointer to its class's vtable, which is why dynamic dispatch adds one indirection compared to a static call." |
| **`super` keyword** | Used in a subclass to explicitly invoke the superclass's constructor (`super(...)`) or an overridden method (`super.method()`) | "Calling `super.equals(obj)` inside an overridden `equals()` delegates to the parent implementation before adding subclass-specific checks." |

---

### Interface vs Abstract Class

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Interface** | A pure contract type (`interface`) whose members are implicitly `public abstract`; since Java 8 it may also contain `default` and `static` methods; since Java 9 it may contain `private` methods | "Adding a `default` method to an interface lets you evolve the API without breaking existing implementors." |
| **Abstract class** | A class declared `abstract` that may contain both abstract methods (no body) and concrete methods with full implementations; can hold state and constructors | "Use an abstract class instead of an interface when you need to share mutable state or a partial implementation across subclasses." |
| **Default method (Java 8+)** | A method in an interface with the `default` keyword providing a concrete implementation, allowing interface evolution without breaking existing implementors | "The `default` method `List.sort()` was added in Java 8 so existing `List` implementations did not need to be changed." |
| **Static interface method (Java 8+)** | A `static` method inside an interface that belongs to the interface type itself, not to instances, and is not inherited by implementing classes | "`Comparator.naturalOrder()` is a static interface method — you call it as `Comparator.naturalOrder()`, not via an instance." |
| **Private interface method (Java 9+)** | A `private` (optionally `static`) method inside an interface used to share helper logic between `default` methods without exposing it to implementors | "We extracted the validation logic into a `private` interface method so both `default` methods could reuse it without polluting the public API." |
| **Marker interface** | An interface with no methods, used purely to tag a class so that runtime code (or the JVM itself) can identify it via `instanceof` | "`Serializable` is a marker interface — it carries no methods but tells `ObjectOutputStream` that the class may be serialized." |
| **Annotation vs marker interface** | Annotations are metadata that can carry attributes and be processed at compile time or runtime via reflection; marker interfaces are checked via `instanceof` and enforce the type system | "Prefer an annotation over a marker interface when you need to attach parameters or process the marker at compile time via an annotation processor." |
| **Functional interface** | An interface with exactly one abstract method (SAM); can be decorated with `@FunctionalInterface` to enforce the constraint at compile time; the target type for lambda expressions | "`Runnable` is a functional interface — its single abstract method `run()` is the lambda body when you write `() -> System.out.println('hi')`." |
| **Diamond problem** | The ambiguity that arises when a class inherits the same method signature from two paths in the hierarchy; Java resolves it for `default` methods by requiring the implementing class to explicitly override and choose | "When `C implements A, B` and both `A` and `B` provide a `default greet()`, Java forces `C` to override `greet()` and call `A.super.greet()` or `B.super.greet()` explicitly." |

---

### SOLID Principles

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Single Responsibility (SRP)** | A class should have only one reason to change — one cohesive responsibility | "Violation: a `UserService` that both persists user data to the DB and sends welcome emails — changing the email template forces a recompile of persistence logic." |
| **Open/Closed (OCP)** | Software entities should be open for extension but closed for modification | "Violation: adding a new payment type by editing a `switch` statement inside `PaymentProcessor` instead of adding a new `PaymentStrategy` implementation." |
| **Liskov Substitution (LSP)** | Subtypes must be substitutable for their base type without altering the correctness of the program | "Violation: `Square extends Rectangle` where `setWidth()` also changes height — code that sets width and height independently will produce wrong area calculations when handed a `Square`." |
| **Interface Segregation (ISP)** | Clients should not be forced to depend on methods they do not use; prefer many narrow interfaces over one fat interface | "Violation: forcing a read-only `ReportViewer` to implement a `save()` method because it implements the same bloated `Document` interface as the editor." |
| **Dependency Inversion (DIP)** | High-level modules should not depend on low-level modules; both should depend on abstractions (interfaces), not concretions | "Violation: `OrderService` instantiating `new MySQLOrderRepository()` directly — it is coupled to the implementation and cannot be tested with a mock." |

---

### Generics

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Type parameter** | A placeholder declared in angle brackets (e.g. `<T>`) on a class, interface, or method, representing an unknown type to be supplied by the caller | "`List<T>` has one type parameter `T`; writing `List<String>` binds `T` to `String` at the call site." |
| **Type erasure** | The compiler replaces all type parameters with their erasure (usually `Object` or the bound) and inserts casts at use sites; generic type information does not exist at runtime | "Because of type erasure, `List<String>` and `List<Integer>` are the same `List` class at runtime, which is why `instanceof List<String>` is a compile error." |
| **Raw type** | Using a generic class without a type argument (e.g. `List` instead of `List<String>`); bypasses generic type checking and produces unchecked warnings | "Assigning a `List<String>` to a raw `List` and back again compiles with only a warning but can cause a `ClassCastException` at an unexpected call site." |
| **Bounded wildcard — upper (`? extends T`)** | Accepts `T` or any subtype; the collection is read-only from the generic perspective (covariant producer) | "A method `void print(List<? extends Number> list)` accepts both `List<Integer>` and `List<Double>` but cannot safely call `list.add()`." |
| **Bounded wildcard — lower (`? super T`)** | Accepts `T` or any supertype; the collection can be written to (contravariant consumer) | "A method `void fill(List<? super Integer> list)` can add `Integer` values into a `List<Integer>`, `List<Number>`, or `List<Object>`." |
| **PECS rule** | *Producer Extends, Consumer Super* — use `? extends T` when reading from a structure and `? super T` when writing to it | "In `Collections.copy(List<? super T> dest, List<? extends T> src)`, `src` is a producer so it uses `extends`, and `dest` is a consumer so it uses `super`." |
| **Reifiable type** | A type whose full type information is available at runtime (e.g. raw types, non-generic types, unbounded wildcards, arrays of reifiable types) | "`String[]` is reifiable and can be used in `instanceof` checks; `List<String>` is not reifiable because its element type is erased." |
| **Heap pollution** | A situation where a variable of a parameterized type refers to an object that is not of that parameterized type, typically caused by mixing raw types or varargs with generics | "Passing a `List<String>` and a `List<Integer>` into a varargs method creates heap pollution — the compiler warns with `@SafeVarargs` to suppress it when safe." |

---

### Immutability & Records

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Immutable class** | A class whose instances cannot be modified after construction; achieved by: declaring the class `final`, making all fields `private final`, no setters, and performing defensive copies of mutable fields | "We make `Money` immutable by declaring it `final`, storing an unmodifiable `Currency` copy, and providing no setters — it is inherently thread-safe without synchronization." |
| **Defensive copy** | Copying a mutable object passed into or returned from a constructor or method so external code cannot mutate the internal state | "The `Date` field in an immutable class must be defensively copied in the constructor and in the getter — otherwise callers can mutate the internal date via the reference." |
| **Record (Java 16+)** | A concise class declaration using `record Name(Type field, ...)` that auto-generates a canonical constructor, `private final` fields, accessors, `equals()`, `hashCode()`, and `toString()`; implicitly `final` | "Using `record Point(int x, int y)` eliminates ~30 lines of boilerplate and guarantees structural equality — `new Point(1,2).equals(new Point(1,2))` is always `true`." |
| **Sealed class (Java 17+)** | A class or interface declared `sealed` that restricts which classes may extend or implement it, listed in a `permits` clause; enables exhaustive pattern matching | "Declaring `sealed interface Shape permits Circle, Rectangle, Triangle` lets the compiler verify that a `switch` expression over `Shape` is exhaustive without a default branch." |
| **`permits` clause** | The whitelist of allowed direct subtypes of a sealed class or interface | "Adding `Square` to the hierarchy requires explicitly adding it to the `permits` clause of the sealed supertype, making the set of subtypes intentional and auditable." |

---

### Memory & References

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Strong reference** | The default reference type; the GC will never collect an object that has at least one strong reference | "A static `Map` field holding application-wide caches keeps all values strongly reachable — a common source of memory leaks." |
| **Soft reference** | Wrapped in `java.lang.ref.SoftReference`; the GC *may* collect the referent before throwing `OutOfMemoryError`, making it suitable for memory-sensitive caches | "A soft-referenced image cache lets the JVM evict entries under memory pressure rather than crashing with OOM." |
| **Weak reference** | Wrapped in `java.lang.ref.WeakReference`; the GC collects the referent on the *next* collection cycle regardless of available memory | "`WeakReference` is used for canonicalizing maps where entries should disappear as soon as the key is no longer strongly reachable." |
| **Phantom reference** | Wrapped in `java.lang.ref.PhantomReference`; enqueued *after* the object has been finalized but *before* its memory is reclaimed; used for post-mortem cleanup | "Phantom references replaced `finalize()` in Java 9+ resource cleanup patterns — they fire reliably and don't resurrect the object." |
| **`WeakHashMap`** | A `Map` implementation where keys are held via weak references; entries are automatically removed when the key becomes weakly reachable | "`WeakHashMap` is appropriate for attaching metadata to objects whose lifecycle you don't control — the entry disappears when the key is GC'd." |

---

### Exceptions

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Checked exception** | A subclass of `Exception` (but not `RuntimeException`) that the compiler forces callers to either catch or declare in a `throws` clause | "`IOException` is checked — the compiler rejects code that calls `Files.readAllBytes()` without a try-catch or `throws IOException`." |
| **Unchecked exception** | A subclass of `RuntimeException` or `Error`; the compiler does not require callers to handle or declare it | "`NullPointerException` is unchecked — it can be thrown anywhere without declaration, which is why defensive null checks are the programmer's responsibility." |
| **`Error`** | A subclass of `Throwable` representing serious JVM or system-level problems (e.g. `OutOfMemoryError`, `StackOverflowError`) that programs are generally not expected to catch | "Catching `Error` is almost always wrong — a `StackOverflowError` usually indicates an unrecoverable recursion bug, not a transient condition." |
| **try-with-resources** | A `try` statement with a resource expression in parentheses; the resource (which must implement `AutoCloseable`) is automatically closed at the end of the block, even if an exception is thrown | "Using try-with-resources with `BufferedReader` guarantees the stream is closed without a `finally` block, and suppressed exceptions from `close()` are attached to the primary exception." |
| **Multi-catch** | A single `catch` clause handling multiple exception types separated by `|`, reducing boilerplate when the handling logic is identical | "`catch (IOException | SQLException e)` handles both checked exceptions identically without duplicating the error-logging code." |
| **Exception chaining** | Preserving the original cause when wrapping one exception in another, either via the `Throwable(String, Throwable)` constructor or `initCause()`; allows stack traces to show the full cause chain | "Wrapping a `SQLException` in a domain `RepositoryException` via `new RepositoryException('query failed', sqlEx)` lets the caller see the root cause in the stack trace." |
| **`finally` guarantee** | The `finally` block always executes after `try` (and any `catch`), even if a `return` or exception occurs — except when `System.exit()` is called or the JVM crashes | "A `finally` block that itself throws an exception silently discards the original exception from `try`, which is why resource cleanup belongs in try-with-resources rather than `finally`." |

---

### String

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **String pool** | A JVM-maintained cache of interned `String` literals stored in the heap's metaspace; identical literals share the same object instance | "Two string literals `String a = \"hello\"; String b = \"hello\";` point to the same pool object, so `a == b` is `true` — but `new String(\"hello\")` is always a new heap object." |
| **`String.intern()`** | Returns the canonical pool instance for a string value, interning it if not already present; allows `==` comparison instead of `equals()` | "Calling `intern()` on a dynamically constructed string moves it into the pool — useful in memory-constrained parsers that create many duplicate strings." |
| **`String` vs `StringBuilder` vs `StringBuffer`** | `String` is immutable; `StringBuilder` is mutable and not thread-safe (preferred for single-threaded concatenation loops); `StringBuffer` is mutable and thread-safe but slower due to synchronization | "Concatenating inside a loop with `+` creates O(n) intermediate `String` objects — replacing it with `StringBuilder.append()` reduces allocation to O(1) per append." |
| **`String.format` vs `String.valueOf`** | `String.format` produces a formatted string using a pattern (like `printf`); `String.valueOf` converts a primitive or object to its string representation without formatting overhead | "Use `String.valueOf(42)` instead of `\"\" + 42` to avoid the implicit `StringBuilder` allocation, and `String.format` only when you need structured formatting." |
| **`compareTo` vs `equals`** | `equals` tests character-by-character equality (returns `boolean`); `compareTo` implements lexicographic ordering (returns negative/zero/positive `int`) for use in sorting | "Use `compareTo` when sorting strings or using them as `TreeMap` keys; use `equals` for simple equality checks — never `==` for heap strings." |
| **String immutability rationale** | `String` is immutable to enable: (1) safe sharing of the string pool without synchronization, (2) caching the `hashCode` field after first computation, and (3) preventing security exploits where a mutable filename/password could be changed after a security check | "The JVM caches `String.hashCode()` because immutability guarantees the value never changes — this makes `HashMap<String, V>` lookups especially fast." |

---

## Key rules / gotchas

- **Overloading is resolved at compile time:** The declared type of the variable — not the runtime type — determines which overload is called. Passing a `Dog` reference typed as `Animal` to an overloaded method picks the `Animal` overload.
- **`equals` and `hashCode` contract:** If two objects are `equals`, they must have the same `hashCode`. Violating this breaks `HashMap`, `HashSet`, and any hash-based collection. Records auto-generate a correct implementation; hand-rolled classes frequently get this wrong.
- **Type erasure means no generic arrays:** `new T[10]` is a compile error. Use `(T[]) new Object[10]` with a suppressed warning or pass a `Class<T>` token to create a typed array via `Array.newInstance`.
- **`default` method diamond resolution order:** The class's own implementation wins first; a more specific interface's `default` beats a less specific one; if still ambiguous, the compiler requires an explicit override calling `InterfaceName.super.method()`.
- **Sealed classes and pattern matching:** Every `permits`-listed subtype must be in the same package or module. `switch` expressions over a sealed type are exhaustive — the compiler rejects a missing case.
- **Phantom reference get() always returns null:** Unlike `SoftReference.get()` and `WeakReference.get()`, `PhantomReference.get()` always returns `null` by design — the reference is for cleanup notification only.
- **try-with-resources and suppressed exceptions:** If both the `try` body and the implicit `close()` call throw, the `close()` exception is *suppressed* (attached to the primary exception via `addSuppressed`), not silently swallowed.
- **LSP and behavioral subtyping:** LSP is not just about method signatures — it requires that preconditions are not strengthened and postconditions are not weakened in the subtype. A `Square` that silently changes both dimensions when only one is set strengthens the postcondition and violates LSP.
- **`String ==` pitfall:** `"a" + "b" == "ab"` is `true` (compile-time constant folding), but `new String("a") + "b" == "ab"` is `false`. Always use `equals()` unless you explicitly interned the strings.

---

## Code example

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Demonstrates: dynamic dispatch via vtable, PECS with generics,
 * immutable class pattern, try-with-resources, and Java records.
 *
 * All senior-level Java interview concepts in one runnable class.
 */
public class JavaLabRunner {

    // ─── 1. Dynamic dispatch (vtable in action) ───────────────────────────────

    abstract static class Shape {
        abstract double area();

        @Override
        public String toString() {
            // covariant return type not shown here, but overriding toString() is
            return getClass().getSimpleName() + " area=" + String.format("%.2f", area());
        }
    }

    static class Circle extends Shape {
        private final double radius;
        Circle(double radius) { this.radius = radius; }

        @Override
        double area() { return Math.PI * radius * radius; }  // runtime dispatch
    }

    static class Rectangle extends Shape {
        private final double w, h;
        Rectangle(double w, double h) { this.w = w; this.h = h; }

        @Override
        double area() { return w * h; }  // runtime dispatch
    }

    // ─── 2. Immutable class pattern ───────────────────────────────────────────

    static final class Money {
        private final long cents;      // final field
        private final String currency; // String itself is immutable — no copy needed

        Money(long cents, String currency) {
            if (cents < 0) throw new IllegalArgumentException("Negative money");
            this.cents = cents;
            this.currency = currency;
        }

        long cents()       { return cents; }
        String currency()  { return currency; }

        Money add(Money other) {
            if (!currency.equals(other.currency))
                throw new IllegalArgumentException("Currency mismatch");
            return new Money(cents + other.cents, currency); // returns new instance
        }

        @Override public String toString() {
            return currency + " " + String.format("%.2f", cents / 100.0);
        }
    }

    // ─── 3. Java Record (Java 16+) ────────────────────────────────────────────
    // Auto-generates: canonical constructor, private final fields,
    // accessors (x(), y()), equals(), hashCode(), toString().
    record Point(int x, int y) {
        // Compact canonical constructor — validation without re-assigning fields
        Point {
            if (x < 0 || y < 0) throw new IllegalArgumentException("Negative coordinate");
        }
    }

    // ─── 4. AutoCloseable for try-with-resources ──────────────────────────────

    static class ManagedResource implements AutoCloseable {
        private final String name;
        ManagedResource(String name) {
            this.name = name;
            System.out.println("  [open]  " + name);
        }

        void process() {
            System.out.println("  [use]   " + name);
        }

        @Override
        public void close() {
            // In real code this releases DB connections, file handles, etc.
            System.out.println("  [close] " + name + "  ← guaranteed by try-with-resources");
        }
    }

    // ─── 5. PECS helper methods ───────────────────────────────────────────────

    /** Producer Extends — reads Shapes from src, computes total area. */
    static double totalArea(List<? extends Shape> src) {
        // src is a PRODUCER of Shape — we only read from it
        double sum = 0;
        for (Shape s : src) sum += s.area();
        return sum;
    }

    /** Consumer Super — writes Shapes into dest. */
    static void addDefaultShapes(List<? super Shape> dest) {
        // dest is a CONSUMER of Shape — we only write into it
        dest.add(new Circle(1));
        dest.add(new Rectangle(2, 3));
    }

    // ─── main ─────────────────────────────────────────────────────────────────

    public static void main(String[] args) {

        // 1. Dynamic dispatch — reference type is Shape, runtime type varies
        System.out.println("=== Dynamic Dispatch (vtable) ===");
        List<Shape> shapes = new ArrayList<>();
        shapes.add(new Circle(5));
        shapes.add(new Rectangle(3, 4));
        for (Shape s : shapes) {
            // The JVM looks up s's vtable to find the correct area() override
            System.out.println("  " + s);  // calls overridden toString() + area()
        }

        // 2. PECS — Producer Extends, Consumer Super
        System.out.println("\n=== PECS Rule ===");
        List<Circle>    circles    = List.of(new Circle(2), new Circle(3));
        List<Rectangle> rectangles = List.of(new Rectangle(1, 2));

        // totalArea accepts List<Circle> and List<Rectangle> because ? extends Shape
        System.out.printf("  circles total area    = %.2f%n", totalArea(circles));
        System.out.printf("  rectangles total area = %.2f%n", totalArea(rectangles));

        // addDefaultShapes accepts List<Shape> or List<Object> because ? super Shape
        List<Shape> bucket = new ArrayList<>();
        addDefaultShapes(bucket);
        System.out.printf("  bucket total area     = %.2f%n", totalArea(bucket));

        // 3. Immutable class
        System.out.println("\n=== Immutable Class ===");
        Money price    = new Money(1999, "USD");
        Money tax      = new Money(160,  "USD");
        Money total    = price.add(tax);     // returns new Money — originals unchanged
        System.out.println("  price=" + price + "  tax=" + tax + "  total=" + total);

        // 4. Record
        System.out.println("\n=== Record ===");
        Point p1 = new Point(3, 4);
        Point p2 = new Point(3, 4);
        System.out.println("  p1=" + p1);                     // auto toString
        System.out.println("  p1.equals(p2) = " + p1.equals(p2)); // auto equals
        System.out.println("  p1 == p2      = " + (p1 == p2));    // false — different instances

        // 5. try-with-resources — close() called automatically, even on exception
        System.out.println("\n=== try-with-resources ===");
        try (ManagedResource r = new ManagedResource("DBConnection")) {
            r.process();
            // close() is guaranteed to run after this block exits
        }
        // No explicit finally needed — r.close() was already called above

        // Multi-catch example (compile-time, no actual exception thrown here)
        System.out.println("\n=== Multi-catch (structure) ===");
        try {
            String s = null;
            int len = s.length();          // throws NullPointerException
            System.out.println(len);
        } catch (NullPointerException | IllegalArgumentException e) {
            System.out.println("  caught: " + e.getClass().getSimpleName() + " — " + e.getMessage());
        }

        System.out.println("\nAll demos complete.");
    }
}
```

---

## Interview questions you should be able to answer

- **Q:** What is the virtual method table (vtable) and how does the JVM use it to implement dynamic dispatch?
  > Every class in the JVM has a vtable — a table of pointers to the most-derived implementation of each virtual method. When you call a method on a reference, the JVM dereferences the object's header to find its class, then looks up the method in that class's vtable. This means the *runtime* type always wins, even though the reference is declared as a supertype. Static methods, private methods, and final methods bypass the vtable and are resolved at compile time (static binding), which is why they cannot be meaningfully overridden.

- **Q:** What are the practical consequences of type erasure for a senior engineer writing generic library code?
  > Because generic type parameters are erased to their bound (`Object` by default) at runtime, you cannot use `instanceof` with a parameterized type, create generic arrays (`new T[]`), overload on generic types alone, or catch a generic exception type. You also cannot determine at runtime whether a `List` holds `String` or `Integer` — both erase to `List`. Library authors work around this by passing explicit `Class<T>` tokens (type tokens), using `@SuppressWarnings("unchecked")` with documented reasoning, and marking safe varargs methods with `@SafeVarargs`.

- **Q:** Explain the PECS rule and show how it applies to `Collections.copy`.
  > PECS stands for *Producer Extends, Consumer Super*. A structure you only **read from** is a producer — declare it `? extends T` (covariant upper-bounded wildcard). A structure you only **write into** is a consumer — declare it `? super T` (contravariant lower-bounded wildcard). `Collections.copy(List<? super T> dest, List<? extends T> src)` follows PECS exactly: `src` produces `T` values (you read them), so it is `? extends T`; `dest` consumes `T` values (you write into it), so it is `? super T`. This signature is maximally flexible — `src` can be a `List<Integer>` and `dest` can be a `List<Number>` when `T` is `Integer`.

- **Q:** Why is `String` immutable in Java, and what are the three concrete benefits immutability provides?
  > First, **string pool sharing**: because a `String` can never change, the JVM safely hands out the same object to every reference to the same literal, saving heap memory. Second, **hashCode caching**: `String.hashCode()` is computed once and cached in a private field — immutability guarantees the cached value is always valid, making `String` keys in `HashMap` very efficient. Third, **security**: many security-sensitive APIs (file paths, class names, network hostnames) accept `String`. If `String` were mutable, a thread could pass a validated string to a security check and then mutate it before the actual operation, creating a TOCTOU vulnerability.

- **Q:** Give a concrete example of a Liskov Substitution Principle violation and explain why it is dangerous.
  > The classic example is `Square extends Rectangle`. A `Rectangle` has independent width and height setters. A `Square` must keep both equal, so its `setWidth(w)` also sets height to `w`. Code that does `rect.setWidth(5); rect.setHeight(3); assert rect.area() == 15;` passes for a `Rectangle` but fails for a `Square` — the `Square` silently changed the height during `setWidth`. This is dangerous because callers that receive a `Rectangle` reference have a reasonable expectation of its postconditions, and the subtype breaks them. The fix is not to use inheritance here — `Square` and `Rectangle` should be separate types, or `Rectangle` should be immutable.

- **Q:** How does Java resolve the diamond problem when two interfaces provide a `default` method with the same signature?
  > Java applies a priority chain. First, a concrete method in the implementing class (or any of its superclasses) always wins over any interface `default`. Second, if no class implementation exists, the more *specific* interface wins — if `B extends A` and both define `default greet()`, then a class implementing `B` gets `B`'s version. Third, if neither interface is more specific (a true diamond — two unrelated interfaces each with `default greet()`), the compiler reports an error and requires the implementing class to explicitly override the method, calling the desired interface's version via `InterfaceName.super.greet()`. This is fundamentally different from C++ multiple inheritance of data members, because Java interfaces carry no mutable state.

---

## Further reading

- *Effective Java*, 3rd ed., Joshua Bloch — Items 15–25 (classes and interfaces), Items 28–33 (generics), Items 76–77 (exceptions)
- JEP 359 (Records), JEP 409 (Sealed Classes), JEP 305 (Pattern Matching for `instanceof`) — openjdk.org/jeps
- Java Language Specification §15.12.4.4 — virtual method invocation (vtable semantics)
- Oracle Generics Tutorial — *Wildcards and Subtyping*, *Type Erasure* sections — docs.oracle.com/javase/tutorial/java/generics
- "Understanding Java's Memory Model" — Heinz Kabutz, JavaSpecialists Newsletter — javaspecialists.eu
- "SOLID Principles in Java" — Baeldung guide with annotated code examples — baeldung.com/solid-principles
