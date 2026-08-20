# Session Summary — 2026-08-21

## What Was Built This Session

### 1. Mobile UI Fixes (P0 — iOS Touch Bugs)

**Root cause:** iOS WebKit blocks touch events on `position: fixed` children when ANY ancestor has `overflow: hidden`.

**Files changed:**
- `app/(dashboard)/layout.tsx` — removed all `overflow-hidden`, changed `h-screen` → `h-dvh`
- `components/nav/mobile-nav.tsx` — full rewrite using `createPortal` to `document.body`, added `touchAction: "manipulation"`, body scroll lock, route-change close
- `components/java-lab/LessonLayout.tsx` — removed nested `overflow-hidden` from all wrapper divs
- `components/java-lab/LessonNav.tsx` — removed `overflow-hidden`
- `app/(dashboard)/java-lab/[category]/[lesson]/page.tsx` — removed `h-[calc(100vh-0px)] overflow-hidden`
- `components/practice/practice-shell.tsx` — `h-screen` → `h-dvh`

**Rule learned:** Only use `overflow-hidden` on leaf/decorative elements (e.g. progress bars). Use `overflow-y-auto` only on the scrollable `<main>`.

---

### 2. Global UI State (ThemeProvider Extension)

**File:** `components/theme-provider.tsx`

Added 3 global persistent states via localStorage:
- `showEditor` / `setShowEditor` → `algo-coach-ai:show-editor`
- `sidebarCollapsed` / `setSidebarCollapsed` → `algo-coach-ai:sidebar-collapsed`
- `navCollapsed` / `setNavCollapsed` → `algo-coach-ai:nav-collapsed`

---

### 3. Collapsible Sidebars

- `components/nav/sidebar.tsx` — rail mode (`w-14`, icons + tooltips) vs full (`w-56`), uses `navCollapsed`
- `components/java-lab/LessonNav.tsx` — collapsed (`w-10`, dot indicators) vs full (`w-56`), uses `sidebarCollapsed`

---

### 4. Show/Hide Code Editor Toggle

- `components/java-lab/LessonLayout.tsx` — "Hide code" / "Show code" button; uses global `showEditor` from ThemeProvider

---

### 5. Client Error Logging

- `lib/db/schema.ts` — added `client_errors` table
- `app/api/log/client-error/route.ts` — POST endpoint, never throws
- `components/error-reporter.tsx` — `window.onerror` + `unhandledrejection` listener, POSTs with `keepalive: true`
- `app/error.tsx` + `app/global-error.tsx` — React error boundaries that also POST to the logging endpoint

---

### 6. Star / Critical Topics Feature

**DB change:** Added `starred: integer` column to `java_lesson_progress` table.

**New files:**
- `services/java-lab.service.ts` — `toggleStarred()` and `getStarredLessons()` functions
- `app/api/java/progress/route.ts` — `PATCH` handler for star toggle
- `app/api/java/lesson/route.ts` — `GET` endpoint serving markdown content by category+lesson slug
- `app/(dashboard)/critical/page.tsx` — server component fetching starred lessons
- `app/(dashboard)/critical/critical-client.tsx` — client component with drawer state
- `components/java-lab/LessonDrawer.tsx` — slide-over drawer using `createPortal`, lazy fetches markdown

**LessonDrawer widths:** `w-full sm:w-[600px] lg:w-[700px] xl:w-[900px] 2xl:w-[1100px]`

---

### 7. New Java Lab Lessons

**Architecture Decision Cards (ADC) in `interview-patterns/`:**
- `03-adc-collection-selection` — Which Collection Should I Use?
- `04-adc-concurrency-primitive` — Which Concurrency Primitive?
- `05-adc-thread-pool` — Thread Pool Sizing
- `06-adc-object-creation` — Singleton / Object Creation Patterns
- `07-adc-stream-vs-loop` — Stream vs Loop Decision

**Big Data / Senior Patterns:**
- `collections/10-big-data-collection-patterns` — Mistakes vs Best Practices
- `streams/06-big-data-stream-patterns` — Mistakes vs Best Practices
- `concurrency/10-big-data-concurrency-patterns` — Mistakes vs Best Practices

