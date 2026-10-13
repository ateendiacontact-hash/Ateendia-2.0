/**
 * Servicio de upgrade demo → pago (Sesión 3.5.B.4.d).
 *
 * Responsabilidades:
 * - Validar elegibilidad de un tenant para hacer upgrade.
 * - Crear una solicitud de upgrade en `saas_registration_requests`
 *   con type='upgrade' y created_tenant_id pre-poblado.
 * - NO toca la DB de tenants. Solo crea la solicitud. La aprobación
 *   (que SÍ actualiza el tenant) vive en saasRegistrationReviewService.
 *
 * Decisiones de diseño (ver AGENTS.md sesión #23):
 * - Reutilizamos `created_tenant_id` como vínculo al tenant existente.
 *   Cero migración de DB, cero cambios al schema Prisma.
 * - El `admin_password_hash` se rellena con un hash dummy (no se usa en
 *   upgrade — el user ya existe y mantiene su password).
 * - Reutilizamos `saasRegistrationService.RegistrationValidationError`
 *   para que el router pueda manejar errores de dominio uniformemente.
 */

import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { RegistrationValidationError } from './saasRegistrationService.js';
import type {
  UpgradeRequestPayload,
  UpgradeEligibility,
  UpgradeRequestResult,
} from '../types/upgrade.js';

/** Rondas de bcrypt. Mismas que en los otros servicios. */
const BCRYPT_ROUNDS = 10;

/** Días que dura una solicitud de upgrade antes de expirar. */
const UPGRADE_REQUEST_TTL_DAYS = 7;

/**
 * Hash dummy que se guarda en admin_password_hash para upgrades.
 * Es un hash válido de una contraseña aleatoria que NUNCA se usa.
 * Sirve para satisfacer el NOT NULL de la columna.
 *
 * Nota: se regenera en cada llamada para no tener un valor hardcodeado
 * que pudiera ser detectado por un atacante.
 */
async function generateDummyPasswordHash(): Promise<string> {
  return bcrypt.hash(randomUUID(), BCRYPT_ROUNDS);
}

/**
 * Evalúa si un tenant puede solicitar upgrade a pago.
 *
 * Reglas:
 * - Debe existir.
 * - status debe ser 'demo' o 'expired'.
 * - Si es 'expired', `grace_period_ends_at` debe estar en el futuro
 *   (o ser null — se interpreta como grace indefinido).
 * - Si ya está 'active' con plan pago, no se permite (usar flujo de
 *   cambio de plan, no de upgrade).
 *
 * @returns UpgradeEligibility con razón explícita si no es elegible.
 */
export async function getUpgradeEligibility(
  tenantId: string,
): Promise<UpgradeEligibility> {
  const tenant = await prisma.tenants.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      status: true,
      demo_expires_at: true,
      grace_period_ends_at: true,
    },
  });

  if (!tenant) {
    return {
      eligible: false,
      reason: 'El tenant no existe.',
      code: 'TENANT_NOT_FOUND',
      tenantStatus: null,
      demoExpiresAt: null,
      gracePeriodEndsAt: null,
    };
  }

  const now = new Date();

  // Tenant ya activo (pago o suspendido, pero no demo/expired)
  if (tenant.status !== 'demo' && tenant.status !== 'expired') {
    const isPaid =
      tenant.status === 'active' ||
      tenant.status === 'suspended' ||
      tenant.status === 'cancelled';

    return {
      eligible: false,
      reason: isPaid
        ? 'El tenant ya tiene un plan pago activo. Usá el flujo de cambio de plan.'
        : `El tenant no está en estado demo (status actual: ${tenant.status}).`,
      code: isPaid ? 'TENANT_ALREADY_PAID' : 'TENANT_NOT_IN_DEMO',
      tenantStatus: tenant.status,
      demoExpiresAt: tenant.demo_expires_at?.toISOString() ?? null,
      gracePeriodEndsAt: tenant.grace_period_ends_at?.toISOString() ?? null,
    };
  }

  // Tenant expired: verificar grace period
  if (tenant.status === 'expired') {
    const graceEnds = tenant.grace_period_ends_at;
    if (graceEnds && graceEnds < now) {
      return {
        eligible: false,
        reason:
          'El período de gracia del demo ya expiró. Contactá a soporte para reactivar tu cuenta.',
        code: 'DEMO_GRACE_EXPIRED',
        tenantStatus: tenant.status,
        demoExpiresAt: tenant.demo_expires_at?.toISOString() ?? null,
        gracePeriodEndsAt: graceEnds.toISOString(),
      };
    }
    // Si graceEnds es null o futuro → elegible
  }

  return {
    eligible: true,
    reason: null,
    code: null,
    tenantStatus: tenant.status,
    demoExpiresAt: tenant.demo_expires_at?.toISOString() ?? null,
    gracePeriodEndsAt: tenant.grace_period_ends_at?.toISOString() ?? null,
  };
}

