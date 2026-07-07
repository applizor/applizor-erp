import { Response } from 'express';
import prisma from '../prisma/client';
import { ContractTemplateService } from '../services/contract-template.service';
import { AuthRequest } from '../middleware/auth';

export const createTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const template = await ContractTemplateService.createTemplate({
            ...req.body,
            companyId: req.user!.companyId
        });
        res.status(201).json(template);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getTemplates = async (req: AuthRequest, res: Response) => {
    try {
        const templates = await ContractTemplateService.getTemplates(req.user!.companyId);
        res.json(templates);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getTemplateById = async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.contractTemplate.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId } });
        if (!existing) return res.status(404).json({ error: 'Template not found' });
        res.json(existing);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.contractTemplate.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId } });
        if (!existing) return res.status(404).json({ error: 'Not found' });
        const template = await ContractTemplateService.updateTemplate(req.params.id, req.body, req.user!.companyId);
        res.json(template);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.contractTemplate.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId } });
        if (!existing) return res.status(404).json({ error: 'Not found' });
        await ContractTemplateService.deleteTemplate(req.params.id, req.user!.companyId);
        res.json({ message: 'Template deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
