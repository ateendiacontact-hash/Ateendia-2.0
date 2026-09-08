import React, { useState } from 'react';
import {
  Bell,
  Search,
  PhoneCall,
  Shield,
  Building2,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Lock,
  LogOut,
  Sparkles,
  PhoneForwarded,
  AlertTriangle,
  Globe,
  ExternalLink,
  User,
  Camera,
  Settings,
  Crown,
  ArrowRightLeft,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { getTenantPublicUrl } from '../../utils/urlUtils';
import { isGlobalSuperAdmin } from '../../services/pocketbase';
import { ProfileModal } from './ProfileModal';

interface HeaderProps {
  onOpenAlerts: () => void;
  onOpenNotifications?: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenSearch?: () => void;
  onOpenMicroLanding?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAlerts,
  onOpenNotifications,
  onOpenGlobalSearch,
  onOpenSearch,
  onOpenMicroLanding,
  onLogout
}) => {
  const triggerSearch = onOpenGlobalSearch || onOpenSearch || (() => {});
  const {
    currentTenant,
    currentTenantLandingConfig,
    tenants,
    setCurrentTenantId,
    currentUser,
    setCurrentUserId,
    users,
    alerts,
    appNotifications,
    showSoftphone,
    setShowSoftphone,
    activeCall,
    updateTenantBranding,
    saasLandingConfig
  } = useTenant();

  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    agent: 'Agente Asesor',
    readonly: 'Solo Lectura',
    super_admin: 'Super Admin Global'
  };

  const roleBadgeColors: Record<string, string> = {
    admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    supervisor: 'bg-blue-50 text-blue-700 border-blue-200',
    agent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    readonly: 'bg-slate-100 text-slate-700 border-slate-200',
    super_admin: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  const highPriorityAlertsCount = alerts.filter((a) => a.priority === 'high').length;
  const unreadNotificationsCount = appNotifications.filter((n) => !n.read).length;

  const isSuperAdminGlobal = isGlobalSuperAdmin();

  // HARDCODED: 3 empresas para Super Admin Global (victoraray8@gmail.com)
  const SUPER_ADMIN_TENANTS = [
    { id: 'tenant-ateendia', name: 'Ateendia Seguros', type: 'Enterprise', primaryColor: '#4f46e5' },
    { id: 'tenant-optima', name: 'Optima Health Brokers', type: 'Pro Business', primaryColor: '#059669' },
    { id: 'tenant-sol', name: 'Seguros Sol Naciente', type: 'Starter', primaryColor: '#dc2626' },
  ];

  // Super Admin Global: tenant selector shows hardcoded 3 companies
  const tenantOptions = isSuperAdminGlobal ? SUPER_ADMIN_TENANTS : tenants.filter(t => t.id === currentTenant.id);

  // Get display name and role for Super Admin
  const displayName = isSuperAdminGlobal ? 'Víctor Aray (Super Admin)' : (currentUser?.name || 'Usuario');
  const displayRole = isSuperAdminGlobal ? 'Super Admin Global 👑' : (roleLabels[currentUser?.role] || currentUser?.role || 'Admin');
  const displayRoleColor = isSuperAdminGlobal ? 'bg-purple-100 text-purple-700 border-purple-200/60' : (roleBadgeColors[currentUser?.role] || 'bg-slate-100 text-slate-700 border-slate-200');

  return (
    <header className="h-16 sm:h-20 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between flex-shrink-0 shadow-xs">
      {/* Left: Tenant Selector & Global Search */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Tenant Switcher with Sleek badge */}
        <div className="relative">
          <button
            id="tenant-switcher-btn"
            onClick={() => setShowTenantDropdown(!showTenantDropdown)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-left group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs"
              style={{ backgroundColor: currentTenant.primaryColor || '#4f46e5' }}
            >
              {currentTenant.name.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                {currentTenant.name}
                {isSuperAdminGlobal && (
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-purple-200/60 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    <span>Modo Fantasma</span>
                  </span>
                )}
                {!isSuperAdminGlobal && (
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-indigo-100/60">
                    {saasLandingConfig?.crmName ? saasLandingConfig.crmName.replace(/saas\s*cloud\s*crm/i, 'Cloud').trim() : 'Cloud CRM'}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Tenant ID: {currentTenant.id}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </button>

          {showTenantDropdown && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                {isSuperAdminGlobal ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-purple-600" />
                    <span>Aislamiento Multi-Empresa (Super Admin Global)</span>
                  </>
                ) : (
                  <span>Aislamiento Multi-Empresa</span>
                )}
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {tenantOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setCurrentTenantId(t.id);
                      setShowTenantDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${
                      t.id === currentTenant.id ? 'bg-indigo-50/80 font-bold text-indigo-900' : ''
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs"
                      style={{ backgroundColor: t.primaryColor || '#4f46e5' }}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div className="flex-1 truncate">
                      <div className="text-xs text-slate-800 truncate">{t.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.id}</div>
                    </div>
                    {t.id === currentTenant.id && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                    {isSuperAdminGlobal && t.id !== currentTenant.id && (
                      <ArrowRightLeft className="w-4 h-4 text-purple-500 shrink-0 opacity-70" title="Cambiar a esta empresa" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 my-1"></div>
              {isSuperAdminGlobal && (
                <button
                  onClick={() => {
                    setShowTenantDropdown(false);
                    // Navigate to SaaS Central to create new company
                    window.location.href = '/saas_central';
                  }}
                  className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-purple-50 text-purple-700 text-xs font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Crear Nueva Empresa</span>
                </button>
              )}
              <div className="px-3 py-1.5">
                <span className="text-[10px] text-slate-500">
                  {isSuperAdminGlobal 
                    ? 'Super Admin Global: acceso transparente a todas las empresas.' 
                    : 'Cada empresa aísla estrictamente sus clientes, pólizas y métricas.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Global Quick Search */}
        <button
          id="global-search-trigger"
          onClick={triggerSearch}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs transition-colors w-40 sm:w-64"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">Buscar cliente, póliza...</span>
          <kbd className="hidden md:inline-block ml-auto text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded-md text-slate-400 font-mono shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Issabel PBX Status + Alerts Center + User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Issabel Telephony Status / Dialer Toggle */}
        <button
          id="toggle-softphone-btn"
          onClick={() => setShowSoftphone(!showSoftphone)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            activeCall && activeCall.active
              ? 'bg-emerald-500 text-white border-emerald-600 animate-pulse shadow-sm'
              : showSoftphone
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
          }`}
          title="Central Telefónica Issabel PBX"
        >
          <div className="relative">
            <PhoneCall className={`w-4 h-4 ${activeCall?.active ? 'text-white' : 'text-emerald-600'}`} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
          </div>
          <span className="hidden sm:inline">
            {activeCall?.active
              ? `En llamada (${Math.floor(activeCall.duration / 60)}:${String(activeCall.duration % 60).padStart(2, '0')})`
              : `Ext. ${currentUser.extension || '101'}`}
          </span>
        </button>

        {/* Company Informative Micro-Landing Access Icon */}
        <button
          id="header-microlanding-btn"
          onClick={onOpenMicroLanding}
          className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-700 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-200 transition-all shadow-2xs group"
          title={`Micro-Landing Informativa de ${currentTenant.name} (${getTenantPublicUrl(currentTenant, saasLandingConfig?.crmName)})`}
        >
          <div className="relative">
            <Globe className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </div>
          <span className="hidden xl:inline text-xs font-bold text-slate-700 group-hover:text-indigo-900">
            Landing Web
          </span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 hidden sm:inline" />
        </button>

        {/* Real-time Live Notification Center (WhatsApp & Policies) */}
        <button
          id="header-notifications-btn"
          onClick={onOpenNotifications || onOpenAlerts}
          className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-200 transition-colors"
          title="Notificaciones en Tiempo Real (WhatsApp y Pólizas)"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-black text-white bg-red-500 shadow-xs animate-bounce">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Automatic Alerts Center */}
        <button
          id="header-alerts-btn"
          onClick={onOpenAlerts}
          className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
          title="Centro de Alertas Automáticas (Renovaciones, Pagos)"
        >
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          {alerts.length > 0 && (
            <span
              className={`absolute top-1.5 right-1.5 flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold text-white shadow-xs ${
                highPriorityAlertsCount > 0 ? 'bg-red-500' : 'bg-indigo-600'
              }`}
            >
              {alerts.length}
            </span>
          )}
        </button>

        {/* User Profile & Role Switcher */}
        <div className="relative border-l border-slate-200 pl-3 sm:pl-4">
          {/* Profile click opens modal, chevron opens dropdown */}
          <div className="flex items-center gap-3">
            <button
              id="user-profile-btn"
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 transition-colors group"
              title="Mi Perfil"
            >
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-slate-900 leading-tight">{displayName}</p>
                <p className="text-[10px] text-slate-500">{displayRole}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-xs">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span>{((currentUser?.name || 'US').split(' ').filter(Boolean).map((n) => n[0]).join('') || 'US').slice(0, 2).toUpperCase()}</span>
                )}
              </div>
            </button>
            
            {/* Dropdown for role switching and logout */}
            <button
              id="user-dropdown-btn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="p-1.5 rounded-xl hover:bg-slate-50 transition-colors group text-slate-400 hover:text-slate-600"
              title="Opciones de usuario"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${displayRoleColor}`}>
                    {displayRole}
                  </span>
                  <span className="text-[10px] text-slate-400">Ext: #{currentUser.extension}</span>
                </div>
              </div>

              <div className="px-1 pt-1">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}

{/* Profile Modal */}
          <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
        </div>
        </div>
      </header>
    );
  };
