import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';
import { Prisma } from '@prisma/client';

// Create Expense Submission
export const createExpense = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { employee: true }
        });

        if (!user?.companyId) {
            return res.status(400).json({ error: 'User does not belong to a company' });
        }

        const companyId = user.companyId;

        const employeeId = user.employee?.id;
        if (!employeeId) {
            return res.status(400).json({ error: 'User does not have an employee profile' });
        }

        const { title, description, category, amount, currency, receiptUrl, expenseDate } = req.body;

        if (!title || !category || !amount || !expenseDate) {
            return res.status(400).json({ error: 'Title, category, amount, and expense date are required' });
        }

        const amt = new Prisma.Decimal(amount);
        if (amt.lessThanOrEqualTo(0)) {
            return res.status(400).json({ error: 'Amount must be greater than zero' });
        }

        // Fetch configurations for this company, ordered by level
        const configs = await prisma.expenseApprovalConfig.findMany({
            where: { companyId },
            orderBy: { level: 'asc' }
        });

        // Filter configurations that match the amount threshold
        const matchingConfigs = configs.filter(cfg => {
            const min = cfg.minAmount ? Number(cfg.minAmount) : null;
            const max = cfg.maxAmount ? Number(cfg.maxAmount) : null;
            const amtNum = Number(amount);
            if (min !== null && amtNum < min) return false;
            if (max !== null && amtNum > max) return false;
            return true;
        });

        const totalLevels = matchingConfigs.length;

        // If no matching configs, auto-approve the expense
        const initialStatus = totalLevels === 0 ? 'approved' : 'pending';

        const expense = await prisma.expense.create({
            data: {
                companyId,
                employeeId,
                title,
                description,
                category,
                amount: amt,
                currency: currency || 'INR',
                receiptUrl,
                expenseDate: new Date(expenseDate),
                status: initialStatus,
                currentLevel: 1,
                totalLevels,
                approvals: {
                    createMany: {
                        data: matchingConfigs.map((cfg, idx) => ({
                            approverId: cfg.approverId,
                            level: idx + 1, // Sequential levels 1, 2, 3...
                            status: 'pending'
                        }))
                    }
                }
            },
            include: {
                approvals: {
                    include: {
                        approver: {
                            select: {
                                firstName: true,
                                lastName: true,
                                employeeId: true
                            }
                        }
                    }
                },
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeId: true
                    }
                }
            }
        });

        res.status(201).json(expense);
    } catch (error: any) {
        console.error('Create expense error:', error);
        res.status(500).json({ error: 'Failed to submit expense', details: error.message });
    }
};

// Get List of Expenses (Role-Filtered)
export const getExpenses = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { employee: true }
        });

        if (!user?.companyId) {
            return res.status(400).json({ error: 'User does not belong to a company' });
        }

        const companyId = user.companyId;
        const employeeId = user.employee?.id;
        const scope = PermissionService.getPermissionScope(req.user, 'Expense', 'read');

        let whereClause: any = { companyId };

        // If the user does not have global 'all' permission scope, restrict access
        if (!scope.all) {
            if (!employeeId) {
                return res.status(400).json({ error: 'User does not have an employee profile' });
            }
            whereClause.OR = [
                { employeeId },
                { approvals: { some: { approverId: employeeId } } }
            ];
        }

        // Apply filters if provided
        const { status, category } = req.query;
        if (status) whereClause.status = status as string;
        if (category) whereClause.category = category as string;

        const expenses = await prisma.expense.findMany({
            where: whereClause,
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        department: { select: { name: true } }
                    }
                },
                approvals: {
                    include: {
                        approver: {
                            select: {
                                firstName: true,
                                lastName: true,
                                employeeId: true
                            }
                        }
                    },
                    orderBy: { level: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(expenses);
    } catch (error: any) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Failed to fetch expenses', details: error.message });
    }
};

