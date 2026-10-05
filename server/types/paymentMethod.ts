/**
 * @file paymentMethod.ts
 * @description Tipos backend para métodos de pago del SaaS.
 *
 * IMPORTANTE: este archivo define el "DTO público" — la versión sanitizada
 * que se expone en el endpoint GET /api/saas/payment-methods/public.
 *
 * NO incluye campos sensibles como `provider_config_json` (que puede contener
 * API keys de Stripe/PayPal) ni `payment_data_json` completo (que puede tener
 * datos bancarios internos). Si en el futuro se necesitan exponer otros campos,
 * hacerlo explícitamente — nunca con spread del row de Prisma.
 *
 * @see server/services/saasPaymentMethodsService.ts — servicio que construye estos DTOs
 * @see server/routes/saas/paymentMethods.ts — endpoint público
 */

/**
 * Tipos de método de pago soportados por el SaaS.
 *
 * - `manual`: transferencias bancarias, Zelle, pago móvil, efectivo, etc.
 *   Requiere revisión humana del comprobante antes de aprobar.
 *
 * - `crypto_semi_auto`: USDT (u otra crypto) enviada a una wallet.
 *   Requiere verificación semi-automática del tx hash (explorer API).
 *
 * - `automatic`: Stripe, PayPal.
 *   Webhook confirma el pago sin intervención humana.
 */
export type SaasPaymentMethodType = 'manual' | 'crypto_semi_auto' | 'automatic';

/**
 * Método de pago expuesto públicamente (versión sanitizada).
 *
 * Esta estructura es lo que el frontend recibe en GET /api/saas/payment-methods/public.
 * Contiene solo la información necesaria para que el usuario elija un método
 * y (si corresponde) vea las instrucciones para completar el pago.
 */
export interface PublicPaymentMethod {
  /** ID único del método (ej: 'pm-zelle-001'). */
  id: string;

  /** Key única del método (ej: 'zelle'). Usada para lookups rápidos. */
  key: string;

  /** Nombre visible del método (ej: 'Zelle'). */
  name: string;

  /** Descripción corta opcional (ej: 'Transferencia instantánea desde tu banco'). */
  description: string | null;

  /** Tipo del método. Determina el flujo de aprobación. */
  type: SaasPaymentMethodType;

  /**
   * Datos específicos del método, ya parseados desde `payment_data_json`.
   *
   * Forma esperada según tipo:
   * - `manual`: { bankName, accountNumber, accountHolder, ... }
   * - `crypto_semi_auto`: datos mínimos (la wallet va en `cryptoWallet`)
   * - `automatic`: NO se expone (los datos de Stripe son server-side)
   *
   * Si no hay datos, es `null`.
   */
  paymentData: Record<string, unknown> | null;

  /** URL del logo del método (ej: logo de Zelle, Stripe). Puede ser null. */
  logoUrl: string | null;

  /** URL del QR code (útil para crypto o transferencias móviles). Puede ser null. */
  qrCodeUrl: string | null;

  /**
   * Instrucciones en texto plano para completar el pago.
   * Ej: "Enviar el monto exacto a la siguiente cuenta. Adjuntar comprobante."
   */
  instructions: string | null;

  // ─── Crypto (solo si type === 'crypto_semi_auto') ────────────────────
  /** Red blockchain (ej: 'TRC-20', 'ERC-20', 'Polygon'). */
  cryptoNetwork: string | null;

  /** Símbolo de la moneda (ej: 'USDT', 'USDC'). */
  cryptoSymbol: string | null;

  /** Dirección de la wallet donde se recibe el pago. */
  cryptoWallet: string | null;

  // ⚠️ NO exponemos crypto_explorer_api (es config interna del servidor).

  // ⚠️ NO exponemos provider_config_json (contiene API keys de Stripe/PayPal).
}

/**
 * Respuesta del endpoint GET /api/saas/payment-methods/public.
 *
 * Sigue el patrón `{ success: true, data: ... }` del resto de la API.
 */
export interface PublicPaymentMethodsResponse {
  success: true;
  data: PublicPaymentMethod[];
}