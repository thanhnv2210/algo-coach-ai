# Array In-Place Manipulation — Two-Pointer Pattern

> The most common array interview category: rearrange elements in-place without extra allocation.
> Move zeros, remove duplicates, partition by condition — all solved with the same mental model.

---

## The Problem: Move All Zeros to the Right

```
Input:  [0, 1, 2, 3, 0, 0]
Output: [1, 2, 3, 0, 0, 0]   ← non-zeros preserve relative order; zeros pushed to end
```

---

## Why the Intuitive Loop Is Buggy

```java
// YOUR FIRST INSTINCT — swap current with next when zero found
for (int i = 0; i < array.length; i++) {
    if (array[i] == 0) {
        array[i]   = array[i + 1];  // BUG 1: ArrayIndexOutOfBoundsException when i = length-1
        array[i+1] = 0;
    }
}
// BUG 2: [0, 0, 1] → after i=0: [0, 1, 0] → after i=1: [1, 0, 0] ✓
//         but [1, 0, 0, 2] → after i=1: [1, 0, 0, 2] → i=2: [1, 0, 2, 0]
//         — skips checking i=1 again after the swap
//         One pass of bubble-right doesn't move a zero past multiple positions.
// BUG 3: Multiple consecutive zeros require multiple passes — O(n²) worst case.
```

**The root cause:** Bubbling requires a second pass over the same element after a swap. Your loop moves on to `i+1` without rechecking `i`.

---

## The Correct Mental Model: Two-Pointer Write

```
[0, 1, 2, 3, 0, 0]
 ↑
writePos = 0   (where the next non-zero should land)

scan i=0: 0      → skip
scan i=1: 1 ≠ 0  → arr[writePos++] = 1   → writePos=1
scan i=2: 2 ≠ 0  → arr[writePos++] = 2   → writePos=2
scan i=3: 3 ≠ 0  → arr[writePos++] = 3   → writePos=3
scan i=4: 0      → skip
scan i=5: 0      → skip

Fill arr[3..5] with 0

Result: [1, 2, 3, 0, 0, 0]  ✓
```

**Key insight:** `writePos` is always ≤ `i`. Writing to `arr[writePos]` never clobbers an unread element.

---

## Solution 1 — Two-Pointer (in-place, O(n) time, O(1) space)

```java
// CANONICAL answer for any "partition array in-place" problem
public static void moveZerosRight(int[] arr) {
    int writePos = 0;                        // next slot for a non-zero

    // Pass 1: compact non-zeros to the front
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] != 0) {
            arr[writePos++] = arr[i];
        }
    }

    // Pass 2: fill the tail with zeros
    while (writePos < arr.length) {
        arr[writePos++] = 0;
    }
}

// Test
int[] arr = {0, 1, 2, 3, 0, 0};
moveZerosRight(arr);
System.out.println(Arrays.toString(arr)); // [1, 2, 3, 0, 0, 0]
```

**Why this works:** Two-pointer separates "reading" (index `i`) from "writing" (`writePos`). The write pointer only advances when a non-zero is written, so zeros are implicitly left behind.

---

## Solution 2 — Two-Pointer with Swap (preserves order, fewer writes)

```java
// Swap variant: non-zero at i swaps with writePos
// Advantage: zero slots are filled in-place, no second pass needed
// Same O(n) / O(1) — slightly fewer total writes when zeros are sparse
public static void moveZerosSwap(int[] arr) {
    int writePos = 0;
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] != 0) {
            int tmp        = arr[writePos];
            arr[writePos]  = arr[i];
            arr[i]         = tmp;
            writePos++;
        }
    }
}
```

---

## Solution 3 — Stream (clean, but NOT in-place — allocates new array)

```java
// Stream approach: partition then concat
// Use when immutability is fine; explain the trade-off in interviews
int[] arr = {0, 1, 2, 3, 0, 0};

int[] result = IntStream.concat(
    Arrays.stream(arr).filter(n -> n != 0),   // non-zeros first
    Arrays.stream(arr).filter(n -> n == 0)    // zeros appended
).toArray();

System.out.println(Arrays.toString(result)); // [1, 2, 3, 0, 0, 0]

// With a List<Integer> (Collections.partitioningBy):
List<Integer> list = List.of(0, 1, 2, 3, 0, 0);
Map<Boolean, List<Integer>> parts = list.stream()
    .collect(Collectors.partitioningBy(n -> n != 0));

List<Integer> moved = Stream.concat(
    parts.get(true).stream(),    // non-zeros (partition key = true)
    parts.get(false).stream()    // zeros
).collect(Collectors.toList());

System.out.println(moved); // [1, 2, 3, 0, 0, 0]
```

