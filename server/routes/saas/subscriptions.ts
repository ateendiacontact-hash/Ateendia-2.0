/**
 * @file subscriptions.ts
 * @description Sub-router de gestión de suscripciones SaaS.
 *
 * Endpoints:
 *   GET   /api/saas/subscriptions/me           → suscripción del tenant logueado.
 *   GET   /api/saas/subscriptions              → lista global (Super Admin).
 *   PATCH /api/saas/subscriptions/:id/status   → cambiar estado (Super Admin).
 *
 * Seguridad:
 * - `GET /me` requiere JWT pero NO `requirePlatformUser` (cualquier admin
 *   del tenant puede ver SU suscripción).
 * - `GET /` y `PATCH /:id/status` requieren `requirePlatformUser`.
 * - Todos auditan con `auditLog` (fire-and-forget).
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  requireAuth,
  requirePlatformUser,
  auditLog,
} from '../../middleware/index.js';
import {
  getSubscriptionByTenantId,
  listAllSubscriptions,
  updateSubscriptionStatus,
  SubscriptionServiceError,
} from '../../services/saasSubscriptionService.js';

export const subscriptionsRouter = Router();

// ─── Schemas Zod ────────────────────────────────────────────────────

const updateStatusBodySchema = z
  .object({
    status: z.enum(['active', 'suspended', 'cancelled']),
  })
  .strict();

// ─── Helper de manejo de errores ────────────────────────────────────

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof SubscriptionServiceError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }
  next(err);
}

// ─── GET /api/saas/subscriptions/me ─────────────────────────────────

/**
 * Devuelve la suscripción del tenant logueado.
 *
 * ⚠️ El `tenantId` se toma del JWT (`req.user.tenantId`), NUNCA del
 * body/query. Esto previene que un usuario consulte datos de otro tenant.
 */
subscriptionsRouter.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const subscription = await getSubscriptionByTenantId(tenantId);

      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'Tu cuenta no tiene una suscripción registrada.',
          code: 'SUBSCRIPTION_NOT_FOUND',
        });
        return;
      }

      res.json({ success: true, data: subscription });
    } catch (err) {
      handleError(err, res, next);
    }
  },
);

// ─── GET /api/saas/subscriptions ────────────────────────────────────

/**
 * Lista todas las suscripciones del sistema (solo Super Admin).
 */
subscriptionsRouter.get(
  '/',
  requireAuth,
  requirePlatformUser,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const subscriptions = await listAllSubscriptions();
      res.json({ success: true, data: subscriptions });
    } catch (err) {
      handleError(err, res, next);
    }
  },
);

// ─── PATCH /api/saas/subscriptions/:id/status ───────────────────────

/**
 * Cambia el estado de una suscripción (y del tenant asociado).
 *
 * Body: { status: 'active' | 'suspended' | 'cancelled' }
 */
subscriptionsRouter.patch(
  '/:id/status',
  requireAuth,
  requirePlatformUser,
  auditLog('STATUS_CHANGE', 'saas_subscriptions'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateStatusBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Body inválido: se requiere "status" (active|suspended|cancelled)',
          code: 'INVALID_BODY',
          details: parsed.error.flatten(),
        });
        return;
      }

      const subscriptionId = req.params.id;
      const updated = await updateSubscriptionStatus(
        subscriptionId,
        parsed.data.status,
      );

      res.json({
        success: true,
        id: updated.id,
        data: updated,
        auditDetails: `Cambió estado de suscripción ${updated.id} a '${parsed.data.status}' (tenant: ${updated.tenantId})`,
      });
    } catch (err) {
      handleError(err, res, next);
    }
  },
);