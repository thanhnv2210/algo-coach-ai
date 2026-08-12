# Java Lab — Implementation Guide

**Repository:** `algo-coach-ai`
**Feature branch:** `feature/java-lab`
**Prerequisites:** JDK 17+ installed locally (`java -version`)

---

## Phase 1 — Static Lessons (no DB, no runner)

Goal: ship readable lesson content with Monaco editor pre-loaded. Validates the UI before adding infra.

### 1.1 Route structure to create

```
app/
└── (dashboard)/
    └── java-lab/
        ├── page.tsx                    # /java-lab — topic browser (category grid)
        └── [category]/
            └── [lesson]/
                └── page.tsx            # /java-lab/collections/hashmap — lesson + editor
```

### 1.2 Components to create

```
components/
└── java-lab/
    ├── CategoryGrid.tsx        # 8-card grid on /java-lab home (one card per category)
    ├── LessonLayout.tsx        # Two-pane layout: doc left, editor+output right
    ├── LessonNav.tsx           # Sidebar: lesson list within a category, current highlight
    ├── LessonContent.tsx       # Renders lesson markdown (use existing marked.js or rehype)
    ├── CodeEditor.tsx          # Monaco Editor wrapper, Java language mode, dark theme
    ├── RunButton.tsx           # "Run ▶" button with loading spinner
    └── OutputPanel.tsx         # stdout / stderr display, exit code badge, duration
```

### 1.3 Static lesson content

```
lib/
└── content/
    └── java-lab/
        ├── index.ts            # curriculum registry: categories → lessons → metadata
        ├── core-java/
        │   ├── 01-object-model.md
        │   ├── 02-inheritance-vs-composition.md
        │   └── ...
        ├── collections/
        │   ├── 01-arraylist-vs-linkedlist.md
        │   ├── 02-hashmap-internals.md
        │   └── ...
        └── ... (one folder per category)
```

`lib/content/java-lab/index.ts` shape:
```typescript
export interface JavaLesson {
  slug: string;           // used in URL
  title: string;
  category: JavaCategory;
  order: number;
  defaultCode: string;    // pre-loaded into Monaco on lesson open
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  tags: string[];         // e.g. ['HashMap', 'Big-O', 'interview-common']
}

export interface JavaCategory {
  slug: string;
  title: string;
  icon: string;           // lucide icon name
  description: string;
  lessons: JavaLesson[];
}

export const JAVA_CURRICULUM: JavaCategory[] = [ ... ];
```

---

## Phase 2 — Code Runner

### 2.1 API route

```
app/
└── api/
    └── java/
        └── run/
            └── route.ts        # POST /api/java/run
```

Request body:
```typescript
{ code: string; stdin?: string }
```

Response body:
```typescript
{
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  error?: string;       // runner-level error (e.g. javac not found)
}
```

Implementation skeleton (`route.ts`):
```typescript
import { exec } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';

const TIMEOUT_MS = 5000;
const TMP_DIR = '/tmp/java-lab';

export async function POST(req: Request) {
  const { code, stdin } = await req.json();

  await mkdir(TMP_DIR, { recursive: true });
  const id = randomUUID().replace(/-/g, '');
  const className = `JavaLabRunner_${id}`;
  const srcFile = path.join(TMP_DIR, `${className}.java`);

  // Replace placeholder class name in template
  const src = code.replace(/JavaLabRunner/g, className);
  await writeFile(srcFile, src, 'utf8');

  const start = Date.now();
  try {
    // Step 1: compile
    await execPromise(`javac ${srcFile} -d ${TMP_DIR}`, TIMEOUT_MS);
    // Step 2: run with memory cap
    const { stdout, stderr } = await execPromise(
      `java -cp ${TMP_DIR} -Xmx64m -Xss512k ${className}`,
      TIMEOUT_MS,
      stdin
    );
    return Response.json({ stdout, stderr, exitCode: 0, durationMs: Date.now() - start });
  } catch (e: any) {
    return Response.json({
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? e.message,
      exitCode: e.code ?? 1,
      durationMs: Date.now() - start,
    });
  } finally {
    // cleanup temp files (fire and forget)
    unlink(srcFile).catch(() => {});
    unlink(path.join(TMP_DIR, `${className}.class`)).catch(() => {});
  }
}
```

---

## Phase 3 — Progress Tracking (DB)

### 3.1 New Drizzle tables

Add to `lib/db/schema.ts` under the existing `pgSchema('algo_coach')`:

