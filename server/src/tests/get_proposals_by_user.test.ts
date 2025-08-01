
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, proposalsTable } from '../db/schema';
import { getProposalsByUser } from '../handlers/get_proposals_by_user';

describe('getProposalsByUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all proposals for a specific user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        user_id: userId,
        name: 'Test Organization',
        description: 'Test org description'
      })
      .returning()
      .execute();
    const organizationId = orgResult[0].id;

    // Create multiple proposals for the user
    await db.insert(proposalsTable)
      .values([
        {
          user_id: userId,
          organization_id: organizationId,
          title: 'First Proposal',
          description: 'First test proposal',
          status: 'planning',
          current_phase: 'planning'
        },
        {
          user_id: userId,
          organization_id: organizationId,
          title: 'Second Proposal',
          description: 'Second test proposal',
          status: 'drafting',
          current_phase: 'drafting'
        },
        {
          user_id: userId,
          organization_id: organizationId,
          title: 'Third Proposal',
          description: null,
          status: 'completed',
          current_phase: 'drafting'
        }
      ])
      .execute();

    const result = await getProposalsByUser(userId);

    expect(result).toHaveLength(3);
    
    const firstProposal = result.find(p => p.title === 'First Proposal');
    expect(firstProposal).toBeDefined();
    expect(firstProposal?.user_id).toEqual(userId);
    expect(firstProposal?.organization_id).toEqual(organizationId);
    expect(firstProposal?.description).toEqual('First test proposal');
    expect(firstProposal?.status).toEqual('planning');
    expect(firstProposal?.current_phase).toEqual('planning');
    expect(firstProposal?.id).toBeDefined();
    expect(firstProposal?.created_at).toBeInstanceOf(Date);
    expect(firstProposal?.updated_at).toBeInstanceOf(Date);

    const thirdProposal = result.find(p => p.title === 'Third Proposal');
    expect(thirdProposal).toBeDefined();
    expect(thirdProposal?.description).toBeNull();
    expect(thirdProposal?.status).toEqual('completed');
  });

  it('should return empty array when user has no proposals', async () => {
    // Create test user without any proposals
    const userResult = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const result = await getProposalsByUser(userId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return only proposals for the specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@test.com',
        full_name: 'Test User 1'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@test.com',
        full_name: 'Test User 2'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create organizations for both users
    const org1Result = await db.insert(organizationsTable)
      .values({
        user_id: user1Id,
        name: 'User 1 Organization',
        description: 'Org for user 1'
      })
      .returning()
      .execute();
    const org1Id = org1Result[0].id;

    const org2Result = await db.insert(organizationsTable)
      .values({
        user_id: user2Id,
        name: 'User 2 Organization',
        description: 'Org for user 2'
      })
      .returning()
      .execute();
    const org2Id = org2Result[0].id;

    // Create proposals for both users
    await db.insert(proposalsTable)
      .values([
        {
          user_id: user1Id,
          organization_id: org1Id,
          title: 'User 1 Proposal',
          description: 'Proposal by user 1',
          status: 'planning',
          current_phase: 'planning'
        },
        {
          user_id: user2Id,
          organization_id: org2Id,
          title: 'User 2 Proposal',
          description: 'Proposal by user 2',
          status: 'drafting',
          current_phase: 'drafting'
        }
      ])
      .execute();

    const user1Proposals = await getProposalsByUser(user1Id);
    const user2Proposals = await getProposalsByUser(user2Id);

    expect(user1Proposals).toHaveLength(1);
    expect(user1Proposals[0].title).toEqual('User 1 Proposal');
    expect(user1Proposals[0].user_id).toEqual(user1Id);

    expect(user2Proposals).toHaveLength(1);
    expect(user2Proposals[0].title).toEqual('User 2 Proposal');
    expect(user2Proposals[0].user_id).toEqual(user2Id);
  });

  it('should handle non-existent user gracefully', async () => {
    const nonExistentUserId = 99999;

    const result = await getProposalsByUser(nonExistentUserId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
