# CompletableFuture & Async Composition

## Why this matters in interviews

`CompletableFuture` is the standard building block for non-blocking, asynchronous pipelines in modern Java services — it underpins Spring WebFlux integration, gRPC async stubs, and client-side HTTP parallelism. Senior interviewers test whether you can compose multiple async operations without blocking threads, handle errors without silently swallowing them, and choose the right operator (`thenApply` vs `thenCompose` vs `thenCombine`) for a given problem shape. Misuse of `CompletableFuture` (blocking inside async stages, shared mutable state, missing exception handlers) is one of the most common sources of latency regressions in Java microservices.

## Concept

### CompletableFuture vs Future

| Feature | `Future<T>` (Java 5) | `CompletableFuture<T>` (Java 8) |
|---|---|---|
| Get result | `get()` — always blocks | `get()`, `join()`, or non-blocking callbacks |
| Compose pipelines | Not possible | `thenApply`, `thenCompose`, `thenCombine`, etc. |
| Error handling | Check `ExecutionException` on `get()` | `exceptionally`, `handle`, `whenComplete` |
| Complete manually | No | `complete(T)`, `completeExceptionally(ex)` |
| Cancel | `cancel(true)` | `cancel(true)` (signals, but stages may not stop) |

`CompletableFuture` implements both `Future<T>` and `CompletionStage<T>`. The `CompletionStage` interface defines the composition operators.

### The Operator Map

```
 supplyAsync(Supplier)           — start async chain with a value
 runAsync(Runnable)              — start async chain with no value

 thenApply(Function)            — transform T → U (sync on completing thread)
 thenApplyAsync(Function)       — transform T → U (new thread from pool)

 thenCompose(Function→CF)       — flatMap: T → CompletableFuture<U>  (avoids nesting)
 thenCombine(CF, BiFunction)    — merge two independent futures: (T,U) → V

 thenAccept(Consumer)           — terminal: consume T, return CF<Void>
 thenRun(Runnable)              — terminal: run action, return CF<Void>

 allOf(CF...)                   — CF<Void> when ALL complete (use thenApply to collect)
 anyOf(CF...)                   — CF<Object> when ANY completes first

 exceptionally(Function<Throwable,T>)  — recover: exception → fallback value
 handle(BiFunction<T,Throwable,U>)     — always runs: transform result OR exception
 whenComplete(BiConsumer<T,Throwable>) — side-effect on completion; re-throws exception
```

### thenApply vs thenCompose

**thenApply** is for synchronous transformations — the function returns a plain value `U`:

```
CF<User>  --thenApply(user → user.getName())--> CF<String>
```

**thenCompose** is for async transformations — the function returns another `CompletableFuture<U>`. Without it you get nested futures:

```
// WRONG — produces CF<CF<Orders>>, then you need to unwrap
CF<User>  --thenApply(user → fetchOrdersAsync(user))--> CF<CF<Orders>>  ← awkward

// CORRECT — thenCompose "flattens" the nesting
CF<User>  --thenCompose(user → fetchOrdersAsync(user))--> CF<Orders>
```

This is directly analogous to `Stream.flatMap` vs `Stream.map`.

### Async vs Non-Async Variants

Every transformation has two forms:

```
thenApply(fn)       — fn runs on the completing thread (could be your caller thread!)
thenApplyAsync(fn)  — fn runs on ForkJoinPool.commonPool() (or supplied executor)
```

Using the non-async form is fine for cheap CPU transforms. For blocking operations (DB calls, HTTP) inside a stage, always use `thenApplyAsync(fn, myIOExecutor)` to avoid starving the thread that completed the upstream future.

### Error Handling Comparison

```
 exceptionally(ex → fallback)
   — only called on exception
   — returns T (must return same type)
   — swallows exception after recovery

 handle((result, ex) → newResult)
   — always called; one of result/ex is null
   — can transform type (T → U)
   — ideal for unified success+error transformation

 whenComplete((result, ex) -> sideEffect())
   — always called; cannot transform result
   — re-throws original exception downstream
   — use for logging, metrics, cleanup
```

### allOf and Collecting Results

`allOf` returns `CF<Void>` — you cannot directly collect results from it. The standard pattern:

```java
List<CompletableFuture<String>> futures = List.of(cf1, cf2, cf3);

CompletableFuture<List<String>> all = CompletableFuture
    .allOf(futures.toArray(new CompletableFuture[0]))
    .thenApply(v -> futures.stream()
        .map(CompletableFuture::join)   // join() is safe here — all are done
        .collect(Collectors.toList()));
```

