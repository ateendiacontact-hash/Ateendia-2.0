// ===========================================
// server/prisma/seeds/seedSaas.ts
// Puebla datos de la plataforma SaaS:
//   - 3 planes de suscripción (Starter, Pro, Enterprise)
//   - 8 permisos SaaS para el rol saas_super_admin
//
// Idempotente: usa upsert para no duplicar.
// Se importa desde seed.ts.
// ===========================================

import { PrismaClient } from '@prisma/client';

// ─── Tipos auxiliares ───

interface PlanFeatureFlags {
  aiAssistant: boolean;
  campaigns: boolean;
  telephonyPBX: boolean;
  massImport: boolean;
  customFields: boolean;
  webhooks: boolean;
  advancedAutomations: boolean;
  whatsapp: boolean;
  telegram: boolean;
  instagram: boolean;
  facebook: boolean;
  webLanding: boolean;
  landingPage: boolean;
  apiAccess: boolean;
  auditLogs: boolean;
  customDomain: boolean;
}

interface PlanDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceQuarterly: number;
  priceAnnual: number;
  maxUsers: number;
  maxClients: number;
  maxPolicies: number;
  maxWhatsapp: number;
  maxTelegram: number;
  storageGb: number;
  maxMessagesDay: number;
  maxAiTokens: number;
  messageRetentionDays: number;
  popular: boolean;
  sortOrder: number;
  features: PlanFeatureFlags;
}

// ─── Base: todos los flags en false ───

const ALL_FEATURES_DISABLED: PlanFeatureFlags = {
  aiAssistant: false,
  campaigns: false,
  telephonyPBX: false,
  massImport: false,
  customFields: false,
  webhooks: false,
  advancedAutomations: false,
  whatsapp: true,
  telegram: false,
  instagram: false,
  facebook: false,
  webLanding: false,
  landingPage: false,
  apiAccess: false,
  auditLogs: false,
  customDomain: false,
};

// ─── Definición de planes ───

const SAAS_PLANS: PlanDefinition[] = [
  // ═══════════════════════════════════════════════════════
  // PLAN 1 — STARTER
  // ═══════════════════════════════════════════════════════
  {
    id: 'plan-starter',
    key: 'starter',
    name: 'Starter',
    description: 'Plan básico para agencias que están empezando. Incluye CRM, clientes, pólizas y WhatsApp.',
    priceMonthly: 29.00,
    priceQuarterly: 79.00,
    priceAnnual: 290.00,
    maxUsers: 1,
    maxClients: 100,
    maxPolicies: 200,
    maxWhatsapp: 1,
    maxTelegram: 0,
    storageGb: 5,
    maxMessagesDay: 100,
    maxAiTokens: 0,
    messageRetentionDays: 30,
    popular: false,
    sortOrder: 1,
    features: {
      ...ALL_FEATURES_DISABLED,
      auditLogs: true,
      massImport: true,
    },
  },

  // ═══════════════════════════════════════════════════════
  // PLAN 2 — PRO BUSINESS
  // ═══════════════════════════════════════════════════════
  {
    id: 'plan-pro',
    key: 'pro',
    name: 'Pro Business',
    description: 'Plan profesional con IA, Telegram, campañas y automatizaciones. Ideal para agencias en crecimiento.',
    priceMonthly: 79.00,
    priceQuarterly: 219.00,
    priceAnnual: 790.00,
    maxUsers: 5,
    maxClients: 1000,
    maxPolicies: 2000,
    maxWhatsapp: 2,
    maxTelegram: 1,
    storageGb: 20,
    maxMessagesDay: 1000,
    maxAiTokens: 100000,
    messageRetentionDays: 365,
    popular: true,
    sortOrder: 2,
    features: {
      ...ALL_FEATURES_DISABLED,
      aiAssistant: true,
      campaigns: true,
      customFields: true,
      webhooks: true,
      telegram: true,
      webLanding: true,
      landingPage: true,
      auditLogs: true,
      massImport: true,
    },
  },

  // ═══════════════════════════════════════════════════════
  // PLAN 3 — ENTERPRISE
  // ═══════════════════════════════════════════════════════
  {
    id: 'plan-enterprise',
    key: 'enterprise',
    name: 'Enterprise',
    description: 'Plan sin límites para agencias grandes. Todos los módulos, IA ilimitada, dominio propio y soporte prioritario.',
    priceMonthly: 199.00,
    priceQuarterly: 549.00,
    priceAnnual: 1990.00,
    maxUsers: -1,
    maxClients: -1,
    maxPolicies: -1,
    maxWhatsapp: 5,
    maxTelegram: 3,
    storageGb: 100,
    maxMessagesDay: -1,
    maxAiTokens: 1000000,
    messageRetentionDays: -1,
    popular: false,
    sortOrder: 3,
    features: {
      aiAssistant: true,
      campaigns: true,
      telephonyPBX: true,
      massImport: true,
      customFields: true,
      webhooks: true,
      advancedAutomations: true,
      whatsapp: true,
      telegram: true,
      instagram: true,
      facebook: true,
      webLanding: true,
      landingPage: true,
      apiAccess: true,
      auditLogs: true,
      customDomain: true,
    },
  },
];

