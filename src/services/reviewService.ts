/**
 * @file reviewService.ts
 * @description Servicio frontend para la gestión de solicitudes de registro y comprobantes.
 * 
 * Este servicio reemplaza el uso de `saasService.receipts.*` que apuntaba a endpoints
 * inexistentes en el backend. Ahora se conecta con los endpoints reales:
 *   - GET  /api/saas/registrations?status=pending
 *   - POST /api/saas/registrations/:id/approve
 *   - POST /api/saas/registrations/:id/reject
 * 
 * Sesión #32: Creado para integrar el PaymentReceiptViewerModal con SaasSubscriptionsView.
 * Aplica estrictamente la Regla 29 (Type Guards sobre response.json()).
 */

import { authService } from './authService';
import type { SaasRegistrationRequest } from '../types';

// ─── Tipos de Payload y Resultado ───────────────────────────────────

export interface ApproveRegistrationPayload {
  notes?: string;
  validFrom?: string;
  validUntil?: string;
  receiptId?: string;
}

export interface ApproveRegistrationResult {
  requestId: string;
  tenantId: string;
  userId: string;
  subscriptionId: string;
  subdomain: string;
  tempPassword: string;
}

export interface RejectRegistrationResult {
  requestId: string;
  status: string;
  reviewedAt: string;
}

// ─── Helper de manejo de errores ────────────────────────────────────

/**
 * Extrae el mensaje de error de una respuesta fallida del backend.
 */
function extractErrorMessage(body: unknown, defaultMsg: string): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as { error: unknown }).error === 'string'
  ) {
    return (body as { error: string }).error;
  }
  return defaultMsg;
}

// ─── Servicio ───────────────────────────────────────────────────────

export const reviewService = {
    /**
   * Lista las solicitudes de registro.
   * @param status - 'pending' (default), 'all', 'approved', 'rejected'.
   */
  async listPendingRegistrations(
    status: 'pending' | 'all' | 'approved' | 'rejected' = 'pending'
  ): Promise<{ success: true; data: SaasRegistrationRequest[] } | { success: false; error: string }> {
    try {
      // Construimos la URL con el query param de estado
      const url = `/api/saas/registrations?status=${status}`;
      const res = await authService.fetchWithAuth(url);
      const body: unknown = await res.json();

      // Regla 29: Type guard flexible para aceptar { data: [...] } o { data: { items: [...] } }
      if (
        typeof body === 'object' &&
        body !== null &&
        'success' in body &&
        (body as { success: unknown }).success === true &&
        'data' in body
      ) {
        const dataObj = (body as { data: unknown }).data;
        let items: unknown[] = [];
        
        if (Array.isArray(dataObj)) {
          items = dataObj;
        } else if (
          typeof dataObj === 'object' && 
          dataObj !== null && 
          'items' in dataObj && 
          Array.isArray((dataObj as { items: unknown }).items)
        ) {
          items = (dataObj as { items: unknown[] }).items;
        }

        return { success: true, data: items as SaasRegistrationRequest[] };
      }

      return { success: false, error: extractErrorMessage(body, 'Error al listar solicitudes.') };
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
        return { success: false, error: 'La sesión ha expirado.' };
      }
      console.error('[reviewService.listPendingRegistrations] Error:', error);
      return { success: false, error: 'Error de conexión al listar solicitudes.' };
    }
  },

  /**
   * Aprueba una solicitud de registro (o un comprobante de pago).
   */
  async approveRegistration(
    requestId: string,
    payload: ApproveRegistrationPayload
  ): Promise<{ success: true; data: ApproveRegistrationResult } | { success: false; error: string }> {
    try {
      const res = await authService.fetchWithAuth(`/api/saas/registrations/${requestId}/approve`, {
        method: 'POST',
        body: payload,
      });

      const body: unknown = await res.json();

      if (
        typeof body === 'object' &&
        body !== null &&
        'success' in body &&
        (body as { success: unknown }).success === true &&
        'data' in body
      ) {
        return { success: true, data: (body as { data: ApproveRegistrationResult }).data };
      }

      return { success: false, error: extractErrorMessage(body, 'Error desconocido al aprobar el registro.') };
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
        return { success: false, error: 'La sesión ha expirado.' };
      }
      console.error('[reviewService.approveRegistration] Error:', error);
      return { success: false, error: 'Error de conexión con el servidor.' };
    }
  },

  /**
   * Rechaza una solicitud de registro (o un comprobante de pago).
   */
  async rejectRegistration(
    requestId: string,
    reason: string
  ): Promise<{ success: true; data: RejectRegistrationResult } | { success: false; error: string }> {
    try {
      const res = await authService.fetchWithAuth(`/api/saas/registrations/${requestId}/reject`, {
        method: 'POST',
        body: { reason },
      });

      const body: unknown = await res.json();

      if (
        typeof body === 'object' &&
        body !== null &&
        'success' in body &&
        (body as { success: unknown }).success === true &&
        'data' in body
      ) {
        return { success: true, data: (body as { data: RejectRegistrationResult }).data };
      }

      return { success: false, error: extractErrorMessage(body, 'Error desconocido al rechazar el registro.') };
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
        return { success: false, error: 'La sesión ha expirado.' };
      }
      console.error('[reviewService.rejectRegistration] Error:', error);
      return { success: false, error: 'Error de conexión con el servidor.' };
    }
  },
};