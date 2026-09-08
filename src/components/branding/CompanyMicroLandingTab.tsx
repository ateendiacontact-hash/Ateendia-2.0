import React, { useState, useMemo } from 'react';
import {
  Globe,
  Palette,
  Layers,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Save,
  Plus,
  Trash2,
  Eye,
  Shield,
  Phone,
  MessageSquare,
  Building,
  UserCheck,
  Zap,
  Sliders,
  HelpCircle,
  Award
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { TenantLandingConfig } from '../../types';
import { SaasLandingPreviewModal } from '../saas/SaasLandingPreviewModal';
import { getTenantPublicUrl } from '../../utils/urlUtils';

export const CompanyMicroLandingTab: React.FC = () => {
  const {
    currentTenant,
    currentTenantLandingConfig,
    updateTenantLandingConfig,
    pipelines,
    users,
    saasLandingConfig
  } = useTenant();

  const [landingConfig, setLandingConfig] = useState<TenantLandingConfig>(() => {
    return {
      tenantId: currentTenant.id,
      isEnabled: currentTenantLandingConfig?.isEnabled ?? true,
      agencyName: currentTenantLandingConfig?.agencyName || currentTenant.name,
      tagline:
        currentTenantLandingConfig?.tagline ||
        'Asesoría experta en seguros médicos ACA y pólizas familiares.',
      heroHeadline:
        currentTenantLandingConfig?.heroHeadline ||
        'Protección y Salud para ti y tu Familia con Asesoría Gratuita',
      aboutText:
        currentTenantLandingConfig?.aboutText ||
        'Especialistas en planes de salud accesibles con subsidio federal y protección integral sin costo.',
      badgeText:
        currentTenantLandingConfig?.badgeText ||
        'Obamacare 2026 • Asesoría Gratuita en Español',
      whatsappDirectNumber:
        currentTenantLandingConfig?.whatsappDirectNumber || '+1 (786) 450-2819',
      whatsappWelcomeMsg:
        currentTenantLandingConfig?.whatsappWelcomeMsg ||
        '¡Hola! Deseo cotizar un seguro médico o de vida.',
      callDirectNumber:
        currentTenantLandingConfig?.callDirectNumber || '+1 (800) 555-0199',
      contactEmail:
        currentTenantLandingConfig?.contactEmail ||
        `contacto@${currentTenant.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      officeAddress:
        currentTenantLandingConfig?.officeAddress || 'Miami, FL, Estados Unidos',
      officeHours:
        currentTenantLandingConfig?.officeHours ||
        'Lunes a Viernes 8:30 AM - 6:30 PM (EST)',
      carriersOffered: currentTenantLandingConfig?.carriersOffered || [
        'Florida Blue',
        'Ambetter Health',
        'Oscar Health',
        'UnitedHealthcare',
        'Aetna',
        'Cigna'
      ],
      servicesOffered: currentTenantLandingConfig?.servicesOffered || [
        'Obamacare / ACA (Salud)',
        'Seguro de Vida (IUL / Término)',
        'Dental & Visión',
        'Medicare Advantage',
        'Accidentes & Suplementario',
        'Gastos Finales (Final Expense)'
      ],
      quoteFormEnabled: currentTenantLandingConfig?.quoteFormEnabled ?? true,
      quoteFormTitle:
        currentTenantLandingConfig?.quoteFormTitle || 'Solicita tu Cotización Gratuita',
      quoteFormSubtitle:
        currentTenantLandingConfig?.quoteFormSubtitle ||
        'Ingresa tus datos y un asesor certificado de nuestro equipo se comunicará contigo en minutos.',
      slug:
        currentTenantLandingConfig?.slug || currentTenant.id.replace('tenant-', ''),
      themeColor:
        currentTenantLandingConfig?.themeColor ||
        currentTenant.primaryColor ||
        '#7c3aed',
      secondaryColor:
        currentTenantLandingConfig?.secondaryColor ||
        currentTenant.accentColor ||
        '#10b981',
      leadCapturePipelineId:
        currentTenantLandingConfig?.leadCapturePipelineId ||
        pipelines.find((p) => p.tenantId === currentTenant.id && p.isDefault)?.id ||
        pipelines[0]?.id ||
        'pipe-01',
      leadCaptureStageId:
        currentTenantLandingConfig?.leadCaptureStageId || 'stage-1',
      assignedAgentId:
        currentTenantLandingConfig?.assignedAgentId ||
        users.find((u) => u.tenantId === currentTenant.id && u.role === 'agent')?.id ||
        users.find((u) => u.tenantId === currentTenant.id)?.id ||
        'user-1',
      defaultLeadSource:
        currentTenantLandingConfig?.defaultLeadSource || 'Micro-Landing Web'
    };
  });

  const [newServiceInput, setNewServiceInput] = useState('');
  const [newCarrierInput, setNewCarrierInput] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filter pipelines for current tenant
  const tenantPipelines = useMemo(() => {
    const list = pipelines.filter((p) => p.tenantId === currentTenant.id);
    return list.length > 0 ? list : pipelines;
  }, [pipelines, currentTenant.id]);

  // Selected pipeline object
  const selectedPipeline = useMemo(() => {
    return (
      tenantPipelines.find((p) => p.id === landingConfig.leadCapturePipelineId) ||
      tenantPipelines[0]
    );
  }, [tenantPipelines, landingConfig.leadCapturePipelineId]);

  // Tenant team members
  const tenantUsers = useMemo(() => {
    return users.filter((u) => u.tenantId === currentTenant.id);
  }, [users, currentTenant.id]);

  const publicLandingUrl = getTenantPublicUrl(currentTenant, saasLandingConfig.crmName);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicLandingUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleAddService = () => {
    if (!newServiceInput.trim()) return;
    if (landingConfig.servicesOffered.includes(newServiceInput.trim())) return;
    setLandingConfig({
      ...landingConfig,
      servicesOffered: [...landingConfig.servicesOffered, newServiceInput.trim()]
    });
    setNewServiceInput('');
  };

  const handleRemoveService = (serviceToRemove: string) => {
    setLandingConfig({
      ...landingConfig,
      servicesOffered: landingConfig.servicesOffered.filter(
        (s) => s !== serviceToRemove
      )
    });
  };

  const handleAddCarrier = () => {
    if (!newCarrierInput.trim()) return;
    if (landingConfig.carriersOffered.includes(newCarrierInput.trim())) return;
    setLandingConfig({
      ...landingConfig,
      carriersOffered: [...landingConfig.carriersOffered, newCarrierInput.trim()]
    });
    setNewCarrierInput('');
  };

  const handleRemoveCarrier = (carrierToRemove: string) => {
    setLandingConfig({
      ...landingConfig,
      carriersOffered: landingConfig.carriersOffered.filter(
        (c) => c !== carrierToRemove
      )
    });
  };

  const handlePresetPalette = (theme: string, secondary: string) => {
    setLandingConfig({
      ...landingConfig,
      themeColor: theme,
      secondaryColor: secondary
    });
  };

  const handleSaveLandingConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantLandingConfig(currentTenant.id, landingConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const commonCoveragePresets = [
    'Obamacare / ACA (Salud)',
    'Seguro de Vida (IUL / Término)',
    'Dental & Visión',
    'Medicare Advantage',
    'Accidentes & Suplementario',
    'Gastos Finales (Final Expense)',
    'Pólizas Comerciales',
    'Seguro de Auto / Hogar',
    'Discapacidad & Renta',
    'Salud Internacional'
  ];

  const commonCarrierPresets = [
    'Florida Blue',
    'Ambetter Health',
    'Oscar Health',
    'UnitedHealthcare',
    'Aetna',
    'Cigna',
    'Humana',
    'Molina Healthcare',
    'National General',
    'Mutual of Omaha'
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner: Status & Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
            style={{ backgroundColor: landingConfig.themeColor }}
          >
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                Gestión de Micro-Landing Web & Captación
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  landingConfig.isEnabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {landingConfig.isEnabled ? '● Publicada & Activa' : '○ Pausada'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personaliza los colores, los tipos de cobertura independientes, la propuesta comercial y define en qué pipeline se registrarán automáticamente los prospectos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Vista Previa en Vivo</span>
          </button>

          <button
            type="button"
            onClick={handleSaveLandingConfig}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2.5 shadow-xs animate-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div>¡Micro-Landing de {currentTenant.name} actualizada correctamente!</div>
            <div className="text-[11px] font-normal text-emerald-700">
              Los prospectos provenientes de tu formulario web ingresarán automáticamente al embudo configurado.
            </div>
          </div>
        </div>
      )}

      {/* Public URL Box */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Enlace Público de tu Micro-Landing</span>
          </div>
          <div className="font-mono text-xs sm:text-sm font-bold bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 break-all text-purple-100">
            {publicLandingUrl}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? '¡Copiado!' : 'Copiar Enlace'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-purple-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-purple-700" />
            <span>Probar Cotizador</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveLandingConfig} className="space-y-6">
        {/* Row 1: Visual Theme & Color Palette */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Paleta de Colores de la Micro-Landing
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Afecta cabeceras, botones de acción y destacados
            </span>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Paletas Recomendadas de 1 Clic:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { name: 'Violeta Real', primary: '#7C3AED', secondary: '#10B981' },
                { name: 'Azul Salud', primary: '#2563EB', secondary: '#06B6D4' },
                { name: 'Esmeralda Vida', primary: '#059669', secondary: '#F59E0B' },
                { name: 'Rubí / Coral', primary: '#E11D48', secondary: '#8B5CF6' },
                { name: 'Carbón & Ámbar', primary: '#1E293B', secondary: '#F59E0B' },
                { name: 'Turquesa Aqua', primary: '#0891B2', secondary: '#10B981' }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetPalette(p.primary, p.secondary)}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all hover:scale-102 cursor-pointer ${
                    landingConfig.themeColor === p.primary &&
                    landingConfig.secondaryColor === p.secondary
                      ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-2 ring-purple-400/30'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex -space-x-1 shrink-0">
                    <span
                      className="w-4 h-4 rounded-full border border-white"
                      style={{ backgroundColor: p.primary }}
                    ></span>
                    <span
                      className="w-4 h-4 rounded-full border border-white"
                      style={{ backgroundColor: p.secondary }}
                    ></span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 truncate">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Primary Color */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Color Primario de la Landing (Hero, Botones Principales)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={landingConfig.themeColor || '#7c3aed'}
                  onChange={(e) =>
                    setLandingConfig({ ...landingConfig, themeColor: e.target.value })
                  }
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300"
                />
                <input
                  type="text"
                  value={landingConfig.themeColor || '#7c3aed'}
                  onChange={(e) =>
                    setLandingConfig({ ...landingConfig, themeColor: e.target.value })
                  }
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase"
                />
              </div>
            </div>

            {/* Secondary / Accent Color */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Color Secundario / Acentos (Badges, WhatsApp, Destacados)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={landingConfig.secondaryColor || '#10b981'}
                  onChange={(e) =>
                    setLandingConfig({
                      ...landingConfig,
                      secondaryColor: e.target.value
                    })
                  }
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300"
                />
                <input
                  type="text"
                  value={landingConfig.secondaryColor || '#10b981'}
                  onChange={(e) =>
                    setLandingConfig({
                      ...landingConfig,
                      secondaryColor: e.target.value
                    })
                  }
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Pipeline Routing & Lead Attribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Layers className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Enrutamiento de Prospectos hacia el Pipeline (CRM)
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Automatización de Captación Activa</strong>
              Cada vez que un cliente potencial complete el formulario en la micro-landing, ingresará inmediatamente al tablero y etapa seleccionados a continuación con la etiqueta de origen.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pipeline Target */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                1. Pipeline de Destino
              </label>
              <select
                value={landingConfig.leadCapturePipelineId || tenantPipelines[0]?.id}
                onChange={(e) => {
                  const pipeId = e.target.value;
                  const pipe = tenantPipelines.find((p) => p.id === pipeId);
                  setLandingConfig({
                    ...landingConfig,
                    leadCapturePipelineId: pipeId,
                    leadCaptureStageId: pipe?.stages[0]?.id || 'stage-1'
                  });
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {tenantPipelines.map((pipe) => (
                  <option key={pipe.id} value={pipe.id}>
                    📊 {pipe.name} ({pipe.stages.length} etapas)
                  </option>
                ))}
              </select>
            </div>

            {/* Stage Target */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                2. Etapa Inicial
              </label>
              <select
                value={
                  landingConfig.leadCaptureStageId ||
                  selectedPipeline?.stages[0]?.id ||
                  'stage-1'
                }
                onChange={(e) =>
                  setLandingConfig({
                    ...landingConfig,
                    leadCaptureStageId: e.target.value
                  })
                }
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {selectedPipeline?.stages.map((stg) => (
                  <option key={stg.id} value={stg.id}>
                    ● {stg.name} ({stg.winProbability}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Default Assigned Agent */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                3. Asesor Asignado por Defecto
              </label>
              <select
                value={landingConfig.assignedAgentId || tenantUsers[0]?.id}
                onChange={(e) =>
                  setLandingConfig({
                    ...landingConfig,
                    assignedAgentId: e.target.value
                  })
                }
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {tenantUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    👤 {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Default Lead Source Tag */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                4. Origen del Prospecto
              </label>
              <input
                type="text"
                value={landingConfig.defaultLeadSource || 'Micro-Landing Web'}
                onChange={(e) =>
                  setLandingConfig({
                    ...landingConfig,
                    defaultLeadSource: e.target.value
                  })
                }
                placeholder="Micro-Landing Web"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Services / Coverages Offered (Independent Config) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Tipos de Cobertura Ofrecidos (Configuración Independiente)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Aparecen en el cotizador y en los badges informativos
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Agrega o elimina los productos y tipos de seguros que tu agencia comercializa. Cada empresa puede tener su propia oferta personalizada.
          </p>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 block">
              Agregar Coberturas Rápidas del Catálogo:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {commonCoveragePresets.map((preset, idx) => {
                const isAlreadyAdded = landingConfig.servicesOffered.includes(preset);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => {
                      if (!isAlreadyAdded) {
                        setLandingConfig({
                          ...landingConfig,
                          servicesOffered: [...landingConfig.servicesOffered, preset]
                        });
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      isAlreadyAdded
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 cursor-pointer'
                    }`}
                  >
                    <span>{isAlreadyAdded ? '✓ ' + preset : '+ ' + preset}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Services List */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newServiceInput}
                onChange={(e) => setNewServiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddService();
                  }
                }}
                placeholder="Escribe un tipo de cobertura personalizado..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddService}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
              {landingConfig.servicesOffered.map((service, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs font-bold text-slate-800"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: landingConfig.secondaryColor || '#10b981' }}
                    />
                    <span className="truncate">{service}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(service)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Eliminar cobertura"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: Carriers / Insurance Companies */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Compañías Aseguradoras / Carriers Representadas
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Genera confianza en tus visitantes
            </span>
          </div>

          {/* Carrier Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 block">
              Agregar Aseguradoras Principales:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {commonCarrierPresets.map((carrier, idx) => {
                const isAdded = landingConfig.carriersOffered.includes(carrier);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAdded}
                    onClick={() => {
                      if (!isAdded) {
                        setLandingConfig({
                          ...landingConfig,
                          carriersOffered: [...landingConfig.carriersOffered, carrier]
                        });
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      isAdded
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer'
                    }`}
                  >
                    <span>{isAdded ? '✓ ' + carrier : '+ ' + carrier}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCarrierInput}
                onChange={(e) => setNewCarrierInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCarrier();
                  }
                }}
                placeholder="Nombre de la aseguradora (ej. Anthem, Kaiser Permanente)..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddCarrier}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
              {landingConfig.carriersOffered.map((carrier, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs font-bold text-slate-800"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{carrier}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCarrier(carrier)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Eliminar aseguradora"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 5: Commercial Copywriting & Texts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Textos Comerciales & Titulares de la Micro-Landing
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de la Agencia Visible en el Encabezado
              </label>
              <input
                type="text"
                value={landingConfig.agencyName}
                onChange={(e) =>
                  setLandingConfig({ ...landingConfig, agencyName: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Badge Destacado Superior
              </label>
              <input
                type="text"
                value={landingConfig.badgeText || ''}
                onChange={(e) =>
                  setLandingConfig({ ...landingConfig, badgeText: e.target.value })
                }
                placeholder="Obamacare 2026 • Asesoría Gratuita en Español"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Titular Principal de Impacto (Hero Headline)
              </label>
              <input
                type="text"
                value={landingConfig.heroHeadline || landingConfig.tagline}
                onChange={(e) =>
                  setLandingConfig({
                    ...landingConfig,
                    heroHeadline: e.target.value,
                    tagline: e.target.value
                  })
                }
                placeholder="Protección y Salud para ti y tu Familia con Asesoría Gratuita"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Descripción / Propuesta de Valor (Acerca de la Agencia)
              </label>
              <textarea
                rows={2}
                value={landingConfig.aboutText}
                onChange={(e) =>
                  setLandingConfig({ ...landingConfig, aboutText: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Row 6: Direct Contact Numbers & WhatsApp */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Phone className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Canales de Atención Directa & Botón de WhatsApp
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número de WhatsApp para Clientes
              </label>
              <input
                type="text"
                value={landingConfig.whatsappDirectNumber || ''}
                onChange={(e) =>
                  setLandingConfig({
                    ...landingConfig,
                    whatsappDirectNumber: e.target.value
                  })
                }
                placeholder="+1 (786) 450-2819"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Línea Telefónica Directa
              </label>
              <input
                type="text"
                value={landingConfig.callDirectNumber || ''}
                onChange={(e) =>
                  setLandingConfig({
                    ...landingConfig,
                    callDirectNumber: e.target.value
                  })
                }
                placeholder="+1 (800) 555-0199"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico de Contacto
              </label>
              <input
                type="email"
                value={landingConfig.contactEmail || ''}
                onChange={(e) =>
                  setLandingConfig({
                    ...landingConfig,
                    contactEmail: e.target.value
                  })
                }
                placeholder="contacto@agencia.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dirección Física / Ciudad de Cobertura
              </label>
              <input
                type="text"
                value={landingConfig.officeAddress || ''}
                onChange={(e) =>
                  setLandingConfig({
                    ...landingConfig,
                    officeAddress: e.target.value
                  })
                }
                placeholder="Miami, FL, Estados Unidos"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Horario de Atención
              </label>
              <input
                type="text"
                value={landingConfig.officeHours || ''}
                onChange={(e) =>
                  setLandingConfig({
                    ...landingConfig,
                    officeHours: e.target.value
                  })
                }
                placeholder="Lunes a Viernes 8:30 AM - 6:30 PM (EST)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Todos los cambios se aplicarán en tiempo real a tu micro-landing y al enrutamiento del pipeline.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-purple-600" />
              <span>Ver en Vivo</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </div>
      </form>

      {/* Live Preview Modal */}
      {isPreviewOpen && (
        <SaasLandingPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          mode="tenant_agency"
          tenantConfig={landingConfig}
          tenant={currentTenant}
          tenantName={currentTenant.name}
          themeColor={landingConfig.themeColor}
        />
      )}
    </div>
  );
};
