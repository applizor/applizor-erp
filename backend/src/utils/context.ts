import { AsyncLocalStorage } from 'async_hooks';

export interface CompanyContext {
  companyId: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export const companyContextStore = new AsyncLocalStorage<CompanyContext>();

export const getCompanyIdFromContext = (): string | undefined => {
  return companyContextStore.getStore()?.companyId;
};

export const getContextStore = (): CompanyContext | undefined => {
  return companyContextStore.getStore();
};

export const runWithoutCompanyContext = <T>(fn: () => T): T => {
  return companyContextStore.run(undefined as any, fn);
};
