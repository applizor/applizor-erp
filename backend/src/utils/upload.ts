import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/logos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Naming collision prevention: timestamp + random + ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images are allowed (jpeg, jpg, png, gif)'));
    }
};

export const uploadLogo = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: fileFilter
});

// Document Upload Configuration
const docStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const docDir = path.join(__dirname, '../../uploads/documents');
        if (!fs.existsSync(docDir)) {
            fs.mkdirSync(docDir, { recursive: true });
        }
        cb(null, docDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const docFileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = /pdf|doc|docx|image|jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    // Mime type check can be tricky for some docs, so we rely mainly on ext for now or generic check
    if (extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, DOCX and Images are allowed'));
    }
};

export const uploadDocument = multer({
    storage: docStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: docFileFilter
});

// Leave Attachment Upload Configuration
const leaveStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const leaveDir = path.join(__dirname, '../../uploads/leaves');
        if (!fs.existsSync(leaveDir)) {
            fs.mkdirSync(leaveDir, { recursive: true });
        }
        cb(null, leaveDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'leave-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const uploadLeaveAttachment = multer({
    storage: leaveStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: docFileFilter
});

