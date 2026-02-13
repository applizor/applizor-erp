import express from 'express';
import * as jobOpeningController from '../controllers/job-opening.controller';
import * as candidateController from '../controllers/candidate.controller';
import * as interviewController from '../controllers/interview.controller';
import * as offerController from '../controllers/offer.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Job Opening Routes
router.post('/jobs', authenticate, jobOpeningController.createJobOpening);
router.get('/jobs', authenticate, jobOpeningController.getJobOpenings);
router.get('/jobs/:id', authenticate, jobOpeningController.getJobOpeningById);
router.put('/jobs/:id', authenticate, jobOpeningController.updateJobOpening);
router.delete('/jobs/:id', authenticate, jobOpeningController.deleteJobOpening);
router.get('/public/jobs/:companyId', jobOpeningController.getPublicJobOpenings);

// Kanban Routes
import * as kanbanController from '../controllers/kanban.controller';
router.get('/kanban', authenticate, kanbanController.getKanbanBoard);
router.put('/candidates/:candidateId/stage', authenticate, kanbanController.updateCandidateStage);

// Candidate Routes
router.post('/candidates', authenticate, candidateController.createCandidate);
router.post('/public/candidates', candidateController.createPublicCandidate);
router.get('/candidates', authenticate, candidateController.getCandidates);
router.get('/candidates/:id', authenticate, candidateController.getCandidateById);
router.put('/candidates/:id', authenticate, candidateController.updateCandidate);
router.put('/candidates/:id/status', authenticate, candidateController.updateCandidateStatus);
router.delete('/candidates/:id', authenticate, candidateController.deleteCandidate);
router.post('/candidates/:id/parse', authenticate, candidateController.parseCandidateResume);
router.get('/candidates/:id/match', authenticate, candidateController.getSmartMatchScore);

// Interview Routes
router.post('/interviews', authenticate, interviewController.scheduleInterview);
router.put('/interviews/:id/reschedule', authenticate, interviewController.rescheduleInterview);
router.get('/interviews', authenticate, interviewController.getAllInterviews); // Generic endpoint
router.get('/interviews/:id', authenticate, interviewController.getInterviewById); // Single interview
router.get('/candidates/:candidateId/interviews', authenticate, interviewController.getCandidateInterviews);
router.put('/interviews/:id/feedback', authenticate, interviewController.updateFeedback);
router.post('/interviews/:id/scorecard', authenticate, interviewController.saveScorecard); // Frontend specific
router.get('/interviews/:id/scorecard', authenticate, interviewController.getScorecard);
router.delete('/interviews/:id', authenticate, interviewController.cancelInterview);

// Email Template Routes
import * as emailTemplateController from '../controllers/email-template.controller';
router.post('/templates', authenticate, emailTemplateController.createTemplate);
router.get('/templates', authenticate, emailTemplateController.getTemplates);
router.put('/templates/:id', authenticate, emailTemplateController.updateTemplate);
router.delete('/templates/:id', authenticate, emailTemplateController.deleteTemplate);
router.post('/email/send', authenticate, emailTemplateController.sendMockEmail);

// Offer Letter Routes
router.post('/offers', authenticate, offerController.createOffer);
router.get('/candidates/:candidateId/offer', authenticate, offerController.getOffer);
router.get('/candidates/:candidateId/offer/download', authenticate, offerController.downloadOfferLetter);
router.put('/offers/:id/status', authenticate, offerController.updateOfferStatus);

export default router;
