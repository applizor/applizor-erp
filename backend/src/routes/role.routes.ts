import express from 'express';
import {
    createRole,
    getRoles,
    updateRole,
    getPermissions,
    syncPermissions,
    getRoleDetails
} from '../controllers/role.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getRoles);
router.post('/', authenticate, createRole);
router.get('/permissions', authenticate, getPermissions);
router.post('/sync-permissions', authenticate, syncPermissions);
router.get('/:id', authenticate, getRoleDetails);
router.put('/:id', authenticate, updateRole);

export default router;
