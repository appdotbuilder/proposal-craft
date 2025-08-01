
import { db } from '../db';
import { chatMessagesTable, aiMemoryTable, proposalsTable, organizationsTable, documentsTable } from '../db/schema';
import { type CreateChatMessageInput, type ChatMessage } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function processAiChat(input: CreateChatMessageInput): Promise<ChatMessage> {
  try {
    // Save user message first
    const userMessageResult = await db.insert(chatMessagesTable)
      .values({
        proposal_id: input.proposal_id,
        role: input.role,
        content: input.content,
        message_type: input.message_type
      })
      .returning()
      .execute();

    // Get context for AI response generation
    const context = await gatherContext(input.proposal_id);
    
    // Generate AI response based on message type and context
    const aiContent = generateAiResponse(input.content, input.message_type, context);
    
    // Save AI response
    const aiMessageResult = await db.insert(chatMessagesTable)
      .values({
        proposal_id: input.proposal_id,
        role: 'assistant',
        content: aiContent,
        message_type: input.message_type
      })
      .returning()
      .execute();

    return aiMessageResult[0];
  } catch (error) {
    console.error('AI chat processing failed:', error);
    throw error;
  }
}

async function gatherContext(proposalId: number) {
  // Get proposal details with organization info
  const proposalData = await db.select({
    proposal_title: proposalsTable.title,
    proposal_description: proposalsTable.description,
    proposal_status: proposalsTable.status,
    proposal_phase: proposalsTable.current_phase,
    org_name: organizationsTable.name,
    org_description: organizationsTable.description
  })
  .from(proposalsTable)
  .innerJoin(organizationsTable, eq(proposalsTable.organization_id, organizationsTable.id))
  .where(eq(proposalsTable.id, proposalId))
  .execute();

  // Get recent chat history (last 5 messages)
  const recentMessages = await db.select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.proposal_id, proposalId))
    .orderBy(desc(chatMessagesTable.created_at))
    .limit(5)
    .execute();

  // Get AI memory for this proposal
  const memories = await db.select()
    .from(aiMemoryTable)
    .where(eq(aiMemoryTable.proposal_id, proposalId))
    .orderBy(desc(aiMemoryTable.created_at))
    .limit(10)
    .execute();

  // Get document count for organization
  const documentInfo = proposalData[0] ? await db.select()
    .from(documentsTable)
    .where(eq(documentsTable.organization_id, proposalData[0] ? 
      await db.select({ org_id: proposalsTable.organization_id })
        .from(proposalsTable)
        .where(eq(proposalsTable.id, proposalId))
        .then(r => r[0]?.org_id || 0) : 0))
    .execute() : [];

  return {
    proposal: proposalData[0] || null,
    recentMessages: recentMessages.reverse(), // Chronological order
    memories,
    documentCount: documentInfo.length
  };
}

function generateAiResponse(userMessage: string, messageType: 'chat' | 'planning' | 'feedback', context: any): string {
  const { proposal, recentMessages, memories, documentCount } = context;

  // Base response templates by message type
  if (messageType === 'planning') {
    if (userMessage.toLowerCase().includes('section') || userMessage.toLowerCase().includes('outline')) {
      return `Based on your proposal "${proposal?.proposal_title || 'your proposal'}", I recommend structuring it with these key sections:

1. Executive Summary
2. Problem Statement
3. Proposed Solution
4. Implementation Timeline
5. Budget and Resources
6. Expected Outcomes

${proposal?.org_name ? `For ${proposal.org_name}, ` : ''}I can help you develop content for each section. Which section would you like to start with?`;
    }
    
    if (userMessage.toLowerCase().includes('timeline') || userMessage.toLowerCase().includes('schedule')) {
      return `For your proposal planning, I suggest breaking down the timeline into phases:

Phase 1: Research and Analysis (2-3 weeks)
Phase 2: Solution Development (3-4 weeks)  
Phase 3: Implementation Planning (1-2 weeks)
Phase 4: Review and Finalization (1 week)

${documentCount > 0 ? `I notice you have ${documentCount} document(s) uploaded. ` : ''}Would you like me to help you create a detailed timeline for any specific phase?`;
    }

    return `I'm here to help you plan your proposal "${proposal?.proposal_title || 'your proposal'}". ${proposal?.org_name ? `For ${proposal.org_name}, ` : ''}I can assist with:

- Creating section outlines
- Developing timelines
- Identifying key stakeholders
- Structuring your arguments

What aspect of planning would you like to focus on?`;
  }

  if (messageType === 'feedback') {
    return `Thank you for your feedback on "${proposal?.proposal_title || 'your proposal'}". ${memories.length > 0 ? 'I\'ve noted your input and ' : ''}I'll help you refine and improve the content.

${proposal?.proposal_phase === 'drafting' ? 'Since you\'re in the drafting phase, ' : ''}Would you like me to:
- Review specific sections for clarity
- Suggest improvements to your arguments
- Help strengthen your proposal structure

What specific area would you like feedback on?`;
  }

  // Default chat response
  if (userMessage.toLowerCase().includes('help') || userMessage.toLowerCase().includes('assist')) {
    return `I'm here to help you with your proposal "${proposal?.proposal_title || 'your proposal'}"! ${proposal?.org_name ? `For ${proposal.org_name}, ` : ''}I can assist you with:

- **Planning**: Structure, timeline, and organization
- **Drafting**: Content development and writing
- **Review**: Feedback and improvements

${documentCount > 0 ? `You have ${documentCount} document(s) that I can reference for context. ` : ''}What would you like to work on today?`;
  }

  if (userMessage.toLowerCase().includes('document') && documentCount > 0) {
    return `I see you have ${documentCount} document(s) uploaded for this proposal. I can help you:

- Extract key information from your documents
- Use document insights for proposal content
- Reference supporting materials in your proposal

${proposal?.proposal_phase === 'planning' ? 'During the planning phase, ' : ''}would you like me to analyze your documents for relevant content?`;
  }

  // Generic response with context
  return `I understand you're working on "${proposal?.proposal_title || 'your proposal'}"${proposal?.org_name ? ` for ${proposal.org_name}` : ''}. 

${proposal?.proposal_phase === 'planning' ? 'In the planning phase, I can help you structure and organize your ideas. ' : ''}${proposal?.proposal_phase === 'drafting' ? 'In the drafting phase, I can help you develop and refine your content. ' : ''}

How can I assist you with your proposal today?`;
}
