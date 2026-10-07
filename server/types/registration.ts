/**
 * Tipos backend para el flujo de registro de nuevas empresas (Sesión 3.5.B.3).
 *
 * Define:
 * - El payload que el frontend envía al endpoint público POST /api/saas/register.
 * - El tipo de la fila de saas_registration_requests tal como la devuelve Prisma.
 * - Los tipos auxiliares de metadata (IP, user-agent, referral).
 *
 * Reglas:
 * - Los modelos de Prisma usan snake_case (idéntico a la tabla SQL).
 * - El payload del frontend usa camelCase (convención del proyecto en frontend).
 * - La conversión camelCase → snake_case se hace en el servicio, no en el tipo.
 */

/**
 * Tipo de registro: demo gratuita o pago con comprobante.
 * Coincide con la columna `type` de saas_registration_requests.
 */
export type RegistrationType = 'demo' | 'payment';

/**
 * Ciclo de facturación soportado.
 * Coincide con la columna `billing_cycle` de saas_registration_requests.
 */
export type BillingCycle = 'monthly' | 'yearly';

/**
 * Estado del registro.
 * Coincide con la columna `status` de saas_registration_requests.
 */
export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

/**
 * Payload que el frontend envía a POST /api/saas/register.
 *
 * IMPORTANTE: incluye `adminPassword` SOLO en tránsito (HTTPS).
 * NUNCA se guarda en claro en la DB. El servicio lo hashea con bcrypt
 * y guarda el hash en admin_password_hash.
 *
 * ⚠️ En la Sesión 3.5.B.3 decidimos que el password del admin NO se
 * transfiere al user creado al aprobar. En su lugar, al aprobar se
 * genera un password temporal y se fuerza must_reset_password.
 * El password que el usuario tipea acá se usa SOLO para validar
 * formato y luego se descarta. Esto lo implementa el servicio.
 */
export interface RegisterRequestPayload {
  /** 'demo' o 'payment' */
  type: RegistrationType;

  // ─── Datos de la empresa ────────────────────────────────────────
  companyName: string;
  companyTaxId?: string;
  companyEmail: string;
  companyPhone: string;
  companyCountry?: string;
  companyCity?: string;

  // ─── Datos del admin ────────────────────────────────────────────
  adminName: string;
  adminEmail: string;
  adminPhone?: string;
  adminPosition?: string;
  adminPassword: string;

  // ─── Plan seleccionado ──────────────────────────────────────────
  planId: string;
  /** key del plan (ej. 'demo', 'starter', 'pro') */
  planKey: string;
  /** nombre del plan (ej. 'DEMO', 'Starter') */
  planName: string;
  billingCycle: BillingCycle;
  /** precio acordado al momento del registro (snapshot) */
  priceAmount: number;
  /** moneda (ISO 4217, ej. 'USD') */
  currency: string;

  // ─── Método de pago (solo si type === 'payment') ────────────────
  paymentMethodId?: string;
  paymentMethodKey?: string;
  paymentMethodName?: string;

  // ─── Comprobante (solo si type === 'payment') ───────────────────
  /** URL externa del comprobante (Google Drive, Dropbox, etc.) */
  receiptUrl?: string;
  receiptFilename?: string;
  receiptFileSize?: string;

  // ─── Crypto (futuro, opcional) ──────────────────────────────────
  cryptoTxHash?: string;

  // ─── Marketing ──────────────────────────────────────────────────
  referralSource?: string;
}

/**
 * Metadata capturada por el endpoint (NO viene del frontend, la agrega
 * el servidor por seguridad: IP real, user-agent real).
 */
export interface RegisterRequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Resultado de crear una solicitud de registro.
 * Se devuelve al frontend de forma minimalista (anti-enumeración).
 */
export interface RegisterRequestResult {
  /** ID interno de la solicitud (uuid) */
  requestId: string;
  /** Fecha ISO de expiración (created + 7 días) */
  expiresAt: string;
}

/**
 * Payload normalizado (listo para insertar en DB).
 * Es el resultado de normalizeRegistrationPayload().
 * Todos los campos están ya sanitizados (trim, lowercase email, etc.).
 */
export interface NormalizedRegisterPayload {
  id: string;
  type: RegistrationType;
  company_name: string;
  company_tax_id: string | null;
  company_email: string;
  company_phone: string;
  company_country: string | null;
  company_city: string | null;

  admin_name: string;
  admin_email: string;
  admin_phone: string | null;
  admin_position: string | null;
  admin_password_hash: string;

  plan_id: string;
  plan_key: string;
  plan_name: string;
  billing_cycle: BillingCycle;
  price_amount: number;
  currency: string;

  payment_method_id: string | null;
  payment_method_key: string | null;
  payment_method_name: string | null;

  receipt_url: string | null;
  receipt_filename: string | null;
  receipt_file_size: string | null;
  receipt_uploaded_at: Date | null;

  crypto_tx_hash: string | null;

  status: RegistrationStatus;
  ip_address: string | null;
  user_agent: string | null;
  referral_source: string | null;

