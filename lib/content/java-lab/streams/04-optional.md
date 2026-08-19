# Optional — Null-Safe Programming

## Why this matters in interviews

`Optional` is a small API with a large amount of misuse in production codebases, and interviewers know it. Senior candidates are expected to know not just the happy-path methods (`map`, `orElse`) but also the precise rules about where `Optional` *should not* be used — as a field, as a parameter, inside a collection — and why those rules exist. More importantly, you should be able to articulate what `Optional` actually solves (explicit signaling of absent return values) versus what it does not solve (null safety in general), and identify the anti-patterns that make `Optional` code worse than the `null` checks it was meant to replace.

## Concept

### Purpose and Design Intent

`Optional<T>` is a *container* that either holds exactly one non-null value or holds nothing. Its sole design purpose — per Brian Goetz (Java language architect) — is to be used as a **method return type** to signal that a method may not have a result to return. It is not a general-purpose null-handling mechanism.

Before `Optional`:
```java
// Caller has no compile-time signal that null is possible
User findById(int id);   // returns null if not found — easy to forget
```

With `Optional`:
```java
// Absence is part of the contract — caller is forced to handle it
Optional<User> findById(int id);
```

The value is not null-safety enforcement (the JVM cannot enforce that) — it is *communication*: the method signature itself documents the possibility of absence.

### Creating an Optional

| Factory method | When to use | Throws if... |
|---|---|---|
| `Optional.of(value)` | You *know* value is non-null | value is null → `NullPointerException` immediately |
| `Optional.ofNullable(value)` | Value might be null | Never throws |
| `Optional.empty()` | You explicitly have no value | Never throws |

**Rule:** prefer `Optional.ofNullable` at boundaries where you receive data from external sources (database, API responses, legacy methods). Use `Optional.of` only when a null would be a programming error you want to surface immediately.

### Consuming an Optional

| Method | Behavior | When to use |
|---|---|---|
| `get()` | Returns value or throws `NoSuchElementException` | **Avoid** — always guard with `isPresent()` first, or use safer methods |
| `isPresent()` | Returns `true` if value present | Low-level; usually replaced by `ifPresent` or `map` |
| `isEmpty()` | Returns `true` if empty (Java 11+) | Useful in guards |
| `orElse(default)` | Returns value or the provided default | Default is **always evaluated** (even if not used) |
| `orElseGet(supplier)` | Returns value or calls supplier | Supplier called **only if empty** — prefer for expensive defaults |
| `orElseThrow(supplier)` | Returns value or throws | Explicit, descriptive exception for "this must be present" |
| `ifPresent(consumer)` | Calls consumer if present, no-op if empty | Replaces `if (isPresent()) { get() }` |
| `ifPresentOrElse(consumer, runnable)` | Consumer if present, else runnable (Java 9+) | Handles both branches explicitly |

### `orElse` vs `orElseGet` — A Performance Trap

```java
Optional<Config> opt = findConfig();

// WRONG if default is expensive: new Config() is ALWAYS constructed
opt.orElse(new Config("default"));

// RIGHT: supplier is only called when opt is empty
opt.orElseGet(() -> new Config("default"));
```

This distinction matters when the default involves a database call, network request, or complex object construction. For cheap defaults (string literals, `0`, `null`), `orElse` is fine.

### Transforming an Optional

| Method | Signature | Effect |
|---|---|---|
| `map(fn)` | `Optional<T> → Optional<U>` | Applies fn if present; wraps result in Optional; if fn returns null, result is `empty()` |
| `flatMap(fn)` | `Optional<T> → Optional<U>` where fn returns `Optional<U>` | Like map but unwraps one level — avoids `Optional<Optional<U>>` |
| `filter(pred)` | `Optional<T> → Optional<T>` | Returns empty if predicate is false or opt is empty |
| `stream()` | `Optional<T> → Stream<T>` (Java 9+) | 0- or 1-element stream; enables stream composition |
| `or(supplier)` | `Optional<T> → Optional<T>` (Java 9+) | Returns self if present, else supplier's Optional — chains fallback Optionals |

### `map` vs `flatMap`

`map` wraps the function's return value in an `Optional`:
```java
Optional<String> name = Optional.of("alice");
Optional<String> upper = name.map(String::toUpperCase);  // Optional["ALICE"]
```

If the mapping function itself returns an `Optional`, you get double-wrapping:
```java
Optional<Optional<String>> bad = name.map(this::findEmail);  // Optional[Optional["a@b.com"]]
```

`flatMap` unwraps one level automatically:
```java
Optional<String> email = name.flatMap(this::findEmail);  // Optional["a@b.com"]
```

### The `Optional.stream()` Integration (Java 9+)

`Optional::stream` is the key to filtering out absent values from a stream of optionals without an explicit `filter` + `map`:

