CREATE TABLE "algo_coach"."client_errors" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"error_type" varchar(50),
	"url" text,
	"user_agent" text,
	"component_stack" text,
	"extra" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
