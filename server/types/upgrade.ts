/**
 * Tipos del flujo de upgrade demo → pago (Sesión 3.5.B.4.d).
 *
 * Un upgrade es una solicitud de pago que un tenant en estado `demo`
 * (o `expired` dentro del grace period) genera para convertirse a un
 * plan pago SIN perder su cuenta, datos, usuarios ni configuración.
 *
 * Modelo de datos (sin migración):
 * - La solicitud vive en `saas_registration_requests` con:
 *   - type = 'upgrade'
 *   - created_tenant_id = <tenant_id existente>  ← vínculo
 * - `approveRegistration()` detecta type='upgrade' y hace UPDATE
 *   del tenant existente + UPSERT de la subscription, en vez de
 *   INSERT de tenant+user+subscription.
 *
 * Decisión arquitectónica (ver AGENTS.md):
 * - Reutilizamos `created_tenant_id` como vínculo en lugar de agregar
 *   una columna nueva. Cero migración, cero regeneración de Prisma.
 */

/** Estados de tenant que PUEDEN solicitar upgrade a pago. */
export type UpgradeEligibleTenantStatus = 'demo' | 'expired';

/**
 * Payload que envía el frontend del tenant para solicitar un upgrade.
 * No incluye datos de empresa/admin porque ya los tenemos del tenant.
 */
export interface UpgradeRequestPayload {
  /** ID del plan destino (debe existir en saas_plans y ser público). */
  planId: string;
  /** Ciclo de facturación elegido. */
  billingCycle: 'monthly' | 'yearly';
  /** Método de pago elegido (opcional en MVP — se puede completar después). */
  paymentMethodId?: string;
  /** Comprobante subido (opcional). */
  receiptUrl?: string;
  receiptFilename?: string;
  receiptFileSize?: string;
  /** Hash de transacción crypto (opcional). */
  cryptoTxHash?: string;
  /** Notas libres del tenant (opcional). */
  notes?: string;
}

/**
 * Resultado de elegibilidad para upgrade.
 * Se calcula a partir del estado actual del tenant.
 */
export interface UpgradeEligibility {
  /** true si el tenant puede hacer upgrade ahora mismo. */
  eligible: boolean;
  /** Razón legible si no es elegible (null si sí lo es). */
  reason: string | null;
  /** Código estable para el frontend (null si es elegible). */
  code:
    | 'TENANT_NOT_FOUND'
    | 'TENANT_NOT_IN_DEMO'
    | 'DEMO_GRACE_EXPIRED'
    | 'TENANT_ALREADY_PAID'
    | null;
  /** Estado actual del tenant, para mostrarlo en UI. */
  tenantStatus: string | null;
  /** Cuándo expira el demo (ISO string) o null. */
  demoExpiresAt: string | null;
  /** Cuándo termina el grace period (ISO string) o null. */
  gracePeriodEndsAt: string | null;
}

/**
 * Resultado devuelto al crear una solicitud de upgrade.
 * El `requestId` permite al frontend consultar el estado con el
 * endpoint público ya existente (GET /api/saas/registrations/:id/status).
 */
export interface UpgradeRequestResult {
  requestId: string;
  tenantId: string;
  planId: string;
  planKey: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  priceAmount: number;
  currency: string;
  status: 'pending';
  createdAt: string;
  expiresAt: string;
}