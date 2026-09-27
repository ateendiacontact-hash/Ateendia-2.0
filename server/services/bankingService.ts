// ===========================================
// server/services/bankingService.ts
// Lógica de negocio del módulo bancario.
//
// Características críticas:
//   - Enmascaramiento de números sensibles (solo últimos 4 dígitos)
//   - Aislamiento multi-tenant
//   - Método predeterminado único por cliente
//   - Validación de tipos (bank_account vs credit_card)
// ===========================================

import { prisma } from '../db.js';

// ─── Tipos ───

export interface ListBankingInput {
  tenantId: string;
  page?: number;
  pageSize?: number;
  clientId?: string;
  type?: 'bank_account' | 'credit_card';
}

export interface CreateBankingInput {
  tenantId: string;
  clientId: string;
  type: 'bank_account' | 'credit_card';
  accountHolder: string;
  holderIdNumber?: string;
  bankName: string;
  routingNumber?: string;
  accountNumber: string;
  accountType?: string;
  paymentMethod?: string;
  // Para tarjetas
  cardBrand?: string;
  cardHolder?: string;
  cardNumber?: string;
  cardExpDate?: string;
  cardCvv?: string;
  cardType?: string;
  isDefault?: boolean;
}

export interface UpdateBankingInput {
  tenantId: string;
  id: string;
  // Todos los campos opcionales
  accountHolder?: string;
  holderIdNumber?: string;
  bankName?: string;
  routingNumber?: string;
  accountNumber?: string;
  accountType?: string;
  paymentMethod?: string;
  cardBrand?: string;
  cardHolder?: string;
  cardNumber?: string;
  cardExpDate?: string;
  cardCvv?: string;
  cardType?: string;
  isDefault?: boolean;
  verified?: boolean;
}

// ─── Helpers ───

/**
 * Devuelve solo los últimos 4 dígitos del número.
 * NUNCA devuelve el número completo al frontend (excepto en /reveal).
 */
function last4(number?: string | null): string {
  if (!number) return '****';
  const clean = number.replace(/\s+/g, '');
  return clean.slice(-4);
}

/**
 * Formatea una cuenta bancaria/tarjeta al formato de API.
 * Aplica enmascaramiento por defecto.
 *
 * @param record - fila de la DB
 * @param reveal - si true, incluye números completos (requiere permiso viewSensitive)
 */
