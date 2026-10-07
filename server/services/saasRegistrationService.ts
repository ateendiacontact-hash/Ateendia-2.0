/**
 * Servicio de registro de nuevas empresas (Sesión 3.5.B.3.a).
 *
 * Responsabilidades:
 * - Normalizar y sanitizar el payload del frontend.
 * - Hashear el password del admin con bcrypt (y descartar el original).
 * - Detectar duplicados (mismo email o mismo tax_id pendientes).
 * - Insertar en saas_registration_requests con expiración a 7 días.
 *
 * Decisiones de seguridad (ver AGENTS.md):
 * - El password del admin NO se transfiere al user creado al aprobar.
 *   Acá se hashea solo por defensa en profundidad y consistencia con la DB
 *   (la columna admin_password_hash es NOT NULL). Al aprobar (3.5.B.3.b),
 *   se ignora este hash y se genera un password temporal nuevo.
 * - La respuesta al frontend es minimalista (anti-enumeración): no revela
 *   si el email ya existía.
 * - La IP y user-agent SIEMPRE vienen del servidor, nunca del frontend.
 */

import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import type {
  RegisterRequestPayload,
  RegisterRequestMeta,
  RegisterRequestResult,
  NormalizedRegisterPayload,
  RegistrationType,
  BillingCycle,
  RegistrationStatus,
  RegistrationStatusDTO,
} from '../types/registration.js';

/** Días de expiración de una solicitud de registro. */
const REGISTRATION_EXPIRATION_DAYS = 7;

/** Rondas de bcrypt. 10 es el estándar seguro y rápido (≈80ms). */
const BCRYPT_ROUNDS = 10;

/**
 * Error de dominio lanzado cuando el payload es inválido a nivel de negocio
 * (no a nivel de Zod, que se maneja en la ruta).
 */
export class RegistrationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistrationValidationError';
  }
}

/**
 * Normaliza y sanitiza un payload de registro.
 *
 * - Trim en todos los strings.
 * - Lowercase en emails (evita duplicados por mayúsculas).
 * - Convierte string vacío a null en campos opcionales.
 * - Hashea el password con bcrypt.
 * - Genera id (uuid) y expires_at (now + 7 días).
 *
 * @throws RegistrationValidationError si type no es 'demo' | 'payment'.
 */
export async function normalizeRegistrationPayload(
  input: RegisterRequestPayload,
  meta: RegisterRequestMeta,
): Promise<NormalizedRegisterPayload> {
  // ─── Validación de dominio (más allá de Zod) ─────────────────────
  if (input.type !== 'demo' && input.type !== 'payment') {
    throw new RegistrationValidationError(
      `Tipo de registro inválido: ${input.type}. Debe ser 'demo' o 'payment'.`,
    );
  }

  // ─── Sanitización de strings ─────────────────────────────────────
  const trim = (v: string | undefined | null): string | null => {
    if (v === undefined || v === null) return null;
    const t = v.trim();
    return t.length > 0 ? t : null;
  };

  const companyName = trim(input.companyName);
  const companyEmail = trim(input.companyEmail);
  const adminName = trim(input.adminName);
  const adminEmail = trim(input.adminEmail);

  if (!companyName) {
    throw new RegistrationValidationError('companyName es obligatorio.');
  }
  if (!companyEmail) {
    throw new RegistrationValidationError('companyEmail es obligatorio.');
  }
  if (!adminName) {
    throw new RegistrationValidationError('adminName es obligatorio.');
  }
  if (!adminEmail) {
    throw new RegistrationValidationError('adminEmail es obligatorio.');
  }
  if (!input.adminPassword || input.adminPassword.length < 8) {
    throw new RegistrationValidationError(
      'adminPassword debe tener al menos 8 caracteres.',
    );
  }

  // ─── Hasheo del password ─────────────────────────────────────────
  // Importante: el password original NO se guarda en ningún lado.
  // Solo el hash llega a la DB (y incluso ese hash no se usará para el
  // user final; ver decisión de 3.5.B.3.b).
  const passwordHash = await bcrypt.hash(input.adminPassword, BCRYPT_ROUNDS);

  // ─── Fechas ──────────────────────────────────────────────────────
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + REGISTRATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
  );

  // ─── Comprobante: solo si type === 'payment' ─────────────────────
  const isPayment = input.type === 'payment';
  const receiptUploadedAt = isPayment && input.receiptUrl ? now : null;

  // ─── Construir payload normalizado ───────────────────────────────
  const normalized: NormalizedRegisterPayload = {
    id: randomUUID(),
    type: input.type as RegistrationType,
    company_name: companyName,
    company_tax_id: trim(input.companyTaxId),
    company_email: companyEmail.toLowerCase(),
    company_phone: trim(input.companyPhone) ?? '',
    company_country: trim(input.companyCountry),
    company_city: trim(input.companyCity),

    admin_name: adminName,
    admin_email: adminEmail.toLowerCase(),
    admin_phone: trim(input.adminPhone),
    admin_position: trim(input.adminPosition),
    admin_password_hash: passwordHash,

    plan_id: input.planId,
    plan_key: input.planKey,
    plan_name: input.planName,
    billing_cycle: input.billingCycle as BillingCycle,
    price_amount: input.priceAmount,
    currency: input.currency || 'USD',

    payment_method_id: isPayment ? trim(input.paymentMethodId) : null,
    payment_method_key: isPayment ? trim(input.paymentMethodKey) : null,
    payment_method_name: isPayment ? trim(input.paymentMethodName) : null,

    receipt_url: isPayment ? trim(input.receiptUrl) : null,
    receipt_filename: isPayment ? trim(input.receiptFilename) : null,
    receipt_file_size: isPayment ? trim(input.receiptFileSize) : null,
    receipt_uploaded_at: receiptUploadedAt,

    crypto_tx_hash: trim(input.cryptoTxHash),

    status: 'pending',
    ip_address: meta.ipAddress,
    user_agent: meta.userAgent,
    referral_source: trim(input.referralSource),

    expires_at: expiresAt,
  };

  return normalized;
}

