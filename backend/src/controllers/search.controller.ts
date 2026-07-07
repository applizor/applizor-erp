import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';

export const globalSearch = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const q = (req.query.q as string || '').trim();

        if (!q || q.length < 2) {
            return res.json({ results: [] });
        }

        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const [employees, clients, invoices, documents, leads] = await Promise.all([
            prisma.employee.findMany({
                where: {
                    companyId,
                    OR: [
                        { firstName: { contains: q, mode: 'insensitive' } },
                        { lastName: { contains: q, mode: 'insensitive' } },
                        { employeeId: { contains: q, mode: 'insensitive' } },
                        { email: { contains: q, mode: 'insensitive' } },
                        { phone: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, firstName: true, lastName: true, employeeId: true, email: true, positionId: true },
                take: 5,
            }),

            prisma.client.findMany({
                where: {
                    companyId,
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { companyName: { contains: q, mode: 'insensitive' } },
                        { email: { contains: q, mode: 'insensitive' } },
                        { phone: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, name: true, companyName: true, email: true },
                take: 5,
            }),

            prisma.invoice.findMany({
                where: {
                    companyId,
                    OR: [
                        { invoiceNumber: { contains: q, mode: 'insensitive' } },
                        { notes: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, invoiceNumber: true, total: true, status: true, type: true },
                take: 5,
            }),

            prisma.document.findMany({
                where: {
                    companyId,
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { type: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, name: true, type: true, status: true },
                take: 5,
            }),

            prisma.lead.findMany({
                where: {
                    companyId,
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { company: { contains: q, mode: 'insensitive' } },
                        { email: { contains: q, mode: 'insensitive' } },
                        { phone: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, name: true, company: true, email: true, stage: true },
                take: 5,
            }),
        ]);

        const results = [
            ...employees.map(e => ({
                id: e.id,
                type: 'employee',
                label: `${e.firstName} ${e.lastName}`,
                subtitle: e.employeeId,
                description: e.email,
                href: `/hrms/employees/${e.id}`,
            })),
            ...clients.map(c => ({
                id: c.id,
                type: 'client',
                label: c.name,
                subtitle: c.companyName || '',
                description: c.email,
                href: `/clients/${c.id}`,
            })),
            ...invoices.map(i => ({
                id: i.id,
                type: 'invoice',
                label: `#${i.invoiceNumber}`,
                subtitle: i.type || 'Invoice',
                description: `₹${Number(i.total).toLocaleString()} · ${i.status}`,
                href: `/accounting/invoices/${i.id}`,
            })),
            ...documents.map(d => ({
                id: d.id,
                type: 'document',
                label: d.name,
                subtitle: d.type || 'Document',
                description: d.status || '',
                href: `/documents/${d.id}`,
            })),
            ...leads.map(l => ({
                id: l.id,
                type: 'lead',
                label: l.name,
                subtitle: l.company || '',
                description: l.stage || l.email,
                href: `/leads/${l.id}`,
            })),
        ];

        res.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
};
