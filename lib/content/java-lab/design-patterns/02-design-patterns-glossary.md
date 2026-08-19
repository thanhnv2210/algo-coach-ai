# Design Patterns Terminology — Interview Reference

## Why this matters in interviews

Senior Java interviews routinely ask you to name patterns by category, explain trade-offs between similar patterns (Decorator vs inheritance, Proxy vs Decorator), and cite concrete JDK examples — not just define them. Interviewers use pattern knowledge as a proxy for design sense: they want to know whether you reach for the right tool and can explain why the JDK itself made the choices it did. Knowing the GoF taxonomy cold, plus the thread-safety nuances of Singleton and the brokenness of `Cloneable`, separates strong senior candidates from mid-level ones.

## Concept

### Pattern Categories

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| Creational | Patterns that deal with object creation mechanisms, aiming to create objects in a manner suitable to the situation | "Builder is a creational pattern because it controls how a complex object is assembled." |
| Structural | Patterns that deal with object composition, forming larger structures from individual parts | "Decorator is structural because it wraps an existing object to add new behavior without changing its class." |
| Behavioral | Patterns that deal with communication and responsibility between objects | "Strategy is behavioral because it encapsulates an interchangeable algorithm and delegates execution to it at runtime." |
| GoF (Gang of Four) | The four authors (Gamma, Helm, Johnson, Vlissides) of *Design Patterns: Elements of Reusable Object-Oriented Software* (1994); the canonical catalog of 23 OOP patterns | "The GoF catalog organizes 23 patterns into creational, structural, and behavioral categories." |
| Anti-pattern | A commonly used solution that seems reasonable but is actually counterproductive or harmful; documented so practitioners can recognize and avoid it | "God Object is an anti-pattern: one class knows too much and does too much, making the system fragile and hard to test." |

---

### Creational Patterns

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| Singleton (eager init) | Instance is created when the class is loaded; thread-safe by JVM class-loading guarantee but always pays initialization cost | "Eager init: `private static final Foo INSTANCE = new Foo();` — safe, but Foo is created even if never used." |
| Singleton (lazy init) | Instance is created on first call to `getInstance()`; not thread-safe without additional synchronization | "Lazy init without `synchronized` is broken in a multi-threaded context — two threads can create two instances." |
| Singleton (DCL — Double-Checked Locking) | Uses `volatile` on the instance field plus a `synchronized` block only on the first creation; safe from Java 5+ due to the revised memory model | "DCL requires `private volatile static Foo instance` — without `volatile`, the JIT may publish a partially constructed object." |
| Singleton (enum) | Declared as a single-element enum; serialization-safe, reflection-safe, and thread-safe with zero boilerplate; preferred idiom in Effective Java | "`public enum AppConfig { INSTANCE; }` — the JVM guarantees only one instance and prevents deserialization from creating a second." |
| Singleton (initialization-on-demand holder) | Lazy initialization using a private static inner class that holds the instance; thread-safe via class-loading guarantee with no `volatile` or `synchronized` | "The holder class is not loaded until `getInstance()` is called, so initialization is deferred and still thread-safe." |
| Factory Method | Defines an interface for creating an object but lets subclasses decide which class to instantiate; promotes loose coupling by eliminating direct instantiation | "`Calendar.getInstance()` returns a `GregorianCalendar` or `BuddhistCalendar` depending on locale — the caller never uses `new`." |
| Abstract Factory | Provides an interface for creating *families* of related or dependent objects without specifying their concrete classes; a factory of factories | "A `UIFactory` interface might have `createButton()` and `createDialog()`; `MacUIFactory` and `WinUIFactory` produce consistent Mac or Windows widgets." |
| Builder | Separates the construction of a complex object from its representation; enables a fluent API to set optional parameters, avoiding telescoping constructors | "`HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(ALWAYS).build()` — each setter returns the builder, and `build()` validates and returns the immutable product." |
| Prototype | Creates new objects by copying (cloning) an existing prototype; avoids the cost of creating an object from scratch | "A `DocumentTemplate` is cloned each time a new document is needed, preserving the default field values without hitting the DB." |
| Cloneable pitfalls | `Cloneable` is a marker interface that does not declare `clone()`; `Object.clone()` does a shallow copy by default and throws `CloneNotSupportedException` if `Cloneable` is not implemented — the whole mechanism is considered broken | "Using `Cloneable` forces you to catch a checked exception from a method that is not even declared in the interface — prefer a copy constructor or static factory instead." |
| Shallow vs deep copy | Shallow copy duplicates the object's fields by reference (nested objects are shared); deep copy recursively copies nested objects so the clone is fully independent | "A shallow clone of a `List`-holding object shares the same `List` instance — mutating it in the clone mutates the original." |

