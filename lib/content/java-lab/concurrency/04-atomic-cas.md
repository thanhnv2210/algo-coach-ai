# Atomic Variables & CAS (Compare-And-Swap)

## Why this matters in interviews

Lock-free programming is a senior-level topic because it requires understanding hardware primitives that most developers never need to touch directly. Interviewers at companies with high-throughput systems ask about CAS, the ABA problem, and `LongAdder` because the answers reveal whether you can reason about concurrency at the instruction level — not just at the API level. Getting the ABA explanation right (and knowing why it matters in practice) is a reliable signal of real concurrent systems experience.

## Concept

### The Hardware Foundation: CAS

Compare-And-Swap is a single CPU instruction (`CMPXCHG` on x86, `LDREX`/`STREX` or `CAS` on ARM) that atomically performs:

```
CAS(address, expected, update):
  if *address == expected:
      *address = update
      return true     // success
  else:
      return false    // value changed; caller must retry
```

This is atomic at the hardware level — no other core can observe an intermediate state. The JVM exposes this via `sun.misc.Unsafe.compareAndSwapInt()` (internal) and through the public `java.util.concurrent.atomic` package.

### AtomicInteger Operations

```
AtomicInteger (internally: volatile int value)

Operation              Equivalent (non-atomic)      Returns
─────────────────────  ───────────────────────────  ───────────────────
get()                  return value                 current value
set(v)                 value = v                    void
getAndSet(v)           old = value; value = v       old value
getAndIncrement()      old = value; value++          old value (pre-increment)
incrementAndGet()      value++; return value         new value (post-increment)
getAndAdd(delta)       old = value; value += delta   old value
addAndGet(delta)       value += delta; return value  new value
compareAndSet(exp, v)  if value==exp: value=v       true if swap happened
```

All of these ultimately compile to a CAS loop for the read-modify-write operations:

```java
// How getAndIncrement() is implemented internally:
int getAndIncrement() {
    for (;;) {                             // spin until success
        int current = get();               // volatile read
        int next = current + 1;
        if (compareAndSet(current, next))  // CAS — atomic
            return current;
        // CAS failed: another thread changed value; retry
    }
}
```

Under low contention this loop almost always succeeds on the first try. Under high contention, threads spin and retry, burning CPU. This is where `LongAdder` shines.

### The ABA Problem

CAS checks only the value at an address, not whether the value changed and changed back. Consider:

```
Initial state: ref → Node_A (value = "A")

Thread 1 reads: expected = Node_A
Thread 1 is suspended.

Thread 2 removes Node_A, processes it.
Thread 2 adds new Node_B, then adds Node_A back.
State: ref → Node_A (same address, but A was removed and re-inserted)

Thread 1 resumes.
Thread 1 CAS(ref, Node_A, Node_C) → SUCCESS (value matches!)
Thread 1 thinks nothing changed, but the list was structurally modified.
Node_B is now orphaned (leaked).
```

**ABA is a real bug in lock-free linked list implementations** (pop/push). The JDK provides `AtomicStampedReference<V>` (pairs value with an int version stamp) and `AtomicMarkableReference<V>` (pairs value with a boolean) to prevent it.

```java
// ABA-safe reference:
AtomicStampedReference<Node> ref = new AtomicStampedReference<>(nodeA, 0);

int[] stampHolder = new int[1];
Node current = ref.get(stampHolder);     // reads value AND stamp atomically
int stamp = stampHolder[0];

// CAS only succeeds if both value AND stamp match:
ref.compareAndSet(current, newNode, stamp, stamp + 1);
```

In practice, ABA manifests most often in lock-free stacks and queues. For most application-level code using `AtomicReference` for single-field updates (e.g., publishing a cache value), ABA is not a concern because you don't care about intermediate states.

### LongAdder vs. AtomicLong — High-Contention Counters

`AtomicLong` uses a single shared `long`. Under high contention, all threads CAS on the same word, causing cache-line bouncing:

```
CPU 0 ──writes─► cache line (value=100)
CPU 1 ──reads──► sees stale 99 in its cache, CAS fails, retries
CPU 2 ──reads──► sees stale 99, CAS fails, retries
                  ↑ cache coherence traffic dominates
```

`LongAdder` uses a striped cell array. Each thread maps to a cell; threads increment different cells, eliminating contention:

```
LongAdder internal layout:

  base (long)       ← low-contention path: CAS here first
  cells[] (Cell[])  ← high-contention path: one cell per "stripe"
    [0] Cell{value=342}
    [1] Cell{value=891}
    [2] Cell{value=214}
    [3] Cell{value=553}

sum() = base + cells[0] + cells[1] + cells[2] + cells[3]  ← traversal, not atomic!
```

