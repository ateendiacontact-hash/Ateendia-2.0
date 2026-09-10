import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Kanban,
  MessageSquare,
  Mail,
  FileText,
  PhoneCall,
  CreditCard,
  Megaphone,
  UploadCloud,
  Palette,
  ShieldCheck,
  History,
  Sparkles,
  Workflow,
  Cpu,
  Building,
  ChevronRight,
  HelpCircle,
  Cloud
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

export type NavigationTab =
  | 'dashboard'
  | 'clients'
  | 'policies'
  | 'pipeline'
  | 'whatsapp'
  | 'email'
  | 'templates'
  | 'issabel'
  | 'telephony'
  | 'banking'
  | 'campaigns'
  | 'saas_central'
  | 'import'
  | 'branding'
  | 'integrations'
  | 'users'
  | 'users_roles'
  | 'audit';

interface SidebarProps {
  activeTab: NavigationTab | string;
  onTabChange?: (tab: NavigationTab) => void;
  setActiveTab?: (tab: string) => void;
  onOpenNewClient?: () => void;
  onOpenImport?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  setActiveTab,
  onOpenNewClient,
  onOpenImport
}) => {
  const { currentTenant, alerts, conversations, chatMessages, can, currentUser } = useTenant();

  const handleSelectTab = (tabId: NavigationTab) => {
    if (onTabChange) onTabChange(tabId);
    if (setActiveTab) setActiveTab(tabId);
  };

  const unreadWhatsApp = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const totalAlertsCount = alerts.length;

  // Check if user is Super Admin
  const isSuperAdmin = currentUser?.isSuperAdmin === true || 
                       currentUser?.email === 'victoraray8@gmail.com';

  const navGroups = [
    {
      title: 'Principal & Clientes',
      items: [
        {
          id: 'dashboard' as NavigationTab,
          label: 'Dashboard Ejecutivo',
          icon: LayoutDashboard,
          badge: totalAlertsCount > 0 ? `${totalAlertsCount}` : undefined,
          badgeColor: 'bg-indigo-50 text-indigo-700'
        },
        {
          id: 'clients' as NavigationTab,
          label: 'Clientes (DDD)',
          icon: Users,
          allowed: can('clients', 'view')
        },
        {
          id: 'policies' as NavigationTab,
          label: 'Pólizas & Miembros',
          icon: FileSpreadsheet,
          allowed: can('policies', 'view')
        },
        {
          id: 'pipeline' as NavigationTab,
          label: 'Pipeline de Ventas',
          icon: Kanban,
          allowed: can('pipeline', 'view')
        }
      ]
    },
    {
      title: 'Comunicaciones & Contacto',
      items: [
        {
          id: 'whatsapp' as NavigationTab,
          label: 'WhatsApp Cloud',
          icon: MessageSquare,
          badge: unreadWhatsApp > 0 ? `${unreadWhatsApp}` : undefined,
          badgeColor: 'bg-emerald-50 text-emerald-700',
          allowed: can('whatsapp', 'view')
        },

        {
          id: 'templates' as NavigationTab,
          label: 'Plantillas de Mensajes',
          icon: FileText
        },
        {
          id: 'telephony' as NavigationTab,
          label: 'Central Telefónica Issabel',
          icon: PhoneCall,
          allowed: can('telephony', 'view')
        }
      ]
    },
{
        title: 'Operaciones & SaaS',
        items: [
          {
            id: 'saas_central' as NavigationTab,
            label: 'Central SaaS Multiempresa',
            icon: Building,
            badge: 'Super Admin',
            badgeColor: 'bg-indigo-100 text-indigo-700 font-bold',
            allowed: isSuperAdmin
          },
        {
          id: 'banking' as NavigationTab,
          label: 'Métodos de Pago',
          icon: CreditCard,
          allowed: can('banking', 'view')
        },
        {
          id: 'campaigns' as NavigationTab,
          label: 'Campañas & Reportes',
          icon: Megaphone,
          allowed: can('campaigns', 'view')
        }
      ]
    },
    {
      title: 'Configuración & Empresa',
      items: [
        {
          id: 'integrations' as NavigationTab,
          label: 'Integraciones',
          icon: Workflow,
          badge: 'n8n • IA',
          badgeColor: 'bg-purple-100 text-purple-700 font-bold',
          allowed: true
        },
        {
          id: 'branding' as NavigationTab,
          label: 'Personalización & Catálogos',
          icon: Palette,
          allowed: can('branding', 'view')
        },
        {
          id: 'users' as NavigationTab,
          label: 'Roles & Permisos (RBAC)',
          icon: ShieldCheck,
          allowed: can('users', 'view')
        },
        {
          id: 'audit' as NavigationTab,
          label: 'Auditoría Inmutable',
          icon: History,
          allowed: can('audit', 'view')
        }
      ]
    }
  ];

  const integrationsSubItems = [
    {
      id: 'whatsapp_cloud_api' as NavigationTab,
      label: 'Redes & WhatsApp',
      icon: Cloud,
      badge: 'QR • Cloud • Meta',
      badgeColor: 'bg-blue-50 text-blue-700',
      allowed: true
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header with Sleek Icon Badge */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-100 transition-transform hover:scale-105"
          style={{ backgroundColor: currentTenant.primaryColor || '#4f46e5' }}
        >
          {currentTenant.name.charAt(0)}
        </div>
        <div className="overflow-hidden">
          <h1 className="text-sm font-bold text-slate-900 truncate tracking-tight">
            {currentTenant.name}
          </h1>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Ateendia CRM</span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter((item) => item.allowed !== false);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1.5">
              <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {group.title}
              </div>
              <div className="space-y-1 pt-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (item.id === 'telephony' && activeTab === 'issabel') || (item.id === 'users' && activeTab === 'users_roles');
                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-bold'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                            item.badgeColor || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Ateendia v3.0</span>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-bold">
            Hexagonal + AI
          </span>
        </div>
      </div>
    </aside>
  );
};
