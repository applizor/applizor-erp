import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  triggerGoogleLogin,
  handleGoogleCallback,
  saveSamlConfig,
  getSamlConfig,
  triggerSamlLogin,
  handleSamlCallback
} from '../controllers/sso.controller';

const router = Router();

// Google OAuth SSO
router.get('/google', triggerGoogleLogin);
router.get('/google/callback', handleGoogleCallback);

// SAML SSO Configuration (Enterprise Settings)
router.post('/saml/config', authenticate, saveSamlConfig);
router.get('/saml/config', authenticate, getSamlConfig);

// SAML SSO Login Lifecycle
router.get('/saml/login', triggerSamlLogin);
router.post('/saml/callback', handleSamlCallback);

export default router;
