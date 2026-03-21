import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';

export class UserService {

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'Usu\u00E1rio n\u00E3o encontrado');
    const { password, ...rest } = user;
    return rest;
  }

  async updateMe(userId: string, data: { name?: string; email?: string; password?: string; currentPassword?: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'Usu\u00E1rio n\u00E3o encontrado');

    const updateData: any = {};

    if (data.name) updateData.name = data.name;

    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new AppError(409, 'Este email j\u00E1 est\u00E1 em uso');
      updateData.email = data.email;
    }

    if (data.password) {
      if (!data.currentPassword) throw new AppError(400, 'Senha atual \u00E9 obrigat\u00F3ria para alterar a senha');
      const valid = await bcrypt.compare(data.currentPassword, user.password);
      if (!valid) throw new AppError(401, 'Senha atual incorreta');
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updated = await prisma.user.update({ where: { id: userId }, data: updateData });
    const { password, ...rest } = updated;
    return rest;
  }

  async list(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];
    const { password, ...rest } = user;
    return [rest];
  }

  async create(data: { name: string; email: string; password: string; role?: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, 'Este email j\u00E1 est\u00E1 cadastrado');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'user',
      },
    });
    const { password, ...rest } = user;
    return rest;
  }

  async delete(userId: string, targetId: string) {
    if (userId !== targetId) throw new AppError(403, 'S\u00F3 \u00E9 poss\u00EDvel deletar a pr\u00F3pria conta');
    await prisma.user.delete({ where: { id: targetId } });
    return { deleted: true };
  }

  async listPasskeys(userId: string, targetUserId: string) {
    if (userId !== targetUserId) throw new AppError(403, 'Acesso negado');
    return prisma.passkey.findMany({
      where: { userId: targetUserId },
      select: { id: true, deviceName: true, createdAt: true, lastUsedAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePasskey(userId: string, passkeyId: string) {
    const passkey = await prisma.passkey.findFirst({ where: { id: passkeyId, userId } });
    if (!passkey) throw new AppError(404, 'Passkey n\u00E3o encontrada');
    await prisma.passkey.delete({ where: { id: passkeyId } });
    return { deleted: true };
  }
}

export const userService = new UserService();
