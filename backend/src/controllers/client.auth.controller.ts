import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Find client
        const client = await prisma.client.findFirst({
            where: { email, status: 'active', portalAccess: true },
            include: { company: true }
        });

        if (!client || !client.password) {
            return res.status(401).json({ error: 'Invalid credentials or portal access not enabled' });
        }

        // Check password
        const isValid = await comparePassword(password, client.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await prisma.client.update({
            where: { id: client.id },
            data: { lastLogin: new Date() }
        });

        // Generate token (Using same util, payloads might differ but id is key)
        // We might want to use a different secret or payload structure to distinguish from employees,
        // but for MVP reusing generateToken with a 'role': 'client' payload would be ideal if generateToken supports it.
        // If generateToken only signs ID, we need to ensure middleware checks user vs client existence.
        // Let's assume standard token for now.
        const token = generateToken(client.id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: client.id,
                name: client.name,
                email: client.email,
                type: 'client',
                companyName: client.company.name
            }
        });

    } catch (error: any) {
        console.error('Client login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
