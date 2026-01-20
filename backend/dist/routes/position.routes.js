"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const position_controller_1 = require("../controllers/position.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post('/', position_controller_1.createPosition);
router.get('/', position_controller_1.getPositions);
router.put('/:id', position_controller_1.updatePosition);
router.delete('/:id', position_controller_1.deletePosition);
exports.default = router;
//# sourceMappingURL=position.routes.js.map