### Custom Executor

Always provide an explicit executor for IO-bound async stages:

```java
ExecutorService ioPool = Executors.newFixedThreadPool(50);

CompletableFuture.supplyAsync(() -> callRemoteService(), ioPool)
    .thenApplyAsync(response -> parse(response), ioPool)
    .thenAccept(result -> saveToDb(result));
```

Without an explicit executor, `supplyAsync`/`thenApplyAsync` use `ForkJoinPool.commonPool()`, which is sized to `N_cpu - 1` and shared across the JVM — blocking IO there starves other tasks including parallel streams.

### Common Pitfalls

```
1. Blocking inside async stage
   thenApply(x -> jdbcQuery())       // blocks FJP thread — use thenApplyAsync + ioPool

2. Exception swallowing
   cf.thenApply(fn)                  // if fn throws, exception is captured in CF
   // caller never calls .get() → exception disappears silently
   // always attach .exceptionally() or log in whenComplete

3. Nested futures (missing thenCompose)
   thenApply(x -> supplyAsync(...))  // returns CF<CF<T>> — almost never what you want

4. Using join() outside allOf
   cf.join()                         // blocks current thread — defeats async purpose
   // only safe when you KNOW the CF is already complete

5. Shared mutable state in stages
   // stages may run on different threads — use atomic types or avoid shared state
```

## Key rules / gotchas

- **`thenApply` vs `thenCompose`:** `thenApply` is `map`, `thenCompose` is `flatMap`. If your lambda returns a `CompletableFuture`, use `thenCompose`; otherwise you get `CF<CF<T>>`.
- **Exception transparency:** An exception in any stage propagates to all downstream stages. Only `exceptionally` and `handle` can intercept it — `thenApply`/`thenAccept` are bypassed.
- **`whenComplete` does not suppress exceptions:** Unlike `exceptionally`, `whenComplete` re-throws the original exception after running the side-effect. Do not confuse it with error recovery.
- **`join()` throws unchecked, `get()` throws checked:** `join()` wraps exceptions in `CompletionException`; `get()` wraps them in `ExecutionException`. In lambda chains, `join()` is more convenient.
- **`anyOf` loses type safety:** Returns `CF<Object>`, not `CF<T>`, because the completing future could be any type.
- **`cancel()` is shallow:** Cancelling a `CompletableFuture` does not cancel its upstream stages — it only marks that CF as cancelled. Upstream computation continues unless you propagate cancellation manually.
- **commonPool blocking kills parallel streams:** `ForkJoinPool.commonPool()` is shared by `CompletableFuture` (when no executor given) and parallel streams. IO blocking in one starves the other. Always supply a dedicated IO executor.

## Code example

```java
import java.util.concurrent.*;
import java.util.List;

public class JavaLabRunner {
    static String fetchUser(int id) {
        return "User-" + id; // simulate DB call
    }

    static String fetchOrders(String user) {
        return user + ":orders[A,B,C]"; // simulate service call
    }

    public static void main(String[] args) throws Exception {
        // Basic async pipeline
        CompletableFuture<String> pipeline = CompletableFuture
            .supplyAsync(() -> fetchUser(42))
            .thenApply(user -> user.toUpperCase())
            .thenApply(user -> "Hello, " + user);

        System.out.println(pipeline.get());

        // thenCompose — async chaining (flatMap)
        CompletableFuture<String> composed = CompletableFuture
            .supplyAsync(() -> fetchUser(1))
            .thenCompose(user -> CompletableFuture.supplyAsync(() -> fetchOrders(user)));

        System.out.println("Composed: " + composed.get());

        // thenCombine — merge two independent futures
        CompletableFuture<String> f1 = CompletableFuture.supplyAsync(() -> "Hello");
        CompletableFuture<String> f2 = CompletableFuture.supplyAsync(() -> "World");
        String combined = f1.thenCombine(f2, (a, b) -> a + " " + b).get();
        System.out.println("Combined: " + combined);

        // allOf — wait for all
        CompletableFuture<Void> all = CompletableFuture.allOf(
            CompletableFuture.runAsync(() -> System.out.println("Task 1")),
            CompletableFuture.runAsync(() -> System.out.println("Task 2"))
        );
        all.get();

        // Error handling
        CompletableFuture<String> withError = CompletableFuture
            .<String>supplyAsync(() -> { throw new RuntimeException("fetch failed"); })
            .exceptionally(ex -> "fallback: " + ex.getMessage());

        System.out.println(withError.get());
    }
}
```

