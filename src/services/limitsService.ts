// src/services/limitsService.ts
import { authService } from './authService';

export type LimitResource = 'users' | 'clients' | 'policies';

export interface ResourceLimit {
  limit: number;
  current: number;
}

export interface TenantLimitsDTO {
  planName: string;
  limits: Record<LimitResource, ResourceLimit>;
}

export type GetLimitsResult =
  | { success: true; data: TenantLimitsDTO }
  | { success: false; error: string; code: string };

export const limitsService = {
  /**
   * Obtiene los límites actuales del plan del tenant autenticado.
   */
  async getLimits(): Promise<GetLimitsResult> {
    try {
      // ✅ Usamos la instancia de authService para acceder al método fetchWithAuth
            const response = await authService.fetchWithAuth('/api/saas/me/limits');
      
      // Regla 29: response.json() devuelve unknown
      const body: unknown = await response.json();

      if (!response.ok) {
        if (
          typeof body === 'object' &&
          body !== null &&
          'error' in body &&
          typeof (body as { error: unknown }).error === 'string'
        ) {
          return {
            success: false,
            error: (body as { error: string }).error,
            code: 'API_ERROR',
          };
        }
        return {
          success: false,
          error: 'Error desconocido al obtener límites',
          code: 'UNKNOWN_ERROR',
        };
      }

      // Type Guard para la respuesta exitosa
      if (
        typeof body === 'object' &&
        body !== null &&
        'success' in body &&
        (body as { success: unknown }).success === true &&
        'data' in body &&
        typeof (body as { data: unknown }).data === 'object'
      ) {
        return {
          success: true,
          data: (body as { data: TenantLimitsDTO }).data,
        };
      }

      return {
        success: false,
        error: 'Formato de respuesta inválido',
        code: 'INVALID_RESPONSE',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de red',
        code: 'NETWORK_ERROR',
      };
    }
  },
};