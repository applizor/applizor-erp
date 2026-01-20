"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComponent = exports.updateComponent = exports.createComponent = exports.getComponents = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const audit_service_1 = require("../services/audit.service");
// Get all Salary Components
const getComponents = async (req, res) => {
    try {
        // Ideally filter by Company
        const userId = req.userId;
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'User does not belong to a company' });
        const components = await client_1.default.salaryComponent.findMany({
            where: { companyId: user.companyId },
            orderBy: { name: 'asc' }
        });
        res.json(components);
    }
    catch (error) {
        console.error('Get salary components error:', error);
        res.status(500).json({ error: 'Failed to fetch salary components' });
    }
};
exports.getComponents = getComponents;
// Create Salary Component
const createComponent = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'User does not belong to a company' });
        const { name, type, calculationType, defaultValue, isActive } = req.body;
        const component = await client_1.default.salaryComponent.create({
            data: {
                companyId: user.companyId,
                name,
                type, // 'earning' | 'deduction'
                calculationType, // 'flat' | 'percentage_basic'
                defaultValue: defaultValue || 0,
                isActive: isActive !== undefined ? isActive : true
            }
        });
        await (0, audit_service_1.logAction)(req, {
            action: 'CREATE',
            module: 'PAYROLL',
            entityType: 'SalaryComponent',
            entityId: component.id,
            details: `Created Salary Component: ${name}`,
            changes: req.body
        });
        res.status(201).json(component);
    }
    catch (error) {
        console.error('Create salary component error:', error);
        res.status(500).json({ error: 'Failed to create salary component' });
    }
};
exports.createComponent = createComponent;
// Update Salary Component
const updateComponent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, calculationType, defaultValue, isActive } = req.body;
        const component = await client_1.default.salaryComponent.update({
            where: { id },
            data: {
                name,
                type,
                calculationType,
                defaultValue,
                isActive
            }
        });
        await (0, audit_service_1.logAction)(req, {
            action: 'UPDATE',
            module: 'PAYROLL',
            entityType: 'SalaryComponent',
            entityId: component.id,
            details: `Updated Salary Component: ${name}`,
            changes: req.body
        });
        res.json(component);
    }
    catch (error) {
        console.error('Update salary component error:', error);
        res.status(500).json({ error: 'Failed to update salary component' });
    }
};
exports.updateComponent = updateComponent;
// Delete Salary Component
const deleteComponent = async (req, res) => {
    try {
        const { id } = req.params;
        // Check for usage in EmployeeSalaryStructure
        // We'll need to check the relation: employeeComponents
        const usageCount = await client_1.default.employeeSalaryComponent.count({
            where: { componentId: id }
        });
        if (usageCount > 0) {
            return res.status(400).json({
                error: `Cannot delete component as it is assigned to ${usageCount} employees. Please archive (deactivate) it instead.`
            });
        }
        await client_1.default.salaryComponent.delete({ where: { id } });
        await (0, audit_service_1.logAction)(req, {
            action: 'DELETE',
            module: 'PAYROLL',
            entityType: 'SalaryComponent',
            entityId: id,
            details: `Deleted Salary Component (ID: ${id})`
        });
        res.json({ message: 'Component deleted successfully' });
    }
    catch (error) {
        console.error('Delete salary component error:', error);
        res.status(500).json({ error: 'Failed to delete salary component' });
    }
};
exports.deleteComponent = deleteComponent;
//# sourceMappingURL=salary-component.controller.js.map