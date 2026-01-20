"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const accounting_controller_1 = require("../controllers/accounting.controller");
const router = express_1.default.Router();
router.get('/accounts', auth_1.authenticate, accounting_controller_1.getChartOfAccounts);
router.post('/entries', auth_1.authenticate, accounting_controller_1.createManualEntry);
exports.default = router;
//# sourceMappingURL=accounting.routes.js.map