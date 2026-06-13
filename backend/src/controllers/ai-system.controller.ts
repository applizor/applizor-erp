import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { CompanyOSCoordinator } from '../services/company_os.coordinator';
import { WorkloadService } from '../services/workload.service';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const totalAgents = await prisma.aiAgent.count();
        const pendingApprovals = await prisma.aiApproval.count({ where: { status: 'pending' } });
        const allWorkloads = await WorkloadService.getAllEmployeeWorkloads(req.user?.companyId || '');
        const highWorkloadCount = allWorkloads.filter(w => w.score >= 80).length;
        const recentTasks = await prisma.task.findMany({
            where: { description: { contains: 'BA Analysis' } },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({
            success: true,
            stats: { totalAgents, pendingApprovals, highWorkloadCount, recentTasks }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch dashboard stats' });
    }
};

// ==========================================

// ==========================================
// AI Memory Management
// ==========================================

export const getMemories = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { category, key, referenceId } = req.query;

        const where: any = { companyId };
        if (category) where.category = String(category);
        if (key) where.key = String(key);
        if (referenceId) where.referenceId = String(referenceId);

        const memories = await prisma.aiMemory.findMany({
            where,
            orderBy: { updatedAt: 'desc' }
        });

        res.json(memories);
    } catch (error: any) {
        console.error('getMemories Error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch AI memory' });
    }
};

export const setMemory = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { key, value, category, referenceId } = req.body;

        if (!key || !value || !category) {
            return res.status(400).json({ error: 'key, value, and category are required' });
        }

        // Upsert unique by companyId, key, and category
        const memory = await prisma.aiMemory.upsert({
            where: {
                companyId_key_category: {
                    companyId,
                    key,
                    category
                }
            },
            update: {
                value,
                referenceId,
                updatedAt: new Date()
            },
            create: {
                companyId,
                key,
                value,
                category,
                referenceId
            }
        });

        res.status(200).json(memory);
    } catch (error: any) {
        console.error('setMemory Error:', error);
        res.status(500).json({ error: error.message || 'Failed to set AI memory' });
    }
};

export const deleteMemory = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { category, key } = req.body;

        if (!key || !category) {
            return res.status(400).json({ error: 'key and category are required to delete memory' });
        }

        await prisma.aiMemory.delete({
            where: {
                companyId_key_category: {
                    companyId,
                    key,
                    category
                }
            }
        });

        res.json({ message: 'Memory entry deleted successfully' });
    } catch (error: any) {
        console.error('deleteMemory Error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete AI memory' });
    }
};

// ==========================================
// Approval Queue Management
// ==========================================

export const getApprovals = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { status, agentName, type } = req.query;

        const where: any = { companyId };
        if (status) where.status = String(status);
        if (agentName) where.agentName = String(agentName);
        if (type) where.type = String(type);

        const approvals = await prisma.aiApproval.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json(approvals);
    } catch (error: any) {
        console.error('getApprovals Error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch approvals' });
    }
};

export const createApproval = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { title, description, agentName, type, payload, referenceId } = req.body;

        if (!title || !agentName || !type || !payload) {
            return res.status(400).json({ error: 'title, agentName, type, and payload are required' });
        }

        const approval = await prisma.aiApproval.create({
            data: {
                companyId,
                title,
                description,
                agentName,
                type,
                payload,
                referenceId,
                status: 'PENDING'
            }
        });

        res.status(201).json(approval);
    } catch (error: any) {
        console.error('createApproval Error:', error);
        res.status(500).json({ error: error.message || 'Failed to create approval request' });
    }
};

export const updateApproval = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { id } = req.params;
        const { status, comments } = req.body;

        if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
            return res.status(400).json({ error: 'Invalid or missing status (must be APPROVED, REJECTED, or PENDING)' });
        }

        // Verify the approval exists and belongs to user's company
        const existingApproval = await prisma.aiApproval.findFirst({
            where: { id, companyId }
        });

        if (!existingApproval) {
            return res.status(404).json({ error: 'Approval request not found or access denied' });
        }

        const updatedApproval = await prisma.aiApproval.update({
            where: { id },
            data: {
                status,
                comments,
                updatedAt: new Date()
            }
        });

        res.json(updatedApproval);
    } catch (error: any) {
        console.error('updateApproval Error:', error);
        res.status(500).json({ error: error.message || 'Failed to update approval request' });
    }
};

// ==========================================
// AI Logging
// ==========================================

export const getLogs = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { agentName, status, limit } = req.query;

        const where: any = { companyId };
        if (agentName) where.agentName = String(agentName);
        if (status) where.status = String(status);

        const logs = await prisma.aiLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit ? parseInt(String(limit)) : 100
        });

        res.json(logs);
    } catch (error: any) {
        console.error('getLogs Error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch AI logs' });
    }
};

export const createLog = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { agentName, action, details, status } = req.body;

        if (!agentName || !action || !status) {
            return res.status(400).json({ error: 'agentName, action, and status are required' });
        }

        const log = await prisma.aiLog.create({
            data: {
                companyId,
                agentName,
                action,
                details,
                status
            }
        });

        res.status(201).json(log);
    } catch (error: any) {
        console.error('createLog Error:', error);
        res.status(500).json({ error: error.message || 'Failed to create AI log' });
    }
};

// ==========================================
// Company OS Orchestration
// ==========================================

export const processClientRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { message, context } = req.body;
        const userId = req.user!.id;

        if (!message) {
            return res.status(400).json({ error: 'Client message is required' });
        }

        const result = await CompanyOSCoordinator.processClientRequest(
            message, 
            context || 'General Project', 
            userId
        );

        if (!result.success) {
            return res.status(400).json({ 
                success: false, 
                stage: result.stage, 
                error: result.error,
                analysis: result.analysis 
            });
        }

        res.status(200).json(result);
    } catch (error: any) {
        console.error('processClientRequest Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error during orchestration' });
    }
};
