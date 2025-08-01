
import { db } from '../db';
import { proposalSectionsTable } from '../db/schema';
import { type UpdateProposalSectionInput, type ProposalSection } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProposalSection = async (input: UpdateProposalSectionInput): Promise<ProposalSection> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof proposalSectionsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    if (input.order_index !== undefined) {
      updateData.order_index = input.order_index;
    }

    if (input.is_completed !== undefined) {
      updateData.is_completed = input.is_completed;
    }

    // Update the proposal section
    const result = await db.update(proposalSectionsTable)
      .set(updateData)
      .where(eq(proposalSectionsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Proposal section with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Proposal section update failed:', error);
    throw error;
  }
};
