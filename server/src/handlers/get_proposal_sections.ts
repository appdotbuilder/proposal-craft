
import { db } from '../db';
import { proposalSectionsTable } from '../db/schema';
import { type ProposalSection } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getProposalSections = async (proposalId: number): Promise<ProposalSection[]> => {
  try {
    const result = await db.select()
      .from(proposalSectionsTable)
      .where(eq(proposalSectionsTable.proposal_id, proposalId))
      .orderBy(asc(proposalSectionsTable.order_index))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to get proposal sections:', error);
    throw error;
  }
};
