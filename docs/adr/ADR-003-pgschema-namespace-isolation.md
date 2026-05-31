# ADR-003 — pgSchema Namespace Isolation

**Date:** 2026-05-31
**Status:** Accepted

## Context

All Next.js full-stack apps in this workspace share a single local PostgreSQL instance on port 54320. Without namespacing, table names from different apps collide — e.g. both `career-growth-copilot` and `algo-coach-ai` could have a `topics` table in the `public` schema.

This pattern was established in `communication-ai-assistant` (schema: `communication_assistant`) and `career-growth-copilot`.

## Decision

All Drizzle tables are defined under **`pgSchema('algo_coach')`**. Every table lives in the `algo_coach` PostgreSQL schema, completely isolated from other apps.

## Consequences

- **Good:** Zero collision risk with other workspace apps on the shared Postgres instance.
- **Good:** `db:reset` only drops the `algo_coach` schema — other apps are unaffected.
- **Trade-off:** Slightly more verbose Drizzle setup (must pass schema object to table factories).
- **Risk:** None.
