"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const document_controller_1 = require("../controllers/document.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() }); // Keep in memory for processing
// Public health check?
router.get('/health', document_controller_1.healthCheck);
// Generation endpoint - Protected
// 'file' matches the form-data key
router.post('/generate', auth_1.authenticate, upload.single('file'), document_controller_1.generateDocument);
const document_controller_2 = require("../controllers/document.controller");
router.post('/generate-from-template', auth_1.authenticate, document_controller_2.generateFromTemplate);
router.post('/preview', auth_1.authenticate, document_controller_2.previewDocument);
router.post('/publish', auth_1.authenticate, document_controller_2.createDocument);
// Workflow Routes
router.post('/:id/publish', auth_1.authenticate, document_controller_2.publishDocument);
router.post('/:id/sign', auth_1.authenticate, upload.single('file'), document_controller_2.uploadSignedDocument);
router.post('/:id/review', auth_1.authenticate, document_controller_2.reviewDocument);
router.delete('/:id', auth_1.authenticate, document_controller_2.deleteDocument);
// Generic Upload (Employee Self-Service)
// 'file' key must match frontend FormData
// Generic Upload (Employee Self-Service)
// 'file' key must match frontend FormData
const document_controller_3 = require("../controllers/document.controller");
router.post('/upload', auth_1.authenticate, upload.single('file'), document_controller_3.uploadGenericDocument);
router.post('/generate-instant', auth_1.authenticate, document_controller_3.generateInstantDocument);
exports.default = router;
//# sourceMappingURL=document.routes.js.map