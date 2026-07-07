import prisma from '../prisma/client';

export class CoaTemplateService {
  static async listTemplates(countryId?: string) {
    const where: any = { isActive: true };
    if (countryId) where.countryId = countryId;
    return prisma.coaTemplate.findMany({
      where,
      include: { country: { select: { name: true, code: true } }, _count: { select: { entries: true } } },
      orderBy: [{ countryId: 'asc' }, { version: 'desc' }],
    });
  }

  static async getTemplate(id: string) {
    return prisma.coaTemplate.findUnique({
      where: { id },
      include: { entries: { where: { isActive: true }, orderBy: { code: 'asc' } }, country: { select: { name: true, code: true } } },
    });
  }

  static async createTemplate(data: { countryId: string; name: string; version: string; entries?: { code: string; name: string; type: string; parentCode?: string; description?: string }[] }) {
    const template = await prisma.coaTemplate.create({
      data: {
        countryId: data.countryId,
        name: data.name,
        version: data.version,
        entries: data.entries ? { create: data.entries } : undefined,
      },
      include: { entries: true },
    });
    return template;
  }

  static async addEntry(templateId: string, data: { code: string; name: string; type: string; parentCode?: string; description?: string }) {
    const entry = await prisma.coaTemplateEntry.create({
      data: { templateId, ...data },
    });
    return entry;
  }

  static async removeEntry(id: string) {
    await prisma.coaTemplateEntry.update({ where: { id }, data: { isActive: false } });
  }

  static async deactivateTemplate(id: string) {
    await prisma.coaTemplate.update({ where: { id }, data: { isActive: false } });
  }

  static async applyTemplate(templateId: string, companyId: string) {
    const template = await prisma.coaTemplate.findUnique({
      where: { id: templateId },
      include: { entries: { where: { isActive: true } } },
    });

    if (!template) throw new Error('Template not found');

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const entry of template.entries) {
      const existing = await prisma.ledgerAccount.findFirst({
        where: { companyId, code: entry.code },
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      try {
        await prisma.ledgerAccount.create({
          data: {
            companyId,
            code: entry.code,
            name: entry.name,
            type: entry.type,
          },
        });
        results.created++;
      } catch (error: any) {
        results.errors.push(`${entry.code} ${entry.name}: ${error.message}`);
      }
    }

    // Update company defaults
    await prisma.company.update({
      where: { id: companyId },
      data: { currency: template.countryId === (await prisma.country.findUnique({ where: { code: 'IN' } }))?.id ? 'INR' : 'USD' },
    });

    return results;
  }
}
