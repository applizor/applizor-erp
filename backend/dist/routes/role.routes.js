"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const role_controller_1 = require("../controllers/role.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/', auth_1.authenticate, role_controller_1.getRoles);
router.post('/', auth_1.authenticate, role_controller_1.createRole);
router.get('/permissions', auth_1.authenticate, role_controller_1.getPermissions);
router.post('/sync-permissions', auth_1.authenticate, role_controller_1.syncPermissions);
router.get('/:id', auth_1.authenticate, role_controller_1.getRoleDetails);
router.put('/:id', auth_1.authenticate, role_controller_1.updateRole);
exports.default = router;
//# sourceMappingURL=role.routes.js.map