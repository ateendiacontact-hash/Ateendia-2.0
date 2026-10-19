/**
 * Servicio de revisión de solicitudes de registro (Sesión 3.5.B.3.b).
 *
 * Responsabilidades:
 * - Listar solicitudes con filtro por status (con lazy check de expiración).
 * - Aprobar una solicitud: crear tenant + user admin + subscription en
 *   una TRANSACCIÓN ATÓMICA (todo o nada).
 * - Rechazar una solicitud: marcar como rejected con razón.
 * - Expirar solicitudes pendientes cuyo expires_at ya pasó.
 * - Auto-aprobar solicitudes DEMO (3.5.B.4.e.1): no requieren aprobación humana.
 *
 * Decisiones de seguridad (ver AGENTS.md):
 * - El password del admin que el usuario tipeó en el registro SE TRANSFIERE
 *   al user creado (Opción B implementada). Se usa el hash original.
 * - El subdominio se valida contra una lista de reservados y se
 *   desambigua con sufijo numérico si hay colisión.
 * - Si la transacción falla en cualquier paso, TODO se revierte
 *   (no quedan tenants huérfanos sin user, ni users sin subscription).
 */

import { randomUUID, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
// IMPORTANTE: Importamos Prisma para poder usar Prisma.Decimal
import { Prisma } from '@prisma/client';

/** Rondas de bcrypt. Mismas que en saasRegistrationService. */
const BCRYPT_ROUNDS = 10;

/** Días de gracia para el tenant demo antes de suspensión total. */
const DEMO_GRACE_PERIOD_DAYS = 30;

/** Días de gracia para pago de suscripciones pagas. */
const PAID_GRACE_PERIOD_DAYS = 5;

/** Longitud mínima y máxima del subdominio (RFC 1035). */
const SUBDOMAIN_MIN_LENGTH = 3;
const SUBDOMAIN_MAX_LENGTH = 63;

/**
 * Subdominios reservados que NO pueden ser asignados a ningún tenant.
 */
const RESERVED_SLUGS = new Set<string>([
  'www', 'api', 'admin', 'app', 'mail', 'smtp', 'ftp', 'webmail',
  'cpanel', 'ns1', 'ns2', 'blog', 'shop', 'dev', 'staging', 'test',
  'demo', 'status', 'support', 'help', 'docs', 'cdn', 'assets',
  'static', 'media', 'img', 'files', 'download', 'upload',
  'dashboard', 'panel', 'login', 'auth', 'billing', 'pay', 'payment',
  'secure', 'ssl', 'vpn', 'mx', 'pop', 'imap',
]);

/**
 * Error de dominio lanzado cuando una operación de review falla a nivel
 * de negocio (no a nivel de Zod, que se maneja en la ruta).
 */
export class RegistrationReviewError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode = 400) {
    super(message);
    this.name = 'RegistrationReviewError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

export function generateSlug(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized.slice(0, SUBDOMAIN_MAX_LENGTH);
}

export async function findUniqueSubdomain(
  companyName: string,
): Promise<string> {
  let base = generateSlug(companyName);

  if (base.length < SUBDOMAIN_MIN_LENGTH || RESERVED_SLUGS.has(base)) {
    base = `tenant-${randomBytes(3).toString('hex')}`;
  }

  const existing = await prisma.tenants.findUnique({
    where: { subdomain: base },
    select: { id: true },
  });

  if (!existing) {
    return base;
  }

  for (let i = 2; i <= 100; i++) {
    const candidate = `${base}-${i}`.slice(0, SUBDOMAIN_MAX_LENGTH);
    const conflict = await prisma.tenants.findUnique({
      where: { subdomain: candidate },
      select: { id: true },
    });
    if (!conflict) {
      return candidate;
    }
  }

  throw new RegistrationReviewError(
    'No se pudo generar un subdominio único tras 100 intentos.',
    'SUBDOMAIN_EXHAUSTED',
    500,
  );
}

// ─── Lazy check de expiración ───────────────────────────────────────

export async function expireStaleRegistrations(): Promise<number> {
  const result = await prisma.saas_registration_requests.updateMany({
    where: {
      status: 'pending',
      expires_at: { lt: new Date() },
    },
    data: {
      status: 'expired',
      updated_at: new Date(),
    },
  });

  return result.count;
}

// ─── Listado ────────────────────────────────────────────────────────

export interface ListRegistrationsFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'expired' | 'all';
  limit?: number;
  offset?: number;
}

