// ===========================================
// server/types/auth.ts
// Tipos del dominio de autenticación.
// ===========================================

/**
 * Respuesta exitosa de POST /api/auth/login.
 * Incluye mustResetPassword para que el frontend sepa si debe
 * forzar el cambio de contraseña en el primer login.
 */
export interface LoginResponse {
  success: true;
  token: string;
  user: {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    phone: string | null;
    extension: string | null;
  };
  mustResetPassword: boolean;
}

/**
 * Body esperado por POST /api/auth/change-initial-password.
 */
export interface ChangeInitialPasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Respuesta exitosa de POST /api/auth/change-initial-password.
 */
export interface ChangeInitialPasswordResponse {
  success: true;
  message: string;
}