import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  CheckCircle2,
  DollarSign,
  Users,
  FileSpreadsheet,
  Smartphone,
  HardDrive,
  Bot,
  PhoneCall,
  Sparkles,
  Zap,
  Save,
  X,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { SaasPlanFeatureLimit } from '../../types';

export const SaasPlansManagementSection: React.FC = () => {
  const { saasPlans, updateSaasPlans } = useTenant();

  const [plans, setPlans] = useState<SaasPlanFeatureLimit[]>(saasPlans);
  const [editingPlan, setEditingPlan] = useState<SaasPlanFeatureLimit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleOpenNew = () => {
    setEditingPlan({
      id: `plan_${Date.now()}`,
      name: '',
      price: 99,
      annualPrice: 990,
      billingPeriod: '/mes',
      popular: false,
      description: '',
      maxUsers: 10,
      maxClients: 2000,
      maxPolicies: 2000,
      maxWhatsAppLines: 2,
      storageGb: 50,
      features: [
        'Hasta 10 Agentes / Usuarios',
        'Gestión de 2,000 Clientes y Pólizas',
        '2 Líneas de WhatsApp Oficiales',
        '50 GB Almacenamiento Cifrado'
      ],
      enabledModules: {
        aiAssistant: true,
        campaigns: true,
        telephonyPBX: true,
        massImport: true,
        customFields: true,
        webhooks: false,
        advancedAutomations: true
      },
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (plan: SaasPlanFeatureLimit) => {
    setEditingPlan({ ...plan });
    setIsModalOpen(true);
  };

  const handleDelete = (planId: string) => {
    if (plans.length <= 1) {
      alert('Debe existir al menos un plan activo en el sistema.');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este plan del catálogo?')) {
      const updated = plans.filter((p) => p.id !== planId);
      setPlans(updated);
      updateSaasPlans(updated);
    }
  };

  const handleSavePlanForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editingPlan.name.trim()) return;

    let updated: SaasPlanFeatureLimit[];
    const exists = plans.some((p) => p.id === editingPlan.id);
    if (exists) {
      updated = plans.map((p) => (p.id === editingPlan.id ? editingPlan : p));
    } else {
      updated = [...plans, editingPlan];
    }

    setPlans(updated);
    updateSaasPlans(updated);
    setIsModalOpen(false);
    setEditingPlan(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/30">
            <Layers className="w-3.5 h-3.5" /> Catálogo de Planes & Matriz de Limitaciones SaaS
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Gestión y Limitaciones de Planes Comerciales
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Define los precios, cuotas máximas de agentes, clientes, pólizas, líneas de WhatsApp y qué módulos avanzados (PBX, IA, Webhooks) estarán habilitados por nivel de suscripción.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Plan</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Planes y limitaciones actualizados correctamente para todo el ecosistema.</span>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-3xl p-6 border transition-all relative flex flex-col justify-between ${
              plan.popular
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl'
                : 'border-slate-200 shadow-xs hover:shadow-md'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                Más Popular
              </span>
            )}

            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{plan.description}</p>
                </div>
              </div>

              {/* Price */}
              <div className="py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">${plan.price}</span>
                  <span className="text-xs font-bold text-slate-500">USD / mes</span>
                </div>
                {plan.annualPrice && (
                  <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
                    ${plan.annualPrice} USD anual (Ahorras 2 meses)
                  </div>
                )}
              </div>

              {/* Feature Limits Matrix */}
              <div className="space-y-2.5 py-3 border-t border-b border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" /> Agentes / Usuarios:
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {plan.maxUsers >= 999 ? 'Ilimitados' : plan.maxUsers}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Clientes y Leads:
                  </span>
                  <span className="font-extrabold text-slate-900">{plan.maxClients.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" /> Pólizas Activas:
                  </span>
                  <span className="font-extrabold text-slate-900">{plan.maxPolicies.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-600" /> Líneas WhatsApp:
                  </span>
                  <span className="font-extrabold text-slate-900">{plan.maxWhatsAppLines}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-indigo-600" /> Almacenamiento:
                  </span>
                  <span className="font-extrabold text-slate-900">{plan.storageGb} GB</span>
                </div>
              </div>

              {/* Enabled Modules Chips */}
              <div className="pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Módulos Habilitados:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {plan.enabledModules.aiAssistant && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100 flex items-center gap-1">
                      <Bot className="w-3 h-3" /> IA Gemini
                    </span>
                  )}
                  {plan.enabledModules.telephonyPBX && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 flex items-center gap-1">
                      <PhoneCall className="w-3 h-3" /> PBX Issabel
                    </span>
                  )}
                  {plan.enabledModules.campaigns && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                      Campañas Masivas
                    </span>
                  )}
                  {plan.enabledModules.webhooks && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
                      Webhooks n8n
                    </span>
                  )}
                  {plan.enabledModules.advancedAutomations && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                      Automatizaciones
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleDelete(plan.id)}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                title="Eliminar Plan"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleEdit(plan)}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Plan & Límites</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {isModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingPlan.name ? `Editar Plan: ${editingPlan.name}` : 'Crear Nuevo Plan Comercial'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlanForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Plan *</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    placeholder="Ej: Pro Business 2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Precio Mensual ($ USD) *</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Precio Anual ($ USD)</label>
                  <input
                    type="number"
                    value={editingPlan.annualPrice || 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, annualPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descripción Comercial</label>
                  <input
                    type="text"
                    value={editingPlan.description}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    placeholder="Breve resumen de para quién es ideal este plan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                {/* Quotas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Máximo de Usuarios / Agentes</label>
                  <input
                    type="number"
                    value={editingPlan.maxUsers}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxUsers: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Máximo de Clientes & Leads</label>
                  <input
                    type="number"
                    value={editingPlan.maxClients}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxClients: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Máximo de Pólizas</label>
                  <input
                    type="number"
                    value={editingPlan.maxPolicies}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxPolicies: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Líneas de WhatsApp Oficiales</label>
                  <input
                    type="number"
                    value={editingPlan.maxWhatsAppLines}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxWhatsAppLines: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Almacenamiento (GB)</label>
                  <input
                    type="number"
                    value={editingPlan.storageGb}
                    onChange={(e) => setEditingPlan({ ...editingPlan, storageGb: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={editingPlan.popular}
                      onChange={(e) => setEditingPlan({ ...editingPlan, popular: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded-sm"
                    />
                    <span>Destacar como "Más Popular"</span>
                  </label>
                </div>
              </div>

              {/* Module Toggles */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Módulos Habilitados en este Plan:</span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.enabledModules.aiAssistant}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          enabledModules: { ...editingPlan.enabledModules, aiAssistant: e.target.checked }
                        })
                      }
                      className="w-4 h-4 text-indigo-600 rounded-sm"
                    />
                    <span>IA Gemini & Vectores</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.enabledModules.telephonyPBX}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          enabledModules: { ...editingPlan.enabledModules, telephonyPBX: e.target.checked }
                        })
                      }
                      className="w-4 h-4 text-indigo-600 rounded-sm"
                    />
                    <span>Telefonía PBX Issabel</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.enabledModules.campaigns}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          enabledModules: { ...editingPlan.enabledModules, campaigns: e.target.checked }
                        })
                      }
                      className="w-4 h-4 text-indigo-600 rounded-sm"
                    />
                    <span>Campañas Masivas</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.enabledModules.webhooks}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          enabledModules: { ...editingPlan.enabledModules, webhooks: e.target.checked }
                        })
                      }
                      className="w-4 h-4 text-indigo-600 rounded-sm"
                    />
                    <span>Webhooks & n8n</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
