/**
 * Router de gestión de tenants para el panel Super Admin SaaS.
 *
 * Endpoints:
 * - GET /api/saas/tenants  → lista TODOS los tenants con stats agregadas.
 *
 * Protegido por `requireAuth` + `requirePlatformUser`.
 *
 * @see server/services/saasTenantsService.ts
 * @see server/middleware/rbac.ts (requirePlatformUser)
 */

import { Router } from 'express';
import { requireAuth, requirePlatformUser } from '../../middleware/index.js';
import { listAllTenants } from '../../services/saasTenantsService.js';

export const saasTenantsRouter = Router();

// ────────────────────────────────────────────────────────────────────
// GET /api/saas/tenants
// ────────────────────────────────────────────────────────────────────

/**
 * Lista TODOS los tenants de la DB con stats agregadas.
 *
 * Requiere: JWT de `saas_super_admin`.
 *
 * @returns `{ success: true, data: SaasTenantDTO[] }`
 */
saasTenantsRouter.get(
  '/',
  requireAuth,
  requirePlatformUser,
  async (_req, res) => {
    try {
      const tenants = await listAllTenants();
      res.json({
        success: true,
        data: tenants,
      });
    } catch (error) {
      console.error('[saas/tenants] Error al listar tenants:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener la lista de empresas.',
        code: 'INTERNAL_ERROR',
      });
    }
  },
);