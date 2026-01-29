import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import crypto from 'crypto';
import { sendEmail } from '../services/email.service';
import { logAction } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, companyName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and company in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company if provided
      let company = null;
      if (companyName) {
        company = await tx.company.create({
          data: {
            name: companyName,
            isActive: true,
          },
        });
      }

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          companyId: company?.id,
        },
      });

      return { user, company };
    });

    // Generate token
    const token = generateToken(result.user.id);

    // Audit Log
    await logAction(req, {
      action: 'REGISTER',
      module: 'AUTH',
      entityType: 'User',
      entityId: result.user.id,
      details: `User registered: ${result.user.email} (Company: ${companyName || 'None'})`
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        companyId: result.user.companyId,
      },
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user with Roles and Permissions
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        }
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate token
    const token = generateToken(user.id);

    // Log login
    logAction(req, {
      action: 'LOGIN',
      module: 'AUTH',
      entityType: 'User',
      entityId: user.id,
      details: 'User logged in successfully'
    });

    // Flatten Permissions (Merge multiple roles if exist)
    const permissionsMap: Record<string, any> = {};
    if (user.roles) {
      user.roles.forEach(ur => {
        if (ur.role && ur.role.permissions) {
          ur.role.permissions.forEach(p => {
            // Simple merge: If not exists, or if new one is "all" (better logic needed for strict override, but this is MVP)
            // For now, simple overwrite or first win. 
            // Let's assume one active role usually.
            if (!permissionsMap[p.module]) {
              permissionsMap[p.module] = {
                createLevel: p.createLevel,
                readLevel: p.readLevel,
                updateLevel: p.updateLevel,
                deleteLevel: p.deleteLevel
              };
            } else {
              // If implementation needs merging levels (e.g. Owned vs All), we need a priority helper.
              // Skipping complex merge for now.
            }
          });
        }
      });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        company: user.company,
        roles: user.roles.map(r => r.role.name), // Just names
        permissions: permissionsMap // The capability map
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate userId format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('Invalid userId format:', userId);
      return res.status(401).json({ error: 'Invalid user ID format' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Flatten Permissions (Merge multiple roles if exist)
    const permissionsMap: Record<string, any> = {};
    if (user.roles) {
      user.roles.forEach(ur => {
        if (ur.role && ur.role.permissions) {
          ur.role.permissions.forEach(p => {
            if (!permissionsMap[p.module]) {
              permissionsMap[p.module] = {
                createLevel: p.createLevel,
                readLevel: p.readLevel,
                updateLevel: p.updateLevel,
                deleteLevel: p.deleteLevel
              };
            }
          });
        }
      });
    }

    // Return only selected fields
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      companyId: user.companyId,
      company: user.company,
      roles: user.roles.map(r => r.role.name),
      permissions: permissionsMap,
      createdAt: user.createdAt,
    };

    res.json({ user: userResponse });
  } catch (error: any) {
    console.error('Get profile error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      userId: req.userId,
    });
    res.status(500).json({
      error: 'Failed to get profile',
      details: error.message || 'Unknown error'
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: 'If email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Please go to this link to reset your password:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
    `;

    sendEmail(user.email, 'Password Reset Request', message)
      .catch(err => console.error('Forgot password email error:', err));

    res.json({ message: 'If email exists, a reset link has been sent.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: resetTokenHash,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    // Audit Log
    await logAction({ ...req, userId: user.id } as any, {
      action: 'RESET_PASSWORD',
      module: 'AUTH',
      entityType: 'User',
      entityId: user.id,
      details: `User reset password using token`
    });

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
