# Spring Security Overview

## Why this matters in interviews

Security is non-negotiable at the senior level. Every company expects you to know how Spring Security's filter chain works, how JWT authentication fits into it, what `SecurityContext` is, and the difference between authentication and authorisation. Interviews regularly ask you to design or debug a security configuration — knowing the flow end-to-end lets you answer with confidence.

## Concept

### The security filter chain

Spring Security is implemented as an ordered chain of `javax.servlet.Filter`s registered with the servlet container via `DelegatingFilterProxy`. The key filter is `FilterSecurityInterceptor` (authorisation) preceded by various authentication filters.

```
Request
  │
  ▼
DelegatingFilterProxy
  │
  ▼ SpringSecurityFilterChain (ordered filters)
  ├── SecurityContextPersistenceFilter   (load SecurityContext from session/token)
  ├── UsernamePasswordAuthenticationFilter (form login)
  ├── BearerTokenAuthenticationFilter    (JWT / OAuth2)
  ├── ExceptionTranslationFilter         (401 / 403 responses)
  └── FilterSecurityInterceptor          (authorisation: @PreAuthorize, URL rules)
  │
  ▼
DispatcherServlet → Controller
```

### SecurityContextHolder

Stores the `Authentication` object for the current thread using `ThreadLocal`. Available anywhere in the request:

```java
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
UserDetails user = (UserDetails) auth.getPrincipal();
```

### Authentication vs Authorisation

| | Authentication | Authorisation |
|--|--|--|
| Question | Who are you? | What can you do? |
| Spring class | `AuthenticationManager`, `UserDetailsService` | `AccessDecisionManager`, `@PreAuthorize` |
| Token | `UsernamePasswordAuthenticationToken` | `GrantedAuthority` (`ROLE_ADMIN`) |
| HTTP status on failure | 401 Unauthorized | 403 Forbidden |

### JWT flow

```
1. POST /auth/login  { username, password }
2. Server validates → generates JWT (header.payload.signature)
3. Client stores JWT (localStorage or httpOnly cookie)
4. All subsequent requests: Authorization: Bearer <token>
5. BearerTokenAuthenticationFilter validates JWT → sets SecurityContext
6. Controller accesses principal via @AuthenticationPrincipal
```

### Method security

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig { ... }

@RestController
public class AdminController {
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public String admin() { return "admin dashboard"; }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public User getUser(@PathVariable Long id) { ... }
}
```

### `UserDetailsService`

The central hook for loading user data:

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepo.findByEmail(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return new org.springframework.security.core.userdetails.User(
            user.getEmail(), user.getPasswordHash(),
            List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}
```

## Key rules / gotchas

- **ROLE_ prefix is mandatory** for `hasRole()`. `hasRole('ADMIN')` matches authority `ROLE_ADMIN`. Use `hasAuthority('ADMIN')` to skip the prefix.
- **CSRF protection is enabled by default.** Disable for stateless REST APIs: `.csrf(AbstractHttpConfigurer::disable)`.
- **Security context is thread-local** — `@Async` methods run in a different thread and lose the security context by default. Configure `SecurityContextHolder.setStrategyName(MODE_INHERITABLETHREADLOCAL)` or use `DelegatingSecurityContextExecutor`.
- **`@PreAuthorize` requires `@EnableMethodSecurity`** (Spring Security 6) or `@EnableGlobalMethodSecurity(prePostEnabled = true)` (Spring Security 5).
- **Password hashing**: never store plain-text passwords. Use `BCryptPasswordEncoder` — it includes the salt in the hash and is designed to be slow (adjustable cost factor).
- **JWT secret rotation**: if the signing key is compromised, all tokens are invalid — plan for key rotation. Use short expiry + refresh tokens.
- **`permitAll()` vs `anonymous()`**: `permitAll()` allows any request including authenticated ones. `anonymous()` allows only unauthenticated requests.

## Code example

