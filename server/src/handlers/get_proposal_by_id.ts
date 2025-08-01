
import { db } from '../db';
import { proposalsTable } from '../db/schema';
import { type Proposal } from '../schema';
import { eq } from 'drizzle-orm';

export const getProposalById = async (proposalId: number): Promise<Proposal | null> => {
  try {
    const results = await db.select()
      .from(proposalsTable)
      .where(eq(proposalsTable.id, proposalId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Failed to get proposal by ID:', error);
    throw error;
  }
};
