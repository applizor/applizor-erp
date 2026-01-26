import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';
import bcrypt from 'bcryptjs';

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!PermissionService.hasBasicPermission(req.user, 'Client', 'create')) {
      return res.status(403).json({ error: 'Access denied: No create rights for Client' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country = 'India',
      pincode,
      gstin,
      pan,
      clientType = 'customer',
      portalAccess = false,
      password,
      salutation,
      gender,
      language,
      profilePicture,
      mobile,
      website,
      taxName,
      shippingAddress,
      notes,
      companyLogo,
      receiveNotifications = true,
      categoryId,
      subCategoryId,
      companyName,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    let hashedPassword = null;
    if (portalAccess && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const client = await prisma.client.create({
      data: {
        companyId: user.companyId,
        name,
        email,
        phone,
        address,
        city,
        state,
        country,
        pincode,
        gstin,
        pan,
        salutation,
        gender,
        language,
        profilePicture,
        mobile,
        website,
        taxName,
        shippingAddress,
        notes,
        companyLogo,
        receiveNotifications: Boolean(receiveNotifications),
        categoryId: categoryId || null,
        subCategoryId: subCategoryId || null,
        companyName,
        clientType,
        status: 'active',
        portalAccess: Boolean(portalAccess),
        password: hashedPassword,
        createdById: userId,
      },
    });

    // TODO: Send Welcome Email with credentials if portalAccess is true

    res.status(201).json({
      message: 'Client created successfully',
      client,
    });
  } catch (error: any) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client', details: error.message });
  }
};

export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!PermissionService.hasBasicPermission(req.user, 'Client', 'read')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    const { status, clientType, search, page = 1, limit = 10 } = req.query;

    const where: any = {
      companyId: user.companyId,
    };

    if (status) {
      where.status = status;
    }

    if (clientType) {
      where.clientType = clientType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      clients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to get clients', details: error.message });
  }
};

export const getClient = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!PermissionService.hasBasicPermission(req.user, 'Client', 'read')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        projects: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client });
  } catch (error: any) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to get client', details: error.message });
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!PermissionService.hasBasicPermission(req.user, 'Client', 'update')) {
      return res.status(403).json({ error: 'Access denied: No update rights for Client' });
    }

    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      gstin,
      pan,
      status,
      clientType,
      portalAccess,
      password,
      salutation,
      gender,
      language,
      profilePicture,
      mobile,
      website,
      taxName,
      shippingAddress,
      notes,
      companyLogo,
      receiveNotifications,
      categoryId,
      subCategoryId,
      companyName,
    } = req.body;

    const data: any = {
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      gstin,
      pan,
      salutation,
      gender,
      language,
      profilePicture,
      mobile,
      website,
      taxName,
      shippingAddress,
      notes,
      companyLogo,
      receiveNotifications: receiveNotifications !== undefined ? Boolean(receiveNotifications) : undefined,
      categoryId: categoryId || null,
      subCategoryId: subCategoryId || null,
      companyName,
      status,
      clientType,
      portalAccess: portalAccess !== undefined ? Boolean(portalAccess) : undefined,
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const client = await prisma.client.update({
      where: { id },
      data,
    });

    res.json({
      message: 'Client updated successfully',
      client,
    });
  } catch (error: any) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client', details: error.message });
  }
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!PermissionService.hasBasicPermission(req.user, 'Client', 'delete')) {
      return res.status(403).json({ error: 'Access denied: No delete rights for Client' });
    }

    const { id } = req.params;

    await prisma.client.delete({
      where: { id },
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error: any) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client', details: error.message });
  }
};
