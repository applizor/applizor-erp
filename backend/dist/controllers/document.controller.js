"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInstantDocument = exports.uploadGenericDocument = exports.generateFromTemplate = exports.publishDocument = exports.deleteDocument = exports.reviewDocument = exports.uploadSignedDocument = exports.createDocument = exports.previewDocument = exports.healthCheck = exports.generateDocument = void 0;
const document_service_1 = require("../services/document.service");
const pdf_service_1 = require("../services/pdf.service");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = __importDefault(require("../prisma/client"));
const permission_service_1 = require("../services/permission.service");
const generateDocument = async (req, res) => {
    try {
        const user = req.user;
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Document', 'create')) {
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
            }
            catch (e) {
                return res.status(400).json({ error: 'Invalid JSON data' });
            }
        }
        const docxBuffer = await document_service_1.DocumentGenerationService.generateDocx(req.file.buffer, data);
        const pdfBuffer = await document_service_1.DocumentGenerationService.convertToPdf(docxBuffer);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf');
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.generateDocument = generateDocument;
const healthCheck = async (req, res) => {
    res.json({ status: 'Document Engine Service is Ready' });
};
exports.healthCheck = healthCheck;
const prepareDocumentData = (employee) => {
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
const previewDocument = async (req, res) => {
    try {
        const { templateId, employeeId, useLetterhead } = req.body;
        const user = req.user;
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Document', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!templateId || !employeeId) {
            return res.status(400).json({ error: 'templateId and employeeId are required' });
        }
        const template = await client_1.default.documentTemplate.findUnique({ where: { id: templateId } });
        if (!template)
            return res.status(404).json({ error: 'Template not found' });
        const employee = await client_1.default.employee.findUnique({
            where: { id: employeeId },
            include: { department: true, position: true, company: true }
        });
        if (!employee)
            return res.status(404).json({ error: 'Employee not found' });
        const data = {
            ...prepareDocumentData(employee),
            useLetterhead: !!useLetterhead
        };
        if (template.content) {
            let processedHtml = template.content;
            const companySignatureBase64 = pdf_service_1.PDFService.getImageBase64(data.company?.digitalSignature);
            const replacements = {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.previewDocument = previewDocument;
const createDocument = async (req, res) => {
    try {
        const { templateId, employeeId, useLetterhead, customContent, saveAsDraft } = req.body;
        const user = req.user;
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Document', 'create')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!templateId || !employeeId) {
            return res.status(400).json({ error: 'templateId and employeeId are required' });
        }
        const template = await client_1.default.documentTemplate.findUnique({ where: { id: templateId } });
        if (!template)
            return res.status(404).json({ error: 'Template not found' });
        const employee = await client_1.default.employee.findUnique({
            where: { id: employeeId },
            include: { department: true, position: true, company: true }
        });
        if (!employee)
            return res.status(404).json({ error: 'Employee not found' });
        const data = {
            ...prepareDocumentData(employee),
            useLetterhead: !!useLetterhead
        };
        let pdfBuffer;
        const finalContent = customContent || template.content;
        if (finalContent) {
            pdfBuffer = await pdf_service_1.PDFService.generateGenericPDF(finalContent, data);
        }
        else if (template.filePath && fs_1.default.existsSync(template.filePath)) {
            const templateBuffer = fs_1.default.readFileSync(template.filePath);
            const docxBuffer = await document_service_1.DocumentGenerationService.generateDocx(templateBuffer, data);
            pdfBuffer = await document_service_1.DocumentGenerationService.convertToPdf(docxBuffer);
        }
        else {
            return res.status(500).json({ error: 'Content missing' });
        }
        const fileName = `${employee.firstName}_${template.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'documents');
        if (!fs_1.default.existsSync(uploadDir))
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        const filePath = path_1.default.join(uploadDir, fileName);
        fs_1.default.writeFileSync(filePath, pdfBuffer);
        const status = saveAsDraft ? 'draft' : 'pending_signature';
        const document = await client_1.default.document.create({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createDocument = createDocument;
const uploadSignedDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const canManage = permission_service_1.PermissionService.hasBasicPermission(user, 'Document', 'update') ||
            permission_service_1.PermissionService.hasBasicPermission(user, 'Document', 'create');
        const document = await client_1.default.document.findUnique({
            where: { id },
            include: { employee: true }
        });
        if (!document)
            return res.status(404).json({ error: 'Document not found' });
        if (!canManage && (document.employee?.userId !== user.id)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!req.file)
            return res.status(400).json({ error: 'Signed PDF is required' });
        // Sanitize document name to remove slashes and other unsafe characters
        const safeDocName = document.name.replace(/[^a-zA-Z0-9-_]/g, '_');
        const signedFileName = `signed_${safeDocName}_${Date.now()}.pdf`;
        const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'documents');
        const signedFilePath = path_1.default.join(uploadDir, signedFileName);
        fs_1.default.writeFileSync(signedFilePath, req.file.buffer);
        const updated = await client_1.default.document.update({
            where: { id },
            data: {
                signedFilePath: `/uploads/documents/${signedFileName}`,
                status: 'submitted',
                rejectionReason: null
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.uploadSignedDocument = uploadSignedDocument;
const reviewDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const user = req.user;
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Document', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const updated = await client_1.default.document.update({
            where: { id },
            data: {
                status,
                rejectionReason: status === 'rejected' ? remarks : null
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.reviewDocument = reviewDocument;
const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Document', 'delete')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const document = await client_1.default.document.findUnique({ where: { id } });
        if (!document)
            return res.status(404).json({ error: 'Document not found' });
        // Check Scope: If user has 'delete: all', allow. 
        // If 'delete: owned', check ownership.
        const scope = permission_service_1.PermissionService.getPermissionScope(user, 'Document', 'delete');
        const isOwner = document.uploadedById === user.id;
        if (!scope.all && !isOwner) {
            return res.status(403).json({ error: 'Access denied: You can only delete your own documents' });
        }
        if (document.filePath && document.filePath.startsWith('/uploads')) {
            const absolutePath = path_1.default.join(process.cwd(), document.filePath);
            if (fs_1.default.existsSync(absolutePath))
                fs_1.default.unlinkSync(absolutePath);
        }
        if (document.signedFilePath && document.signedFilePath.startsWith('/uploads')) {
            const absolutePath = path_1.default.join(process.cwd(), document.signedFilePath);
            if (fs_1.default.existsSync(absolutePath))
                fs_1.default.unlinkSync(absolutePath);
        }
        await client_1.default.document.delete({ where: { id } });
        res.json({ message: 'Document deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteDocument = deleteDocument;
const publishDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Document', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const document = await client_1.default.document.findUnique({ where: { id } });
        if (!document)
            return res.status(404).json({ error: 'Document not found' });
        if (document.status !== 'draft')
            return res.status(400).json({ error: 'Only drafts can be published' });
        const updated = await client_1.default.document.update({
            where: { id },
            data: { status: 'pending_signature' }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.publishDocument = publishDocument;
const generateFromTemplate = async (req, res) => {
    try {
        const { templateId, employeeId, useLetterhead } = req.body;
        const user = req.user;
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Document', 'create')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const template = await client_1.default.documentTemplate.findUnique({ where: { id: templateId } });
        if (!template)
            return res.status(404).json({ error: 'Template not found' });
        const employee = await client_1.default.employee.findUnique({
            where: { id: employeeId },
            include: { department: true, position: true, company: true }
        });
        if (!employee)
            return res.status(404).json({ error: 'Employee not found' });
        const data = {
            ...prepareDocumentData(employee),
            useLetterhead: !!useLetterhead
        };
        let pdfBuffer;
        if (template.content) {
            pdfBuffer = await pdf_service_1.PDFService.generateGenericPDF(template.content, data);
        }
        else if (template.filePath && fs_1.default.existsSync(template.filePath)) {
            const templateBuffer = fs_1.default.readFileSync(template.filePath);
            const docxBuffer = await document_service_1.DocumentGenerationService.generateDocx(templateBuffer, data);
            pdfBuffer = await document_service_1.DocumentGenerationService.convertToPdf(docxBuffer);
        }
        else {
            return res.status(500).json({ error: 'Content missing' });
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${employee.firstName}_${template.type}.pdf`);
        res.send(pdfBuffer);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.generateFromTemplate = generateFromTemplate;
// Generic Upload for Employees (Guarded by Document.create)
const uploadGenericDocument = async (req, res) => {
    try {
        const user = req.user;
        // Check Document:create permission (Employees usually have this)
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Document', 'create')) {
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
            const linkedEmployee = await client_1.default.employee.findFirst({
                where: { userId: user.id }
            });
            if (linkedEmployee)
                targetEmployeeId = linkedEmployee.id;
        }
        if (!targetEmployeeId) {
            return res.status(400).json({ error: 'Target Employee ID is required' });
        }
        // Verify validity of target employee
        const employee = await client_1.default.employee.findUnique({ where: { id: targetEmployeeId } });
        if (!employee)
            return res.status(404).json({ error: 'Employee not found' });
        const safeName = (name || 'doc').replace(/[^a-zA-Z0-9-_]/g, '_');
        const fileName = `${employee.firstName}_${safeName}_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_')}`;
        const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'documents');
        if (!fs_1.default.existsSync(uploadDir))
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        const filePath = path_1.default.join(uploadDir, fileName);
        fs_1.default.writeFileSync(filePath, req.file.buffer);
        const fileUrl = `/uploads/documents/${fileName}`;
        const document = await client_1.default.document.create({
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
            }
        });
        res.status(201).json(document);
    }
    catch (error) {
        console.error('Generic Upload Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.uploadGenericDocument = uploadGenericDocument;
const generateInstantDocument = async (req, res) => {
    try {
        const user = req.user;
        // Check permission (Use Create)
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Document', 'create')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const { recipientName, designation, subject, content, date, useLetterhead } = req.body;
        // Fetch Company Details for Header/Footer
        const company = await client_1.default.company.findUnique({ where: { id: user.companyId } });
        if (!company)
            return res.status(404).json({ error: 'Company not found' });
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
        const pdfBuffer = await pdf_service_1.PDFService.generateGenericPDF(finalContent, data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${recipientName.replace(/\s+/g, '_')}_Letter.pdf`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Instant Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.generateInstantDocument = generateInstantDocument;
//# sourceMappingURL=document.controller.js.map