import { Router } from 'express';
import { register, login, getProfile, forgotPassword, resetPassword, listUsers, updateUser, inviteUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import ssoRoutes from './sso.routes';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// SSO Authentication endpoints
router.use('/sso', ssoRoutes);

router.get('/', authenticate, listUsers);
router.put('/:id', authenticate, updateUser);
router.post('/invite', authenticate, inviteUser);

export default router;
