import { pgTable, text, timestamp, uuid, jsonb, integer, numeric } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow()
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').$type<'fan' | 'creator' | 'admin'>().default('fan'),
  displayName: text('display_name'),
  stripeCustomerId: text('stripe_customer_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow()
});

export const creators = pgTable('creators', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  bio: text('bio'),
  avatarMetadata: jsonb('avatar_metadata'),
  stripeAccountId: text('stripe_account_id'),
  heroImageUrl: text('hero_image_url'),
  livekitRoomSlug: text('livekit_room_slug'),
  status: text('status').$type<'draft' | 'ready' | 'processing'>().default('draft'),
  pricePerMinute: integer('price_per_minute').default(100),
  createdAt: timestamp('created_at').defaultNow()
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  roomId: text('room_id').notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  creatorId: uuid('creator_id').references(() => creators.id).notNull(),
  fanId: uuid('fan_id').references(() => users.id).notNull(),
  status: text('status').$type<'created' | 'active' | 'ended' | 'cancelled'>().default('created'),
  billingCustomerId: text('billing_customer_id'),
  minutesConsumed: integer('minutes_consumed').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  endedAt: timestamp('ended_at')
});

export const agentArtifacts = pgTable('agent_artifacts', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  creatorId: uuid('creator_id').references(() => creators.id).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  artifactUrl: text('artifact_url').notNull(),
  personaId: text('persona_id').notNull(),
  modelConfig: jsonb('model_config'),
  status: text('status').$type<'registered' | 'active' | 'deprecated'>().default('registered'),
  createdAt: timestamp('created_at').defaultNow()
});

export const tips = pgTable('tips', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').default('usd'),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow()
});

export const moderationEvents = pgTable('moderation_events', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  messageId: uuid('message_id').notNull(),
  label: text('label').notNull(),
  severity: integer('severity').default(0),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at').defaultNow()
});

export const usageRecords = pgTable('usage_records', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  customerId: text('customer_id').notNull(),
  meterEvent: text('meter_event').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).default('0'),
  recordedAt: timestamp('recorded_at').defaultNow()
});

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Creator = typeof creators.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type AgentArtifact = typeof agentArtifacts.$inferSelect;
export type Tip = typeof tips.$inferSelect;
export type ModerationEvent = typeof moderationEvents.$inferSelect;
export type UsageRecord = typeof usageRecords.$inferSelect;
