
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, documentsTable } from '../db/schema';
import { getDocumentsByOrganization } from '../handlers/get_documents_by_organization';

describe('getDocumentsByOrganization', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return documents for a specific organization', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    // Create test organization
    const organization = await db.insert(organizationsTable)
      .values({
        user_id: user[0].id,
        name: 'Test Organization',
        description: 'A test organization'
      })
      .returning()
      .execute();

    // Create test documents
    const documents = await db.insert(documentsTable)
      .values([
        {
          organization_id: organization[0].id,
          filename: 'document1.pdf',
          file_path: '/uploads/document1.pdf',
          file_type: 'pdf',
          file_size: 1024,
          upload_status: 'completed'
        },
        {
          organization_id: organization[0].id,
          filename: 'document2.docx',
          file_path: '/uploads/document2.docx',
          file_type: 'docx',
          file_size: 2048,
          upload_status: 'pending'
        }
      ])
      .returning()
      .execute();

    const result = await getDocumentsByOrganization(organization[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].filename).toEqual('document1.pdf');
    expect(result[0].file_type).toEqual('pdf');
    expect(result[0].file_size).toEqual(1024);
    expect(result[0].upload_status).toEqual('completed');
    expect(result[0].organization_id).toEqual(organization[0].id);
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].filename).toEqual('document2.docx');
    expect(result[1].file_type).toEqual('docx');
    expect(result[1].file_size).toEqual(2048);
    expect(result[1].upload_status).toEqual('pending');
    expect(result[1].organization_id).toEqual(organization[0].id);
  });

  it('should return empty array for organization with no documents', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    // Create test organization without documents
    const organization = await db.insert(organizationsTable)
      .values({
        user_id: user[0].id,
        name: 'Empty Organization',
        description: 'Organization with no documents'
      })
      .returning()
      .execute();

    const result = await getDocumentsByOrganization(organization[0].id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return documents for the specified organization', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    // Create two test organizations
    const organizations = await db.insert(organizationsTable)
      .values([
        {
          user_id: user[0].id,
          name: 'Organization 1',
          description: 'First organization'
        },
        {
          user_id: user[0].id,
          name: 'Organization 2',
          description: 'Second organization'
        }
      ])
      .returning()
      .execute();

    // Create documents for both organizations
    await db.insert(documentsTable)
      .values([
        {
          organization_id: organizations[0].id,
          filename: 'org1_doc.pdf',
          file_path: '/uploads/org1_doc.pdf',
          file_type: 'pdf',
          file_size: 1024,
          upload_status: 'completed'
        },
        {
          organization_id: organizations[1].id,
          filename: 'org2_doc.docx',
          file_path: '/uploads/org2_doc.docx',
          file_type: 'docx',
          file_size: 2048,
          upload_status: 'completed'
        }
      ])
      .execute();

    const result = await getDocumentsByOrganization(organizations[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].filename).toEqual('org1_doc.pdf');
    expect(result[0].organization_id).toEqual(organizations[0].id);
  });
});
