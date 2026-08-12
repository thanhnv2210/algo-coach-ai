# Spring Bean Lifecycle

## Why this matters in interviews

Bean lifecycle questions are a litmus test for Spring depth. Candidates who only know `@Autowired` get stumped when asked what happens between container startup and a bean being ready to use, or why `@PostConstruct` is preferred over a constructor for initialisation logic. This topic also links directly to common production issues: unreleased resources, incomplete initialisation, and shutdown hooks.

## Concept

Spring manages the complete lifecycle of every bean in its container. The sequence for a singleton bean:

```
1.  Instantiation         — constructor called
2.  Property injection    — @Autowired, @Value, setters applied
3.  BeanNameAware         — setBeanName(name) if implemented
4.  BeanFactoryAware      — setBeanFactory(bf) if implemented
5.  ApplicationContextAware — setApplicationContext(ctx) if implemented
6.  BeanPostProcessor     — postProcessBeforeInitialization() for all beans
7.  @PostConstruct        — your init logic (JSR-250, preferred)
8.  InitializingBean      — afterPropertiesSet() if implemented
9.  @Bean(initMethod)     — custom init method if declared
10. BeanPostProcessor     — postProcessAfterInitialization() (AOP proxies created here)
──── Bean in use ────
11. @PreDestroy           — your cleanup logic
12. DisposableBean        — destroy() if implemented
13. @Bean(destroyMethod)  — custom destroy method if declared
```

### Why not put init logic in the constructor?

At constructor time, Spring has not yet injected `@Autowired` fields. Using them in the constructor causes NPE.

```java
@Service
public class CacheService {
    @Autowired
    private DataSource dataSource; // null at constructor time!

    public CacheService() {
        this.dataSource.getConnection(); // NullPointerException!
    }

    @PostConstruct
    public void init() {
        this.dataSource.getConnection(); // safe — injection is complete
    }
}
```

### BeanPostProcessor

`BeanPostProcessor` is how Spring's own infrastructure (AOP, `@Transactional`, `@Async`) wraps beans in proxies. Every bean passes through all registered `BeanPostProcessor`s.

```java
@Component
public class TimingPostProcessor implements BeanPostProcessor {
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        System.out.println("Bean ready: " + beanName);
        return bean; // must return the (possibly wrapped) bean
    }
}
```

### `@Scope` and lifecycle

- **Singleton** (default): created once, destroyed at context close
- **Prototype**: new instance per `getBean()` call; Spring does **not** call `@PreDestroy` on prototypes
- **Request/Session**: one instance per HTTP request/session (web context only)

## Key rules / gotchas

- **`@PostConstruct` is preferred** over `InitializingBean` (Spring coupling) or constructor logic (no injection yet).
- **Spring does not manage `@PreDestroy` on prototype beans.** The caller is responsible for cleanup.
- **`BeanPostProcessor` beans are special** — they are instantiated earlier than normal beans and cannot use `@Autowired` on other beans that themselves require post-processing (circular post-processor issue).
- **`@Bean(destroyMethod = "")` disables auto-detection** of destroy methods — useful for third-party beans like connection pools that have their own shutdown hooks.
- **`ApplicationContext.close()`** triggers the shutdown lifecycle. Without it (e.g., in a non-web app without `SpringApplication.run`), `@PreDestroy` may never fire.
- **`SmartLifecycle`** gives fine-grained control over start/stop ordering across multiple beans — used in message listeners, scheduled tasks, etc.

## Code example

```java
// Simulates Spring bean lifecycle phases without a Spring context.

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

    // Simulates BeanPostProcessor wrapping
    static <T> T applyPostProcessor(T bean, String name) {
        System.out.println("[BPP] postProcessAfterInitialization: " + name);
        return bean; // in real Spring, may return a proxy here
    }

    public static void main(String[] args) throws Exception {
        System.out.println("Phase 1: instantiate");
        DatabasePool pool = new DatabasePool();

        System.out.println("Phase 2: inject properties");
        pool.setUrl("jdbc:postgresql://localhost:5432/mydb");

        System.out.println("Phase 3: BeanPostProcessor (before init)");
        // [BPP] postProcessBeforeInitialization would run here

        System.out.println("Phase 4: @PostConstruct / afterPropertiesSet");
        pool.afterPropertiesSet();

        System.out.println("Phase 5: BeanPostProcessor (after init)");
        pool = applyPostProcessor(pool, "databasePool");

        System.out.println("Phase 6: bean in use");
        pool.query("SELECT * FROM users");
        pool.query("SELECT COUNT(*) FROM orders");

        System.out.println("Phase 7: @PreDestroy / destroy");
        pool.destroy();
    }
}
```

## Interview questions you should be able to answer

- **Q:** Why is `@PostConstruct` preferred over constructor logic for initialisation?
  > At constructor time, `@Autowired` dependencies have not been injected yet — using them causes NPE. `@PostConstruct` runs after full injection, making it the right place to open connections, warm caches, or validate configuration.

- **Q:** When does Spring call `@PreDestroy`?
  > On singleton beans when the `ApplicationContext` is closed (either via `ctx.close()` or a JVM shutdown hook registered by Spring Boot). Prototype-scoped beans never receive `@PreDestroy` — Spring does not track them after creation.

- **Q:** What does a `BeanPostProcessor` do and when is it used?
  > It intercepts every bean during initialisation and can return the original bean or a proxy. Spring uses it internally for AOP (`@Transactional`, `@Async`), `@Scheduled`, validation, and more. Running after `postProcessAfterInitialization` is where AOP proxies are created.

- **Q:** What is the difference between `@PostConstruct` and `InitializingBean.afterPropertiesSet()`?
  > Both run at the same lifecycle point. `@PostConstruct` is a JSR-250 standard annotation with no Spring coupling — preferred for portability and readability. `afterPropertiesSet()` is Spring-specific and requires implementing the `InitializingBean` interface.

- **Q:** How do you control the start/stop order of multiple beans?
  > Implement `SmartLifecycle` and override `getPhase()` — beans with lower phase numbers start first and stop last. Alternatively, use `@DependsOn("beanName")` to declare a startup dependency between beans.

## Further reading

- [Spring Bean Lifecycle — official docs](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-factory-lifecycle)
- [Baeldung: Spring Bean Lifecycle](https://www.baeldung.com/spring-bean-lifecycle)
- [BeanPostProcessor explained](https://www.baeldung.com/spring-beanpostprocessor)