**Custom Spring Boot Interview Lessons (based on domain interview):**
- `interview-patterns/08-sb-exception-handling` — @ControllerAdvice + Dynatrace alerting
- `interview-patterns/09-sb-saga-orchestration` — Remittance Saga orchestrator + compensation chain
- `interview-patterns/10-sb-api-versioning` — Fixing the single-endpoint versioning trap
- `interview-patterns/11-sb-async-queue-flow` — Send Money: 202 Accepted → queue → callback → notify
- `interview-patterns/12-sb-idempotency` — 2-layer idempotency: Redis + DB unique constraint

---

## Domain Interview Summary (Spring Boot — Financial Domain)

### Your Stack
- Mixed reactive (R2DBC) + blocking (JPA, JdbcTemplate) — same service, context-dependent
- Payment / AML / Remittance domain
- API Gateway (30s timeout) — this is a hard constraint on sync flows
- Dynatrace for monitoring (currently missing alert integration)

### Architecture Decisions
- **Saga pattern:** Remittance service is the orchestrator. Every rollback is executed by this service.
- **State machine + compensation:** Fund pull is the point of no return. Before = clean exit. After = must refund.
- **Idempotency:** Redis first gate (setIfAbsent, 30s IN_FLIGHT TTL) + DB unique constraint fallback. Return 429 for in-flight duplicates.
- **Async flow:** Submit returns 202 Accepted after saving to queue. AML → Forter → Fund Pull → Third-party → Callback → Email + Push notification.
- **Redis strategy:** Selective caching (API Gateway responses, materialized views for complex queries). Not a write-through cache.

### Current Pain Points
1. **API versioning** — single endpoint with `if version == X` branches. Mobile has multiple active app versions. Backward compat often missed under time-to-market pressure.
   - **Fix path:** Request Mapper Delegation pattern (one mapper class per version, controller stays clean)
2. **Dynatrace alerting** — `@ControllerAdvice` logs everything, but no programmatic alert to Dynatrace on critical failures.
   - **Fix path:** Micrometer + Dynatrace metrics exporter. Counter per error type → anomaly alert in Dynatrace UI.
3. **Production debugging** — missing observability tools (JFR, DB diagnostics).
   - JFR for memory leaks: `jcmd <pid> JFR.start duration=120s filename=/tmp/profile.jfr`
   - PostgreSQL autovacuum/index bloat: `pg_stat_user_tables`, `pg_stat_user_indexes`

### Exception Handling Strategy
- Global `@ControllerAdvice` with case-by-case log levels
- Masking flag for PII (account numbers, phone — show last 4 digits only)
- Log level per milestone: INFO (AML passed), WARN (retryable external), ERROR (financial-critical / unexpected)
- `traceId` in every error response body (for Dynatrace correlation)

### Send Money Flow (End-to-End)
```
Customer → input amount → preview draft (FX rate, fee)
         → click Submit
         → 202 Accepted + txnId + journeyUrl

[Background worker]
  AML Scan → Forter check → Fund Pull → Third-party API
  → CALLBACK_PENDING

[Third-party callback]
  → COMPLETED
  → Email notification (async)
  → Push notification (async)
```

---

## Deferred / TODO

- **Mobile UI refactor** (saved to memory at `memory/project_mobile_refactor.md`) — full rebuild of layout hierarchy without nested `overflow-hidden`. Resume after interview prep is complete.
- Spring Boot lesson set could be expanded with: Redis cache patterns, R2DBC reactive chains, circuit breaker with Resilience4j, JPA N+1 detection.

---

## Key Technical Rules Learned

| Rule | Why |
|------|-----|
| Never put `overflow-hidden` on layout wrapper divs | iOS WebKit blocks touch on `fixed` children |
| Use `h-dvh` not `h-screen` on mobile | Dynamic viewport accounts for iOS address bar |
| Add `touchAction: "manipulation"` to tap targets | Eliminates 300ms tap delay on iOS |
| Use `createPortal` for drawers/modals | Escapes all ancestor stacking contexts |
| Never let notification failures propagate to saga | Notification failure must not mark transaction as failed |
| Release idempotency key on processing failure | Otherwise client is locked out for 30s |
| Persist txn state to DB before calling third-party | Enables resume on orchestrator restart |
