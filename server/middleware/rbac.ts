// ===========================================
// server/middleware/rbac.ts
// Control de acceso basado en roles (RBAC).
//
// Uso:
//   router.delete('/clients/:id',
//     requireAuth,
//     requireTenant,
//     requirePermission('clients', 'delete'),
//     handler
//   );
//
// Los permisos se leen de la tabla `role_permissions` y se cachean
// por 5 minutos para evitar queries en cada request.
//
// ─── EXCEPCIÓN PARA SAAS SUPER ADMIN (Sesión 3.5.B.4.e.3) ───
// El rol `saas_super_admin` es un rol de PLATAFORMA (no de tenant).
// No tiene filas en `role_permissions` porque no opera como un rol
// de negocio, sino como un administrador global del SaaS.
//
// Para que pueda operar sobre cualquier tenant (impersonación),
// `requirePermission` lo trata como bypass total: siempre `next()`.
// Esta misma regla ya está implementada en el frontend (`can()` del
// TenantContext), por lo que sincronizamos backend con frontend.
// ===========================================

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';

// ─── Constantes ───

/** Rol de plataforma que tiene bypass total en `requirePermission`. */
const SAAS_SUPER_ADMIN_ROLE = 'saas_super_admin';

// ─── Cache de permisos por rol ───
type PermissionSet = Set<string>; // formato: "module:action"

interface CachedPermissions {
  permissions: PermissionSet;
  cachedAt: number;
}

const PERMISSIONS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const permissionsCache = new Map<string, CachedPermissions>();

/**
 * Lee todos los permisos de un rol desde la DB.
 * Solo incluye las filas con allowed = true.
 */
async function loadPermissionsForRole(roleKey: string): Promise<PermissionSet> {
  const now = Date.now();
  const cached = permissionsCache.get(roleKey);

  if (cached && now - cached.cachedAt < PERMISSIONS_CACHE_TTL_MS) {
    return cached.permissions;
  }

  // Buscar el rol global (tenant_id = NULL) por su `key`
  const role = await prisma.roles.findFirst({
    where: {
      key: roleKey,
      tenant_id: null,
    },
    include: {
      role_permissions: {
        where: { allowed: true },
      },
    },
  });

  const permissions: PermissionSet = new Set();

  if (role) {
    for (const perm of role.role_permissions) {
      permissions.add(`${perm.module}:${perm.action}`);
    }
  }

  permissionsCache.set(roleKey, {
    permissions,
    cachedAt: now,
  });

  return permissions;
}

/**
 * Middleware factory. Devuelve un middleware que exige un permiso específico.
 *
 * ─── Comportamiento por tipo de usuario ───
 * A) `saas_super_admin` → bypass total. Siempre `next()`.
 *    Justificación: es un rol de plataforma, no de tenant. Debe poder
 *    operar sobre TODOS los tenants en modo impersonación.
 *
 * B) Cualquier otro rol → consulta la matriz `role_permissions` y valida.
 *
 * @example
 * router.post('/clients', requireAuth, requireTenant, requirePermission('clients', 'create'), handler)
 */
export function requirePermission(module: string, action: string) {
  const requiredKey = `${module}:${action}`;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Autenticación requerida antes de verificar permisos',
        code: 'AUTH_REQUIRED_BEFORE_RBAC',
      });
      return;
    }

    const roleKey = req.user.role;

    // ─── Excepción: Super Admin de plataforma ───
    // Tiene acceso total a TODOS los módulos y tenants.
    // No requiere filas en `role_permissions`.
    if (roleKey === SAAS_SUPER_ADMIN_ROLE) {
      next();
      return;
    }

    try {
      const permissions = await loadPermissionsForRole(roleKey);

      if (!permissions.has(requiredKey)) {
        res.status(403).json({
          success: false,
          error: `Permiso denegado: se requiere "${module}.${action}"`,
          code: 'PERMISSION_DENIED',
          required: { module, action },
          role: roleKey,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Utilidad para invalidar el cache de permisos de un rol.
 * Útil cuando el admin edita permisos desde el panel SaaS.
 */
export function invalidatePermissionsCache(roleKey: string): void {
  permissionsCache.delete(roleKey);
}

/**
 * Utilidad para invalidar TODO el cache.
 * Útil después de un seed o cuando cambian muchos roles a la vez.
 */
export function invalidateAllPermissionsCache(): void {
  permissionsCache.clear();
}

/**
 * Carga los permisos de un usuario para uso en endpoints
 * que necesitan devolver la matriz completa (ej: /api/auth/permissions).
 */
export async function getPermissionsForRole(roleKey: string): Promise<string[]> {
  const permissions = await loadPermissionsForRole(roleKey);
  return Array.from(permissions);
}

/**
 * Middleware que exige que el usuario autenticado sea un Super Admin
 * de plataforma (rol `saas_super_admin`).
 *
 * A diferencia de `requirePermission`, esta validación es SÍNCRONA y
 * no consulta la DB: el rol ya viene firmado en el JWT y se adjunta
 * a `req.user` por `requireAuth`.
 *
 * Uso típico: rutas del panel SaaS Central (planes, landing, registros).
 *
 * IMPORTANTE: debe ejecutarse SIEMPRE después de `requireAuth`, ya que
 * depende de `req.user` para funcionar.
 *
 * @example
 * router.get('/registrations',
 *   requireAuth,
 *   requirePlatformUser,
 *   handler
 * );
 */
export function requirePlatformUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Autenticación requerida antes de verificar rol de plataforma',
      code: 'AUTH_REQUIRED_BEFORE_PLATFORM_CHECK',
    });
    return;
  }

  if (req.user.role !== SAAS_SUPER_ADMIN_ROLE) {
    res.status(403).json({
      success: false,
      error: 'Acceso denegado: se requiere rol de Super Admin de plataforma',
      code: 'PLATFORM_USER_REQUIRED',
      role: req.user.role,
    });
    return;
  }

  next();
}