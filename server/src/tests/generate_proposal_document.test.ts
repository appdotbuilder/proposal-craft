
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, proposalsTable, proposalSectionsTable } from '../db/schema';
import { generateProposalDocument } from '../handlers/generate_proposal_document';

describe('generateProposalDocument', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should generate document with completed sections', async () => {
        // Create test data
        const user = await db.insert(usersTable)
            .values({
                email: 'test@example.com',
                full_name: 'Test User'
            })
            .returning()
            .execute();

        const organization = await db.insert(organizationsTable)
            .values({
                user_id: user[0].id,
                name: 'Test Org',
                description: 'Test Organization'
            })
            .returning()
            .execute();

        const proposal = await db.insert(proposalsTable)
            .values({
                user_id: user[0].id,
                organization_id: organization[0].id,
                title: 'Test Proposal',
                description: 'A test proposal'
            })
            .returning()
            .execute();

        // Create completed sections
        await db.insert(proposalSectionsTable)
            .values([
                {
                    proposal_id: proposal[0].id,
                    title: 'Introduction',
                    content: 'This is the introduction section with some content.',
                    order_index: 1,
                    is_completed: true
                },
                {
                    proposal_id: proposal[0].id,
                    title: 'Background',
                    content: 'Background information goes here with more words.',
                    order_index: 2,
                    is_completed: true
                },
                {
                    proposal_id: proposal[0].id,
                    title: 'Incomplete Section',
                    content: 'This section is not completed.',
                    order_index: 3,
                    is_completed: false
                }
            ])
            .execute();

        const result = await generateProposalDocument(proposal[0].id);

        // Verify basic structure
        expect(result.title).toEqual('Test Proposal');
        expect(result.sections).toHaveLength(2); // Only completed sections
        expect(result.generatedAt).toBeInstanceOf(Date);
        expect(result.wordCount).toBeGreaterThan(0);

        // Verify sections are ordered correctly
        expect(result.sections[0].title).toEqual('Introduction');
        expect(result.sections[0].order_index).toEqual(1);
        expect(result.sections[1].title).toEqual('Background');
        expect(result.sections[1].order_index).toEqual(2);

        // Verify word count calculation
        const expectedWordCount = 'This is the introduction section with some content.'.split(/\s+/).length +
                                 'Background information goes here with more words.'.split(/\s+/).length;
        expect(result.wordCount).toEqual(expectedWordCount);
    });

    it('should handle proposal with no completed sections', async () => {
        // Create test data
        const user = await db.insert(usersTable)
            .values({
                email: 'test@example.com',
                full_name: 'Test User'
            })
            .returning()
            .execute();

        const organization = await db.insert(organizationsTable)
            .values({
                user_id: user[0].id,
                name: 'Test Org',
                description: 'Test Organization'
            })
            .returning()
            .execute();

        const proposal = await db.insert(proposalsTable)
            .values({
                user_id: user[0].id,
                organization_id: organization[0].id,
                title: 'Empty Proposal',
                description: 'A proposal with no completed sections'
            })
            .returning()
            .execute();

        // Create only incomplete sections
        await db.insert(proposalSectionsTable)
            .values([
                {
                    proposal_id: proposal[0].id,
                    title: 'Draft Section',
                    content: 'Not ready yet.',
                    order_index: 1,
                    is_completed: false
                }
            ])
            .execute();

        const result = await generateProposalDocument(proposal[0].id);

        expect(result.title).toEqual('Empty Proposal');
        expect(result.sections).toHaveLength(0);
        expect(result.wordCount).toEqual(0);
        expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should handle sections with null content', async () => {
        // Create test data
        const user = await db.insert(usersTable)
            .values({
                email: 'test@example.com',
                full_name: 'Test User'
            })
            .returning()
            .execute();

        const organization = await db.insert(organizationsTable)
            .values({
                user_id: user[0].id,
                name: 'Test Org',
                description: 'Test Organization'
            })
            .returning()
            .execute();

        const proposal = await db.insert(proposalsTable)
            .values({
                user_id: user[0].id,
                organization_id: organization[0].id,
                title: 'Test Proposal',
                description: 'A test proposal'
            })
            .returning()
            .execute();

        // Create section with null content
        await db.insert(proposalSectionsTable)
            .values([
                {
                    proposal_id: proposal[0].id,
                    title: 'Empty Content Section',
                    content: null,
                    order_index: 1,
                    is_completed: true
                },
                {
                    proposal_id: proposal[0].id,
                    title: 'With Content',
                    content: 'This has actual content.',
                    order_index: 2,
                    is_completed: true
                }
            ])
            .execute();

        const result = await generateProposalDocument(proposal[0].id);

        expect(result.sections).toHaveLength(2);
        expect(result.wordCount).toEqual(4); // Only count words from section with content
    });

    it('should throw error for non-existent proposal', async () => {
        await expect(generateProposalDocument(999)).rejects.toThrow(/not found/i);
    });
});
