import { Router } from 'express';
import { invoiceController } from '../controllers/invoice.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadInvoice } from '../middlewares/upload.middleware';

const invoiceRouter = Router();

invoiceRouter.use(authMiddleware);

invoiceRouter.post('/parse',         uploadInvoice, (req, res, next) => invoiceController.parse(req, res, next));
invoiceRouter.post('/import',                       (req, res, next) => invoiceController.import(req, res, next));
invoiceRouter.post('/parse-receipt', uploadInvoice, (req, res, next) => invoiceController.parseReceipt(req, res, next));

export { invoiceRouter };