**Trade-off to state in the interview:**
- Stream: `O(n)` extra space — allocates a new array/list
- Two-pointer: `O(1)` extra space — modifies in place

---

## The General Pattern: Partition In-Place

Move-zeros is a specific case of a universal pattern: **partition an array by a condition, keeping relative order**.

```java
// Generic two-pointer partition
// "move all elements matching condition to the end"
public static <T> void partitionToEnd(List<T> list, Predicate<T> moveToEnd) {
    int writePos = 0;
    List<T> copy = new ArrayList<>(list);   // need a copy for the read pass
    for (T item : copy) {
        if (!moveToEnd.test(item)) list.set(writePos++, item);
    }
    for (T item : copy) {
        if (moveToEnd.test(item)) list.set(writePos++, item);
    }
}

// Same pattern solves:
//   • Move all zeros to end           → condition: n == 0
//   • Move all negatives to end       → condition: n < 0
//   • Move all evens to front         → condition: n % 2 != 0 (move odds to end)
//   • Move nulls to end               → condition: obj == null
//   • Dutch national flag (3-way)     → see below
```

---

## Extension: Dutch National Flag (3-way partition)

```java
// Sort array of 0s, 1s, 2s in one pass — O(n) / O(1)
// Generalizes to any 3-bucket partition (low / mid / high)
public static void dutchFlag(int[] arr) {
    int low = 0, mid = 0, high = arr.length - 1;

    while (mid <= high) {
        if (arr[mid] == 0) {
            swap(arr, low++, mid++);   // 0: send to front
        } else if (arr[mid] == 1) {
            mid++;                     // 1: already in place
        } else {
            swap(arr, mid, high--);    // 2: send to back (don't advance mid — recheck)
        }
    }
}

private static void swap(int[] arr, int i, int j) {
    int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
}

// Test: [2, 0, 1, 2, 1, 0] → [0, 0, 1, 1, 2, 2]
int[] flag = {2, 0, 1, 2, 1, 0};
dutchFlag(flag);
System.out.println(Arrays.toString(flag)); // [0, 0, 1, 1, 2, 2]
```

---

## Interview Talking Points

**When asked "move zeros to the right":**

1. **Clarify** — _"Should relative order of non-zeros be preserved? In-place or new array OK?"_

2. **State your approach** — _"I'll use a two-pointer write pattern: one pointer scans for non-zeros, a write pointer tracks where to place them. Single pass O(n), O(1) space."_

3. **Flag the naive bug** — _"The intuitive bubble swap — swapping zero with next element — has two problems: off-by-one on the last index, and one pass isn't enough if a zero needs to travel past multiple positions. It degrades to O(n²)."_

4. **Offer the stream variant** — _"With streams, `IntStream.concat(filter non-zero, filter zero).toArray()` is clean, but it allocates O(n) extra space. I'd use streams if the caller expects a new array; two-pointer if in-place is required."_

5. **Generalize** — _"This pattern — write pointer plus scan pointer — solves the whole class: move negatives to end, remove duplicates in sorted array, partition by any predicate. Dutch national flag extends it to three buckets in one pass."_

---

## Comparison Table

| Approach | Time | Space | In-place | Preserves order |
|----------|------|-------|----------|-----------------|
| Naive bubble swap (your loop) | O(n²) worst | O(1) | Yes | Yes (buggy) |
| Two-pointer write | O(n) | O(1) | Yes | Yes |
| Two-pointer swap | O(n) | O(1) | Yes | Yes |
| Stream concat | O(n) | O(n) | No | Yes |
| `Collections.partitioningBy` | O(n) | O(n) | No | Yes |
| Dutch flag (3-way) | O(n) | O(1) | Yes | No (within buckets) |

---

## Operator Vocabulary for This Pattern

```
Stream approach:
  filter(n != 0)              → keep non-zeros
  filter(n == 0)              → keep zeros
  IntStream.concat(a, b)      → concatenate two IntStreams
  .toArray()                  → terminate to int[]
  partitioningBy(pred)        → Map<Boolean, List<T>>: true=matches, false=doesn't

Two-pointer:
  writePos tracks the "frontier" — always ≤ scan index
  Non-zero found → write to arr[writePos], advance both
  Zero found     → advance scan only; writePos stays
  After scan     → fill arr[writePos..length-1] with zeros (write variant)
                   OR zeros already in place (swap variant)
```
