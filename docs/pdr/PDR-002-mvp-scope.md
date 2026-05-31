# PDR-002 — MVP Scope: Static Theory First, DB Second

**Date:** 2026-05-31
**Status:** Accepted

## Context

The original proposal had Phase 1 as a full MVP with DB, migrations, seed data, and AI integration all at once. Before committing to that infrastructure, there was a concern about how algorithm content would actually *look* on the UI — complexity tables, code examples, pattern descriptions — before wiring up a database.

## Decision

Phase 1 is split into two milestones:

**Phase 1 — Static Theory Foundation:**
- `/topics` roadmap grid — all 13 topics as cards
- `/topics/[slug]` detail page — theory content from TypeScript files in `lib/content/`
- No database, no API routes, no auth
- Ships as a fully deployable static app

**Phase 2 — Full MVP:**
- Drizzle schema + migrations
- Question library (30 questions, seeded)
- Dashboard with stats
- `PATCH /api/questions/[id]/status` — persistent question status
- AI Coach — `generateObject` call to Claude

## Rationale

- Validates the content model and UI layout with zero infrastructure risk
- Theory content is immediately useful — a reader can study any of the 13 topics before Phase 2 ships
- Static pages deploy to Vercel in seconds with no environment variables needed

## Impact

- Phase 1 checklist is smaller, shippable faster
- `lib/content/topics/*.ts` static files are eventually supplemented by DB-driven question lists in Phase 2 (the `/topics/[slug]` page gets a "Related Questions" section wired to the DB)
- No rework — Phase 2 adds to Phase 1, does not replace it
