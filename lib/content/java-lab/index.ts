export interface JavaLesson {
  slug: string;
  title: string;
  order: number;
  defaultCode: string;
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  tags: string[];
}

export interface JavaCategory {
  slug: string;
  title: string;
  icon: string;
  description: string;
  lessons: JavaLesson[];
}

export const JAVA_CURRICULUM: JavaCategory[] = [
  {
    slug: 'core-java',
    title: 'Core Java & OOP',
    icon: 'Code2',
    description: 'Object model, inheritance, SOLID, generics, and immutability.',
    lessons: [
      {
        slug: '01-object-model',
        title: 'Object Model & Memory Layout',
        order: 1,
        difficulty: 'foundational',
        tags: ['heap', 'stack', 'references', 'primitives'],
        defaultCode: `public class JavaLabRunner {
    public static void main(String[] args) {
        // Stack: primitives and references live here
        int x = 42;
        String s = "hello"; // reference on stack, object on heap

        // Object on heap
        StringBuilder sb = new StringBuilder("world");

        System.out.println("x = " + x);
        System.out.println("s = " + s);
        System.out.println("sb = " + sb);

        // Wrapper boxing
        Integer boxed = x; // autoboxing → heap allocation
        System.out.println("boxed == 42: " + (boxed == 42)); // unboxing comparison
    }
}`,
      },
      {
        slug: '02-core-java-glossary',
        title: 'Core Java & OOP Terminology — Interview Reference',
        order: 2,
        difficulty: 'intermediate',
        tags: ['glossary', 'OOP', 'SOLID', 'generics', 'immutability', 'exceptions', 'String', 'interview-common'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    // Immutable class pattern
    static final class Money {
        private final int amount;
        private final String currency;
        Money(int amount, String currency) {
            this.amount = amount;
            this.currency = new String(currency); // defensive copy
        }
        public int getAmount() { return amount; }
        public String getCurrency() { return new String(currency); }
    }

    // Polymorphism / dynamic dispatch
    static abstract class Shape { abstract double area(); }
    static class Circle extends Shape {
        double r;
        Circle(double r) { this.r = r; }
        @Override public double area() { return Math.PI * r * r; }
    }
    static class Rectangle extends Shape {
        double w, h;
        Rectangle(double w, double h) { this.w = w; this.h = h; }
        @Override public double area() { return w * h; }
    }

    // PECS: Producer Extends, Consumer Super
    static double sumList(List<? extends Number> list) {
        return list.stream().mapToDouble(Number::doubleValue).sum();
    }

    // try-with-resources
    static class Resource implements AutoCloseable {
        Resource() { System.out.println("Resource opened"); }
        public void close() { System.out.println("Resource closed"); }
    }

    public static void main(String[] args) {
        // Dynamic dispatch — runtime decides which area() to call
        List<Shape> shapes = List.of(new Circle(3), new Rectangle(4, 5));
        shapes.forEach(s -> System.out.printf("%s area: %.2f%n",
            s.getClass().getSimpleName(), s.area()));

        // Generics PECS
        List<Integer> ints = List.of(1, 2, 3, 4, 5);
        System.out.println("Sum: " + sumList(ints));

        // Immutable class
        Money m = new Money(100, "USD");
        System.out.println("Money: " + m.getAmount() + " " + m.getCurrency());

        // try-with-resources — close() called automatically
        try (Resource r = new Resource()) {
            System.out.println("Using resource");
        }

        // String pool
        String s1 = "hello";
        String s2 = "hello";
        String s3 = new String("hello");
        System.out.println("s1 == s2 (pool): " + (s1 == s2));       // true
        System.out.println("s1 == s3 (heap): " + (s1 == s3));       // false
        System.out.println("s1.equals(s3):   " + s1.equals(s3));    // true
    }
}`,
      },
    ],
  },
  {
    slug: 'collections',
    title: 'Collections & Data Structures',
    icon: 'Database',
    description: 'ArrayList, HashMap internals, TreeMap, Sets, Deque, PriorityQueue, and contracts.',
    lessons: [
      {
        slug: '01-arraylist-vs-linkedlist',
        title: 'ArrayList vs LinkedList',
        order: 1,
        difficulty: 'foundational',
        tags: ['ArrayList', 'LinkedList', 'Big-O', 'iterator', 'interview-common'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        List<Integer> arrayList = new ArrayList<>();
        List<Integer> linkedList = new LinkedList<>();

        // Fill both
        for (int i = 0; i < 5; i++) {
            arrayList.add(i);
            linkedList.add(i);
        }

        // Random access — O(1) vs O(n)
        System.out.println("ArrayList get(2): " + arrayList.get(2));
        System.out.println("LinkedList get(2): " + linkedList.get(2));

        // Insert at head — O(n) vs O(1)
        arrayList.add(0, 99);
        linkedList.add(0, 99);

        System.out.println("ArrayList after head insert: " + arrayList);
        System.out.println("LinkedList after head insert: " + linkedList);

        // Iterator removal (safe pattern)
        Iterator<Integer> it = arrayList.iterator();
        while (it.hasNext()) {
            if (it.next() % 2 == 0) it.remove();
        }
        System.out.println("ArrayList after removing evens: " + arrayList);
    }
}`,
      },
      {
        slug: '02-hashmap-internals',
        title: 'HashMap Internals',
        order: 2,
        difficulty: 'intermediate',
        tags: ['HashMap', 'hash-collision', 'load-factor', 'tree-bins', 'interview-common'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        // Default capacity 16, load factor 0.75
        Map<String, Integer> map = new HashMap<>();

        map.put("apple", 3);
        map.put("banana", 5);
        map.put("cherry", 2);

        // get is O(1) average
        System.out.println("apple: " + map.get("apple"));

        // putIfAbsent / getOrDefault
        map.putIfAbsent("apple", 99); // won't overwrite
        System.out.println("apple after putIfAbsent: " + map.get("apple"));
        System.out.println("mango (default): " + map.getOrDefault("mango", 0));

        // Iteration order is NOT guaranteed
        System.out.println("Iteration order (undefined):");
        for (Map.Entry<String, Integer> e : map.entrySet()) {
            System.out.println("  " + e.getKey() + " -> " + e.getValue());
        }

        // Frequency counting pattern (interview staple)
        String sentence = "hello world hello java";
        Map<String, Integer> freq = new HashMap<>();
        for (String word : sentence.split(" ")) {
            freq.merge(word, 1, Integer::sum);
        }
        System.out.println("\\nWord frequencies: " + freq);
    }
}`,
      },
      {
        slug: '03-linkedhashmap-treemap',
        title: 'LinkedHashMap & TreeMap',
        order: 3,
        difficulty: 'intermediate',
        tags: ['LinkedHashMap', 'TreeMap', 'NavigableMap', 'insertion-order', 'sorted'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        // LinkedHashMap: insertion-order preserved
        Map<String, Integer> linked = new LinkedHashMap<>();
        linked.put("banana", 2);
        linked.put("apple", 1);
        linked.put("cherry", 3);
        System.out.println("LinkedHashMap (insertion order): " + linked);

        // LRU cache trick: accessOrder=true
        Map<String, Integer> lru = new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, Integer> eldest) {
                return size() > 3;
            }
        };
        lru.put("a", 1);
        lru.put("b", 2);
        lru.put("c", 3);
        lru.get("a"); // mark 'a' as recently used
        lru.put("d", 4); // evicts 'b' (least recently used)
        System.out.println("LRU cache after eviction: " + lru);

        // TreeMap: sorted by key (red-black tree), O(log n)
        TreeMap<String, Integer> tree = new TreeMap<>();
        tree.put("banana", 2);
        tree.put("apple", 1);
        tree.put("cherry", 3);
        System.out.println("\\nTreeMap (sorted): " + tree);
        System.out.println("First key: " + tree.firstKey());
        System.out.println("Last key: " + tree.lastKey());
        System.out.println("Floor of 'avocado': " + tree.floorKey("avocado"));
        System.out.println("Ceiling of 'avocado': " + tree.ceilingKey("avocado"));

        // subMap — NavigableMap usage
        System.out.println("Keys from 'apple' to 'cherry' (exclusive): " + tree.subMap("apple", "cherry"));
    }
}`,
      },
      {
        slug: '04-hashset-treeset',
        title: 'HashSet, LinkedHashSet & TreeSet',
        order: 4,
        difficulty: 'foundational',
        tags: ['HashSet', 'TreeSet', 'equals', 'hashCode', 'Set-contract'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    static class Point {
        int x, y;
        Point(int x, int y) { this.x = x; this.y = y; }

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Point)) return false;
            Point p = (Point) o;
            return x == p.x && y == p.y;
        }

        @Override public int hashCode() {
            return Objects.hash(x, y);
        }

        @Override public String toString() { return "(" + x + "," + y + ")"; }
    }

    public static void main(String[] args) {
        Set<Integer> set = new HashSet<>(Arrays.asList(3, 1, 4, 1, 5, 9, 2, 6));
        System.out.println("HashSet (no duplicates, unordered): " + set);

        Set<Integer> linked = new LinkedHashSet<>(Arrays.asList(3, 1, 4, 1, 5, 9, 2, 6));
        System.out.println("LinkedHashSet (insertion order): " + linked);

        Set<Integer> tree = new TreeSet<>(Arrays.asList(3, 1, 4, 1, 5, 9, 2, 6));
        System.out.println("TreeSet (sorted, no duplicates): " + tree);

        // Custom objects require equals + hashCode
        Set<Point> points = new HashSet<>();
        points.add(new Point(1, 2));
        points.add(new Point(1, 2)); // duplicate — should not be added
        System.out.println("\\nPoints set size (should be 1): " + points.size());
    }
}`,
      },
      {
        slug: '05-arraydeque',
        title: 'ArrayDeque vs Stack & Queue',
        order: 5,
        difficulty: 'foundational',
        tags: ['ArrayDeque', 'Deque', 'Stack', 'Queue', 'interview-common'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        // ArrayDeque as Stack (LIFO) — prefer over java.util.Stack
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(1);
        stack.push(2);
        stack.push(3);
        System.out.println("Stack peek: " + stack.peek());
        System.out.println("Stack pop: " + stack.pop());
        System.out.println("Stack after pop: " + stack);

        // ArrayDeque as Queue (FIFO) — prefer over LinkedList
        Queue<Integer> queue = new ArrayDeque<>();
        queue.offer(1);
        queue.offer(2);
        queue.offer(3);
        System.out.println("\\nQueue peek: " + queue.peek());
        System.out.println("Queue poll: " + queue.poll());
        System.out.println("Queue after poll: " + queue);

        // Monotonic stack example — next greater element
        int[] nums = {2, 1, 2, 4, 3};
        int[] result = new int[nums.length];
        Deque<Integer> mono = new ArrayDeque<>();
        for (int i = nums.length - 1; i >= 0; i--) {
            while (!mono.isEmpty() && mono.peek() <= nums[i]) mono.pop();
            result[i] = mono.isEmpty() ? -1 : mono.peek();
            mono.push(nums[i]);
        }
        System.out.println("\\nNext greater element: " + Arrays.toString(result));
    }
}`,
      },
      {
        slug: '06-priorityqueue',
        title: 'PriorityQueue & Comparator',
        order: 6,
        difficulty: 'intermediate',
        tags: ['PriorityQueue', 'min-heap', 'max-heap', 'Comparator', 'interview-common'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        // Min-heap (default)
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        minHeap.offer(5);
        minHeap.offer(1);
        minHeap.offer(3);
        System.out.println("Min-heap poll order: " + minHeap.poll() + ", " + minHeap.poll() + ", " + minHeap.poll());

        // Max-heap using reverse order
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        maxHeap.offer(5);
        maxHeap.offer(1);
        maxHeap.offer(3);
        System.out.println("Max-heap poll order: " + maxHeap.poll() + ", " + maxHeap.poll() + ", " + maxHeap.poll());

        // Top-K smallest elements
        int[] nums = {3, 1, 4, 1, 5, 9, 2, 6};
        int k = 3;
        PriorityQueue<Integer> topK = new PriorityQueue<>(Comparator.reverseOrder()); // max-heap of size k
        for (int n : nums) {
            topK.offer(n);
            if (topK.size() > k) topK.poll(); // evict largest
        }
        System.out.println("\\nTop-" + k + " smallest: " + topK);

        // Custom comparator — sort tasks by priority then name
        record Task(String name, int priority) {}
        PriorityQueue<Task> tasks = new PriorityQueue<>(
            Comparator.comparingInt(Task::priority).thenComparing(Task::name)
        );
        tasks.offer(new Task("Deploy", 2));
        tasks.offer(new Task("Fix bug", 1));
        tasks.offer(new Task("Review PR", 1));
        System.out.println("\\nTasks by priority:");
        while (!tasks.isEmpty()) System.out.println("  " + tasks.poll());
    }
}`,
      },
      {
        slug: '07-collections-utils',
        title: 'Collections Utility Methods',
        order: 7,
        difficulty: 'foundational',
        tags: ['Collections', 'sort', 'binarySearch', 'unmodifiableList', 'synchronizedList'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>(Arrays.asList(5, 2, 8, 1, 9, 3));

        // sort
        Collections.sort(list);
        System.out.println("Sorted: " + list);

        // binarySearch — list must be sorted first
        int idx = Collections.binarySearch(list, 8);
        System.out.println("Index of 8: " + idx);

        // min / max
        System.out.println("Min: " + Collections.min(list));
        System.out.println("Max: " + Collections.max(list));

        // reverse / shuffle
        Collections.reverse(list);
        System.out.println("Reversed: " + list);

        // unmodifiable view — throws on mutation
        List<Integer> immutable = Collections.unmodifiableList(list);
        System.out.println("Immutable view: " + immutable);
        try {
            immutable.add(99);
        } catch (UnsupportedOperationException e) {
            System.out.println("Cannot mutate unmodifiable list: " + e.getClass().getSimpleName());
        }

        // frequency & disjoint
        List<String> words = Arrays.asList("a", "b", "a", "c", "a");
        System.out.println("\\nFrequency of 'a': " + Collections.frequency(words, "a"));

        List<String> other = Arrays.asList("x", "y");
        System.out.println("Disjoint: " + Collections.disjoint(words, other));
    }
}`,
      },
      {
        slug: '08-equals-hashcode',
        title: 'equals() & hashCode() Contract',
        order: 8,
        difficulty: 'intermediate',
        tags: ['equals', 'hashCode', 'contract', 'Objects', 'interview-common'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    // WRONG: only overrides equals — breaks HashMap/HashSet
    static class BadKey {
        int id;
        BadKey(int id) { this.id = id; }

        @Override public boolean equals(Object o) {
            return o instanceof BadKey b && b.id == this.id;
        }
        // hashCode NOT overridden → uses identity hash → different bucket each time!
    }

    // CORRECT: both equals and hashCode use same fields
    static class GoodKey {
        int id;
        GoodKey(int id) { this.id = id; }

        @Override public boolean equals(Object o) {
            return o instanceof GoodKey g && g.id == this.id;
        }

        @Override public int hashCode() {
            return Objects.hash(id);
        }
    }

    public static void main(String[] args) {
        // BadKey breaks HashMap
        Map<BadKey, String> badMap = new HashMap<>();
        badMap.put(new BadKey(1), "hello");
        System.out.println("BadKey lookup: " + badMap.get(new BadKey(1))); // null! different hash

        // GoodKey works correctly
        Map<GoodKey, String> goodMap = new HashMap<>();
        goodMap.put(new GoodKey(1), "hello");
        System.out.println("GoodKey lookup: " + goodMap.get(new GoodKey(1))); // "hello"

        // Contract rules:
        // 1. If a.equals(b) then a.hashCode() == b.hashCode() (MUST)
        // 2. If a.hashCode() == b.hashCode(), a.equals(b) MAY be false (collision ok)
        // 3. equals must be reflexive, symmetric, transitive, consistent
        GoodKey k1 = new GoodKey(1);
        GoodKey k2 = new GoodKey(1);
        System.out.println("\\nequals: " + k1.equals(k2));
        System.out.println("same hashCode: " + (k1.hashCode() == k2.hashCode()));
    }
}`,
      },
      {
        slug: '10-big-data-collection-patterns',
        title: 'Big Data Collection Patterns — Mistakes vs Best Practices',
        order: 10,
        difficulty: 'advanced',
        tags: ['memory-efficiency', 'lazy-loading', 'streaming', 'pagination', 'WeakHashMap', 'computeIfAbsent', 'interview-common'],
        defaultCode: `import java.util.*;
import java.util.stream.*;
import java.lang.ref.*;

public class JavaLabRunner {

    // ── MISTAKE 1: Materialise everything into a List before filtering ──────
    static List<Integer> mistakeEagerLoad(int[] data) {
        List<Integer> all = new ArrayList<>();
        for (int d : data) all.add(d);               // copies entire dataset into heap
        return all.stream().filter(x -> x % 2 == 0).collect(Collectors.toList()); // another copy
    }

    // ── BEST PRACTICE 1: Stream lazily — never materialise the full set ─────
    static long bestLazyCount(int[] data) {
        return Arrays.stream(data)                    // primitive IntStream — zero boxing
                     .filter(x -> x % 2 == 0)        // lazy: only runs on terminal op
                     .count();                        // terminal — pulls just enough
    }

    // ── MISTAKE 2: Load all pages at once ───────────────────────────────────
    static List<String> mistakeLoadAll(List<String> db) {
        return new ArrayList<>(db);  // copies entire table into memory
    }

    // ── BEST PRACTICE 2: Paginate — only load what the caller needs ─────────
    static List<String> bestPaginate(List<String> db, int page, int size) {
        int from = page * size;
        if (from >= db.size()) return List.of();
        int to = Math.min(from + size, db.size());
        return db.subList(from, to);                  // view, not a copy
    }

    // ── MISTAKE 3: get+put instead of computeIfAbsent ───────────────────────
    static void mistakeGrouping(List<String> words, Map<Character, List<String>> index) {
        for (String w : words) {
            char key = w.charAt(0);
            if (!index.containsKey(key)) index.put(key, new ArrayList<>()); // two lookups
            index.get(key).add(w);                                           // third lookup
        }
    }

    // ── BEST PRACTICE 3: computeIfAbsent — single lookup, atomic ───────────
    static void bestGrouping(List<String> words, Map<Character, List<String>> index) {
        for (String w : words)
            index.computeIfAbsent(w.charAt(0), k -> new ArrayList<>()).add(w); // one lookup
    }

    // ── MISTAKE 4: Use HashMap as a cache without eviction → memory leak ────
    static final Map<String, byte[]> mistakeCache = new HashMap<>();

    // ── BEST PRACTICE 4: WeakHashMap — GC can evict entries under pressure ──
    static final Map<String, byte[]> bestCache = new WeakHashMap<>();

    public static void main(String[] args) {
        int[] million = IntStream.rangeClosed(1, 1_000_000).toArray();

        // Mistake 1 vs Best Practice 1
        long t0 = System.nanoTime();
        List<Integer> eager = mistakeEagerLoad(million); // 2× allocations
        long t1 = System.nanoTime();
        long lazyCount = bestLazyCount(million);          // zero extra allocation
        long t2 = System.nanoTime();
        System.out.printf("Eager (2 allocs): %d evens in %,dns%n", eager.size(), t1 - t0);
        System.out.printf("Lazy  (0 allocs): %d evens in %,dns%n", lazyCount,   t2 - t1);

        // Mistake 2 vs Best Practice 2
        List<String> db = IntStream.rangeClosed(1, 10_000)
                                   .mapToObj(i -> "row-" + i)
                                   .collect(Collectors.toList());
        List<String> page = bestPaginate(db, 3, 20); // only rows 60-79
        System.out.println("Page 3 (20/page): " + page.get(0) + " … " + page.get(page.size()-1));

        // Mistake 3 vs Best Practice 3
        List<String> words = List.of("apple","avocado","banana","blueberry","cherry");
        Map<Character, List<String>> idx1 = new HashMap<>(), idx2 = new HashMap<>();
        mistakeGrouping(new ArrayList<>(words), idx1);
        bestGrouping(new ArrayList<>(words), idx2);
        System.out.println("Grouping (mistake):  " + idx1);
        System.out.println("Grouping (best):     " + idx2);
        System.out.println("Results equal: " + idx1.equals(idx2));
    }
}`,
      },
      {
        slug: '09-collections-glossary',
        title: 'Collections Terminology — Interview Reference',
        order: 9,
        difficulty: 'intermediate',
        tags: ['glossary', 'HashMap', 'hashCode', 'equals', 'Iterator', 'Comparator', 'complexity', 'interview-common'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    record Point(int x, int y) {} // records auto-generate equals/hashCode

    public static void main(String[] args) {
        // Fail-fast iterator — correct removal pattern
        List<Integer> list = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
        Iterator<Integer> it = list.iterator();
        while (it.hasNext()) {
            if (it.next() % 2 == 0) it.remove(); // safe
        }
        System.out.println("After removal: " + list); // [1, 3, 5]

        // HashMap pre-sizing to avoid rehash
        Map<String, Integer> map = new HashMap<>((int)(1000 / 0.75) + 1);
        map.put("key", 42);
        System.out.println("Pre-sized map, no resize for 1000 entries");

        // TreeMap: sorted, no null keys
        TreeMap<String, Integer> tree = new TreeMap<>();
        tree.put("banana", 2); tree.put("apple", 1); tree.put("cherry", 3);
        System.out.println("TreeMap (sorted): " + tree);
        System.out.println("Ceiling of 'avocado': " + tree.ceilingKey("avocado")); // banana

        // equals/hashCode contract with records
        Set<Point> points = new HashSet<>();
        points.add(new Point(1, 2));
        points.add(new Point(1, 2)); // duplicate — records compare by value
        System.out.println("Set size (should be 1): " + points.size());

        // List.of — truly immutable
        List<String> immutable = List.of("a", "b", "c");
        try {
            immutable.add("d");
        } catch (UnsupportedOperationException e) {
            System.out.println("List.of is immutable: " + e.getClass().getSimpleName());
        }

        // PriorityQueue — only poll() gives priority order
        PriorityQueue<Integer> pq = new PriorityQueue<>(List.of(5, 1, 3, 2, 4));
        System.out.print("PriorityQueue poll order: ");
        while (!pq.isEmpty()) System.out.print(pq.poll() + " "); // 1 2 3 4 5
        System.out.println();
    }
}`,
      },
    ],
  },
  {
    slug: 'streams',
    title: 'Functional Java & Streams',
    icon: 'Zap',
    description: 'Lambdas, stream pipelines, collectors, Optional, and parallel streams.',
    lessons: [
      {
        slug: '01-lambda-basics',
        title: 'Lambda Expressions',
        order: 1,
        difficulty: 'foundational',
        tags: ['lambda', 'functional-interface', 'method-reference'],
        defaultCode: `import java.util.*;
import java.util.function.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        // Lambda as Runnable
        Runnable r = () -> System.out.println("Running!");
        r.run();

        // Lambda as Comparator
        List<String> names = new ArrayList<>(Arrays.asList("Charlie", "Alice", "Bob"));
        names.sort((a, b) -> a.compareTo(b));
        System.out.println("Sorted: " + names);

        // Method reference
        names.forEach(System.out::println);

        // Predicate composition
        Predicate<String> longName = s -> s.length() > 4;
        Predicate<String> startsWithA = s -> s.startsWith("A");
        names.stream()
             .filter(longName.and(startsWithA.negate()))
             .forEach(s -> System.out.println("Match: " + s));
    }
}`,
      },
      {
        slug: '02-stream-pipeline',
        title: 'Stream Pipeline & Lazy Evaluation',
        order: 2,
        difficulty: 'intermediate',
        tags: ['Stream', 'filter', 'map', 'reduce', 'flatMap', 'lazy', 'IntStream', 'interview-common'],
        defaultCode: `import java.util.*;
import java.util.stream.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // filter → map → collect
        List<Integer> result = numbers.stream()
            .filter(n -> n % 2 == 0)
            .map(n -> n * n)
            .collect(Collectors.toList());
        System.out.println("Even squares: " + result);

        // Short-circuit
        Optional<Integer> first = numbers.stream()
            .filter(n -> n > 5)
            .findFirst();
        System.out.println("First > 5: " + first.orElse(-1));

        // Primitive stream — avoids boxing
        int sum = IntStream.rangeClosed(1, 10).sum();
        System.out.println("Sum 1-10: " + sum);

        // reduce
        int product = numbers.stream().reduce(1, (a, b) -> a * b);
        System.out.println("Product: " + product);

        // flatMap
        List<List<Integer>> nested = List.of(List.of(1, 2), List.of(3, 4), List.of(5));
        List<Integer> flat = nested.stream()
            .flatMap(Collection::stream)
            .collect(Collectors.toList());
        System.out.println("Flattened: " + flat);
    }
}`,
      },
      {
        slug: '03-collectors',
        title: 'Collectors & Stream Aggregation',
        order: 3,
        difficulty: 'intermediate',
        tags: ['Collectors', 'groupingBy', 'partitioningBy', 'toMap', 'joining', 'summarizingInt', 'interview-common'],
        defaultCode: `import java.util.*;
import java.util.stream.*;

public class JavaLabRunner {
    record Person(String name, String dept, int salary) {}

    public static void main(String[] args) {
        List<Person> people = List.of(
            new Person("Alice", "Eng",  90000),
            new Person("Bob",   "Eng",  85000),
            new Person("Carol", "HR",   70000),
            new Person("Dave",  "HR",   72000),
            new Person("Eve",   "Eng",  95000)
        );

        // groupingBy
        Map<String, List<Person>> byDept = people.stream()
            .collect(Collectors.groupingBy(Person::dept));
        System.out.println("Depts: " + byDept.keySet());

        // groupingBy + downstream: count
        Map<String, Long> countByDept = people.stream()
            .collect(Collectors.groupingBy(Person::dept, Collectors.counting()));
        System.out.println("Count: " + countByDept);

        // groupingBy + averagingInt
        Map<String, Double> avgSalary = people.stream()
            .collect(Collectors.groupingBy(Person::dept, Collectors.averagingInt(Person::salary)));
        System.out.println("Avg salary: " + avgSalary);

        // partitioningBy
        Map<Boolean, List<Person>> partition = people.stream()
            .collect(Collectors.partitioningBy(p -> p.salary() >= 85000));
        System.out.println("High earners: " + partition.get(true).stream().map(Person::name).toList());

        // joining
        String names = people.stream().map(Person::name).collect(Collectors.joining(", ", "[", "]"));
        System.out.println("Names: " + names);

        // summarizingInt
        IntSummaryStatistics stats = people.stream().collect(Collectors.summarizingInt(Person::salary));
        System.out.printf("Salary: min=%d, max=%d, avg=%.0f%n",
            stats.getMin(), stats.getMax(), stats.getAverage());
    }
}`,
      },
      {
        slug: '04-optional',
        title: 'Optional — Null-Safe Programming',
        order: 4,
        difficulty: 'intermediate',
        tags: ['Optional', 'orElse', 'flatMap', 'null-safety', 'anti-patterns'],
        defaultCode: `import java.util.*;
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
        Optional<String> present  = Optional.of("hello");
        Optional<String> empty    = Optional.empty();

        System.out.println("orElse:    " + empty.orElse("default"));
        System.out.println("orElseGet: " + empty.orElseGet(() -> "computed"));
        present.ifPresent(v -> System.out.println("ifPresent: " + v));

        // map and flatMap
        System.out.println("map length: " + present.map(String::length).orElse(0));

        Optional<String> email = findById(1).flatMap(JavaLabRunner::getEmail);
        System.out.println("flatMap email: " + email.orElse("no email"));

        // filter
        System.out.println("filter: " + present.filter(s -> s.length() > 3).isPresent());

        // orElseThrow
        try {
            empty.orElseThrow(() -> new IllegalStateException("Not found"));
        } catch (IllegalStateException e) {
            System.out.println("orElseThrow: " + e.getMessage());
        }

        // Stream integration (Java 9+)
        List<Optional<String>> optionals = List.of(present, empty, Optional.of("world"));
        List<String> values = optionals.stream().flatMap(Optional::stream).toList();
        System.out.println("Stream flatMap: " + values);
    }
}`,
      },
      {
        slug: '06-big-data-stream-patterns',
        title: 'Big Data Stream Patterns — Mistakes vs Best Practices',
        order: 6,
        difficulty: 'advanced',
        tags: ['memory-efficiency', 'lazy', 'parallel', 'flatMap', 'Collectors', 'Files.lines', 'interview-common'],
        defaultCode: `import java.util.*;
import java.util.stream.*;
import java.util.function.*;

public class JavaLabRunner {

    // ── MISTAKE 1: Collect then stream again ─────────────────────────────────
    static List<String> mistakeDoubleCollect(List<String> names) {
        List<String> upper = names.stream()
            .map(String::toUpperCase)
            .collect(Collectors.toList());    // materialises intermediate list
        return upper.stream()
            .filter(s -> s.startsWith("A"))
            .collect(Collectors.toList());    // second materialisation
    }

    // ── BEST PRACTICE 1: Compose in one pipeline ─────────────────────────────
    static List<String> bestSinglePipeline(List<String> names) {
        return names.stream()
            .map(String::toUpperCase)
            .filter(s -> s.startsWith("A"))   // lazy — no intermediate list
            .collect(Collectors.toList());     // one terminal materialisation
    }

    // ── MISTAKE 2: flatMap misuse — wrapping in a stream unnecessarily ───────
    static List<String> mistakeFlatMap(List<List<String>> nested) {
        List<String> result = new ArrayList<>();
        for (List<String> inner : nested)
            result.addAll(inner);             // correct but imperative
        return result;
    }

    // ── BEST PRACTICE 2: flatMap to flatten ──────────────────────────────────
    static List<String> bestFlatMap(List<List<String>> nested) {
        return nested.stream()
            .flatMap(Collection::stream)       // 1-to-N: each inner list becomes elements
            .collect(Collectors.toList());
    }

    // ── MISTAKE 3: Parallel stream on IO-bound or small data ─────────────────
    static long mistakeParallel(List<Integer> small) {
        return small.parallelStream()          // ForkJoinPool overhead > savings for small lists
            .filter(n -> n % 2 == 0)
            .count();
    }

    // ── BEST PRACTICE 3: Parallel only when CPU-bound + large ────────────────
    static long bestParallel(List<Integer> large) {
        return large.parallelStream()          // worthwhile when > ~10k elements, CPU-bound
            .filter(n -> n % 2 == 0)
            .count();
    }

    // ── MISTAKE 4: Stateful lambda in parallel stream ─────────────────────────
    static List<Integer> mistakeStatefulParallel(List<Integer> nums) {
        List<Integer> result = new ArrayList<>();       // NOT thread-safe
        nums.parallelStream().forEach(result::add);    // data races → corrupt/missing entries
        return result;
    }

    // ── BEST PRACTICE 4: Stateless pipeline, collect thread-safely ───────────
    static List<Integer> bestStateless(List<Integer> nums) {
        return nums.parallelStream()
            .filter(n -> n > 0)
            .collect(Collectors.toList());     // Collectors handles thread-safe accumulation
    }

    public static void main(String[] args) {
        List<String> names = List.of("alice","anna","bob","charlie","andrew");

        // Pattern 1
        System.out.println("Mistake (double collect): " + mistakeDoubleCollect(new ArrayList<>(names)));
        System.out.println("Best    (single pipeline): " + bestSinglePipeline(new ArrayList<>(names)));

        // Pattern 2
        List<List<String>> nested = List.of(List.of("a","b"), List.of("c","d"), List.of("e"));
        System.out.println("Flattened: " + bestFlatMap(nested));

        // Pattern 3 — parallel on large CPU-bound data
        List<Integer> large = IntStream.rangeClosed(1, 2_000_000).boxed().collect(Collectors.toList());
        long t0 = System.nanoTime();
        long seq  = large.stream().filter(n -> n % 2 == 0).count();
        long t1 = System.nanoTime();
        long par  = large.parallelStream().filter(n -> n % 2 == 0).count();
        long t2 = System.nanoTime();
        System.out.printf("Sequential: %d evens in %,d ns%n", seq, t1 - t0);
        System.out.printf("Parallel:   %d evens in %,d ns%n", par, t2 - t1);

        // Pattern 4 — safe parallel collect
        List<Integer> safe = bestStateless(large.subList(0, 100));
        System.out.println("Safe parallel collect size: " + safe.size());
    }
}`,
      },
      {
        slug: '05-streams-glossary',
        title: 'Streams Terminology — Interview Reference',
        order: 5,
        difficulty: 'intermediate',
        tags: ['glossary', 'Stream', 'map', 'flatMap', 'Optional', 'Collectors', 'lazy', 'parallel', 'interview-common'],
        defaultCode: `import java.util.*;
import java.util.stream.*;
import java.util.function.*;

public class JavaLabRunner {
    record Person(String name, String dept, int salary) {}

    public static void main(String[] args) {
        List<Person> people = List.of(
            new Person("Alice", "Eng", 90000),
            new Person("Bob",   "Eng", 85000),
            new Person("Carol", "HR",  70000),
            new Person("Dave",  "HR",  72000)
        );

        // map vs flatMap
        List<String> upper = people.stream()
            .map(p -> p.name().toUpperCase())
            .collect(Collectors.toList());
        System.out.println("map: " + upper);

        List<String> words = List.of("Hello World", "Java Streams");
        List<String> tokens = words.stream()
            .flatMap(s -> Arrays.stream(s.split(" ")))
            .collect(Collectors.toList());
        System.out.println("flatMap: " + tokens);

        // filter before sorted (stateful op)
        people.stream()
            .filter(p -> p.salary() > 75000)
            .sorted(Comparator.comparingInt(Person::salary))
            .map(Person::name)
            .forEach(System.out::println);

        // groupingBy + downstream
        Map<String, Double> avgByDept = people.stream()
            .collect(Collectors.groupingBy(Person::dept, Collectors.averagingInt(Person::salary)));
        System.out.println("Avg salary: " + avgByDept);

        // Optional.flatMap
        Optional<String> email = Optional.of("alice@example.com");
        Optional<String> domain = email.flatMap(e -> Optional.of(e.split("@")[1]));
        System.out.println("Domain: " + domain.orElse("none"));

        // orElse (eager) vs orElseGet (lazy)
        Optional<String> empty = Optional.empty();
        System.out.println("orElse: " + empty.orElse("default"));
        System.out.println("orElseGet: " + empty.orElseGet(() -> "lazy"));

        // infinite stream + limit
        List<Double> randoms = Stream.generate(Math::random).limit(5).collect(Collectors.toList());
        System.out.println("5 randoms: " + randoms.size());
    }
}`,
      },
    ],
  },
  {
    slug: 'concurrency',
    title: 'Concurrency & Multithreading',
    icon: 'GitBranch',
    description: 'Thread lifecycle, locks, atomic variables, executors, and CompletableFuture.',
    lessons: [
      {
        slug: '01-thread-lifecycle',
        title: 'Thread Lifecycle & JMM',
        order: 1,
        difficulty: 'intermediate',
        tags: ['Thread', 'JMM', 'happens-before', 'visibility'],
        defaultCode: `public class JavaLabRunner {
    static volatile boolean running = true; // volatile for visibility

    public static void main(String[] args) throws InterruptedException {
        Thread worker = new Thread(() -> {
            System.out.println("Worker state: " + Thread.currentThread().getState());
            while (running) {
                // busy wait for demo purposes
            }
            System.out.println("Worker stopped.");
        });

        System.out.println("Before start: " + worker.getState()); // NEW
        worker.start();
        System.out.println("After start: " + worker.getState());  // RUNNABLE

        Thread.sleep(10);
        running = false;
        worker.join();
        System.out.println("After join: " + worker.getState());   // TERMINATED
    }
}`,
      },
      {
        slug: '02-synchronized-volatile',
        title: 'synchronized & volatile',
        order: 2,
        difficulty: 'intermediate',
        tags: ['synchronized', 'volatile', 'race-condition', 'monitor', 'interview-common'],
        defaultCode: `public class JavaLabRunner {
    static int unsafeCounter = 0;
    static int safeCounter = 0;
    static volatile boolean flag = false;

    static synchronized void increment() { safeCounter++; }

    public static void main(String[] args) throws InterruptedException {
        Thread[] threads = new Thread[10];
        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    unsafeCounter++;
                    increment();
                }
            });
            threads[i].start();
        }
        for (Thread t : threads) t.join();

        System.out.println("Expected:  10000");
        System.out.println("Safe:      " + safeCounter);
        System.out.println("Unsafe:    " + unsafeCounter + " (likely wrong)");

        Thread worker = new Thread(() -> {
            while (!flag) { /* spin */ }
            System.out.println("Worker saw flag=true");
        });
        worker.start();
        Thread.sleep(5);
        flag = true;
        worker.join();
    }
}`,
      },
      {
        slug: '03-reentrantlock',
        title: 'ReentrantLock & ReadWriteLock',
        order: 3,
        difficulty: 'advanced',
        tags: ['ReentrantLock', 'ReadWriteLock', 'tryLock', 'Condition', 'deadlock', 'interview-common'],
        defaultCode: `import java.util.concurrent.locks.*;

public class JavaLabRunner {
    static final ReentrantLock lock = new ReentrantLock();
    static int counter = 0;
    static final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    static String sharedData = "initial";

    static void safeIncrement() {
        lock.lock();
        try { counter++; }
        finally { lock.unlock(); }
    }

    static String readData() {
        rwLock.readLock().lock();
        try { return sharedData; }
        finally { rwLock.readLock().unlock(); }
    }

    static void writeData(String data) {
        rwLock.writeLock().lock();
        try { sharedData = data; }
        finally { rwLock.writeLock().unlock(); }
    }

    public static void main(String[] args) throws InterruptedException {
        boolean acquired = lock.tryLock();
        if (acquired) {
            try { System.out.println("Lock acquired, counter: " + ++counter); }
            finally { lock.unlock(); }
        }

        writeData("hello");
        System.out.println("Read: " + readData());
        System.out.println("Hold count (unlocked): " + lock.getHoldCount()); // 0
        System.out.println("Is fair: " + new ReentrantLock(true).isFair());
    }
}`,
      },
      {
        slug: '04-atomic-cas',
        title: 'Atomic Variables & CAS',
        order: 4,
        difficulty: 'advanced',
        tags: ['AtomicInteger', 'AtomicReference', 'CAS', 'LongAdder', 'lock-free', 'interview-common'],
        defaultCode: `import java.util.concurrent.atomic.*;

public class JavaLabRunner {
    static AtomicInteger atomicCounter = new AtomicInteger(0);
    static LongAdder adder = new LongAdder();

    public static void main(String[] args) throws InterruptedException {
        System.out.println("get: " + atomicCounter.get());
        System.out.println("getAndIncrement: " + atomicCounter.getAndIncrement()); // 0
        System.out.println("incrementAndGet: " + atomicCounter.incrementAndGet()); // 2
        System.out.println("addAndGet(10):   " + atomicCounter.addAndGet(10));     // 12

        boolean success = atomicCounter.compareAndSet(12, 100);
        System.out.println("CAS(12->100): " + success + ", value: " + atomicCounter.get());

        boolean fail = atomicCounter.compareAndSet(12, 200);
        System.out.println("CAS(12->200): " + fail + ", value: " + atomicCounter.get());

        AtomicReference<String> ref = new AtomicReference<>("hello");
        ref.compareAndSet("hello", "world");
        System.out.println("AtomicReference: " + ref.get());

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
}`,
      },
      {
        slug: '05-executor-threadpool',
        title: 'Executor Framework & Thread Pools',
        order: 5,
        difficulty: 'advanced',
        tags: ['ExecutorService', 'ThreadPoolExecutor', 'Callable', 'Future', 'thread-pool-sizing', 'interview-common'],
        defaultCode: `import java.util.concurrent.*;
import java.util.List;

public class JavaLabRunner {
    public static void main(String[] args) throws InterruptedException, ExecutionException {
        ExecutorService pool = Executors.newFixedThreadPool(3);

        Future<Integer> future = pool.submit(() -> {
            Thread.sleep(10);
            return 42;
        });

        pool.execute(() -> System.out.println("Running in: " + Thread.currentThread().getName()));
        System.out.println("Future result: " + future.get());

        List<Callable<String>> tasks = List.of(
            () -> "task1", () -> "task2", () -> "task3"
        );
        List<Future<String>> results = pool.invokeAll(tasks);
        for (Future<String> r : results) System.out.println("Result: " + r.get());

        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);

        ThreadPoolExecutor custom = new ThreadPoolExecutor(
            2, 4, 60, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(10),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
        System.out.println("Core pool size: " + custom.getCorePoolSize());
        System.out.println("Max pool size:  " + custom.getMaximumPoolSize());
        custom.shutdown();
    }
}`,
      },
      {
        slug: '06-completablefuture',
        title: 'CompletableFuture & Async Composition',
        order: 6,
        difficulty: 'advanced',
        tags: ['CompletableFuture', 'thenApply', 'thenCompose', 'allOf', 'exceptionally', 'async', 'interview-common'],
        defaultCode: `import java.util.concurrent.*;

public class JavaLabRunner {
    static String fetchUser(int id) { return "User-" + id; }
    static String fetchOrders(String user) { return user + ":orders[A,B,C]"; }

    public static void main(String[] args) throws Exception {
        // Basic async pipeline
        String result = CompletableFuture
            .supplyAsync(() -> fetchUser(42))
            .thenApply(String::toUpperCase)
            .thenApply(user -> "Hello, " + user)
            .get();
        System.out.println(result);

        // thenCompose — flatMap for futures
        String composed = CompletableFuture
            .supplyAsync(() -> fetchUser(1))
            .thenCompose(user -> CompletableFuture.supplyAsync(() -> fetchOrders(user)))
            .get();
        System.out.println("Composed: " + composed);

        // thenCombine — merge two independent futures
        CompletableFuture<String> f1 = CompletableFuture.supplyAsync(() -> "Hello");
        CompletableFuture<String> f2 = CompletableFuture.supplyAsync(() -> "World");
        System.out.println("Combined: " + f1.thenCombine(f2, (a, b) -> a + " " + b).get());

        // allOf — wait for all
        CompletableFuture.allOf(
            CompletableFuture.runAsync(() -> System.out.println("Task 1")),
            CompletableFuture.runAsync(() -> System.out.println("Task 2"))
        ).get();

        // Error handling
        String fallback = CompletableFuture
            .<String>supplyAsync(() -> { throw new RuntimeException("fetch failed"); })
            .exceptionally(ex -> "fallback: " + ex.getMessage())
            .get();
        System.out.println(fallback);
    }
}`,
      },
      {
        slug: '07-concurrent-collections',
        title: 'Concurrent Collections',
        order: 7,
        difficulty: 'advanced',
        tags: ['ConcurrentHashMap', 'BlockingQueue', 'CopyOnWriteArrayList', 'producer-consumer', 'interview-common'],
        defaultCode: `import java.util.concurrent.*;

public class JavaLabRunner {
    public static void main(String[] args) throws InterruptedException {
        // ConcurrentHashMap — atomic compound ops
        ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
        map.put("a", 1);
        map.putIfAbsent("b", 2);
        map.compute("a", (k, v) -> v == null ? 1 : v + 10);
        map.merge("c", 1, Integer::sum);
        System.out.println("ConcurrentHashMap: " + map);

        // CopyOnWriteArrayList — safe iteration
        CopyOnWriteArrayList<String> cowList = new CopyOnWriteArrayList<>();
        cowList.add("a");
        cowList.add("b");
        for (String s : cowList) {
            cowList.add("c"); // safe — iterates snapshot
            System.out.println("COW iterate: " + s);
            break;
        }

        // BlockingQueue — producer-consumer
        BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(5);
        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 3; i++) {
                    queue.put(i);
                    System.out.println("Produced: " + i);
                }
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 0; i < 3; i++) System.out.println("Consumed: " + queue.take());
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        producer.start(); consumer.start();
        producer.join();  consumer.join();
    }
}`,
      },
      {
        slug: '08-synchronizers',
        title: 'Synchronizers: CountDownLatch, Semaphore & CyclicBarrier',
        order: 8,
        difficulty: 'advanced',
        tags: ['CountDownLatch', 'CyclicBarrier', 'Semaphore', 'Phaser', 'deadlock', 'interview-common'],
        defaultCode: `import java.util.concurrent.*;

public class JavaLabRunner {
    public static void main(String[] args) throws InterruptedException {
        int N = 3;

        // CountDownLatch — start gate
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate   = new CountDownLatch(N);

        for (int i = 0; i < N; i++) {
            final int id = i;
            new Thread(() -> {
                try {
                    startGate.await();
                    System.out.println("Thread " + id + " running");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    endGate.countDown();
                }
            }).start();
        }
        Thread.sleep(5);
        System.out.println("GO!");
        startGate.countDown();
        endGate.await();
        System.out.println("All done.");

        // Semaphore — limit concurrency
        Semaphore sem = new Semaphore(2);
        ExecutorService pool = Executors.newFixedThreadPool(5);
        for (int i = 0; i < 5; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    sem.acquire();
                    System.out.println("Thread " + id + " in critical section");
                    Thread.sleep(10);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    sem.release();
                }
            });
        }
        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
    }
}`,
      },
      {
        slug: '10-big-data-concurrency-patterns',
        title: 'Big Data Concurrency Patterns — Mistakes vs Best Practices',
        order: 10,
        difficulty: 'advanced',
        tags: ['memory-efficiency', 'thread-safety', 'ConcurrentHashMap', 'CompletableFuture', 'backpressure', 'interview-common'],
        defaultCode: `import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;
import java.util.stream.*;

public class JavaLabRunner {

    // ── MISTAKE 1: Shared mutable state without synchronisation ──────────────
    static int mistakeCounter = 0;
    static void mistakeIncrement() { mistakeCounter++; } // read-modify-write race

    // ── BEST PRACTICE 1: AtomicInteger — CAS, no lock ────────────────────────
    static final AtomicInteger bestCounter = new AtomicInteger(0);

    // ── MISTAKE 2: synchronized on every read (kills parallelism) ────────────
    static final Map<String, Integer> mistakeMap = new HashMap<>();
    static synchronized Integer mistakeGet(String k) { return mistakeMap.get(k); }
    static synchronized void mistakePut(String k, int v) { mistakeMap.put(k, v); }

    // ── BEST PRACTICE 2: ConcurrentHashMap — lock-free reads ─────────────────
    static final ConcurrentHashMap<String, Integer> bestMap = new ConcurrentHashMap<>();

    // ── MISTAKE 3: Creating a new thread per task ─────────────────────────────
    static void mistakeNewThread(Runnable task) {
        new Thread(task).start(); // thread creation cost ~1ms + 512KB stack each
    }

    // ── BEST PRACTICE 3: Reuse threads via ExecutorService ───────────────────
    static final ExecutorService pool = Executors.newFixedThreadPool(
        Runtime.getRuntime().availableProcessors()
    );

    // ── MISTAKE 4: Blocking inside CompletableFuture pipeline ─────────────────
    static CompletableFuture<String> mistakeBlocking() {
        return CompletableFuture.supplyAsync(() -> {
            try { Thread.sleep(10); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            return "data";
        }).thenApply(data -> {
            // heavy CPU work on the common pool — starves other tasks
            return data.toUpperCase();
        });
    }

    // ── BEST PRACTICE 4: Separate IO from CPU, use thenApplyAsync ────────────
    static CompletableFuture<String> bestAsync() {
        return CompletableFuture
            .supplyAsync(() -> "data", pool)                    // IO on dedicated pool
            .thenApplyAsync(String::toUpperCase,                // CPU on separate pool
                            ForkJoinPool.commonPool());
    }

    public static void main(String[] args) throws Exception {
        // Pattern 1: race condition vs AtomicInteger
        int threads = 8, ops = 10_000;
        ExecutorService exec = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);
        for (int t = 0; t < threads; t++) {
            exec.submit(() -> {
                for (int i = 0; i < ops; i++) { mistakeIncrement(); bestCounter.incrementAndGet(); }
                latch.countDown();
            });
        }
        latch.await();
        System.out.println("Expected: " + (threads * ops));
        System.out.println("Mistake (race):  " + mistakeCounter + "  ← likely wrong");
        System.out.println("Best (atomic):   " + bestCounter.get() + "  ← always correct");

        // Pattern 2: ConcurrentHashMap vs synchronized HashMap
        bestMap.put("a", 1); bestMap.put("b", 2);
        bestMap.computeIfAbsent("c", k -> 3);   // atomic — no external lock needed
        System.out.println("ConcurrentHashMap: " + bestMap);

        // Pattern 3: thread pool reuse
        List<Future<Integer>> futures = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            final int id = i;
            futures.add(pool.submit(() -> id * id));
        }
        int sum = 0;
        for (Future<Integer> f : futures) sum += f.get();
        System.out.println("Pool tasks sum of squares: " + sum);

        // Pattern 4: CompletableFuture pipeline
        String result = bestAsync().get();
        System.out.println("Async pipeline result: " + result);

        exec.shutdown(); pool.shutdown();
    }
}`,
      },
      {
        slug: '09-concurrency-glossary',
        title: 'Concurrency Terminology — Interview Reference',
        order: 9,
        difficulty: 'advanced',
        tags: ['glossary', 'JMM', 'happens-before', 'CAS', 'deadlock', 'thread-pool', 'CompletableFuture', 'interview-common'],
        defaultCode: `import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class JavaLabRunner {
    static final ReentrantLock mutex = new ReentrantLock(true); // fair mutex
    static final AtomicInteger casCounter = new AtomicInteger(0);
    static final Semaphore permits = new Semaphore(2);
    static volatile boolean stop = false;

    public static void main(String[] args) throws Exception {
        // CAS — compare-and-swap
        boolean swapped = casCounter.compareAndSet(0, 42);
        System.out.println("CAS succeeded: " + swapped + ", value: " + casCounter.get());

        // Mutex (fair ReentrantLock) — reentrant
        mutex.lock();
        try {
            System.out.println("Hold count: " + mutex.getHoldCount()); // 1
            mutex.lock();
            try { System.out.println("Hold count (reentry): " + mutex.getHoldCount()); } // 2
            finally { mutex.unlock(); }
        } finally { mutex.unlock(); }

        // Semaphore + CountDownLatch
        ExecutorService pool = Executors.newFixedThreadPool(4);
        CountDownLatch done = new CountDownLatch(4);
        for (int i = 0; i < 4; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    permits.acquire();
                    System.out.println("Thread " + id + " acquired permit");
                    Thread.sleep(20);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    permits.release();
                    done.countDown();
                }
            });
        }
        done.await();
        System.out.println("All done (CountDownLatch released)");

        // volatile happens-before
        Thread worker = new Thread(() -> {
            while (!stop) { /* spin */ }
            System.out.println("Worker saw stop=true (volatile visibility)");
        });
        worker.start();
        Thread.sleep(5);
        stop = true;
        worker.join();
        pool.shutdown();
    }
}`,
      },
    ],
  },
  {
    slug: 'jvm',
    title: 'JVM Internals & Performance',
    icon: 'Cpu',
    description: 'ClassLoader, GC algorithms, memory leaks, String pool, and JIT compilation.',
    lessons: [
      {
        slug: '01-jvm-architecture',
        title: 'JVM Architecture',
        order: 1,
        difficulty: 'advanced',
        tags: ['ClassLoader', 'heap', 'method-area', 'stack-frames'],
        defaultCode: `public class JavaLabRunner {
    public static void main(String[] args) {
        // Inspect runtime memory
        Runtime rt = Runtime.getRuntime();
        long maxMb = rt.maxMemory() / (1024 * 1024);
        long totalMb = rt.totalMemory() / (1024 * 1024);
        long freeMb = rt.freeMemory() / (1024 * 1024);

        System.out.println("Max memory (Xmx):   " + maxMb + " MB");
        System.out.println("Total memory:       " + totalMb + " MB");
        System.out.println("Free memory:        " + freeMb + " MB");
        System.out.println("Used memory:        " + (totalMb - freeMb) + " MB");

        // ClassLoader hierarchy
        System.out.println("\\nClassLoader: " + JavaLabRunner.class.getClassLoader());
        System.out.println("Parent:      " + JavaLabRunner.class.getClassLoader().getParent());
    }
}`,
      },
      {
        slug: '02-jvm-glossary',
        title: 'JVM Internals & Performance Terminology — Interview Reference',
        order: 2,
        difficulty: 'advanced',
        tags: ['glossary', 'JVM', 'GC', 'G1GC', 'JIT', 'ClassLoader', 'heap', 'metaspace', 'interview-common'],
        defaultCode: `import java.lang.ref.*;

public class JavaLabRunner {
    public static void main(String[] args) throws InterruptedException {
        // Runtime memory inspection
        Runtime rt = Runtime.getRuntime();
        System.out.println("Max memory (Xmx):  " + rt.maxMemory()   / (1024*1024) + " MB");
        System.out.println("Total memory:      " + rt.totalMemory()  / (1024*1024) + " MB");
        System.out.println("Free memory:       " + rt.freeMemory()   / (1024*1024) + " MB");
        System.out.println("CPU cores:         " + rt.availableProcessors());

        // ClassLoader hierarchy (parent delegation model)
        ClassLoader app  = JavaLabRunner.class.getClassLoader();
        ClassLoader plat = app.getParent();
        ClassLoader boot = plat != null ? plat.getParent() : null;
        System.out.println("\\nApp ClassLoader:      " + app);
        System.out.println("Platform ClassLoader: " + plat);
        System.out.println("Bootstrap loader:     " + boot); // null — native

        // Strong vs Weak reference
        Object strong = new Object();                    // never GC'd while reachable
        WeakReference<Object> weak = new WeakReference<>(new Object());
        SoftReference<Object> soft = new SoftReference<>(new Object());

        System.out.println("\\nWeak ref before GC: " + weak.get());
        System.gc(); // suggestion only — not guaranteed
        Thread.sleep(50);
        System.out.println("Weak ref after GC:  " + weak.get()); // likely null

        // String pool vs heap
        String pooled = "hello";
        String heap   = new String("hello");
        String intern = heap.intern();
        System.out.println("\\npooled == intern: " + (pooled == intern)); // true
        System.out.println("pooled == heap:   " + (pooled == heap));     // false
    }
}`,
      },
    ],
  },
  {
    slug: 'design-patterns',
    title: 'Design Patterns (Java)',
    icon: 'Layers',
    description: 'Singleton, Builder, Factory, Strategy, Observer, Decorator, and Proxy patterns.',
    lessons: [
      {
        slug: '01-singleton',
        title: 'Singleton (Thread-Safe)',
        order: 1,
        difficulty: 'intermediate',
        tags: ['Singleton', 'DCL', 'volatile', 'enum-singleton', 'thread-safe'],
        defaultCode: `public class JavaLabRunner {
    // Best practice: enum singleton (thread-safe, serialization-safe)
    enum Config {
        INSTANCE;
        private String apiUrl = "https://api.example.com";
        public String getApiUrl() { return apiUrl; }
    }

    // Alternative: initialization-on-demand holder
    static class LazyHolder {
        private LazyHolder() {}
        private static final LazyHolder INSTANCE = new LazyHolder();
        public static LazyHolder getInstance() { return INSTANCE; }
    }

    public static void main(String[] args) {
        System.out.println("Config: " + Config.INSTANCE.getApiUrl());
        System.out.println("Same instance: " + (Config.INSTANCE == Config.INSTANCE));

        LazyHolder h1 = LazyHolder.getInstance();
        LazyHolder h2 = LazyHolder.getInstance();
        System.out.println("LazyHolder same: " + (h1 == h2));
    }
}`,
      },
      {
        slug: '02-design-patterns-glossary',
        title: 'Design Patterns Terminology — Interview Reference',
        order: 2,
        difficulty: 'advanced',
        tags: ['glossary', 'Singleton', 'Builder', 'Strategy', 'Observer', 'Proxy', 'Decorator', 'GoF', 'SOLID', 'interview-common'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    // Builder pattern
    static final class HttpRequest {
        final String method, url, body;
        final Map<String, String> headers;
        private HttpRequest(Builder b) {
            this.method = b.method; this.url = b.url;
            this.body = b.body; this.headers = Map.copyOf(b.headers);
        }
        @Override public String toString() {
            return method + " " + url + " body=" + body + " headers=" + headers;
        }
        static class Builder {
            String method = "GET", url, body;
            Map<String, String> headers = new HashMap<>();
            Builder url(String url) { this.url = url; return this; }
            Builder method(String m) { this.method = m; return this; }
            Builder body(String b) { this.body = b; return this; }
            Builder header(String k, String v) { headers.put(k, v); return this; }
            HttpRequest build() { return new HttpRequest(this); }
        }
    }

    // Strategy pattern
    interface SortStrategy { void sort(int[] arr); }
    static class BubbleSort implements SortStrategy {
        public void sort(int[] arr) { /* simplified */ Arrays.sort(arr); System.out.println("BubbleSort used"); }
    }
    static class QuickSort implements SortStrategy {
        public void sort(int[] arr) { Arrays.sort(arr); System.out.println("QuickSort used"); }
    }
    static class Sorter {
        private SortStrategy strategy;
        Sorter(SortStrategy s) { this.strategy = s; }
        void setStrategy(SortStrategy s) { this.strategy = s; }
        void sort(int[] arr) { strategy.sort(arr); }
    }

    // Decorator pattern
    interface TextProcessor { String process(String text); }
    static class PlainText implements TextProcessor {
        public String process(String t) { return t; }
    }
    static class UpperCaseDecorator implements TextProcessor {
        private final TextProcessor wrapped;
        UpperCaseDecorator(TextProcessor t) { this.wrapped = t; }
        public String process(String t) { return wrapped.process(t).toUpperCase(); }
    }
    static class TrimDecorator implements TextProcessor {
        private final TextProcessor wrapped;
        TrimDecorator(TextProcessor t) { this.wrapped = t; }
        public String process(String t) { return wrapped.process(t).trim(); }
    }

    public static void main(String[] args) {
        // Builder
        HttpRequest req = new HttpRequest.Builder()
            .url("https://api.example.com/users")
            .method("POST")
            .body("{\\"name\\":\\"Alice\\"}")
            .header("Content-Type", "application/json")
            .build();
        System.out.println("Request: " + req);

        // Strategy — swap algorithm at runtime
        Sorter sorter = new Sorter(new BubbleSort());
        int[] data = {5, 2, 8, 1};
        sorter.sort(data);
        sorter.setStrategy(new QuickSort());
        sorter.sort(data);

        // Decorator — compose behaviours
        TextProcessor pipeline = new UpperCaseDecorator(new TrimDecorator(new PlainText()));
        System.out.println("Decorated: " + pipeline.process("  hello world  "));
    }
}`,
      },
    ],
  },
  {
    slug: 'spring',
    title: 'Spring Boot & Production Patterns',
    icon: 'Server',
    description: 'Dependency injection, bean lifecycle, MVC, WebFlux, transactions, and security.',
    lessons: [
      {
        slug: '01-dependency-injection',
        title: 'Dependency Injection Deep Dive',
        order: 1,
        difficulty: 'advanced',
        tags: ['Spring', 'DI', 'constructor-injection', 'Qualifier', 'circular-deps'],
        defaultCode: `// Note: This lesson is conceptual — Spring beans require a Spring context.
// The code below illustrates the DI pattern without a framework.

public class JavaLabRunner {
    interface NotificationService { void send(String msg); }

    static class EmailService implements NotificationService {
        public void send(String msg) { System.out.println("Email: " + msg); }
    }

    static class SmsService implements NotificationService {
        public void send(String msg) { System.out.println("SMS: " + msg); }
    }

    // Constructor injection (Spring @Autowired preferred style)
    static class OrderService {
        private final NotificationService notifier;
        OrderService(NotificationService notifier) { this.notifier = notifier; }
        void placeOrder(String item) {
            System.out.println("Placing order: " + item);
            notifier.send("Order placed: " + item);
        }
    }

    public static void main(String[] args) {
        // Manual DI (what Spring's container does automatically)
        OrderService emailOrder = new OrderService(new EmailService());
        OrderService smsOrder   = new OrderService(new SmsService());

        emailOrder.placeOrder("Laptop");
        smsOrder.placeOrder("Phone");
    }
}`,
      },
      {
        slug: '02-bean-lifecycle',
        title: 'Spring Bean Lifecycle',
        order: 2,
        difficulty: 'advanced',
        tags: ['Spring', 'BeanPostProcessor', 'PostConstruct', 'PreDestroy', 'lifecycle'],
        defaultCode: `// Simulates Spring bean lifecycle phases without a Spring context.

public class JavaLabRunner {
    interface InitializingBean { void afterPropertiesSet() throws Exception; }
    interface DisposableBean  { void destroy() throws Exception; }

    static class DatabasePool implements InitializingBean, DisposableBean {
        private String url;
        private boolean initialized = false;

        // Simulates @Value injection
        void setUrl(String url) { this.url = url; }

        // Simulates @PostConstruct / afterPropertiesSet
        @Override public void afterPropertiesSet() {
            System.out.println("1. afterPropertiesSet: opening pool to " + url);
            initialized = true;
        }

        void query(String sql) {
            if (!initialized) throw new IllegalStateException("Bean not initialized!");
            System.out.println("2. Executing: " + sql);
        }

        // Simulates @PreDestroy / destroy
        @Override public void destroy() {
            System.out.println("3. destroy: closing pool");
            initialized = false;
        }
    }

    public static void main(String[] args) throws Exception {
        // Phase 1: instantiate
        DatabasePool pool = new DatabasePool();
        // Phase 2: inject properties
        pool.setUrl("jdbc:postgresql://localhost:5432/mydb");
        // Phase 3: post-construct
        pool.afterPropertiesSet();
        // Phase 4: in use
        pool.query("SELECT * FROM users");
        // Phase 5: pre-destroy (container shutdown)
        pool.destroy();
    }
}`,
      },
      {
        slug: '03-mvc-request-lifecycle',
        title: 'Spring MVC Request Lifecycle',
        order: 3,
        difficulty: 'advanced',
        tags: ['Spring', 'DispatcherServlet', 'HandlerMapping', 'Filter', 'Interceptor'],
        defaultCode: `// Simulates the Spring MVC request pipeline without Servlet/Spring context.

public class JavaLabRunner {
    record HttpRequest(String method, String path, String body) {}
    record HttpResponse(int status, String body) {}

    // Filter: runs before/after the entire handler chain
    interface Filter {
        HttpResponse doFilter(HttpRequest req, FilterChain chain);
    }
    interface FilterChain {
        HttpResponse proceed(HttpRequest req);
    }

    // Interceptor: runs before/after the controller method
    interface HandlerInterceptor {
        boolean preHandle(HttpRequest req);
        void postHandle(HttpRequest req, HttpResponse res);
    }

    static class LoggingFilter implements Filter {
        public HttpResponse doFilter(HttpRequest req, FilterChain chain) {
            System.out.println("[Filter] --> " + req.method() + " " + req.path());
            HttpResponse res = chain.proceed(req);
            System.out.println("[Filter] <-- " + res.status());
            return res;
        }
    }

    static class AuthInterceptor implements HandlerInterceptor {
        public boolean preHandle(HttpRequest req) {
            System.out.println("[Interceptor] preHandle: checking auth");
            return true; // return false to abort
        }
        public void postHandle(HttpRequest req, HttpResponse res) {
            System.out.println("[Interceptor] postHandle: adding headers");
        }
    }

    static class UserController {
        HttpResponse getUser(HttpRequest req) {
            System.out.println("[Controller] handling " + req.path());
            return new HttpResponse(200, "{\\"name\\":\\"Alice\\"}");
        }
    }

    public static void main(String[] args) {
        HttpRequest req = new HttpRequest("GET", "/api/users/1", null);
        LoggingFilter filter = new LoggingFilter();
        AuthInterceptor interceptor = new AuthInterceptor();
        UserController controller = new UserController();

        filter.doFilter(req, r -> {
            if (!interceptor.preHandle(r)) return new HttpResponse(401, "Unauthorized");
            HttpResponse res = controller.getUser(r);
            interceptor.postHandle(r, res);
            return res;
        });
    }
}`,
      },
      {
        slug: '04-webflux-reactive',
        title: 'Spring WebFlux & Reactive Streams',
        order: 4,
        difficulty: 'advanced',
        tags: ['WebFlux', 'Mono', 'Flux', 'reactive', 'backpressure', 'Project-Reactor'],
        defaultCode: `import java.util.*;
import java.util.concurrent.*;
import java.util.function.*;

// Simplified Mono/Flux simulation — no Project Reactor dependency needed.
public class JavaLabRunner {
    // Minimal Mono simulation
    static class Mono<T> {
        private final Supplier<T> supplier;
        private Mono(Supplier<T> s) { this.supplier = s; }

        static <T> Mono<T> just(T value) { return new Mono<>(() -> value); }
        static <T> Mono<T> fromCallable(Callable<T> c) {
            return new Mono<>(() -> { try { return c.call(); } catch (Exception e) { throw new RuntimeException(e); } });
        }

        <R> Mono<R> map(Function<T, R> fn) { return new Mono<>(() -> fn.apply(supplier.get())); }
        <R> Mono<R> flatMap(Function<T, Mono<R>> fn) { return new Mono<>(() -> fn.apply(supplier.get()).supplier.get()); }
        Mono<T> doOnNext(Consumer<T> consumer) { return new Mono<>(() -> { T v = supplier.get(); consumer.accept(v); return v; }); }
        T block() { return supplier.get(); }
        void subscribe(Consumer<T> consumer) { consumer.accept(supplier.get()); }
    }

    // Simulated repository
    static class UserRepository {
        static final Map<Integer, String> DB = Map.of(1, "Alice", 2, "Bob");
        Mono<String> findById(int id) {
            return Mono.fromCallable(() -> {
                String user = DB.get(id);
                if (user == null) throw new RuntimeException("User " + id + " not found");
                return user;
            });
        }
    }

    public static void main(String[] args) {
        UserRepository repo = new UserRepository();

        // Reactive pipeline: find user, transform, log, subscribe
        repo.findById(1)
            .map(name -> "Hello, " + name + "!")
            .doOnNext(msg -> System.out.println("Sending: " + msg))
            .subscribe(System.out::println);

        // Chained flatMap
        Mono<String> result = repo.findById(2)
            .flatMap(name -> Mono.just(name.toUpperCase()))
            .map(name -> "Welcome back, " + name);
        System.out.println(result.block());
    }
}`,
      },
      {
        slug: '05-spring-data',
        title: 'Spring Data & Repository Pattern',
        order: 5,
        difficulty: 'advanced',
        tags: ['Spring-Data', 'JpaRepository', 'Repository', 'N+1', 'custom-query'],
        defaultCode: `import java.util.*;
import java.util.stream.*;

// Simulates Spring Data repository pattern without JPA/Hibernate.
public class JavaLabRunner {
    record User(int id, int deptId, String name, String email) {}
    record Department(int id, String name) {}
    record UserWithDept(String userName, String deptName) {}

    // Simulates JpaRepository<User, Integer>
    static class UserRepository {
        private final List<User> store = new ArrayList<>(List.of(
            new User(1, 10, "Alice", "alice@example.com"),
            new User(2, 10, "Bob",   "bob@example.com"),
            new User(3, 20, "Carol", "carol@example.com")
        ));

        Optional<User> findById(int id) {
            return store.stream().filter(u -> u.id() == id).findFirst();
        }
        List<User> findAll() { return Collections.unmodifiableList(store); }
        List<User> findByDeptId(int deptId) {
            return store.stream().filter(u -> u.deptId() == deptId).toList();
        }
        User save(User user) { store.add(user); return user; }
        void deleteById(int id) { store.removeIf(u -> u.id() == id); }
    }

    static class DeptRepository {
        private final Map<Integer, Department> store = new HashMap<>(Map.of(
            10, new Department(10, "Engineering"),
            20, new Department(20, "Marketing")
        ));
        Optional<Department> findById(int id) { return Optional.ofNullable(store.get(id)); }
    }

    public static void main(String[] args) {
        UserRepository users = new UserRepository();
        DeptRepository depts = new DeptRepository();

        // findById
        System.out.println("findById(1): " + users.findById(1));

        // N+1 problem — BAD: one query per user to fetch dept
        System.out.println("\\nN+1 pattern (bad):");
        users.findAll().forEach(u -> {
            Department d = depts.findById(u.deptId()).orElseThrow();
            System.out.println("  " + u.name() + " -> " + d.name());
        });

        // Fixed: join in memory (in JPA use @EntityGraph or JOIN FETCH)
        System.out.println("\\nJoin fetch pattern (good):");
        Map<Integer, Department> deptCache = users.findAll().stream()
            .map(User::deptId).distinct()
            .collect(Collectors.toMap(id -> id, id -> depts.findById(id).orElseThrow()));
        users.findAll().forEach(u ->
            System.out.println("  " + u.name() + " -> " + deptCache.get(u.deptId()).name())
        );

        // save + delete
        users.save(new User(4, 20, "Dave", "dave@example.com"));
        System.out.println("\\nAfter save: " + users.findAll().size() + " users");
        users.deleteById(4);
        System.out.println("After delete: " + users.findAll().size() + " users");
    }
}`,
      },
      {
        slug: '06-transactional',
        title: '@Transactional Internals',
        order: 6,
        difficulty: 'advanced',
        tags: ['Transactional', 'propagation', 'isolation', 'proxy', 'rollback', 'Spring'],
        defaultCode: `import java.util.*;

// Simulates @Transactional behaviour and common pitfalls without Spring.
public class JavaLabRunner {
    static class TransactionException extends RuntimeException {
        TransactionException(String msg) { super(msg); }
    }

    // Simulated transaction context
    static class TransactionManager {
        private final List<String> log = new ArrayList<>();
        private boolean active = false;

        void begin() { active = true; log.clear(); System.out.println("[TX] BEGIN"); }
        void commit() { active = false; System.out.println("[TX] COMMIT — ops: " + log); }
        void rollback() { active = false; log.clear(); System.out.println("[TX] ROLLBACK"); }

        void execute(String operation) {
            if (!active) throw new IllegalStateException("No active transaction!");
            log.add(operation);
            System.out.println("[TX] " + operation);
        }
    }

    static TransactionManager tm = new TransactionManager();

    // Simulates @Transactional(propagation = REQUIRED)
    static void transferFunds(int from, int to, int amount) {
        tm.execute("debit account " + from + " by " + amount);
        if (amount > 500) throw new TransactionException("Amount exceeds daily limit");
        tm.execute("credit account " + to + " by " + amount);
    }

    // Simulates @Transactional(propagation = REQUIRES_NEW)
    static void auditLog(String message) {
        // In real Spring: suspends outer TX, starts its own
        System.out.println("[AUDIT] " + message + " (would run in separate TX)");
    }

    // Self-invocation pitfall: this.method() bypasses the proxy!
    static class PaymentService {
        void processPayment(int amount) {
            System.out.println("[Service] processPayment — TX applied via proxy");
            validateAndTransfer(amount); // PITFALL: same-class call bypasses @Transactional!
        }
        void validateAndTransfer(int amount) {
            System.out.println("[Service] validateAndTransfer — @Transactional ignored here!");
        }
    }

    public static void main(String[] args) {
        // Successful transaction
        System.out.println("=== Successful transfer ===");
        tm.begin();
        try {
            transferFunds(1, 2, 100);
            tm.commit();
        } catch (TransactionException e) {
            tm.rollback();
        }

        // Rollback on exception
        System.out.println("\\n=== Failed transfer (rollback) ===");
        tm.begin();
        try {
            transferFunds(1, 2, 1000);
            tm.commit();
        } catch (TransactionException e) {
            System.out.println("[Exception] " + e.getMessage());
            tm.rollback();
        }

        // Self-invocation pitfall demo
        System.out.println("\\n=== Self-invocation pitfall ===");
        new PaymentService().processPayment(200);
    }
}`,
      },
      {
        slug: '07-spring-security',
        title: 'Spring Security Overview',
        order: 7,
        difficulty: 'advanced',
        tags: ['Spring-Security', 'FilterChain', 'SecurityContext', 'JWT', 'authentication'],
        defaultCode: `import java.util.*;
import java.util.Base64;

// Simulates Spring Security filter chain and JWT auth without Spring/libraries.
public class JavaLabRunner {
    record UserPrincipal(String username, List<String> roles) {}

    // Simulates SecurityContextHolder
    static final ThreadLocal<UserPrincipal> SECURITY_CONTEXT = new ThreadLocal<>();

    static void setAuth(UserPrincipal principal) { SECURITY_CONTEXT.set(principal); }
    static UserPrincipal getAuth() { return SECURITY_CONTEXT.get(); }
    static void clearAuth() { SECURITY_CONTEXT.remove(); }

    // Minimal JWT simulation (header.payload.signature — not cryptographically real)
    static String createToken(String username, String role) {
        String payload = Base64.getEncoder().encodeToString(
            (username + ":" + role).getBytes()
        );
        return "header." + payload + ".signature";
    }

    static Optional<UserPrincipal> validateToken(String token) {
        try {
            String[] parts = token.split("\\\\.");
            if (parts.length != 3) return Optional.empty();
            String decoded = new String(Base64.getDecoder().decode(parts[1]));
            String[] claims = decoded.split(":");
            return Optional.of(new UserPrincipal(claims[0], List.of(claims[1])));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    // Simulates the security filter chain
    static boolean jwtFilter(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("[Security] No bearer token — anonymous request");
            return false;
        }
        String token = authHeader.substring(7);
        Optional<UserPrincipal> principal = validateToken(token);
        principal.ifPresentOrElse(
            p -> { setAuth(p); System.out.println("[Security] Authenticated: " + p.username() + " roles=" + p.roles()); },
            ()  -> System.out.println("[Security] Invalid token — 401")
        );
        return principal.isPresent();
    }

    // Simulates @PreAuthorize("hasRole('ADMIN')")
    static void adminEndpoint() {
        UserPrincipal auth = getAuth();
        if (auth == null || !auth.roles().contains("ADMIN")) {
            System.out.println("[Controller] 403 Forbidden");
            return;
        }
        System.out.println("[Controller] Admin dashboard — welcome, " + auth.username());
    }

    public static void main(String[] args) {
        System.out.println("=== Request 1: no token ===");
        jwtFilter(null);
        adminEndpoint();

        System.out.println("\\n=== Request 2: invalid token ===");
        jwtFilter("Bearer bad.token.here");
        adminEndpoint();

        System.out.println("\\n=== Request 3: valid USER token ===");
        String userToken = createToken("alice", "USER");
        jwtFilter("Bearer " + userToken);
        adminEndpoint(); // 403 — not ADMIN

        System.out.println("\\n=== Request 4: valid ADMIN token ===");
        clearAuth();
        String adminToken = createToken("bob", "ADMIN");
        jwtFilter("Bearer " + adminToken);
        adminEndpoint(); // 200

        clearAuth();
    }
}`,
      },
      {
        slug: '08-actuator-logging',
        title: 'Production-Ready: Actuator & Logging',
        order: 8,
        difficulty: 'advanced',
        tags: ['Actuator', 'health-check', 'metrics', 'MDC', 'structured-logging', 'Spring'],
        defaultCode: `import java.util.*;
import java.time.Instant;

// Simulates Spring Boot Actuator health checks and structured logging with MDC.
public class JavaLabRunner {
    // ── Health indicators (mirrors /actuator/health) ──────────
    interface HealthIndicator {
        record Health(String status, Map<String, Object> details) {}
        Health health();
    }

    static class DatabaseHealthIndicator implements HealthIndicator {
        private final boolean connected;
        DatabaseHealthIndicator(boolean connected) { this.connected = connected; }
        public Health health() {
            return connected
                ? new Health("UP", Map.of("pool", "10/10 available", "responseMs", 2))
                : new Health("DOWN", Map.of("error", "Connection refused"));
        }
    }

    static class DiskSpaceIndicator implements HealthIndicator {
        public Health health() {
            long freeBytes = Runtime.getRuntime().freeMemory();
            return new Health("UP", Map.of("free", freeBytes / 1024 + " KB"));
        }
    }

    // ── MDC-style structured logging ──────────────────────────
    static final ThreadLocal<Map<String, String>> MDC = ThreadLocal.withInitial(HashMap::new);

    static void mdcPut(String key, String value) { MDC.get().put(key, value); }
    static void mdcClear() { MDC.get().clear(); }

    static void log(String level, String message) {
        Map<String, String> ctx = MDC.get();
        System.out.printf("{\"ts\":\"%s\",\"level\":\"%s\",\"msg\":\"%s\"%s}%n",
            Instant.now(), level, message,
            ctx.isEmpty() ? "" : ",\"ctx\":" + ctx);
    }

    // ── Simulated /actuator/metrics counter ───────────────────
    static final Map<String, Long> METRICS = new HashMap<>();
    static void incrementMetric(String name) { METRICS.merge(name, 1L, Long::sum); }

    public static void main(String[] args) {
        // Health check aggregation
        System.out.println("=== /actuator/health ===");
        List<HealthIndicator> indicators = List.of(
            new DatabaseHealthIndicator(true),
            new DiskSpaceIndicator()
        );
        String overallStatus = "UP";
        for (HealthIndicator hi : indicators) {
            HealthIndicator.Health h = hi.health();
            if ("DOWN".equals(h.status())) overallStatus = "DOWN";
            System.out.println(hi.getClass().getSimpleName() + ": " + h.status() + " " + h.details());
        }
        System.out.println("Overall: " + overallStatus);

        // Structured logging with MDC
        System.out.println("\\n=== Structured logging ===");
        mdcPut("requestId", UUID.randomUUID().toString().substring(0, 8));
        mdcPut("userId", "user-42");
        log("INFO", "Request received");
        incrementMetric("http.requests.total");
        log("INFO", "Processing order");
        incrementMetric("orders.created");
        log("INFO", "Response sent");
        mdcClear();

        // Metrics snapshot
        System.out.println("\\n=== /actuator/metrics ===");
        METRICS.forEach((k, v) -> System.out.println(k + ": " + v));
    }
}`,
      },
      {
        slug: '09-spring-glossary',
        title: 'Spring Boot Terminology — Interview Reference',
        order: 9,
        difficulty: 'advanced',
        tags: ['glossary', 'Spring', 'IoC', 'DI', 'AOP', 'Transactional', 'bean-scope', 'auto-configuration', 'interview-common'],
        defaultCode: `import java.util.*;

// Simulates core Spring concepts without a Spring context.
public class JavaLabRunner {
    // IoC / DI — constructor injection (preferred over field injection)
    interface NotificationService { void send(String msg); }
    static class EmailService implements NotificationService {
        public void send(String msg) { System.out.println("Email: " + msg); }
    }
    static class OrderService {
        private final NotificationService notifier; // injected via constructor
        OrderService(NotificationService n) { this.notifier = n; }
        void placeOrder(String item) {
            System.out.println("Order: " + item);
            notifier.send("Order placed: " + item);
        }
    }

    // Transaction simulation (REQUIRED vs REQUIRES_NEW propagation)
    static class TxManager {
        private boolean active = false;
        void begin()    { active = true;  System.out.println("[TX] BEGIN"); }
        void commit()   { active = false; System.out.println("[TX] COMMIT"); }
        void rollback() { active = false; System.out.println("[TX] ROLLBACK"); }
        boolean isActive() { return active; }
    }
    static TxManager tm = new TxManager();

    // REQUIRED: join existing TX or create new
    static void required(Runnable work) {
        boolean started = !tm.isActive();
        if (started) tm.begin();
        try { work.run(); if (started) tm.commit(); }
        catch (RuntimeException e) { if (started) tm.rollback(); throw e; }
    }

    // REQUIRES_NEW: always new TX, suspends outer
    static void requiresNew(Runnable work) {
        System.out.println("[TX] Suspending outer, starting new TX");
        tm.begin();
        try { work.run(); tm.commit(); }
        catch (RuntimeException e) { tm.rollback(); throw e; }
    }

    // Self-invocation pitfall — @Transactional on this.method() is ignored
    static class PaymentService {
        void processPayment(int amount) {
            System.out.println("[Service] processPayment — proxy applies @Transactional");
            validate(amount); // PITFALL: this.validate() bypasses proxy!
        }
        void validate(int amount) {
            System.out.println("[Service] validate — @Transactional silently ignored here");
        }
    }

    public static void main(String[] args) {
        // Constructor DI
        OrderService svc = new OrderService(new EmailService());
        svc.placeOrder("Laptop");

        // Transaction propagation
        System.out.println("\\n=== REQUIRED propagation ===");
        required(() -> {
            System.out.println("  Outer work");
            required(() -> System.out.println("  Inner work (joins outer TX)"));
        });

        System.out.println("\\n=== REQUIRES_NEW propagation ===");
        required(() -> {
            System.out.println("  Outer work");
            requiresNew(() -> System.out.println("  Audit log (own TX)"));
            System.out.println("  Outer continues");
        });

        // Self-invocation pitfall
        System.out.println("\\n=== Self-invocation pitfall ===");
        new PaymentService().processPayment(100);
    }
}`,
      },
    ],
  },
  {
    slug: 'interview-patterns',
    title: 'Common Interview Coding Patterns',
    icon: 'Trophy',
    description: 'Two pointers, frequency maps, monotonic stack, binary search, BFS/DFS, DP, LRU cache.',
    lessons: [
      {
        slug: '01-two-pointers',
        title: 'Two Pointers & Sliding Window',
        order: 1,
        difficulty: 'intermediate',
        tags: ['two-pointers', 'sliding-window', 'interview-common'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    // Two pointers: check if array has pair summing to target
    static boolean hasPairSum(int[] sorted, int target) {
        int lo = 0, hi = sorted.length - 1;
        while (lo < hi) {
            int sum = sorted[lo] + sorted[hi];
            if (sum == target) return true;
            else if (sum < target) lo++;
            else hi--;
        }
        return false;
    }

    // Sliding window: max sum subarray of size k
    static int maxSumSubarray(int[] nums, int k) {
        int windowSum = 0;
        for (int i = 0; i < k; i++) windowSum += nums[i];
        int maxSum = windowSum;
        for (int i = k; i < nums.length; i++) {
            windowSum += nums[i] - nums[i - k];
            maxSum = Math.max(maxSum, windowSum);
        }
        return maxSum;
    }

    public static void main(String[] args) {
        int[] sorted = {1, 2, 3, 4, 6};
        System.out.println("Has pair sum 9: " + hasPairSum(sorted, 9)); // true (3+6)
        System.out.println("Has pair sum 7: " + hasPairSum(sorted, 7)); // true (1+6)
        System.out.println("Has pair sum 2: " + hasPairSum(sorted, 2)); // false

        int[] nums = {2, 1, 5, 1, 3, 2};
        System.out.println("Max sum subarray k=3: " + maxSumSubarray(nums, 3)); // 9
    }
}`,
      },
      {
        slug: '03-adc-collection-selection',
        title: 'ADC: Which Collection Should I Use?',
        order: 3,
        difficulty: 'intermediate',
        tags: ['architecture', 'decision', 'collections', 'trade-offs', 'interview-common'],
        defaultCode: `import java.util.*;
import java.util.concurrent.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        // Random access dominated? → ArrayList
        List<Integer> list = new ArrayList<>();
        list.add(1); list.add(2); list.add(3);
        System.out.println("ArrayList get(1): " + list.get(1)); // O(1)

        // FIFO queue? → ArrayDeque (not LinkedList)
        Deque<String> queue = new ArrayDeque<>();
        queue.offer("first"); queue.offer("second");
        System.out.println("Queue poll: " + queue.poll()); // first

        // Sorted unique keys? → TreeMap
        TreeMap<String, Integer> scores = new TreeMap<>();
        scores.put("charlie", 3); scores.put("alice", 1); scores.put("bob", 2);
        System.out.println("First key: " + scores.firstKey()); // alice
        System.out.println("Floor of 'az': " + scores.floorKey("az")); // alice

        // LRU cache? → LinkedHashMap with removeEldestEntry
        int capacity = 3;
        LinkedHashMap<Integer, String> lru = new LinkedHashMap<>(capacity, 0.75f, true) {
            protected boolean removeEldestEntry(Map.Entry<Integer,String> eldest) {
                return size() > capacity;
            }
        };
        lru.put(1, "a"); lru.put(2, "b"); lru.put(3, "c");
        lru.get(1); // access 1 → moves to tail
        lru.put(4, "d"); // evicts eldest (2)
        System.out.println("LRU contains 2: " + lru.containsKey(2)); // false
        System.out.println("LRU contains 1: " + lru.containsKey(1)); // true

        // Thread-safe counter? → LongAdder > AtomicLong under high contention
        java.util.concurrent.atomic.LongAdder counter = new java.util.concurrent.atomic.LongAdder();
        counter.increment(); counter.increment();
        System.out.println("LongAdder sum: " + counter.sum()); // 2
    }
}`,
      },
      {
        slug: '04-adc-concurrency-primitive',
        title: 'ADC: Which Concurrency Primitive?',
        order: 4,
        difficulty: 'advanced',
        tags: ['architecture', 'decision', 'concurrency', 'volatile', 'locks', 'CAS', 'trade-offs'],
        defaultCode: `import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class JavaLabRunner {
    // volatile: visibility only, no atomicity
    static volatile boolean stopFlag = false;

    // AtomicInteger: CAS-based, lock-free counter
    static final AtomicInteger casCounter = new AtomicInteger(0);

    // ReentrantLock: interruptible, timed, fair
    static final ReentrantLock lock = new ReentrantLock(false); // unfair = higher throughput

    // ReadWriteLock: multiple readers OR one writer
    static final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    static int sharedData = 0;

    public static void main(String[] args) throws Exception {
        // volatile stop flag — safe, single write single read
        Thread worker = new Thread(() -> {
            while (!stopFlag) { /* spin */ }
            System.out.println("Worker stopped via volatile flag");
        });
        worker.start();
        Thread.sleep(5);
        stopFlag = true; // volatile write: happens-before next read
        worker.join();

        // CAS counter — no lock, fast under low/medium contention
        casCounter.incrementAndGet();
        boolean swapped = casCounter.compareAndSet(1, 42);
        System.out.println("CAS swap to 42: " + swapped + " → " + casCounter.get());

        // ReentrantLock — use when you need tryLock / timed lock / interruptible
        if (lock.tryLock()) {
            try {
                sharedData = 100;
                System.out.println("Lock held, sharedData = " + sharedData);
            } finally { lock.unlock(); }
        }

        // ReadWriteLock — many concurrent readers, exclusive writer
        rwLock.readLock().lock();
        try { System.out.println("Read sharedData: " + sharedData); }
        finally { rwLock.readLock().unlock(); }
    }
}`,
      },
      {
        slug: '05-adc-thread-pool',
        title: 'ADC: Which Thread Pool?',
        order: 5,
        difficulty: 'advanced',
        tags: ['architecture', 'decision', 'thread-pool', 'executor', 'trade-offs', 'interview-common'],
        defaultCode: `import java.util.concurrent.*;

public class JavaLabRunner {
    public static void main(String[] args) throws Exception {
        // Fixed pool — CPU-bound tasks, predictable parallelism
        ExecutorService fixed = Executors.newFixedThreadPool(
            Runtime.getRuntime().availableProcessors() + 1
        );

        // Cached pool — short-lived IO tasks; DANGEROUS under sustained load (unbounded threads)
        ExecutorService cached = Executors.newCachedThreadPool();

        // Scheduled pool — periodic/delayed tasks
        ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(2);

        // Custom pool with bounded queue — production-grade pattern
        ExecutorService custom = new ThreadPoolExecutor(
            4,                              // corePoolSize
            8,                              // maxPoolSize
            60L, TimeUnit.SECONDS,          // keepAlive for idle threads above core
            new ArrayBlockingQueue<>(100),  // bounded queue — avoid OOM
            new ThreadPoolExecutor.CallerRunsPolicy() // backpressure: caller runs task if full
        );

        // Submit a CPU-bound task
        Future<Integer> f = fixed.submit(() -> {
            int sum = 0;
            for (int i = 0; i < 1_000_000; i++) sum += i;
            return sum;
        });
        System.out.println("CPU task result: " + f.get());

        // Schedule a task 100ms from now
        ScheduledFuture<?> sf = scheduled.schedule(
            () -> System.out.println("Scheduled task ran"),
            100, TimeUnit.MILLISECONDS
        );
        sf.get();

        fixed.shutdown(); cached.shutdown(); scheduled.shutdown(); custom.shutdown();
        System.out.println("All pools shut down");
    }
}`,
      },
      {
        slug: '06-adc-object-creation',
        title: 'ADC: Singleton & Object Creation Patterns',
        order: 6,
        difficulty: 'advanced',
        tags: ['architecture', 'decision', 'singleton', 'factory', 'builder', 'design-patterns', 'trade-offs'],
        defaultCode: `public class JavaLabRunner {

    // Pattern 1: Enum singleton — thread-safe, serialization-safe, simplest
    enum Config {
        INSTANCE;
        private final String env = System.getenv().getOrDefault("ENV", "dev");
        public String getEnv() { return env; }
    }

    // Pattern 2: Holder idiom — lazy init without synchronization overhead
    static class HeavyService {
        private HeavyService() { System.out.println("HeavyService created"); }
        private static class Holder {
            static final HeavyService INSTANCE = new HeavyService();
        }
        static HeavyService getInstance() { return Holder.INSTANCE; }
    }

    // Pattern 3: Double-checked locking — only when enum/holder aren't suitable
    static class DclSingleton {
        private static volatile DclSingleton instance; // volatile is REQUIRED
        private DclSingleton() {}
        static DclSingleton getInstance() {
            if (instance == null) {
                synchronized (DclSingleton.class) {
                    if (instance == null) instance = new DclSingleton();
                }
            }
            return instance;
        }
    }

    // Pattern 4: Builder — when constructor has >3 params or optional fields
    record ServerConfig(String host, int port, boolean tls, int timeout) {
        static Builder builder() { return new Builder(); }
        static class Builder {
            String host = "localhost"; int port = 8080;
            boolean tls = false; int timeout = 30;
            Builder host(String h) { host = h; return this; }
            Builder port(int p)   { port = p; return this; }
            Builder tls(boolean t){ tls = t; return this; }
            Builder timeout(int t){ timeout = t; return this; }
            ServerConfig build()  { return new ServerConfig(host, port, tls, timeout); }
        }
    }

    public static void main(String[] args) {
        System.out.println("Enum singleton env: " + Config.INSTANCE.getEnv());

        HeavyService s1 = HeavyService.getInstance(); // prints "HeavyService created"
        HeavyService s2 = HeavyService.getInstance(); // no print — same instance
        System.out.println("Same instance: " + (s1 == s2));

        ServerConfig cfg = ServerConfig.builder()
            .host("api.example.com").port(443).tls(true).timeout(60).build();
        System.out.println("Config: " + cfg);
    }
}`,
      },
      {
        slug: '07-adc-stream-vs-loop',
        title: 'ADC: Stream vs Loop vs Parallel Stream',
        order: 7,
        difficulty: 'intermediate',
        tags: ['architecture', 'decision', 'streams', 'parallel', 'trade-offs', 'interview-common'],
        defaultCode: `import java.util.*;
import java.util.stream.*;

public class JavaLabRunner {
    record Order(String customerId, double amount, boolean isPaid) {}

    public static void main(String[] args) {
        List<Order> orders = List.of(
            new Order("A", 120.0, true),
            new Order("B",  45.0, false),
            new Order("A",  80.0, true),
            new Order("C", 200.0, true),
            new Order("B",  30.0, true)
        );

        // Stream: readable, composable, lazy — use for most data pipelines
        Map<String, Double> totalByCustomer = orders.stream()
            .filter(Order::isPaid)
            .collect(Collectors.groupingBy(
                Order::customerId,
                Collectors.summingDouble(Order::amount)
            ));
        System.out.println("Totals by customer: " + totalByCustomer);

        // For-loop: prefer when index matters, early-exit is frequent, or mutation needed
        double maxPaid = 0;
        for (Order o : orders) {
            if (o.isPaid() && o.amount() > maxPaid) maxPaid = o.amount();
        }
        System.out.println("Max paid order (loop): " + maxPaid);

        // Same with stream — marginally more readable but allocates Optional
        double maxPaidStream = orders.stream()
            .filter(Order::isPaid)
            .mapToDouble(Order::amount)
            .max()
            .orElse(0);
        System.out.println("Max paid order (stream): " + maxPaidStream);

        // Parallel stream: only for CPU-bound, large (>10k elements), stateless pipelines
        // NOT for IO, NOT for small lists, NOT when order matters
        long count = orders.parallelStream()
            .filter(Order::isPaid)
            .count();
        System.out.println("Paid count (parallel): " + count);

        // flatMap: flatten nested structures
        List<List<Integer>> nested = List.of(List.of(1, 2), List.of(3, 4), List.of(5));
        List<Integer> flat = nested.stream()
            .flatMap(Collection::stream)
            .collect(Collectors.toList());
        System.out.println("Flattened: " + flat);
    }
}`,
      },
      {
        slug: '08-sb-exception-handling',
        title: 'Spring Boot: Exception Handling + Dynatrace Alerting',
        order: 8,
        difficulty: 'advanced',
        tags: ['spring-boot', 'exception-handling', 'ControllerAdvice', 'dynatrace', 'observability', 'financial'],
        defaultCode: `import java.time.Instant;

public class JavaLabRunner {
    // Demonstrate PII masking + log level strategy for financial APIs
    static String mask(String value) {
        if (value == null || value.length() < 4) return "****";
        return "*".repeat(value.length() - 4) + value.substring(value.length() - 4);
    }

    enum AlertSeverity { INFO, HIGH, CRITICAL }

    static void simulateMilestoneLog(String txnId, String milestone, boolean failed) {
        if (failed) {
            System.err.println("ERROR [MILESTONE][" + milestone + "] txnId=" + txnId + " FAILED");
            System.err.println("  → Dynatrace event: ERROR_EVENT pushed");
        } else {
            System.out.println("INFO  [MILESTONE][" + milestone + "] txnId=" + txnId + " OK");
        }
    }

    public static void main(String[] args) {
        String accountNumber = "1234567890";
        System.out.println("Masked account: " + mask(accountNumber)); // ******7890

        String txnId = "TXN-2025-001";
        simulateMilestoneLog(txnId, "AML_SCAN",    false);
        simulateMilestoneLog(txnId, "FORTER_CHECK", false);
        simulateMilestoneLog(txnId, "FUND_PULL",   false);
        simulateMilestoneLog(txnId, "THIRD_PARTY", true); // triggers Dynatrace alert
    }
}`,
      },
      {
        slug: '09-sb-saga-orchestration',
        title: 'Spring Boot: Saga Orchestration — Remittance Flow',
        order: 9,
        difficulty: 'advanced',
        tags: ['spring-boot', 'saga', 'orchestration', 'state-machine', 'compensation', 'remittance', 'financial'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    enum TxnStatus {
        PENDING, AML_SCANNING, FORTER_CHECKING, FUND_PULLING,
        REMITTANCE_IN_PROGRESS, CALLBACK_PENDING, COMPLETED,
        COMPENSATING, REFUND_INITIATED, COMPENSATE_FAILED, FAILED
    }

    static class Transaction {
        String id;
        TxnStatus status = TxnStatus.PENDING;
        String fundPullRef;
        List<String> history = new ArrayList<>();

        void transition(TxnStatus next) {
            System.out.printf("  [SAGA][%s] %s → %s%n", id, status, next);
            history.add(status + " → " + next);
            status = next;
        }
    }

    static Transaction simulateSaga(boolean thirdPartyFails) {
        Transaction txn = new Transaction();
        txn.id = "TXN-001";

        try {
            txn.transition(TxnStatus.AML_SCANNING);
            System.out.println("  AML: APPROVED");

            txn.transition(TxnStatus.FORTER_CHECKING);
            System.out.println("  Forter: APPROVED");

            txn.transition(TxnStatus.FUND_PULLING);
            txn.fundPullRef = "PULL-REF-999"; // fund successfully pulled
            System.out.println("  Fund pulled: " + txn.fundPullRef);

            txn.transition(TxnStatus.REMITTANCE_IN_PROGRESS);
            if (thirdPartyFails) throw new RuntimeException("Provider timeout");

            txn.transition(TxnStatus.CALLBACK_PENDING);
            txn.transition(TxnStatus.COMPLETED);

        } catch (Exception ex) {
            System.err.println("  FAILED: " + ex.getMessage() + " — initiating compensation");
            txn.transition(TxnStatus.COMPENSATING);
            if (txn.fundPullRef != null) {
                System.out.println("  Refunding: " + txn.fundPullRef);
                txn.transition(TxnStatus.REFUND_INITIATED);
            }
            txn.transition(TxnStatus.FAILED);
        }
        return txn;
    }

    public static void main(String[] args) {
        System.out.println("=== Happy path ===");
        Transaction happy = simulateSaga(false);
        System.out.println("Final: " + happy.status);

        System.out.println("\\n=== Third-party failure (compensation) ===");
        Transaction failed = simulateSaga(true);
        System.out.println("Final: " + failed.status);
        System.out.println("Journey: " + failed.history);
    }
}`,
      },
      {
        slug: '10-sb-api-versioning',
        title: 'Spring Boot: API Versioning — Fixing the Single-Endpoint Trap',
        order: 10,
        difficulty: 'intermediate',
        tags: ['spring-boot', 'api-versioning', 'backward-compatibility', 'mobile', 'financial'],
        defaultCode: `import java.util.*;
import java.math.BigDecimal;

public class JavaLabRunner {
    // Simulate the request mapper delegation pattern
    // (avoids if-version branches inside controllers)

    record RemittanceCommand(BigDecimal amount, String beneficiaryId, String beneficiaryName) {}

    interface RequestMapper {
        int version();
        RemittanceCommand toCommand(Map<String, Object> raw);
    }

    // V1: amount is String, flat beneficiaryId
    static class MapperV1 implements RequestMapper {
        public int version() { return 1; }
        public RemittanceCommand toCommand(Map<String, Object> raw) {
            return new RemittanceCommand(
                new BigDecimal(raw.get("amount").toString()),
                (String) raw.get("beneficiaryId"),
                "Unknown" // v1 didn't have beneficiary name
            );
        }
    }

    // V2: amount is Number, nested beneficiary object
    @SuppressWarnings("unchecked")
    static class MapperV2 implements RequestMapper {
        public int version() { return 2; }
        public RemittanceCommand toCommand(Map<String, Object> raw) {
            Map<String, Object> b = (Map<String, Object>) raw.get("beneficiary");
            return new RemittanceCommand(
                new BigDecimal(raw.get("amount").toString()),
                (String) b.get("id"),
                (String) b.get("name")
            );
        }
    }

    static class RequestMapperRegistry {
        private final Map<Integer, RequestMapper> mappers = new HashMap<>();
        void register(RequestMapper m) { mappers.put(m.version(), m); }
        RemittanceCommand map(int version, Map<String, Object> raw) {
            return mappers.getOrDefault(version, mappers.get(2)).toCommand(raw);
        }
    }

    public static void main(String[] args) {
        RequestMapperRegistry registry = new RequestMapperRegistry();
        registry.register(new MapperV1());
        registry.register(new MapperV2());

        // Simulate v1 mobile request
        Map<String, Object> v1Request = Map.of("amount", "150.00", "beneficiaryId", "BEN-001");
        RemittanceCommand cmd1 = registry.map(1, v1Request);
        System.out.println("V1 mapped: " + cmd1);

        // Simulate v2 mobile request
        Map<String, Object> v2Request = Map.of(
            "amount", 150.00,
            "beneficiary", Map.of("id", "BEN-001", "name", "John Doe")
        );
        RemittanceCommand cmd2 = registry.map(2, v2Request);
        System.out.println("V2 mapped: " + cmd2);

        System.out.println("Same beneficiaryId: " + cmd1.beneficiaryId().equals(cmd2.beneficiaryId()));
    }
}`,
      },
      {
        slug: '11-sb-async-queue-flow',
        title: 'Spring Boot: Async Queue + Callback — Send Money Journey',
        order: 11,
        difficulty: 'advanced',
        tags: ['spring-boot', 'kafka', 'async', 'callback', 'saga', 'queue', 'remittance', 'financial'],
        defaultCode: `import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

public class JavaLabRunner {
    enum TxnStatus { PENDING, AML_SCANNING, FUND_PULLING, CALLBACK_PENDING, COMPLETED, FAILED }

    static class Transaction {
        final String id;
        final AtomicReference<TxnStatus> status = new AtomicReference<>(TxnStatus.PENDING);
        final List<String> journey = Collections.synchronizedList(new ArrayList<>());

        Transaction(String id) { this.id = id; }

        void transition(TxnStatus next) {
            TxnStatus prev = status.getAndSet(next);
            String step = prev + " → " + next;
            journey.add(step);
            System.out.println("  [" + id + "] " + step);
        }
    }

    // Simulate async processing (mimics Kafka consumer + Saga orchestrator)
    static void processAsync(Transaction txn, boolean success) {
        CompletableFuture.runAsync(() -> {
            try {
                Thread.sleep(100); // simulate queue delay
                txn.transition(TxnStatus.AML_SCANNING);
                Thread.sleep(50);
                txn.transition(TxnStatus.FUND_PULLING);
                Thread.sleep(50);
                txn.transition(TxnStatus.CALLBACK_PENDING);
                Thread.sleep(200); // waiting for third-party callback

                // Simulate third-party callback
                if (success) {
                    txn.transition(TxnStatus.COMPLETED);
                    System.out.println("  → Email sent, Push notification sent");
                } else {
                    txn.transition(TxnStatus.FAILED);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }

    public static void main(String[] args) throws Exception {
        System.out.println("=== Customer submits Send Money ===");
        Transaction txn = new Transaction("TXN-001");
        System.out.println("POST /submit → 202 Accepted, txnId=" + txn.id);

        processAsync(txn, true);

        // Simulate mobile app polling the journey endpoint
        System.out.println("\\n=== Mobile polling /journey ===");
        for (int i = 0; i < 8; i++) {
            Thread.sleep(100);
            System.out.println("  Poll #" + (i+1) + " → status=" + txn.status.get());
            if (txn.status.get() == TxnStatus.COMPLETED || txn.status.get() == TxnStatus.FAILED) break;
        }

        System.out.println("\\n=== Final journey ===");
        txn.journey.forEach(step -> System.out.println("  " + step));
    }
}`,
      },
      {
        slug: '12-sb-idempotency',
        title: 'Spring Boot: 2-Layer Idempotency — Redis + Database',
        order: 12,
        difficulty: 'advanced',
        tags: ['spring-boot', 'idempotency', 'redis', 'database', 'payments', 'financial', 'duplicate-prevention'],
        defaultCode: `import java.util.*;
import java.util.concurrent.*;

public class JavaLabRunner {
    // Simulate the 2-layer idempotency gate without Spring/Redis dependencies

    enum KeyState { IN_FLIGHT, COMPLETED }
    record CachedResponse(String txnId, String journeyUrl) {}

    // Simulated Redis store
    static final Map<String, Object> redisStore = new ConcurrentHashMap<>();
    // Simulated DB unique constraint (idempotencyKey → txnId)
    static final Map<String, String> dbStore = new ConcurrentHashMap<>();

    static CachedResponse submit(String idempotencyKey, String customerId) {
        String redisKey = "idem:" + idempotencyKey;

        // Layer 1: Redis check
        Object cached = redisStore.get(redisKey);
        if (cached instanceof CachedResponse r) {
            System.out.println("  [" + idempotencyKey + "] CACHE HIT → returning cached 202");
            return r;
        }
        if (cached == KeyState.IN_FLIGHT) {
            throw new RuntimeException("429: Request already in flight, retry after 30s");
        }

        // Set IN_FLIGHT marker (atomic setIfAbsent)
        Object existing = redisStore.putIfAbsent(redisKey, KeyState.IN_FLIGHT);
        if (existing != null) {
            throw new RuntimeException("429: Race condition — another thread claimed this key");
        }

        try {
            // Layer 2: DB upsert (simulate unique constraint)
            String txnId = dbStore.computeIfAbsent(idempotencyKey,
                k -> "TXN-" + UUID.randomUUID().toString().substring(0, 8));

            System.out.println("  [" + idempotencyKey + "] NEW → created txnId=" + txnId);

            CachedResponse response = new CachedResponse(txnId, "/journey/" + txnId);
            redisStore.put(redisKey, response); // update from IN_FLIGHT to real response
            return response;

        } catch (Exception ex) {
            redisStore.remove(redisKey); // release so client can retry
            throw ex;
        }
    }

    public static void main(String[] args) throws Exception {
        String key = "client-uuid-abc-123";

        System.out.println("=== First submission ===");
        CachedResponse r1 = submit(key, "customer-1");
        System.out.println("  Response: " + r1);

        System.out.println("\\n=== Retry (network reconnect) ===");
        CachedResponse r2 = submit(key, "customer-1");
        System.out.println("  Response: " + r2);
        System.out.println("  Same txnId: " + r1.txnId().equals(r2.txnId())); // true

        System.out.println("\\n=== Different key (new transaction) ===");
        CachedResponse r3 = submit("different-key-xyz", "customer-1");
        System.out.println("  Response: " + r3);
        System.out.println("  Different txnId: " + !r1.txnId().equals(r3.txnId())); // true

        System.out.println("\\n=== IN_FLIGHT race condition ===");
        redisStore.put("idem:race-key", KeyState.IN_FLIGHT); // simulate another thread
        try {
            submit("race-key", "customer-2");
        } catch (RuntimeException e) {
            System.out.println("  Caught: " + e.getMessage());
        }
    }
}`,
      },
      {
        slug: '13-streams-architect-guide',
        title: 'Collections, Optional & Streams — Architect\'s Big Data Guide',
        order: 13,
        difficulty: 'advanced',
        tags: ['streams', 'collections', 'Optional', 'flatMap', 'parallel-stream', 'big-data', 'top-N', 'PriorityQueue', 'interview-common'],
        defaultCode: `import java.util.*;
import java.util.stream.*;
import java.util.function.*;
import java.util.concurrent.ThreadLocalRandom;

public class JavaLabRunner {
    record Employee(String name, String dept, int salary) {}
    record Order(String id, List<String> productIds) {}
    record Transaction(String id, double amount, String status) {}

    public static void main(String[] args) {
        List<Employee> employees = List.of(
            new Employee("Alice",   "TECH",    120_000),
            new Employee("Bob",     "TECH",     95_000),
            new Employee("Charlie", "FINANCE",  110_000),
            new Employee("Diana",   "TECH",    135_000),
            new Employee("Eve",     "FINANCE",  88_000),
            new Employee("Frank",   "TECH",    102_000),
            new Employee("Grace",   "FINANCE",  145_000)
        );

        // ── Top 3 highest-paid (sorted + limit) ──
        System.out.println("=== Top 3 highest paid ===");
        employees.stream()
            .sorted(Comparator.comparingInt(Employee::salary).reversed())
            .limit(3)
            .forEach(e -> System.out.printf("  %-10s %,d%n", e.name(), e.salary()));

        // ── Top 3 via min-heap (big data approach) ──
        System.out.println("\\n=== Top 3 via min-heap (O(n log 3) space) ===");
        PriorityQueue<Employee> heap = new PriorityQueue<>(Comparator.comparingInt(Employee::salary));
        for (Employee e : employees) {
            heap.offer(e);
            if (heap.size() > 3) heap.poll();
        }
        List<Employee> top3 = new ArrayList<>(heap);
        top3.sort(Comparator.comparingInt(Employee::salary).reversed());
        top3.forEach(e -> System.out.printf("  %-10s %,d%n", e.name(), e.salary()));

        // ── Top 2 per department ──
        System.out.println("\\n=== Top 2 per department ===");
        employees.stream()
            .collect(Collectors.groupingBy(Employee::dept,
                Collectors.collectingAndThen(Collectors.toList(),
                    list -> list.stream()
                        .sorted(Comparator.comparingInt(Employee::salary).reversed())
                        .limit(2).collect(Collectors.toList()))))
            .forEach((dept, top) -> {
                System.out.println("  " + dept + ":");
                top.forEach(e -> System.out.printf("    %-10s %,d%n", e.name(), e.salary()));
            });

        // ── At-least-3 check (short-circuit) ──
        System.out.println("\\n=== At least 3 in TECH? ===");
        long count = employees.stream()
            .filter(e -> "TECH".equals(e.dept()))
            .limit(3).count();
        System.out.println("  " + (count >= 3 ? "YES" : "NO"));

        // ── flatMap: orders → productIds frequency ──
        System.out.println("\\n=== Products in ≥2 orders ===");
        List<Order> orders = List.of(
            new Order("O1", List.of("P1", "P2", "P3")),
            new Order("O2", List.of("P1", "P3", "P4")),
            new Order("O3", List.of("P2", "P3", "P5"))
        );
        orders.stream()
            .flatMap(o -> o.productIds().stream())
            .collect(Collectors.groupingBy(id -> id, Collectors.counting()))
            .entrySet().stream()
            .filter(e -> e.getValue() >= 2)
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .forEach(e -> System.out.println("  " + e.getKey() + " → " + e.getValue() + " orders"));

        // ── IntSummaryStatistics (single pass, no boxing) ──
        System.out.println("\\n=== Salary stats (single pass, no boxing) ===");
        IntSummaryStatistics stats = employees.stream()
            .mapToInt(Employee::salary)
            .summaryStatistics();
        System.out.printf("  min=%,d  max=%,d  avg=%,.0f  count=%d%n",
            stats.getMin(), stats.getMax(), stats.getAverage(), stats.getCount());

        // ── Optional flatMap chain ──
        System.out.println("\\n=== Optional flatMap chain ===");
        Optional<String> city = Optional.of("  New York  ")
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(String::toUpperCase);
        city.ifPresentOrElse(
            c -> System.out.println("  City: " + c),
            () -> System.out.println("  No city")
        );

        // ── orElse vs orElseGet ──
        System.out.println("\\n=== orElse vs orElseGet ===");
        Optional<String> empty = Optional.empty();
        // orElse: default expression always evaluates
        String a = empty.orElse("default-eager");
        // orElseGet: lazy — only calls supplier if empty
        String b = empty.orElseGet(() -> "default-lazy");
        System.out.println("  orElse:    " + a);
        System.out.println("  orElseGet: " + b);

        // ── peek for debug logging ──
        System.out.println("\\n=== peek for debug ===");
        employees.stream()
            .peek(e -> System.out.println("  [INPUT] " + e.name()))
            .filter(e -> e.salary() > 100_000)
            .peek(e -> System.out.println("  [PASSED] " + e.name()))
            .limit(2)
            .forEach(e -> System.out.println("  [RESULT] " + e.name()));

        // ════════════════════════════════════════════════════════
        //  PART 9 — LOADING BIG DATA INTO A STREAM (constant memory)
        // ════════════════════════════════════════════════════════

        // ════════════════════════════════════════════════════════
        //  PRACTICE — 10 FREEZE DRILLS (run all, internalize the patterns)
        //  These are the exact patterns that blank under interview pressure.
        // ════════════════════════════════════════════════════════

        System.out.println("\\n═══════════════════════════════════════");
        System.out.println(" PRACTICE — 10 Interview Reflexes");
        System.out.println("═══════════════════════════════════════");

        // Drill 1: Second largest — O(n log n) stream
        System.out.println("\\n[Drill 1] Second largest (O(n log n) stream):");
        int[] nums = {5, 12, 9, 21, 21, 7, 18};
        Arrays.stream(nums).boxed()          // IntStream → Stream<Integer> (Comparator needs objects)
            .distinct()                      // two 21s → one 21, so max doesn't steal both slots
            .sorted(Comparator.reverseOrder())
            .skip(1)                         // bypass the largest
            .findFirst()                     // Optional<Integer>
            .ifPresent(v -> System.out.println("  Stream sort: " + v));

        // Drill 1b: Second largest — O(n) min-heap
        System.out.println("[Drill 1b] Second largest (O(n) min-heap):");
        PriorityQueue<Integer> top2Heap = new PriorityQueue<>(2);
        Arrays.stream(nums).distinct().forEach(n -> {
            top2Heap.offer(n);
            if (top2Heap.size() > 2) top2Heap.poll();  // evict smallest, keep top 2
        });
        System.out.println("  Min-heap: " + top2Heap.peek());   // root = second largest

        // Drill 1c: Second largest — O(n) single-pass reduce
        System.out.println("[Drill 1c] Second largest (O(n) single-pass reduce):");
        int[] top = Arrays.stream(nums).distinct().boxed()
            .reduce(
                new int[]{Integer.MIN_VALUE, Integer.MIN_VALUE},
                (pair, n) -> {
                    if (n > pair[0]) return new int[]{n, pair[0]};
                    if (n > pair[1]) return new int[]{pair[0], n};
                    return pair;
                },
                (a, b) -> a  // combiner — not used in sequential stream
            );
        System.out.println("  Reduce: " + top[1]);

        // Drill 2: IntStream vs Stream<Integer>
        System.out.println("\\n[Drill 2] IntStream vs Stream<Integer>:");
        System.out.println("  sum (IntStream, no boxing): " + Arrays.stream(nums).sum());
        System.out.println("  max boxed int:              " +
            Arrays.stream(nums).boxed().max(Comparator.naturalOrder()).orElseThrow());

        // Drill 3: Java Records
        System.out.println("\\n[Drill 3] Java Records:");
        record Emp(String name, String dept, int salary) {}  // local record (Java 16+)
        var staff = List.of(
            new Emp("Alice", "TECH", 120_000),
            new Emp("Bob",   "TECH",  95_000),
            new Emp("Carol", "FIN",  110_000),
            new Emp("Diana", "TECH", 135_000),
            new Emp("Eve",   "FIN",   88_000),
            new Emp("Frank", "TECH", 102_000),
            new Emp("Grace", "FIN",  145_000)
        );
        staff.stream()
            .filter(e -> e.salary() > 100_000)
            .sorted(Comparator.comparingInt(Emp::salary).reversed())
            .forEach(e -> System.out.printf("  %-8s %,d%n", e.name(), e.salary()));

        // ── Source 1: Generated test data — Stream.generate (infinite, lazy) ──
        System.out.println("\\n=== Generated stream (Stream.generate) ===");
        long highValue = Stream.generate(() ->
                new Transaction(
                    UUID.randomUUID().toString(),
                    ThreadLocalRandom.current().nextDouble(1, 10_000),
                    "PENDING"))
            .limit(1_000_000)                       // materialize lazily — only 1 element in flight
            .filter(t -> t.amount() > 9_000)
            .count();
        System.out.println("  Transactions > 9000: " + highValue + " (out of 1M generated)");

        // ── Source 2: IntStream.range → objects (indexed generation) ──
        System.out.println("\\n=== Indexed generation (IntStream.range) ===");
        OptionalDouble avgSalary = IntStream.range(0, 500_000)
            .mapToObj(i -> new Employee("emp-" + i, i % 3 == 0 ? "TECH" : "FINANCE", 50_000 + (i % 150_000)))
            .filter(e -> "TECH".equals(e.dept()))
            .mapToInt(Employee::salary)             // IntStream — no boxing
            .average();
        System.out.printf("  Average TECH salary across 500K generated employees: %,.0f%n",
            avgSalary.orElse(0));

        // ── Source 3: StreamSupport — bridge any Iterable to a Stream ──
        System.out.println("\\n=== StreamSupport: Iterable → Stream ===");
        Iterable<String> iterable = List.of("Alice", "Bob", "Charlie", "Diana");
        long longNames = StreamSupport.stream(iterable.spliterator(), false /* sequential */)
            .filter(name -> name.length() > 4)
            .count();
        System.out.println("  Names longer than 4 chars: " + longNames);

        // ── Source 4: Stream.iterate with takeWhile — lazy pagination ──
        System.out.println("\\n=== Lazy pagination (Stream.iterate + takeWhile) ===");
        // Simulate paginated API: returns empty list when page > 3
        List<List<String>> fakePagesDb = List.of(
            List.of("txn-1", "txn-2", "txn-3"),
            List.of("txn-4", "txn-5", "txn-6"),
            List.of("txn-7", "txn-8"),
            List.of()   // signals end
        );
        long totalTxns = Stream.iterate(0, page -> page + 1)
            .map(page -> page < fakePagesDb.size() ? fakePagesDb.get(page) : List.<String>of())
            .takeWhile(page -> !page.isEmpty())     // stops when page is empty — no over-fetch
            .flatMap(List::stream)
            .peek(id -> {})                         // in real code: process each id here
            .count();
        System.out.println("  Total txns across all pages: " + totalTxns);

        // ── Source 5: Supplier<Stream> to reuse a stream definition ──
        System.out.println("\\n=== Supplier<Stream> — reuse without IllegalStateException ===");
        Supplier<Stream<Employee>> src = () -> employees.stream().filter(e -> e.salary() > 100_000);
        long richCount  = src.get().count();
        double richAvg  = src.get().mapToInt(Employee::salary).average().orElse(0);
        System.out.printf("  High earners: count=%d  avg=%,.0f%n", richCount, richAvg);

        // ════════════════════════════════════════════════════════
        //  PART 10 — LAZY STREAM vs REACTIVE (simulated in plain Java)
        //
        //  In production:
        //    Blocking  → Spring Data JPA  → Stream<T>  (1 thread pinned during DB IO)
        //    Reactive  → Spring Data R2DBC → Flux<T>   (0 threads held during DB IO)
        //
        //  Here we simulate both approaches with in-memory data so you can
        //  see the structural difference: pull vs push, blocking vs event-driven.
        // ════════════════════════════════════════════════════════

        System.out.println("\\n═══════════════════════════════════════");
        System.out.println(" PART 10 — Lazy Stream vs Reactive");
        System.out.println("═══════════════════════════════════════");

        // ── Approach A: Lazy Stream (blocking pull model) ─────────────────
        // Thread calls next(), blocks until data is ready, processes, repeats.
        // In Spring: thread is pinned for the ENTIRE query duration.
        System.out.println("\\n--- Approach A: Lazy Stream (blocking / pull) ---");
        System.out.println("[Thread] Starts query — thread is now pinned to this work");

        // Simulate DB rows arriving with a cursor-style iterator
        List<Transaction> dbRows = List.of(
            new Transaction("T001", 5_000, "PENDING"),
            new Transaction("T002", 15_000, "PENDING"),
            new Transaction("T003", 3_000, "PENDING"),
            new Transaction("T004", 25_000, "PENDING"),
            new Transaction("T005", 8_000, "PENDING")
        );

        long streamResult = dbRows.stream()           // Stream<T> — lazy, pull-based
            .peek(t -> System.out.println("  [Thread pulls row] " + t.id()))
            .filter(t -> t.amount() > 10_000)
            .peek(t -> System.out.println("  [Thread processes] " + t.id() + " amount=" + t.amount()))
            .count();
        System.out.println("[Thread] Query done — thread released. High-value count: " + streamResult);
        // KEY POINT: thread was blocked from start to finish.
        // During IO wait between rows, thread cannot serve other requests.

        // ── Approach B: Reactive / Push model (simulated) ─────────────────
        // In Spring WebFlux + R2DBC:
        //   1. Controller returns Mono/Flux — no thread held
        //   2. Reactor subscribes and releases the thread
        //   3. When DB emits a row (IO event), Reactor schedules onNext() on a scheduler thread
        //   4. Thread is free between DB events
        System.out.println("\\n--- Approach B: Reactive Flux (non-blocking / push) ---");
        System.out.println("[Thread] Subscribes to Flux — thread is now FREE");

        // Simulate Reactor's push model: producer calls our subscriber when data is ready
        // In real R2DBC this happens via Netty IO events, not a loop
        interface ReactiveSubscriber<T> {
            void onNext(T item);
            void onComplete(long count);
        }

        class SimulatedFlux {
            private final List<Transaction> source;
            SimulatedFlux(List<Transaction> src) { this.source = src; }

            void subscribeFiltered(double threshold, ReactiveSubscriber<Transaction> subscriber) {
                // Reactor would call onNext() from an IO event thread, not the caller's thread
                long[] count = {0};
                source.forEach(t -> {
                    System.out.println("  [IO event → Reactor schedules] onNext(" + t.id() + ")");
                    if (t.amount() > threshold) {
                        subscriber.onNext(t);
                        count[0]++;
                    }
                });
                subscriber.onComplete(count[0]);
            }
        }

        new SimulatedFlux(dbRows).subscribeFiltered(10_000, new ReactiveSubscriber<>() {
            public void onNext(Transaction t) {
                System.out.println("  [Reactor thread processes] " + t.id() + " amount=" + t.amount());
            }
            public void onComplete(long count) {
                System.out.println("[Reactor] onComplete — high-value count: " + count);
                System.out.println("[Caller thread] Was free the entire time; result delivered async");
            }
        });

        // ── Key structural difference ─────────────────────────────────────
        System.out.println("\\n--- Key Difference Summary ---");
        System.out.println("  Stream (blocking):");
        System.out.println("    Thread: pinned for entire query duration");
        System.out.println("    Model:  pull — thread calls next(), waits for row");
        System.out.println("    Memory: O(fetch_size) — constant");
        System.out.println("    Back-pressure: NONE — producer goes as fast as possible");
        System.out.println();
        System.out.println("  Flux/R2DBC (reactive):");
        System.out.println("    Thread: released — IO events drive scheduling");
        System.out.println("    Model:  push — DB emits rows; Reactor delivers to subscriber");
        System.out.println("    Memory: O(prefetch) — constant");
        System.out.println("    Back-pressure: BUILT-IN — subscriber signals demand (limitRate)");
        System.out.println();
        System.out.println("  Rule: never block inside flatMap/map on a Reactor thread");
        System.out.println("  Mixed stack: wrap blocking JPA calls with");
        System.out.println("    Mono.fromCallable(() -> jdbcCall()).subscribeOn(Schedulers.boundedElastic())");
    }
}`,
      },
      {
        slug: '15-interview-lessons-learned',
        title: 'Interview Lessons Learned — Personal Retrospective',
        order: 15,
        difficulty: 'intermediate',
        tags: ['interview-prep', 'lessons-learned', 'retrospective', 'mindset', 'interview-common'],
        defaultCode: `import java.util.*;
import java.util.stream.*;

// ── DRILL ROUND 1 — Run these without looking at notes ──────────────────────
// Goal: each pattern should take < 30 seconds to write from memory.
// Mark the gap registry in lesson 15 as resolved after you can do all 5.

public class JavaLabRunner {

    // Gap 1: Java Record — write from memory
    record Employee(String name, String dept, int salary) {
        // compact constructor — validation
        Employee {
            if (salary < 0) throw new IllegalArgumentException("salary cannot be negative");
        }
        // custom method — records can have instance methods
        String display() { return name + " [" + dept + "] " + String.format("%,d", salary); }
    }

    // Gap 4: Two-pointer write — move zeros to right, in-place O(n)/O(1)
    static void moveZerosRight(int[] arr) {
        int w = 0;
        for (int n : arr) { if (n != 0) arr[w++] = n; }
        while (w < arr.length) arr[w++] = 0;
    }

    public static void main(String[] args) {

        // ── Gap 1: Record ────────────────────────────────────────────────
        System.out.println("=== Gap 1: Java Record ===");
        var staff = List.of(
            new Employee("Alice", "TECH", 120_000),
            new Employee("Bob",   "TECH",  95_000),
            new Employee("Carol", "FIN",  110_000)
        );
        staff.forEach(e -> System.out.println("  " + e.display()));
        // Accessors: e.name()  e.dept()  e.salary()  — NO "get" prefix

        // ── Gap 2 + 3: Second largest — all 3 variants ───────────────────
        System.out.println("\\n=== Gap 2+3: Second Largest ===");
        int[] nums = {5, 12, 9, 21, 21, 7, 18};

        // O(n log n) stream — .boxed() bridges IntStream → Stream<Integer> for Comparator
        int streamAnswer = Arrays.stream(nums)
            .boxed()                             // Gap 3: IntStream needs .boxed() for Comparator
            .distinct()
            .sorted(Comparator.reverseOrder())
            .skip(1)                             // Gap 2: skip(1) = bypass largest
            .findFirst()                         // returns Optional<Integer>
            .orElseThrow();
        System.out.println("  Stream O(n log n): " + streamAnswer);

        // O(n) min-heap of size 2
        PriorityQueue<Integer> heap = new PriorityQueue<>(2);
        Arrays.stream(nums).distinct().forEach(n -> {
            heap.offer(n);
            if (heap.size() > 2) heap.poll();
        });
        System.out.println("  Heap   O(n):       " + heap.peek());

        // O(n) single-pass reduce
        int[] top = Arrays.stream(nums).distinct().boxed()
            .reduce(new int[]{Integer.MIN_VALUE, Integer.MIN_VALUE},
                (pair, n) -> {
                    if (n > pair[0]) return new int[]{n, pair[0]};
                    if (n > pair[1]) return new int[]{pair[0], n};
                    return pair;
                }, (a, b) -> a);
        System.out.println("  Reduce O(n):       " + top[1]);

        // ── Gap 5: Always state complexity + volunteer upgrade ────────────
        System.out.println("\\n=== Gap 5: Complexity habit ===");
        System.out.println("  Say out loud after EVERY answer:");
        System.out.println("  'This is O(n log n) time, O(1) space.'");
        System.out.println("  'For large data I would switch to a min-heap");
        System.out.println("   of size K — O(n log K) time, O(K) space.'");

        // ── Gap 4: Two-pointer write ─────────────────────────────────────
        System.out.println("\\n=== Gap 4: Move Zeros ===");
        int[] arr = {0, 1, 2, 3, 0, 0};
        moveZerosRight(arr);
        System.out.println("  " + Arrays.toString(arr)); // [1, 2, 3, 0, 0, 0]

        int[] tricky = {1, 0, 0, 2};                    // case that breaks naive bubble
        moveZerosRight(tricky);
        System.out.println("  " + Arrays.toString(tricky)); // [1, 2, 0, 0]

        // ── Freeze protocol reminder ──────────────────────────────────────
        System.out.println("\\n=== Freeze Protocol ===");
        System.out.println("  1. 'Let me think through the approach before coding.'");
        System.out.println("  2. State algorithm in plain English first.");
        System.out.println("  3. Write pseudocode comments, then fill operators.");
        System.out.println("  4. If stuck: 'I know the algorithm — recalling the operator...'");
    }
}`,
      },
      {
        slug: '14-array-two-pointer',
        title: 'Array In-Place Manipulation — Two-Pointer Pattern',
        order: 14,
        difficulty: 'intermediate',
        tags: ['two-pointers', 'arrays', 'in-place', 'partition', 'move-zeros', 'dutch-flag', 'interview-common'],
        defaultCode: `import java.util.*;
import java.util.stream.*;
import java.util.function.*;

public class JavaLabRunner {

    // ── Solution 1: Two-pointer write (CANONICAL) ─────────────────────────
    // O(n) time, O(1) space, in-place, preserves relative order
    static void moveZerosRight(int[] arr) {
        int writePos = 0;

        // Pass 1: compact non-zeros to the front
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] != 0) arr[writePos++] = arr[i];
        }
        // Pass 2: fill the tail with zeros
        while (writePos < arr.length) arr[writePos++] = 0;
    }

    // ── Solution 2: Two-pointer swap (fewer writes when zeros are sparse) ─
    static void moveZerosSwap(int[] arr) {
        int writePos = 0;
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] != 0) {
                int tmp       = arr[writePos];
                arr[writePos] = arr[i];
                arr[i]        = tmp;
                writePos++;
            }
        }
    }

    // ── Dutch national flag: sort 0s, 1s, 2s in one pass ─────────────────
    static void dutchFlag(int[] arr) {
        int low = 0, mid = 0, high = arr.length - 1;
        while (mid <= high) {
            if      (arr[mid] == 0) { swap(arr, low++, mid++); }
            else if (arr[mid] == 1) { mid++; }
            else                    { swap(arr, mid, high--); } // don't advance mid
        }
    }

    static void swap(int[] arr, int i, int j) {
        int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }

    public static void main(String[] args) {

        // ── Why the naive bubble swap is buggy ────────────────────────────
        System.out.println("=== Naive bubble swap (BUGGY) ===");
        int[] buggy = {0, 1, 2, 3, 0, 0};
        // Simulating your original approach safely (guarded to avoid AIOOBE)
        for (int i = 0; i < buggy.length - 1; i++) {   // -1 to avoid AIOOBE on last index
            if (buggy[i] == 0) {
                buggy[i]   = buggy[i + 1];
                buggy[i+1] = 0;
            }
        }
        System.out.println("After 1 pass: " + Arrays.toString(buggy));
        // [0,1,2,3,0,0] → one pass: [1,2,3,0,0,0] — happens to work here
        // But try [0,0,1]: after i=0: [0,1,0] → after i=1: [1,0,0] ✓ (two passes needed!)
        // And try [1,0,0,2]: after i=1: [1,0,0,2] → i=2: [1,0,2,0] — WRONG, needs another pass
        System.out.println("Problem: needs multiple passes for [1,0,0,2] — degrades to O(n²)");
        System.out.println("Bug 2: off-by-one — original loop goes to length, not length-1 → AIOOBE");

        // ── Solution 1: Two-pointer write ─────────────────────────────────
        System.out.println("\\n=== Two-pointer write (canonical) ===");
        int[] arr1 = {0, 1, 2, 3, 0, 0};
        moveZerosRight(arr1);
        System.out.println(Arrays.toString(arr1));   // [1, 2, 3, 0, 0, 0]

        int[] arr1b = {1, 0, 0, 2};                 // the case that breaks naive
        moveZerosRight(arr1b);
        System.out.println(Arrays.toString(arr1b));  // [1, 2, 0, 0]

        // ── Solution 2: Swap variant ───────────────────────────────────────
        System.out.println("\\n=== Two-pointer swap ===");
        int[] arr2 = {0, 1, 2, 3, 0, 0};
        moveZerosSwap(arr2);
        System.out.println(Arrays.toString(arr2));   // [1, 2, 3, 0, 0, 0]

        // ── Solution 3: Stream (O(n) extra space, NOT in-place) ───────────
        System.out.println("\\n=== Stream: IntStream.concat (new array, O(n) space) ===");
        int[] arr3 = {0, 1, 2, 3, 0, 0};
        int[] result = IntStream.concat(
            Arrays.stream(arr3).filter(n -> n != 0),   // non-zeros first
            Arrays.stream(arr3).filter(n -> n == 0)    // zeros appended
        ).toArray();
        System.out.println(Arrays.toString(result));    // [1, 2, 3, 0, 0, 0]

        // Stream with List + partitioningBy
        System.out.println("\\n=== Stream: partitioningBy (List version) ===");
        List<Integer> list = Arrays.asList(0, 1, 2, 3, 0, 0);
        Map<Boolean, List<Integer>> parts = list.stream()
            .collect(Collectors.partitioningBy(n -> n != 0));
        List<Integer> moved = Stream.concat(
            parts.get(true).stream(),    // true  = non-zeros
            parts.get(false).stream()    // false = zeros
        ).collect(Collectors.toList());
        System.out.println(moved);

        // ── The same two-pointer pattern solves many problems ─────────────
        System.out.println("\\n=== Same pattern: remove duplicates from sorted array ===");
        // [1, 1, 2, 3, 3, 4] → writePos keeps unique values only
        int[] sorted = {1, 1, 2, 3, 3, 4};
        int wp = 1;
        for (int i = 1; i < sorted.length; i++) {
            if (sorted[i] != sorted[i - 1]) sorted[wp++] = sorted[i];
        }
        System.out.println("Unique count: " + wp + " → " + Arrays.toString(Arrays.copyOf(sorted, wp)));

        System.out.println("\\n=== Same pattern: move negatives to end ===");
        int[] mixed = {-1, 3, -2, 5, 0, -4, 6};
        int wPos = 0;
        int[] copy = mixed.clone();
        for (int n : copy) { if (n >= 0) mixed[wPos++] = n; }
        for (int n : copy) { if (n < 0)  mixed[wPos++] = n; }
        System.out.println(Arrays.toString(mixed));   // [3, 5, 0, 6, -1, -2, -4]

        // ── Dutch national flag ────────────────────────────────────────────
        System.out.println("\\n=== Dutch national flag: sort 0/1/2 in one pass ===");
        int[] flag = {2, 0, 1, 2, 1, 0};
        dutchFlag(flag);
        System.out.println(Arrays.toString(flag));    // [0, 0, 1, 1, 2, 2]

        // ── Interview talking points ───────────────────────────────────────
        System.out.println("\\n=== Key Points ===");
        System.out.println("Naive bubble: O(n²) worst case, AIOOBE on last index");
        System.out.println("Two-pointer write: O(n) time, O(1) space — CANONICAL answer");
        System.out.println("Stream concat: O(n) space — clean but allocates new array");
        System.out.println("Pattern generalizes: zeros, negatives, duplicates, Dutch flag");
        System.out.println("Tip: always clarify — in-place? preserve order? duplicates?");
    }
}`,
      },
      {
        slug: '02-interview-patterns-glossary',
        title: 'Interview Coding Patterns — Reference Glossary',
        order: 2,
        difficulty: 'intermediate',
        tags: ['glossary', 'two-pointers', 'sliding-window', 'binary-search', 'DP', 'BFS', 'DFS', 'backtracking', 'Union-Find', 'interview-common'],
        defaultCode: `import java.util.*;

public class JavaLabRunner {
    // Sliding window — longest substring without repeating characters
    static int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> last = new HashMap<>();
        int max = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (last.containsKey(c) && last.get(c) >= left) {
                left = last.get(c) + 1; // shrink window
            }
            last.put(c, right);
            max = Math.max(max, right - left + 1);
        }
        return max;
    }

    // Monotonic stack — next greater element
    static int[] nextGreater(int[] nums) {
        int n = nums.length;
        int[] result = new int[n];
        Arrays.fill(result, -1);
        Deque<Integer> stack = new ArrayDeque<>(); // stores indices
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
                result[stack.pop()] = nums[i];
            }
            stack.push(i);
        }
        return result;
    }

    // Binary search on answer — minimum capacity to ship all packages in D days
    static int shipWithinDays(int[] weights, int days) {
        int lo = Arrays.stream(weights).max().getAsInt();
        int hi = Arrays.stream(weights).sum();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (canShip(weights, days, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
    static boolean canShip(int[] weights, int days, int capacity) {
        int daysNeeded = 1, current = 0;
        for (int w : weights) {
            if (current + w > capacity) { daysNeeded++; current = 0; }
            current += w;
        }
        return daysNeeded <= days;
    }

    public static void main(String[] args) {
        // Sliding window
        System.out.println("Longest substring 'abcabcbb': " + lengthOfLongestSubstring("abcabcbb")); // 3
        System.out.println("Longest substring 'pwwkew':   " + lengthOfLongestSubstring("pwwkew"));   // 3

        // Monotonic stack
        int[] nums = {2, 1, 2, 4, 3};
        System.out.println("Next greater: " + Arrays.toString(nextGreater(nums))); // [4,2,4,-1,-1]

        // Binary search on answer
        int[] weights = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
        System.out.println("Min ship capacity (10 days): " + shipWithinDays(weights, 10)); // 10
        System.out.println("Min ship capacity (5 days):  " + shipWithinDays(weights, 5));  // 15
    }
}`,
      },
    ],
  },
];

export function getCategoryBySlug(slug: string): JavaCategory | undefined {
  return JAVA_CURRICULUM.find((c) => c.slug === slug);
}

export function getLessonBySlug(categorySlug: string, lessonSlug: string): JavaLesson | undefined {
  const category = getCategoryBySlug(categorySlug);
  return category?.lessons.find((l) => l.slug === lessonSlug);
}

export function getFirstLesson(categorySlug: string): JavaLesson | undefined {
  const category = getCategoryBySlug(categorySlug);
  return category?.lessons[0];
}
