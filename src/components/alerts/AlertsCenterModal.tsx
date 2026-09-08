import React, { useState } from 'react';
import {
  X,
  Bell,
  Cake,
  FileWarning,
  CreditCard,
  Phone,
  MessageSquare,
  Mail,
  CheckCircle2,
  Filter,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { SystemAlert } from '../../types';

interface AlertsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenClient: (clientId: string) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const AlertsCenterModal: React.FC<AlertsCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenClient,
  onNavigateToTab
}) => {
  const { alerts, dismissAlert, startWhatsAppConversation, startCall, currentTenant } = useTenant();
  const [activeFilter, setActiveFilter] = useState<'all' | 'birthday' | 'document' | 'payment'>('all');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === 'birthday') return alert.type.includes('birthday');
    if (activeFilter === 'document') return alert.type === 'expiring_document';
    if (activeFilter === 'payment') return alert.type === 'upcoming_payment';
    return true;
  });

  const getAlertIcon = (type: SystemAlert['type']) => {
    if (type.includes('birthday')) return <Cake className="w-5 h-5 text-amber-500" />;
    if (type === 'expiring_document') return <FileWarning className="w-5 h-5 text-rose-500" />;
    return <CreditCard className="w-5 h-5 text-purple-600" />;
  };

  const getBadgeColor = (type: SystemAlert['type']) => {
    if (type === 'birthday_today') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (type === 'birthday_week') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (type === 'expiring_document') return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const getTypeText = (type: SystemAlert['type']) => {
    switch (type) {
      case 'birthday_today':
        return '¡Cumpleaños Hoy!';
      case 'birthday_week':
        return 'Cumpleaños Esta Semana';
      case 'expiring_document':
        return 'Documento por Vencer / Vencido';
      case 'upcoming_payment':
        return 'Fecha de Pago Próxima';
      default:
        return 'Alerta del Sistema';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Centro de Alertas Automáticas</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-xs font-bold">
                  {alerts.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Cumpleaños del día y semana, documentos por vencerse y fechas de cobro de pólizas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2 bg-white">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({alerts.length})
          </button>
          <button
            onClick={() => setActiveFilter('birthday')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeFilter === 'birthday'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Cake className="w-3.5 h-3.5" />
            <span>Cumpleaños ({alerts.filter((a) => a.type.includes('birthday')).length})</span>
          </button>
          <button
            onClick={() => setActiveFilter('document')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeFilter === 'document'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileWarning className="w-3.5 h-3.5" />
            <span>Documentos ({alerts.filter((a) => a.type === 'expiring_document').length})</span>
          </button>
          <button
            onClick={() => setActiveFilter('payment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeFilter === 'payment'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pagos Próximos ({alerts.filter((a) => a.type === 'upcoming_payment').length})</span>
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
              <div className="text-sm font-bold text-slate-700">¡Bandeja al día!</div>
              <p className="text-xs max-w-sm mx-auto">
                No hay alertas pendientes en esta categoría. El sistema te notificará automáticamente.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white border border-slate-200 hover:border-purple-300 rounded-xl p-4 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${getBadgeColor(alert.type)}`}>
                        {getTypeText(alert.type)}
                      </span>
                      <span
                        onClick={() => {
                          onOpenClient(alert.clientId);
                          onClose();
                        }}
                        className="text-xs font-bold text-slate-900 hover:text-purple-600 cursor-pointer underline-offset-2 hover:underline truncate"
                      >
                        {alert.clientName}
                      </span>
                      {alert.dueDate && (
                        <span className="text-[11px] text-slate-400 font-mono">({alert.dueDate})</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{alert.description}</p>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">{alert.clientPhone}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => {
                      if (alert.clientPhone) {
                        const defaultGreeting = alert.type.includes('birthday')
                          ? `¡Hola ${alert.clientName}! 🎂 De parte de todo el equipo de ${currentTenant.name}, queremos desearte un muy feliz cumpleaños.`
                          : `Hola ${alert.clientName}, te contactamos de ${currentTenant.name} referente a tu póliza.`;
                        startWhatsAppConversation(alert.clientId, alert.clientPhone, alert.clientName, defaultGreeting);
                        onClose();
                        onNavigateToTab?.('whatsapp');
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => {
                      if (alert.clientPhone) {
                        startCall(alert.clientPhone, alert.clientName, alert.clientId);
                      }
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Issabel</span>
                  </button>

                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Descartar Alerta"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Actualización automática en segundo plano</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
