/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TenantProvider, useTenant } from './context/TenantContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { ClientsListView } from './components/clients/ClientsListView';
import { ClientModal } from './components/clients/ClientModal';
import { ClientFormModal } from './components/clients/ClientFormModal';
import { PolicyFormModal } from './components/policies/PolicyFormModal';
import { PoliciesListView } from './components/policies/PoliciesListView';
import { AlertsCenterModal } from './components/alerts/AlertsCenterModal';
import { NotificationCenterPopover } from './components/notifications/NotificationCenterPopover';
import { LiveNotificationToast } from './components/notifications/LiveNotificationToast';
import { SaasCentralDashboard } from './components/saas/SaasCentralDashboard';
import { PipelineView } from './components/pipeline/PipelineView';
import { WhatsAppModule } from './components/whatsapp/WhatsAppModule';
import { WhatsAppCloudSection } from './components/whatsapp/WhatsAppCloudSection';
import { SmtpConfigModule } from './components/email/SmtpConfigModule';
import { TemplatesModule } from './components/templates/TemplatesModule';
import { InternalChatModule } from './components/chat/InternalChatModule';

import { IssabelModule } from './components/telephony/IssabelModule';
import { FloatingDialer } from './components/telephony/FloatingDialer';
import { BankingModule } from './components/banking/BankingModule';
import { CampaignsModule } from './components/campaigns/CampaignsModule';
import { CompanyBrandingModule } from './components/branding/CompanyBrandingModule';
import { UsersRolesModule } from './components/users/UsersRolesModule';
import { AuditTrailModule } from './components/audit/AuditTrailModule';
import { IntegrationsModule } from './components/integrations/IntegrationsModule';
import { MassImportModal } from './components/import/MassImportModal';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { SaasLandingPreviewModal } from './components/saas/SaasLandingPreviewModal';
import { SuspendedCompanyLockScreen } from './components/saas/SuspendedCompanyLockScreen';
import { TenantUpgradeView } from './components/saas/TenantUpgradeView';
import { TenantBranding } from './types';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { FirstLoginPasswordChangeView } from './components/auth/FirstLoginPasswordChangeView';
import { authService } from './services/authService';

