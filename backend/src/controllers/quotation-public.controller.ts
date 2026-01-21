import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';
import { v4 as uuidv4 } from 'uuid';

// Generate Public Link for Quotation
export const generatePublicLink = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { expiresInDays = 30 } = req.body;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Verify access to quotation
        const scopeFilter = await PermissionService.getScopedWhereClause(
            user, 'Quotation', 'update', 'Quotation', 'createdBy', 'assignedTo'
        );

        const quotation = await prisma.quotation.findFirst({
            where: { AND: [{ id }, scopeFilter] }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found or access denied' });
        }

        // Generate unique token
        const publicToken = uuidv4();
        const publicExpiresAt = new Date();
        publicExpiresAt.setDate(publicExpiresAt.getDate() + expiresInDays);

        // Update quotation
        const updated = await prisma.quotation.update({
            where: { id },
            data: {
                publicToken,
                publicExpiresAt,
                isPublicEnabled: true,
                status: 'sent'  // Mark as sent when public link is generated
            }
        });

        // Generate public URL
        const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/quotations/${publicToken}`;

        res.json({
            message: 'Public link generated successfully',
            publicToken,
            publicUrl,
            expiresAt: publicExpiresAt
        });
    } catch (error: any) {
        console.error('Generate public link error:', error);
        res.status(500).json({ error: 'Failed to generate public link', details: error.message });
    }
};

// Revoke Public Link
export const revokePublicLink = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Verify access
        const scopeFilter = await PermissionService.getScopedWhereClause(
            user, 'Quotation', 'update', 'Quotation', 'createdBy', 'assignedTo'
        );

        const quotation = await prisma.quotation.findFirst({
            where: { AND: [{ id }, scopeFilter] }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found or access denied' });
        }

        // Revoke link
        await prisma.quotation.update({
            where: { id },
            data: {
                isPublicEnabled: false,
                publicToken: null,
                publicExpiresAt: null
            }
        });

        res.json({ message: 'Public link revoked successfully' });
    } catch (error: any) {
        console.error('Revoke public link error:', error);
        res.status(500).json({ error: 'Failed to revoke public link', details: error.message });
    }
};

// Get Quotation by Public Token (No Auth Required)
export const getQuotationByToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const quotation = await prisma.quotation.findFirst({
            where: {
                publicToken: token,
                isPublicEnabled: true
            },
            include: {
                items: true,
                lead: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                        legalName: true,
                        email: true,
                        phone: true,
                        address: true,
                        city: true,
                        state: true,
                        country: true,
                        pincode: true,
                        gstin: true,
                        logo: true
                    }
                }
            }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found or link expired' });
        }

        // Check expiration
        if (quotation.publicExpiresAt && new Date() > quotation.publicExpiresAt) {
            // Mark as expired
            await prisma.quotation.update({
                where: { id: quotation.id },
                data: { status: 'expired', isPublicEnabled: false }
            });
            return res.status(410).json({ error: 'This quotation link has expired' });
        }

        // Capture Analytics Data
        const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Update View Statistics & Activity Log
        // We use a transaction to ensure both happen or neither
        await prisma.$transaction(async (tx) => {
            // 1. Update Quotation Stats
            await tx.quotation.update({
                where: { id: quotation.id },
                data: {
                    viewCount: { increment: 1 },
                    lastViewedAt: new Date(),
                    // Mark as viewed status if not already (first time view)
                    ...(quotation.status === 'sent' ? {
                        status: 'viewed',
                        clientViewedAt: new Date()
                    } : {})
                }
            });

            // 2. Log Activity
            await tx.quotationActivity.create({
                data: {
                    quotationId: quotation.id,
                    type: 'VIEWED',
                    ipAddress,
                    userAgent,
                    deviceType: userAgent.toLowerCase().includes('mobile') ? 'Mobile' : 'Desktop', // Simple check
                    browser: 'Browser' // Can be parsed more detailed if needed, but simple is fine for now
                }
            });
        });

        res.json({ quotation });
    } catch (error: any) {
        console.error('Get quotation by token error:', error);
        res.status(500).json({ error: 'Failed to fetch quotation', details: error.message });
    }
};

// Client Accept Quotation
export const acceptQuotation = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { signature, email, name, comments } = req.body;

        // Validate required fields
        if (!signature || !email || !name) {
            return res.status(400).json({ error: 'Signature, email, and name are required' });
        }

        const quotation = await prisma.quotation.findFirst({
            where: {
                publicToken: token,
                isPublicEnabled: true
            }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found or link expired' });
        }

        // Check expiration
        if (quotation.publicExpiresAt && new Date() > quotation.publicExpiresAt) {
            return res.status(410).json({ error: 'This quotation link has expired' });
        }

        // Check if already accepted/rejected
        if (quotation.clientAcceptedAt) {
            return res.status(400).json({ error: 'This quotation has already been accepted' });
        }
        if (quotation.clientRejectedAt) {
            return res.status(400).json({ error: 'This quotation has already been rejected' });
        }

        // Update quotation
        const updated = await prisma.quotation.update({
            where: { id: quotation.id },
            data: {
                clientAcceptedAt: new Date(),
                clientSignature: signature,
                clientEmail: email,
                clientName: name,
                clientComments: comments || null,
                status: 'accepted'
            },
            include: {
                lead: true,
                company: true
            }
        });

        // Send acceptance emails
        try {
            const { sendQuotationAcceptanceToClient, sendQuotationAcceptanceToCompany } = await import('../services/email.service');

            // Send to signature email (the email client entered during acceptance)
            await sendQuotationAcceptanceToClient(updated);

            // Also send to original lead email if different from signature email
            if (updated.lead?.email && updated.lead.email !== email) {
                await sendQuotationAcceptanceToClient({
                    ...updated,
                    clientEmail: updated.lead.email,
                    clientName: updated.lead.name
                });
            }

            // Send notification to company
            await sendQuotationAcceptanceToCompany(updated);
        } catch (emailError) {
            console.error('Failed to send acceptance emails:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            message: 'Quotation accepted successfully',
            quotation: updated
        });
    } catch (error: any) {
        console.error('Accept quotation error:', error);
        res.status(500).json({ error: 'Failed to accept quotation', details: error.message });
    }
};

// Client Reject Quotation
export const rejectQuotation = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { email, name, comments } = req.body;

        // Validate required fields
        if (!email || !name) {
            return res.status(400).json({ error: 'Email and name are required' });
        }

        const quotation = await prisma.quotation.findFirst({
            where: {
                publicToken: token,
                isPublicEnabled: true
            }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found or link expired' });
        }

        // Check expiration
        if (quotation.publicExpiresAt && new Date() > quotation.publicExpiresAt) {
            return res.status(410).json({ error: 'This quotation link has expired' });
        }

        // Check if already accepted/rejected
        if (quotation.clientAcceptedAt) {
            return res.status(400).json({ error: 'This quotation has already been accepted' });
        }
        if (quotation.clientRejectedAt) {
            return res.status(400).json({ error: 'This quotation has already been rejected' });
        }

        // Update quotation
        const updated = await prisma.quotation.update({
            where: { id: quotation.id },
            data: {
                clientRejectedAt: new Date(),
                clientEmail: email,
                clientName: name,
                clientComments: comments || null,
                status: 'rejected'
            },
            include: {
                company: true
            }
        });

        // Send rejection notification email to company
        try {
            const { sendQuotationRejectionToCompany } = await import('../services/email.service');
            await sendQuotationRejectionToCompany(updated);
        } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            message: 'Quotation rejected',
            quotation: updated
        });
    } catch (error: any) {
        console.error('Reject quotation error:', error);
        res.status(500).json({ error: 'Failed to reject quotation', details: error.message });
    }
};

// Download Signed Quotation PDF (Public - No Auth Required)
export const downloadSignedQuotationPDFPublic = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const quotation = await prisma.quotation.findFirst({
            where: {
                publicToken: token,
                isPublicEnabled: true
            },
            include: {
                items: true,
                lead: true,
                company: true
            }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found or link expired' });
        }

        // Check expiration
        if (quotation.publicExpiresAt && new Date() > quotation.publicExpiresAt) {
            return res.status(410).json({ error: 'This quotation link has expired' });
        }

        // Check if quotation has been accepted
        if (!quotation.clientAcceptedAt || !quotation.clientSignature) {
            return res.status(400).json({ error: 'Quotation has not been accepted by client yet' });
        }

        // Import PDF service dynamically
        const { PDFService } = await import('../services/pdf.service');

        // Generate signed PDF
        const pdfBuffer = await PDFService.generateSignedQuotationPDF({
            quotationNumber: quotation.quotationNumber,
            quotationDate: quotation.quotationDate,
            validUntil: quotation.validUntil || undefined,
            company: {
                name: quotation.company.name,
                logo: quotation.company.logo || undefined,
                address: quotation.company.address || undefined,
                city: quotation.company.city || undefined,
                state: quotation.company.state || undefined,
                country: quotation.company.country,
                pincode: quotation.company.pincode || undefined,
                email: quotation.company.email || undefined,
                phone: quotation.company.phone || undefined,
                gstin: quotation.company.gstin || undefined
            },
            lead: quotation.lead ? {
                name: quotation.lead.name,
                company: quotation.lead.company || undefined,
                email: quotation.lead.email || undefined,
                phone: quotation.lead.phone || undefined
            } : undefined,
            items: quotation.items.map(item => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice)
            })),
            subtotal: Number(quotation.subtotal),
            tax: Number(quotation.tax),
            discount: Number(quotation.discount),
            total: Number(quotation.total),
            currency: quotation.currency,
            notes: quotation.notes || undefined,
            clientSignature: quotation.clientSignature,
            clientName: quotation.clientName || undefined,
            clientAcceptedAt: quotation.clientAcceptedAt
        });

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Quotation-${quotation.quotationNumber}-Signed.pdf"`);
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Download signed quotation PDF (public) error:', error);
        res.status(500).json({ error: 'Failed to generate signed PDF', details: error.message });
    }
};
