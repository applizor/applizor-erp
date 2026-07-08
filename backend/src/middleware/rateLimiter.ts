import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Extracts a per-tenant rate limit key from the Authorization header.
 * Key format: "tenant:<companyId>:user:<userId>"
 * Falls back to IP address if token is missing/invalid (e.g. public routes).
 */
function tenantKeyGenerator(req: Request): string {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.slice(7);
            const decoded = jwt.verify(token, config.JWT_SECRET) as any;
            const companyId = decoded.companyId || 'unknown';
            const userId = decoded.id || decoded.userId || 'unknown';
            return `tenant:${companyId}:user:${userId}`;
        } catch {
            // Token invalid — fall through to IP
        }
    }
    // Fallback: IP-based key (for unauthenticated/public endpoints)
    return req.ip || 'unknown-ip';
}

/**
 * Per-tenant API rate limiter.
 * Each user gets their own bucket, isolated per company.
 * Production: 300 req / 15min per user. Dev: relaxed to 10,000.
 */
export const tenantApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 10000 : 1000, // Increased from 300 to 1000
    keyGenerator: tenantKeyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Rate limit exceeded. Please wait before making more requests.'
    },
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
    }
});

/**
 * IP-based general API limiter — kept for unauthenticated/public routes.
 * Production: 500 req / 15min per IP. Dev: relaxed.
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 10000 : 500, // Increased from 100 to 500
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests, please try again later.'
    }
});

/**
 * Strict IP-based limiter for authentication endpoints.
 * Production: 30 attempts / 15min per IP.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 10000 : 30, // Increased from 10 to 30
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many login attempts, please try again later.'
    }
});