---

### Structural Patterns

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| Adapter | Converts the interface of a class into another interface clients expect; lets incompatible classes collaborate | "`Arrays.asList()` adapts a plain array into the `List` interface without copying data." |
| Object adapter | Uses composition — the adapter holds a reference to the adaptee and delegates calls | "Object adapter is preferred in Java because Java has no multiple inheritance; the adapter wraps the adaptee object." |
| Class adapter | Uses inheritance — the adapter extends the adaptee class; only possible where multiple inheritance is available (not idiomatic Java) | "Class adapter is common in C++ but rarely used in Java; object adapter via composition is the idiomatic choice." |
| Decorator | Wraps an object to add behavior dynamically at runtime; conforms to the same interface as the wrapped object so decorators can be stacked | "`new BufferedReader(new InputStreamReader(socket.getInputStream()))` — each layer adds behavior (buffering, character decoding) without altering the underlying stream." |
| Proxy | Controls access to another object (the real subject); the proxy and real subject implement the same interface | "A lazy-loading proxy for a large image only loads pixel data when `draw()` is first called." |
| Virtual proxy | Defers expensive object creation until it is actually needed | "Spring's `@Lazy` bean is a virtual proxy — the dependency is not instantiated until the first method call." |
| Protection proxy | Controls access based on permissions | "A `SecureFileProxy` checks the caller's role before delegating read or write calls to the real `File` object." |
| Remote proxy | Provides a local representative for an object in a different address space (e.g., RMI stub) | "An RMI stub is a remote proxy — the caller invokes methods locally, and the stub serializes the call over the network." |
| Caching proxy | Caches results of expensive operations and returns the cached result for repeat calls | "Spring's `@Cacheable` implements a caching proxy around service methods." |
| Spring AOP proxy | Spring wraps beans in a proxy to apply cross-cutting concerns (transactions, security, logging); uses JDK dynamic proxy if the bean implements an interface, CGLIB subclass proxy otherwise | "If your `@Service` class implements an interface, Spring creates a JDK dynamic proxy; if not, it creates a CGLIB subclass proxy at runtime." |
| Composite | Organizes objects into tree structures to represent part-whole hierarchies; Component interface is implemented by both Leaf and Composite nodes | "A `FileSystemEntry` interface is implemented by `File` (leaf) and `Directory` (composite); calling `size()` on a directory recursively sums its children." |
| Facade | Provides a simplified, unified interface to a complex subsystem, hiding its complexity | "`javax.faces.context.FacesContext` is a facade — it bundles request, response, session, and EL context behind a single entry point." |
| Flyweight | Shares fine-grained objects to reduce memory; intrinsic state is shared, extrinsic state is passed at call time | "`Integer.valueOf(127)` returns a cached `Integer` from the pool (-128 to 127); a billion loop iterations sharing 256 `Integer` objects instead of allocating new ones." |

---

