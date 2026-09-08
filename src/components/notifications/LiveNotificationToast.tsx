import React, { useEffect } from 'react';
import { MessageSquare, FileCheck, AlertTriangle, X, ExternalLink, Volume2, Globe, ArrowRight } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

interface LiveNotificationToastProps {
  onNavigateToTab?: (tab: string) => void;
  onOpenClient?: (clientId: string) => void;
}

export const LiveNotificationToast: React.FC<LiveNotificationToastProps> = ({
  onNavigateToTab,
  onOpenClient
}) => {
  const {
    latestLiveNotification,
    clearLatestLiveNotification,
    setActiveConversationId,
    markAppNotificationRead
  } = useTenant();

  useEffect(() => {
    if (latestLiveNotification) {
      const timer = setTimeout(() => {
        clearLatestLiveNotification();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [latestLiveNotification, clearLatestLiveNotification]);

  if (!latestLiveNotification) return null;

  const isWebLead = latestLiveNotification.type === 'web_lead';
  const isWhatsApp = latestLiveNotification.type === 'whatsapp_message';
  const isPolicy = latestLiveNotification.type === 'policy_status_change' || latestLiveNotification.type === 'policy_created';

  const handleClick = () => {
    markAppNotificationRead(latestLiveNotification.id);

    if (isWebLead) {
      if (latestLiveNotification.metadata?.clientId && onOpenClient) {
        onOpenClient(latestLiveNotification.metadata.clientId);
      } else if (onNavigateToTab) {
        onNavigateToTab('clients');
      }
    } else if (isWhatsApp && latestLiveNotification.metadata?.conversationId) {
      if (setActiveConversationId) {
        setActiveConversationId(latestLiveNotification.metadata.conversationId);
      }
      if (onNavigateToTab) {
        onNavigateToTab('whatsapp');
      }
    } else if (isPolicy) {
      if (latestLiveNotification.metadata?.clientId && onOpenClient) {
        onOpenClient(latestLiveNotification.metadata.clientId);
      } else if (onNavigateToTab) {
        onNavigateToTab('policies');
      }
    } else if (latestLiveNotification.metadata?.clientId && onOpenClient) {
      onOpenClient(latestLiveNotification.metadata.clientId);
    }
    clearLatestLiveNotification();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm ${
            isWebLead ? 'bg-blue-600' : isWhatsApp ? 'bg-emerald-600' : isPolicy ? 'bg-indigo-600' : 'bg-amber-600'
          }`}
        >
          {isWebLead ? (
            <Globe className="w-5 h-5" />
          ) : isWhatsApp ? (
            <MessageSquare className="w-5 h-5" />
          ) : isPolicy ? (
            <FileCheck className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0" onClick={handleClick} role="button" tabIndex={0}>
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="text-xs font-bold text-slate-900 truncate">
              {latestLiveNotification.title}
            </div>
            <span className="flex items-center gap-0.5 text-[9px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              <Volume2 className="w-2.5 h-2.5" /> Ahora
            </span>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {latestLiveNotification.message}
          </p>

          <div className="mt-2 flex items-center justify-between text-[11px] text-indigo-600 font-bold">
            <span className="hover:underline flex items-center gap-1">
              {isWebLead ? 'Abrir Ficha de Prospecto' : isWhatsApp ? 'Abrir en WhatsApp' : 'Abrir en Pólizas'}{' '}
              <ArrowRight className="w-3 h-3" />
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Clic para interactuar</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            clearLatestLiveNotification();
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

