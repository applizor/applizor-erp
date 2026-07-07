import { Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

/**
 * Get all memberships/subscriptions with filtering and search
 */
export const getSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    if (!PermissionService.hasBasicPermission(user, 'Subscription', 'read')) {
      return res.status(403).json({ error: 'Access denied: No read rights for Subscription' });
    }

    const { status, clientId, search } = req.query;

    const where: any = {
      companyId: user.companyId
    };

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { plan: { contains: String(search), mode: 'insensitive' } },
        { client: { name: { contains: String(search), mode: 'insensitive' } } }
      ];
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            companyName: true
          }
        },
        subscriptionPlan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ subscriptions });
  } catch (error: any) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch memberships' });
  }
};

/**
 * Create a new membership subscription
 */
export const createSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    if (!PermissionService.hasBasicPermission(user, 'Subscription', 'create')) {
      return res.status(403).json({ error: 'Access denied: No create rights for Subscription' });
    }

    const {
      clientId,
      name,
      plan,
      planId,
      amount,
      billingCycle,
      startDate,
      endDate,
      status,
      nextBillingDate,
      currency
    } = req.body;

    if (!clientId || !name || !plan || !amount || !startDate) {
      return res.status(400).json({ error: 'Client, Plan Name, Amount, and Start Date are required' });
    }

    // Default next billing date if not specified
    let computedNextBilling = nextBillingDate ? new Date(nextBillingDate) : null;
    if (!computedNextBilling) {
      const sDate = new Date(startDate);
      if (billingCycle === 'monthly') {
        sDate.setMonth(sDate.getMonth() + 1);
        computedNextBilling = sDate;
      } else if (billingCycle === 'yearly') {
        sDate.setFullYear(sDate.getFullYear() + 1);
        computedNextBilling = sDate;
      } else {
        sDate.setMonth(sDate.getMonth() + 1); // fallback monthly
        computedNextBilling = sDate;
      }
    }

    const subscription = await prisma.subscription.create({
      data: {
        companyId: user.companyId,
        clientId,
        name,
        plan,
        planId: planId || null,
        amount: new Decimal(amount),
        billingCycle: billingCycle || 'monthly',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'active',
        nextBillingDate: computedNextBilling,
        currency: currency || 'INR'
      },
      include: {
        client: true
      }
    });

    // Log Audit Log entry
    try {
      await prisma.auditLog.create({
        data: {
          companyId: user.companyId,
          action: 'CREATE',
          module: 'SUBSCRIPTION',
          entityType: 'Subscription',
          entityId: subscription.id,
          details: `Enrolled client ${subscription.client.name} in membership ${name} (${plan})`,
          userId: user.id
        }
      });
    } catch (auditError) {
      console.error('Failed to log membership enrollment audit:', auditError);
    }

    res.status(201).json({
      message: 'Client enrolled in membership successfully',
      subscription
    });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Failed to enroll client in membership', details: error.message });
  }
};

/**
 * Update an existing membership subscription
 */
export const updateSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    if (!PermissionService.hasBasicPermission(user, 'Subscription', 'update')) {
      return res.status(403).json({ error: 'Access denied: No update rights for Subscription' });
    }

    const {
      name,
      plan,
      planId,
      amount,
      billingCycle,
      startDate,
      endDate,
      status,
      nextBillingDate,
      currency
    } = req.body;

    const existing = await prisma.subscription.findFirst({
      where: { id, companyId: user.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Membership subscription not found' });
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        plan: plan !== undefined ? plan : existing.plan,
        planId: planId !== undefined ? planId : existing.planId,
        amount: amount !== undefined ? new Decimal(amount) : existing.amount,
        billingCycle: billingCycle !== undefined ? billingCycle : existing.billingCycle,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        status: status !== undefined ? status : existing.status,
        nextBillingDate: nextBillingDate !== undefined ? (nextBillingDate ? new Date(nextBillingDate) : null) : existing.nextBillingDate,
        currency: currency !== undefined ? currency : existing.currency
      },
      include: {
        client: true
      }
    });

    // Log Audit Log entry
    try {
      await prisma.auditLog.create({
        data: {
          companyId: user.companyId,
          action: 'UPDATE',
          module: 'SUBSCRIPTION',
          entityType: 'Subscription',
          entityId: updated.id,
          details: `Updated membership details of ${updated.client.name} for ${updated.name}`,
          userId: user.id
        }
      });
    } catch (auditError) {
      console.error('Failed to log membership update audit:', auditError);
    }

    res.json({
      message: 'Membership updated successfully',
      subscription: updated
    });
  } catch (error: any) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Failed to update membership details' });
  }
};

/**
 * Delete/cancel membership
 */
export const deleteSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    if (!PermissionService.hasBasicPermission(user, 'Subscription', 'delete')) {
      return res.status(403).json({ error: 'Access denied: No delete rights for Subscription' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { id, companyId: user.companyId },
      include: { client: true }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    await prisma.subscription.delete({
      where: { id }
    });

    // Log audit log
    try {
      await prisma.auditLog.create({
        data: {
          companyId: user.companyId,
          action: 'DELETE',
          module: 'SUBSCRIPTION',
          entityType: 'Subscription',
          entityId: id,
          details: `Cancelled/deleted membership subscription of ${subscription.client.name} for ${subscription.name}`,
          userId: user.id
        }
      });
    } catch (auditError) {
      console.error('Failed to log membership deletion audit:', auditError);
    }

    res.json({ message: 'Membership subscription deleted successfully' });
  } catch (error: any) {
    console.error('Delete subscription error:', error);
    res.status(500).json({ error: 'Failed to delete membership subscription' });
  }
};