function formatBankAccount(record: any, reveal: boolean = false) {
  const isCard = record.type === 'credit_card';

  return {
    id: record.id,
    tenantId: record.tenant_id,
    clientId: record.client_id,
    type: record.type,
    accountHolder: record.account_holder,
    holderIdNumber: record.holder_id_number,
    bankName: record.bank_name,
    // Números enmascarados por defecto
    routingNumber: reveal ? record.routing_number : record.routing_number ? `****${last4(record.routing_number)}` : null,
    accountNumber: reveal ? record.account_number : `****${last4(record.account_number)}`,
    accountType: record.account_type,
    paymentMethod: record.payment_method,
    // Solo si es tarjeta
    cardBrand: record.card_brand,
    cardNumberMasked: isCard ? `•••• •••• •••• ${last4(record.account_number)}` : null,
    cardExpDate: record.card_exp_date,
    cardCvv: reveal && isCard ? record.card_cvv : null,   // CVV NUNCA se expone sin reveal
    cardType: record.card_type,
    isDefault: record.is_default,
    verified: record.verified,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

// ─── List ───

export async function listBankAccounts(input: ListBankingInput) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 50));
  const skip = (page - 1) * pageSize;

  const where: any = {
    tenant_id: input.tenantId,   // ⬅️ AISLAMIENTO CRÍTICO
  };

  if (input.clientId) where.client_id = input.clientId;
  if (input.type) where.type = input.type;

  const [total, records] = await Promise.all([
    prisma.bank_accounts.count({ where }),
    prisma.bank_accounts.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    data: records.map((r) => formatBankAccount(r, false)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─── Get by ID ───

export async function getBankAccountById(tenantId: string, id: string) {
  const record = await prisma.bank_accounts.findFirst({
    where: {
      id,
      tenant_id: tenantId,   // ⬅️ AISLAMIENTO CRÍTICO
    },
  });

  return record ? formatBankAccount(record, false) : null;
}

// ─── Reveal (con permiso viewSensitive) ───

export async function revealBankAccount(tenantId: string, id: string) {
  const record = await prisma.bank_accounts.findFirst({
    where: {
      id,
      tenant_id: tenantId,
    },
  });

  if (!record) return null;

  return formatBankAccount(record, true);   // reveal = true
}

// ─── Create ───

export async function createBankAccount(input: CreateBankingInput) {
  const id = `bank-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Si es el método por defecto, quitarle el default a los demás del mismo cliente
  if (input.isDefault) {
    await prisma.bank_accounts.updateMany({
      where: {
        tenant_id: input.tenantId,
        client_id: input.clientId,
        is_default: true,
      },
      data: { is_default: false },
    });
  }

  const record = await prisma.bank_accounts.create({
    data: {
      id,
      tenant_id: input.tenantId,
      client_id: input.clientId,
      type: input.type,
      account_holder: input.accountHolder,
      holder_id_number: input.holderIdNumber ?? null,
      bank_name: input.bankName,
      routing_number: input.routingNumber ?? 'N/A',
      account_number: input.accountNumber,
      account_type: input.accountType ?? null,
      payment_method: input.paymentMethod ?? null,
      card_brand: input.cardBrand ?? null,
      card_number_masked: last4(input.accountNumber),
      card_exp_date: input.cardExpDate ?? null,
      card_cvv: input.cardCvv ?? null,
      card_type: input.cardType ?? null,
      is_default: input.isDefault ?? false,
      verified: false,
    },
  });

  return formatBankAccount(record, false);
}

// ─── Update ───

export async function updateBankAccount(input: UpdateBankingInput) {
  const existing = await prisma.bank_accounts.findFirst({
    where: {
      id: input.id,
      tenant_id: input.tenantId,
    },
  });

  if (!existing) return null;

  const data: any = {};

  if (input.accountHolder !== undefined) data.account_holder = input.accountHolder;
  if (input.holderIdNumber !== undefined) data.holder_id_number = input.holderIdNumber;
  if (input.bankName !== undefined) data.bank_name = input.bankName;
  if (input.routingNumber !== undefined) data.routing_number = input.routingNumber;
  if (input.accountNumber !== undefined) {
    data.account_number = input.accountNumber;
    data.card_number_masked = last4(input.accountNumber);
  }
  if (input.accountType !== undefined) data.account_type = input.accountType;
  if (input.paymentMethod !== undefined) data.payment_method = input.paymentMethod;
  if (input.cardBrand !== undefined) data.card_brand = input.cardBrand;
  if (input.cardExpDate !== undefined) data.card_exp_date = input.cardExpDate;
  if (input.cardCvv !== undefined) data.card_cvv = input.cardCvv;
  if (input.cardType !== undefined) data.card_type = input.cardType;
  if (input.verified !== undefined) data.verified = input.verified;

  // Si se marca como default, quitar el default a los demás
  if (input.isDefault === true) {
    await prisma.bank_accounts.updateMany({
      where: {
        tenant_id: input.tenantId,
        client_id: existing.client_id,
        is_default: true,
        NOT: { id: input.id },
      },
      data: { is_default: false },
    });
    data.is_default = true;
  } else if (input.isDefault === false) {
    data.is_default = false;
  }

  const updated = await prisma.bank_accounts.update({
    where: { id: input.id },
    data,
  });

  return formatBankAccount(updated, false);
}

// ─── Set Default ───

export async function setDefaultPaymentMethod(
  tenantId: string,
  clientId: string,
  paymentMethodId: string
) {
  // Verificar que el método pertenezca al cliente y tenant
  const target = await prisma.bank_accounts.findFirst({
    where: {
      id: paymentMethodId,
      tenant_id: tenantId,
      client_id: clientId,
    },
  });

  if (!target) return null;

  // Quitar default a todos los del cliente
  await prisma.bank_accounts.updateMany({
    where: {
      tenant_id: tenantId,
      client_id: clientId,
      is_default: true,
    },
    data: { is_default: false },
  });

  // Marcar este como default
  const updated = await prisma.bank_accounts.update({
    where: { id: paymentMethodId },
    data: { is_default: true },
  });

  return formatBankAccount(updated, false);
}

// ─── Delete (hard delete aquí, no soft) ───

export async function deleteBankAccount(tenantId: string, id: string): Promise<boolean> {
  const existing = await prisma.bank_accounts.findFirst({
    where: {
      id,
      tenant_id: tenantId,
    },
  });

  if (!existing) return false;

  await prisma.bank_accounts.delete({
    where: { id },
  });

  return true;
}