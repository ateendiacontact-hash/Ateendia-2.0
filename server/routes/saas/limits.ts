// server/routes/saas/limits.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireTenant } from '../../middleware/tenant.js';
import { getTenantLimits } from '../../services/saasLimitsService.js';
import type { GetLimitsResult } from '../../types/limits.js';

export const limitsRouter = Router();

// GET /api/saas/me/limits
// Devuelve los límites del plan y el uso actual para el tenant del usuario autenticado.
limitsRouter.get('/', requireAuth, requireTenant, async (req, res) => {
  try {
    // Regla 22: Los super admins no tienen límites de plan. Devolvemos datos vacíos o un mensaje.
    // Aunque el frontend no debería llamar a esto para un super admin, es una buena salvaguarda.
    if (req.user?.role === 'saas_super_admin') {
      return res.status(200).json({
        success: true,
        data: {
          planName: 'Platform Admin',
          limits: {
            users: { limit: -1, current: 0 },
            clients: { limit: -1, current: 0 },
            policies: { limit: -1, current: 0 },
          },
        },
      } satisfies GetLimitsResult);
    }

    const tenantId = req.tenantId;

    if (!tenantId) {
      // Esto no debería pasar después de requireTenant, pero es una salvaguarda.
      return res.status(400).json({
        success: false,
        error: 'El contexto del tenant no está definido.',
        code: 'INTERNAL_ERROR',
      } satisfies GetLimitsResult);
    }

    const limitsData = await getTenantLimits(tenantId);

    return res.status(200).json({
      success: true,
      data: limitsData,
    } satisfies GetLimitsResult);
  } catch (error) {
    console.error('[GET /api/saas/me/limits] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: `No se pudieron obtener los límites del plan: ${errorMessage}`,
      code: 'INTERNAL_ERROR',
    } satisfies GetLimitsResult);
  }
});