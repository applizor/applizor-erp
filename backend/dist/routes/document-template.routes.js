"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const document_template_controller_1 = require("../controllers/document-template.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: 'uploads/templates/' }); // Save to disk
// List Templates
router.get('/', auth_1.authenticate, document_template_controller_1.listTemplates);
// Upload Template
router.post('/', auth_1.authenticate, upload.single('file'), document_template_controller_1.uploadTemplate);
// Delete Template
router.delete('/:id', auth_1.authenticate, document_template_controller_1.deleteTemplate);
exports.default = router;
//# sourceMappingURL=document-template.routes.js.map