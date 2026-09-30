// ===========================================
// server/services/saasPlansService.ts
// Lógica de negocio de SaaS Plans.
//
// Los planes son gestionados SOLO por el rol saas_super_admin.
// Los tenants pueden VER su plan actual pero no editarlo.
//
// Características:
//   - CRUD completo (solo Super Admin)
//   - Listado público para landing (planes activos)
//   - Feature flags en JSON (parseado al devolver)
//   - Soft delete (is_active = false)
// ===========================================

import { prisma } from '../db.js';

// ─── Tipos ───

export interface ListPlansInput {
  includeInactive?: boolean;   // Solo Super Admin puede ver inactivos
  publicOnly?: boolean;        // Solo planes is_public = true
}

export interface CreatePlanInput {
  key: string;
  name: string;
  description?: string;
  priceMonthly: number;
  priceQuarterly?: number;
  priceAnnual?: number;
  currency?: string;
  maxUsers: number;
  maxClients: number;
  maxPolicies: number;
  maxWhatsapp: number;
  maxTelegram: number;
  storageGb: number;
  maxMessagesDay: number;
  maxAiTokens: number;
  features: Record<string, boolean>;
  messageRetentionDays: number;
  isActive?: boolean;
  isPublic?: boolean;
  popular?: boolean;
  sortOrder?: number;
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {
  id: string;
}

// ─── Helpers ───

/**
 * Parsea un JSON almacenado como String en MariaDB.
 * Devuelve null si el valor es inválido.
 */
function parseJsonField<T>(value: any): T | null {
  if (!value) return null;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Normaliza un plan de la DB al formato de respuesta API.
 * Convierte snake_case → camelCase.
 */
function formatPlan(plan: any) {
  return {
    id: plan.id,
    key: plan.key,
    name: plan.name,
    description: plan.description,

    // Precios
    priceMonthly: plan.price_monthly ? Number(plan.price_monthly) : 0,
    priceQuarterly: plan.price_quarterly ? Number(plan.price_quarterly) : null,
    priceAnnual: plan.price_annual ? Number(plan.price_annual) : null,
    currency: plan.currency,

    // Límites
    maxUsers: plan.max_users,
    maxClients: plan.max_clients,
    maxPolicies: plan.max_policies,
    maxWhatsapp: plan.max_whatsapp,
    maxTelegram: plan.max_telegram,
    storageGb: plan.storage_gb,
    maxMessagesDay: plan.max_messages_day,
    maxAiTokens: plan.max_ai_tokens,

    // Features (parseado)
    features: parseJsonField<Record<string, boolean>>(plan.features_json) ?? {},

    // Retención
    messageRetentionDays: plan.message_retention_days,

    // Metadata
    isActive: Boolean(plan.is_active),
    isPublic: Boolean(plan.is_public),
    popular: Boolean(plan.popular),
    sortOrder: plan.sort_order,

    // Auditoría
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
  };
}

// ─── List ───

export async function listPlans(input: ListPlansInput) {
  const where: any = {};

  if (!input.includeInactive) {
    where.is_active = true;
  }

  if (input.publicOnly) {
    where.is_public = true;
  }

  const plans = await prisma.saas_plans.findMany({
    where,
    orderBy: { sort_order: 'asc' },
  });

  return plans.map(formatPlan);
}

// ─── Get by ID ───

export async function getPlanById(planId: string) {
  const plan = await prisma.saas_plans.findUnique({
    where: { id: planId },
  });

  return plan ? formatPlan(plan) : null;
}

// ─── Get by key ───

export async function getPlanByKey(key: string) {
  const plan = await prisma.saas_plans.findUnique({
    where: { key },
  });

  return plan ? formatPlan(plan) : null;
}

// ─── Create ───

export async function createPlan(input: CreatePlanInput) {
  // Verificar que la key no exista
  const existing = await prisma.saas_plans.findUnique({
    where: { key: input.key },
  });

  if (existing) {
    throw new Error('PLAN_KEY_ALREADY_EXISTS');
  }

  const id = `plan-${input.key}-${Date.now()}`;

  const plan = await prisma.saas_plans.create({
    data: {
      id,
      key: input.key,
      name: input.name,
      description: input.description ?? null,
      price_monthly: input.priceMonthly,
      price_quarterly: input.priceQuarterly ?? null,
      price_annual: input.priceAnnual ?? null,
      currency: input.currency ?? 'USD',
      max_users: input.maxUsers,
      max_clients: input.maxClients,
      max_policies: input.maxPolicies,
      max_whatsapp: input.maxWhatsapp,
      max_telegram: input.maxTelegram,
      storage_gb: input.storageGb,
      max_messages_day: input.maxMessagesDay,
      max_ai_tokens: input.maxAiTokens,
      features_json: JSON.stringify(input.features),
      message_retention_days: input.messageRetentionDays,
      is_active: input.isActive ?? true,
      is_public: input.isPublic ?? true,
      popular: input.popular ?? false,
      sort_order: input.sortOrder ?? 0,
    },
  });

  return formatPlan(plan);
}

// ─── Update ───

export async function updatePlan(input: UpdatePlanInput) {
  const existing = await prisma.saas_plans.findUnique({
    where: { id: input.id },
  });

  if (!existing) {
    throw new Error('PLAN_NOT_FOUND');
  }

  const data: any = {};

  if (input.key !== undefined) {
    // Si se cambia la key, verificar que no exista en otro plan
    if (input.key !== existing.key) {
      const keyInUse = await prisma.saas_plans.findUnique({
        where: { key: input.key },
      });
      if (keyInUse) {
        throw new Error('PLAN_KEY_ALREADY_EXISTS');
      }
    }
    data.key = input.key;
  }

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.priceMonthly !== undefined) data.price_monthly = input.priceMonthly;
  if (input.priceQuarterly !== undefined) data.price_quarterly = input.priceQuarterly;
  if (input.priceAnnual !== undefined) data.price_annual = input.priceAnnual;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.maxUsers !== undefined) data.max_users = input.maxUsers;
  if (input.maxClients !== undefined) data.max_clients = input.maxClients;
  if (input.maxPolicies !== undefined) data.max_policies = input.maxPolicies;
  if (input.maxWhatsapp !== undefined) data.max_whatsapp = input.maxWhatsapp;
  if (input.maxTelegram !== undefined) data.max_telegram = input.maxTelegram;
  if (input.storageGb !== undefined) data.storage_gb = input.storageGb;
  if (input.maxMessagesDay !== undefined) data.max_messages_day = input.maxMessagesDay;
  if (input.maxAiTokens !== undefined) data.max_ai_tokens = input.maxAiTokens;
  if (input.features !== undefined) data.features_json = JSON.stringify(input.features);
  if (input.messageRetentionDays !== undefined) data.message_retention_days = input.messageRetentionDays;
  if (input.isActive !== undefined) data.is_active = input.isActive;
  if (input.isPublic !== undefined) data.is_public = input.isPublic;
  if (input.popular !== undefined) data.popular = input.popular;
  if (input.sortOrder !== undefined) data.sort_order = input.sortOrder;

  const plan = await prisma.saas_plans.update({
    where: { id: input.id },
    data,
  });

  return formatPlan(plan);
}

// ─── Archive (soft delete) ───

export async function archivePlan(planId: string): Promise<boolean> {
  const existing = await prisma.saas_plans.findUnique({
    where: { id: planId },
  });

  if (!existing) return false;

  await prisma.saas_plans.update({
    where: { id: planId },
    data: { is_active: false, is_public: false },
  });

  return true;
}