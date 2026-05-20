import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';
import path from 'path';
import fs from 'fs';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate next certificate number: CERT-2026-0001 */
export async function generateCertificateNo(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CERT-${year}-`;

    const last = await prisma.certificate.findFirst({
        where: {
            companyId,
            certificateNo: { startsWith: prefix },
        },
        orderBy: { createdAt: 'desc' },
    });

    let nextNum = 1;
    if (last) {
        const parts = last.certificateNo.split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num)) nextNum = num + 1;
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

/** Replace {{variable}} placeholders in template content */
function renderTemplate(content: string, vars: Record<string, string>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// ─── Certificate Templates ────────────────────────────────────────────────────

export const listCertificateTemplates = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'CertificateTemplate', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for CertificateTemplate' });
        }

        const { type, isActive } = req.query;
        const where: any = { companyId: user.companyId };
        if (type) where.type = type as string;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const templates = await prisma.certificateTemplate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        res.json(templates);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch certificate templates', details: error.message });
    }
};

export const getCertificateTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'CertificateTemplate', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;
        const template = await prisma.certificateTemplate.findFirst({
            where: { id, companyId: user.companyId },
        });

        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json(template);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch template' });
    }
};

export const createCertificateTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'CertificateTemplate', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for CertificateTemplate' });
        }

        const { name, type, content, variables, isActive } = req.body;
        if (!name || !type || !content) {
            return res.status(400).json({ error: 'name, type, and content are required' });
        }

        const template = await prisma.certificateTemplate.create({
            data: {
                companyId: user.companyId,
                name,
                type,
                content,
                variables: variables ?? [],
                isActive: isActive !== false,
            },
        });

        res.status(201).json(template);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to create template', details: error.message });
    }
};

export const updateCertificateTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'CertificateTemplate', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for CertificateTemplate' });
        }

        const { id } = req.params;
        const existing = await prisma.certificateTemplate.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!existing) return res.status(404).json({ error: 'Template not found' });

        const { name, type, content, variables, isActive } = req.body;

        const updated = await prisma.certificateTemplate.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(type !== undefined && { type }),
                ...(content !== undefined && { content }),
                ...(variables !== undefined && { variables }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update template' });
    }
};

export const deleteCertificateTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'CertificateTemplate', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for CertificateTemplate' });
        }

        const { id } = req.params;
        const existing = await prisma.certificateTemplate.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!existing) return res.status(404).json({ error: 'Template not found' });

        // Check if any certificates use this template
        const certCount = await prisma.certificate.count({ where: { templateId: id } });
        if (certCount > 0) {
            // Soft: just deactivate
            await prisma.certificateTemplate.update({ where: { id }, data: { isActive: false } });
            return res.json({ message: 'Template deactivated (certificates are using it)' });
        }

        await prisma.certificateTemplate.delete({ where: { id } });
        res.json({ message: 'Template deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to delete template' });
    }
};

// ─── Certificates ─────────────────────────────────────────────────────────────

export const listCertificates = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const isStudent = user.roles?.some((r: any) => r.role?.name.toLowerCase() === 'student');

        if (!isStudent && !PermissionService.hasBasicPermission(user, 'Certificate', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Certificate' });
        }

        const { type, status, employeeId, search, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = { companyId: user.companyId };

        if (isStudent) {
            const student = await prisma.student.findFirst({
                where: { userId: user.id, companyId: user.companyId }
            });
            if (student) {
                where.studentId = student.id;
            } else {
                where.studentId = 'none';
            }
        } else {
            const scope = PermissionService.getPermissionScope(user, 'Certificate', 'read');
            if (!scope.all) {
                const employee = await prisma.employee.findFirst({
                    where: { userId: user.id, companyId: user.companyId }
                });
                if (employee) {
                    where.employeeId = employee.id;
                } else {
                    where.employeeId = 'none';
                }
            } else if (employeeId) {
                where.employeeId = employeeId as string;
            }
        }
        if (type) where.type = type as string;
        if (status) where.status = status as string;
        if (employeeId) where.employeeId = employeeId as string;
        if (search) {
            where.OR = [
                { certificateNo: { contains: search as string, mode: 'insensitive' } },
                { title: { contains: search as string, mode: 'insensitive' } },
                { courseName: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const [certificates, total] = await Promise.all([
            prisma.certificate.findMany({
                where,
                include: {
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            employeeId: true,
                            department: { select: { name: true } },
                            position: { select: { title: true } },
                        },
                    },
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            studentId: true
                        }
                    },
                    template: { select: { id: true, name: true, type: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit as string),
            }),
            prisma.certificate.count({ where }),
        ]);

        res.json({
            data: certificates,
            total,
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            totalPages: Math.ceil(total / parseInt(limit as string)),
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch certificates', details: error.message });
    }
};

export const getCertificate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'Certificate', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;
        const cert = await prisma.certificate.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                employee: {
                    select: {
                        id: true, firstName: true, lastName: true, email: true,
                        employeeId: true, phone: true, dateOfJoining: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } },
                    },
                },
                student: {
                    select: {
                        id: true, firstName: true, lastName: true, email: true,
                        studentId: true, phone: true
                    }
                },
                template: true,
                company: {
                    select: {
                        name: true, logo: true, address: true,
                        letterhead: true, continuationSheet: true,
                        pdfMarginTop: true, pdfMarginBottom: true,
                        pdfMarginLeft: true, pdfMarginRight: true,
                        pdfContinuationTop: true, digitalSignature: true,
                    },
                },
            },
        });

        if (!cert) return res.status(404).json({ error: 'Certificate not found' });
        res.json(cert);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch certificate' });
    }
};

export const createCertificate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'Certificate', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Certificate' });
        }

        const {
            type, recipientType, employeeId, candidateId, studentId, templateId,
            title, issuedDate, expiryDate,
            courseName, duration, grade, score,
            internshipRole, guideName, projectName,
            department, designation,
            customFields, remarks,
        } = req.body;

        if (!type || !title || !issuedDate) {
            return res.status(400).json({ error: 'type, title, and issuedDate are required' });
        }
        if (!employeeId && !candidateId && !studentId) {
            return res.status(400).json({ error: 'Either employeeId, candidateId, or studentId is required' });
        }

        // Validate employee belongs to this company
        if (employeeId) {
            const emp = await prisma.employee.findFirst({
                where: { id: employeeId, companyId: user.companyId },
            });
            if (!emp) return res.status(404).json({ error: 'Employee not found' });
        }

        // Validate student belongs to this company
        if (studentId) {
            const stu = await prisma.student.findFirst({
                where: { id: studentId, companyId: user.companyId },
            });
            if (!stu) return res.status(404).json({ error: 'Student not found' });
        }

        const certificateNo = await generateCertificateNo(user.companyId);

        const cert = await prisma.certificate.create({
            data: {
                companyId: user.companyId,
                certificateNo,
                type,
                recipientType: recipientType ?? 'employee',
                employeeId: employeeId ?? null,
                candidateId: candidateId ?? null,
                studentId: studentId ?? null,
                templateId: templateId ?? null,
                title,
                issuedDate: new Date(issuedDate),
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                courseName: courseName ?? null,
                duration: duration ?? null,
                grade: grade ?? null,
                score: score ?? null,
                internshipRole: internshipRole ?? null,
                guideName: guideName ?? null,
                projectName: projectName ?? null,
                department: department ?? null,
                designation: designation ?? null,
                customFields: customFields ?? null,
                status: 'draft',
                issuedById: user.id,
                remarks: remarks ?? null,
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, email: true } },
                template: { select: { id: true, name: true } },
            },
        });

        res.status(201).json(cert);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Certificate number conflict, please retry' });
        }
        res.status(500).json({ error: 'Failed to create certificate', details: error.message });
    }
};

export const updateCertificate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'Certificate', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Certificate' });
        }

        const { id } = req.params;
        const existing = await prisma.certificate.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!existing) return res.status(404).json({ error: 'Certificate not found' });
        if (existing.status === 'revoked') {
            return res.status(400).json({ error: 'Cannot edit a revoked certificate' });
        }

        const {
            title, issuedDate, expiryDate, templateId,
            courseName, duration, grade, score,
            internshipRole, guideName, projectName,
            department, designation, customFields, remarks, status,
        } = req.body;

        const updated = await prisma.certificate.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(issuedDate !== undefined && { issuedDate: new Date(issuedDate) }),
                ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
                ...(templateId !== undefined && { templateId }),
                ...(courseName !== undefined && { courseName }),
                ...(duration !== undefined && { duration }),
                ...(grade !== undefined && { grade }),
                ...(score !== undefined && { score }),
                ...(internshipRole !== undefined && { internshipRole }),
                ...(guideName !== undefined && { guideName }),
                ...(projectName !== undefined && { projectName }),
                ...(department !== undefined && { department }),
                ...(designation !== undefined && { designation }),
                ...(customFields !== undefined && { customFields }),
                ...(remarks !== undefined && { remarks }),
                ...(status !== undefined && { status }),
            },
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update certificate' });
    }
};

export const deleteCertificate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'Certificate', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Certificate' });
        }

        const { id } = req.params;
        const existing = await prisma.certificate.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!existing) return res.status(404).json({ error: 'Certificate not found' });
        if (existing.status === 'issued') {
            return res.status(400).json({ error: 'Cannot delete an issued certificate. Revoke it first.' });
        }

        // Delete PDF file if exists
        if (existing.pdfPath) {
            const fullPath = path.join(process.cwd(), 'uploads', existing.pdfPath);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }

        await prisma.certificate.delete({ where: { id } });
        res.json({ message: 'Certificate deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to delete certificate' });
    }
};

export const revokeCertificate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'Certificate', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;
        const { reason } = req.body;

        const existing = await prisma.certificate.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!existing) return res.status(404).json({ error: 'Certificate not found' });
        if (existing.status === 'revoked') {
            return res.status(400).json({ error: 'Certificate is already revoked' });
        }

        const updated = await prisma.certificate.update({
            where: { id },
            data: {
                status: 'revoked',
                remarks: reason ? `[REVOKED] ${reason}` : '[REVOKED]',
            },
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to revoke certificate' });
    }
};

export const issueCertificate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'Certificate', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;
        const existing = await prisma.certificate.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!existing) return res.status(404).json({ error: 'Certificate not found' });
        if (existing.status === 'issued') {
            return res.status(400).json({ error: 'Certificate already issued' });
        }

        const updated = await prisma.certificate.update({
            where: { id },
            data: { status: 'issued' },
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to issue certificate' });
    }
};

export const generateCertificatePDF = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'Certificate', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;
        const cert = await prisma.certificate.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                employee: true,
                student: true,
                template: true,
                company: true,
            },
        });
        if (!cert) return res.status(404).json({ error: 'Certificate not found' });

        // Build variables for template rendering
        const emp = cert.employee;
        const stu = cert.student;
        const recipientName = stu ? `${stu.firstName} ${stu.lastName}` : (emp ? `${emp.firstName} ${emp.lastName}` : '');
        const doj = emp?.dateOfJoining
            ? new Date(emp.dateOfJoining).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
            : '';
        const issuedDate = new Date(cert.issuedDate).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'long', year: 'numeric',
        });

        const variables: Record<string, string> = {
            employee_name: recipientName,
            student_name: stu ? `${stu.firstName} ${stu.lastName}` : '',
            recipient_name: recipientName,
            student_id: stu?.studentId ?? '',
            employee_id: stu?.studentId ?? (emp?.employeeId ?? ''),
            student_email: stu?.email ?? '',
            employee_email: stu?.email ?? (emp?.email ?? ''),
            issued_date: issuedDate,
            certificate_no: cert.certificateNo,
            company_name: cert.company.name,
            course_name: cert.courseName ?? '',
            duration: cert.duration ?? '',
            grade: cert.grade ?? '',
            score: cert.score ?? '',
            internship_role: cert.internshipRole ?? '',
            guide_name: cert.guideName ?? '',
            project_name: cert.projectName ?? '',
            department: cert.department ?? '',
            designation: cert.designation ?? '',
            date_of_joining: doj,
            title: cert.title,
            ...(cert.customFields ? cert.customFields as Record<string, string> : {}),
        };

        // Use template content or a default HTML
        let htmlContent = cert.template?.content ?? getDefaultTemplate(cert.type);
        htmlContent = renderTemplate(htmlContent, variables);

        // Generate PDF via Gotenberg
        try {
            const GOTENBERG_URL = process.env.GOTENBERG_URL ?? 'http://gotenberg:3000';
            const FormData = (await import('form-data')).default;
            const axios = (await import('axios')).default;

            const company = cert.company;
            let css = `
                @page {
                    margin: ${company.pdfContinuationTop}px ${company.pdfMarginRight}px ${company.pdfMarginBottom}px ${company.pdfMarginLeft}px;
                }
                @page :first {
                    margin-top: ${company.pdfMarginTop}px;
                }
                body { font-family: Arial, sans-serif; font-size: 14px; }
            `;

            const fullHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${css}</style></head>
<body>${htmlContent}</body>
</html>`;

            const form = new FormData();
            form.append('files', Buffer.from(fullHtml), { filename: 'index.html', contentType: 'text/html' });

            const pdfResponse = await axios.post(
                `${GOTENBERG_URL}/forms/chromium/convert/html`,
                form,
                { headers: form.getHeaders(), responseType: 'arraybuffer', timeout: 30000 },
            );

            // Save PDF
            const uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
            fs.mkdirSync(uploadsDir, { recursive: true });
            const fileName = `${cert.certificateNo.replace(/[^a-zA-Z0-9-]/g, '_')}_${Date.now()}.pdf`;
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, Buffer.from(pdfResponse.data));

            const pdfPath = `certificates/${fileName}`;

            // Old PDF cleanup
            if (cert.pdfPath) {
                const oldPath = path.join(process.cwd(), 'uploads', cert.pdfPath);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            await prisma.certificate.update({ where: { id }, data: { pdfPath } });

            return res.json({ success: true, pdfPath, message: 'PDF generated successfully' });
        } catch (pdfError: any) {
            console.error('PDF generation error:', pdfError.message);
            return res.status(500).json({ error: 'PDF generation failed', details: pdfError.message });
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to generate certificate PDF', details: error.message });
    }
};

