import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';

type LimitType = 'maxUsers' | 'maxStorageGb';

interface LimitResult {
  allowed: boolean;
  message?: string;
}

async function getSubscription(companyId: string) {
  return prisma.tenantSubscription.findUnique({
    where: { companyId },
    include: { plan: true },
  });
}

export async function checkLimit(companyId: string, limitType: LimitType): Promise<LimitResult> {
  const subscription = await getSubscription(companyId);

  if (!subscription || !subscription.plan) {
    return { allowed: false, message: 'No active subscription. Contact admin.' };
  }

  if (subscription.status !== 'active' && subscription.status !== 'trial') {
    return { allowed: false, message: `Subscription is ${subscription.status}. Contact admin.` };
  }

  const plan = subscription.plan;

  switch (limitType) {
    case 'maxUsers': {
      const count = await prisma.employee.count({ where: { companyId } });
      if (count >= plan.maxUsers) {
        return { allowed: false, message: `User limit reached (${plan.maxUsers}/${plan.maxUsers}). Upgrade your plan.` };
      }
      return { allowed: true };
    }
    case 'maxStorageGb': {
      const totalBytes = await prisma.document.aggregate({
        where: { companyId },
        _sum: { fileSize: true },
      });
      const usedMb = (totalBytes._sum.fileSize || 0) / (1024 * 1024);
      const limitMb = plan.maxStorageGb * 1024;
      if (usedMb >= limitMb) {
        return { allowed: false, message: `Storage limit reached (${Math.round(usedMb)}MB / ${limitMb}MB). Upgrade your plan.` };
      }
      return { allowed: true };
    }
    default:
      return { allowed: true };
  }
}

export function enforcePlanLimit(limitType: LimitType) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const companyId = (req as any).user?.companyId;
    if (!companyId) return next();

    const result = await checkLimit(companyId, limitType);
    if (!result.allowed) {
      return _res.status(403).json({ error: result.message });
    }
    next();
  };
}

export function requireModule(moduleName: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const companyId = (req as any).user?.companyId;
    if (!companyId) return next();

    const subscription = await getSubscription(companyId);
    if (!subscription?.plan?.enabledModules) return next();

    const modules = subscription.plan.enabledModules;
    let hasModule = false;

    if (Array.isArray(modules)) {
      hasModule = modules.includes(moduleName);
    } else if (modules && typeof modules === 'object') {
      hasModule = !!(modules as Record<string, boolean>)[moduleName];
    }

    if (!hasModule) {
      return _res.status(403).json({
        error: `"${moduleName}" module is not included in your ${subscription.plan.name} plan. Upgrade to unlock.`,
      });
    }
    next();
  };
}
