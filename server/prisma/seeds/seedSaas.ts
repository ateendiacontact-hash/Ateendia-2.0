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
import bcrypt from 'bcryptjs';

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

/**
 * Definición de método de pago para el seed.
 * Alineado con el modelo `saas_payment_methods`.
 *
 * ⚠️ Los datos son PLACEHOLDERS. Se reemplazan por valores reales
 * desde el panel Super Admin en la sesión 3.5.C.1.
 */
interface PaymentMethodDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  type: 'manual' | 'crypto_semi_auto' | 'automatic';
  paymentData: Record<string, unknown> | null;
  logoUrl: string | null;
  qrCodeUrl: string | null;
  instructions: string;
  cryptoNetwork: string | null;
  cryptoSymbol: string | null;
  cryptoWallet: string | null;
  cryptoExplorerApi: string | null;
  providerConfig: Record<string, unknown> | null;
  sortOrder: number;
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

  
  // ═══════════════════════════════════════════════════════
  // PLAN 0 — DEMO (para cuentas de prueba gratuita)
  // ═══════════════════════════════════════════════════════
  {
    id: 'plan-demo',
    key: 'demo',
    name: 'Demo',
    description: 'Cuenta de prueba gratuita por 14 días. Todos los módulos visibles pero con límites reducidos.',
    priceMonthly: 0.00,
    priceQuarterly: 0.00,
    priceAnnual: 0.00,
    maxUsers: 2,
    maxClients: 20,
    maxPolicies: 30,
    maxWhatsapp: 1,
    maxTelegram: 0,
    storageGb: 1,
    maxMessagesDay: 100,
    maxAiTokens: 0,
    messageRetentionDays: 15,
    popular: false,
    sortOrder: 0,
    features: {
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
      auditLogs: true,
      customDomain: false,
    },
  },

];

// ─── Definición de métodos de pago ───
// ⚠️ PLACEHOLDERS: los datos reales (wallet crypto, Stripe keys, logos)
//    se cargan desde el panel Super Admin en la sesión 3.5.C.1.