### Behavioral Patterns

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| Strategy | Encapsulates a family of algorithms behind a common interface and makes them interchangeable; the context delegates to whichever strategy is set at runtime | "`Collections.sort(list, comparator)` — `Comparator` is the strategy interface; the calling code swaps sort logic without touching the sort infrastructure." |
| Observer | Defines a one-to-many dependency: when the subject changes state, all registered observers are notified automatically | "`PropertyChangeListener` is an observer — register it on a bean and it fires on every property change without the bean knowing who is listening." |
| Push vs pull model | Push: subject sends data with the notification event; Pull: subject sends only a reference to itself and observers query the state they need | "The Swing event model is push — the `ActionEvent` carries the source and command string so listeners do not need to interrogate the button." |
| `java.util.Observable` deprecated | `Observable` was deprecated in Java 9 because it is a class (must be extended, preventing composition), its methods are not synchronized consistently, and it does not integrate with modern reactive APIs | "Prefer `PropertyChangeSupport` or reactive streams (`Flow.Publisher`) over the deprecated `Observable`." |
| Command | Encapsulates a request as an object, enabling parameterization, queuing, logging, and undo/redo | "A `TextEditor` stores each `Command` (insert, delete) in a stack; undo pops and calls `command.undo()`." |
| Template Method | Defines the skeleton of an algorithm in a base class method; specific steps are deferred to subclasses via abstract or hook methods | "`AbstractList` implements `iterator()` using `get(int index)` and `size()` — concrete subclasses only override those two primitives." |
| Chain of Responsibility | Passes a request along a chain of handlers; each handler decides to process it or forward it to the next | "Servlet filters form a chain — each `Filter.doFilter()` call either handles the request or calls `chain.doFilter()` to pass it forward." |
| Iterator | Provides a way to sequentially access elements of an aggregate object without exposing its internal structure | "`java.util.Iterator` with `hasNext()` / `next()` / `remove()` is the canonical Java implementation; the enhanced for loop desugars to it." |
| State | Allows an object to alter its behavior when its internal state changes; the object will appear to change its class; eliminates large `if`/`switch` blocks | "A `VendingMachine` delegates all actions to a `State` object; switching from `IdleState` to `DispensingState` completely changes how button presses are handled." |

---

### JDK Pattern Examples

| Pattern | JDK Examples |
|---------|-------------|
| Singleton | `Runtime.getRuntime()`, `System.console()`, `Desktop.getDesktop()` |
| Factory Method | `Calendar.getInstance()`, `NumberFormat.getInstance()`, `Path.of()`, `List.of()` |
| Abstract Factory | `DocumentBuilderFactory`, `SAXParserFactory` (XML parsing families) |
| Builder | `StringBuilder`, `Stream.Builder`, `HttpClient.newBuilder()`, `ProcessBuilder` |
| Prototype | `Object.clone()` (shallow), `ArrayList(collection)` copy constructor |
| Adapter | `Arrays.asList()`, `InputStreamReader` (byte stream → char stream) |
| Decorator | `java.io` stream wrappers (`BufferedReader`, `DataInputStream`), `Collections.synchronizedList()`, `Collections.unmodifiableList()` |
| Proxy | `java.lang.reflect.Proxy` (JDK dynamic proxy), Spring AOP proxies (JDK or CGLIB) |
| Facade | `javax.faces.context.FacesContext`, `java.net.URL` |
| Flyweight | `Integer.valueOf()` cache (-128–127), `String` interning (`String.intern()`) |
| Observer | `java.util.EventListener`, `PropertyChangeListener`, `java.util.concurrent.Flow.Subscriber` |
| Iterator | `java.util.Iterator`, enhanced for loop, `Spliterator` |
| Strategy | `java.util.Comparator`, `java.util.concurrent.RejectedExecutionHandler`, `javax.servlet.http.HttpServlet` (dispatch strategy) |
| Template Method | `AbstractList.get()`, `HttpServlet.service()` dispatching to `doGet()`/`doPost()`, `AbstractQueuedSynchronizer` |
| Command | `java.lang.Runnable`, `java.util.concurrent.Callable`, `javax.swing.Action` |
| Chain of Responsibility | Servlet `FilterChain`, Spring Security filter chain, `java.util.logging.Logger` parent-handler delegation |

---

## Key rules / gotchas

