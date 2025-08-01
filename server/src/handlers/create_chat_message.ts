
import { db } from '../db';
import { chatMessagesTable } from '../db/schema';
import { type CreateChatMessageInput, type ChatMessage } from '../schema';

export const createChatMessage = async (input: CreateChatMessageInput): Promise<ChatMessage> => {
  try {
    // Insert chat message record
    const result = await db.insert(chatMessagesTable)
      .values({
        proposal_id: input.proposal_id,
        role: input.role,
        content: input.content,
        message_type: input.message_type
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Chat message creation failed:', error);
    throw error;
  }
};