export interface ListRegistrationsResult {
  items: Array<{
    id: string;
    type: string;
    status: string;
    company_name: string;
    company_email: string;
    admin_name: string;
    admin_email: string;
    plan_id: string;
    plan_key: string;
    plan_name: string;
    billing_cycle: string;
    price_amount: number;
    currency: string;
    created_at: string;
    expires_at: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
  }>;
  total: number;
  expiredCount: number;
}

export async function listRegistrations(
  filters: ListRegistrationsFilters = {},
): Promise<ListRegistrationsResult> {
  const expiredCount = await expireStaleRegistrations();

  const where =
    !filters.status || filters.status === 'all'
      ? {}
      : { status: filters.status };

  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = Math.max(filters.offset ?? 0, 0);

  const [rows, total] = await Promise.all([
    prisma.saas_registration_requests.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.saas_registration_requests.count({ where }),
  ]);

  const items = rows.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    company_name: r.company_name,
    company_email: r.company_email,
    admin_name: r.admin_name,
    admin_email: r.admin_email,
    plan_id: r.plan_id,
    plan_key: r.plan_key,
    plan_name: r.plan_name,
    billing_cycle: r.billing_cycle,
    price_amount: Number(r.price_amount),
    currency: r.currency,
    created_at: r.created_at.toISOString(),
    expires_at: r.expires_at ? r.expires_at.toISOString() : null,
    reviewed_by: r.reviewed_by,
    reviewed_at: r.reviewed_at ? r.reviewed_at.toISOString() : null,
  }));

  return { items, total, expiredCount };
}

// ─── Aprobación (transacción atómica) ───────────────────────────────

export interface ApproveRegistrationResult {
  requestId: string;
  tenantId: string;
  userId: string;
  subscriptionId: string;
  subdomain: string;
  tempPassword: string;
}