- **Enum singleton is serialization-safe by default:** A regular singleton with a `readResolve()` override can still be broken via reflection; an enum constant cannot — the JVM prevents multiple instances at the bytecode level.
- **`volatile` is mandatory in DCL:** Without `volatile`, the JIT is free to reorder the write to `instance` before the constructor finishes, so another thread can observe a non-null but partially initialized object.
- **`Cloneable` does not declare `clone()`:** `Object.clone()` is `protected` and throws a checked exception. You must override it as `public` and cast the result — it is universally regarded as a design mistake. Prefer copy constructors or static factory methods.
- **Decorator and Proxy look identical structurally:** The difference is intent — Decorator adds behavior, Proxy controls access. Ask yourself: "Am I enriching the object or gatekeeping it?"
- **Composite vs Decorator:** Composite composes the same type into a *tree* (part-whole hierarchy); Decorator composes the same type in a *linear chain* (wrapping to add behavior). Both use recursive composition but for different purposes.
- **Spring AOP proxy selection:** If the target bean implements at least one interface, Spring defaults to a JDK dynamic proxy (interface-based); if there is no interface, it falls back to CGLIB which subclasses the concrete class at runtime. This matters because CGLIB cannot proxy `final` classes or `final` methods.
- **Observer push model can couple subject to observer:** Sending a fat event object forces observers to depend on types they may not need; the pull model keeps the event lean but requires observers to reach back into the subject.
- **Telescoping constructor anti-pattern:** Having many overloaded constructors with increasing optional parameters is the smell that Builder cures. Builder also enables immutable objects (all fields set before `build()` returns).
- **Flyweight intrinsic vs extrinsic state:** Flyweight only works when a large portion of object state is identical across instances (intrinsic/shared). Extrinsic state that varies per use-site must be passed in by the caller, never stored in the flyweight.
- **Template Method vs Strategy:** Template Method uses *inheritance* to vary steps (tight coupling to base class); Strategy uses *composition* to swap the whole algorithm (looser coupling, more flexible). Prefer Strategy when the algorithm is likely to change at runtime.

---

## Code example

