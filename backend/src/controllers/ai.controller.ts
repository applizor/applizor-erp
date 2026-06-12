import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AiExecutorService } from '../services/ai-executor.service';

/**
 * ----------------------------------------------------
 * AI AGENT REGISTRY
 * ----------------------------------------------------
 */

export const createAgent = async (req: AuthRequest, res: Response) => {
    try {
        const { name, role, department, model, permissions, description } = req.body;
        const companyId = req.user!.companyId;

        const agent = await prisma.aiAgent.create({
            data: {
                name,
                role,
                department,
                model: model || 'gemini-2.5-flash',
                permissions: permissions || {},
                description,
                companyId
            }
        });
        res.status(201).json(agent);
    } catch (error) {
        console.error('Error creating AI Agent:', error);
        res.status(500).json({ error: 'Failed to create AI Agent' });
    }
};

export const getAgents = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const agents = await prisma.aiAgent.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(agents);
    } catch (error) {
        console.error('Error fetching AI Agents:', error);
        res.status(500).json({ error: 'Failed to fetch AI Agents' });
    }
};

export const toggleAgentStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // active, disabled, offline

        const agent = await prisma.aiAgent.update({
            where: { id },
            data: { status }
        });
        res.json(agent);
    } catch (error) {
        console.error('Error toggling AI Agent status:', error);
        res.status(500).json({ error: 'Failed to toggle status' });
    }
};

/**
 * ----------------------------------------------------
 * AI TASK MANAGER
 * ----------------------------------------------------
 */

export const createAiTask = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, agentId, priority, projectId, assignedTo } = req.body;
        const companyId = req.user!.companyId;

        const task = await prisma.aiTask.create({
            data: {
                title,
                description,
                agentId,
                priority: priority || 'medium',
                projectId,
                assignedTo,
                companyId
            }
        });
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating AI Task:', error);
        res.status(500).json({ error: 'Failed to create AI Task' });
    }
};

export const getAiTasks = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const tasks = await prisma.aiTask.findMany({
            where: { companyId },
            include: { agent: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching AI Tasks:', error);
        res.status(500).json({ error: 'Failed to fetch AI Tasks' });
    }
};

export const updateAiTaskStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // todo, in_progress, qa, completed

        const task = await prisma.aiTask.update({
            where: { id },
            data: { status }
        });
        res.json(task);
    } catch (error) {
        console.error('Error updating AI Task status:', error);
        res.status(500).json({ error: 'Failed to update task status' });
    }
};

/**
 * ----------------------------------------------------
 * AI APPROVAL CENTER
 * ----------------------------------------------------
 */

export const createApproval = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, type, requestedBy, payload, referenceId } = req.body;
        const companyId = req.user!.companyId;

        const approval = await prisma.aiApproval.create({
            data: {
                title,
                description,
                type,
                agentName: requestedBy || 'System',
                payload: payload || {},
                referenceId,
                companyId
            }
        });
        res.status(201).json(approval);
    } catch (error) {
        console.error('Error creating AI Approval:', error);
        res.status(500).json({ error: 'Failed to create AI Approval' });
    }
};

export const getApprovals = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const approvals = await prisma.aiApproval.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(approvals);
    } catch (error) {
        console.error('Error fetching AI Approvals:', error);
        res.status(500).json({ error: 'Failed to fetch AI Approvals' });
    }
};

export const handleApproval = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, comments } = req.body; // approved, rejected
        
        // Ensure status is uppercase to match schema ('APPROVED', 'REJECTED')
        const normalizedStatus = status ? status.toUpperCase() : 'APPROVED';

        const approval = await prisma.aiApproval.update({
            where: { id },
            data: {
                status: normalizedStatus,
                comments
            }
        });
        res.json(approval);
    } catch (error) {
        console.error('Error handling AI Approval:', error);
        res.status(500).json({ error: 'Failed to update approval status' });
    }
};

/**
 * ----------------------------------------------------
 * MEMORY ENGINE
 * ----------------------------------------------------
 */

export const createProjectMemory = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId, data } = req.body;

        const memory = await prisma.projectMemory.upsert({
            where: { projectId },
            update: { data },
            create: { projectId, data }
        });
        res.json(memory);
    } catch (error) {
        console.error('Error writing Project Memory:', error);
        res.status(500).json({ error: 'Failed to write project memory' });
    }
};

export const getProjectMemory = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const memory = await prisma.projectMemory.findUnique({
            where: { projectId }
        });
        res.json(memory);
    } catch (error) {
        console.error('Error fetching Project Memory:', error);
        res.status(500).json({ error: 'Failed to fetch project memory' });
    }
};

/**
 * ----------------------------------------------------
 * AI CHIEF OF STAFF CHAT CONSOLE
 * ----------------------------------------------------
 */

export const chatCommand = async (req: AuthRequest, res: Response) => {
    try {
        const { query } = req.body;
        const companyId = req.user!.companyId;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const responseText = await AiExecutorService.executeCommand(query, companyId);
        res.json({ response: responseText });
    } catch (error: any) {
        console.error('Error executing AI command:', error);
        res.status(500).json({ error: error.message || 'AI Command execution failed' });
    }
};
