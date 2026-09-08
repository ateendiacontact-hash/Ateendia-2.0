import { WhatsAppConfig } from '../types';

const META_API_VERSION = 'v20.0';

export interface WhatsAppCloudCredentials {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  verifyToken?: string;
  webhookUrl?: string;
}

export interface SendTextMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'footer' | 'button';
  text?: string;
  image?: { link: string };
  video?: { link: string };
  document?: { link: string };
  buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>;
}

export interface SendTemplateMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WebhookVerificationResult {
  challenge: string;
  verified: boolean;
}

const generateVerifyToken = (): string => {
  return `wa_verify_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

const getWhatsAppCloudCredentials = (config: WhatsAppConfig, tenantId: string): WhatsAppCloudCredentials | null => {
  if (!config.phoneNumberId || !config.accessToken) {
    return null;
  }
  return {
    phoneNumberId: config.phoneNumberId,
    wabaId: config.wabaId || '',
    accessToken: config.accessToken,
    verifyToken: config.webhookUrl?.includes('verify_token=')
      ? config.webhookUrl.split('verify_token=')[1]?.split('&')[0]
      : generateVerifyToken(),
    webhookUrl: config.webhookUrl || `https://webhook.atoms-crm.cloud/whatsapp/${tenantId}`
  };
};

export const whatsAppCloudService = {
  getPhoneNumberId: (config: WhatsAppConfig): string | null => {
    return config.phoneNumberId || null;
  },

  getWabaId: (config: WhatsAppConfig): string | null => {
    return config.wabaId || null;
  },

  getAccessToken: (config: WhatsAppConfig): string | null => {
    return config.accessToken || null;
  },

  isConfigured: (config: WhatsAppConfig): boolean => {
    return Boolean(config.phoneNumberId && config.accessToken);
  },

  generateWebhookUrl: (tenantId: string): string => {
    return `https://webhook.atoms-crm.cloud/whatsapp/${tenantId}`;
  },

  generateVerifyToken: (): string => {
    return generateVerifyToken();
  },

  verifyWebhook: (mode: string, token: string, challenge: string, expectedToken: string): WebhookVerificationResult => {
    if (mode === 'subscribe' && token === expectedToken) {
      return { challenge, verified: true };
    }
    return { challenge: '', verified: false };
  },

  sendTextMessage: async (
    config: WhatsAppConfig,
    toPhoneNumber: string,
    messageText: string,
    tenantId: string
  ): Promise<SendTextMessageResult> => {
    const creds = getWhatsAppCloudCredentials(config, tenantId);

    if (!creds) {
      return { success: false, error: 'WhatsApp Cloud API no configurada para este tenant' };
    }

    const phoneNumber = toPhoneNumber.replace(/\D/g, '');
    const formattedNumber = phoneNumber.startsWith('1') ? `${phoneNumber}@c.us` : `1${phoneNumber}@c.us`;

    try {
      const response = await fetch(
        `https://graph.facebook.com/${META_API_VERSION}/${creds.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${creds.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'text',
            text: {
              preview_url: false,
              body: messageText
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
        console.error('WhatsApp Cloud API error:', errorMsg);
        return { success: false, error: errorMsg };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.messages?.[0]?.id
      };
    } catch (error: any) {
      console.error('WhatsApp Cloud API exception:', error);
      return { success: false, error: error.message || 'Error de red' };
    }
  },

  sendTemplateMessage: async (
    config: WhatsAppConfig,
    toPhoneNumber: string,
    templateName: string,
    languageCode: string = 'es_LA',
    components: TemplateComponent[] = [],
    tenantId: string
  ): Promise<SendTemplateMessageResult> => {
    const creds = getWhatsAppCloudCredentials(config, tenantId);

    if (!creds) {
      return { success: false, error: 'WhatsApp Cloud API no configurada para este tenant' };
    }

    const phoneNumber = toPhoneNumber.replace(/\D/g, '');

    try {
      const response = await fetch(
        `https://graph.facebook.com/${META_API_VERSION}/${creds.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${creds.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: languageCode
              },
              components: components.length > 0 ? components : undefined
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
        console.error('WhatsApp Cloud Template API error:', errorMsg);
        return { success: false, error: errorMsg };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.messages?.[0]?.id
      };
    } catch (error: any) {
      console.error('WhatsApp Cloud Template API exception:', error);
      return { success: false, error: error.message || 'Error de red' };
    }
  },

  sendMediaMessage: async (
    config: WhatsAppConfig,
    toPhoneNumber: string,
    mediaUrl: string,
    mediaType: 'image' | 'video' | 'audio' | 'document',
    caption: string = '',
    filename: string = '',
    tenantId: string
  ): Promise<SendTextMessageResult> => {
    const creds = getWhatsAppCloudCredentials(config, tenantId);

    if (!creds) {
      return { success: false, error: 'WhatsApp Cloud API no configurada para este tenant' };
    }

    const phoneNumber = toPhoneNumber.replace(/\D/g, '');

    try {
      const response = await fetch(
        `https://graph.facebook.com/${META_API_VERSION}/${creds.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${creds.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'image',
            image: {
              link: mediaUrl,
              caption: caption
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
        return { success: false, error: errorMsg };
      }

      const data = await response.json();
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error de red' };
    }
  },

  checkPhoneNumberId: async (phoneNumberId: string, accessToken: string): Promise<{ valid: boolean; displayPhoneNumber?: string; verifiedName?: string }> => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}`,
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
      return {
        valid: true,
        displayPhoneNumber: data.display_phone_number,
        verifiedName: data.verified_name
      };
    } catch {
      return { valid: false };
    }
  },

  mockSendMessage: (
    toPhoneNumber: string,
    messageText: string,
    onIncrement?: () => void
  ): SendTextMessageResult => {
    const mockMessageId = `mock_wa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[MOCK WhatsApp Cloud] Enviando a ${toPhoneNumber}: ${messageText}`);
    if (onIncrement) onIncrement();
    return { success: true, messageId: mockMessageId };
  }
};

export default whatsAppCloudService;
