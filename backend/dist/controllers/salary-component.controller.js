"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComponent = exports.updateComponent = exports.getComponents = exports.createComponent = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const createComponent = async (req, res) => {
    try {
        const { name, type, calculationType, defaultValue, isTaxable } = req.body;
        const component = await client_1.default.salaryComponent.create({
            data: {
                name,
                type,
                calculationType,
                defaultValue,
                isTaxable,
                companyId: req.user.companyId
            }
        });
        res.status(201).json(component);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create salary component' });
    }
};
exports.createComponent = createComponent;
const getComponents = async (req, res) => {
    try {
        const components = await client_1.default.salaryComponent.findMany({
            where: { companyId: req.user.companyId, isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(components);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch components' });
    }
};
exports.getComponents = getComponents;
const updateComponent = async (req, res) => {
    try {
        const { id } = req.params;
        const component = await client_1.default.salaryComponent.update({
            where: { id },
            data: req.body
        });
        res.json(component);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update component' });
    }
};
exports.updateComponent = updateComponent;
const deleteComponent = async (req, res) => {
    try {
        await client_1.default.salaryComponent.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        res.json({ message: 'Component deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete component' });
    }
};
exports.deleteComponent = deleteComponent;
//# sourceMappingURL=salary-component.controller.js.map