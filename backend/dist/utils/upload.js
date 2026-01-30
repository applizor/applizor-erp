"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfilePicture = exports.uploadLetterheadAsset = exports.uploadSignature = exports.uploadLeaveAttachment = exports.uploadDocument = exports.uploadLogo = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads directory exists
const uploadDir = path_1.default.join(__dirname, '../../uploads/logos');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Naming collision prevention: timestamp + random + ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    }
    else {
        cb(new Error('Only images are allowed (jpeg, jpg, png, gif)'));
    }
};
exports.uploadLogo = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: fileFilter
});
// Document Upload Configuration
const docStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const docDir = path_1.default.join(__dirname, '../../uploads/documents');
        if (!fs_1.default.existsSync(docDir)) {
            fs_1.default.mkdirSync(docDir, { recursive: true });
        }
        cb(null, docDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const docFileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|image|jpeg|jpg|png/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    // Mime type check can be tricky for some docs, so we rely mainly on ext for now or generic check
    if (extname) {
        return cb(null, true);
    }
    else {
        cb(new Error('Only PDF, DOC, DOCX and Images are allowed'));
    }
};
exports.uploadDocument = (0, multer_1.default)({
    storage: docStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: docFileFilter
});
// Leave Attachment Upload Configuration
const leaveStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const leaveDir = path_1.default.join(__dirname, '../../uploads/leaves');
        if (!fs_1.default.existsSync(leaveDir)) {
            fs_1.default.mkdirSync(leaveDir, { recursive: true });
        }
        cb(null, leaveDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'leave-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
exports.uploadLeaveAttachment = (0, multer_1.default)({
    storage: leaveStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: docFileFilter
});
// Signature Upload Configuration
const signatureDir = path_1.default.join(__dirname, '../../uploads/signatures');
if (!fs_1.default.existsSync(signatureDir)) {
    fs_1.default.mkdirSync(signatureDir, { recursive: true });
}
const signatureStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, signatureDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'signature-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
exports.uploadSignature = (0, multer_1.default)({
    storage: signatureStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: fileFilter
});
// Letterhead Upload Configuration
const letterheadDir = path_1.default.join(__dirname, '../../uploads/letterheads');
if (!fs_1.default.existsSync(letterheadDir)) {
    fs_1.default.mkdirSync(letterheadDir, { recursive: true });
}
const letterheadStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, letterheadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const letterheadFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
        return cb(null, true);
    }
    else {
        cb(new Error('Only images and PDFs are allowed (jpeg, jpg, png, gif, pdf)'));
    }
};
exports.uploadLetterheadAsset = (0, multer_1.default)({
    storage: letterheadStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: letterheadFileFilter
});
// Profile Upload Configuration
const profileDir = path_1.default.join(__dirname, '../../uploads/profiles');
if (!fs_1.default.existsSync(profileDir)) {
    fs_1.default.mkdirSync(profileDir, { recursive: true });
}
const profileStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profileDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
exports.uploadProfilePicture = (0, multer_1.default)({
    storage: profileStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: fileFilter
});
//# sourceMappingURL=upload.js.map