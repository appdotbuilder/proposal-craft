
import { db } from '../db';
import { aiMemoryTable } from '../db/schema';
import { type AiMemory } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getAiMemory(proposalId: number): Promise<AiMemory[]> {
  try {
    const results = await db.select()
      .from(aiMemoryTable)
      .where(eq(aiMemoryTable.proposal_id, proposalId))
      .orderBy(desc(aiMemoryTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch AI memory:', error);
    throw error;
  }
}
