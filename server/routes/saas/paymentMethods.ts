/**
 * @file paymentMethods.ts
 * @description Sub-router de métodos de pago del SaaS.
 *
 * Endpoints:
 *   GET /api/saas/payment-methods/public   → lista pública (sin auth)
 *
 * El endpoint público se usa desde el formulario de registro para que el
 * usuario elija cómo pagar (manual, crypto, automático).
 *
 * En sesiones futuras (3.5.C.1) se agregarán los endpoints admin:
 *   GET    /api/saas/payment-methods          → lista completa (Super Admin)
 *   POST   /api/saas/payment-methods          → crear (Super Admin)
 *   PATCH  /api/saas/payment-methods/:id      → editar (Super Admin)
 *   DELETE /api/saas/payment-methods/:id      → archivar (Super Admin)
 *
 * @see server/services/saasPaymentMethodsService.ts
 * @see server/types/paymentMethod.ts
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { listPublicPaymentMethods } from '../../services/saasPaymentMethodsService.js';

export const paymentMethodsRouter = Router();

// ─── GET /api/saas/payment-methods/public ────────────────────────────
/**
 * Lista pública de métodos de pago activos.
 *
 * Público (sin auth): el formulario de registro lo consume antes de que
 * el usuario tenga cuenta.
 *
 * Respuesta: { success: true, data: PublicPaymentMethod[] }
 *
 * ⚠️ NUNCA expone `provider_config_json` (contiene API keys de Stripe/PayPal)
 *    ni `crypto_explorer_api` (config interna del servidor).
 */
paymentMethodsRouter.get(
  '/public',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const methods = await listPublicPaymentMethods();

      res.json({
        success: true,
        data: methods,
      });
    } catch (err) {
      // Delegamos al error handler central de Express (definido en server/index.ts)
      next(err);
    }
  }
);