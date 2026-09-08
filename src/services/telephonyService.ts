import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';
import { IssabelConfig, CallRecord } from '../types';

const ISSABEL_ENDPOINT = 'telephony/issabel';
const CALLS_ENDPOINT = 'telephony/calls';

export interface CallFilters {
  clientId?: string;
  agentId?: string;
  direction?: 'outbound' | 'inbound';
  status?: CallRecord['status'];
  dateFrom?: string;
  dateTo?: string;
}

export interface StartCallData {
  number: string;
  clientName: string;
  clientId?: string;
  agentId: string;
  agentExtension: string;
}

export interface EndCallData {
  callId: string;
  dispositionNotes?: string;
  status: CallRecord['status'];
  durationSeconds: number;
  recordingUrl?: string;
}

export const telephonyService = {
  // Issabel Config
  async getConfig(): Promise<ApiResponse<IssabelConfig>> {
    return apiClient.get<IssabelConfig>(ISSABEL_ENDPOINT);
  },

  async updateConfig(config: Partial<IssabelConfig>): Promise<ApiResponse<IssabelConfig>> {
    return apiClient.patch<IssabelConfig>(ISSABEL_ENDPOINT, config);
  },

  async testConnection(config?: Partial<IssabelConfig>): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post(`${ISSABEL_ENDPOINT}/test`, config || {});
  },

  async getAmiStatus(): Promise<ApiResponse<{ connected: boolean; status: string }>> {
    return apiClient.get(`${ISSABEL_ENDPOINT}/ami-status`);
  },

  // Call Records
  async list(filters?: CallFilters, page = 1, pageSize = 50): Promise<ApiResponse<PaginatedResponse<CallRecord>>> {
    return apiClient.getPaginated<CallRecord>(CALLS_ENDPOINT, page, pageSize, filters);
  },

  async getAll(filters?: CallFilters): Promise<ApiResponse<CallRecord[]>> {
    const response = await apiClient.get<CallRecord[]>(CALLS_ENDPOINT);
    if (!response.success || !response.data) return response;
    
    let data = response.data;
    if (filters) {
      if (filters.clientId) data = data.filter(c => c.clientId === filters.clientId);
      if (filters.agentId) data = data.filter(c => c.agentId === filters.agentId);
      if (filters.direction) data = data.filter(c => c.direction === filters.direction);
      if (filters.status) data = data.filter(c => c.status === filters.status);
      if (filters.dateFrom) data = data.filter(c => c.timestamp >= filters.dateFrom!);
      if (filters.dateTo) data = data.filter(c => c.timestamp <= filters.dateTo!);
    }
    return { success: true, data };
  },

  async getById(id: string): Promise<ApiResponse<CallRecord>> {
    return apiClient.get<CallRecord>(`${CALLS_ENDPOINT}/${id}`);
  },

  async startCall(data: StartCallData): Promise<ApiResponse<{ callId: string }>> {
    return apiClient.post(`${CALLS_ENDPOINT}/start`, data);
  },

  async endCall(data: EndCallData): Promise<ApiResponse<CallRecord>> {
    return apiClient.post(`${CALLS_ENDPOINT}/end`, data);
  },

  async getRecording(callId: string): Promise<ApiResponse<{ url: string }>> {
    return apiClient.get(`${CALLS_ENDPOINT}/${callId}/recording`);
  },

  async getStats(filters?: CallFilters): Promise<ApiResponse<{
    totalCalls: number;
    answered: number;
    missed: number;
    totalDuration: number;
    avgDuration: number;
  }>> {
    return apiClient.post(`${CALLS_ENDPOINT}/stats`, { filters });
  },

  subscribeConfig(callback: (config: IssabelConfig) => void) {
    return apiClient.subscribe(ISSABEL_ENDPOINT, callback);
  },

  subscribeCalls(callback: (calls: CallRecord[]) => void) {
    return apiClient.subscribe(CALLS_ENDPOINT, callback);
  },
};

export default telephonyService;