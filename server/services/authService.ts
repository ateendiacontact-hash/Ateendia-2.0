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
  };
}

/**
 * Hash de un password plano.
 * Usado en seed y en registro de nuevos usuarios.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}