const AppContent: React.FC = () => {
  const {
    clients,
    policies,
    currentTenant,
    currentUser,
    setCurrentTenantId,
    setCurrentTenant,
    setCurrentUser,
    users,
    logoutUser: contextLogoutUser,
    saasLandingConfig,
    activeConversationId,
    setActiveConversationId,
    fetchClients,
    fetchPolicies,
     // ─── NUEVO (Sesión 3.5.B.4.e.3): Modo impersonación ───
  activeTenantId,
// ─── NUEVO: Refrescar tenants reales tras login ───
  refreshSaasTenants,
} = useTenant();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register' | 'firstLoginPasswordChange'>('login');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modal states
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [isPolicyFormOpen, setIsPolicyFormOpen] = useState(false);
  const [policyFormClientId, setPolicyFormClientId] = useState<string>('');
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [isAlertsCenterOpen, setIsAlertsCenterOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isLandingPreviewOpen, setIsLandingPreviewOpen] = useState(false);
  const [landingPreviewMode, setLandingPreviewMode] = useState<'saas_master' | 'tenant_agency'>('tenant_agency');
  const [landingPreviewTenant, setLandingPreviewTenant] = useState<TenantBranding | null>(null);

  // ─── Check auth on mount ───
  /**
   * Carga el estado del usuario autenticado desde `authService`.
   *
   * ⚠️ IMPORTANTE (Sesión 3.5.B.4.e.3):
   * Cuando el Super Admin está impersonando un tenant (`activeTenantId !== null`),
   * NO debemos sobrescribir `currentTenant` con el tenant original del login.
   * Eso haría que el branding del tenant impersonado se pierda cada vez que
   * el componente se remonta.
   *
   * Solución: chequear `activeTenantId` antes de llamar a `setCurrentTenant`.
   */
  useEffect(() => {
  const checkAuth = async () => {
    const state = authService.getState();
    if (state.isAuthenticated && state.user) {
      setIsAuthenticated(true);
      if (state.user) setCurrentUser(state.user);
      if (state.tenant && activeTenantId === null) {
        setCurrentTenant(state.tenant);
      }
      // ─── NUEVO: si es Super Admin, cargar tenants reales ───
      // El JWT ya está en localStorage después del login exitoso,
      // así que `refreshSaasTenants` puede funcionar.
      if (state.user?.role === 'saas_super_admin') {
        refreshSaasTenants();
      }
    }
    setAuthChecked(true);
  };
  checkAuth();

  // Suscribirse a cambios del authService
  const unsubscribe = authService.subscribe((state) => {
    setIsAuthenticated(state.isAuthenticated);
    if (state.user) setCurrentUser(state.user);
    if (state.tenant && activeTenantId === null) {
      setCurrentTenant(state.tenant);
    }
    // ─── NUEVO: mismo fix para la suscripción ───
    if (state.isAuthenticated && state.user?.role === 'saas_super_admin') {
      refreshSaasTenants();
    }
  });

  return () => { unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTenantId]);

  const handleLoginSuccess = (mustResetPassword: boolean = false) => {
    setIsAuthenticated(true);
    // Si el usuario debe cambiar la contraseña, redirigir a la vista
    // de primer login en lugar de cargar el dashboard.
    if (mustResetPassword) {
      setAuthView('firstLoginPasswordChange');
      return;
    }
    // Cargar datos iniciales después del login
    fetchClients();
    fetchPolicies();
  };

  const handleLogout = async () => {
    await authService.logout();
    contextLogoutUser();
    setIsAuthenticated(false);
    // Clear any local storage related to session
    localStorage.removeItem('pb_auth');
  };

  const handleOpenClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsClientModalOpen(true);
  };

  const handleOpenNewClient = () => {
    setEditingClient(null);
    setIsClientFormOpen(true);
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setIsClientFormOpen(true);
  };

  const handleOpenNewPolicy = (clientId: string) => {
    setPolicyFormClientId(clientId);
    setEditingPolicy(null);
    setIsPolicyFormOpen(true);
  };

  const handleEditPolicy = (policy: any) => {
    setPolicyFormClientId(policy.clientId);
    setEditingPolicy(policy);
    setIsPolicyFormOpen(true);
  };

  // Show loading spinner while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/25 animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      </div>
    );
  }

  // ─── VISTA DE CAMBIO OBLIGATORIO DE CONTRASEÑA ───
  // Se chequea ANTES del check de isAuthenticated porque el usuario
  // YA está autenticado (isAuthenticated=true) pero debe cambiar la
  // contraseña antes de ver el dashboard.
  if (authView === 'firstLoginPasswordChange') {
    return (
      <FirstLoginPasswordChangeView
        onSuccess={() => {
          // Al cambiar la contraseña con éxito, redirigir al dashboard
          setAuthView('login');
          fetchClients();
          fetchPolicies();
        }}
        onLogout={handleLogout}
      />
    );
  }

  // ─── VISTAS DE LOGIN / REGISTRO ───
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterView onBackToLogin={() => setAuthView('login')} />;
    }
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onGoToRegister={() => setAuthView('register')}
      />
    );
  }

  const handleOpenMicroLanding = () => {
    setLandingPreviewTenant(currentTenant);
    setLandingPreviewMode('tenant_agency');
    setIsLandingPreviewOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Main App Layout */}
      <div className="flex h-full w-full">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewClient={handleOpenNewClient}
          onOpenImport={() => setIsImportModalOpen(true)}
        />

        {/* Right Section: Header + Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Header */}
          <Header
            onOpenAlerts={() => setIsAlertsCenterOpen(true)}
            onOpenNotifications={() => setIsNotificationCenterOpen(true)}
            onOpenSearch={() => setIsGlobalSearchOpen(true)}
            onOpenMicroLanding={handleOpenMicroLanding}
            onLogout={handleLogout}
          />

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
            {currentTenant?.subscription?.status === 'suspended' && activeTab !== 'saas_central' ? (
              <SuspendedCompanyLockScreen />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <ExecutiveDashboard
                    onOpenClient={handleOpenClient}
                    onOpenAlerts={() => setIsAlertsCenterOpen(true)}
                    onOpenNewClient={handleOpenNewClient}
                    onNavigateToTab={setActiveTab}
                  />
                )}

                {activeTab === 'clients' && (
                  <ClientsListView
                    onOpenClient={handleOpenClient}
                    onOpenNewClient={handleOpenNewClient}
                    onOpenImport={() => setIsImportModalOpen(true)}
                    onNavigateToTab={setActiveTab}
                  />
                )}

                {activeTab === 'policies' && (
                  <PoliciesListView
                    onOpenClient={handleOpenClient}
                    onOpenNewPolicy={handleOpenNewPolicy}
                    onEditPolicy={handleEditPolicy}
                    onNavigateToTab={setActiveTab}
                  />
                )}

                {activeTab === 'pipeline' && (
                  <PipelineView
                    onOpenClient={handleOpenClient}
                    onOpenNewClient={handleOpenNewClient}
                    onNavigateToTab={setActiveTab}
                  />
                )}

                {activeTab === 'saas_central' && (
                  <SaasCentralDashboard />
                )}

                {activeTab === 'banking' && (
                  <BankingModule onOpenClient={handleOpenClient} />
                )}

                {activeTab === 'whatsapp' && <WhatsAppModule onNavigateToTab={setActiveTab} />}

                {activeTab === 'email' && <SmtpConfigModule />}

                {activeTab === 'templates' && <TemplatesModule />}

                {activeTab === 'chat' && <InternalChatModule />}

                {activeTab === 'telephony' && <IssabelModule />}
                {activeTab === 'issabel' && <IssabelModule />}

                {activeTab === 'campaigns' && <CampaignsModule />}

                                {activeTab === 'upgrade' && (
                  <TenantUpgradeView
                    onBackToDashboard={() => setActiveTab('dashboard')}
                  />
                )}

                {activeTab === 'branding' && <CompanyBrandingModule />}

                {activeTab === 'integrations' && <IntegrationsModule />}

                {activeTab === 'users' && <UsersRolesModule />}

                {activeTab === 'audit' && <AuditTrailModule />}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Floating Issabel Softphone Dialer */}
      <FloatingDialer />

      {/* Real-time Toast Alerts */}
      <LiveNotificationToast
        onNavigateToTab={setActiveTab}
        onOpenClient={handleOpenClient}
      />

      {/* Modals */}
      {isClientModalOpen && selectedClientId && (
        <ClientModal
          isOpen={isClientModalOpen}
          clientId={selectedClientId}
          onClose={() => setIsClientModalOpen(false)}
          onEditClient={handleEditClient}
          onNewPolicy={handleOpenNewPolicy}
          onEditPolicy={handleEditPolicy}
          onNavigateToTab={setActiveTab}
        />
      )}

      {isClientFormOpen && (
        <ClientFormModal
          isOpen={isClientFormOpen}
          onClose={() => setIsClientFormOpen(false)}
          clientToEdit={editingClient}
        />
      )}

      {isPolicyFormOpen && (
        <PolicyFormModal
          isOpen={isPolicyFormOpen}
          clientId={policyFormClientId}
          onClose={() => setIsPolicyFormOpen(false)}
          policyToEdit={editingPolicy}
        />
      )}

      <AlertsCenterModal
        isOpen={isAlertsCenterOpen}
        onClose={() => setIsAlertsCenterOpen(false)}
        onOpenClient={handleOpenClient}
        onNavigateToTab={setActiveTab}
      />

      <NotificationCenterPopover
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onOpenClient={handleOpenClient}
        onNavigateToTab={setActiveTab}
      />

      <MassImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onSelectClient={handleOpenClient}
        onNavigateTab={setActiveTab}
      />

      <SaasLandingPreviewModal
        isOpen={isLandingPreviewOpen}
        onClose={() => setIsLandingPreviewOpen(false)}
        mode={landingPreviewMode}
        tenant={landingPreviewTenant || currentTenant}
      />
    </div>
  );
};

/**
 * Componente principal de la aplicación.
 *
 * ─── Sesión 3.5.B.4.e.3 ───
 * Se ELIMINÓ el wrapper `<AppContentKeyed>` que forzaba un remount de
 * `<AppContent>` al cambiar el tenant activo. Ese remount generaba:
 *   - Doble click requerido para entrar a una instancia.
 *   - Reset del `activeTab` a 'dashboard'.
 *   - Reset de `isAuthenticated` a false.
 *   - 3 fetches simultáneos en cascada.
 *
 * El re-fetch de datos al cambiar de tenant ahora lo maneja el
 * `useEffect` dentro de `TenantContext` (que depende de `activeTenantId`).
 * Los componentes consumidores se re-renderizan automáticamente cuando
 * `clients` y `policies` cambian de valor en el contexto.
 */
export default function App() {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
}