// Get Single Expense Details
export const getExpenseById = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { employee: true }
        });

        if (!user?.companyId) {
            return res.status(400).json({ error: 'User does not belong to a company' });
        }

        const companyId = user.companyId;

        const expense = await prisma.expense.findFirst({
            where: { id, companyId },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        department: { select: { name: true } }
                    }
                },
                approvals: {
                    include: {
                        approver: {
                            select: {
                                firstName: true,
                                lastName: true,
                                employeeId: true
                            }
                        }
                    },
                    orderBy: { level: 'asc' }
                }
            }
        });

        if (!expense) return res.status(404).json({ error: 'Expense not found' });

        // Access check: must be admin/superadmin OR the owner OR an approver on it
        const scope = PermissionService.getPermissionScope(req.user, 'Expense', 'read');
        const employeeId = user.employee?.id;

        if (!scope.all && expense.employeeId !== employeeId) {
            const isApprover = expense.approvals.some(appr => appr.approverId === employeeId);
            if (!isApprover) {
                return res.status(403).json({ error: 'Access denied to view this expense' });
            }
        }

        res.json(expense);
    } catch (error: any) {
        console.error('Get expense details error:', error);
        res.status(500).json({ error: 'Failed to fetch expense details', details: error.message });
    }
};

// Update Expense Submission (Only if pending)
export const updateExpense = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        const { title, description, category, amount, currency, receiptUrl, expenseDate } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { employee: true }
        });

        if (!user?.companyId) return res.status(400).json({ error: 'User does not belong to a company' });
        const companyId = user.companyId;

        const employeeId = user.employee?.id;
        if (!employeeId) return res.status(400).json({ error: 'Employee profile not found' });

        const expense = await prisma.expense.findFirst({
            where: { id, companyId }
        });

        if (!expense) return res.status(404).json({ error: 'Expense not found' });

        // Enforce owner edit rights and only when pending
        if (expense.employeeId !== employeeId) {
            return res.status(403).json({ error: 'Only the submitter can update this expense' });
        }

        if (expense.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending expenses can be modified' });
        }

        const amt = amount ? new Prisma.Decimal(amount) : expense.amount;
        if (amount && amt.lessThanOrEqualTo(0)) {
            return res.status(400).json({ error: 'Amount must be greater than zero' });
        }

        // If the amount changes, we may need to recalculate the approval levels!
        let updatedExpenseData: any = {
            title: title || expense.title,
            description: description !== undefined ? description : expense.description,
            category: category || expense.category,
            amount: amt,
            currency: currency || expense.currency,
            receiptUrl: receiptUrl !== undefined ? receiptUrl : expense.receiptUrl,
            expenseDate: expenseDate ? new Date(expenseDate) : expense.expenseDate
        };

        const amountChanged = amount && Number(amount) !== Number(expense.amount);

        await prisma.$transaction(async (tx) => {
            if (amountChanged) {
                // Fetch approval configurations
                const configs = await tx.expenseApprovalConfig.findMany({
                    where: { companyId },
                    orderBy: { level: 'asc' }
                });

                const matchingConfigs = configs.filter(cfg => {
                    const min = cfg.minAmount ? Number(cfg.minAmount) : null;
                    const max = cfg.maxAmount ? Number(cfg.maxAmount) : null;
                    const amtNum = Number(amount);
                    if (min !== null && amtNum < min) return false;
                    if (max !== null && amtNum > max) return false;
                    return true;
                });

                const totalLevels = matchingConfigs.length;
                const initialStatus = totalLevels === 0 ? 'approved' : 'pending';

                updatedExpenseData.totalLevels = totalLevels;
                updatedExpenseData.currentLevel = 1;
                updatedExpenseData.status = initialStatus;

                // Delete old approvals and recreate
                await tx.expenseApproval.deleteMany({
                    where: { expenseId: id }
                });

                if (totalLevels > 0) {
                    await tx.expenseApproval.createMany({
                        data: matchingConfigs.map((cfg, idx) => ({
                            expenseId: id,
                            approverId: cfg.approverId,
                            level: idx + 1,
                            status: 'pending'
                        }))
                    });
                }
            }

            await tx.expense.update({
                where: { id },
                data: updatedExpenseData
            });
        });

        const updatedExpense = await prisma.expense.findUnique({
            where: { id },
            include: { approvals: true }
        });

        res.json(updatedExpense);
    } catch (error: any) {
        console.error('Update expense error:', error);
        res.status(500).json({ error: 'Failed to update expense', details: error.message });
    }
};

