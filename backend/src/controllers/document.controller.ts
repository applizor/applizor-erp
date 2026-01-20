import { Request, Response } from 'express';
import { DocumentGenerationService } from '../services/document.service';
import fs from 'fs';

export const generateDocument = async (req: Request, res: Response) => {
    try {
        // 1. Check for file (template)
        if (!req.file) {
            return res.status(400).json({ error: 'Template file (.docx) is required' });
        }

        // 2. Parse Data (JSON)
        const dataStr = req.body.data;
        let data = {};
        if (dataStr) {
            try {
                data = JSON.parse(dataStr);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid proprietary JSON data' });
            }
        }

        // 3. Generate DOCX
        const docxBuffer = await DocumentGenerationService.generateDocx(req.file.buffer, data);

        // 4. Convert to PDF
        // Note: For dev/test, we might skip conversion if Gotenberg is not ready, but we aim for E2E.
        const pdfBuffer = await DocumentGenerationService.convertToPdf(docxBuffer);

        // 5. Letterhead (Optional - mock for now)
        // const finalPdf = await DocumentGenerationService.applyLetterhead(pdfBuffer, null, 'NONE');

        // 6. Return PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf');
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const healthCheck = async (req: Request, res: Response) => {
    res.json({ status: 'Document Engine Service is Ready' });
};

import prisma from '../prisma/client';

export const generateFromTemplate = async (req: Request, res: Response) => {
    try {
        const { templateId, employeeId } = req.body;
        if (!templateId || !employeeId) {
            return res.status(400).json({ error: 'templateId and employeeId are required' });
        }

        // 1. Fetch Template
        const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
        if (!template) return res.status(404).json({ error: 'Template not found' });

        // 2. Fetch Employee
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { department: true, position: true, company: true }
        });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        // 3. Prepare Data
        const data = {
            ...employee,
            departmentName: employee.department?.name,
            positionTitle: employee.position?.title,
            companyName: employee.company?.name,
            dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '',
            salary: employee.salary ? employee.salary.toString() : '',
            // Add derived fields
            currentDate: new Date().toLocaleDateString(),
        };

        // 4. Read File
        if (!fs.existsSync(template.filePath)) {
            return res.status(500).json({ error: 'Template file missing on server' });
        }
        const templateBuffer = fs.readFileSync(template.filePath);

        // 5. Generate
        const docxBuffer = await DocumentGenerationService.generateDocx(templateBuffer, data);
        const pdfBuffer = await DocumentGenerationService.convertToPdf(docxBuffer);

        // 6. Apply Letterhead (Future)
        // const finalPdf = await DocumentGenerationService.applyLetterhead(pdfBuffer, ...);

        // Audit Log
        const { logAction } = await import('../services/audit.service');
        await logAction(req, {
            action: 'GENERATE',
            module: 'DOCUMENT',
            entityType: 'DocumentTemplate',
            entityId: templateId,
            details: `Generated ${template.name} for employee ${employee.firstName} ${employee.lastName}`
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${employee.firstName}_${template.type}.pdf`);
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('Template Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
};
