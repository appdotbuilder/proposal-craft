
import { db } from '../db';
import { proposalSectionsTable } from '../db/schema';
import { type CreateProposalSectionInput, type ProposalSection } from '../schema';

export const createProposalSection = async (input: CreateProposalSectionInput): Promise<ProposalSection> => {
  try {
    // Insert proposal section record
    const result = await db.insert(proposalSectionsTable)
      .values({
        proposal_id: input.proposal_id,
        title: input.title,
        content: input.content,
        order_index: input.order_index
      })
      .returning()
      .execute();

    const section = result[0];
    return section;
  } catch (error) {
    console.error('Proposal section creation failed:', error);
    throw error;
  }
};
