// ===========================================
// server/routes/health.ts
// Endpoint público para verificar que el servidor está vivo.
// ===========================================

import { Router } from 'express';
import { prisma } from '../db.js';
import { env } from '../env.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  let dbStatus: 'ok' | 'error' = 'ok';
  let dbError: string | undefined;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
    dbStatus = 'error';
    dbError = err.message;
  }

  res.json({
    status: 'ok',
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      error: dbError,
    },
  });
});