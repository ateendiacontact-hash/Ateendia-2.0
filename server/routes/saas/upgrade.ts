/**
 * Sub-router de upgrade demo → pago (Sesión 3.5.B.4.d).
 *
 * Endpoints (TODOS requieren JWT de usuario con rol tenant):
 *   GET  /api/saas/upgrade/eligibility → consulta si el tenant puede upgradear
 *   POST /api/saas/upgrade             → crea la solicitud de upgrade
 *
 * Seguridad:
 * - requireAuth: exige JWT válido.
 * - requireTenant: exige que el JWT tenga un tenant_id válido (no 'platform').
 * - El tenant_id NUNCA viene del body. Siempre viene del JWT del usuario
 *   autenticado (req.user.tenantId). Esto evita que el tenant A haga
 *   upgrade del tenant B.
 * - El rol se valida implícitamente: solo un tenant_admin puede acceder
 *   al panel del tenant donde vive este endpoint (frontend 3.5.B.4.e).
 *   El backend NO exige rol específico más allá del JWT, porque el
 *   upgrade es una acción del tenant sobre sí mismo.
 *
 * Diferencia con `registrationsRouter`:
 * - `registrationsRouter` es del Super Admin SaaS (requirePlatformUser).
 * - `upgradeRouter` es del tenant (requireAuth + requireTenant).
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  requireAuth,
  requireTenant,
  auditLog,
} from '../../middleware/index.js';
import {
  createUpgradeRequest,
  getUpgradeEligibility,
} from '../../services/saasUpgradeService.js';
import { RegistrationValidationError } from '../../services/saasRegistrationService.js';

export const upgradeRouter = Router();

// ─── Schemas Zod ────────────────────────────────────────────────────

/**
 * Body para crear la solicitud de upgrade.
 * No incluye datos de empresa/admin: se leen del tenant existente.
 */
const upgradeBodySchema = z
  .object({
    planId: z.string().min(1).max(64),
    billingCycle: z.enum(['monthly', 'yearly']),
    paymentMethodId: z.string().max(64).optional(),
    receiptUrl: z.string().url().max(2048).optional(),
    receiptFilename: z.string().max(255).optional(),
    receiptFileSize: z.string().max(32).optional(),
    cryptoTxHash: z.string().max(255).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Maneja errores de negocio del servicio. Si es RegistrationValidationError,
 * devuelve su `code` y mensaje con 400. Si no, delega al error handler.
 */
function handleError(
  err: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof RegistrationValidationError) {
    res.status(400).json({
      success: false,
      error: err.message,
      code: err.code ?? 'DOMAIN_VALIDATION_ERROR',
    });
    return;
  }
  next(err);
}

// ─── GET /api/saas/upgrade/eligibility ──────────────────────────────

/**
 * Consulta si el tenant autenticado puede solicitar un upgrade.
 *
 * Útil para que el frontend muestre el estado real al abrir la pantalla
 * de upgrade: si puede, si está en demo, si el grace ya expiró, etc.
 *
 * No requiere body. El tenant_id viene del JWT.
 */
upgradeRouter.get(
  '/eligibility',
  requireAuth,
  requireTenant,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const result = await getUpgradeEligibility(tenantId);
      res.json({ success: true, data: result });
    } catch (err) {
      handleError(err, res, next);
    }
  },
);

// ─── POST /api/saas/upgrade ─────────────────────────────────────────

/**
 * Crea una solicitud de upgrade demo → pago para el tenant autenticado.
 *
 * Flujo:
 * 1. requireAuth + requireTenant validan JWT.
 * 2. Zod valida el body.
 * 3. Se capturan IP y user-agent reales (server-side).
 * 4. El servicio valida elegibilidad + crea la solicitud con
 *    type='upgrade' y created_tenant_id = <tenant del JWT>.
 * 5. Se devuelve 201 con { requestId, expiresAt, ... }.
 *
 * El Super Admin verá esta solicitud en GET /api/saas/registrations
 * (ya existente) y podrá aprobarla/rechazarla con los endpoints
 * actuales. Al aprobar, `approveRegistration()` detecta type='upgrade'
 * y actualiza el tenant existente en lugar de crear uno nuevo.
 */
upgradeRouter.post(
  '/',
  requireAuth,
  requireTenant,
  auditLog('CREATE', 'saas_upgrade'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Validar body con Zod
      const parsed = upgradeBodySchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos de upgrade inválidos.',
          code: 'VALIDATION_ERROR',
          details:
            process.env.NODE_ENV === 'development'
              ? parsed.error.flatten()
              : undefined,
        });
        return;
      }

      // 2. Capturar IP y user-agent REALES del request.
      const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;
      const userAgent = req.headers['user-agent'] ?? null;

      // 3. Llamar al servicio con el tenantId DEL JWT (no del body).
      const tenantId = req.user!.tenantId;

      const result = await createUpgradeRequest(
        tenantId,
        parsed.data,
        {
          ipAddress,
          userAgent: typeof userAgent === 'string' ? userAgent : null,
        },
      );

      // 4. Responder 201 con el requestId para que el frontend pueda
      //    consultar el estado con el endpoint público ya existente.
      res.status(201).json({
        success: true,
        data: result,
        auditDetails: `Solicitó upgrade de tenant ${tenantId} al plan ${result.planName} (${result.billingCycle})`,
      });
    } catch (err) {
      handleError(err, res, next);
    }
  },
);