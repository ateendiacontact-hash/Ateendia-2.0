/**
 * @file saasSubscriptionService.ts
 * @description Servicio de gestión de suscripciones SaaS.
 *
 * Responsabilidades:
 * - Obtener la suscripción de un tenant específico (con datos del plan).
 * - Listar todas las suscripciones (para el Super Admin).
 * - Actualizar el estado de una suscripción (activar/suspender).
 *
 * Seguridad:
 * - La función `getSubscriptionByTenantId` NO valida permisos; eso lo hace
 *   la capa de rutas. Aquí solo se asume que el llamador ya autorizó.
 * - Las funciones de listado global solo deben ser invocadas por rutas
 *   protegidas con `requirePlatformUser`.
 */

import { prisma } from '../db.js';
import type { Prisma } from '@prisma/client';

// ────────────────────────────────────────────────────────────────────
// Tipos de dominio (DTOs)
// ────────────────────────────────────────────────────────────────────

/**
 * DTO de una suscripción con datos del plan y del tenant.
 * Es el "espejo" exacto que consumirá el frontend.
 */
export interface SubscriptionDTO {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantStatus: string;
  planId: string | null;
  planName: string;
  planKey: string | null;
  status: string;
  monthlyPrice: number;
  billingCycle: string;
  startDate: string;
  renewalDate: string | null;
  lastPaymentDate: string | null;
  gracePeriodDays: number;
  isAutoSuspended: boolean;
  userQuota: number;
  whatsappLinesQuota: number;
  storageGb: number;
}

/**
 * Error de dominio del servicio. Permite a la capa de rutas
 * traducirlo a un código HTTP semántico.
 */
export class SubscriptionServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'SubscriptionServiceError';
  }
}

// ────────────────────────────────────────────────────────────────────
// Mapeo Prisma → DTO
// ────────────────────────────────────────────────────────────────────

/**
 * Convierte un registro de Prisma (con includes) al DTO plano
 * que consume el frontend.
 *
 * ¿Por qué? Porque Prisma devuelve `Decimal` para precios y `Date`
 * para fechas, que no son serializables a JSON directamente.
 * Convertimos a `number` e `ISO string` respectivamente.
 */
function mapToDTO(
  subscription: Prisma.tenant_subscriptionsGetPayload<{
    include: { tenants: true };
  }>,
  plan: { id: string; name: string; key: string } | null,
): SubscriptionDTO {
  return {
    id: subscription.id,
    tenantId: subscription.tenant_id,
    tenantName: subscription.tenants.name,
    tenantStatus: subscription.tenants.status,
    planId: subscription.plan_id,
    planName: subscription.plan,
    planKey: plan?.key ?? null,
    status: subscription.status,
    monthlyPrice: Number(subscription.monthly_price),
    billingCycle: subscription.billing_cycle,
    startDate: subscription.start_date.toISOString(),
    renewalDate: subscription.renewal_date?.toISOString() ?? null,
    lastPaymentDate: subscription.last_payment_date?.toISOString() ?? null,
    gracePeriodDays: subscription.grace_period_days,
    isAutoSuspended: subscription.is_auto_suspended,
    userQuota: subscription.user_quota,
    whatsappLinesQuota: subscription.whatsapp_lines_quota,
    storageGb: subscription.storage_gb,
  };
}

// ────────────────────────────────────────────────────────────────────
// Función: getSubscriptionByTenantId()
// ────────────────────────────────────────────────────────────────────

/**
 * Obtiene la suscripción de un tenant por su ID.
 *
 * @param tenantId - ID del tenant (viene del JWT, no del body → anti-IDOR).
 * @returns DTO de la suscripción o null si no existe.
 */
