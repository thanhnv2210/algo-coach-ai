# Proposal — AlgoCoach AI

A personal learning platform for tracking algorithm practice, identifying weak areas, and leveraging AI to accelerate coding interview preparation.

**Portfolio positioning:** Demonstrates full-stack architecture (Next.js + Spring Boot), domain-driven design, and practical AI integration — covering the core hiring signals for Senior Engineer → Solution Architect. Extension path: AI-powered mock interview coach with voice + real-time code evaluation.

---

## Tech Stack

| Layer | Decision |
|---|---|
| Frontend framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + lucide-react |
| Charts | Recharts (dashboard progress charts) |
| Backend | Spring Boot 3 + Java 21 |
| ORM | Spring Data JPA + Hibernate |
| Database | PostgreSQL on Neon (free tier) |
| AI | OpenAI API (`gpt-4o-mini` for cost; upgrade path to `gpt-4o`) |
| Package manager | pnpm (frontend) / Maven (backend) |
| Testing | Vitest + @testing-library/react (frontend) / JUnit 5 + Mockito (backend) |
| Frontend port | 3014 |
| Backend port | 8014 |

---

## Pages / Routes

```
/              → Dashboard — stats cards, streak, AI recommendations panel
/topics        → Learning Roadmap — topic list with progress bars
/questions     → Question Library — filterable table with status tracking
/ai-coach      → AI Coach — learning plan generator + weakness analysis
/profile       → Profile — summary, history, export
```

---

## Domain Model

### User
```
User
├── id (UUID)
├── name
├── email
└── createdAt
```

### Topic
```
Topic
├── id (UUID)
├── name               # "Arrays", "Dynamic Programming", etc.
├── category           # "Fundamentals" | "Advanced" | "Graphs & Trees"
├── description
└── order              # display order in roadmap
```

### Question
```
Question
├── id (UUID)
├── title
├── difficulty         # EASY | MEDIUM | HARD
├── topic (FK)
├── link               # LeetCode URL
├── notes
└── status             # NOT_STARTED | LEARNING | SOLVED | REVIEW_NEEDED | MASTERED
```

### Progress
```
Progress
├── id (UUID)
├── user (FK)
├── topic (FK)
├── solvedCount
├── confidenceLevel    # 1–5
├── lastReviewed
└── completionPercentage
```

---

## API Design

All endpoints under `/api/v1`.

| Method | Path | Description |
|---|---|---|
| GET | `/topics` | List all topics with progress |
| GET | `/questions` | List questions (filter: topic, difficulty, status) |
| PATCH | `/questions/{id}/status` | Update question status |
| GET | `/dashboard` | Aggregated stats for dashboard |
| POST | `/ai/recommendations` | Generate AI learning plan from progress snapshot |
| POST | `/ai/insights` | Analyze weaknesses from question history |

MVP starts with static seed data returned from the backend. Real DB persistence added in Phase 2.

---

## AI Pipeline

### `POST /api/v1/ai/recommendations`

**Request:**
```json
{
  "progressSnapshot": [
    { "topic": "Arrays", "solvedCount": 12, "confidenceLevel": 4 },
    { "topic": "Dynamic Programming", "solvedCount": 1, "confidenceLevel": 1 }
  ],
  "recentlySolved": ["Two Sum", "Valid Parentheses"]
}
```

**System prompt contract:** Returns structured JSON — no markdown fences.

**Response schema:**
```json
{
  "weeklyPlan": [
    { "day": "Monday", "topic": "Dynamic Programming", "suggestedQuestions": ["Climbing Stairs", "House Robber"] }
  ],
  "weakAreas": ["Dynamic Programming", "Graph"],
  "nextMilestone": "Complete 3 DP problems this week",
  "encouragement": "You are strong in Arrays — build on that with Sliding Window."
}
```

- Model: `gpt-4o-mini` (structured output mode, `response_format: json_object`)
- Spring Boot service: `OpenAiService` wraps the OpenAI Java SDK, retries on rate limit (exponential backoff, max 3 attempts)
- Frontend calls backend — API key never leaves the server

---

## Component Plan

```
frontend/
  app/
    page.tsx                  # Dashboard
    topics/page.tsx
    questions/page.tsx
    ai-coach/page.tsx
    profile/page.tsx
    layout.tsx                # Shell: sidebar nav + ThemeProvider
  components/
    layout/
      Sidebar.tsx             # Nav links + collapse toggle
      TopBar.tsx              # Page title + user avatar
    dashboard/
      StatsCard.tsx           # Single metric card (solved, streak, etc.)
      ProgressChart.tsx       # Recharts bar chart — solved by topic
      StreakWidget.tsx        # Calendar heatmap or streak counter
      AIRecommendationPanel.tsx  # Renders AI weekly plan
    topics/
      TopicCard.tsx           # Topic name + progress bar + confidence stars
      RoadmapGrid.tsx         # Ordered grid of TopicCards
    questions/
      QuestionTable.tsx       # Sortable/filterable table
      StatusBadge.tsx         # Color-coded status pill
      QuestionFilters.tsx     # Topic + difficulty + status filters
    ai-coach/
      PromptPanel.tsx         # "Generate my plan" button + loading state
      LearningPlanDisplay.tsx # Structured weekly plan output
      WeaknessChart.tsx       # Visual weak areas breakdown
    ui/                       # shadcn/ui re-exports
  features/
    dashboard/useDashboard.ts      # Fetch + aggregate dashboard data
    questions/useQuestions.ts      # Fetch, filter, mutate question status
    ai-coach/useAICoach.ts         # Call /ai/recommendations, manage state
  services/
    api.ts                    # Axios instance pointing to Spring Boot (NEXT_PUBLIC_API_URL)
    topics.ts
    questions.ts
    ai.ts
  types/
    domain.ts                 # Topic, Question, Progress, User interfaces
    api.ts                    # Request/response DTOs
```

