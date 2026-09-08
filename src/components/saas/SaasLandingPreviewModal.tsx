import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Phone,
  MessageSquare,
  Shield,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Building,
  Award,
  Users,
  Lock,
  Globe,
  Monitor,
  Smartphone,
  Send,
  Star,
  Copy,
  Check,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Zap,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { SaasLandingConfig, TenantLandingConfig, TenantBranding, SaasPlanFeatureLimit } from '../../types';
import { useTenant } from '../../context/TenantContext';
import { getSaasPublicUrl, getTenantPublicUrl } from '../../utils/urlUtils';
import { SaasRegistrationWizardModal } from './SaasRegistrationWizardModal';

interface SaasLandingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'saas_master' | 'tenant_agency';
  saasConfig?: SaasLandingConfig;
  tenantConfig?: TenantLandingConfig;
  tenant?: TenantBranding;
  tenantName?: string;
  themeColor?: string;
}

export const SaasLandingPreviewModal: React.FC<SaasLandingPreviewModalProps> = ({
  isOpen,
  onClose,
  mode,
  saasConfig: propSaasConfig,
  tenantConfig: propTenantConfig,
  tenant: propTenant,
  tenantName: propTenantName,
  themeColor: propThemeColor
}) => {
  const {
    currentTenant,
    saasLandingConfig: contextSaasConfig,
    currentTenantLandingConfig: contextTenantLanding,
    submitMicroLandingLead,
    saasPlans
  } = useTenant();

  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  const [leadFormSubmitted, setLeadFormSubmitted] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedPlanForRegistration, setSelectedPlanForRegistration] = useState<SaasPlanFeatureLimit | null>(null);

  const handleSelectPlan = (planItem: { id: string; name: string; price: number; billingPeriod: string; description: string; features: string[] }) => {
    const existingPlan = saasPlans?.find((p) => p.id === planItem.id || p.name.toLowerCase() === planItem.name.toLowerCase());
    const targetPlan: SaasPlanFeatureLimit = existingPlan || {
      id: planItem.id,
      name: planItem.name,
      description: planItem.description,
      price: planItem.price,
      billingPeriod: '/mes',
      maxUsers: planItem.price > 150 ? 50 : planItem.price > 80 ? 15 : 5,
      maxClients: planItem.price > 150 ? 25000 : planItem.price > 80 ? 5000 : 1000,
      maxPolicies: planItem.price > 150 ? 50000 : planItem.price > 80 ? 10000 : 2000,
      maxWhatsAppLines: planItem.price > 150 ? 5 : planItem.price > 80 ? 2 : 1,
      storageGb: planItem.price > 150 ? 100 : planItem.price > 80 ? 50 : 20,
      features: planItem.features,
      popular: planItem.id === 'pro' || planItem.name.includes('Pro'),
      enabledModules: {
        aiAssistant: true,
        campaigns: true,
        telephonyPBX: true,
        massImport: true,
        customFields: true,
        webhooks: true,
        advancedAutomations: true
      },
      status: 'active'
    };
    setSelectedPlanForRegistration(targetPlan);
    setIsRegistrationModalOpen(true);
  };

  const [leadFormData, setLeadFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Obamacare / ACA (Salud)',
    state: 'Florida',
    estimatedIncome: 35000,
    householdSize: 2,
    notes: ''
  });

  if (!isOpen) return null;

  const saasConfig = propSaasConfig || contextSaasConfig;
  const activeTenant = propTenant || currentTenant;
  const tenantConfig = propTenantConfig || activeTenant.landingConfig || contextTenantLanding;
  const tenantName = propTenantName || activeTenant.name || 'Agencia de Seguros';
  const primaryBrandColor = propThemeColor || activeTenant.primaryColor || tenantConfig?.themeColor || '#4f46e5';

  const publicUrl =
    mode === 'saas_master'
      ? getSaasPublicUrl(saasConfig.crmName, saasConfig.publicUrl, saasConfig.domainName)
      : getTenantPublicUrl(activeTenant, saasConfig.crmName);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadFormData.name || !leadFormData.phone) return;

    submitMicroLandingLead(activeTenant.id, {
      name: leadFormData.name,
      phone: leadFormData.phone,
      email: leadFormData.email,
      service: leadFormData.service,
      state: leadFormData.state,
      householdSize: Number(leadFormData.householdSize) || 1,
      estimatedIncome: Number(leadFormData.estimatedIncome) || 0,
      notes: leadFormData.notes
    });

    setLeadFormSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 rounded-3xl w-full max-w-6xl h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-slate-700">
        {/* Top Preview Control Bar & Browser Mock */}
        <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between text-white gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            </div>

            {/* URL Display with Favicon simulation */}
            <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 max-w-md truncate">
              {mode === 'saas_master' ? (
                <div className="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center text-[9px] font-black text-white shrink-0">
                  {saasConfig.logoIconText || 'A'}
                </div>
              ) : (
                <div
                  className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                  style={{ backgroundColor: primaryBrandColor }}
                >
                  {tenantName.charAt(0)}
                </div>
              )}
              <span className="text-slate-400 select-all truncate">{publicUrl}</span>
              <button
                onClick={handleCopyLink}
                className="ml-auto p-1 text-slate-400 hover:text-white transition-colors"
                title="Copiar Link Público"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Mode Badge & Device Controls */}
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              {mode === 'saas_master' ? 'SaaS General Promocional' : `Micro-Landing: ${tenantName}`}
            </span>

            {/* Device Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setDeviceView('desktop')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  deviceView === 'desktop' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Desktop"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setDeviceView('mobile')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  deviceView === 'mobile' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Móvil"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Móvil</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Frame */}
        <div className="flex-1 bg-slate-950 overflow-y-auto p-2 sm:p-6 flex justify-center items-start">
          <div
            className={`bg-white transition-all duration-300 shadow-2xl rounded-2xl overflow-y-auto min-h-full ${
              deviceView === 'desktop'
                ? 'w-full max-w-5xl'
                : 'w-full max-w-sm rounded-3xl border-8 border-slate-800 max-h-[80vh]'
            }`}
          >
            {mode === 'saas_master' ? (
              /* ========================================================================= */
              /* 1. SAAS MASTER GENERAL LANDING PAGE */
              /* ========================================================================= */
              <div className="font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
                {/* Navbar */}
                <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-20">
                  <div className="flex items-center gap-3">
                    {saasConfig.logoUrl ? (
                      <img src={saasConfig.logoUrl} alt="Logo" className="h-8 object-contain" />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm"
                        style={{ backgroundColor: saasConfig.primaryColor || '#4f46e5' }}
                      >
                        {saasConfig.logoIconText || 'A'}
                      </div>
                    )}
                    <div>
                      <span className="font-black text-lg text-slate-900 tracking-tight">
                        {saasConfig.crmName || 'Atoms Cloud CRM'}
                      </span>
                    </div>
                  </div>

                  {deviceView === 'desktop' && (
                    <nav className="flex items-center gap-6 text-xs font-bold text-slate-600">
                      {saasConfig.headerNavItems?.map((item, idx) => (
                        <a key={idx} href={item.href} className="hover:text-indigo-600 transition-colors">
                          {item.label}
                        </a>
                      ))}
                    </nav>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: saasConfig.primaryColor || '#4f46e5' }}
                    >
                      {saasConfig.ctaPrimaryText || 'Probar 14 Días Gratis'}
                    </button>
                  </div>
                </header>

                {/* Hero Section */}
                <section className="px-6 py-14 sm:py-20 text-center bg-gradient-to-b from-indigo-50/60 via-white to-white">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 text-indigo-700 text-xs font-bold mb-6 border border-indigo-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{saasConfig.heroBadge || 'Plataforma SaaS Especializada para Agencias de Seguros'}</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight">
                    {saasConfig.heroTitle}{' '}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-600">
                      {saasConfig.heroHighlight}
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mt-4 leading-relaxed font-normal">
                    {saasConfig.heroSubtitle}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                    <button
                      onClick={() => {
                        const defaultPro = saasPlans?.find((p) => p.popular) || saasPlans?.[1] || {
                          id: 'pro',
                          name: 'Pro Business',
                          price: 149,
                          billingPeriod: '/mes',
                          description: 'Para agencias en escalamiento con agentes múltiples',
                          features: ['Hasta 15 Agentes', '2 Líneas WhatsApp', '50 GB Almacenamiento']
                        };
                        handleSelectPlan(defaultPro);
                      }}
                      className="px-6 py-3 rounded-xl text-white font-bold text-xs hover:opacity-90 shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                      style={{ backgroundColor: saasConfig.primaryColor || '#4f46e5' }}
                    >
                      <span>{saasConfig.ctaPrimaryText || 'Iniciar Prueba Gratuita'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const defaultStarter = saasPlans?.[0] || {
                          id: 'starter',
                          name: 'Starter Solo',
                          price: 79,
                          billingPeriod: '/mes',
                          description: 'Ideal para agentes independientes',
                          features: ['Hasta 5 Agentes', '1 Línea WhatsApp', '20 GB Almacenamiento']
                        };
                        handleSelectPlan(defaultStarter);
                      }}
                      className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      {saasConfig.ctaSecondaryText || 'Solicitar Demostración'}
                    </button>
                  </div>

                  {/* Trust Highlights */}
                  <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span>Conforme HIPAA & Cifrado AES-256</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      <span>WhatsApp Cloud Multi-Línea Oficial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Telefonía PBX Issabel WebRTC</span>
                    </div>
                  </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="px-6 py-14 bg-slate-50 border-t border-b border-slate-200/70">
                  <div className="max-w-4xl mx-auto text-center mb-10">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Capacidades Superiores
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                      Todo lo que tu Agencia necesita para Triplicar sus Ventas
                    </h2>
                  </div>

                  <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {saasConfig.features?.map((feat, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow"
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-3.5">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        {feat.tag && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold mb-2">
                            {feat.tag}
                          </span>
                        )}
                        <h3 className="text-sm font-bold text-slate-900 mb-1.5">{feat.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">{feat.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Multi-Tenant Isolation Showcase */}
                <section id="security" className="px-6 py-14 bg-white">
                  <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mb-4 border border-emerald-500/30">
                          <Lock className="w-3.5 h-3.5" /> Aislamiento de Datos Multi-Empresa
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white">
                          Tus Pólizas, Clientes y Líneas 100% Protegidas
                        </h3>
                        <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                          Cada agencia que contrata {saasConfig.crmName || 'Ateendia'} SaaS cuenta con partición lógica dedicada, tokens cifrados,
                          subdominios personalizados y catálogos independientes. Ninguna otra empresa puede ver tus datos.
                        </p>
                      </div>
                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Partición de Base de Datos Encriptada (AES-256)</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Micro-Landings Informativas para cada Agencia</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>WhatsApp y Telefonía PBX Asignada por Tenant</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Pricing Plans */}
                <section id="pricing" className="px-6 py-14 bg-slate-50 border-t border-slate-200/70">
                  <div className="max-w-4xl mx-auto text-center mb-10">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Planes Transparentes</span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                      Elige el plan ideal para tu estructura
                    </h2>
                  </div>

                  <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
                    {saasConfig.pricingPlans?.map((plan) => (
                      <div
                        key={plan.id}
                        className={`bg-white rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                          plan.popular ? 'border-indigo-600 shadow-xl relative ring-2 ring-indigo-600/20' : 'border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div>
                          {plan.popular && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                              Más Popular
                            </span>
                          )}
                          <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                          <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                          <div className="my-5 flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900">${plan.price}</span>
                            <span className="text-xs text-slate-400 font-semibold">{plan.billingPeriod}</span>
                          </div>

                          <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                            {plan.features?.map((f, fIdx) => (
                              <div key={fIdx} className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleSelectPlan({
                              id: plan.id,
                              name: plan.name,
                              price: plan.price,
                              billingPeriod: plan.billingPeriod,
                              description: plan.description,
                              features: plan.features
                            })
                          }
                          className={`mt-6 w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                            plan.popular
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          Seleccionar Plan
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Testimonials */}
                {saasConfig.testimonials && saasConfig.testimonials.length > 0 && (
                  <section id="testimonials" className="px-6 py-14 bg-white border-t border-slate-200/70">
                    <div className="max-w-4xl mx-auto text-center mb-10">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Casos de Éxito</span>
                      <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                        Lo que dicen los directores de agencias de seguros
                      </h2>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                      {saasConfig.testimonials.map((test, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center gap-1 text-amber-400">
                            {[...Array(test.rating || 5)].map((_, rIdx) => (
                              <Star key={rIdx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <p className="text-xs text-slate-700 italic leading-relaxed">"{test.quote}"</p>
                          <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60">
                            {test.avatar ? (
                              <img src={test.avatar} alt={test.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                {test.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="text-xs font-bold text-slate-900">{test.name}</div>
                              <div className="text-[10px] text-slate-500">
                                {test.role} • {test.company}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Footer */}
                <footer className="bg-slate-900 text-slate-400 text-xs px-6 py-8 border-t border-slate-800">
                  <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        {saasConfig.logoIconText || (saasConfig.crmName ? saasConfig.crmName.charAt(0) : 'A')}
                      </div>
                      <span className="font-bold text-slate-200">{saasConfig.crmName || 'Ateendia'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {saasConfig.copyrightText || `© 2026 ${saasConfig.companyLegalName || (saasConfig.crmName || 'Ateendia') + ' Cloud LLC'}. Todos los derechos reservados.`}
                    </p>
                  </div>
                </footer>
              </div>
            ) : (
              /* ========================================================================= */
              /* 2. TENANT AGENCY INFORMATIVE MICRO-LANDING PAGE */
              /* ========================================================================= */
              <div className="font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
                {/* Agency Navbar */}
                <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-3.5 flex items-center justify-between z-20">
                  <div className="flex items-center gap-3">
                    {tenantConfig?.logoUrl || activeTenant.logoUrl ? (
                      <img
                        src={tenantConfig?.logoUrl || activeTenant.logoUrl}
                        alt={tenantName}
                        className="h-8 object-contain"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm"
                        style={{ backgroundColor: primaryBrandColor }}
                      >
                        {tenantName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                        {tenantConfig?.agencyName || tenantName}
                      </span>
                      <div className="text-[10px] text-slate-400 font-medium hidden sm:block">
                        Agencia Autorizada de Seguros
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${tenantConfig?.callDirectNumber || '+18005550100'}`}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Llamar</span>
                    </a>
                    <a
                      href={`https://wa.me/${(tenantConfig?.whatsappDirectNumber || '').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </header>

                {/* Hero Banner with Custom Theme Colors */}
                <section
                  className="px-6 py-12 sm:py-16 text-center text-white relative overflow-hidden"
                  style={{
                    backgroundColor: primaryBrandColor,
                    backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.15), rgba(0,0,0,0.4))'
                  }}
                >
                  <div className="max-w-2xl mx-auto relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-4 backdrop-blur-xs">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{tenantConfig?.badgeText || 'Obamacare 2026 • Asesoría Gratuita en Español'}</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
                      {tenantConfig?.heroHeadline || tenantConfig?.tagline || 'Protección y Salud para ti y tu Familia'}
                    </h1>

                    <p className="text-white/90 text-xs sm:text-sm mt-3 leading-relaxed max-w-xl mx-auto">
                      {tenantConfig?.aboutText ||
                        'Te asesoramos sin costo para obtener el máximo subsidio del gobierno en tu plan de salud y seguros de vida.'}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <a
                        href="#cotizar"
                        className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all shadow-md flex items-center gap-1.5"
                      >
                        <span>Cotizar Cobertura Ahora</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/${(tenantConfig?.whatsappDirectNumber || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-md"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Hablar con un Asesor</span>
                      </a>
                    </div>
                  </div>
                </section>

                {/* Services & Carriers Section */}
                <section className="px-6 py-10 bg-slate-50 border-b border-slate-200/70">
                  <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Services */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-indigo-600" /> Coberturas & Servicios
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tenantConfig?.servicesOffered?.map((srv, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-800 flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{srv}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Carriers */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-indigo-600" /> Compañías Aseguradoras Aliadas
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tenantConfig?.carriersOffered?.map((carr, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-800 flex items-center gap-2"
                          >
                            <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{carr}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Lead Quote Form */}
                {tenantConfig?.quoteFormEnabled !== false && (
                  <section id="cotizar" className="px-6 py-12 bg-white">
                    <div className="max-w-lg mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
                      <div className="text-center mb-6">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                          Formulario Rápido
                        </span>
                        <h3 className="text-lg font-black text-slate-900 mt-1">
                          {tenantConfig?.quoteFormTitle || 'Solicita tu Cotización Gratuita'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {tenantConfig?.quoteFormSubtitle ||
                            'Ingresa tus datos y un agente certificado de nuestro equipo se comunicará contigo.'}
                        </p>
                      </div>

                      {leadFormSubmitted ? (
                        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-in zoom-in-95">
                          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-emerald-900">¡Solicitud Recibida con Éxito!</h4>
                          <p className="text-xs text-emerald-700 mt-1">
                            Tu información ingresó directamente al pipeline de {tenantConfig?.agencyName || tenantName}. Te
                            contactaremos por WhatsApp o llamada en breves minutos.
                          </p>
                          <button
                            onClick={() => setLeadFormSubmitted(false)}
                            className="mt-4 px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                          >
                            Enviar otra consulta
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleLeadSubmit} className="space-y-3.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre y Apellido</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Roberto Gómez"
                              value={leadFormData.name}
                              onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                              <input
                                type="tel"
                                required
                                placeholder="+1 (786) 000-0000"
                                value={leadFormData.phone}
                                onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                              <input
                                type="email"
                                placeholder="tu@correo.com"
                                value={leadFormData.email}
                                onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Cobertura</label>
                              <select
                                value={leadFormData.service}
                                onChange={(e) => setLeadFormData({ ...leadFormData, service: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                              >
                                {tenantConfig?.servicesOffered && tenantConfig.servicesOffered.length > 0 ? (
                                  tenantConfig.servicesOffered.map((srv, idx) => (
                                    <option key={idx} value={srv}>
                                      {srv}
                                    </option>
                                  ))
                                ) : (
                                  <>
                                    <option value="Obamacare / ACA (Salud)">Obamacare / ACA (Salud)</option>
                                    <option value="Seguro de Vida (IUL / Término)">Seguro de Vida (IUL / Término)</option>
                                    <option value="Dental y Visión">Dental y Visión</option>
                                    <option value="Medicare Advantage">Medicare Advantage</option>
                                    <option value="Accidentes & Suplementario">Accidentes & Suplementario</option>
                                  </>
                                )}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Estado de Residencia</label>
                              <input
                                type="text"
                                placeholder="Florida, Texas, etc."
                                value={leadFormData.state}
                                onChange={(e) => setLeadFormData({ ...leadFormData, state: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: primaryBrandColor }}
                          >
                            <Send className="w-4 h-4" /> Enviar Solicitud a la Agencia
                          </button>
                        </form>
                      )}
                    </div>
                  </section>
                )}

                {/* Agency Office Contact Info */}
                <section className="px-6 py-8 bg-slate-900 text-slate-300 text-xs">
                  <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                    <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                      <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{tenantConfig?.officeAddress || 'Miami, FL'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                      <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{tenantConfig?.officeHours || 'Lun a Vie: 9:00 AM - 6:00 PM'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                      <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{tenantConfig?.callDirectNumber || '+1 (800) 555-0100'}</span>
                    </div>
                  </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-950 text-slate-500 text-[11px] px-6 py-4 text-center">
                  <p>
                    {tenantConfig?.agencyName || tenantName} • Micro-Landing Oficial • Powered by {saasConfig?.crmName || 'Ateendia SaaS Cloud CRM'}
                  </p>
                </footer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration & Checkout Wizard */}
      {selectedPlanForRegistration && (
        <SaasRegistrationWizardModal
          isOpen={isRegistrationModalOpen}
          onClose={() => {
            setIsRegistrationModalOpen(false);
            setSelectedPlanForRegistration(null);
          }}
          selectedPlan={selectedPlanForRegistration}
          onSuccess={() => {
            setIsRegistrationModalOpen(false);
            setSelectedPlanForRegistration(null);
            onClose();
          }}
        />
      )}
    </div>
  );
};
