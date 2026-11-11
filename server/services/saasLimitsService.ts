// server/services/saasLimitsService.ts
import { prisma } from '../db.js';
import type { TenantLimitsDTO, LimitResource } from '../types/limits.js';

/**
 * Resuelve el límite numérico de un recurso para un tenant.
 *
 * Fuente de verdad única (Regla ARQ-LIMITS).
 * Usado por:
 *   - getTenantLimits() → para mostrar en la UI.
 *   - checkLimits middleware → para bloquear creación.
 *
 * @param tenantId El ID del tenant.
 * @param resource Recurso a consultar.
 * @returns El límite numérico (-1 = ilimitado) o `null` si no hay forma de resolverlo.
 */
export async function resolveLimit(
  tenantId: string,
  resource: LimitResource,
): Promise<number | null> {
  const subscription = await prisma.tenant_subscriptions.findUnique({
    where: { tenant_id: tenantId },
    select: {
      plan_id: true,
      user_quota: true,
      whatsapp_lines_quota: true,
    },
  });

  if (!subscription) return null;

  // Camino A: plan_id → saas_plans
  if (subscription.plan_id) {
    const plan = await prisma.saas_plans.findUnique({
      where: { id: subscription.plan_id },
      select: {
        max_users: true,
        max_clients: true,
        max_policies: true,
        max_whatsapp: true,
      },
    });

    if (plan) {
      const limitsByResource: Record<LimitResource, number> = {
        users: plan.max_users,
        clients: plan.max_clients,
        policies: plan.max_policies,
        // whatsapp lo manejamos abajo con fallback
      };
      return limitsByResource[resource];
    }
  }

  // Camino B: fallback desde tenant_subscriptions
  if (resource === 'users') return subscription.user_quota;

  return null;
}

/**
 * Obtiene los límites y el uso actual de un tenant específico (para UI).
 *
 * @param tenantId El ID del tenant a consultar.
 * @returns Un objeto TenantLimitsDTO con los límites y el uso.
 */
export async function getTenantLimits(tenantId: string): Promise<TenantLimitsDTO> {
  // 1. Resolvemos límites en paralelo (fuente única de verdad).
  const [usersLimit, clientsLimit, policiesLimit] = await Promise.all([
    resolveLimit(tenantId, 'users'),
    resolveLimit(tenantId, 'clients'),
    resolveLimit(tenantId, 'policies'),
  ]);

  // 2. Si NO hay suscripción/plan → usar límites básicos por defecto.
  const hasSubscription = await prisma.tenant_subscriptions.count({
    where: { tenant_id: tenantId },
  });

  const planName = hasSubscription
    ? (await prisma.tenant_subscriptions.findUnique({
        where: { tenant_id: tenantId },
        select: { plan: true, plan_id: true },
      }))?.plan || 'Básico'
    : 'Básico (Sin Suscripción)';

  // 3. Contamos uso real en paralelo.
  const [usersCount, clientsCount, policiesCount] = await Promise.all([
    prisma.users.count({ where: { tenant_id: tenantId } }),
    prisma.clients.count({ where: { tenant_id: tenantId } }),
    prisma.policies.count({ where: { tenant_id: tenantId } }),
  ]);

  // 4. Fallback permisivo si no hay límite definido (Regla 22).
  // Nota: -1 significa ilimitado en el frontend.
  const DEFAULT_USERS_LIMIT = 5;
  const DEFAULT_CLIENTS_LIMIT = 50;
  const DEFAULT_POLICIES_LIMIT = 50;

  return {
    planName,
    limits: {
      users: {
        limit: usersLimit !== null ? usersLimit : DEFAULT_USERS_LIMIT,
        current: usersCount,
      },
      clients: {
        limit: clientsLimit !== null ? clientsLimit : DEFAULT_CLIENTS_LIMIT,
        current: clientsCount,
      },
      policies: {
        limit: policiesLimit !== null ? policiesLimit : DEFAULT_POLICIES_LIMIT,
        current: policiesCount,
      },
    },
  };
}