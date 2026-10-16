// ===========================================
// server/middleware/tenant.ts
// Resuelve y valida el tenant del usuario autenticado.
//
// Uso típico (después de requireAuth):
//   router.get('/clients', requireAuth, requireTenant, handler)
//
// Nota: el tenantId viene del JWT y es inmutable durante la sesión.
// Se cachea en memoria por 5 minutos para evitar 1 query por request.
//
// ─── EXCEPCIÓN PARA SAAS SUPER ADMIN (Sesión 3.5.B.4.e.3) ───
// Si el usuario autenticado es `saas_super_admin` y viene el query
// param `?tenantId=X`, se usa `X` como tenant efectivo en lugar de
// `'platform'`. Esto permite que el Super Admin "entre a una instancia"
// y vea los datos reales de cualquier tenant.
//
// Seguridad: SOLO se permite el override si el rol es `saas_super_admin`.
// Un usuario de tenant NO puede espiar a otro tenant con este mecanismo.
// ===========================================

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';

// ─── Constantes ───

/** Rol que puede sobreescribir el tenant vía query param. */
const SAAS_SUPER_ADMIN_ROLE = 'saas_super_admin';

/** Tenant ficticio de los usuarios de plataforma. */
const PLATFORM_TENANT_ID = 'platform';

// ─── Cache de tenants activos ───
interface CachedTenant {
  id: string;
  isActive: boolean;
  cachedAt: number;
}

const TENANT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const tenantCache = new Map<string, CachedTenant>();

/**
 * Verifica si un tenant está activo, usando cache en memoria.
 * Si no está en cache o expiró, consulta MariaDB.
 *
 * ⚠️ NO llamar con `'platform'` — ese tenant es ficticio y no existe
 * en la DB. Para ese caso, ver `extractRequestedTenantId` y la rama
 * del Super Admin en `requireTenant`.
 */
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
 * Extrae el tenantId solicitado vía query param, si es válido.
 *
 * Devuelve `null` cuando:
 *   - No viene el query param `?tenantId=`
 *   - El valor no es un string
 *   - El valor está vacío (o solo espacios)
 *
 * @example
 *   GET /api/clients?tenantId=tenant-demo  → devuelve 'tenant-demo'
 *   GET /api/clients                       → devuelve null
 *   GET /api/clients?tenantId=             → devuelve null
 */
function extractRequestedTenantId(req: Request): string | null {
  const raw = req.query.tenantId;

  if (typeof raw !== 'string') {
    return null;
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Middleware que:
 *   1. Verifica que exista req.user (debe venir después de requireAuth)
 *   2. Extrae el tenantId del usuario (o del query param si es Super Admin)
 *   3. Verifica que el tenant esté activo en MariaDB
 *   4. Adjunta req.tenantId
 *
 * ─── Comportamiento por tipo de usuario ───
 *
 * A) Usuario tenant normal (role != saas_super_admin):
 *    - tenantId = req.user.tenantId (del JWT)
 *    - Ignora cualquier ?tenantId=X en la query (anti-IDOR)
 *
 * B) Super Admin SaaS (role === 'saas_super_admin'):
 *    - Si viene ?tenantId=X (X != 'platform') → tenantId = X (modo instancia)
 *    - Si viene ?tenantId=platform           → tenantId = 'platform' (panel SaaS)
 *    - Si NO viene                           → tenantId = 'platform' (panel SaaS)
 *
 * ─── Nota sobre 'platform' ───
 * `'platform'` es un tenant FICTICIO que representa al panel SaaS global.
 * NO existe en la tabla `tenants`, por lo que NUNCA debe validarse con
 * `isTenantActive` (daría `false` y rechazaría con 403).
 */
export async function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // ─── Paso 1: Debe existir req.user (requireAuth ya corrió) ───
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Autenticación requerida antes de resolver tenant',
      code: 'AUTH_REQUIRED_BEFORE_TENANT',
    });
    return;
  }

  const isSuperAdmin = req.user.role === SAAS_SUPER_ADMIN_ROLE;
  const requestedTenantId = extractRequestedTenantId(req);

  // ─── Paso 2: Resolver el tenantId efectivo ───

  // Caso A: Super Admin SaaS
  //   - Si pidió 'platform' → modo panel SaaS (tenant ficticio, sin validación)
  //   - Si pidió otro tenant → validar que exista y esté activo
  //   - Si no pidió nada → modo panel SaaS (tenant ficticio, sin validación)
  if (isSuperAdmin) {
    // Sub-caso A1: Pidió explícitamente 'platform'
    // (Esto ocurre al salir de una instancia: `exitTenantInstance` setea
    // `activeTenantId = null`, y el fetch usa `currentUser.tenantId = 'platform'`.)
    if (requestedTenantId === PLATFORM_TENANT_ID) {
      req.tenantId = PLATFORM_TENANT_ID;
      next();
      return;
    }

    // Sub-caso A2: Pidió un tenant específico (modo instancia)
    if (requestedTenantId) {
      const active = await isTenantActive(requestedTenantId);

      if (!active) {
        res.status(403).json({
          success: false,
          error: 'El tenant solicitado está inactivo o no existe',
          code: 'TENANT_INACTIVE',
        });
        return;
      }

      req.tenantId = requestedTenantId;
      next();
      return;
    }

    // Sub-caso A3: No pidió nada → modo panel SaaS global
    req.tenantId = PLATFORM_TENANT_ID;
    next();
    return;
  }

  // Caso B: Usuario tenant normal
  //   - SIEMPRE usar el tenantId del JWT (ignorar ?tenantId por seguridad)
  const tenantId = req.user.tenantId;

  if (!tenantId) {
    res.status(401).json({
      success: false,
      error: 'El usuario no tiene tenant asignado',
      code: 'TENANT_MISSING',
    });
    return;
  }

  // Excepción heredada: usuarios de plataforma que NO son saas_super_admin
  // (poco probable, pero mantiene compatibilidad con el comportamiento previo).
  if (tenantId === PLATFORM_TENANT_ID) {
    req.tenantId = PLATFORM_TENANT_ID;
    next();
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