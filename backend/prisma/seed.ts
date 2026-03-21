import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  { id: 'moradia',       label: 'Moradia',       color: '#FF6B6B', icon: '\u{1F3E0}' },
  { id: 'alimentacao',   label: 'Alimenta\u00E7\u00E3o',    color: '#FFA502', icon: '\u{1F37D}\u{FE0F}' },
  { id: 'transporte',    label: 'Transporte',     color: '#00D97E', icon: '\u{1F697}' },
  { id: 'saude',         label: 'Sa\u00FAde',          color: '#FF4757', icon: '\u{2764}\u{FE0F}' },
  { id: 'lazer',         label: 'Lazer',          color: '#A855F7', icon: '\u{1F3AE}' },
  { id: 'educacao',      label: 'Educa\u00E7\u00E3o',       color: '#3B82F6', icon: '\u{1F4DA}' },
  { id: 'contas',        label: 'Contas',         color: '#6B7280', icon: '\u{1F4C4}' },
  { id: 'salario',       label: 'Sal\u00E1rio',        color: '#00D97E', icon: '\u{1F4B0}' },
  { id: 'freelance',     label: 'Freelance',      color: '#10B981', icon: '\u{1F4BC}' },
  { id: 'investimentos', label: 'Investimentos',  color: '#F59E0B', icon: '\u{1F4C8}' },
  { id: 'outros',        label: 'Outros',         color: '#9CA3AF', icon: '\u{1F4E6}' },
];

async function main() {
  console.log('\u{1F331} Seeding...');

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat,
    });
  }
  console.log(`\u2705 ${CATEGORIES.length} categorias`);

  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@financecontrol.app' },
    update: {},
    create: {
      name:     'Admin',
      email:    'admin@financecontrol.app',
      password: hash,
      role:     'admin',
    },
  });
  console.log('\u2705 Usu\u00E1rio admin: admin@financecontrol.app / admin123');
  console.log('\u26A0\uFE0F  TROQUE A SENHA EM PRODU\u00C7\u00C3O!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
