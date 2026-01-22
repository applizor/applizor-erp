import { Response } from 'express';
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
        const template = await ContractTemplateService.getTemplateById(req.params.id);
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json(template);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const template = await ContractTemplateService.updateTemplate(req.params.id, req.body);
        res.json(template);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
    try {
        await ContractTemplateService.deleteTemplate(req.params.id);
        res.json({ message: 'Template deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
