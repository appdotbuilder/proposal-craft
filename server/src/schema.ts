
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  full_name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Organization schema
export const organizationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Organization = z.infer<typeof organizationSchema>;

// Document schema
export const documentSchema = z.object({
  id: z.number(),
  organization_id: z.number(),
  filename: z.string(),
  file_path: z.string(),
  file_type: z.enum(['pdf', 'docx', 'doc']),
  file_size: z.number(),
  upload_status: z.enum(['pending', 'processing', 'completed', 'failed']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Document = z.infer<typeof documentSchema>;

// Proposal schema
export const proposalSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  organization_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(['planning', 'drafting', 'completed', 'archived']),
  current_phase: z.enum(['planning', 'drafting']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Proposal = z.infer<typeof proposalSchema>;

// Proposal section schema
export const proposalSectionSchema = z.object({
  id: z.number(),
  proposal_id: z.number(),
  title: z.string(),
  content: z.string().nullable(),
  order_index: z.number().int(),
  is_completed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ProposalSection = z.infer<typeof proposalSectionSchema>;

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.number(),
  proposal_id: z.number(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  message_type: z.enum(['chat', 'planning', 'feedback']),
  created_at: z.coerce.date()
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// AI memory schema for storing contextual information
export const aiMemorySchema = z.object({
  id: z.number(),
  proposal_id: z.number(),
  memory_type: z.enum(['organization_info', 'user_feedback', 'document_insights', 'planning_notes']),
  content: z.string(),
  source: z.string().nullable(), // Source of the memory (document name, user input, etc.)
  created_at: z.coerce.date()
});

export type AiMemory = z.infer<typeof aiMemorySchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  email: z.string().email(),
  full_name: z.string()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createOrganizationInputSchema = z.object({
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable()
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationInputSchema>;

export const createProposalInputSchema = z.object({
  user_id: z.number(),
  organization_id: z.number(),
  title: z.string(),
  description: z.string().nullable()
});

export type CreateProposalInput = z.infer<typeof createProposalInputSchema>;

export const updateProposalInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['planning', 'drafting', 'completed', 'archived']).optional(),
  current_phase: z.enum(['planning', 'drafting']).optional()
});

export type UpdateProposalInput = z.infer<typeof updateProposalInputSchema>;

export const createProposalSectionInputSchema = z.object({
  proposal_id: z.number(),
  title: z.string(),
  content: z.string().nullable(),
  order_index: z.number().int()
});

export type CreateProposalSectionInput = z.infer<typeof createProposalSectionInputSchema>;

export const updateProposalSectionInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  content: z.string().nullable().optional(),
  order_index: z.number().int().optional(),
  is_completed: z.boolean().optional()
});

export type UpdateProposalSectionInput = z.infer<typeof updateProposalSectionInputSchema>;

export const createChatMessageInputSchema = z.object({
  proposal_id: z.number(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  message_type: z.enum(['chat', 'planning', 'feedback'])
});

export type CreateChatMessageInput = z.infer<typeof createChatMessageInputSchema>;

export const uploadDocumentInputSchema = z.object({
  organization_id: z.number(),
  filename: z.string(),
  file_type: z.enum(['pdf', 'docx', 'doc']),
  file_size: z.number()
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentInputSchema>;

export const createAiMemoryInputSchema = z.object({
  proposal_id: z.number(),
  memory_type: z.enum(['organization_info', 'user_feedback', 'document_insights', 'planning_notes']),
  content: z.string(),
  source: z.string().nullable()
});

export type CreateAiMemoryInput = z.infer<typeof createAiMemoryInputSchema>;
