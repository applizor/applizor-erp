import { Router } from 'express';
import * as ContractController from '../controllers/contract.controller';
import { authenticate, checkPermission } from '../middleware/auth';
import { authenticateClient } from '../middleware/client.auth';

const router = Router();

// Admin Routes (Protected)
// Basic CRUD
router.post('/', authenticate, checkPermission('Contract', 'create'), ContractController.createContract);
router.post('/:id/send', authenticate, ContractController.sendContractToClient);
router.get('/', authenticate, checkPermission('Contract', 'read'), ContractController.getContracts);
router.get('/:id', authenticate, checkPermission('Contract', 'read'), ContractController.getContractById);
router.post('/:id/sign-company', authenticate, checkPermission('Contract', 'update'), ContractController.signContractByCompany);
router.put('/:id', authenticate, checkPermission('Contract', 'update'), ContractController.updateContract);
router.delete('/:id', authenticate, checkPermission('Contract', 'delete'), ContractController.deleteContract);
router.get('/:id/pdf', ContractController.downloadContractPDF); // Public/Token protected in real app, basic for now

// Portal Routes (Client Access)
// These should ideally be mounted under /portal/contracts or handled via separate router file if prefix differs
// For now, I'll export a separate router for portal if needed, or we attach these to portal router
// Let's assume this file handles /api/contracts and we add /api/portal/contracts elsewhere OR reuse this.

export default router;

export const portalContractRouter = Router();
portalContractRouter.get('/', authenticateClient, ContractController.getMyContracts);
portalContractRouter.get('/:id', authenticateClient, ContractController.getContractById); // Reuse controller, ensuring permission checks in future
portalContractRouter.post('/:id/sign', authenticateClient, ContractController.signContract);
portalContractRouter.get('/:id/pdf', authenticateClient, ContractController.downloadContractPDF);
