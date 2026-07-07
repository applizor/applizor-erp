import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/superadmin';
import * as platformController from '../controllers/platform.controller';

const router = Router();

// Public reference data (authenticated but not super admin)
router.get('/countries', authenticate, platformController.listCountries);
router.get('/states', authenticate, platformController.listStates);
router.get('/currencies', authenticate, platformController.listCurrencies);
router.get('/plans', platformController.listPlans); // Public - no auth needed for signup page

// Locale & Timezone (authenticated)
import { SUPPORTED_LOCALES, getLocaleConfig, TIMEZONES } from '../services/locale.service';
router.get('/locales', authenticate, (_req, res) => {
  const locales = SUPPORTED_LOCALES.map((code: string) => {
    const { dateFormat, currencyCode, currencySymbol, label, timezone } = getLocaleConfig(code);
    return { code, label, dateFormat, currencyCode, currencySymbol, timezone };
  });
  res.json(locales);
});
router.get('/locale/:code', authenticate, (req, res) => {
  res.json(getLocaleConfig(req.params.code));
});
router.get('/timezones', authenticate, (_req, res) => {
  res.json(TIMEZONES);
});

// Statutory Rules (read - any auth, write - super admin, company-specific overrides)
router.get('/rules', authenticate, platformController.listStatutoryRules);
router.post('/rules/company', authenticate, platformController.createCompanyStatutoryRule);
router.post('/rules/company/reset', authenticate, platformController.resetCompanyStatutoryRules);
router.put('/rules/company/:id', authenticate, platformController.updateCompanyStatutoryRule);
router.delete('/rules/company/:id', authenticate, platformController.deactivateCompanyStatutoryRule);

// Subscription checkout & verification (for tenants to pay for platform plans)
router.post('/subscribe/checkout', authenticate, platformController.createSubscriptionCheckout);
router.post('/subscribe/verify', authenticate, platformController.verifySubscriptionPayment);
router.post('/subscribe/webhook', platformController.handleSubscriptionWebhook);

// Allow tenants to get their own details, otherwise require Super Admin
const getTenantHandler = (req: any, res: any, next: any) => {
    if (req.user?.companyId === req.params.id) {
        return platformController.getTenant(req, res);
    }
    return requireSuperAdmin(req, res, () => platformController.getTenant(req, res));
};
router.get('/tenants/:id', authenticate as any, getTenantHandler);

// Super Admin only routes
router.use(authenticate, requireSuperAdmin);

// Tenant management
router.get('/tenants', platformController.listTenants);
router.post('/tenants', platformController.onboardTenant);
router.put('/tenants/:id', platformController.updateTenant);
router.put('/tenants/:id/suspend', platformController.suspendTenant);
router.put('/tenants/:id/activate', platformController.activateTenant);
router.delete('/tenants/:id', platformController.deleteTenant);

// Subscription management
router.put('/tenants/:id/subscription', platformController.updateTenantSubscription);

// Plan management
router.post('/plans', platformController.createPlan);
router.put('/plans/:id', platformController.updatePlan);
router.delete('/plans/:id', platformController.deletePlan);

// Dashboard
router.get('/stats', platformController.getPlatformStats);

// Statutory Rules
router.post('/rules', platformController.createStatutoryRule);
router.post('/rules/apply/:companyId', platformController.applyGlobalRulesToCompany);
router.put('/rules/:id', platformController.updateStatutoryRule);
router.delete('/rules/:id', platformController.deactivateStatutoryRule);

export default router;
