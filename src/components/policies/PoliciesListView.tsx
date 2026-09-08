import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Shield,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Users,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Download
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Policy } from '../../types';

interface PoliciesListViewProps {
  onOpenClient?: (clientId: string) => void;
  onOpenNewPolicy?: (clientId: string) => void;
  onEditPolicy?: (policy: Policy) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const PoliciesListView: React.FC<PoliciesListViewProps> = ({
  onOpenClient,
  onOpenNewPolicy,
  onEditPolicy,
  onNavigateToTab
}) => {
  const { policies, clients, currentTenant } = useTenant();

  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const carriers = Array.from(new Set(policies.map((p) => p.carrier).filter(Boolean)));
  const policyTypes = Array.from(new Set(policies.map((p) => p.type).filter(Boolean)));

  const filteredPolicies = policies.filter((p) => {
    const matchesSearch =
      p.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.planName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCarrier = carrierFilter === 'all' || p.carrier === carrierFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || p.type === typeFilter;

    return matchesSearch && matchesCarrier && matchesStatus && matchesType;
  });

  const totalActive = policies.filter((p) => p.status === 'Activa').length;
  const totalVolume = policies.reduce((acc, p) => acc + (Number(p.monthlyPremium) || 0), 0);
  const totalSubsidies = policies.reduce((acc, p) => acc + (Number(p.subsidyAptc) || 0), 0);

  const statusColors: Record<string, string> = {
    'Activa': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'En Proceso': 'bg-blue-50 text-blue-700 border-blue-200',
    'Pendiente de Pago': 'bg-amber-50 text-amber-700 border-amber-200',
    'Cancelada': 'bg-red-50 text-red-700 border-red-200',
    'Expirada': 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Pólizas & Cartera de Asegurados
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Gestión unificada de coberturas de salud ACA / Obamacare, planes de vida y suplementarios en {currentTenant.name}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {clients.length > 0 && (
              <button
                onClick={() => {
                  if (onOpenNewPolicy) onOpenNewPolicy(clients[0].id);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nueva Póliza
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Pólizas</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{policies.length}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">{totalActive} activas</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Volumen Prima Mensual</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">${totalVolume.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Producción vigente</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Subsidio Total APTC</span>
            <div className="text-2xl font-black text-teal-600 mt-1">${totalSubsidies.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Crédito fiscal federal</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Aseguradoras</span>
            <div className="text-2xl font-black text-slate-800 mt-1">{carriers.length}</div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Carriers contratados</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por póliza, aseguradora, cliente o plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="all">Todas las Aseguradoras</option>
            {carriers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="all">Todos los Estados</option>
            <option value="Activa">Activa</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Pendiente de Pago">Pendiente de Pago</option>
            <option value="Cancelada">Cancelada</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="all">Todos los Ramos</option>
            {policyTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Policies Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Póliza / Nro</th>
                <th className="py-3.5 px-3">Titular / Cliente</th>
                <th className="py-3.5 px-3">Aseguradora (Carrier)</th>
                <th className="py-3.5 px-3">Ramo / Plan</th>
                <th className="py-3.5 px-3">Prima / APTC</th>
                <th className="py-3.5 px-3">Vigencia</th>
                <th className="py-3.5 px-3">Estado</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se encontraron pólizas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((policy) => {
                  const client = clients.find((c) => c.id === policy.clientId);
                  const isExpiringSoon = false; // Could be computed based on expirationDate

                  return (
                    <tr key={policy.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono">#{policy.policyNumber}</div>
                        <div className="text-[10px] text-slate-400">Emisión: {policy.effectiveDate}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => {
                            if (policy.clientId && onOpenClient) onOpenClient(policy.clientId);
                          }}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left"
                        >
                          {policy.clientName || client ? `${client?.firstName} ${client?.lastName}` : 'Cliente'}
                        </button>
                        <div className="text-[10px] text-slate-400">
                          {policy.members?.length || 1} miembro(s) cubierto(s)
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          {policy.carrier}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{policy.type}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {policy.planName || 'Plan Estándar'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-indigo-600">${policy.monthlyPremium}/mes</div>
                        {policy.subsidyAptc ? (
                          <div className="text-[10px] text-teal-600 font-semibold">
                            APTC: ${policy.subsidyAptc}
                          </div>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 font-mono text-[11px]">
                        <div>{policy.effectiveDate}</div>
                        <div className="text-slate-400">hasta {policy.expirationDate}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            statusColors[policy.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {policy.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (policy.clientId && onOpenClient) onOpenClient(policy.clientId);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition-colors"
                          >
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
