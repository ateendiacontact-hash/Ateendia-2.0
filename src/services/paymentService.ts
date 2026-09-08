import { pb, COLLECTIONS } from './pocketbase';
import { SaasPaymentReceipt, TenantBranding, TenantSubscription, SaasPlanFeatureLimit } from '../types';

const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'http://13.140.37.155:8080';
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || 'evolution2026';
const CENTRAL_INSTANCE = import.meta.env.VITE_CENTRAL_SAAS_INSTANCE || 'central-saas';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'stripe' | 'paypal' | 'bank_transfer' | 'crypto_usdt' | 'zelle' | 'other';
  enabled: boolean;
  config?: Record<string, any>;
}

export interface ProcessPaymentData {
  tenantId?: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'annual';
  paymentMethod: PaymentMethod['type'];
  referenceNumber: string;
  receiptFile?: File;
  receiptUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentRecord {
  id: string;
  tenantId?: string;
  tenantName?: string;
  adminEmail: string;
  adminName: string;
  adminPhone?: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'annual';
  paymentMethod: PaymentMethod['type'];
  referenceNumber: string;
  receiptUrl?: string;
  receiptFileName?: string;
  receiptFileType?: string;
  receiptFileSize?: string;
  status: 'pending_verification' | 'approved' | 'rejected' | 'failed';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  validFrom?: string;
  validUntil?: string;
  type: 'new_registration' | 'renewal' | 'plan_upgrade';
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'stripe', name: 'Stripe (Tarjeta)', type: 'stripe', enabled: true },
  { id: 'paypal', name: 'PayPal', type: 'paypal', enabled: true },
  { id: 'bank_transfer', name: 'Transferencia Bancaria', type: 'bank_transfer', enabled: true },
  { id: 'zelle', name: 'Zelle', type: 'zelle', enabled: true },
  { id: 'crypto_usdt', name: 'USDT (TRC20/ERC20)', type: 'crypto_usdt', enabled: true },
];

