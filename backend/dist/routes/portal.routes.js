"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_auth_controller_1 = require("../controllers/client.auth.controller");
const portal_controller_1 = require("../controllers/portal.controller");
const client_auth_1 = require("../middleware/client.auth");
const router = express_1.default.Router();
// Public routes
router.post('/login', client_auth_controller_1.login);
// Protected routes
router.get('/dashboard', client_auth_1.authenticateClient, portal_controller_1.getDashboardStats);
router.get('/invoices', client_auth_1.authenticateClient, portal_controller_1.getMyInvoices);
router.get('/invoices/export', client_auth_1.authenticateClient, portal_controller_1.exportInvoices); // Must be before /:id
router.get('/invoices/:id', client_auth_1.authenticateClient, portal_controller_1.getInvoiceDetails);
router.get('/invoices/:id/pdf', client_auth_1.authenticateClient, portal_controller_1.getInvoicePdf);
router.get('/projects', client_auth_1.authenticateClient, portal_controller_1.getMyProjects);
exports.default = router;
//# sourceMappingURL=portal.routes.js.map