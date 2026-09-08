import React, { useState } from 'react';
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Shield,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
  Globe,
  Lock,
  Search,
  Eye,
  Sliders,
  Sparkles,
  ArrowUpRight,
  UserPlus,
  RefreshCw,
  Phone,
  MessageSquare,
  FileSpreadsheet,
  Palette,
  Copy,
  Check,
  Server,
  Database,
  Key,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Clock,
  MapPin,
  Star,
  Zap,
  LayoutTemplate,
  Receipt,
  Mail,
  Smartphone,
  CheckCircle,
  XCircle,
  RotateCcw,
  Power,
  Ban,
  Play,
  FileCheck,
  CreditCard,
  ZoomIn,
  LayoutGrid,
  Table as TableIcon,
  ArrowRightLeft,
  Crown
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { TenantBranding, SaasDelegatedAdmin, SaasLandingConfig, TenantLandingConfig, SaasPaymentReceipt, SaasPlanFeatureLimit } from '../../types';
import { SaasLandingPreviewModal } from './SaasLandingPreviewModal';
import { SaasPlansManagementSection } from './SaasPlansManagementSection';
import { SaasSmtpConfigSection } from './SaasSmtpConfigSection';
import { SaasWhatsAppCentralSection } from './SaasWhatsAppCentralSection';
import { SaasVpsDatabaseSection } from './SaasVpsDatabaseSection';
import { PaymentReceiptViewerModal } from './PaymentReceiptViewerModal';
import { getTenantPublicUrl, getSaasBaseDomain, getSaasPublicUrl } from '../../utils/urlUtils';

