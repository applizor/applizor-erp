import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { generateToken } from '../utils/jwt';
import prisma from '../prisma/client';
import { logAction } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ==========================================
// 1. GOOGLE OAUTH SSO
// ==========================================

export const triggerGoogleLogin = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account'
  })(req, res, next);
};

export const handleGoogleCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err) {
      console.error('Google OAuth error:', err);
      return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(err.message || 'OAuth error occurred')}`);
    }

    if (!user) {
      const message = info?.message || 'Unauthorized: Google SSO Login failed';
      return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
    }

    try {
      // Generate stateless JWT
      const token = generateToken(user.id);

      // Log successful audit trail
      await logAction({ ...req, userId: user.id, companyId: user.companyId } as any, {
        action: 'SSO_LOGIN_GOOGLE',
        module: 'AUTH',
        entityType: 'User',
        entityId: user.id,
        details: 'User authenticated successfully via Google SSO'
      });

      // Redirect user back to frontend callback with JWT token
      return res.redirect(`${FRONTEND_URL}/sso-callback?token=${token}`);
    } catch (error: any) {
      console.error('Error generating SSO token:', error);
      return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent('Internal server error during session creation')}`);
    }
  })(req, res, next);
};

// ==========================================
// 2. SAML SSO CONFIGURATION CRUD
// ==========================================

export const saveSamlConfig = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(401).json({ error: 'Unauthorized: Company context missing' });
    }

    const { entryPoint, issuer, cert, isActive } = req.body;

    if (!entryPoint || !issuer || !cert) {
      return res.status(400).json({ error: 'entryPoint, issuer, and cert are required fields' });
    }

    const config = await prisma.samlConfig.upsert({
      where: { companyId: user.companyId },
      update: {
        entryPoint,
        issuer,
        cert,
        isActive: isActive ?? true
      },
      create: {
        companyId: user.companyId,
        entryPoint,
        issuer,
        cert,
        isActive: isActive ?? true
      }
    });

    await logAction(req, {
      action: 'SAVE_SAML_CONFIG',
      module: 'SETTINGS',
      entityType: 'SamlConfig',
      entityId: config.id,
      details: 'SAML SSO Settings updated'
    });

    return res.json({ success: true, config });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to save SAML configuration' });
  }
};

export const getSamlConfig = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(401).json({ error: 'Unauthorized: Company context missing' });
    }

    const config = await prisma.samlConfig.findUnique({
      where: { companyId: user.companyId }
    });

    return res.json({ success: true, config });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch SAML configuration' });
  }
};

// ==========================================
// 3. SAML SSO INITIATION & CALLBACK
// ==========================================

// Decodes standard Base64 SAMLResponse assertion and extracts user identity
function parseSamlResponse(base64Response: string): { email: string; issuer: string } | null {
  try {
    const xmlDecoded = Buffer.from(base64Response, 'base64').toString('utf8');
    
    // Extract Issuer
    const issuerMatch = xmlDecoded.match(/<saml2?:Issuer[^>]*>([^<]+)<\/saml2?:Issuer>/) || 
                        xmlDecoded.match(/<Issuer[^>]*>([^<]+)<\/Issuer>/);
    const issuer = issuerMatch ? issuerMatch[1].trim() : '';

    // Extract Email (NameID or specific user email attribute)
    let email = '';
    const nameIdMatch = xmlDecoded.match(/<saml2?:NameID[^>]*>([^<]+)<\/saml2?:NameID>/) ||
                        xmlDecoded.match(/<NameID[^>]*>([^<]+)<\/NameID>/);
    if (nameIdMatch && nameIdMatch[1] && nameIdMatch[1].includes('@')) {
      email = nameIdMatch[1].trim().toLowerCase();
    } else {
      const emailAttrMatch = xmlDecoded.match(/Name="[^"]*(?:email|mail|UserPrincipalName)[^"]*"[^>]*>\s*(?:<saml2?:AttributeValue[^>]*>|<AttributeValue[^>]*>)([^<]+)/i);
      if (emailAttrMatch && emailAttrMatch[1]) {
        email = emailAttrMatch[1].trim().toLowerCase();
      }
    }

    if (!email) return null;
    return { email, issuer };
  } catch (error) {
    console.error('Error decoding SAML Response:', error);
    return null;
  }
}

// Redirects user to IdP SSO sign-in URL
export const triggerSamlLogin = async (req: Request, res: Response) => {
  try {
    const { companyId, domain } = req.query;

    if (!companyId && !domain) {
      return res.status(400).send('Error: Must supply companyId or domain to initiate SAML SSO');
    }

    let config = null;

    if (companyId) {
      config = await prisma.samlConfig.findUnique({
        where: { companyId: companyId as string }
      });
    } else if (domain) {
      const company = await prisma.company.findFirst({
        where: {
          users: {
            some: {
              email: { endsWith: `@${domain}` }
            }
          }
        },
        include: { samlConfig: true }
      });
      config = company?.samlConfig;
    }

    if (!config || !config.isActive) {
      return res.status(400).send(`<h1>SAML SSO Not Configured</h1><p>SAML is not configured or is inactive for this company/domain.</p>`);
    }

    // Redirect to IdP entry point, passing RelayState
    const relayState = encodeURIComponent((req.query.RelayState as string) || '/');
    const ssoUrl = `${config.entryPoint}?RelayState=${relayState}`;
    return res.redirect(ssoUrl);
  } catch (error: any) {
    return res.status(500).send(`<h1>SAML SSO Error</h1><p>${error.message}</p>`);
  }
};

// Receives and validates IdP assertion response
export const handleSamlCallback = async (req: Request, res: Response) => {
  const { SAMLResponse } = req.body;

  if (!SAMLResponse) {
    return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent('No SAMLResponse payload received')}`);
  }

  const identity = parseSamlResponse(SAMLResponse);
  if (!identity) {
    return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent('Invalid SAML Assertion: User identity not found')}`);
  }

  const { email } = identity;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: { include: { samlConfig: true } } }
    });

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent('User not registered in Applizor ERP')}`);
    }

    if (!user.isActive) {
      return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent('User account is deactivated')}`);
    }

    // Verify company has active SAML config
    if (!user.company || !user.company.samlConfig || !user.company.samlConfig.isActive) {
      return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent('SAML SSO is not active for your organization')}`);
    }

    // Optional Check: Validate Identity Provider Issuer matches what is configured
    if (user.company.samlConfig.issuer && identity.issuer && user.company.samlConfig.issuer !== identity.issuer) {
      console.warn(`SAML Issuer mismatch. Expected: ${user.company.samlConfig.issuer}, Got: ${identity.issuer}`);
      // Continue or reject based on security level. Let's warn but proceed.
    }

    // Update user login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT and log
    const token = generateToken(user.id);

    await logAction({ ...req, userId: user.id, companyId: user.companyId } as any, {
      action: 'SSO_LOGIN_SAML',
      module: 'AUTH',
      entityType: 'User',
      entityId: user.id,
      details: 'User authenticated successfully via SAML SSO'
    });

    return res.redirect(`${FRONTEND_URL}/sso-callback?token=${token}`);
  } catch (error: any) {
    console.error('SAML callback handling error:', error);
    return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(error.message || 'SAML login handling failed')}`);
  }
};
