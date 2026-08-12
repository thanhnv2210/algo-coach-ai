# equals() & hashCode() Contract

## Why this matters in interviews

The equals/hashCode contract is one of the most frequently probed topics at Senior Java interviews. It underpins every HashMap, HashSet, and hash-based lookup. A broken implementation silently corrupts data — bugs that are trivial to describe but catastrophic in production. Interviewers use this topic to test whether you understand Java's object identity model and can reason about hash-based data structures.

## Concept

### The contract (from the Java spec)

**Rule 1 — Consistency with equality:**
If `a.equals(b)` is `true`, then `a.hashCode() == b.hashCode()` **must** be true.

**Rule 2 — Hash collision tolerance:**
If `a.hashCode() == b.hashCode()`, `a.equals(b)` **may** be false (collision is acceptable).

**Rule 3 — Reflexive:** `a.equals(a)` must be `true`.

**Rule 4 — Symmetric:** If `a.equals(b)` then `b.equals(a)`.

**Rule 5 — Transitive:** If `a.equals(b)` and `b.equals(c)`, then `a.equals(c)`.

**Rule 6 — Consistent:** Multiple calls return the same result as long as fields don't change.

**Rule 7 — null-safe:** `a.equals(null)` must return `false`, never throw NPE.

### What breaks when you violate Rule 1

```
Step 1: key1 = new BadKey(42)  →  hashCode() = System.identityHashCode(key1) = 7829
Step 2: map.put(key1, "hello")  →  stored in bucket 7829 % 16 = 5
Step 3: key2 = new BadKey(42)  →  hashCode() = System.identityHashCode(key2) = 2341
Step 4: map.get(key2)           →  looks in bucket 2341 % 16 = 13  →  not found!
```

### Implementation approaches

**Option 1 — `Objects.hash(field1, field2, ...)`** (recommended for most cases)

```java
@Override public int hashCode() {
    return Objects.hash(firstName, lastName, age);
}
```

**Option 2 — Manual prime multiplication** (fine-grained control)

```java
@Override public int hashCode() {
    int result = 17;
    result = 31 * result + (firstName != null ? firstName.hashCode() : 0);
    result = 31 * result + age;
    return result;
}
```

The prime 31 is used because multiplication by 31 can be optimised by the JVM as a bit shift: `31 * x == (x << 5) - x`.

**Option 3 — IDE / Lombok / Records** (production code)

Java 16+ `record` types auto-generate correct equals, hashCode, and toString from all components.

```java
record Employee(String name, int id) {}  // equals + hashCode generated
```

### equals implementation checklist

```java
@Override public boolean equals(Object o) {
    if (this == o) return true;          // 1. identity shortcut
    if (!(o instanceof MyClass)) return false; // 2. null + type check (pattern)
    MyClass other = (MyClass) o;
    return id == other.id                // 3. compare all significant fields
        && Objects.equals(name, other.name); // 4. null-safe for objects
}
```

## Key rules / gotchas

- **Always override both or neither.** Overriding `equals` without `hashCode` breaks HashMap/HashSet. Overriding `hashCode` without `equals` is harmless but misleading.
- **Include the same fields in both methods.** If `equals` uses `id` and `name`, hashCode must also use `id` and `name`.
- **Mutable fields as keys are dangerous.** If a field used in `hashCode` changes after the object is inserted into a HashMap, the map loses the entry (stored in the wrong bucket).
- **Use `instanceof` pattern matching** (Java 16+): `if (!(o instanceof MyClass other)) return false;` — combines check and cast.
- **`Objects.equals(a, b)`** handles null safely: returns `true` if both are null, `false` if one is null, otherwise `a.equals(b)`.
- **Don't use mutable collections as hashCode inputs** — their hash changes as elements are added.
- **`Arrays.equals` + `Arrays.hashCode`** must be used for array fields; plain `.equals()` on arrays tests reference equality.

## Code example

