
import { db } from '../db';
import { proposalsTable, usersTable, organizationsTable } from '../db/schema';
import { type CreateProposalInput, type Proposal } from '../schema';
import { eq } from 'drizzle-orm';

export const createProposal = async (input: CreateProposalInput): Promise<Proposal> => {
  try {
    // Verify user exists
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Verify organization exists
    const organizationExists = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, input.organization_id))
      .execute();

    if (organizationExists.length === 0) {
      throw new Error(`Organization with id ${input.organization_id} not found`);
    }

    // Insert proposal record
    const result = await db.insert(proposalsTable)
      .values({
        user_id: input.user_id,
        organization_id: input.organization_id,
        title: input.title,
        description: input.description,
        // status and current_phase will use their default values ('planning')
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Proposal creation failed:', error);
    throw error;
  }
};
