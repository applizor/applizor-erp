"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeActivity = exports.deleteActivity = exports.updateActivity = exports.scheduleFollowUp = exports.addLeadActivity = exports.getLeadActivities = exports.convertLeadToClientEnhanced = exports.updateLeadStage = exports.getLeadsKanban = exports.deleteLead = exports.convertLeadToClient = exports.updateLead = exports.getLead = exports.getLeads = exports.createLead = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const permission_service_1 = require("../services/permission.service");
const createLead = async (req, res) => {
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
        const hasPermission = permission_service_1.PermissionService.hasBasicPermission(user, 'Lead', 'create');
        console.log('[CreateLead] Has Permission:', hasPermission);
        if (!hasPermission) {
            return res.status(403).json({ error: 'Access denied: No create rights for Lead' });
        }
        const { name, email, phone, company, jobTitle, website, industry, source, sourceDetails, status = 'new', stage = 'lead', value, probability, priority = 'medium', notes, tags, assignedTo, } = req.body;
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
        const lead = await client_1.default.lead.create({
            data: leadData,
        });
        console.log('[CreateLead] Success:', lead.id);
        res.status(201).json({
            message: 'Lead created successfully',
            lead,
        });
    }
    catch (error) {
        console.error('[CreateLead] Error:', error);
        res.status(500).json({ error: 'Failed to create lead', details: error.message });
    }
};
exports.createLead = createLead;
const getLeads = async (req, res) => {
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
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Lead', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Lead' });
        }
        const { status, stage, assignedTo, search, page = 1, limit = 10 } = req.query;
        // Get scope filter
        const scopeFilter = await permission_service_1.PermissionService.getScopedWhereClause(user, 'Lead', 'read', 'Lead', 'createdBy', // For "added" check
        'assignedTo' // For "owned" check
        );
        const where = {
            companyId: user.companyId,
            AND: [scopeFilter] // Apply permission scope
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
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [leads, total] = await Promise.all([
            client_1.default.lead.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            }),
            client_1.default.lead.count({ where }),
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
    }
    catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ error: 'Failed to fetch leads', details: error.message });
    }
};
exports.getLeads = getLeads;
const getLead = async (req, res) => {
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
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Lead', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Lead' });
        }
        const { id } = req.params;
        // Get scope filter
        const scopeFilter = await permission_service_1.PermissionService.getScopedWhereClause(user, 'Lead', 'read', 'Lead', 'createdBy', 'assignedTo');
        const lead = await client_1.default.lead.findFirst({
            where: {
                AND: [{ id }, scopeFilter]
            },
        });
        if (!lead) {
            return res.status(404).json({ error: 'Lead not found or access denied' });
        }
        res.json({ lead });
    }
    catch (error) {
        console.error('Get lead error:', error);
        res.status(500).json({ error: 'Failed to get lead', details: error.message });
    }
};
exports.getLead = getLead;
const updateLead = async (req, res) => {
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
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Lead', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Lead' });
        }
        const { id } = req.params;
        // Check scope
        const scopeFilter = await permission_service_1.PermissionService.getScopedWhereClause(user, 'Lead', 'update', 'Lead', 'createdBy', 'assignedTo');
        const count = await client_1.default.lead.count({
            where: { AND: [{ id }, scopeFilter] }
        });
        if (count === 0) {
            return res.status(403).json({ error: 'Access denied: No permission to update this lead' });
        }
        const { name, email, phone, company, jobTitle, // Added
        website, // Added
        industry, // Added
        source, sourceDetails, // Added
        status, stage, value, probability, // Added
        priority, // Added
        notes, tags, // Added
        assignedTo } = req.body;
        const lead = await client_1.default.lead.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                company,
                jobTitle, // Added
                website, // Added
                industry, // Added
                source,
                sourceDetails, // Added
                status,
                stage,
                value: value !== undefined ? (value ? parseFloat(value) : null) : undefined,
                probability: probability !== undefined ? parseInt(probability) : undefined,
                priority, // Added
                notes,
                tags, // Added
                assignedTo
            },
            include: {
                creator: true,
                assignedUser: true
            }
        });
        res.json({
            message: 'Lead updated successfully',
            lead,
        });
    }
    catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ error: 'Failed to update lead', details: error.message });
    }
};
exports.updateLead = updateLead;
const convertLeadToClient = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await client_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }
        const { id } = req.params;
        const lead = await client_1.default.lead.findUnique({
            where: { id },
        });
        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        // Create client from lead
        const client = await client_1.default.client.create({
            data: {
                companyId: user.companyId,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                clientType: 'customer',
                status: 'active',
            },
        });
        // Update lead status
        await client_1.default.lead.update({
            where: { id },
            data: {
                status: 'converted',
                stage: 'closed',
            },
        });
        res.json({
            message: 'Lead converted to client successfully',
            client,
        });
    }
    catch (error) {
        console.error('Convert lead error:', error);
        res.status(500).json({ error: 'Failed to convert lead', details: error.message });
    }
};
exports.convertLeadToClient = convertLeadToClient;
const deleteLead = async (req, res) => {
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
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Lead', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Lead' });
        }
        const { id } = req.params;
        // Check scope
        const scopeFilter = await permission_service_1.PermissionService.getScopedWhereClause(user, 'Lead', 'delete', 'Lead', 'createdBy', 'assignedTo');
        const count = await client_1.default.lead.count({
            where: { AND: [{ id }, scopeFilter] }
        });
        if (count === 0) {
            return res.status(403).json({ error: 'Access denied: No permission to delete this lead' });
        }
        await client_1.default.lead.delete({
            where: { id },
        });
        res.json({ message: 'Lead deleted successfully' });
    }
    catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ error: 'Failed to delete lead', details: error.message });
    }
};
exports.deleteLead = deleteLead;
// ============================================
// NEW CRM FEATURES
// ============================================
// Get Kanban Board (Leads grouped by stage)
const getLeadsKanban = async (req, res) => {
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
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Lead', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Lead' });
        }
        // Get scope filter
        const scopeFilter = await permission_service_1.PermissionService.getScopedWhereClause(user, 'Lead', 'read', 'Lead', 'createdBy', 'assignedTo');
        const leads = await client_1.default.lead.findMany({
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
    }
    catch (error) {
        console.error('Get kanban error:', error);
        res.status(500).json({ error: 'Failed to fetch kanban', details: error.message });
    }
};
exports.getLeadsKanban = getLeadsKanban;
// Update Lead Stage (Drag & Drop)
const updateLeadStage = async (req, res) => {
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
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Lead', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Lead' });
        }
        const { id } = req.params;
        const { stage, status } = req.body;
        // Check scope
        const scopeFilter = await permission_service_1.PermissionService.getScopedWhereClause(user, 'Lead', 'update', 'Lead', 'createdBy', 'assignedTo');
        const count = await client_1.default.lead.count({
            where: { AND: [{ id }, scopeFilter] }
        });
        if (count === 0) {
            return res.status(403).json({ error: 'Access denied: No permission to update this lead stage' });
        }
        const lead = await client_1.default.lead.update({
            where: { id },
            data: {
                stage,
                status: status || undefined,
                updatedAt: new Date()
            }
        });
        // Log activity
        await client_1.default.leadActivity.create({
            data: {
                leadId: id,
                type: 'status_change',
                title: `Stage changed to ${stage}`,
                createdBy: userId
            }
        });
        res.json({ message: 'Lead stage updated', lead });
    }
    catch (error) {
        console.error('Update stage error:', error);
        res.status(500).json({ error: 'Failed to update stage', details: error.message });
    }
};
exports.updateLeadStage = updateLeadStage;
// Enhanced Convert Lead to Client
const convertLeadToClientEnhanced = async (req, res) => {
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
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Lead', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Lead' });
        }
        // Check scope
        const scopeFilter = await permission_service_1.PermissionService.getScopedWhereClause(user, 'Lead', 'update', 'Lead', 'createdBy', 'assignedTo');
        const lead = await client_1.default.lead.findFirst({
            where: { AND: [{ id }, scopeFilter] }
        });
        if (!lead) {
            return res.status(404).json({ error: 'Lead not found or access denied' });
        }
        // Create client with all lead data
        // Clients usually have different permissions, but if you can convert, you likely can create Client
        // Ideally check 'Client' 'create' permission too
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Client', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Client' });
        }
        const client = await client_1.default.client.create({
            data: {
                companyId: user.companyId,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                clientType: 'customer',
                status: 'active'
            }
        });
        // Update lead
        await client_1.default.lead.update({
            where: { id },
            data: {
                status: 'won',
                stage: 'closed',
                convertedToClientId: client.id,
                convertedAt: new Date()
            }
        });
        // Log activity
        await client_1.default.leadActivity.create({
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
    }
    catch (error) {
        console.error('Convert lead error:', error);
        res.status(500).json({ error: 'Failed to convert lead', details: error.message });
    }
};
exports.convertLeadToClientEnhanced = convertLeadToClientEnhanced;
// Get Lead Activities
const getLeadActivities = async (req, res) => {
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
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'LeadActivity', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for LeadActivity' });
        }
        // Verify access to this specific lead
        const scopeFilter = await permission_service_1.PermissionService.getScopedWhereClause(user, 'Lead', 'read', 'Lead', 'createdBy', 'assignedTo');
        // We strictly check valid lead existence + permission first
        const leadCount = await client_1.default.lead.count({
            where: { AND: [{ id }, scopeFilter] }
        });
        if (leadCount === 0) {
            return res.status(404).json({ error: 'Lead not found or access denied' });
        }
        const activities = await client_1.default.leadActivity.findMany({
            where: { leadId: id },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ activities });
    }
    catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ error: 'Failed to fetch activities', details: error.message });
    }
};
exports.getLeadActivities = getLeadActivities;
// Add Lead Activity
const addLeadActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = req.user;
        // Check LeadActivity create permission
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'LeadActivity', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for LeadActivity' });
        }
        // Verify access
        const scopeFilter = await permission_service_1.PermissionService.getScopedWhereClause(user, 'Lead', 'update', 'Lead', 'createdBy', 'assignedTo');
        const leadCount = await client_1.default.lead.count({
            where: { AND: [{ id }, scopeFilter] }
        });
        if (leadCount === 0)
            return res.status(403).json({ error: 'Access denied' });
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
        }
        else if (requestedStatus === 'completed') {
            completedAtDate = new Date();
        }
        const activity = await client_1.default.leadActivity.create({
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
            await client_1.default.lead.update({
                where: { id },
                data: { lastContactedAt: new Date() }
            });
        }
        // Update next follow-up if this is a future activity
        if (scheduledAt && new Date(scheduledAt) > new Date() && activityStatus === 'pending') {
            const lead = await client_1.default.lead.findUnique({ where: { id } });
            if (!lead?.nextFollowUpAt || new Date(scheduledAt) < lead.nextFollowUpAt) {
                await client_1.default.lead.update({
                    where: { id },
                    data: { nextFollowUpAt: new Date(scheduledAt) }
                });
            }
        }
        res.status(201).json({
            message: 'Activity added successfully',
            activity
        });
    }
    catch (error) {
        console.error('Add activity error:', error);
        res.status(500).json({ error: 'Failed to add activity', details: error.message });
    }
};
exports.addLeadActivity = addLeadActivity;
// Schedule Follow-up
const scheduleFollowUp = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { date, description } = req.body;
        // Check permission
        const user = req.user;
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Lead', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Check scope
        const scopeFilter = await permission_service_1.PermissionService.getScopedWhereClause(user, 'Lead', 'update', 'Lead', 'createdBy', 'assignedTo');
        const leadCount = await client_1.default.lead.count({
            where: { AND: [{ id }, scopeFilter] }
        });
        if (leadCount === 0)
            return res.status(403).json({ error: 'Access denied' });
        // Create follow-up activity
        await client_1.default.leadActivity.create({
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
        await client_1.default.lead.update({
            where: { id },
            data: {
                nextFollowUpAt: new Date(date),
                lastContactedAt: new Date()
            }
        });
        res.json({ message: 'Follow-up scheduled successfully' });
    }
    catch (error) {
        console.error('Schedule follow-up error:', error);
        res.status(500).json({ error: 'Failed to schedule follow-up', details: error.message });
    }
};
exports.scheduleFollowUp = scheduleFollowUp;
// Update Activity
const updateActivity = async (req, res) => {
    try {
        const { id, activityId } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = req.user;
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'LeadActivity', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for LeadActivity' });
        }
        // Verify lead access
        const scopeFilter = await permission_service_1.PermissionService.getScopedWhereClause(user, 'Lead', 'read', 'Lead', 'createdBy', 'assignedTo');
        const leadCount = await client_1.default.lead.count({
            where: { AND: [{ id }, scopeFilter] }
        });
        if (leadCount === 0)
            return res.status(403).json({ error: 'Access denied' });
        const { type, title, description, outcome, scheduledAt, dueDate, assignedTo, status } = req.body;
        const activity = await client_1.default.leadActivity.update({
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
    }
    catch (error) {
        console.error('Update activity error:', error);
        res.status(500).json({ error: 'Failed to update activity', details: error.message });
    }
};
exports.updateActivity = updateActivity;
// Delete Activity
const deleteActivity = async (req, res) => {
    try {
        const { id, activityId } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = req.user;
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'LeadActivity', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for LeadActivity' });
        }
        // Verify lead access
        const scopeFilter = await permission_service_1.PermissionService.getScopedWhereClause(user, 'Lead', 'read', 'Lead', 'createdBy', 'assignedTo');
        const leadCount = await client_1.default.lead.count({
            where: { AND: [{ id }, scopeFilter] }
        });
        if (leadCount === 0)
            return res.status(403).json({ error: 'Access denied' });
        await client_1.default.leadActivity.delete({
            where: { id: activityId }
        });
        res.json({ message: 'Activity deleted successfully' });
    }
    catch (error) {
        console.error('Delete activity error:', error);
        res.status(500).json({ error: 'Failed to delete activity', details: error.message });
    }
};
exports.deleteActivity = deleteActivity;
// Complete Activity
const completeActivity = async (req, res) => {
    try {
        const { id, activityId } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = req.user;
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'LeadActivity', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for LeadActivity' });
        }
        // Verify lead access
        const scopeFilter = await permission_service_1.PermissionService.getScopedWhereClause(user, 'Lead', 'read', 'Lead', 'createdBy', 'assignedTo');
        const leadCount = await client_1.default.lead.count({
            where: { AND: [{ id }, scopeFilter] }
        });
        if (leadCount === 0)
            return res.status(403).json({ error: 'Access denied' });
        const { outcome } = req.body;
        const activity = await client_1.default.leadActivity.update({
            where: { id: activityId },
            data: {
                status: 'completed',
                completedAt: new Date(),
                outcome
            }
        });
        // Update lead's last contacted
        await client_1.default.lead.update({
            where: { id },
            data: { lastContactedAt: new Date() }
        });
        res.json({ message: 'Activity completed successfully', activity });
    }
    catch (error) {
        console.error('Complete activity error:', error);
        res.status(500).json({ error: 'Failed to complete activity', details: error.message });
    }
};
exports.completeActivity = completeActivity;
//# sourceMappingURL=lead.controller.js.map