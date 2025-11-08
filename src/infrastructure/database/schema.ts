import { integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const fileRecords = pgTable('file_records', {
	id: uuid('id').primaryKey(),
	originalName: text('original_name').notNull(),
	mimeType: text('mime_type').notNull(),
	size: integer('size').notNull(),
	storageKey: text('storage_key').notNull().unique(),
	customerId: text('customer_id').notNull(),
	uploadedAt: timestamp('uploaded_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type FileRecordSchema = InferSelectModel<typeof fileRecords>;
export type NewFileRecordSchema = InferInsertModel<typeof fileRecords>;

export const customerConnections = pgTable('customer_connections', {
	id: uuid('id').primaryKey(),
	customerId: text('customer_id').notNull(),
	customerEmail: text('customer_email').notNull(),
	customerOrganizationName: text('customer_organization_name').notNull(),
	connectorType: varchar('connector_type', { length: 50 }).notNull(),
	accountId: text('account_id').notNull(),
	accountToken: text('account_token').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	lastSyncedAt: timestamp('last_synced_at'),
});

export type CustomerConnectionSchema = InferSelectModel<typeof customerConnections>;
export type NewCustomerConnectionSchema = InferInsertModel<typeof customerConnections>;

export const connectionAttempts = pgTable('connection_attempts', {
	id: uuid('id').primaryKey(),
	customerId: uuid('customer_id').notNull(),
	customerEmail: text('customer_email').notNull(),
	customerOrganizationName: text('customer_organization_name').notNull(),
	connectorType: varchar('connector_type', { length: 50 }).notNull(),
	mergeLinkToken: text('merge_link_token'),
	url: text('url'),
	status: varchar('status', { length: 20 }).notNull().default('pending'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ConnectionAttemptSchema = InferSelectModel<typeof connectionAttempts>;
export type NewConnectionAttemptSchema = InferInsertModel<typeof connectionAttempts>;

export const mergeWebhookEvents = pgTable('merge_webhook_events', {
	id: uuid('id').primaryKey(),
	eventType: varchar('event_type', { length: 100 }).notNull(),
	payload: jsonb('payload').notNull(),
	processedAt: timestamp('processed_at'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type MergeWebhookEventSchema = InferSelectModel<typeof mergeWebhookEvents>;
export type NewMergeWebhookEventSchema = InferInsertModel<typeof mergeWebhookEvents>;

export const failedMergeFileSyncs = pgTable('failed_merge_file_syncs', {
	id: uuid('id').primaryKey(),
	fileId: text('file_id').notNull(),
	accountId: text('account_id').notNull(),
	reason: text('reason').notNull(),
	attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
});

export type FailedMergeFileSyncSchema = InferSelectModel<typeof failedMergeFileSyncs>;
export type NewFailedMergeFileSyncSchema = InferInsertModel<typeof failedMergeFileSyncs>;
