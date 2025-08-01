
import { db } from '../db';
import { chatMessagesTable } from '../db/schema';
import { type ChatMessage } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getChatMessages(proposalId: number): Promise<ChatMessage[]> {
  try {
    const results = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.proposal_id, proposalId))
      .orderBy(asc(chatMessagesTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch chat messages:', error);
    throw error;
  }
}
