import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: function (origin, callback) {
                const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
                const allowedOrigins = [
                    frontendUrl,
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'https://iam.applizor.com',
                    'https://applizor.com'
                ];

                const isApplizorDomain = origin && (origin.endsWith('.applizor.com') || origin === 'https://applizor.com');
                const isAllowedLocalhost = origin && (origin.includes('localhost:3000') || origin.includes('localhost:3001'));
                const isDevTunnel = origin && origin.endsWith('.devtunnels.ms');
                const isLocalIP = origin && /^http:\/\/(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(origin);

                const isProduction = process.env.NODE_ENV === 'production';
                if (!origin || allowedOrigins.indexOf(origin) !== -1 || isApplizorDomain || isAllowedLocalhost || isDevTunnel || isLocalIP) {
                    callback(null, true);
                } else if (isProduction) {
                    console.warn(`Socket blocked by CORS: ${origin}`);
                    callback(new Error('Not allowed by CORS'));
                } else {
                    console.warn(`Socket blocked by CORS: ${origin}`);
                    callback(null, true);
                }
            },
            methods: ["GET", "POST"],
            credentials: true
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