export const paymentService = {
  getMethods(): PaymentMethod[] {
    return PAYMENT_METHODS.filter(m => m.enabled);
  },

  async processStripePayment(data: ProcessPaymentData): Promise<{ success: boolean; clientSecret?: string; paymentId?: string; error?: string }> {
    // In a real implementation, this would call your backend to create a PaymentIntent
    // For now, we'll simulate success
    try {
      // Call your backend endpoint to create Stripe PaymentIntent
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/payments/stripe/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async processPaypalPayment(data: ProcessPaymentData): Promise<{ success: boolean; orderId?: string; approvalUrl?: string; error?: string }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/payments/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async submitManualPayment(data: ProcessPaymentData): Promise<PaymentRecord> {
    let receiptUrl = data.receiptUrl;
    
    if (data.receiptFile) {
      // Upload to PocketBase files
      const formData = new FormData();
      formData.append('receipt', data.receiptFile);
      
      const uploadResponse = await fetch(`${pb.baseUrl}/api/files/${COLLECTIONS.PAYMENTS}/${data.tenantId || 'temp'}/receipt`, {
        method: 'POST',
        headers: pb.authStore.token ? { 'Authorization': pb.authStore.token } : {},
        body: formData,
      });
      
      const uploadResult = await uploadResponse.json();
      if (uploadResult.url) {
        receiptUrl = `${pb.baseUrl}/api/files/${COLLECTIONS.PAYMENTS}/${uploadResult.id}/${uploadResult.filename}`;
      }
    }

    const payment: Omit<PaymentRecord, 'id'> = {
      tenantId: data.tenantId,
      adminEmail: data.metadata?.adminEmail || '',
      adminName: data.metadata?.adminName || '',
      adminPhone: data.metadata?.adminPhone,
      planId: data.planId,
      planName: data.planName,
      amount: data.amount,
      currency: data.currency,
      billingCycle: data.billingCycle,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      receiptUrl,
      receiptFileName: data.receiptFile?.name,
      receiptFileType: data.receiptFile?.type,
      receiptFileSize: data.receiptFile?.size?.toString(),
      status: 'pending_verification',
      submittedAt: new Date().toISOString(),
      type: data.metadata?.type || 'new_registration',
    };

    const record = await pb.collection(COLLECTIONS.PAYMENTS).create(payment);
    
    // Notify via WhatsApp Central
    await this.notifyPaymentReceived(record as unknown as PaymentRecord);
    
    // Send webhook to n8n
    await this.sendWebhook('payment.received', record);

    return record as unknown as PaymentRecord;
  },

  async approvePayment(paymentId: string, validFrom: string, validUntil: string): Promise<PaymentRecord> {
    const payment = await pb.collection(COLLECTIONS.PAYMENTS).getOne(paymentId);
    
    // If it's a new registration, create the tenant
    if (payment.type === 'new_registration' && payment.tenantId) {
      await this.activateTenant(payment.tenantId, validFrom, validUntil);
    } else if (payment.tenantId) {
      // Update subscription for existing tenant
      await this.updateTenantSubscription(payment.tenantId, {
        status: 'active',
        renewalDate: validUntil,
        lastPaymentDate: new Date().toISOString().split('T')[0],
      });
    }

    const updated = await pb.collection(COLLECTIONS.PAYMENTS).update(paymentId, {
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: pb.authStore.model?.id,
      validFrom,
      validUntil,
    });

    // Notify tenant via WhatsApp and Email
    await this.notifyTenantApproved(payment, validFrom, validUntil);
    await this.sendApprovalEmail(payment, validFrom, validUntil);

    return updated as unknown as PaymentRecord;
  },

  async rejectPayment(paymentId: string, reason: string): Promise<PaymentRecord> {
    const payment = await pb.collection(COLLECTIONS.PAYMENTS).getOne(paymentId);
    
    const updated = await pb.collection(COLLECTIONS.PAYMENTS).update(paymentId, {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: pb.authStore.model?.id,
      rejectionReason: reason,
    });

    // Notify tenant
    await this.notifyTenantRejected(payment, reason);

    return updated as unknown as PaymentRecord;
  },

  async activateTenant(tenantId: string, validFrom: string, validUntil: string): Promise<TenantBranding> {
    // Update tenant status
    const tenant = await pb.collection(COLLECTIONS.TENANTS).update(tenantId, {
      status: 'active',
      subscription: {
        status: 'active',
        renewalDate: validUntil,
        startDate: validFrom,
        lastPaymentDate: new Date().toISOString().split('T')[0],
      },
    });

    // Create admin user if not exists
    const existingUsers = await pb.collection(COLLECTIONS.USERS).getList(1, 1, {
      filter: `tenantId = "${tenantId}" && role = "admin"`,
    });

    if (existingUsers.items.length === 0) {
      // Create admin user
      const tempPassword = this.generateTempPassword();
      await pb.collection(COLLECTIONS.USERS).create({
        tenantId,
        email: tenant.adminEmail,
        name: tenant.adminName,
        role: 'admin',
        phone: tenant.adminPhone,
        password: tempPassword,
        passwordConfirm: tempPassword,
        twoFactorEnabled: false,
      });

      // Send welcome email with credentials
      await this.sendWelcomeEmail(tenant, tempPassword);
    }

    return tenant as unknown as TenantBranding;
  },

  async updateTenantSubscription(tenantId: string, subscription: Partial<TenantSubscription>): Promise<TenantBranding> {
    const tenant = await pb.collection(COLLECTIONS.TENANTS).getOne(tenantId);
    const currentSub = tenant.subscription || {};
    
    return pb.collection(COLLECTIONS.TENANTS).update(tenantId, {
      subscription: { ...currentSub, ...subscription },
    }) as unknown as TenantBranding;
  },

  async getPendingPayments(): Promise<PaymentRecord[]> {
    const result = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({
      filter: 'status = "pending_verification"',
      sort: '-submittedAt',
    });
    return result as unknown as PaymentRecord[];
  },

  async getPaymentsByTenant(tenantId: string): Promise<PaymentRecord[]> {
    const result = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({
      filter: `tenantId = "${tenantId}"`,
      sort: '-submittedAt',
    });
    return result as unknown as PaymentRecord[];
  },

  async getPaymentById(id: string): Promise<PaymentRecord> {
    const record = await pb.collection(COLLECTIONS.PAYMENTS).getOne(id);
    return record as unknown as PaymentRecord;
  },

  generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  },

  async notifyPaymentReceived(payment: PaymentRecord) {
    const adminPhones = ['17864502819', '13059124433'];
    
    for (const phone of adminPhones) {
      try {
        await fetch(`${EVOLUTION_API_URL}/message/sendText/${CENTRAL_INSTANCE}`, {
          method: 'POST',
          headers: { 'apikey': EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: phone,
            text: `💰 *Nuevo Pago Recibido*\n\nEmpresa: ${payment.tenantName || payment.tenantId}\nPlan: ${payment.planName}\nMonto: $${payment.amount} ${payment.currency}\nMétodo: ${payment.paymentMethod}\nRef: ${payment.referenceNumber}\n\nRevisar en Central SaaS > Pagos`,
          }),
        });
      } catch (e) {
        console.error('WhatsApp notification failed:', e);
      }
    }
  },

  async notifyTenantApproved(payment: PaymentRecord, validFrom: string, validUntil: string) {
    if (!payment.adminPhone) return;
    
    try {
      await fetch(`${EVOLUTION_API_URL}/message/sendText/${CENTRAL_INSTANCE}`, {
        method: 'POST',
        headers: { 'apikey': EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: payment.adminPhone.replace(/\D/g, ''),
          text: `✅ *¡Pago Aprobado y Cuenta Activada!*\n\nBienvenido a Ateendia CRM, ${payment.adminName}.\n\nTu plan ${payment.planName} está activo desde el ${validFrom} hasta el ${validUntil}.\n\n🔗 Accede aquí: ${import.meta.env.VITE_APP_URL || 'https://ateendia.cloud'}/${payment.tenantId}\n\nUsuario: ${payment.adminEmail}\n\n¡Gracias por confiar en nosotros!`,
        }),
      });
    } catch (e) {
      console.error('WhatsApp approval notification failed:', e);
    }
  },

  async notifyTenantRejected(payment: PaymentRecord, reason: string) {
    if (!payment.adminPhone) return;
    
    try {
      await fetch(`${EVOLUTION_API_URL}/message/sendText/${CENTRAL_INSTANCE}`, {
        method: 'POST',
        headers: { 'apikey': EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: payment.adminPhone.replace(/\D/g, ''),
          text: `❌ *Pago Rechazado*\n\nHola ${payment.adminName},\n\nTu pago para el plan ${payment.planName} no pudo ser verificado.\n\nMotivo: ${reason}\n\nPor favor, verifica el comprobante e intenta nuevamente o contacta a soporte.`,
        }),
      });
    } catch (e) {
      console.error('WhatsApp rejection notification failed:', e);
    }
  },

  async sendApprovalEmail(payment: PaymentRecord, validFrom: string, validUntil: string) {
    // Implement email sending via SMTP service
    await fetch(`${import.meta.env.VITE_API_URL || '/api'}/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: payment.adminEmail,
        subject: '✅ Tu cuenta Ateendia CRM ha sido activada',
        template: 'account_approved',
        variables: {
          adminName: payment.adminName,
          planName: payment.planName,
          validFrom,
          validUntil,
          loginUrl: `${import.meta.env.VITE_APP_URL || 'https://ateendia.cloud'}/${payment.tenantId}`,
        },
      }),
    });
  },

  async sendWelcomeEmail(tenant: any, tempPassword: string) {
    await fetch(`${import.meta.env.VITE_API_URL || '/api'}/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: tenant.adminEmail,
        subject: '🎉 Bienvenido a Ateendia CRM - Tus credenciales de acceso',
        template: 'welcome_credentials',
        variables: {
          adminName: tenant.adminName,
          loginUrl: `${import.meta.env.VITE_APP_URL || 'https://ateendia.cloud'}/${tenant.id}`,
          email: tenant.adminEmail,
          tempPassword,
        },
      }),
    });
  },

  async sendWebhook(event: string, payload: any) {
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
      });
    } catch (e) {
      console.error('Webhook failed:', e);
    }
  },
};

export default paymentService;