/**
 * @file SaasSubscriptionsView.tsx
 * @description Vista de gestión de suscripciones SaaS para el Super Admin.
 * 
 * Consume:
 *   - subscriptionService.listAllSubscriptions()   (GET /api/saas/subscriptions)
 *   - subscriptionService.updateSubscriptionStatus() (PATCH /api/saas/subscriptions/:id/status)
 *   - reviewService.listPendingRegistrations()     (GET /api/saas/registrations?status=pending)
 *   - reviewService.approveRegistration()          (POST /api/saas/registrations/:id/approve)
 *   - reviewService.rejectRegistration()           (POST /api/saas/registrations/:id/reject)
 * 
 * Regla 28: No hay datos mock. Todo viene de la DB.
 * Regla 29: Type guards aplicados en los servicios.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Ban,
  RefreshCw,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Clock
} from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { reviewService } from '../../services/reviewService';
import { PaymentReceiptViewerModal } from './PaymentReceiptViewerModal';
import { mapRegistrationToReceipt } from '../../adapters/registrationToReceipt';
import type { SubscriptionDTO, SaasRegistrationRequest, SaasPaymentReceipt } from '../../types';

// ────────────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────────────

export const SaasSubscriptionsView: React.FC = () => {
  // Estado de datos
  const [subscriptions, setSubscriptions] = useState<SubscriptionDTO[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<SaasRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del Modal de Comprobantes
  const [selectedReceipt, setSelectedReceipt] = useState<SaasPaymentReceipt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado de acción (para feedback al usuario)
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // ─── Cargar datos al montar ────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Cargamos ambas cosas en paralelo para mayor velocidad
    const [subsResult, pendingResult] = await Promise.all([
      subscriptionService.listAllSubscriptions(),
      reviewService.listPendingRegistrations()
    ]);

    if (subsResult.success) {
      setSubscriptions(subsResult.data);
    } else {
      setError(subsResult.error);
    }

    if (pendingResult.success) {
      setPendingRegistrations(pendingResult.data);
    } else {
      // No bloqueamos toda la vista si fallan los pendientes, solo mostramos el error en feedback
      setActionFeedback({ type: 'error', message: `Error al cargar pendientes: ${pendingResult.error}` });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Handlers del Modal de Aprobación ──────────────────────────────
  const handleOpenReceipt = (reg: SaasRegistrationRequest) => {
    const receipt = mapRegistrationToReceipt(reg);
    setSelectedReceipt(receipt);
    setIsModalOpen(true);
  };

  const handleApproveReceipt = async (receiptId: string, validFrom: string, validUntil: string) => {
    setActionLoading(receiptId);
    setActionFeedback(null);

    const result = await reviewService.approveRegistration(receiptId, {
      validFrom,
      validUntil,
      receiptId, // Trazabilidad en review_notes
      notes: 'Aprobado desde el Panel de Suscripciones'
    });

    if (result.success) {
      setActionFeedback({ type: 'success', message: 'Comprobante aprobado y empresa habilitada.' });
      await loadData(); // Recargamos toda la data (suscripciones y pendientes)
    } else {
      setActionFeedback({ type: 'error', message: result.error });
    }
    setActionLoading(null);
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const handleRejectReceipt = async (receiptId: string, reason: string) => {
    setActionLoading(receiptId);
    setActionFeedback(null);

    const result = await reviewService.rejectRegistration(receiptId, reason);

    if (result.success) {
      setActionFeedback({ type: 'success', message: 'Comprobante rechazado.' });
      await loadData();
    } else {
      setActionFeedback({ type: 'error', message: result.error });
    }
    setActionLoading(null);
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // ─── Handler: cambiar estado de suscripción (Tabla) ────────────────
  const handleStatusChange = async (
    id: string,
    newStatus: 'active' | 'suspended' | 'cancelled'
  ) => {
    setActionLoading(id);
    setActionFeedback(null);

    const result = await subscriptionService.updateSubscriptionStatus(id, newStatus);

    if (result.success) {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? result.data : s))
      );
      setActionFeedback({
        type: 'success',
        message: `Estado actualizado a '${newStatus}'.`,
      });
    } else {
      setActionFeedback({
        type: 'error',
        message: `No se pudo actualizar: ${result.error}`,
      });
    }

    setActionLoading(null);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // ─── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="mt-4 text-sm font-semibold text-slate-700">
          Cargando panel de suscripciones...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-8 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
        <div>
          <h2 className="text-lg font-black text-rose-700">Error al cargar</h2>
          <p className="text-sm text-slate-700 mt-1">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-600" />
            Suscripciones SaaS
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de pagos, comprobantes y estados de cuenta de las empresas.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refrescar
        </button>
      </div>

      {/* Feedback (Toast) */}
      {actionFeedback && (
        <div
          className={`rounded-xl border p-4 flex items-center gap-3 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p className="text-sm font-semibold">{actionFeedback.message}</p>
        </div>
      )}

      {/* ─── NUEVA SECCIÓN: Comprobantes Pendientes ─────────────────── */}
      {pendingRegistrations.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">
              Comprobantes pendientes de aprobación ({pendingRegistrations.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingRegistrations.map((reg) => (
              <button
                key={reg.id}
                onClick={() => handleOpenReceipt(reg)}
                className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all text-left flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-900 truncate pr-2">{reg.companyName}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
                    ${reg.priceAmount} {reg.currency}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {reg.planName} - {reg.adminName}
                </div>
                <div className="mt-2 text-[11px] font-semibold text-purple-600 flex items-center justify-end gap-1">
                  Revisar comprobante →
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de Suscripciones */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Renovación</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                    No hay suscripciones registradas.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    {/* Empresa */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900">
                        {sub.tenantName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        ID: {sub.tenantId.slice(0, 8)}...
                      </p>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                        {sub.planName}
                      </span>
                    </td>

                    {/* Precio */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        {sub.monthlyPrice.toFixed(2)} {sub.billingCycle === 'yearly' ? '/año' : '/mes'}
                      </div>
                    </td>

                    {/* Renovación */}
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {sub.renewalDate
                          ? new Date(sub.renewalDate).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          sub.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : sub.status === 'suspended'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {sub.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                        {sub.status === 'suspended' && <Ban className="w-3 h-3" />}
                        {sub.status}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actionLoading === sub.id ? (
                          <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                        ) : (
                          <>
                            {sub.status !== 'active' && (
                              <button
                                onClick={() => handleStatusChange(sub.id, 'active')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              >
                                Activar
                              </button>
                            )}
                            {sub.status !== 'suspended' && (
                              <button
                                onClick={() => handleStatusChange(sub.id, 'suspended')}
                                className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 hover:bg-rose-100 transition-colors"
                              >
                                Suspender
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visualización de Comprobantes */}
      <PaymentReceiptViewerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        receipt={selectedReceipt}
        onApprove={handleApproveReceipt}
        onReject={handleRejectReceipt}
      />
    </div>
  );
};

export default SaasSubscriptionsView;