import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';
import { Policy, PolicyMember } from '../types';

const ENDPOINT = 'policies';

export interface PolicyFilters {
  search?: string;
  carrier?: string;
  status?: string;
  type?: string;
  clientId?: string;
}

export interface CreatePolicyData {
  clientId: string;
  clientName?: string;
  type: Policy['type'];
  carrier: string;
  planName: string;
  policyNumber: string;
  effectiveDate: string;
  expirationDate?: string;
  monthlyPremium: number;
  subsidyAptc?: number;
  clientPortion: number;
  paymentDueDay: number;
  status: Policy['status'];
  agentId: string;
  members: PolicyMember[];
  customFields?: Record<string, any>;
  notes?: string;
  tenantId: string;
}

export interface UpdatePolicyData extends Partial<CreatePolicyData> {
  id: string;
  reason?: string;
}

export const policiesService = {
  async list(filters?: PolicyFilters, page = 1, pageSize = 50): Promise<ApiResponse<PaginatedResponse<Policy>>> {
    return apiClient.getPaginated<Policy>(ENDPOINT, page, pageSize, filters);
  },

  async getAll(filters?: PolicyFilters): Promise<ApiResponse<Policy[]>> {
    const response = await apiClient.get<Policy[]>(ENDPOINT);
    if (!response.success || !response.data) return response;
    
    let data = response.data;
    if (filters) {
      if (filters.search) {
        const term = filters.search.toLowerCase();
        data = data.filter(p => 
          p.policyNumber.toLowerCase().includes(term) ||
          p.carrier.toLowerCase().includes(term) ||
          (p.clientName || '').toLowerCase().includes(term) ||
          (p.planName || '').toLowerCase().includes(term)
        );
      }
      if (filters.carrier && filters.carrier !== 'all') {
        data = data.filter(p => p.carrier === filters.carrier);
      }
      if (filters.status && filters.status !== 'all') {
        data = data.filter(p => p.status === filters.status);
      }
      if (filters.type && filters.type !== 'all') {
        data = data.filter(p => p.type === filters.type);
      }
      if (filters.clientId) {
        data = data.filter(p => p.clientId === filters.clientId);
      }
    }
    return { success: true, data };
  },

  async getById(id: string): Promise<ApiResponse<Policy>> {
    return apiClient.get<Policy>(`${ENDPOINT}/${id}`);
  },

  async getByClientId(clientId: string): Promise<ApiResponse<Policy[]>> {
    return this.getAll({ clientId });
  },

  async create(data: CreatePolicyData): Promise<ApiResponse<Policy>> {
    return apiClient.post<Policy>(ENDPOINT, data);
  },

  async update(data: UpdatePolicyData): Promise<ApiResponse<Policy>> {
    const { id, reason, ...updates } = data;
    return apiClient.patch<Policy>(`${ENDPOINT}/${id}`, { ...updates, reason });
  },

  async updateStatus(id: string, status: Policy['status'], reason?: string): Promise<ApiResponse<Policy>> {
    return apiClient.patch<Policy>(`${ENDPOINT}/${id}/status`, { status, reason });
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(ENDPOINT, id);
  },

  async getStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    totalVolume: number;
    totalSubsidies: number;
    carriersCount: number;
  }>> {
    return apiClient.get(`${ENDPOINT}/stats`);
  },

  subscribe(callback: (policies: Policy[]) => void) {
    return apiClient.subscribe(ENDPOINT, callback);
  },
};

export default policiesService;