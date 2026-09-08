import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';
import { AuditLogEntry, SystemAlert, AppNotification } from '../types';

const AUDIT_ENDPOINT = 'audit';
const ALERTS_ENDPOINT = 'alerts';
const NOTIFICATIONS_ENDPOINT = 'notifications';

export interface AuditFilters {
  userId?: string;
  module?: AuditLogEntry['module'];
  action?: AuditLogEntry['action'];
  targetId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateAuditData {
  action: AuditLogEntry['action'];
  module: AuditLogEntry['module'];
  targetId?: string;
  targetName?: string;
  details: string;
  tenantId: string;
}

export const auditService = {
  async list(filters?: AuditFilters, page = 1, pageSize = 100): Promise<ApiResponse<PaginatedResponse<AuditLogEntry>>> {
    return apiClient.getPaginated<AuditLogEntry>(AUDIT_ENDPOINT, page, pageSize, filters);
  },

  async getAll(filters?: AuditFilters): Promise<ApiResponse<AuditLogEntry[]>> {
    const response = await apiClient.get<AuditLogEntry[]>(AUDIT_ENDPOINT);
    if (!response.success || !response.data) return response;
    
    let data = response.data;
    if (filters) {
      if (filters.userId) data = data.filter(a => a.userId === filters.userId);
      if (filters.module) data = data.filter(a => a.module === filters.module);
      if (filters.action) data = data.filter(a => a.action === filters.action);
      if (filters.targetId) data = data.filter(a => a.targetId === filters.targetId);
      if (filters.dateFrom) data = data.filter(a => a.timestamp >= filters.dateFrom!);
      if (filters.dateTo) data = data.filter(a => a.timestamp <= filters.dateTo!);
    }
    return { success: true, data };
  },

  async getById(id: string): Promise<ApiResponse<AuditLogEntry>> {
    return apiClient.get<AuditLogEntry>(`${AUDIT_ENDPOINT}/${id}`);
  },

  async record(data: CreateAuditData): Promise<ApiResponse<AuditLogEntry>> {
    return apiClient.post<AuditLogEntry>(AUDIT_ENDPOINT, data);
  },

  async export(filters?: AuditFilters): Promise<ApiResponse<string>> {
    return apiClient.post<string>(`${AUDIT_ENDPOINT}/export`, { filters });
  },

  subscribe(callback: (logs: AuditLogEntry[]) => void) {
    return apiClient.subscribe(AUDIT_ENDPOINT, callback);
  },
};

export const alertsService = {
  async getAll(): Promise<ApiResponse<SystemAlert[]>> {
    return apiClient.get<SystemAlert[]>(ALERTS_ENDPOINT);
  },

  async getByClientId(clientId: string): Promise<ApiResponse<SystemAlert[]>> {
    return apiClient.get<SystemAlert[]>(`${ALERTS_ENDPOINT}/client/${clientId}`);
  },

  async dismiss(id: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`${ALERTS_ENDPOINT}/${id}/dismiss`, {});
  },

  async dismissAll(): Promise<ApiResponse<void>> {
    return apiClient.post(`${ALERTS_ENDPOINT}/dismiss-all`, {});
  },

  async recalculate(): Promise<ApiResponse<SystemAlert[]>> {
    return apiClient.post<SystemAlert[]>(`${ALERTS_ENDPOINT}/recalculate`, {});
  },

  subscribe(callback: (alerts: SystemAlert[]) => void) {
    return apiClient.subscribe(ALERTS_ENDPOINT, callback);
  },
};

export const notificationsService = {
  async list(page = 1, pageSize = 50): Promise<ApiResponse<PaginatedResponse<AppNotification>>> {
    return apiClient.getPaginated<AppNotification>(NOTIFICATIONS_ENDPOINT, page, pageSize);
  },

  async getAll(): Promise<ApiResponse<AppNotification[]>> {
    return apiClient.get<AppNotification[]>(NOTIFICATIONS_ENDPOINT);
  },

  async getUnreadCount(): Promise<ApiResponse<number>> {
    return apiClient.get(`${NOTIFICATIONS_ENDPOINT}/unread-count`);
  },

  async markAsRead(id: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`${NOTIFICATIONS_ENDPOINT}/${id}/read`, {});
  },

  async markAllAsRead(): Promise<ApiResponse<void>> {
    return apiClient.post(`${NOTIFICATIONS_ENDPOINT}/read-all`, {});
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(NOTIFICATIONS_ENDPOINT, id);
  },

  async requestBrowserPermission(): Promise<ApiResponse<NotificationPermission>> {
    return apiClient.post(`${NOTIFICATIONS_ENDPOINT}/request-permission`, {});
  },

  subscribe(callback: (notifications: AppNotification[]) => void) {
    return apiClient.subscribe(NOTIFICATIONS_ENDPOINT, callback);
  },
};

export type { SystemAlert, AppNotification };