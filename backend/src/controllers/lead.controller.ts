import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';
import { notifyLeadAssigned } from '../services/email.service';

export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    console.log('[CreateLead] Request received');
    const userId = req.userId;
    console.log('[CreateLead] UserID:', userId);

    if (!userId) {
      console.log('[CreateLead] No UserId - Unauthorized');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    if (!user || !user.companyId) {
      console.log('[CreateLead] No User or CompanyId', user);
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    // Check permission
    const hasPermission = PermissionService.hasBasicPermission(user, 'Lead', 'create');
    console.log('[CreateLead] Has Permission:', hasPermission);

    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied: No create rights for Lead' });
    }

    const {
      name,
      email,
      phone,
      company,
      jobTitle,
      website,
      industry,
      source,
      sourceDetails,
      status = 'new',
      stage = 'lead',
      value,
      probability,
      priority = 'medium',
      notes,
      tags,
      assignedTo,
    } = req.body;

    console.log('[CreateLead] Payload:', JSON.stringify(req.body));

    if (!name) {
      return res.status(400).json({ error: 'Lead name is required' });
    }

    const leadData = {
      companyId: user.companyId,
      name,
      email,
      phone,
      company,
      jobTitle,
      website,
      industry,
      source,
      sourceDetails,
      status,
      stage,
      value: value ? parseFloat(value) : null,
      probability: probability ? parseInt(probability) : 0,
      priority,
      notes,
      tags: tags || [],
      assignedTo: assignedTo || userId,
      createdBy: userId,
    };

    console.log('[CreateLead] attempting prisma create...');

    const lead = await prisma.lead.create({
      data: leadData,
    });

    console.log('[CreateLead] Success:', lead.id);

    // Notify assigned user if different from creator
    if (lead.assignedTo && lead.assignedTo !== userId) {
      try {
        const assignee = await prisma.user.findUnique({
          where: { id: lead.assignedTo }
        });
        if (assignee?.email) {
          await notifyLeadAssigned(lead, assignee);
        }
      } catch (emailError) {
        console.error('Failed to send lead assignment email:', emailError);
      }
    }

    res.status(201).json({
      message: 'Lead created successfully',
      lead,
    });
  } catch (error: any) {
    console.error('[CreateLead] Error:', error);
    res.status(500).json({ error: 'Failed to create lead', details: error.message });
  }
};

export const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    // Check permission
    if (!PermissionService.hasBasicPermission(user, 'Lead', 'read')) {
      return res.status(403).json({ error: 'Access denied: No read rights for Lead' });
    }

    const { status, stage, assignedTo, search, page = 1, limit = 10 } = req.query;

    // Get scope filter
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user,
      'Lead',
      'read',
      'Lead',
      'createdBy',    // For "added" check
      'assignedTo'    // For "owned" check
    );

    const where: any = {
      companyId: user.companyId,
      AND: [scopeFilter]  // Apply permission scope
    };

    if (status) {
      where.status = status;
    }

    if (stage) {
      where.stage = stage;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      leads,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads', details: error.message });
  }
};

export const getLead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    // Check permission
    if (!PermissionService.hasBasicPermission(user, 'Lead', 'read')) {
      return res.status(403).json({ error: 'Access denied: No read rights for Lead' });
    }

    const { id } = req.params;

    // Get scope filter
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'Lead', 'read', 'Lead', 'createdBy', 'assignedTo'
    );

    const lead = await prisma.lead.findFirst({
      where: {
        AND: [{ id }, scopeFilter]
      },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found or access denied' });
    }

    res.json({ lead });
  } catch (error: any) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Failed to get lead', details: error.message });
  }
};

export const updateLead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    // Check permission
    if (!PermissionService.hasBasicPermission(user, 'Lead', 'update')) {
      return res.status(403).json({ error: 'Access denied: No update rights for Lead' });
    }

    const { id } = req.params;

    // Check scope
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'Lead', 'update', 'Lead', 'createdBy', 'assignedTo'
    );

    const count = await prisma.lead.count({
      where: { AND: [{ id }, scopeFilter] }
    });

    if (count === 0) {
      return res.status(403).json({ error: 'Access denied: No permission to update this lead' });
    }

    const {
      name,
      email,
      phone,
      company,
      jobTitle,    // Added
      website,     // Added
      industry,    // Added
      source,
      sourceDetails, // Added
      status,
      stage,
      value,
      probability, // Added
      priority,    // Added
      notes,
      tags,        // Added
      assignedTo
    } = req.body;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        company,
        jobTitle,    // Added
        website,     // Added
        industry,    // Added
        source,
        sourceDetails, // Added
        status,
        stage,
        value: value !== undefined ? (value ? parseFloat(value) : null) : undefined,
        probability: probability !== undefined ? parseInt(probability) : undefined,
        priority,    // Added
        notes,
        tags,        // Added
        assignedTo
      },
      include: {
        creator: true,
        assignedUser: true
      }
    });

    // Notify if assignee changed
    // We need to check if assignedTo was actually in the body and different
    if (assignedTo && lead.assignedTo === assignedTo && lead.assignedTo !== userId) {
      // Logic simplification: Just notify if assignedUser exists and is being updated
      try {
        const assignee = await prisma.user.findUnique({
          where: { id: lead.assignedTo }
        });
        if (assignee?.email) {
          await notifyLeadAssigned(lead, assignee);
        }
      } catch (emailError) {
        console.error('Failed to send lead assignment email:', emailError);
      }
    }

    res.json({
      message: 'Lead updated successfully',
      lead,
    });
  } catch (error: any) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Failed to update lead', details: error.message });
  }
};

