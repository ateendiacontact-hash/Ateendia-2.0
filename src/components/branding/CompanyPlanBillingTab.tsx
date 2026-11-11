import React from 'react';
import {
  CreditCard,
  Users,
  FileSpreadsheet,
  Smartphone,
  ShieldCheck,
  Calendar,
  Zap,
  ArrowUpRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { UsageProgressBar } from '../ui/UsageProgressBar';

export const CompanyPlanBillingTab: React.FC = () => {
  const { tenantLimits, tenantLimitsLoading, currentTenant, currentUser } = useTenant();

  if (tenantLimitsLoading) {
    return (
      <div className="p-8 text-center animate-pulse">
        <div className="w-16 h-16 bg-slate-200 rounded-2xl mx-auto mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-1/4 mx-auto"></div>
      </div>
    );
  }

  if (!tenantLimits) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-900">No se pudo cargar la información del plan</h3>
        <p className="text-xs text-slate-500 mt-1">Contacta a soporte si el problema persiste.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Tarjeta del Plan Actual */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              Plan Contratado
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ✓ Activo
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">
            {tenantLimits.planName}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Espacio de trabajo de <strong className="text-white">{currentTenant.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-2 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Mejorar Plan</span>
          </button>
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-transform hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Renovar</span>
          </button>
        </div>
      </div>

      {/* Consumo Actual (Barras Reales) */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-600" /> Consumo de tu Plan en Tiempo Real
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UsageProgressBar 
            label="Usuarios del Plan" 
            current={tenantLimits.limits.users.current} 
            limit={tenantLimits.limits.users.limit} 
          />
          <UsageProgressBar 
            label="Clientes del Plan" 
            current={tenantLimits.limits.clients.current} 
            limit={tenantLimits.limits.clients.limit} 
          />
          <UsageProgressBar 
            label="Pólizas del Plan" 
            current={tenantLimits.limits.policies.current} 
            limit={tenantLimits.limits.policies.limit} 
          />
        </div>
      </div>

      {/* Información Adicional de Facturación */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-600" /> Detalles de Facturación
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-slate-500 mb-1">Estado de la Cuenta</div>
              <div className="font-bold text-emerald-600">Al día</div>
            </div>
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-slate-500 mb-1">Ciclo de Facturación</div>
              <div className="font-bold text-slate-900">Mensual</div>
            </div>
            <Calendar className="w-6 h-6 text-indigo-500" />
          </div>
        </div>
      </div>
    </div>
  );
};