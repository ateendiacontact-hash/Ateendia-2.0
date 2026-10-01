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