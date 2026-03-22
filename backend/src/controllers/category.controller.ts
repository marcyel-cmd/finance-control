import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';

export class CategoryController {

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await categoryService.list();
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCategorySchema.parse(req.body);
      const result = await categoryService.create(data);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCategorySchema.parse(req.body);
      const result = await categoryService.update(req.params.id as string, data);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await categoryService.delete(req.params.id as string);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }
}

export const categoryController = new CategoryController();
