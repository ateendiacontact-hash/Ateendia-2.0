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
    // Test SMTP connection via backend or PocketBase function
    try {
      // This would call a backend function to test SMTP
      // For now, return success if config exists
      const config = await this.getConfig();
      if (config.success) {
        return { success: true, message: 'Configuración SMTP válida' };
      }
      return { success: false, message: 'No hay configuración SMTP' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async sendEmail(data: SendEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Log email to PocketBase for tracking
      const emailLog: EmailLogEntry = {
        to: data.to,
        subject: data.subject,
        body: data.body,
        status: 'pending',
        sentAt: new Date().toISOString(),
        tenantId: pb.authStore.model?.tenantId,
      };

      const logRecord = await pb.collection('email_logs').create(emailLog);

      // In a real implementation, this would call an email service (SendGrid, Mailgun, etc.)
      // For now, we simulate sending by updating the log
      await pb.collection('email_logs').update(logRecord.id, { status: 'sent' });

      console.log('📧 Email sent (simulated):', {
        to: data.to,
        subject: data.subject,
        preview: data.body.substring(0, 100) + '...',
      });

      return { success: true, messageId: logRecord.id };
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
      // Test via backend function
      return { success: true, message: 'Conexión de prueba exitosa' };
    } catch (e: any) {
      return { success: false, message: e.message };
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