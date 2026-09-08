import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  MessageSquare,
  FileCheck,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Shield,
  Volume2,
  Laptop,
  CheckCircle2,
  XCircle,
  X,
  Play,
  Globe,
  Phone,
  UserPlus,
  Send,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { AppNotification } from '../../types';

interface NotificationCenterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenClient?: (clientId: string) => void;
}

export const NotificationCenterPopover: React.FC<NotificationCenterPopoverProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenClient
}) => {
  const {
    appNotifications,
    markAppNotificationRead,
    markAllAppNotificationsRead,
    deleteAppNotification,
    browserNotificationPermission,
    requestBrowserNotificationPermission,
    simulateIncomingWhatsAppMessage,
    simulatePolicyStatusChange,
    simulateWebLeadQuoteRequest,
    startWhatsAppConversation,
    startCall,
    setActiveConversationId,
    currentTenant
  } = useTenant();

  const [activeFilter, setActiveFilter] = useState<'all' | 'leads' | 'whatsapp' | 'policy' | 'unread'>('all');
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const filteredNotifications = appNotifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'leads') return n.type === 'web_lead';
    if (activeFilter === 'whatsapp') return n.type === 'whatsapp_message';
    if (activeFilter === 'policy') return n.type === 'policy_status_change' || n.type === 'policy_created';
    return true;
  });

  const unreadCount = appNotifications.filter((n) => !n.read).length;
  const leadCount = appNotifications.filter((n) => n.type === 'web_lead').length;

  const handleNotificationClick = (notif: AppNotification) => {
    markAppNotificationRead(notif.id);

    if (notif.type === 'web_lead') {
      if (notif.metadata?.clientId && onOpenClient) {
        onOpenClient(notif.metadata.clientId);
      } else if (onNavigateToTab) {
        onNavigateToTab('clients');
      }
      onClose();
    } else if (notif.type === 'whatsapp_message' && notif.metadata?.conversationId) {
      if (setActiveConversationId) {
        setActiveConversationId(notif.metadata.conversationId);
      }
      if (onNavigateToTab) {
        onNavigateToTab('whatsapp');
      }
      onClose();
    } else if (notif.type === 'policy_status_change' || notif.type === 'policy_created') {
      if (notif.metadata?.clientId && onOpenClient) {
        onOpenClient(notif.metadata.clientId);
      } else if (onNavigateToTab) {
        onNavigateToTab('policies');
      }
      onClose();
    } else if (notif.metadata?.clientId && onOpenClient) {
      onOpenClient(notif.metadata.clientId);
      onClose();
    }
  };

  const handleSimulateWhatsApp = (account: 'WA1' | 'WA2') => {
    setIsSimulating(true);
    if (account === 'WA1') {
      simulateIncomingWhatsAppMessage(
        '+1 (786) 450-8912',
        '¡Hola! Necesito renovar mi póliza de salud Ambetter para el próximo mes.',
        'WA1',
        'Mariana Valenzuela'
      );
    } else {
      simulateIncomingWhatsAppMessage(
        '+1 (305) 980-3321',
        'Buenas tardes, le envío el comprobante de pago de la póliza de vida.',
        'WA2',
        'Carlos Mendoza'
      );
    }
    setTimeout(() => setIsSimulating(false), 500);
  };

  const handleSimulatePolicy = () => {
    setIsSimulating(true);
    simulatePolicyStatusChange();
    setTimeout(() => setIsSimulating(false), 500);
  };

  const handleSimulateWebLead = () => {
    setIsSimulating(true);
    if (simulateWebLeadQuoteRequest) {
      simulateWebLeadQuoteRequest();
    }
    setTimeout(() => setIsSimulating(false), 500);
  };

  const handleDirectWhatsApp = (e: React.MouseEvent, notif: AppNotification) => {
    e.stopPropagation();
    markAppNotificationRead(notif.id);
    if (notif.metadata?.clientPhone) {
      const defaultGreeting = notif.type === 'web_lead'
        ? `Hola ${notif.metadata.clientName || ''}, recibimos tu solicitud de cotización para ${notif.metadata.service || 'tu póliza'} en ${currentTenant.name}. ¿En qué momento podemos conversar para presentarte las mejores opciones?`
        : `Hola ${notif.metadata.clientName || ''}, te contactamos de ${currentTenant.name}.`;
      startWhatsAppConversation(notif.metadata.clientId || '', notif.metadata.clientPhone, notif.metadata.clientName || 'Prospecto', defaultGreeting);
      if (onNavigateToTab) {
        onNavigateToTab('whatsapp');
      }
      onClose();
    }
  };

  const handleDirectCall = (e: React.MouseEvent, notif: AppNotification) => {
    e.stopPropagation();
    markAppNotificationRead(notif.id);
    if (notif.metadata?.clientPhone) {
      startCall(notif.metadata.clientPhone, notif.metadata.clientName || 'Prospecto', notif.metadata.clientId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/30 backdrop-blur-2xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Centro de Notificaciones en Vivo
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                      {unreadCount} nuevas
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-slate-500">Alertas en tiempo real • {currentTenant.name}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Native Browser Notification Permission Banner */}
          <div className="mt-3 p-3 rounded-xl border bg-white flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs">
              <Laptop className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800">Notificaciones del Navegador:</span>
                <div className="text-[10px] text-slate-500">
                  {browserNotificationPermission === 'granted' ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Habilitadas y activas
                    </span>
                  ) : browserNotificationPermission === 'denied' ? (
                    <span className="text-red-500 font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Bloqueadas en este navegador
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold">Pendiente de autorización</span>
                  )}
                </div>
              </div>
            </div>

            {browserNotificationPermission !== 'granted' && (
              <button
                onClick={requestBrowserNotificationPermission}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-[11px] font-bold shadow-xs transition-colors shrink-0"
              >
                Permitir
              </button>
            )}
          </div>

          {/* Quick Simulation Bar (For easy testing of live events) */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" /> Pruebas en Vivo (Simulador):
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                <Volume2 className="w-3 h-3" /> Sonido Activo
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={handleSimulateWebLead}
                disabled={isSimulating}
                className="px-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                title="Simula un prospecto solicitando cotización desde la Micro-Landing"
              >
                <Globe className="w-3 h-3" /> +Lead Web
              </button>
              <button
                onClick={() => handleSimulateWhatsApp('WA1')}
                disabled={isSimulating}
                className="px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                title="Simula mensaje entrante en Línea 1"
              >
                <MessageSquare className="w-3 h-3" /> +WA1
              </button>
              <button
                onClick={() => handleSimulateWhatsApp('WA2')}
                disabled={isSimulating}
                className="px-2 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                title="Simula mensaje entrante en Línea 2 QR"
              >
                <MessageSquare className="w-3 h-3" /> +WA2
              </button>
              <button
                onClick={handleSimulatePolicy}
                disabled={isSimulating}
                className="px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                title="Simula cambio de estado de póliza"
              >
                <FileCheck className="w-3 h-3" /> +Póliza
              </button>
            </div>
          </div>

          {/* Filter Pills & Bulk Actions */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-xs sm:max-w-none">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Todas ({appNotifications.length})
              </button>
              <button
                onClick={() => setActiveFilter('leads')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                  activeFilter === 'leads'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Globe className="w-3 h-3" /> Leads Web ({leadCount})
              </button>
              <button
                onClick={() => setActiveFilter('whatsapp')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                WhatsApp
              </button>
              <button
                onClick={() => setActiveFilter('policy')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === 'policy'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Pólizas
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === 'unread'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                No leídas
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAppNotificationsRead}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 ml-2"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Leer todas</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">Sin notificaciones pendientes</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Aquí aparecerán en tiempo real los prospectos de la Micro-Landing web, mensajes de WhatsApp y cambios de pólizas.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isWebLead = notif.type === 'web_lead';
              const isWhatsApp = notif.type === 'whatsapp_message';
              const isPolicy = notif.type === 'policy_status_change' || notif.type === 'policy_created';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer group relative ${
                    notif.read
                      ? 'bg-white border-slate-200 hover:border-indigo-300'
                      : isWebLead
                      ? 'bg-blue-50/60 border-blue-200 shadow-xs'
                      : isWhatsApp
                      ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                      : 'bg-indigo-50/40 border-indigo-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon Column */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                        isWebLead
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isWhatsApp
                          ? 'bg-emerald-100 text-emerald-700'
                          : isPolicy
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isWebLead ? (
                        <Globe className="w-5 h-5" />
                      ) : isWhatsApp ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : isPolicy ? (
                        <FileCheck className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-slate-900 truncate">{notif.title}</span>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{notif.timestamp}</span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Lead Specific Rich Metadata Preview */}
                      {isWebLead && notif.metadata && (
                        <div className="mt-2.5 p-2 rounded-xl bg-white/80 border border-blue-100 text-xs space-y-1.5">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                              👤 {notif.metadata.clientName || 'Prospecto Web'}
                            </span>
                            {notif.metadata.clientPhone && (
                              <span className="font-mono text-slate-500 text-[10px]">
                                📞 {notif.metadata.clientPhone}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {notif.metadata.service && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                                {notif.metadata.service}
                              </span>
                            )}
                            {notif.metadata.state && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                                📍 {notif.metadata.state}
                              </span>
                            )}
                            {notif.metadata.estimatedIncome && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                                💵 ${notif.metadata.estimatedIncome.toLocaleString()}/año
                              </span>
                            )}
                            {notif.metadata.householdSize && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-medium">
                                👥 {notif.metadata.householdSize} miembros
                              </span>
                            )}
                          </div>

                          {notif.metadata.leadNotes && (
                            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              "{notif.metadata.leadNotes}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* General Metadata Badges */}
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        {isWhatsApp && notif.metadata?.account && (
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${
                              notif.metadata.account === 'WA1'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-teal-100 text-teal-700'
                            }`}
                          >
                            Línea {notif.metadata.account}
                          </span>
                        )}

                        {isPolicy && notif.metadata?.newStatus && (
                          <span className="text-[9px] px-2 py-0.5 rounded-md font-bold bg-blue-100 text-blue-700">
                            Estado: {notif.metadata.newStatus}
                          </span>
                        )}

                        {/* Quick Conversion Action Buttons */}
                        <div className="flex items-center gap-1.5 ml-auto">
                          {isWebLead && notif.metadata?.clientPhone && (
                            <>
                              <button
                                onClick={(e) => handleDirectWhatsApp(e, notif)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-2xs"
                                title="Contactar por WhatsApp inmediatamente"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span className="hidden sm:inline">WhatsApp</span>
                              </button>

                              <button
                                onClick={(e) => handleDirectCall(e, notif)}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-2xs"
                                title="Llamar con Issabel PBX"
                              >
                                <Phone className="w-3 h-3" />
                                <span className="hidden sm:inline">Llamar</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notif);
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-2xs"
                          >
                            <span>{isWebLead ? 'Ver Ficha Prospecto' : 'Ver detalle'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAppNotification(notif.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      title="Eliminar notificación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>WebSocket Live Hub Activo</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

