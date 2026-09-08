import { apiClient, ApiResponse } from './apiClient';
import { Pipeline, PipelineStage, Client } from '../types';

const PIPELINES_ENDPOINT = 'pipelines';
const CLIENTS_ENDPOINT = 'clients';

export interface MoveClientStageData {
  clientId: string;
  stageId: string;
  oldStageId?: string;
}

export interface PipelineWithClients extends Pipeline {
  clientsByStage: Record<string, Client[]>;
}

export const pipelineService = {
  async getAll(): Promise<ApiResponse<Pipeline[]>> {
    return apiClient.get<Pipeline[]>(PIPELINES_ENDPOINT);
  },

  async getById(id: string): Promise<ApiResponse<Pipeline>> {
    return apiClient.get<Pipeline>(`${PIPELINES_ENDPOINT}/${id}`);
  },

  async getDefault(): Promise<ApiResponse<Pipeline>> {
    return apiClient.get<Pipeline>(`${PIPELINES_ENDPOINT}/default`);
  },

  async create(data: Omit<Pipeline, 'id'>): Promise<ApiResponse<Pipeline>> {
    return apiClient.post<Pipeline>(PIPELINES_ENDPOINT, data);
  },

  async update(id: string, data: Partial<Pipeline>): Promise<ApiResponse<Pipeline>> {
    return apiClient.patch<Pipeline>(`${PIPELINES_ENDPOINT}/${id}`, data);
  },

  async saveAll(pipelines: Pipeline[]): Promise<ApiResponse<Pipeline[]>> {
    return apiClient.post<Pipeline[]>(`${PIPELINES_ENDPOINT}/batch`, { pipelines });
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(PIPELINES_ENDPOINT, id);
  },

  async moveClientStage(data: MoveClientStageData): Promise<ApiResponse<Client>> {
    return apiClient.patch<Client>(`${CLIENTS_ENDPOINT}/${data.clientId}/stage`, data);
  },

  async reassignClient(clientId: string, agentId: string): Promise<ApiResponse<Client>> {
    return apiClient.patch<Client>(`${CLIENTS_ENDPOINT}/${clientId}`, { assignedAgentId: agentId });
  },

  async getPipelineWithClients(pipelineId: string): Promise<ApiResponse<PipelineWithClients>> {
    return apiClient.get<PipelineWithClients>(`${PIPELINES_ENDPOINT}/${pipelineId}/with-clients`);
  },

  async addStage(pipelineId: string, stage: Omit<PipelineStage, 'id'>): Promise<ApiResponse<Pipeline>> {
    return apiClient.post<Pipeline>(`${PIPELINES_ENDPOINT}/${pipelineId}/stages`, stage);
  },

  async updateStage(pipelineId: string, stageId: string, data: Partial<PipelineStage>): Promise<ApiResponse<Pipeline>> {
    return apiClient.patch<Pipeline>(`${PIPELINES_ENDPOINT}/${pipelineId}/stages/${stageId}`, data);
  },

  async deleteStage(pipelineId: string, stageId: string): Promise<ApiResponse<Pipeline>> {
    return apiClient.delete<Pipeline>(`${PIPELINES_ENDPOINT}/${pipelineId}/stages/${stageId}`, stageId);
  },

  subscribePipelines(callback: (pipelines: Pipeline[]) => void) {
    return apiClient.subscribe(PIPELINES_ENDPOINT, callback);
  },

  subscribeClients(callback: (clients: Client[]) => void) {
    return apiClient.subscribe(CLIENTS_ENDPOINT, callback);
  },
};

export default pipelineService;