// ─── Permisos SaaS ───

const SAAS_PERMISSIONS = [
  { module: 'saas', action: 'view_metrics',     allowed: true },
  { module: 'saas', action: 'view_tenants',     allowed: true },
  { module: 'saas', action: 'manage_tenants',   allowed: true },
  { module: 'saas', action: 'approve_payments', allowed: true },
  { module: 'saas', action: 'manage_plans',     allowed: true },
  { module: 'saas', action: 'manage_landing',   allowed: true },
  { module: 'saas', action: 'impersonate',      allowed: true },
  { module: 'saas', action: 'export_global',    allowed: true },
];

// ─── Función principal ───

export async function seedSaas(prisma: PrismaClient): Promise<void> {
  console.log('');
  console.log('🏢 Sembrando SaaS Plans...');
  console.log('');

  // ─── 1. Crear/actualizar los 3 planes ───
  let plansCreated = 0;

  for (const plan of SAAS_PLANS) {
    await prisma.saas_plans.upsert({
      where: { id: plan.id },
      update: {
        key: plan.key,
        name: plan.name,
        description: plan.description,
        price_monthly: plan.priceMonthly,
        price_quarterly: plan.priceQuarterly,
        price_annual: plan.priceAnnual,
        currency: 'USD',
        max_users: plan.maxUsers,
        max_clients: plan.maxClients,
        max_policies: plan.maxPolicies,
        max_whatsapp: plan.maxWhatsapp,
        max_telegram: plan.maxTelegram,
        storage_gb: plan.storageGb,
        max_messages_day: plan.maxMessagesDay,
        max_ai_tokens: plan.maxAiTokens,
        features_json: JSON.stringify(plan.features),
        message_retention_days: plan.messageRetentionDays,
        is_active: true,
        is_public: true,
        popular: plan.popular,
        sort_order: plan.sortOrder,
      },
      create: {
        id: plan.id,
        key: plan.key,
        name: plan.name,
        description: plan.description,
        price_monthly: plan.priceMonthly,
        price_quarterly: plan.priceQuarterly,
        price_annual: plan.priceAnnual,
        currency: 'USD',
        max_users: plan.maxUsers,
        max_clients: plan.maxClients,
        max_policies: plan.maxPolicies,
        max_whatsapp: plan.maxWhatsapp,
        max_telegram: plan.maxTelegram,
        storage_gb: plan.storageGb,
        max_messages_day: plan.maxMessagesDay,
        max_ai_tokens: plan.maxAiTokens,
        features_json: JSON.stringify(plan.features),
        message_retention_days: plan.messageRetentionDays,
        is_active: true,
        is_public: true,
        popular: plan.popular,
        sort_order: plan.sortOrder,
      },
    });
    plansCreated++;
  }

  console.log(`✅ Planes SaaS: ${plansCreated}`);

  // ─── 2. Asignar los 8 permisos SaaS al rol ───
  let permissionsCreated = 0;

  for (const perm of SAAS_PERMISSIONS) {
    const permId = `perm-saas_super_admin-${perm.module}-${perm.action}`;

    await prisma.role_permissions.upsert({
      where: { id: permId },
      update: {
        allowed: perm.allowed,
      },
      create: {
        id: permId,
        role_id: 'role-sys-saas-super-admin',
        module: perm.module,
        action: perm.action,
        allowed: perm.allowed,
      },
    });
    permissionsCreated++;
  }

  console.log(`✅ Permisos SaaS: ${permissionsCreated}`);
  console.log('');
  console.log('🏢 SaaS completado.');
  console.log('');
}