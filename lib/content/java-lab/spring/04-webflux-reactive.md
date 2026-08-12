# Spring WebFlux & Reactive Streams

## Why this matters in interviews

WebFlux appears in every senior backend interview at companies running high-concurrency services. Interviewers want to know: when do you choose reactive over blocking MVC, what is backpressure, how do `Mono` and `Flux` compose, and what mistakes do developers make when mixing blocking and non-blocking code. Getting these right demonstrates architecture-level thinking beyond CRUD.

## Concept

### The problem WebFlux solves

Spring MVC uses a **thread-per-request** model. Under high concurrency (e.g., 10,000 simultaneous requests waiting for DB or HTTP responses), you need 10,000 threads — each consuming ~1MB stack. WebFlux uses an **event loop** (Netty) with a small fixed thread pool that handles all I/O via callbacks, scaling to the same load with tens of threads.

```
MVC (blocking):
  Thread 1: [req] ──────────────── waiting for DB ──────────────── [res]
  Thread 2: [req] ──────────────── waiting for DB ──────────────── [res]
  ... (10k threads for 10k requests)

WebFlux (non-blocking):
  EventLoop: [req1] → DB call → [handle req2] → [req1 response] → [req3] …
             (few threads, never blocked)
```

### Mono and Flux

- **`Mono<T>`** — 0 or 1 element (like `Optional` + `CompletableFuture`)
- **`Flux<T>`** — 0 to N elements (like a reactive `Stream`)

Both are **lazy** — nothing executes until a subscriber subscribes.

### Reactive Streams contract

The Reactive Streams spec defines four interfaces: `Publisher`, `Subscriber`, `Subscription`, `Processor`. Project Reactor (used by Spring WebFlux) implements this spec.

**Backpressure**: the subscriber controls how many elements it can handle. The publisher must respect this — it cannot overwhelm the subscriber.

```java
flux.limitRate(100)  // subscriber requests 100 elements at a time
```

### Key operators

| Operator | Purpose |
|----------|---------|
| `map` | Transform each element synchronously |
| `flatMap` | Transform each element into a Publisher, merge results concurrently |
| `concatMap` | Like `flatMap` but preserves order (sequential) |
| `filter` | Drop elements that don't match predicate |
| `zipWith` | Combine two publishers element-by-element |
| `onErrorResume` | Fallback on error |
| `retry(n)` | Retry on error up to n times |
| `timeout(Duration)` | Error if no element within duration |
| `subscribeOn` | Change the thread for subscription/source |
| `publishOn` | Change the thread for downstream operators |

### When NOT to use WebFlux

- Team is unfamiliar with reactive — debugging stack traces are harder
- Using a blocking driver (JDBC, many legacy libraries) — defeats the purpose
- Simple CRUD with low concurrency — MVC is simpler and equally fast
- Blocking code mixed into a reactive chain — blocks the event loop thread

## Key rules / gotchas

- **Never block inside a reactive chain.** Calling `Thread.sleep()`, `.block()`, or a blocking JDBC query inside a `flatMap` blocks the event loop thread and eliminates all scalability benefits.
- **`flatMap` is concurrent, `concatMap` is sequential.** Use `concatMap` when order of inner subscribers matters.
- **`Mono.block()` in production is an anti-pattern** — it blocks the calling thread until the value arrives. Acceptable only at the application boundary (e.g., in a `main` method for testing).
- **Cold vs Hot publishers**: `Mono`/`Flux` are cold by default — each subscription triggers a new execution. Hot publishers (e.g., `Sinks`) multicast to all subscribers.
- **`switchIfEmpty`** handles the empty case (`Mono` emitting no element) — the reactive equivalent of `Optional.orElseGet`.
- **Error propagation**: unhandled errors terminate the stream. Always add `onErrorResume` or `onErrorReturn` where failures are expected.

## Code example

