import prisma from '../prisma/client';

export class ContractTemplateService {

    static async createTemplate(data: {
        companyId: string;
        name: string;
        description?: string;
        content: string;
    }) {
        return await prisma.contractTemplate.create({
            data
        });
    }

    static async getTemplates(companyId: string) {
        return await prisma.contractTemplate.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getTemplateById(id: string, companyId: string) {
        return await prisma.contractTemplate.findFirst({
            where: { id, companyId }
        });
    }

    static async updateTemplate(id: string, data: any, companyId: string) {
        const existing = await prisma.contractTemplate.findFirst({ where: { id, companyId } });
        if (!existing) throw new Error('Template not found');

        return await prisma.contractTemplate.update({
            where: { id },
            data
        });
    }

    static async deleteTemplate(id: string, companyId: string) {
        const existing = await prisma.contractTemplate.findFirst({ where: { id, companyId } });
        if (!existing) throw new Error('Template not found');

        return await prisma.contractTemplate.delete({ where: { id } });
    }
}
