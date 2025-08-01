
import { db } from '../db';
import { organizationsTable } from '../db/schema';
import { type Organization } from '../schema';
import { eq } from 'drizzle-orm';

export const getOrganizationsByUser = async (userId: number): Promise<Organization[]> => {
  try {
    const results = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.user_id, userId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get organizations by user:', error);
    throw error;
  }
};