```java
import java.util.*;
import java.util.concurrent.*;
import java.util.function.*;

// Simplified Mono/Flux simulation — no Project Reactor dependency needed.
public class JavaLabRunner {
    static class Mono<T> {
        private final Supplier<T> supplier;
        private Mono(Supplier<T> s) { this.supplier = s; }

        static <T> Mono<T> just(T value) { return new Mono<>(() -> value); }
        static <T> Mono<T> empty() { return new Mono<>(() -> null); }
        static <T> Mono<T> error(Exception e) {
            return new Mono<>(() -> { throw new RuntimeException(e); });
        }
        static <T> Mono<T> fromCallable(Callable<T> c) {
            return new Mono<>(() -> { try { return c.call(); } catch (Exception e) { throw new RuntimeException(e); } });
        }

        <R> Mono<R> map(Function<T, R> fn) {
            return new Mono<>(() -> { T v = supplier.get(); return v == null ? null : fn.apply(v); });
        }
        <R> Mono<R> flatMap(Function<T, Mono<R>> fn) {
            return new Mono<>(() -> { T v = supplier.get(); return v == null ? null : fn.apply(v).supplier.get(); });
        }
        Mono<T> doOnNext(Consumer<T> consumer) {
            return new Mono<>(() -> { T v = supplier.get(); if (v != null) consumer.accept(v); return v; });
        }
        Mono<T> switchIfEmpty(Mono<T> fallback) {
            return new Mono<>(() -> { T v = supplier.get(); return v != null ? v : fallback.supplier.get(); });
        }
        Mono<T> onErrorResume(Function<Throwable, Mono<T>> fn) {
            return new Mono<>(() -> { try { return supplier.get(); } catch (Exception e) { return fn.apply(e).supplier.get(); } });
        }
        T block() { return supplier.get(); }
        void subscribe(Consumer<T> onNext) { T v = supplier.get(); if (v != null) onNext.accept(v); }
    }

    // Simulated reactive repository
    static class UserRepository {
        private static final Map<Integer, String> DB = Map.of(1, "Alice", 2, "Bob");

        Mono<String> findById(int id) {
            return Mono.fromCallable(() -> DB.get(id));
        }
        Mono<String> findByIdOrError(int id) {
            return Mono.fromCallable(() -> {
                String u = DB.get(id);
                if (u == null) throw new RuntimeException("User " + id + " not found");
                return u;
            });
        }
    }

    public static void main(String[] args) {
        UserRepository repo = new UserRepository();

        // map + doOnNext
        System.out.println("=== map + doOnNext ===");
        repo.findById(1)
            .map(name -> "Hello, " + name)
            .doOnNext(msg -> System.out.println("Sending: " + msg))
            .subscribe(System.out::println);

        // flatMap chaining
        System.out.println("\n=== flatMap chain ===");
        String result = repo.findById(2)
            .flatMap(name -> Mono.just(name.toUpperCase()))
            .flatMap(name -> Mono.just("Welcome, " + name + "!"))
            .block();
        System.out.println(result);

        // switchIfEmpty (empty case)
        System.out.println("\n=== switchIfEmpty ===");
        repo.findById(99)
            .switchIfEmpty(Mono.just("Guest"))
            .subscribe(name -> System.out.println("User: " + name));

        // onErrorResume (error handling)
        System.out.println("\n=== onErrorResume ===");
        repo.findByIdOrError(99)
            .onErrorResume(e -> {
                System.out.println("Error: " + e.getMessage() + " — using fallback");
                return Mono.just("Fallback User");
            })
            .subscribe(System.out::println);
    }
}
```

## Interview questions you should be able to answer

- **Q:** When should you choose WebFlux over Spring MVC?
  > When your service has high concurrency with I/O-bound workloads (many simultaneous requests waiting on databases or external APIs), and you are using non-blocking drivers (R2DBC, reactive MongoDB, WebClient). For low-concurrency CRUD applications or teams unfamiliar with reactive, MVC is simpler and equally performant.

- **Q:** What is backpressure in reactive streams?
  > Backpressure is the subscriber's ability to signal to the publisher how many elements it can process. Without it, a fast publisher can overwhelm a slow subscriber (buffer overflow or OOM). Project Reactor handles this via `request(n)` in the `Subscription` — operators like `limitRate` control the request size.

- **Q:** What is the difference between `flatMap` and `concatMap`?
  > Both transform each element into an inner `Publisher`. `flatMap` subscribes to all inner publishers **concurrently** and merges results as they arrive (unordered). `concatMap` subscribes to them **sequentially** — it waits for each inner publisher to complete before subscribing to the next (ordered). Use `concatMap` when order matters or when inner publishers are not idempotent.

- **Q:** What happens if you call a blocking JDBC method inside a WebFlux `flatMap`?
  > It blocks the event loop thread. Since the event loop is shared by all concurrent requests, one blocked thread stops processing for many users — completely defeating the purpose of reactive. Use `Mono.fromCallable(...).subscribeOn(Schedulers.boundedElastic())` to offload blocking work to a separate thread pool.

- **Q:** What is the difference between `subscribeOn` and `publishOn`?
  > `subscribeOn` affects which thread the source/subscription runs on — it sets the thread for the entire upstream. `publishOn` affects which thread downstream operators run on — it switches threads mid-pipeline. You typically use `subscribeOn(Schedulers.boundedElastic())` for blocking I/O sources and `publishOn(Schedulers.parallel())` to move CPU work onto a parallel pool.

## Further reading

- [Spring WebFlux documentation](https://docs.spring.io/spring-framework/docs/current/reference/html/web-reactive.html)
- [Project Reactor reference](https://projectreactor.io/docs/core/release/reference/)
- [Baeldung: Introduction to Spring WebFlux](https://www.baeldung.com/spring-webflux)
