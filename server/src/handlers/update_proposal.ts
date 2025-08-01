
import { db } from '../db';
import { proposalsTable } from '../db/schema';
import { type UpdateProposalInput, type Proposal } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProposal = async (input: UpdateProposalInput): Promise<Proposal> => {
  try {
    // Build the update object dynamically, only including provided fields
    const updateData: Partial<{
      title: string;
      description: string | null;
      status: 'planning' | 'drafting' | 'completed' | 'archived';
      current_phase: 'planning' | 'drafting';
      updated_at: Date;
    }> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.current_phase !== undefined) {
      updateData.current_phase = input.current_phase;
    }

    // Update the proposal
    const result = await db.update(proposalsTable)
      .set(updateData)
      .where(eq(proposalsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Proposal with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Proposal update failed:', error);
    throw error;
  }
};