```java
List<Optional<String>> maybeNames = ...;

// Before Java 9 — verbose
List<String> names = maybeNames.stream()
    .filter(Optional::isPresent)
    .map(Optional::get)
    .collect(toList());

// Java 9+ — idiomatic
List<String> names = maybeNames.stream()
    .flatMap(Optional::stream)
    .collect(toList());
```

### Where NOT to Use Optional

This is the most-tested topic at the senior level:

| Anti-pattern | Why it is wrong |
|---|---|
| **Optional as a field** | Adds serialization complexity, breaks JPA/Jackson without custom adapters, wastes heap (extra object per absent field). Use `null` internally; expose Optional only in the API. |
| **Optional as a method parameter** | Forces callers to wrap values: `findUser(Optional.of(id))` instead of `findUser(id)`. Use overloading or `@Nullable` instead. |
| **Optional in a Collection** | `List<Optional<T>>` instead of `List<T>` — the collection already models absence by not containing the element. |
| **`Optional.get()` without check** | Defeats the entire purpose; throws `NoSuchElementException` — worse than `NullPointerException` because it is harder to trace. |
| **`isPresent()` + `get()` pattern** | This is just null-checking with extra steps. Replace with `ifPresent`, `map`, or `orElse`. |
| **Returning `null` from `Optional`-returning method** | `return null` where return type is `Optional<T>` — callers will NPE when calling `.orElse()`. Always `return Optional.empty()`. |
| **Using `Optional` inside `Optional`** | Wrapping an `Optional`-returning function with `map` instead of `flatMap`. Use `flatMap` to flatten. |

### Optional vs `@Nullable`

`Optional` is a runtime container. `@Nullable` (JSR-305, JetBrains, or Jakarta) is a compile-time annotation for static analysis tools (IntelliJ inspections, SpotBugs, NullAway).

| | `Optional<T>` | `@Nullable T` |
|---|---|---|
| **Checked at** | Runtime | Compile time (static analysis) |
| **Performance** | Extra heap allocation | Zero overhead |
| **Serialization** | Requires custom handling | Transparent |
| **Best for** | Return types | Parameters, fields, internal methods |
| **Forces caller to handle** | Yes (API-enforced) | Only with strict tooling enabled |

A mature codebase uses both: `Optional` for public service/repository method return types, `@Nullable` on internal helpers and DTO fields.

## Key rules / gotchas

- **`orElse(default)` always evaluates the default expression:** even when the Optional is present. This causes unnecessary computation and, worse, unexpected side effects if the default has them.
- **`Optional.of(null)` throws immediately:** it is designed to surface programmer errors early. If you are not certain the value is non-null, always use `ofNullable`.
- **`map` returning null becomes `Optional.empty()`:** if your mapper function can return null, `map` handles it safely by converting it to `empty()`. `flatMap` does not — passing a function that returns null from `flatMap` throws `NullPointerException`.
- **`Optional` is not `Serializable`:** the class intentionally does not implement `Serializable`. Fields of type `Optional` will cause `NotSerializableException` when the containing object is serialized. This reinforces the rule against using it as a field.
- **`or(supplier)` is Java 9+:** it returns the Optional itself if present, or the result of calling the supplier — enabling readable fallback chains: `opt.or(this::fetchFromCache).or(this::fetchFromDB)`. In Java 8, this requires a `map`+`orElseGet` workaround.
- **`ifPresentOrElse` is Java 9+:** in Java 8, the equivalent requires a separate `if (opt.isPresent())` block. Know both forms for environments still on Java 8.
- **Empty `Optional` in `flatMap` short-circuits:** if the outer Optional is empty, the `flatMap` function is not called and the result is `empty()`. This is the same semantics as `map`.

## Code example

```java
import java.util.*;
import java.util.stream.*;

public class JavaLabRunner {
    record User(String name, String email) {}

    static Optional<User> findById(int id) {
        return id == 1 ? Optional.of(new User("Alice", "alice@example.com"))
                       : Optional.empty();
    }

    static Optional<String> getEmail(User user) {
        return Optional.ofNullable(user.email());
    }

    public static void main(String[] args) {
        // Creating Optional
        Optional<String> present = Optional.of("hello");
        Optional<String> empty   = Optional.empty();
        Optional<String> nullable = Optional.ofNullable(null); // safe

        // Consuming safely
        System.out.println("orElse:      " + empty.orElse("default"));
        System.out.println("orElseGet:   " + empty.orElseGet(() -> "computed"));
        present.ifPresent(v -> System.out.println("ifPresent:   " + v));
        present.ifPresentOrElse(
            v -> System.out.println("Present: " + v),
            () -> System.out.println("Empty")
        );

        // Transforming — map, flatMap
        Optional<Integer> length = present.map(String::length);
        System.out.println("map length:  " + length.orElse(0));

        // flatMap — avoid Optional<Optional<...>>
        Optional<String> email = findById(1).flatMap(JavaLabRunner::getEmail);
        System.out.println("flatMap email: " + email.orElse("no email"));

        // filter
        Optional<String> longName = present.filter(s -> s.length() > 3);
        System.out.println("filter:      " + longName.isPresent());

        // orElseThrow
        try {
            empty.orElseThrow(() -> new IllegalStateException("Not found"));
        } catch (IllegalStateException e) {
            System.out.println("orElseThrow: " + e.getMessage());
        }

        // Stream integration (Java 9+)
        List<Optional<String>> optionals = List.of(present, empty, Optional.of("world"));
        List<String> values = optionals.stream()
            .flatMap(Optional::stream) // filters out empties
            .toList();
        System.out.println("Stream flatMap: " + values);
    }
}
```