const SAAS_PAYMENT_METHODS: PaymentMethodDefinition[] = [
  // ── 1. Manual: Zelle ──
  {
    id: 'pm-zelle-001',
    key: 'zelle',
    name: 'Zelle',
    description: 'Transferencia instantánea desde tu banco vía Zelle.',
    type: 'manual',
    paymentData: {
      bankName: 'Chase Bank',
      accountHolder: 'Ateendia LLC',
      email: 'ateendia.contact@gmail.com',
    },
    logoUrl: null,
    qrCodeUrl: null,
    instructions:
      'Enviar el monto exacto a ateendia.contact@gmail.com desde tu app bancaria. ' +
      'Adjuntar el comprobante (captura de pantalla) en el siguiente paso.',
    cryptoNetwork: null,
    cryptoSymbol: null,
    cryptoWallet: null,
    cryptoExplorerApi: null,
    providerConfig: null,
    sortOrder: 10,
  },

  // ── 2. Crypto semi-automático: USDT (TRC-20) ──
  {
    id: 'pm-usdt-trc20-001',
    key: 'usdt_trc20',
    name: 'USDT (TRC-20)',
    description: 'Pago en USDT sobre red Tron. Comisiones bajas (~$1 USD).',
    type: 'crypto_semi_auto',
    paymentData: null,
    logoUrl: null,
    qrCodeUrl: null,
    instructions:
      'Enviar el monto exacto en USDT (red TRC-20) a la wallet indicada. ' +
      'Copiar el hash de la transacción y pegarlo en el siguiente paso. ' +
      'La verificación es semi-automática (revisión humana + verificación blockchain).',
    cryptoNetwork: 'TRC-20',
    cryptoSymbol: 'USDT',
    // ⚠️ PLACEHOLDER: reemplazar por la wallet real de Ateendia en 3.5.C.1
    cryptoWallet: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
    cryptoExplorerApi: 'tronscan',
    providerConfig: null,
    sortOrder: 20,
  },

  // ── 3. Automático: Stripe (tarjeta) ──
  {
    id: 'pm-stripe-001',
    key: 'stripe',
    name: 'Tarjeta de crédito/débito',
    description: 'Pago seguro con tarjeta vía Stripe. Acreditación inmediata.',
    type: 'automatic',
    paymentData: null,
    logoUrl: null,
    qrCodeUrl: null,
    instructions:
      'Serás redirigido a Stripe para completar el pago con tarjeta. ' +
      'Al confirmar el pago, tu suscripción se activa automáticamente.',
    cryptoNetwork: null,
    cryptoSymbol: null,
    cryptoWallet: null,
    cryptoExplorerApi: null,
    // ⚠️ PLACEHOLDER: cargar las keys reales desde el panel Super Admin en 3.5.C.1.
    //    NUNCA cargar la secret key acá — va como variable de entorno server-side.
    providerConfig: {
      publishableKey: 'pk_test_PLACEHOLDER',
    },
    sortOrder: 30,
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
  
  // ─── 0. Tenant ficticio para usuarios de plataforma + Super Admin SaaS ───
  const PLATFORM_TENANT_ID = 'platform';

  const platformTenant = await prisma.tenants.upsert({
    where: { id: PLATFORM_TENANT_ID },
    update: {
      name: 'Ateendia Platform',
      is_active: false,           // No es un tenant operativo
    },
    create: {
      id: PLATFORM_TENANT_ID,
      name: 'Ateendia Platform',
      legal_name: 'Ateendia SaaS Inc.',
      currency: 'USD',
      language: 'es',
      timezone: 'America/Caracas',
      is_active: false,
    },
  });
  console.log(`✅ Tenant platform: ${platformTenant.name}`);

  // ─── 0.1. Usuario Super Admin SaaS ───
  const SAAS_ADMIN_EMAIL = 'saas@ateendia.cloud';
  const SAAS_ADMIN_PASSWORD = 'SuperAdmin123!';

  const saasAdminPasswordHash = await bcrypt.hash(SAAS_ADMIN_PASSWORD, 10);

  const saasAdmin = await prisma.users.upsert({
    where: { email: SAAS_ADMIN_EMAIL },
    update: {
      password_hash: saasAdminPasswordHash,
      role: 'saas_super_admin',
      status: 'active',
      is_platform_user: true,
      is_super_admin: true,
    },
    create: {
      id: 'usr-saas-super-admin',
      tenant_id: PLATFORM_TENANT_ID,
      name: 'Super Admin SaaS',
      email: SAAS_ADMIN_EMAIL,
      password_hash: saasAdminPasswordHash,
      role: 'saas_super_admin',
      status: 'active',
      is_super_admin: true,
      is_platform_user: true,
    },
  });

  console.log(`✅ Super Admin SaaS: ${saasAdmin.email}`);

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
    // ─── 3. Métodos de pago ───
  console.log('');
  console.log('💳 Sembrando métodos de pago...');

  let paymentMethodsCreated = 0;

  for (const pm of SAAS_PAYMENT_METHODS) {
    await prisma.saas_payment_methods.upsert({
      where: { id: pm.id },
      update: {
        key: pm.key,
        name: pm.name,
        description: pm.description,
        type: pm.type,
        payment_data_json: pm.paymentData
          ? JSON.stringify(pm.paymentData)
          : null,
        logo_url: pm.logoUrl,
        qr_code_url: pm.qrCodeUrl,
        instructions: pm.instructions,
        crypto_network: pm.cryptoNetwork,
        crypto_symbol: pm.cryptoSymbol,
        crypto_wallet: pm.cryptoWallet,
        crypto_explorer_api: pm.cryptoExplorerApi,
        provider_config_json: pm.providerConfig
          ? JSON.stringify(pm.providerConfig)
          : null,
        is_active: true,
        sort_order: pm.sortOrder,
      },
      create: {
        id: pm.id,
        key: pm.key,
        name: pm.name,
        description: pm.description,
        type: pm.type,
        payment_data_json: pm.paymentData
          ? JSON.stringify(pm.paymentData)
          : null,
        logo_url: pm.logoUrl,
        qr_code_url: pm.qrCodeUrl,
        instructions: pm.instructions,
        crypto_network: pm.cryptoNetwork,
        crypto_symbol: pm.cryptoSymbol,
        crypto_wallet: pm.cryptoWallet,
        crypto_explorer_api: pm.cryptoExplorerApi,
        provider_config_json: pm.providerConfig
          ? JSON.stringify(pm.providerConfig)
          : null,
        is_active: true,
        sort_order: pm.sortOrder,
      },
    });
    paymentMethodsCreated++;
  }

  console.log(`✅ Métodos de pago: ${paymentMethodsCreated}`);
  console.log('');
  console.log('🏢 SaaS completado.');
  console.log('');
}