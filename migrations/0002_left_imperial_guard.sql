ALTER TABLE "file_records" ALTER COLUMN "customer_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "merge_webhook_events" DROP COLUMN "merge_linked_account_id";--> statement-breakpoint
ALTER TABLE "merge_webhook_events" DROP COLUMN "model";--> statement-breakpoint
ALTER TABLE "merge_webhook_events" DROP COLUMN "processed";