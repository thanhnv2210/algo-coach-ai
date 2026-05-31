# ADR-001 — Next.js as Unified Full-Stack Framework

**Date:** 2026-05-31
**Status:** Accepted

## Context

The platform needs a frontend UI and a backend API for data and AI access. The choices are: (a) separate frontend and backend services, (b) a unified full-stack framework where both live in one deployable unit.

Candidates considered:
- Next.js (App Router) — unified React frontend + API routes
- React (Vite) + FastAPI backend — Template C, two processes
- Next.js + Spring Boot — as in `ai-architect-os`, enterprise-grade but heavy
- Remix — unified, but smaller ecosystem

## Decision

Use **Next.js 16 with App Router** as the sole framework. API routes in `app/api/` serve as the backend. No separate backend service.

## Consequences

- **Good:** One runtime, one deployment, one `pnpm dev:clean`. TypeScript types are shared between frontend and backend with no API contract drift.
- **Good:** Vercel deploys Next.js with zero configuration, including API routes as serverless functions.
- **Trade-off:** Long-running or CPU-heavy AI workloads run on Vercel serverless — acceptable for infrequent AI calls, not suitable for real-time streaming at scale.
- **Risk:** If the project grows to multi-user SaaS, the backend may need to be extracted to a dedicated service.
