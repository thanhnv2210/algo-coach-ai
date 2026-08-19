# synchronized & volatile

## Why this matters in interviews

`synchronized` and `volatile` are the two most primitive concurrency tools in Java, and they are also the most frequently misunderstood. Senior engineers are expected to know exactly which problem each one solves and, more importantly, which problems they do not solve. Interviewers regularly present a broken double-checked locking snippet or a "volatile counter" and ask you to find the bug — knowing the precise guarantees of both keywords is the only way to answer correctly.

## Concept

### Intrinsic Locks and the Monitor

Every Java object has a hidden intrinsic lock (also called a monitor). `synchronized` is syntactic sugar for acquiring and releasing that lock.

```
Object header (in heap)
┌────────────────────────────────────┐
│  mark word (hashCode, GC age, ...) │  <── also stores lock state
│  class pointer                     │
│  instance fields ...               │
└────────────────────────────────────┘

Mark word lock states (HotSpot):
  Unlocked        → 01 (biased or normal)
  Biased          → 01 (thread ID encoded, no CAS on uncontested path)
  Lightweight     → 00 (CAS spin — thin lock)
  Heavyweight     → 10 (OS mutex — inflated monitor)
  GC mark         → 11
```

When two threads contend for the same monitor, HotSpot inflates the lock to a heavyweight OS mutex. The losing thread enters the `_EntryList` of the monitor object and its state becomes BLOCKED. When the winner releases the lock, one thread from `_EntryList` is unblocked and tries to acquire again.

### synchronized Method vs. synchronized Block

```java
// 1. Synchronized instance method — locks on `this`
synchronized void increment() { count++; }

// 2. Synchronized block — locks on the specified object
void increment() {
    synchronized (this) { count++; }
}

// 3. Synchronized static method — locks on the Class object
static synchronized void staticIncrement() { count++; }

// 4. Synchronized block on a dedicated lock object (preferred)
private final Object lock = new Object();
void increment() {
    synchronized (lock) { count++; }
}
```

**Object lock vs. Class lock:**

| Lock target | What it protects |
|---|---|
| `this` or any instance | Instance state — two instances have independent locks |
| `MyClass.class` / `static synchronized` | Static (class-level) state — one lock for the entire class |

Mixing a `synchronized` instance method and a `static synchronized` method does NOT create mutual exclusion between them because they lock on different objects.

### Reentrancy

Intrinsic locks are reentrant: a thread that already holds a lock can re-acquire it without deadlocking. The JVM tracks a per-lock hold count.

```java
synchronized void outer() {
    inner(); // same thread, same lock — does NOT deadlock
}
synchronized void inner() { /* ... */ }
```

### volatile — Full Semantics

`volatile` inserts JVM memory barriers (translated to CPU fence instructions):

```
Non-volatile write:    store to cache / store buffer (may not reach RAM)
volatile write:        StoreStore barrier → store → StoreLoad barrier
                       forces the write past the store buffer to main memory
                       and prevents preceding stores from being reordered after it

Non-volatile read:     may read from local cache / register
volatile read:         LoadLoad barrier → load → LoadStore barrier
                       forces a fresh load from main memory
                       prevents subsequent loads from being reordered before it
```

**volatile guarantees (precise):**
1. **Visibility:** A write to `volatile x` by thread A is visible to any thread B that subsequently reads `volatile x`.
2. **Ordering (happens-before):** Write HB read, and all writes before the volatile write are also visible after the volatile read (transitivity). This is stronger than visibility alone — it piggybacks all prior writes.
3. **64-bit atomicity:** Reads and writes of `volatile long` and `volatile double` are atomic (no torn values).

**volatile does NOT guarantee:** compound-action atomicity. `i++` compiles to read-modify-write — even if `i` is volatile, two threads can interleave between the read and write steps.

### The Race Condition

```
volatile int i = 0;

Timeline (two threads, one CPU):
  T1: GETFIELD  i  → reads 0
  T2: GETFIELD  i  → reads 0   (T2 runs before T1 writes)
  T1: IADD          → 0+1 = 1
  T1: PUTFIELD  i  → writes 1
  T2: IADD          → 0+1 = 1
  T2: PUTFIELD  i  → writes 1  ← LOST UPDATE, expected 2
```

Solution: use `AtomicInteger.incrementAndGet()` or wrap in `synchronized`.

### Double-Checked Locking — The Classic Bug

```java
// BROKEN without volatile (pre-Java 5 or without volatile)
class Singleton {
    private static Singleton instance;

    static Singleton getInstance() {
        if (instance == null) {           // check 1 — no lock
            synchronized (Singleton.class) {
                if (instance == null) {   // check 2 — with lock
                    instance = new Singleton(); // PROBLEM HERE
                }
            }
        }
        return instance;
    }
}
```

`new Singleton()` is not atomic. The JVM can reorder the steps:
```
Normal order:               Reordered (allowed by JMM):
1. allocate memory          1. allocate memory
2. call constructor         2. write reference to instance  ← instance != null too early
3. write ref to instance    3. call constructor
```

Thread B passes check 1 (sees non-null instance), skips the lock, and returns a partially-constructed object.

**Fix:** declare `instance` as `volatile`.

```java
private static volatile Singleton instance; // volatile prevents reordering
```

The volatile write (step 3) cannot be reordered before the constructor completes (step 2), so any thread that sees `instance != null` is guaranteed to see a fully constructed object.

### When to Use volatile vs. synchronized

| Criterion | volatile | synchronized |
|---|---|---|
| Visibility of single field | Yes | Yes |
| Atomicity of compound action (i++) | No | Yes |
| Mutual exclusion / critical section | No | Yes |
| Multiple variables must be consistent | No | Yes |
| Performance (uncontested) | Very low overhead | Low overhead (biased lock) |
| Performance (contended) | Very low overhead | OS mutex, context switch |

