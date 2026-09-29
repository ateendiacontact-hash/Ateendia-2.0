// ===========================================
// server/services/usersService.ts
// Lógica de negocio del módulo de usuarios.
//
// Gestión de usuarios DEL TENANT (agencias).
// NO maneja usuarios SaaS (esos van en Fase 3.5).
//
// Características:
//   - Aislamiento multi-tenant estricto
//   - Hash de passwords con bcrypt
//   - Soft delete (status = 'inactive')
//   - Protección del último admin
// ===========================================

import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';

// ─── Tipos ───

export interface ListUsersInput {
  tenantId: string;
  page?: number;
  pageSize?: number;
  role?: string;
  status?: string;
  search?: string;
}

export interface CreateUserInput {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  extension?: string;
  avatar?: string;
  commissionRate?: number;
  assignedPipelineId?: string;
  twoFactorEnabled?: boolean;
}

export interface UpdateUserInput {
  tenantId: string;
  userId: string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  extension?: string;
  avatar?: string;
  commissionRate?: number;
  assignedPipelineId?: string;
  twoFactorEnabled?: boolean;
  status?: string;
}

// ─── Helpers ───

function formatUser(user: any) {
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
    isSuperAdmin: Boolean(user.is_super_admin),
    isPlatformUser: Boolean(user.is_platform_user),
    commissionRate: user.commission_rate ? Number(user.commission_rate) : 0,
    assignedPipelineId: user.assigned_pipeline_id,
    twoFactorEnabled: Boolean(user.two_factor_enabled),
    lastLogin: user.last_login,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    // NOTA: NUNCA devolvemos password_hash
  };
}

// ─── List ───

export async function listUsers(input: ListUsersInput) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: any = {
    tenant_id: input.tenantId,   // ⬅️ AISLAMIENTO
  };

  if (input.role) where.role = input.role;
  if (input.status) where.status = input.status;

  if (input.search && input.search.trim().length > 0) {
    const term = input.search.trim();
    where.OR = [
      { name: { contains: term } },
      { email: { contains: term } },
      { phone: { contains: term } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.users.count({ where }),
    prisma.users.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    data: users.map(formatUser),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─── Get by ID ───

export async function getUserById(tenantId: string, userId: string) {
  const user = await prisma.users.findFirst({
    where: {
      id: userId,
      tenant_id: tenantId,   // ⬅️ AISLAMIENTO
    },
  });

  return user ? formatUser(user) : null;
}

// ─── Create ───

export async function createUser(input: CreateUserInput) {
  const email = input.email.toLowerCase().trim();

  // Verificar que el email no exista
  const existing = await prisma.users.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  // Verificar que el rol exista (global o custom del tenant)
  const role = await prisma.roles.findFirst({
    where: {
      key: input.role,
      OR: [
        { tenant_id: null },              // rol global
        { tenant_id: input.tenantId },    // rol custom del tenant
      ],
    },
  });

  if (!role) {
    throw new Error('INVALID_ROLE');
  }

  // Hash del password
  const password_hash = await bcrypt.hash(input.password, 10);

  const id = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const user = await prisma.users.create({
    data: {
      id,
      tenant_id: input.tenantId,
      name: input.name,
      email,
      password_hash,
      role: input.role,
      phone: input.phone ?? null,
      extension: input.extension ?? null,
      avatar: input.avatar ?? null,
      status: 'active',
      is_super_admin: false,
      is_platform_user: false,
      commission_rate: input.commissionRate ?? 0,
      assigned_pipeline_id: input.assignedPipelineId ?? null,
      two_factor_enabled: input.twoFactorEnabled ?? false,
    },
  });

  return formatUser(user);
}

// ─── Update ───

export async function updateUser(input: UpdateUserInput) {
  const existing = await prisma.users.findFirst({
    where: {
      id: input.userId,
      tenant_id: input.tenantId,
    },
  });

  if (!existing) return null;

  // Si se está cambiando el email, verificar que no esté en uso
  if (input.email && input.email.toLowerCase().trim() !== existing.email) {
    const emailInUse = await prisma.users.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });
    if (emailInUse) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
  }

  // Si se está cambiando el rol, verificar que exista
  if (input.role && input.role !== existing.role) {
    const role = await prisma.roles.findFirst({
      where: {
        key: input.role,
        OR: [
          { tenant_id: null },
          { tenant_id: input.tenantId },
        ],
      },
    });
    if (!role) {
      throw new Error('INVALID_ROLE');
    }
  }

  const data: any = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.email !== undefined) data.email = input.email.toLowerCase().trim();
  if (input.role !== undefined) data.role = input.role;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.extension !== undefined) data.extension = input.extension;
  if (input.avatar !== undefined) data.avatar = input.avatar;
  if (input.commissionRate !== undefined) data.commission_rate = input.commissionRate;
  if (input.assignedPipelineId !== undefined) data.assigned_pipeline_id = input.assignedPipelineId;
  if (input.twoFactorEnabled !== undefined) data.two_factor_enabled = input.twoFactorEnabled;
  if (input.status !== undefined) data.status = input.status;

  const updated = await prisma.users.update({
    where: { id: input.userId },
    data,
  });

  return formatUser(updated);
}

