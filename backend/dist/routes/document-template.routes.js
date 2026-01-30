"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const document_template_controller_1 = require("../controllers/document-template.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, auth_1.checkPermission)('DocumentTemplate', 'create'), document_template_controller_1.createTemplate);
router.get('/', (0, auth_1.checkPermission)('DocumentTemplate', 'read'), document_template_controller_1.getTemplates);
router.put('/:id', (0, auth_1.checkPermission)('DocumentTemplate', 'update'), document_template_controller_1.updateTemplate);
router.delete('/:id', (0, auth_1.checkPermission)('DocumentTemplate', 'delete'), document_template_controller_1.deleteTemplate);
exports.default = router;
//# sourceMappingURL=document-template.routes.js.map