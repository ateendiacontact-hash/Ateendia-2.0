/**
 * @file subscriptionService.ts
 * @description Cliente HTTP para la gestión de suscripciones SaaS.
 *
 * Endpoints consumidos:
 *   - GET   /api/saas/subscriptions/me          (tenant logueado)
 *   - GET   /api/saas/subscriptions             (Super Admin)
 *   - PATCH /api/saas/subscriptions/:id/status  (Super Admin)
 *
 * Aplica Regla 29: type guard estricto sobre response.json().
 */

import { authService } from './authService';
import type { SubscriptionDTO } from '../types';

// ────────────────────────────────────────────────────────────────────
// Tipos de respuesta
// ────────────────────────────────────────────────────────────────────

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// ────────────────────────────────────────────────────────────────────
// Función: getMySubscription()
// ────────────────────────────────────────────────────────────────────

/**
 * Obtiene la suscripción del tenant logueado.
 *
 * @returns Resultado discriminado. Si el tenant no tiene suscripción,
 *          devuelve success: false con code: 'SUBSCRIPTION_NOT_FOUND'.
 */
async function getMySubscription(): Promise<ApiResult<SubscriptionDTO>> {
  let response: Response;

  try {
    response = await authService.fetchWithAuth('/api/saas/subscriptions/me', {
      method: 'GET',
    });
  } catch (err) {
    return {
      success: false,
      error: 'No pudimos conectar con el servidor.',
      code: 'NETWORK_ERROR',
    };
  }

  // Parseo seguro del body (Regla 29)
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return {
      success: false,
      error: `Respuesta inesperada del servidor (HTTP ${response.status}).`,
      code: 'UNKNOWN_ERROR',
    };
  }

  if (response.ok) {
    // Type guard: verificar estructura { success: true, data: SubscriptionDTO }
    if (
      typeof body === 'object' &&
      body !== null &&
      'success' in body &&
      (body as { success: unknown }).success === true &&
      'data' in body &&
      typeof (body as { data: unknown }).data === 'object'
    ) {
      const data = (body as { data: SubscriptionDTO }).data;
      return { success: true, data };
    }
    return {
      success: false,
      error: 'El servidor respondió con un formato inesperado.',
      code: 'UNKNOWN_ERROR',
    };
  }

  // Error: extraer mensaje y código
  const errorBody = body as Partial<{ success: false; error: string; code: string }>;
  return {
    success: false,
    error: errorBody?.error || `Error del servidor (HTTP ${response.status}).`,
    code: errorBody?.code || 'UNKNOWN_ERROR',
  };
}

// ────────────────────────────────────────────────────────────────────
// Función: listAllSubscriptions()
// ────────────────────────────────────────────────────────────────────

/**
 * Lista todas las suscripciones (solo Super Admin).
 */
async function listAllSubscriptions(): Promise<ApiResult<SubscriptionDTO[]>> {
  let response: Response;

  try {
    response = await authService.fetchWithAuth('/api/saas/subscriptions', {
      method: 'GET',
    });
  } catch (err) {
    return {
      success: false,
      error: 'No pudimos conectar con el servidor.',
      code: 'NETWORK_ERROR',
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
    };
  }

  if (response.ok) {
    // Type guard: verificar { success: true, data: SubscriptionDTO[] }
    if (
      typeof body === 'object' &&
      body !== null &&
      'success' in body &&
      (body as { success: unknown }).success === true &&
      'data' in body &&
      Array.isArray((body as { data: unknown }).data)
    ) {
      const data = (body as { data: SubscriptionDTO[] }).data;
      return { success: true, data };
    }
    return {
      success: false,
      error: 'El servidor respondió con un formato inesperado.',
      code: 'UNKNOWN_ERROR',
    };
  }

  const errorBody = body as Partial<{ success: false; error: string; code: string }>;
  return {
    success: false,
    error: errorBody?.error || `Error del servidor (HTTP ${response.status}).`,
    code: errorBody?.code || 'UNKNOWN_ERROR',
  };
}

// ────────────────────────────────────────────────────────────────────
// Función: updateSubscriptionStatus()
// ────────────────────────────────────────────────────────────────────

/**
 * Cambia el estado de una suscripción (solo Super Admin).
 *
 * @param id - ID de la suscripción.
 * @param status - Nuevo estado ('active' | 'suspended' | 'cancelled').
 */
async function updateSubscriptionStatus(
  id: string,
  status: 'active' | 'suspended' | 'cancelled'
): Promise<ApiResult<SubscriptionDTO>> {
  let response: Response;

  try {
    response = await authService.fetchWithAuth(`/api/saas/subscriptions/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    return {
      success: false,
      error: 'No pudimos conectar con el servidor.',
      code: 'NETWORK_ERROR',
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
    };
  }

  if (response.ok) {
    if (
      typeof body === 'object' &&
      body !== null &&
      'success' in body &&
      (body as { success: unknown }).success === true &&
      'data' in body &&
      typeof (body as { data: unknown }).data === 'object'
    ) {
      const data = (body as { data: SubscriptionDTO }).data;
      return { success: true, data };
    }
    return {
      success: false,
      error: 'El servidor respondió con un formato inesperado.',
      code: 'UNKNOWN_ERROR',
    };
  }

  const errorBody = body as Partial<{ success: false; error: string; code: string }>;
  return {
    success: false,
    error: errorBody?.error || `Error del servidor (HTTP ${response.status}).`,
    code: errorBody?.code || 'UNKNOWN_ERROR',
  };
}

// ────────────────────────────────────────────────────────────────────
// Export
// ────────────────────────────────────────────────────────────────────

export const subscriptionService = {
  getMySubscription,
  listAllSubscriptions,
  updateSubscriptionStatus,
};