## Interview questions you should be able to answer

- **Q:** What is the stated design intent of `Optional`, and what problems does it *not* solve?
  > Brian Goetz has stated that `Optional` is designed solely as a return type for methods that may not return a result — a way to make the absence of a value part of the method's API contract so callers cannot accidentally ignore it. It does not solve null safety in general: it does not prevent null from being assigned to variables, passed as arguments, or stored in collections. It does not eliminate `NullPointerException` (you can call `Optional.get()` on an empty Optional and get `NoSuchElementException`, or return `null` from an `Optional`-typed method). It is a documentation and API design tool, not a safety mechanism.

- **Q:** Why should `Optional` not be used as a method parameter?
  > Using `Optional` as a parameter forces every caller to wrap their value: `service.find(Optional.of(id))` instead of `service.find(id)`. It provides no benefit over overloading or a `@Nullable` annotation, while making call sites more verbose. It also signals that the method has optional *behavior* based on whether the argument is present — which should be modeled with overloading (`find(int id)` vs `findAll()`). The JDK team (Goetz) has explicitly said Optional parameters were never the intended use case.

- **Q:** What is the difference between `orElse` and `orElseGet`, and when does the distinction matter?
  > `orElse(value)` evaluates its argument *eagerly* — the expression is computed before the method is even called, regardless of whether the Optional is present or empty. `orElseGet(supplier)` evaluates lazily — the supplier is only invoked when the Optional is empty. The distinction matters when the default is expensive (a database call, object construction, I/O). Using `orElse(dbCall())` means the DB is always hit even when the Optional has a value, which is both a performance problem and a side-effect problem. Prefer `orElseGet` for any non-trivial default.

- **Q:** Explain the difference between `map` and `flatMap` on an Optional. When do you get `Optional<Optional<T>>`?
  > `map(fn)` wraps the function's return value in an `Optional`. If the function itself returns an `Optional<T>`, the result of `map` is `Optional<Optional<T>>` — a double-wrapped type that most callers cannot use directly. `flatMap(fn)` expects the function to return `Optional<T>` and unwraps one level, resulting in `Optional<T>`. Any time you have a chain of operations where an intermediate function returns `Optional`, use `flatMap` rather than `map` to keep the type flat. Nested `Optional<Optional<...>>` in code is always a sign that `flatMap` should have been used.

- **Q:** What happens when you call `Optional.map` with a function that returns `null`?
  > `map` treats a `null` return from the mapping function the same as an absent value — it converts the result to `Optional.empty()`. This is a deliberate design choice: if your mapper might return null (e.g., a legacy method), `map` handles it gracefully. However, `flatMap` does *not* handle null — if the function passed to `flatMap` returns `null` (rather than `Optional.empty()`), `flatMap` throws a `NullPointerException`. This is because `flatMap` is defined to require a non-null `Optional<T>` as the return type of its function. In practice, functions passed to `flatMap` should always return `Optional.empty()` to signal absence.

- **Q:** How do you idiomatically filter empty Optionals out of a `List<Optional<T>>` in Java 9+?
  > Use `list.stream().flatMap(Optional::stream).collect(toList())`. `Optional::stream` returns a 0-or-1 element `Stream<T>` — empty if the Optional is empty, one-element otherwise. `flatMap` then flattens these micro-streams into a single stream containing only the present values. The pre-Java-9 equivalent is `.filter(Optional::isPresent).map(Optional::get)`, which works but is more verbose and calls `get()` — considered a mild anti-pattern even in guarded form. The `Optional::stream` approach is more composable and avoids `get()` entirely.

## Further reading

- [Optional (Java 21 API)](https://docs.oracle.com/en/java/docs/api/java.base/java/util/Optional.html)
- [Brian Goetz on Optional design intent (Stack Overflow)](https://stackoverflow.com/questions/26327957/should-java-8-getters-return-optional-type/26328555#26328555)
- [Tired of Null Pointer Exceptions? Consider Using Java SE 8's Optional (Oracle blog)](https://www.oracle.com/technical-resources/articles/java/java8-optional.html)
- [26 Reasons Why Using Optional Correctly Is Not Optional (DZone)](https://dzone.com/articles/using-optional-correctly-is-not-optional)
