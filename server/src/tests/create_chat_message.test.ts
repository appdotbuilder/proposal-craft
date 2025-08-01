
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, proposalsTable, chatMessagesTable } from '../db/schema';
import { type CreateChatMessageInput } from '../schema';
import { createChatMessage } from '../handlers/create_chat_message';
import { eq } from 'drizzle-orm';

// Test setup data
const testUser = {
  email: 'test@example.com',
  full_name: 'Test User'
};

const testOrg = {
  name: 'Test Organization',
  description: 'A test organization'
};

const testProposal = {
  title: 'Test Proposal',
  description: 'A test proposal'
};

const testInput: CreateChatMessageInput = {
  proposal_id: 1, // Will be set after creating test proposal
  role: 'user',
  content: 'Hello, I need help with my proposal.',
  message_type: 'chat'
};

describe('createChatMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chat message', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const orgResult = await db.insert(organizationsTable)
      .values({ ...testOrg, user_id: userId })
      .returning()
      .execute();
    const orgId = orgResult[0].id;

    const proposalResult = await db.insert(proposalsTable)
      .values({ ...testProposal, user_id: userId, organization_id: orgId })
      .returning()
      .execute();
    const proposalId = proposalResult[0].id;

    // Create chat message
    const result = await createChatMessage({ ...testInput, proposal_id: proposalId });

    // Basic field validation
    expect(result.proposal_id).toEqual(proposalId);
    expect(result.role).toEqual('user');
    expect(result.content).toEqual('Hello, I need help with my proposal.');
    expect(result.message_type).toEqual('chat');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save chat message to database', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const orgResult = await db.insert(organizationsTable)
      .values({ ...testOrg, user_id: userId })
      .returning()
      .execute();
    const orgId = orgResult[0].id;

    const proposalResult = await db.insert(proposalsTable)
      .values({ ...testProposal, user_id: userId, organization_id: orgId })
      .returning()
      .execute();
    const proposalId = proposalResult[0].id;

    // Create chat message
    const result = await createChatMessage({ ...testInput, proposal_id: proposalId });

    // Query using proper drizzle syntax
    const messages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].proposal_id).toEqual(proposalId);
    expect(messages[0].role).toEqual('user');
    expect(messages[0].content).toEqual('Hello, I need help with my proposal.');
    expect(messages[0].message_type).toEqual('chat');
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should create assistant message', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const orgResult = await db.insert(organizationsTable)
      .values({ ...testOrg, user_id: userId })
      .returning()
      .execute();
    const orgId = orgResult[0].id;

    const proposalResult = await db.insert(proposalsTable)
      .values({ ...testProposal, user_id: userId, organization_id: orgId })
      .returning()
      .execute();
    const proposalId = proposalResult[0].id;

    // Create assistant message
    const assistantInput: CreateChatMessageInput = {
      proposal_id: proposalId,
      role: 'assistant',
      content: 'I can help you with your proposal. What specific area would you like to focus on?',
      message_type: 'planning'
    };

    const result = await createChatMessage(assistantInput);

    expect(result.role).toEqual('assistant');
    expect(result.content).toEqual('I can help you with your proposal. What specific area would you like to focus on?');
    expect(result.message_type).toEqual('planning');
  });

  it('should throw error for invalid proposal_id', async () => {
    const invalidInput: CreateChatMessageInput = {
      proposal_id: 999, // Non-existent proposal
      role: 'user',
      content: 'Test message',
      message_type: 'chat'
    };

    await expect(createChatMessage(invalidInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
