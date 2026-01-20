"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEmployeeStructure = exports.getEmployeeStructure = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const audit_service_1 = require("../services/audit.service");
// Get Employee Salary Structure
const getEmployeeStructure = async (req, res) => {
    try {
        const userId = req.userId;
        const { employeeId } = req.params;
        // Check permission (HR Manager or Admin)
        const user = await client_1.default.user.findUnique({ where: { id: userId }, include: { roles: { include: { role: true } } } });
        // Assume middleware handles role check, but good to ensure company scope
        const employee = await client_1.default.employee.findUnique({
            where: { id: employeeId },
            include: {
                salaryStructureDetails: {
                    include: {
                        components: {
                            include: { component: true }
                        }
                    }
                }
            }
        });
        if (!employee)
            return res.status(404).json({ error: 'Employee not found' });
        if (user?.companyId && employee.companyId !== user.companyId)
            return res.status(403).json({ error: 'Forbidden' });
        res.json(employee.salaryStructureDetails);
    }
    catch (error) {
        console.error('Get salary structure error:', error);
        res.status(500).json({ error: 'Failed to fetch salary structure' });
    }
};
exports.getEmployeeStructure = getEmployeeStructure;
// Update/Create Employee Salary Structure
const updateEmployeeStructure = async (req, res) => {
    try {
        const userId = req.userId;
        const { employeeId } = req.params;
        const { netSalary, ctc, effectiveDate, components } = req.body;
        // components: { componentId: string, monthlyAmount: number }[]
        const employee = await client_1.default.employee.findUnique({ where: { id: employeeId } });
        if (!employee)
            return res.status(404).json({ error: 'Employee not found' });
        // Transaction to update details and components
        const structure = await client_1.default.$transaction(async (tx) => {
            // 1. Upsert Structure Header
            const struct = await tx.employeeSalaryStructure.upsert({
                where: { employeeId },
                create: {
                    employeeId,
                    netSalary: netSalary || 0,
                    ctc: ctc || 0,
                    effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date()
                },
                update: {
                    netSalary: netSalary || 0,
                    ctc: ctc || 0,
                    effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date()
                }
            });
            // 2. Delete existing components mappings
            await tx.employeeSalaryComponent.deleteMany({
                where: { structureId: struct.id }
            });
            // 3. Create new mappings
            if (components && components.length > 0) {
                await tx.employeeSalaryComponent.createMany({
                    data: components.map((c) => ({
                        structureId: struct.id,
                        componentId: c.componentId,
                        monthlyAmount: c.monthlyAmount
                    }))
                });
            }
            // 4. Update Employee CTC field for quick access
            await tx.employee.update({
                where: { id: employeeId },
                data: { salary: ctc }
            });
            return struct;
        });
        await (0, audit_service_1.logAction)(req, {
            action: 'UPDATE',
            module: 'PAYROLL',
            entityType: 'EmployeeSalaryStructure',
            entityId: structure.id,
            details: `Updated Salary Structure for ${employee.firstName} ${employee.lastName} (CTC: ${ctc})`,
            changes: req.body
        });
        res.json(structure);
    }
    catch (error) {
        console.error('Update salary structure error:', error);
        res.status(500).json({ error: 'Failed to update salary structure' });
    }
};
exports.updateEmployeeStructure = updateEmployeeStructure;
//# sourceMappingURL=salary-structure.controller.js.map