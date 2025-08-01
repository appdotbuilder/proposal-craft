
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable } from '../db/schema';
import { getOrganizationsByUser } from '../handlers/get_organizations_by_user';

describe('getOrganizationsByUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return organizations for a specific user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test organizations for this user
    await db.insert(organizationsTable)
      .values([
        {
          user_id: userId,
          name: 'Organization 1',
          description: 'First organization'
        },
        {
          user_id: userId,
          name: 'Organization 2',
          description: 'Second organization'
        }
      ])
      .execute();

    const result = await getOrganizationsByUser(userId);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Organization 1');
    expect(result[0].description).toEqual('First organization');
    expect(result[0].user_id).toEqual(userId);
    expect(result[1].name).toEqual('Organization 2');
    expect(result[1].description).toEqual('Second organization');
    expect(result[1].user_id).toEqual(userId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when user has no organizations', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    const result = await getOrganizationsByUser(userId);

    expect(result).toHaveLength(0);
  });

  it('should only return organizations for the specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        full_name: 'User One'
      })
      .returning()
      .execute();
    
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        full_name: 'User Two'
      })
      .returning()
      .execute();
    
    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create organizations for both users
    await db.insert(organizationsTable)
      .values([
        {
          user_id: user1Id,
          name: 'User 1 Org',
          description: 'Organization for user 1'
        },
        {
          user_id: user2Id,
          name: 'User 2 Org',
          description: 'Organization for user 2'
        }
      ])
      .execute();

    const result = await getOrganizationsByUser(user1Id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('User 1 Org');
    expect(result[0].user_id).toEqual(user1Id);
  });
});
