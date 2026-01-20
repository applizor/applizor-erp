"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const department_controller_1 = require("../controllers/department.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post('/', department_controller_1.createDepartment);
router.get('/', department_controller_1.getDepartments);
router.put('/:id', department_controller_1.updateDepartment);
router.delete('/:id', department_controller_1.deleteDepartment);
exports.default = router;
//# sourceMappingURL=department.routes.js.map