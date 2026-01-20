"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const branch_controller_1 = require("../controllers/branch.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, branch_controller_1.getBranches);
router.post('/', auth_1.authenticate, branch_controller_1.createBranch);
router.put('/:id', auth_1.authenticate, branch_controller_1.updateBranch);
router.delete('/:id', auth_1.authenticate, branch_controller_1.deleteBranch);
exports.default = router;
//# sourceMappingURL=branch.routes.js.map