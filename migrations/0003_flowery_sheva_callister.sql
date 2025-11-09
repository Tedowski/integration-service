CREATE TABLE "failed_merge_file_syncs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"account_id" text NOT NULL,
	"reason" text NOT NULL,
	"attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_connections" ADD COLUMN "last_synced_at" timestamp;