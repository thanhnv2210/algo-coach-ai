import { integer, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core"

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

// ─── Inferred types ────────────────────────────────────────────────────────────

export type Topic = typeof topics.$inferSelect
export type NewTopic = typeof topics.$inferInsert
export type Question = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert
export type QuestionStatus =
  | "not_started"
  | "learning"
  | "solved"
  | "review_needed"
  | "mastered"
