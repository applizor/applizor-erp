import prisma from '../prisma/client';
import { getIO } from '../socket';

export class NotificationService {
    /**
     * Creates a notification in the database and emits it via socket
     */
    static async createNotification(data: {
        companyId: string;
        userId: string;
        title: string;
        message: string;
        type?: 'info' | 'success' | 'warning' | 'error' | 'task_update' | 'task_assigned';
        link?: string;
    }) {
        try {
            const notification = await prisma.notification.create({
                data: {
                    companyId: data.companyId,
                    userId: data.userId,
                    title: data.title,
                    message: data.message,
                    type: data.type || 'info',
                    link: data.link
                }
            });

            // Emit to user-specific room
            const io = getIO();
            io.to(`user:${data.userId}`).emit('notification', notification);

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            // Don't throw - notifications shouldn't crash the main flow
            return null;
        }
    }

    /**
     * Emits an event to all users in a specific project room
     */
    static emitProjectUpdate(projectId: string, event: string, data: any) {
        try {
            const io = getIO();
            io.to(`project:${projectId}`).emit(event, data);
        } catch (error) {
            console.error('Error emitting project update:', error);
        }
    }

    /**
     * Emits an event to all users in a specific company room
     */
    static emitCompanyUpdate(companyId: string, event: string, data: any) {
        try {
            const io = getIO();
            io.to(`company:${companyId}`).emit(event, data);
        } catch (error) {
            console.error('Error emitting company update:', error);
        }
    }

    /**
     * Parses HTML content for mentions and notifies users
     */
    static async handleMentions(content: string, commenterName: string, task: any, project: any, companyId: string) {
        try {
            // Regex to find data-id in mention tags
            const mentionRegex = /class="mention" data-id="([^"]+)"/g;
            const matches = [...content.matchAll(mentionRegex)];
            const uniqueUserIds = [...new Set(matches.map(m => m[1]))];

            if (uniqueUserIds.length === 0) return;

            // Fetch user emails and names
            const users = await prisma.user.findMany({
                where: { id: { in: uniqueUserIds } },
                select: { id: true, email: true, firstName: true, lastName: true }
            });

            const { notifyMention } = await import('./email.service');

            for (const user of users) {
                // 1. In-app Notification
                await this.createNotification({
                    companyId,
                    userId: user.id,
                    title: 'New Mention',
                    message: `${commenterName} mentioned you in task: ${task.title}`,
                    type: 'info',
                    link: `/projects/${project.id}/tasks?taskId=${task.id}`
                });

                // 2. Email Notification
                await notifyMention(
                    { email: user.email, firstName: user.firstName },
                    commenterName,
                    task,
                    project,
                    content
                );
            }
        } catch (error) {
            console.error('Mention handling error:', error);
        }
    }
}
