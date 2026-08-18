# AlgoCoach AI

A personal learning platform for algorithm interview preparation and Java interview readiness. Built for Senior → Staff / Solution Architect transitions.

## What it does

- **Dashboard** — streak tracking, topic stats, and AI-generated weekly learning plan
- **Topic roadmap** — 13 algorithm topics with progress and confidence levels
- **Question library** — curated 30-question set with status tracking (Not Started → Mastered)
- **AI Coach** — Claude analyses your progress snapshot and generates a personalised study plan
- **Java Lab** — w3schools-style Java learning environment with live code execution and AI explanations

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL via [Neon](https://neon.tech) + Drizzle ORM |
| AI | Claude Sonnet 4.6 via Vercel AI SDK |
| Editor | Monaco Editor (Java, dark theme) |
| Styling | Tailwind CSS v4, dark-first theme |
| Deployment | Vercel |

## Java Lab

A two-pane lesson interface — markdown lesson on the left, Monaco editor + output panel on the right.

**58 lessons across 8 categories:**

| Category | Lessons |
|----------|---------|
| Core Java & OOP | 7 |
| Collections | 8 |
| Streams & Functional | 7 |
| Concurrency | 8 |
| JVM Internals | 7 |
| Design Patterns | 8 |
| Spring Boot | 8 |
| Interview Patterns | 5 |

**Code runner:** runs locally via `javac`/`java` (JDK 17+). On Vercel, falls back to [Piston API](https://github.com/engineer-man/piston) — no key required.

**AI Explain:** streams a Claude explanation of the current code snippet inline.

## Local development

**Prerequisites:** Node.js 20+, pnpm, JDK 17+, a [Neon](https://neon.tech) database (free tier works).

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env
# Fill in DATABASE_URL and ANTHROPIC_API_KEY

# 3. Run migrations and seed
pnpm db:migrate
pnpm db:seed

# 4. Start dev server
pnpm dev:clean
# → http://localhost:3015
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `AI_MODEL` | No | Model override (default: `claude-sonnet-4-6`) |
| `PISTON_API_URL` | No | Custom Piston instance (default: `https://emkc.org/api/v2/piston`) |

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Set `DATABASE_URL` and `ANTHROPIC_API_KEY` in **Settings → Environment Variables**
4. Deploy — the Java code runner automatically uses Piston API on Vercel

Run migrations against your Neon DB before the first deploy:

```bash
pnpm db:migrate
pnpm db:seed
```

## Commands

```bash
pnpm dev:clean        # clean build + start dev server (localhost:3015)
pnpm build            # production build
pnpm lint             # lint

pnpm db:generate      # generate Drizzle migration from schema changes
pnpm db:migrate       # apply migrations
pnpm db:seed          # seed 13 topics + 30 questions
pnpm db:studio        # open Drizzle Studio
pnpm db:reset         # drop and recreate schema
```

## Project structure

```
app/
  (dashboard)/
    page.tsx              # Dashboard
    topics/               # Topic roadmap
    questions/            # Question library
    ai-coach/             # AI recommendations
    java-lab/             # Java Lab category browser + lessons
  api/
    ai/                   # AI recommendations endpoint
    java/run/             # Java code runner
    java/explain/         # AI explain streaming
    java/progress/        # Lesson progress tracking

components/
  dashboard/              # Stats, streak, charts
  java-lab/               # CategoryGrid, LessonLayout, CodeEditor, OutputPanel, ExplainPanel
  nav/                    # Sidebar navigation

lib/
  ai/index.ts             # Claude client singleton
  db/schema.ts            # Drizzle schema (algo_coach schema)
  content/java-lab/       # Lesson markdown files + curriculum registry

services/                 # Server-side DB query functions (Drizzle)
drizzle/                  # Generated SQL migrations
docs/
  adr/                    # Architecture Decision Records (ADR-001 – ADR-005)
  pdr/                    # Product Decision Records (PDR-001 – PDR-004)
```

## Architecture decisions

See `docs/adr/` for recorded decisions:

- **ADR-001** — Next.js full-stack (no separate backend)
- **ADR-002** — Drizzle ORM + postgres.js driver
- **ADR-003** — `pgSchema('algo_coach')` namespace isolation
- **ADR-004** — Vercel AI SDK + Claude as primary model
- **ADR-005** — Local `javac` with Piston fallback for Java code runner
