
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { proposalsTable, usersTable, organizationsTable } from '../db/schema';
import { type CreateProposalInput } from '../schema';
import { createProposal } from '../handlers/create_proposal';
import { eq } from 'drizzle-orm';

describe('createProposal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testOrganizationId: number;

  const setupTestData = async () => {
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
    testOrganizationId = orgResult[0].id;
  };

  it('should create a proposal with all fields', async () => {
    await setupTestData();

    const testInput: CreateProposalInput = {
      user_id: testUserId,
      organization_id: testOrganizationId,
      title: 'Test Proposal',
      description: 'A proposal for testing'
    };

    const result = await createProposal(testInput);

    // Basic field validation
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.organization_id).toEqual(testOrganizationId);
    expect(result.title).toEqual('Test Proposal');
    expect(result.description).toEqual('A proposal for testing');
    expect(result.status).toEqual('planning');
    expect(result.current_phase).toEqual('planning');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a proposal with null description', async () => {
    await setupTestData();

    const testInput: CreateProposalInput = {
      user_id: testUserId,
      organization_id: testOrganizationId,
      title: 'Test Proposal',
      description: null
    };

    const result = await createProposal(testInput);

    expect(result.title).toEqual('Test Proposal');
    expect(result.description).toBeNull();
    expect(result.status).toEqual('planning');
    expect(result.current_phase).toEqual('planning');
  });

  it('should save proposal to database', async () => {
    await setupTestData();

    const testInput: CreateProposalInput = {
      user_id: testUserId,
      organization_id: testOrganizationId,
      title: 'Test Proposal',
      description: 'A proposal for testing'
    };

    const result = await createProposal(testInput);

    // Query database to verify proposal was saved
    const proposals = await db.select()
      .from(proposalsTable)
      .where(eq(proposalsTable.id, result.id))
      .execute();

    expect(proposals).toHaveLength(1);
    expect(proposals[0].title).toEqual('Test Proposal');
    expect(proposals[0].description).toEqual('A proposal for testing');
    expect(proposals[0].user_id).toEqual(testUserId);
    expect(proposals[0].organization_id).toEqual(testOrganizationId);
    expect(proposals[0].status).toEqual('planning');
    expect(proposals[0].current_phase).toEqual('planning');
    expect(proposals[0].created_at).toBeInstanceOf(Date);
    expect(proposals[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    await setupTestData();

    const testInput: CreateProposalInput = {
      user_id: 99999, // Non-existent user ID
      organization_id: testOrganizationId,
      title: 'Test Proposal',
      description: 'A proposal for testing'
    };

    await expect(createProposal(testInput)).rejects.toThrow(/user with id 99999 not found/i);
  });

  it('should throw error when organization does not exist', async () => {
    await setupTestData();

    const testInput: CreateProposalInput = {
      user_id: testUserId,
      organization_id: 99999, // Non-existent organization ID
      title: 'Test Proposal',
      description: 'A proposal for testing'
    };

    await expect(createProposal(testInput)).rejects.toThrow(/organization with id 99999 not found/i);
  });
});