export async function getSubscriptionByTenantId(
  tenantId: string,
): Promise<SubscriptionDTO | null> {
  const subscription = await prisma.tenant_subscriptions.findUnique({
    where: { tenant_id: tenantId },
    include: { tenants: true },
  });

  if (!subscription) return null;

  // Buscar el plan asociado (si tiene plan_id).
  let plan: { id: string; name: string; key: string } | null = null;
  if (subscription.plan_id) {
    plan = await prisma.saas_plans.findUnique({
      where: { id: subscription.plan_id },
      select: { id: true, name: true, key: true },
    });
  }

  return mapToDTO(subscription, plan);
}

// ────────────────────────────────────────────────────────────────────
// Función: listAllSubscriptions()
// ────────────────────────────────────────────────────────────────────

/**
 * Lista TODAS las suscripciones del sistema (solo Super Admin).
 *
 * Incluye datos del tenant y del plan asociado. Ordena por
 * fecha de creación descendente (las más recientes primero).
 *
 * @returns Array de DTOs de suscripción.
 */
export async function listAllSubscriptions(): Promise<SubscriptionDTO[]> {
  const subscriptions = await prisma.tenant_subscriptions.findMany({
    include: { tenants: true },
    orderBy: { created_at: 'desc' },
  });

  // Optimización: cargar todos los planes en una sola query.
  // Evitamos N+1 queries.
  const planIds = [
    ...new Set(subscriptions.map((s) => s.plan_id).filter((id): id is string => id !== null)),
  ];

  const plans =
    planIds.length > 0
      ? await prisma.saas_plans.findMany({
          where: { id: { in: planIds } },
          select: { id: true, name: true, key: true },
        })
      : [];

  const planMap = new Map(plans.map((p) => [p.id, p]));

  return subscriptions.map((sub) =>
    mapToDTO(sub, sub.plan_id ? (planMap.get(sub.plan_id) ?? null) : null),
  );
}

// ────────────────────────────────────────────────────────────────────
// Función: updateSubscriptionStatus()
// ────────────────────────────────────────────────────────────────────

/**
 * Actualiza el estado de una suscripción (y del tenant asociado).
 *
 * Reglas de negocio:
 * - Si se activa ('active') → tenant.status = 'active'.
 * - Si se suspende ('suspended') → tenant.status = 'suspended',
 *   is_auto_suspended = false (es manual).
 * - Si se cancela ('cancelled') → tenant.status = 'cancelled'.
 *
 * @param subscriptionId - ID de la suscripción.
 * @param newStatus - Nuevo estado ('active' | 'suspended' | 'cancelled').
 * @returns DTO actualizado.
 * @throws SubscriptionServiceError si la suscripción no existe.
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  newStatus: 'active' | 'suspended' | 'cancelled',
): Promise<SubscriptionDTO> {
  // Validar que la suscripción existe antes de hacer la transacción.
  const existing = await prisma.tenant_subscriptions.findUnique({
    where: { id: subscriptionId },
    include: { tenants: true },
  });

  if (!existing) {
    throw new SubscriptionServiceError(
      'SUBSCRIPTION_NOT_FOUND',
      'La suscripción no existe.',
      404,
    );
  }

  // Mapeo de estado de suscripción → estado del tenant.
  const tenantStatusMap: Record<typeof newStatus, string> = {
    active: 'active',
    suspended: 'suspended',
    cancelled: 'cancelled',
  };

  // Transacción atómica: actualizar suscripción + tenant juntos.
  const updated = await prisma.$transaction(async (tx) => {
    const sub = await tx.tenant_subscriptions.update({
      where: { id: subscriptionId },
      data: {
        status: newStatus,
        is_auto_suspended: false, // Es una acción manual, no automática.
        updated_at: new Date(),
      },
      include: { tenants: true },
    });

    await tx.tenants.update({
      where: { id: sub.tenant_id },
      data: { status: tenantStatusMap[newStatus] },
    });

    return sub;
  });

  // Buscar el plan para el DTO final.
  let plan: { id: string; name: string; key: string } | null = null;
  if (updated.plan_id) {
    plan = await prisma.saas_plans.findUnique({
      where: { id: updated.plan_id },
      select: { id: true, name: true, key: true },
    });
  }

  return mapToDTO(updated, plan);
}