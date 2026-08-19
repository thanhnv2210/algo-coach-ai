# Mobile UI Gap Analysis

_Analysed: 2026-08-19_

## Summary

| Priority | Files | Effort | Status |
|----------|-------|--------|--------|
| P0 — breaks on mobile | `layout.tsx`, `sidebar.tsx`, `LessonLayout.tsx`, `LessonNav.tsx`, `practice-shell.tsx` | High | ✅ Fixed |
| P1 — degrades significantly | `page.tsx` (dashboard), `question-table.tsx` | Medium | ✅ Fixed |
| P2 — tablet / landscape | `stats-card.tsx`, `progress-chart.tsx`, `CodeEditor.tsx` | Low | Backlog |
| P3 — polish | `CategoryGrid.tsx`, `topic-card.tsx`, `OutputPanel.tsx` | Low | Backlog |

---

## P0 — Critical (Breaks on Mobile)

### 1. Sidebar navigation — no mobile pattern
**File:** `app/(dashboard)/layout.tsx`, `components/nav/sidebar.tsx`

- `w-56` sidebar has no hamburger/drawer fallback
- No mobile nav exists at all — sidebar just overflows

**Fix:**
- Add `hidden md:flex` to `<aside>` in `sidebar.tsx`
- Create `components/nav/mobile-nav.tsx` — top bar with hamburger + slide-out drawer
- Add `<MobileNav />` above `<main>` in `layout.tsx`

---

### 2. Java Lab lesson view — 3-pane layout
**File:** `components/java-lab/LessonLayout.tsx`, `components/java-lab/LessonNav.tsx`

- `LessonNav (w-56) + content (w-1/2) + editor (w-1/2)` = 200%+ of a 375px phone
- No mobile fallback at all

**Fix:**
- `LessonNav` → `hidden lg:flex` (desktop sidebar only)
- Add mobile breadcrumb row with back link (shows on < lg)
- Content wrapper → `flex flex-col lg:flex-row`
- Each pane → `w-full lg:w-1/2`
- Lesson pane border → `border-b lg:border-b-0 lg:border-r`

---

### 3. Practice shell sidebar
**File:** `components/practice/practice-shell.tsx`

- Right panel `w-96` (384 px) — wider than most phones

**Fix:**
- Body → `flex flex-col md:flex-row`
- Right panel → `w-full md:w-96`, add `border-t md:border-t-0`

---

## P1 — High (Degrades Significantly)

### 4. Dashboard padding
**File:** `app/(dashboard)/page.tsx`

- `px-8` (32 px each side) leaves only 311 px on a 375 px phone

**Fix:** `px-4 sm:px-6 md:px-8`

---

### 5. Stats grid
**File:** `app/(dashboard)/page.tsx`

- `grid-cols-2` for 6 cards is cramped on small phones

**Fix:** `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6`

---

### 6. Question table — no mobile card view
**File:** `components/questions/question-table.tsx`

- Notes and Practice-link columns overflow on mobile
- No horizontal scroll guard on small screens

**Fix:**
- Notes `<th>/<td>` → `hidden sm:table-cell`
- Practice link `<th>/<td>` → `hidden sm:table-cell`

---

### 7. Touch targets
**File:** `components/java-lab/LessonLayout.tsx`, `components/nav/sidebar.tsx`

- Filter buttons `px-3 py-1.5` ≈ 30 px tall — below 44 px minimum
- Font-size buttons `w-6 h-6` (24 px)

**Fix:** `py-2.5` on filter buttons; `w-8 h-8` on font-size buttons

---

## P2 — Medium (Tablet / Landscape)

### 8. Recharts chart height
**File:** `components/dashboard/progress-chart.tsx`

- `height={220}` fixed — >50 % of viewport on phones

**Fix:** Wrap in `ResponsiveContainer` with `aspect-[16/9]` or `height="auto"`

---

### 9. Monaco Editor on mobile
**File:** `components/java-lab/CodeEditor.tsx`

- `fontSize: 13` hard to read on mobile
- No touch-scroll adjustment

**Fix:** Detect mobile via `window.innerWidth < 768`, set `fontSize: 12, scrollBeyondLastLine: false`

---

### 10. Page headings
**File:** `app/(dashboard)/page.tsx`, topics, questions pages

- `text-2xl` fixed — use `text-xl sm:text-2xl`

---

## P3 — Low (Polish)

- `CategoryGrid.tsx` — card grid could be `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- `topic-card.tsx` — padding adjustments
- `OutputPanel.tsx` — font size on mobile