// Delete Expense Submission (Only if pending)
export const deleteExpense = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { employee: true }
        });

        if (!user?.companyId) return res.status(400).json({ error: 'User does not belong to a company' });
        const companyId = user.companyId;

        const employeeId = user.employee?.id;
        if (!employeeId) return res.status(400).json({ error: 'Employee profile not found' });

        const expense = await prisma.expense.findFirst({
            where: { id, companyId }
        });

        if (!expense) return res.status(404).json({ error: 'Expense not found' });

        if (expense.employeeId !== employeeId) {
            return res.status(403).json({ error: 'Only the submitter can delete this expense' });
        }

        if (expense.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending expenses can be deleted' });
        }

        await prisma.expense.delete({
            where: { id }
        });

        res.json({ message: 'Expense deleted successfully' });
    } catch (error: any) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: 'Failed to delete expense', details: error.message });
    }
};

// Approve or Reject Expense Submission
export const takeApprovalAction = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        const { action, comments, rejectionReason } = req.body;

        if (!action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { employee: true }
        });

        if (!user?.companyId) return res.status(400).json({ error: 'User does not belong to a company' });
        const companyId = user.companyId;

        const employeeId = user.employee?.id;
        if (!employeeId) {
            return res.status(400).json({ error: 'User does not have an employee profile' });
        }

        const expense = await prisma.expense.findFirst({
            where: { id, companyId },
            include: { approvals: true }
        });

        if (!expense) return res.status(404).json({ error: 'Expense not found' });

        if (expense.status !== 'pending' && expense.status !== 'under_review') {
            return res.status(400).json({ error: 'Expense has already been fully processed' });
        }

        // Find the active approval record for the current level
        const activeApproval = expense.approvals.find(
            (appr: any) => appr.level === expense.currentLevel && appr.status === 'pending'
        );

        if (!activeApproval) {
            return res.status(400).json({ error: 'Active pending approval step not found' });
        }

        if (activeApproval.approverId !== employeeId) {
            return res.status(403).json({ error: 'You are not authorized to approve/reject this expense at level ' + expense.currentLevel });
        }

        await prisma.$transaction(async (tx) => {
            // Update current approval step status
            const approvalStatus = action === 'approve' ? 'approved' : 'rejected';
            await tx.expenseApproval.update({
                where: { id: activeApproval.id },
                data: {
                    status: approvalStatus,
                    comments,
                    actionAt: new Date()
                }
            });

            if (action === 'reject') {
                // Terminate workflow and set status to rejected
                await tx.expense.update({
                    where: { id },
                    data: {
                        status: 'rejected',
                        rejectionReason: rejectionReason || comments || 'Rejected by level ' + expense.currentLevel + ' approver'
                    }
                });
            } else {
                // If approved, check if we need to progress to the next level
                if (expense.currentLevel < expense.totalLevels) {
                    await tx.expense.update({
                        where: { id },
                        data: {
                            currentLevel: expense.currentLevel + 1,
                            status: 'pending' // Still pending next approvals
                        }
                    });
                } else {
                    // Final approval reached
                    await tx.expense.update({
                        where: { id },
                        data: {
                            status: 'approved'
                        }
                    });
                }
            }
        });

        const updatedExpense = await prisma.expense.findUnique({
            where: { id },
            include: { approvals: { orderBy: { level: 'asc' } } }
        });

        res.json({
            message: `Expense successfully ${action}d`,
            expense: updatedExpense
        });
    } catch (error: any) {
        console.error('Take approval action error:', error);
        res.status(500).json({ error: 'Failed to process approval action', details: error.message });
    }
};

