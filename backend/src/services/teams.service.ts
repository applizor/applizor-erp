import axios from 'axios';
import { ConversationMemoryService } from './conversation_memory.service';

export class TeamsConnector {
    private static readonly GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

    /**
     * Authenticates and fetches messages from a specific Teams channel.
     * This is a Read-Only connector.
     */
    static async syncChannelMessages(teamId: string, channelId: string, accessToken: string) {
        try {
            // 1. Fetch messages from the channel
            const response = await axios.get(
                `${this.GRAPH_API_URL}/teams/${teamId}/channels/${channelId}/messages`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );

            const messages = response.data.value;

            // 2. Process and store each message in Conversation Memory
            const processedMessages = [];
            for (const msg of messages) {
                const memoryResult = await ConversationMemoryService.storeMessage({
                    source: 'Microsoft Teams',
                    externalId: msg.id,
                    sender: msg.from?.user?.displayName || 'Unknown',
                    content: msg.body?.content || '',
                    timestamp: new Date(msg.createdDateTime),
                    channelId: channelId,
                    teamId: teamId,
                    attachments: msg.attachments || []
                });
                processedMessages.push({ messageId: msg.id, stored: memoryResult.success });
            }

            return {
                success: true,
                messagesSynced: processedMessages.length,
                details: processedMessages
            };
        } catch (error: any) {
            console.error(`Teams Sync Error: ${error}`);
            return {
                success: false,
                error: error.message || 'Failed to sync Teams messages'
            };
        }
    }

    /**
     * Fetches a specific message thread (conversation).
     */
    static async fetchMessageThread(teamId: string, channelId: string, messageId: string, accessToken: string) {
        try {
            const response = await axios.get(
                `${this.GRAPH_API_URL}/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );

            return {
                success: true,
                replies: response.data.value
            };
        } catch (error: any) {
            console.error(`Teams Thread Error: ${error}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
