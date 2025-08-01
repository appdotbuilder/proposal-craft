
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createOrganizationInputSchema,
  createProposalInputSchema,
  updateProposalInputSchema,
  createProposalSectionInputSchema,
  updateProposalSectionInputSchema,
  createChatMessageInputSchema,
  uploadDocumentInputSchema,
  createAiMemoryInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createOrganization } from './handlers/create_organization';
import { getOrganizationsByUser } from './handlers/get_organizations_by_user';
import { uploadDocument } from './handlers/upload_document';
import { getDocumentsByOrganization } from './handlers/get_documents_by_organization';
import { createProposal } from './handlers/create_proposal';
import { getProposalsByUser } from './handlers/get_proposals_by_user';
import { getProposalById } from './handlers/get_proposal_by_id';
import { updateProposal } from './handlers/update_proposal';
import { createProposalSection } from './handlers/create_proposal_section';
import { updateProposalSection } from './handlers/update_proposal_section';
import { getProposalSections } from './handlers/get_proposal_sections';
import { createChatMessage } from './handlers/create_chat_message';
import { getChatMessages } from './handlers/get_chat_messages';
import { processAiChat } from './handlers/process_ai_chat';
import { createAiMemory } from './handlers/create_ai_memory';
import { getAiMemory } from './handlers/get_ai_memory';
import { generateProposalDocument } from './handlers/generate_proposal_document';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Organization management
  createOrganization: publicProcedure
    .input(createOrganizationInputSchema)
    .mutation(({ input }) => createOrganization(input)),

  getOrganizationsByUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getOrganizationsByUser(input.userId)),

  // Document management
  uploadDocument: publicProcedure
    .input(uploadDocumentInputSchema)
    .mutation(({ input }) => uploadDocument(input)),

  getDocumentsByOrganization: publicProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(({ input }) => getDocumentsByOrganization(input.organizationId)),

  // Proposal management
  createProposal: publicProcedure
    .input(createProposalInputSchema)
    .mutation(({ input }) => createProposal(input)),

  getProposalsByUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getProposalsByUser(input.userId)),

  getProposalById: publicProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(({ input }) => getProposalById(input.proposalId)),

  updateProposal: publicProcedure
    .input(updateProposalInputSchema)
    .mutation(({ input }) => updateProposal(input)),

  // Proposal sections
  createProposalSection: publicProcedure
    .input(createProposalSectionInputSchema)
    .mutation(({ input }) => createProposalSection(input)),

  updateProposalSection: publicProcedure
    .input(updateProposalSectionInputSchema)
    .mutation(({ input }) => updateProposalSection(input)),

  getProposalSections: publicProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(({ input }) => getProposalSections(input.proposalId)),

  // Chat and AI functionality
  createChatMessage: publicProcedure
    .input(createChatMessageInputSchema)
    .mutation(({ input }) => createChatMessage(input)),

  getChatMessages: publicProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(({ input }) => getChatMessages(input.proposalId)),

  processAiChat: publicProcedure
    .input(createChatMessageInputSchema)
    .mutation(({ input }) => processAiChat(input)),

  // AI memory management
  createAiMemory: publicProcedure
    .input(createAiMemoryInputSchema)
    .mutation(({ input }) => createAiMemory(input)),

  getAiMemory: publicProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(({ input }) => getAiMemory(input.proposalId)),

  // Document generation
  generateProposalDocument: publicProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(({ input }) => generateProposalDocument(input.proposalId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`ProposalCraft TRPC server listening at port: ${port}`);
}

start();
