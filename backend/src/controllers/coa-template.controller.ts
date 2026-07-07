import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CoaTemplateService } from '../services/coa-template.service';

export const listTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const { countryId, countryCode } = req.query;
    let filterCountryId = countryId as string | undefined;
    if (countryCode) {
      const country = await (await import('../prisma/client')).default.country.findUnique({ where: { code: countryCode as string } });
      if (country) filterCountryId = country.id;
    }
    const templates = await CoaTemplateService.listTemplates(filterCountryId);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list COA templates' });
  }
};

export const getTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const template = await CoaTemplateService.getTemplate(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get template' });
  }
};

export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { countryId, name, version, entries } = req.body;
    if (!countryId || !name || !version) {
      return res.status(400).json({ error: 'countryId, name, and version are required' });
    }
    const template = await CoaTemplateService.createTemplate({ countryId, name, version, entries });
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create template' });
  }
};

export const addEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, type, parentCode, description } = req.body;
    if (!code || !name || !type) {
      return res.status(400).json({ error: 'code, name, and type are required' });
    }
    const entry = await CoaTemplateService.addEntry(req.params.id, { code, name, type, parentCode, description });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add entry' });
  }
};

export const removeEntry = async (req: AuthRequest, res: Response) => {
  try {
    await CoaTemplateService.removeEntry(req.params.id);
    res.json({ message: 'Entry removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove entry' });
  }
};

export const deactivateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    await CoaTemplateService.deactivateTemplate(req.params.id);
    res.json({ message: 'Template deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate template' });
  }
};

export const applyTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { templateId } = req.body;
    const companyId = req.params.companyId || req.user!.companyId;
    if (!templateId) return res.status(400).json({ error: 'templateId is required' });
    const result = await CoaTemplateService.applyTemplate(templateId, companyId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to apply template' });
  }
};
