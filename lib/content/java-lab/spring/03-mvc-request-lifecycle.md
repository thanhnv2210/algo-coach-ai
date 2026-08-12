# Spring MVC Request Lifecycle

## Why this matters in interviews

"Walk me through what happens when a request hits your Spring Boot application" is one of the most common senior backend interview questions. A shallow answer names the controller. A strong answer walks through the Servlet container, `DispatcherServlet`, `HandlerMapping`, filters vs interceptors vs AOP advice, argument resolvers, and view resolution. This knowledge also explains why things like `@Transactional` on a controller method may not work as expected.

## Concept

```
Client
  │
  ▼
Servlet Container (Tomcat/Jetty)
  │  ← javax.servlet.Filter chain (SecurityFilter, CorsFilter, LoggingFilter…)
  ▼
DispatcherServlet   ← the single Front Controller
  │
  ├─ HandlerMapping      → finds the @RequestMapping method for this URL
  ├─ HandlerAdapter      → knows how to invoke the handler (reflection, arg resolution)
  │    └─ HandlerInterceptor.preHandle()
  │         └─ @Controller method(args...)   ← argument resolvers inject @PathVariable, @RequestBody…
  │         └─ HandlerInterceptor.postHandle()
  ├─ ExceptionResolver   → @ExceptionHandler / @ControllerAdvice
  └─ ViewResolver        → resolves view name → Thymeleaf / JSON via HttpMessageConverter
  │
  ▼
Client ← HTTP response
```

### Filters vs Interceptors vs AOP

| | Servlet Filter | HandlerInterceptor | AOP Advice |
|--|--|--|--|
| Runs at | Servlet layer — before DispatcherServlet | DispatcherServlet layer | Method invocation (Spring proxy) |
| Access to | Raw `ServletRequest/Response` | `HandlerMethod`, `ModelAndView` | Method args, return value, exception |
| Use for | Auth, CORS, compression, logging | Pre/post controller logic, model enrichment | Cross-cutting: TX, caching, metrics |
| Can short-circuit | ✅ `chain.doFilter` not called | ✅ `preHandle` returns `false` | ✅ throw or return early |

### `@ControllerAdvice`

Global exception handling across all controllers:

```java
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex) {
        return new ErrorResponse(ex.getMessage());
    }
}
```

### Argument resolution

Spring MVC uses `HandlerMethodArgumentResolver` to populate controller parameters:

| Annotation | Source |
|------------|--------|
| `@PathVariable` | URI template |
| `@RequestParam` | Query string |
| `@RequestBody` | Request body via `HttpMessageConverter` (Jackson) |
| `@RequestHeader` | HTTP header |
| `@AuthenticationPrincipal` | Spring Security context |

## Key rules / gotchas

- **`@Transactional` on a controller method is an anti-pattern.** Transactions should live in the service layer, not the web layer. A controller method's `@Transactional` is applied by AOP on the proxy, but the transaction semantics mix with HTTP concerns.
- **Filters run outside the Spring context** — they cannot `@Autowired` Spring beans using field injection (the Servlet container creates them). Use `DelegatingFilterProxy` to bridge.
- **`HandlerInterceptor.postHandle`** is NOT called if the handler throws an exception — use `afterCompletion` for cleanup that must always run.
- **`@ControllerAdvice` order** can be controlled with `@Order` or `Ordered` — lower values = higher priority.
- **Content negotiation**: Spring MVC selects the `HttpMessageConverter` (JSON, XML, etc.) based on `Accept` header and the converter's supported media types.
- **Async requests** (`DeferredResult`, `Callable`, `@Async`) release the Servlet thread immediately; interceptors and filters behave differently in async mode.

## Code example