/**
 * Normaliza el payload de upgrade y lo convierte a la forma que espera
 * la tabla `saas_registration_requests`.
 *
 * @throws RegistrationValidationError si el payload es inconsistente
 *         (ej. planId vacío).
 */
async function normalizeUpgradePayload(
  tenantId: string,
  payload: UpgradeRequestPayload,
  context: {
    companyName: string;
    companyTaxId: string | null;
    companyEmail: string;
    companyPhone: string;
    companyCountry: string | null;
    companyCity: string | null;
    adminName: string;
    adminEmail: string;
    adminPhone: string | null;
  },
) {
  if (!payload.planId || payload.planId.trim().length === 0) {
    throw new RegistrationValidationError('planId es obligatorio.');
  }

  // 1. Buscar el plan destino
  const plan = await prisma.saas_plans.findUnique({
    where: { id: payload.planId },
  });

  if (!plan) {
    throw new RegistrationValidationError(
      `Plan no encontrado: ${payload.planId}`,
      'PLAN_NOT_FOUND',
    );
  }

  if (!plan.is_active || !plan.is_public) {
    throw new RegistrationValidationError(
      'El plan seleccionado no está disponible para upgrade.',
      'PLAN_NOT_AVAILABLE',
    );
  }

  // 2. Calcular precio según billing_cycle
  const priceAmount =
    payload.billingCycle === 'yearly' && plan.price_annual !== null
      ? Number(plan.price_annual)
      : Number(plan.price_monthly);

  // 3. Buscar método de pago si viene
  let paymentMethodKey: string | null = null;
  let paymentMethodName: string | null = null;

  if (payload.paymentMethodId) {
    const method = await prisma.saas_payment_methods.findUnique({
      where: { id: payload.paymentMethodId },
    });
    if (!method) {
      throw new RegistrationValidationError(
        `Método de pago no encontrado: ${payload.paymentMethodId}`,
        'PAYMENT_METHOD_NOT_FOUND',
      );
    }
    if (!method.is_active) {
      throw new RegistrationValidationError(
        'El método de pago seleccionado no está activo.',
        'PAYMENT_METHOD_INACTIVE',
      );
    }
    paymentMethodKey = method.key;
    paymentMethodName = method.name;
  }

  return {
    planId: plan.id,
    planKey: plan.key,
    planName: plan.name,
    priceAmount,
    currency: plan.currency,
    paymentMethodKey,
    paymentMethodName,
    context,
  };
}

/**
 * Crea una solicitud de upgrade demo → pago.
 *
 * Flujo:
 * 1. Validar elegibilidad del tenant.
 * 2. Verificar que no haya otra solicitud de upgrade pending para el
 *    mismo tenant (anti-duplicado).
 * 3. Normalizar payload (buscar plan, calcular precio, etc.).
 * 4. Insertar en saas_registration_requests con type='upgrade' y
 *    created_tenant_id pre-poblado.
 *
 * @throws RegistrationValidationError si el tenant no es elegible o
 *         el payload es inválido.
 */
