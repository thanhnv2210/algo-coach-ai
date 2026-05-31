# Proposal — AlgoCoach AI

A personal learning platform for tracking algorithm practice, identifying weak areas, and leveraging AI to accelerate coding interview preparation.

**Portfolio positioning:** Demonstrates full-stack Next.js architecture, domain-driven design, and practical Claude AI integration — covering the core hiring signals for Senior Engineer → Solution Architect. Extension path: AI-powered mock interview coach with voice + real-time code evaluation.

---

## Tech Stack

| Layer | Decision |
|---|---|
| Framework | Next.js 16 — App Router + Turbopack, port 3015 |
| Styling | TailwindCSS v4 + shadcn/ui + lucide-react |
| Database | PostgreSQL (local :54320 / Neon prod) |
| ORM | Drizzle ORM with `postgres` driver |
| Auth | NextAuth v5 — single seeded user, no login UI for MVP |
| AI | Vercel AI SDK + `@ai-sdk/anthropic` (Claude Sonnet 4.6, primary) + `@ai-sdk/openai` (fallback) |
| Validation | Zod |
| Charts | Recharts |
| State | Zustand |
| Package Manager | pnpm |
| Testing | Vitest (unit) + Playwright (E2E) |
| Hosting | Vercel + Neon |

---

## Pages / Routes

```
/              → Dashboard — stats cards, streak, AI recommendations panel
/topics        → Learning Roadmap — topic grid with progress bars
/questions     → Question Library — filterable table with status tracking
/ai-coach      → AI Coach — learning plan generator + weakness analysis
/profile       → Profile — summary and progress overview
```

---

## Database Schema

All tables under `pgSchema('algo_coach')`.

### `topics`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | "Arrays", "Dynamic Programming", etc. |
| category | text | `fundamentals` \| `advanced` \| `graphs_trees` |
| description | text | |
| order | integer | display order in roadmap |
| created_at | timestamp | |

### `questions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| topic_id | uuid FK → topics | |
| title | text | |
| difficulty | text | `easy` \| `medium` \| `hard` |
| link | text | LeetCode URL |
| notes | text | optional hints |
| status | text | `not_started` \| `learning` \| `solved` \| `review_needed` \| `mastered` |
| updated_at | timestamp | updated on every status change |

### `progress`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| topic_id | uuid FK → topics | |
| solved_count | integer | derived from questions |
| confidence_level | integer | 1–5, user-set |
| last_reviewed | timestamp | |
| completion_percentage | numeric | computed field |

---

## API Routes

All under `/api/`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/topics` | List all topics with progress |
| GET | `/api/questions` | List questions (filter: topic, difficulty, status) |
| PATCH | `/api/questions/[id]/status` | Update question status |
| GET | `/api/dashboard` | Aggregated stats for dashboard |
| POST | `/api/ai/recommendations` | Generate weekly learning plan via Claude |
| POST | `/api/ai/insights` | Analyze weaknesses from question history |

MVP serves from static seed data. Phase 2 adds real DB persistence.

---

## AI Pipeline

### `POST /api/ai/recommendations`

Uses `generateObject` (Vercel AI SDK) with a Zod schema — Claude returns typed structured data, no JSON parsing needed.

**Zod response schema:**
```ts
const RecommendationSchema = z.object({
  weeklyPlan: z.array(z.object({
    day: z.string(),
    topic: z.string(),
    suggestedQuestions: z.array(z.string()),
  })),
  weakAreas: z.array(z.string()),
  nextMilestone: z.string(),
  encouragement: z.string(),
})
```

**AI client (`lib/ai/index.ts`):**
```ts
import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"

