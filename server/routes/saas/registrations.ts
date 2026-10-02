/**
 * Sub-router del panel Super Admin para aprobar/rechazar registros
 * de nuevas empresas (Sesión 3.5.B.3.b).
 *
 * Endpoints:
 *   GET  /api/saas/registrations             → listar (con filtros)
 *   POST /api/saas/registrations/:id/approve → aprobar (crea tenant+user+sub)
 *   POST /api/saas/registrations/:id/reject  → rechazar
 *
 * Seguridad:
 * - Todos requieren JWT válido (requireAuth).
 * - Todos requieren rol `saas_super_admin` (requirePlatformUser).
 * - Todos auditan con auditLog (fire-and-forget, solo 2xx).
 * - Los errores de dominio devuelven códigos HTTP semánticos.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  requireAuth,
  requirePlatformUser,
  auditLog,
} from '../../middleware/index.js';
import {
  listRegistrations,
  approveRegistration,
  rejectRegistration,
  RegistrationReviewError,
  type ListRegistrationsFilters,
} from '../../services/saasRegistrationReviewService.js';

export const registrationsRouter = Router();

// ─── Schemas Zod ────────────────────────────────────────────────────

/** Query params para el listado. */
const listQuerySchema = z
  .object({
    status: z.enum(['pending', 'approved', 'rejected', 'expired', 'all']).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();

/** Body para aprobar. */
const approveBodySchema = z
  .object({
    notes: z.string().max(2000).optional(),
  })
  .strict();

/** Body para rechazar. */
const rejectBodySchema = z
  .object({
    reason: z.string().min(3).max(2000),
  })
  .strict();

// ─── Helper de manejo de errores ────────────────────────────────────

/**
 * Maneja errores de los handlers: si es RegistrationReviewError, devuelve
 * su statusCode y code. Si no, delega al error handler central.
 */
function handleError(
  err: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof RegistrationReviewError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }
  next(err);
}

// ─── GET /api/saas/registrations ────────────────────────────────────

/**
 * Lista solicitudes de registro con filtro por status y paginación.
 * Ejecuta lazy check de expiración antes de devolver.
 *
 * Query params:
 *   - status: 'pending' | 'approved' | 'rejected' | 'expired' | 'all' (default: 'all')
 *   - limit:  1-200 (default: 50)
 *   - offset: >= 0 (default: 0)
 */
registrationsRouter.get(
  '/',
  requireAuth,
  requirePlatformUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = listQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Parámetros de consulta inválidos',
          code: 'INVALID_QUERY_PARAMS',
          details: parsed.error.flatten(),
        });
        return;
      }

      const filters: ListRegistrationsFilters = {
        status: parsed.data.status ?? 'all',
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      };

      const result = await listRegistrations(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      handleError(err, res, next);
    }
  },
);

// ─── POST /api/saas/registrations/:id/approve ──────────────────────

/**
 * Aprueba una solicitud de registro.
 *
 * Efecto: crea tenant + user admin + subscription en transacción atómica.
 * Devuelve el password temporal UNA SOLA VEZ (para enviarlo por email).
 *
 * Body: { notes?: string }
 */
registrationsRouter.post(
  '/:id/approve',
  requireAuth,
  requirePlatformUser,
  auditLog('STATUS_CHANGE', 'saas_registrations'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = approveBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Body inválido',
          code: 'INVALID_BODY',
          details: parsed.error.flatten(),
        });
        return;
      }

      const requestId = req.params.id;
      const reviewerUserId = req.user!.userId;

      const result = await approveRegistration(
        requestId,
        reviewerUserId,
        parsed.data.notes,
      );

      // `id` en la respuesta para que auditLog capture targetId
      res.status(200).json({
        success: true,
        id: result.requestId,
        data: result,
        auditDetails: `Aprobó registro ${result.requestId} (tenant: ${result.subdomain})`,
      });
    } catch (err) {
      handleError(err, res, next);
    }
  },
);

// ─── POST /api/saas/registrations/:id/reject ───────────────────────

/**
 * Rechaza una solicitud de registro.
 *
 * Body: { reason: string } (mínimo 3 chars)
 */
registrationsRouter.post(
  '/:id/reject',
  requireAuth,
  requirePlatformUser,
  auditLog('STATUS_CHANGE', 'saas_registrations'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = rejectBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Body inválido: se requiere "reason" (mínimo 3 caracteres)',
          code: 'INVALID_BODY',
          details: parsed.error.flatten(),
        });
        return;
      }

      const requestId = req.params.id;
      const reviewerUserId = req.user!.userId;

      const result = await rejectRegistration(
        requestId,
        reviewerUserId,
        parsed.data.reason,
      );

      res.status(200).json({
        success: true,
        id: result.requestId,
        data: result,
        auditDetails: `Rechazó registro ${result.requestId}: ${parsed.data.reason.slice(0, 100)}`,
      });
    } catch (err) {
      handleError(err, res, next);
    }
  },
);