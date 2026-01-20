"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFromTemplate = exports.healthCheck = exports.generateDocument = void 0;
const document_service_1 = require("../services/document.service");
const fs_1 = __importDefault(require("fs"));
const generateDocument = async (req, res) => {
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
            }
            catch (e) {
                return res.status(400).json({ error: 'Invalid proprietary JSON data' });
            }
        }
        // 3. Generate DOCX
        const docxBuffer = await document_service_1.DocumentGenerationService.generateDocx(req.file.buffer, data);
        // 4. Convert to PDF
        // Note: For dev/test, we might skip conversion if Gotenberg is not ready, but we aim for E2E.
        const pdfBuffer = await document_service_1.DocumentGenerationService.convertToPdf(docxBuffer);
        // 5. Letterhead (Optional - mock for now)
        // const finalPdf = await DocumentGenerationService.applyLetterhead(pdfBuffer, null, 'NONE');
        // 6. Return PDF
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
const client_1 = __importDefault(require("../prisma/client"));
const generateFromTemplate = async (req, res) => {
    try {
        const { templateId, employeeId } = req.body;
        if (!templateId || !employeeId) {
            return res.status(400).json({ error: 'templateId and employeeId are required' });
        }
        // 1. Fetch Template
        const template = await client_1.default.documentTemplate.findUnique({ where: { id: templateId } });
        if (!template)
            return res.status(404).json({ error: 'Template not found' });
        // 2. Fetch Employee
        const employee = await client_1.default.employee.findUnique({
            where: { id: employeeId },
            include: { department: true, position: true, company: true }
        });
        if (!employee)
            return res.status(404).json({ error: 'Employee not found' });
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
        if (!fs_1.default.existsSync(template.filePath)) {
            return res.status(500).json({ error: 'Template file missing on server' });
        }
        const templateBuffer = fs_1.default.readFileSync(template.filePath);
        // 5. Generate
        const docxBuffer = await document_service_1.DocumentGenerationService.generateDocx(templateBuffer, data);
        const pdfBuffer = await document_service_1.DocumentGenerationService.convertToPdf(docxBuffer);
        // 6. Apply Letterhead (Future)
        // const finalPdf = await DocumentGenerationService.applyLetterhead(pdfBuffer, ...);
        // Audit Log
        const { logAction } = await Promise.resolve().then(() => __importStar(require('../services/audit.service')));
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
    }
    catch (error) {
        console.error('Template Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.generateFromTemplate = generateFromTemplate;
//# sourceMappingURL=document.controller.js.map