```java
// Simulates the Spring MVC request pipeline without Servlet/Spring context.

public class JavaLabRunner {
    record HttpRequest(String method, String path, String body) {}
    record HttpResponse(int status, String body) {}

    interface Filter {
        HttpResponse doFilter(HttpRequest req, FilterChain chain);
    }
    interface FilterChain {
        HttpResponse proceed(HttpRequest req);
    }
    interface HandlerInterceptor {
        boolean preHandle(HttpRequest req);
        void postHandle(HttpRequest req, HttpResponse res);
        void afterCompletion(HttpRequest req, HttpResponse res, Exception ex);
    }

    static class CorsFilter implements Filter {
        public HttpResponse doFilter(HttpRequest req, FilterChain chain) {
            System.out.println("[Filter] CORS check for " + req.path());
            HttpResponse res = chain.proceed(req);
            System.out.println("[Filter] Adding CORS headers");
            return res;
        }
    }

    static class LoggingInterceptor implements HandlerInterceptor {
        public boolean preHandle(HttpRequest req) {
            System.out.println("[Interceptor] preHandle: " + req.method() + " " + req.path());
            return true;
        }
        public void postHandle(HttpRequest req, HttpResponse res) {
            System.out.println("[Interceptor] postHandle: status=" + res.status());
        }
        public void afterCompletion(HttpRequest req, HttpResponse res, Exception ex) {
            System.out.println("[Interceptor] afterCompletion (always runs)");
        }
    }

    static class UserController {
        HttpResponse getUser(String id) {
            System.out.println("[Controller] @GetMapping /users/{id} id=" + id);
            if ("999".equals(id)) throw new RuntimeException("User not found: " + id);
            return new HttpResponse(200, "{\"id\":" + id + ",\"name\":\"Alice\"}");
        }
    }

    static HttpResponse globalExceptionHandler(RuntimeException e) {
        System.out.println("[ControllerAdvice] Handling: " + e.getMessage());
        return new HttpResponse(404, "{\"error\":\"" + e.getMessage() + "\"}");
    }

    public static void main(String[] args) {
        CorsFilter filter = new CorsFilter();
        LoggingInterceptor interceptor = new LoggingInterceptor();
        UserController controller = new UserController();

        System.out.println("=== Request 1: GET /users/42 ===");
        filter.doFilter(new HttpRequest("GET", "/users/42", null), req -> {
            HttpResponse res = null;
            Exception caught = null;
            if (!interceptor.preHandle(req)) return new HttpResponse(403, "Forbidden");
            try {
                String id = req.path().split("/")[2];
                res = controller.getUser(id);
                interceptor.postHandle(req, res);
            } catch (RuntimeException e) {
                caught = e;
                res = globalExceptionHandler(e);
            } finally {
                interceptor.afterCompletion(req, res, caught);
            }
            return res;
        });

        System.out.println("\n=== Request 2: GET /users/999 (not found) ===");
        filter.doFilter(new HttpRequest("GET", "/users/999", null), req -> {
            HttpResponse res = null;
            Exception caught = null;
            if (!interceptor.preHandle(req)) return new HttpResponse(403, "Forbidden");
            try {
                String id = req.path().split("/")[2];
                res = controller.getUser(id);
                interceptor.postHandle(req, res);
            } catch (RuntimeException e) {
                caught = e;
                res = globalExceptionHandler(e);
            } finally {
                interceptor.afterCompletion(req, res, caught);
            }
            return res;
        });
    }
}
```

## Interview questions you should be able to answer

- **Q:** What is `DispatcherServlet` and why is it called a Front Controller?
  > `DispatcherServlet` is the single entry point for all HTTP requests in a Spring MVC app. It delegates to `HandlerMapping` (route resolution), `HandlerAdapter` (invocation), `ExceptionResolver` (error handling), and `ViewResolver` (response rendering). The Front Controller pattern centralises cross-cutting concerns like auth and logging.

- **Q:** What is the difference between a Servlet Filter and a Spring `HandlerInterceptor`?
  > Filters operate at the Servlet container level, before `DispatcherServlet`, and have access to raw `ServletRequest/Response`. Interceptors are Spring-specific, operate inside `DispatcherServlet`, and have access to the resolved `HandlerMethod` and `ModelAndView`. Use filters for concerns that apply before Spring (CORS, security), interceptors for Spring-specific pre/post controller logic.

- **Q:** Why doesn't `HandlerInterceptor.postHandle()` run when the controller throws?
  > Spring only calls `postHandle` on the success path. For cleanup that must always run (logging, releasing resources), use `afterCompletion`, which is called regardless of whether the handler threw an exception.

- **Q:** How does `@ControllerAdvice` differ from a try/catch in every controller?
  > `@ControllerAdvice` is a global AOP-based exception handler. It centralises error-response mapping in one place, keeps controllers clean, and applies consistently across the entire application without duplication.

- **Q:** How does Spring resolve `@RequestBody` to a Java object?
  > `DispatcherServlet` selects an `HttpMessageConverter` based on the `Content-Type` header. For `application/json`, `MappingJackson2HttpMessageConverter` reads the request body and deserialises it using Jackson, then passes the object to the controller parameter.

## Further reading

- [Spring MVC Architecture — official docs](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-dispatcher-servlet)
- [Baeldung: Handler Interceptors](https://www.baeldung.com/spring-mvc-handlerinterceptor)
- [Baeldung: ControllerAdvice](https://www.baeldung.com/exception-handling-for-rest-with-spring)