```java
import java.util.*;

public class JavaLabRunner {
    // ── WRONG: equals without hashCode ────────────────────────
    static class BadEmployee {
        int id; String name;
        BadEmployee(int id, String name) { this.id = id; this.name = name; }

        @Override public boolean equals(Object o) {
            return o instanceof BadEmployee e && e.id == id && Objects.equals(e.name, name);
        }
        // Missing hashCode → uses identity hash → different object = different bucket
    }

    // ── CORRECT: both fields in equals and hashCode ───────────
    static class Employee {
        int id; String name;
        Employee(int id, String name) { this.id = id; this.name = name; }

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Employee other)) return false;
            return id == other.id && Objects.equals(name, other.name);
        }

        @Override public int hashCode() { return Objects.hash(id, name); }

        @Override public String toString() { return "Employee(" + id + ", " + name + ")"; }
    }

    public static void main(String[] args) {
        // ── BadEmployee breaks HashMap ─────────────────────────
        Map<BadEmployee, String> badMap = new HashMap<>();
        BadEmployee bad1 = new BadEmployee(1, "Alice");
        badMap.put(bad1, "Engineering");
        BadEmployee bad2 = new BadEmployee(1, "Alice"); // logically equal
        System.out.println("BadEmployee lookup: " + badMap.get(bad2)); // null!
        System.out.println("BadEmployee size:   " + badMap.size());     // 2 (both stored!)

        // ── Employee works correctly ───────────────────────────
        Map<Employee, String> goodMap = new HashMap<>();
        Employee e1 = new Employee(1, "Alice");
        goodMap.put(e1, "Engineering");
        Employee e2 = new Employee(1, "Alice");
        System.out.println("\nEmployee lookup:  " + goodMap.get(e2));  // Engineering
        System.out.println("Employee size:    " + goodMap.size());      // 1

        // ── Contract verification ──────────────────────────────
        System.out.println("\nContract checks:");
        System.out.println("equals:          " + e1.equals(e2));           // true
        System.out.println("hashCode match:  " + (e1.hashCode() == e2.hashCode())); // true
        System.out.println("reflexive:       " + e1.equals(e1));           // true
        System.out.println("symmetric:       " + e2.equals(e1));           // true
        System.out.println("null-safe:       " + e1.equals(null));         // false

        // ── Arrays need special handling ───────────────────────
        int[] arr1 = {1, 2, 3};
        int[] arr2 = {1, 2, 3};
        System.out.println("\narray equals (wrong): " + arr1.equals(arr2));         // false!
        System.out.println("Arrays.equals (right): " + Arrays.equals(arr1, arr2)); // true

        // ── Record: auto-generates equals + hashCode ──────────
        record Point(int x, int y) {}
        Point p1 = new Point(3, 4);
        Point p2 = new Point(3, 4);
        System.out.println("\nRecord equals:    " + p1.equals(p2)); // true
        System.out.println("Record hashCode match: " + (p1.hashCode() == p2.hashCode())); // true

        // ── HashSet deduplication ──────────────────────────────
        Set<Employee> employees = new HashSet<>();
        employees.add(new Employee(1, "Alice"));
        employees.add(new Employee(1, "Alice")); // duplicate — rejected
        employees.add(new Employee(2, "Bob"));
        System.out.println("\nEmployee set size (should be 2): " + employees.size());
    }
}
```

## Interview questions you should be able to answer

- **Q:** What happens if you override `equals` but not `hashCode`?
  > Two "equal" objects get different hash codes (the default identity-based one), so they land in different HashMap buckets. `map.get(key)` returns `null` even though an equal key exists. `HashSet` stores both objects instead of deduplicating. This is the most common violation.

- **Q:** Can two objects have the same hashCode but fail `equals`?
  > Yes — this is a hash collision and is perfectly valid. The contract only requires that equal objects have equal hash codes, not the reverse. Good hash functions minimise collisions, but they're unavoidable.

- **Q:** Why is it dangerous to use a mutable object as a HashMap key?
  > If a field used in `hashCode` changes after insertion, the key's hash code changes. The map stored the entry in the old bucket; subsequent lookups compute the new hash and look in a different bucket — the entry is "lost." The map's integrity is violated.

- **Q:** How does Java's `record` help with the equals/hashCode contract?
  > Records automatically generate `equals`, `hashCode`, and `toString` using all component fields. The generated implementation is correct by construction and updates automatically if you add/remove components — eliminating an entire class of bugs.

- **Q:** How do you handle array fields in `hashCode`?
  > Use `Arrays.hashCode(arr)` for a 1D array or `Arrays.deepHashCode(arr)` for nested arrays. Plain `arr.hashCode()` returns the identity hash and violates the contract when two arrays with the same elements are considered equal.

## Further reading

- [Java Object.equals docs](https://docs.oracle.com/en/java/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object))
- [Effective Java, Item 11: Always override hashCode when you override equals](https://www.pearson.com/en-us/subject-catalog/p/effective-java/P200000000138)
- [Baeldung: Java equals() and hashCode() contracts](https://www.baeldung.com/java-equals-hashcode-contracts)
