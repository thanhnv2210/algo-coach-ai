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
/                   → Dashboard — stats cards, streak, AI recommendations panel
/topics             → Learning Roadmap — topic grid with progress bars
/topics/[slug]      → Topic Detail — static theory content (first milestone)
/questions          → Question Library — filterable table with status tracking
/ai-coach           → AI Coach — learning plan generator + weakness analysis
/profile            → Profile — summary and progress overview
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

## Static Theory Content

`/topics/[slug]` is a **static page** — no DB, no API. Content lives in `lib/content/topics/` as TypeScript files, one per topic.

### Content shape per topic

```ts
// lib/content/topics/arrays.ts
export const topic: TopicContent = {
  slug: "arrays",
  name: "Arrays",
  category: "fundamentals",
  description: "...",
  keyIdeas: [
    "Zero-indexed contiguous memory",
    "Random access in O(1) by index",
    "Insertion/deletion at arbitrary position is O(n)",
  ],
  complexity: [
    { operation: "Access",    time: "O(1)",  space: "O(1)" },
    { operation: "Search",    time: "O(n)",  space: "O(1)" },
    { operation: "Insert",    time: "O(n)",  space: "O(1)" },
    { operation: "Delete",    time: "O(n)",  space: "O(1)" },
  ],
  patterns: [
    { name: "Two Pointers",   description: "Shrink the window from both ends" },
    { name: "Sliding Window", description: "Track a subarray of fixed or variable size" },
    { name: "Prefix Sum",     description: "Precompute cumulative sums for range queries" },
  ],
  codeExample: {
    language: "python",
    label: "Two-pointer reverse in-place",
    code: `def reverse(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1`,
  },
  tips: "Think of arrays as the backbone of most other data structures.",
  relatedSlugs: ["strings", "sliding-window"],
}
```

### `TopicContent` type (`lib/content/types.ts`)

```ts
interface ComplexityRow { operation: string; time: string; space: string }
interface Pattern       { name: string; description: string }
interface CodeExample   { language: string; label: string; code: string }

export interface TopicContent {
  slug:         string
  name:         string
  category:     "fundamentals" | "advanced" | "graphs_trees"
  description:  string
  keyIdeas:     string[]
  complexity:   ComplexityRow[]
  patterns:     Pattern[]
  codeExample:  CodeExample
  tips?:        string
  relatedSlugs: string[]
}
```

### `/topics/[slug]` layout

```
┌──────────────────────────────────────────────────────┐
│  ← Back to Topics          Arrays                    │
├──────────────────────────────────────────────────────┤
│  Description paragraph                               │
│                                                      │
│  Key Ideas          Complexity Table                 │
│  • Zero-indexed     Op      Time   Space             │
│  • O(1) access      Access  O(1)   O(1)              │
│  • O(n) insert      Search  O(n)   O(1)              │
│                                                      │
│  Common Patterns                                     │
│  [Two Pointers] [Sliding Window] [Prefix Sum]        │
│                                                      │
│  Code Example — Two-pointer reverse                  │
│  ┌─────────────────────────────────────────────┐    │
│  │  def reverse(arr): ...                       │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  Tips                                                │
│  "Think of arrays as the backbone..."               │
│                                                      │
│  Related Topics:  [Strings]  [Sliding Window]        │
└──────────────────────────────────────────────────────┘
```

All 13 topics ship with content before any DB work begins.

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
    topics/[slug]/page.tsx
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
      topic-card.tsx          # Name + progress bar + confidence stars (links to /topics/[slug])
      roadmap-grid.tsx
      theory/
        complexity-table.tsx  # Big O table for a topic
        pattern-chips.tsx     # Pattern name + description pills
        code-block.tsx        # Syntax-highlighted code example
        key-ideas-list.tsx    # Bullet list of key concepts
        related-topics.tsx    # Chips linking to sibling /topics/[slug] pages
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
    content/
      types.ts                # TopicContent, ComplexityRow, Pattern, CodeExample interfaces
      topics/
        arrays.ts
        strings.ts
        hash-map.ts
        sliding-window.ts
        stack.ts
        queue.ts
        linked-list.ts
        tree.ts
        graph.ts
        heap.ts
        binary-search.ts
        backtracking.ts
        dynamic-programming.ts
      index.ts                # getAllTopics(), getTopicBySlug(slug) helpers
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

## Decision Records

Files live in the app repo under `docs/adr/` and `docs/pdr/`. Each record is also registered in the ArchDoc `index.json`.

### Planned ADRs

| ID | Title | Key decision |
|---|---|---|
| ADR-001 | Next.js as Unified Full-Stack Framework | No separate backend — App Router + API routes only |
| ADR-002 | Drizzle ORM with `postgres` Driver | Lightweight, type-safe ORM; no Prisma/JPA overhead |
| ADR-003 | pgSchema Namespace Isolation | All tables under `pgSchema('algo_coach')` to avoid collisions on shared local Postgres |
| ADR-004 | Vercel AI SDK + Claude Sonnet 4.6 | `generateObject` with Zod schema for typed structured output; OpenAI as fallback |

### Planned PDRs

| ID | Title | Key decision |
|---|---|---|
| PDR-001 | Product Vision — Personal Algorithm Interview Prep | Focus: learning patterns + AI coaching, not a LeetCode clone |
| PDR-002 | MVP Scope — Seed Data + Working AI, No Auth | Phase 1 ships UI + Claude coach with seeded data; auth deferred to Phase 2 |

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
    },
    {
      "id": "algo-coach-ai-adr-001",
      "title": "ADR-001 — Next.js as Unified Full-Stack Framework",
      "type": "markdown",
      "path": "docs/algo-coach-ai/decisions/ADR-001-nextjs-fullstack.md",
      "tags": ["algo-coach-ai", "adr", "architecture", "nextjs"],
      "created": "2026-05-31",
      "modified": "2026-05-31",
      "remark": "No separate backend — App Router + API routes only"
    },
    {
      "id": "algo-coach-ai-adr-002",
      "title": "ADR-002 — Drizzle ORM with postgres Driver",
      "type": "markdown",
      "path": "docs/algo-coach-ai/decisions/ADR-002-drizzle-orm-postgres-driver.md",
      "tags": ["algo-coach-ai", "adr", "database", "drizzle"],
      "created": "2026-05-31",
      "modified": "2026-05-31",
      "remark": "Lightweight type-safe ORM over Prisma/JPA"
    },
    {
      "id": "algo-coach-ai-adr-003",
      "title": "ADR-003 — pgSchema Namespace Isolation",
      "type": "markdown",
      "path": "docs/algo-coach-ai/decisions/ADR-003-pgschema-namespace-isolation.md",
      "tags": ["algo-coach-ai", "adr", "database", "postgres"],
      "created": "2026-05-31",
      "modified": "2026-05-31",
      "remark": "All tables under pgSchema('algo_coach') to avoid collisions on shared Postgres"
    },
    {
      "id": "algo-coach-ai-adr-004",
      "title": "ADR-004 — Vercel AI SDK + Claude Sonnet 4.6",
      "type": "markdown",
      "path": "docs/algo-coach-ai/decisions/ADR-004-vercel-ai-sdk-claude.md",
      "tags": ["algo-coach-ai", "adr", "ai", "claude", "anthropic"],
      "created": "2026-05-31",
      "modified": "2026-05-31",
      "remark": "generateObject with Zod schema for typed AI output; OpenAI as fallback"
    },
    {
      "id": "algo-coach-ai-pdr-001",
      "title": "PDR-001 — Product Vision: Personal Algorithm Interview Prep",
      "type": "markdown",
      "path": "docs/algo-coach-ai/decisions/PDR-001-product-vision.md",
      "tags": ["algo-coach-ai", "pdr", "product", "vision"],
      "created": "2026-05-31",
      "modified": "2026-05-31",
      "remark": "Focus on learning patterns + AI coaching, not a LeetCode clone"
    },
    {
      "id": "algo-coach-ai-pdr-002",
      "title": "PDR-002 — MVP Scope: Seed Data + Working AI, No Auth",
      "type": "markdown",
      "path": "docs/algo-coach-ai/decisions/PDR-002-mvp-scope.md",
      "tags": ["algo-coach-ai", "pdr", "product", "mvp", "scope"],
      "created": "2026-05-31",
      "modified": "2026-05-31",
      "remark": "Phase 1 ships UI + Claude coach with seeded data; auth deferred to Phase 2"
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

### Phase 1 — Static Theory Foundation (first milestone)
- [ ] Write ADR-001 through ADR-004 + PDR-001 + PDR-002 in `docs/adr/` and `docs/pdr/`
- [ ] Scaffold: Next.js 16 + TailwindCSS v4 + shadcn/ui + pnpm, port 3015
- [ ] `lib/content/types.ts` — `TopicContent` interface
- [ ] `lib/content/topics/*.ts` — theory content for all 13 topics (key ideas, complexity, patterns, code example)
- [ ] `lib/content/index.ts` — `getAllTopics()` + `getTopicBySlug()` helpers
- [ ] `components/topics/theory/` — `ComplexityTable`, `PatternChips`, `CodeBlock`, `KeyIdeasList`, `RelatedTopics`
- [ ] `/topics` page — roadmap grid (topic cards link to `/topics/[slug]`)
- [ ] `/topics/[slug]` page — static theory detail (no DB, no API)
- [ ] Theme: dark default, yellow accent (`#eab308`), `next-themes`
- [ ] Register in workspace: `workspace-app-registry.md`, `portfolio/data/workspace.ts`, `index.json`, `~/.zshrc`
- [ ] favicon: BST tree node SVG at `app/icon.svg`

### Phase 2 — Full MVP (DB + Questions + Dashboard)
- [ ] Drizzle schema: `topics`, `questions`, `progress` under `pgSchema('algo_coach')`
- [ ] `scripts/seed.ts` — 13 topics + 30 curated questions
- [ ] `db:generate` + `db:migrate` — run migrations against local Postgres
- [ ] API routes: `GET /api/topics`, `GET /api/questions`, `GET /api/dashboard`
- [ ] Dashboard page: stats cards + Recharts progress chart + AI panel
- [ ] Questions page: filterable table + status badge update
- [ ] `PATCH /api/questions/[id]/status` — persists to DB
- [ ] AI Coach page: `generateObject` call → Claude weekly plan
- [ ] `lib/ai/index.ts` — Claude Sonnet 4.6 primary, OpenAI fallback
- [ ] Wire `/topics/[slug]` related questions section to DB (replaces static placeholder)

### Phase 3 — Auth + Progress Tracking
- [ ] NextAuth v5 — single seeded user, no login UI
- [ ] Per-user progress isolation in DB
- [ ] `progress` table auto-updated on question status change
- [ ] Dashboard aggregations from real DB queries
- [ ] AI insights: `POST /api/ai/insights` — weakness detection

### Phase 4 — Personalization
- [ ] Spaced repetition: auto-flag questions as `review_needed` after N days
- [ ] AI-generated weekly learning plans saved to DB
- [ ] Confidence level self-rating on topic cards
- [ ] Streak tracking with daily activity log

### Phase 5 — Coding Playground
- [ ] Embedded code editor (Monaco Editor)
- [ ] Code execution (Judge0 API)
- [ ] AI solution review via Claude tool use
