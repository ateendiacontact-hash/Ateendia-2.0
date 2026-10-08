// ===========================================
// server/services/authService.ts
// Lógica de autenticación: hash de passwords, verificación, generación JWT.
// ===========================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { env, type JwtPayload } from '../env.js';

// ─── Tipos ───

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
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

// ─── Funciones ───

/**
 * Verifica credenciales y devuelve un JWT firmado.
 * Lanza error si las credenciales son inválidas o el usuario está inactivo.
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const email = input.email.toLowerCase().trim();

  // 1. Buscar usuario por email
  const user = await prisma.users.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // 2. Verificar que esté activo
  if (user.status !== 'active') {
    throw new Error('USER_INACTIVE');
  }

  // 3. Comparar password con bcrypt
  const passwordOk = await bcrypt.compare(input.password, user.password_hash);
  if (!passwordOk) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // 4. Actualizar last_login (best-effort, no bloquea si falla)
  try {
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });
  } catch {
    // No crítico; no lanzamos.
  }

  // 5. Firmar JWT
  const payload: JwtPayload = {
    userId: user.id,
    tenantId: user.tenant_id,
    role: user.role,
    email: user.email,
    name: user.name,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  // 6. Devolver token + user + mustResetPassword
  return {
    token,
    user: {
      id: user.id,
      tenantId: user.tenant_id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      extension: user.extension,
    },
    mustResetPassword: user.must_reset_password,
  };
}

/**
 * Devuelve el usuario actual a partir del userId.
 * Usado por GET /api/auth/me.
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return {
    id: user.id,
    tenantId: user.tenant_id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    extension: user.extension,
    status: user.status,
    twoFactorEnabled: user.two_factor_enabled,
    lastLogin: user.last_login,
    createdAt: user.created_at,
    mustResetPassword: user.must_reset_password,
  };
}

/**
 * Hash de un password plano.
 * Usado en seed y en registro de nuevos usuarios.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/**
 * Cambia la contraseña de un usuario que tiene must_reset_password = true.
 * Requiere que el usuario ya esté autenticado (JWT válido).
 *
 * @throws Error('USER_NOT_FOUND') si el userId no existe
 * @throws Error('PASSWORD_ALREADY_SET') si must_reset_password ya es false
 * @throws Error('INVALID_CURRENT_PASSWORD') si la contraseña actual no coincide
 */
export async function changeInitialPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // 1. Buscar usuario
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // 2. Validar que deba cambiar la contraseña
  if (!user.must_reset_password) {
    throw new Error('PASSWORD_ALREADY_SET');
  }

  // 3. Verificar contraseña actual
  const passwordOk = await bcrypt.compare(currentPassword, user.password_hash);
  if (!passwordOk) {
    throw new Error('INVALID_CURRENT_PASSWORD');
  }

  // 4. Hashear nueva contraseña y actualizar
  const newHash = await bcrypt.hash(newPassword, 10);

  await prisma.users.update({
    where: { id: user.id },
    data: {
      password_hash: newHash,
      must_reset_password: false,
    },
  });
}