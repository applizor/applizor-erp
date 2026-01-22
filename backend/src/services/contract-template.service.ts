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

    static async getTemplateById(id: string) {
        return await prisma.contractTemplate.findUnique({
            where: { id }
        });
    }

    static async updateTemplate(id: string, data: any) {
        return await prisma.contractTemplate.update({
            where: { id },
            data
        });
    }

    static async deleteTemplate(id: string) {
        return await prisma.contractTemplate.delete({ where: { id } });
    }
}
