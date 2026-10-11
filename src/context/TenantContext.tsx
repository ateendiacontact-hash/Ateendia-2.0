import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { TenantBranding, Policy, User, BankAccount } from '../types';

interface TenantContextType {
  clients: any[];
  policies: Policy[];
  currentTenant: TenantBranding;
  currentUser: User | null;
  users: User[];
  activeConversationId: string | null;
  saasLandingConfig: any;
  loadingClients: boolean;
  alerts: any[];
  notifications: any[];
  appNotifications: any[];
  conversations: any[];
  campaigns: any[];
  pipelines: any[];
  bankAccounts: BankAccount[];
  documents: any[];
  notes: any[];
  activities: any[];

  fetchClients: () => Promise<void>;
  addClient: (newClientData: any) => Promise<any>;
  updateClient: (id: string, updatedData: any) => Promise<any>;
  deleteClient: (id: string) => Promise<void>;

  fetchPolicies?: () => Promise<void>;
  addPolicy?: (policyData: any) => Promise<any>;
  updatePolicy?: (id: string, policyData: any) => Promise<any>;
  deletePolicy?: (id: string) => Promise<void>;

  fetchBankAccounts?: () => Promise<void>;
  addBankAccount?: (accountData: any) => Promise<any>;
  updateBankAccount?: (id: string, accountData: any) => Promise<any>;
  deleteBankAccount?: (id: string) => Promise<void>;
  setDefaultPaymentMethod?: (clientId: string, accountId: string) => Promise<void>;

  setCurrentTenantId: (id: string) => void;
  setCurrentTenant: (tenant: any) => void;
  setCurrentUser: (user: any) => void;
  setActiveConversationId: (id: string | null) => void;
  logoutUser: () => void;
  updateUser?: (userData: any) => Promise<any>;
  can: (module: string, action: string) => boolean;

  markAppNotificationRead?: (id: string) => void;
  markAllAppNotificationsRead?: () => void;
  deleteAppNotification?: (id: string) => void;
  browserNotificationPermission?: string;
  requestBrowserNotificationPermission?: () => void;
  simulateIncomingWhatsAppMessage?: (...args: any[]) => void;
  simulatePolicyStatusChange?: (...args: any[]) => void;
  simulateWebLeadQuoteRequest?: (...args: any[]) => void;
  startWhatsAppConversation?: (...args: any[]) => void;
  startCall?: (...args: any[]) => void;
  tenants?: any[];
  usersList?: any[];
  showSoftphone?: boolean;
  setShowSoftphone?: (show: boolean) => void;
  activeCall?: any;
  updateTenantBranding?: (data: any) => void;
  currentTenantLandingConfig?: any;

  // Extensión SaaS Central
  createTenant?: (tenantData: any, adminData: any) => void;
  updateTenantSubscription?: (tenantId: string, subscriptionData: any) => void;
  updateTenantSubscriptionPlan?: (tenantId: string, planName: string) => void;
  toggleTenantStatus?: (tenantId: string) => void;
  resetTenantData?: (tenantId: string) => void;
  saasAdmins?: any[];
  addSaasAdmin?: (adminData: any) => void;
  updateSaasAdmin?: (id: string, adminData: any) => void;
  deleteSaasAdmin?: (id: string) => void;
  updateSaasLandingConfig?: (config: any) => void;
  updateTenantLandingConfig?: (tenantId: string, config: any) => void;
  saasPlans?: any[];
  updateSaasPlans?: (plans: any[]) => void;
  saasSmtpConfig?: any;
  updateSaasSmtpConfig?: (config: any) => void;
  saasNotificationTemplates?: any[];
  updateSaasNotificationTemplates?: (templates: any[]) => void;
  testSaasSmtpConnection?: (config: any) => Promise<boolean>;
  saasWhatsAppCentralConfig?: any;
  updateSaasWhatsAppCentralConfig?: (config: any) => void;
  sendWhatsAppCentralTestMessage?: (phone: string, text: string) => Promise<boolean>;
  saasPaymentReceipts?: any[];
  approvePaymentReceipt?: (receiptId: string, validFrom?: string, validUntil?: string) => void;
  rejectPaymentReceipt?: (receiptId: string, reason?: string) => void;
  globalSaasMetrics?: any;
  catalogs?: any;
}

const defaultTenant: TenantBranding = {
  id: 'tenant-demo',
  name: 'Clínica Demo Ateendia',
  tagline: 'Sistema Integrado CRM',
  logoUrl: '',
  primaryColor: '#7c3aed',
  secondaryColor: '#06B6D4',
  clientCategories: ['Salud / ACA', 'Vida', 'Dental', 'Visión', 'Medicare'],
  policyTypes: ['Salud ACA', 'Vida Término', 'IUL', 'Dental', 'Suplementario'],
  subscription: {
    status: 'active',
    plan: 'enterprise',
    validUntil: '2026-12-31',
  },
};

