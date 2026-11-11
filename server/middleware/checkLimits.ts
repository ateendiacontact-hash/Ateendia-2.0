// server/middleware/checkLimits.ts
/**
 * Middleware de verificación de límites SaaS (sub-fase 3.5.E).
 *
 * Regla ARQ-LIMITS: usa `saasLimitsService.resolveLimit()` como
 * fuente única de verdad. NO duplica el lookup de plan/suscripción.
 *
 * Regla 22: Excepción para tenantId === 'platform' y super admins.
 */

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { resolveLimit } from '../services/saasLimitsService.js';
import type { LimitResource } from '../types/limits.js';

/**
 * Extrae el tenantId del request.
 */
function getTenantId(req: Request): string | null {
  return req.user?.tenantId ?? null;
}

/**
 * Determina si el usuario debe saltarse la verificación de límites.
 * Regla 22: Super Admins SaaS y tenant 'platform'.
 */
function shouldBypassLimits(req: Request): boolean {
  const tenantId = getTenantId(req);
  if (tenantId === 'platform') return true;

  const user = req.user;
  if (!user) return false;

  if (
    user.role === 'saas_super_admin' ||
    user.role === 'super_admin' ||
    user.role === 'platform'
  ) {
    return true;
  }

  return false;
}

/**
 * Cuenta los registros actuales del tenant para un recurso.
 */
async function countCurrent(tenantId: string, resource: LimitResource): Promise<number> {
  switch (resource) {
    case 'users':
      return prisma.users.count({ where: { tenant_id: tenantId } });
    case 'clients':
      return prisma.clients.count({ where: { tenant_id: tenantId } });
    case 'policies':
      return prisma.policies.count({ where: { tenant_id: tenantId } });
  }
}

/**
 * Middleware configurable para verificar un límite específico.
 */
export function checkLimit(resource: LimitResource) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Regla 22: bypass para platform y super admins
      if (shouldBypassLimits(req)) {
        return next();
      }

      const tenantId = getTenantId(req);
      if (!tenantId) {
        console.warn('[checkLimit] Request sin tenantId, se omite verificación.');
        return next();
      }

      // Fuente única de verdad (ARQ-LIMITS).
      const limit = await resolveLimit(tenantId, resource);

      // Fallback permisivo si no hay límite definido.
      // Nota: -1 significa ilimitado (no bloquea).
      if (limit === null || limit === -1) {
        return next();
      }

      const current = await countCurrent(tenantId, resource);

      if (current >= limit) {
        res.status(403).json({
          success: false,
          error: {
            code: 'LIMIT_REACHED',
            message: `Has alcanzado el límite de ${resource} de tu plan (${current}/${limit}). Actualiza tu plan para continuar.`,
            resource,
            current,
            limit,
          },
        });
        return;
      }

      return next();
    } catch (err) {
      console.error('[checkLimit] Error verificando límites:', err);
      // Fail-open: si hay error, no bloqueamos (mejor que romper la app).
      return next();
    }
  };
}