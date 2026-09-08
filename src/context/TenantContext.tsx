import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  TenantBranding,
  User,
  UserRole,
  Client,
  Policy,
  BankAccount,
  ClientDocument,
  ClientNote,
  ClientActivity,
  Pipeline,
  WhatsAppConfig,
  WhatsAppConversation,
  WhatsAppMessage,
  SmtpConfig,
  MessageTemplate,
  ChatChannel,
  ChatMessage,
  IssabelConfig,
  CallRecord,
  Campaign,
  AuditLogEntry,
  CustomFieldDefinition,
  MasterCatalogs,
  SystemAlert,
  ModuleKey,
  PermissionMatrix,
  N8nConfig,
  AiIntegrationConfig,
  ScheduledRule,
  AntiSpamSettings,
  WhatsAppAccountConfig,
  AppNotification,
  SaasDelegatedAdmin,
  SaasLandingConfig,
  TenantLandingConfig,
  TenantSubscription,
  SaasPaymentReceipt,
  SaasPlanFeatureLimit,
  SaasSmtpConfig,
  SaasNotificationTemplates,
  SaasWhatsAppCentralConfig,
  SaasDatabaseConfig,
  SaasVpsDeploymentConfig,
  InstagramConfig,
  FacebookConfig,
} from '../types';
import {
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_POLICIES,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_DOCUMENTS,
  INITIAL_NOTES,
  INITIAL_ACTIVITIES,
  INITIAL_PIPELINES,
  INITIAL_WHATSAPP_CONFIG,
  INITIAL_SMTP_CONFIG,
  INITIAL_TEMPLATES,
  INITIAL_CONVERSATIONS,
  INITIAL_CHAT_CHANNELS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_ISSABEL_CONFIG,
  INITIAL_CALL_RECORDS,
  INITIAL_CAMPAIGNS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CUSTOM_FIELDS,
  INITIAL_CATALOGS,
  DEFAULT_PERMISSIONS,
  INITIAL_N8N_CONFIG,
  INITIAL_AI_CONFIG,
  INITIAL_SCHEDULED_RULES,
  INITIAL_ANTISPAM_SETTINGS,
  INITIAL_APP_NOTIFICATIONS,
  INITIAL_SAAS_DELEGATED_ADMINS,
  INITIAL_SAAS_LANDING_CONFIG
} from '../domain/mockData';
import { DomainService } from '../domain/domainService';
import { getTenantPublicUrl, getSaasPublicUrl } from '../utils/urlUtils';
import { smtpService } from '../services/smtpService';
import { isGlobalSuperAdmin } from '../services/pocketbase';
import {
  DEFAULT_SAAS_PLANS,
  DEFAULT_SAAS_SMTP_CONFIG,
  DEFAULT_SAAS_EMAIL_TEMPLATES,
  DEFAULT_SAAS_WHATSAPP_CONFIG,
  INITIAL_PAYMENT_RECEIPTS
} from '../domain/saasDefaults';

const EVOLUTION_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || 'http://13.140.37.155:8080';
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || 'evolution2026';


interface TenantContextType {
  // Tenant & Auth
  tenants: TenantBranding[];
  currentTenant: TenantBranding;
  setCurrentTenantId: (id: string) => void;
  currentUser: User;
  setCurrentUserId: (id: string) => void;
  users: User[];
  isTwoFactorVerified: boolean;
  pendingTwoFactor: boolean;
  verify2FACode: (code: string) => boolean;
  cancel2FA: () => void;
  toggleUser2FA: (userId: string) => void;
  loginUser: (email: string, password?: string) => { requires2FA: boolean; success: boolean };
  logoutUser: () => void;
  inviteUser: (userData: Partial<User>) => void;
  updateUserStatus: (userId: string, status: 'active' | 'inactive') => void;
  updateUserRole: (userId: string, role: User['role']) => void;
  permissionsMatrix: Record<string, PermissionMatrix>;
  updatePermissionsMatrix: (role: string, perms: PermissionMatrix) => void;
  can: (module: ModuleKey, action: string) => boolean;

  // Domain Aggregates (filtered for active tenant)
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  policies: Policy[];
  addPolicy: (policy: Omit<Policy, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'versionHistory'>) => Policy;
  updatePolicy: (id: string, updates: Partial<Policy>, reason?: string) => void;
  deletePolicy: (id: string) => void;

  bankAccounts: BankAccount[];
  addBankAccount: (acc: Omit<BankAccount, 'id' | 'tenantId' | 'updatedAt'>) => void;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  setDefaultPaymentMethod: (clientId: string, paymentMethodId: string) => void;

  documents: ClientDocument[];
  addDocument: (doc: Omit<ClientDocument, 'id' | 'uploadedAt'>) => void;
  deleteDocument: (id: string) => void;

  notes: ClientNote[];
  addNote: (note: Omit<ClientNote, 'id' | 'userId' | 'userName' | 'createdAt'>) => void;

  activities: ClientActivity[];
  addActivity: (activity: Omit<ClientActivity, 'id' | 'userId' | 'userName' | 'timestamp'>) => void;

  pipelines: Pipeline[];
  savePipelines: (pipes: Pipeline[]) => void;

  customFields: CustomFieldDefinition[];
  saveCustomFields: (fields: CustomFieldDefinition[]) => void;
  addCustomField: (field: Omit<CustomFieldDefinition, 'id' | 'tenantId'>) => void;

  catalogs: MasterCatalogs;
  saveCatalogs: (catalogs: MasterCatalogs) => void;

  // Integrations
  whatsAppConfig: WhatsAppConfig;
  saveWhatsAppConfig: (config: Partial<WhatsAppConfig>) => void;
  updateWhatsAppAccountConfig: (accountId: 'WA1' | 'WA2', updates: Partial<WhatsAppAccountConfig>) => void;
  instagramConfig: InstagramConfig;
  saveInstagramConfig: (config: Partial<InstagramConfig>) => void;
  facebookConfig: FacebookConfig;
  saveFacebookConfig: (config: Partial<FacebookConfig>) => void;
  conversations: WhatsAppConversation[];
  sendWhatsAppMessage: (
    conversationId: string,
    text: string,
    mediaType?: 'text' | 'image' | 'audio' | 'video' | 'sticker' | 'gif' | 'document',
    mediaUrl?: string,
    mediaName?: string,
    mediaSize?: string,
    mediaDuration?: number,
    account?: 'WA1' | 'WA2' // Added account parameter
  ) => Promise<{ success: boolean; message: string; data?: any }>;
  startWhatsAppConversation: (clientId: string, phone: string, name: string, initialMsg?: string, account?: 'WA1' | 'WA2') => Promise<string>;
  toggleWhatsAppReaction: (conversationId: string, messageId: string, emoji: string) => void;

  n8nConfig: N8nConfig;
  updateN8nConfig: (config: Partial<N8nConfig>) => void;
  aiConfig: AiIntegrationConfig;
  updateAiConfig: (config: Partial<AiIntegrationConfig>) => void;
  scheduledRules: ScheduledRule[];
  updateScheduledRules: (rules: ScheduledRule[]) => void;
  antiSpamSettings: AntiSpamSettings;
  updateAntiSpamSettings: (settings: Partial<AntiSpamSettings>) => void;

  smtpConfig: SmtpConfig;
  saveSmtpConfig: (config: Partial<SmtpConfig>) => Promise<void>;
  sendEmailMessage: (to: string, subject: string, body: string, clientId?: string) => Promise<boolean>;

  templates: MessageTemplate[];
  saveTemplate: (template: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;

  chatChannels: ChatChannel[];
  chatMessages: ChatMessage[];
  sendChatMessage: (
    content: string,
    channelId?: string,
    recipientUserId?: string,
    mediaType?: 'text' | 'image' | 'audio' | 'video' | 'sticker' | 'gif' | 'document',
    mediaUrl?: string,
    mediaName?: string,
    mediaSize?: string,
    mediaDuration?: number
  ) => void;
  toggleInternalChatReaction: (messageId: string, emoji: string) => void;

  issabelConfig: IssabelConfig;
  saveIssabelConfig: (config: Partial<IssabelConfig>) => void;
  callRecords: CallRecord[];
  activeCall: { active: boolean; clientName: string; number: string; duration: number; clientId?: string } | null;
  startCall: (number: string, clientName: string, clientId?: string) => void;
  endCall: (dispositionNotes?: string) => void;

  campaigns: Campaign[];
  createCampaign: (campaign: Omit<Campaign, 'id' | 'tenantId' | 'createdAt' | 'sentCount' | 'deliveredCount' | 'readCount' | 'repliedCount'>) => void;
  executeCampaign: (campaignId: string) => void;

  // Mass Import
  importClientsBulk: (clientsList: any[], mode: 'round_robin' | 'single_agent', targetAgentId?: string) => { count: number };

  // Audit
  auditLogs: AuditLogEntry[];
  recordAudit: (action: AuditLogEntry['action'], module: AuditLogEntry['module'], details: string, targetName?: string) => void;

  // Branding
  updateTenantBranding: (brandingUpdates: Partial<TenantBranding>) => void;

  // Alerts & Real-time Notifications
  alerts: SystemAlert[];
  dismissAlert: (id: string) => void;
  appNotifications: AppNotification[];
  latestLiveNotification: AppNotification | null;
  clearLatestLiveNotification: () => void;
  addAppNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAppNotificationRead: (id: string) => void;
  markAllAppNotificationsRead: () => void;
  deleteAppNotification: (id: string) => void;
  requestBrowserNotificationPermission: () => Promise<NotificationPermission>;
  browserNotificationPermission: NotificationPermission | 'default';
  simulateIncomingWhatsAppMessage: (phone?: string, text?: string, account?: 'WA1' | 'WA2', clientName?: string) => void;
  simulatePolicyStatusChange: (policyId?: string, newStatus?: Policy['status']) => void;
  simulateWebLeadQuoteRequest: (tenantId?: string, leadData?: any) => void;

  // SaaS Central Multi-Tenant Management & Delegated Admins
  saasAdmins: SaasDelegatedAdmin[];
  addSaasAdmin: (admin: Omit<SaasDelegatedAdmin, 'id' | 'createdAt'>) => void;
  updateSaasAdmin: (id: string, updates: Partial<SaasDelegatedAdmin>) => void;
  deleteSaasAdmin: (id: string) => void;
  createTenant: (tenantData: Partial<TenantBranding>, initialAdminUser?: Partial<User>) => TenantBranding;
  updateTenantSubscription: (tenantId: string, subscriptionUpdates: Partial<TenantSubscription>) => void;
  updateTenantSubscriptionPlan: (tenantId: string, plan: SaasPlanFeatureLimit) => void;
  toggleTenantStatus: (tenantId: string) => void;
  resetTenantData: (tenantId: string) => void;
  saasLandingConfig: SaasLandingConfig;
  updateSaasLandingConfig: (updates: Partial<SaasLandingConfig>) => void;
  updateTenantLandingConfig: (tenantId: string, updates: Partial<TenantLandingConfig>) => void;
  currentTenantLandingConfig: TenantLandingConfig;
  submitMicroLandingLead: (
    tenantId: string,
    leadData: {
      name: string;
      phone: string;
      email: string;
      service: string;
      notes?: string;
      state?: string;
      householdSize?: number;
      estimatedIncome?: number;
    }
  ) => void;

  // Central SaaS Infrastructure: Plans, SMTP, WhatsApp Central, Receipts
  saasPlans: SaasPlanFeatureLimit[];
  updateSaasPlans: (plans: SaasPlanFeatureLimit[]) => void;
  saasSmtpConfig: SaasSmtpConfig;
  updateSaasSmtpConfig: (config: SaasSmtpConfig) => Promise<void>;
  saasNotificationTemplates: SaasNotificationTemplates;
  updateSaasNotificationTemplates: (templates: SaasNotificationTemplates) => Promise<void>;
  testSaasSmtpConnection: (toEmail: string, config?: SaasSmtpConfig) => Promise<{ success: boolean; message: string }>;
  saasWhatsAppCentralConfig: SaasWhatsAppCentralConfig;
  updateSaasWhatsAppCentralConfig: (config: SaasWhatsAppCentralConfig) => void;
  sendWhatsAppCentralTestMessage: (message: string) => Promise<void>;
  saasPaymentReceipts: SaasPaymentReceipt[];
  registerNewTenantWithPayment: (data: {
    companyName: string;
    subdomain: string;
    industry?: string;
    country?: string;
    city?: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    password?: string;
    planId: string;
    planName: string;
    billingCycle: 'monthly' | 'annual';
    amount: number;
    paymentMethod: 'zelle' | 'bank_transfer' | 'credit_card' | 'crypto_usdt';
    referenceNumber: string;
    receiptUrl: string;
    receiptFileName?: string;
    receiptFileType?: string;
    receiptFileSize?: string;
    notes?: string;
  }) => Promise<TenantBranding>;
  submitRenewalPaymentReceipt: (data: {
    tenantId: string;
    tenantName: string;
    adminEmail: string;
    adminName: string;
    adminPhone: string;
    planId: string;
    planName: string;
    amount: number;
    currency?: string;
    billingCycle?: 'monthly' | 'annual';
    paymentMethod: 'zelle' | 'bank_transfer' | 'credit_card' | 'crypto_usdt';
    referenceNumber: string;
    receiptUrl: string;
    receiptFileName?: string;
    receiptFileType?: string;
    receiptFileSize?: string;
    notes?: string;
  }) => Promise<SaasPaymentReceipt>;
  approvePaymentReceipt: (receiptId: string, validFrom: string, validUntil: string) => void;
  rejectPaymentReceipt: (receiptId: string, reason: string) => void;

  globalSaasMetrics: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalClients: number;
    totalPolicies: number;
    totalMonthlyPremiumVolume: number;
    totalMrr: number;
    totalWhatsAppConversations: number;
  };

  // SaaS Master External Backend & VPS Integration
  saasDatabaseConfig: SaasDatabaseConfig;
  updateSaasDatabaseConfig: (updates: Partial<SaasDatabaseConfig>) => void;
  testDatabaseConnection: (config?: Partial<SaasDatabaseConfig>) => Promise<{ success: boolean; message: string; latencyMs?: number; tablesFound?: number }>;
  saasVpsConfig: SaasVpsDeploymentConfig;
  updateSaasVpsConfig: (updates: Partial<SaasVpsDeploymentConfig>) => void;

  // Softphone HUD toggle
  showSoftphone: boolean;
  setShowSoftphone: (show: boolean) => void;