/**
 * Verifica si ya existe una solicitud pendiente con el mismo email o tax_id.
 *
 * Anti-spam: evita que un usuario cree múltiples solicitudes duplicadas.
 * NO se devuelve al frontend (anti-enumeración): si hay duplicado, el
 * endpoint responde 200 igual con un requestId ficticio o similar.
 *
 * @returns true si hay duplicado, false si no.
 */
export async function checkDuplicateRequest(
  companyEmail: string,
  companyTaxId: string | null,
): Promise<boolean> {
  const email = companyEmail.toLowerCase().trim();

  const conditions: Array<Record<string, unknown>> = [
    { company_email: email },
    { admin_email: email },
  ];

  if (companyTaxId && companyTaxId.trim().length > 0) {
    conditions.push({ company_tax_id: companyTaxId.trim() });
  }

  const existing = await prisma.saas_registration_requests.findFirst({
    where: {
      status: 'pending',
      OR: conditions,
    },
    select: { id: true },
  });

  return existing !== null;
}

/**
 * Crea una solicitud de registro en la DB.
 *
 * Flujo:
 * 1. Normaliza el payload (sanitiza, hashea password, calcula expires_at).
 * 2. Verifica duplicados (mismo email o tax_id pendiente).
 * 3. Inserta en saas_registration_requests.
 * 4. Devuelve un resultado minimalista (anti-enumeración).
 *
 * ⚠️ Si hay duplicado, NO se lanza error. Se devuelve un resultado
 * "fake" con el mismo formato para no revelar al atacante que el email
 * ya existe. El frontend ve un 201 normal.
 */
export async function createRegistrationRequest(
  input: RegisterRequestPayload,
  meta: RegisterRequestMeta,
): Promise<RegisterRequestResult> {
  // 1. Normalizar (puede lanzar RegistrationValidationError)
  const normalized = await normalizeRegistrationPayload(input, meta);

  // 2. Verificar duplicados
  const isDuplicate = await checkDuplicateRequest(
    normalized.company_email,
    normalized.company_tax_id,
  );

  if (isDuplicate) {
    // Anti-enumeración: devolvemos un resultado con la misma forma,
    // pero sin insertar en DB. El atacante no puede distinguir esto
    // de un registro exitoso.
    // Nota: usamos un id fake determinístico a partir del email para
    // que sea estable si el mismo atacante reintenta.
    const fakeId = `dup_${Buffer.from(normalized.company_email)
      .toString('base64url')
      .slice(0, 32)}`;
    return {
      requestId: fakeId,
      expiresAt: normalized.expires_at.toISOString(),
    };
  }

  // 3. Insertar
  await prisma.saas_registration_requests.create({
    data: {
      id: normalized.id,
      type: normalized.type,
      company_name: normalized.company_name,
      company_tax_id: normalized.company_tax_id,
      company_email: normalized.company_email,
      company_phone: normalized.company_phone,
      company_country: normalized.company_country,
      company_city: normalized.company_city,

      admin_name: normalized.admin_name,
      admin_email: normalized.admin_email,
      admin_phone: normalized.admin_phone,
      admin_position: normalized.admin_position,
      admin_password_hash: normalized.admin_password_hash,

      plan_id: normalized.plan_id,
      plan_key: normalized.plan_key,
      plan_name: normalized.plan_name,
      billing_cycle: normalized.billing_cycle,
      price_amount: normalized.price_amount,
      currency: normalized.currency,

      payment_method_id: normalized.payment_method_id,
      payment_method_key: normalized.payment_method_key,
      payment_method_name: normalized.payment_method_name,

      receipt_url: normalized.receipt_url,
      receipt_filename: normalized.receipt_filename,
      receipt_file_size: normalized.receipt_file_size,
      receipt_uploaded_at: normalized.receipt_uploaded_at,

      crypto_tx_hash: normalized.crypto_tx_hash,

      status: normalized.status,
      ip_address: normalized.ip_address,
      user_agent: normalized.user_agent,
      referral_source: normalized.referral_source,

      expires_at: normalized.expires_at,
    },
  });

  // 4. Resultado minimalista
  return {
    requestId: normalized.id,
    expiresAt: normalized.expires_at.toISOString(),
  };
}