export async function approveRegistration(
  requestId: string,
  reviewerUserId: string | null,
  notes?: string,
): Promise<ApproveRegistrationResult> {
  const request = await prisma.saas_registration_requests.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new RegistrationReviewError(
      `Solicitud no encontrada: ${requestId}`,
      'REGISTRATION_NOT_FOUND',
      404,
    );
  }

  if (request.status !== 'pending') {
    throw new RegistrationReviewError(
      `La solicitud no está pendiente (status actual: ${request.status}).`,
      'REGISTRATION_NOT_PENDING',
      409,
    );
  }

  if (request.expires_at && request.expires_at < new Date()) {
    throw new RegistrationReviewError(
      'La solicitud ya expiró.',
      'REGISTRATION_EXPIRED',
      409,
    );
  }

  const isUpgrade = request.type === 'upgrade';

  const now = new Date();
  const subdomain = isUpgrade ? null : await findUniqueSubdomain(request.company_name);
  
  // YA NO GENERAMOS PASSWORD TEMPORAL
  const tempPassword = isUpgrade ? null : '(password original)';
  const tempPasswordHash = null; // Lo tomamos del request directamente

  const tenantId = isUpgrade ? request.created_tenant_id : randomUUID();
  const userId = isUpgrade ? null : randomUUID();
  const subscriptionId = randomUUID();

  if (isUpgrade && !tenantId) {
    throw new RegistrationReviewError(
      'Solicitud marcada como upgrade pero sin created_tenant_id. Dato inconsistente.',
      'UPGRADE_MISSING_TENANT_ID',
      500,
    );
  }

  const renewalDays = request.billing_cycle === 'yearly' ? 365 : 30;
  const renewalDate = new Date(
    now.getTime() + renewalDays * 24 * 60 * 60 * 1000,
  );

  let upgradeTenantExists = false;
  let upgradeAdminUserId: string | null = null;

  if (isUpgrade) {
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId! },
      select: { id: true },
    });
    if (!tenant) {
      throw new RegistrationReviewError(
        `Tenant del upgrade no encontrado: ${tenantId}`,
        'UPGRADE_TENANT_NOT_FOUND',
        404,
      );
    }
    upgradeTenantExists = true;

    const adminUser = await prisma.users.findFirst({
      where: { tenant_id: tenantId!, role: 'tenant_admin' },
      select: { id: true },
    });
    if (!adminUser) {
      throw new RegistrationReviewError(
        `Tenant sin usuario admin: ${tenantId}. No se puede completar el upgrade.`,
        'UPGRADE_TENANT_ADMIN_NOT_FOUND',
        409,
      );
    }
    upgradeAdminUserId = adminUser.id;
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (isUpgrade) {
        await tx.tenants.update({
          where: { id: tenantId! },
          data: {
            status: 'active',
            is_active: true,
            demo_expires_at: null,
            grace_period_ends_at: null,
            updated_at: now,
          },
        });

        await tx.tenant_subscriptions.upsert({
          where: { tenant_id: tenantId! },
          create: {
            id: subscriptionId,
            tenant_id: tenantId!,
            plan: request.plan_name,
            plan_id: request.plan_id,
            status: 'active',
            monthly_price: request.price_amount,
            renewal_date: renewalDate,
            start_date: now,
            billing_cycle: request.billing_cycle,
            contact_email: request.admin_email,
            grace_period_days: PAID_GRACE_PERIOD_DAYS,
            created_at: now,
            updated_at: now,
          },
          update: {
            plan: request.plan_name,
            plan_id: request.plan_id,
            status: 'active',
            monthly_price: request.price_amount,
            renewal_date: renewalDate,
            billing_cycle: request.billing_cycle,
            contact_email: request.admin_email,
            grace_period_days: PAID_GRACE_PERIOD_DAYS,
            is_auto_suspended: false,
            updated_at: now,
          },
        });

        await tx.saas_registration_requests.update({
          where: { id: requestId },
          data: {
            status: 'approved',
            created_user_id: upgradeAdminUserId,
            reviewed_by: reviewerUserId,
            reviewed_at: now,
            review_notes: notes ?? null,
            updated_at: now,
          },
        });
      } else {
        const isDemo = request.type === 'demo';
        const demoExpiresAt = isDemo
          ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
          : null;
        const gracePeriodEndsAt = isDemo
          ? new Date(
              now.getTime() +
                (14 + DEMO_GRACE_PERIOD_DAYS) * 24 * 60 * 60 * 1000,
            )
          : null;

        // ─── BUSCAR EL PLAN "DEMO FULL" O EL MÁS ALTO ───────────────────
        let planIdToAssign = request.plan_id;
        let planNameToAssign = request.plan_name;
        let planPrice = request.price_amount;

        if (isDemo) {
          // Buscamos el plan activo con el max_users más alto
          const bestPlan = await tx.saas_plans.findFirst({
            where: { is_active: true },
            orderBy: { max_users: 'desc' }
          });

          if (bestPlan) {
            planIdToAssign = bestPlan.id;
            planNameToAssign = `${bestPlan.name} (Demo)`;
            // CORRECCIÓN TS2322: Usar Prisma.Decimal en lugar de number
            planPrice = new Prisma.Decimal(0);
          }
        }

        // Crear tenant
        await tx.tenants.create({
          data: {
            id: tenantId!,
            name: request.company_name,
            legal_name: request.company_name,
            tax_id: request.company_tax_id,
            country: request.company_country,
            city: request.company_city,
            subdomain: subdomain!,
            status: isDemo ? 'demo' : 'active',
            is_active: true,
            currency: request.currency,
            demo_expires_at: demoExpiresAt,
            grace_period_ends_at: gracePeriodEndsAt,
            created_at: now,
            updated_at: now,
          },
        });

        // Crear user admin
        await tx.users.create({
          data: {
            id: userId!,
            tenant_id: tenantId!,
            name: request.admin_name,
            email: request.admin_email,
            // Usamos el hash que ya guardó el formulario de registro
            password_hash: request.admin_password_hash, 
            // Ya no forzamos el reseteo
            must_reset_password: false, 
            role: 'tenant_admin',
            phone: request.admin_phone,
            status: 'active',
            is_super_admin: false,
            is_platform_user: false,
            created_at: now,
            updated_at: now,
          },
        });

        // ─── ASIGNAR PERMISOS AL ROL TENANT_ADMIN ─────────────────────
        let tenantAdminRole = await tx.roles.findFirst({
          where: { tenant_id: tenantId, key: 'tenant_admin' }
        });

        if (!tenantAdminRole) {
          tenantAdminRole = await tx.roles.create({
            data: {
              id: randomUUID(),
              tenant_id: tenantId,
              key: 'tenant_admin',
              name: 'Administrador de Empresa',
              description: 'Rol por defecto con acceso total a su propio tenant',
              is_system: true,
              is_platform_role: false,
            }
          });
        }

        const modulos = ['clients', 'policies', 'users', 'banking', 'whatsapp', 'pipelines'];
        for (const mod of modulos) {
          await tx.role_permissions.upsert({
            where: {
              // CORRECCIÓN TS2353: Nombre correcto del compound unique
              role_id_module_action: {
                role_id: tenantAdminRole.id,
                module: mod,
                action: 'view'
              }
            },
            create: {
              id: randomUUID(),
              role_id: tenantAdminRole.id,
              module: mod,
              action: 'view',
              allowed: true,
            },
            update: { allowed: true }
          });
        }

        // Crear subscription (ahora con el plan mejorado si es demo)
        await tx.tenant_subscriptions.create({
          data: {
            id: subscriptionId,
            tenant_id: tenantId!,
            plan: planNameToAssign,
            plan_id: planIdToAssign,
            status: 'active',
            monthly_price: planPrice,
            renewal_date: renewalDate,
            start_date: now,
            billing_cycle: request.billing_cycle,
            contact_email: request.admin_email,
            grace_period_days: PAID_GRACE_PERIOD_DAYS,
            created_at: now,
            updated_at: now,
          },
        });

        // Actualizar request
        await tx.saas_registration_requests.update({
          where: { id: requestId },
          data: {
            status: 'approved',
            created_tenant_id: tenantId!,
            created_user_id: userId!,
            reviewed_by: reviewerUserId,
            reviewed_at: now,
            review_notes: notes ?? null,
            updated_at: now,
          },
        });
      }
    });
  } catch (err) {
    throw new RegistrationReviewError(
      `Error al aprobar la solicitud: ${(err as Error).message}`,
      'APPROVAL_TRANSACTION_FAILED',
      500,
    );
  }

  return {
    requestId,
    tenantId: tenantId!,
    userId: isUpgrade ? upgradeAdminUserId! : userId!,
    subscriptionId,
    subdomain: subdomain ?? '(existente)',
    tempPassword: tempPassword ?? '(mantiene su password)',
  };
}

