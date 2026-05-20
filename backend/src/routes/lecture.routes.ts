import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getLectures,
    createLecture,
    updateLecture,
    deleteLecture,
    completeLecture
} from '../controllers/lecture.controller';

const router = Router();

router.use(authenticate);

router.get('/course/:courseId', getLectures);
router.post('/', createLecture);
router.put('/:id', updateLecture);
router.delete('/:id', deleteLecture);
router.post('/:id/complete', completeLecture);

export default router;