```java
import java.util.ArrayList;
import java.util.List;

public class JavaLabRunner {

    // ─── 1. BUILDER PATTERN ────────────────────────────────────────────────────

    static final class QueryConfig {
        private final String table;       // mandatory
        private final int    limit;       // optional (default 100)
        private final boolean readOnly;   // optional (default false)

        private QueryConfig(Builder b) {
            this.table    = b.table;
            this.limit    = b.limit;
            this.readOnly = b.readOnly;
        }

        @Override public String toString() {
            return "QueryConfig{table='" + table + "', limit=" + limit
                    + ", readOnly=" + readOnly + "}";
        }

        static final class Builder {
            // mandatory
            private final String table;
            // optional — defaults set here
            private int     limit    = 100;
            private boolean readOnly = false;

            Builder(String table) {
                if (table == null || table.isBlank())
                    throw new IllegalArgumentException("table must not be blank");
                this.table = table;
            }

            Builder limit(int limit)        { this.limit    = limit;    return this; }
            Builder readOnly(boolean ro)    { this.readOnly = ro;       return this; }

            QueryConfig build()             { return new QueryConfig(this); }
        }
    }

    // ─── 2. STRATEGY PATTERN ───────────────────────────────────────────────────

    @FunctionalInterface
    interface SortStrategy {
        void sort(List<Integer> list);
    }

    static final class BubbleSort implements SortStrategy {
        @Override public void sort(List<Integer> list) {
            int n = list.size();
            for (int i = 0; i < n - 1; i++)
                for (int j = 0; j < n - i - 1; j++)
                    if (list.get(j) > list.get(j + 1)) {
                        int tmp = list.get(j);
                        list.set(j, list.get(j + 1));
                        list.set(j + 1, tmp);
                    }
        }
        @Override public String toString() { return "BubbleSort"; }
    }

    static final class InsertionSort implements SortStrategy {
        @Override public void sort(List<Integer> list) {
            int n = list.size();
            for (int i = 1; i < n; i++) {
                int key = list.get(i), j = i - 1;
                while (j >= 0 && list.get(j) > key) {
                    list.set(j + 1, list.get(j--));
                }
                list.set(j + 1, key);
            }
        }
        @Override public String toString() { return "InsertionSort"; }
    }

    static final class Sorter {
        private SortStrategy strategy;
        Sorter(SortStrategy strategy)          { this.strategy = strategy; }
        void setStrategy(SortStrategy strategy){ this.strategy = strategy; }
        void sort(List<Integer> list) {
            System.out.println("  Using strategy: " + strategy);
            strategy.sort(list);
        }
    }

    // ─── 3. DECORATOR PATTERN ──────────────────────────────────────────────────

    interface TextProcessor {
        String process(String input);
    }

    // Concrete component
    static final class PlainText implements TextProcessor {
        @Override public String process(String input) { return input; }
    }

    // Base decorator — holds a reference to another TextProcessor
    static abstract class TextDecorator implements TextProcessor {
        protected final TextProcessor wrapped;
        TextDecorator(TextProcessor wrapped) { this.wrapped = wrapped; }
    }

    static final class UpperCaseDecorator extends TextDecorator {
        UpperCaseDecorator(TextProcessor wrapped) { super(wrapped); }
        @Override public String process(String input) {
            return wrapped.process(input).toUpperCase();
        }
    }

    static final class TrimDecorator extends TextDecorator {
        TrimDecorator(TextProcessor wrapped) { super(wrapped); }
        @Override public String process(String input) {
            return wrapped.process(input.trim());
        }
    }

    static final class ExclamationDecorator extends TextDecorator {
        ExclamationDecorator(TextProcessor wrapped) { super(wrapped); }
        @Override public String process(String input) {
            return wrapped.process(input) + "!!!";
        }
    }

    // ─── MAIN ──────────────────────────────────────────────────────────────────

    public static void main(String[] args) {

        // --- Builder ---
        System.out.println("=== Builder Pattern ===");
        QueryConfig cfg = new QueryConfig.Builder("users")
                .limit(50)
                .readOnly(true)
                .build();
        System.out.println(cfg);

        QueryConfig cfgDefaults = new QueryConfig.Builder("orders").build();
        System.out.println(cfgDefaults);

        // --- Strategy ---
        System.out.println("\n=== Strategy Pattern ===");
        List<Integer> data1 = new ArrayList<>(List.of(5, 2, 8, 1, 9));
        List<Integer> data2 = new ArrayList<>(List.of(5, 2, 8, 1, 9));

        Sorter sorter = new Sorter(new BubbleSort());
        sorter.sort(data1);
        System.out.println("  Result: " + data1);

        sorter.setStrategy(new InsertionSort());   // swap strategy at runtime
        sorter.sort(data2);
        System.out.println("  Result: " + data2);

        // Comparator as Strategy (JDK example)
        List<String> words = new ArrayList<>(List.of("banana", "apple", "cherry"));
        words.sort((a, b) -> a.length() - b.length());  // lambda = inline Strategy
        System.out.println("  Sorted by length: " + words);

        // --- Decorator ---
        System.out.println("\n=== Decorator Pattern ===");
        // Stack decorators: Trim → UpperCase → Exclamation
        TextProcessor pipeline = new ExclamationDecorator(
                                     new UpperCaseDecorator(
                                         new TrimDecorator(
                                             new PlainText())));
        String result = pipeline.process("  hello world  ");
        System.out.println("  Input : '  hello world  '");
        System.out.println("  Output: '" + result + "'");

        // JDK analogy (prints, not constructs actual streams to keep it runnable)
        System.out.println("  JDK analogy: new BufferedReader(new InputStreamReader(stream))");
        System.out.println("  Each layer is a decorator — same Reader interface, added behavior.");
    }
}
```

## Interview questions you should be able to answer

- **Q:** Why does Effective Java recommend enum singleton over Double-Checked Locking?
  > Enum singleton is guaranteed by the JVM to have exactly one instance, is immune to reflection attacks (`newInstance()` on an enum throws `IllegalArgumentException`), and is automatically serialization-safe without any `readResolve()` override. DCL requires `volatile` (easy to forget), a `synchronized` block, a null-check inside and outside the lock, and a hand-rolled `readResolve()` to prevent deserialization from creating a second instance — far more boilerplate with more ways to go wrong.

