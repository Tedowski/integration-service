CREATE TABLE "connection_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"customer_id" uuid NOT NULL,
	"customer_email" text NOT NULL,
	"customer_organization_name" text NOT NULL,
	"connector_type" varchar(50) NOT NULL,
	"merge_link_token" text,
	"url" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_connections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_organization_name" text NOT NULL,
	"connector_type" varchar(50) NOT NULL,
	"account_id" text NOT NULL,
	"account_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merge_webhook_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"merge_linked_account_id" text NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"model" varchar(100),
	"payload" jsonb NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file_records" RENAME COLUMN "user_id" TO "customer_id";