**Use volatile when:** a single boolean flag is written by one thread and read by others (stop signal), or a reference is published once and never mutated (safe publication).

**Use synchronized when:** multiple threads read AND write, or the update involves more than one variable that must stay consistent.

## Key rules / gotchas

- **synchronized does not make every read/write atomic:** Only the entire synchronized block is an atomic unit. The lock prevents interleaving with other synchronized blocks on the same monitor, but unprotected reads outside `synchronized` see no guarantees.
- **volatile i++ is still broken:** The most common interview trap. `volatile` does not add atomicity to increment. Use `AtomicInteger` instead.
- **Double-checked locking requires volatile:** Without `volatile`, the JIT and CPU can reorder constructor execution past the reference store, publishing a partially-initialized object.
- **Lock on the right object:** Synchronizing on a local variable (e.g., `synchronized (new Object())`) provides zero protection — each thread gets its own lock object.
- **Intrinsic locks are not interruptible:** A thread BLOCKED on `synchronized` cannot be interrupted. `ReentrantLock.lockInterruptibly()` can be.
- **volatile does not batch writes:** If you need consistency across two related fields (`x` and `y` must be read together), `volatile` on each is not enough — use `synchronized` or an immutable holder object published via `volatile`.
- **synchronized provides both visibility and mutual exclusion:** Unlike `volatile`, releasing a `synchronized` block flushes all writes to main memory (the monitor-unlock HB rule covers all previous writes, not just the locked field).

## Code example

```java
public class JavaLabRunner {
    // Race condition: NOT thread-safe
    static int unsafeCounter = 0;

    // Thread-safe with synchronized
    static int safeCounter = 0;
    static synchronized void increment() { safeCounter++; }

    // volatile for visibility — still NOT atomic for i++
    static volatile boolean flag = false;

    public static void main(String[] args) throws InterruptedException {
        // Demo synchronized
        Thread[] threads = new Thread[10];
        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    unsafeCounter++;  // race condition!
                    increment();      // safe
                }
            });
            threads[i].start();
        }
        for (Thread t : threads) t.join();

        System.out.println("Expected:  10000");
        System.out.println("Safe:      " + safeCounter);
        System.out.println("Unsafe:    " + unsafeCounter + " (likely wrong)");

        // volatile flag for stop signal
        Thread worker = new Thread(() -> {
            while (!flag) { /* spin */ }
            System.out.println("Worker saw flag=true");
        });
        worker.start();
        Thread.sleep(5);
        flag = true;
        worker.join();
    }
}
```

## Interview questions you should be able to answer

- **Q:** What is the difference between a synchronized method and a synchronized block on `this`? Are they equivalent?
  > Semantically they lock the same monitor (`this`) and provide the same visibility and mutual-exclusion guarantees. The practical difference is granularity: a synchronized block can lock only the critical section, reducing contention. A synchronized method also exposes the lock (callers can synchronize on the instance externally), whereas a block on a private lock object hides the locking strategy. Prefer a private final lock object for encapsulation.

- **Q:** Explain exactly why double-checked locking is broken without `volatile`, at the bytecode/JMM level.
  > `new Singleton()` compiles to three conceptual steps: allocate memory, invoke the constructor, and store the reference. The JMM permits reordering steps 2 and 3 — the reference can be written before the constructor runs. Thread B reading `instance` outside the `synchronized` block can observe the non-null reference and use a partially-constructed object. Adding `volatile` to `instance` inserts a StoreStore barrier before the store, preventing the constructor from being reordered after the reference write.

- **Q:** Can two threads calling different `synchronized` methods on the same object execute concurrently?
  > No. All `synchronized` instance methods on the same object lock on `this`. Only one thread can hold the intrinsic lock at a time, so any two synchronized methods on the same instance are mutually exclusive, even if they operate on completely different fields.

- **Q:** A `static synchronized` method and a regular `synchronized` instance method exist on the same class. Can they run concurrently?
  > Yes. The static method locks on the `Class` object (`MyClass.class`), while the instance method locks on `this`. These are two distinct monitors, so they do not provide mutual exclusion with respect to each other. If both protect shared state, you must synchronize on the same lock for both.

- **Q:** Why is `volatile` insufficient for a read-modify-write operation like `counter++`, even though each individual read and write is atomic?
  > Atomicity of individual reads and writes does not compose. `counter++` requires reading the current value, adding 1, and writing back — three operations. `volatile` only ensures each read sees the latest written value; it provides no mechanism to prevent two threads from each reading the same value before either writes back. The update from one thread is invisible to the other until after the write, by which point the other thread's stale read has already been used to compute a result.

- **Q:** What happens at the hardware level when you release a `synchronized` block?
  > The JVM emits a StoreLoad memory barrier (or equivalent) corresponding to the monitor-unlock HB rule. On x86, this is often handled implicitly by the lock-prefixed instruction used for the CAS in the monitor release. On ARM/PowerPC, an explicit `dmb` (data memory barrier) instruction is emitted. This flushes all pending store-buffer writes to the cache coherence layer (L3 / main memory), ensuring that any thread that subsequently acquires the same monitor will see all writes made inside the block.

## Further reading

- "Java Concurrency in Practice" — Goetz et al., Chapters 2–3 (thread safety, sharing objects)
- JLS §17.4 — Memory Model: https://docs.oracle.com/javase/specs/jls/se17/html/jls-17.html#jls-17.4
- "The Java Memory Model" by Jeremy Manson and Brian Goetz (2004): http://www.cs.umd.edu/~pugh/java/memoryModel/
- HotSpot lock implementation (biased/thin/fat): https://wiki.openjdk.org/display/HotSpot/Synchronization
