import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

const prisma = new PrismaClient();

// Get all templates
export const getTemplates = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Quotation' });
        }

        const { category, search } = req.query;

        const where: any = {
            companyId: user.companyId!,
            isActive: true
        };

        if (category) {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const templates = await prisma.quotationTemplate.findMany({
            where,
            orderBy: [
                { usageCount: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({ templates });
    } catch (error: any) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
    }
};

// Get single template
export const getTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Quotation' });
        }

        const template = await prisma.quotationTemplate.findFirst({
            where: {
                id,
                companyId: user.companyId!
            }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json({ template });
    } catch (error: any) {
        console.error('Get template error:', error);
        res.status(500).json({ error: 'Failed to fetch template', details: error.message });
    }
};

// Create template
export const createTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Quotation' });
        }

        const {
            name,
            description,
            category,
            title,
            templateDescription,
            paymentTerms,
            deliveryTerms,
            notes,
            items
        } = req.body;

        // Validation
        if (!name || !title || !templateDescription || !items || items.length === 0) {
            return res.status(400).json({ error: 'Name, title, description, and items are required' });
        }

        const template = await prisma.quotationTemplate.create({
            data: {
                companyId: user.companyId!,
                name,
                description,
                category,
                title,
                templateDescription,
                paymentTerms,
                deliveryTerms,
                notes,
                items,
                createdBy: user.id
            }
        });

        res.status(201).json({ template, message: 'Template created successfully' });
    } catch (error: any) {
        console.error('Create template error:', error);
        res.status(500).json({ error: 'Failed to create template', details: error.message });
    }
};

// Update template
export const updateTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Quotation' });
        }

        const {
            name,
            description,
            category,
            title,
            templateDescription,
            paymentTerms,
            deliveryTerms,
            notes,
            items,
            isActive
        } = req.body;

        // Check if template exists
        const existing = await prisma.quotationTemplate.findFirst({
            where: {
                id,
                companyId: user.companyId!
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const template = await prisma.quotationTemplate.update({
            where: { id },
            data: {
                name,
                description,
                category,
                title,
                templateDescription,
                paymentTerms,
                deliveryTerms,
                notes,
                items,
                isActive
            }
        });

        res.json({ template, message: 'Template updated successfully' });
    } catch (error: any) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Failed to update template', details: error.message });
    }
};

// Delete template
export const deleteTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Quotation' });
        }

        // Check if template exists
        const existing = await prisma.quotationTemplate.findFirst({
            where: {
                id,
                companyId: user.companyId!
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Soft delete by setting isActive to false
        await prisma.quotationTemplate.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({ message: 'Template deleted successfully' });
    } catch (error: any) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Failed to delete template', details: error.message });
    }
};

// Apply template (increment usage count)
export const applyTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Quotation' });
        }

        const template = await prisma.quotationTemplate.findFirst({
            where: {
                id,
                companyId: user.companyId!,
                isActive: true
            }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Increment usage count
        await prisma.quotationTemplate.update({
            where: { id },
            data: {
                usageCount: { increment: 1 }
            }
        });

        res.json({ template });
    } catch (error: any) {
        console.error('Apply template error:', error);
        res.status(500).json({ error: 'Failed to apply template', details: error.message });
    }
};
