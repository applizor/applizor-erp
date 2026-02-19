
import { Router } from 'express';
import { authenticate, checkPermission } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as projectController from '../controllers/project.controller';
import * as automationController from '../controllers/automation.controller';

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
router.get('/:id/sow', checkPermission('Project', 'read'), projectController.generateSOW);

// Members
router.post('/:id/members', checkPermission('Project', 'update'), projectController.addProjectMember);
router.delete('/:id/members/:memberId', checkPermission('Project', 'update'), projectController.removeProjectMember);

// Milestones
router.post('/:id/milestones', checkPermission('Project', 'update'), projectController.createMilestone);

// Notes (Wiki)
router.get('/:id/notes', checkPermission('Project', 'read'), projectController.getProjectNotes);
router.post('/:id/notes', checkPermission('Project', 'update'), projectController.createProjectNote);
router.put('/notes/:noteId', checkPermission('Project', 'update'), projectController.updateProjectNote);

// Documents (Files)
router.get('/:id/documents', checkPermission('Project', 'read'), projectController.getProjectDocuments);
router.post('/:id/documents', checkPermission('Project', 'update'), upload.single('file'), projectController.uploadProjectDocument);
router.delete('/documents/:docId', checkPermission('Project', 'update'), projectController.deleteProjectDocument);

// Sprints
router.get('/:id/sprints', checkPermission('Project', 'read'), projectController.getSprints);
router.post('/:id/sprints', checkPermission('Project', 'update'), projectController.createSprint);
router.put('/sprints/:sprintId', checkPermission('Project', 'update'), projectController.updateSprint);
router.delete('/sprints/:sprintId', checkPermission('Project', 'update'), projectController.deleteSprint);

// Epics
router.get('/:id/epics', checkPermission('Project', 'read'), projectController.getEpics);
router.post('/:id/epics', checkPermission('Project', 'update'), projectController.createEpic);
router.put('/epics/:epicId', checkPermission('Project', 'update'), projectController.updateEpic);
router.delete('/epics/:epicId', checkPermission('Project', 'update'), projectController.deleteEpic);

// Automation
router.get('/:projectId/automation', checkPermission('Project', 'read'), automationController.getRules);
router.post('/:projectId/automation', checkPermission('Project', 'update'), automationController.createRule);
router.put('/automation/:ruleId', checkPermission('Project', 'update'), automationController.updateRule);
router.delete('/automation/:ruleId', checkPermission('Project', 'update'), automationController.deleteRule);

// Tasks (handled via Task controller usually but can be here too)

export default router;
