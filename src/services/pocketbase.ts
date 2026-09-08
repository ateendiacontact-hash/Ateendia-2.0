import PocketBase from 'pocketbase';
import { TenantBranding, User, Client, Policy, BankAccount, ClientDocument, ClientNote, ClientActivity, Pipeline, WhatsAppConfig, WhatsAppConversation, WhatsAppMessage, SmtpConfig, MessageTemplate, ChatChannel, ChatMessage, IssabelConfig, CallRecord, Campaign, AuditLogEntry, CustomFieldDefinition, MasterCatalogs, N8nConfig, AiIntegrationConfig, ScheduledRule, AntiSpamSettings, AppNotification, SaasDelegatedAdmin, SaasLandingConfig, TenantLandingConfig, TenantSubscription, SaasPaymentReceipt, SaasPlanFeatureLimit, SaasSmtpConfig, SaasNotificationTemplates, SaasWhatsAppCentralConfig, SaasDatabaseConfig, SaasVpsDeploymentConfig } from '../types';

const PB_URL = import.meta.env.VITE_POCKETBASE_URL || 'https://pb.ateendia.cloud';

export const pb = new PocketBase(PB_URL);

// Collection names
export const COLLECTIONS = {
  TENANTS: 'tenants',
  USERS: 'users',
  CLIENTS: 'clients',
  POLICIES: 'policies',
  BANK_ACCOUNTS: 'bank_accounts',
  DOCUMENTS: 'documents',
  NOTES: 'notes',
  ACTIVITIES: 'activities',
  PIPELINES: 'pipelines',
  WHATSAPP_CONFIG: 'whatsapp_config',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  SMTP_CONFIG: 'smtp_config',
  TEMPLATES: 'templates',
  CHAT_CHANNELS: 'chat_channels',
  CHAT_MESSAGES: 'chat_messages',
  ISSABEL_CONFIG: 'issabel_config',
  CALL_RECORDS: 'call_records',
  CAMPAIGNS: 'campaigns',
  AUDIT_LOGS: 'audit_logs',
  CUSTOM_FIELDS: 'custom_fields',
  CATALOGS: 'catalogs',
  N8N_CONFIG: 'n8n_config',
  AI_CONFIG: 'ai_config',
  SCHEDULED_RULES: 'scheduled_rules',
  ANTISPAM_SETTINGS: 'antispam_settings',
  APP_NOTIFICATIONS: 'app_notifications',
  SAAS_DELEGATED_ADMINS: 'saas_delegated_admins',
  SAAS_LANDING_CONFIG: 'saas_landing_config',
  TENANT_LANDING_CONFIG: 'tenant_landing_config',
  SAAS_PLANS: 'saas_plans',
  SAAS_RECEIPTS: 'saas_receipts',
  SAAS_SMTP: 'saas_smtp',
  SAAS_NOTIF_TEMPLATES: 'saas_notif_templates',
  SAAS_WA_CENTRAL: 'saas_wa_central',
  SAAS_DATABASE: 'saas_database',
  SAAS_VPS: 'saas_vps',
  DEMO_REQUESTS: 'demo_requests',
  TENANTS_PENDING: 'tenants_pending',
  PAYMENTS: 'payments',
  LEADS: 'leads',
  DEALS: 'deals',
  EMAIL_LOGS: 'email_logs',
  OTP_CODES: 'otp_codes',
} as const;

// Initialize auth store from localStorage
if (typeof window !== 'undefined') {
  const authData = localStorage.getItem('pb_auth');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      pb.authStore.save(parsed.token, parsed.model);
    } catch (e) {
      localStorage.removeItem('pb_auth');
    }
  }
  
  pb.authStore.onChange(() => {
    if (pb.authStore.isValid) {
      localStorage.setItem('pb_auth', JSON.stringify({
        token: pb.authStore.token,
        model: pb.authStore.model,
      }));
    } else {
      localStorage.removeItem('pb_auth');
    }
  });
}

// Generic CRUD helpers with tenant isolation
export async function pbList<T extends { tenantId?: string }>(
  collection: string,
  options?: { filter?: string; sort?: string; page?: number; perPage?: number; expand?: string }
): Promise<{ items: T[]; totalItems: number; totalPages: number; page: number; perPage: number }> {
  const tenantFilter = `tenantId = "${pb.authStore.model?.tenantId || ''}"`;
  const filter = options?.filter ? `${tenantFilter} && ${options.filter}` : tenantFilter;
  
  const result = await pb.collection(collection).getList(options?.page || 1, options?.perPage || 50, {
    filter,
    sort: options?.sort || '-created',
    expand: options?.expand,
  });
  
  return {
    items: result.items as unknown as T[],
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    page: result.page,
    perPage: result.perPage,
  };
}

export async function pbGetOne<T>(collection: string, id: string, expand?: string): Promise<T> {
  const record = await pb.collection(collection).getOne(id, { expand });
  return record as unknown as T;
}

export async function pbCreate<T>(collection: string, data: Partial<T>): Promise<T> {
  const tenantId = pb.authStore.model?.tenantId;
  const record = await pb.collection(collection).create({
    ...data,
    tenantId,
  });
  return record as unknown as T;
}

export async function pbUpdate<T>(collection: string, id: string, data: Partial<T>): Promise<T> {
  const record = await pb.collection(collection).update(id, data);
  return record as unknown as T;
}

export async function pbDelete(collection: string, id: string): Promise<boolean> {
  await pb.collection(collection).delete(id);
  return true;
}

// Realtime subscriptions
export function pbSubscribe<T>(collection: string, callback: (data: T) => void, filter?: string) {
  return pb.collection(collection).subscribe('*', (e) => {
    if (!filter || e.record?.tenantId === pb.authStore.model?.tenantId) {
      callback(e.record as unknown as T);
    }
  }, { filter });
}

export function pbUnsubscribe(collection: string) {
  pb.collection(collection).unsubscribe('*');
}

// Auth helpers
export async function pbLogin(email: string, password: string) {
  return pb.collection(COLLECTIONS.USERS).authWithPassword(email, password);
}

export async function pbLogout() {
  pb.authStore.clear();
}

export function getCurrentUser() {
  return pb.authStore.model;
}

export function getCurrentTenantId() {
  return pb.authStore.model?.tenantId;
}

export function isSuperAdmin() {
  const model = pb.authStore.model;
  // Super Admin Global: email específico victoraray8@gmail.com
  const isGlobalSuperAdmin = model?.email === 'victoraray8@gmail.com';
  // Super Admin por rol (empresa individual)
  const isRoleSuperAdmin = model?.role === 'super_admin' || model?.isSuperAdmin === true;
  return isGlobalSuperAdmin || isRoleSuperAdmin;
}

export function getUserRole() {
  return pb.authStore.model?.role;
}

export function isGlobalSuperAdmin() {
  return pb.authStore.model?.email === 'victoraray8@gmail.com';
}

export default pb;