// ─── Delete (soft) ───

export async function deleteUser(
  tenantId: string,
  userId: string,
  requestingUserId: string
): Promise<boolean> {
  // No permitir auto-desactivación
  if (userId === requestingUserId) {
    throw new Error('CANNOT_DELETE_SELF');
  }

  const existing = await prisma.users.findFirst({
    where: {
      id: userId,
      tenant_id: tenantId,
    },
  });

  if (!existing) return false;

  // Proteger al último admin activo
  if (existing.role === 'admin' && existing.status === 'active') {
    const activeAdmins = await prisma.users.count({
      where: {
        tenant_id: tenantId,
        role: 'admin',
        status: 'active',
      },
    });

    if (activeAdmins <= 1) {
      throw new Error('CANNOT_DELETE_LAST_ADMIN');
    }
  }

  await prisma.users.update({
    where: { id: userId },
    data: { status: 'inactive' },
  });

  return true;
}

// ─── Reactivate ───

export async function reactivateUser(tenantId: string, userId: string) {
  const existing = await prisma.users.findFirst({
    where: {
      id: userId,
      tenant_id: tenantId,
    },
  });

  if (!existing) return null;

  const updated = await prisma.users.update({
    where: { id: userId },
    data: { status: 'active' },
  });

  return formatUser(updated);
}

// ─── Change Role ───

export async function changeUserRole(
  tenantId: string,
  userId: string,
  newRole: string,
  requestingUserId: string
) {
  // No permitir auto-cambio de rol
  if (userId === requestingUserId) {
    throw new Error('CANNOT_CHANGE_OWN_ROLE');
  }

  const existing = await prisma.users.findFirst({
    where: {
      id: userId,
      tenant_id: tenantId,
    },
  });

  if (!existing) return null;

  // Verificar que el nuevo rol exista
  const role = await prisma.roles.findFirst({
    where: {
      key: newRole,
      OR: [
        { tenant_id: null },
        { tenant_id: tenantId },
      ],
    },
  });

  if (!role) {
    throw new Error('INVALID_ROLE');
  }

  // Proteger al último admin
  if (existing.role === 'admin' && newRole !== 'admin') {
    const activeAdmins = await prisma.users.count({
      where: {
        tenant_id: tenantId,
        role: 'admin',
        status: 'active',
      },
    });

    if (activeAdmins <= 1) {
      throw new Error('CANNOT_DEMOTE_LAST_ADMIN');
    }
  }

  const updated = await prisma.users.update({
    where: { id: userId },
    data: { role: newRole },
  });

  return formatUser(updated);
}

// ─── Reset Password ───

export async function resetUserPassword(
  tenantId: string,
  userId: string,
  newPassword: string
) {
  const existing = await prisma.users.findFirst({
    where: {
      id: userId,
      tenant_id: tenantId,
    },
  });

  if (!existing) return null;

  const password_hash = await bcrypt.hash(newPassword, 10);

  await prisma.users.update({
    where: { id: userId },
    data: { password_hash },
  });

  return true;
}