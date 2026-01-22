import prisma from '../prisma/client';
import { PDFService } from './pdf.service';

export class ContractService {

    static async createContract(data: {
        companyId: string;
        clientId: string;
        projectId?: string;
        creatorId: string;
        title: string;
        content: string;
        validFrom?: Date;
        validUntil?: Date;
        templateId?: string;
    }) {
        return await prisma.contract.create({
            data: {
                ...data,
                status: 'draft'
            }
        });
    }

    static async getContracts(companyId: string, filters?: any) {
        return await prisma.contract.findMany({
            where: {
                companyId,
                ...filters
            },
            include: {
                client: { select: { name: true, company: true, email: true } },
                project: { select: { name: true } },
                creator: { select: { firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async logActivity(data: {
        contractId: string;
        type: string;
        ipAddress?: string;
        userAgent?: string;
        metadata?: any;
    }) {
        // Log to database
        await prisma.contractActivity.create({
            data: {
                contractId: data.contractId,
                type: data.type,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                metadata: data.metadata || {}
            }
        });

        // Update counters if applicable
        if (data.type === 'VIEWED') {
            await prisma.contract.update({
                where: { id: data.contractId },
                data: {
                    viewCount: { increment: 1 },
                    lastViewedAt: new Date()
                }
            });
        } else if (data.type === 'EMAIL_OPENED') {
            await prisma.contract.update({
                where: { id: data.contractId },
                data: {
                    emailOpens: { increment: 1 },
                    lastEmailOpenedAt: new Date()
                }
            });
        }
    }

    static async getContractById(id: string) {
        return await prisma.contract.findUnique({
            where: { id },
            include: {
                client: true,
                company: true,
                project: true,
                creator: true,
                activities: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }

    static async updateContract(id: string, data: any) {
        // Prevent editing if already signed
        const existing = await prisma.contract.findUnique({ where: { id } });
        if (existing?.status === 'signed') {
            throw new Error('Cannot edit a signed contract');
        }

        // If status is sent, we allow editing but maybe we should warn? 
        // User explicitly asked for this feature.

        return await prisma.contract.update({
            where: { id },
            data
        });
    }

    static async signContract(id: string, signatureData: {
        signature: string; // Base64
        ip: string;
        name: string;
    }) {
        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                company: true,
                client: true
            }
        });

        if (!contract) throw new Error('Contract not found');
        if (contract.status === 'signed') throw new Error('Contract already signed');

        const signedAt = new Date();

        // Log the signing activity
        await this.logActivity({
            contractId: id,
            type: 'SIGNED',
            ipAddress: signatureData.ip,
            metadata: { name: signatureData.name }
        });

        // Generate PDF with Signature
        const pdfBuffer = await PDFService.generateContractPDF({
            id: contract.id,
            title: contract.title,
            content: contract.content,
            date: contract.createdAt,
            company: contract.company,
            client: contract.client,
            clientSignature: signatureData.signature,
            signerIp: signatureData.ip,
            signedAt: signedAt
        });

        return await prisma.contract.update({
            where: { id },
            data: {
                status: 'signed',
                clientSignature: signatureData.signature,
                signerIp: signatureData.ip,
                signerName: signatureData.name,
                signedAt: signedAt
            }
        });
    }

    static async deleteContract(id: string) {
        // Also delete activities (cascade should handle it but good to be explicit if needed, here cascade is set)
        return await prisma.contract.delete({ where: { id } });
    }
}