## Interview questions you should be able to answer

- **Q:** What is the difference between `thenApply` and `thenCompose`, and when does choosing the wrong one cause a compilation or logic error?
  > `thenApply(fn)` expects `fn: T → U` and wraps the result in a new `CompletableFuture<U>`. `thenCompose(fn)` expects `fn: T → CompletableFuture<U>` and "flattens" the returned future so the result is `CompletableFuture<U>`, not `CompletableFuture<CompletableFuture<U>>`. If you use `thenApply` with a function that returns a `CompletableFuture`, the compiler accepts it (no error) but you get a nested `CF<CF<U>>` — all subsequent operators operate on the inner CF as an opaque object rather than its eventual value, which is a logic bug.

- **Q:** An exception thrown inside a `thenApply` stage is not being caught by a `try/catch` around `cf.thenApply(fn)`. Why? How do you properly handle it?
  > `CompletableFuture` captures exceptions lazily — a stage that throws stores the exception in the `CompletableFuture` itself rather than propagating it immediately to the caller. The caller's `try/catch` around the chaining call (`thenApply(fn)`) sees no exception at that point because the lambda has not yet executed. The exception only surfaces when you call `.get()` or `.join()` (as `ExecutionException` / `CompletionException`). To handle it in-chain, append `.exceptionally(ex -> fallback)` or `.handle((result, ex) -> ...)` to the pipeline.

- **Q:** Why should you avoid using `ForkJoinPool.commonPool()` (the default) for IO-bound `supplyAsync` tasks?
  > `commonPool()` is sized to `Runtime.getRuntime().availableProcessors() - 1` threads and is shared across the entire JVM — parallel streams, `CompletableFuture` without explicit executors, and other ForkJoin tasks all compete for the same threads. Blocking IO in a stage pins a carrier thread, reducing effective parallelism for all users of the pool. For IO-bound tasks, supply a dedicated `ExecutorService` (e.g., a fixed or cached pool sized for IO concurrency) to `supplyAsync(supplier, myIoPool)` so blocking never starves CPU-bound work.

- **Q:** How do you collect results from `CompletableFuture.allOf()` given that it returns `CompletableFuture<Void>`?
  > `allOf` guarantees all futures are complete when the returned `CF<Void>` completes, but provides no mechanism to collect their values directly. The idiom is to hold a `List<CompletableFuture<T>>` of the individual futures, call `allOf(list.toArray(...))`, then chain `.thenApply(v -> list.stream().map(CompletableFuture::join).collect(toList()))`. Inside the `thenApply`, `.join()` is safe without blocking because `allOf` has already ensured completion.

- **Q:** What does `handle` give you that `exceptionally` does not?
  > `exceptionally` is only invoked when the stage completed exceptionally — it cannot see or transform a successful result. `handle(BiFunction<T, Throwable, U>)` is always invoked regardless of success or failure; exactly one of `T` (result) and `Throwable` will be non-null. It can also change the return type (T → U), making it useful for unified result/error transformation. Additionally, if the handler itself throws, the downstream sees the new exception, whereas `exceptionally` simply recovers to a fallback value.

- **Q:** You have three independent HTTP calls that each return `CompletableFuture<Response>`. You want to proceed as soon as the fastest one succeeds, but also log when each of the slower ones eventually finishes. How would you design this?
  > Use `anyOf` to get the first successful result: `CompletableFuture.anyOf(cf1, cf2, cf3).thenAccept(r -> process((Response) r))`. To log completion of the slower ones without blocking, attach a `whenComplete` side-effect to each individual future before passing them to `anyOf`: `cf1.whenComplete((r, ex) -> log("cf1 done", r, ex))`. The `whenComplete` does not interfere with the futures' values and runs on whatever thread completes each future, so all three complete independently and all are logged even though only the fastest is used for processing.

## Further reading

- Java 9 CompletableFuture enhancements (orTimeout, completeOnTimeout): https://openjdk.org/jeps/266
- "Modern Java in Action" — Urma, Fusco, Mycroft, Chapter 15-16 (CompletableFuture internals)
- Baeldung — Guide to CompletableFuture: https://www.baeldung.com/java-completablefuture
- JEP 428 — Structured Concurrency (Java 21 preview, successor pattern): https://openjdk.org/jeps/428
