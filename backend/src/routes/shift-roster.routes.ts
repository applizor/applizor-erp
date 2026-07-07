import express from 'express';
import multer from 'multer';
import path from 'path';
import { getRoster, updateRoster, syncPreviousWeek, uploadRosterCSV } from '../controllers/shift-roster.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Multer config: store uploaded CSV files in temp directory
const upload = multer({
    dest: path.join(process.cwd(), 'uploads/'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

router.get('/',          authenticate, getRoster);
router.post('/batch',    authenticate, updateRoster);
router.post('/sync-prev', authenticate, syncPreviousWeek);

// NEW: CSV bulk upload endpoint
router.post('/upload', authenticate, upload.single('file'), uploadRosterCSV);

export default router;
