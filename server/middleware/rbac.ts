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
// ===========================================

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';

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