export const downloadCertificatePDF = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'Certificate', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;
        const cert = await prisma.certificate.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!cert) return res.status(404).json({ error: 'Certificate not found' });
        if (!cert.pdfPath) return res.status(404).json({ error: 'PDF not generated yet. Generate PDF first.' });

        const fullPath = path.join(process.cwd(), 'uploads', cert.pdfPath);
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'PDF file not found on server' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${cert.certificateNo}.pdf"`);
        fs.createReadStream(fullPath).pipe(res);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to download PDF' });
    }
};

export const sendCertificateEmail = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!PermissionService.hasBasicPermission(user, 'Certificate', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;
        const cert = await prisma.certificate.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                employee: { select: { firstName: true, lastName: true, email: true } },
                student: { select: { firstName: true, lastName: true, email: true } },
                company: { select: { name: true } },
            },
        });
        if (!cert) return res.status(404).json({ error: 'Certificate not found' });
        if (!cert.pdfPath) return res.status(400).json({ error: 'Generate PDF first before sending email' });

        const recipientEmail = cert.student?.email || cert.employee?.email;
        if (!recipientEmail) return res.status(400).json({ error: 'Recipient email not found' });

        const pdfPath = path.join(process.cwd(), 'uploads', cert.pdfPath);
        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({ error: 'PDF file not found. Regenerate PDF first.' });
        }

        // Use existing email service
        const { sendEmail } = await import('../services/email.service');

        const recipientName = cert.student ? `${cert.student.firstName} ${cert.student.lastName}` : (cert.employee ? `${cert.employee.firstName} ${cert.employee.lastName}` : 'Recipient');
        const subject = `Your ${cert.title} — ${cert.company.name}`;
        const body = `
            <p>Dear ${recipientName},</p>
            <p>Please find attached your <strong>${cert.title}</strong> (Certificate No: <strong>${cert.certificateNo}</strong>).</p>
            <p>Issued by: <strong>${cert.company.name}</strong></p>
            <p>Issue Date: <strong>${new Date(cert.issuedDate).toLocaleDateString('en-IN')}</strong></p>
            <br/>
            <p>Regards,<br/>${cert.company.name}</p>
        `;

        await sendEmail(
            recipientEmail,
            subject,
            body,
            [{ filename: `${cert.certificateNo}.pdf`, path: pdfPath }]
        );

        await prisma.certificate.update({ where: { id }, data: { emailSentAt: new Date() } });

        res.json({ success: true, message: `Certificate emailed to ${recipientEmail}` });
    } catch (error: any) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
};

