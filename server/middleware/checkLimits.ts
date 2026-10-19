// server/middleware/checkLimits.ts
/**
 * Middleware de verificación de límites SaaS (sub-fase 3.5.B.4.f)
 * Regla 22: Excepción para tenantId === 'platform' y super admins.
 * Regla 26: Deuda registrada si plan_id está null (fallback permisivo).
 */

import type { Request, Response, NextFunction } from 'express';
// Importamos el PrismaClient. Si tienes una instancia global (ej: server/prisma/db.ts),
// cámbialo por import { prisma } from '../prisma/db.js'; o similar.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type LimitResource = 'users' | 'clients' | 'policies' | 'whatsapp';

/**
 * Extrae el tenantId del request, según la estructura de tu auth.ts.
 * Tu auth.ts inyecta `req.user = { userId, tenantId, role, ... }`.
 */
function getTenantId(req: Request): string | null {
  // Usamos la propiedad `tenantId` (camelCase) que definiste en tu auth.ts
  return req.user?.tenantId ?? null;
}

/**
 * Determina si el usuario actual debe saltarse la verificación de límites.
 * Regla 22: Super Admins SaaS y tenant 'platform' no están sujetos a límites.
 */
function shouldBypassLimits(req: Request): boolean {
  const tenantId = getTenantId(req);
  if (tenantId === 'platform') return true;

  const user = req.user;
  if (!user) return false;
  
  // Tu auth.ts no inyecta is_super_admin ni is_platform_user directamente en el JWT.
  // Si el rol es 'super_admin' o 'platform', asumimos que debe saltarse los límites.
  // Si tienes otra lógica, ajústala aquí.
  if (user.role === 'super_admin' || user.role === 'platform') return true;

  return false;
}

/**
 * Obtiene el límite numérico para un recurso dado.
 */
async function resolveLimit(
  tenantId: string,
  resource: LimitResource
): Promise<{ limit: number | null; source: string }> {
  const subscription = await prisma.tenant_subscriptions.findUnique({
    where: { tenant_id: tenantId },
    select: {
      plan_id: true,
      user_quota: true,
      whatsapp_lines_quota: true,
    },
  });

  if (!subscription) {
    return { limit: null, source: 'no_subscription' };
  }

  // Camino A: si hay plan_id, buscar el plan real en saas_plans
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
        whatsapp: plan.max_whatsapp,
      };
      return { limit: limitsByResource[resource], source: `plan:${subscription.plan_id}` };
    }
  }

  // Camino B: fallback desde tenant_subscriptions
  if (resource === 'users') {
    return { limit: subscription.user_quota, source: 'subscription.user_quota' };
  }
  if (resource === 'whatsapp') {
    return { limit: subscription.whatsapp_lines_quota, source: 'subscription.whatsapp_lines_quota' };
  }

  // Sin plan y sin fallback → permisivo (no bloqueamos)
  return { limit: null, source: 'no_plan_no_fallback' };
}

/**
 * Cuenta los registros actuales del tenant para un recurso.
 */
async function countCurrent(tenantId: string, resource: LimitResource): Promise<number> {
  switch (resource) {
    case 'users':
      return prisma.users.count({ where: { tenant_id: tenantId } });
    case 'clients':
      return prisma.clients.count({ where: { tenant_id: tenantId } });
    case 'policies':
      return prisma.policies.count({ where: { tenant_id: tenantId } });
    case 'whatsapp':
      return prisma.whatsapp_conversations.count({ where: { tenant_id: tenantId } });
  }
}

/**
 * Middleware configurable para verificar un límite específico.
 */
export function checkLimit(resource: LimitResource) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Regla 22: bypass para platform y super admins
      if (shouldBypassLimits(req)) {
        return next();
      }

      const tenantId = getTenantId(req);
      if (!tenantId) {
        console.warn('[checkLimit] Request sin tenantId, se omite verificación.');
        return next();
      }

      const { limit, source } = await resolveLimit(tenantId, resource);

      // Fallback permisivo si no hay límite definido
      if (limit === null) {
        console.warn(
          `[checkLimit] Sin límite definido para tenant=${tenantId} resource=${resource} (source=${source})`
        );
        return next();
      }

      const current = await countCurrent(tenantId, resource);

      if (current >= limit) {
        res.status(403).json({
          success: false,
          error: {
            code: 'LIMIT_REACHED',
            message: `Has alcanzado el límite de ${resource} de tu plan (${current}/${limit}). Actualiza tu plan para continuar.`,
            resource,
            current,
            limit,
          },
        });
        return;
      }

      return next();
    } catch (err) {
      console.error('[checkLimit] Error verificando límites:', err);
      return next();
    }
  };
}