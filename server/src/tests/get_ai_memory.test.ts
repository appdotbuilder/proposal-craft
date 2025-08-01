
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, proposalsTable, aiMemoryTable } from '../db/schema';
import { getAiMemory } from '../handlers/get_ai_memory';

describe('getAiMemory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no AI memory exists for proposal', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    const [organization] = await db.insert(organizationsTable)
      .values({
        user_id: user.id,
        name: 'Test Organization',
        description: 'A test organization'
      })
      .returning()
      .execute();

    const [proposal] = await db.insert(proposalsTable)
      .values({
        user_id: user.id,
        organization_id: organization.id,
        title: 'Test Proposal',
        description: 'A test proposal'
      })
      .returning()
      .execute();

    const result = await getAiMemory(proposal.id);

    expect(result).toHaveLength(0);
  });

  it('should return AI memory entries for a proposal', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    const [organization] = await db.insert(organizationsTable)
      .values({
        user_id: user.id,
        name: 'Test Organization',
        description: 'A test organization'
      })
      .returning()
      .execute();

    const [proposal] = await db.insert(proposalsTable)
      .values({
        user_id: user.id,
        organization_id: organization.id,
        title: 'Test Proposal',
        description: 'A test proposal'
      })
      .returning()
      .execute();

    // Create AI memory entries
    await db.insert(aiMemoryTable)
      .values([
        {
          proposal_id: proposal.id,
          memory_type: 'organization_info',
          content: 'This organization focuses on technology solutions',
          source: 'User input'
        },
        {
          proposal_id: proposal.id,
          memory_type: 'document_insights',
          content: 'Key insights from uploaded documents',
          source: 'document.pdf'
        },
        {
          proposal_id: proposal.id,
          memory_type: 'user_feedback',
          content: 'User prefers technical approach',
          source: null
        }
      ])
      .execute();

    const result = await getAiMemory(proposal.id);

    expect(result).toHaveLength(3);
    
    // Verify basic structure
    expect(result[0].id).toBeDefined();
    expect(result[0].proposal_id).toEqual(proposal.id);
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Verify all memory types are included
    const memoryTypes = result.map(m => m.memory_type);
    expect(memoryTypes).toContain('organization_info');
    expect(memoryTypes).toContain('document_insights');
    expect(memoryTypes).toContain('user_feedback');
    
    // Verify content and sources
    const orgInfo = result.find(m => m.memory_type === 'organization_info');
    expect(orgInfo?.content).toEqual('This organization focuses on technology solutions');
    expect(orgInfo?.source).toEqual('User input');
    
    const docInsights = result.find(m => m.memory_type === 'document_insights');
    expect(docInsights?.content).toEqual('Key insights from uploaded documents');
    expect(docInsights?.source).toEqual('document.pdf');
    
    const userFeedback = result.find(m => m.memory_type === 'user_feedback');
    expect(userFeedback?.content).toEqual('User prefers technical approach');
    expect(userFeedback?.source).toBeNull();
  });

  it('should return results ordered by created_at descending', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    const [organization] = await db.insert(organizationsTable)
      .values({
        user_id: user.id,
        name: 'Test Organization',
        description: 'A test organization'
      })
      .returning()
      .execute();

    const [proposal] = await db.insert(proposalsTable)
      .values({
        user_id: user.id,
        organization_id: organization.id,
        title: 'Test Proposal',
        description: 'A test proposal'
      })
      .returning()
      .execute();

    // Create AI memory entries with slight delays to ensure different timestamps
    const firstMemory = await db.insert(aiMemoryTable)
      .values({
        proposal_id: proposal.id,
        memory_type: 'organization_info',
        content: 'First memory entry',
        source: 'test'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondMemory = await db.insert(aiMemoryTable)
      .values({
        proposal_id: proposal.id,
        memory_type: 'user_feedback',
        content: 'Second memory entry',
        source: 'test'
      })
      .returning()
      .execute();

    const result = await getAiMemory(proposal.id);

    expect(result).toHaveLength(2);
    // Most recent entry should be first
    expect(result[0].content).toEqual('Second memory entry');
    expect(result[1].content).toEqual('First memory entry');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should only return AI memory for the specified proposal', async () => {
    // Create prerequisite data for two proposals
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    const [organization] = await db.insert(organizationsTable)
      .values({
        user_id: user.id,
        name: 'Test Organization',
        description: 'A test organization'
      })
      .returning()
      .execute();

    const [proposal1] = await db.insert(proposalsTable)
      .values({
        user_id: user.id,
        organization_id: organization.id,
        title: 'First Proposal',
        description: 'First test proposal'
      })
      .returning()
      .execute();

    const [proposal2] = await db.insert(proposalsTable)
      .values({
        user_id: user.id,
        organization_id: organization.id,
        title: 'Second Proposal',
        description: 'Second test proposal'
      })
      .returning()
      .execute();

    // Create AI memory for both proposals
    await db.insert(aiMemoryTable)
      .values([
        {
          proposal_id: proposal1.id,
          memory_type: 'organization_info',
          content: 'Memory for proposal 1',
          source: 'test'
        },
        {
          proposal_id: proposal2.id,
          memory_type: 'organization_info',
          content: 'Memory for proposal 2',
          source: 'test'
        }
      ])
      .execute();

    const result = await getAiMemory(proposal1.id);

    expect(result).toHaveLength(1);
    expect(result[0].proposal_id).toEqual(proposal1.id);
    expect(result[0].content).toEqual('Memory for proposal 1');
  });
});