  expires_at: Date;
}


/**
 * DTO sanitizado que devuelve el endpoint público
 * GET /api/saas/registrations/:requestId/status.
 *
 * IMPORTANTE — Frontera de seguridad:
 * Este tipo define EXACTAMENTE qué campos se exponen al público (sin auth).
 * Cualquier campo que NO esté acá NO debe salir del servicio.
 *
 * Campos EXCLUIDOS deliberadamente (nunca se devuelven):
 * - admin_email, admin_name, admin_phone, admin_position
 * - admin_password_hash (jamás, ni hasheado)
 * - company_email, company_tax_id, company_phone, company_address
 * - payment_method_id, payment_method_key, payment_method_name
 * - receipt_url, receipt_filename, receipt_file_size, receipt_uploaded_at
 * - crypto_tx_hash
 * - rejection_reason, review_notes (motivos internos del revisor)
 * - ip_address, user_agent, referral_source (metadata server-side)
 *
 * Razón de la exclusión (anti-enumeración + privacidad):
 * - Un atacante con un requestId filtrado NO debe poder extraer emails,
 *   tax_ids, datos de pago, ni motivos de rechazo desde este endpoint.
 * - El dueño legítimo de la solicitud ya conoce estos datos: los tipeó él.
 *   No necesita que el endpoint se los recuerde.
 * - Solo se devuelve lo necesario para que el usuario entienda su estado:
 *   status, type, companyName, timestamps.
 *
 * Campos INCLUIDOS y su justificación:
 * - status:        el propósito del endpoint.
 * - type:          demo vs pago — cambia el mensaje al usuario.
 * - companyName:   confirmación de "esta es mi solicitud" (el usuario lo tipeó).
 * - createdAt:     cuándo se envió (el usuario lo sabe, refuerza contexto).
 * - updatedAt:     última modificación (útil si cambió de estado recientemente).
 * - expiresAt:     cuándo expira (crítico para status='pending', el usuario
 *                  necesita saber cuánto tiempo tiene).
 * - reviewedAt:    cuándo se aprobó/rechazó (null si pending/expired).
 *                  Útil para que el usuario sepa cuándo revisar el email.
 */
/**
 * DTO sanitizado que devuelve el endpoint público
 * GET /api/saas/registrations/:requestId/status.
 *
 * IMPORTANTE — Frontera de seguridad:
 * Este tipo define EXACTAMENTE qué campos se exponen al público (sin auth).
 * Cualquier campo que NO esté acá NO debe salir del servicio.
 *
 * Campos EXCLUIDOS deliberadamente (nunca se devuelven):
 * - admin_email, admin_name, admin_phone, admin_position
 * - admin_password_hash (jamás, ni hasheado)
 * - company_email, company_tax_id, company_phone, company_address
 * - plan_id, plan_key, plan_name, billing_cycle, price_amount, currency
 * - payment_method_id, payment_method_key, payment_method_name
 * - receipt_url, receipt_filename, receipt_file_size, receipt_uploaded_at
 * - crypto_tx_hash, crypto_verified, crypto_verified_at
 * - reviewed_by (ID del revisor interno)
 * - review_notes, rejection_reason (motivos internos)
 * - created_tenant_id, created_user_id
 * - ip_address, user_agent, referral_source (metadata server-side)
 *
 * Razón de la exclusión (anti-enumeración + privacidad):
 * - Un atacante con un requestId filtrado NO debe poder extraer emails,
 *   tax_ids, datos de pago, ni motivos de rechazo desde este endpoint.
 * - El dueño legítimo de la solicitud ya conoce estos datos: los tipeó él.
 *   No necesita que el endpoint se los recuerde.
 * - Solo se devuelve lo necesario para que el usuario entienda su estado.
 *
 * Campos INCLUIDOS y su justificación:
 * - status:        el propósito del endpoint.
 * - type:          demo vs pago — cambia el mensaje al usuario.
 * - companyName:   confirmación de "esta es mi solicitud".
 * - createdAt:     cuándo se envió.
 * - updatedAt:     último cambio de estado (updated_at se actualiza manualmente
 *                  en approve/reject/expire del review service — verificado).
 * - expiresAt:     cuándo expira. Nullable en DB → nullable en DTO.
 *                  El frontend muestra "sin fecha" si es null.
 * - reviewedAt:    cuándo se aprobó/rechazó (null si pending/expired).
 */
export interface RegistrationStatusDTO {
  status: RegistrationStatus;
  type: RegistrationType;
  companyName: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  reviewedAt: string | null;
}

/**
 * Respuesta del endpoint público de consulta de estado.
 *
 * Estructura discriminada por `success`:
 * - Éxito:  { success: true,  data: RegistrationStatusDTO }
 * - Error:  { success: false, error: string, code: string }
 *
 * Nota: el tipo de error se define en el router (no acá) porque es
 * específico del transporte HTTP, no del dominio.
 */
export interface RegistrationStatusSuccessResponse {
  success: true;
  data: RegistrationStatusDTO;
}