// ─── Auto-aprobación de DEMO ────────────────────────────────────────

export async function autoApproveDemoRegistration(
  requestId: string,
): Promise<ApproveRegistrationResult> {
  const request = await prisma.saas_registration_requests.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new RegistrationReviewError(
      'Solicitud no encontrada.',
      'REGISTRATION_NOT_FOUND',
      404,
    );
  }

  if (request.type !== 'demo') {
    throw new RegistrationReviewError(
      `autoApproveDemoRegistration solo acepta type='demo'. Recibido: '${request.type}'.`,
      'INVALID_REGISTRATION_TYPE',
      400,
    );
  }

  if (request.status !== 'pending') {
    throw new RegistrationReviewError(
      `La solicitud ya está en estado '${request.status}'. No se puede auto-aprobar.`,
      'REGISTRATION_NOT_PENDING',
      409,
    );
  }

  return approveRegistration(
    requestId,
    null,
    'Auto-aprobado por el sistema: registro DEMO sin pago que validar.',
  );
}

// ─── Rechazo ────────────────────────────────────────────────────────

export interface RejectRegistrationResult {
  requestId: string;
  status: 'rejected';
  reviewedAt: string;
}

export async function rejectRegistration(
  requestId: string,
  reviewerUserId: string,
  reason: string,
): Promise<RejectRegistrationResult> {
  if (!reason || reason.trim().length < 3) {
    throw new RegistrationReviewError(
      'Se requiere una razón de rechazo (mínimo 3 caracteres).',
      'REJECTION_REASON_REQUIRED',
      400,
    );
  }

  const request = await prisma.saas_registration_requests.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new RegistrationReviewError(
      `Solicitud no encontrada: ${requestId}`,
      'REGISTRATION_NOT_FOUND',
      404,
    );
  }

  if (request.status !== 'pending') {
    throw new RegistrationReviewError(
      `La solicitud no está pendiente (status actual: ${request.status}).`,
      'REGISTRATION_NOT_PENDING',
      409,
    );
  }

  const now = new Date();

  await prisma.saas_registration_requests.update({
    where: { id: requestId },
    data: {
      status: 'rejected',
      reviewed_by: reviewerUserId,
      reviewed_at: now,
      rejection_reason: reason.trim(),
      updated_at: now,
    },
  });

  return {
    requestId,
    status: 'rejected',
    reviewedAt: now.toISOString(),
  };
}