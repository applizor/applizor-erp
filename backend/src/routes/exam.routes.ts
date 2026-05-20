import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getExams,
    getExam,
    createExam,
    updateExam,
    deleteExam,
    submitExam
} from '../controllers/exam.controller';

const router = Router();

router.use(authenticate);

router.get('/course/:courseId', getExams);
router.get('/:id', getExam);
router.post('/', createExam);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);
router.post('/:id/submit', submitExam);

export default router;
