import { Request, Response } from 'express';
import { DocumentGenerationService } from '../services/document.service';
import { PDFService } from '../services/pdf.service';
import fs from 'fs';
import path from 'path';

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

// Helper to prepare data context
const prepareDocumentData = (employee: any) => {
    return {
        employee: {
            ...employee,
            salary: employee.salary ? employee.salary.toString() : '',
            joiningDate: employee.dateOfJoining,
        },
        company: employee.company,
        // Flat Mapping for legacy DOCX templates if needed
        departmentName: employee.department?.name,
        positionTitle: employee.position?.title,
        companyName: employee.company?.name,
        dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '',
        salary: employee.salary ? employee.salary.toString() : '',
        currentDate: new Date().toLocaleDateString(),
    };
};

// 1. Preview Document (Returns HTML with variables replaced)
export const previewDocument = async (req: Request, res: Response) => {
    try {
        const { templateId, employeeId, useLetterhead } = req.body;
        if (!templateId || !employeeId) {
            return res.status(400).json({ error: 'templateId and employeeId are required' });
        }

        const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
        if (!template) return res.status(404).json({ error: 'Template not found' });

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { department: true, position: true, company: true }
        });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const data = {
            ...prepareDocumentData(employee),
            useLetterhead: !!useLetterhead
        };

        // If HTML content (Lexical)
        if (template.content) {
            // We use PDFService to perform replacement but return the HTML string instead of PDF
            // We can expose a public helper or duplicate logic. 
            // For now, let's duplicate the replacement logic cleanly or call a helper.
            // Actually, we can assume the frontend wants to render it.
            // Let's implement a quick helper here since PDFService.generateGenericPDF returns Buffer.

            // Re-use logic from PDFService but stop at HTML
            let processedHtml = template.content;

            // Use same replacements as PDFService
            const companySignatureBase64 = PDFService.getImageBase64(data.company?.digitalSignature);

            const replacements: Record<string, string> = {
                '[DATE]': new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                '[CURRENT_DATE]': new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                '[COMPANY_NAME]': data.company?.name || '',
                '[COMPANY_ADDRESS]': data.company?.address || '',
                '[EMPLOYEE_NAME]': data.employee?.firstName ? `${data.employee.firstName} ${data.employee.lastName || ''}` : '',
                '[EMPLOYEE_ID]': data.employee?.employeeId || '',
                '[DESIGNATION]': data.employee?.position?.title || '',
                '[DEPARTMENT]': data.employee?.department?.name || '',
                '[JOINING_DATE]': data.employee?.joiningDate ? new Date(data.employee.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
                '[SALARY]': data.employee?.salary ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: data.company?.currency || 'INR' }).format(Number(data.employee.salary)) : '',
                '[CTC_ANNUAL]': data.employee?.salary ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: data.company?.currency || 'INR' }).format(Number(data.employee.salary)) : '',

                // Use Base64 for Preview Rendering
                '[SIGNATURE]': companySignatureBase64 ? `<img src="${companySignatureBase64}" style="max-height: 60px; display: block;" />` : '[SIGNATURE]',
                '[COMPANY_SIGNATURE]': companySignatureBase64 ? `<img src="${companySignatureBase64}" style="max-height: 60px; display: block;" />` : '[COMPANY_SIGNATURE]',
            };

            Object.entries(replacements).forEach(([key, value]) => {
                processedHtml = processedHtml.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), value);
            });

            return res.json({ html: processedHtml });
        } else {
            return res.status(400).json({ error: 'Preview available only for Rich Text templates' });
        }

    } catch (error: any) {
        console.error('Preview Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// 2. Publish Document (Create PDF & Save Record)
export const publishDocument = async (req: Request, res: Response) => {
    try {
        const { templateId, employeeId, useLetterhead, customContent } = req.body;
        // customContent is optional: if user edited the preview text manually

        if (!templateId || !employeeId) {
            return res.status(400).json({ error: 'templateId and employeeId are required' });
        }

        const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
        if (!template) return res.status(404).json({ error: 'Template not found' });

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { department: true, position: true, company: true }
        });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const data = {
            ...prepareDocumentData(employee),
            useLetterhead: !!useLetterhead
        };

        let pdfBuffer: Buffer;
        const finalContent = customContent || template.content;

        if (finalContent) {
            // HTML Generation
            pdfBuffer = await PDFService.generateGenericPDF(finalContent, data);
        } else if (template.filePath && fs.existsSync(template.filePath)) {
            // DOCX Generation (Fallback, no custom content edit support here for now)
            const templateBuffer = fs.readFileSync(template.filePath);
            const docxBuffer = await DocumentGenerationService.generateDocx(templateBuffer, data);
            pdfBuffer = await DocumentGenerationService.convertToPdf(docxBuffer);
        } else {
            return res.status(500).json({ error: 'Content missing' });
        }

        // Save File
        const fileName = `${employee.firstName}_${template.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, pdfBuffer);

        // Create DB Record
        const document = await prisma.document.create({
            data: {
                company: employee.companyId ? { connect: { id: employee.companyId } } : undefined,
                employee: { connect: { id: employee.id } },
                name: `${template.name} - ${new Date().toLocaleDateString()}`,
                type: template.type,
                filePath: `/uploads/documents/${fileName}`,
                size: pdfBuffer.length
            }
        });

        res.json(document);

    } catch (error: any) {
        console.error('Publish Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// 3. Direct Download (Legacy/Quick)
export const generateFromTemplate = async (req: Request, res: Response) => {
    try {
        const { templateId, employeeId, useLetterhead } = req.body;
        if (!templateId || !employeeId) {
            return res.status(400).json({ error: 'templateId and employeeId are required' });
        }

        const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
        if (!template) return res.status(404).json({ error: 'Template not found' });

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { department: true, position: true, company: true }
        });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const data = {
            ...prepareDocumentData(employee),
            useLetterhead: !!useLetterhead
        };

        let pdfBuffer: Buffer;

        if (template.content) {
            pdfBuffer = await PDFService.generateGenericPDF(template.content, data);
        } else if (template.filePath && fs.existsSync(template.filePath)) {
            const templateBuffer = fs.readFileSync(template.filePath);
            const docxBuffer = await DocumentGenerationService.generateDocx(templateBuffer, data);
            pdfBuffer = await DocumentGenerationService.convertToPdf(docxBuffer);
        } else {
            return res.status(500).json({ error: 'Template content missing or file not found' });
        }

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
