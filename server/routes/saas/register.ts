/**
 * Router público de registro de nuevas empresas (Sesión 3.5.B.3.a).
 *
 * Endpoint:
 *   POST /api/saas/register
 *
 * Características:
 * - Público (sin auth). Cualquiera desde la landing puede registrarse.
 * - Rate limiting: 5 requests por IP cada 15 minutos.
 * - Validación de payload con Zod.
 * - Captura de IP y user-agent REALES (server-side, no confía en el front).
 * - Respuesta minimalista anti-enumeración (no revela si email ya existe).
 * - Audit log automático.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  createRegistrationRequest,
  RegistrationValidationError,
} from '../../services/saasRegistrationService.js';
import type { RegisterRequestPayload } from '../../types/registration.js';

export const registerRouter = Router();

// ─── Rate limiting ─────────────────────────────────────────────────
/**
 * 5 requests por IP cada 15 minutos.
 * - No afecta a un usuario legítimo (se registra 1 vez).
 * - Bloquea spam/scraping/bots.
 * - `standardHeaders: true` agrega headers `RateLimit-*`.
 * - `legacyHeaders: false` desactiva los `X-RateLimit-*` viejos.
 */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 requests por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Demasiadas solicitudes de registro. Intentá más tarde.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// ─── Schema de validación con Zod ──────────────────────────────────
/**
 * Validación de forma (tipos, formatos).
 * Las reglas de negocio (ej. type='demo'|'payment') las valida el servicio.
 */
const registerSchema = z
  .object({
    type: z.enum(['demo', 'payment']),

    // Empresa
    companyName: z.string().min(2).max(255),
    companyTaxId: z.string().max(64).optional(),
    companyEmail: z.string().email().max(255),
    companyPhone: z.string().min(5).max(32),
    companyCountry: z.string().max(64).optional(),
    companyCity: z.string().max(64).optional(),

    // Admin
    adminName: z.string().min(2).max(255),
    adminEmail: z.string().email().max(255),
    adminPhone: z.string().max(32).optional(),
    adminPosition: z.string().max(128).optional(),
    adminPassword: z.string().min(8).max(128),

    // Plan
    planId: z.string().min(1).max(64),
    planKey: z.string().min(1).max(64),
    planName: z.string().min(1).max(128),
    billingCycle: z.enum(['monthly', 'yearly']),
    priceAmount: z.number().min(0),
    currency: z.string().min(3).max(8),

    // Pago (opcional, requerido si type='payment' — validado en servicio)
    paymentMethodId: z.string().max(64).optional(),
    paymentMethodKey: z.string().max(64).optional(),
    paymentMethodName: z.string().max(128).optional(),

    // Comprobante (opcional)
    receiptUrl: z.string().url().max(2048).optional(),
    receiptFilename: z.string().max(255).optional(),
    receiptFileSize: z.string().max(32).optional(),

    // Crypto (opcional)
    cryptoTxHash: z.string().max(255).optional(),

    // Marketing
    referralSource: z.string().max(128).optional(),
  })
  .strict(); // ← rechaza campos desconocidos (defensa contra inyección)

// ─── Handler ───────────────────────────────────────────────────────
/**
 * POST /api/saas/register
 *
 * Flujo:
 * 1. Rate limit.
 * 2. Validar con Zod.
 * 3. Capturar IP y user-agent reales.
 * 4. Llamar al servicio.
 * 5. Responder 201 con { requestId, expiresAt }.
 * 6. Errores: 400 si validación falla, 500 si algo explota.
 */
registerRouter.post(
  '/',
  registerLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Validar con Zod
      const parsed = registerSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos de registro inválidos.',
          code: 'VALIDATION_ERROR',
          // No exponemos detalles internos de Zod en producción (seguridad).
          // En dev, podemos incluirlos para debug.
          details:
            process.env.NODE_ENV === 'development'
              ? parsed.error.flatten()
              : undefined,
        });
        return;
      }

      // 2. Capturar IP y user-agent REALES del request.
      //    - `req.ip` requiere `app.set('trust proxy', ...)` en Express si
      //      estamos detrás de un proxy (nginx, Cloudflare). Lo configuraremos
      //      en producción.
      //    - Fallback a `req.socket.remoteAddress` si `req.ip` no está.
      const ipAddress =
        req.ip ?? req.socket.remoteAddress ?? null;
      const userAgent = req.headers['user-agent'] ?? null;

      // 3. Llamar al servicio
      const result = await createRegistrationRequest(
        parsed.data as RegisterRequestPayload,
        {
          ipAddress,
          userAgent: typeof userAgent === 'string' ? userAgent : null,
        },
      );

      // 4. Responder 201 con info minimalista
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      // Error de negocio (payload inválido a nivel dominio)
      if (err instanceof RegistrationValidationError) {
        res.status(400).json({
          success: false,
          error: err.message,
          code: 'DOMAIN_VALIDATION_ERROR',
        });
        return;
      }

      // Error inesperado → delegar al error handler central
      next(err);
    }
  },
);