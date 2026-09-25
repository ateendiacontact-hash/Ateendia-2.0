// ===========================================
// server/middleware/tenant.ts
// Resuelve y valida el tenant del usuario autenticado.
//
// Uso típico (después de requireAuth):
//   router.get('/clients', requireAuth, requireTenant, handler)
//
// Nota: el tenantId viene del JWT y es inmutable durante la sesión.
// Se cachea en memoria por 5 minutos para evitar 1 query por request.
// ===========================================

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';

// ─── Cache de tenants activos ───
interface CachedTenant {
  id: string;
  isActive: boolean;
  cachedAt: number;
}

const TENANT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const tenantCache = new Map<string, CachedTenant>();

async function isTenantActive(tenantId: string): Promise<boolean> {
  const now = Date.now();
  const cached = tenantCache.get(tenantId);

  if (cached && now - cached.cachedAt < TENANT_CACHE_TTL_MS) {
    return cached.isActive;
  }

  const tenant = await prisma.tenants.findUnique({
    where: { id: tenantId },
    select: { id: true, is_active: true },
  });

  const isActive = Boolean(tenant?.is_active);

  tenantCache.set(tenantId, {
    id: tenantId,
    isActive,
    cachedAt: now,
  });

  return isActive;
}

/**
 * Middleware que:
 *   1. Verifica que exista req.user (debe venir después de requireAuth)
 *   2. Extrae el tenantId del usuario
 *   3. Verifica que el tenant esté activo en MariaDB
 *   4. Adjunta req.tenantId
 */
export async function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Autenticación requerida antes de resolver tenant',
      code: 'AUTH_REQUIRED_BEFORE_TENANT',
    });
    return;
  }

  const tenantId = req.user.tenantId;

  if (!tenantId) {
    res.status(401).json({
      success: false,
      error: 'El usuario no tiene tenant asignado',
      code: 'TENANT_MISSING',
    });
    return;
  }

  const active = await isTenantActive(tenantId);

  if (!active) {
    res.status(403).json({
      success: false,
      error: 'El tenant está inactivo o suspendido',
      code: 'TENANT_INACTIVE',
    });
    return;
  }

  req.tenantId = tenantId;
  next();
}

/**
 * Utilidad para invalidar el cache de un tenant.
 * Útil cuando un admin activa/suspende un tenant desde el panel SaaS.
 */
export function invalidateTenantCache(tenantId: string): void {
  tenantCache.delete(tenantId);
}