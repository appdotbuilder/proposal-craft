
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, proposalsTable } from '../db/schema';
import { type UpdateProposalInput } from '../schema';
import { updateProposal } from '../handlers/update_proposal';
import { eq } from 'drizzle-orm';

describe('updateProposal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testOrganizationId: number;
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
    testOrganizationId = orgResult[0].id;

    // Create test proposal
    const proposalResult = await db.insert(proposalsTable)
      .values({
        user_id: testUserId,
        organization_id: testOrganizationId,
        title: 'Original Title',
        description: 'Original description',
        status: 'planning',
        current_phase: 'planning'
      })
      .returning()
      .execute();
    testProposalId = proposalResult[0].id;
  });

  it('should update proposal title', async () => {
    const input: UpdateProposalInput = {
      id: testProposalId,
      title: 'Updated Title'
    };

    const result = await updateProposal(input);

    expect(result.id).toEqual(testProposalId);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.status).toEqual('planning'); // Should remain unchanged
    expect(result.current_phase).toEqual('planning'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update proposal description', async () => {
    const input: UpdateProposalInput = {
      id: testProposalId,
      description: 'Updated description'
    };

    const result = await updateProposal(input);

    expect(result.id).toEqual(testProposalId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.status).toEqual('planning'); // Should remain unchanged
    expect(result.current_phase).toEqual('planning'); // Should remain unchanged
  });

  it('should update proposal status and current_phase', async () => {
    const input: UpdateProposalInput = {
      id: testProposalId,
      status: 'drafting',
      current_phase: 'drafting'
    };

    const result = await updateProposal(input);

    expect(result.id).toEqual(testProposalId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.status).toEqual('drafting');
    expect(result.current_phase).toEqual('drafting');
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateProposalInput = {
      id: testProposalId,
      title: 'Completely New Title',
      description: 'Completely new description',
      status: 'completed',
      current_phase: 'drafting'
    };

    const result = await updateProposal(input);

    expect(result.id).toEqual(testProposalId);
    expect(result.title).toEqual('Completely New Title');
    expect(result.description).toEqual('Completely new description');
    expect(result.status).toEqual('completed');
    expect(result.current_phase).toEqual('drafting');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    const input: UpdateProposalInput = {
      id: testProposalId,
      description: null
    };

    const result = await updateProposal(input);

    expect(result.id).toEqual(testProposalId);
    expect(result.description).toBeNull();
  });

  it('should save changes to database', async () => {
    const input: UpdateProposalInput = {
      id: testProposalId,
      title: 'Database Test Title',
      status: 'archived'
    };

    await updateProposal(input);

    // Verify changes were saved to database
    const proposals = await db.select()
      .from(proposalsTable)
      .where(eq(proposalsTable.id, testProposalId))
      .execute();

    expect(proposals).toHaveLength(1);
    expect(proposals[0].title).toEqual('Database Test Title');
    expect(proposals[0].status).toEqual('archived');
    expect(proposals[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent proposal', async () => {
    const input: UpdateProposalInput = {
      id: 99999,
      title: 'This should fail'
    };

    await expect(updateProposal(input)).rejects.toThrow(/not found/i);
  });

  it('should update only updated_at when no other fields provided', async () => {
    const originalProposal = await db.select()
      .from(proposalsTable)
      .where(eq(proposalsTable.id, testProposalId))
      .execute();

    const input: UpdateProposalInput = {
      id: testProposalId
    };

    const result = await updateProposal(input);

    expect(result.id).toEqual(testProposalId);
    expect(result.title).toEqual(originalProposal[0].title);
    expect(result.description).toEqual(originalProposal[0].description);
    expect(result.status).toEqual(originalProposal[0].status);
    expect(result.current_phase).toEqual(originalProposal[0].current_phase);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalProposal[0].updated_at).toBe(true);
  });
});
