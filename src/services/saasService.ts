import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';
import { 
  TenantBranding, 
  User, 
  SaasPlanFeatureLimit, 
  SaasPaymentReceipt,
  SaasLandingConfig,
  TenantLandingConfig,
  TenantSubscription,
  SaasDelegatedAdmin,
  SaasSmtpConfig,
  SaasNotificationTemplates,
  SaasWhatsAppCentralConfig,
  SaasDatabaseConfig,
  SaasVpsDeploymentConfig,
  SaasPlanFeatureLimit as SaasPlan
} from '../types';

const TENANTS_ENDPOINT = 'saas/tenants';
const USERS_ENDPOINT = 'saas/users';
const PLANS_ENDPOINT = 'saas/plans';
const RECEIPTS_ENDPOINT = 'saas/receipts';
const LANDING_ENDPOINT = 'saas/landing';
const ADMINS_ENDPOINT = 'saas/admins';
const SAAS_SMTP_ENDPOINT = 'saas/smtp';
const SAAS_TEMPLATES_ENDPOINT = 'saas/templates';
const SAAS_WA_ENDPOINT = 'saas/whatsapp';
const SAAS_DB_ENDPOINT = 'saas/database';
const SAAS_VPS_ENDPOINT = 'saas/vps';

export interface CreateTenantData {
  name: string;
  legalName?: string;
  taxId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  currency?: string;
  language?: string;
  subscription?: Partial<TenantSubscription>;
  landingConfig?: Partial<TenantLandingConfig>;
  initialAdminUser?: Partial<User>;
}

export interface UpdateTenantData extends Partial<TenantBranding> {
  id: string;
}

export interface CreateUserData {
  tenantId: string;
  name: string;
  email: string;
  role: User['role'];
  phone?: string;
  extension?: string;
  commissionRate?: number;
}

export interface CreateReceiptData {
  tenantId: string;
  tenantName: string;
  adminEmail: string;
  adminName: string;
  adminPhone?: string;
  planId: string;
  planName: string;
  amount: number;
  currency?: string;
  billingCycle: 'monthly' | 'annual';
  paymentMethod: 'zelle' | 'bank_transfer' | 'credit_card' | 'crypto_usdt';
  referenceNumber: string;
  receiptUrl: string;
  receiptFileName?: string;
  receiptFileType?: string;
  receiptFileSize?: string;
  notes?: string;
  type: 'new_registration' | 'renewal' | 'plan_upgrade';
}