```typescript
export const javaLessonProgress = algoCoach.table('java_lesson_progress', {
  id: serial('id').primaryKey(),
  categorySlug: varchar('category_slug', { length: 100 }).notNull(),
  lessonSlug: varchar('lesson_slug', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('not_started'),
  // 'not_started' | 'in_progress' | 'done'
  lastOpenedAt: timestamp('last_opened_at'),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),             // personal notes per lesson
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 3.2 New service

`services/java-lab.service.ts`:
```typescript
// getLessonProgress(categorySlug, lessonSlug)
// upsertLessonProgress(categorySlug, lessonSlug, status)
// getAllProgress() → used for the category grid (shows % complete per category)
```

### 3.3 New API routes

```
app/api/java/progress/route.ts      # GET all, POST upsert
```

---

## Phase 4 — AI Explain

Reuse the existing `lib/ai/index.ts` Claude client.

New API route: `POST /api/java/explain`

Request: `{ code: string; selection?: string; lessonTitle: string }`

Prompt template:
```
You are a Java expert helping a Senior Software Engineer prepare for interviews.
The engineer is studying: "{lessonTitle}".

Explain the following Java code snippet clearly and concisely.
Focus on: what it does, why it's written this way, and what interview follow-ups it might trigger.

Code:
{code}
```

The AI response streams back using the Vercel AI SDK `streamText` — same pattern as the existing `/api/ai/recommendations` route.

---

## UI Layout — Lesson Page

```
┌─────────────────────────────────────────────────────────────────────┐
│ AlgoCoach AI   Dashboard  Topics  Questions  Java Lab  AI Coach      │ ← nav
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                        │
│  Category:   │  HashMap Internals                                     │ ← lesson title
│  Collections │  ─────────────────────────────────────────────────── │
│              │  ## Why this matters in interviews                     │
│  ○ ArrayList │  HashMap is asked in almost every Java interview...   │ ← lesson doc
│  ● HashMap   │                                                        │
│  ○ LinkedMap │  ## Key rules                                          │
│  ○ TreeMap   │  - equals/hashCode contract must be consistent         │
│  ○ HashSet   │  - Default capacity 16, load factor 0.75               │
│  ○ ArrayDeq  │  - Java 8+: bin → red-black tree at threshold 8        │
│  ○ PriorityQ │                                                        │
│  ○ Utils     │  ─────────────────────────────────────────────────── │
│  ○ equals/hc │  ┌── Editor ────────────────────────────────────────┐ │
│              │  │ public class JavaLabRunner {                      │ │
│  ─────────── │  │   public static void main(String[] args) {       │ │ ← Monaco
│  ◀ Core Java │  │     Map<String, Integer> map = new HashMap<>();   │ │
│  ▶ Streams   │  │     map.put("apple", 3);                          │ │
│              │  │     System.out.println(map.get("apple"));         │ │
│              │  │   }                                                │ │
│              │  │ }                                                  │ │
│              │  └──────────────────────────────────────── [Run ▶] ─┘ │
│              │  ┌── Output ─────────────────────────────────────────┐ │
│              │  │ 3                              exit 0  · 412ms    │ │ ← output
│              │  └───────────────────────────────────────────────────┘ │
│              │                             [✨ Explain with AI]       │
└──────────────┴──────────────────────────────────────────────────────┘
```

---

## Navigation Integration

Add **Java Lab** link to the existing `components/nav/` sidebar. Icon: `BookOpen` (lucide).

Route: `/java-lab`

Position in nav: between `Questions` and `AI Coach`.

---

## Delivery Phases Summary

| Phase | Scope | DB changes | Effort |
|-------|-------|-----------|--------|
| 1 — Static | Route, layout, nav, Monaco, static lesson content (start with Category 2 Collections) | None | 1–2 sessions |
| 2 — Runner | `POST /api/java/run`, temp file exec, output panel | None | 0.5 session |
| 3 — Progress | DB tables, progress service, status badges on lesson nav | `java_lesson_progress` table | 0.5 session |
| 4 — AI Explain | Streaming explain endpoint, UI button | None | 0.5 session |

**Recommended start:** Phase 1 with Category 2 (Collections) — highest interview relevance, self-contained lessons, immediately testable without DB.

---

## Prerequisites Checklist

Before starting implementation in a new session:

- [ ] `java -version` → must be 17 or higher
- [ ] `javac -version` → same JDK version
- [ ] `pnpm dev:clean` in `algo-coach-ai/` → app runs on localhost:3015
- [ ] PostgreSQL running (if Phase 3 needed) → `pnpm db:studio` opens Drizzle Studio
