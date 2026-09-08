import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';
import { Campaign } from '../types';

const ENDPOINT = 'campaigns';

export interface CampaignFilters {
  status?: Campaign['status'];
  channel?: 'whatsapp' | 'email';
  search?: string;
}

export interface CreateCampaignData {
  name: string;
  channel: 'whatsapp' | 'email';
  templateId: string;
  targetSegment: {
    category?: string;
    policyStatus?: string;
    carrier?: string;
    upcomingBirthdays?: boolean;
    expiringPolicies?: boolean;
  };
  totalAudience: number;
  targetAudienceCount?: number;
  scheduledDate?: string;
  tenantId: string;
}

export interface ExecuteCampaignData {
  campaignId: string;
}

export const campaignsService = {
  async list(filters?: CampaignFilters, page = 1, pageSize = 20): Promise<ApiResponse<PaginatedResponse<Campaign>>> {
    return apiClient.getPaginated<Campaign>(ENDPOINT, page, pageSize, filters);
  },

  async getAll(filters?: CampaignFilters): Promise<ApiResponse<Campaign[]>> {
    const response = await apiClient.get<Campaign[]>(ENDPOINT);
    if (!response.success || !response.data) return response;
    
    let data = response.data;
    if (filters) {
      if (filters.status) {
        data = data.filter(c => c.status === filters.status);
      }
      if (filters.channel) {
        data = data.filter(c => c.channel === filters.channel);
      }
      if (filters.search) {
        const term = filters.search.toLowerCase();
        data = data.filter(c => c.name.toLowerCase().includes(term));
      }
    }
    return { success: true, data };
  },

  async getById(id: string): Promise<ApiResponse<Campaign>> {
    return apiClient.get<Campaign>(`${ENDPOINT}/${id}`);
  },

  async create(data: CreateCampaignData): Promise<ApiResponse<Campaign>> {
    return apiClient.post<Campaign>(ENDPOINT, data);
  },

  async execute(data: ExecuteCampaignData): Promise<ApiResponse<Campaign>> {
    return apiClient.post<Campaign>(`${ENDPOINT}/${data.campaignId}/execute`, {});
  },

  async schedule(campaignId: string, scheduledDate: string): Promise<ApiResponse<Campaign>> {
    return apiClient.patch<Campaign>(`${ENDPOINT}/${campaignId}/schedule`, { scheduledDate });
  },

  async cancel(campaignId: string): Promise<ApiResponse<Campaign>> {
    return apiClient.patch<Campaign>(`${ENDPOINT}/${campaignId}/cancel`, {});
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(ENDPOINT, id);
  },

  async getStats(campaignId: string): Promise<ApiResponse<{
    sent: number;
    delivered: number;
    opened: number;
    replied: number;
    failed: number;
    openRate: number;
    replyRate: number;
  }>> {
    return apiClient.get(`${ENDPOINT}/${campaignId}/stats`);
  },

  async getAgentLeaderboard(): Promise<ApiResponse<Array<{
    agentId: string;
    agentName: string;
    clientsCount: number;
    policiesCount: number;
    totalVolume: number;
    performance: string;
  }>>> {
    return apiClient.get(`${ENDPOINT}/leaderboard`);
  },

  subscribe(callback: (campaigns: Campaign[]) => void) {
    return apiClient.subscribe(ENDPOINT, callback);
  },
};

export default campaignsService;