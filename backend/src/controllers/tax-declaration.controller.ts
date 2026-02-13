import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

export const getTaxDeclarations = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId } = req.params;
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

export const reviewInvestment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { approvedAmount, status, rejectionReason } = req.body;

        const investment = await prisma.taxInvestment.update({
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