export const defaultModel = anthropic(process.env.AI_MODEL ?? "claude-sonnet-4-6")
export const fallbackModel = openai("gpt-4o-mini")
```

- API key (`ANTHROPIC_API_KEY`) is server-side only — Next.js route handler calls Claude directly
- System prompt establishes the JSON contract and coaching persona
- `generateObject` validates the response against the Zod schema automatically

---

## Project Structure

```
algo-coach-ai/
  app/
    (dashboard)/
      layout.tsx              # Sidebar shell + ThemeProvider
      page.tsx                # Dashboard — redirect or inline
    page.tsx                  # Dashboard — stats + AI panel
    topics/page.tsx
    questions/page.tsx
    ai-coach/page.tsx
    profile/page.tsx
    api/
      topics/route.ts
      questions/[id]/status/route.ts
      dashboard/route.ts
      ai/recommendations/route.ts
      ai/insights/route.ts
    globals.css
    layout.tsx                # Root layout — fonts, metadata
  components/
    nav/
      sidebar.tsx             # Nav links + theme toggle
    dashboard/
      stats-card.tsx          # Single metric card
      progress-chart.tsx      # Recharts bar — solved by topic
      streak-widget.tsx       # Daily streak display
      ai-recommendation-panel.tsx
    topics/
      topic-card.tsx          # Name + progress bar + confidence stars
      roadmap-grid.tsx
    questions/
      question-table.tsx      # Sortable/filterable table
      status-badge.tsx        # Color-coded pill
      question-filters.tsx
    ai-coach/
      generate-plan-button.tsx
      learning-plan-display.tsx
      weakness-chart.tsx
    ui/                       # shadcn/ui components
    theme-provider.tsx
  lib/
    ai/index.ts               # Vercel AI SDK client (Claude primary, OpenAI fallback)
    db/
      index.ts                # Drizzle client singleton
      schema.ts               # All table definitions
    utils/
      cn.ts                   # clsx + tailwind-merge
  services/
    topic.service.ts          # DB queries — topics + progress
    question.service.ts       # DB queries — questions CRUD
    dashboard.service.ts      # Aggregated stats
    ai.service.ts             # generateObject calls, prompt construction
  scripts/
    seed.ts                   # Seed 13 topics + 30 curated questions
    reset-db.ts
  drizzle/                    # Generated SQL migrations
  drizzle.config.ts
```

---

## Design Identity

| Property | Value |
|---|---|
| Accent color | Yellow `#eab308` (Tailwind `yellow-500`) |
| Favicon concept | BST branching tree node — root circle at top, two child nodes below, connected by directed edges |
| Favicon path | `app/icon.svg` (Next.js App Router auto-injection) |
| localStorage prefix | `algo-coach-ai:` |
| NextAuth cookie name | `algo-coach-ai.session-token` (required for browser cookie isolation across localhost apps) |

---

## Theme & Styling

- **Dark mode default** — `ThemeProvider` using `next-themes`. localStorage key: `algo-coach-ai:theme`. Defaults to `dark`.
- **FOUC prevention** — `next-themes` handles via `suppressHydrationWarning` on `<html>`.
- **Semantic tokens only** — `bg-background`, `text-foreground`, `bg-card`, `border-border`. No hardcoded colors.
- **Accent color** — yellow (`#eab308` / Tailwind `yellow-500`). Signals "focus" and "highlight". Differentiates from teal (communication-ai-assistant), indigo (career-growth-copilot), and emerald (job-evolution).
- **Fonts** — Geist Sans + Geist Mono.

---

## Layout

```
┌─────────────────────────────────────────────────────────┐
│ [AlgoCoach AI]                              [Theme ☀]   │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │   Dashboard:                                 │
│  ~220px  │   ┌────────┐ ┌────────┐ ┌────────┐          │
│          │   │ Solved │ │ Streak │ │  Top   │          │
│ Dashboard│   │  142   │ │  7 day │ │ Topic  │          │
│ Topics   │   └────────┘ └────────┘ └────────┘          │
│ Questions│                                              │
│ AI Coach │   ┌─────────────────┐ ┌──────────────────┐  │
│ Profile  │   │ Progress Chart  │ │ AI Weekly Plan   │  │
│          │   │ (Recharts bar)  │ │ (Claude output)  │  │
│          │   └─────────────────┘ └──────────────────┘  │
└──────────┴──────────────────────────────────────────────┘
```

---

## Environment Variables

```
ANTHROPIC_API_KEY=                                                      # Claude — server-side only
OPENAI_API_KEY=                                                         # Fallback — optional
AI_MODEL=claude-sonnet-4-6                                              # Override model if needed
DATABASE_URL=postgresql://ThanhNguyen@localhost:54320/algo_coach        # local dev
AUTH_SECRET=                                                            # NextAuth secret
NEXTAUTH_URL=http://localhost:3015
```

---

## Workspace Registration

Steps required by the runbook before the app is considered properly set up.

### 1. `workspace-app-registry.md` — Port Map row
```
| 3015 | algo-coach-ai | AI_WS/algo-coach-ai | Next.js 16 + TailwindCSS v4 + Drizzle ORM | pnpm dev (alias: algo-coach-start) |
```

### 2. `workspace-app-registry.md` — Design Reference row
```
| algo-coach-ai | Algorithm interview prep platform | BST branching tree node — root + two child nodes, directed edges | Yellow #eab308 | app/icon.svg |
```

