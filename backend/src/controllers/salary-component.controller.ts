import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { logAction } from '../services/audit.service';

// Get all Salary Components
export const getComponents = async (req: AuthRequest, res: Response) => {
    try {
        // Ideally filter by Company
        const userId = req.userId;
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
        if (!user?.companyId) return res.status(400).json({ error: 'User does not belong to a company' });

        const components = await prisma.salaryComponent.findMany({
            where: { companyId: user.companyId },
            orderBy: { name: 'asc' }
        });
        res.json(components);
    } catch (error: any) {
        console.error('Get salary components error:', error);
        res.status(500).json({ error: 'Failed to fetch salary components' });
    }
};

// Create Salary Component
export const createComponent = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
        if (!user?.companyId) return res.status(400).json({ error: 'User does not belong to a company' });

        const { name, type, calculationType, defaultValue, isActive } = req.body;

        const component = await prisma.salaryComponent.create({
            data: {
                companyId: user.companyId,
                name,
                type, // 'earning' | 'deduction'
                calculationType, // 'flat' | 'percentage_basic'
                defaultValue: defaultValue || 0,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        await logAction(req, {
            action: 'CREATE',
            module: 'PAYROLL',
            entityType: 'SalaryComponent',
            entityId: component.id,
            details: `Created Salary Component: ${name}`,
            changes: req.body
        });

        res.status(201).json(component);
    } catch (error: any) {
        console.error('Create salary component error:', error);
        res.status(500).json({ error: 'Failed to create salary component' });
    }
};

// Update Salary Component
export const updateComponent = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, type, calculationType, defaultValue, isActive } = req.body;

        const component = await prisma.salaryComponent.update({
            where: { id },
            data: {
                name,
                type,
                calculationType,
                defaultValue,
                isActive
            }
        });

        await logAction(req, {
            action: 'UPDATE',
            module: 'PAYROLL',
            entityType: 'SalaryComponent',
            entityId: component.id,
            details: `Updated Salary Component: ${name}`,
            changes: req.body
        });

        res.json(component);
    } catch (error: any) {
        console.error('Update salary component error:', error);
        res.status(500).json({ error: 'Failed to update salary component' });
    }
};

// Delete Salary Component
export const deleteComponent = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Check for usage in EmployeeSalaryStructure
        // We'll need to check the relation: employeeComponents
        const usageCount = await prisma.employeeSalaryComponent.count({
            where: { componentId: id }
        });

        if (usageCount > 0) {
            return res.status(400).json({
                error: `Cannot delete component as it is assigned to ${usageCount} employees. Please archive (deactivate) it instead.`
            });
        }

        await prisma.salaryComponent.delete({ where: { id } });

        await logAction(req, {
            action: 'DELETE',
            module: 'PAYROLL',
            entityType: 'SalaryComponent',
            entityId: id,
            details: `Deleted Salary Component (ID: ${id})`
        });

        res.json({ message: 'Component deleted successfully' });
    } catch (error: any) {
        console.error('Delete salary component error:', error);
        res.status(500).json({ error: 'Failed to delete salary component' });
    }
};
