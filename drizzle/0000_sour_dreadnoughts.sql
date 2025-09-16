CREATE TABLE "prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"author" text,
	"variables" jsonb
);
--> statement-breakpoint
CREATE INDEX "prompts_category_idx" ON "prompts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "prompts_name_idx" ON "prompts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "prompts_tags_idx" ON "prompts" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "prompts_author_idx" ON "prompts" USING btree ("author");--> statement-breakpoint
CREATE INDEX "prompts_updated_at_idx" ON "prompts" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "prompts_content_search_idx" ON "prompts" USING gin (to_tsvector('english', "content" || ' ' || "description" || ' ' || "name"));