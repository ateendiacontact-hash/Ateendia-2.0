import React, { useMemo } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Cake,
  Bell,
  Phone,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  Clock,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { DomainService } from '../../domain/domainService';

interface ExecutiveDashboardProps {
  onOpenClient: (clientId: string) => void;
  onOpenAlerts?: () => void;
  onOpenNewClient?: () => void;
  onNavigateToTab?: (tab: any) => void;
}

/**
 * Dashboard Ejecutivo del tenant.
 *
 * ─── Filosofía (Regla 28) ───
 * Este componente consume datos 100% reales del `TenantContext`:
 *   - `clients`     → clientes del tenant activo.
 *   - `policies`    → pólizas del tenant activo.
 *   - `conversations` → conversaciones del tenant activo.
 *   - `alerts`      → alertas del tenant activo.
 *   - `pipelines`   → pipelines del tenant activo.
 *
 * PROHIBIDO: usar fallbacks numéricos hardcodeados ("1,284", "$42,500", etc.)
 * cuando el array está vacío. Si no hay datos, se muestra 0 o un estado vacío.
 */
export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onOpenClient,
  onOpenAlerts,
  onOpenNewClient,
  onNavigateToTab,
}) => {
  const tenantContext = useTenant();

  // ─── Datos reales del contexto (siempre arrays) ───
  const currentTenant = tenantContext?.currentTenant || { name: 'Ateendia CRM' };
  const clients = Array.isArray(tenantContext?.clients) ? tenantContext.clients : [];
  const policies = Array.isArray(tenantContext?.policies) ? tenantContext.policies : [];
  const pipelines = Array.isArray(tenantContext?.pipelines) ? tenantContext.pipelines : [];
  const alerts = Array.isArray(tenantContext?.alerts) ? tenantContext.alerts : [];
  const conversations = Array.isArray(tenantContext?.conversations)
    ? tenantContext.conversations
    : [];

  const startWhatsAppConversation = tenantContext?.startWhatsAppConversation || (() => {});
  const startCall = tenantContext?.startCall || (() => {});

  // ─── Métricas REALES calculadas con useMemo ───

  /** Total de clientes del tenant. */
  const totalClients = clients.length;

  /** Clientes con estado "Cliente Activo". */
  const activeClients = useMemo(
    () => clients.filter((c) => c?.status === 'Cliente Activo').length,
    [clients]
  );

  /** Suma de primas mensuales de pólizas activas o pendientes de pago. */
  const totalMonthlyPremium = useMemo(
    () =>
      policies
        .filter((p) => p?.status === 'Activa' || p?.status === 'Pendiente de Pago')
        .reduce((acc, p) => acc + Number(p?.monthlyPremium || 0), 0),
    [policies]
  );

  /** Suma del subsidio APTC de pólizas activas. */
  const totalAptcSubsidy = useMemo(
    () =>
      policies
        .filter((p) => p?.status === 'Activa' || p?.status === 'Pendiente de Pago')
        .reduce((acc, p) => acc + Number(p?.subsidyAptc || 0), 0),
    [policies]
  );

  /**
   * Tasa de conversión (porcentaje).
   * Se calcula como: clientes cerrados/activos ÷ total de clientes × 100.
   * Si no hay clientes, retorna 0 (NO un mock como 24.8).
   */
  const conversionRate = useMemo(() => {
    if (totalClients === 0) return 0;
    const closedWonCount = clients.filter(
      (c) => c?.status === 'Cerrado/Ganado' || c?.status === 'Cliente Activo'
    ).length;
    return Math.round((closedWonCount / totalClients) * 100);
  }, [clients, totalClients]);

  /** Total de mensajes WhatsApp (suma de mensajes de todas las conversaciones). */
  const totalWhatsAppMessages = useMemo(
    () =>
      conversations.reduce(
        (acc, c) => acc + Number(c?.messages?.length || 0),
        0
      ),
    [conversations]
  );

  /** Alertas de cumpleaños hoy. */
  const todayBirthdays = useMemo(
    () => alerts.filter((a) => a?.type === 'birthday_today'),
    [alerts]
  );

  /** Pipeline por defecto (el primero). */
  const defaultPipeline = pipelines[0] || null;

  // ─── Formateo de moneda ───
  const formatCurrency = (value: number): string => {
    try {
      return DomainService.formatCurrency(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Barra de título y cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard Ejecutivo
            </h1>
            <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
              {currentTenant.name}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Resumen operativo en tiempo real: clientes, primas de seguros, WhatsApp y pipeline comercial.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenNewClient && (
            <button
              onClick={onOpenNewClient}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          )}
          {onOpenAlerts && (
            <button
              onClick={onOpenAlerts}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Bell className="w-4 h-4 text-indigo-600" />
              <span>Alertas ({alerts.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas Primarias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Clientes Totales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            {totalClients > 0 && (
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                {activeClients} activos
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            Clientes Totales
          </p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{totalClients}</h2>
        </div>

        {/* KPI 2: Prima Mensual Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            {totalMonthlyPremium > 0 && (
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                Activa
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            Prima Mensual Total
          </p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalMonthlyPremium)}
          </h2>
        </div>

        {/* KPI 3: Tasa de Conversión */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            {totalClients > 0 && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {activeClients} activos
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            Tasa de Conversión
          </p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{conversionRate}%</h2>
        </div>

        {/* KPI 4: Mensajes WhatsApp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            {conversations.length > 0 && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {conversations.length} chats
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            Mensajes WhatsApp
          </p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{totalWhatsAppMessages}</h2>
        </div>
      </div>

      {/* Gráficos y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico de Crecimiento de Pólizas */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Crecimiento de Pólizas (7 días)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Producción semanal de seguros de salud ACA y vida
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-xs text-slate-500 font-medium">Salud / ACA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-slate-500 font-medium">Vida</span>
              </div>
            </div>
          </div>

          {/* Estado vacío si no hay pólizas */}
          {policies.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <AlertCircle className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Sin actividad en los últimos 7 días
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Cuando se creen pólizas, verás su evolución semanal acá.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex items-end justify-between gap-3 sm:gap-6 px-2 sm:px-4 pb-2 pt-6 min-h-[220px]">
              {/* TODO (Fase 6): Calcular actividad real por día desde `policies[].createdAt`. */}
              <div className="w-full text-center py-12 text-xs text-slate-400">
                Gráfico disponible próximamente (Fase 6 — Analytics).
              </div>
            </div>
          )}
        </div>

        {/* Panel de Alertas del Día */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900">Alertas del Día</h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {alerts.length} activas
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Sin alertas activas</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Todo en orden por ahora.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* TODO (Fase 5): Renderizar alertas reales desde `alerts[]`. */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 text-center">
                  {alerts.length} alerta(s) pendiente(s) de renderizar.
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() =>
              onOpenAlerts ? onOpenAlerts() : onNavigateToTab?.('dashboard')
            }
            className="mt-4 w-full py-2.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-center"
          >
            Ver todas las alertas
          </button>
        </div>
      </div>

      {/* Pipeline de Ventas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Pipeline de Ventas • Acuerdos en Curso
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Seguimiento de prospectos y estados comerciales
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab?.('pipeline')}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Lead</span>
          </button>
        </div>

        {!defaultPipeline ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Sin pipeline configurado
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Configurá un pipeline para ver el seguimiento comercial acá.
            </p>
          </div>
        ) : (
          <div className="text-xs text-slate-500 text-center py-8">
            {/* TODO (Fase 4): Renderizar pipeline real desde `defaultPipeline.stages`. */}
            Pipeline disponible próximamente (Fase 4).
          </div>
        )}
      </div>

      {/* Tabla de Clientes Recientes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Clientes & Prospectos Recientes
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Últimos contactos registrados en el CRM
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab?.('clients')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>Ver Directorio Completo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Users className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Todavía no hay clientes registrados
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Cuando agregues clientes, aparecerán acá.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Teléfono / Email</th>
                  <th className="pb-3">Categoría</th>
                  <th className="pb-3">Pólizas</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.slice(0, 5).map((client) => {
                  const clientPolicies = policies.filter((p) => p?.clientId === client?.id);
                  return (
                    <tr
                      key={client?.id || Math.random()}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5">
                        <div
                          onClick={() => client?.id && onOpenClient(client.id)}
                          className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                        >
                          {client?.firstName} {client?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {client?.idNumber || 'Sin ID'}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="text-slate-800 font-medium">{client?.phone}</div>
                        <div className="text-[11px] text-slate-400">{client?.email}</div>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold text-[10px]">
                          {client?.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="font-semibold text-slate-700">
                          {clientPolicies.length > 0 ? (
                            <span>{clientPolicies.length} póliza(s)</span>
                          ) : (
                            <span className="text-slate-400 font-normal">Sin póliza</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold">
                          {client?.status || 'Activo'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              startCall(
                                client?.phone,
                                `${client?.firstName} ${client?.lastName}`,
                                client?.id
                              )
                            }
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition-colors"
                            title="Llamar Issabel"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              startWhatsAppConversation(
                                client?.id,
                                client?.phone,
                                `${client?.firstName} ${client?.lastName}`
                              );
                              onNavigateToTab?.('whatsapp');
                            }}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => client?.id && onOpenClient(client.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors"
                          >
                            Ficha
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};