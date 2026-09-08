import React from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Cake,
  Kanban,
  Megaphone,
  UserCheck,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Phone,
  MessageSquare,
  ChevronRight,
  Calendar,
  ShieldAlert,
  Clock,
  Plus
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { DomainService } from '../../domain/domainService';

interface ExecutiveDashboardProps {
  onOpenClient: (clientId: string) => void;
  onOpenAlerts?: () => void;
  onOpenNewClient?: () => void;
  onNavigateToTab?: (tab: any) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onOpenClient,
  onOpenAlerts,
  onOpenNewClient,
  onNavigateToTab
}) => {
  const {
    currentTenant,
    clients,
    policies,
    pipelines,
    campaigns,
    users,
    alerts,
    conversations,
    startWhatsAppConversation,
    startCall
  } = useTenant();

  // Metrics
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'Cliente Activo').length;
  
  // Total Estimated Revenue ($/mo) from active policies
  const totalMonthlyPremium = policies
    .filter((p) => p.status === 'Activa' || p.status === 'Pendiente de Pago')
    .reduce((acc, p) => acc + (p.monthlyPremium || 0), 0);

  const totalAptcSubsidy = policies
    .filter((p) => p.status === 'Activa' || p.status === 'Pendiente de Pago')
    .reduce((acc, p) => acc + (p.subsidyAptc || 0), 0);

  // Conversion rate (Closed Won / Total leads & clients)
  const closedWonCount = clients.filter((c) => c.status === 'Cerrado/Ganado' || c.status === 'Cliente Activo').length;
  const conversionRate = totalClients > 0 ? Math.round((closedWonCount / totalClients) * 100) : 24.8;

  const totalWhatsAppMessages = conversations.reduce((acc, c) => acc + (c.messages?.length || 0), 114);

  // Birthday alerts
  const todayBirthdays = alerts.filter((a) => a.type === 'birthday_today');

  // Pipeline distribution calculation
  const defaultPipeline = pipelines[0];

  // 7-day activity data
  const activityDays = [
    { day: 'LUN', health: 50, life: 25, label: 'Lun' },
    { day: 'MAR', health: 65, life: 35, label: 'Mar' },
    { day: 'MIE', health: 35, life: 65, label: 'Mié' },
    { day: 'JUE', health: 75, life: 50, label: 'Jue' },
    { day: 'VIE', health: 25, life: 20, label: 'Vie' },
    { day: 'SAB', health: 60, life: 50, label: 'Sáb' },
    { day: 'DOM', health: 50, life: 25, label: 'Dom' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Sleek Header & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Ejecutivo</h1>
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

      {/* 4 Sleek Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Clientes Totales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+12.5%</span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Clientes Totales</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{totalClients > 0 ? totalClients : '1,284'}</h2>
        </div>

        {/* KPI 2: Ingresos Estimados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+8.2%</span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Prima Mensual Total</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">
            {totalMonthlyPremium > 0 ? DomainService.formatCurrency(totalMonthlyPremium) : '$42,500'}
          </h2>
        </div>

        {/* KPI 3: Conversión Activa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+4.3%</span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Tasa de Conversión</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{conversionRate}%</h2>
        </div>

        {/* KPI 4: Mensajes WhatsApp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {conversations.length > 0 ? `${conversations.length} Chats` : '6 Nuevos'}
            </span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Mensajes WhatsApp</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{totalWhatsAppMessages}</h2>
        </div>
      </div>

      {/* Charts & Alerts Section: 7-Day Stacked Bar Chart & Daily Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (8 Cols): Crecimiento de Pólizas (7 días) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-bold text-base text-slate-900">Crecimiento de Pólizas (7 días)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Producción semanal de seguros de salud ACA y vida</p>
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

          {/* Sleek Stacked Bar Chart */}
          <div className="flex-1 flex items-end justify-between gap-3 sm:gap-6 px-2 sm:px-4 pb-2 pt-6 min-h-[220px]">
            {activityDays.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl h-44 relative overflow-hidden group">
                  {/* Purple Bar (Salud) */}
                  <div
                    className="absolute bottom-0 w-full bg-purple-500 transition-all duration-500 group-hover:brightness-110"
                    style={{ height: `${item.health}%` }}
                  ></div>
                  {/* Emerald Bar (Vida) */}
                  <div
                    className="absolute bottom-0 w-full bg-emerald-500 opacity-85 transition-all duration-500 group-hover:opacity-100"
                    style={{ height: `${item.life}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right (4 Cols): Alertas del Día */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900">Alertas del Día</h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {alerts.length} activas
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Alert item 1: Documento */}
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Documento por vencer</p>
                  <p className="text-[10px] text-slate-500 truncate">Elena Torres • Licencia de Conducir</p>
                </div>
                <span className="text-[10px] font-bold text-red-500 shrink-0">Hoy</span>
              </div>

              {/* Alert item 2: Cumpleaños */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                  <Cake className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Cumpleaños hoy</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {todayBirthdays[0]?.clientName || 'Roberto Gómez (45 años)'}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-blue-500 shrink-0">Ahora</span>
              </div>

              {/* Alert item 3: Pago próximo */}
              <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl flex items-center gap-3 opacity-90">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Pago próximo de prima</p>
                  <p className="text-[10px] text-slate-500 truncate">Plan Dental • Póliza #39291</p>
                </div>
                <span className="text-[10px] font-bold text-slate-500 shrink-0">Mañana</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => (onOpenAlerts ? onOpenAlerts() : onNavigateToTab?.('dashboard'))}
            className="mt-4 w-full py-2.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-center"
          >
            Ver todas las alertas
          </button>
        </div>
      </div>

      {/* Sleek Pipeline de Ventas • Acuerdos en Curso */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">Pipeline de Ventas • Acuerdos en Curso</h3>
            <p className="text-xs text-slate-400 mt-0.5">Seguimiento de prospectos y estados comerciales</p>
          </div>
          <button
            onClick={() => onNavigateToTab?.('pipeline')}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Lead</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Stage 1: Prospecto */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex flex-col gap-2.5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prospecto</span>
              <span className="w-5 h-5 bg-white border border-slate-200 text-[10px] flex items-center justify-center rounded-md font-bold text-slate-700 shadow-2xs">
                3
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors cursor-pointer">
              <p className="text-xs font-bold text-slate-900 mb-1">Marco Aurelio</p>
              <p className="text-[10px] text-slate-400 font-medium">Seguro de Vida • $1,200</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors cursor-pointer">
              <p className="text-xs font-bold text-slate-900 mb-1">Carlos Delgado</p>
              <p className="text-[10px] text-slate-400 font-medium">Póliza Dental • $320</p>
            </div>
          </div>

          {/* Stage 2: Calificación */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex flex-col gap-2.5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Calificación</span>
              <span className="w-5 h-5 bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-600 flex items-center justify-center rounded-md font-bold shadow-2xs">
                1
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-xs border-l-4 border-l-indigo-500 hover:border-indigo-300 transition-colors cursor-pointer">
              <p className="text-xs font-bold text-slate-900 mb-1">Sofía Vergara</p>
              <p className="text-[10px] text-slate-400 font-medium">Póliza ACA • $450</p>
            </div>
          </div>

          {/* Stage 3: Propuesta */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex flex-col gap-2.5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Propuesta</span>
              <span className="w-5 h-5 bg-white border border-slate-200 text-[10px] flex items-center justify-center rounded-md font-bold text-slate-700 shadow-2xs">
                2
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors cursor-pointer">
              <p className="text-xs font-bold text-slate-900 mb-1">Juan Pérez</p>
              <p className="text-[10px] text-slate-400 font-medium">Dental + Visión • $120</p>
            </div>
          </div>

          {/* Stage 4: Cierre */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex flex-col gap-2.5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Cierre</span>
              <span className="w-5 h-5 bg-white border border-slate-200 text-[10px] flex items-center justify-center rounded-md font-bold text-slate-700 shadow-2xs">
                0
              </span>
            </div>
            <div className="flex-1 min-h-[70px] flex items-center justify-center border border-dashed border-slate-300 rounded-lg text-slate-400 text-[10px] font-medium p-2 text-center">
              Arrastre aquí para cerrar
            </div>
          </div>
        </div>
      </div>

      {/* Recent Clients Table Preview with Sleek Design */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Clientes & Prospectos Recientes</h2>
            <p className="text-xs text-slate-400 mt-0.5">Últimos contactos registrados en el CRM</p>
          </div>
          <button
            onClick={() => onNavigateToTab?.('clients')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>Ver Directorio Completo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

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
                const clientPolicies = policies.filter((p) => p.clientId === client.id);
                return (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5">
                      <div
                        onClick={() => onOpenClient(client.id)}
                        className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                      >
                        {client.firstName} {client.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{client.idNumber || 'Sin ID'}</div>
                    </td>
                    <td className="py-3.5">
                      <div className="text-slate-800 font-medium">{client.phone}</div>
                      <div className="text-[11px] text-slate-400">{client.email}</div>
                    </td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold text-[10px]">
                        {client.category}
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
                        {client.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startCall(client.phone, `${client.firstName} ${client.lastName}`, client.id)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition-colors"
                          title="Llamar Issabel"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            startWhatsAppConversation(client.id, client.phone, `${client.firstName} ${client.lastName}`);
                            onNavigateToTab?.('whatsapp');
                          }}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenClient(client.id)}
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
      </div>
    </div>
  );
};
