# PDR-003 — Skip NextAuth for Single-User Personal Tool

**Date:** 2026-05-31
**Status:** Accepted
**Deciders:** Thanh Nguyen

---

## Context

Phase 3 of the original proposal included NextAuth v5 for authentication — a single seeded user, no login UI for the MVP.

AlgoCoach AI is a personal local tool. There is no concept of multiple users, no shared deployment, and no need to isolate progress data per identity. The app runs on localhost:3015, accessible only to the developer.

## Decision

Skip NextAuth entirely. No authentication middleware, no session management, no seeded user row.

All progress, questions, and confidence data are stored in the `algo_coach` PostgreSQL schema without a `user_id` column. The single user is implicitly the person running the app.

## Consequences

**Positive:**
- Removes significant complexity (session config, cookie management, middleware, seeding a user row)
- No `AUTH_SECRET` or `NEXTAUTH_URL` environment variables needed
- API routes stay simple — no session validation guards
- No risk of session expiry breaking the app mid-session

**Negative:**
- Cannot support multiple users without a schema migration
- Not deployable as a shared SaaS without adding auth back

## Trade-off

This is a deliberate scope decision for a single-user personal tool. If the scope changes to a shared/hosted product, NextAuth v5 (or Clerk) can be added back with a foreign key migration on the progress and questions tables.
