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
