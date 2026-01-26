
import { Router } from 'express';
import { authenticate, checkPermission } from '../middleware/auth';
import * as projectController from '../controllers/project.controller';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// List & Create
router.get('/', checkPermission('Project', 'read'), projectController.getProjects);
router.post('/', checkPermission('Project', 'create'), projectController.createProject);

// Single Project Operations
router.get('/:id', checkPermission('Project', 'read'), projectController.getProjectById);
router.put('/:id', checkPermission('Project', 'update'), projectController.updateProject);
router.delete('/:id', checkPermission('Project', 'delete'), projectController.deleteProject);

// Members
router.post('/:id/members', checkPermission('Project', 'update'), projectController.addProjectMember);
router.delete('/:id/members/:memberId', checkPermission('Project', 'update'), projectController.removeProjectMember);

// Milestones
router.post('/:id/milestones', checkPermission('Project', 'update'), projectController.createMilestone);

// Tasks (handled via Task controller usually but can be here too)

export default router;
