
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, proposalsTable, chatMessagesTable, aiMemoryTable, documentsTable } from '../db/schema';
import { type CreateChatMessageInput } from '../schema';
import { processAiChat } from '../handlers/process_ai_chat';
import { eq } from 'drizzle-orm';

describe('processAiChat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testOrgId: number;
  let testProposalId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        user_id: testUserId,
        name: 'Test Organization',
        description: 'A test organization'
      })
      .returning()
      .execute();
    testOrgId = orgResult[0].id;

    // Create test proposal
    const proposalResult = await db.insert(proposalsTable)
      .values({
        user_id: testUserId,
        organization_id: testOrgId,
        title: 'Test Proposal',
        description: 'A test proposal'
      })
      .returning()
      .execute();
    testProposalId = proposalResult[0].id;
  });

  it('should process user chat message and return AI response', async () => {
    const input: CreateChatMessageInput = {
      proposal_id: testProposalId,
      role: 'user',
      content: 'Hello, can you help me with my proposal?',
      message_type: 'chat'
    };

    const result = await processAiChat(input);

    // Verify AI response structure
    expect(result.id).toBeDefined();
    expect(result.proposal_id).toEqual(testProposalId);
    expect(result.role).toEqual('assistant');
    expect(result.content).toContain('Test Proposal');
    expect(result.content).toContain('Test Organization');
    expect(result.message_type).toEqual('chat');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save both user and AI messages to database', async () => {
    const input: CreateChatMessageInput = {
      proposal_id: testProposalId,
      role: 'user',
      content: 'I need help with planning',
      message_type: 'planning'
    };

    await processAiChat(input);

    // Check that both messages were saved
    const messages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.proposal_id, testProposalId))
      .execute();

    expect(messages).toHaveLength(2);
    
    // Verify user message
    const userMessage = messages.find(m => m.role === 'user');
    expect(userMessage).toBeDefined();
    expect(userMessage!.content).toEqual('I need help with planning');
    expect(userMessage!.message_type).toEqual('planning');

    // Verify AI message
    const aiMessage = messages.find(m => m.role === 'assistant');
    expect(aiMessage).toBeDefined();
    expect(aiMessage!.content).toContain('planning');
    expect(aiMessage!.message_type).toEqual('planning');
  });

  it('should generate planning-specific responses', async () => {
    const input: CreateChatMessageInput = {
      proposal_id: testProposalId,
      role: 'user',
      content: 'Help me create sections for my proposal',
      message_type: 'planning'
    };

    const result = await processAiChat(input);

    expect(result.content).toContain('Executive Summary');
    expect(result.content).toContain('Problem Statement');
    expect(result.content).toContain('Implementation Timeline');
    expect(result.content).toContain('Test Proposal');
  });

  it('should generate timeline-specific responses for planning', async () => {
    const input: CreateChatMessageInput = {
      proposal_id: testProposalId,
      role: 'user',
      content: 'What timeline should I use for this project?',
      message_type: 'planning'
    };

    const result = await processAiChat(input);

    expect(result.content).toContain('Phase 1');
    expect(result.content).toContain('Phase 2');
    expect(result.content).toContain('Research and Analysis');
    expect(result.content).toContain('Implementation Planning');
  });

  it('should generate feedback-specific responses', async () => {
    const input: CreateChatMessageInput = {
      proposal_id: testProposalId,
      role: 'user',
      content: 'Please review my draft section',
      message_type: 'feedback'
    };

    const result = await processAiChat(input);

    expect(result.content).toContain('feedback');
    expect(result.content).toContain('Test Proposal');
    expect(result.content).toContain('Review specific sections');
  });

  it('should incorporate document context when documents exist', async () => {
    // Add a document to the organization
    await db.insert(documentsTable)
      .values({
        organization_id: testOrgId,
        filename: 'test-doc.pdf',
        file_path: '/uploads/test-doc.pdf',
        file_type: 'pdf',
        file_size: 1024,
        upload_status: 'completed'
      })
      .execute();

    const input: CreateChatMessageInput = {
      proposal_id: testProposalId,
      role: 'user',
      content: 'What about the documents I uploaded?',
      message_type: 'chat'
    };

    const result = await processAiChat(input);

    expect(result.content).toContain('1 document');
    expect(result.content).toContain('analyze your documents');
  });

  it('should reference AI memory in responses', async () => {
    // Add AI memory for the proposal
    await db.insert(aiMemoryTable)
      .values({
        proposal_id: testProposalId,
        memory_type: 'user_feedback',
        content: 'User prefers detailed timelines',
        source: 'previous chat'
      })
      .execute();

    const input: CreateChatMessageInput = {
      proposal_id: testProposalId,
      role: 'user',
      content: 'I want to provide some feedback',
      message_type: 'feedback'
    };

    const result = await processAiChat(input);

    expect(result.content).toContain('noted your input');
  });

  it('should handle chat messages with help requests', async () => {
    const input: CreateChatMessageInput = {
      proposal_id: testProposalId,
      role: 'user',
      content: 'I need help getting started',
      message_type: 'chat'
    };

    const result = await processAiChat(input);

    expect(result.content).toContain('Planning');
    expect(result.content).toContain('Drafting');
    expect(result.content).toContain('Review');
    expect(result.content).toContain('Test Organization');
  });

  it('should reference proposal phase in responses', async () => {
    // Update proposal to drafting phase
    await db.update(proposalsTable)
      .set({ current_phase: 'drafting' })
      .where(eq(proposalsTable.id, testProposalId))
      .execute();

    const input: CreateChatMessageInput = {
      proposal_id: testProposalId,
      role: 'user',
      content: 'I need some feedback on my content',
      message_type: 'feedback'
    };

    const result = await processAiChat(input);

    expect(result.content).toContain('drafting phase');
  });

  it('should provide contextual responses based on recent messages', async () => {
    // Add some previous messages
    await db.insert(chatMessagesTable)
      .values([
        {
          proposal_id: testProposalId,
          role: 'user',
          content: 'I want to discuss the budget section',
          message_type: 'chat'
        },
        {
          proposal_id: testProposalId,
          role: 'assistant',
          content: 'Sure, I can help with budget planning',
          message_type: 'chat'
        }
      ])
      .execute();

    const input: CreateChatMessageInput = {
      proposal_id: testProposalId,
      role: 'user',
      content: 'Thanks for the help!',
      message_type: 'chat'
    };

    const result = await processAiChat(input);

    expect(result.content).toContain('Test Proposal');
    expect(result.content).toContain('Test Organization');
  });

  it('should handle multiple document references', async () => {
    // Add multiple documents
    await db.insert(documentsTable)
      .values([
        {
          organization_id: testOrgId,
          filename: 'doc1.pdf',
          file_path: '/uploads/doc1.pdf',
          file_type: 'pdf',
          file_size: 1024,
          upload_status: 'completed'
        },
        {
          organization_id: testOrgId,
          filename: 'doc2.docx',
          file_path: '/uploads/doc2.docx',
          file_type: 'docx',
          file_size: 2048,
          upload_status: 'completed'
        }
      ])
      .execute();

    const input: CreateChatMessageInput = {
      proposal_id: testProposalId,
      role: 'user',
      content: 'Can you analyze my timeline documents?',
      message_type: 'planning'
    };

    const result = await processAiChat(input);

    expect(result.content).toContain('2 document');
  });
});
