import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { AppError } from './errorHandler';

const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const ALLOWED_EXT = ['.pdf', '.csv', '.ofx', '.jpg', '.jpeg', '.png'];

export const uploadInvoice = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError(400, `Formato n\u00E3o suportado: ${ext}`) as any, false);
    }
  },
}).single('file');
