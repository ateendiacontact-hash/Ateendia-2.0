import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';
import { User, UserRole, PermissionMatrix, CustomFieldDefinition, MasterCatalogs } from '../types';

const USERS_ENDPOINT = 'users';
const ROLES_ENDPOINT = 'roles';
const PERMISSIONS_ENDPOINT = 'permissions';
const CUSTOM_FIELDS_ENDPOINT = 'custom-fields';
const CATALOGS_ENDPOINT = 'catalogs';

export interface UserFilters {
  role?: UserRole;
  status?: 'active' | 'inactive';
  search?: string;
}

export interface CreateUserData {
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  extension?: string;
  commissionRate?: number;
  twoFactorEnabled?: boolean;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  id: string;
}

export interface Toggle2FAData {
  userId: string;
  enabled: boolean;
}

export const usersService = {
  async list(filters?: UserFilters, page = 1, pageSize = 50): Promise<ApiResponse<PaginatedResponse<User>>> {
    return apiClient.getPaginated<User>(USERS_ENDPOINT, page, pageSize, filters);
  },

  async getAll(filters?: UserFilters): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<User[]>(USERS_ENDPOINT);
    if (!response.success || !response.data) return response;
    
    let data = response.data;
    if (filters) {
      if (filters.role) data = data.filter(u => u.role === filters.role);
      if (filters.status) data = data.filter(u => u.status === filters.status);
      if (filters.search) {
        const term = filters.search.toLowerCase();
        data = data.filter(u => 
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.phone.includes(filters.search!)
        );
      }
    }
    return { success: true, data };
  },

  async getById(id: string): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`${USERS_ENDPOINT}/${id}`);
  },

  async getByTenant(tenantId: string): Promise<ApiResponse<User[]>> {
    return apiClient.get<User[]>(`${USERS_ENDPOINT}/tenant/${tenantId}`);
  },

  async create(data: CreateUserData): Promise<ApiResponse<User>> {
    return apiClient.post<User>(USERS_ENDPOINT, data);
  },

  async update(data: UpdateUserData): Promise<ApiResponse<User>> {
    const { id, ...updates } = data;
    return apiClient.patch<User>(`${USERS_ENDPOINT}/${id}`, updates);
  },

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`${USERS_ENDPOINT}/${id}/status`, { status });
  },

  async updateRole(id: string, role: UserRole): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`${USERS_ENDPOINT}/${id}/role`, { role });
  },

  async toggle2FA(data: Toggle2FAData): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`${USERS_ENDPOINT}/${data.userId}/2fa`, { enabled: data.enabled });
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(USERS_ENDPOINT, id);
  },

  async login(email: string, password?: string): Promise<ApiResponse<{ requires2FA: boolean; success: boolean; user?: User }>> {
    return apiClient.post(`${USERS_ENDPOINT}/login`, { email, password });
  },

  // Roles & Permissions
  async getRoles(): Promise<ApiResponse<Array<{ key: UserRole; name: string; permissions: any }>>> {
    return apiClient.get(`${ROLES_ENDPOINT}`);
  },

  async getPermissionsMatrix(): Promise<ApiResponse<Record<string, PermissionMatrix>>> {
    return apiClient.get<Record<string, PermissionMatrix>>(PERMISSIONS_ENDPOINT);
  },

  async updatePermissionsMatrix(role: string, perms: PermissionMatrix): Promise<ApiResponse<PermissionMatrix>> {
    return apiClient.patch<PermissionMatrix>(`${PERMISSIONS_ENDPOINT}/${role}`, perms);
  },

  // Custom Fields
  async getCustomFields(): Promise<ApiResponse<CustomFieldDefinition[]>> {
    return apiClient.get<CustomFieldDefinition[]>(CUSTOM_FIELDS_ENDPOINT);
  },

  async createCustomField(field: Omit<CustomFieldDefinition, 'id' | 'tenantId'>): Promise<ApiResponse<CustomFieldDefinition>> {
    return apiClient.post<CustomFieldDefinition>(CUSTOM_FIELDS_ENDPOINT, field);
  },

  async updateCustomField(id: string, data: Partial<CustomFieldDefinition>): Promise<ApiResponse<CustomFieldDefinition>> {
    return apiClient.patch<CustomFieldDefinition>(`${CUSTOM_FIELDS_ENDPOINT}/${id}`, data);
  },

  async deleteCustomField(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(CUSTOM_FIELDS_ENDPOINT, id);
  },

  async saveAllCustomFields(fields: CustomFieldDefinition[]): Promise<ApiResponse<CustomFieldDefinition[]>> {
    return apiClient.put<CustomFieldDefinition[]>(`${CUSTOM_FIELDS_ENDPOINT}/batch`, { fields });
  },

  // Master Catalogs
  async getCatalogs(): Promise<ApiResponse<MasterCatalogs>> {
    return apiClient.get<MasterCatalogs>(CATALOGS_ENDPOINT);
  },

  async saveCatalogs(catalogs: MasterCatalogs): Promise<ApiResponse<MasterCatalogs>> {
    return apiClient.put<MasterCatalogs>(CATALOGS_ENDPOINT, catalogs);
  },

  subscribeUsers(callback: (users: User[]) => void) {
    return apiClient.subscribe(USERS_ENDPOINT, callback);
  },

  subscribePermissions(callback: (perms: Record<string, PermissionMatrix>) => void) {
    return apiClient.subscribe(PERMISSIONS_ENDPOINT, callback);
  },
};

export default usersService;