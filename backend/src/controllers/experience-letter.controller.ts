import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PDFService } from '../services/pdf.service';

export const generateExperienceLetter = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId } = req.params;
        const companyId = req.user!.companyId;

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                department: true,
                position: true,
                company: true,
            }
        });

        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const company = employee.company || await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) return res.status(404).json({ error: 'Company not found' });

        const doj = employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
        const doe = employee.exitDate ? new Date(employee.exitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.8; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
        .title { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
        .subtitle { font-size: 14px; margin-top: 5px; }
        .content { margin-top: 40px; font-size: 14px; text-align: justify; }
        .signature { margin-top: 60px; }
        .signature-line { border-top: 1px solid #000; width: 250px; margin-top: 40px; padding-top: 8px; font-weight: bold; }
        .footer { margin-top: 50px; font-size: 11px; text-align: center; color: #666; border-top: 1px solid #ccc; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Experience Certificate</div>
        <div class="subtitle">${company.name}</div>
    </div>
    <div class="content">
        <p>This is to certify that <strong>${employee.firstName} ${employee.lastName}</strong> worked with us from <strong>${doj}</strong> to <strong>${doe}</strong>.</p>
        <p>During this period, they held the position of <strong>${employee.position?.title || 'Employee'}</strong> in the <strong>${employee.department?.name || ''}</strong> department.</p>
        <p>We found them to be sincere, hardworking, and dedicated to their work.</p>
        <p>We wish them the very best in their future endeavors.</p>
    </div>
    <div class="signature">
        <p>For ${company.name},</p>
        <div class="signature-line">Authorized Signatory</div>
    </div>
    <div class="footer">This is a computer-generated document. Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</body>
</html>`;

        const pdfBuffer = await PDFService.generateGenericPDF(html, { company, useLetterhead: !!company.letterhead });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=experience-letter-${employee.employeeId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Experience letter error:', error);
        res.status(500).json({ error: 'Failed to generate experience letter' });
    }
};
