import { pb, COLLECTIONS, pbLogin, pbLogout, getCurrentUser, getCurrentTenantId, isSuperAdmin, getUserRole, isGlobalSuperAdmin } from './pocketbase';
import { User, TenantBranding } from '../types';
import { smtpService } from './smtpService';

export interface AuthState {
  user: User | null;
  tenant: TenantBranding | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isMockMode: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterTenantData {
  companyName: string;
  subdomain: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'crypto_usdt' | 'zelle';
  amount: number;
}

// OTP collection name
const OTP_COLLECTION = 'otp_codes';

// Super Admin constants
const SUPER_ADMIN_EMAIL = 'victoraray8@gmail.com';
const SUPER_ADMIN_PASSWORD = 'Va-vic842867';
const SUPER_ADMIN_NAME = 'Victor';
const SUPER_ADMIN_ROLE = 'super_admin';
const SUPER_ADMIN_TENANT_ID = 'global';

// Demo users for fallback
const DEMO_USERS = [
  { email: 'victoraray8@gmail.com', password: 'Va-vic842867', name: 'Victor', role: 'super_admin', tenantId: 'global', isSuperAdmin: true },
  { email: 'gabriel@solnacienteseguros.com', password: 'demo123', name: 'Gabriel', role: 'admin', tenantId: 'tenant-ateendia', isSuperAdmin: false },
];

// Mock tenants for fallback - HARDCODED 3 empresas para Super Admin Global
const MOCK_TENANTS: Record<string, TenantBranding> = {
  'global': {
    id: 'global',
    name: 'Ateendia Global (Super Admin)',
    subdomain: 'global',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    accentColor: '#f59e0b',
    currency: 'USD',
    language: 'es',
    status: 'active',
    subscription: { 
      status: 'active', 
      plan: 'Enterprise', 
      renewalDate: '2099-12-31',
      monthlyPrice: 0,
      userQuota: 999,
      whatsappLinesQuota: 10,
      storageGb: 999,
      planId: 'enterprise',
      billingCycle: 'annual',
      gracePeriodDays: 30,
    },
  } as TenantBranding,
  'tenant-ateendia': {
    id: 'tenant-ateendia',
    name: 'Ateendia Seguros',
    subdomain: 'ateendia',
    primaryColor: '#4f46e5',
    secondaryColor: '#7c3aed',
    accentColor: '#10b981',
    currency: 'USD',
    language: 'es',
    status: 'active',
    subscription: { 
      status: 'active', 
      plan: 'Enterprise', 
      renewalDate: '2026-12-31',
      monthlyPrice: 299,
      userQuota: 25,
      whatsappLinesQuota: 5,
      storageGb: 100,
      planId: 'enterprise',
      billingCycle: 'monthly',
      gracePeriodDays: 5,
    },
  } as TenantBranding,
  'tenant-optima': {
    id: 'tenant-optima',
    name: 'Optima Health Brokers',
    subdomain: 'optima',
    primaryColor: '#059669',
    secondaryColor: '#047857',
    accentColor: '#10b981',
    currency: 'USD',
    language: 'es',
    status: 'active',
    subscription: { 
      status: 'active', 
      plan: 'Pro Business', 
      renewalDate: '2026-12-31',
      monthlyPrice: 149,
      userQuota: 10,
      whatsappLinesQuota: 2,
      storageGb: 50,
      planId: 'pro',
      billingCycle: 'monthly',
      gracePeriodDays: 5,
    },
  } as TenantBranding,
  'tenant-sol': {
    id: 'tenant-sol',
    name: 'Seguros Sol Naciente',
    subdomain: 'solnaciente',
    primaryColor: '#dc2626',
    secondaryColor: '#b91c1c',
    accentColor: '#f97316',
    currency: 'USD',
    language: 'es',
    status: 'active',
    subscription: { 
      status: 'active', 
      plan: 'Starter', 
      renewalDate: '2026-12-31',
      monthlyPrice: 79,
      userQuota: 5,
      whatsappLinesQuota: 1,
      storageGb: 20,
      planId: 'starter',
      billingCycle: 'monthly',
      gracePeriodDays: 5,
    },
  } as TenantBranding,
};

class AuthService {
  private listeners: Set<(state: AuthState) => void> = new Set();
  private state: AuthState = {
    user: null,
    tenant: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    isMockMode: false,
  };

