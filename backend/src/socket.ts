import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join-company', (companyId: string) => {
            socket.join(`company:${companyId}`);
            console.log(`Socket ${socket.id} joined company room: ${companyId}`);
        });

        socket.on('join-project', (projectId: string) => {
            socket.join(`project:${projectId}`);
            console.log(`Socket ${socket.id} joined project room: ${projectId}`);
        });

        socket.on('join-user', (userId: string) => {
            socket.join(`user:${userId}`);
            console.log(`Socket ${socket.id} joined user room: ${userId}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

// Helper function to emit events
export const emitToCompany = (companyId: string, event: string, data: any) => {
    if (io) {
        io.to(`company:${companyId}`).emit(event, data);
    }
};

export const emitToProject = (projectId: string, event: string, data: any) => {
    if (io) {
        io.to(`project:${projectId}`).emit(event, data);
    }
};
