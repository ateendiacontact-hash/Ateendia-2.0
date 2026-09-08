const META_API_VERSION = 'v20.0';

export interface MetaGraphCredentials {
  instagramId?: string;
  pageId?: string;
  accessToken: string;
  verifyToken?: string;
  webhookUrl?: string;
}

export interface SendTextMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface MetaGraphService {
  isConfigured: (config: any) => boolean;
  checkPageAccess: (pageId: string, accessToken: string) => Promise<{ valid: boolean }>;
  checkInstagramAccess: (instagramId: string, accessToken: string) => Promise<{ valid: boolean }>;
  sendMessage: (config: any, toPhoneNumber: string, messageText: string) => Promise<SendTextMessageResult>;
  generateVerifyToken: () => string;
}

export const MetaGraphService: MetaGraphService = {
  isConfigured: (config: any): boolean => {
    if (!config) return false;
    if (config.instagramId && config.accessToken) return true;
    if (config.pageId && config.accessToken) return true;
    return false;
  },

  generateVerifyToken: (): string => {
    return `meta_verify_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  },

  checkPageAccess: async (pageId: string, accessToken: string): Promise<{ valid: boolean }> => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${META_API_VERSION}/${pageId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      return { valid: data.id !== undefined };
    } catch {
      return { valid: false };
    }
  },

  checkInstagramAccess: async (instagramId: string, accessToken: string): Promise<{ valid: boolean }> => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${META_API_VERSION}/${instagramId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      return { valid: data.id !== undefined };
    } catch {
      return { valid: false };
    }
  },

  sendMessage: async (config: any, toPhoneNumber: string, messageText: string): Promise<SendTextMessageResult> => {
    const { instagramId, pageId, accessToken } = config;

    try {
      const endpoint = instagramId
        ? `https://graph.facebook.com/${META_API_VERSION}/${instagramId}/messages`
        : `https://graph.facebook.com/${META_API_VERSION}/${pageId}/messages`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: instagramId ? 'instagram' : 'facebook',
          to: toPhoneNumber.replace(/\D/g, ''),
          text: messageText
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
        console.error(`${instagramId ? 'Instagram' : 'Facebook'} Graph API error:`, errorMsg);
        return { success: false, error: errorMsg };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.messages?.[0]?.id
      };
    } catch (error: any) {
      console.error(`${instagramId ? 'Instagram' : 'Facebook'} Graph API exception:`, error);
      return { success: false, error: error.message || 'Error de red' };
    }
  }
};

export default MetaGraphService;