const defaultUser: User = {
  id: 'usr-superadmin',
  name: 'Víctor Medina',
  email: 'victoraray8@gmail.com',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
};

const initialClientsMock = [
  { id: 'cli-1', name: 'Carlos Mendoza', email: 'carlos.mendoza@email.com', phone: '+13059803321', status: 'active', type: 'Salud / ACA' },
  { id: 'cli-2', name: 'Mariana Valenzuela', email: 'mariana.v@email.com', phone: '+17864508912', status: 'lead', type: 'Vida' },
  { id: 'cli-3', name: 'Roberto Gómez', email: 'roberto.gomez@email.com', phone: '+13055550199', status: 'active', type: 'Dental' }
];

const initialPoliciesMock: Policy[] = [
  { id: 'pol-1', policyNumber: 'POL-98210', clientId: 'cli-1', clientName: 'Carlos Mendoza', insuranceCarrier: 'Ambetter Health', policyType: 'Salud ACA', status: 'Activa', premiumAmount: 350, startDate: '2026-01-01', endDate: '2026-12-31' },
  { id: 'pol-2', policyNumber: 'POL-44102', clientId: 'cli-2', clientName: 'Mariana Valenzuela', insuranceCarrier: 'National General', policyType: 'Vida Término', status: 'En Proceso', premiumAmount: 120, startDate: '2026-02-01', endDate: '2027-02-01' }
];

