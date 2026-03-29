import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Aumenta o pool de conexões: padrão é num_cpus*2+1=3, insuficiente com requisições paralelas
const dbUrl = process.env.DATABASE_URL || '';
const dbUrlWithPool = dbUrl.includes('?')
  ? `${dbUrl}&connection_limit=10&pool_timeout=20`
  : `${dbUrl}?connection_limit=10&pool_timeout=20`;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: { db: { url: dbUrlWithPool } },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
