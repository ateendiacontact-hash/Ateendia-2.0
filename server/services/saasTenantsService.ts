/**
 * Servicio de gestión de tenants para el panel Super Admin SaaS.
 *
 * Responsabilidades:
 * - Listar TODOS los tenants de la DB (no solo el del seed).
 * - Incluir stats agregadas (users, clients, policies).
 * - Incluir datos de subscription (plan, status, renewal_date).
 * - Sanitizar campos sensibles (password_hash nunca se expone).
 *
 * Uso: `GET /api/saas/tenants` (protegido por requirePlatformUser).
 *
 * @see server/routes/saas/tenants.ts
 * @see server/services/saasRegistrationReviewService.ts (registro de tenants)
 */

import { prisma } from '../db.js';

// ────────────────────────────────────────────────────────────────────
// Tipos del DTO de respuesta
// ────────────────────────────────────────────────────────────────────

/**
 * DTO de un tenant tal como lo consume el panel Super Admin.
 *
 * Incluye:
 * - Datos básicos del tenant (id, name, subdomain, status, etc.).
 * - Stats agregadas (usersCount, clientsCount, policiesCount).
 * - Datos de subscription (plan, status, monthlyPrice, renewalDate).
 * - Datos de branding (primaryColor, accentColor, logoUrl).
 *
 * NO incluye:
 * - `databaseIsolation.partitionKey` (interno).
 * - Cualquier dato de users (email, password_hash, etc.).
 */
export interface SaasTenantDTO {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  subdomain: string | null;
  customDomain: string | null;
  status: string;
  isActive: boolean;
  demoExpiresAt: string | null;
  gracePeriodEndsAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Branding
  primaryColor: string;
  accentColor: string | null;
  logoUrl: string | null;

  // Ubicación
  country: string | null;
  city: string | null;
  currency: string;

  // Stats agregadas
  usersCount: number;
  clientsCount: number;
  policiesCount: number;

  // Subscription (puede ser null si el tenant fue creado sin subscription)
  subscription: {
    plan: string;
    planId: string | null;
    status: string;
    monthlyPrice: number;
    billingCycle: string | null;
    renewalDate: string | null;
    startDate: string | null;
    userQuota: number | null;
    whatsappLinesQuota: number | null;
    storageGb: number | null;
    contactEmail: string | null;
    gracePeriodDays: number | null;
    lastPaymentDate: string | null;
    isAutoSuspended: boolean;
  } | null;
}

// ────────────────────────────────────────────────────────────────────
// Función principal: listAllTenants
// ────────────────────────────────────────────────────────────────────

/**
 * Lista TODOS los tenants de la DB con sus stats agregadas.
 *
 * Para cada tenant, hace 3 queries de conteo (users, clients, policies)
 * en paralelo usando `Promise.all` para minimizar latencia.
 *
 * Se ordena por `created_at DESC` (los más recientes primero).
 *
 * @returns Array de SaasTenantDTO.
 */
export async function listAllTenants(): Promise<SaasTenantDTO[]> {
  // 1. Traer todos los tenants + subscription en una sola query
  //    (Prisma hace JOIN automático al incluir relaciones)
  const tenants = await prisma.tenants.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      tenant_subscriptions: true, // ← nombre real de la relación en Prisma
    },
  });

  // 2. Para cada tenant, contar users/clients/policies en paralelo
  const dtos = await Promise.all(
    tenants.map(async (t) => {
      const [usersCount, clientsCount, policiesCount] = await Promise.all([
        prisma.users.count({ where: { tenant_id: t.id } }),
        prisma.clients.count({ where: { tenant_id: t.id } }),
        prisma.policies.count({ where: { tenant_id: t.id } }),
      ]);

      const sub = t.tenant_subscriptions;

      const subscription: SaasTenantDTO['subscription'] = sub
        ? {
            plan: sub.plan,
            planId: sub.plan_id ?? null,
            status: sub.status,
            monthlyPrice: Number(sub.monthly_price),
            billingCycle: sub.billing_cycle ?? null,
            renewalDate: sub.renewal_date
              ? sub.renewal_date.toISOString()
              : null,
            startDate: sub.start_date ? sub.start_date.toISOString() : null,
            userQuota: sub.user_quota ?? null,
            whatsappLinesQuota: sub.whatsapp_lines_quota ?? null,
            storageGb: sub.storage_gb ?? null,
            contactEmail: sub.contact_email ?? null,
            gracePeriodDays: sub.grace_period_days ?? null,
            lastPaymentDate: sub.last_payment_date
              ? sub.last_payment_date.toISOString()
              : null,
            isAutoSuspended: Boolean(sub.is_auto_suspended),
          }
        : null;

      return {
        id: t.id,
        name: t.name,
        legalName: t.legal_name ?? null,
        taxId: t.tax_id ?? null,
        subdomain: t.subdomain ?? null,
        customDomain: t.custom_domain ?? null,
        status: t.status ?? 'active',
        isActive: Boolean(t.is_active),
        demoExpiresAt: t.demo_expires_at
          ? t.demo_expires_at.toISOString()
          : null,
        gracePeriodEndsAt: t.grace_period_ends_at
          ? t.grace_period_ends_at.toISOString()
          : null,
        createdAt: t.created_at.toISOString(),
        updatedAt: t.updated_at.toISOString(),

        primaryColor: t.primary_color ?? '#4f46e5',
        accentColor: t.accent_color ?? null,
        logoUrl: t.logo_url ?? null,

        country: t.country ?? null,
        city: t.city ?? null,
        currency: t.currency ?? 'USD',

        usersCount,
        clientsCount,
        policiesCount,

        subscription,
      } satisfies SaasTenantDTO;
    }),
  );

  return dtos;
}