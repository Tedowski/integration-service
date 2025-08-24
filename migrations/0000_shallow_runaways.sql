CREATE TABLE "file_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"storage_key" text NOT NULL,
	"user_id" text,
	"uploaded_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "file_records_storage_key_unique" UNIQUE("storage_key")
);
