import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';

export class CategoryService {

  async list() {
    return prisma.category.findMany({ orderBy: { label: 'asc' } });
  }

  async create(data: { id: string; label: string; color: string; icon: string }) {
    const existing = await prisma.category.findUnique({ where: { id: data.id } });
    if (existing) throw new AppError(409, 'Categoria j\u00E1 existe com este ID');
    return prisma.category.create({ data });
  }

  async update(id: string, data: { label?: string; color?: string; icon?: string }) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Categoria n\u00E3o encontrada');
    return prisma.category.update({ where: { id }, data });
  }

  async delete(id: string) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Categoria n\u00E3o encontrada');

    const count = await prisma.transaction.count({ where: { category: id } });
    if (count > 0) {
      throw new AppError(409, `Categoria em uso por ${count} transa\u00E7\u00F5es`);
    }

    await prisma.category.delete({ where: { id } });
    return { deleted: true };
  }
}

export const categoryService = new CategoryService();
