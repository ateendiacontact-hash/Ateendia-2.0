import { pb, COLLECTIONS } from './pocketbase';
import { SmtpConfig, SaasSmtpConfig, SaasNotificationTemplates } from '../types';

const SMTP_ENDPOINT = 'email/smtp';
const SAAS_SMTP_ENDPOINT = 'saas/email/smtp';
const SAAS_TEMPLATES_ENDPOINT = 'saas/email/templates';

export interface SendEmailData {
  to: string;
  subject: string;
  body: string;
  clientId?: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface TestSmtpData {
  toEmail: string;
  config?: Partial<SmtpConfig>;
}

// Email log entry for PocketBase
interface EmailLogEntry {
  id?: string;
  to: string;
  subject: string;
  body: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
  sentAt: string;
  tenantId?: string;
}

export const smtpService = {
// Tenant SMTP Config
   async getConfig(): Promise<{ success: boolean; data?: SmtpConfig; error?: string }> {
     try {
       const records = await pb.collection(COLLECTIONS.SMTP_CONFIG).getFullList({
         filter: `tenantId = "${pb.authStore.model?.tenantId}"`,
       });
       return { success: true, data: records[0] as unknown as SmtpConfig };
     } catch (e: any) {
       return { success: false, error: e.message };
     }
   },

   async updateConfig(config: Partial<SmtpConfig>): Promise<{ success: boolean; data?: SmtpConfig; error?: string }> {
     try {
       const existing = await this.getConfig();
       if (existing.success && existing.data) {
         const updated = await pb.collection(COLLECTIONS.SMTP_CONFIG).update(existing.data.id, config);
         return { success: true, data: updated as unknown as SmtpConfig };
       }
       const created = await pb.collection(COLLECTIONS.SMTP_CONFIG).create({
         ...config,
         tenantId: pb.authStore.model?.tenantId,
       });
       return { success: true, data: created as unknown as SmtpConfig };
     } catch (e: any) {
       return { success: false, error: e.message };
     }
   },

async testConnection(data: TestSmtpData): Promise<{ success: boolean; message: string }> {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
          return {
            success: false,
            message: '⚠️ No se ha detectado la URL de API backend (VITE_API_URL) ni el servicio activo para procesar el envío SMTP real.'
          };
        }
        
        const response = await fetch(`${apiUrl}/email/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          const result = await response.json();
          return { success: true, message: result.message || 'Conexión SMTP exitosa' };
        } else {
          const errorData = await response.json();
          return { success: false, message: errorData.message || errorData.error || 'Error al probar conexión SMTP' };
        }
      } catch (e: any) {
        return { success: false, message: e.message };
      }
    },

   async sendEmail(data: SendEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
     try {
       const apiUrl = import.meta.env.VITE_API_URL;
       
       if (!apiUrl) {
         return { 
           success: false, 
           error: '⚠️ No se ha detectado la URL de API backend (VITE_API_URL) ni el servicio activo para procesar el envío SMTP real.' 
         };
       }
       
       const response = await fetch(`${apiUrl}/email/send`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           to: data.to,
           subject: data.subject,
           body: data.body,
           templateId: data.templateId,
           variables: data.variables,
           clientId: data.clientId,
         })
       });
       
       if (response.ok) {
         const result = await response.json();
         return { success: true, messageId: result.messageId || result.id };
       }
       
       const errorData = await response.json();
       const errorMsg = errorData.message || errorData.error || 'Error al enviar el correo electrónico';
       return { success: false, error: errorMsg };
     } catch (e: any) {
       console.error('Failed to send email:', e);
       return { success: false, error: e.message };
     }
   },

  async sendBulk(emails: SendEmailData[]): Promise<{ success: boolean; sent: number; failed: number; error?: string }> {
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const result = await this.sendEmail(email);
      if (result.success) sent++;
      else failed++;
    }

    return { success: failed === 0, sent, failed };
  },

  // SaaS Central SMTP Config
  async getSaasConfig(): Promise<{ success: boolean; data?: SaasSmtpConfig; error?: string }> {
    try {
      const records = await pb.collection(COLLECTIONS.SAAS_SMTP).getFullList();
      return { success: true, data: records[0] as unknown as SaasSmtpConfig };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateSaasConfig(config: SaasSmtpConfig): Promise<{ success: boolean; data?: SaasSmtpConfig; error?: string }> {
    try {
      const existing = await this.getSaasConfig();
      if (existing.success && existing.data) {
        const updated = await pb.collection(COLLECTIONS.SAAS_SMTP).update(existing.data.id, config);
        return { success: true, data: updated as unknown as SaasSmtpConfig };
      }
      const created = await pb.collection(COLLECTIONS.SAAS_SMTP).create(config);
      return { success: true, data: created as unknown as SaasSmtpConfig };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

async testSaasConnection(toEmail: string, config?: SaasSmtpConfig): Promise<{ success: boolean; message: string }> {
     try {
       if (!toEmail) {
         return { success: false, message: '⚠️ Se requiere un correo electrónico destino para la prueba.' };
       }
       
       const apiUrl = import.meta.env.VITE_API_URL;
       if (apiUrl) {
         const response = await fetch(`${apiUrl}/email/test`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             toEmail,
             config: config || await this.getSaasConfig().then(r => r.data),
             isSaas: true
           })
         });
         
         if (response.ok) {
           const result = await response.json();
           return { success: true, message: result.message || 'Conexión SMTP Central exitosa' };
         }
         
         const errorData = await response.json();
         return { success: false, message: errorData.message || errorData.error || 'Error al probar conexión SMTP Central' };
       }
       
       return { 
         success: false, 
         message: '⚠️ No se ha detectado la URL de API backend (VITE_API_URL) ni el servicio activo para procesar el envío SMTP real.' 
       };
     } catch (e: any) {
       return { success: false, message: e.message || 'Error de conexión SMTP Central' };
     }
   },

  // SaaS Notification Templates
  async getSaasTemplates(): Promise<{ success: boolean; data?: SaasNotificationTemplates; error?: string }> {
    try {
      const records = await pb.collection(COLLECTIONS.SAAS_NOTIF_TEMPLATES).getFullList();
      return { success: true, data: records[0] as unknown as SaasNotificationTemplates };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateSaasTemplates(templates: SaasNotificationTemplates): Promise<{ success: boolean; data?: SaasNotificationTemplates; error?: string }> {
    try {
      const existing = await this.getSaasTemplates();
      if (existing.success && existing.data) {
        const updated = await pb.collection(COLLECTIONS.SAAS_NOTIF_TEMPLATES).update(existing.data.id, templates);
        return { success: true, data: updated as unknown as SaasNotificationTemplates };
      }
      const created = await pb.collection(COLLECTIONS.SAAS_NOTIF_TEMPLATES).create(templates);
      return { success: true, data: created as unknown as SaasNotificationTemplates };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Subscribe to email logs for real-time updates
  subscribeEmailLogs(callback: (logs: EmailLogEntry[]) => void) {
    return pb.collection('email_logs').subscribe('*', (e) => {
      if (e.record?.tenantId === pb.authStore.model?.tenantId) {
        // Fetch latest logs
        pb.collection('email_logs').getFullList({
          filter: `tenantId = "${pb.authStore.model?.tenantId}"`,
          sort: '-sentAt',
        }).then(logs => callback(logs as unknown as EmailLogEntry[]));
      }
    });
  },

  subscribeConfig(callback: (config: SmtpConfig) => void) {
    return pb.collection(COLLECTIONS.SMTP_CONFIG).subscribe('*', (e) => {
      if (e.record?.tenantId === pb.authStore.model?.tenantId) {
        callback(e.record as unknown as SmtpConfig);
      }
    });
  },

  subscribeSaasConfig(callback: (config: SaasSmtpConfig) => void) {
    return pb.collection(COLLECTIONS.SAAS_SMTP).subscribe('*', (e) => {
      callback(e.record as unknown as SaasSmtpConfig);
    });
  },
};

export default smtpService;