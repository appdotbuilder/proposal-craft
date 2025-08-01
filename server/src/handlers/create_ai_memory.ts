
import { db } from '../db';
import { aiMemoryTable } from '../db/schema';
import { type CreateAiMemoryInput, type AiMemory } from '../schema';

export const createAiMemory = async (input: CreateAiMemoryInput): Promise<AiMemory> => {
  try {
    // Insert AI memory record
    const result = await db.insert(aiMemoryTable)
      .values({
        proposal_id: input.proposal_id,
        memory_type: input.memory_type,
        content: input.content,
        source: input.source
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('AI memory creation failed:', error);
    throw error;
  }
};