// Get Pending Approvals awaiting actions by the caller
export const getPendingApprovals = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { employee: true }
        });

        if (!user?.companyId) return res.status(400).json({ error: 'User does not belong to a company' });
        const companyId = user.companyId;

        const employeeId = user.employee?.id;
        if (!employeeId) {
            return res.status(400).json({ error: 'Employee profile not found' });
        }

        const pendingApprovals = await prisma.expenseApproval.findMany({
            where: {
                approverId: employeeId,
                status: 'pending',
                expense: {
                    status: 'pending',
                    companyId
                }
            },
            include: {
                expense: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                employeeId: true,
                                department: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        });

        // Filter to include only the active level approvals
        const activePending = pendingApprovals
            .filter((appr: any) => appr.expense && appr.expense.currentLevel === appr.level)
            .map((appr: any) => ({
                ...appr.expense,
                activeApprovalId: appr.id,
                approvalLevel: appr.level
            }));

        res.json(activePending);
    } catch (error: any) {
        console.error('Get pending approvals error:', error);
        res.status(500).json({ error: 'Failed to fetch pending approvals', details: error.message });
    }
};

// Retrieve Approval Workflow Configurations
export const getConfigs = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Ensure user has basic admin permissions
        if (!PermissionService.hasBasicPermission(req.user, 'Expense', 'read')) {
            return res.status(403).json({ error: 'Access denied: Requires permission for Expense management' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User company not resolved' });
        const companyId = user.companyId;

        const configs = await prisma.expenseApprovalConfig.findMany({
            where: { companyId },
            orderBy: { level: 'asc' }
        });

        res.json(configs);
    } catch (error: any) {
        console.error('Get expense configs error:', error);
        res.status(500).json({ error: 'Failed to fetch expense configs', details: error.message });
    }
};

// Create or Overwrite Approval Workflow Configurations
export const updateConfigs = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Expense', 'update')) {
            return res.status(403).json({ error: 'Access denied: Requires permission to configure Expense settings' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User company not resolved' });
        const companyId = user.companyId;

        const { configs } = req.body;

        if (!Array.isArray(configs)) {
            return res.status(400).json({ error: 'Configs must be an array' });
        }

        // Validate levels and approver IDs
        for (const cfg of configs) {
            if (!cfg.level || typeof cfg.level !== 'number') {
                return res.status(400).json({ error: 'Each configuration must contain a numeric level' });
            }
            if (!cfg.approverId) {
                return res.status(400).json({ error: 'Each configuration must contain an approverId' });
            }

            // Verify approver exists and belongs to the same company
            const approverExists = await prisma.employee.findFirst({
                where: { id: cfg.approverId, companyId }
            });

            if (!approverExists) {
                return res.status(400).json({ error: `Approver with ID ${cfg.approverId} not found in this company` });
            }
        }

        await prisma.$transaction(async (tx) => {
            // Delete all existing configs for the company
            await tx.expenseApprovalConfig.deleteMany({
                where: { companyId }
            });

            // Bulk create new configs
            if (configs.length > 0) {
                await tx.expenseApprovalConfig.createMany({
                    data: configs.map((cfg: any) => ({
                        companyId,
                        level: cfg.level,
                        approverId: cfg.approverId,
                        minAmount: cfg.minAmount ? new Prisma.Decimal(cfg.minAmount) : null,
                        maxAmount: cfg.maxAmount ? new Prisma.Decimal(cfg.maxAmount) : null
                    }))
                });
            }
        });

        const newConfigs = await prisma.expenseApprovalConfig.findMany({
            where: { companyId },
            orderBy: { level: 'asc' }
        });

        res.json({
            message: 'Expense configs updated successfully',
            configs: newConfigs
        });
    } catch (error: any) {
        console.error('Update expense configs error:', error);
        res.status(500).json({ error: 'Failed to update expense configs', details: error.message });
    }
};
