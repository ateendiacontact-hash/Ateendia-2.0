/**
 * @file saasPaymentMethodsService.ts
 * @description Servicio para métodos de pago del SaaS.
 *
 * Responsabilidades:
 * - Listar métodos activos para el endpoint público (sanitizado).
 * - Parsear JSON de MariaDB (payment_data_json) — recordá que Prisma lo expone como String?.
 * - Construir DTOs públicos sin exponer campos sensibles.
 *
 * @see server/types/paymentMethod.ts — tipos PublicPaymentMethod
 */

import { prisma } from '../db.js';
import type {
  PublicPaymentMethod,
  SaasPaymentMethodType,
} from '../types/paymentMethod.js';

/**
 * Lista todos los métodos de pago activos, listos para el endpoint público.
 *
 * - Filtra por `is_active = true`.
 * - Ordena por `sort_order ASC, created_at ASC` (determinístico).
 * - Parsea `payment_data_json` de string a objeto.
 * - NO expone `provider_config_json` ni `crypto_explorer_api`.
 *
 * @returns Array de métodos sanitizados, o [] si no hay ninguno.
 */
export async function listPublicPaymentMethods(): Promise<PublicPaymentMethod[]> {
  // Prisma: modelo plural snake_case (regla crítica del proyecto)
  const rows = await prisma.saas_payment_methods.findMany({
    where: { is_active: true },
    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
  });

  return rows.map(mapRowToPublicDto);
}

/**
 * Convierte una fila de Prisma a un DTO público sanitizado.
 *
 * - Parsea `payment_data_json` de string a Record.
 * - Castea `type` a SaasPaymentMethodType (con fallback a 'manual' si viene algo raro).
 * - Omite campos sensibles.
 */
function mapRowToPublicDto(row: {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: string;
  payment_data_json: string | null;
  logo_url: string | null;
  qr_code_url: string | null;
  instructions: string | null;
  crypto_network: string | null;
  crypto_symbol: string | null;
  crypto_wallet: string | null;
}): PublicPaymentMethod {
  // Parseo seguro de payment_data_json (String? en Prisma → Record | null)
  let paymentData: Record<string, unknown> | null = null;
  if (row.payment_data_json) {
    try {
      const parsed = JSON.parse(row.payment_data_json);
      // Solo aceptamos objetos (no arrays, no primitivos)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        paymentData = parsed as Record<string, unknown>;
      }
    } catch {
      // Si el JSON está corrupto, no rompemos la respuesta. Logueamos y seguimos.
      console.warn(
        `[saasPaymentMethodsService] payment_data_json inválido para method ${row.id}`
      );
    }
  }

  // Casteo defensivo del `type` (la DB es String sin CHECK constraint)
  const validTypes: SaasPaymentMethodType[] = [
    'manual',
    'crypto_semi_auto',
    'automatic',
  ];
  const methodType: SaasPaymentMethodType = validTypes.includes(
    row.type as SaasPaymentMethodType
  )
    ? (row.type as SaasPaymentMethodType)
    : 'manual'; // fallback seguro

  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    type: methodType,
    paymentData,
    logoUrl: row.logo_url,
    qrCodeUrl: row.qr_code_url,
    instructions: row.instructions,
    cryptoNetwork: row.crypto_network,
    cryptoSymbol: row.crypto_symbol,
    cryptoWallet: row.crypto_wallet,
  };
}