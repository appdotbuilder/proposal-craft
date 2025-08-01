
import { db } from '../db';
import { documentsTable, organizationsTable } from '../db/schema';
import { type UploadDocumentInput, type Document } from '../schema';
import { eq } from 'drizzle-orm';

export const uploadDocument = async (input: UploadDocumentInput): Promise<Document> => {
  try {
    // Verify organization exists to prevent foreign key constraint violations
    const organization = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, input.organization_id))
      .execute();

    if (organization.length === 0) {
      throw new Error(`Organization with id ${input.organization_id} not found`);
    }

    // Generate file path based on organization and filename
    const filePath = `/uploads/org_${input.organization_id}/${input.filename}`;

    // Insert document record
    const result = await db.insert(documentsTable)
      .values({
        organization_id: input.organization_id,
        filename: input.filename,
        file_path: filePath,
        file_type: input.file_type,
        file_size: input.file_size,
        upload_status: 'pending' // Default status for new uploads
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Document upload failed:', error);
    throw error;
  }
};
