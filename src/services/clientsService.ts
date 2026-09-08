import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';
import { Client } from '../types';

const ENDPOINT = 'clients';

export interface ClientFilters {
  search?: string;
  category?: string;
  status?: string;
  assignedAgentId?: string;
  pipelineId?: string;
  stageId?: string;
}

export interface CreateClientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  birthDate: string;
  gender: 'M' | 'F' | 'Otro';
  idNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  maritalStatus?: 'Soltero/a' | 'Casado/a' | 'Divorciado/a' | 'Viudo/a' | 'Unión Libre';
  category: string;
  tags?: string[];
  status: Client['status'];
  assignedAgentId: string;
  pipelineId?: string;
  stageId?: string;
  dealValue?: number;
  leadSource?: string;
  customFields?: Record<string, any>;
  tenantId: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: string;
}

export const clientsService = {
  async list(filters?: ClientFilters, page = 1, pageSize = 50): Promise<ApiResponse<PaginatedResponse<Client>>> {
    return apiClient.getPaginated<Client>(ENDPOINT, page, pageSize, filters);
  },

  async getAll(filters?: ClientFilters): Promise<ApiResponse<Client[]>> {
    const response = await apiClient.get<Client[]>(ENDPOINT);
    if (!response.success || !response.data) return response;
    
    let data = response.data;
    if (filters) {
      if (filters.search) {
        const term = filters.search.toLowerCase();
        data = data.filter(c => 
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.phone.includes(filters.search) ||
          c.idNumber?.toLowerCase().includes(term)
        );
      }
      if (filters.category && filters.category !== 'all') {
        data = data.filter(c => c.category === filters.category);
      }
      if (filters.status && filters.status !== 'all') {
        data = data.filter(c => c.status === filters.status);
      }
      if (filters.assignedAgentId && filters.assignedAgentId !== 'all') {
        data = data.filter(c => c.assignedAgentId === filters.assignedAgentId);
      }
    }
    return { success: true, data };
  },

  async getById(id: string): Promise<ApiResponse<Client>> {
    return apiClient.get<Client>(`${ENDPOINT}/${id}`);
  },

  async create(data: CreateClientData): Promise<ApiResponse<Client>> {
    return apiClient.post<Client>(ENDPOINT, data);
  },

  async update(data: UpdateClientData): Promise<ApiResponse<Client>> {
    return apiClient.patch<Client>(ENDPOINT, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(ENDPOINT, id);
  },

  async bulkImport(clients: CreateClientData[]): Promise<ApiResponse<{ count: number; clients: Client[] }>> {
    return apiClient.post<{ count: number; clients: Client[] }>(`${ENDPOINT}/bulk`, { clients });
  },

  async exportCsv(filters?: ClientFilters): Promise<ApiResponse<string>> {
    return apiClient.post<string>(`${ENDPOINT}/export`, { filters });
  },

  subscribe(callback: (clients: Client[]) => void) {
    return apiClient.subscribe(ENDPOINT, callback);
  },
};

export default clientsService;