```java
import java.util.*;
import java.util.Base64;

// Simulates Spring Security filter chain and JWT auth without Spring/libraries.
public class JavaLabRunner {
    record UserPrincipal(String username, List<String> roles) {}

    // Simulates SecurityContextHolder (ThreadLocal)
    static final ThreadLocal<UserPrincipal> SECURITY_CONTEXT = new ThreadLocal<>();
    static void setAuth(UserPrincipal p)  { SECURITY_CONTEXT.set(p); }
    static UserPrincipal getAuth()         { return SECURITY_CONTEXT.get(); }
    static void clearAuth()                { SECURITY_CONTEXT.remove(); }

    // Minimal JWT simulation (not cryptographically secure — for demo only)
    static String createToken(String username, String role) {
        String payload = Base64.getEncoder().encodeToString((username + ":" + role).getBytes());
        return "header." + payload + ".sig";
    }

    static Optional<UserPrincipal> validateToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return Optional.empty();
            String decoded = new String(Base64.getDecoder().decode(parts[1]));
            String[] claims = decoded.split(":");
            return Optional.of(new UserPrincipal(claims[0], List.of(claims[1])));
        } catch (Exception e) { return Optional.empty(); }
    }

    // Simulates BearerTokenAuthenticationFilter
    static boolean jwtFilter(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("[Security] No token — anonymous request");
            return false;
        }
        Optional<UserPrincipal> principal = validateToken(authHeader.substring(7));
        principal.ifPresentOrElse(
            p -> { setAuth(p); System.out.println("[Security] Authenticated: " + p.username() + " roles=" + p.roles()); },
            ()  -> System.out.println("[Security] Invalid token → 401")
        );
        return principal.isPresent();
    }

    // Simulates @PreAuthorize("hasRole('ADMIN')")
    static void requireRole(String role) {
        UserPrincipal auth = getAuth();
        if (auth == null || !auth.roles().contains(role)) {
            System.out.println("[AuthZ] 403 Forbidden — requires role: " + role);
            throw new RuntimeException("403 Forbidden");
        }
    }

    static void adminDashboard() {
        requireRole("ADMIN");
        System.out.println("[Controller] Admin dashboard — welcome, " + getAuth().username());
    }

    static void userProfile() {
        if (getAuth() == null) { System.out.println("[Controller] 401 Unauthorized"); return; }
        System.out.println("[Controller] Profile for: " + getAuth().username());
    }

    public static void main(String[] args) {
        System.out.println("=== No token — anonymous ===");
        jwtFilter(null);
        userProfile(); // 401

        System.out.println("\n=== Invalid token ===");
        jwtFilter("Bearer not.valid.token");

        System.out.println("\n=== Valid USER token ===");
        jwtFilter("Bearer " + createToken("alice", "USER"));
        userProfile();          // 200
        try { adminDashboard(); } catch (Exception e) {} // 403

        System.out.println("\n=== Valid ADMIN token ===");
        clearAuth();
        jwtFilter("Bearer " + createToken("bob", "ADMIN"));
        userProfile();    // 200
        adminDashboard(); // 200

        clearAuth();
    }
}
```

## Interview questions you should be able to answer

- **Q:** What is the difference between 401 and 403 in Spring Security?
  > 401 (Unauthorized) means the request is not authenticated — no valid credentials were provided. 403 (Forbidden) means the request is authenticated but the user lacks the required role/permission. Spring Security throws `AuthenticationException` for 401 and `AccessDeniedException` for 403, both caught by `ExceptionTranslationFilter`.

- **Q:** How does Spring Security know which `UserDetails` to load for a JWT?
  > The `BearerTokenAuthenticationFilter` extracts and validates the JWT, then calls `UserDetailsService.loadUserByUsername(subject)` to load the full user from the database (or cache). The resulting `UserDetails` is wrapped in an `Authentication` and stored in `SecurityContextHolder`.

- **Q:** Why should CSRF be disabled for stateless REST APIs?
  > CSRF attacks exploit cookies — the browser automatically sends cookies on cross-origin requests. Stateless REST APIs authenticated via JWT in the `Authorization` header (not cookies) are not vulnerable to CSRF. Keeping CSRF protection adds overhead (token in every form/header) with no security benefit.

- **Q:** How do you propagate the Spring Security context to `@Async` methods?
  > By default, `SecurityContextHolder` uses `MODE_THREADLOCAL` — the context is not copied to child threads. Change to `MODE_INHERITABLETHREADLOCAL` for thread inheritance, or wrap the executor with `DelegatingSecurityContextExecutor` to explicitly propagate the context.

- **Q:** What is the difference between `hasRole` and `hasAuthority` in `@PreAuthorize`?
  > `hasRole('ADMIN')` checks for the authority `ROLE_ADMIN` (Spring Security prepends `ROLE_` automatically). `hasAuthority('ADMIN')` checks for exactly the string `ADMIN` with no prefix. If your granted authorities don't use the `ROLE_` convention, use `hasAuthority`.

## Further reading

- [Spring Security reference](https://docs.spring.io/spring-security/reference/)
- [Baeldung: Spring Security JWT](https://www.baeldung.com/spring-security-oauth-jwt)
- [Spring Security Architecture overview](https://spring.io/guides/topicals/spring-security-architecture)