- **Q:** How does Spring AOP decide whether to use a JDK dynamic proxy or a CGLIB proxy, and why does it matter?
  > Spring uses a JDK dynamic proxy when the target bean implements at least one interface — the proxy implements the same interface(s) and delegates. When there is no interface, Spring generates a CGLIB subclass of the concrete class at runtime. It matters because CGLIB cannot proxy `final` classes or `final` methods (subclassing is blocked), and CGLIB-proxied beans require a no-arg constructor for the generated subclass. You can force CGLIB with `@EnableAspectJAutoProxy(proxyTargetClass = true)`.

- **Q:** When should you prefer Decorator over inheritance for extending behavior?
  > Decorator should be preferred when you need to compose behaviors in flexible, stackable combinations at runtime without committing to a fixed class hierarchy. Inheritance hard-codes the combination at compile time and causes a class explosion as the number of combinations grows (e.g., `BufferedEncryptedCompressedReader` as a single class). Decorator keeps each concern in its own small class, and callers assemble the stack they need. Inheritance is only preferable when the extended behavior is a true "is-a" specialization unlikely to change.

- **Q:** Why is `Cloneable` considered broken in Java?
  > `Cloneable` is a marker interface that does not declare the `clone()` method, so implementing it gives you no compile-time guarantee of a usable API. `Object.clone()` is `protected` and throws a checked `CloneNotSupportedException` unless `Cloneable` is implemented, forcing awkward override boilerplate. The default implementation performs only a shallow copy, which silently shares mutable nested objects between the original and clone. There is no clean mechanism for deep copying, and the whole design pre-dates generics and lambdas. Effective Java recommends using a copy constructor (`new MyClass(other)`) or a static factory method instead.

- **Q:** What is the structural difference between Composite and Decorator, and how do you tell them apart?
  > Both patterns rely on a component interface implemented by both the "wrapper" and the "core" object, enabling recursive composition. The distinction is in purpose and tree shape: Composite builds a *tree* of uniform nodes to represent a part-whole hierarchy (a `Directory` is-a `FileSystemEntry` and contains other `FileSystemEntry` objects); Decorator builds a *linear chain* where each wrapper adds a single behavior increment (a `BufferedReader` wraps a `Reader` and adds buffering). Composite nodes know about their children; Decorators are agnostic to what they wrap beyond the shared interface.

- **Q:** Name a concrete JDK example of the Template Method pattern and describe what the template method defines.
  > `HttpServlet.service(HttpServletRequest, HttpServletResponse)` is the template method. It reads the HTTP method from the request and dispatches to `doGet()`, `doPost()`, `doPut()`, etc. The skeleton — parse method, dispatch, handle 405 for unsupported methods — is fixed in `service()`. Subclasses override only the specific handler methods they need. `AbstractList` is another example: `iterator()` and `listIterator()` are template methods whose implementations call the abstract primitives `get(int index)` and `size()`, which concrete subclasses must provide.

---

## Further reading

- Gamma, Helm, Johnson, Vlissides — *Design Patterns: Elements of Reusable Object-Oriented Software* (Addison-Wesley, 1994) — the original GoF catalog
- Bloch, Joshua — *Effective Java, 3rd Edition*, Items 3 (singleton), 13 (clone), 17 (immutability with Builder), 18 (composition over inheritance)
- Refactoring.Guru — https://refactoring.guru/design-patterns/java — concise pattern summaries with Java code
- Baeldung — https://www.baeldung.com/design-patterns-series — practical Spring-context pattern examples
- Oracle Java Docs — `java.lang.reflect.Proxy`, `java.util.Iterator`, `java.util.Comparator` — see the Javadoc "Implementation Note" sections for pattern commentary
- Spring Framework Reference — https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop — AOP proxy mechanism (JDK vs CGLIB)
