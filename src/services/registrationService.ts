/**
 * @file registrationService.ts
 * @description Cliente HTTP para el endpoint público POST /api/saas/register.
 *
 * Responsabilidades:
 * - Enviar el payload tipado (RegisterRequestPayload) al backend.
 * - Interpretar la respuesta (éxito o error controlado) sin lanzar excepciones
 *   para errores esperados (400, 429, etc.).
 * - Devolver un resultado discriminado (success: true|false) para que el
 *   componente que lo consume pueda manejar ambos casos sin try/catch anidados.
 *
 * NO valida el payload — eso lo hace el backend con Zod. La validación
 * client-side (por ej. "password mínimo 8 chars") es responsabilidad del
 * componente RegisterForm, para dar feedback inmediato al usuario.
 *
 * @see server/routes/saas/register.ts — contrato exacto del backend
 * @see src/types/index.ts — tipos RegisterRequestPayload, RegisterResponse, etc.
 */

import type {
  RegisterRequestPayload,
  RegisterResponse,
  RegisterErrorResponse,
  RegisterRequestResult,
} from '../types';

/**
 * Resultado discriminado del intento de registro.
 *
 * - Si `success: true`, `data` tiene `requestId` y `expiresAt`.
 * - Si `success: false`, `error` y `code` describen el fallo.
 *
 * El `code` puede ser:
 * - 'VALIDATION_ERROR'        → payload inválido (400, Zod rechazó)
 * - 'DOMAIN_VALIDATION_ERROR' → regla de negocio (400, ej. type=payment sin datos de pago)
 * - 'RATE_LIMIT_EXCEEDED'     → 429, demasiados intentos
 * - 'NETWORK_ERROR'           → backend caído o sin red (no viene del backend)
 * - 'UNKNOWN_ERROR'           → respuesta no esperada (5xx, JSON malformado)
 */
export type RegistrationResult =
  | { success: true; data: RegisterRequestResult }
  | {
      success: false;
      error: string;
      code:
        | 'VALIDATION_ERROR'
        | 'DOMAIN_VALIDATION_ERROR'
        | 'RATE_LIMIT_EXCEEDED'
        | 'NETWORK_ERROR'
        | 'UNKNOWN_ERROR';
      details?: unknown;
    };

/**
 * Envía una solicitud de registro al backend.
 *
 * @param payload - Datos del formulario de registro (ya validados client-side).
 * @returns Resultado discriminado (success true/false).
 *
 * @example
 * const result = await registrationService.register({
 *   type: 'demo',
 *   companyName: 'Agencia Demo',
 *   ...
 * });
 *
 * if (result.success) {
 *   console.log('Request ID:', result.data.requestId);
 * } else {
 *   console.error('Error:', result.error, result.code);
 * }
 */
async function register(
  payload: RegisterRequestPayload
): Promise<RegistrationResult> {
  let response: Response;

  try {
    response = await fetch('/api/saas/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Error de red: backend caído, sin conexión, CORS mal configurado, etc.
    // No llega respuesta HTTP, así que no hay status code.
    return {
      success: false,
      error:
        'No pudimos conectar con el servidor. Verificá tu conexión e intentá de nuevo.',
      code: 'NETWORK_ERROR',
      details: err instanceof Error ? err.message : String(err),
    };
  }

  // Intentamos parsear el body como JSON en ambos casos (éxito y error).
  // Si falla el parseo (por ejemplo, backend devolvió HTML en un 500),
  // capturamos el error y devolvemos UNKNOWN_ERROR.
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return {
      success: false,
      error: `Respuesta inesperada del servidor (HTTP ${response.status}).`,
      code: 'UNKNOWN_ERROR',
      details: `No se pudo parsear el body como JSON. Status: ${response.status}`,
    };
  }

  // ─── Caso éxito (2xx) ──────────────────────────────────────────────
  if (response.ok) {
    // El backend responde RegisterResponse: { success: true, data: {...} }
    const successBody = body as RegisterResponse;

    // Defensa: si por algún motivo el backend devuelve 2xx sin `data`,
    // lo tratamos como error para no propagar undefined.
    if (!successBody?.data?.requestId) {
      return {
        success: false,
        error: 'El servidor respondió con un formato inesperado.',
        code: 'UNKNOWN_ERROR',
        details: body,
      };
    }

    return {
      success: true,
      data: successBody.data,
    };
  }

  // ─── Caso error (4xx, 5xx) ─────────────────────────────────────────
  // El backend responde RegisterErrorResponse: { success: false, error, code }
  const errorBody = body as Partial<RegisterErrorResponse>;

  // Normalizamos el code: si viene uno conocido, lo usamos; si no, UNKNOWN_ERROR.
  const knownCodes = [
    'VALIDATION_ERROR',
    'DOMAIN_VALIDATION_ERROR',
    'RATE_LIMIT_EXCEEDED',
  ] as const;

  const code =
    errorBody?.code && (knownCodes as readonly string[]).includes(errorBody.code)
      ? (errorBody.code as typeof knownCodes[number])
      : 'UNKNOWN_ERROR';

  return {
    success: false,
    error:
      errorBody?.error ||
      `Error del servidor (HTTP ${response.status}). Intentá de nuevo.`,
    code,
    details: errorBody?.details,
  };
}

/**
 * Servicio de registro. Exportado como objeto para mantener el patrón
 * del resto del proyecto (authService, clientsService, etc. son objetos).
 */
export const registrationService = {
  register,
};