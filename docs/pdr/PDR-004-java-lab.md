# PDR-004 — Java Lab: Personal Java Learning & Practice Environment

**Date:** 2026-08-12
**Status:** Accepted

## Context

The engineer is preparing for Senior Software Engineer interviews at companies requiring strong Java proficiency. Existing public platforms (w3schools, Baeldung, LeetCode) are designed for mass audiences — they lack personal progress tracking, opinionated topic ordering for senior-level interviews, and a tightly integrated code runner tailored to the engineer's own study style.

AlgoCoach AI already has the scaffolding for a personal learning platform. Extending it with a Java Lab section is the lowest-effort path to a high-value outcome.

## Decision

Add a **/java-lab** section to AlgoCoach AI: a personal, w3schools-style Java learning environment combining:

1. **Topic browser** — structured Java curriculum navigable by category and chapter
2. **Lesson reader** — markdown-rendered lesson content with syntax-highlighted code examples
3. **Live code editor** — Monaco Editor (already installed) pre-loaded with runnable Java snippets
4. **Code runner** — Next.js API route that shells out to local `javac` + `java` for instant output
5. **Progress tracking** — per-lesson read/done status stored in PostgreSQL (same DB, new schema tables)
6. **AI explain** — "Explain this snippet" button calls Claude to explain selected code in context

## Rationale

- **Personal use** — no multi-tenancy, no auth overhead. The platform is already single-user.
- **Local Java runner** — `javac` + `java` subprocess is deterministic, zero-latency, free. No dependency on Judge0 or external APIs.
- **Monaco Editor already installed** — `@monaco-editor/react ^4.7.0` is in `package.json`. Java syntax highlighting is built in.
- **Interview-first curriculum** — content is scoped to topics that appear in Senior Java interviews (not beginner syntax tutorials).
- **Incremental delivery** — Phase 1 ships static lesson content (no DB, no runner). Phase 2 adds the runner and progress tracking.

## Impact

- New route group: `app/(dashboard)/java-lab/`
- New API route: `app/api/java/run/route.ts` — requires Java installed locally (`java -version` ≥ 17)
- New DB tables: `java_lessons`, `java_lesson_progress` under `pgSchema('algo_coach')`
- New components directory: `components/java-lab/`
- No changes to existing routes, schema, or services
