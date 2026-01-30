import { Response } from 'express';
import { DocumentGenerationService } from '../services/document.service';
import { PDFService } from '../services/pdf.service';
import fs from 'fs';
import path from 'path';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

export const generateDocument = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'Document', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Document' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Template file (.docx) is required' });
        }

        const dataStr = req.body.data;
        let data = {};
        if (dataStr) {
            try {
                data = JSON.parse(dataStr);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid JSON data' });
            }
        }

        const docxBuffer = await DocumentGenerationService.generateDocx(req.file.buffer, data);
        const pdfBuffer = await DocumentGenerationService.convertToPdf(docxBuffer);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf');
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const healthCheck = async (req: any, res: Response) => {
    res.json({ status: 'Document Engine Service is Ready' });
};

const prepareDocumentData = (employee: any) => {
    return {
        employee: {
            ...employee,
            salary: employee.salary ? employee.salary.toString() : '',
            joiningDate: employee.dateOfJoining,
        },
        company: employee.company,
        departmentName: employee.department?.name,
        positionTitle: employee.position?.title,
        companyName: employee.company?.name,
        dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '',
        salary: employee.salary ? employee.salary.toString() : '',
        currentDate: new Date().toLocaleDateString(),
    };
};

export const previewDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { templateId, employeeId, useLetterhead } = req.body;
        const user = req.user;

        if (!PermissionService.hasBasicPermission(user, 'Document', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

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

        if (template.content) {
            let processedHtml = template.content;
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
                '[SIGNATURE]': companySignatureBase64 ? `<img src="${companySignatureBase64}" style="max-height: 60px; display: block;" />` : '[SIGNATURE]',
                '[COMPANY_SIGNATURE]': companySignatureBase64 ? `<img src="${companySignatureBase64}" style="max-height: 60px; display: block;" />` : '[COMPANY_SIGNATURE]',
            };

            Object.entries(replacements).forEach(([key, value]) => {
                processedHtml = processedHtml.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), value);
            });

            return res.json({ html: processedHtml });
        }
        return res.status(400).json({ error: 'Preview available only for Rich Text templates' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { templateId, employeeId, useLetterhead, customContent, saveAsDraft } = req.body;
        const user = req.user;

        if (!PermissionService.hasBasicPermission(user, 'Document', 'create')) {
            return res.status(403).json({ error: 'Access denied' });
        }

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
            pdfBuffer = await PDFService.generateGenericPDF(finalContent, data);
        } else if (template.filePath && fs.existsSync(template.filePath)) {
            const templateBuffer = fs.readFileSync(template.filePath);
            const docxBuffer = await DocumentGenerationService.generateDocx(templateBuffer, data);
            pdfBuffer = await DocumentGenerationService.convertToPdf(docxBuffer);
        } else {
            return res.status(500).json({ error: 'Content missing' });
        }

        const fileName = `${employee.firstName}_${template.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, pdfBuffer);

        const status = saveAsDraft ? 'draft' : 'pending_signature';

        const document = await prisma.document.create({
            data: {
                company: employee.companyId ? { connect: { id: employee.companyId } } : undefined,
                employee: { connect: { id: employee.id } },
                name: `${template.name} - ${new Date().toLocaleDateString()}`,
                type: template.type,
                filePath: `/uploads/documents/${fileName}`,
                fileSize: pdfBuffer.length,
                status: status,
                workflowType: 'signature_required',
                uploadedBy: { connect: { id: user.id } }
            }
        });

        res.json(document);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const uploadSignedDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const canManage = PermissionService.hasBasicPermission(user, 'Document', 'update') ||
            PermissionService.hasBasicPermission(user, 'Document', 'create');

        const document = await prisma.document.findUnique({
            where: { id },
            include: { employee: true }
        });

        if (!document) return res.status(404).json({ error: 'Document not found' });
        if (!canManage && (document.employee?.userId !== user.id)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!req.file) return res.status(400).json({ error: 'Signed PDF is required' });

        // Sanitize document name to remove slashes and other unsafe characters
        const safeDocName = document.name.replace(/[^a-zA-Z0-9-_]/g, '_');
        const signedFileName = `signed_${safeDocName}_${Date.now()}.pdf`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
        const signedFilePath = path.join(uploadDir, signedFileName);

        fs.writeFileSync(signedFilePath, req.file.buffer);

        const updated = await prisma.document.update({
            where: { id },
            data: {
                signedFilePath: `/uploads/documents/${signedFileName}`,
                status: 'submitted',
                rejectionReason: null
            }
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const reviewDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const user = req.user;

        if (!PermissionService.hasBasicPermission(user, 'Document', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updated = await prisma.document.update({
            where: { id },
            data: {
                status,
                rejectionReason: status === 'rejected' ? remarks : null
            }
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!PermissionService.hasBasicPermission(user, 'Document', 'delete')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const document = await prisma.document.findUnique({ where: { id } });
        if (!document) return res.status(404).json({ error: 'Document not found' });

        const isSuper = user.roles.some((ur: any) => ur.role.name === 'Admin' || ur.role.name === 'Super Admin');
        if (!isSuper && (document as any).uploadedById !== user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (document.filePath && document.filePath.startsWith('/uploads')) {
            const absolutePath = path.join(process.cwd(), document.filePath);
            if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
        }

        if (document.signedFilePath && document.signedFilePath.startsWith('/uploads')) {
            const absolutePath = path.join(process.cwd(), document.signedFilePath);
            if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
        }

        await prisma.document.delete({ where: { id } });
        res.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const publishDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!PermissionService.hasBasicPermission(user, 'Document', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const document = await prisma.document.findUnique({ where: { id } });
        if (!document) return res.status(404).json({ error: 'Document not found' });
        if (document.status !== 'draft') return res.status(400).json({ error: 'Only drafts can be published' });

        const updated = await prisma.document.update({
            where: { id },
            data: { status: 'pending_signature' }
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const generateFromTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { templateId, employeeId, useLetterhead } = req.body;
        const user = req.user;

        if (!PermissionService.hasBasicPermission(user, 'Document', 'create')) {
            return res.status(403).json({ error: 'Access denied' });
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
            return res.status(500).json({ error: 'Content missing' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${employee.firstName}_${template.type}.pdf`);
        res.send(pdfBuffer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Generic Upload for Employees (Guarded by Document.create)
export const uploadGenericDocument = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        // Check Document:create permission (Employees usually have this)
        if (!PermissionService.hasBasicPermission(user, 'Document', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Document' });
        }

        const { type, name, employeeId } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Resolve Target Employee ID
        let targetEmployeeId = employeeId;

        // If employeeId is NOT provided, try to resolve from logged-in User
        if (!targetEmployeeId) {
            const linkedEmployee = await prisma.employee.findFirst({
                where: { userId: user.id }
            });
            if (linkedEmployee) targetEmployeeId = linkedEmployee.id;
        }

        if (!targetEmployeeId) {
            return res.status(400).json({ error: 'Target Employee ID is required' });
        }

        // Verify validity of target employee
        const employee = await prisma.employee.findUnique({ where: { id: targetEmployeeId } });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const safeName = (name || 'doc').replace(/[^a-zA-Z0-9-_]/g, '_');
        const fileName = `${employee.firstName}_${safeName}_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, req.file.buffer);

        const fileUrl = `/uploads/documents/${fileName}`;

        const document = await prisma.document.create({
            data: {
                companyId: employee.companyId,
                employeeId: targetEmployeeId,
                name: name || req.file.originalname,
                type: type || 'General',
                filePath: fileUrl,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                status: 'submitted', // Auto-submit generic uploads
                workflowType: 'standard',
                uploadedBy: { connect: { id: user.id } }
            } as any
        });

        res.status(201).json(document);
    } catch (error: any) {
        console.error('Generic Upload Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const generateInstantDocument = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        // Check permission (Use Create)
        if (!PermissionService.hasBasicPermission(user, 'Document', 'create')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { recipientName, designation, subject, content, date, useLetterhead } = req.body;

        // Fetch Company Details for Header/Footer
        const company = await prisma.company.findUnique({ where: { id: user.companyId } });
        if (!company) return res.status(404).json({ error: 'Company not found' });

        const data = {
            company,
            useLetterhead: !!useLetterhead,
            recipient: {
                name: recipientName,
                designation: designation
            },
            subject,
            date,
            content // Passes raw HTML from RichTextEditor
        };

        // Wrap content in a standard letter template if raw content is just body
        // But since we use generateGenericPDF, it expects variables or full HTML.
        // We can pre-wrap it or let generateGenericPDF handle layout.
        // Let's assume content is the BODY.
        // We will construct a simple wrapper if needed, but generateGenericPDF
        // applies a standard layout if <html> tags are missing.

        // We should inject the specific variables for "Instant Write"
        // generateGenericPDF replaces [COMPANY_NAME] etc.
        // But for Instant Write, we might want to ensure the Recipient info is top-left.
        // Let's prepend recipient block to the content if it's not a template.

        let finalContent = content;
        // Prepend Header Info
        const headerHtml = `
            <div style="margin-bottom: 20px;">
                <strong>To,</strong><br>
                <strong>${recipientName}</strong><br>
                ${designation}<br>
                Date: ${new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style="margin-bottom: 20px; font-weight: bold; text-decoration: underline;">
                Subject: ${subject}
            </div>
        `;

        finalContent = headerHtml + finalContent;

        const pdfBuffer = await PDFService.generateGenericPDF(finalContent, data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${recipientName.replace(/\s+/g, '_')}_Letter.pdf`);
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('Instant Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
};


