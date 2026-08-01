import express from 'express';
import { authenticate } from '../middleware/auth';
import {
    createTeam,
    getTeams,
    getTeamWithMembers,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember
} from '../controllers/employeeTeam.controller';

const router = express.Router();

router.use(authenticate);

// Team CRUD
router.post('/', createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamWithMembers);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

// Team Member Management
router.post('/:id/members', addTeamMember);
router.delete('/:id/members/:memberId', removeTeamMember);

export default router;
