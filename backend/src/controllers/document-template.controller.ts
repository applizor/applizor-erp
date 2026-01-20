import { Request, Response } from 'express';
import prisma from '../prisma/client';
import fs from 'fs';
import path from 'path';

// Upload handling usually via Middleware (Multer), saving to disk or S3.
// For MVP, we save to 'uploads/templates' directory.

export const uploadTemplate = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { name, type, letterheadMode } = req.body;
        const companyId = (req as any).user?.companyId; // From Auth Middleware

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and Type are required' });
        }

        // Save to DB
        const template = await prisma.documentTemplate.create({
            data: {
                companyId,
                name,
                type,
                letterheadMode: letterheadMode || 'NONE',
                filePath: req.file.path, // Multer saves it and gives path
            }
        });

        res.json(template);
    } catch (error: any) {
        console.error('Template upload error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const listTemplates = async (req: Request, res: Response) => {
    try {
        const companyId = (req as any).user?.companyId;
        const templates = await prisma.documentTemplate.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(templates);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const template = await prisma.documentTemplate.findUnique({ where: { id } });
        if (!template) return res.status(404).json({ error: 'Template not found' });

        // Delete File
        if (fs.existsSync(template.filePath)) {
            fs.unlinkSync(template.filePath);
        }

        // Delete record
        await prisma.documentTemplate.delete({ where: { id } });

        res.json({ message: 'Template deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
