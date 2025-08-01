
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, proposalsTable, aiMemoryTable } from '../db/schema';
import { type CreateAiMemoryInput } from '../schema';
import { createAiMemory } from '../handlers/create_ai_memory';
import { eq } from 'drizzle-orm';

describe('createAiMemory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testProposalId: number;

  beforeEach(async () => {
    // Create prerequisite data: user -> organization -> proposal
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    const organization = await db.insert(organizationsTable)
      .values({
        user_id: user[0].id,
        name: 'Test Organization',
        description: 'A test organization'
      })
      .returning()
      .execute();

    const proposal = await db.insert(proposalsTable)
      .values({
        user_id: user[0].id,
        organization_id: organization[0].id,
        title: 'Test Proposal',
        description: 'A test proposal'
      })
      .returning()
      .execute();

    testProposalId = proposal[0].id;
  });

  it('should create AI memory with organization info', async () => {
    const testInput: CreateAiMemoryInput = {
      proposal_id: testProposalId,
      memory_type: 'organization_info',
      content: 'The organization specializes in renewable energy solutions and has 50+ employees.',
      source: 'company_profile.pdf'
    };

    const result = await createAiMemory(testInput);

    // Basic field validation
    expect(result.proposal_id).toEqual(testProposalId);
    expect(result.memory_type).toEqual('organization_info');
    expect(result.content).toEqual(testInput.content);
    expect(result.source).toEqual('company_profile.pdf');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create AI memory with user feedback', async () => {
    const testInput: CreateAiMemoryInput = {
      proposal_id: testProposalId,
      memory_type: 'user_feedback',
      content: 'User prefers technical language and detailed cost breakdowns in proposals.',
      source: null
    };

    const result = await createAiMemory(testInput);

    expect(result.memory_type).toEqual('user_feedback');
    expect(result.content).toEqual(testInput.content);
    expect(result.source).toBeNull();
  });

  it('should create AI memory with document insights', async () => {
    const testInput: CreateAiMemoryInput = {
      proposal_id: testProposalId,
      memory_type: 'document_insights',
      content: 'Key requirements extracted: Must comply with ISO 27001, budget cap of $500K, 6-month timeline.',
      source: 'rfp_document.pdf'
    };

    const result = await createAiMemory(testInput);

    expect(result.memory_type).toEqual('document_insights');
    expect(result.content).toEqual(testInput.content);
    expect(result.source).toEqual('rfp_document.pdf');
  });

  it('should create AI memory with planning notes', async () => {
    const testInput: CreateAiMemoryInput = {
      proposal_id: testProposalId,
      memory_type: 'planning_notes',
      content: 'Focus on sustainability benefits and ROI calculations. Include case studies from similar projects.',
      source: 'planning_session'
    };

    const result = await createAiMemory(testInput);

    expect(result.memory_type).toEqual('planning_notes');
    expect(result.content).toEqual(testInput.content);
    expect(result.source).toEqual('planning_session');
  });

  it('should save AI memory to database', async () => {
    const testInput: CreateAiMemoryInput = {
      proposal_id: testProposalId,
      memory_type: 'organization_info',
      content: 'Test memory content',
      source: 'test_source.pdf'
    };

    const result = await createAiMemory(testInput);

    // Query using proper drizzle syntax
    const memories = await db.select()
      .from(aiMemoryTable)
      .where(eq(aiMemoryTable.id, result.id))
      .execute();

    expect(memories).toHaveLength(1);
    expect(memories[0].proposal_id).toEqual(testProposalId);
    expect(memories[0].memory_type).toEqual('organization_info');
    expect(memories[0].content).toEqual('Test memory content');
    expect(memories[0].source).toEqual('test_source.pdf');
    expect(memories[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent proposal', async () => {
    const testInput: CreateAiMemoryInput = {
      proposal_id: 99999, // Non-existent proposal ID
      memory_type: 'organization_info',
      content: 'Test content',
      source: null
    };

    // Should throw foreign key constraint error
    expect(createAiMemory(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
