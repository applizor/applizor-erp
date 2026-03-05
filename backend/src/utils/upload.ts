import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();


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
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: docFileFilter
});

// Leave Attachment Upload Configuration


export const uploadLeaveAttachment = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: docFileFilter
});

// Signature Upload Configuration

export const uploadSignature = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: fileFilter
});

// Letterhead Upload Configuration

const letterheadFileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname || mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images and PDFs are allowed (jpeg, jpg, png, gif, pdf)'));
    }
};

export const uploadLetterheadAsset = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: letterheadFileFilter
});

// Profile Upload Configuration

export const uploadProfilePicture = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: fileFilter
});
