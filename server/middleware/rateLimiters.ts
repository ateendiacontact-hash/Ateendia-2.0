/**
 * Rate limiters compartidos para endpoints públicos del dominio SaaS.
 *
 * Centraliza las políticas de rate limiting de la API pública para:
 * - Evitar duplicación de configuración entre endpoints.
 * - Tener un solo lugar donde auditar/ajustar las políticas.
 * - Facilitar la migración futura de limiters inline (ej. register.ts).
 *
 * Políticas vigentes:
 * - registerLimiter: 5 req / 15 min por IP. Aplica a POST /api/saas/register.
 *   Es una operación de ESCRITURA: un usuario legítimo lo hace 1 vez.
 * - statusLimiter:   10 req / 15 min por IP. Aplica a GET /api/saas/registrations/:id/status.
 *   Es una operación de LECTURA: el usuario puede refrescar varias veces mientras espera.
 *
 * ¿POR QUÉ POR IP Y NO POR TENANT?
 * - Ambos endpoints son PÚBLICOS (pre-autenticación): el usuario todavía no
 *   tiene cuenta ni JWT, por lo que NO existe tenantId disponible al momento
 *   de aplicar el limiter. La IP es la única dimensión posible para agrupar.
 * - Esto NO es un modo "pruebas": es la política estándar en producción para
 *   endpoints pre-auth (mismo enfoque que Stripe, Auth0, Vercel, GitHub).
 * - El rate limiting POR TENANT (ej: cuotas de uso del plan) es una capa
 *   DIFERENTE que se implementará sobre endpoints autenticados (via
 *   requireAuth + tenant context), no acá.
 *
 * SEGURIDAD Y PRIVACIDAD:
 * - La IP se usa SOLO como clave temporal en el MemoryStore interno de
 *   express-rate-limit. NO se persiste en DB, NO se loguea, NO se expone
 *   en respuestas HTTP. El contador se resetea cada 15 minutos.
 * - El propósito es exclusivamente defensivo: anti-spam, anti-enumeración
 *   de UUIDs, anti-DoS trivial. No se usa para analytics ni tracking.
 *
 * DECISIÓN DE DISEÑO:
 * - `standardHeaders: true` (headers RateLimit-*) y `legacyHeaders: false`
 *   (desactiva los X-RateLimit-* viejos) para seguir la spec más reciente.
 * - El mensaje de error es JSON consistente con el resto de la API:
 *   { success: false, error: string, code: 'RATE_LIMIT_EXCEEDED' }
 */

import rateLimit from 'express-rate-limit';

/**
 * Limiter para POST /api/saas/register.
 *
 * 5 requests por IP cada 15 minutos.
 * - Un usuario legítimo se registra 1 sola vez.
 * - Bloquea spam de registros, scraping y bots.
 */
export const registerLimiter = rateLimit({
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

/**
 * Limiter para GET /api/saas/registrations/:requestId/status.
 *
 * 10 requests por IP cada 15 minutos.
 * - El doble que registerLimiter porque consultar estado es de solo lectura.
 * - Un usuario puede refrescar varias veces mientras espera aprobación.
 * - Combinado con la respuesta 404 genérica (anti-enumeración), un atacante
 *   que intente adivinar requestIds válidos queda limitado a 40 intentos/hora.
 *   Con UUID v4 (122 bits de entropía), esto es computacionalmente inviable.
 */
export const statusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 requests por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Demasiadas consultas de estado. Intentá más tarde.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});