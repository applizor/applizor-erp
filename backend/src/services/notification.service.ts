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
}
