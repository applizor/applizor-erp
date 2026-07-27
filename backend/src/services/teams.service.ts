import prisma from '../prisma/client';
import axios from 'axios';

export class TeamsService {
    // Normalize message from both Power Automate and native Teams formats
    private static normalizeMessage(body: any) {
        // Power Automate format: body.content, body.from.user.displayName, channelIdentity.channelId
        // Native Teams: message.text, message.from.name, channelId
        const text = body.body?.content || body.message?.text || body.text || '';
        const senderName = body.body?.from?.user?.displayName || body.message?.from?.displayName || body.message?.from?.name || body.from || 'Unknown';
        const senderId = body.body?.from?.user?.id || body.message?.from?.id || body.userId || '';
        const channelId = body.channelIdentity?.channelId || body.channelId || body.channel || '';
        const messageId = body.id || body.messageId || '';
        const threadId = body.body?.parentMessageId || body.id || '';

        return { text, senderName, senderId, channelId, messageId, threadId };
    }

    static async processMessage(body: any) {
        const msg = this.normalizeMessage(body);

        // Skip bot messages
        if (body.type === 'message' && body.message?.from?.role === 'bot') return;

        const integration = await prisma.projectIntegration.findFirst({
            where: {
                provider: 'MICROSOFT_TEAMS',
                externalChannelId: msg.channelId,
                isActive: true
            },
            include: { project: true }
        });

        if (!integration) {
            console.log(`[Teams] No integration found for channel: ${msg.channelId}`);
            return;
        }

        // Auto-store teamId from incoming webhook
        const teamId = body.channelIdentity?.teamId || integration.settings?.teamId;
        if (teamId && !integration.settings?.teamId) {
            await prisma.projectIntegration.update({
                where: { id: integration.id },
                data: { settings: { ...integration.settings, teamId } }
            });
            integration.settings = { ...integration.settings, teamId };
        }

        // Check if there's an existing task for this thread
        // In Power Automate, thread replies have parentMessageId different from id
        const isThreadReply = msg.threadId && msg.threadId !== msg.messageId;

        if (!isThreadReply) {
            await this.createTaskFromTeams(msg, integration);
        } else {
            await this.addCommentToTask(msg, integration);
        }
    }

    private static async createTaskFromTeams(msg: any, integration: any) {
        const task = await prisma.task.create({
            data: {
                projectId: integration.projectId,
                title: msg.text.replace(/<[^>]+>/g, '').substring(0, 200), // strip HTML
                description: msg.text.replace(/<[^>]+>/g, ''),
                status: 'todo',
                priority: 'medium',
                createdById: undefined,
                externalId: msg.messageId,
                externalProvider: 'MICROSOFT_TEAMS',
                externalThreadId: msg.messageId,
                externalChannelId: msg.channelId
            }
        });

        console.log(`[Teams] Task created: ${task.id} from: ${msg.senderName} | message: ${msg.text.substring(0, 50)}`);
        return task;
    }

    private static async addCommentToTask(msg: any, integration: any) {
        const task = await prisma.task.findFirst({
            where: {
                projectId: integration.projectId,
                externalProvider: 'MICROSOFT_TEAMS',
                OR: [
                    { externalThreadId: msg.threadId },
                    { externalId: msg.threadId }
                ]
            }
        });

        if (!task) {
            console.log(`[Teams] No task found for thread: ${msg.threadId}`);
            return;
        }

        // Try to find matching ERP user by name
        let userId: string | undefined = undefined;
        if (msg.senderName && msg.senderName !== 'Unknown') {
            const parts = msg.senderName.split(' ');
            if (parts.length >= 2) {
                const user = await prisma.user.findFirst({
                    where: { firstName: parts[0], lastName: parts.slice(1).join(' ') }
                });
                if (user) userId = user.id;
            }
        }

        // Prefix comment with sender name for traceability
        await prisma.taskComment.create({
            data: {
                taskId: task.id,
                content: `[${msg.senderName}] ${msg.text}`,
                userId: userId || undefined
            }
        });

        console.log(`[Teams] Comment added to task: ${task.id} from: ${msg.senderName}`);
    }

    static async postMessage(threadId: string, channelId: string, comment: any) {
        const integration = await prisma.projectIntegration.findFirst({
            where: {
                provider: 'MICROSOFT_TEAMS',
                externalChannelId: channelId,
                isActive: true
            },
            include: { project: true }
        });

        if (!integration) {
            console.log(`[Teams] No integration found for channel: ${channelId}`);
            return;
        }

        const senderName = comment.user
            ? `${comment.user.firstName} ${comment.user.lastName}`
            : comment.client?.name || 'ERP';

        const messageText = `**${senderName}:** ${comment.content.replace(/<[^>]+>/g, '').replace(/\n/g, ' ')}`;

        // Method 1: Try webhook URL (Power Automate)
        if (integration.settings?.webhookUrl) {
            try {
                await axios.post(integration.settings.webhookUrl, {
                    text: messageText
                });
                console.log(`[Teams] Comment posted via webhook to channel ${channelId}`);
                return;
            } catch (error) {
                console.log(`[Teams] Webhook failed, trying Graph API...`);
            }
        }

        // Method 2: Try Graph API with access token
        const teamId = integration.settings?.teamId;
        if (teamId && integration.accessToken) {
            const graphUrl = `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages/${threadId}/replies`;
            try {
                await axios.post(graphUrl, {
                    body: {
                        contentType: 'html',
                        content: messageText
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${integration.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`[Teams] Comment posted via Graph API to channel ${channelId}`);
                return;
            } catch (error) {
                console.error(`[Teams] Graph API failed:`, error);
            }
        }

        console.log(`[Teams] Could not post comment - no webhook URL or access token configured`);
    }

    static async replyToMessage(messageId: string, text: string) {
        throw new Error('Teams reply implementation pending');
    }
}