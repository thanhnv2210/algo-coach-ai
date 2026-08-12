# Java Lab — Interview-Focused Curriculum

**Audience:** Senior Software Engineer candidates with Java backend experience
**Goal:** Reinforce and demonstrate mastery of Java topics that appear in Senior-level interviews
**Scope:** Not a beginner syntax guide — focuses on patterns, internals, and trade-offs

---

## Category 1 — Core Java & OOP

| # | Lesson | Key Concepts |
|---|--------|-------------|
| 1.1 | Object Model & Memory Layout | Stack vs heap, object references, primitive vs wrapper |
| 1.2 | Inheritance vs Composition | Liskov, favor composition, abstract vs interface |
| 1.3 | SOLID Principles (with Java examples) | SRP, OCP, LSP, ISP, DIP — each with runnable demo |
| 1.4 | Generics & Type Erasure | Bounded wildcards, `? extends`, `? super`, PECS |
| 1.5 | Enums & Records (Java 14+) | Pattern matching preview, `sealed` classes |
| 1.6 | Exceptions: Checked vs Unchecked | When to use each, exception chaining, custom exceptions |
| 1.7 | Immutability & Defensive Copying | `final`, `Collections.unmodifiableList`, value objects |

---

## Category 2 — Collections & Data Structures

| # | Lesson | Key Concepts |
|---|--------|-------------|
| 2.1 | ArrayList vs LinkedList | Internal array, amortized cost, iterator fail-fast |
| 2.2 | HashMap Internals | Bucket array, hash collision, load factor, tree bins (Java 8+) |
| 2.3 | LinkedHashMap & TreeMap | Insertion-order, red-black tree, NavigableMap |
| 2.4 | HashSet, LinkedHashSet, TreeSet | Set contracts, equals/hashCode contract |
| 2.5 | ArrayDeque vs Stack/Queue | Why ArrayDeque over Stack; Deque as both stack and queue |
| 2.6 | PriorityQueue & Comparator | Min-heap default, custom ordering, heap operations |
| 2.7 | Collections utility methods | `sort`, `binarySearch`, `unmodifiableList`, `synchronizedList` |
| 2.8 | equals() & hashCode() contract | Why both must be consistent, IDE-generated vs manual |

---

## Category 3 — Functional Java & Streams

| # | Lesson | Key Concepts |
|---|--------|-------------|
| 3.1 | Lambda Expressions | Functional interfaces, method references, closure semantics |
| 3.2 | Stream Pipeline Fundamentals | Lazy evaluation, intermediate vs terminal ops, short-circuit |
| 3.3 | Common Stream Operations | `map`, `filter`, `flatMap`, `reduce`, `collect` |
| 3.4 | Collectors Deep Dive | `groupingBy`, `partitioningBy`, `toMap`, custom Collector |
| 3.5 | Optional: Correct Usage | Avoid null, chain safely, anti-patterns to avoid |
| 3.6 | Parallel Streams | ForkJoinPool, when to use, pitfalls (shared state, ordering) |
| 3.7 | Comparator & Comparable | `Comparator.comparing`, chained sorts, natural ordering |

---

## Category 4 — Concurrency & Multithreading

| # | Lesson | Key Concepts |
|---|--------|-------------|
| 4.1 | Thread Lifecycle & JMM | Thread states, happens-before, visibility guarantees |
| 4.2 | `synchronized` & Intrinsic Locks | Monitor pattern, deadlock conditions, lock ordering |
| 4.3 | `volatile` & Atomic Variables | Memory visibility, `AtomicInteger`, CAS operations |
| 4.4 | Executor Framework | `ThreadPoolExecutor`, core/max pool, rejection policies |
| 4.5 | `Callable`, `Future`, `CompletableFuture` | Async composition, `thenApply`, `thenCompose`, exception handling |
| 4.6 | `java.util.concurrent` Collections | `ConcurrentHashMap`, `CopyOnWriteArrayList`, `BlockingQueue` |
| 4.7 | `ReentrantLock` & Conditions | Fair lock, `tryLock`, `Condition.await/signal` |
| 4.8 | Common Concurrency Bugs | Race condition, deadlock, livelock, starvation — with demos |

---

## Category 5 — JVM Internals & Performance

