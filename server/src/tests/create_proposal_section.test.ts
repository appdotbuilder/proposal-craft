
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, proposalsTable, proposalSectionsTable } from '../db/schema';
import { type CreateProposalSectionInput } from '../schema';
import { createProposalSection } from '../handlers/create_proposal_section';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'test@example.com',
  full_name: 'Test User'
};

const testOrganization = {
  name: 'Test Organization',
  description: 'A test organization'
};

const testProposal = {
  title: 'Test Proposal',
  description: 'A test proposal'
};

const testInput: CreateProposalSectionInput = {
  proposal_id: 1, // Will be set in beforeEach
  title: 'Executive Summary',
  content: 'This section provides an overview of the proposal.',
  order_index: 1
};

describe('createProposalSection', () => {
  beforeEach(async () => {
    await createDB();
    
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

    // Create prerequisite proposal
    const proposalResult = await db.insert(proposalsTable)
      .values({
        ...testProposal,
        user_id: userId,
        organization_id: organizationId
      })
      .returning()
      .execute();
    
    // Update test input with actual proposal ID
    testInput.proposal_id = proposalResult[0].id;
  });

  afterEach(resetDB);

  it('should create a proposal section', async () => {
    const result = await createProposalSection(testInput);

    // Basic field validation
    expect(result.proposal_id).toEqual(testInput.proposal_id);
    expect(result.title).toEqual('Executive Summary');
    expect(result.content).toEqual(testInput.content);
    expect(result.order_index).toEqual(1);
    expect(result.is_completed).toEqual(false); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save proposal section to database', async () => {
    const result = await createProposalSection(testInput);

    // Query using proper drizzle syntax
    const sections = await db.select()
      .from(proposalSectionsTable)
      .where(eq(proposalSectionsTable.id, result.id))
      .execute();

    expect(sections).toHaveLength(1);
    expect(sections[0].proposal_id).toEqual(testInput.proposal_id);
    expect(sections[0].title).toEqual('Executive Summary');
    expect(sections[0].content).toEqual(testInput.content);
    expect(sections[0].order_index).toEqual(1);
    expect(sections[0].is_completed).toEqual(false);
    expect(sections[0].created_at).toBeInstanceOf(Date);
    expect(sections[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null content', async () => {
    const inputWithNullContent: CreateProposalSectionInput = {
      ...testInput,
      content: null
    };

    const result = await createProposalSection(inputWithNullContent);

    expect(result.content).toBeNull();
    expect(result.title).toEqual('Executive Summary');
    expect(result.order_index).toEqual(1);

    // Verify in database
    const sections = await db.select()
      .from(proposalSectionsTable)
      .where(eq(proposalSectionsTable.id, result.id))
      .execute();

    expect(sections[0].content).toBeNull();
  });

  it('should create multiple sections with different order indices', async () => {
    // Create first section
    const section1 = await createProposalSection(testInput);

    // Create second section with different order
    const input2: CreateProposalSectionInput = {
      ...testInput,
      title: 'Technical Approach',
      order_index: 2
    };
    const section2 = await createProposalSection(input2);

    // Verify both sections exist with correct order
    const sections = await db.select()
      .from(proposalSectionsTable)
      .where(eq(proposalSectionsTable.proposal_id, testInput.proposal_id))
      .execute();

    expect(sections).toHaveLength(2);
    
    const sortedSections = sections.sort((a, b) => a.order_index - b.order_index);
    expect(sortedSections[0].title).toEqual('Executive Summary');
    expect(sortedSections[0].order_index).toEqual(1);
    expect(sortedSections[1].title).toEqual('Technical Approach');
    expect(sortedSections[1].order_index).toEqual(2);
  });
});
