CREATE TABLE "algo_coach"."progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_slug" text NOT NULL,
	"solved_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"confidence_level" integer DEFAULT 0 NOT NULL,
	"completion_percentage" numeric DEFAULT '0' NOT NULL,
	"last_reviewed" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "progress_topic_slug_unique" UNIQUE("topic_slug")
);
--> statement-breakpoint
ALTER TABLE "algo_coach"."progress" ADD CONSTRAINT "progress_topic_slug_topics_slug_fk" FOREIGN KEY ("topic_slug") REFERENCES "algo_coach"."topics"("slug") ON DELETE cascade ON UPDATE no action;