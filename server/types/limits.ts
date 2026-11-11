// server/types/limits.ts
/**
 * Tipos para la verificación de límites del plan SaaS.
 * Usado en el endpoint GET /api/saas/me/limits.
 */

export type LimitResource = 'users' | 'clients' | 'policies';

export interface ResourceLimit {
  /** El límite máximo permitido por el plan. -1 significa ilimitado. */
  limit: number;
  /** El uso actual del recurso en este momento. */
  current: number;
}

export interface TenantLimitsDTO {
  /** Los límites de los recursos principales del plan. */
  limits: Record<LimitResource, ResourceLimit>;
  /** El nombre del plan actual (ej. 'Starter', 'Pro Business'). */
  planName: string;
}

export interface GetLimitsSuccessResponse {
  success: true;
  data: TenantLimitsDTO;
}

export interface GetLimitsErrorResponse {
  success: false;
  error: string;
  code: 'TENANT_NOT_FOUND' | 'SUBSCRIPTION_NOT_FOUND' | 'PLAN_NOT_FOUND' | 'INTERNAL_ERROR';
}

export type GetLimitsResult = GetLimitsSuccessResponse | GetLimitsErrorResponse;