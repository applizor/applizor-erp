"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_auth_controller_1 = require("../controllers/client.auth.controller");
const portal_controller_1 = require("../controllers/portal.controller");
const auth_1 = require("../middleware/auth"); // We assume this works for any valid token user
const router = express_1.default.Router();
// Public routes
router.post('/auth/login', client_auth_controller_1.login);
// Protected routes
router.get('/dashboard', auth_1.authenticate, portal_controller_1.getDashboardStats);
router.get('/invoices', auth_1.authenticate, portal_controller_1.getMyInvoices);
router.get('/projects', auth_1.authenticate, portal_controller_1.getMyProjects);
exports.default = router;
//# sourceMappingURL=portal.routes.js.map