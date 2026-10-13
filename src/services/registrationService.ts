/**
 * @file registrationService.ts
 * @description Cliente HTTP para el endpoint público POST /api/saas/register
 *              y GET /api/saas/registrations/:requestId/status.
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
 * @see server/routes/saas/register.ts — contrato exacto del backend (POST)
 * @see server/routes/saas/registrationStatus.ts — contrato exacto (GET status)
 * @see src/types/index.ts — tipos RegisterRequestPayload, RegisterResponse,
 *      FetchStatusResult, etc.
 */

import type {
  RegisterRequestPayload,
  RegisterResponse,
  RegisterErrorResponse,
  RegisterRequestResult,
  RegistrationStatusDTO,
  RegistrationStatusSuccessResponse,
  RegistrationStatusErrorResponse,
  FetchStatusResult,
  // ═══════════════════════════════════════════════════════════════
  // NUEVOS TIPOS — Sesión 3.5.B.4.e (catálogos públicos)
  // ═══════════════════════════════════════════════════════════════
  SaasPlanPublic,
  SaasPlansPublicResponse,
  PublicPaymentMethod,
  PublicPaymentMethodsResponse,
} from '../types';

// ────────────────────────────────────────────────────────────────────
// Tipos locales (solo registro, no consulta de estado)
// ────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────
// Función: register()
// ────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────
// Función: fetchRegistrationStatus()
// ────────────────────────────────────────────────────────────────────

/**
 * Consulta el estado público de una solicitud de registro.
 *
 * Endpoint: GET /api/saas/registrations/:requestId/status
 * Público (sin auth). Rate limit: 10 req/15min por IP.
 *
 * @param requestId - UUID de la solicitud (tal como lo devolvió el POST /register).
 * @returns Resultado discriminado (success true/false).
 *
 * @example
 * const result = await registrationService.fetchRegistrationStatus('03fd...');
 * if (result.success) {
 *   console.log('Estado:', result.data.status);
 * } else {
 *   console.error('Error:', result.error, result.code);
 * }
 */
async function fetchRegistrationStatus(
  requestId: string
): Promise<FetchStatusResult> {
  let response: Response;

  try {
    response = await fetch(
      `/api/saas/registrations/${encodeURIComponent(requestId)}/status`,
      { method: 'GET' }
    );
  } catch (err) {
    // Error de red: backend caído, sin conexión, CORS mal configurado, etc.
    return {
      success: false,
      error:
        'No pudimos conectar con el servidor. Verificá tu conexión e intentá de nuevo.',
      code: 'NETWORK_ERROR',
      details: err instanceof Error ? err.message : String(err),
    };
  }

  // Parseamos el body como JSON en ambos casos (éxito y error).
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
    // El backend responde RegistrationStatusSuccessResponse:
    // { success: true, data: RegistrationStatusDTO }
    const successBody = body as RegistrationStatusSuccessResponse;

    // Defensa: si el backend devuelve 2xx sin `data` o sin `status`,
    // lo tratamos como error para no propagar undefined.
    if (!successBody?.data?.status) {
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
  // El backend responde RegistrationStatusErrorResponse:
  // { success: false, error, code }
  const errorBody = body as Partial<RegistrationStatusErrorResponse>;

  // Normalizamos el code: si viene uno conocido, lo usamos; si no, UNKNOWN_ERROR.
  const knownCodes = [
    'INVALID_REQUEST_ID',
    'REGISTRATION_NOT_FOUND',
    'RATE_LIMIT_EXCEEDED',
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
// Función: fetchPlansPublic()
// ────────────────────────────────────────────────────────────────────

/**
 * Carga el catálogo público de planes SaaS.
 *
 * Endpoint: GET /api/saas/plans/public (sin auth)
 *
 * Se usa en:
 *   - RegisterForm (para mostrar los planes disponibles)
 *   - TenantUpgradeView (para el selector de plan destino)
 *
 * @returns Resultado discriminado con el array de planes o el error.
 *
 * @example
 * const result = await registrationService.fetchPlansPublic();
 * if (result.success) {
 *   console.log('Planes:', result.data.map(p => p.name));
 * }
 */
async function fetchPlansPublic(): Promise<
  | { success: true; data: SaasPlanPublic[] }
  | { success: false; error: string; code: string; details?: unknown }
> {
  let response: Response;
  try {
    response = await fetch('/api/saas/plans/public', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
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

  if (response.ok) {
    // El backend responde SaasPlansPublicResponse: { success: true, plans: [...] }
    // ⚠️ OJO: el backend usa `plans` (no `data`) en este endpoint.
    const successBody = body as SaasPlansPublicResponse;
    if (!Array.isArray(successBody?.plans)) {
      return {
        success: false,
        error: 'El servidor respondió con un formato inesperado.',
        code: 'UNKNOWN_ERROR',
        details: body,
      };
    }
    return {
      success: true,
      data: successBody.plans,
    };
  }

  const errorBody = body as Partial<{
    success: false;
    error: string;
    code: string;
  }>;

  return {
    success: false,
    error:
      errorBody?.error ||
      `Error del servidor (HTTP ${response.status}). Intentá de nuevo.`,
    code: errorBody?.code || 'UNKNOWN_ERROR',
    details: errorBody,
  };
}

// ────────────────────────────────────────────────────────────────────
// Función: fetchPaymentMethodsPublic()
// ────────────────────────────────────────────────────────────────────

/**
 * Carga el catálogo público de métodos de pago.
 *
 * Endpoint: GET /api/saas/payment-methods/public (sin auth)
 *
 * Se usa en:
 *   - RegisterForm (para mostrar métodos de pago disponibles)
 *   - TenantUpgradeView (para el selector de método de pago)
 *
 * @returns Resultado discriminado con el array de métodos o el error.
 *
 * @example
 * const result = await registrationService.fetchPaymentMethodsPublic();
 * if (result.success) {
 *   console.log('Métodos:', result.data.map(m => m.name));
 * }
 */
async function fetchPaymentMethodsPublic(): Promise<
  | { success: true; data: PublicPaymentMethod[] }
  | { success: false; error: string; code: string; details?: unknown }
> {
  let response: Response;
  try {
    response = await fetch('/api/saas/payment-methods/public', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
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

  if (response.ok) {
    // El backend responde PublicPaymentMethodsResponse: { success: true, data: [...] }
    const successBody = body as PublicPaymentMethodsResponse;
    if (!Array.isArray(successBody?.data)) {
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

  const errorBody = body as Partial<{
    success: false;
    error: string;
    code: string;
  }>;

  return {
    success: false,
    error:
      errorBody?.error ||
      `Error del servidor (HTTP ${response.status}). Intentá de nuevo.`,
    code: errorBody?.code || 'UNKNOWN_ERROR',
    details: errorBody,
  };
}


// ────────────────────────────────────────────────────────────────────
// Export
// ────────────────────────────────────────────────────────────────────

/**
 * Servicio de registro. Exportado como objeto para mantener el patrón
 * del resto del proyecto (authService, clientsService, etc. son objetos).
 */
export const registrationService = {
  register,
  fetchRegistrationStatus,
  fetchPlansPublic,
  fetchPaymentMethodsPublic,
};