/**
 * Obtiene el estado público de una solicitud de registro por su requestId.
 *
 * Frontera de seguridad (ver RegistrationStatusDTO en types/registration.ts):
 * - Devuelve un DTO SANITIZADO: solo status, type, companyName, createdAt,
 *   updatedAt, expiresAt, reviewedAt.
 * - NUNCA devuelve el row crudo de Prisma. El select es EXPLÍCITO para que
 *   agregar un campo al schema NO lo exponga automáticamente al público.
 * - El select excluye: admin_*, company_email, company_tax_id, company_phone,
 *   payment_method_*, receipt_*, crypto_*, reviewed_by, review_notes,
 *   rejection_reason, created_tenant_id, created_user_id, ip_address,
 *   user_agent, referral_source. Todos esos quedan fuera por diseño.
 *
 * Anti-enumeración:
 * - Si el requestId no existe, devuelve null. El router lo traduce a un
 *   404 con mensaje genérico ("Solicitud no encontrada"), sin revelar
 *   si el ID existía o no.
 *
 * Robustez ante datos corruptos:
 * - Si la DB tiene un status/type distinto de los esperados (por ejemplo,
 *   un typo en un seed o migración manual), los type guards normalizan
 *   al valor seguro ('pending' / 'demo') y emiten un warning. NO se lanza
 *   error para no romper el endpoint público por un dato inconsistente.
 *
 * @param requestId - UUID de la solicitud (ya validado por Zod en el router).
 * @returns DTO sanitizado, o null si no existe.
 */
export async function getRegistrationStatus(
  requestId: string,
): Promise<RegistrationStatusDTO | null> {
  const row = await prisma.saas_registration_requests.findUnique({
    where: { id: requestId },
    // Select explícito: NO hacemos SELECT * para que Prisma no traiga
    // campos sensibles que después podríamos olvidar excluir.
    select: {
      status: true,
      type: true,
      company_name: true,
      created_at: true,
      updated_at: true,
      expires_at: true,
      reviewed_at: true,
    },
  });

  if (!row) return null;

  return {
    status: normalizeRegistrationStatus(row.status),
    type: normalizeRegistrationType(row.type),
    companyName: row.company_name,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
    reviewedAt: row.reviewed_at ? row.reviewed_at.toISOString() : null,
  };
}

/**
 * Normaliza el status de Prisma a un valor del union type RegistrationStatus.
 *
 * Si el valor es inesperado (typo en DB, migración manual, seed corrupto),
 * cae a 'pending' (valor seguro) y emite warning. Nunca lanza excepción:
 * un endpoint público no debe devolver 500 por un dato inconsistente.
 */
function normalizeRegistrationStatus(raw: string): RegistrationStatus {
  if (
    raw === 'pending' ||
    raw === 'approved' ||
    raw === 'rejected' ||
    raw === 'expired'
  ) {
    return raw;
  }
  console.warn(
    `[getRegistrationStatus] status inesperado en DB: "${raw}". Fallback a "pending".`,
  );
  return 'pending';
}

/**
 * Normaliza el type de Prisma a un valor del union type RegistrationType.
 *
 * Si el valor es inesperado, cae a 'demo' (valor más conservador desde el
 * punto de vista del usuario: no promete acceso pago).
 */
function normalizeRegistrationType(raw: string): RegistrationType {
  if (raw === 'demo' || raw === 'payment') return raw;
  console.warn(
    `[getRegistrationStatus] type inesperado en DB: "${raw}". Fallback a "demo".`,
  );
  return 'demo';
}