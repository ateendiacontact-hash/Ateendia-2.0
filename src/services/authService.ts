// ===========================================
// src/services/authService.ts
// Servicio de autenticación del frontend.
//
// - Prioriza el backend Express (/api/auth/login).
// - Fallback a usuarios demo si el backend no responde.
// - Maneja must_reset_password (Sesión 3.5.B.4.c).
// - [NUEVO] fetchWithAuth: interceptor global de 401 (BUG-AUTH-1).
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

export type LoginResult =
  | { success: true; requires2FA: false; mustResetPassword: boolean }
  | { success: true; requires2FA: true; mustResetPassword: false }
  | { success: false; error: string };

const WORKER_URL = import.meta.env.VITE_WORKER_URL || '';

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

// ✅ Tipo para las opciones de fetchWithAuth
interface FetchWithAuthOptions {
  method?: string;
  body?: any; // Acepta objetos o strings, los serializa internamente
  headers?: Record<string, string>;
}

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
    localStorage.removeItem('ateendia_auth_token');
    localStorage.removeItem('token');
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

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('auth_token') ||
      localStorage.getItem('ateendia_auth_token') ||
      localStorage.getItem('token') ||
      null
    );
  }

  /**
   * [NUEVO] Wrapper de fetch que maneja el 401 globalmente.
   *
   * - Añade el header Authorization.
   * - Si la respuesta es 401 (token expirado/inválido), llama a logout()
   *   y lanza un error para que el componente sepa que la sesión terminó.
   * - Si hay un error de red, lo propaga.
   *
   * @param endpoint Ruta relativa (ej: '/api/clients') o absoluta.
   * @param options Opciones estándar de fetch. El `body` se serializa a JSON si es un objeto.
   * @returns La respuesta (Response) si es exitosa.
   * @throws Error si la sesión expiró o hay error de red.
   */
  async fetchWithAuth(endpoint: string, options: FetchWithAuthOptions = {}): Promise<Response> {
    const token = this.getToken();
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // ✅ CORRECCIÓN: Serializamos el body a JSON aquí, de forma centralizada.
    let body: BodyInit | null = null;
    if (options.body !== undefined && options.body !== null) {
      if (typeof options.body === 'object' && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
        body = JSON.stringify(options.body);
      } else {
        body = options.body as BodyInit;
      }
    }

    const response = await fetch(`${WORKER_URL}${endpoint}`, {
      ...options,
      headers,
      body,
    });

    // Manejo global de 401 / 403
    if (response.status === 401 || response.status === 403) {
      console.warn('[AuthService] Sesión expirada o inválida. Redirigiendo a login.');
      this.logout();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
      throw new Error('SESSION_EXPIRED');
    }

    return response;
  }

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

  async changeInitialPassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    try {
      // ✅ Usamos authService.fetchWithAuth, que ahora serializa el body correctamente
      const response = await this.fetchWithAuth('/api/auth/change-initial-password', {
        method: 'POST',
        body: { currentPassword, newPassword, confirmPassword },
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };

      if (response.ok) {
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
      if (err.message === 'SESSION_EXPIRED') {
        return { success: false, error: 'La sesión expiró. Por favor, iniciá sesión de nuevo.', code: 'SESSION_EXPIRED' };
      }
      return { success: false, error: err.message || 'Error de red' };
    }
  }

  async updateProfile(name: string, avatar: string): Promise<{ success: boolean; error?: string }> {
    if (!this.state.user) return { success: false, error: 'No hay usuario autenticado' };

    try {
      // ✅ Usamos authService.fetchWithAuth
      const response = await this.fetchWithAuth('/api/auth/me', {
        method: 'PATCH',
        body: { name, avatar },
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
      if (err.message === 'SESSION_EXPIRED') {
        return { success: false, error: 'La sesión expiró.' };
      }
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

  can(_module: string, _action: string): boolean {
    if (!this.state.user) return false;
    if (this.state.user.isSuperAdmin) return true;
    return true;
  }
}

export const authService = new AuthService();
export default authService;