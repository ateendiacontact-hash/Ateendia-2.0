import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  BarChart3,
  Download,
  Users,
  Send,
  MessageSquare,
  Mail,
  Calendar,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Campaign } from '../../types';
import { DomainService } from '../../domain/domainService';

export const CampaignsModule: React.FC = () => {
  const { campaigns, createCampaign, templates, clients, policies, users, currentTenant } = useTenant();

  const [activeTab, setActiveTab] = useState<'campaigns' | 'reports'>('campaigns');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Campaign Form
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [segmentCategory, setSegmentCategory] = useState('all');

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const targetAudience = segmentCategory === 'all'
      ? clients.length
      : clients.filter((c) => c.category === segmentCategory).length;

    createCampaign({
      name,
      channel,
      templateId,
      status: 'En Ejecución',
      targetSegment: { category: segmentCategory === 'all' ? undefined : segmentCategory },
      totalAudience: targetAudience || 10,
      targetAudienceCount: targetAudience || 10,
      openedCount: Math.round((targetAudience || 10) * 0.72)
    });

    setShowCreateModal(false);
    setName('');
  };

  // Report Metrics
  const agentSales = users
    .filter((u) => u.tenantId === currentTenant.id && u.role === 'agent')
    .map((agent) => {
      const agentClients = clients.filter((c) => c.assignedAgentId === agent.id);
      const agentPolicies = policies.filter((p) => agentClients.some((c) => c.id === p.clientId));
      const totalVolume = agentPolicies.reduce((acc, p) => acc + (p.monthlyPremium || 0), 0);
      return {
        agent,
        clientsCount: agentClients.length,
        policiesCount: agentPolicies.length,
        totalVolume
      };
    });

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>Campañas Masivas & Reportes Analíticos</span>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
              {campaigns.length} campañas
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Envíos masivos por WhatsApp/Email, métricas de apertura y reportes de producción de agentes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'campaigns' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              📢 Campañas
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'reports' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              📊 Reportes
            </button>
          </div>

          {activeTab === 'campaigns' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Campaña</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: CAMPAIGNS LIST */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm text-slate-900">Lanzar Nueva Campaña Masiva</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCampaign} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Campaña</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Renovaciones ACA Marzo 2025"
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Canal</label>
                      <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold"
                      >
                        <option value="whatsapp">WhatsApp WA1</option>
                        <option value="email">Email SMTP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Segmento de Clientes</label>
                      <select
                        value={segmentCategory}
                        onChange={(e) => setSegmentCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold"
                      >
                        <option value="all">Todos los clientes ({clients.length})</option>
                        <option value="Seguro de Salud / ACA">Seguro de Salud / ACA</option>
                        <option value="Seguro de Vida">Seguro de Vida</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Plantilla a Utilizar</label>
                    <select
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-purple-700"
                    >
                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} ({tpl.channel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md"
                    >
                      Lanzar Campaña
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Campaigns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-purple-300 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold uppercase">
                      {camp.channel}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">{camp.name}</h3>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{camp.createdAt}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      camp.status === 'Completada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {camp.status}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400">Audiencia</div>
                    <div className="font-extrabold text-xs text-slate-800">{camp.targetAudienceCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400">Enviados</div>
                    <div className="font-extrabold text-xs text-purple-700">{camp.sentCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400">Abiertos</div>
                    <div className="font-extrabold text-xs text-emerald-600">{camp.openedCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400">Respuestas</div>
                    <div className="font-extrabold text-xs text-indigo-700">{camp.repliedCount}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                    <span>Tasa de Interacción</span>
                    <span className="font-bold text-purple-700">
                      {Math.round(((camp.openedCount || 0) / (camp.sentCount || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{
                        width: `${Math.min(
                          Math.round(((camp.openedCount || 0) / (camp.sentCount || 1)) * 100),
                          100
                        )}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: REPORTS & LEADERBOARDS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Agent Sales Leaderboard */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Producción por Asesor / Agente</h2>
                <p className="text-xs text-slate-400">Métricas de conversión de prospectos y primas emitidas</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Asesor / Agente</th>
                    <th className="p-3">Clientes Asignados</th>
                    <th className="p-3">Pólizas Emitidas</th>
                    <th className="p-3">Volumen Total de Primas</th>
                    <th className="p-3">Rendimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agentSales.map(({ agent, clientsCount, policiesCount, totalVolume }) => (
                    <tr key={agent.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <div>{agent.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Ext. #{agent.extension}</div>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{clientsCount} clientes</td>
                      <td className="p-3 font-bold text-purple-700">{policiesCount} pólizas</td>
                      <td className="p-3 font-mono font-extrabold text-emerald-700">
                        {DomainService.formatCurrency(totalVolume)}/mes
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Excelente (100%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
