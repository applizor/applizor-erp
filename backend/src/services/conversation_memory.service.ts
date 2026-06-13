import prisma from '../prisma/client';

export interface ConversationMessage {
    source: string; // 'Teams', 'Telegram', 'Email', 'ERP'
    externalId: string;
    sender: string;
    content: string;
    timestamp: Date;
    projectId?: string;
    channelId?: string;
    teamId?: string;
    attachments?: any[];
}

export class ConversationMemoryService {
    /**
     * Stores a message in the conversation memory and attempts to link it to ERP entities.
     */
    static async storeMessage(msg: ConversationMessage) {
        try {
            // 1. Attempt to link to a Project or Task by scanning content for IDs
            const links = this.detectEntityLinks(msg.content);

            // 2. Save to the ERP database
            const memoryEntry = await prisma.conversationMemory.create({
                data: {
                    source: msg.source,
                    externalId: msg.externalId,
                    channelId: msg.channelId || 'unknown',
                    channelType: 'generic', // Default
                    projectId: links.projectId || msg.projectId,
                    clientId: links.clientId,
                    taskId: links.taskId,
                    timestamp: msg.timestamp,
                    messages: [msg.content], // Initializing the array
                    metadata: {
                        teamId: msg.teamId,
                        attachments: msg.attachments
                    }
                }
            });

            return {
                success: true,
                id: memoryEntry.id,
                links: links
            };
        } catch (error: any) {
            console.error(`Conversation Memory Error: ${error}`);
            return {
                success: false,
                error: error.message || 'Failed to store conversation memory'
            };
        }
    }

    /**
     * Retrieves conversation history for a specific project, client, or task.
     */
    static async getHistory(filter: { projectId?: string; clientId?: string; taskId?: string }) {
        try {
            const history = await prisma.conversationMemory.findMany({
                where: {
                    OR: [
                        { projectId: filter.projectId },
                        { clientId: filter.clientId },
                        { taskId: filter.taskId }
                    ]
                },
                orderBy: { timestamp: 'asc' }
            });

            return {
                success: true,
                history
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Simple pattern matcher to detect Project, Task or Client IDs in text.
     */
    private static detectEntityLinks(content: string) {
        const links = {
            projectId: null as string | null,
            taskId: null as string | null,
            clientId: null as string | null
        };

        const projectMatch = content.match(/PRJ-\d+/);
        const taskMatch = content.match(/TSK-\d+/);
        const clientMatch = content.match(/CLI-\d+/);

        if (projectMatch) links.projectId = projectMatch[0];
        if (taskMatch) links.taskId = taskMatch[0];
        if (clientMatch) links.clientId = clientMatch[0];

        return links;
    }
}