### 3. `portfolio/data/workspace.ts` — New entry
```ts
{
  name: 'algo-coach-ai',
  path: 'AI_WS/algo-coach-ai',
  port: 3015,
  url: 'http://localhost:3015',
  stack: ['Next.js 16', 'TailwindCSS v4', 'Drizzle ORM'],
  description: 'AI-powered algorithm interview prep platform — progress tracking, learning roadmap, Claude coaching.',
  status: 'in-progress',
  command: 'pnpm dev',
},
```

### 4. `architecture-practice/public/docs/index.json` — New tree section
```json
{
  "id": "algo-coach-ai",
  "label": "AlgoCoach AI",
  "children": [
    {
      "id": "algo-coach-ai-overview",
      "title": "AlgoCoach AI — Overview",
      "type": "markdown",
      "path": "docs/algo-coach-ai/overview.md",
      "tags": ["algo-coach-ai", "overview", "interview-prep", "ai"],
      "created": "2026-05-31",
      "modified": "2026-05-31",
      "remark": "Algorithm interview prep platform with Claude AI coaching"
    }
  ]
}
```

### 5. `~/.zshrc` — Shell aliases
```zsh
# AlgoCoach AI
ALGO_COACH_DIR="/Users/ThanhNguyen/AI_WS/algo-coach-ai"
ALGO_COACH_PID_FILE="/tmp/algo-coach.pid"
ALGO_COACH_PORT=3015

algo-coach-start() {
  echo "Starting AlgoCoach AI..."
  lsof -ti tcp:$ALGO_COACH_PORT | xargs kill -9 2>/dev/null
  rm -f "$ALGO_COACH_PID_FILE"
  (cd "$ALGO_COACH_DIR" && pnpm dev:clean > /tmp/algo-coach.log 2>&1 &)
  echo $! > "$ALGO_COACH_PID_FILE"
  echo "AlgoCoach AI started (PID $(cat $ALGO_COACH_PID_FILE)) — http://localhost:$ALGO_COACH_PORT"
  echo "Logs: tail -f /tmp/algo-coach.log"
}

algo-coach-stop() {
  echo "Stopping AlgoCoach AI..."
  lsof -ti tcp:$ALGO_COACH_PORT | xargs kill -9 2>/dev/null && echo "Stopped." || echo "Not running."
  rm -f "$ALGO_COACH_PID_FILE"
}

algo-coach-restart() { algo-coach-stop && sleep 1 && algo-coach-start; }
algo-coach-logs() { tail -f /tmp/algo-coach.log; }

algo-coach-status() {
  if [[ -f "$ALGO_COACH_PID_FILE" ]] && kill -0 "$(cat $ALGO_COACH_PID_FILE)" 2>/dev/null; then
    echo "AlgoCoach AI is running (PID $(cat $ALGO_COACH_PID_FILE)) — http://localhost:$ALGO_COACH_PORT"
  else
    echo "AlgoCoach AI is not running."
    rm -f "$ALGO_COACH_PID_FILE"
  fi
}
```

---

## Development Phases

### Phase 1 — MVP
- [ ] Scaffold: Next.js 16 + TailwindCSS v4 + shadcn/ui + pnpm, port 3015
- [ ] Drizzle schema: `topics`, `questions`, `progress` under `pgSchema('algo_coach')`
- [ ] `scripts/seed.ts` — 13 topics + 30 curated questions
- [ ] `db:generate` + `db:migrate` — run migrations against local Postgres
- [ ] API routes: `GET /api/topics`, `GET /api/questions`, `GET /api/dashboard`
- [ ] Dashboard page: stats cards + Recharts progress chart + AI panel
- [ ] Topics page: roadmap grid with progress bars
- [ ] Questions page: filterable table + status badge update
- [ ] `PATCH /api/questions/[id]/status` — persists to DB
- [ ] AI Coach page: `generateObject` call → Claude weekly plan
- [ ] `lib/ai/index.ts` — Claude Sonnet 4.6 primary, OpenAI fallback
- [ ] Theme: dark default, yellow accent (`#eab308`), `next-themes`

### Phase 2 — Auth + Progress Tracking
- [ ] NextAuth v5 — single seeded user, no login UI
- [ ] Per-user progress isolation in DB
- [ ] `progress` table auto-updated on question status change
- [ ] Dashboard aggregations from real DB queries
- [ ] AI insights: `POST /api/ai/insights` — weakness detection

### Phase 3 — Personalization
- [ ] Spaced repetition: auto-flag questions as `review_needed` after N days
- [ ] AI-generated weekly learning plans saved to DB
- [ ] Confidence level self-rating on topic cards
- [ ] Streak tracking with daily activity log

### Phase 4 — Coding Playground
- [ ] Embedded code editor (Monaco Editor)
- [ ] Code execution (Judge0 API)
- [ ] AI solution review via Claude tool use