**Trade-off:**

| | AtomicLong | LongAdder |
|---|---|---|
| Low contention | Fast (single CAS) | Fast (CAS on base) |
| High contention | Slow (CAS retries, cache ping-pong) | Fast (stripes eliminate contention) |
| Exact snapshot | `get()` is atomic | `sum()` is NOT atomic — races with increment |
| Memory | 1 long | base + array (more) |

Use `LongAdder` for counters/accumulators that are only read at the end (metrics, statistics). Use `AtomicLong` when you need a consistent snapshot (`get()`) — e.g., an ID generator.

### AtomicReference and CAS on Objects

```java
AtomicReference<T> ref = new AtomicReference<>(initial);

// Atomic conditional update:
T current = ref.get();
T updated = transform(current);
boolean success = ref.compareAndSet(current, updated);
```

`compareAndSet` uses reference equality (`==`), not `.equals()`. If another thread replaced the reference with a new object (even one equal by value), the CAS will fail — which is usually what you want.

**`updateAndGet` / `accumulateAndGet` (Java 8+):** Higher-level CAS loops that accept a function:

```java
// Atomically set ref to the larger of its current value and newValue:
atomicMax.accumulateAndGet(newValue, Math::max);
```

### Lock-Free Data Structures

The canonical lock-free stack (Treiber stack):

```
push(x):
  Node n = new Node(x);
  do {
    n.next = top.get();     // read current top
  } while (!top.compareAndSet(n.next, n));  // CAS: if top unchanged, make n new top

pop():
  Node n;
  do {
    n = top.get();
    if (n == null) return null;   // empty
  } while (!top.compareAndSet(n, n.next));   // CAS: remove n from top
  return n.value;
```

This is correct for `AtomicReference` semantics but vulnerable to ABA (the popped node can be re-pushed). `AtomicStampedReference` fixes it. The JDK's `ConcurrentLinkedQueue` uses a variant of the Michael-Scott queue algorithm built on CAS.

### When Atomics Beat synchronized

- **Single-field updates:** `AtomicInteger.incrementAndGet()` avoids any lock, reducing latency when there is no other shared state to protect.
- **Non-blocking algorithms:** CAS enables progress guarantees — at least one thread always makes progress, even if others are delayed (lock-free). `synchronized` can cause all threads to block if the holder is suspended.
- **Counter-only workloads:** `LongAdder` under high concurrency is dramatically faster than `synchronized int`.

**Do NOT use atomics when:** you need to update more than one variable atomically, or the update logic is complex. Compose multiple atomic variables is not atomic as a whole. Use `synchronized` or a lock in those cases.

## Key rules / gotchas

- **CAS is not magic:** Under extreme contention, the retry loop in `AtomicInteger` degrades to O(N) for N threads, worse than a mutex that queues threads. `LongAdder` is the fix, not more CAS.
- **ABA is silent:** The CAS succeeds and returns true — there is no exception or error. Bugs from ABA are typically data-structure corruption (leaked nodes, skipped elements) that only surfaces under load.
- **LongAdder.sum() is not atomic:** A concurrent increment may be in-flight during `sum()`, so the result can be stale. Never use `LongAdder` where you need a precise consistent read.
- **AtomicReference uses == not equals:** Two different object instances with the same content are not the same reference. `compareAndSet` will fail even if `.equals()` would return true.
- **VarHandle (Java 9+) supersedes Unsafe:** `VarHandle` provides typed access to fields with acquire/release/CAS semantics and is the modern replacement for `sun.misc.Unsafe` in library code. `AtomicInteger` itself was refactored to use `VarHandle` internally in Java 9.
- **AtomicFieldUpdater for existing classes:** If you cannot change an existing class to wrap a field in `AtomicInteger`, use `AtomicIntegerFieldUpdater` to add atomic operations to an existing `volatile int` field without changing the class layout.

## Code example

```java
import java.util.concurrent.atomic.*;

public class JavaLabRunner {
    static AtomicInteger atomicCounter = new AtomicInteger(0);
    static LongAdder adder = new LongAdder(); // better for high contention

    public static void main(String[] args) throws InterruptedException {
        // AtomicInteger operations
        System.out.println("get: " + atomicCounter.get());
        System.out.println("getAndIncrement: " + atomicCounter.getAndIncrement()); // 0
        System.out.println("incrementAndGet: " + atomicCounter.incrementAndGet()); // 2
        System.out.println("addAndGet(10): " + atomicCounter.addAndGet(10));       // 12

        // CAS: compareAndSet(expected, update)
        boolean success = atomicCounter.compareAndSet(12, 100);
        System.out.println("CAS(12->100): " + success + ", value: " + atomicCounter.get());

        boolean fail = atomicCounter.compareAndSet(12, 200); // 12 != 100, fails
        System.out.println("CAS(12->200): " + fail + ", value: " + atomicCounter.get());

        // AtomicReference for object CAS
        AtomicReference<String> ref = new AtomicReference<>("hello");
        ref.compareAndSet("hello", "world");
        System.out.println("AtomicReference: " + ref.get());

        // LongAdder — faster under high contention (stripes internally)
        Thread[] threads = new Thread[10];
        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 1000; j++) adder.increment();
            });
            threads[i].start();
        }
        for (Thread t : threads) t.join();
        System.out.println("LongAdder sum: " + adder.sum()); // 10000
    }
}
```

