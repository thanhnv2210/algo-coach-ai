# ADR-002 — Drizzle ORM with `postgres` Driver

**Date:** 2026-05-31
**Status:** Accepted

## Context

The application needs a type-safe way to interact with PostgreSQL. Options evaluated:
- Prisma — popular, but generates a separate client with complex migrations and heavy runtime
- Drizzle ORM + `postgres` driver — lightweight, schema-as-code, SQL-close API
- Raw `pg` / `postgres` — full control but no type safety

## Decision

Use **Drizzle ORM** with the **`postgres`** driver. Schema defined in `lib/db/schema.ts` under `pgSchema('algo_coach')` for namespace isolation on the shared local Postgres instance.

## Consequences

- **Good:** Schema is TypeScript — refactoring the schema refactors the queries.
- **Good:** Migrations are plain SQL files (committed to `drizzle/`) — easy to review and debug.
- **Good:** No separate Prisma client binary — faster cold starts.
- **Trade-off:** Drizzle is less battle-tested than Prisma for complex relational queries.
- **Risk:** None significant at this scale.
