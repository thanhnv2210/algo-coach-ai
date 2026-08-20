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
