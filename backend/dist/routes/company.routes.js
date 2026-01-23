"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const company_controller_1 = require("../controllers/company.controller");
const upload_1 = require("../utils/upload");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, company_controller_1.getCompany);
router.put('/', auth_1.authenticate, company_controller_1.updateCompany);
router.post('/letterhead', auth_1.authenticate, company_controller_1.uploadLetterhead);
router.put('/logo', auth_1.authenticate, upload_1.uploadLogo.single('logo'), company_controller_1.updateLogo);
router.put('/signature', auth_1.authenticate, upload_1.uploadSignature.single('signature'), company_controller_1.updateSignature);
router.put('/letterhead-asset', auth_1.authenticate, upload_1.uploadLetterheadAsset.single('letterhead'), company_controller_1.updateLetterheadAsset);
router.put('/continuation-sheet-asset', auth_1.authenticate, upload_1.uploadLetterheadAsset.single('continuationSheet'), company_controller_1.updateLetterheadAsset);
router.put('/company/profile', auth_1.authenticate, company_controller_1.updateCompany); // Allow updating profile directly
exports.default = router;
//# sourceMappingURL=company.routes.js.map