## Interview questions you should be able to answer

- **Q:** Explain what CAS is at the hardware level and why it does not require a mutex.
  > CAS is a single atomic CPU instruction (`CMPXCHG` on x86) that reads a memory location, compares it to an expected value, and writes a new value only if the comparison succeeds — all without interruption. No other core can observe an intermediate state because the memory bus is locked for the duration of the instruction. This eliminates the need for an OS-level mutex: threads compete by retrying the instruction, rather than blocking and being descheduled.

- **Q:** Describe the ABA problem, give a concrete example, and explain how `AtomicStampedReference` prevents it.
  > ABA: Thread 1 reads value A and is then paused. Thread 2 changes the value from A to B, then back to A. Thread 1 resumes, its CAS succeeds (sees A as expected), but the value has been changed twice — meaning intermediate side effects (like a node being removed from a list) are invisible. `AtomicStampedReference` pairs the reference with an integer stamp (version counter). CAS requires both the reference and the stamp to match; incrementing the stamp on each update ensures that even if the reference returns to A, the stamp is different, causing the CAS to fail.

- **Q:** Why is `LongAdder` faster than `AtomicLong` under high contention, and what does it sacrifice?
  > `LongAdder` maintains a `base` value plus an array of `Cell` objects. Under contention, threads are hashed to individual cells and increment them independently, eliminating cache-line contention between threads. `AtomicLong` has all threads CAS-ing the same cache line, causing repeated cache invalidation across CPUs. The sacrifice is that `sum()` traverses the base and all cells at a point in time, which is not atomic — concurrent increments may be in-flight, so `sum()` can return a value that was never a true instantaneous count.

- **Q:** What is the difference between `getAndIncrement()` and `incrementAndGet()` on `AtomicInteger`?
  > Both atomically increment the value by 1. `getAndIncrement()` returns the value before the increment (post-fix `i++` semantics). `incrementAndGet()` returns the value after the increment (prefix `++i` semantics). Choosing the wrong one is a subtle bug — for example, using `getAndIncrement()` as a unique-ID generator starting from 0 correctly yields IDs 0, 1, 2...; using `incrementAndGet()` yields 1, 2, 3..., skipping 0.

- **Q:** `AtomicReference.compareAndSet` uses `==` for comparison. Why, and what bug can this cause?
  > `compareAndSet` compares by identity because it is checking whether the memory location still holds the exact same object reference, not an equivalent object. This is the semantically correct check for lock-free algorithms: you want to know if the reference was replaced by another thread, even by an equal object. The bug: if you create a new `String` that is equal to the old one and try to CAS it in as the expected value, the CAS fails even though the strings are equal. For `String` specifically, this can be surprising because of constant pool interning. Always use the exact same reference object (stored in a local variable before the CAS loop) as the expected value.

- **Q:** When should you prefer `synchronized` over `AtomicInteger`, even for a simple counter?
  > When the counter is updated as part of a larger atomic operation involving other state. For example, if you need to atomically increment a counter AND add an element to a list (the counter reflecting the list size), you cannot use `AtomicInteger` alone because the two operations are not atomic together. You need `synchronized` (or a lock) to make both updates appear atomic. Atomics solve single-variable CAS; `synchronized` solves multi-variable consistency.

## Further reading

- "Java Concurrency in Practice" — Goetz et al., Chapter 15 (Atomic Variables and Nonblocking Synchronization)
- `java.util.concurrent.atomic` package Javadoc: https://docs.oracle.com/en/java/docs/api/java.base/java/util/concurrent/atomic/package-summary.html
- "The Art of Multiprocessor Programming" — Herlihy & Shavit, Chapter 10 (Concurrent Queues and the ABA Problem)
- Doug Lea's `LongAdder` design notes: https://docs.oracle.com/en/java/docs/api/java.base/java/util/concurrent/atomic/LongAdder.html
- VarHandle API (Java 9+) — modern replacement for Unsafe: https://docs.oracle.com/en/java/docs/api/java.base/java/lang/invoke/VarHandle.html