export const convertLeadToClient = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    const { id } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Create client from lead
    const client = await prisma.client.create({
      data: {
        companyId: user.companyId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        clientType: 'customer',
        status: 'active',
        currency: lead.currency || 'INR', // Carry over currency
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id },
      data: {
        status: 'converted',
      },
    });

    // Link existing quotations to new client
    await prisma.quotation.updateMany({
      where: { leadId: id },
      data: { clientId: client.id }
    });

    res.json({
      message: 'Lead converted to client successfully',
      client,
    });
  } catch (error: any) {
    console.error('Convert lead error:', error);
    res.status(500).json({ error: 'Failed to convert lead', details: error.message });
  }
};

export const deleteLead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    // Check permission
    if (!PermissionService.hasBasicPermission(user, 'Lead', 'delete')) {
      return res.status(403).json({ error: 'Access denied: No delete rights for Lead' });
    }

    const { id } = req.params;

    // Check scope
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'Lead', 'delete', 'Lead', 'createdBy', 'assignedTo'
    );

    const count = await prisma.lead.count({
      where: { AND: [{ id }, scopeFilter] }
    });

    if (count === 0) {
      return res.status(403).json({ error: 'Access denied: No permission to delete this lead' });
    }

    await prisma.lead.delete({
      where: { id },
    });

    res.json({ message: 'Lead deleted successfully' });
  } catch (error: any) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Failed to delete lead', details: error.message });
  }
};

// ============================================
// NEW CRM FEATURES
// ============================================

// Get Kanban Board (Leads grouped by stage)
export const getLeadsKanban = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    // Check permission
    if (!PermissionService.hasBasicPermission(user, 'Lead', 'read')) {
      return res.status(403).json({ error: 'Access denied: No read rights for Lead' });
    }

    // Get scope filter
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'Lead', 'read', 'Lead', 'createdBy', 'assignedTo'
    );

    const leads = await prisma.lead.findMany({
      where: {
        companyId: user.companyId,
        AND: [scopeFilter]
      },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by stage
    const kanban = {
      lead: leads.filter(l => l.stage === 'lead'),
      contacted: leads.filter(l => l.stage === 'contacted'),
      qualified: leads.filter(l => l.stage === 'qualified'),
      proposal: leads.filter(l => l.stage === 'proposal'),
      negotiation: leads.filter(l => l.stage === 'negotiation'),
      won: leads.filter(l => l.status === 'won'),
      lost: leads.filter(l => l.status === 'lost')
    };

    res.json(kanban);
  } catch (error: any) {
    console.error('Get kanban error:', error);
    res.status(500).json({ error: 'Failed to fetch kanban', details: error.message });
  }
};

// Update Lead Stage (Drag & Drop)
export const updateLeadStage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    // Check permission - Stage update counts as 'update'
    if (!PermissionService.hasBasicPermission(user, 'Lead', 'update')) {
      return res.status(403).json({ error: 'Access denied: No update rights for Lead' });
    }

    const { id } = req.params;
    const { stage, status } = req.body;

    // Check scope
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'Lead', 'update', 'Lead', 'createdBy', 'assignedTo'
    );

    const count = await prisma.lead.count({
      where: { AND: [{ id }, scopeFilter] }
    });

    if (count === 0) {
      return res.status(403).json({ error: 'Access denied: No permission to update this lead stage' });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        stage,
        status: status || undefined,
        updatedAt: new Date()
      }
    });

    // Log activity
    await prisma.leadActivity.create({
      data: {
        leadId: id,
        type: 'status_change',
        title: `Stage changed to ${stage}`,
        createdBy: userId
      }
    });

    res.json({ message: 'Lead stage updated', lead });
  } catch (error: any) {
    console.error('Update stage error:', error);
    res.status(500).json({ error: 'Failed to update stage', details: error.message });
  }
};

