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
const client_auth_controller_1 = require("../controllers/client.auth.controller");
const portal_controller_1 = require("../controllers/portal.controller");
const client_auth_1 = require("../middleware/client.auth");
const router = express_1.default.Router();
// Public routes
router.post('/login', client_auth_controller_1.login);
// Protected routes
router.get('/dashboard', client_auth_1.authenticateClient, portal_controller_1.getDashboardStats);
// Quotations
router.get('/quotations', client_auth_1.authenticateClient, portal_controller_1.getMyQuotations);
router.get('/quotations/:id', client_auth_1.authenticateClient, portal_controller_1.getQuotationDetails);
router.get('/quotations/:id/pdf', client_auth_1.authenticateClient, portal_controller_1.getQuotationPdf);
// Contracts
router.get('/contracts', client_auth_1.authenticateClient, portal_controller_1.getMyContracts);
router.get('/contracts/:id', client_auth_1.authenticateClient, portal_controller_1.getContractDetails);
router.get('/contracts/:id/pdf', client_auth_1.authenticateClient, portal_controller_1.getContractPdf);
// Projects & Invoices
router.get('/invoices', client_auth_1.authenticateClient, portal_controller_1.getMyInvoices);
router.get('/invoices/export', client_auth_1.authenticateClient, portal_controller_1.exportInvoices);
router.get('/invoices/:id', client_auth_1.authenticateClient, portal_controller_1.getInvoiceDetails);
router.get('/invoices/:id/pdf', client_auth_1.authenticateClient, portal_controller_1.getInvoicePdf);
router.get('/projects', client_auth_1.authenticateClient, portal_controller_1.getMyProjects);
// Portal Task Management
const portalTaskController = __importStar(require("../controllers/portal.task.controller"));
const upload_1 = require("../middleware/upload");
router.get('/tasks', client_auth_1.authenticateClient, portalTaskController.getPortalTasks);
router.get('/tasks/:id', client_auth_1.authenticateClient, portalTaskController.getPortalTaskDetails);
router.get('/projects/:projectId/members', client_auth_1.authenticateClient, portalTaskController.getPortalProjectMembers);
router.post('/tasks', client_auth_1.authenticateClient, upload_1.upload.array('files'), portalTaskController.createPortalTask);
router.get('/tasks/:id/comments', client_auth_1.authenticateClient, portalTaskController.getPortalComments);
router.post('/tasks/:id/comments', client_auth_1.authenticateClient, portalTaskController.addPortalComment);
router.put('/tasks/:id/status', client_auth_1.authenticateClient, portalTaskController.updatePortalTaskStatus);
router.get('/tasks/:id/history', client_auth_1.authenticateClient, portalTaskController.getPortalTaskHistory);
exports.default = router;
//# sourceMappingURL=portal.routes.js.map