const normalizeTenantData = (rawTenant: any): TenantBranding => {
  if (!rawTenant) return defaultTenant;
  return {
    id: rawTenant.id || defaultTenant.id,
    name: rawTenant.name || defaultTenant.name,
    tagline: rawTenant.tagline || defaultTenant.tagline,
    logoUrl: rawTenant.logo_url || rawTenant.logoUrl || '',
    primaryColor: rawTenant.primary_color || rawTenant.primaryColor || '#7c3aed',
    secondaryColor: rawTenant.secondary_color || rawTenant.secondaryColor || '#06B6D4',
    clientCategories: rawTenant.clientCategories || defaultTenant.clientCategories,
    policyTypes: rawTenant.policyTypes || defaultTenant.policyTypes,
    subscription: rawTenant.subscription || defaultTenant.subscription,
  };
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<any[]>(initialClientsMock);
  const [policies, setPolicies] = useState<Policy[]>(initialPoliciesMock);
  const [currentTenant, setCurrentTenantState] = useState<TenantBranding>(defaultTenant);
  const [currentUser, setCurrentUserState] = useState<User | null>(defaultUser);
  const [users, setUsers] = useState<User[]>([defaultUser]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [saasLandingConfig, setSaasLandingConfig] = useState<any>({
    crmName: 'Ateendia',
    publicUrl: 'https://ateendia.cloud',
    domainName: 'ateendia.cloud',
    primaryColor: '#4f46e5',
    accentColor: '#10b981',
    clientCategories: ['Salud / ACA', 'Vida', 'Dental', 'Visión', 'Medicare'],
    features: [],
    pricingPlans: [],
    testimonials: []
  });
  const [loadingClients, setLoadingClients] = useState<boolean>(false);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [appNotifications, setAppNotifications] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [showSoftphone, setShowSoftphone] = useState<boolean>(false);

  const [tenants, setTenants] = useState<any[]>([defaultTenant]);
  const [saasAdmins, setSaasAdmins] = useState<any[]>([]);
  const [saasPlans, setSaasPlans] = useState<any[]>([]);
  const [saasSmtpConfig, setSaasSmtpConfig] = useState<any>({ isEnabled: false });
  const [saasNotificationTemplates, setSaasNotificationTemplates] = useState<any[]>([]);
  const [saasWhatsAppCentralConfig, setSaasWhatsAppCentralConfig] = useState<any>({ isEnabled: false });
  const [saasPaymentReceipts, setSaasPaymentReceipts] = useState<any[]>([]);
  const [globalSaasMetrics, setGlobalSaasMetrics] = useState<any>({ totalMrr: 0 });

  // Control estricto para evitar re-ejecuciones continuas
  const fetchedTenantRef = useRef<string | null>(null);
  // Ref para el tenant actual (evita deps cíclicas en fetchClients/fetchPolicies)
  const currentTenantIdRef = useRef<string>(defaultTenant.id);

  // Mantener el ref sincronizado
  useEffect(() => {
    currentTenantIdRef.current = currentTenant.id || 'tenant-demo';
  }, [currentTenant.id]);

  // ─── Setters con referencias estables (useCallback) ───
  const setCurrentTenant = useCallback((tenant: any) => {
    const normalized = normalizeTenantData(tenant);
    setCurrentTenantState(normalized);
  }, []);

  const setCurrentUser = useCallback((user: any) => {
    setCurrentUserState(user ? { ...defaultUser, ...user } : null);
  }, []);

  const setCurrentTenantId = useCallback((id: string) => {
    setCurrentTenantState((prev) => ({ ...prev, id }));
  }, []);

  const can = (module: string, action: string): boolean => true;

  const createTenant = (tenantData: any, adminData: any) => {
    const newT = { ...defaultTenant, ...tenantData, id: `tenant-${Date.now()}` };
    setTenants((prev) => [...prev, newT]);
  };
  const updateTenantSubscription = (tenantId: string, subscriptionData: any) => {};
  const updateTenantSubscriptionPlan = (tenantId: string, planName: string) => {};
  const toggleTenantStatus = (tenantId: string) => {};
  const resetTenantData = (tenantId: string) => {};
  const addSaasAdmin = (adminData: any) => {
    setSaasAdmins((prev) => [...prev, { ...adminData, id: `adm-${Date.now()}` }]);
  };
  const updateSaasAdmin = (id: string, adminData: any) => {};
  const deleteSaasAdmin = (id: string) => {
    setSaasAdmins((prev) => prev.filter((a) => a.id !== id));
  };
  const updateSaasLandingConfig = (config: any) => {
    setSaasLandingConfig((prev: any) => ({ ...prev, ...config }));
  };
  const updateTenantLandingConfig = (tenantId: string, config: any) => {};
  const updateSaasPlans = (plans: any[]) => setSaasPlans(plans);
  const updateSaasSmtpConfig = (config: any) => setSaasSmtpConfig(config);
  const updateSaasNotificationTemplates = (templates: any[]) => setSaasNotificationTemplates(templates);
  const testSaasSmtpConnection = async () => true;
  const updateSaasWhatsAppCentralConfig = (config: any) => setSaasWhatsAppCentralConfig(config);
  const sendWhatsAppCentralTestMessage = async () => true;
  const approvePaymentReceipt = (receiptId: string) => {};
  const rejectPaymentReceipt = (receiptId: string) => {};

  // ─── fetchClients con useCallback y ref para tenantId ───
  const fetchClients = useCallback(async () => {
    try {
      setLoadingClients(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const tenantId = currentTenantIdRef.current;

      const res = await fetch(`/api/clients?tenantId=${tenantId}`, {
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setClients(data);
            return;
          }
        }
      }
    } catch (error) {
      // Mantiene datos locales si falla la API
    } finally {
      setLoadingClients(false);
    }
  }, []);

  // ─── fetchPolicies con useCallback y ref para tenantId ───
  const fetchPolicies = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const tenantId = currentTenantIdRef.current;

      const res = await fetch(`/api/policies?tenantId=${tenantId}`, {
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPolicies(data);
            return;
          }
        }
      }
    } catch (error) {
      // Mantiene datos locales si falla la API
    }
  }, []);

  const addClient = async (newClientData: any) => {
    const clientWithId = { ...newClientData, id: `cli-${Date.now()}`, tenant_id: currentTenant.id };
    setClients((prev) => [clientWithId, ...(Array.isArray(prev) ? prev : [])]);
    return clientWithId;
  };

  const updateClient = async (id: string, updatedData: any) => {
    setClients((prev) =>
      (Array.isArray(prev) ? prev : []).map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );
    return { id, ...updatedData };
  };

  const deleteClient = async (id: string) => {
    setClients((prev) => (Array.isArray(prev) ? prev : []).filter((c) => c.id !== id));
  };

  const addPolicy = async (policyData: any) => {
    const newPol = { ...policyData, id: `pol-${Date.now()}` };
    setPolicies((prev) => [newPol, ...prev]);
    return newPol;
  };

  const updatePolicy = async (id: string, policyData: any) => {
    setPolicies((prev) => prev.map((p) => (p.id === id ? { ...p, ...policyData } : p)));
    return policyData;
  };

  const deletePolicy = async (id: string) => {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await fetch(`/api/banking/accounts?tenantId=${currentTenant.id}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBankAccounts(data);
        }
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const addBankAccount = async (accountData: any) => {
    try {
      const res = await fetch(`/api/banking/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...accountData, tenant_id: currentTenant.id }),
      }).catch(() => null);

      if (res && res.ok) {
        const newAccount = await res.json();
        setBankAccounts((prev) => [newAccount, ...(Array.isArray(prev) ? prev : [])]);
        return newAccount;
      }
    } catch (error) {
      console.error('Error adding bank account:', error);
    }
    const newAccount = { ...accountData, id: `bank-${Date.now()}`, tenant_id: currentTenant.id };
    setBankAccounts((prev) => [newAccount, ...(Array.isArray(prev) ? prev : [])]);
    return newAccount;
  };

  const updateBankAccount = async (id: string, accountData: any) => {
    try {
      const res = await fetch(`/api/banking/accounts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...accountData, id }),
      }).catch(() => null);

      if (res && res.ok) {
        const updatedAccount = await res.json();
        setBankAccounts((prev) =>
          (Array.isArray(prev) ? prev : []).map((a) => (a.id === id ? { ...a, ...updatedAccount } : a))
        );
        return updatedAccount;
      }
    } catch (error) {
      console.error('Error updating bank account:', error);
    }
    setBankAccounts((prev) =>
      (Array.isArray(prev) ? prev : []).map((a) => (a.id === id ? { ...a, ...accountData } : a))
    );
    return { id, ...accountData };
  };

  const deleteBankAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/banking/accounts?id=${id}`, {
        method: 'DELETE',
      }).catch(() => null);

      if (res && res.ok) {
        setBankAccounts((prev) => (Array.isArray(prev) ? prev : []).filter((a) => a.id !== id));
        return;
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
    }
    setBankAccounts((prev) => (Array.isArray(prev) ? prev : []).filter((a) => a.id !== id));
  };

  const setDefaultPaymentMethod = async (clientId: string, accountId: string) => {
    try {
      const res = await fetch(`/api/banking/accounts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: accountId, clientId, isDefault: true }),
      }).catch(() => null);

      if (res && res.ok) {
        setBankAccounts((prev) =>
          (Array.isArray(prev) ? prev : []).map((a) =>
            a.clientId === clientId ? { ...a, isDefault: a.id === accountId } : a
          )
        );
        return;
      }
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
    setBankAccounts((prev) =>
      (Array.isArray(prev) ? prev : []).map((a) =>
        a.clientId === clientId ? { ...a, isDefault: a.id === accountId } : a
      )
    );
  };

  const updateUser = async (userData: any) => {
    setCurrentUserState((prev) => (prev ? { ...prev, ...userData } : null));
    return userData;
  };

  // ─── logoutUser con useCallback ───
  const logoutUser = useCallback(() => {
    setCurrentUserState(null);
    setCurrentTenantState(defaultTenant);
    fetchedTenantRef.current = null;
  }, []);

  const markAppNotificationRead = (id: string) => {
    setAppNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAppNotificationsRead = () => {
    setAppNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteAppNotification = (id: string) => {
    setAppNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // CONTROL DE EJECUCIÓN ÚNICA: se dispara solo cuando cambia el tenantId.
  // Usa un ref para evitar dependencia de `currentUser` (que cambia de referencia).
  useEffect(() => {
    const currentId = currentTenant.id || 'tenant-demo';

    // Si ya se ejecutó la consulta para este tenantId, se detiene
    if (fetchedTenantRef.current === currentId) {
      return;
    }

    fetchedTenantRef.current = currentId;
    fetchClients();
    fetchPolicies();
  }, [currentTenant.id, fetchClients, fetchPolicies]);

  const catalogs = {
    clientCategories: currentTenant.clientCategories || defaultTenant.clientCategories,
    policyTypes: currentTenant.policyTypes || defaultTenant.policyTypes,
  };

  return (
    <TenantContext.Provider
      value={{
        clients,
        policies,
        currentTenant,
        currentUser,
        users,
        activeConversationId,
        saasLandingConfig,
        loadingClients,
        alerts,
        notifications,
        appNotifications,
        conversations,
        campaigns,
        pipelines,
        bankAccounts,
        documents,
        notes,
        activities,
        fetchClients,
        addClient,
        updateClient,
        deleteClient,
        fetchPolicies,
        addPolicy,
        updatePolicy,
        deletePolicy,
        fetchBankAccounts,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        setDefaultPaymentMethod,
        setCurrentTenantId,
        setCurrentTenant,
        setCurrentUser,
        setActiveConversationId,
        logoutUser,
        updateUser,
        can,
        markAppNotificationRead,
        markAllAppNotificationsRead,
        deleteAppNotification,
        showSoftphone,
        setShowSoftphone,
        tenants,
        saasAdmins,
        createTenant,
        updateTenantSubscription,
        updateTenantSubscriptionPlan,
        toggleTenantStatus,
        resetTenantData,
        addSaasAdmin,
        updateSaasAdmin,
        deleteSaasAdmin,
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
        catalogs
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant debe ser usado dentro de un TenantProvider');
  }
  return context;
};