// Enhanced Convert Lead to Client
export const convertLeadToClientEnhanced = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    // Check permission - Conversion typically requires update rights
    if (!PermissionService.hasBasicPermission(user, 'Lead', 'update')) {
      return res.status(403).json({ error: 'Access denied: No update rights for Lead' });
    }

    // Check scope
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'Lead', 'update', 'Lead', 'createdBy', 'assignedTo'
    );

    const lead = await prisma.lead.findFirst({
      where: { AND: [{ id }, scopeFilter] }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found or access denied' });
    }

    // Create client with all lead data
    // Clients usually have different permissions, but if you can convert, you likely can create Client
    // Ideally check 'Client' 'create' permission too
    if (!PermissionService.hasBasicPermission(user, 'Client', 'create')) {
      return res.status(403).json({ error: 'Access denied: No create rights for Client' });
    }

    const client = await prisma.client.create({
      data: {
        companyId: user.companyId,
        name: lead.name,
        companyName: lead.company,
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        notes: lead.notes,
        clientType: 'customer',
        status: 'active',
        createdById: userId,
        // New UI fields from account details (if they existed in lead)
        language: 'English',
        receiveNotifications: true,
        currency: lead.currency || 'INR', // Carry over currency
      }
    });

    // Update lead
    await prisma.lead.update({
      where: { id },
      data: {
        status: 'won',
        stage: 'closed',
        convertedToClientId: client.id,
        convertedAt: new Date()
      }
    });

    // Link existing quotations to new client
    await prisma.quotation.updateMany({
      where: { leadId: id },
      data: { clientId: client.id }
    });

    // Log activity
    await prisma.leadActivity.create({
      data: {
        leadId: id,
        type: 'conversion',
        title: 'Lead converted to client',
        description: `Client ID: ${client.id}`,
        createdBy: userId
      }
    });

    res.json({
      message: 'Lead converted successfully',
      client,
      lead
    });
  } catch (error: any) {
    console.error('Convert lead error:', error);
    res.status(500).json({ error: 'Failed to convert lead', details: error.message });
  }
};

// Get Lead Activities
export const getLeadActivities = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Check LeadActivity read permission
    if (!PermissionService.hasBasicPermission(user, 'LeadActivity', 'read')) {
      return res.status(403).json({ error: 'Access denied: No read rights for LeadActivity' });
    }

    // Verify access to this specific lead
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'Lead', 'read', 'Lead', 'createdBy', 'assignedTo'
    );

    // We strictly check valid lead existence + permission first
    const leadCount = await prisma.lead.count({
      where: { AND: [{ id }, scopeFilter] }
    });
    if (leadCount === 0) {
      return res.status(404).json({ error: 'Lead not found or access denied' });
    }

    const activities = await prisma.leadActivity.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ activities });
  } catch (error: any) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities', details: error.message });
  }
};

// Add Lead Activity
export const addLeadActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;

    // Check LeadActivity create permission
    if (!PermissionService.hasBasicPermission(user, 'LeadActivity', 'create')) {
      return res.status(403).json({ error: 'Access denied: No create rights for LeadActivity' });
    }

    // Verify access
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'Lead', 'update', 'Lead', 'createdBy', 'assignedTo'
    );
    const leadCount = await prisma.lead.count({
      where: { AND: [{ id }, scopeFilter] }
    });
    if (leadCount === 0) return res.status(403).json({ error: 'Access denied' });

    const { type, title, description, outcome, scheduledAt, dueDate, assignedTo, status: requestedStatus } = req.body;

    // Determine status intelligently
    let activityStatus = requestedStatus || 'pending';
    let completedAtDate = null;

    // If scheduledAt is in the past or not provided, and no explicit status, mark as completed
    if (!requestedStatus) {
      if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
        activityStatus = 'completed';
        completedAtDate = new Date();
      }
    } else if (requestedStatus === 'completed') {
      completedAtDate = new Date();
    }

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: id,
        type,
        title,
        description,
        outcome,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTo,
        createdBy: userId,
        completedAt: completedAtDate,
        status: activityStatus
      }
    });

    // Update last contacted only if activity is completed
    if (activityStatus === 'completed') {
      await prisma.lead.update({
        where: { id },
        data: { lastContactedAt: new Date() }
      });
    }

    // Update next follow-up if this is a future activity
    if (scheduledAt && new Date(scheduledAt) > new Date() && activityStatus === 'pending') {
      const lead = await prisma.lead.findUnique({ where: { id } });
      if (!lead?.nextFollowUpAt || new Date(scheduledAt) < lead.nextFollowUpAt) {
        await prisma.lead.update({
          where: { id },
          data: { nextFollowUpAt: new Date(scheduledAt) }
        });
      }
    }

    res.status(201).json({
      message: 'Activity added successfully',
      activity
    });
  } catch (error: any) {
    console.error('Add activity error:', error);
    res.status(500).json({ error: 'Failed to add activity', details: error.message });
  }
};

