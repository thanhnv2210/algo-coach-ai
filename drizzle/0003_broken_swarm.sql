CREATE TABLE "algo_coach"."java_lesson_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_slug" varchar(100) NOT NULL,
	"lesson_slug" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'not_started' NOT NULL,
	"last_opened_at" timestamp,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
