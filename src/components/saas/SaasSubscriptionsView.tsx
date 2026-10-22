/**
 * @file SaasSubscriptionsView.tsx
 * @description Vista de gestión de suscripciones SaaS para el Super Admin.
 *
 * Consume:
 *   - subscriptionService.listAllSubscriptions()   (GET /api/saas/subscriptions)
 *   - subscriptionService.updateSubscriptionStatus() (PATCH /api/saas/subscriptions/:id/status)
 *
 * Regla 28: No hay datos mock. Todo viene de la DB.
 * Regla 29: Type guards aplicados en subscriptionService.
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
} from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import type { SubscriptionDTO } from '../../types';

// ────────────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────────────

export const SaasSubscriptionsView: React.FC = () => {
  // Estado de datos
  const [subscriptions, setSubscriptions] = useState<SubscriptionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado de acción (para feedback al usuario)
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // ─── Cargar suscripciones al montar ────────────────────────────────
      const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await subscriptionService.listAllSubscriptions();

    if (result.success) {
      setSubscriptions(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // ─── Handler: cambiar estado de suscripción ────────────────────────
  const handleStatusChange = async (
    id: string,
    newStatus: 'active' | 'suspended' | 'cancelled'
  ) => {
    setActionLoading(id);
    setActionFeedback(null);

            const result = await subscriptionService.updateSubscriptionStatus(id, newStatus);

    if (result.success) {
      // Actualizar el estado local para no recargar toda la lista.
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

    // Limpiar el feedback después de 4 segundos.
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // ─── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="mt-4 text-sm font-semibold text-slate-700">
          Cargando suscripciones...
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
            onClick={loadSubscriptions}
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
            Gestión de pagos y estados de cuenta de las empresas.
          </p>
        </div>
        <button
          onClick={loadSubscriptions}
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

      {/* Tabla */}
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
    </div>
  );
};

export default SaasSubscriptionsView;