| # | Lesson | Key Concepts |
|---|--------|-------------|
| 5.1 | JVM Architecture | ClassLoader, Method Area, Heap regions, Stack frames |
| 5.2 | Garbage Collection Overview | Minor/Major GC, Stop-the-World, GC roots |
| 5.3 | GC Algorithms | Serial, Parallel, G1, ZGC — when to choose each |
| 5.4 | Memory Leaks in Java | Static collections, listeners, ThreadLocal misuse |
| 5.5 | String Interning & String Pool | `intern()`, `StringBuilder` vs concatenation, JVM optimization |
| 5.6 | JIT Compilation Basics | Interpreted → compiled, inlining, escape analysis |
| 5.7 | Profiling Tools Overview | JFR, async-profiler, heap dumps — conceptual walkthrough |

---

## Category 6 — Design Patterns (Java)

| # | Lesson | Key Concepts |
|---|--------|-------------|
| 6.1 | Singleton (thread-safe) | DCL, `volatile`, enum singleton, holder idiom |
| 6.2 | Builder Pattern | Telescoping constructor problem, fluent API, immutable objects |
| 6.3 | Factory & Abstract Factory | Decouple creation, Spring `@Bean` connection |
| 6.4 | Strategy Pattern | Runtime behavior swapping, functional interface as strategy |
| 6.5 | Observer Pattern | Event-driven design, Java `EventListener`, reactive analogy |
| 6.6 | Decorator Pattern | `InputStream` hierarchy, wrapping, open/closed principle |
| 6.7 | Template Method | Abstract class skeleton, hooks, Spring `JdbcTemplate` connection |
| 6.8 | Proxy Pattern | JDK dynamic proxy, CGLIB, Spring AOP connection |

---

## Category 7 — Spring Boot & Production Patterns

| # | Lesson | Key Concepts |
|---|--------|-------------|
| 7.1 | Dependency Injection Deep Dive | Constructor vs field injection, `@Qualifier`, circular deps |
| 7.2 | Spring Bean Lifecycle | `@PostConstruct`, `@PreDestroy`, `BeanFactoryPostProcessor` |
| 7.3 | Spring MVC Request Lifecycle | DispatcherServlet, HandlerMapping, filters vs interceptors |
| 7.4 | Spring WebFlux & Reactive Streams | `Mono`/`Flux`, backpressure, when to choose reactive |
| 7.5 | Spring Data & Repository Pattern | `JpaRepository`, custom queries, N+1 problem |
| 7.6 | `@Transactional` Internals | Propagation, isolation levels, proxy-based limitations |
| 7.7 | Spring Security Overview | Filter chain, `SecurityContext`, JWT integration pattern |
| 7.8 | Production-Ready: Actuator, Logging | Health checks, metrics, structured logging (MDC) |

---

## Category 8 — Common Interview Coding Patterns (Java)

| # | Lesson | Key Concepts |
|---|--------|-------------|
| 8.1 | Two Pointers & Sliding Window | Java array/list manipulation idioms |
| 8.2 | HashMap frequency counting | Character frequency, anagram detection, top-K |
| 8.3 | Stack-based problems | Monotonic stack, balanced brackets, next-greater-element |
| 8.4 | Binary Search template | `lo/hi` invariant, `mid` overflow safety, variations |
| 8.5 | BFS/DFS in Java | `Queue`/`Stack` vs recursion, visited sets, graph traversal |
| 8.6 | Dynamic Programming patterns | Memoization with `HashMap`, tabulation, state design |
| 8.7 | System Design coding: LRU Cache | `LinkedHashMap` trick vs manual doubly-linked list |
| 8.8 | System Design coding: Rate Limiter | Token bucket, sliding window counter — Java implementation |

---

## Lesson Content Template

Each lesson markdown file follows this structure:

```
# Lesson Title

## Why this matters in interviews
1-3 sentences on when interviewers ask about this and what they're testing.

## Concept
Explanation with diagrams (PlantUML or ASCII) where helpful.

## Key rules / gotchas
- Bullet list of things candidates get wrong

## Code example
```java
public class JavaLabRunner {
    public static void main(String[] args) {
        // Runnable demo — loads into Monaco editor
    }
}
```

## Interview questions you should be able to answer
- Q: ...
- Q: ...

## Further reading
- Link to relevant Java docs or Baeldung article
```
