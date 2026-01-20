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
exports.default = router;
//# sourceMappingURL=document.routes.js.map