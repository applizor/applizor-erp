
import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

export const createTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { name, type, content, variables, pdfMarginTop, pdfMarginBottom, pdfMarginLeft, pdfMarginRight, pdfContinuationTop } = req.body;
        const template = await prisma.documentTemplate.create({
            data: {
                name,
                type,
                content,
                variables,
                pdfMarginTop: pdfMarginTop !== undefined && pdfMarginTop !== null ? parseInt(pdfMarginTop) : null,
                pdfMarginBottom: pdfMarginBottom !== undefined && pdfMarginBottom !== null ? parseInt(pdfMarginBottom) : null,
                pdfMarginLeft: pdfMarginLeft !== undefined && pdfMarginLeft !== null ? parseInt(pdfMarginLeft) : null,
                pdfMarginRight: pdfMarginRight !== undefined && pdfMarginRight !== null ? parseInt(pdfMarginRight) : null,
                pdfContinuationTop: pdfContinuationTop !== undefined && pdfContinuationTop !== null ? parseInt(pdfContinuationTop) : null,
                companyId: req.user!.companyId
            }
        });
        res.status(201).json(template);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create template' });
    }
};

export const getTemplates = async (req: AuthRequest, res: Response) => {
    try {
        const templates = await prisma.documentTemplate.findMany({
            where: { companyId: req.user!.companyId, isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, type, content, variables, pdfMarginTop, pdfMarginBottom, pdfMarginLeft, pdfMarginRight, pdfContinuationTop } = req.body;

        // Initial check to ensure it belongs to company
        const existing = await prisma.documentTemplate.findFirst({
            where: { id, companyId: req.user!.companyId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const template = await prisma.documentTemplate.update({
            where: { id },
            data: {
                name,
                type,
                content,
                variables,
                pdfMarginTop: pdfMarginTop !== undefined && pdfMarginTop !== null ? parseInt(pdfMarginTop) : null,
                pdfMarginBottom: pdfMarginBottom !== undefined && pdfMarginBottom !== null ? parseInt(pdfMarginBottom) : null,
                pdfMarginLeft: pdfMarginLeft !== undefined && pdfMarginLeft !== null ? parseInt(pdfMarginLeft) : null,
                pdfMarginRight: pdfMarginRight !== undefined && pdfMarginRight !== null ? parseInt(pdfMarginRight) : null,
                pdfContinuationTop: pdfContinuationTop !== undefined && pdfContinuationTop !== null ? parseInt(pdfContinuationTop) : null,
            }
        });
        res.json(template);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update template' });
    }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
    try {
        await prisma.documentTemplate.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        res.json({ message: 'Template deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete template' });
    }
};
export const getTemplatesByType = async (req: AuthRequest, res: Response) => {
    try {
        const { type } = req.params;
        const templates = await prisma.documentTemplate.findMany({
            where: {
                companyId: req.user!.companyId,
                type,
                isActive: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};
