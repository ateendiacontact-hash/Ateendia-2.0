import { apiClient, ApiResponse } from './apiClient';
import { N8nConfig, AiIntegrationConfig, VectorDocChunk, KnowledgeDocument, ScheduledRule, AntiSpamSettings } from '../types';

const N8N_ENDPOINT = 'integrations/n8n';
const AI_ENDPOINT = 'integrations/ai';
const VECTORS_ENDPOINT = 'integrations/vectors';
const SCHEDULED_ENDPOINT = 'integrations/scheduled';
const ANTISPAM_ENDPOINT = 'integrations/antispam';

export const integrationsService = {
  // n8n
  async getN8nConfig(): Promise<ApiResponse<N8nConfig>> {
    return apiClient.get<N8nConfig>(N8N_ENDPOINT);
  },

  async updateN8nConfig(config: Partial<N8nConfig>): Promise<ApiResponse<N8nConfig>> {
    return apiClient.patch<N8nConfig>(N8N_ENDPOINT, config);
  },

  async testN8nConnection(config?: Partial<N8nConfig>): Promise<ApiResponse<{
    success: boolean;
    message: string;
    latency: number;
    nodeVersion?: string;
    activeWorkflowsCount?: number;
    serverTimestamp?: string;
  }>> {
    return apiClient.post(`${N8N_ENDPOINT}/test`, config || {});
  },

  async getN8nWebhookLogs(): Promise<ApiResponse<Array<{
    id: string;
    event: string;
    timestamp: string;
    status: 'success' | 'error' | 'pending';
    payload: any;
    response?: string;
  }>>> {
    return apiClient.get(`${N8N_ENDPOINT}/logs`);
  },

  // AI Models & Config
  async getAiConfig(): Promise<ApiResponse<AiIntegrationConfig>> {
    return apiClient.get<AiIntegrationConfig>(AI_ENDPOINT);
  },

  async updateAiConfig(config: Partial<AiIntegrationConfig>): Promise<ApiResponse<AiIntegrationConfig>> {
    return apiClient.patch<AiIntegrationConfig>(AI_ENDPOINT, config);
  },

  async testAiInference(prompt: string, config?: Partial<AiIntegrationConfig>): Promise<ApiResponse<{ output: string }>> {
    return apiClient.post(`${AI_ENDPOINT}/test`, { prompt, config });
  },

  async getAvailableModels(provider: string): Promise<ApiResponse<string[]>> {
    return apiClient.get(`${AI_ENDPOINT}/models/${provider}`);
  },

  // RAG / Vector Knowledge Base
  async getKnowledgeBase(): Promise<ApiResponse<VectorDocChunk[]>> {
    return apiClient.get<VectorDocChunk[]>(VECTORS_ENDPOINT);
  },

  async getKnowledgeDocuments(): Promise<ApiResponse<KnowledgeDocument[]>> {
    return apiClient.get<KnowledgeDocument[]>(`${VECTORS_ENDPOINT}/documents`);
  },

  async searchKnowledgeBase(query: string, topK = 5): Promise<ApiResponse<VectorDocChunk[]>> {
    return apiClient.post<VectorDocChunk[]>(`${VECTORS_ENDPOINT}/search`, { query, topK });
  },

  async uploadDocument(file: File, metadata?: Partial<KnowledgeDocument>): Promise<ApiResponse<KnowledgeDocument>> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    const response = await fetch(`${apiClient.getConfig().baseUrl || '/api'}${VECTORS_ENDPOINT}/upload`, {
      method: 'POST',
      headers: apiClient.getConfig().apiKey ? { 'Authorization': `Bearer ${apiClient.getConfig().apiKey}` } : {},
      body: formData,
    });
    
    const result = await response.json();
    return response.ok 
      ? { success: true, data: result }
      : { success: false, error: result.message };
  },

  async deleteDocument(docId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${VECTORS_ENDPOINT}/documents`, docId);
  },

  async deleteChunk(chunkId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${VECTORS_ENDPOINT}/chunks`, chunkId);
  },

  async reindexKnowledgeBase(): Promise<ApiResponse<{ chunksIndexed: number }>> {
    return apiClient.post(`${VECTORS_ENDPOINT}/reindex`, {});
  },

  // Scheduled Rules / Automations
  async getScheduledRules(): Promise<ApiResponse<ScheduledRule[]>> {
    return apiClient.get<ScheduledRule[]>(SCHEDULED_ENDPOINT);
  },

  async updateScheduledRules(rules: ScheduledRule[]): Promise<ApiResponse<ScheduledRule[]>> {
    return apiClient.post<ScheduledRule[]>(`${SCHEDULED_ENDPOINT}/batch`, { rules });
  },

  async createScheduledRule(rule: Omit<ScheduledRule, 'id' | 'tenantId'>): Promise<ApiResponse<ScheduledRule>> {
    return apiClient.post<ScheduledRule>(SCHEDULED_ENDPOINT, rule);
  },

  async deleteScheduledRule(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(SCHEDULED_ENDPOINT, id);
  },

  // Anti-Spam Settings
  async getAntiSpamSettings(): Promise<ApiResponse<AntiSpamSettings>> {
    return apiClient.get<AntiSpamSettings>(ANTISPAM_ENDPOINT);
  },

  async updateAntiSpamSettings(settings: Partial<AntiSpamSettings>): Promise<ApiResponse<AntiSpamSettings>> {
    return apiClient.patch<AntiSpamSettings>(ANTISPAM_ENDPOINT, settings);
  },

  async getAntiSpamStatus(): Promise<ApiResponse<{
    whatsappSentToday: number;
    emailSentToday: number;
    whatsappDailyLimit: number;
    emailDailyLimit: number;
    isPaused: boolean;
  }>> {
    return apiClient.get(`${ANTISPAM_ENDPOINT}/status`);
  },

  async resetAntiSpamCounters(): Promise<ApiResponse<void>> {
    return apiClient.post(`${ANTISPAM_ENDPOINT}/reset`, {});
  },

  // Subscriptions
  subscribeN8nConfig(callback: (config: N8nConfig) => void) {
    return apiClient.subscribe(N8N_ENDPOINT, callback);
  },

  subscribeAiConfig(callback: (config: AiIntegrationConfig) => void) {
    return apiClient.subscribe(AI_ENDPOINT, callback);
  },

  subscribeKnowledgeBase(callback: (chunks: VectorDocChunk[]) => void) {
    return apiClient.subscribe(VECTORS_ENDPOINT, callback);
  },

  subscribeScheduledRules(callback: (rules: ScheduledRule[]) => void) {
    return apiClient.subscribe(SCHEDULED_ENDPOINT, callback);
  },

  subscribeAntiSpam(callback: (settings: AntiSpamSettings) => void) {
    return apiClient.subscribe(ANTISPAM_ENDPOINT, callback);
  },
};

export default integrationsService;