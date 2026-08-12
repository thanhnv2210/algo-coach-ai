# Spring Data & Repository Pattern

## Why this matters in interviews

Spring Data is the most common data access layer in Java microservices. Interviews test whether you understand what `JpaRepository` gives you for free, how to write custom queries, and — critically — the N+1 problem. The N+1 problem is the single most common Spring Data performance bug in production and a guaranteed interview topic at any company running JPA.

## Concept

### Repository hierarchy

```
Repository<T, ID>             ← marker interface
  └── CrudRepository<T, ID>   ← save, findById, findAll, delete
        └── PagingAndSortingRepository  ← findAll(Pageable), findAll(Sort)
              └── JpaRepository<T, ID>  ← flush, saveAndFlush, deleteInBatch
```

### Derived query methods

Spring Data generates the SQL from the method name:

```java
public interface UserRepository extends JpaRepository<User, Long> {
    // SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);

    // SELECT * FROM users WHERE department_id = ? AND active = ?
    List<User> findByDepartmentIdAndActive(Long deptId, boolean active);

    // SELECT * FROM users WHERE name LIKE ?
    List<User> findByNameContaining(String fragment);

    // SELECT * FROM users ORDER BY created_at DESC LIMIT ?
    List<User> findTop5ByOrderByCreatedAtDesc();
}
```

### Custom queries with `@Query`

```java
@Query("SELECT u FROM User u WHERE u.salary > :min AND u.department.name = :dept")
List<User> findHighEarners(@Param("min") BigDecimal min, @Param("dept") String dept);

// Native SQL
@Query(value = "SELECT * FROM users WHERE EXTRACT(YEAR FROM created_at) = :year",
       nativeQuery = true)
List<User> findByYear(@Param("year") int year);
```

### The N+1 problem

The most critical JPA pitfall. Given `Order` with a lazy `@ManyToOne User`:

```java
// BAD — N+1
List<Order> orders = orderRepo.findAll(); // 1 query: SELECT * FROM orders
for (Order o : orders) {
    System.out.println(o.getUser().getName()); // N queries: SELECT * FROM users WHERE id = ?
}
// Total: 1 + N queries
```

**Fix 1 — JPQL JOIN FETCH**

```java
@Query("SELECT o FROM Order o JOIN FETCH o.user")
List<Order> findAllWithUser();
// 1 query with JOIN
```

**Fix 2 — `@EntityGraph`**

```java
@EntityGraph(attributePaths = {"user", "items"})
List<Order> findAll();
```

**Fix 3 — `@BatchSize`** on the collection — fetches in batches instead of one-by-one.

### Pagination

```java
Page<User> page = userRepo.findAll(PageRequest.of(0, 20, Sort.by("name")));
page.getContent();      // List<User>
page.getTotalElements();
page.getTotalPages();
```

## Key rules / gotchas

- **`@Transactional` on the service layer**, not the repository. `JpaRepository` methods are already transactional; your service method wraps them in a single transaction.
- **Lazy loading outside a transaction throws `LazyInitializationException`.** The Hibernate session is closed after the transaction ends. Fix: use `@Transactional`, fetch eagerly, or use DTOs.
- **`save()` does both insert and update** — it calls `persist` for new entities and `merge` for existing ones (detected via the `id` field being null or non-null).
- **`deleteInBatch(entities)` skips JPA lifecycle callbacks** (`@PreRemove`, cascade) — it executes a single DELETE SQL. Use with care.
- **`findAll()` returns all rows** — always use `Pageable` in production for tables with more than a few thousand rows.
- **Projections**: return interfaces or records with only the fields you need — avoids loading full entity graphs: `List<UserNameOnly> findByActive(boolean active);`

## Code example

