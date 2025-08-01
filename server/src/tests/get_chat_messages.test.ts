
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, proposalsTable, chatMessagesTable } from '../db/schema';
import { getChatMessages } from '../handlers/get_chat_messages';

describe('getChatMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return chat messages for a proposal ordered by creation time', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const organization = await db.insert(organizationsTable)
      .values({
        user_id: user.id,
        name: 'Test Organization',
        description: 'Test description'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const proposal = await db.insert(proposalsTable)
      .values({
        user_id: user.id,
        organization_id: organization.id,
        title: 'Test Proposal',
        description: 'Test description'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    // Create multiple chat messages with slight delay to ensure different timestamps
    const message1 = await db.insert(chatMessagesTable)
      .values({
        proposal_id: proposal.id,
        role: 'user',
        content: 'First message',
        message_type: 'chat'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const message2 = await db.insert(chatMessagesTable)
      .values({
        proposal_id: proposal.id,
        role: 'assistant',
        content: 'Second message',
        message_type: 'planning'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    await new Promise(resolve => setTimeout(resolve, 10));

    const message3 = await db.insert(chatMessagesTable)
      .values({
        proposal_id: proposal.id,
        role: 'user',
        content: 'Third message',
        message_type: 'feedback'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const result = await getChatMessages(proposal.id);

    // Verify all messages are returned
    expect(result).toHaveLength(3);

    // Verify ordering by creation time (oldest first)
    expect(result[0].id).toBe(message1.id);
    expect(result[1].id).toBe(message2.id);
    expect(result[2].id).toBe(message3.id);

    // Verify content and fields
    expect(result[0].content).toBe('First message');
    expect(result[0].role).toBe('user');
    expect(result[0].message_type).toBe('chat');
    expect(result[0].proposal_id).toBe(proposal.id);
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].content).toBe('Second message');
    expect(result[1].role).toBe('assistant');
    expect(result[1].message_type).toBe('planning');

    expect(result[2].content).toBe('Third message');
    expect(result[2].role).toBe('user');
    expect(result[2].message_type).toBe('feedback');
  });

  it('should return empty array for proposal with no messages', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const organization = await db.insert(organizationsTable)
      .values({
        user_id: user.id,
        name: 'Test Organization',
        description: 'Test description'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const proposal = await db.insert(proposalsTable)
      .values({
        user_id: user.id,
        organization_id: organization.id,
        title: 'Test Proposal',
        description: 'Test description'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const result = await getChatMessages(proposal.id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return messages for specified proposal', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const organization = await db.insert(organizationsTable)
      .values({
        user_id: user.id,
        name: 'Test Organization',
        description: 'Test description'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    // Create two proposals
    const proposal1 = await db.insert(proposalsTable)
      .values({
        user_id: user.id,
        organization_id: organization.id,
        title: 'First Proposal',
        description: 'First description'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const proposal2 = await db.insert(proposalsTable)
      .values({
        user_id: user.id,
        organization_id: organization.id,
        title: 'Second Proposal',
        description: 'Second description'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    // Create messages for both proposals
    await db.insert(chatMessagesTable)
      .values({
        proposal_id: proposal1.id,
        role: 'user',
        content: 'Message for proposal 1',
        message_type: 'chat'
      })
      .execute();

    await db.insert(chatMessagesTable)
      .values({
        proposal_id: proposal2.id,
        role: 'user',
        content: 'Message for proposal 2',
        message_type: 'chat'
      })
      .execute();

    // Test that only messages for proposal1 are returned
    const result = await getChatMessages(proposal1.id);

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Message for proposal 1');
    expect(result[0].proposal_id).toBe(proposal1.id);
  });

  it('should handle all message types and roles correctly', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const organization = await db.insert(organizationsTable)
      .values({
        user_id: user.id,
        name: 'Test Organization',
        description: 'Test description'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const proposal = await db.insert(proposalsTable)
      .values({
        user_id: user.id,
        organization_id: organization.id,
        title: 'Test Proposal',
        description: 'Test description'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    // Create messages with different types and roles
    const testMessages = [
      { role: 'user' as const, message_type: 'chat' as const, content: 'User chat' },
      { role: 'assistant' as const, message_type: 'chat' as const, content: 'Assistant chat' },
      { role: 'user' as const, message_type: 'planning' as const, content: 'User planning' },
      { role: 'assistant' as const, message_type: 'planning' as const, content: 'Assistant planning' },
      { role: 'user' as const, message_type: 'feedback' as const, content: 'User feedback' },
      { role: 'assistant' as const, message_type: 'feedback' as const, content: 'Assistant feedback' }
    ];

    for (const msg of testMessages) {
      await db.insert(chatMessagesTable)
        .values({
          proposal_id: proposal.id,
          role: msg.role,
          content: msg.content,
          message_type: msg.message_type
        })
        .execute();
      
      // Small delay to ensure proper ordering
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    const result = await getChatMessages(proposal.id);

    expect(result).toHaveLength(6);

    // Verify all message types and roles were handled correctly
    testMessages.forEach((expected, index) => {
      expect(result[index].role).toBe(expected.role);
      expect(result[index].message_type).toBe(expected.message_type);
      expect(result[index].content).toBe(expected.content);
    });
  });
});
