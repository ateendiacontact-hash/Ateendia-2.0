// ===========================================
// server/types/express.d.ts
// Extiende los tipos de Express.Request para incluir `req.user`
// y `req.tenantId` que agregan los middlewares de auth/tenant.
// ===========================================

import type { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      /**
       * Datos del usuario autenticado (extraídos del JWT).
       * Disponible después de pasar por `requireAuth` o `attachAuthIfPresent`.
       */
      user?: {
        userId: string;
        tenantId: string;
        role: string;
        email?: string;
        name?: string;
      };

      /**
       * Tenant ID resuelto por el middleware `requireTenant`.
       * Por ahora coincide con `req.user.tenantId`, pero en el futuro podría
       * resolverse desde el subdominio (`agencia1.ateendia.cloud`).
       */
      tenantId?: string;
    }
  }
}

export {};