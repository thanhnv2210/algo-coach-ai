# PDR-001 — Product Vision: Personal Algorithm Interview Prep

**Date:** 2026-05-31
**Status:** Accepted

## Context

Most coding interview platforms (LeetCode, NeetCode) focus on solving problems. They provide a problem queue but minimal guidance on *why* a pattern works, *when* to apply it, or *how* to identify weaknesses and build a personalised study plan.

An engineer targeting a Senior → Staff or Solution Architect transition needs more than a queue of problems — they need structured theory, pattern recognition, and AI-guided prioritisation.

## Decision

AlgoCoach AI is built as a **personal learning platform, not a coding platform**. The primary value is:

1. **Theory reference** — clear explanations of each algorithm topic, its complexity, and its patterns
2. **Progress tracking** — which questions have been solved, at what confidence level
3. **AI coaching** — Claude analyses the progress snapshot and generates a personalised weekly plan

The design principle: **understand the pattern, not just solve the problem**.

## Rationale

- Existing platforms provide the problems; this provides the meta-layer (when to use which pattern)
- Personal use → no multi-tenancy, no public leaderboard, no gamification overhead
- Full-stack Next.js means one `pnpm dev:clean`, fast iteration, direct deployment to Vercel

## Impact

- Phase 1 ships theory content only — validates the UI and content model before any DB work
- The question library in Phase 2 is curated (30 questions), not exhaustive — quality over quantity
- AI features are secondary to the theory reference; Claude is the coach, not the gatekeeper
