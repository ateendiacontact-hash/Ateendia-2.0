import { pb, COLLECTIONS } from './pocketbase';
import { SmtpConfig, SaasSmtpConfig, SaasNotificationTemplates } from '../types';

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

export interface EmailLogEntry {
  id?: string;
  to: string;
  subject: string;
  body: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
  sentAt: string;
  tenantId?: string;
}

const PB_TENANT_SMTP = 'tenant_smtp';
const PB_SAAS_SMTP = 'saas_smtp';

export const smtpService = {
  async getConfig(): Promise<{ success: boolean; data?: SmtpConfig; error?: string }> {
    try {
      const tenantId = pb.authStore.model?.tenantId;
      if (!tenantId) {
        return { success: false, error: 'No tenant ID available' };
      }
      const records = await pb.collection(PB_TENANT_SMTP).getFullList({
        filter: `tenantId = "${tenantId}"`,
      });
      if (records.length === 0) {
        return { success: true, data: undefined };
      }
      return { success: true, data: records[0] as unknown as SmtpConfig };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' };
    }
  },

  async updateConfig(config: Partial<SmtpConfig>): Promise<{ success: boolean; data?: SmtpConfig; error?: string }> {
    try {
      const tenantId = pb.authStore.model?.tenantId;
      if (!tenantId) {
        return { success: false, error: 'No tenant ID available' };
      }
      const existing = await this.getConfig();
      if (existing.success && existing.data) {
        const updated = await pb.collection(PB_TENANT_SMTP).update(existing.data.id, config);
        return { success: true, data: updated as unknown as SmtpConfig };
      }
      const created = await pb.collection(PB_TENANT_SMTP).create({
        ...config,
        tenantId,
      });
      return { success: true, data: created as unknown as SmtpConfig };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' };
    }
  },

  async testConnection(data: TestSmtpData): Promise<{ success: boolean; message: string }> {
    try {
      const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://13.140.37.155:8080';
      const apiUrl = `${pbUrl}/api/email/test`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const rawData: unknown = await response.json();
        const result = (rawData && typeof rawData === 'object') ? rawData as Record<string, unknown> : {};
        return { success: true, message: (result.message as string) || 'Conexión SMTP exitosa' };
      } else {
        const rawData: unknown = await response.json();
        const errorData = (rawData && typeof rawData === 'object') ? rawData as Record<string, unknown> : {};
        return { success: false, message: (errorData.message as string) || (errorData.error as string) || 'Error al probar conexión SMTP' };
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error de conexión';
      return { success: false, message: `Error de conexión: ${msg}` };
    }
  },

  async sendEmail(data: SendEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://13.140.37.155:8080';
      const apiUrl = `${pbUrl}/api/email/send`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: data.to,
          subject: data.subject,
          body: data.body,
          templateId: data.templateId,
          variables: data.variables,
          clientId: data.clientId,
        }),
      });

      if (response.ok) {
        const rawData: unknown = await response.json();
        const result = (rawData && typeof rawData === 'object') ? rawData as Record<string, unknown> : {};
        return { success: true, messageId: (result.messageId as string) || (result.id as string) };
      }

      const rawErrorData: unknown = await response.json();
      const errorData = (rawErrorData && typeof rawErrorData === 'object') ? rawErrorData as Record<string, unknown> : {};
      const errorMsg = (errorData.message as string) || (errorData.error as string) || 'Error al enviar el correo electrónico';
      return { success: false, error: errorMsg };
    } catch (e: unknown) {
      console.error('Failed to send email:', e instanceof Error ? e.message : e);
      return { success: false, error: `Error de conexión: ${e instanceof Error ? e.message : 'Desconocido'}` };
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

  async getSaasConfig(): Promise<{ success: boolean; data?: SaasSmtpConfig; error?: string }> {
    try {
      const records = await pb.collection(PB_SAAS_SMTP).getFullList();
      if (records.length === 0) {
        return { success: true, data: undefined };
      }
      return { success: true, data: records[0] as unknown as SaasSmtpConfig };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' };
    }
  },

  async updateSaasConfig(config: SaasSmtpConfig): Promise<{ success: boolean; data?: SaasSmtpConfig; error?: string }> {
    try {
      const existing = await this.getSaasConfig();
      if (existing.success && existing.data) {
        const updated = await pb.collection(PB_SAAS_SMTP).update(existing.data.id, config);
        return { success: true, data: updated as unknown as SaasSmtpConfig };
      }
      const created = await pb.collection(PB_SAAS_SMTP).create(config);
      return { success: true, data: created as unknown as SaasSmtpConfig };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' };
    }
  },

  async testSaasConnection(toEmail: string, config?: SaasSmtpConfig): Promise<{ success: boolean; message: string }> {
    try {
      if (!toEmail) {
        return { success: false, message: '⚠️ Se requiere un correo electrónico destino para la prueba.' };
      }

      const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://13.140.37.155:8080';
      const apiUrl = `${pbUrl}/api/email/test`;

      const testConfig = config || (await this.getSaasConfig()).data;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail,
          config: testConfig,
          isSaas: true,
        }),
      });

      if (response.ok) {
        const rawData: unknown = await response.json();
        const result = (rawData && typeof rawData === 'object') ? rawData as Record<string, unknown> : {};
        return { success: true, message: (result.message as string) || 'Conexión SMTP Central exitosa' };
      }

      const rawErrorData: unknown = await response.json();
      const errorData = (rawErrorData && typeof rawErrorData === 'object') ? rawErrorData as Record<string, unknown> : {};
      return { success: false, message: (errorData.message as string) || (errorData.error as string) || 'Error al probar conexión SMTP Central' };
    } catch (e: unknown) {
      return { success: false, message: `Error de conexión: ${e instanceof Error ? e.message : 'Error de conexión SMTP Central'}` };
    }
  },

  async getSaasTemplates(): Promise<{ success: boolean; data?: SaasNotificationTemplates; error?: string }> {
    try {
      const records = await pb.collection('saas_notif_templates').getFullList();
      return { success: true, data: records[0] as unknown as SaasNotificationTemplates };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' };
    }
  },

  async updateSaasTemplates(templates: SaasNotificationTemplates): Promise<{ success: boolean; data?: SaasNotificationTemplates; error?: string }> {
    try {
      const existing = await this.getSaasTemplates();
      if (existing.success && existing.data) {
        const updated = await pb.collection('saas_notif_templates').update(existing.data.id, templates);
        return { success: true, data: updated as unknown as SaasNotificationTemplates };
      }
      const created = await pb.collection('saas_notif_templates').create(templates);
      return { success: true, data: created as unknown as SaasNotificationTemplates };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' };
    }
  },

  subscribeEmailLogs(callback: (logs: EmailLogEntry[]) => void) {
    return pb.collection('email_logs').subscribe('*', (e) => {
      if (e.record?.tenantId === pb.authStore.model?.tenantId) {
        pb.collection('email_logs').getFullList({
          filter: `tenantId = "${pb.authStore.model?.tenantId}"`,
          sort: '-sentAt',
        }).then(logs => callback(logs as unknown as EmailLogEntry[]));
      }
    });
  },

  subscribeConfig(callback: (config: SmtpConfig) => void) {
    return pb.collection(PB_TENANT_SMTP).subscribe('*', (e) => {
      if (e.record?.tenantId === pb.authStore.model?.tenantId) {
        callback(e.record as unknown as SmtpConfig);
      }
    });
  },

  subscribeSaasConfig(callback: (config: SaasSmtpConfig) => void) {
    return pb.collection(PB_SAAS_SMTP).subscribe('*', (e) => {
      callback(e.record as unknown as SaasSmtpConfig);
    });
  },
};

export default smtpService;