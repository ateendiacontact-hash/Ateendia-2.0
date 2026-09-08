import { apiClient, ApiResponse } from './apiClient';
import { 
  WhatsAppConfig, 
  WhatsAppAccountConfig, 
  WhatsAppConversation, 
  WhatsAppMessage,
  WhatsAppAlertRecipient 
} from '../types';

const CONFIG_ENDPOINT = 'whatsapp/config';
const CONVERSATIONS_ENDPOINT = 'whatsapp/conversations';
const MESSAGES_ENDPOINT = 'whatsapp/messages';

export interface SendMessageData {
  conversationId: string;
  text: string;
  mediaType?: 'text' | 'image' | 'audio' | 'video' | 'sticker' | 'gif' | 'document';
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: string;
  mediaDuration?: number;
  account?: 'WA1' | 'WA2';
}

export interface StartConversationData {
  clientId: string;
  phone: string;
  name: string;
  initialMsg?: string;
  account?: 'WA1' | 'WA2';
}

export interface ToggleReactionData {
  conversationId: string;
  messageId: string;
  emoji: string;
}

export interface UpdateAccountConfigData {
  accountId: 'WA1' | 'WA2';
  updates: Partial<WhatsAppAccountConfig>;
}

export const whatsappService = {
  // Config
  async getConfig(): Promise<ApiResponse<WhatsAppConfig>> {
    return apiClient.get<WhatsAppConfig>(CONFIG_ENDPOINT);
  },

  async updateConfig(config: Partial<WhatsAppConfig>): Promise<ApiResponse<WhatsAppConfig>> {
    return apiClient.patch<WhatsAppConfig>(CONFIG_ENDPOINT, config);
  },

  async updateAccountConfig(data: UpdateAccountConfigData): Promise<ApiResponse<WhatsAppConfig>> {
    return apiClient.patch<WhatsAppConfig>(`${CONFIG_ENDPOINT}/accounts/${data.accountId}`, data.updates);
  },

  // Conversations
  async getConversations(): Promise<ApiResponse<WhatsAppConversation[]>> {
    return apiClient.get<WhatsAppConversation[]>(CONVERSATIONS_ENDPOINT);
  },

  async getConversation(id: string): Promise<ApiResponse<WhatsAppConversation>> {
    return apiClient.get<WhatsAppConversation>(`${CONVERSATIONS_ENDPOINT}/${id}`);
  },

  async startConversation(data: StartConversationData): Promise<ApiResponse<WhatsAppConversation>> {
    return apiClient.post<WhatsAppConversation>(CONVERSATIONS_ENDPOINT, data);
  },

  // Messages
  async sendMessage(data: SendMessageData): Promise<ApiResponse<WhatsAppMessage>> {
    return apiClient.post<WhatsAppMessage>(MESSAGES_ENDPOINT, data);
  },

  async sendTextMessage(instanceName: string, number: string, text: string): Promise<ApiResponse<any>> {
    return apiClient.post(`${MESSAGES_ENDPOINT}/send-text`, { instanceName, number, text });
  },

  async sendMediaMessage(
    instanceName: string,
    number: string,
    mediaUrl: string,
    mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker',
    caption?: string,
    fileName?: string
  ): Promise<ApiResponse<any>> {
    return apiClient.post(`${MESSAGES_ENDPOINT}/send-media`, { instanceName, number, mediaUrl, mediaType, caption, fileName });
  },

  async toggleReaction(data: ToggleReactionData): Promise<ApiResponse<WhatsAppConversation>> {
    return apiClient.patch<WhatsAppConversation>(`${CONVERSATIONS_ENDPOINT}/${data.conversationId}/reactions`, data);
  },

  // QR & Connection
  async generateQR(accountId: 'WA1' | 'WA2'): Promise<ApiResponse<{ base64: string; code: string }>> {
    return apiClient.post(`${CONFIG_ENDPOINT}/accounts/${accountId}/qr`, {});
  },

  async checkConnection(accountId: 'WA1' | 'WA2'): Promise<ApiResponse<{ connected: boolean; status: string }>> {
    return apiClient.get(`${CONFIG_ENDPOINT}/accounts/${accountId}/connection`);
  },

  async disconnect(accountId: 'WA1' | 'WA2'): Promise<ApiResponse<void>> {
    return apiClient.delete(`${CONFIG_ENDPOINT}/accounts/${accountId}/disconnect`, accountId);
  },

  // Alert Recipients
  async getAlertRecipients(): Promise<ApiResponse<WhatsAppAlertRecipient[]>> {
    return apiClient.get(`${CONFIG_ENDPOINT}/alert-recipients`);
  },

  async addAlertRecipient(recipient: Omit<WhatsAppAlertRecipient, 'id'>): Promise<ApiResponse<WhatsAppAlertRecipient>> {
    return apiClient.post(`${CONFIG_ENDPOINT}/alert-recipients`, recipient);
  },

  async updateAlertRecipient(id: string, updates: Partial<WhatsAppAlertRecipient>): Promise<ApiResponse<WhatsAppAlertRecipient>> {
    return apiClient.patch(`${CONFIG_ENDPOINT}/alert-recipients/${id}`, updates);
  },

  async deleteAlertRecipient(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${CONFIG_ENDPOINT}/alert-recipients`, id);
  },

  // Simulations (for testing)
  async simulateIncomingMessage(data: {
    phone: string;
    text: string;
    account: 'WA1' | 'WA2';
    clientName: string;
  }): Promise<ApiResponse<WhatsAppConversation>> {
    return apiClient.post(`${CONVERSATIONS_ENDPOINT}/simulate`, data);
  },

  subscribeConversations(callback: (conversations: WhatsAppConversation[]) => void) {
    return apiClient.subscribe(CONVERSATIONS_ENDPOINT, callback);
  },

  subscribeConfig(callback: (config: WhatsAppConfig) => void) {
    return apiClient.subscribe(CONFIG_ENDPOINT, callback);
  },
};

export default whatsappService;