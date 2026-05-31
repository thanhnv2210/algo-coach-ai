import { integer, numeric, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core"

// All tables live in the "algo_coach" schema,
// isolated from other projects on the shared Postgres instance.
const schema = pgSchema("algo_coach")

// ─── Topics ───────────────────────────────────────────────────────────────────

export const topics = schema.table("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // "fundamentals" | "graphs_trees" | "advanced"
  description: text("description").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─── Questions ────────────────────────────────────────────────────────────────

export const questions = schema.table("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicSlug: text("topic_slug")
    .notNull()
    .references(() => topics.slug, { onDelete: "cascade" }),
  title: text("title").notNull(),
  difficulty: text("difficulty").notNull(), // "easy" | "medium" | "hard"
  link: text("link").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("not_started"),
  // "not_started" | "learning" | "solved" | "review_needed" | "mastered"
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// ─── Progress ─────────────────────────────────────────────────────────────────

export const progress = schema.table("progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicSlug: text("topic_slug")
    .notNull()
    .unique()
    .references(() => topics.slug, { onDelete: "cascade" }),
  solvedCount: integer("solved_count").notNull().default(0),
  totalCount: integer("total_count").notNull().default(0),
  confidenceLevel: integer("confidence_level").notNull().default(0), // 0 = unrated, 1–5
  completionPercentage: numeric("completion_percentage").notNull().default("0"),
  lastReviewed: timestamp("last_reviewed"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// ─── Inferred types ────────────────────────────────────────────────────────────

export type Topic = typeof topics.$inferSelect
export type NewTopic = typeof topics.$inferInsert
export type Question = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert
export type Progress = typeof progress.$inferSelect
export type NewProgress = typeof progress.$inferInsert
export type QuestionStatus =
  | "not_started"
  | "learning"
  | "solved"
  | "review_needed"
  | "mastered"