```
backend/
  src/main/java/com/algocoachai/
    controller/
      TopicController.java
      QuestionController.java
      DashboardController.java
      AiController.java
    service/
      TopicService.java
      QuestionService.java
      DashboardService.java
      OpenAiService.java          # OpenAI API integration
    repository/
      TopicRepository.java
      QuestionRepository.java
      ProgressRepository.java
    domain/
      Topic.java
      Question.java
      Progress.java
      User.java
      enums/Difficulty.java
      enums/QuestionStatus.java
    dto/
      request/AiRecommendationRequest.java
      response/DashboardResponse.java
      response/AiRecommendationResponse.java
    config/
      OpenAiConfig.java           # Bean: OpenAI client with API key
      CorsConfig.java             # Allow frontend origin
      DataSeeder.java             # CommandLineRunner — seed topics + questions
```

---

## Theme & Styling

- **Dark mode default** — `ThemeProvider` using `next-themes`. localStorage key: `algo-coach-ai:theme`. Defaults to `dark`.
- **FOUC prevention** — `next-themes` handles this via `suppressHydrationWarning` on `<html>`.
- **Semantic tokens only** — `bg-background`, `text-foreground`, `bg-card`, `border-border`. No hardcoded colors.
- **Accent color** — emerald (`#10b981` / Tailwind `emerald-500`). Signals "growth" and "learning progress".
- **Fonts** — Geist Sans + Geist Mono (Next.js default).

---

## Layout

```
┌─────────────────────────────────────────────────────────┐
│ [AlgoCoach AI logo]   [Dashboard] [Topics] [Questions]  │
│                       [AI Coach]  [Profile]  [Theme ☀]  │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │   Page Content                               │
│ (nav)    │                                              │
│  ~220px  │   Dashboard:                                 │
│          │   ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│          │   │Stats│ │Stats│ │Stats│ │Streak│           │
│          │   └────┘ └────┘ └────┘ └────┘               │
│          │   ┌───────────────┐ ┌─────────────────┐     │
│          │   │  Progress     │ │  AI             │     │
│          │   │  Chart        │ │  Recommendations│     │
│          │   └───────────────┘ └─────────────────┘     │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

---

## Storage

- **Phase 1 (MVP):** Static seed data in `DataSeeder.java` — no real DB writes. All question status changes held in React state (resets on refresh).
- **Phase 2:** Full PostgreSQL persistence via JPA. Question status PATCH endpoint persists to DB. Progress table populated on each status update.
- **Phase 3:** User authentication (Google OAuth via Spring Security). Per-user progress isolation.

Environment variables:
- `OPENAI_API_KEY` — server-side only, never exposed to frontend
- `DATABASE_URL` — Neon PostgreSQL connection string
- `NEXT_PUBLIC_API_URL` — backend base URL (e.g., `http://localhost:8014`)
- `CORS_ALLOWED_ORIGINS` — frontend origin(s) for Spring CORS config

---

## Development Phases

### Phase 1 — Static MVP
- [ ] Scaffold: Next.js 15 + Tailwind v4 + shadcn/ui + pnpm
- [ ] Scaffold: Spring Boot 3 + Maven + Java 21
- [ ] `DataSeeder` — seed 13 topics + 30 curated questions
- [ ] REST endpoints: `GET /topics`, `GET /questions`, `GET /dashboard`
- [ ] Dashboard page: stats cards + progress chart (Recharts)
- [ ] Topics page: roadmap grid with static progress bars
- [ ] Questions page: filterable table with status badges
- [ ] AI Coach page: call `POST /ai/recommendations`, render weekly plan
- [ ] `OpenAiService` — structured JSON response from `gpt-4o-mini`
- [ ] CORS config, `.env.local` setup, `CorsConfig.java`
- [ ] Port registry — frontend: 3014, backend: 8014

### Phase 2 — Real Persistence
- [ ] Neon PostgreSQL connection via `spring.datasource`
- [ ] JPA entities + Flyway migrations
- [ ] `PATCH /questions/{id}/status` persists to DB
- [ ] Progress table updated on status change
- [ ] Dashboard aggregations from real DB queries

### Phase 3 — Auth + Personalization
- [ ] Google OAuth via Spring Security + NextAuth.js
- [ ] Per-user progress isolation
- [ ] AI insights: `POST /ai/insights` — weakness detection from full history
- [ ] Spaced repetition: flag questions due for review (`REVIEW_NEEDED` auto-set)

### Phase 4 — Coding Playground
- [ ] Embedded code editor (Monaco Editor)
- [ ] Code execution (Judge0 API or self-hosted)
- [ ] AI solution review endpoint