export async function createUpgradeRequest(
  tenantId: string,
  payload: UpgradeRequestPayload,
  meta: { ipAddress: string | null; userAgent: string | null },
): Promise<UpgradeRequestResult> {
  // 1. Validar elegibilidad
  const eligibility = await getUpgradeEligibility(tenantId);
  if (!eligibility.eligible) {
    throw new RegistrationValidationError(
      eligibility.reason ?? 'El tenant no es elegible para upgrade.',
      eligibility.code ?? 'NOT_ELIGIBLE',
    );
  }

  // 2. Anti-duplicado: ¿ya hay una solicitud pending para este tenant?
  const existing = await prisma.saas_registration_requests.findFirst({
    where: {
      created_tenant_id: tenantId,
      type: 'upgrade',
      status: 'pending',
    },
    select: { id: true },
  });

  if (existing) {
    throw new RegistrationValidationError(
      'Ya existe una solicitud de upgrade pendiente para este tenant. Consultá su estado antes de crear otra.',
      'UPGRADE_ALREADY_PENDING',
    );
  }

  // 3. Traer datos del tenant y su admin
  const tenant = await prisma.tenants.findUnique({
    where: { id: tenantId },
  });
  if (!tenant) {
    throw new RegistrationValidationError(
      'El tenant no existe.',
      'TENANT_NOT_FOUND',
    );
  }

  const adminUser = await prisma.users.findFirst({
    where: { tenant_id: tenantId, role: 'tenant_admin' },
    select: { id: true, name: true, email: true, phone: true },
  });
  if (!adminUser) {
    throw new RegistrationValidationError(
      'El tenant no tiene un usuario administrador. Contactá a soporte.',
      'TENANT_ADMIN_NOT_FOUND',
    );
  }

  // 4. Normalizar payload
  const normalized = await normalizeUpgradePayload(tenantId, payload, {
    companyName: tenant.name,
    companyTaxId: tenant.tax_id,
    companyEmail: tenant.custom_domain ?? adminUser.email,
    companyPhone: adminUser.phone ?? 'N/A',
    companyCountry: tenant.country,
    companyCity: tenant.city,
    adminName: adminUser.name,
    adminEmail: adminUser.email,
    adminPhone: adminUser.phone,
  });

  // 5. Insertar solicitud
  const now = new Date();
  const requestId = randomUUID();
  const expiresAt = new Date(
    now.getTime() + UPGRADE_REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
  const dummyHash = await generateDummyPasswordHash();

  await prisma.saas_registration_requests.create({
    data: {
      id: requestId,
      type: 'upgrade',
      company_name: normalized.context.companyName,
      company_tax_id: normalized.context.companyTaxId,
      company_email: normalized.context.companyEmail,
      company_phone: normalized.context.companyPhone,
      company_country: normalized.context.companyCountry,
      company_city: normalized.context.companyCity,
      admin_name: normalized.context.adminName,
      admin_email: normalized.context.adminEmail,
      admin_phone: normalized.context.adminPhone,
      admin_position: null,
      admin_password_hash: dummyHash,
      plan_id: normalized.planId,
      plan_key: normalized.planKey,
      plan_name: normalized.planName,
      billing_cycle: payload.billingCycle,
      price_amount: normalized.priceAmount,
      currency: normalized.currency,
      payment_method_id: payload.paymentMethodId ?? null,
      payment_method_key: normalized.paymentMethodKey,
      payment_method_name: normalized.paymentMethodName,
      receipt_url: payload.receiptUrl ?? null,
      receipt_filename: payload.receiptFilename ?? null,
      receipt_file_size: payload.receiptFileSize ?? null,
      receipt_uploaded_at: payload.receiptUrl ? now : null,
      crypto_tx_hash: payload.cryptoTxHash ?? null,
      crypto_verified: null,
      crypto_verified_at: null,
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      review_notes: payload.notes ?? null,
      rejection_reason: null,
      created_tenant_id: tenantId, // ← vínculo al tenant existente
      created_user_id: null,
      ip_address: meta.ipAddress,
      user_agent: meta.userAgent,
      referral_source: null,
      created_at: now,
      updated_at: now,
      expires_at: expiresAt,
    },
  });

  return {
    requestId,
    tenantId,
    planId: normalized.planId,
    planKey: normalized.planKey,
    planName: normalized.planName,
    billingCycle: payload.billingCycle,
    priceAmount: normalized.priceAmount,
    currency: normalized.currency,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}