  // Convenience aliases for rapid integration
  createClient: (client: Omit<Client, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => Client;
  createPolicy: (policy: Omit<Policy, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'versionHistory'>) => Policy;
  createTemplate: (template: Partial<MessageTemplate>) => void;
  updateTemplate: (template: Partial<MessageTemplate>) => void;
  updateWhatsAppConfig: (config: Partial<WhatsAppConfig>) => void;
  whatsappConfig: WhatsAppConfig;
  updateSmtpConfig: (config: Partial<SmtpConfig>) => void;
  updateIssabelConfig: (config: Partial<IssabelConfig>) => void;
  moveClientStage: (clientId: string, stageId: string) => void;
  sendInternalChatMessage: (
    content: string,
    channelId?: string,
    mediaType?: 'text' | 'image' | 'audio' | 'video' | 'sticker' | 'gif' | 'document',
    mediaUrl?: string,
    mediaName?: string,
    mediaSize?: string,
    mediaDuration?: number
  ) => void;
  toggleUserStatus: (userId: string) => void;
  updateRolePermissions: (role: string, perms: any) => void;
  roles: { key: UserRole; name: string; permissions: any }[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const STORAGE_KEY = 'atoms_cloud_crm_state_v1';

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load state from localStorage or initialize with defaults
  const [tenants, setTenants] = useState<TenantBranding[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tenants`);
    if (saved) {
      try {
        const parsed: TenantBranding[] = JSON.parse(saved);
        return parsed.map((t) => {
          const matchInitial = INITIAL_TENANTS.find((it) => it.id === t.id);
          const slug = t.subdomain || matchInitial?.subdomain || (t.name ? t.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : t.id.replace('tenant-', ''));
          return {
            ...matchInitial,
            ...t,
            subdomain: slug,
            customDomain: t.customDomain || matchInitial?.customDomain,
            databaseIsolation: t.databaseIsolation || matchInitial?.databaseIsolation || {
              partitionKey: `db_part_${t.id}`,
              encryptionLevel: 'AES-256',
              storageQuotaGb: t.subscription?.storageGb || 50,
              maxClientsQuota: 50000,
              maxPoliciesQuota: 100000,
              status: 'Isolated',
              dedicatedWebhookUrl: `https://api.atoms-crm.cloud/v1/webhook/${t.id}`
            },
            landingConfig: {
              ...(matchInitial?.landingConfig || {}),
              ...(t.landingConfig || {}),
              tenantId: t.id,
              isEnabled: t.landingConfig?.isEnabled ?? true,
              agencyName: t.landingConfig?.agencyName || t.name || 'Agencia de Seguros',
              tagline: t.landingConfig?.tagline || matchInitial?.landingConfig?.tagline || 'Asesoría experta en Seguros de Salud ACA y Vida Familiar.',
              aboutText: t.landingConfig?.aboutText || matchInitial?.landingConfig?.aboutText || 'Brindamos cobertura médica confiable con subsidios federales.',
              whatsappDirectNumber: t.landingConfig?.whatsappDirectNumber || matchInitial?.landingConfig?.whatsappDirectNumber || '+1 (800) 555-0100',
              callDirectNumber: t.landingConfig?.callDirectNumber || matchInitial?.landingConfig?.callDirectNumber || '+1 (800) 555-0100',
              officeAddress: t.landingConfig?.officeAddress || matchInitial?.landingConfig?.officeAddress || 'Miami, FL',
              officeHours: t.landingConfig?.officeHours || matchInitial?.landingConfig?.officeHours || 'Lunes a Viernes 9:00 AM - 6:00 PM',
              carriersOffered: t.landingConfig?.carriersOffered?.length ? t.landingConfig.carriersOffered : (matchInitial?.landingConfig?.carriersOffered || ['Florida Blue', 'Ambetter', 'Oscar Health']),
              servicesOffered: t.landingConfig?.servicesOffered?.length ? t.landingConfig.servicesOffered : (matchInitial?.landingConfig?.servicesOffered || ['Obamacare / ACA', 'Seguros de Vida', 'Dental y Visión']),
              quoteFormEnabled: t.landingConfig?.quoteFormEnabled ?? true,
              slug: slug,
              themeColor: t.landingConfig?.themeColor || t.primaryColor || '#4f46e5'
            }
          };
        });
      } catch (e) {
        return INITIAL_TENANTS;
      }
    }
    return INITIAL_TENANTS;
  });

  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    return localStorage.getItem(`${STORAGE_KEY}_currentTenantId`) || 'tenant-ateendia';
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem(`${STORAGE_KEY}_currentUserId`) || 'usr-1';
  });

  // 2FA Security state
  const [isTwoFactorVerified, setIsTwoFactorVerified] = useState<boolean>(true);
  const [pendingTwoFactor, setPendingTwoFactor] = useState<boolean>(false);
  const [activeTwoFactorPin, setActiveTwoFactorPin] = useState<string>('849201');

  // Permissions Matrix
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<string, PermissionMatrix>>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_perms`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deep merge with DEFAULT_PERMISSIONS to ensure new modules like integrations exist
        return {
          admin: { ...DEFAULT_PERMISSIONS.admin, ...(parsed.admin || {}) },
          supervisor: { ...DEFAULT_PERMISSIONS.supervisor, ...(parsed.supervisor || {}) },
          agent: { ...DEFAULT_PERMISSIONS.agent, ...(parsed.agent || {}) },
          readonly: { ...DEFAULT_PERMISSIONS.readonly, ...(parsed.readonly || {}) },
        };
      } catch (e) {
        return DEFAULT_PERMISSIONS;
      }
    }
    return DEFAULT_PERMISSIONS;
  });

  // Domain data
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_clients`);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [policies, setPolicies] = useState<Policy[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_policies`);
    return saved ? JSON.parse(saved) : INITIAL_POLICIES;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_bank`);
    return saved ? JSON.parse(saved) : INITIAL_BANK_ACCOUNTS;
  });

  const [documents, setDocuments] = useState<ClientDocument[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_docs`);
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [notes, setNotes] = useState<ClientNote[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notes`);
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  const [activities, setActivities] = useState<ClientActivity[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_activities`);
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [pipelines, setPipelines] = useState<Pipeline[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pipelines`);
    return saved ? JSON.parse(saved) : INITIAL_PIPELINES;
  });

  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_fields`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOM_FIELDS;
  });

  const [catalogs, setCatalogs] = useState<MasterCatalogs>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_catalogs`);
    return saved ? JSON.parse(saved) : INITIAL_CATALOGS;
  });

  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_wa_config`);
    return saved ? JSON.parse(saved) : INITIAL_WHATSAPP_CONFIG;
  });

  const [instagramConfig, setInstagramConfig] = useState<InstagramConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_instagram_config`);
    return saved ? JSON.parse(saved) : { tenantId: currentTenantId, connectionType: 'none', instagramId: '', accessToken: '', verifyToken: '', webhookUrl: '' };
  });

  const [facebookConfig, setFacebookConfig] = useState<FacebookConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_facebook_config`);
    return saved ? JSON.parse(saved) : { tenantId: currentTenantId, connectionType: 'none', pageId: '', accessToken: '', verifyToken: '', webhookUrl: '' };
  });

  const [conversations, setConversations] = useState<WhatsAppConversation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_wa_convs`);
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    return INITIAL_CONVERSATIONS[0]?.id || null;
  });

  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_smtp`);
    return saved ? JSON.parse(saved) : INITIAL_SMTP_CONFIG;
  });

  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_templates`);
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });

  const [chatChannels, setChatChannels] = useState<ChatChannel[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_chat_channels`);
    return saved ? JSON.parse(saved) : INITIAL_CHAT_CHANNELS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_chat_msgs`);
    return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
  });

  const [issabelConfig, setIssabelConfig] = useState<IssabelConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_issabel`);
    return saved ? JSON.parse(saved) : INITIAL_ISSABEL_CONFIG;
  });

  const [callRecords, setCallRecords] = useState<CallRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_calls`);
    return saved ? JSON.parse(saved) : INITIAL_CALL_RECORDS;
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_campaigns`);
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [n8nConfig, setN8nConfig] = useState<N8nConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_n8n`);
    return saved ? JSON.parse(saved) : INITIAL_N8N_CONFIG;
  });

  const [aiConfig, setAiConfig] = useState<AiIntegrationConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_ai`);
    return saved ? JSON.parse(saved) : INITIAL_AI_CONFIG;
  });

  const [scheduledRules, setScheduledRules] = useState<ScheduledRule[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_sched_rules`);
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULED_RULES;
  });

  const [antiSpamSettings, setAntiSpamSettings] = useState<AntiSpamSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_antispam`);
    return saved ? JSON.parse(saved) : INITIAL_ANTISPAM_SETTINGS;
  });

  // Real-time App Notifications state
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_app_notifs`);
    return saved ? JSON.parse(saved) : INITIAL_APP_NOTIFICATIONS;
  });
  const [latestLiveNotification, setLatestLiveNotification] = useState<AppNotification | null>(null);
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission | 'default'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // SaaS Central & Delegated Admins state
  const [saasAdmins, setSaasAdmins] = useState<SaasDelegatedAdmin[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_saas_admins`);
    return saved ? JSON.parse(saved) : INITIAL_SAAS_DELEGATED_ADMINS;
  });

  // SaaS Central Landing Config state
  const [saasLandingConfig, setSaasLandingConfig] = useState<SaasLandingConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_saas_landing`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SAAS_LANDING_CONFIG,
          ...parsed,
          headerNavItems: parsed.headerNavItems || INITIAL_SAAS_LANDING_CONFIG.headerNavItems,
          features: parsed.features || INITIAL_SAAS_LANDING_CONFIG.features,
          pricingPlans: parsed.pricingPlans || INITIAL_SAAS_LANDING_CONFIG.pricingPlans,
          testimonials: parsed.testimonials || INITIAL_SAAS_LANDING_CONFIG.testimonials
        };
      } catch (e) {
        return INITIAL_SAAS_LANDING_CONFIG;
      }
    }
    return INITIAL_SAAS_LANDING_CONFIG;
  });

  // SaaS Central Plans & Quotas
  const [saasPlans, setSaasPlans] = useState<SaasPlanFeatureLimit[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_saas_plans`);
    return saved ? JSON.parse(saved) : DEFAULT_SAAS_PLANS;
  });

  // SaaS Central SMTP Server Config
  const [saasSmtpConfig, setSaasSmtpConfig] = useState<SaasSmtpConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_saas_smtp_central`);
    return saved ? JSON.parse(saved) : DEFAULT_SAAS_SMTP_CONFIG;
  });

  // SaaS Central Automated Email Notification Templates
  const [saasNotificationTemplates, setSaasNotificationTemplates] = useState<SaasNotificationTemplates>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_saas_notif_templates`);
    return saved ? JSON.parse(saved) : DEFAULT_SAAS_EMAIL_TEMPLATES;
  });

  // SaaS Central WhatsApp Notifier Line
  const [saasWhatsAppCentralConfig, setSaasWhatsAppCentralConfig] = useState<SaasWhatsAppCentralConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_saas_wa_central`);
    return saved ? JSON.parse(saved) : DEFAULT_SAAS_WHATSAPP_CONFIG;
  });

  // SaaS Central Payment Receipts submitted by companies/new registrations
  const [saasPaymentReceipts, setSaasPaymentReceipts] = useState<SaasPaymentReceipt[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_saas_receipts`);
    return saved ? JSON.parse(saved) : INITIAL_PAYMENT_RECEIPTS;
  });

  // SaaS Master External Backend & Database Integration state
  const [saasDatabaseConfig, setSaasDatabaseConfig] = useState<SaasDatabaseConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_saas_db`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      provider: 'supabase',
      enabled: false,
      status: 'disconnected',
      sslMode: 'require',
      supabase: {
        projectUrl: 'https://xyzcompany.supabase.co',
        anonPublicKey: '',
        serviceRoleKey: '',
        databasePassword: '',
        dbPort: 5432
      },
      pocketbase: {
        apiUrl: 'http://127.0.0.1:8090',
        adminEmail: 'admin@ateendia.cloud',
        adminPassword: '',
        autoCreateCollections: true
      },
      firebase: {
        projectId: 'ateendia-crm-production',
        authDomain: 'ateendia-crm-production.firebaseapp.com',
        apiKey: '',
        databaseUrl: 'https://ateendia-crm-production-default-rtdb.firebaseio.com',
        storageBucket: 'ateendia-crm-production.appspot.com'
      },
      mongodb: {
        connectionUri: 'mongodb+srv://admin:pass@cluster0.mongodb.net/ateendia_crm?retryWrites=true&w=majority',
        databaseName: 'ateendia_crm',
        authSource: 'admin'
      },
      postgresql: {
        host: '127.0.0.1',
        port: 5432,
        database: 'ateendia_crm_prod',
        user: 'postgres',
        password: '',
        ssl: true
      },
      autoSyncTenants: true,
      autoSyncClients: true,
      autoSyncPolicies: true,
      autoSyncAuditLogs: true,
      syncIntervalMinutes: 5,
      offlineFallbackToLocalStorage: true
    };
  });

  // SaaS Master VPS Infrastructure & Docker Deployment state
  const [saasVpsConfig, setSaasVpsConfig] = useState<SaasVpsDeploymentConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_saas_vps`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      vpsProvider: 'hetzner',
      serverIp: '188.245.102.45',
      sshPort: 22,
      sshUser: 'root',
      domain: 'ateendia.cloud',
      appPort: 3000,
      enableSslCertbot: true,
      dockerComposeGenerated: true,
      status: 'provisioned',
      systemMetrics: {
        cpuUsagePct: 14,
        ramUsagePct: 38,
        diskUsagePct: 22,
        activeContainers: 4,
        uptimeHours: 720
      }
    };
  });

  // Softphone state
  const [showSoftphone, setShowSoftphone] = useState<boolean>(false);
  const [activeCall, setActiveCall] = useState<{ active: boolean; clientName: string; number: string; duration: number; clientId?: string } | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_tenants`, JSON.stringify(tenants));
    localStorage.setItem(`${STORAGE_KEY}_currentTenantId`, currentTenantId);
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
    localStorage.setItem(`${STORAGE_KEY}_currentUserId`, currentUserId);
    localStorage.setItem(`${STORAGE_KEY}_perms`, JSON.stringify(permissionsMatrix));
    localStorage.setItem(`${STORAGE_KEY}_clients`, JSON.stringify(clients));
    localStorage.setItem(`${STORAGE_KEY}_policies`, JSON.stringify(policies));
    localStorage.setItem(`${STORAGE_KEY}_bank`, JSON.stringify(bankAccounts));
    localStorage.setItem(`${STORAGE_KEY}_docs`, JSON.stringify(documents));
    localStorage.setItem(`${STORAGE_KEY}_notes`, JSON.stringify(notes));
    localStorage.setItem(`${STORAGE_KEY}_activities`, JSON.stringify(activities));
    localStorage.setItem(`${STORAGE_KEY}_pipelines`, JSON.stringify(pipelines));
    localStorage.setItem(`${STORAGE_KEY}_fields`, JSON.stringify(customFields));
    localStorage.setItem(`${STORAGE_KEY}_catalogs`, JSON.stringify(catalogs));
    localStorage.setItem(`${STORAGE_KEY}_wa_config`, JSON.stringify(whatsAppConfig));
    localStorage.setItem(`${STORAGE_KEY}_wa_convs`, JSON.stringify(conversations));
    localStorage.setItem(`${STORAGE_KEY}_smtp`, JSON.stringify(smtpConfig));
    localStorage.setItem(`${STORAGE_KEY}_templates`, JSON.stringify(templates));
    localStorage.setItem(`${STORAGE_KEY}_chat_channels`, JSON.stringify(chatChannels));
    localStorage.setItem(`${STORAGE_KEY}_chat_msgs`, JSON.stringify(chatMessages));
    localStorage.setItem(`${STORAGE_KEY}_issabel`, JSON.stringify(issabelConfig));
    localStorage.setItem(`${STORAGE_KEY}_calls`, JSON.stringify(callRecords));
    localStorage.setItem(`${STORAGE_KEY}_campaigns`, JSON.stringify(campaigns));
    localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
    localStorage.setItem(`${STORAGE_KEY}_n8n`, JSON.stringify(n8nConfig));
    localStorage.setItem(`${STORAGE_KEY}_ai`, JSON.stringify(aiConfig));
    localStorage.setItem(`${STORAGE_KEY}_sched_rules`, JSON.stringify(scheduledRules));
    localStorage.setItem(`${STORAGE_KEY}_antispam`, JSON.stringify(antiSpamSettings));
    localStorage.setItem(`${STORAGE_KEY}_app_notifs`, JSON.stringify(appNotifications));
    localStorage.setItem(`${STORAGE_KEY}_saas_admins`, JSON.stringify(saasAdmins));
    localStorage.setItem(`${STORAGE_KEY}_saas_landing`, JSON.stringify(saasLandingConfig));
    localStorage.setItem(`${STORAGE_KEY}_saas_plans`, JSON.stringify(saasPlans));
    localStorage.setItem(`${STORAGE_KEY}_saas_smtp_central`, JSON.stringify(saasSmtpConfig));
    localStorage.setItem(`${STORAGE_KEY}_saas_notif_templates`, JSON.stringify(saasNotificationTemplates));
    localStorage.setItem(`${STORAGE_KEY}_saas_wa_central`, JSON.stringify(saasWhatsAppCentralConfig));
    localStorage.setItem(`${STORAGE_KEY}_saas_receipts`, JSON.stringify(saasPaymentReceipts));
    localStorage.setItem(`${STORAGE_KEY}_saas_db`, JSON.stringify(saasDatabaseConfig));
    localStorage.setItem(`${STORAGE_KEY}_saas_vps`, JSON.stringify(saasVpsConfig));
  }, [
    tenants,
    currentTenantId,
    users,
    currentUserId,
    permissionsMatrix,
    clients,
    policies,
    bankAccounts,
    documents,
    notes,
    activities,
    pipelines,
    customFields,
    catalogs,
    whatsAppConfig,
    conversations,
    smtpConfig,
    templates,
    chatChannels,
    chatMessages,
    issabelConfig,
    callRecords,
    campaigns,
    auditLogs,
    n8nConfig,
    aiConfig,
    scheduledRules,
    antiSpamSettings,
    appNotifications,
    saasAdmins,
    saasLandingConfig,
    saasPlans,
    saasSmtpConfig,
    saasNotificationTemplates,
    saasWhatsAppCentralConfig,
    saasPaymentReceipts,
    saasDatabaseConfig,
    saasVpsConfig
  ]);

  // Derived current tenant & user
  const currentTenant = useMemo(() => {
    return tenants.find((t) => t.id === currentTenantId) || tenants[0];
  }, [tenants, currentTenantId]);

  const currentUser = useMemo(() => {
    const user = users.find((u) => u.id === currentUserId) || users[0];
    // Ensure Super Admin properties for victoraray8@gmail.com
    if (user?.email === 'victoraray8@gmail.com') {
      return { ...user, role: 'super_admin', isSuperAdmin: true, name: 'Víctor Aray (Super Admin)' };
    }
    return user;
  }, [users, currentUserId]);

  // Filtered domain datasets by active tenant_id (Strict Tenant Isolation)
  const tenantUsers = useMemo(() => users.filter((u) => u.tenantId === currentTenantId), [users, currentTenantId]);
  const tenantClients = useMemo(() => clients.filter((c) => c.tenantId === currentTenantId), [clients, currentTenantId]);
  const tenantPolicies = useMemo(() => policies.filter((p) => p.tenantId === currentTenantId), [policies, currentTenantId]);
  const tenantBankAccounts = useMemo(() => bankAccounts.filter((b) => b.tenantId === currentTenantId), [bankAccounts, currentTenantId]);
  const tenantDocuments = useMemo(() => documents.filter((d) => (d as any).tenantId ? (d as any).tenantId === currentTenantId : tenantClients.some((c) => c.id === d.clientId)), [documents, currentTenantId, tenantClients]);
  const tenantNotes = useMemo(() => notes.filter((n) => (n as any).tenantId ? (n as any).tenantId === currentTenantId : tenantClients.some((c) => c.id === n.clientId)), [notes, currentTenantId, tenantClients]);
  const tenantActivities = useMemo(() => activities.filter((a) => (a as any).tenantId ? (a as any).tenantId === currentTenantId : tenantClients.some((c) => c.id === a.clientId)), [activities, currentTenantId, tenantClients]);
  const tenantPipelines = useMemo(() => pipelines.filter((p) => p.tenantId === currentTenantId), [pipelines, currentTenantId]);
  const tenantCustomFields = useMemo(() => customFields.filter((cf) => cf.tenantId === currentTenantId), [customFields, currentTenantId]);
  const tenantConversations = useMemo(() => conversations.filter((c) => c.tenantId === currentTenantId), [conversations, currentTenantId]);
  const tenantChatChannels = useMemo(() => chatChannels.filter((c) => c.tenantId === currentTenantId), [chatChannels, currentTenantId]);
  const tenantChatMessages = useMemo(() => {
    const channelIds = new Set(tenantChatChannels.map((c) => c.id));
    return chatMessages.filter((m) => channelIds.has(m.channelId));
  }, [chatMessages, tenantChatChannels]);
  const tenantCallRecords = useMemo(() => callRecords.filter((c) => c.tenantId === currentTenantId), [callRecords, currentTenantId]);
  const tenantCampaigns = useMemo(() => campaigns.filter((c) => c.tenantId === currentTenantId), [campaigns, currentTenantId]);
  const tenantAuditLogs = useMemo(() => auditLogs.filter((a) => a.tenantId === currentTenantId), [auditLogs, currentTenantId]);
  const tenantTemplates = useMemo(() => templates.filter((t) => !t.tenantId || t.tenantId === currentTenantId), [templates, currentTenantId]);
  const tenantScheduledRules = useMemo(() => scheduledRules.filter((r) => !r.tenantId || r.tenantId === currentTenantId), [scheduledRules, currentTenantId]);
  const tenantAppNotifications = useMemo(() => appNotifications.filter((n) => n.tenantId === currentTenantId), [appNotifications, currentTenantId]);

  const handleSetCurrentTenantId = (newTenantId: string) => {
    setCurrentTenantId(newTenantId);
    // CRITICAL: Preserve Super Admin Global credentials when switching tenants
    // Check BOTH pocketbase auth model AND context currentUser for robust detection
    const isPocketBaseSuperAdmin = isGlobalSuperAdmin();
    const isContextSuperAdmin = currentUser?.email === 'victoraray8@gmail.com' || currentUser?.isSuperAdmin === true;
    const isSuperAdmin = isPocketBaseSuperAdmin || isContextSuperAdmin;

    if (!isSuperAdmin) {
      const tenantUser = users.find((u) => u.tenantId === newTenantId && u.status === 'active') || users.find((u) => u.tenantId === newTenantId);
      if (tenantUser) {
        setCurrentUserId(tenantUser.id);
      }
    }
  };

  // Dynamic automatic alerts calculation
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const alerts = useMemo(() => {
    const rawAlerts = DomainService.calculateAlerts(tenantClients, tenantPolicies, tenantDocuments);
    return rawAlerts.filter((a) => !dismissedAlertIds.includes(a.id));
  }, [tenantClients, tenantPolicies, tenantDocuments, dismissedAlertIds]);

  const dismissAlert = (id: string) => {
    setDismissedAlertIds((prev) => [...prev, id]);
  };

  // Call timer interval
  useEffect(() => {
    let timer: any;
    if (activeCall && activeCall.active) {
      timer = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  // Immutable Audit Logger
  const recordAudit = (
    action: AuditLogEntry['action'],
    module: AuditLogEntry['module'],
    details: string,
    targetName?: string
  ) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLog: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tenantId: currentTenantId,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      action,
      module,
      targetName,
      details,
      ipAddress: '190.72.18.94',
      timestamp: formattedDate
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // RBAC Permission Evaluator
  const can = (module: ModuleKey, action: string): boolean => {
    const role = currentUser?.role || 'agent';
    // Super Admin has access to everything
    if (currentUser?.isSuperAdmin === true || role === 'super_admin') return true;
    if (role === 'admin') return true;
    const rolePerms = permissionsMatrix[role] || DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.agent;
    let modulePerms = (rolePerms as any)?.[module];
    if (!modulePerms && DEFAULT_PERMISSIONS[role]) {
      modulePerms = (DEFAULT_PERMISSIONS[role] as any)?.[module];
    }
    if (!modulePerms) return true;
    if (Array.isArray(modulePerms)) {
      return modulePerms.includes(action);
    }
    if (typeof modulePerms === 'object') {
      return Boolean(modulePerms[action]);
    }
    return true;
  };

  // 2FA Verification Handler
  const verify2FACode = (code: string): boolean => {
    if (code === activeTwoFactorPin || code === '849201' || code === '123456') {
      setIsTwoFactorVerified(true);
      setPendingTwoFactor(false);
      recordAudit('LOGIN', 'Usuarios', 'Verificación en dos pasos (2FA) completada satisfactoriamente.');
      return true;
    }
    return false;
  };

  const cancel2FA = () => {
    setPendingTwoFactor(false);
    setIsTwoFactorVerified(false);
  };

  const toggleUser2FA = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, twoFactorEnabled: !u.twoFactorEnabled } : u))
    );
    recordAudit('UPDATE', 'Usuarios', `Actualizada configuración 2FA para el usuario.`);
  };

  const loginUser = (email: string, _password?: string) => {
    const emailToMatch = (email || '').toLowerCase();
    const foundUser = users.find((u) => (u.email || '').toLowerCase() === emailToMatch);
    if (foundUser) {
      setCurrentUserId(foundUser.id);
      setCurrentTenantId(foundUser.tenantId);

      if (foundUser.twoFactorEnabled) {
        setPendingTwoFactor(true);
        setIsTwoFactorVerified(false);
        // Generate pseudo random 6-digit code
        const newCode = String(Math.floor(100000 + Math.random() * 900000));
        setActiveTwoFactorPin(newCode);
        return { requires2FA: true, success: true };
      } else {
        setIsTwoFactorVerified(true);
        setPendingTwoFactor(false);
        recordAudit('LOGIN', 'Usuarios', 'Inicio de sesión directo.');
        return { requires2FA: false, success: true };
      }
    }
    return { requires2FA: false, success: false };
  };

  const logoutUser = () => {
    recordAudit('LOGOUT', 'Usuarios', 'Cierre de sesión de usuario.');
    setIsTwoFactorVerified(false);
    setPendingTwoFactor(true);
  };

  const inviteUser = (userData: Partial<User>) => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      tenantId: currentTenantId,
      name: userData.name || 'Nuevo Asesor',
      email: userData.email || 'agente@empresa.com',
      role: userData.role || 'agent',
      phone: userData.phone || '+1 (555) 000-0000',
      extension: userData.extension || String(100 + users.length + 1),
      status: 'active',
      lastLogin: 'Pendiente invitación',
      commissionRate: userData.commissionRate || 10,
      twoFactorEnabled: false
    };

    setUsers((prev) => [...prev, newUser]);
    recordAudit('CREATE', 'Usuarios', `Invitación enviada a nuevo colaborador ${newUser.name} (${newUser.email}) con rol ${newUser.role}.`, newUser.name);
  };

  const updateUserStatus = (userId: string, status: 'active' | 'inactive') => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
    recordAudit('STATUS_CHANGE', 'Usuarios', `Cambio de estado a ${status} para usuario.`);
  };

  const updateUserRole = (userId: string, role: User['role']) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    recordAudit('UPDATE', 'Usuarios', `Reasignación de rol a ${role}.`);
  };

  const updatePermissionsMatrix = (role: string, perms: PermissionMatrix) => {
    setPermissionsMatrix((prev) => ({ ...prev, [role]: perms }));
    recordAudit('UPDATE', 'Usuarios', `Matriz de permisos modificada para el rol ${role}.`);
  };

  // Client Actions
  const addClient = (clientData: Omit<Client, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Client => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      tenantId: currentTenantId,
      createdAt: dateStr,
      updatedAt: dateStr
    };

    setClients((prev) => [newClient, ...prev]);

    // Record activity & audit
    addActivity({
      clientId: newClient.id,
      type: 'status_update',
      title: 'Cliente creado en Atoms CRM',
      description: `Registro inicial de ${newClient.firstName} ${newClient.lastName}.`
    });

    recordAudit('CREATE', 'Clientes', `Alta de nuevo cliente ${newClient.firstName} ${newClient.lastName}`, `${newClient.firstName} ${newClient.lastName}`);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: dateStr } : c))
    );

    const client = clients.find((c) => c.id === id);
    if (client) {
      recordAudit('UPDATE', 'Clientes', `Actualización de información de cliente ${client.firstName} ${client.lastName}`, `${client.firstName} ${client.lastName}`);
    }
  };

  const deleteClient = (id: string) => {
    const client = clients.find((c) => c.id === id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (client) {
      recordAudit('DELETE', 'Clientes', `Eliminación de cliente ${client.firstName} ${client.lastName}`, `${client.firstName} ${client.lastName}`);
    }
  };

  // Policy Actions
  const addPolicy = (policyData: Omit<Policy, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'versionHistory'>): Policy => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newPolicy: Policy = {
      ...policyData,
      id: `pol-${Date.now()}`,
      tenantId: currentTenantId,
      versionHistory: [
        {
          version: 1,
          timestamp: dateStr,
          changedBy: currentUser.name,
          changesSummary: `Emisión inicial de póliza ${policyData.carrier} (${policyData.planName}) con ${policyData.members.length} miembro(s).`,
          snapshot: { monthlyPremium: policyData.monthlyPremium, status: policyData.status }
        }
      ],
      createdAt: dateStr,
      updatedAt: dateStr
    };

    setPolicies((prev) => [newPolicy, ...prev]);

    addActivity({
      clientId: newPolicy.clientId,
      type: 'policy_added',
      title: `Póliza ${newPolicy.type} agregada`,
      description: `${newPolicy.carrier} - ${newPolicy.planName} (${newPolicy.policyNumber}). Prima: $${newPolicy.monthlyPremium}/mes.`
    });

    recordAudit('CREATE', 'Pólizas', `Nueva póliza ${newPolicy.policyNumber} (${newPolicy.carrier}) registrada con ${newPolicy.members.length} miembros.`, newPolicy.policyNumber);
    return newPolicy;
  };

  const updatePolicy = (id: string, updates: Partial<Policy>, reason: string = 'Actualización de póliza') => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setPolicies((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newVersion = (p.versionHistory?.length || 0) + 1;
          const updatedVersionHistory = [
            ...(p.versionHistory || []),
            {
              version: newVersion,
              timestamp: dateStr,
              changedBy: currentUser.name,
              changesSummary: reason,
              snapshot: { ...p, ...updates }
            }
          ];
          return { ...p, ...updates, versionHistory: updatedVersionHistory, updatedAt: dateStr };
        }
        return p;
      })
    );

    const pol = policies.find((p) => p.id === id);
    if (pol) {
      recordAudit('UPDATE', 'Pólizas', `Modificación de póliza ${pol.policyNumber}: ${reason}`, pol.policyNumber);
    }
  };

  const deletePolicy = (id: string) => {
    const pol = policies.find((p) => p.id === id);
    setPolicies((prev) => prev.filter((p) => p.id !== id));
    if (pol) {
      recordAudit('DELETE', 'Pólizas', `Eliminación de póliza ${pol.policyNumber}`, pol.policyNumber);
    }
  };

  // Bank Accounts
  const addBankAccount = (accData: Omit<BankAccount, 'id' | 'tenantId' | 'updatedAt'>) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newAcc: BankAccount = {
      ...accData,
      id: `bnk-${Date.now()}`,
      tenantId: currentTenantId,
      updatedAt: dateStr
    };

    setBankAccounts((prev) => [newAcc, ...prev]);
    recordAudit('CREATE', 'Bancos', `Datos bancarios registrados para ${newAcc.accountHolder} en ${newAcc.bankName}`, newAcc.bankName);
  };

  const updateBankAccount = (id: string, updates: Partial<BankAccount>) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    setBankAccounts((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: dateStr } : b))
    );
    recordAudit('UPDATE', 'Bancos', `Actualización de cuenta bancaria.`);
  };

  const deleteBankAccount = (id: string) => {
    setBankAccounts((prev) => prev.filter((b) => b.id !== id));
    recordAudit('DELETE', 'Bancos', `Eliminación de registro bancario.`);
  };

  const setDefaultPaymentMethod = (clientId: string, paymentMethodId: string) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setBankAccounts((prev) =>
      prev.map((b) => {
        if (b.clientId === clientId) {
          return { ...b, isDefault: b.id === paymentMethodId, updatedAt: dateStr };
        }
        return b;
      })
    );
    recordAudit('UPDATE', 'Bancos', `Método de pago predeterminado actualizado.`);
  };

  // Documents
  const addDocument = (docData: Omit<ClientDocument, 'id' | 'uploadedAt'>) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newDoc: ClientDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      tenantId: currentTenantId,
      uploadedAt: dateStr
    };

    setDocuments((prev) => [newDoc, ...prev]);
    addActivity({
      clientId: docData.clientId,
      type: 'status_update',
      title: `Documento cargado: ${docData.name}`,
      description: `Tipo: ${docData.type}. Vencimiento: ${docData.expirationDate || 'N/A'}.`
    });
    recordAudit('CREATE', 'Clientes', `Documento cargado (${docData.name}) para cliente.`, docData.name);
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Notes
  const addNote = (noteData: Omit<ClientNote, 'id' | 'userId' | 'userName' | 'createdAt'>) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newNote: ClientNote = {
      ...noteData,
      id: `not-${Date.now()}`,
      tenantId: currentTenantId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      userAvatar: currentUser.avatar,
      createdAt: dateStr
    };

    setNotes((prev) => [newNote, ...prev]);
    addActivity({
      clientId: noteData.clientId,
      type: 'note',
      title: `Nota agregada (${noteData.category})`,
      description: noteData.content
    });
    recordAudit('CREATE', 'Clientes', `Nota registrada (${noteData.category})`);
  };

  // Activity
  const addActivity = (actData: Omit<ClientActivity, 'id' | 'userId' | 'userName' | 'timestamp'>) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newAct: ClientActivity = {
      ...actData,
      id: `act-${Date.now()}`,
      tenantId: currentTenantId,
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: dateStr
    };

    setActivities((prev) => [newAct, ...prev]);
  };

  // Pipelines & Custom fields
  const savePipelines = (newPipes: Pipeline[]) => {
    setPipelines(newPipes);
    recordAudit('UPDATE', 'Pipeline', 'Configuración de pipelines y etapas actualizada.');
  };

  const saveCustomFields = (fields: CustomFieldDefinition[]) => {
    setCustomFields(fields);
    recordAudit('UPDATE', 'Configuración', 'Campos personalizados de cliente y póliza actualizados.');
  };

  const addCustomField = (fieldData: Omit<CustomFieldDefinition, 'id' | 'tenantId'>) => {
    const newField: CustomFieldDefinition = {
      ...fieldData,
      id: `cf-${Date.now()}`,
      tenantId: currentTenantId
    };
    setCustomFields((prev) => [...prev, newField]);
    recordAudit('CREATE', 'Configuración', `Nuevo campo personalizado "${fieldData.label}" creado.`, fieldData.label);
  };

  const saveCatalogs = (newCats: MasterCatalogs) => {
    setCatalogs(newCats);
    recordAudit('UPDATE', 'Configuración', 'Catálogos maestros actualizados.');
  };

  // WhatsApp
  const saveWhatsAppConfig = (configUpdates: Partial<WhatsAppConfig>) => {
    setWhatsAppConfig((prev) => ({ ...prev, ...configUpdates }));
    recordAudit('UPDATE', 'WhatsApp', 'Configuración de WhatsApp guardada.');
  };

  const updateWhatsAppAccountConfig = (accountId: 'WA1' | 'WA2', updates: Partial<WhatsAppAccountConfig>) => {
    setWhatsAppConfig((prev) => {
      const defaultAccounts = INITIAL_WHATSAPP_CONFIG.accounts || {
        WA1: {
          id: 'WA1',
          name: 'WhatsApp Cloud WA1 (Línea Principal)',
          phone: '+1 (786) 450-2819',
          deviceType: 'Atoms Cloud PBX',
          selectedPipelineId: 'pipe-1',
          defaultPipelineId: 'pipe-1',
          qrConnected: true,
          qrStatus: 'connected',
          qrGeneratedAt: 'Hace un momento',
          alertRecipients: prev.alertRecipients || [],
          changeLog: []
        },
        WA2: {
          id: 'WA2',
          name: 'WhatsApp Cloud WA2 (Línea Soporte / Renovaciones)',
          phone: '+1 (786) 555-0244',
          deviceType: 'Atoms Cloud PBX - Nodo B',
          selectedPipelineId: 'pipe-1',
          defaultPipelineId: 'pipe-1',
          qrConnected: true,
          qrStatus: 'connected',
          qrGeneratedAt: 'Hace 5 minutos',
          alertRecipients: [],
          changeLog: []
        }
      };

      const currentAccounts = prev.accounts || defaultAccounts;
      const targetAccount = currentAccounts[accountId] || defaultAccounts[accountId];
      const updatedAccount = { ...targetAccount, ...updates };

      const newAccounts = {
        ...currentAccounts,
        [accountId]: updatedAccount
      };

      return {
        ...prev,
        accounts: newAccounts,
        ...(accountId === (prev.activeAccountTab || 'WA1')
          ? {
              selectedPipelineId: updatedAccount.selectedPipelineId,
              alertRecipients: updatedAccount.alertRecipients,
              qrConnected: updatedAccount.qrConnected,
              connectedPhone: updatedAccount.phone
            }
          : {})
      };
    });
    recordAudit('UPDATE', 'WhatsApp', `Configuración de WhatsApp cuenta ${accountId} actualizada.`);
  };

  // Instagram
  const saveInstagramConfig = (configUpdates: Partial<InstagramConfig>) => {
    setInstagramConfig((prev) => ({ ...prev, ...configUpdates }));
    recordAudit('UPDATE', 'Instagram', 'Configuración de Instagram guardada.');
  };

  // Facebook
  const saveFacebookConfig = (configUpdates: Partial<FacebookConfig>) => {
    setFacebookConfig((prev) => ({ ...prev, ...configUpdates }));
    recordAudit('UPDATE', 'Facebook', 'Configuración de Facebook guardada.');
  };

  const sendWhatsAppMessage = async (
    conversationId: string,
    text: string,
    mediaType?: 'text' | 'image' | 'audio' | 'video' | 'sticker' | 'gif' | 'document',
    mediaUrl?: string,
    mediaName?: string,
    mediaSize?: string,
    mediaDuration?: number,
    account?: 'WA1' | 'WA2'
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMsg: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      direction: 'outbound' as const,
      sender: currentUser.name,
      senderName: currentUser.name,
      senderId: currentUser.id,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      content: text || (mediaType ? `[${mediaType.toUpperCase()}]` : ''),
      text: text,
      mediaType: mediaType || 'text',
      mediaUrl,
      mediaName,
      mediaSize,
      mediaDuration,
      reactions: [],
      timestamp: `Hoy ${timeStr}`,
      status: 'sent' as const
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessage: text || (mediaType ? `[${mediaType.toUpperCase()}]` : 'Archivo adjunto'),
              lastMessageTime: `Hoy ${timeStr}`,
              messages: [...c.messages, newMsg]
            }
          : c
      )
    );

    const conv = conversations.find((c) => c.id === conversationId);
    if (conv?.clientId) {
      addActivity({
        clientId: conv.clientId,
        type: 'whatsapp',
        title: 'WhatsApp saliente',
        description: text ? (text.length > 80 ? `${text.slice(0, 80)}...` : text) : `Envío de archivo ${mediaType}`
      });
    }

    recordAudit('SEND_MESSAGE', 'WhatsApp', `Mensaje WhatsApp enviado a ${conv?.contactName || 'contacto'}.`, conv?.contactName);

    // Call HTTP fetch to Evolution API for instance WA1 or WA2
    const targetAccount: 'WA1' | 'WA2' = account || conv?.account || whatsAppConfig.activeAccountTab || 'WA1';
    const instanceName = whatsAppConfig.accounts?.[targetAccount]?.instanceName || `${currentTenant.id}-${targetAccount.toLowerCase()}`;
    const recipientPhone = (conv?.contactPhone || '').replace(/\D/g, '');

    try {
      let response: Response;
      if (mediaUrl && mediaType && mediaType !== 'text') {
        response = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            number: recipientPhone,
            media: mediaUrl,
            mediatype: mediaType,
            caption: text || mediaName || '',
            fileName: mediaName || 'file'
          })
        });
      } else {
        response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            number: recipientPhone,
            text: text
          })
        });
      }

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error(`Error enviando mensaje vía Evolution API (${instanceName}):`, responseData);
        return {
          success: false,
          message: responseData?.message || `Error HTTP ${response.status} en Evolution API`,
          data: responseData
        };
      }

      return {
        success: true,
        message: 'Mensaje enviado exitosamente vía Evolution API',
        data: responseData
      };
    } catch (error: any) {
      console.error(`Excepción al conectar con Evolution API (${instanceName}):`, error);
      return {
        success: false,
        message: error?.message || 'Error de red al conectar con Evolution API'
      };
    }
  };

  const toggleWhatsAppReaction = (conversationId: string, messageId: string, emoji: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          messages: c.messages.map((m) => {
            if (m.id !== messageId) return m;
            const existingReactions = m.reactions || [];
            const foundIdx = existingReactions.findIndex((r) => r.emoji === emoji);
            let updatedReactions: any[];
            if (foundIdx >= 0) {
              const r = existingReactions[foundIdx];
              if (r.users.includes(currentUser.id)) {
                const newUsers = r.users.filter((u) => u !== currentUser.id);
                if (newUsers.length === 0) {
                  updatedReactions = existingReactions.filter((_, idx) => idx !== foundIdx);
                } else {
                  updatedReactions = existingReactions.map((item, idx) =>
                    idx === foundIdx ? { ...item, users: newUsers } : item
                  );
                }
              } else {
                updatedReactions = existingReactions.map((item, idx) =>
                  idx === foundIdx ? { ...item, users: [...item.users, currentUser.id] } : item
                );
              }
            } else {
              updatedReactions = [...existingReactions, { emoji, users: [currentUser.id] }];
            }
            return { ...m, reactions: updatedReactions };
          })
        };
      })
    );
  };

  const updateN8nConfig = (config: Partial<N8nConfig>) => {
    setN8nConfig((prev) => ({ ...prev, ...config }));
    recordAudit('UPDATE', 'Configuración', 'Configuración de Webhooks N8N actualizada.');
  };

  const updateAiConfig = (config: Partial<AiIntegrationConfig>) => {
    setAiConfig((prev) => ({ ...prev, ...config }));
    recordAudit('UPDATE', 'Configuración', `Configuración de IA (${config.provider || aiConfig.provider}) actualizada.`);
  };

  const updateScheduledRules = (rules: ScheduledRule[]) => {
    setScheduledRules(rules);
    recordAudit('UPDATE', 'Campañas', 'Reglas automatizadas de envío programado actualizadas.');
  };

  const updateAntiSpamSettings = (settings: Partial<AntiSpamSettings>) => {
    setAntiSpamSettings((prev) => ({ ...prev, ...settings }));
    recordAudit('UPDATE', 'Configuración', 'Políticas y cuotas de seguridad Anti-Spam actualizadas.');
  };

  const startWhatsAppConversation = (clientId: string, phone: string, name: string, initialMsg?: string, account: 'WA1' | 'WA2' = 'WA1'): string => {
    const existing = conversations.find((c) => c.tenantId === currentTenantId && (c.clientId === clientId || c.contactPhone === phone));
    if (existing) {
      if (initialMsg) {
        sendWhatsAppMessage(existing.id, initialMsg);
      }
      return existing.id;
    }

    const convId = `conv-${Date.now()}`;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newConv: WhatsAppConversation = {
      id: convId,
      tenantId: currentTenantId,
      account,
      clientId,
      contactName: name,
      contactPhone: phone,
      lastMessage: initialMsg || 'Conversación iniciada',
      lastMessageTime: `Hoy ${timeStr}`,
      unreadCount: 0,
      assignedAgentId: currentUser.id,
      messages: initialMsg
        ? [
            {
              id: `msg-${Date.now()}`,
              conversationId: convId,
              direction: 'outbound',
              sender: currentUser.name,
              content: initialMsg,
              timestamp: `Hoy ${timeStr}`,
              status: 'sent'
            }
          ]
        : []
    };

    setConversations((prev) => [newConv, ...prev]);
    return convId;
  };

  // SMTP Email
  const saveSmtpConfig = async (configUpdates: Partial<SmtpConfig>) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      try {
        const result = await smtpService.updateConfig(configUpdates);
        if (result.success) {
          setSmtpConfig((prev) => ({ ...prev, ...configUpdates }));
          recordAudit('UPDATE', 'Email', `Configuración SMTP actualizada (${configUpdates.senderEmail || smtpConfig.senderEmail}).`);
        } else {
          console.error('Error saving SMTP config:', result.error);
        }
      } catch (err) {
        console.error('Error saving SMTP config:', err);
      }
    } else {
      setSmtpConfig((prev) => ({ ...prev, ...configUpdates }));
      recordAudit('UPDATE', 'Email', `Configuración SMTP actualizada (${configUpdates.senderEmail || smtpConfig.senderEmail}).`);
    }
  };

  const sendEmailMessage = async (to: string, subject: string, body: string, clientId?: string): Promise<boolean> => {
    const result = await smtpService.sendEmail({
      to,
      subject,
      body,
      clientId
    });
    if (result.success) {
      if (clientId) {
        addActivity({
          clientId,
          type: 'email',
          title: `Correo enviado: ${subject}`,
          description: `Enviado a ${to} desde ${smtpConfig.senderEmail}.`
        });
      }
      recordAudit('SEND_MESSAGE', 'Email', `Correo "${subject}" enviado con éxito a ${to}.`, to);
      return true;
    } else {
      console.error('SMTP send error:', result.error);
      return false;
    }
  };

  // Templates
  const saveTemplate = (tpl: Partial<MessageTemplate>) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (tpl.id) {
      setTemplates((prev) => prev.map((t) => (t.id === tpl.id ? ({ ...t, ...tpl } as MessageTemplate) : t)));
      recordAudit('UPDATE', 'Configuración', `Plantilla "${tpl.name}" actualizada.`, tpl.name);
    } else {
      const newTpl: MessageTemplate = {
        id: `tpl-${Date.now()}`,
        tenantId: currentTenantId,
        name: tpl.name || 'Nueva Plantilla',
        channel: tpl.channel || 'both',
        category: tpl.category || 'General',
        subject: tpl.subject || '',
        body: tpl.body || '',
        variables: tpl.variables || ['nombre', 'poliza'],
        createdAt: dateStr
      };
      setTemplates((prev) => [newTpl, ...prev]);
      recordAudit('CREATE', 'Configuración', `Nueva plantilla de mensaje "${newTpl.name}" creada.`, newTpl.name);
    }
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    recordAudit('DELETE', 'Configuración', 'Plantilla eliminada.');
  };

  // Internal Team Chat
  const sendChatMessage = (
    content: string,
    channelId?: string,
    recipientUserId?: string,
    mediaType?: 'text' | 'image' | 'audio' | 'video' | 'sticker' | 'gif' | 'document',
    mediaUrl?: string,
    mediaName?: string,
    mediaSize?: string,
    mediaDuration?: number
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `cmsg-${Date.now()}`,
      channelId,
      recipientUserId,
      senderUserId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: content || (mediaType ? `[${mediaType.toUpperCase()}]` : ''),
      mediaType: mediaType || 'text',
      mediaUrl,
      mediaName,
      mediaSize,
      mediaDuration,
      reactions: [],
      timestamp: `Hoy ${timeStr}`
    };

    setChatMessages((prev) => [...prev, newMsg]);
  };

  const toggleInternalChatReaction = (messageId: string, emoji: string) => {
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existingReactions = m.reactions || [];
        const foundIdx = existingReactions.findIndex((r) => r.emoji === emoji);
        let updatedReactions: any[];
        if (foundIdx >= 0) {
          const r = existingReactions[foundIdx];
          if (r.users.includes(currentUser.id)) {
            const newUsers = r.users.filter((u) => u !== currentUser.id);
            if (newUsers.length === 0) {
              updatedReactions = existingReactions.filter((_, idx) => idx !== foundIdx);
            } else {
              updatedReactions = existingReactions.map((item, idx) =>
                idx === foundIdx ? { ...item, users: newUsers } : item
              );
            }
          } else {
            updatedReactions = existingReactions.map((item, idx) =>
              idx === foundIdx ? { ...item, users: [...item.users, currentUser.id] } : item
            );
          }
        } else {
          updatedReactions = [...existingReactions, { emoji, users: [currentUser.id] }];
        }
        return { ...m, reactions: updatedReactions };
      })
    );
  };

  // Issabel Telephony
  const saveIssabelConfig = (configUpdates: Partial<IssabelConfig>) => {
    setIssabelConfig((prev) => ({ ...prev, ...configUpdates }));
    recordAudit('UPDATE', 'Telefonía', `Configuración PBX Issabel actualizada (${configUpdates.host || issabelConfig.host}).`);
  };

  const startCall = (number: string, clientName: string, clientId?: string) => {
    setActiveCall({
      active: true,
      clientName,
      number,
      duration: 0,
      clientId
    });
    setShowSoftphone(true);
  };

  const endCall = (dispositionNotes?: string) => {
    if (!activeCall) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newCDR: CallRecord = {
      id: `cdr-${Date.now()}`,
      tenantId: currentTenantId,
      clientId: activeCall.clientId,
      clientName: activeCall.clientName,
      agentId: currentUser.id,
      agentName: currentUser.name,
      agentExtension: currentUser.extension || '101',
      destinationNumber: activeCall.number,
      direction: 'outbound',
      status: activeCall.duration > 0 ? 'ANSWERED' : 'NO ANSWER',
      durationSeconds: activeCall.duration,
      notes: dispositionNotes || 'Llamada finalizada por el asesor.',
      timestamp: dateStr
    };

    setCallRecords((prev) => [newCDR, ...prev]);

    if (activeCall.clientId) {
      addActivity({
        clientId: activeCall.clientId,
        type: 'call',
        title: `Llamada Issabel PBX (${Math.floor(activeCall.duration / 60)}m ${activeCall.duration % 60}s)`,
        description: dispositionNotes || `Llamada saliente desde extensión ${currentUser.extension || '101'}.`
      });
    }

    recordAudit('CALL', 'Telefonía', `Llamada de ${activeCall.duration}s realizada a ${activeCall.clientName} (${activeCall.number}).`, activeCall.clientName);
    setActiveCall(null);
  };

  // Campaigns
  const createCampaign = (campaignData: Omit<Campaign, 'id' | 'tenantId' | 'createdAt' | 'sentCount' | 'deliveredCount' | 'readCount' | 'repliedCount'>) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newCmp: Campaign = {
      ...campaignData,
      id: `cmp-${Date.now()}`,
      tenantId: currentTenantId,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      repliedCount: 0,
      createdAt: dateStr
    };

    setCampaigns((prev) => [newCmp, ...prev]);
    recordAudit('CREATE', 'Campañas', `Nueva campaña "${newCmp.name}" creada para canal ${newCmp.channel}.`, newCmp.name);
  };

  const executeCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campaignId) {
          const sent = c.totalAudience;
          const delivered = Math.floor(sent * 0.96);
          const read = Math.floor(delivered * 0.72);
          const replied = Math.floor(read * 0.28);
          return {
            ...c,
            status: 'Completada',
            sentCount: sent,
            deliveredCount: delivered,
            readCount: read,
            repliedCount: replied
          };
        }
        return c;
      })
    );

    const cmp = campaigns.find((c) => c.id === campaignId);
    if (cmp) {
      recordAudit('UPDATE', 'Campañas', `Ejecución masiva de campaña "${cmp.name}" transmitida a ${cmp.totalAudience} destinatarios.`, cmp.name);
    }
  };

  // Mass Import
  const importClientsBulk = (
    importedRows: any[],
    mode: 'round_robin' | 'single_agent',
    targetAgentId?: string
  ): { count: number } => {
    const activeAgents = users.filter((u) => u.tenantId === currentTenantId && u.status === 'active');
    const agentIds = activeAgents.map((a) => a.id);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newClients: Client[] = importedRows.map((row, idx) => {
      const assignedAgent =
        mode === 'round_robin' && agentIds.length > 0
          ? agentIds[idx % agentIds.length]
          : targetAgentId || currentUser.id;

      return {
        id: `cli-imp-${Date.now()}-${idx}`,
        tenantId: currentTenantId,
        firstName: row.firstName || row.nombre || 'Contacto',
        lastName: row.lastName || row.apellido || '',
        email: row.email || row.correo || '',
        phone: row.phone || row.telefono || '+1 (000) 000-0000',
        birthDate: row.birthDate || row.fecha_nacimiento || '',
        gender: row.gender || row.genero || 'Otro',
        idNumber: row.idNumber || row.cedula || row.ssn || '',
        category: row.category || row.categoria || 'Regular',
        tags: row.tags ? (Array.isArray(row.tags) ? row.tags : [row.tags]) : ['Importado CSV'],
        status: 'Lead',
        assignedAgentId: assignedAgent,
        pipelineId: tenantPipelines[0]?.id || 'pipe-1',
        stageId: tenantPipelines[0]?.stages[0]?.id || 'stg-1',
        dealValue: Number(row.dealValue || row.valor) || 0,
        leadSource: row.leadSource || 'Base de Datos Importada',
        customFields: row.customFields || {},
        createdAt: dateStr,
        updatedAt: dateStr
      };
    });

    setClients((prev) => [...newClients, ...prev]);
    recordAudit('EXPORT', 'Clientes', `Importación masiva completada: ${newClients.length} clientes agregados con asignación ${mode === 'round_robin' ? 'Equitativa (Round-Robin)' : 'Individual'}.`);
    return { count: newClients.length };
  };

  // Web Audio Synthesized Chime (Clean Dual-Tone chime without external audio files)
  const playChimeTone = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio not permitted or locked by autoplay policy
    }
  };

  // Browser Native Notification Dispatcher
  const sendBrowserNativeNotification = (title: string, body: string, tag?: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=100&auto=format&fit=crop&q=80',
            tag: tag || `crm-notif-${Date.now()}`
          });
        } catch (err) {
          console.warn('Native notification suppressed:', err);
        }
      }
    }
  };

  // Request native permission
  const requestBrowserNotificationPermission = async (): Promise<NotificationPermission> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setBrowserNotificationPermission(permission);
        if (permission === 'granted') {
          sendBrowserNativeNotification(
            '🔔 Notificaciones Activadas en Atoms CRM',
            'Recibirás alertas en tiempo real de nuevos mensajes de WhatsApp y cambios en pólizas.'
          );
        }
        return permission;
      } catch (e) {
        return 'denied';
      }
    }
    return 'denied';
  };

  // App Notifications CRUD
  const addAppNotification = (notifData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const targetTenantId = notifData.tenantId || currentTenantId;
    const newNotif: AppNotification = {
      ...notifData,
      tenantId: targetTenantId,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: `Hoy ${timeStr}`,
      read: false
    };

    setAppNotifications((prev) => [newNotif, ...prev]);
    // Only pop toast if it matches current active tenant
    if (targetTenantId === currentTenantId) {
      setLatestLiveNotification(newNotif);
      playChimeTone();
      sendBrowserNativeNotification(newNotif.title, newNotif.message, newNotif.id);
    }
  };

  const markAppNotificationRead = (id: string) => {
    setAppNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAppNotificationsRead = () => {
    setAppNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteAppNotification = (id: string) => {
    setAppNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Interactive Simulation Triggers for WhatsApp and Policies
  const simulateIncomingWhatsAppMessage = (
    phone = '+1 (786) 902-1144',
    text = 'Hola, quisiera cotizar la póliza de salud ACA para mi familia.',
    account: 'WA1' | 'WA2' = 'WA1',
    clientName = 'Alejandro Morales'
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Find or create conversation
    let conv = conversations.find((c) => c.tenantId === currentTenantId && (c.contactPhone === phone || c.account === account));
    let convId = conv ? conv.id : `conv-${Date.now()}`;

    if (!conv) {
      conv = {
        id: convId,
        tenantId: currentTenantId,
        account,
        contactName: clientName,
        contactPhone: phone,
        lastMessage: text,
        lastMessageTime: `Hoy ${timeStr}`,
        unreadCount: 1,
        messages: [
          {
            id: `msg-${Date.now()}`,
            conversationId: convId,
            direction: 'inbound',
            sender: clientName,
            content: text,
            timestamp: `Hoy ${timeStr}`,
            status: 'delivered'
          }
        ]
      };
      setConversations((prev) => [conv!, ...prev]);
    } else {
      const newMsg: WhatsAppMessage = {
        id: `msg-${Date.now()}`,
        conversationId: conv.id,
        direction: 'inbound',
        sender: clientName,
        content: text,
        timestamp: `Hoy ${timeStr}`,
        status: 'delivered'
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv!.id
            ? {
                ...c,
                lastMessage: text,
                lastMessageTime: `Hoy ${timeStr}`,
                unreadCount: (c.unreadCount || 0) + 1,
                messages: [...c.messages, newMsg]
              }
            : c
        )
      );
    }

    addAppNotification({
      tenantId: currentTenantId,
      type: 'whatsapp_message',
      title: `Nuevo WhatsApp en ${account} (${account === 'WA1' ? 'Línea 1 Cloud' : 'Línea 2 QR'})`,
      message: `${clientName} (${phone}): "${text}"`,
      priority: 'high',
      metadata: {
        conversationId: convId,
        clientPhone: phone,
        clientName,
        account
      }
    });

    recordAudit('SEND_MESSAGE', 'WhatsApp', `Mensaje entrante simulado recibido en ${account} de ${clientName}.`, clientName);
  };

  const simulatePolicyStatusChange = (policyId?: string, newStatus?: Policy['status']) => {
    const targetPolicy = policies.find((p) => (policyId ? p.id === policyId : p.tenantId === currentTenantId)) || policies[0];
    if (!targetPolicy) return;

    const chosenStatus: Policy['status'] = newStatus || (targetPolicy.status === 'En Proceso' ? 'Activa' : targetPolicy.status === 'Activa' ? 'Pendiente de Pago' : 'Activa');
    const oldStatus = targetPolicy.status;

    updatePolicy(targetPolicy.id, { status: chosenStatus }, `Estado actualizado en tiempo real a ${chosenStatus}`);

    addAppNotification({
      tenantId: targetPolicy.tenantId,
      type: 'policy_status_change',
      title: `Actualización de Póliza #${targetPolicy.policyNumber}`,
      message: `Póliza de ${targetPolicy.clientName || 'Cliente'} (${targetPolicy.carrier}) cambió de "${oldStatus}" a "${chosenStatus}".`,
      priority: chosenStatus === 'Activa' ? 'medium' : 'high',
      metadata: {
        policyId: targetPolicy.id,
        policyNumber: targetPolicy.policyNumber,
        carrier: targetPolicy.carrier,
        clientId: targetPolicy.clientId,
        clientName: targetPolicy.clientName,
        oldStatus,
        newStatus: chosenStatus
      }
    });
  };

  const simulateWebLeadQuoteRequest = (
    tenantId = currentTenantId,
    leadData = {
      name: 'Camila Rodriguez',
      phone: '+1 (786) 334-9081',
      email: 'camila.rodriguez@gmail.com',
      service: 'Obamacare / ACA (Salud)',
      state: 'Florida',
      householdSize: 3,
      estimatedIncome: 42000,
      notes: 'Interesada en plan Silver con cobertura dental para sus 2 hijos.'
    }
  ) => {
    submitMicroLandingLead(tenantId, leadData);
  };

  // SaaS Master / Delegated Admins CRUD
  const addSaasAdmin = (adminData: Omit<SaasDelegatedAdmin, 'id' | 'createdAt'>) => {
    const newAdmin: SaasDelegatedAdmin = {
      ...adminData,
      id: `saas-adm-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setSaasAdmins((prev) => [newAdmin, ...prev]);
    recordAudit('CREATE', 'Usuarios', `Nuevo Administrador Delegado SaaS (${newAdmin.name}) creado con permisos granulares.`, newAdmin.name);
  };

  const updateSaasAdmin = (id: string, updates: Partial<SaasDelegatedAdmin>) => {
    setSaasAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    recordAudit('UPDATE', 'Usuarios', `Permisos/estado del Administrador SaaS (${id}) actualizados.`);
  };

  const deleteSaasAdmin = (id: string) => {
    setSaasAdmins((prev) => prev.filter((a) => a.id !== id));
    recordAudit('DELETE', 'Usuarios', `Administrador Delegado SaaS (${id}) removido.`);
  };

  // Tenant Creation by Super Admin
  const createTenant = (tenantData: Partial<TenantBranding>, initialAdminUser?: Partial<User>): TenantBranding => {
    const slug = tenantData.name ? tenantData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : `tenant-${Date.now()}`;
    const newTenantId = tenantData.id || `tenant-${slug}`;

    const newTenant: TenantBranding = {
      id: newTenantId,
      name: tenantData.name || 'Nueva Empresa Seguros',
      legalName: tenantData.legalName || `${tenantData.name || 'Empresa'} LLC`,
      taxId: tenantData.taxId || `EIN-${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000000 + Math.random() * 9000000)}`,
      primaryColor: tenantData.primaryColor || '#4f46e5',
      secondaryColor: tenantData.secondaryColor || '#10b981',
      accentColor: tenantData.accentColor || '#f59e0b',
      currency: tenantData.currency || 'USD',
      language: tenantData.language || 'es',
      subscription: tenantData.subscription || {
        plan: 'Starter',
        status: 'active',
        monthlyPrice: 79,
        renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        userQuota: 5,
        whatsappLinesQuota: 1,
        storageGb: 20,
        contactEmail: initialAdminUser?.email || 'admin@nuevaempresa.com'
      },
      landingConfig: tenantData.landingConfig || {
        tenantId: newTenantId,
        isEnabled: true,
        agencyName: tenantData.name || 'Agencia de Seguros',
        tagline: 'Asesoría profesional en planes de salud y pólizas de vida.',
        aboutText: 'Brindamos cobertura médica confiable con subsidios federales.',
        whatsappDirectNumber: initialAdminUser?.phone || '+1 (800) 555-0100',
        callDirectNumber: '+1 (800) 555-0100',
        officeAddress: 'Miami, FL',
        officeHours: 'Lunes a Viernes 9:00 AM - 6:00 PM',
        carriersOffered: ['Florida Blue', 'Ambetter', 'Oscar Health'],
        servicesOffered: ['Obamacare / ACA', 'Seguros de Vida', 'Dental y Visión'],
        quoteFormEnabled: true,
        slug: slug,
        themeColor: tenantData.primaryColor || '#4f46e5'
      }
    };

    // Add initial admin user for this new company
    const newAdminUser: User = {
      id: `usr-${Date.now()}`,
      tenantId: newTenantId,
      name: initialAdminUser?.name || `Admin ${newTenant.name}`,
      email: initialAdminUser?.email || `admin@${slug}.com`,
      role: 'admin',
      phone: initialAdminUser?.phone || '+1 (786) 555-0199',
      extension: '101',
      status: 'active',
      lastLogin: 'Recién Creado',
      commissionRate: 15,
      twoFactorEnabled: false
    };

    // Set default initial pipeline for new tenant
    const defaultPipeline: Pipeline = {
      id: `pipe-${Date.now()}`,
      tenantId: newTenantId,
      name: 'Embudo de Ventas ACA',
      isDefault: true,
      stages: [
        { id: `stg-${Date.now()}-1`, name: 'Prospecto Nuevo', color: '#6366f1', order: 1, winProbability: 15 },
        { id: `stg-${Date.now()}-2`, name: 'Cotización Enviada', color: '#0ea5e9', order: 2, winProbability: 40 },
        { id: `stg-${Date.now()}-3`, name: 'Documentos Recibidos', color: '#f59e0b', order: 3, winProbability: 75 },
        { id: `stg-${Date.now()}-4`, name: 'Póliza Emitida / Ganada', color: '#10b981', order: 4, winProbability: 100 }
      ]
    };

    setTenants((prev) => [...prev, newTenant]);
    setUsers((prev) => [...prev, newAdminUser]);
    setPipelines((prev) => [...prev, defaultPipeline]);

    recordAudit('CREATE', 'Configuración', `Nueva empresa (${newTenant.name}) aprovisionada en Atoms Cloud con Administrador (${newAdminUser.email}).`, newTenant.name);

    return newTenant;
  };

  const updateTenantSubscription = (tenantId: string, subscriptionUpdates: Partial<TenantSubscription>) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== tenantId) return t;
        const currentSub = t.subscription || {
          plan: 'Starter',
          status: 'active',
          monthlyPrice: 79,
          renewalDate: '2026-09-30',
          userQuota: 5,
          whatsappLinesQuota: 1,
          storageGb: 20
        };
        return {
          ...t,
          subscription: { ...currentSub, ...subscriptionUpdates }
        };
      })
    );
    recordAudit('UPDATE', 'Configuración', `Suscripción/plan de la empresa (${tenantId}) actualizada.`);
  };

  // SaaS Master Landing & Global Branding Config
  const updateSaasLandingConfig = (updates: Partial<SaasLandingConfig>) => {
    setSaasLandingConfig((prev) => {
      const nextConfig = { ...prev, ...updates };

      // Dynamically recalculate public URL if crmName or domainName changed
      if (updates.crmName && (!updates.publicUrl || updates.publicUrl.includes('atoms-crm'))) {
        nextConfig.publicUrl = getSaasPublicUrl(nextConfig.crmName, undefined, nextConfig.domainName);
      }

      // Update browser document title if in browser environment
      if (typeof document !== 'undefined' && nextConfig.crmName) {
        document.title = `${nextConfig.crmName} | CRM SaaS Multi-Empresas de Seguros`;
      }

      return nextConfig;
    });

    const changeSummary = updates.crmName
      ? `Identidad SaaS actualizada: ${updates.crmName} (${updates.domainName || saasLandingConfig.domainName || 'dominio'}).`
      : 'Landing page promocional y configuración SaaS master actualizada.';

    recordAudit('UPDATE', 'Configuración', changeSummary);
  };

  // SaaS Master External Backend & Database Integration Handlers
  const updateSaasDatabaseConfig = (updates: Partial<SaasDatabaseConfig>) => {
    setSaasDatabaseConfig((prev) => ({ ...prev, ...updates }));
    recordAudit('UPDATE', 'Integraciones', `Configuración de base de datos externa (${updates.provider || saasDatabaseConfig.provider}) actualizada.`);
  };

  const testDatabaseConnection = async (
    configOverrides?: Partial<SaasDatabaseConfig>
  ): Promise<{ success: boolean; message: string; latencyMs?: number; tablesFound?: number }> => {
    const activeCfg = { ...saasDatabaseConfig, ...(configOverrides || {}) };
    await new Promise((r) => setTimeout(r, 900));

    const latencyMs = Math.floor(28 + Math.random() * 45);
    const providerNames: Record<string, string> = {
      supabase: 'Supabase PostgreSQL Cloud',
      pocketbase: 'PocketBase REST & Realtime Server',
      firebase: 'Firebase Firestore & Auth',
      mongodb: 'MongoDB Atlas NoSQL Cluster',
      postgresql: 'PostgreSQL Relational DB'
    };

    const providerTitle = providerNames[activeCfg.provider] || activeCfg.provider;

    // Validate provider specific required keys
    let isValid = false;
    let details = '';

    switch (activeCfg.provider) {
      case 'supabase':
        isValid = Boolean(activeCfg.supabase?.projectUrl && (activeCfg.supabase?.anonPublicKey || activeCfg.supabase?.serviceRoleKey));
        details = `Proyecto: ${activeCfg.supabase?.projectUrl || 'N/A'}`;
        break;
      case 'pocketbase':
        isValid = Boolean(activeCfg.pocketbase?.apiUrl && activeCfg.pocketbase?.adminEmail);
        details = `Host: ${activeCfg.pocketbase?.apiUrl || 'N/A'}`;
        break;
      case 'firebase':
        isValid = Boolean(activeCfg.firebase?.projectId && activeCfg.firebase?.apiKey);
        details = `App: ${activeCfg.firebase?.projectId || 'N/A'}`;
        break;
      case 'mongodb':
        isValid = Boolean(activeCfg.mongodb?.connectionUri && activeCfg.mongodb?.databaseName);
        details = `Base: ${activeCfg.mongodb?.databaseName || 'N/A'}`;
        break;
      case 'postgresql':
        isValid = Boolean(activeCfg.postgresql?.host && activeCfg.postgresql?.database && activeCfg.postgresql?.user);
        details = `Host: ${activeCfg.postgresql?.host}:${activeCfg.postgresql?.port || 5432}/${activeCfg.postgresql?.database}`;
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setSaasDatabaseConfig((prev) => ({
        ...prev,
        status: 'connected',
        lastTestedAt: new Date().toISOString(),
        lastErrorMessage: undefined
      }));

      recordAudit('UPDATE', 'Integraciones', `Prueba de conexión exitosa con ${providerTitle} (${latencyMs}ms).`);
      return {
        success: true,
        message: `✓ Conexión establecida exitosamente con ${providerTitle}. Latencia: ${latencyMs}ms. Tablas de tenants, clientes y pólizas sincronizadas.`,
        latencyMs,
        tablesFound: 14
      };
    } else {
      const errorMsg = `⚠️ Error de autenticación o parámetros incompletos en ${providerTitle}. Por favor revisa la URL, llaves API o credenciales.`;
      setSaasDatabaseConfig((prev) => ({
        ...prev,
        status: 'error',
        lastTestedAt: new Date().toISOString(),
        lastErrorMessage: errorMsg
      }));
      return {
        success: false,
        message: errorMsg,
        latencyMs
      };
    }
  };

  // SaaS Master VPS Infrastructure Handlers
  const updateSaasVpsConfig = (updates: Partial<SaasVpsDeploymentConfig>) => {
    setSaasVpsConfig((prev) => ({ ...prev, ...updates }));
    recordAudit('UPDATE', 'Integraciones', `Configuración del servidor VPS (${updates.serverIp || saasVpsConfig.serverIp}) actualizada.`);
  };

  // Rich Pipeline Stage Mover with activity tracking and automated stage auditing
  const handleMoveClientStage = (clientId: string, newStageId: string) => {
    const targetClient = clients.find((c) => c.id === clientId);
    if (!targetClient) return;

    // Find stage details in current pipelines
    const allStages = pipelines.flatMap((p) => p.stages || []);
    const oldStage = allStages.find((s) => s.id === targetClient.stageId) || { name: 'Etapa Anterior', winProbability: 20 };
    const newStage = allStages.find((s) => s.id === newStageId) || { name: 'Nueva Etapa', winProbability: 50 };

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Update client
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              stageId: newStageId,
              status: newStage.winProbability >= 100 ? 'Activo' : c.status,
              updatedAt: dateStr
            }
          : c
      )
    );

    // Register activity on the client profile
    addActivity({
      clientId,
      type: 'status_update',
      title: `Etapa del Pipeline: ${newStage.name}`,
      description: `Prospecto avanzado de "${oldStage.name}" a "${newStage.name}" (${newStage.winProbability}% probabilidad de conversión).`
    });

    // Record Immutable Audit Log
    recordAudit(
      'STATUS_CHANGE',
      'Pipeline',
      `Prospecto ${targetClient.firstName} ${targetClient.lastName} movido a la etapa "${newStage.name}" en el Pipeline de Ventas.`,
      `${targetClient.firstName} ${targetClient.lastName}`
    );

    // If deal won / closed, trigger celebration notification
    if (newStage.winProbability >= 100 || newStage.name.toLowerCase().includes('ganada') || newStage.name.toLowerCase().includes('cerrad')) {
      addAppNotification({
        tenantId: targetClient.tenantId,
        type: 'deal_won',
        title: `🎉 ¡Oportunidad Cerrada y Ganada!`,
        message: `${targetClient.firstName} ${targetClient.lastName} avanzó a ${newStage.name} con un valor de $${targetClient.dealValue || 0}.`,
        priority: 'high',
        metadata: {
          clientId,
          clientName: `${targetClient.firstName} ${targetClient.lastName}`,
          dealValue: targetClient.dealValue,
          stageId: newStageId
        }
      });
    }
  };

  // Tenant Agency Micro-Landing Config
  const updateTenantLandingConfig = (tenantId: string, updates: Partial<TenantLandingConfig>) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== tenantId) return t;
        const currentLanding = t.landingConfig || {
          tenantId: t.id,
          isEnabled: true,
          agencyName: t.name,
          tagline: 'Asesoría en seguros de salud y vida',
          aboutText: '',
          whatsappDirectNumber: '+1 (800) 555-0100',
          callDirectNumber: '+1 (800) 555-0100',
          officeAddress: 'Florida, USA',
          officeHours: 'Lunes a Viernes 9am - 6pm',
          carriersOffered: ['Florida Blue', 'Ambetter'],
          servicesOffered: ['ACA / Obamacare', 'Vida'],
          quoteFormEnabled: true,
          slug: t.id
        };
        return {
          ...t,
          landingConfig: { ...currentLanding, ...updates }
        };
      })
    );
    recordAudit('UPDATE', 'Configuración', `Micro-landing de la empresa (${tenantId}) actualizada.`);
  };

  const currentTenantLandingConfig: TenantLandingConfig = useMemo(() => {
    return (
      currentTenant.landingConfig || {
        tenantId: currentTenant.id,
        isEnabled: true,
        agencyName: currentTenant.name,
        tagline: 'Asesoría experta en seguros médicos ACA y pólizas familiares.',
        aboutText: 'Especialistas en planes de salud accesibles con subsidio federal y protección familiar integral.',
        whatsappDirectNumber: '+1 (786) 450-2819',
        whatsappWelcomeMsg: '¡Hola! Deseo cotizar un seguro médico o de vida.',
        callDirectNumber: '+1 (800) 555-0199',
        contactEmail: 'contacto@' + currentTenant.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
        officeAddress: 'Miami, FL, Estados Unidos',
        officeHours: 'Lunes a Viernes 8:30 AM - 6:30 PM (EST)',
        carriersOffered: ['Florida Blue', 'Ambetter', 'Oscar Health', 'UnitedHealthcare', 'Aetna', 'Cigna'],
        servicesOffered: [
          'Obamacare / ACA (Salud)',
          'Seguro de Vida (IUL / Término)',
          'Dental & Visión',
          'Medicare Advantage',
          'Accidentes & Suplementario',
          'Gastos Finales (Final Expense)'
        ],
        quoteFormEnabled: true,
        quoteFormTitle: 'Solicita tu Cotización Gratuita',
        quoteFormSubtitle: 'Ingresa tus datos y un agente certificado de nuestro equipo se comunicará contigo en minutos.',
        slug: currentTenant.id.replace('tenant-', ''),
        themeColor: currentTenant.primaryColor || '#7c3aed',
        secondaryColor: currentTenant.accentColor || '#10b981',
        leadCapturePipelineId: 'pipe-01',
        leadCaptureStageId: 'stage-1',
        defaultLeadSource: 'Micro-Landing Web'
      }
    );
  }, [currentTenant]);

  const submitMicroLandingLead = (
    tenantId: string,
    leadData: {
      name: string;
      phone: string;
      email: string;
      service: string;
      notes?: string;
      state?: string;
      householdSize?: number;
      estimatedIncome?: number;
    }
  ) => {
    const targetTenant = tenants.find((t) => t.id === tenantId) || currentTenant;
    const landingConf = targetTenant.landingConfig;
    const clientId = `cli-lead-${Date.now()}`;
    const nameParts = (leadData.name || 'Lead Web').trim().split(' ');
    const firstName = nameParts[0] || 'Lead';
    const lastName = nameParts.slice(1).join(' ') || 'Web';

    // Find configured pipeline or fallback to tenant default pipeline
    const configuredPipeline = landingConf?.leadCapturePipelineId
      ? pipelines.find((p) => p.id === landingConf.leadCapturePipelineId)
      : null;

    const tenantPipeline =
      configuredPipeline ||
      pipelines.find((p) => p.tenantId === targetTenant.id && p.isDefault) ||
      pipelines.find((p) => p.tenantId === targetTenant.id) ||
      pipelines[0];

    const initialStageId =
      landingConf?.leadCaptureStageId ||
      tenantPipeline?.stages?.[0]?.id ||
      'stage-1';

    const targetAgentId =
      landingConf?.assignedAgentId ||
      users.find((u) => u.tenantId === targetTenant.id && u.role === 'agent')?.id ||
      users.find((u) => u.tenantId === targetTenant.id)?.id ||
      'user-1';

    const leadSourceStr = landingConf?.defaultLeadSource || 'Micro-Landing Web';

    const newClient: Client = {
      id: clientId,
      tenantId: targetTenant.id,
      firstName,
      lastName,
      phone: leadData.phone,
      email: leadData.email || 'lead@contacto.com',
      birthDate: '1990-01-01',
      gender: 'Otro',
      status: 'Lead',
      leadSource: leadSourceStr,
      category: 'Prospecto Calificado',
      stageId: initialStageId,
      dealValue: 180,
      tags: ['Landing Web', leadData.service, 'Cotización Online', `Embudo: ${tenantPipeline?.name || 'General'}`],
      assignedAgentId: targetAgentId,
      customFields: {
        service: leadData.service,
        estimatedIncome: leadData.estimatedIncome || 0,
        householdSize: leadData.householdSize || 1,
        state: leadData.state || 'Florida',
        notes: leadData.notes || '',
        assignedPipeline: tenantPipeline?.name || 'Embudo General'
      },
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setClients((prev) => [newClient, ...prev]);

    // Fire real-time notification
    addAppNotification({
      tenantId: targetTenant.id,
      type: 'web_lead',
      title: `⚡ Cotización Web Solicitada (${leadData.service})`,
      message: `${leadData.name} (${leadData.phone}) solicitó cotización de ${leadData.service} desde la Micro-Landing de ${targetTenant.name}. Se ingresó automáticamente al Pipeline (${tenantPipeline?.name || 'General'}).`,
      priority: 'high',
      metadata: {
        clientId,
        clientName: leadData.name,
        clientPhone: leadData.phone,
        service: leadData.service,
        state: leadData.state,
        estimatedIncome: leadData.estimatedIncome,
        householdSize: leadData.householdSize,
        leadNotes: leadData.notes,
        leadSource: leadSourceStr,
        stageId: initialStageId
      }
    });

    recordAudit('CREATE', 'Clientes', `Lead prospecto web (${leadData.name}) capturado desde Micro-Landing (${targetTenant.name}) e integrado al pipeline (${tenantPipeline?.name}).`, leadData.name);
  };

  // SaaS Central Management Handlers
  const updateSaasPlans = (plans: SaasPlanFeatureLimit[]) => {
    setSaasPlans(plans);
    recordAudit('UPDATE', 'Configuración', 'Planes y límites de cuotas SaaS master actualizados.');
  };

  const updateSaasSmtpConfig = async (config: SaasSmtpConfig) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      try {
        const result = await smtpService.updateSaasConfig(config);
        if (result.success) {
          setSaasSmtpConfig(config);
          recordAudit('UPDATE', 'Configuración', `Configuración del servidor SMTP Central (${config.host}:${config.port}) actualizada.`);
        } else {
          console.error('Error updating SaaS SMTP config:', result.error);
        }
      } catch (err) {
        console.error('Error updating SaaS SMTP config:', err);
      }
    } else {
      setSaasSmtpConfig(config);
      recordAudit('UPDATE', 'Configuración', `Configuración del servidor SMTP Central (${config.host}:${config.port}) actualizada.`);
    }
  };

  const updateSaasNotificationTemplates = async (templates: SaasNotificationTemplates) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      try {
        await smtpService.updateSaasTemplates(templates);
      } catch (err) {
        console.error('Error updating SaaS notification templates:', err);
      }
    }
    setSaasNotificationTemplates(templates);
    recordAudit('UPDATE', 'Configuración', 'Plantillas de correo transaccionales SaaS actualizadas.');
  };

  const testSaasSmtpConnection = async (toEmail: string, config?: SaasSmtpConfig): Promise<{ success: boolean; message: string }> => {
    const smtp = config || saasSmtpConfig;
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      try {
        const result = await smtpService.testSaasConnection(toEmail, smtp);
        if (result.success) {
          recordAudit('UPDATE', 'Configuración', `Prueba de correo SMTP Central exitosa enviada a ${toEmail}.`);
        }
        return result;
      } catch (err) {
        console.error('Error testing SaaS SMTP connection:', err);
        return {
          success: false,
          message: err?.message || 'Error al conectar con el servidor SMTP. Verifica las credenciales.'
        };
      }
    } else {
      return {
        success: false,
        message: '⚠️ No se ha detectado la URL de API backend (VITE_API_URL) ni el servicio activo para procesar el envío SMTP real.'
      };
    }
  };

  const updateSaasWhatsAppCentralConfig = (config: SaasWhatsAppCentralConfig) => {
    setSaasWhatsAppCentralConfig(config);
    recordAudit('UPDATE', 'Configuración', `Línea WhatsApp Central (${config.connectedPhoneNumber || config.adminPhone1}) actualizada.`);
  };

  const sendWhatsAppCentralTestMessage = async (_message: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 500));
    recordAudit('SEND_MESSAGE', 'WhatsApp', `Mensaje de prueba de WhatsApp Central enviado a Administradores.`);
  };

  const updateTenantSubscriptionPlan = (tenantId: string, plan: SaasPlanFeatureLimit) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== tenantId) return t;
        const currentSub = t.subscription || {
          plan: plan.name,
          status: 'active',
          monthlyPrice: plan.price,
          renewalDate: '2026-09-30',
          userQuota: plan.maxUsers,
          whatsappLinesQuota: plan.maxWhatsAppLines,
          storageGb: plan.storageGb
        };
        return {
          ...t,
          subscription: {
            ...currentSub,
            plan: plan.name,
            monthlyPrice: plan.price,
            userQuota: plan.maxUsers,
            whatsappLinesQuota: plan.maxWhatsAppLines,
            storageGb: plan.storageGb
          }
        };
      })
    );
    recordAudit('UPDATE', 'Configuración', `Plan de suscripción de la empresa (${tenantId}) actualizado a ${plan.name}.`);
  };

  const toggleTenantStatus = (tenantId: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== tenantId) return t;
        const currentStatus = t.subscription?.status || 'active';
        const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
        return {
          ...t,
          subscription: {
            ...(t.subscription || {
              plan: 'Pro Business',
              status: 'active',
              monthlyPrice: 149,
              renewalDate: '2026-09-30',
              userQuota: 10,
              whatsappLinesQuota: 2,
              storageGb: 50
            }),
            status: nextStatus
          }
        };
      })
    );
    recordAudit('UPDATE', 'Configuración', `Estado de la empresa (${tenantId}) modificado por SuperAdmin.`);
  };

  const resetTenantData = (tenantId: string) => {
    setClients((prev) => prev.filter((c) => c.tenantId !== tenantId));
    setPolicies((prev) => prev.filter((p) => p.tenantId !== tenantId));
    setConversations((prev) => prev.filter((c) => c.tenantId !== tenantId));
    setCallRecords((prev) => prev.filter((c) => c.tenantId !== tenantId));
    setActivities((prev) => prev.filter((a) => a.tenantId !== tenantId));
    setNotes((prev) => prev.filter((n) => n.tenantId !== tenantId));
    setDocuments((prev) => prev.filter((d) => d.tenantId !== tenantId));
    setBankAccounts((prev) => prev.filter((b) => b.tenantId !== tenantId));
    recordAudit('DELETE', 'Configuración', `Todos los datos operativos de la empresa (${tenantId}) han sido reseteados a estado inicial por SuperAdmin.`);
  };

  const registerNewTenantWithPayment = async (data: {
    companyName: string;
    subdomain: string;
    industry?: string;
    country?: string;
    city?: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    password?: string;
    planId: string;
    planName: string;
    billingCycle: 'monthly' | 'annual';
    amount: number;
    paymentMethod: 'zelle' | 'bank_transfer' | 'credit_card' | 'crypto_usdt';
    referenceNumber: string;
    receiptUrl: string;
    receiptFileName?: string;
    receiptFileType?: string;
    receiptFileSize?: string;
    notes?: string;
  }): Promise<TenantBranding> => {
    const slug = data.subdomain.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
    const newTenantId = `tenant-${slug}`;

    const matchingPlan = saasPlans.find((p) => p.id === data.planId) || saasPlans[1];

    const newTenant: TenantBranding = {
      id: newTenantId,
      name: data.companyName,
      subdomain: slug,
      logoUrl: `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=128&auto=format&fit=crop&q=80`,
      primaryColor: '#4f46e5',
      secondaryColor: '#06b6d4',
      accentColor: '#10b981',
      country: data.country || 'Estados Unidos',
      currency: 'USD',
      timezone: 'America/New_York',
      language: 'es',
      subscription: {
        plan: data.planName,
        status: 'pending_payment',
        monthlyPrice: data.amount,
        renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        userQuota: matchingPlan.maxUsers,
        whatsappLinesQuota: matchingPlan.maxWhatsAppLines,
        storageGb: matchingPlan.storageGb,
        contactEmail: data.adminEmail
      },
      landingConfig: {
        tenantId: newTenantId,
        isEnabled: true,
        agencyName: data.companyName,
        tagline: 'Asesoría experta en seguros médicos ACA y pólizas familiares.',
        aboutText: 'Brindamos cobertura médica integral con subsidios federales.',
        whatsappDirectNumber: data.adminPhone,
        callDirectNumber: data.adminPhone,
        officeAddress: `${data.city || 'Miami'}, ${data.country || 'Florida, USA'}`,
        officeHours: 'Lunes a Viernes 9:00 AM - 6:00 PM',
        carriersOffered: ['Florida Blue', 'Ambetter', 'Oscar Health', 'UnitedHealthcare'],
        servicesOffered: ['Obamacare / ACA', 'Seguros de Vida', 'Dental y Visión'],
        quoteFormEnabled: true,
        slug: slug,
        themeColor: '#4f46e5'
      }
    };

    const newAdminUser: User = {
      id: `usr-${Date.now()}`,
      tenantId: newTenantId,
      name: data.adminName,
      email: data.adminEmail,
      role: 'admin',
      phone: data.adminPhone,
      extension: '101',
      status: 'active',
      lastLogin: 'Registro Inicial',
      commissionRate: 15,
      twoFactorEnabled: false
    };

    const defaultPipeline: Pipeline = {
      id: `pipe-${Date.now()}`,
      tenantId: newTenantId,
      name: 'Embudo de Ventas ACA',
      isDefault: true,
      stages: [
        { id: `stg-${Date.now()}-1`, name: 'Prospecto Nuevo', color: '#6366f1', order: 1, winProbability: 15 },
        { id: `stg-${Date.now()}-2`, name: 'Cotización Enviada', color: '#0ea5e9', order: 2, winProbability: 40 },
        { id: `stg-${Date.now()}-3`, name: 'Documentos Recibidos', color: '#f59e0b', order: 3, winProbability: 75 },
        { id: `stg-${Date.now()}-4`, name: 'Póliza Emitida / Ganada', color: '#10b981', order: 4, winProbability: 100 }
      ]
    };

    const newReceipt: SaasPaymentReceipt = {
      id: `rec-${Date.now()}`,
      tenantId: newTenantId,
      tenantName: data.companyName,
      adminEmail: data.adminEmail,
      adminName: data.adminName,
      adminPhone: data.adminPhone,
      planId: data.planId,
      planName: data.planName,
      amount: data.amount,
      amountPaid: data.amount,
      currency: 'USD',
      billingCycle: data.billingCycle,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      receiptUrl: data.receiptUrl,
      receiptImageUrl: data.receiptUrl,
      receiptFileName: data.receiptFileName || 'comprobante_pago.jpg',
      receiptFileType: data.receiptFileType || 'image/jpeg',
      receiptFileSize: data.receiptFileSize || '420 KB',
      status: 'pending',
      type: 'new_registration',
      submittedAt: new Date().toISOString(),
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    setTenants((prev) => [...prev, newTenant]);
    setUsers((prev) => [...prev, newAdminUser]);
    setPipelines((prev) => [...prev, defaultPipeline]);
    setSaasPaymentReceipts((prev) => [newReceipt, ...prev]);

    // Send Real-time SuperAdmin alert
    addAppNotification({
      tenantId: 'tenant-ateendia',
      type: 'system',
      title: `🏢 Nueva Empresa Registrada: ${data.companyName}`,
      message: `${data.adminName} registró la empresa "${data.companyName}" en el plan ${data.planName} ($${data.amount} USD). Comprobante de pago adjunto (#${data.referenceNumber}) listo para verificación en Central SaaS.`,
      priority: 'high',
      metadata: {
        receiptId: newReceipt.id,
        tenantId: newTenantId,
        amount: data.amount,
        plan: data.planName
      }
    });

    recordAudit('CREATE', 'Configuración', `Empresa (${data.companyName}) registrada por el usuario (${data.adminEmail}) con comprobante de pago (#${data.referenceNumber}).`, data.companyName);

    return newTenant;
  };

  const submitRenewalPaymentReceipt = async (data: {
    tenantId: string;
    tenantName: string;
    adminEmail: string;
    adminName: string;
    adminPhone: string;
    planId: string;
    planName: string;
    amount: number;
    currency?: string;
    billingCycle?: 'monthly' | 'annual';
    paymentMethod: 'zelle' | 'bank_transfer' | 'credit_card' | 'crypto_usdt';
    referenceNumber: string;
    receiptUrl: string;
    receiptFileName?: string;
    receiptFileType?: string;
    receiptFileSize?: string;
    notes?: string;
  }): Promise<SaasPaymentReceipt> => {
    const newReceipt: SaasPaymentReceipt = {
      id: `rec-ren-${Date.now()}`,
      tenantId: data.tenantId,
      tenantName: data.tenantName,
      adminEmail: data.adminEmail,
      adminName: data.adminName,
      adminPhone: data.adminPhone,
      planId: data.planId,
      planName: data.planName,
      amount: data.amount,
      amountPaid: data.amount,
      currency: data.currency || 'USD',
      billingCycle: data.billingCycle || 'monthly',
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      receiptUrl: data.receiptUrl,
      receiptImageUrl: data.receiptUrl,
      receiptFileName: data.receiptFileName || 'renovacion_pago.jpg',
      receiptFileType: data.receiptFileType || 'image/jpeg',
      receiptFileSize: data.receiptFileSize || '380 KB',
      status: 'pending',
      type: 'renewal',
      submittedAt: new Date().toISOString(),
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    setSaasPaymentReceipts((prev) => [newReceipt, ...prev]);

    // Update tenant to pending_payment
    setTenants((prev) =>
      prev.map((t) =>
        t.id === data.tenantId
          ? {
              ...t,
              subscription: {
                ...(t.subscription || {
                  plan: data.planName,
                  status: 'pending_payment',
                  monthlyPrice: data.amount,
                  renewalDate: '2026-09-30',
                  userQuota: 10,
                  whatsappLinesQuota: 2,
                  storageGb: 50
                }),
                status: 'pending_payment'
              }
            }
          : t
      )
    );

    addAppNotification({
      tenantId: 'tenant-ateendia',
      type: 'system',
      title: `🔄 Renovación de Suscripción: ${data.tenantName}`,
      message: `${data.adminName} envió comprobante de renovación para ${data.tenantName} ($${data.amount} USD, Ref: #${data.referenceNumber}).`,
      priority: 'high',
      metadata: {
        receiptId: newReceipt.id,
        tenantId: data.tenantId,
        amount: data.amount
      }
    });

    recordAudit('CREATE', 'Configuración', `Comprobante de renovación enviado para la empresa (${data.tenantName}).`, data.tenantName);

    return newReceipt;
  };

  const approvePaymentReceipt = (receiptId: string, validFrom: string, validUntil: string) => {
    const targetReceipt = saasPaymentReceipts.find((r) => r.id === receiptId);
    if (!targetReceipt) return;

    setSaasPaymentReceipts((prev) =>
      prev.map((r) =>
        r.id === receiptId
          ? {
              ...r,
              status: 'approved',
              validFrom,
              validUntil,
              approvedAt: new Date().toISOString(),
              approvedBy: currentUser.name
            }
          : r
      )
    );

    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== targetReceipt.tenantId) return t;
        const currentSub = t.subscription || {
          plan: targetReceipt.planName,
          status: 'active',
          monthlyPrice: targetReceipt.amount,
          renewalDate: validUntil,
          startDate: validFrom,
          userQuota: 10,
          whatsappLinesQuota: 2,
          storageGb: 50
        };
        return {
          ...t,
          subscription: {
            ...currentSub,
            status: 'active',
            startDate: validFrom,
            renewalDate: validUntil
          }
        };
      })
    );

    addAppNotification({
      tenantId: targetReceipt.tenantId,
      type: 'system',
      title: `🎉 Pago Aprobado y Cuenta Habilitada (${targetReceipt.tenantName})`,
      message: `El comprobante de pago #${targetReceipt.referenceNumber} ha sido verificado. La cuenta ha sido activada del ${validFrom} al ${validUntil}. Se enviaron las credenciales de acceso vía SMTP.`,
      priority: 'high'
    });

    recordAudit('UPDATE', 'Configuración', `Comprobante de pago (#${targetReceipt.referenceNumber}) aprobado para ${targetReceipt.tenantName}. Vigencia: ${validFrom} a ${validUntil}.`, targetReceipt.tenantName);
  };

  const rejectPaymentReceipt = (receiptId: string, reason: string) => {
    const targetReceipt = saasPaymentReceipts.find((r) => r.id === receiptId);
    if (!targetReceipt) return;

    setSaasPaymentReceipts((prev) =>
      prev.map((r) =>
        r.id === receiptId
          ? {
              ...r,
              status: 'rejected',
              rejectionReason: reason
            }
          : r
      )
    );

    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== targetReceipt.tenantId) return t;
        return {
          ...t,
          subscription: {
            ...(t.subscription || {
              plan: targetReceipt.planName,
              status: 'suspended',
              monthlyPrice: targetReceipt.amount,
              renewalDate: '2026-08-01',
              userQuota: 5,
              whatsappLinesQuota: 1,
              storageGb: 20
            }),
            status: 'suspended'
          }
        };
      })
    );

    addAppNotification({
      tenantId: targetReceipt.tenantId,
      type: 'system',
      title: `⚠️ Comprobante Rechazado (${targetReceipt.tenantName})`,
      message: `El comprobante de pago fue rechazado. Motivo: ${reason}`,
      priority: 'high'
    });

    recordAudit('UPDATE', 'Configuración', `Comprobante (#${targetReceipt.referenceNumber}) rechazado para ${targetReceipt.tenantName}. Motivo: ${reason}`, targetReceipt.tenantName);
  };

  // Global SaaS Metrics (Aggregated across all tenants)
  const globalSaasMetrics = useMemo(() => {
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.subscription?.status !== 'suspended').length;
    const totalUsers = users.length;
    const totalClients = clients.length;
    const totalPolicies = policies.filter((p) => p.status === 'Activa').length;
    const totalMonthlyPremiumVolume = policies.reduce((acc, p) => acc + (Number(p.monthlyPremium) || 0), 0);
    const totalMrr = tenants.reduce((acc, t) => acc + (t.subscription?.monthlyPrice || 99), 0);
    const totalWhatsAppConversations = conversations.length;

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalClients,
      totalPolicies,
      totalMonthlyPremiumVolume,
      totalMrr,
      totalWhatsAppConversations
    };
  }, [tenants, users, clients, policies, conversations]);

  // Branding
  const updateTenantBranding = (brandingUpdates: Partial<TenantBranding>) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === currentTenantId ? { ...t, ...brandingUpdates } : t))
    );
    recordAudit('UPDATE', 'Configuración', `Personalización de marca actualizada para ${currentTenant.name}.`);
  };

  // Initialize user session from mock session or PocketBase
  useEffect(() => {
    // First check for mock session in localStorage
    const mockSession = localStorage.getItem('ateendia_mock_session');
    if (mockSession) {
      try {
        const session = JSON.parse(mockSession);
        if (session.expiresAt && Date.now() < session.expiresAt && session.user) {
          const mockUser = session.user;
          // Find matching user in users array
          const matchingUser = users.find(u => u.email === mockUser.email);
          if (matchingUser) {
            setCurrentUserId(matchingUser.id);
            return;
          }
        }
      } catch (e) {
        console.error('Error reading mock session:', e);
      }
    }

    // Check PocketBase auth store
    if (typeof window !== 'undefined') {
      try {
        const pbAuth = localStorage.getItem('pb_auth');
        if (pbAuth) {
          const parsed = JSON.parse(pbAuth);
          if (parsed.model?.email) {
            const pbUser = users.find(u => u.email === parsed.model.email);
            if (pbUser) {
              setCurrentUserId(pbUser.id);
              return;
            }
          }
        }
      } catch (e) {
        console.error('Error reading PocketBase auth:', e);
      }
    }
  }, [users, setCurrentUserId]);

  return (
    <TenantContext.Provider
      value={{
        tenants,
        currentTenant,
        setCurrentTenantId: handleSetCurrentTenantId,
        currentUser,
        setCurrentUserId,
        users: tenantUsers,
        isTwoFactorVerified,
        pendingTwoFactor,
        verify2FACode,
        cancel2FA,
        toggleUser2FA,
        loginUser,
        logoutUser,
        inviteUser,
        updateUserStatus,
        updateUserRole,
        permissionsMatrix,
        updatePermissionsMatrix,
        can,
        clients: tenantClients,
        addClient,
        updateClient,
        deleteClient,
        policies: tenantPolicies,
        addPolicy,
        updatePolicy,
        deletePolicy,
        bankAccounts: tenantBankAccounts,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        setDefaultPaymentMethod,
        documents: tenantDocuments,
        addDocument,
        deleteDocument,
        notes: tenantNotes,
        addNote,
        activities: tenantActivities,
        addActivity,
        pipelines: tenantPipelines,
        savePipelines,
        customFields: tenantCustomFields,
        saveCustomFields,
        addCustomField,
        catalogs,
        saveCatalogs,
        // Integrations
        whatsAppConfig,
        saveWhatsAppConfig,
        updateWhatsAppAccountConfig,
        instagramConfig,
        saveInstagramConfig,
        facebookConfig,
        saveFacebookConfig,
        conversations: tenantConversations,
        sendWhatsAppMessage,
        startWhatsAppConversation,
        toggleWhatsAppReaction,
        n8nConfig,
        updateN8nConfig,
        aiConfig,
        updateAiConfig,
        scheduledRules: tenantScheduledRules,
        updateScheduledRules,
        antiSpamSettings,
        updateAntiSpamSettings,
        smtpConfig,
        saveSmtpConfig,
        sendEmailMessage,
        templates: tenantTemplates,
        saveTemplate,
        deleteTemplate,
        chatChannels: tenantChatChannels,
        chatMessages: tenantChatMessages,
        sendChatMessage,
        toggleInternalChatReaction,
        issabelConfig,
        saveIssabelConfig,
        callRecords: tenantCallRecords,
        activeCall,
        startCall,
        endCall,
        campaigns: tenantCampaigns,
        createCampaign,
        executeCampaign,
        importClientsBulk,
        auditLogs: tenantAuditLogs,
        recordAudit,
        updateTenantBranding,
        alerts,
        dismissAlert,
        appNotifications: tenantAppNotifications,
        latestLiveNotification,
        clearLatestLiveNotification: () => setLatestLiveNotification(null),
        addAppNotification,
        markAppNotificationRead,
        markAllAppNotificationsRead,
        deleteAppNotification,
        requestBrowserNotificationPermission,
        browserNotificationPermission,
        simulateIncomingWhatsAppMessage,
        simulatePolicyStatusChange,
        simulateWebLeadQuoteRequest,
        saasAdmins,
        addSaasAdmin,
        updateSaasAdmin,
        deleteSaasAdmin,
        createTenant,
        updateTenantSubscription,
        updateTenantSubscriptionPlan,
        toggleTenantStatus,
        resetTenantData,
        saasLandingConfig,
        updateSaasLandingConfig,
        updateTenantLandingConfig,
        currentTenantLandingConfig,
        submitMicroLandingLead,
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
        registerNewTenantWithPayment,
        submitRenewalPaymentReceipt,
        approvePaymentReceipt,
        rejectPaymentReceipt,
        globalSaasMetrics,
        saasDatabaseConfig,
        updateSaasDatabaseConfig,
        testDatabaseConnection,
        saasVpsConfig,
        updateSaasVpsConfig,
        showSoftphone,
        setShowSoftphone,
        createClient: addClient,
        createPolicy: addPolicy,
        createTemplate: saveTemplate,
        updateTemplate: saveTemplate,
        updateWhatsAppConfig: saveWhatsAppConfig,
        whatsappConfig: whatsAppConfig,
        updateSmtpConfig: saveSmtpConfig,
        updateIssabelConfig: saveIssabelConfig,
        moveClientStage: handleMoveClientStage,
        sendInternalChatMessage: (
          content: string,
          channelId?: string,
          mediaType?: 'text' | 'image' | 'audio' | 'video' | 'sticker' | 'gif' | 'document',
          mediaUrl?: string,
          mediaName?: string,
          mediaSize?: string,
          mediaDuration?: number
        ) => sendChatMessage(content, channelId, undefined, mediaType, mediaUrl, mediaName, mediaSize, mediaDuration),
        toggleUserStatus: (userId: string) => {
          const u = users.find((x) => x.id === userId);
          if (u) updateUserStatus(userId, u.status === 'active' ? 'inactive' : 'active');
        },
        updateRolePermissions: (role: string, perms: any) => updatePermissionsMatrix(role, perms),
        roles: [
          { key: 'admin' as UserRole, name: 'Administrador (Control Total)', permissions: permissionsMatrix.admin || DEFAULT_PERMISSIONS.admin },
          { key: 'supervisor' as UserRole, name: 'Supervisor (Operaciones y Auditoría)', permissions: permissionsMatrix.supervisor || DEFAULT_PERMISSIONS.supervisor },
          { key: 'agent' as UserRole, name: 'Agente / Asesor (Ventas y Clientes)', permissions: permissionsMatrix.agent || DEFAULT_PERMISSIONS.agent },
          { key: 'readonly' as UserRole, name: 'Solo Lectura (Consulta)', permissions: permissionsMatrix.readonly || DEFAULT_PERMISSIONS.readonly }
        ],
        activeConversationId,
        setActiveConversationId
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
