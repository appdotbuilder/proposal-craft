
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable } from '../db/schema';
import { type CreateOrganizationInput } from '../schema';
import { createOrganization } from '../handlers/create_organization';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateOrganizationInput = {
  user_id: 1,
  name: 'Test Organization',
  description: 'An organization for testing'
};

describe('createOrganization', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an organization', async () => {
    // First create a user that the organization will belong to
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    const result = await createOrganization(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Organization');
    expect(result.description).toEqual('An organization for testing');
    expect(result.user_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save organization to database', async () => {
    // First create a user that the organization will belong to
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    const result = await createOrganization(testInput);

    // Query using proper drizzle syntax
    const organizations = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, result.id))
      .execute();

    expect(organizations).toHaveLength(1);
    expect(organizations[0].name).toEqual('Test Organization');
    expect(organizations[0].description).toEqual('An organization for testing');
    expect(organizations[0].user_id).toEqual(1);
    expect(organizations[0].created_at).toBeInstanceOf(Date);
    expect(organizations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create organization with null description', async () => {
    // First create a user that the organization will belong to
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    const inputWithNullDescription: CreateOrganizationInput = {
      user_id: 1,
      name: 'Test Organization',
      description: null
    };

    const result = await createOrganization(inputWithNullDescription);

    expect(result.name).toEqual('Test Organization');
    expect(result.description).toBeNull();
    expect(result.user_id).toEqual(1);
    expect(result.id).toBeDefined();
  });

  it('should fail when user does not exist', async () => {
    // Don't create a user first - this should cause a foreign key constraint violation
    const inputWithNonExistentUser: CreateOrganizationInput = {
      user_id: 999,
      name: 'Test Organization',
      description: 'This should fail'
    };

    await expect(createOrganization(inputWithNonExistentUser))
      .rejects
      .toThrow(/violates foreign key constraint/i);
  });
});