  constructor() {
    this.init();
  }

  private async init() {
    // Check for existing mock session in localStorage
    const mockSession = this.getMockSession();
    if (mockSession) {
      this.updateState({
        user: mockSession.user,
        tenant: mockSession.tenant,
        isAuthenticated: true,
        isLoading: false,
        isMockMode: true,
      });
      return;
    }

    // Try PocketBase with 3 second timeout
    if (pb.authStore.isValid) {
      try {
        const authRefreshPromise = pb.collection(COLLECTIONS.USERS).authRefresh();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        await Promise.race([authRefreshPromise, timeoutPromise]);
        await this.loadUserAndTenant();
      } catch (e) {
        console.log('🔄 PocketBase unavailable, checking for mock session...');
        pb.authStore.clear();
        this.updateState({ isLoading: false });
      }
    } else {
      this.updateState({ isLoading: false });
    }
  }

  // Get mock session from localStorage
  private getMockSession(): { user: User; tenant: TenantBranding } | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('ateendia_mock_session');
      if (stored) {
        const session = JSON.parse(stored);
        // Validate session not expired (24 hours)
        if (session.expiresAt && Date.now() < session.expiresAt) {
          return { user: session.user, tenant: session.tenant };
        }
      }
    } catch (e) {
      console.error('Error reading mock session:', e);
    }
    return null;
  }

  // Save mock session to localStorage
  private saveMockSession(user: User, tenant: TenantBranding) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('ateendia_mock_session', JSON.stringify({
        user,
        tenant,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      }));
    } catch (e) {
      console.error('Error saving mock session:', e);
    }
  }

  // Clear mock session
  private clearMockSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('ateendia_mock_session');
  }

  // Find demo user by credentials
  private findDemoUser(email: string, password: string) {
    return DEMO_USERS.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
  }

  private async loadUserAndTenant() {
    const user = getCurrentUser();
    if (!user) return;

    const tenant = await pb.collection(COLLECTIONS.TENANTS).getOne(user.tenantId);
    
    this.updateState({
      user: user as unknown as User,
      tenant: tenant as unknown as TenantBranding,
      isAuthenticated: true,
      isLoading: false,
      isMockMode: false,
    });
  }

  private updateState(partial: Partial<AuthState>) {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  subscribe(callback: (state: AuthState) => void) {
    this.listeners.add(callback);
    callback(this.state);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.state));
  }

  getState(): AuthState {
    return { ...this.state };
  }

  // Generate secure 6-digit OTP
  private generateOTP(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  // Store OTP in PocketBase with expiration (5 minutes)
  private async storeOTP(userId: string, email: string, code: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await pb.collection(OTP_COLLECTION).create({
      userId,
      email,
      code,
      expiresAt: expiresAt.toISOString(),
      used: false,
      attempts: 0,
    });
  }

  // Verify OTP from PocketBase
  private async verifyOTP(userId: string, code: string): Promise<boolean> {
    try {
      const records = await pb.collection(OTP_COLLECTION).getList(1, 1, {
        filter: `userId = "${userId}" && code = "${code}" && used = false && expiresAt > "${new Date().toISOString()}"`,
        sort: '-created',
      });

      if (records.items.length > 0) {
        await pb.collection(OTP_COLLECTION).update(records.items[0].id, { used: true });
        return true;
      }
      return false;
    } catch (e) {
      console.error('OTP verification error:', e);
      return false;
    }
  }

  // Send OTP via email
  private async sendOTPEmail(email: string, code: string, tenantName: string): Promise<void> {
    try {
      await smtpService.sendEmail({
        to: email,
        subject: `🔐 Tu código de verificación Ateendia CRM - ${code}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Ateendia CRM</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Verificación en Dos Pasos (2FA)</p>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #334155;">Hola,</p>
              <p style="font-size: 16px; color: #334155;">Has solicitado acceso a <strong>${tenantName}</strong>. Tu código de verificación es:</p>
              <div style="background: #f8fafc; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">${code}</span>
              </div>
              <p style="font-size: 14px; color: #64748b;">Este código expira en <strong>5 minutos</strong>. No lo compartas con nadie.</p>
              <p style="font-size: 14px; color: #64748b;">Si no solicitaste este acceso, por favor ignora este correo.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p style="font-size: 12px; color: #94a3b8;">Equipo de Seguridad - Ateendia CRM</p>
            </div>
          </div>
        `,
        clientId: '',
        templateId: 'otp_verification',
      });
    } catch (e) {
      console.error('Failed to send OTP email:', e);
      throw new Error('No se pudo enviar el código por correo. Verifica la configuración SMTP.');
    }
  }

  // Parse PocketBase error to user-friendly message
  private parseAuthError(error: any): string {
    const message = error?.message || error?.response?.message || String(error);
    
    if (message.includes('Failed to authenticate') || message.includes('Invalid credentials') || message.includes('wrong password')) {
      return 'Credenciales incorrectas. Verifica tu correo y contraseña.';
    }
    if (message.includes('User not found') || message.includes('no user found') || message.includes('not found')) {
      return 'Usuario no encontrado. Verifica tu correo electrónico.';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection') || message.includes('Failed to connect') || message.includes('Timeout')) {
      return 'Error de conexión con el servidor. Verifica tu conexión a internet.';
    }
    if (message.includes('400') || message.includes('Bad Request')) {
      return 'Datos de entrada inválidos.';
    }
    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Sesión expirada. Por favor inicia sesión nuevamente.';
    }
    if (message.includes('403') || message.includes('Forbidden')) {
      return 'No tienes permiso para acceder.';
    }
    if (message.includes('429') || message.includes('Too Many Requests')) {
      return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
    }
    if (message.includes('500') || message.includes('Internal Server Error')) {
      return 'Error interno del servidor. Intenta más tarde.';
    }
    
    return message;
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; requires2FA?: boolean; error?: string; isMock?: boolean }> {
    this.updateState({ isLoading: true, error: null });

    // First, check demo credentials for immediate fallback
    const demoUser = this.findDemoUser(credentials.email, credentials.password);
    if (demoUser) {
      console.log('✅ Demo credentials matched, creating mock session');
      const tenant = MOCK_TENANTS[demoUser.tenantId];
      const user = {
        id: `usr-${demoUser.email.replace('@', '-').replace('.', '-')}`,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        tenantId: demoUser.tenantId,
        status: 'active',
        twoFactorEnabled: false,
        isSuperAdmin: demoUser.isSuperAdmin,
        extension: '101',
        commissionRate: 0,
      } as User;

      this.saveMockSession(user, tenant);
      this.updateState({
        user,
        tenant,
        isAuthenticated: true,
        isLoading: false,
        isMockMode: true,
        error: null,
      });
      return { success: true, isMock: true };
    }

    // Try PocketBase with 3 second timeout
    try {
      const loginPromise = pbLogin(credentials.email, credentials.password);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );
      
      const authData = await Promise.race([loginPromise, timeoutPromise]) as { record: any };
      
      // Check if 2FA is enabled
      if (authData.record.twoFactorEnabled) {
        if (!credentials.twoFactorCode) {
          // Step 1: Generate and send OTP
          const otpCode = this.generateOTP();
          await this.storeOTP(authData.record.id, credentials.email, otpCode);
          
          // Get tenant name for email
          const tenant = await pb.collection(COLLECTIONS.TENANTS).getOne(authData.record.tenantId);
          
          // Send OTP email
          await this.sendOTPEmail(credentials.email, otpCode, (tenant as any).name || 'Ateendia CRM');
          
          this.updateState({ isLoading: false });
          return { success: true, requires2FA: true };
        }
        
        // Step 2: Verify OTP
        const isValid = await this.verifyOTP(authData.record.id, credentials.twoFactorCode);
        if (!isValid) {
          this.updateState({ isLoading: false, error: 'Código inválido o expirado' });
          return { success: false, error: 'Código inválido o expirado' };
        }
      }

      await this.loadUserAndTenant();
      return { success: true };
    } catch (e: any) {
      // PocketBase failed - check if it's a demo user
      if (demoUser) {
        console.log('🔄 PocketBase failed, using demo fallback');
        const tenant = MOCK_TENANTS[demoUser.tenantId];
        const user = {
          id: `usr-${demoUser.email.replace('@', '-').replace('.', '-')}`,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          tenantId: demoUser.tenantId,
          status: 'active',
          twoFactorEnabled: false,
          isSuperAdmin: demoUser.isSuperAdmin,
          extension: '101',
          commissionRate: 0,
        } as User;

        this.saveMockSession(user, tenant);
        this.updateState({
          user,
          tenant,
          isAuthenticated: true,
          isLoading: false,
          isMockMode: true,
          error: null,
        });
        return { success: true, isMock: true, error: 'Modo Local: Servidor no disponible. Acceso de prueba habilitado.' };
      }

      // Not a demo user - return parsed error
      const error = this.parseAuthError(e);
      this.updateState({ isLoading: false, error });
      return { success: false, error };
    }
  }

  async resendOtp(email: string): Promise<void> {
    try {
      // Find user by email
      const users = await pb.collection(COLLECTIONS.USERS).getList(1, 1, {
        filter: `email = "${email.toLowerCase()}"`,
      });
      
      if (users.items.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const user = users.items[0];
      const otpCode = this.generateOTP();
      await this.storeOTP(user.id, email, otpCode);
      
      // Get tenant name for email
      const tenant = await pb.collection(COLLECTIONS.TENANTS).getOne(user.tenantId);
      
      // Send OTP email
      await this.sendOTPEmail(email, otpCode, (tenant as any).name || 'Ateendia CRM');
    } catch (e: any) {
      console.error('Resend OTP error:', e);
      throw new Error(this.parseAuthError(e));
    }
  }

  // Request password reset - uses PocketBase native SDK
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Use PocketBase's built-in password reset request
      await pb.collection(COLLECTIONS.USERS).requestPasswordReset(email);
      return { success: true };
    } catch (e: any) {
      console.error('Password reset request error:', e);
      // Return real PocketBase error message
      return { success: false, error: this.parseAuthError(e) };
    }
  }

  // Confirm password reset with token from email
  async confirmPasswordReset(token: string, password: string, passwordConfirm: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (password !== passwordConfirm) {
        return { success: false, error: 'Las contraseñas no coinciden' };
      }
      if (password.length < 8) {
        return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' };
      }

      // Use PocketBase's built-in password reset confirmation
      await pb.collection(COLLECTIONS.USERS).confirmPasswordReset(token, password, passwordConfirm);
      return { success: true };
    } catch (e: any) {
      console.error('Password reset confirmation error:', e);
      return { success: false, error: this.parseAuthError(e) };
    }
  }

  async logout() {
    await pbLogout();
    this.clearMockSession();
    this.updateState({
      user: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
      isMockMode: false,
    });
  }

  async registerTenant(data: RegisterTenantData): Promise<{ success: boolean; tenantId?: string; error?: string }> {
    this.updateState({ isLoading: true, error: null });

    try {
      // Create pending tenant record
      const pending = await pb.collection(COLLECTIONS.TENANTS_PENDING).create({
        ...data,
        status: 'pending_payment',
        submittedAt: new Date().toISOString(),
      });

      // Send webhook to n8n
      await this.sendWebhook('tenant.pending', { pendingId: pending.id, ...data });

      // Notify via WhatsApp Central
      await this.notifyWhatsAppCentral('new_tenant_pending', { companyName: data.companyName, adminEmail: data.adminEmail });

      this.updateState({ isLoading: false });
      return { success: true, tenantId: pending.id };
    } catch (e: any) {
      const error = this.parseAuthError(e);
      this.updateState({ isLoading: false, error });
      return { success: false, error };
    }
  }

  async submitDemoRequest(data: { name: string; email: string; phone: string; company: string; message?: string }) {
    try {
      const request = await pb.collection(COLLECTIONS.DEMO_REQUESTS).create({
        ...data,
        status: 'new',
        submittedAt: new Date().toISOString(),
      });

      // Send webhook to n8n
      await this.sendWebhook('demo.requested', { requestId: request.id, ...data });

      // Notify sales team via WhatsApp Central
      await this.notifyWhatsAppCentral('new_demo_request', { 
        name: data.name, 
        email: data.email, 
        phone: data.phone,
        company: data.company 
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: this.parseAuthError(e) };
    }
  }

  private async sendWebhook(event: string, payload: any) {
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
  }

  private async notifyWhatsAppCentral(type: string, data: any) {
    const centralInstance = import.meta.env.VITE_CENTRAL_SAAS_INSTANCE;
    const evolutionUrl = import.meta.env.VITE_EVOLUTION_API_URL;
    const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;

    if (!centralInstance || !evolutionUrl || !apiKey) return;

    const adminPhones = ['17864502819', '13059124433']; // Super Admin phones

    for (const phone of adminPhones) {
      try {
        await fetch(`${evolutionUrl}/message/sendText/${centralInstance}`, {
          method: 'POST',
          headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: phone,
            text: this.formatWhatsAppMessage(type, data),
          }),
        });
      } catch (e) {
        console.error('WhatsApp notification failed:', e);
      }
    }
  }

  private formatWhatsAppMessage(type: string, data: any): string {
    switch (type) {
      case 'new_tenant_pending':
        return `🏢 *Nueva Empresa Pendiente*\n\nEmpresa: ${data.companyName}\nAdmin: ${data.adminEmail}\n\nRevisar en Central SaaS > Empresas`;
      case 'new_demo_request':
        return `🎯 *Nueva Solicitud de Demo*\n\nNombre: ${data.name}\nEmpresa: ${data.company}\nEmail: ${data.email}\nTel: ${data.phone}`;
      case 'payment_received':
        return `💰 *Pago Recibido*\n\nEmpresa: ${data.companyName}\nPlan: ${data.planName}\nMonto: $${data.amount}\nMétodo: ${data.paymentMethod}`;
      case 'tenant_approved':
        return `✅ *Empresa Aprobada*\n\nBienvenido a Ateendia CRM!\nUsuario: ${data.adminEmail}\nAcceso: ${data.loginUrl}`;
      default:
        return `Notificación: ${type}`;
    }
  }

  // Permission helpers
  can(module: string, action: string): boolean {
    if (!this.state.user) return false;
    if (isSuperAdmin()) return true;

    const role = getUserRole();
    const permissions: Record<string, Record<string, string[]>> = {
      admin: {
        clients: ['view', 'create', 'edit', 'delete', 'export'],
        policies: ['view', 'create', 'edit', 'delete'],
        pipeline: ['view', 'edit', 'moveCards', 'manageStages'],
        whatsapp: ['view', 'send', 'configure'],
        email: ['view', 'send', 'configure'],
        campaigns: ['view', 'create', 'execute'],
        banking: ['view', 'edit', 'viewSensitive'],
        telephony: ['view', 'call', 'viewCdr', 'configure'],
      },
      supervisor: {
        clients: ['view', 'create', 'edit', 'export'],
        policies: ['view', 'create', 'edit'],
        pipeline: ['view', 'edit', 'moveCards'],
        whatsapp: ['view', 'send'],
        email: ['view', 'send'],
        campaigns: ['view', 'create', 'execute'],
        banking: ['view', 'edit'],
        telephony: ['view', 'call', 'viewCdr'],
      },
      agent: {
        clients: ['view', 'create', 'edit'],
        policies: ['view', 'create', 'edit'],
        pipeline: ['view', 'moveCards'],
        whatsapp: ['view', 'send'],
        email: ['view', 'send'],
        campaigns: ['view', 'create', 'execute'],
        banking: ['view', 'edit'],
        telephony: ['view', 'call', 'viewCdr'],
      },
    };

    const rolePerms = permissions[role || 'agent'];
    if (!rolePerms) return false;
    return rolePerms[module]?.includes(action) || false;
  }
}

export const authService = new AuthService();
export default authService;