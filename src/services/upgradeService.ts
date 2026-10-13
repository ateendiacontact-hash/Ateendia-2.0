/**
 * @file upgradeService.ts
 * @description Cliente HTTP para el flujo de upgrade demo → pago.
 *
 * Endpoints consumidos:
 *   - GET  /api/saas/upgrade/eligibility  → checkEligibility()
 *   - POST /api/saas/upgrade              → createUpgradeRequest()
 *
 * Ambos requieren JWT de tenant (el usuario logueado en el demo).
 * El tenant_id NUNCA va en el body — el backend lo resuelve del JWT
 * (anti-IDOR, decisión arquitectónica registrada en AGENTS.md).
 *
 * Patrón: idéntico a `registrationService.ts` (sesión 3.5.B.4.a.1).
 * Devuelve resultados discriminados (success: true|false) en lugar de
 * lanzar excepciones, para que el componente que lo consume pueda
 * manejar ambos casos sin try/catch anidados.
 *
 * @see server/routes/saas/upgrade.ts — contrato exacto del backend
 * @see src/types/index.ts            — tipos UpgradeEligibility, etc.
 * @see src/services/registrationService.ts — patrón de referencia
 */

import type {
  UpgradeRequestPayload,
  UpgradeEligibility,
  UpgradeRequestResult,
  UpgradeEligibilityResult,
  UpgradeRequestOperationResult,
} from '../types';

// ────────────────────────────────────────────────────────────────────
// Helper: obtener el JWT del localStorage
// ────────────────────────────────────────────────────────────────────

/**
 * Lee el JWT del localStorage. El backend lo exige en el header
 * `Authorization: Bearer <token>`.
 *
 * ⚠️ Asumimos que authService persiste el token bajo la clave
 * 'ateendia_auth_token'. Si en el futuro cambia, ajustar acá.
 *
 * Si no hay token, devolvemos null y el servicio corta temprano
 * con un error AUTH_TOKEN_MISSING (sin hacer fetch).
 */
function getAuthToken(): string | null {
  try {
    // Intentamos varias claves por compatibilidad con versiones previas.
    return (
      localStorage.getItem('ateendia_auth_token') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      null
    );
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────
// Función: checkEligibility()
// ────────────────────────────────────────────────────────────────────

/**
 * Consulta si el tenant actual puede hacer upgrade a un plan pago.
 *
 * @returns Resultado discriminado con la elegibilidad o el error.
 *
 * @example
 * const result = await upgradeService.checkEligibility();
 * if (result.success) {
 *   if (result.data.eligible) {
 *     console.log('Puede upgradear. Demo expira:', result.data.demoExpiresAt);
 *   } else {
 *     console.log('No puede:', result.data.reason);
 *   }
 * } else {
 *   console.error('Error:', result.error, result.code);
 * }
 */
async function checkEligibility(): Promise<UpgradeEligibilityResult> {
  const token = getAuthToken();
  if (!token) {
    return {
      success: false,
      error: 'No hay sesión activa. Iniciá sesión de nuevo.',
      code: 'AUTH_TOKEN_MISSING',
    };
  }

  let response: Response;
  try {
    response = await fetch('/api/saas/upgrade/eligibility', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    // Error de red: backend caído, sin conexión, CORS mal configurado.
    return {
      success: false,
      error:
        'No pudimos conectar con el servidor. Verificá tu conexión e intentá de nuevo.',
      code: 'NETWORK_ERROR',
      details: err instanceof Error ? err.message : String(err),
    };
  }

  // Intentamos parsear el body como JSON en ambos casos.
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

  // ─── Caso éxito (200) ──────────────────────────────────────────
  if (response.ok) {
    // El backend devuelve { success: true, data: UpgradeEligibility }
    const successBody = body as { success: true; data: UpgradeEligibility };
    if (!successBody?.data) {
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

  // ─── Caso error (4xx, 5xx) ─────────────────────────────────────
  const errorBody = body as Partial<{
    success: false;
    error: string;
    code: string;
  }>;

  const knownCodes = [
    'AUTH_TOKEN_MISSING',
    'AUTH_TOKEN_INVALID',
    'TENANT_NOT_FOUND',
    'INTERNAL_ERROR',
  ] as const;

  const code =
    errorBody?.code &&
    (knownCodes as readonly string[]).includes(errorBody.code)
      ? (errorBody.code as (typeof knownCodes)[number])
      : 'UNKNOWN_ERROR';

  return {
    success: false,
    error:
      errorBody?.error ||
      `Error del servidor (HTTP ${response.status}). Intentá de nuevo.`,
    code,
    details: errorBody,
  };
}

// ────────────────────────────────────────────────────────────────────
// Función: createUpgradeRequest()
// ────────────────────────────────────────────────────────────────────

/**
 * Crea una solicitud de upgrade demo → pago.
 *
 * El tenant_id se resuelve del JWT en el backend. El body solo lleva
 * los datos de plan/pago elegidos por el usuario.
 *
 * @param payload - Datos del formulario de upgrade.
 * @returns Resultado discriminado con el requestId o el error.
 *
 * @example
 * const result = await upgradeService.createUpgradeRequest({
 *   planId: 'plan-starter',
 *   billingCycle: 'monthly',
 *   paymentMethodId: 'pm-zelle',
 * });
 * if (result.success) {
 *   console.log('Solicitud creada:', result.data.requestId);
 * } else {
 *   console.error('Error:', result.error, result.code);
 * }
 */
async function createUpgradeRequest(
  payload: UpgradeRequestPayload
): Promise<UpgradeRequestOperationResult> {
  const token = getAuthToken();
  if (!token) {
    return {
      success: false,
      error: 'No hay sesión activa. Iniciá sesión de nuevo.',
      code: 'AUTH_TOKEN_MISSING',
    };
  }

  let response: Response;
  try {
    response = await fetch('/api/saas/upgrade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      success: false,
      error:
        'No pudimos conectar con el servidor. Verificá tu conexión e intentá de nuevo.',
      code: 'NETWORK_ERROR',
      details: err instanceof Error ? err.message : String(err),
    };
  }

  // Parseamos el body como JSON en ambos casos.
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

  // ─── Caso éxito (201) ──────────────────────────────────────────
  if (response.ok) {
    // El backend devuelve { success: true, data: UpgradeRequestResult }
    const successBody = body as { success: true; data: UpgradeRequestResult };
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

  // ─── Caso error (4xx, 5xx) ─────────────────────────────────────
  const errorBody = body as Partial<{
    success: false;
    error: string;
    code: string;
  }>;

  const knownCodes = [
    'VALIDATION_ERROR',
    'PLAN_NOT_FOUND',
    'PLAN_NOT_PUBLIC',
    'UPGRADE_ALREADY_PENDING',
    'TENANT_NOT_ELIGIBLE',
    'AUTH_TOKEN_MISSING',
    'AUTH_TOKEN_INVALID',
  ] as const;

  const code =
    errorBody?.code &&
    (knownCodes as readonly string[]).includes(errorBody.code)
      ? (errorBody.code as (typeof knownCodes)[number])
      : 'UNKNOWN_ERROR';

  return {
    success: false,
    error:
      errorBody?.error ||
      `Error del servidor (HTTP ${response.status}). Intentá de nuevo.`,
    code,
    details: errorBody,
  };
}

// ────────────────────────────────────────────────────────────────────
// Export
// ────────────────────────────────────────────────────────────────────

/**
 * Servicio de upgrade. Exportado como objeto para mantener el patrón
 * del resto del proyecto (registrationService, authService, etc.).
 */
export const upgradeService = {
  checkEligibility,
  createUpgradeRequest,
};