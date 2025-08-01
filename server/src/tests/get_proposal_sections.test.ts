
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, proposalsTable, proposalSectionsTable } from '../db/schema';
import { getProposalSections } from '../handlers/get_proposal_sections';

describe('getProposalSections', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return sections ordered by order_index', async () => {
    // Create prerequisite data
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
        description: 'Test description'
      })
      .returning()
      .execute();

    const proposal = await db.insert(proposalsTable)
      .values({
        user_id: user[0].id,
        organization_id: organization[0].id,
        title: 'Test Proposal',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create sections with different order_index values
    await db.insert(proposalSectionsTable)
      .values([
        {
          proposal_id: proposal[0].id,
          title: 'Third Section',
          content: 'Third content',
          order_index: 3
        },
        {
          proposal_id: proposal[0].id,
          title: 'First Section',
          content: 'First content',
          order_index: 1
        },
        {
          proposal_id: proposal[0].id,
          title: 'Second Section',
          content: 'Second content',
          order_index: 2
        }
      ])
      .execute();

    const result = await getProposalSections(proposal[0].id);

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('First Section');
    expect(result[0].order_index).toEqual(1);
    expect(result[1].title).toEqual('Second Section');
    expect(result[1].order_index).toEqual(2);
    expect(result[2].title).toEqual('Third Section');
    expect(result[2].order_index).toEqual(3);
  });

  it('should return empty array for proposal with no sections', async () => {
    // Create prerequisite data
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
        description: 'Test description'
      })
      .returning()
      .execute();

    const proposal = await db.insert(proposalsTable)
      .values({
        user_id: user[0].id,
        organization_id: organization[0].id,
        title: 'Test Proposal',
        description: 'Test description'
      })
      .returning()
      .execute();

    const result = await getProposalSections(proposal[0].id);

    expect(result).toHaveLength(0);
  });

  it('should only return sections for the specified proposal', async () => {
    // Create prerequisite data
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
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create two proposals
    const proposals = await db.insert(proposalsTable)
      .values([
        {
          user_id: user[0].id,
          organization_id: organization[0].id,
          title: 'First Proposal',
          description: 'First description'
        },
        {
          user_id: user[0].id,
          organization_id: organization[0].id,
          title: 'Second Proposal',
          description: 'Second description'
        }
      ])
      .returning()
      .execute();

    // Create sections for both proposals
    await db.insert(proposalSectionsTable)
      .values([
        {
          proposal_id: proposals[0].id,
          title: 'First Proposal Section',
          content: 'First proposal content',
          order_index: 1
        },
        {
          proposal_id: proposals[1].id,
          title: 'Second Proposal Section',
          content: 'Second proposal content',
          order_index: 1
        }
      ])
      .execute();

    const result = await getProposalSections(proposals[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('First Proposal Section');
    expect(result[0].proposal_id).toEqual(proposals[0].id);
  });

  it('should include all required fields', async () => {
    // Create prerequisite data
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
        description: 'Test description'
      })
      .returning()
      .execute();

    const proposal = await db.insert(proposalsTable)
      .values({
        user_id: user[0].id,
        organization_id: organization[0].id,
        title: 'Test Proposal',
        description: 'Test description'
      })
      .returning()
      .execute();

    await db.insert(proposalSectionsTable)
      .values({
        proposal_id: proposal[0].id,
        title: 'Test Section',
        content: 'Test content',
        order_index: 1
      })
      .execute();

    const result = await getProposalSections(proposal[0].id);

    expect(result).toHaveLength(1);
    const section = result[0];
    expect(section.id).toBeDefined();
    expect(section.proposal_id).toEqual(proposal[0].id);
    expect(section.title).toEqual('Test Section');
    expect(section.content).toEqual('Test content');
    expect(section.order_index).toEqual(1);
    expect(section.is_completed).toEqual(false);
    expect(section.created_at).toBeInstanceOf(Date);
    expect(section.updated_at).toBeInstanceOf(Date);
  });
});
