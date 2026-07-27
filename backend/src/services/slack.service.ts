import prisma from '../prisma/client';
import axios from 'axios';

export class SlackService {
    static async processMessage(event: any) {
        if (event.bot_id || event.subtype === 'bot_message' || !event.text) return;

        const integration = await prisma.projectIntegration.findFirst({
            where: {
                provider: 'SLACK',
                externalChannelId: event.channel,
                isActive: true
            },
            include: { project: true }
        });

        if (!integration) return;

        const isThreadReply = !!event.thread_ts && event.thread_ts !== event.ts;

        if (!isThreadReply) {
            await this.createTaskFromSlack(event, integration);
        } else {
            await this.addCommentToTask(event, integration);
        }
    }

    private static async createTaskFromSlack(event: any, integration: any) {
        const task = await prisma.task.create({
            data: {
                projectId: integration.projectId,
                title: event.text.substring(0, 200),
                description: event.text,
                status: 'TODO',
                priority: 'MEDIUM',
                createdById: integration.project.ownerId,
                externalId: event.ts,
                externalProvider: 'SLACK',
                externalThreadId: event.ts,
                externalChannelId: event.channel
            }
        });

        await this.postMessage(event.channel, `✅ Task created: *${task.title}*`, event.ts);
    }

    private static async addCommentToTask(event: any, integration: any) {
        const task = await prisma.task.findFirst({
            where: {
                projectId: integration.projectId,
                externalThreadId: event.thread_ts,
                externalProvider: 'SLACK'
            }
        });

        if (!task) return;

        await prisma.taskComment.create({
            data: {
                taskId: task.id,
                content: event.text,
                userId: integration.project.ownerId
            }
        });
    }

    static async postMessage(channel: string, text: string, thread_ts?: string) {
        const integration = await prisma.projectIntegration.findFirst({
            where: { externalChannelId: channel, provider: 'SLACK' }
        });

        if (!integration?.accessToken) return;

        try {
            const response = await axios.post('https://slack.com/api/chat.postMessage', {
                channel,
                text,
                thread_ts
            }, {
                headers: {
                    'Authorization': `Bearer ${integration.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Slack postMessage failed:', error);
        }
    }
}