```java
import java.util.*;
import java.util.stream.*;

// Simulates Spring Data repository pattern without JPA/Hibernate.
public class JavaLabRunner {
    record User(int id, int deptId, String name, String email) {}
    record Department(int id, String name) {}

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
        Optional<User> findByEmail(String email) {
            return store.stream().filter(u -> u.email().equals(email)).findFirst();
        }
        User save(User user) {
            store.removeIf(u -> u.id() == user.id()); // upsert
            store.add(user);
            return user;
        }
        boolean deleteById(int id) { return store.removeIf(u -> u.id() == id); }
    }

    static class DeptRepository {
        private final Map<Integer, Department> store = Map.of(
            10, new Department(10, "Engineering"),
            20, new Department(20, "Marketing")
        );
        Optional<Department> findById(int id) { return Optional.ofNullable(store.get(id)); }
    }

    public static void main(String[] args) {
        UserRepository users = new UserRepository();
        DeptRepository depts = new DeptRepository();

        // Derived query methods
        System.out.println("findByEmail: " + users.findByEmail("alice@example.com"));
        System.out.println("findByDeptId(10): " + users.findByDeptId(10));

        // N+1 problem — BAD
        System.out.println("\n[N+1 BAD] Separate query per user:");
        users.findAll().forEach(u -> {
            // In JPA: triggers SELECT FROM departments WHERE id = ?  for EACH user
            String dept = depts.findById(u.deptId()).map(Department::name).orElse("?");
            System.out.println("  " + u.name() + " -> " + dept);
        });

        // Fix: JOIN FETCH equivalent — load all needed departments in one shot
        System.out.println("\n[N+1 FIX] Batch-load departments:");
        Set<Integer> deptIds = users.findAll().stream().map(User::deptId).collect(Collectors.toSet());
        Map<Integer, String> deptCache = deptIds.stream()
            .collect(Collectors.toMap(id -> id,
                     id -> depts.findById(id).map(Department::name).orElse("?")));
        users.findAll().forEach(u ->
            System.out.println("  " + u.name() + " -> " + deptCache.get(u.deptId()))
        );

        // Pagination simulation
        System.out.println("\nPage 0, size 2:");
        users.findAll().stream().skip(0).limit(2)
             .forEach(u -> System.out.println("  " + u));

        // save (upsert) + delete
        users.save(new User(1, 10, "Alice Smith", "alice@example.com")); // update
        System.out.println("\nAfter update: " + users.findById(1));
        users.deleteById(3);
        System.out.println("After delete: " + users.findAll().size() + " users");
    }
}
```

## Interview questions you should be able to answer

- **Q:** What is the N+1 problem and how do you fix it in Spring Data JPA?
  > When fetching a list of entities with lazy associations, JPA executes 1 query to get the list plus N additional queries to load each association — N+1 total. Fix with `JOIN FETCH` in `@Query`, `@EntityGraph` on the repository method, or `@BatchSize` on the collection mapping.

- **Q:** What is the difference between `findById` and `getById` in `JpaRepository`?
  > `findById` returns `Optional<T>` and hits the database immediately. `getById` (formerly `getOne`) returns a lazy proxy — it does not hit the database until a field is accessed, and throws `EntityNotFoundException` outside a transaction if the entity doesn't exist. Prefer `findById` to avoid surprises.

- **Q:** When does Spring Data call `persist` vs `merge` inside `save()`?
  > Spring Data checks if the entity's `@Id` field is `null` (or `0` for primitives). If null, it calls `EntityManager.persist` (INSERT). If non-null, it calls `EntityManager.merge` (SELECT + UPDATE). You can override this by implementing `Persistable<ID>` and controlling `isNew()`.

- **Q:** How do you return only specific fields from a JPA query (projection)?
  > Define an interface with getter methods matching entity field names. Spring Data will generate a proxy that only fetches those columns: `interface UserView { String getName(); String getEmail(); }` then `List<UserView> findByActive(boolean active)`.

- **Q:** How does `@Transactional(readOnly = true)` improve performance?
  > It tells Hibernate to skip dirty checking (no need to track entity changes for flush) and hints the JDBC driver/database that the connection is read-only. Some databases optimise read-only transactions by routing to read replicas. Hibernate also skips building the "snapshot" of entity state, reducing memory and CPU overhead.

## Further reading

- [Spring Data JPA documentation](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
- [Baeldung: Spring Data JPA](https://www.baeldung.com/the-persistence-layer-with-spring-data-jpa)
- [Vlad Mihalcea: N+1 Query Problem](https://vladmihalcea.com/n-plus-1-query-problem/)
