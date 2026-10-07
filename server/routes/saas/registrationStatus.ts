/**
 * Sub-router público de consulta de estado de solicitudes de registro
 * (Sesión 3.5.B.4.b).
 *
 * Endpoint:
 *   GET /api/saas/registrations/:requestId/status
 *
 * Características:
 * - Público (sin auth). El usuario todavía no tiene cuenta aprobada,
 *   por lo que no puede autenticarse. Es la única forma de que consulte
 *   el estado de su propia solicitud.
 * - Rate limiting: 10 req / 15 min por IP (statusLimiter).
 * - Validación estricta del param con Zod (.uuid()).
 * - Respuesta sanitizada (RegistrationStatusDTO) que excluye datos
 *   sensibles (emails, tax_id, comprobantes, notas internas, etc.).
 * - Anti-enumeración: 404 genérico si el UUID no existe. NO se revela
 *   si el ID existía o no.
 * - No audita (no hay usuario autenticado que auditar; y para una
 *   operación de solo lectura, el audit no aporta).
 *
 * Seguridad (ver AGENTS.md):
 * - El rate limit por IP es la única dimensión posible en un endpoint
 *   pre-auth. NO es "modo prueba": es la política estándar de producción
 *   para endpoints públicos.
 * - La IP no se persiste ni se loguea: express-rate-limit la usa como
 *   clave efímera en MemoryStore.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { statusLimiter } from '../../middleware/rateLimiters.js';
import { getRegistrationStatus } from '../../services/saasRegistrationService.js';

export const registrationStatusRouter = Router();

// ─── Schema de validación ──────────────────────────────────────────────

/**
 * Validación del param `requestId`.
 *
 * Requisitos:
 * - UUID v4 válido (formato estándar de 36 chars: 8-4-4-4-12 hex).
 * - El schema de Prisma lo declara VarChar(64), pero en la práctica
 *   todos los requestIds son UUID v4 generados con randomUUID().
 *   Validar con .uuid() filtra requests malformados antes de tocar DB.
 *
 * Nota: `.strict()` no aplica a params (solo a objetos); el schema
 * ya es restrictivo por construcción (un solo campo).
 */
const statusParamSchema = z.object({
  requestId: z.string().uuid(),
});

// ─── GET /api/saas/registrations/:requestId/status ─────────────────────

/**
 * Consulta el estado público de una solicitud de registro por su ID.
 *
 * Respuestas:
 * - 200 OK:   { success: true, data: RegistrationStatusDTO }
 * - 400 Bad:  { success: false, error: 'ID inválido', code: 'INVALID_REQUEST_ID' }
 * - 404 Not:  { success: false, error: 'Solicitud no encontrada', code: 'REGISTRATION_NOT_FOUND' }
 * - 429 Rate: { success: false, error: '...', code: 'RATE_LIMIT_EXCEEDED' }
 * - 500 Err:  (error handler central)
 *
 * Anti-enumeración:
 * - El 404 usa mensaje genérico ("Solicitud no encontrada"), idéntico
 *   para UUIDs válidos-inexistentes y UUIDs nunca-emitidos. Un atacante
 *   no puede distinguir "no existe" de "no lo puedo ver".
 * - Combinado con statusLimiter (10 req/15min), la enumeración masiva
 *   de UUIDs es inviable (UUID v4 = 122 bits de entropía).
 */
registrationStatusRouter.get(
  '/:requestId/status',
  statusLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Validar el param con Zod
      const parsed = statusParamSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'ID de solicitud inválido. Debe ser un UUID.',
          code: 'INVALID_REQUEST_ID',
        });
        return;
      }

      const { requestId } = parsed.data;

      // 2. Consultar el servicio (devuelve DTO sanitizado o null)
      const dto = await getRegistrationStatus(requestId);

      // 3. Anti-enumeración: 404 genérico si no existe
      if (dto === null) {
        res.status(404).json({
          success: false,
          error: 'Solicitud no encontrada',
          code: 'REGISTRATION_NOT_FOUND',
        });
        return;
      }

      // 4. Éxito
      res.status(200).json({
        success: true,
        data: dto,
      });
    } catch (err) {
      // El error handler central maneja 500 y logs.
      next(err);
    }
  },
);