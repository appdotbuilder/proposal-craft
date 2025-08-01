
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, proposalsTable, proposalSectionsTable } from '../db/schema';
import { type UpdateProposalSectionInput } from '../schema';
import { updateProposalSection } from '../handlers/update_proposal_section';
import { eq } from 'drizzle-orm';

describe('updateProposalSection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testOrganizationId: number;
  let testProposalId: number;
  let testSectionId: number;

  beforeEach(async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        user_id: testUserId,
        name: 'Test Organization',
        description: 'A test organization'
      })
      .returning()
      .execute();
    testOrganizationId = orgResult[0].id;

    // Create proposal
    const proposalResult = await db.insert(proposalsTable)
      .values({
        user_id: testUserId,
        organization_id: testOrganizationId,
        title: 'Test Proposal',
        description: 'A test proposal'
      })
      .returning()
      .execute();
    testProposalId = proposalResult[0].id;

    // Create proposal section
    const sectionResult = await db.insert(proposalSectionsTable)
      .values({
        proposal_id: testProposalId,
        title: 'Original Title',
        content: 'Original content',
        order_index: 1,
        is_completed: false
      })
      .returning()
      .execute();
    testSectionId = sectionResult[0].id;
  });

  it('should update section title', async () => {
    const input: UpdateProposalSectionInput = {
      id: testSectionId,
      title: 'Updated Title'
    };

    const result = await updateProposalSection(input);

    expect(result.id).toEqual(testSectionId);
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Original content');
    expect(result.order_index).toEqual(1);
    expect(result.is_completed).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update section content', async () => {
    const input: UpdateProposalSectionInput = {
      id: testSectionId,
      content: 'Updated content with new information'
    };

    const result = await updateProposalSection(input);

    expect(result.id).toEqual(testSectionId);
    expect(result.title).toEqual('Original Title');
    expect(result.content).toEqual('Updated content with new information');
    expect(result.order_index).toEqual(1);
    expect(result.is_completed).toEqual(false);
  });

  it('should update completion status', async () => {
    const input: UpdateProposalSectionInput = {
      id: testSectionId,
      is_completed: true
    };

    const result = await updateProposalSection(input);

    expect(result.id).toEqual(testSectionId);
    expect(result.title).toEqual('Original Title');
    expect(result.content).toEqual('Original content');
    expect(result.order_index).toEqual(1);
    expect(result.is_completed).toEqual(true);
  });

  it('should update order index', async () => {
    const input: UpdateProposalSectionInput = {
      id: testSectionId,
      order_index: 5
    };

    const result = await updateProposalSection(input);

    expect(result.id).toEqual(testSectionId);
    expect(result.title).toEqual('Original Title');
    expect(result.content).toEqual('Original content');
    expect(result.order_index).toEqual(5);
    expect(result.is_completed).toEqual(false);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateProposalSectionInput = {
      id: testSectionId,
      title: 'Multi-Update Title',
      content: 'Multi-update content',
      order_index: 3,
      is_completed: true
    };

    const result = await updateProposalSection(input);

    expect(result.id).toEqual(testSectionId);
    expect(result.title).toEqual('Multi-Update Title');
    expect(result.content).toEqual('Multi-update content');
    expect(result.order_index).toEqual(3);
    expect(result.is_completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update section content to null', async () => {
    const input: UpdateProposalSectionInput = {
      id: testSectionId,
      content: null
    };

    const result = await updateProposalSection(input);

    expect(result.id).toEqual(testSectionId);
    expect(result.title).toEqual('Original Title');
    expect(result.content).toBeNull();
    expect(result.order_index).toEqual(1);
    expect(result.is_completed).toEqual(false);
  });

  it('should save changes to database', async () => {
    const input: UpdateProposalSectionInput = {
      id: testSectionId,
      title: 'Database Update Test',
      is_completed: true
    };

    await updateProposalSection(input);

    // Verify changes were saved to database
    const sections = await db.select()
      .from(proposalSectionsTable)
      .where(eq(proposalSectionsTable.id, testSectionId))
      .execute();

    expect(sections).toHaveLength(1);
    expect(sections[0].title).toEqual('Database Update Test');
    expect(sections[0].is_completed).toEqual(true);
    expect(sections[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent section', async () => {
    const input: UpdateProposalSectionInput = {
      id: 99999,
      title: 'Non-existent Section'
    };

    expect(updateProposalSection(input)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const originalSection = await db.select()
      .from(proposalSectionsTable)
      .where(eq(proposalSectionsTable.id, testSectionId))
      .execute();

    const originalUpdatedAt = originalSection[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateProposalSectionInput = {
      id: testSectionId,
      title: 'Timestamp Test'
    };

    const result = await updateProposalSection(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
