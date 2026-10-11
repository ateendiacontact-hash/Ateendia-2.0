// ===========================================
// src/services/authService.ts
// Servicio de autenticación del frontend.
//
// - Prioriza el backend Express (/api/auth/login).
// - Fallback a usuarios demo si el backend no responde.
// - Maneja must_reset_password (Sesión 3.5.B.4.c).
// ===========================================

import { User, TenantBranding } from '../types';

export interface AuthState {
  user: User | null;
  tenant: TenantBranding | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isMockMode: boolean;
  /** true si el usuario debe cambiar su contraseña antes de usar el CRM. */
  mustResetPassword: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

/**
 * Resultado del login. Discriminated union para type-narrowing seguro.
 * - success=true, requires2FA=false → login completo, revisar mustResetPassword
 * - success=true, requires2FA=true  → falta verificar OTP
 * - success=false                   → error de credenciales/red
 */
export type LoginResult =
  | { success: true; requires2FA: false; mustResetPassword: boolean }
  | { success: true; requires2FA: true; mustResetPassword: false }
  | { success: false; error: string };

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

// URL base del backend. Si VITE_WORKER_URL está vacío, usa rutas relativas
// (Vite proxy → Express en 4000 en desarrollo).
const WORKER_URL = import.meta.env.VITE_WORKER_URL || '';

// Demo users para fallback offline
const DEMO_USERS = [
  { email: 'victoraray8@gmail.com', password: 'Aray-vic842867', name: 'Víctor Medina', role: 'admin', tenantId: 'tenant-demo', isSuperAdmin: true },
  { email: 'gabriel@solnacienteseguros.com', password: 'demo123', name: 'Gabriel', role: 'admin', tenantId: 'tenant-ateendia', isSuperAdmin: false },
];

const MOCK_TENANTS: Record<string, TenantBranding> = {
  'tenant-demo': {
    id: 'tenant-demo',
    name: 'Clínica Demo Ateendia',
    subdomain: 'demo',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    accentColor: '#f59e0b',
    currency: 'USD',
    language: 'es',
    isActive: true,
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
    mustResetPassword: false,
  };

  constructor() {
    this.init();
  }

  private async init() {
    const session = this.getStoredSession();
    if (session) {
      this.updateState({
        user: session.user,
        tenant: session.tenant,
        isAuthenticated: true,
        isLoading: false,
        isMockMode: session.isMock || false,
        mustResetPassword: session.mustResetPassword || false,
      });
    } else {
      this.updateState({ isLoading: false });
    }
  }

  private getStoredSession(): { user: User; tenant: TenantBranding; isMock?: boolean; mustResetPassword?: boolean } | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('ateendia_session');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error al leer la sesión:', e);
    }
    return null;
  }

  private saveSession(user: User, tenant: TenantBranding, isMock: boolean = false, mustResetPassword: boolean = false) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('ateendia_session', JSON.stringify({ user, tenant, isMock, mustResetPassword }));
    } catch (e) {
      console.error('Error al guardar la sesión:', e);
    }
  }

  private clearSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('ateendia_session');
    localStorage.removeItem('auth_token');
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

  /**
   * Login con email + password.
   *
   * Flujo:
   * 1. Intenta POST /api/auth/login en el backend Express.
   * 2. Si responde 200: guarda token, user, tenant (o mock si no viene),
   *    y mustResetPassword.
   * 3. Si falla con 401: error de credenciales.
   * 4. Si falla por red: fallback a DEMO_USERS.
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    this.updateState({ isLoading: true, error: null });

    try {
      const response = await fetch(`${WORKER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

            if (response.ok) {
        const data = (await response.json()) as {
          user: User;
          tenant?: TenantBranding;
          token?: string;
          mustResetPassword?: boolean;
        };
        const user: User = data.user;
        const tenant: TenantBranding =
          data.tenant || MOCK_TENANTS[user.tenantId] || MOCK_TENANTS['tenant-demo'];
        const mustResetPassword = Boolean(data.mustResetPassword);

        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }

        this.saveSession(user, tenant, false, mustResetPassword);
        this.updateState({
          user,
          tenant,
          isAuthenticated: true,
          isLoading: false,
          isMockMode: false,
          error: null,
          mustResetPassword,
        });

        return { success: true, requires2FA: false, mustResetPassword };
            } else {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorData.error || 'Credenciales inválidas');
      }
    } catch (err: any) {
      console.warn('⚠️ Fallo en autenticación, verificando usuarios demo local:', err.message);

      const demoUser = DEMO_USERS.find(
        u => u.email.toLowerCase() === credentials.email.toLowerCase() && u.password === credentials.password
      );

      if (demoUser) {
        const tenant = MOCK_TENANTS[demoUser.tenantId] || MOCK_TENANTS['tenant-demo'];
        const user = {
          id: `usr-${demoUser.email.replace('@', '-').replace('.', '-')}`,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          tenantId: demoUser.tenantId,
          status: 'active',
          isSuperAdmin: demoUser.isSuperAdmin,
        } as User;

        this.saveSession(user, tenant, true, false);
        this.updateState({
          user,
          tenant,
          isAuthenticated: true,
          isLoading: false,
          isMockMode: true,
          error: null,
          mustResetPassword: false,
        });

        return { success: true, requires2FA: false, mustResetPassword: false };
      }

      const errorMessage = err.message || 'Error de conexión con el servidor.';
      this.updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Cambia la contraseña en el primer login (must_reset_password = true).
   * Requiere que el usuario esté autenticado (token en localStorage).
   */
  async changeInitialPassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, error: 'No hay sesión activa', code: 'AUTH_TOKEN_MISSING' };
      }

      const response = await fetch(`${WORKER_URL}/api/auth/change-initial-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

            const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };

      if (response.ok) {
        // Limpiar el flag en el estado y en localStorage
        if (this.state.user && this.state.tenant) {
          this.saveSession(this.state.user, this.state.tenant, this.state.isMockMode, false);
        }
        this.updateState({ mustResetPassword: false });
        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'Error al cambiar la contraseña',
        code: data.code,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de red' };
    }
  }

  /**
   * Guarda cambios en el perfil del usuario (nombre, avatar).
   * NOTA: endpoint legacy (/api/user/profile), pendiente migrar a Express.
   */
  async updateProfile(name: string, avatar: string): Promise<{ success: boolean; error?: string }> {
    if (!this.state.user) return { success: false, error: 'No hay usuario autenticado' };

    const email = this.state.user.email;

    try {
      const response = await fetch(`${WORKER_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatar }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el perfil en la base de datos');
      }

      const updatedUser: User = { ...this.state.user, name, avatar };

      if (this.state.tenant) {
        this.saveSession(updatedUser, this.state.tenant, this.state.isMockMode, this.state.mustResetPassword);
      }

      this.updateState({ user: updatedUser });
      return { success: true };
    } catch (err: any) {
      console.error('Error al actualizar perfil:', err);
      return { success: false, error: err.message || 'Fallo de red al actualizar perfil' };
    }
  }

  async logout() {
    this.clearSession();
    this.updateState({
      user: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
      isMockMode: false,
      mustResetPassword: false,
    });
  }

  /**
   * Verifica si el usuario tiene permiso para un módulo/acción.
   * TODO: implementar con la matriz real de permisos del backend.
   */
  can(_module: string, _action: string): boolean {
    if (!this.state.user) return false;
    if (this.state.user.isSuperAdmin) return true;
    return true;
  }
}

export const authService = new AuthService();
export default authService;