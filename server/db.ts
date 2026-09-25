// ===========================================
// server/db.ts
// Cliente Prisma singleton. Un solo PrismaClient por proceso.
// ===========================================

import { PrismaClient } from '@prisma/client';
import { isDev } from './env.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['query', 'error', 'warn'] : ['error'],
  });

if (isDev) {
  globalForPrisma.prisma = prisma;
}