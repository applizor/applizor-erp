import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

export const getCompany = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.companyId) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
    });

    res.json({ company });
  } catch (error: any) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to get company', details: error.message });
  }
};



// Re-defining updateCompany properly
export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    let companyId = id;

    // If id is missing or 'profile', we are updating the current user's company
    if (!id || id === 'profile') {
      const userId = req.user?.userId || req.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // If user object already available in req, use it
      if (req.user && req.user.companyId) {
        companyId = req.user.companyId;
      } else {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(404).json({ error: 'Company not found' });
        companyId = user.companyId;
      }
    }

    const {
      name, email, phone, address, city, state, country, pincode,
      currency, // Added
      allowedIPs, latitude, longitude, radius,
      legalName, gstin, pan, tan,
      enabledModules // Added to destructuring
    } = req.body;

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        name, email, phone, address, city, state, country, pincode,
        currency, // Added
        allowedIPs, latitude: latitude ? parseFloat(latitude) : undefined, longitude: longitude ? parseFloat(longitude) : undefined, radius: radius ? parseInt(radius) : undefined,
        legalName, gstin, pan, tan,
        enabledModules
      }
    });

    res.json(company);
  } catch (error: any) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Failed to update company', details: error.message });
  }
};

export const uploadLetterhead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.companyId) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // TODO: Handle file upload (multer)
    // For now, just accept file path
    const { letterheadDoc } = req.body;

    const company = await prisma.company.update({
      where: { id: user.companyId },
      data: {
        letterheadDoc,
      },
    });

    res.json({ message: 'Letterhead uploaded successfully', company });
  } catch (error: any) {
    console.error('Upload letterhead error:', error);
    res.status(500).json({ error: 'Failed to upload letterhead', details: error.message });
  }
};

export const updateLogo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.companyId) return res.status(404).json({ error: 'Company not found' });

    // Construct public URL
    // Assumption: Server serves /uploads route mapped to uploads folder
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    const company = await prisma.company.update({
      where: { id: user.companyId },
      data: { logo: logoUrl }
    });

    res.json({ message: 'Logo updated successfully', company });
  } catch (error: any) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: 'Failed to update logo' });
  }
};
