
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, proposalsTable } from '../db/schema';
import { type CreateUserInput, type CreateOrganizationInput, type CreateProposalInput } from '../schema';
import { getProposalById } from '../handlers/get_proposal_by_id';

const testUser: CreateUserInput = {
  email: 'test@example.com',
  full_name: 'Test User'
};

const testOrganization: CreateOrganizationInput = {
  user_id: 1, // Will be set after user creation
  name: 'Test Organization',
  description: 'A test organization'
};

const testProposal: CreateProposalInput = {
  user_id: 1, // Will be set after user creation
  organization_id: 1, // Will be set after organization creation
  title: 'Test Proposal',
  description: 'A test proposal'
};

describe('getProposalById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return proposal when found', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        ...testOrganization,
        user_id: userId
      })
      .returning()
      .execute();
    const organizationId = orgResult[0].id;

    // Create test proposal
    const proposalResult = await db.insert(proposalsTable)
      .values({
        ...testProposal,
        user_id: userId,
        organization_id: organizationId
      })
      .returning()
      .execute();
    const proposalId = proposalResult[0].id;

    const result = await getProposalById(proposalId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(proposalId);
    expect(result!.title).toEqual('Test Proposal');
    expect(result!.description).toEqual('A test proposal');
    expect(result!.user_id).toEqual(userId);
    expect(result!.organization_id).toEqual(organizationId);
    expect(result!.status).toEqual('planning');
    expect(result!.current_phase).toEqual('planning');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when proposal not found', async () => {
    const result = await getProposalById(999);

    expect(result).toBeNull();
  });

  it('should handle proposal with null description', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        ...testOrganization,
        user_id: userId
      })
      .returning()
      .execute();
    const organizationId = orgResult[0].id;

    // Create proposal with null description
    const proposalResult = await db.insert(proposalsTable)
      .values({
        user_id: userId,
        organization_id: organizationId,
        title: 'Proposal Without Description',
        description: null
      })
      .returning()
      .execute();
    const proposalId = proposalResult[0].id;

    const result = await getProposalById(proposalId);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Proposal Without Description');
    expect(result!.description).toBeNull();
  });
});
