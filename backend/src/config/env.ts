import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface EnvConfig {
    NODE_ENV: string;
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    FRONTEND_URL: string;
    GOTENBERG_URL: string;
    REDIS_URL?: string;
    ENCRYPTION_KEY?: string;
}

const requiredVars: (keyof EnvConfig)[] = [
    'DATABASE_URL',
    'JWT_SECRET',
    'FRONTEND_URL',
    'GOTENBERG_URL'
];

const missing: string[] = [];
for (const key of requiredVars) {
    if (!process.env[key]) missing.push(key);
}

if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

export const config: EnvConfig = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '5000', 10),
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    GOTENBERG_URL: process.env.GOTENBERG_URL || 'http://gotenberg:3000',
    REDIS_URL: process.env.REDIS_URL || '',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
};

export default config;