// Schedule Follow-up
export const scheduleFollowUp = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { date, description } = req.body;

    // Check permission
    const user = req.user;
    if (!PermissionService.hasBasicPermission(user, 'Lead', 'update')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check scope
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'Lead', 'update', 'Lead', 'createdBy', 'assignedTo'
    );
    const leadCount = await prisma.lead.count({
      where: { AND: [{ id }, scopeFilter] }
    });
    if (leadCount === 0) return res.status(403).json({ error: 'Access denied' });


    // Create follow-up activity
    await prisma.leadActivity.create({
      data: {
        leadId: id,
        type: 'follow_up',
        title: 'Scheduled Follow-up',
        description,
        scheduledAt: new Date(date),
        dueDate: new Date(date),
        createdBy: userId,
        status: 'pending',
        reminderSent: false
      }
    });

    // Update lead next follow-up date
    await prisma.lead.update({
      where: { id },
      data: {
        nextFollowUpAt: new Date(date),
        lastContactedAt: new Date()
      }
    });

    res.json({ message: 'Follow-up scheduled successfully' });
  } catch (error: any) {
    console.error('Schedule follow-up error:', error);
    res.status(500).json({ error: 'Failed to schedule follow-up', details: error.message });
  }
};

// Update Activity
export const updateActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { id, activityId } = req.params;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    if (!PermissionService.hasBasicPermission(user, 'LeadActivity', 'update')) {
      return res.status(403).json({ error: 'Access denied: No update rights for LeadActivity' });
    }

    // Verify lead access
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'Lead', 'read', 'Lead', 'createdBy', 'assignedTo'
    );
    const leadCount = await prisma.lead.count({
      where: { AND: [{ id }, scopeFilter] }
    });
    if (leadCount === 0) return res.status(403).json({ error: 'Access denied' });

    const { type, title, description, outcome, scheduledAt, dueDate, assignedTo, status } = req.body;

    const activity = await prisma.leadActivity.update({
      where: { id: activityId },
      data: {
        type,
        title,
        description,
        outcome,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedTo,
        status,
        completedAt: status === 'completed' ? new Date() : undefined
      }
    });

    res.json({ message: 'Activity updated successfully', activity });
  } catch (error: any) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Failed to update activity', details: error.message });
  }
};

// Delete Activity
export const deleteActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { id, activityId } = req.params;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    if (!PermissionService.hasBasicPermission(user, 'LeadActivity', 'delete')) {
      return res.status(403).json({ error: 'Access denied: No delete rights for LeadActivity' });
    }

    // Verify lead access
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'Lead', 'read', 'Lead', 'createdBy', 'assignedTo'
    );
    const leadCount = await prisma.lead.count({
      where: { AND: [{ id }, scopeFilter] }
    });
    if (leadCount === 0) return res.status(403).json({ error: 'Access denied' });

    await prisma.leadActivity.delete({
      where: { id: activityId }
    });

    res.json({ message: 'Activity deleted successfully' });
  } catch (error: any) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Failed to delete activity', details: error.message });
  }
};

// Complete Activity
export const completeActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { id, activityId } = req.params;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    if (!PermissionService.hasBasicPermission(user, 'LeadActivity', 'update')) {
      return res.status(403).json({ error: 'Access denied: No update rights for LeadActivity' });
    }

    // Verify lead access
    const scopeFilter = await PermissionService.getScopedWhereClause(
      user, 'Lead', 'read', 'Lead', 'createdBy', 'assignedTo'
    );
    const leadCount = await prisma.lead.count({
      where: { AND: [{ id }, scopeFilter] }
    });
    if (leadCount === 0) return res.status(403).json({ error: 'Access denied' });

    const { outcome } = req.body;

    const activity = await prisma.leadActivity.update({
      where: { id: activityId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        outcome
      }
    });

    // Update lead's last contacted
    await prisma.lead.update({
      where: { id },
      data: { lastContactedAt: new Date() }
    });

    res.json({ message: 'Activity completed successfully', activity });
  } catch (error: any) {
    console.error('Complete activity error:', error);
    res.status(500).json({ error: 'Failed to complete activity', details: error.message });
  }
};
