import {
  pgTable,
  uuid,
  text,
  varchar,
  bigint,
  boolean,
  timestamp,
  integer,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['user', 'admin']);
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended']);
export const planEnum = pgEnum('plan', ['Starter', 'Pro', 'Business', 'Enterprise']);
export const fileCategoryEnum = pgEnum('file_category', ['image', 'video', 'audio', 'archive', 'code', 'document', 'other']);
export const sharePermissionEnum = pgEnum('share_permission', ['viewer', 'editor']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'past_due', 'cancelled', 'trial']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  email: varchar('email', { length: 254 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('user'),
  status: userStatusEnum('status').notNull().default('active'),
  plan: planEnum('plan').notNull().default('Starter'),
  title: varchar('title', { length: 160 }),
  company: varchar('company', { length: 160 }),
  timezone: varchar('timezone', { length: 64 }).notNull().default('UTC'),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').notNull().default(false),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  sessionTimeoutMinutes: integer('session_timeout_minutes').notNull().default(60),
  loginAlertsEnabled: boolean('login_alerts_enabled').notNull().default(true),
  storageUsedBytes: bigint('storage_used_bytes', { mode: 'number' }).notNull().default(0),
  storageQuotaBytes: bigint('storage_quota_bytes', { mode: 'number' }).notNull().default(15 * 1024 ** 3),
  verificationCodeHash: text('verification_code_hash'),
  resetTokenHash: text('reset_token_hash'),
  resetTokenExpiresAt: timestamp('reset_token_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('users_email_uq').on(table.email),
]);

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  familyId: uuid('family_id').notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  replacedByHash: text('replaced_by_hash'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
}, (table) => [
  uniqueIndex('refresh_tokens_hash_uq').on(table.tokenHash),
  index('refresh_tokens_user_idx').on(table.userId),
]);

export const folders = pgTable('folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  name: varchar('name', { length: 255 }).notNull(),
  isFavorite: boolean('is_favorite').notNull().default(false),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('folders_owner_parent_idx').on(table.ownerId, table.parentId),
]);

export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 255 }).notNull(),
  category: fileCategoryEnum('category').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  objectKey: text('object_key').notNull(),
  checksumSha256: varchar('checksum_sha256', { length: 64 }),
  storageClass: varchar('storage_class', { length: 64 }).notNull().default('STANDARD'),
  isFavorite: boolean('is_favorite').notNull().default(false),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('files_object_key_uq').on(table.objectKey),
  index('files_owner_folder_idx').on(table.ownerId, table.folderId),
  index('files_owner_deleted_idx').on(table.ownerId, table.deletedAt),
]);

export const shares = pgTable('shares', {
  id: uuid('id').defaultRandom().primaryKey(),
  fileId: uuid('file_id').references(() => files.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  granteeUserId: uuid('grantee_user_id').references(() => users.id, { onDelete: 'cascade' }),
  granteeEmail: varchar('grantee_email', { length: 254 }),
  permission: sharePermissionEnum('permission').notNull().default('viewer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

export const shareLinks = pgTable('share_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  fileId: uuid('file_id').references(() => files.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull(),
  permission: sharePermissionEnum('permission').notNull().default('viewer'),
  passwordHash: text('password_hash'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('share_links_token_uq').on(table.tokenHash),
]);

export const favorites = pgTable('favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileId: uuid('file_id').references(() => files.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable('activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 80 }).notNull(),
  targetType: varchar('target_type', { length: 80 }).notNull(),
  targetId: uuid('target_id'),
  targetName: varchar('target_name', { length: 255 }),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('activities_created_idx').on(table.createdAt),
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 160 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 40 }).notNull(),
  link: text('link'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organization: varchar('organization', { length: 160 }).notNull(),
  plan: planEnum('plan').notNull(),
  seats: integer('seats').notNull().default(1),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  monthlyPriceUsd: integer('monthly_price_usd').notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