export const SaasCentralDashboard: React.FC = () => {
  const {
    tenants,
    currentTenant,
    setCurrentTenantId,
    users,
    policies,
    clients,
    conversations,
    createTenant,
    updateTenantSubscription,
    updateTenantSubscriptionPlan,
    toggleTenantStatus,
    resetTenantData,
    saasAdmins,
    addSaasAdmin,
    updateSaasAdmin,
    deleteSaasAdmin,
    saasLandingConfig,
    updateSaasLandingConfig,
    updateTenantLandingConfig,
    saasPlans,
    updateSaasPlans,
    saasSmtpConfig,
    updateSaasSmtpConfig,
    saasNotificationTemplates,
    updateSaasNotificationTemplates,
    testSaasSmtpConnection,
    saasWhatsAppCentralConfig,
    updateSaasWhatsAppCentralConfig,
    sendWhatsAppCentralTestMessage,
    saasPaymentReceipts,
    approvePaymentReceipt,
    rejectPaymentReceipt,
    globalSaasMetrics,
    currentUser
  } = useTenant();

  const [activeTab, setActiveTab] = useState<
    | 'tenants'
    | 'payment_receipts'
    | 'saas_plans'
    | 'saas_smtp'
    | 'saas_whatsapp'
    | 'vps_database'
    | 'metrics'
    | 'delegated_admins'
    | 'saas_landing'
    | 'micro_landings'
  >('tenants');

  // Modal states
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [provisioningStep, setProvisioningStep] = useState<1 | 2 | 3>(1);
  const [isNewAdminModalOpen, setIsNewAdminModalOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'saas_master' | 'tenant_agency' | null>(null);
  const [previewTenant, setPreviewTenant] = useState<TenantBranding | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Payment Receipts Review State
  const [selectedReceiptForReview, setSelectedReceiptForReview] = useState<SaasPaymentReceipt | null>(null);
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [receiptSearchQuery, setReceiptSearchQuery] = useState('');

  // Tenant Reset State
  const [confirmResetTenantId, setConfirmResetTenantId] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // New Tenant Form State
  const [tenantFormData, setTenantFormData] = useState({
    name: '',
    legalName: '',
    taxId: '',
    subdomain: '',
    customDomain: '',
    primaryColor: '#4f46e5',
    accentColor: '#10b981',
    plan: 'Starter' as 'Starter' | 'Professional' | 'Enterprise',
    monthlyPrice: 79,
    adminName: '',
    adminEmail: '',
    adminPhone: '+1 (786) 555-0100',
    adminPassword: 'TempPass2026!*',
    encryptionStandard: 'AES-256-GCM',
    storageQuotaGb: 25
  });

  // Delegated Admin Form State
  const [adminFormData, setAdminFormData] = useState<Omit<SaasDelegatedAdmin, 'id' | 'createdAt'>>({
    name: '',
    email: '',
    role: 'custom_delegated',
    status: 'active',
    allowedTenantIds: ['*'],
    permissions: {
      viewGlobalMetrics: true,
      viewTenantsList: true,
      createTenant: false,
      editTenantSettings: false,
      suspendTenant: false,
      viewSensitiveClientData: false,
      manageSaasAdmins: false,
      manageSaasLanding: false,
      exportGlobalReports: true
    }
  });

  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [cmsSection, setCmsSection] = useState<'identity' | 'hero' | 'features' | 'pricing' | 'testimonials' | 'footer'>('identity');
  const [tenantViewMode, setTenantViewMode] = useState<'grid' | 'table'>('grid');

  const isGlobalSuperAdmin = currentUser?.email === 'victoraray8@gmail.com' || currentUser?.isSuperAdmin === true;

  const handleTenantSwitch = (tenantId: string) => {
    // TenantContext.handleSetCurrentTenantId already preserves Super Admin Global credentials
    setCurrentTenantId(tenantId);
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
      t.taxId?.toLowerCase().includes(tenantSearchQuery.toLowerCase())
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleCreateTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantFormData.name || !tenantFormData.adminEmail) return;

    const generatedSlug = (tenantFormData.subdomain || tenantFormData.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-');

    createTenant(
      {
        name: tenantFormData.name,
        legalName: tenantFormData.legalName || `${tenantFormData.name} LLC`,
        taxId: tenantFormData.taxId || `EIN-88-${Math.floor(1000000 + Math.random() * 9000000)}`,
        primaryColor: tenantFormData.primaryColor,
        accentColor: tenantFormData.accentColor,
        subdomain: generatedSlug,
        customDomain: tenantFormData.customDomain || undefined,
        databaseIsolation: {
          partitionKey: `db_part_${generatedSlug}_${Date.now()}`,
          encryptionLevel: 'AES-256',
          storageQuotaGb: tenantFormData.plan === 'Starter' ? 25 : tenantFormData.plan === 'Professional' ? 100 : 500,
          maxClientsQuota: tenantFormData.plan === 'Starter' ? 500 : tenantFormData.plan === 'Professional' ? 5000 : 50000,
          maxPoliciesQuota: tenantFormData.plan === 'Starter' ? 500 : tenantFormData.plan === 'Professional' ? 5000 : 50000,
          status: 'Active'
        },
        landingConfig: {
          tenantId: `tenant-${generatedSlug}`,
          isEnabled: true,
          agencyName: tenantFormData.name,
          slug: generatedSlug,
          tagline: 'Asesoría especializada en Seguros de Salud y Vida',
          heroHeadline: `Protección de Salud y Vida con ${tenantFormData.name}`,
          badgeText: 'Obamacare 2026 • Asesoría Gratuita en Español',
          aboutText: `En ${tenantFormData.name} ayudamos a familias y particulares a encontrar la mejor cobertura de seguros de salud y vida con subsidios federales.`,
          themeColor: tenantFormData.primaryColor,
          whatsappDirectNumber: tenantFormData.adminPhone,
          callDirectNumber: tenantFormData.adminPhone,
          officeAddress: 'Miami, FL, Estados Unidos',
          officeHours: 'Lun - Vie: 9:00 AM - 6:00 PM EST',
          servicesOffered: ['Obamacare / ACA (Salud)', 'Seguros de Vida IUL', 'Dental y Visión', 'Medicare'],
          carriersOffered: ['Florida Blue', 'Ambetter Health', 'Oscar Insurance', 'UnitedHealthcare'],
          quoteFormEnabled: true,
          quoteFormTitle: 'Solicita tu Cotización Gratuita',
          quoteFormSubtitle: 'Un agente certificado se comunicará contigo en minutos.'
        },
        subscription: {
          plan: tenantFormData.plan,
          status: 'active',
          monthlyPrice: tenantFormData.monthlyPrice,
          renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          userQuota: tenantFormData.plan === 'Starter' ? 5 : tenantFormData.plan === 'Professional' ? 25 : 100,
          whatsappLinesQuota: tenantFormData.plan === 'Starter' ? 1 : 2,
          storageGb: tenantFormData.plan === 'Starter' ? 25 : 100,
          contactEmail: tenantFormData.adminEmail
        }
      },
      {
        name: tenantFormData.adminName || `Admin ${tenantFormData.name}`,
        email: tenantFormData.adminEmail,
        phone: tenantFormData.adminPhone
      }
    );

    setIsNewTenantModalOpen(false);
    setProvisioningStep(1);
    setTenantFormData({
      name: '',
      legalName: '',
      taxId: '',
      subdomain: '',
      customDomain: '',
      primaryColor: '#4f46e5',
      accentColor: '#10b981',
      plan: 'Starter',
      monthlyPrice: 79,
      adminName: '',
      adminEmail: '',
      adminPhone: '+1 (786) 555-0100',
      adminPassword: 'TempPass2026!*',
      encryptionStandard: 'AES-256-GCM',
      storageQuotaGb: 25
    });
  };

  const handleCreateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormData.name || !adminFormData.email) return;

    addSaasAdmin(adminFormData);
    setIsNewAdminModalOpen(false);
    setAdminFormData({
      name: '',
      email: '',
      role: 'custom_delegated',
      status: 'active',
      allowedTenantIds: ['*'],
      permissions: {
        viewGlobalMetrics: true,
        viewTenantsList: true,
        createTenant: false,
        editTenantSettings: false,
        suspendTenant: false,
        viewSensitiveClientData: false,
        manageSaasAdmins: false,
        manageSaasLanding: false,
        exportGlobalReports: true
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Top Hero Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Central de Administración SaaS Multi-Tenant
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Panel Superior del Propietario SaaS</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Controla el aislamiento lógico de bases de datos, aprovisionamiento de agencias, usuarios delegados y el
              CMS visual de tu Landing Page General.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setPreviewMode('saas_master');
                setPreviewTenant(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Landing General</span>
            </button>

            <button
              onClick={() => {
                setProvisioningStep(1);
                setIsNewTenantModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Aprovisionar Empresa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'tenants'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Empresas & Instancias ({tenants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payment_receipts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'payment_receipts'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Comprobantes de Pago</span>
          {saasPaymentReceipts.filter((r) => r.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
              {saasPaymentReceipts.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('saas_plans')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'saas_plans'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Planes y Límites ({saasPlans?.length || 3})</span>
        </button>

        <button
          onClick={() => setActiveTab('saas_smtp')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'saas_smtp'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Correo SMTP Central</span>
        </button>

        <button
          onClick={() => setActiveTab('saas_whatsapp')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'saas_whatsapp'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>WhatsApp Notificador</span>
        </button>

        <button
          onClick={() => setActiveTab('vps_database')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'vps_database'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>VPS & Base de Datos</span>
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'metrics'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Métricas Globales</span>
        </button>

        <button
          onClick={() => setActiveTab('delegated_admins')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'delegated_admins'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Administradores ({saasAdmins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saas_landing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'saas_landing'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>CMS Landing SaaS</span>
        </button>

        <button
          onClick={() => setActiveTab('micro_landings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'micro_landings'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Micro-Landings</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EMPRESAS & AISLAMIENTO LÓGICO */}
      {/* ========================================================================= */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          {/* Architecture Explanation Card */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-3xl p-5 sm:p-6 text-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Garantía de Aislamiento Lógico de Datos Multi-Empresa
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cada empresa registrada en {saasLandingConfig.crmName || 'Ateendia'} opera en un espacio de base de datos lógicamente aislado mediante
                  la clave de partición <code className="bg-white px-1.5 py-0.5 rounded border text-indigo-700 font-mono">tenant_id</code>.
                  Los usuarios de una agencia solo pueden consultar, modificar o exportar sus propios clientes, pólizas,
                  campañas y líneas de WhatsApp.
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, ID o EIN..."
                value={tenantSearchQuery}
                onChange={(e) => setTenantSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>{filteredTenants.length} empresas aprovisionadas</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setTenantViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  tenantViewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Vista Cuadrícula"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTenantViewMode('table')}
                className={`p-2 rounded-lg transition-all ${
                  tenantViewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Vista Tabla"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tenants View: Grid or Table */}
          {tenantViewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTenants.map((t) => {
                const tenantUsersCount = users.filter((u) => u.tenantId === t.id).length;
                const tenantPolicies = policies.filter((p) => p.tenantId === t.id);
                const tenantPremiumSum = tenantPolicies.reduce((acc, curr) => acc + (curr.monthlyPremium || 0), 0);
                const tenantClientsCount = clients.filter((c) => c.tenantId === t.id).length;
                const isCurrent = t.id === currentTenant.id;
                const publicLink = getTenantPublicUrl(t, saasLandingConfig);

                return (
                  <div
                    key={t.id}
                    className={`bg-white rounded-3xl p-5 border transition-all shadow-2xs hover:shadow-md flex flex-col justify-between ${
                      isCurrent ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs"
                            style={{ backgroundColor: t.primaryColor || '#4f46e5' }}
                          >
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-sm text-slate-900">{t.name}</h3>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                  Activa
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">{t.id}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            t.subscription?.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {t.subscription?.plan || 'Starter'}
                        </span>
                      </div>

                      {/* Technical & Isolation Details */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" /> Subdominio:
                          </span>
                          <span className="font-mono text-indigo-700 font-semibold truncate max-w-[140px]">
                            {t.subdomain || t.id}.{getSaasBaseDomain()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> Partición DB:
                          </span>
                          <span className="font-mono text-slate-700 text-[11px]">
                            {t.databaseIsolation?.partitionKey || `part_${t.id}`} (AES-256)
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Vigencia:
                          </span>
                          <span className="font-semibold text-slate-700 text-[11px]">
                            {t.subscription?.renewalDate
                              ? new Date(t.subscription.renewalDate).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : '30 días'}
                          </span>
                        </div>
                      </div>

                      {/* Tenant Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Usuarios</div>
                          <div className="text-sm font-black text-slate-900">{tenantUsersCount}</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Clientes</div>
                          <div className="text-sm font-black text-slate-900">{tenantClientsCount}</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Pólizas</div>
                          <div className="text-sm font-black text-indigo-600">{tenantPolicies.length}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions & Administration */}
                    <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleTenantStatus(t.id)}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
                            t.subscription?.status === 'active'
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                          title={t.subscription?.status === 'active' ? 'Suspender acceso a la empresa' : 'Habilitar acceso a la empresa'}
                        >
                          {t.subscription?.status === 'active' ? (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              <span>Suspender</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Habilitar</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setConfirmResetTenantId(t.id)}
                          className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Limpiar datos de prueba y resetear cuenta a cero"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Resetear</span>
                        </button>

                        <button
                          onClick={() => {
                            setReceiptFilter('all');
                            setReceiptSearchQuery(t.name);
                            setActiveTab('payment_receipts');
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Ver comprobantes y pagos adjuntados"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Pagos</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setPreviewTenant(t);
                            setPreviewMode('tenant_agency');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Ver Micro-Landing Pública"
                        >
                          <Globe className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Landing</span>
                        </button>

                        <button
                          onClick={() => handleTenantSwitch(t.id)}
                          disabled={isCurrent}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isCurrent
                              ? 'bg-slate-100 text-slate-400 cursor-default'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          }`}
                        >
                          <span>{isCurrent ? 'Empresa Seleccionada' : 'Entrar a Instancia'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">Empresa / Logo</th>
                      <th className="p-4">Subdominio</th>
                      <th className="p-4">Partición DB</th>
                      <th className="p-4">Plan / Suscripción</th>
                      <th className="p-4">Usuarios</th>
                      <th className="p-4">Clientes</th>
                      <th className="p-4">Pólizas</th>
                      <th className="p-4">Vigencia</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTenants.map((t) => {
                      const tenantUsersCount = users.filter((u) => u.tenantId === t.id).length;
                      const tenantPolicies = policies.filter((p) => p.tenantId === t.id);
                      const tenantClientsCount = clients.filter((c) => c.tenantId === t.id).length;
                      const isCurrent = t.id === currentTenant.id;

                      return (
                        <tr key={t.id} className={`hover:bg-slate-50/80 transition-colors ${isCurrent ? 'bg-indigo-50/30' : ''}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0"
                                style={{ backgroundColor: t.primaryColor || '#4f46e5' }}
                              >
                                {t.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  {t.name}
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                      Activa
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">{t.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-indigo-700 font-semibold text-[11px]">
                              {t.subdomain || t.id}.{getSaasBaseDomain()}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-slate-700 text-[11px]">
                              {t.databaseIsolation?.partitionKey || `part_${t.id}`}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.subscription?.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {t.subscription?.plan || 'Starter'}
                            </span>
                          </td>
                          <td className="p-4 text-center font-bold text-slate-700">{tenantUsersCount}</td>
                          <td className="p-4 text-center font-bold text-slate-700">{tenantClientsCount}</td>
                          <td className="p-4 text-center font-bold text-indigo-600">{tenantPolicies.length}</td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-700 text-[11px]">
                              {t.subscription?.renewalDate
                                ? new Date(t.subscription.renewalDate).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })
                                : '30 días'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.subscription?.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {t.subscription?.status === 'active' ? (
                                <><CheckCircle className="w-3 h-3" /> Activo</>
                              ) : (
                                <><Ban className="w-3 h-3" /> Suspendido</>
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => toggleTenantStatus(t.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  t.subscription?.status === 'active'
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                }`}
                                title={t.subscription?.status === 'active' ? 'Suspender' : 'Habilitar'}
                              >
                                {t.subscription?.status === 'active' ? (
                                  <Ban className="w-3.5 h-3.5" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  setReceiptFilter('all');
                                  setReceiptSearchQuery(t.name);
                                  setActiveTab('payment_receipts');
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                                title="Ver Pagos"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleTenantSwitch(t.id)}
                                disabled={isCurrent}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                                  isCurrent
                                    ? 'bg-slate-100 text-slate-400 cursor-default'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                }`}
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span>Entrar</span>
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
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: COMPROBANTES DE PAGO Y HABILITACIÓN DE EMPRESAS */}
      {/* ========================================================================= */}
      {activeTab === 'payment_receipts' && (
        <div className="space-y-6">
          {/* Header & Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-2">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Comprobantes</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{saasPaymentReceipts.length}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Registros y renovaciones</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendientes de Revisión</div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {saasPaymentReceipts.filter((r) => r.status === 'pending').length}
              </div>
              <div className="text-[11px] text-amber-600 font-bold mt-1">Esperando validación de pago</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-2">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aprobados / Habilitados</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {saasPaymentReceipts.filter((r) => r.status === 'approved').length}
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">Cuentas con acceso activo</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-2">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rechazados</div>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {saasPaymentReceipts.filter((r) => r.status === 'rejected').length}
              </div>
              <div className="text-[11px] text-rose-600 font-medium mt-1">Comprobantes no válidos</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por empresa, solicitante, ref..."
                value={receiptSearchQuery}
                onChange={(e) => setReceiptSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'pending', label: 'Pendientes' },
                  { id: 'approved', label: 'Aprobados' },
                  { id: 'rejected', label: 'Rechazados' }
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setReceiptFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    receiptFilter === f.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Receipts Table / List */}
          {saasPaymentReceipts.filter((r) => {
            const matchesFilter = receiptFilter === 'all' || r.status === receiptFilter;
            const query = receiptSearchQuery.toLowerCase();
            const matchesQuery =
              !query ||
              r.tenantName.toLowerCase().includes(query) ||
              r.adminName.toLowerCase().includes(query) ||
              r.adminEmail.toLowerCase().includes(query) ||
              r.referenceNumber?.toLowerCase().includes(query) ||
              r.planName.toLowerCase().includes(query);
            return matchesFilter && matchesQuery;
          }).length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No hay comprobantes de pago en esta vista</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Cuando nuevos clientes se registren desde la Landing General o renueven su suscripción, sus comprobantes
                aparecerán aquí para validación.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">Comprobante</th>
                      <th className="p-4">Empresa / Solicitante</th>
                      <th className="p-4">Plan & Monto</th>
                      <th className="p-4">Método & Referencia</th>
                      <th className="p-4">Fecha Envío</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {saasPaymentReceipts
                      .filter((r) => {
                        const matchesFilter = receiptFilter === 'all' || r.status === receiptFilter;
                        const query = receiptSearchQuery.toLowerCase();
                        const matchesQuery =
                          !query ||
                          r.tenantName.toLowerCase().includes(query) ||
                          r.adminName.toLowerCase().includes(query) ||
                          r.adminEmail.toLowerCase().includes(query) ||
                          r.referenceNumber?.toLowerCase().includes(query) ||
                          r.planName.toLowerCase().includes(query);
                        return matchesFilter && matchesQuery;
                      })
                      .map((receipt) => {
                        return (
                          <tr key={receipt.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Receipt Image Thumbnail */}
                            <td className="p-4">
                              <button
                                onClick={() => setSelectedReceiptForReview(receipt)}
                                className="group relative w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs hover:ring-2 hover:ring-indigo-500 transition-all"
                              >
                                {receipt.receiptImageUrl ? (
                                  <img
                                    src={receipt.receiptImageUrl}
                                    alt="Comprobante"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <FileCheck className="w-6 h-6 text-slate-400" />
                                )}
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <ZoomIn className="w-4 h-4" />
                                </div>
                              </button>
                            </td>

                            {/* Tenant / Admin Details */}
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{receipt.tenantName}</div>
                              <div className="text-[11px] text-slate-500">{receipt.adminName}</div>
                              <div className="text-[10px] text-indigo-600 font-mono">{receipt.adminEmail}</div>
                              {receipt.adminPhone && (
                                <div className="text-[10px] text-slate-400">{receipt.adminPhone}</div>
                              )}
                            </td>

                            {/* Plan & Amount */}
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{receipt.planName}</div>
                              <div className="text-sm font-black text-emerald-600 mt-0.5">
                                ${receipt.amountPaid} USD
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {receipt.billingCycle === 'annual' ? 'Facturación Anual' : 'Facturación Mensual'}
                              </div>
                            </td>

                            {/* Payment Method & Ref */}
                            <td className="p-4">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                {receipt.paymentMethod === 'zelle'
                                  ? 'Zelle'
                                  : receipt.paymentMethod === 'bank_transfer'
                                  ? 'Transferencia Bancaria'
                                  : receipt.paymentMethod === 'credit_card'
                                  ? 'Tarjeta de Crédito'
                                  : 'Cripto USDT'}
                              </span>
                              <div className="text-[11px] font-mono text-slate-600 mt-1 font-semibold">
                                Ref: {receipt.referenceNumber || 'N/A'}
                              </div>
                            </td>

                            {/* Date */}
                            <td className="p-4 text-slate-500 text-[11px]">
                              {new Date(receipt.createdAt).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>

                            {/* Status */}
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                  receipt.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : receipt.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {receipt.status === 'approved' ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" /> Aprobado
                                  </>
                                ) : receipt.status === 'rejected' ? (
                                  <>
                                    <XCircle className="w-3 h-3" /> Rechazado
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3" /> Pendiente
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setSelectedReceiptForReview(receipt)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                  receipt.status === 'pending'
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                {receipt.status === 'pending' ? 'Validar Comprobante' : 'Ver Detalles'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: PLANES Y LÍMITES SAAS */}
      {/* ========================================================================= */}
      {activeTab === 'saas_plans' && (
        <SaasPlansManagementSection
          plans={saasPlans}
          onUpdatePlans={updateSaasPlans}
          onApplyPlanToTenant={updateTenantSubscriptionPlan}
          tenants={tenants}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: SERVIDOR SMTP Y PLANTILLAS DE NOTIFICACIÓN */}
      {/* ========================================================================= */}
      {activeTab === 'saas_smtp' && (
        <SaasSmtpConfigSection
          config={saasSmtpConfig}
          onUpdateConfig={updateSaasSmtpConfig}
          templates={saasNotificationTemplates}
          onUpdateTemplates={updateSaasNotificationTemplates}
          onTestConnection={testSaasSmtpConnection}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: WHATSAPP CENTRAL NOTIFICADOR */}
      {/* ========================================================================= */}
      {activeTab === 'saas_whatsapp' && (
        <SaasWhatsAppCentralSection
          config={saasWhatsAppCentralConfig}
          onUpdateConfig={updateSaasWhatsAppCentralConfig}
          onTestSend={sendWhatsAppCentralTestMessage}
        />
      )}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">MRR Total SaaS</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ${globalSaasMetrics.totalMrr?.toLocaleString() || '757'}/mes
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">Facturación recurrente mensual</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Empresas Activas</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{tenants.length}</div>
              <div className="text-[11px] text-indigo-600 font-bold mt-1">100% particionadas lógicamente</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuarios / Agentes</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{users.length}</div>
              <div className="text-[11px] text-purple-600 font-bold mt-1">En todas las agencias</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pólizas en Plataforma</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{policies.length}</div>
              <div className="text-[11px] text-blue-600 font-bold mt-1">Gestionadas en tiempo real</div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900">Desglose por Empresa Aprovisionada</h3>
                <p className="text-xs text-slate-500">Métricas consolidadas de producción por cada tenant.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4">Empresa</th>
                    <th className="p-4">Plan SaaS</th>
                    <th className="p-4">Cuota MRR</th>
                    <th className="p-4">Usuarios</th>
                    <th className="p-4">Clientes</th>
                    <th className="p-4">Pólizas</th>
                    <th className="p-4">Prima Mensual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tenants.map((t) => {
                    const tUsers = users.filter((u) => u.tenantId === t.id).length;
                    const tClients = clients.filter((c) => c.tenantId === t.id).length;
                    const tPolicies = policies.filter((p) => p.tenantId === t.id);
                    const tPremium = tPolicies.reduce((acc, curr) => acc + (curr.monthlyPremium || 0), 0);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: t.primaryColor || '#4f46e5' }}
                          ></span>
                          <span>{t.name}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold">
                            {t.subscription?.plan || 'Starter'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-emerald-600">${t.subscription?.monthlyPrice || 79}/mes</td>
                        <td className="p-4">{tUsers}</td>
                        <td className="p-4">{tClients}</td>
                        <td className="p-4 font-bold">{tPolicies.length}</td>
                        <td className="p-4 font-black text-slate-900">${tPremium.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ADMINISTRADORES DELEGADOS */}
      {/* ========================================================================= */}
      {activeTab === 'delegated_admins' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-base font-black text-slate-900">Usuarios con Acceso de Administrador Delegado</h3>
              <p className="text-xs text-slate-500">
                Otorga acceso a las métricas globales o gestión de empresas con privilegios restringidos.
              </p>
            </div>
            <button
              onClick={() => setIsNewAdminModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Admin Delegado</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {saasAdmins.map((adm) => (
              <div key={adm.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                      {adm.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{adm.name}</h4>
                      <p className="text-xs text-slate-400">{adm.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    {adm.status}
                  </span>
                </div>

                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Permisos Activos:</div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className={adm.permissions?.viewGlobalMetrics ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                      ●
                    </span>
                    <span>Ver Métricas Globales de Ingresos</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className={adm.permissions?.createTenant ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                      ●
                    </span>
                    <span>Aprovisionar Nuevas Empresas</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className={adm.permissions?.manageSaasLanding ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                      ●
                    </span>
                    <span>Gestionar CMS Landing SaaS General</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Creado: {adm.createdAt}</span>
                  <button
                    onClick={() => deleteSaasAdmin(adm.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VISUAL CMS LANDING SAAS GENERAL */}
      {/* ========================================================================= */}
      {activeTab === 'saas_landing' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
          {/* Header & Link Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-base font-black text-slate-900">CMS Visual: Landing Page SaaS General</h3>
              <p className="text-xs text-slate-500">
                Edita sin programar el nombre del CRM, favicon, logotipo, colores, menú, planes y textos públicos.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-700 border border-slate-200">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>{getSaasPublicUrl(saasLandingConfig.crmName, saasLandingConfig.publicUrl, saasLandingConfig.domainName)}</span>
                <button
                  onClick={() => handleCopy(getSaasPublicUrl(saasLandingConfig.crmName, saasLandingConfig.publicUrl, saasLandingConfig.domainName), 'saas_url')}
                  className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
                  title="Copiar Link"
                >
                  {copiedUrl === 'saas_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                onClick={() => {
                  setPreviewMode('saas_master');
                  setPreviewTenant(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>Vista Previa en Vivo</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation of CMS */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
            <button
              onClick={() => setCmsSection('identity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cmsSection === 'identity' ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Identidad & Favicon
            </button>
            <button
              onClick={() => setCmsSection('hero')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cmsSection === 'hero' ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Hero Principal & CTAs
            </button>
            <button
              onClick={() => setCmsSection('features')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cmsSection === 'features' ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Funcionalidades ({saasLandingConfig.features?.length || 0})
            </button>
            <button
              onClick={() => setCmsSection('pricing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cmsSection === 'pricing' ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Planes de Precios ({saasLandingConfig.pricingPlans?.length || 0})
            </button>
            <button
              onClick={() => setCmsSection('testimonials')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cmsSection === 'testimonials' ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Testimonios & Casos
            </button>
            <button
              onClick={() => setCmsSection('footer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cmsSection === 'footer' ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Avisos Legales & Footer
            </button>
          </div>

          {/* CMS SECTION 1: IDENTITY */}
          {cmsSection === 'identity' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Comercial del CRM</label>
                    <input
                      type="text"
                      placeholder="Ateendia"
                      value={saasLandingConfig.crmName || ''}
                      onChange={(e) => updateSaasLandingConfig({ crmName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Razón Social / Entidad Legal</label>
                    <input
                      type="text"
                      placeholder="Ateendia Cloud LLC"
                      value={saasLandingConfig.companyLegalName || ''}
                      onChange={(e) => updateSaasLandingConfig({ companyLegalName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dominio Principal Personalizado</label>
                    <input
                      type="text"
                      placeholder="ateendia.cloud"
                      value={saasLandingConfig.domainName || ''}
                      onChange={(e) => updateSaasLandingConfig({ domainName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Correo de Soporte Oficial</label>
                    <input
                      type="email"
                      placeholder="soporte@ateendia.cloud"
                      value={saasLandingConfig.supportEmail || ''}
                      onChange={(e) => updateSaasLandingConfig({ supportEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dirección Oficial de la Empresa</label>
                  <input
                    type="text"
                    placeholder="800 Brickell Ave, Suite 900, Miami, FL 33131, Estados Unidos"
                    value={saasLandingConfig.companyAddress || ''}
                    onChange={(e) => updateSaasLandingConfig({ companyAddress: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Letra / Ícono del Logo</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={saasLandingConfig.logoIconText || (saasLandingConfig.crmName ? saasLandingConfig.crmName.charAt(0) : 'A')}
                      onChange={(e) => updateSaasLandingConfig({ logoIconText: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-center uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Logo Imagen URL (Opcional)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={saasLandingConfig.logoUrl || ''}
                      onChange={(e) => updateSaasLandingConfig({ logoUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Favicon URL de la Pestaña del Navegador</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={saasLandingConfig.faviconUrl || ''}
                    onChange={(e) => updateSaasLandingConfig({ faviconUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                {/* Color Palettes & Quick Presets */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">Paleta de Colores de la Marca</label>
                    <span className="text-[11px] text-slate-400 font-medium">Presets rápidos disponibles</span>
                  </div>

                  {/* Preset Swatches */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { name: 'Ateendia Índigo / Esmeralda', primary: '#4f46e5', accent: '#10b981' },
                      { name: 'Océano Moderno', primary: '#0284c7', accent: '#06b6d4' },
                      { name: 'Púrpura Royal', primary: '#7c3aed', accent: '#ec4899' },
                      { name: 'Sunset Coral', primary: '#ea580c', accent: '#f59e0b' },
                      { name: 'Noche Profunda', primary: '#1e293b', accent: '#6366f1' }
                    ].map((palette, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          updateSaasLandingConfig({
                            primaryColor: palette.primary,
                            accentColor: palette.accent
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: palette.primary }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: palette.accent }} />
                        <span>{palette.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Color Primario</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={saasLandingConfig.primaryColor || '#4f46e5'}
                          onChange={(e) => updateSaasLandingConfig({ primaryColor: e.target.value })}
                          className="w-10 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={saasLandingConfig.primaryColor || '#4f46e5'}
                          onChange={(e) => updateSaasLandingConfig({ primaryColor: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Color Secundario / Acento</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={saasLandingConfig.accentColor || '#10b981'}
                          onChange={(e) => updateSaasLandingConfig({ accentColor: e.target.value })}
                          className="w-10 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={saasLandingConfig.accentColor || '#10b981'}
                          onChange={(e) => updateSaasLandingConfig({ accentColor: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Mini Preview Box */}
              <div className="lg:col-span-5 bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Simulación Visual de Pestaña & URLs Dinámicas
                  </h4>

                  {/* Browser Tab Mock */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: saasLandingConfig.primaryColor || '#4f46e5' }}
                    >
                      {saasLandingConfig.logoIconText || (saasLandingConfig.crmName ? saasLandingConfig.crmName.charAt(0) : 'A')}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {saasLandingConfig.crmName || 'Ateendia'} — CRM SaaS Multi-Empresas de Seguros
                      </div>
                      <div className="text-[11px] text-indigo-600 font-mono truncate font-semibold">
                        {getSaasPublicUrl(saasLandingConfig.crmName, saasLandingConfig.publicUrl, saasLandingConfig.domainName)}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic URLs Inspection */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                    <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                      Propagación Automática de Enlaces:
                    </div>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <span className="font-sans font-medium text-slate-500">Landing Principal:</span>
                        <span className="font-bold text-indigo-700">
                          {getSaasPublicUrl(saasLandingConfig.crmName, saasLandingConfig.publicUrl, saasLandingConfig.domainName)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <span className="font-sans font-medium text-slate-500">Registro Agencias:</span>
                        <span className="font-bold text-indigo-700">
                          {getSaasPublicUrl(saasLandingConfig.crmName, saasLandingConfig.publicUrl, saasLandingConfig.domainName)}/registro-agencias
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <span className="font-sans font-medium text-slate-500">Micro-Landings:</span>
                        <span className="font-bold text-indigo-700">
                          https://[empresa].{saasLandingConfig.domainName || `${saasLandingConfig.crmName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'ateendia'}.cloud`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Business Card Summary */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="font-bold text-slate-800">
                      {saasLandingConfig.companyLegalName || `${saasLandingConfig.crmName || 'Ateendia'} Cloud LLC`}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      📍 {saasLandingConfig.companyAddress || 'Miami, FL, Estados Unidos'}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      ✉️ {saasLandingConfig.supportEmail || `soporte@${saasLandingConfig.domainName || 'ateendia.cloud'}`}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-950 mt-4">
                  <span className="font-bold">✨ Sincronización en Tiempo Real:</span> Al actualizar el nombre, los enlaces, encabezados, correos y páginas web se ajustan inmediatamente.
                </div>
              </div>
            </div>
          )}

          {/* CMS SECTION 2: HERO */}
          {cmsSection === 'hero' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Insignia Superior (Badge)</label>
                  <input
                    type="text"
                    value={saasLandingConfig.heroBadge || ''}
                    onChange={(e) => updateSaasLandingConfig({ heroBadge: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Palabras con Resaltado Degradado</label>
                  <input
                    type="text"
                    value={saasLandingConfig.heroHighlight || ''}
                    onChange={(e) => updateSaasLandingConfig({ heroHighlight: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título Principal (Hero Headline)</label>
                <input
                  type="text"
                  value={saasLandingConfig.heroTitle || ''}
                  onChange={(e) => updateSaasLandingConfig({ heroTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subtítulo Descriptivo</label>
                <textarea
                  rows={3}
                  value={saasLandingConfig.heroSubtitle || ''}
                  onChange={(e) => updateSaasLandingConfig({ heroSubtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Texto Botón de Acción Principal (CTA)</label>
                  <input
                    type="text"
                    value={saasLandingConfig.ctaPrimaryText || ''}
                    onChange={(e) => updateSaasLandingConfig({ ctaPrimaryText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Texto Botón Secundario</label>
                  <input
                    type="text"
                    value={saasLandingConfig.ctaSecondaryText || ''}
                    onChange={(e) => updateSaasLandingConfig({ ctaSecondaryText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CMS SECTION 3: FEATURES */}
          {cmsSection === 'features' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {saasLandingConfig.features?.map((feat, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        Característica #{idx + 1}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={feat.title}
                      onChange={(e) => {
                        const updated = [...(saasLandingConfig.features || [])];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        updateSaasLandingConfig({ features: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                      placeholder="Título de la función"
                    />
                    <textarea
                      rows={2}
                      value={feat.description}
                      onChange={(e) => {
                        const updated = [...(saasLandingConfig.features || [])];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        updateSaasLandingConfig({ features: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      placeholder="Descripción breve..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CMS SECTION 4: PRICING */}
          {cmsSection === 'pricing' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {saasLandingConfig.pricingPlans?.map((plan, idx) => (
                  <div key={plan.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => {
                          const updated = [...(saasLandingConfig.pricingPlans || [])];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          updateSaasLandingConfig({ pricingPlans: updated });
                        }}
                        className="px-2 py-1 rounded border border-slate-200 text-xs font-bold bg-white"
                      />
                      <label className="flex items-center gap-1 text-[11px] font-bold text-indigo-700">
                        <input
                          type="checkbox"
                          checked={plan.popular}
                          onChange={(e) => {
                            const updated = [...(saasLandingConfig.pricingPlans || [])];
                            updated[idx] = { ...updated[idx], popular: e.target.checked };
                            updateSaasLandingConfig({ pricingPlans: updated });
                          }}
                        />
                        <span>Destacado</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">$</span>
                      <input
                        type="number"
                        value={plan.price}
                        onChange={(e) => {
                          const updated = [...(saasLandingConfig.pricingPlans || [])];
                          updated[idx] = { ...updated[idx], price: Number(e.target.value) };
                          updateSaasLandingConfig({ pricingPlans: updated });
                        }}
                        className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black bg-white"
                      />
                      <span className="text-xs text-slate-500 font-semibold">{plan.billingPeriod}</span>
                    </div>

                    <textarea
                      rows={2}
                      value={plan.description}
                      onChange={(e) => {
                        const updated = [...(saasLandingConfig.pricingPlans || [])];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        updateSaasLandingConfig({ pricingPlans: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      placeholder="Descripción del plan..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CMS SECTION 5: TESTIMONIALS */}
          {cmsSection === 'testimonials' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {saasLandingConfig.testimonials?.map((t, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) => {
                          const updated = [...(saasLandingConfig.testimonials || [])];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          updateSaasLandingConfig({ testimonials: updated });
                        }}
                        className="px-2 py-1 rounded border border-slate-200 text-xs font-bold bg-white"
                        placeholder="Nombre"
                      />
                      <input
                        type="text"
                        value={t.company}
                        onChange={(e) => {
                          const updated = [...(saasLandingConfig.testimonials || [])];
                          updated[idx] = { ...updated[idx], company: e.target.value };
                          updateSaasLandingConfig({ testimonials: updated });
                        }}
                        className="px-2 py-1 rounded border border-slate-200 text-xs bg-white"
                        placeholder="Agencia / Empresa"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={t.quote}
                      onChange={(e) => {
                        const updated = [...(saasLandingConfig.testimonials || [])];
                        updated[idx] = { ...updated[idx], quote: e.target.value };
                        updateSaasLandingConfig({ testimonials: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white italic"
                      placeholder="Testimonio..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CMS SECTION 6: FOOTER */}
          {cmsSection === 'footer' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Aviso de Cumplimiento & Privacidad</label>
                <input
                  type="text"
                  value={saasLandingConfig.complianceNotice || ''}
                  onChange={(e) => updateSaasLandingConfig({ complianceNotice: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Texto de Copyright</label>
                <input
                  type="text"
                  value={saasLandingConfig.copyrightText || ''}
                  onChange={(e) => updateSaasLandingConfig({ copyrightText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MICRO-LANDINGS POR EMPRESA */}
      {/* ========================================================================= */}
      {activeTab === 'micro_landings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
            <h3 className="text-base font-black text-slate-900 mb-1">Micro-Landings Informativas Personalizadas</h3>
            <p className="text-xs text-slate-500 mb-6">
              Cada agencia de seguros creada en el CRM cuenta con su propia Micro-Landing pública optimizada para captar
              leads directos que se inyectan en su pipeline y notifican en tiempo real.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tenants.map((t) => {
                const landing = t.landingConfig || {
                  agencyName: t.name,
                  slug: t.subdomain || t.id,
                  tagline: 'Asesoría en seguros de salud y vida',
                  whatsappDirectNumber: '+1 (800) 555-0100',
                  callDirectNumber: '+1 (800) 555-0100',
                  quoteFormEnabled: true
                };

                const publicLandingUrl = getTenantPublicUrl(t, saasLandingConfig);

                return (
                  <div key={t.id} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                          style={{ backgroundColor: t.primaryColor || '#4f46e5' }}
                        >
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <span>{publicLandingUrl}</span>
                            <button
                              onClick={() => handleCopy(publicLandingUrl, t.id)}
                              className="text-slate-400 hover:text-indigo-600"
                            >
                              {copiedUrl === t.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setPreviewTenant(t);
                          setPreviewMode('tenant_agency');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Página</span>
                      </button>
                    </div>

                    <div className="space-y-3 pt-2 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Nombre Comercial en la Micro-Landing
                        </label>
                        <input
                          type="text"
                          value={landing.agencyName}
                          onChange={(e) => updateTenantLandingConfig(t.id, { agencyName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Slogan / Tagline Principal</label>
                        <input
                          type="text"
                          value={landing.tagline}
                          onChange={(e) => updateTenantLandingConfig(t.id, { tagline: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">WhatsApp Directo</label>
                          <input
                            type="text"
                            value={landing.whatsappDirectNumber}
                            onChange={(e) => updateTenantLandingConfig(t.id, { whatsappDirectNumber: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Teléfono Directo PBX</label>
                          <input
                            type="text"
                            value={landing.callDirectNumber}
                            onChange={(e) => updateTenantLandingConfig(t.id, { callDirectNumber: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VPS & BASES DE DATOS EXTERNAS */}
      {/* ========================================================================= */}
      {activeTab === 'vps_database' && <SaasVpsDatabaseSection />}

      {/* ========================================================================= */}
      {/* MODAL: WIZARD DE APROVISIONAMIENTO DE NUEVA EMPRESA */}
      {/* ========================================================================= */}
      {isNewTenantModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Aprovisionamiento Formal de Nueva Empresa</h3>
                  <p className="text-xs text-slate-500">
                    Paso {provisioningStep} de 3: {provisioningStep === 1 ? 'Identidad & Dominio' : provisioningStep === 2 ? 'Aislamiento Lógico de Base de Datos' : 'Plan & Administrador'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewTenantModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    provisioningStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  1
                </span>
                <span className="text-xs font-bold text-slate-800">Identidad & Dominio</span>
              </div>
              <div className="h-0.5 flex-1 bg-slate-200 mx-3"></div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    provisioningStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  2
                </span>
                <span className="text-xs font-bold text-slate-800">Aislamiento DB</span>
              </div>
              <div className="h-0.5 flex-1 bg-slate-200 mx-3"></div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    provisioningStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  3
                </span>
                <span className="text-xs font-bold text-slate-800">Plan & Admin</span>
              </div>
            </div>

            <form onSubmit={handleCreateTenantSubmit} className="space-y-4">
              {/* STEP 1: IDENTITY & DOMAIN */}
              {provisioningStep === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre Comercial de la Empresa / Agencia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Apex Health Advisors"
                      value={tenantFormData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                        setTenantFormData({
                          ...tenantFormData,
                          name,
                          subdomain: tenantFormData.subdomain || slug
                        });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Razón Social Legal</label>
                      <input
                        type="text"
                        placeholder="Apex Health Group LLC"
                        value={tenantFormData.legalName}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, legalName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tax ID / EIN</label>
                      <input
                        type="text"
                        placeholder="EIN-89-982134"
                        value={tenantFormData.taxId}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, taxId: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Subdomain & Custom Domain */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" /> Asignación de Dominio Único
                    </h4>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Subdominio SaaS Dedicado (Micro-Landing & CRM)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          required
                          placeholder="apexhealth"
                          value={tenantFormData.subdomain}
                          onChange={(e) => setTenantFormData({ ...tenantFormData, subdomain: e.target.value })}
                          className="flex-1 px-3.5 py-2 rounded-l-xl border border-slate-200 text-xs font-mono font-bold bg-white"
                        />
                        <span className="px-3 py-2 bg-slate-200 border border-l-0 border-slate-200 rounded-r-xl text-xs font-mono text-slate-600">
                          .{getSaasBaseDomain(saasLandingConfig.crmName, saasLandingConfig.domainName)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Dominio Personalizado (Opcional CNAME)
                      </label>
                      <input
                        type="text"
                        placeholder="seguros.apexhealth.com"
                        value={tenantFormData.customDomain}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, customDomain: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={!tenantFormData.name}
                      onClick={() => setProvisioningStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <span>Siguiente: Aislamiento Lógico</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DATABASE LOGICAL ISOLATION */}
              {provisioningStep === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                      <Lock className="w-4 h-4 text-indigo-600" />
                      <span>Configuración de Partición & Seguridad de Datos</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-indigo-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Clave de Partición DB</div>
                        <div className="font-mono font-bold text-indigo-700 mt-0.5">
                          db_part_{tenantFormData.subdomain || 'tenant'}_{Date.now().toString().slice(-4)}
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-indigo-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Nivel de Cifrado</div>
                        <div className="font-mono font-bold text-emerald-600 mt-0.5">AES-256-GCM + Token Salting</div>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Aislamiento estricto de Pólizas, Clientes y WhatsApp por Tenant ID.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Líneas telefónicas Issabel y credenciales de correo electrónico independientes.</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Color de Marca Primario</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={tenantFormData.primaryColor}
                          onChange={(e) => setTenantFormData({ ...tenantFormData, primaryColor: e.target.value })}
                          className="w-10 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={tenantFormData.primaryColor}
                          onChange={(e) => setTenantFormData({ ...tenantFormData, primaryColor: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cuota de Almacenamiento</label>
                      <select
                        value={tenantFormData.storageQuotaGb}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, storageQuotaGb: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                      >
                        <option value={25}>25 GB SSD Cifrado</option>
                        <option value={100}>100 GB SSD Cifrado</option>
                        <option value={500}>500 GB SSD Dedicado</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setProvisioningStep(1)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={() => setProvisioningStep(3)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <span>Siguiente: Plan & Administrador</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PLAN & INITIAL ADMIN */}
              {provisioningStep === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Plan de Suscripción SaaS</label>
                    <select
                      value={tenantFormData.plan}
                      onChange={(e) => {
                        const p = e.target.value as any;
                        setTenantFormData({
                          ...tenantFormData,
                          plan: p,
                          monthlyPrice: p === 'Starter' ? 79 : p === 'Professional' ? 199 : 499
                        });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Starter">Starter ($79/mes — 5 Usuarios, 1 Línea WhatsApp)</option>
                      <option value="Professional">Professional ($199/mes — 25 Usuarios, 2 Líneas WhatsApp, PBX)</option>
                      <option value="Enterprise">Enterprise ($499/mes — Usuarios Ilimitados, PBX Avanzada)</option>
                    </select>
                  </div>

                  {/* Initial Admin Credentials */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-indigo-600" /> Usuario Administrador Maestro de la Agencia
                    </h4>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Laura Restrepo"
                        value={tenantFormData.adminName}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, adminName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Email de Acceso *</label>
                        <input
                          type="email"
                          required
                          placeholder="admin@empresa.com"
                          value={tenantFormData.adminEmail}
                          onChange={(e) => setTenantFormData({ ...tenantFormData, adminEmail: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                        <input
                          type="text"
                          placeholder="+1 (786) 555-0100"
                          value={tenantFormData.adminPhone}
                          onChange={(e) => setTenantFormData({ ...tenantFormData, adminPhone: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setProvisioningStep(2)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg transition-all"
                    >
                      Finalizar y Aprovisionar Instancia
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVO ADMINISTRADOR DELEGADO */}
      {/* ========================================================================= */}
      {isNewAdminModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Nuevo Administrador Delegado</h3>
                  <p className="text-xs text-slate-500">Define permisos granulares para este usuario superior.</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewAdminModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={adminFormData.name}
                  onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="carlos@saasadmin.com"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Granular Permissions */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Permisos de Acceso Concedidos</h4>

                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={adminFormData.permissions?.viewGlobalMetrics}
                    onChange={(e) =>
                      setAdminFormData({
                        ...adminFormData,
                        permissions: { ...adminFormData.permissions, viewGlobalMetrics: e.target.checked }
                      })
                    }
                  />
                  <span>Ver Métricas Globales de Ingresos y Pólizas</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={adminFormData.permissions?.createTenant}
                    onChange={(e) =>
                      setAdminFormData({
                        ...adminFormData,
                        permissions: { ...adminFormData.permissions, createTenant: e.target.checked }
                      })
                    }
                  />
                  <span>Aprovisionar / Crear Nuevas Empresas</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={adminFormData.permissions?.manageSaasLanding}
                    onChange={(e) =>
                      setAdminFormData({
                        ...adminFormData,
                        permissions: { ...adminFormData.permissions, manageSaasLanding: e.target.checked }
                      })
                    }
                  />
                  <span>Gestionar CMS Landing SaaS General</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAdminModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
                >
                  Crear Administrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Landing Preview Modal */}
      {previewMode && (
        <SaasLandingPreviewModal
          isOpen={!!previewMode}
          onClose={() => setPreviewMode(null)}
          mode={previewMode}
          tenant={previewTenant || currentTenant}
        />
      )}

      {/* Payment Receipt Viewer & Review Modal */}
      {selectedReceiptForReview && (
        <PaymentReceiptViewerModal
          isOpen={!!selectedReceiptForReview}
          onClose={() => setSelectedReceiptForReview(null)}
          receipt={selectedReceiptForReview}
          onApprove={(receiptId, validFrom, validUntil) => {
            approvePaymentReceipt(receiptId, validFrom, validUntil);
            setSelectedReceiptForReview(null);
          }}
          onReject={(receiptId, reason) => {
            rejectPaymentReceipt(receiptId, reason);
            setSelectedReceiptForReview(null);
          }}
        />
      )}

      {/* Confirmation Modal: Reset Tenant Data */}
      {confirmResetTenantId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">¿Resetear datos de la empresa?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Esta acción eliminará de forma irreversible todos los clientes, pólizas, prospectos, leads y mensajes
                de chat generados para la empresa{' '}
                <strong className="text-slate-800">
                  {tenants.find((t) => t.id === confirmResetTenantId)?.name || confirmResetTenantId}
                </strong>
                , dejando la cuenta en estado limpio/inicial.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmResetTenantId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmResetTenantId) {
                    resetTenantData(confirmResetTenantId);
                    setConfirmResetTenantId(null);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirmar Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
