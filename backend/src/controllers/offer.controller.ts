import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { PDFService } from '../services/pdf.service';

const prisma = new PrismaClient();

// Create Offer
export const createOffer = async (req: AuthRequest, res: Response) => {
    try {
        const { candidateId, position, department, salary, startDate, templateId } = req.body;

        // Check if offer already exists
        const existingOffer = await prisma.offerLetter.findUnique({
            where: { candidateId }
        });

        if (existingOffer) {
            return res.status(400).json({ error: 'Offer letter already exists for this candidate' });
        }

        const offer = await prisma.offerLetter.create({
            data: {
                candidateId,
                position,
                department,
                salary: Number(salary),
                startDate: new Date(startDate),
                templateId, // Save selected template
                status: 'pending'
            }
        });

        // Update candidate status
        await prisma.candidate.update({
            where: { id: candidateId },
            data: {
                status: 'offer',
                currentStage: 'Offer Generated'
            }
        });

        res.status(201).json(offer);
    } catch (error) {
        console.error('Create offer error:', error);
        res.status(500).json({ error: 'Failed to create offer' });
    }
};

// Get Offer by Candidate ID
export const getOffer = async (req: AuthRequest, res: Response) => {
    try {
        const { candidateId } = req.params;

        const offer = await prisma.offerLetter.findUnique({
            where: { candidateId }
        });

        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        res.json(offer);
    } catch (error) {
        console.error('Get offer error:', error);
        res.status(500).json({ error: 'Failed to fetch offer' });
    }
};

// Update Offer Status
export const updateOfferStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // sent, accepted, rejected

        const offer = await prisma.offerLetter.update({
            where: { id },
            data: { status }
        });

        // If accepted, candidate is Hired
        if (status === 'accepted') {
            await prisma.candidate.update({
                where: { id: offer.candidateId },
                data: { status: 'hired', currentStage: 'Hired' }
            });
        }
        // If rejected, candidate is Rejected
        else if (status === 'rejected') {
            await prisma.candidate.update({
                where: { id: offer.candidateId },
                data: { status: 'rejected', currentStage: 'Offer Rejected' }
            });
        }

        res.json(offer);
    } catch (error) {
        console.error('Update offer status error:', error);
        res.status(500).json({ error: 'Failed to update offer status' });
    }
};

// Generate and Download Offer Letter PDF
export const downloadOfferLetter = async (req: AuthRequest, res: Response) => {
    try {
        const { candidateId } = req.params;
        const user = req.user;
        if (!user || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        // 1. Fetch Offer Details
        const offer = await prisma.offerLetter.findUnique({
            where: { candidateId },
            include: { candidate: true }
        });

        if (!offer) return res.status(404).json({ error: 'Offer not found for this candidate' });

        // 2. Fetch Company (for Letterhead)
        const company = await prisma.company.findUnique({
            where: { id: user.companyId }
        });

        if (!company) return res.status(404).json({ error: 'Company not found' });

        // 3. Fetch Selected Document Template
        let htmlContent = '';
        let template = null;

        if (offer.templateId) {
            template = await prisma.documentTemplate.findUnique({
                where: { id: offer.templateId }
            });
        }

        // Fallback to latest offer-letter template if no specific template selected
        if (!template) {
            template = await prisma.documentTemplate.findFirst({
                where: {
                    companyId: user.companyId,
                    type: 'Offer Letter',
                    isActive: true
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        if (template) {
            htmlContent = template.content || '';
        } else {
            // Fallback Standard Template
            htmlContent = `
                <div style="font-family: 'Inter', sans-serif; padding: 40px; color: #333;">
                    <h1 style="text-align: center; color: #1e40af; margin-bottom: 40px;">OFFER OF EMPLOYMENT</h1>
                    <p>Date: <strong>${new Date().toLocaleDateString()}</strong></p>
                    <p>Dear <strong>[EMPLOYEE_NAME]</strong>,</p>
                    <p>We are pleased to offer you the position of <strong>[DESIGNATION]</strong> at <strong>[COMPANY_NAME]</strong>.</p>
                    <p>Your annual cost to company (CTC) will be <strong>[CTC_ANNUAL]</strong>.</p>
                    <p>We look forward to welcoming you to the team on <strong>[JOINING_DATE]</strong>.</p>
                    <br><br>
                    <p>Sincerely,</p>
                    <p><strong>[COMPANY_NAME]</strong></p>
                </div>
            `;
        }

        // 4. Variable Replacement Preparation
        const data = {
            company: company,
            useLetterhead: true, // FORCE LETTERHEAD as per user rule
            employee: {
                firstName: offer.candidate.firstName,
                lastName: offer.candidate.lastName,
                position: { title: offer.position || '' },
                department: { name: offer.department || '' },
                salary: Number(offer.salary),
                dateOfJoining: offer.startDate
            }
        };

        // 5. Generate PDF
        const pdfBuffer = await PDFService.generateGenericPDF(htmlContent, data);

        // 6. Return PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Offer_Letter_${offer.candidate.firstName}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Download Offer Letter error:', error);
        res.status(500).json({ error: 'Failed to generate Offer Letter' });
    }
};
