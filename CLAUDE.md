# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AlgoCoach AI is a full-stack personal learning platform for algorithm interview preparation. It uses a Next.js frontend, Spring Boot backend, PostgreSQL database (Neon), and OpenAI for AI features.

## Architecture

**Template B — Next.js full-stack** (single repo, no separate backend service)

```
Browser → Next.js App Router (port 3015)
            ├── /app/(dashboard)/* — pages
            ├── /app/api/*         — route handlers (DB + AI)
            ├── /services/*        — server-side DB logic (Drizzle)
            └── /lib/ai/index.ts   — Vercel AI SDK (Claude Sonnet 4.6)
                                          ↓
                                   PostgreSQL :54320 (local) / Neon (prod)
```

### Key directories
- `app/` — Next.js App Router pages and API route handlers
- `components/` — UI components grouped by feature (`dashboard/`, `topics/`, `questions/`, `ai-coach/`, `nav/`, `ui/`)
- `services/` — server-side only DB query functions (Drizzle), one file per domain
- `lib/ai/index.ts` — AI client singleton; `defaultModel` = Claude, `fallbackModel` = OpenAI
- `lib/db/schema.ts` — all Drizzle table definitions under `pgSchema('algo_coach')`
- `scripts/` — `seed.ts`, `reset-db.ts` (run with `pnpm tsx --env-file=.env scripts/<file>.ts`)
- `drizzle/` — generated SQL migration files (committed)

## Domain Model

- **User**: id, name, email, createdAt
- **Topic**: id, name, category, description, order (Arrays, Strings, HashMap, Sliding Window, Stack, Queue, Linked List, Tree, Graph, Heap, Binary Search, Backtracking, Dynamic Programming)
- **Question**: id, title, difficulty (Easy/Medium/Hard), topic, link, notes, status (Not Started/Learning/Solved/Review Needed/Mastered)
- **Progress**: topic, solvedCount, confidenceLevel, lastReviewed, completionPercentage

## Key AI Integration

- Primary AI endpoint: `POST /api/ai/recommendations` — calls OpenAI to analyze progress and suggest next topics/learning plans
- OpenAI API is used for: learning plan generation, weakness detection, personalized recommendations

## Development Commands

These commands will apply once the project is scaffolded. Update this section as the project is built out.

```bash
pnpm dev:clean           # start dev server (localhost:3015)
pnpm build               # production build
pnpm lint                # lint
pnpm test                # run unit tests (Vitest)
pnpm test:e2e            # run E2E tests (Playwright)

pnpm db:generate         # generate Drizzle migration from schema changes
pnpm db:migrate          # apply migrations to local Postgres
pnpm db:seed             # seed 13 topics + 30 questions
pnpm db:studio           # open Drizzle Studio (visual DB browser)
pnpm db:reset            # drop and recreate schema
```

## Decision Records

- `docs/adr/` — Architecture Decision Records (ADR-001 through ADR-005)
- `docs/pdr/` — Product Decision Records (PDR-001 through PDR-004)
- Each record registered in `architecture-practice/public/docs/index.json` under the `algo-coach-ai` node
- Use the runbook templates in `architecture-practice/public/docs/general/new-app-runbook.md`

## Design Identity

- **Accent color** — yellow `#eab308` (Tailwind `yellow-500`)
- **Favicon** — `app/icon.svg` — BST branching tree node (root circle + two child nodes, directed edges)
- **Theme** — dark default via `next-themes`; semantic tokens only (`bg-background`, `text-foreground`, `bg-card`, `border-border`)
- **localStorage prefix** — `algo-coach-ai:`

## MVP Pages
- `/` — Dashboard with stats, streak, AI recommendations
- `/topics` — Learning roadmap with topic progress
- `/questions` — Curated question library with status tracking
- `/ai-coach` — AI-generated learning suggestions
- `/profile` — Learning summary and progress overview

## Java Lab Feature (Milestone 2)

A personal Java learning environment modeled on w3schools — read structured lessons and run code instantly. For Senior Java interview preparation only (no beginner content).

### Key docs
- `docs/pdr/PDR-004-java-lab.md` — product rationale and scope
- `docs/adr/ADR-005-java-code-runner.md` — local `javac` vs external API decision
- `docs/java-lab-curriculum.md` — full 8-category, 58-lesson curriculum
- `docs/java-lab-implementation.md` — phased implementation guide with code skeletons

### New routes
- `/java-lab` — category browser (8 topic cards)
- `/java-lab/[category]/[lesson]` — two-pane: lesson doc left, Monaco editor + output right

### New API routes
- `POST /api/java/run` — compiles and runs Java code via local `javac`/`java`, returns stdout/stderr
- `POST /api/java/explain` — streams Claude explanation of the current code snippet
- `GET|POST /api/java/progress` — reads/writes lesson completion status

### New components (`components/java-lab/`)
- `CategoryGrid.tsx` — 8-card grid for the /java-lab home page
- `LessonLayout.tsx` — two-pane lesson page layout
- `LessonNav.tsx` — lesson list sidebar within a category
- `LessonContent.tsx` — markdown-rendered lesson doc
- `CodeEditor.tsx` — Monaco Editor wrapper (Java mode, dark theme, pre-loaded default code)
- `RunButton.tsx` — triggers `POST /api/java/run`, shows spinner
- `OutputPanel.tsx` — stdout/stderr display with exit code and duration badge

### New lesson content (`lib/content/java-lab/`)
- `index.ts` — curriculum registry (`JavaCategory[]` → `JavaLesson[]` with slugs, defaultCode, tags)
- One folder per category: `core-java/`, `collections/`, `streams/`, `concurrency/`, `jvm/`, `design-patterns/`, `spring/`, `interview-patterns/`
- Each lesson is a `.md` file with the standard template (see `docs/java-lab-curriculum.md`)

### New DB table (Phase 3)
- `java_lesson_progress` — tracks `status` (`not_started` / `in_progress` / `done`) and personal notes per lesson

### Prerequisites
- JDK 17+ installed (`java -version` and `javac -version` must both return ≥ 17)
- All lesson snippets must declare `public class JavaLabRunner` as the outer class

### Delivery order
1. Phase 1 — static lessons + Monaco editor (no DB, no runner) — start with Category 2: Collections
2. Phase 2 — `POST /api/java/run` code runner
3. Phase 3 — progress tracking DB
4. Phase 4 — AI explain streaming
