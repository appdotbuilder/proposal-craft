
import { db } from '../db';
import { proposalsTable } from '../db/schema';
import { type Proposal } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProposalsByUser(userId: number): Promise<Proposal[]> {
  try {
    const results = await db.select()
      .from(proposalsTable)
      .where(eq(proposalsTable.user_id, userId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch proposals for user:', error);
    throw error;
  }
}
