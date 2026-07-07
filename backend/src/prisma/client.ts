import { PrismaClient, Prisma } from '@prisma/client';
import { companyContextStore } from '../utils/context';

const basePrisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Dynamic Detection of Tenant-Scoped Models (those containing a companyId field)
const tenantModels = new Set<string>(
  Prisma.dmmf.datamodel.models
    .filter(m => m.fields.some(f => f.name === 'companyId'))
    .map(m => m.name)
);

const hasCompanyIdFilter = (where: any): boolean => {
  if (!where) return false;
  if ('companyId' in where) return true;
  if (where.OR && Array.isArray(where.OR)) {
    return where.OR.some((cond: any) => 'companyId' in cond || hasCompanyIdFilter(cond));
  }
  if (where.AND && Array.isArray(where.AND)) {
    return where.AND.some((cond: any) => 'companyId' in cond || hasCompanyIdFilter(cond));
  }
  return false;
};

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args: _args, query }) {
        const args = _args as any;
        if (model === 'AuditLog') {
          return query(args);
        }

        const store = companyContextStore.getStore();
        const isTenantModel = tenantModels.has(model);

        // Special bypass for global StatutoryRule and Holiday write operations (where companyId is null)
        if (['StatutoryRule', 'Holiday'].includes(model) && ['update', 'delete', 'upsert'].includes(operation) && args.where?.id) {
          const record = await (basePrisma[model as any] as any).findFirst({
            where: { id: args.where.id }
          });
          if (record && record.companyId === null) {
            return query(args);
          }
        }

        // ── 1. Intercept Mutation Logging (Old Step 4) ──
        const mutations = ['create', 'update', 'delete', 'updateMany', 'deleteMany', 'upsert'];
        const isMutation = mutations.includes(operation);

        // ── 2. Apply Automatic Tenant Isolation ──
        if (store?.companyId && isTenantModel) {
          if (!['create', 'createMany'].includes(operation)) {
            args.where = args.where || {};
          }

          const hasExistingFilter = hasCompanyIdFilter(args.where);

          // Auto-inject companyId for read, count, delete, and update filters
          if (['findFirst', 'findMany', 'count', 'updateMany', 'deleteMany', 'delete'].includes(operation)) {
            if (!hasExistingFilter) {
              if (['StatutoryRule', 'Holiday'].includes(model)) {
                args.where.OR = args.where.OR || [];
                args.where.OR.push({ companyId: store.companyId }, { companyId: null });
              } else {
                args.where.companyId = store.companyId;
              }
            }
          }

          // findUnique has strict unique typings - rewrite to findFirst to append companyId safely
          if (operation === 'findUnique') {
            if (!hasExistingFilter) {
              if (['StatutoryRule', 'Holiday'].includes(model)) {
                args.where.OR = args.where.OR || [];
                args.where.OR.push({ companyId: store.companyId }, { companyId: null });
              } else {
                args.where.companyId = store.companyId;
              }
            }
            const result = await (basePrisma[model as any] as any).findFirst(args);
            return result;
          }

          // Populate companyId on writes (create / createMany / update)
          if (operation === 'create') {
            args.data = args.data || {};
            args.data.companyId = store.companyId;
          }

          if (operation === 'createMany') {
            if (args.data) {
              if (Array.isArray(args.data)) {
                args.data.forEach((item: any) => {
                  item.companyId = store.companyId;
                });
              } else {
                args.data.companyId = store.companyId;
              }
            }
          }

          if (operation === 'update') {
            args.where.companyId = store.companyId;
            if (args.data) {
              args.data.companyId = store.companyId;
            }
          }

          if (operation === 'upsert') {
            args.where.companyId = store.companyId;
            if (args.create) {
              args.create.companyId = store.companyId;
            }
            if (args.update) {
              args.update.companyId = store.companyId;
            }
          }
        }

        const result = await query(args);

        // ── 3. Asynchronous Audit Log creation ──
        if (isMutation && store && store.companyId) {
          Promise.resolve().then(async () => {
            try {
              let changes: any = null;
              if (args.data) {
                const dataCopy = JSON.parse(JSON.stringify(args.data));
                const sensitiveFields = ['password', 'token', 'resetToken', 'tokenExpiry', 'resetTokenExpiry'];
                for (const field of sensitiveFields) {
                  if (field in dataCopy) {
                    dataCopy[field] = '[REDACTED]';
                  }
                }
                changes = dataCopy;
              }

              let entityId: string | null = null;
              if (result && typeof result === 'object') {
                entityId = (result as any).id || null;
              }

              await basePrisma.auditLog.create({
                data: {
                  companyId: store.companyId,
                  userId: store.userId || null,
                  action: `${operation.toUpperCase()}_${model.toUpperCase()}`,
                  module: model,
                  entityType: model,
                  entityId: entityId,
                  details: `Automated audit log for ${operation} on model ${model}`,
                  changes: changes,
                  ipAddress: store.ipAddress || null,
                  userAgent: store.userAgent || null,
                }
              });
            } catch (err) {
              console.error('[PrismaAudit] Failed to log database change:', err);
            }
          });
        }

        return result;
      }
    }
  }
});

export default prisma;
