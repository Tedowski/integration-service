import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const fileRecords = pgTable('file_records', {
	id: uuid('id').primaryKey(),
	originalName: text('original_name').notNull(),
	mimeType: text('mime_type').notNull(),
	size: integer('size').notNull(),
	storageKey: text('storage_key').notNull().unique(),
	userId: text('user_id'),
	uploadedAt: timestamp('uploaded_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type FileRecordSchema = typeof fileRecords.$inferSelect;
