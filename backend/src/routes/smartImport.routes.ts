import { Router } from 'express';
import { smartImportController } from '../controllers/smartImport.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { AppError } from '../middlewares/errorHandler';

// Upload config for multiple files (up to 5 images)
const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `smart-${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.pdf'];

const uploadSmartImport = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError(400, `Formato não suportado: ${ext}. Use: ${ALLOWED_EXT.join(', ')}`) as any, false);
    }
  },
}).array('files', 5);

const smartImportRouter = Router();

smartImportRouter.use(authMiddleware);

smartImportRouter.post('/parse', uploadSmartImport, (req, res, next) => smartImportController.parse(req, res, next));
smartImportRouter.post('/save', (req, res, next) => smartImportController.save(req, res, next));

export { smartImportRouter };
