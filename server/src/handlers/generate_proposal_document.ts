
import { db } from '../db';
import { proposalsTable, proposalSectionsTable } from '../db/schema';
import { type ProposalSection } from '../schema';
import { eq, and, asc } from 'drizzle-orm';

interface ProposalDocument {
    title: string;
    sections: ProposalSection[];
    generatedAt: Date;
    wordCount: number;
}

export async function generateProposalDocument(proposalId: number): Promise<ProposalDocument> {
    try {
        // Get the proposal title
        const proposal = await db.select()
            .from(proposalsTable)
            .where(eq(proposalsTable.id, proposalId))
            .execute();

        if (proposal.length === 0) {
            throw new Error(`Proposal with id ${proposalId} not found`);
        }

        // Get all completed sections for the proposal, ordered by order_index
        const sectionsResult = await db.select()
            .from(proposalSectionsTable)
            .where(
                and(
                    eq(proposalSectionsTable.proposal_id, proposalId),
                    eq(proposalSectionsTable.is_completed, true)
                )
            )
            .orderBy(asc(proposalSectionsTable.order_index))
            .execute();

        // Convert to ProposalSection type (no numeric conversions needed for these fields)
        const sections: ProposalSection[] = sectionsResult.map(section => ({
            ...section
        }));

        // Calculate word count from all section content
        const wordCount = sections.reduce((total, section) => {
            if (!section.content) return total;
            // Simple word count: split by whitespace and filter out empty strings
            const words = section.content.trim().split(/\s+/).filter(word => word.length > 0);
            return total + words.length;
        }, 0);

        return {
            title: proposal[0].title,
            sections,
            generatedAt: new Date(),
            wordCount
        };
    } catch (error) {
        console.error('Generate proposal document failed:', error);
        throw error;
    }
}
