
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { documentsTable, usersTable, organizationsTable } from '../db/schema';
import { type UploadDocumentInput } from '../schema';
import { uploadDocument } from '../handlers/upload_document';
import { eq } from 'drizzle-orm';

describe('uploadDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testOrganizationId: number;

  beforeEach(async () => {
    // Create prerequisite user and organization for testing
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    const organizationResult = await db.insert(organizationsTable)
      .values({
        user_id: userResult[0].id,
        name: 'Test Organization',
        description: 'A test organization'
      })
      .returning()
      .execute();

    testOrganizationId = organizationResult[0].id;
  });

  const testInput: UploadDocumentInput = {
    organization_id: 0, // Will be set in each test
    filename: 'test-document.pdf',
    file_type: 'pdf',
    file_size: 1024000
  };

  it('should upload a document', async () => {
    const input = { ...testInput, organization_id: testOrganizationId };
    const result = await uploadDocument(input);

    // Basic field validation
    expect(result.organization_id).toEqual(testOrganizationId);
    expect(result.filename).toEqual('test-document.pdf');
    expect(result.file_type).toEqual('pdf');
    expect(result.file_size).toEqual(1024000);
    expect(result.upload_status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.file_path).toEqual(`/uploads/org_${testOrganizationId}/test-document.pdf`);
  });

  it('should save document to database', async () => {
    const input = { ...testInput, organization_id: testOrganizationId };
    const result = await uploadDocument(input);

    // Query database to verify document was saved
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, result.id))
      .execute();

    expect(documents).toHaveLength(1);
    expect(documents[0].organization_id).toEqual(testOrganizationId);
    expect(documents[0].filename).toEqual('test-document.pdf');
    expect(documents[0].file_type).toEqual('pdf');
    expect(documents[0].file_size).toEqual(1024000);
    expect(documents[0].upload_status).toEqual('pending');
    expect(documents[0].created_at).toBeInstanceOf(Date);
    expect(documents[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different file types', async () => {
    const docxInput = { 
      ...testInput, 
      organization_id: testOrganizationId,
      filename: 'test-document.docx',
      file_type: 'docx' as const
    };
    
    const result = await uploadDocument(docxInput);

    expect(result.file_type).toEqual('docx');
    expect(result.filename).toEqual('test-document.docx');
    expect(result.file_path).toEqual(`/uploads/org_${testOrganizationId}/test-document.docx`);
  });

  it('should throw error for non-existent organization', async () => {
    const input = { ...testInput, organization_id: 99999 };

    await expect(uploadDocument(input)).rejects.toThrow(/organization.*not found/i);
  });

  it('should generate unique file paths for same organization', async () => {
    const input1 = { ...testInput, organization_id: testOrganizationId, filename: 'doc1.pdf' };
    const input2 = { ...testInput, organization_id: testOrganizationId, filename: 'doc2.pdf' };

    const result1 = await uploadDocument(input1);
    const result2 = await uploadDocument(input2);

    expect(result1.file_path).toEqual(`/uploads/org_${testOrganizationId}/doc1.pdf`);
    expect(result2.file_path).toEqual(`/uploads/org_${testOrganizationId}/doc2.pdf`);
    expect(result1.file_path).not.toEqual(result2.file_path);
  });
});
