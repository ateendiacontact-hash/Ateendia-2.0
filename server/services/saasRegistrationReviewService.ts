/**
 * Servicio de revisión de solicitudes de registro (Sesión 3.5.B.3.b).
 *
 * Responsabilidades:
 * - Listar solicitudes con filtro por status (con lazy check de expiración).
 * - Aprobar una solicitud: crear tenant + user admin + subscription en
 *   una TRANSACCIÓN ATÓMICA (todo o nada).
 * - Rechazar una solicitud: marcar como rejected con razón.
 * - Expirar solicitudes pendientes cuyo expires_at ya pasó.
 *
 * Decisiones de seguridad (ver AGENTS.md):
 * - El password del admin que el usuario tipeó en el registro NO se
 *   transfiere al user creado. Se genera un password temporal aleatorio
 *   y se marca must_reset_password = true.
 * - El password temporal NUNCA se loguea ni se guarda en claro.
 * - El subdominio se valida contra una lista de reservados y se
 *   desambigua con sufijo numérico si hay colisión.
 * - Si la transacción falla en cualquier paso, TODO se revierte
 *   (no quedan tenants huérfanos sin user, ni users sin subscription).
 */

import { randomUUID, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';

/** Rondas de bcrypt. Mismas que en saasRegistrationService. */
const BCRYPT_ROUNDS = 10;

/** Días de gracia para el tenant demo antes de suspensión total. */
const DEMO_GRACE_PERIOD_DAYS = 30;

/** Días de gracia para pago de suscripciones pagas. */
const PAID_GRACE_PERIOD_DAYS = 5;

/** Longitud del password temporal generado. */
const TEMP_PASSWORD_LENGTH = 16;

/** Longitud mínima y máxima del subdominio (RFC 1035). */
const SUBDOMAIN_MIN_LENGTH = 3;
const SUBDOMAIN_MAX_LENGTH = 63;

/**
 * Subdominios reservados que NO pueden ser asignados a ningún tenant.
 * Incluye nombres comunes de infraestructura, correo, y servicios.
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

/**
 * Genera un slug válido a partir de un nombre de empresa.
 *
 * Reglas:
 * - Lowercase.
 * - Sin acentos (normaliza NFD y elimina marcas diacríticas).
 * - Solo [a-z0-9-].
 * - Colapsa guiones repetidos.
 * - Trim de guiones al inicio/fin.
 * - Trunca a SUBDOMAIN_MAX_LENGTH.
 *
 * @returns slug limpio. Puede ser vacío si el input no tenía
 *          caracteres válidos; el caller debe manejar ese caso.
 */
export function generateSlug(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // elimina diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')     // todo lo no-alfanumérico → guion
    .replace(/-+/g, '-')             // colapsa guiones
    .replace(/^-|-$/g, '');          // trim guiones

  return normalized.slice(0, SUBDOMAIN_MAX_LENGTH);
}

/**
 * Encuentra un subdominio único para un tenant.
 *
 * Algoritmo:
 * 1. Genera el slug base desde el nombre.
 * 2. Si está vacío o es muy corto, usa 'tenant-' + 6 chars random.
 * 3. Si está en RESERVED_SLUGS, agrega sufijo aleatorio.
 * 4. Verifica contra la DB. Si ya existe, agrega -2, -3, etc.
 *
 * @throws RegistrationReviewError si no puede encontrar un slug único
 *         tras 100 intentos (improbable).
 */
export async function findUniqueSubdomain(
  companyName: string,
): Promise<string> {
  let base = generateSlug(companyName);

  // Fallback si el slug quedó vacío o muy corto
  if (base.length < SUBDOMAIN_MIN_LENGTH || RESERVED_SLUGS.has(base)) {
    base = `tenant-${randomBytes(3).toString('hex')}`;
  }

  // Primer intento: el slug base tal cual
  const existing = await prisma.tenants.findUnique({
    where: { subdomain: base },
    select: { id: true },
  });

  if (!existing) {
    return base;
  }

  // Colisión: probar con sufijo numérico
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

/**
 * Genera un password temporal aleatorio (16 chars base64url).
 * NUNCA se loguea ni se guarda en claro: se hashea inmediatamente.
 */
export function generateTempPassword(): string {
  return randomBytes(TEMP_PASSWORD_LENGTH)
    .toString('base64url')
    .slice(0, TEMP_PASSWORD_LENGTH);
}

// ─── Lazy check de expiración ───────────────────────────────────────

/**
 * Marca como 'expired' las solicitudes pending cuyo expires_at ya pasó.
 *
 * Se llama ANTES de listar solicitudes, para que el Super Admin vea
 * el estado real. En el futuro, un cron job puede llamar a esta misma
 * función periódicamente.
 *
 * @returns cantidad de filas actualizadas.
 */
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

/**
 * Lista solicitudes de registro con filtro por status y paginación.
 *
 * Antes de listar, ejecuta un lazy check que marca como 'expired' las
 * solicitudes pending cuyo expires_at ya pasó. Esto evita necesitar un
 * cron job en el MVP.
 */
export async function listRegistrations(
  filters: ListRegistrationsFilters = {},
): Promise<ListRegistrationsResult> {
  // 1. Lazy check de expiración
  const expiredCount = await expireStaleRegistrations();

  const where =
    !filters.status || filters.status === 'all'
      ? {}
      : { status: filters.status };

  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = Math.max(filters.offset ?? 0, 0);

  // 2. Query paginada
  const [rows, total] = await Promise.all([
    prisma.saas_registration_requests.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.saas_registration_requests.count({ where }),
  ]);

  // 3. Mapear a un DTO más limpio (sin hashes ni metadata interna)
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
  /** Password temporal generado. Se devuelve UNA SOLA VEZ para que el
   *  caller lo muestre/emails al admin. NUNCA se persiste en claro. */
  tempPassword: string;
}

/**
 * Aprueba una solicitud de registro.
 *
 * Flujo (TODO dentro de una transacción atómica):
 * 1. Leer la solicitud y validar que esté pending y no expirada.
 * 2. Generar subdominio único desde company_name.
 * 3. Crear tenant (status: 'active' o 'demo' según type).
 * 4. Generar password temporal + hashearlo.
 * 5. Crear user admin (rol tenant_admin, must_reset_password = true).
 * 6. Crear tenant_subscription con plan_id, plan_name, billing_cycle.
 * 7. Actualizar la request: status='approved', created_tenant_id,
 *    created_user_id, reviewed_by, reviewed_at, review_notes.
 *
 * Si cualquier paso falla, TODO se revierte (no hay tenants huérfanos).
 *
 * @throws RegistrationReviewError si la request no existe, no está
 *         pending, o si algo falla en la transacción.
 */
export async function approveRegistration(
  requestId: string,
  reviewerUserId: string,
  notes?: string,
): Promise<ApproveRegistrationResult> {
  // 1. Leer y validar (fuera de la transacción para fail-fast)
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

  // 2. Generar subdominio único y password temporal (fuera de tx)
  const subdomain = await findUniqueSubdomain(request.company_name);
  const tempPassword = generateTempPassword();
  const tempPasswordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

  // 3-7. Transacción atómica
  const now = new Date();
  const tenantId = randomUUID();
  const userId = randomUUID();
  const subscriptionId = randomUUID();

  // Calcular expiración del demo y/o grace period
  const isDemo = request.type === 'demo';
  const demoExpiresAt = isDemo
    ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;
  const gracePeriodEndsAt = isDemo
    ? new Date(now.getTime() + (14 + DEMO_GRACE_PERIOD_DAYS) * 24 * 60 * 60 * 1000)
    : null;

  // Calcular renewal_date según billing_cycle
  const renewalDays = request.billing_cycle === 'yearly' ? 365 : 30;
  const renewalDate = new Date(
    now.getTime() + renewalDays * 24 * 60 * 60 * 1000,
  );

  try {
    await prisma.$transaction(async (tx) => {
      // 3. Crear tenant
      await tx.tenants.create({
        data: {
          id: tenantId,
          name: request.company_name,
          legal_name: request.company_name,
          tax_id: request.company_tax_id,
          country: request.company_country,
          city: request.company_city,
          subdomain,
          status: isDemo ? 'demo' : 'active',
          is_active: true,
          currency: request.currency,
          demo_expires_at: demoExpiresAt,
          grace_period_ends_at: gracePeriodEndsAt,
          created_at: now,
          updated_at: now,
        },
      });

      // 5. Crear user admin
      await tx.users.create({
        data: {
          id: userId,
          tenant_id: tenantId,
          name: request.admin_name,
          email: request.admin_email,
          password_hash: tempPasswordHash,
          must_reset_password: true,
          role: 'tenant_admin',
          phone: request.admin_phone,
          status: 'active',
          is_super_admin: false,
          is_platform_user: false,
          created_at: now,
          updated_at: now,
        },
      });

      // 6. Crear subscription
      await tx.tenant_subscriptions.create({
        data: {
          id: subscriptionId,
          tenant_id: tenantId,
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
      });

      // 7. Actualizar request
      await tx.saas_registration_requests.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          created_tenant_id: tenantId,
          created_user_id: userId,
          reviewed_by: reviewerUserId,
          reviewed_at: now,
          review_notes: notes ?? null,
          updated_at: now,
        },
      });
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
    tenantId,
    userId,
    subscriptionId,
    subdomain,
    tempPassword,
  };
}

// ─── Rechazo ────────────────────────────────────────────────────────

export interface RejectRegistrationResult {
  requestId: string;
  status: 'rejected';
  reviewedAt: string;
}

/**
 * Rechaza una solicitud de registro.
 *
 * @throws RegistrationReviewError si la request no existe o no está
 *         pending (no se puede rechazar una ya aprobada/rechazada).
 */
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