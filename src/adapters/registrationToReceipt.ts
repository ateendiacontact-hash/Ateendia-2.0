/**
 * @file registrationToReceipt.ts
 * @description Adaptador para transformar los datos de la DB (SaasRegistrationRequest)
 * al formato que espera el componente visual (SaasPaymentReceipt).
 */

import type { SaasPaymentReceipt } from '../types';

// Usamos 'any' para el parámetro para poder leer tanto camelCase como snake_case
// que pueden venir del backend (Prisma vs DTO).
export function mapRegistrationToReceipt(reg: any): SaasPaymentReceipt {
  // Mapeamos el tipo de registro
  let mappedType: SaasPaymentReceipt['type'] = 'new_registration';
  if (reg.type === 'upgrade' || reg.type === 'plan_upgrade') {
    mappedType = 'plan_upgrade';
  } else if (reg.type === 'renewal') {
    mappedType = 'renewal';
  }

  // Mapeamos el estado
  let mappedStatus: SaasPaymentReceipt['status'] = 'pending';
  if (reg.status === 'approved') mappedStatus = 'approved';
  if (reg.status === 'rejected') mappedStatus = 'rejected';

  // Formateamos las fechas (con fallback seguro por si falta)
  const rawDate = reg.createdAt || reg.created_at || new Date().toISOString();
  const submittedDate = new Date(rawDate);
  const formattedDate = !isNaN(submittedDate.getTime()) 
    ? submittedDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Fecha desconocida';

  // Extraemos el monto asegurando que sea un número
  const rawAmount = reg.priceAmount ?? reg.price_amount ?? 0;
  const amountNumber = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;

  // Extraemos el ID para la referencia y el ID principal
  const mainId = reg.id || '';
  const reference = reg.cryptoTxHash || reg.crypto_tx_hash || (mainId ? mainId.slice(0, 8).toUpperCase() : 'N/A');

  return {
    id: mainId,
    tenantId: reg.createdTenantId || reg.created_tenant_id || '',
    tenantName: reg.companyName || reg.company_name || 'Empresa Desconocida',
    adminEmail: reg.adminEmail || reg.admin_email || 'Sin email',
    adminName: reg.adminName || reg.admin_name || 'Sin nombre',
    adminPhone: reg.adminPhone || reg.admin_phone || undefined,
    planId: reg.planId || reg.plan_id || '',
    planName: reg.planName || reg.plan_name || 'Plan Desconocido',
    
    amount: isNaN(amountNumber) ? 0 : amountNumber,
    currency: reg.currency || 'USD',
    billingCycle: (reg.billingCycle || reg.billing_cycle) === 'yearly' ? 'annual' : 'monthly',
    
    paymentMethod: (reg.paymentMethodKey || reg.payment_method_key) || 'other',
    referenceNumber: reference,
    
    receiptUrl: reg.receiptUrl || reg.receipt_url || '',
    receiptFileName: reg.receiptFilename || reg.receipt_filename || 'comprobante.jpg',
    receiptFileType: 'image/jpeg', 
    receiptFileSize: reg.receiptFileSize || reg.receipt_file_size || 'Desconocido',
    
    notes: reg.reviewNotes || reg.review_notes || reg.rejectionReason || reg.rejection_reason || undefined,
    submittedAt: formattedDate,
    createdAt: rawDate,
    
    status: mappedStatus,
    reviewedAt: reg.reviewedAt || reg.reviewed_at || undefined,
    reviewedBy: reg.reviewedBy || reg.reviewed_by || undefined,
    rejectionReason: reg.rejectionReason || reg.rejection_reason || undefined,
    
    validFrom: reg.reviewedAt || reg.reviewed_at || undefined,
    validUntil: undefined,
    
    type: mappedType,
  };
}