export const saasService = {
  // Tenants
  async listTenants(page = 1, pageSize = 20): Promise<ApiResponse<PaginatedResponse<TenantBranding>>> {
    return apiClient.getPaginated<TenantBranding>(TENANTS_ENDPOINT, page, pageSize);
  },

  async getAllTenants(): Promise<ApiResponse<TenantBranding[]>> {
    return apiClient.get<TenantBranding[]>(TENANTS_ENDPOINT);
  },

  async getTenantById(id: string): Promise<ApiResponse<TenantBranding>> {
    return apiClient.get<TenantBranding>(`${TENANTS_ENDPOINT}/${id}`);
  },

  async createTenant(data: CreateTenantData): Promise<ApiResponse<TenantBranding>> {
    return apiClient.post<TenantBranding>(TENANTS_ENDPOINT, data);
  },

  async updateTenant(data: UpdateTenantData): Promise<ApiResponse<TenantBranding>> {
    const { id, ...updates } = data;
    return apiClient.patch<TenantBranding>(`${TENANTS_ENDPOINT}/${id}`, updates);
  },

  async updateTenantSubscription(tenantId: string, subscription: Partial<TenantSubscription>): Promise<ApiResponse<TenantBranding>> {
    return apiClient.patch<TenantBranding>(`${TENANTS_ENDPOINT}/${tenantId}/subscription`, subscription);
  },

  async updateTenantSubscriptionPlan(tenantId: string, plan: SaasPlan): Promise<ApiResponse<TenantBranding>> {
    return apiClient.patch<TenantBranding>(`${TENANTS_ENDPOINT}/${tenantId}/plan`, { plan });
  },

  async toggleTenantStatus(tenantId: string): Promise<ApiResponse<TenantBranding>> {
    return apiClient.post<TenantBranding>(`${TENANTS_ENDPOINT}/${tenantId}/toggle-status`, {});
  },

  async resetTenantData(tenantId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`${TENANTS_ENDPOINT}/${tenantId}/reset`, {});
  },

  async deleteTenant(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(TENANTS_ENDPOINT, id);
  },

  async getGlobalMetrics(): Promise<ApiResponse<{
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalClients: number;
    totalPolicies: number;
    totalMonthlyPremiumVolume: number;
    totalMrr: number;
    totalWhatsAppConversations: number;
  }>> {
    return apiClient.get(`${TENANTS_ENDPOINT}/metrics`);
  },

  // Users (SaaS level)
  async listUsers(page = 1, pageSize = 50): Promise<ApiResponse<PaginatedResponse<User>>> {
    return apiClient.getPaginated<User>(USERS_ENDPOINT, page, pageSize);
  },

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return apiClient.get<User[]>(USERS_ENDPOINT);
  },

  async createUser(data: CreateUserData): Promise<ApiResponse<User>> {
    return apiClient.post<User>(USERS_ENDPOINT, data);
  },

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`${USERS_ENDPOINT}/${id}`, data);
  },

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(USERS_ENDPOINT, id);
  },

  // Plans
  async getPlans(): Promise<ApiResponse<SaasPlanFeatureLimit[]>> {
    return apiClient.get<SaasPlanFeatureLimit[]>(PLANS_ENDPOINT);
  },

  async updatePlans(plans: SaasPlanFeatureLimit[]): Promise<ApiResponse<SaasPlanFeatureLimit[]>> {
    return apiClient.put<SaasPlanFeatureLimit[]>(PLANS_ENDPOINT, plans);
  },

  async createPlan(plan: Omit<SaasPlanFeatureLimit, 'id'>): Promise<ApiResponse<SaasPlanFeatureLimit>> {
    return apiClient.post<SaasPlanFeatureLimit>(PLANS_ENDPOINT, plan);
  },

  async deletePlan(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(PLANS_ENDPOINT, id);
  },

  // Payment Receipts
  async listReceipts(page = 1, pageSize = 20): Promise<ApiResponse<PaginatedResponse<SaasPaymentReceipt>>> {
    return apiClient.getPaginated<SaasPaymentReceipt>(RECEIPTS_ENDPOINT, page, pageSize);
  },

  async getAllReceipts(): Promise<ApiResponse<SaasPaymentReceipt[]>> {
    return apiClient.get<SaasPaymentReceipt[]>(RECEIPTS_ENDPOINT);
  },

  async submitReceipt(data: CreateReceiptData): Promise<ApiResponse<SaasPaymentReceipt>> {
    return apiClient.post<SaasPaymentReceipt>(RECEIPTS_ENDPOINT, data);
  },

  async approveReceipt(receiptId: string, validFrom: string, validUntil: string): Promise<ApiResponse<SaasPaymentReceipt>> {
    return apiClient.patch<SaasPaymentReceipt>(`${RECEIPTS_ENDPOINT}/${receiptId}/approve`, { validFrom, validUntil });
  },

  async rejectReceipt(receiptId: string, reason: string): Promise<ApiResponse<SaasPaymentReceipt>> {
    return apiClient.patch<SaasPaymentReceipt>(`${RECEIPTS_ENDPOINT}/${receiptId}/reject`, { reason });
  },

  // Landing Configs
  async getSaasLandingConfig(): Promise<ApiResponse<SaasLandingConfig>> {
    return apiClient.get<SaasLandingConfig>(LANDING_ENDPOINT);
  },

  async updateSaasLandingConfig(config: Partial<SaasLandingConfig>): Promise<ApiResponse<SaasLandingConfig>> {
    return apiClient.patch<SaasLandingConfig>(LANDING_ENDPOINT, config);
  },

  async getTenantLandingConfig(tenantId: string): Promise<ApiResponse<TenantLandingConfig>> {
    return apiClient.get<TenantLandingConfig>(`${LANDING_ENDPOINT}/tenant/${tenantId}`);
  },

  async updateTenantLandingConfig(tenantId: string, config: Partial<TenantLandingConfig>): Promise<ApiResponse<TenantLandingConfig>> {
    return apiClient.patch<TenantLandingConfig>(`${LANDING_ENDPOINT}/tenant/${tenantId}`, config);
  },

  // Delegated Admins
  async getAdmins(): Promise<ApiResponse<SaasDelegatedAdmin[]>> {
    return apiClient.get<SaasDelegatedAdmin[]>(ADMINS_ENDPOINT);
  },

  async createAdmin(admin: Omit<SaasDelegatedAdmin, 'id' | 'createdAt'>): Promise<ApiResponse<SaasDelegatedAdmin>> {
    return apiClient.post<SaasDelegatedAdmin>(ADMINS_ENDPOINT, admin);
  },

  async updateAdmin(id: string, updates: Partial<SaasDelegatedAdmin>): Promise<ApiResponse<SaasDelegatedAdmin>> {
    return apiClient.patch<SaasDelegatedAdmin>(`${ADMINS_ENDPOINT}/${id}`, updates);
  },

  async deleteAdmin(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(ADMINS_ENDPOINT, id);
  },

  // SaaS Central Configs
  async getSaasSmtpConfig(): Promise<ApiResponse<SaasSmtpConfig>> {
    return apiClient.get<SaasSmtpConfig>(SAAS_SMTP_ENDPOINT);
  },

  async updateSaasSmtpConfig(config: SaasSmtpConfig): Promise<ApiResponse<SaasSmtpConfig>> {
    return apiClient.put<SaasSmtpConfig>(SAAS_SMTP_ENDPOINT, config);
  },

  async testSaasSmtpConnection(toEmail: string, config?: SaasSmtpConfig): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post(`${SAAS_SMTP_ENDPOINT}/test`, { toEmail, config });
  },

  async getSaasNotificationTemplates(): Promise<ApiResponse<SaasNotificationTemplates>> {
    return apiClient.get<SaasNotificationTemplates>(SAAS_TEMPLATES_ENDPOINT);
  },

  async updateSaasNotificationTemplates(templates: SaasNotificationTemplates): Promise<ApiResponse<SaasNotificationTemplates>> {
    return apiClient.put<SaasNotificationTemplates>(SAAS_TEMPLATES_ENDPOINT, templates);
  },

  async getSaasWhatsAppConfig(): Promise<ApiResponse<SaasWhatsAppCentralConfig>> {
    return apiClient.get<SaasWhatsAppCentralConfig>(SAAS_WA_ENDPOINT);
  },

  async updateSaasWhatsAppConfig(config: SaasWhatsAppCentralConfig): Promise<ApiResponse<SaasWhatsAppCentralConfig>> {
    return apiClient.put<SaasWhatsAppCentralConfig>(SAAS_WA_ENDPOINT, config);
  },

  async sendSaasWhatsAppTest(message: string): Promise<ApiResponse<void>> {
    return apiClient.post(`${SAAS_WA_ENDPOINT}/test`, { message });
  },

  // Database & VPS
  async getSaasDatabaseConfig(): Promise<ApiResponse<SaasDatabaseConfig>> {
    return apiClient.get<SaasDatabaseConfig>(SAAS_DB_ENDPOINT);
  },

  async updateSaasDatabaseConfig(config: Partial<SaasDatabaseConfig>): Promise<ApiResponse<SaasDatabaseConfig>> {
    return apiClient.patch<SaasDatabaseConfig>(SAAS_DB_ENDPOINT, config);
  },

  async testDatabaseConnection(config?: Partial<SaasDatabaseConfig>): Promise<ApiResponse<{ success: boolean; message: string; latencyMs?: number; tablesFound?: number }>> {
    return apiClient.post(`${SAAS_DB_ENDPOINT}/test`, config || {});
  },

  async getSaasVpsConfig(): Promise<ApiResponse<SaasVpsDeploymentConfig>> {
    return apiClient.get<SaasVpsDeploymentConfig>(SAAS_VPS_ENDPOINT);
  },

  async updateSaasVpsConfig(config: Partial<SaasVpsDeploymentConfig>): Promise<ApiResponse<SaasVpsDeploymentConfig>> {
    return apiClient.patch<SaasVpsDeploymentConfig>(SAAS_VPS_ENDPOINT, config);
  },

  // Subscriptions
  subscribeTenants(callback: (tenants: TenantBranding[]) => void) {
    return apiClient.subscribe(TENANTS_ENDPOINT, callback);
  },

  subscribeUsers(callback: (users: User[]) => void) {
    return apiClient.subscribe(USERS_ENDPOINT, callback);
  },

  subscribePlans(callback: (plans: SaasPlanFeatureLimit[]) => void) {
    return apiClient.subscribe(PLANS_ENDPOINT, callback);
  },

  subscribeReceipts(callback: (receipts: SaasPaymentReceipt[]) => void) {
    return apiClient.subscribe(RECEIPTS_ENDPOINT, callback);
  },
};

export default saasService;