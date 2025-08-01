
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const fileTypeEnum = pgEnum('file_type', ['pdf', 'docx', 'doc']);
export const uploadStatusEnum = pgEnum('upload_status', ['pending', 'processing', 'completed', 'failed']);
export const proposalStatusEnum = pgEnum('proposal_status', ['planning', 'drafting', 'completed', 'archived']);
export const proposalPhaseEnum = pgEnum('proposal_phase', ['planning', 'drafting']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);
export const messageTypeEnum = pgEnum('message_type', ['chat', 'planning', 'feedback']);
export const memoryTypeEnum = pgEnum('memory_type', ['organization_info', 'user_feedback', 'document_insights', 'planning_notes']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  full_name: text('full_name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Organizations table
export const organizationsTable = pgTable('organizations', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Documents table
export const documentsTable = pgTable('documents', {
  id: serial('id').primaryKey(),
  organization_id: integer('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  file_path: text('file_path').notNull(),
  file_type: fileTypeEnum('file_type').notNull(),
  file_size: integer('file_size').notNull(),
  upload_status: uploadStatusEnum('upload_status').default('pending').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Proposals table
export const proposalsTable = pgTable('proposals', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  organization_id: integer('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: proposalStatusEnum('status').default('planning').notNull(),
  current_phase: proposalPhaseEnum('current_phase').default('planning').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Proposal sections table
export const proposalSectionsTable = pgTable('proposal_sections', {
  id: serial('id').primaryKey(),
  proposal_id: integer('proposal_id').notNull().references(() => proposalsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content'),
  order_index: integer('order_index').notNull(),
  is_completed: boolean('is_completed').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Chat messages table
export const chatMessagesTable = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  proposal_id: integer('proposal_id').notNull().references(() => proposalsTable.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  message_type: messageTypeEnum('message_type').default('chat').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// AI memory table for storing contextual information
export const aiMemoryTable = pgTable('ai_memory', {
  id: serial('id').primaryKey(),
  proposal_id: integer('proposal_id').notNull().references(() => proposalsTable.id, { onDelete: 'cascade' }),
  memory_type: memoryTypeEnum('memory_type').notNull(),
  content: text('content').notNull(),
  source: text('source'), // Source of the memory (document name, user input, etc.)
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  organizations: many(organizationsTable),
  proposals: many(proposalsTable),
}));

export const organizationsRelations = relations(organizationsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [organizationsTable.user_id],
    references: [usersTable.id],
  }),
  documents: many(documentsTable),
  proposals: many(proposalsTable),
}));

export const documentsRelations = relations(documentsTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [documentsTable.organization_id],
    references: [organizationsTable.id],
  }),
}));

export const proposalsRelations = relations(proposalsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [proposalsTable.user_id],
    references: [usersTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [proposalsTable.organization_id],
    references: [organizationsTable.id],
  }),
  sections: many(proposalSectionsTable),
  chatMessages: many(chatMessagesTable),
  aiMemory: many(aiMemoryTable),
}));

export const proposalSectionsRelations = relations(proposalSectionsTable, ({ one }) => ({
  proposal: one(proposalsTable, {
    fields: [proposalSectionsTable.proposal_id],
    references: [proposalsTable.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessagesTable, ({ one }) => ({
  proposal: one(proposalsTable, {
    fields: [chatMessagesTable.proposal_id],
    references: [proposalsTable.id],
  }),
}));

export const aiMemoryRelations = relations(aiMemoryTable, ({ one }) => ({
  proposal: one(proposalsTable, {
    fields: [aiMemoryTable.proposal_id],
    references: [proposalsTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  organizations: organizationsTable,
  documents: documentsTable,
  proposals: proposalsTable,
  proposalSections: proposalSectionsTable,
  chatMessages: chatMessagesTable,
  aiMemory: aiMemoryTable,
};
