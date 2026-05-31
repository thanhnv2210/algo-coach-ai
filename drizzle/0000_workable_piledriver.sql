CREATE TABLE "algo_coach"."questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_slug" text NOT NULL,
	"title" text NOT NULL,
	"difficulty" text NOT NULL,
	"link" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'not_started' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "algo_coach"."topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "algo_coach"."questions" ADD CONSTRAINT "questions_topic_slug_topics_slug_fk" FOREIGN KEY ("topic_slug") REFERENCES "algo_coach"."topics"("slug") ON DELETE cascade ON UPDATE no action;