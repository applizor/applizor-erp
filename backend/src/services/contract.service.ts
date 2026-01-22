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

    static async getContractById(id: string) {
        return await prisma.contract.findUnique({
            where: { id },
            include: {
                client: true,
                company: true,
                project: true,
                creator: true
            }
        });
    }

    static async updateContract(id: string, data: any) {
        // Prevent editing if already signed
        const existing = await prisma.contract.findUnique({ where: { id } });
        if (existing?.status === 'signed') {
            throw new Error('Cannot edit a signed contract');
        }

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

        // In a real app, upload PDF to S3/Storage and save URL.
        // For MVP, we might store base64 or just regenerate on fly.
        // Let's assume we just regenerate on fly for now or store path if we had storage.

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
        return await prisma.contract.delete({ where: { id } });
    }
}