// ─── Default Templates ────────────────────────────────────────────────────────

function getDefaultTemplate(type: string): string {
    const styles = `
        <style>
            body { font-family: Georgia, serif; color: #1a1a2e; margin: 0; padding: 40px; }
            .cert-border { border: 8px double #c8a951; padding: 40px; min-height: 500px; text-align: center; }
            .cert-title { font-size: 36px; font-weight: bold; color: #1a1a2e; margin: 20px 0 10px; letter-spacing: 2px; }
            .cert-subtitle { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 4px; }
            .cert-name { font-size: 28px; color: #c8a951; font-style: italic; margin: 30px 0; border-bottom: 2px solid #c8a951; display: inline-block; padding-bottom: 8px; }
            .cert-body { font-size: 15px; line-height: 1.8; margin: 20px 40px; color: #333; }
            .cert-footer { margin-top: 60px; display: flex; justify-content: space-around; }
            .cert-sign { text-align: center; }
            .cert-sign-line { width: 160px; border-top: 1px solid #333; margin: 0 auto 6px; }
            .cert-sign-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
            .cert-no { font-size: 11px; color: #999; margin-top: 30px; }
            .cert-date { font-size: 13px; color: #555; margin: 10px 0; }
            .badge { display: inline-block; background: #1a1a2e; color: #c8a951; padding: 6px 20px; border-radius: 4px; font-size: 13px; margin: 10px 0; }
        </style>
    `;

    if (type === 'course') {
        return `${styles}
<div class="cert-border">
    <div class="cert-subtitle">Certificate of Completion</div>
    <div class="cert-title">{{company_name}}</div>
    <p class="cert-body">This is to certify that</p>
    <div class="cert-name">{{employee_name}}</div>
    <p class="cert-body">
        has successfully completed the course<br/>
        <strong>{{course_name}}</strong><br/>
        with a duration of <strong>{{duration}}</strong>
        <span id="grade-block">and was awarded a grade of <strong>{{grade}}</strong></span>.
    </p>
    <div class="badge">Score: {{score}}</div>
    <p class="cert-date">Issued on: {{issued_date}}</p>
    <div class="cert-footer">
        <div class="cert-sign">
            <div class="cert-sign-line"></div>
            <div class="cert-sign-label">Authorized Signatory</div>
        </div>
        <div class="cert-sign">
            <div class="cert-sign-line"></div>
            <div class="cert-sign-label">Date</div>
        </div>
    </div>
    <p class="cert-no">Certificate No: {{certificate_no}}</p>
</div>`;
    }

    if (type === 'internship') {
        return `${styles}
<div class="cert-border">
    <div class="cert-subtitle">Certificate of Internship</div>
    <div class="cert-title">{{company_name}}</div>
    <p class="cert-body">This is to certify that</p>
    <div class="cert-name">{{employee_name}}</div>
    <p class="cert-body">
        has successfully completed an internship as <strong>{{internship_role}}</strong><br/>
        working on the project <strong>{{project_name}}</strong><br/>
        for a duration of <strong>{{duration}}</strong>.<br/>
        Under the guidance of <strong>{{guide_name}}</strong>.
    </p>
    <p class="cert-body">We wish them the very best in their future endeavours.</p>
    <p class="cert-date">Issued on: {{issued_date}}</p>
    <div class="cert-footer">
        <div class="cert-sign">
            <div class="cert-sign-line"></div>
            <div class="cert-sign-label">Authorized Signatory</div>
        </div>
        <div class="cert-sign">
            <div class="cert-sign-line"></div>
            <div class="cert-sign-label">HR Manager</div>
        </div>
    </div>
    <p class="cert-no">Certificate No: {{certificate_no}}</p>
</div>`;
    }

    if (type === 'experience') {
        return `${styles}
<div style="padding: 40px; font-family: Arial, sans-serif;">
    <h2 style="text-align:center; text-transform:uppercase; letter-spacing:3px; color:#1a1a2e;">Experience Letter</h2>
    <p><strong>Date:</strong> {{issued_date}}</p>
    <p><strong>To Whomsoever It May Concern</strong></p>
    <br/>
    <p>
        This is to certify that <strong>{{employee_name}}</strong> (Employee ID: {{employee_id}}) 
        was employed with <strong>{{company_name}}</strong> in the capacity of 
        <strong>{{designation}}</strong> in the <strong>{{department}}</strong> Department.
    </p>
    <p>
        {{employee_name}} joined us on <strong>{{date_of_joining}}</strong> and 
        worked with us till <strong>{{issued_date}}</strong>.
    </p>
    <p>
        During their tenure, {{employee_name}} proved to be a dedicated and hardworking professional. 
        We wish them all the best in their future endeavours.
    </p>
    <br/>
    <p>Regards,</p>
    <br/><br/>
    <p><strong>Authorized Signatory</strong></p>
    <p>{{company_name}}</p>
    <p style="font-size:11px; color:#999; margin-top:40px;">Ref: {{certificate_no}}</p>
</div>`;
    }

    // custom / default
    return `${styles}
<div class="cert-border">
    <div class="cert-subtitle">{{company_name}}</div>
    <div class="cert-title">{{title}}</div>
    <p class="cert-body">This is to certify that</p>
    <div class="cert-name">{{employee_name}}</div>
    <p class="cert-body">has successfully fulfilled all requirements for this certificate.</p>
    <p class="cert-date">Issued on: {{issued_date}}</p>
    <div class="cert-footer">
        <div class="cert-sign">
            <div class="cert-sign-line"></div>
            <div class="cert-sign-label">Authorized Signatory</div>
        </div>
    </div>
    <p class="cert-no">Certificate No: {{certificate_no}}</p>
</div>`;
}
