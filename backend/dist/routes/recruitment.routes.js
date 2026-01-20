"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobOpeningController = __importStar(require("../controllers/job-opening.controller"));
const candidateController = __importStar(require("../controllers/candidate.controller"));
const interviewController = __importStar(require("../controllers/interview.controller"));
const offerController = __importStar(require("../controllers/offer.controller"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Job Opening Routes
router.post('/jobs', auth_1.authenticate, jobOpeningController.createJobOpening);
router.get('/jobs', auth_1.authenticate, jobOpeningController.getJobOpenings);
router.get('/jobs/:id', auth_1.authenticate, jobOpeningController.getJobOpeningById);
router.put('/jobs/:id', auth_1.authenticate, jobOpeningController.updateJobOpening);
router.delete('/jobs/:id', auth_1.authenticate, jobOpeningController.deleteJobOpening);
router.get('/public/jobs/:companyId', jobOpeningController.getPublicJobOpenings);
// Kanban Routes
const kanbanController = __importStar(require("../controllers/kanban.controller"));
router.get('/kanban', auth_1.authenticate, kanbanController.getKanbanBoard);
router.put('/candidates/:candidateId/stage', auth_1.authenticate, kanbanController.updateCandidateStage);
// Candidate Routes
router.post('/candidates', auth_1.authenticate, candidateController.createCandidate);
router.get('/candidates', auth_1.authenticate, candidateController.getCandidates);
router.get('/candidates/:id', auth_1.authenticate, candidateController.getCandidateById);
router.put('/candidates/:id/status', auth_1.authenticate, candidateController.updateCandidateStatus);
router.delete('/candidates/:id', auth_1.authenticate, candidateController.deleteCandidate);
// Interview Routes
router.post('/interviews', auth_1.authenticate, interviewController.scheduleInterview);
router.get('/candidates/:candidateId/interviews', auth_1.authenticate, interviewController.getCandidateInterviews);
router.put('/interviews/:id/feedback', auth_1.authenticate, interviewController.updateFeedback);
router.get('/interviews/:id/scorecard', auth_1.authenticate, interviewController.getScorecard);
router.delete('/interviews/:id', auth_1.authenticate, interviewController.cancelInterview);
// Email Template Routes
const emailTemplateController = __importStar(require("../controllers/email-template.controller"));
router.post('/templates', auth_1.authenticate, emailTemplateController.createTemplate);
router.get('/templates', auth_1.authenticate, emailTemplateController.getTemplates);
router.put('/templates/:id', auth_1.authenticate, emailTemplateController.updateTemplate);
router.delete('/templates/:id', auth_1.authenticate, emailTemplateController.deleteTemplate);
router.post('/email/send', auth_1.authenticate, emailTemplateController.sendMockEmail);
// Offer Letter Routes
router.post('/offers', auth_1.authenticate, offerController.createOffer);
router.get('/candidates/:candidateId/offer', auth_1.authenticate, offerController.getOffer);
router.put('/offers/:id/status', auth_1.authenticate, offerController.updateOfferStatus);
exports.default = router;
//# sourceMappingURL=recruitment.routes.js.map