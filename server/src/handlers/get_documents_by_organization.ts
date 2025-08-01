
import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type Document } from '../schema';
import { eq } from 'drizzle-orm';

export const getDocumentsByOrganization = async (organizationId: number): Promise<Document[]> => {
  try {
    const results = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.organization_id, organizationId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch documents by organization:', error);
    throw error;
  }
};
