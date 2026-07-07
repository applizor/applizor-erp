import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

export const getTaxDeclarations = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId } = req.params;

        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, companyId: req.user!.companyId }
        });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const declarations = await prisma.taxDeclaration.findMany({
            where: { employeeId },
            include: { investments: true }
        });
        res.json(declarations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch declarations' });
    }
};

export const submitTaxDeclaration = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId, financialYear, regime, investments } = req.body;

        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, companyId: req.user!.companyId }
        });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        // Ensure single declaration per FY
        const declaration = await prisma.taxDeclaration.upsert({
            where: { employeeId_financialYear: { employeeId, financialYear } },
            update: { regime, status: 'submitted' },
            create: { employeeId, financialYear, regime, status: 'submitted' }
        });

        // Clear and rewrite investments (for simplicity in v1)
        await prisma.taxInvestment.deleteMany({ where: { declarationId: declaration.id } });

        await prisma.taxInvestment.createMany({
            data: investments.map((inv: any) => ({
                declarationId: declaration.id,
                section: inv.section,
                componentName: inv.componentName,
                declaredAmount: inv.declaredAmount,
                proofUrl: inv.proofUrl
            }))
        });

        res.json(declaration);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit declaration' });
    }
};

export const getPendingReviews = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const declarations = await prisma.taxDeclaration.findMany({
            where: {
                status: 'submitted',
                employee: { companyId }
            },
            include: {
                investments: {
                    where: { status: 'pending' }
                },
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeId: true
                    }
                }
            }
        });

        const result = declarations.map(d => ({
            ...d,
            employeeName: `${d.employee.firstName} ${d.employee.lastName}`,
            employeeId: d.employee.employeeId
        }));

        res.json(result);
    } catch (error) {
        console.error('Get pending reviews error:', error);
        res.status(500).json({ error: 'Failed to fetch pending reviews' });
    }
};

export const reviewInvestment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { approvedAmount, status, rejectionReason } = req.body;

        const investment = await prisma.taxInvestment.findFirst({
            where: {
                id,
                declaration: { employee: { companyId: req.user!.companyId } }
            }
        });
        if (!investment) return res.status(404).json({ error: 'Investment not found' });

        await prisma.taxInvestment.update({
            where: { id },
            data: { approvedAmount, status, rejectionReason }
        });

        // Update total approved on declaration
        const allInvestments = await prisma.taxInvestment.findMany({
            where: { declarationId: investment.declarationId, status: 'approved' }
        });

        const totalApproved = allInvestments.reduce((sum, inv) => sum + Number(inv.approvedAmount || 0), 0);

        await prisma.taxDeclaration.update({
            where: { id: investment.declarationId },
            data: { totalAmount: totalApproved }
        });

        res.json(investment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to review investment' });
    }
};
