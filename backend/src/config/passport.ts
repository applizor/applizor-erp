import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../prisma/client';

export const configurePassport = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${backendUrl}/api/auth/sso/google/callback`;

  if (!clientId || !clientSecret) {
    console.warn('⚠️ Google OAuth Client ID or Client Secret not found in environment variables. Google SSO will be disabled.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(new Error('No email address returned from Google OAuth'));
          }

          // 1. Fetch user by email to ensure they have been invited/registered (enterprise SSO standard)
          const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true },
          });

          if (!user) {
            return done(null, false, { message: 'This email is not registered. Please contact your company administrator.' });
          }

          if (!user.isActive) {
            return done(null, false, { message: 'User account has been deactivated.' });
          }

          // 2. Validate SSO Domain Whitelisting
          if (user.company) {
            const ssoConfig = user.company.ssoConfig as any;
            if (ssoConfig && ssoConfig.restrictToDomains && Array.isArray(ssoConfig.restrictToDomains) && ssoConfig.restrictToDomains.length > 0) {
              const domain = email.split('@')[1];
              if (!ssoConfig.restrictToDomains.includes(domain)) {
                return done(null, false, { message: `Email domain "${domain}" is not whitelisted for SSO logins in this company.` });
              }
            }
          }

          // Update user last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};
