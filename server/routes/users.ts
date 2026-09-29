// ===========================================
// server/routes/users.ts
// Endpoints REST del módulo de usuarios.
//
//   GET    /api/users                      → listar
//   GET    /api/users/:id                  → detalle
//   POST   /api/users                      → crear (auditado)
//   PATCH  /api/users/:id                  → editar (auditado)
//   DELETE /api/users/:id                  → desactivar (auditado)
//   PATCH  /api/users/:id/role             → cambiar rol
//   PATCH  /api/users/:id/activate         → reactivar
//   POST   /api/users/:id/reset-password   → resetear password
// ===========================================

import { Router } from 'express';
import { z } from 'zod';
import {
  requireAuth,
  requireTenant,
  requirePermission,
  auditLog,
} from '../middleware/index.js';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  reactivateUser,
  changeUserRole,
  resetUserPassword,
} from '../services/usersService.js';

export const usersRouter = Router();

// ═════════════════════════════════════════════
// Esquemas de validación con Zod
// ═════════════════════════════════════════════

const createUserSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.string().min(1).max(32),
  phone: z.string().max(32).optional(),
  extension: z.string().max(16).optional(),
  avatar: z.string().max(2000).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  assignedPipelineId: z.string().max(64).optional(),
  twoFactorEnabled: z.boolean().optional(),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  status: z.enum(['active', 'inactive']).optional(),
});

const changeRoleSchema = z.object({
  role: z.string().min(1).max(32),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(128),
});

// ═════════════════════════════════════════════
// GET /api/users — Listar
// ═════════════════════════════════════════════

usersRouter.get(
  '/',
  requireAuth,
  requireTenant,
  requirePermission('users', 'view'),
  async (req, res, next) => {
    try {
      const result = await listUsers({
        tenantId: req.tenantId!,
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
        role: typeof req.query.role === 'string' ? req.query.role : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// GET /api/users/:id — Detalle
// ═════════════════════════════════════════════

usersRouter.get(
  '/:id',
  requireAuth,
  requireTenant,
  requirePermission('users', 'view'),
  async (req, res, next) => {
    try {
      const user = await getUserById(req.tenantId!, req.params.id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// POST /api/users — Crear
// ═════════════════════════════════════════════

usersRouter.post(
  '/',
  requireAuth,
  requireTenant,
  requirePermission('users', 'invite'),
  auditLog('CREATE', 'Usuarios'),
  async (req, res, next) => {
    try {
      const parsed = createUserSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      try {
        const user = await createUser({
          tenantId: req.tenantId!,
          ...parsed.data,
        });

        res.status(201).json({
          success: true,
          user,
          auditDetails: `Creó usuario ${user.name} (${user.role})`,
        });
      } catch (err: any) {
        if (err.message === 'EMAIL_ALREADY_EXISTS') {
          res.status(409).json({
            success: false,
            error: 'El email ya está registrado',
            code: 'EMAIL_ALREADY_EXISTS',
          });
          return;
        }
        if (err.message === 'INVALID_ROLE') {
          res.status(400).json({
            success: false,
            error: 'Rol no válido',
            code: 'INVALID_ROLE',
          });
          return;
        }
        throw err;
      }
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// PATCH /api/users/:id — Editar
// ═════════════════════════════════════════════

usersRouter.patch(
  '/:id',
  requireAuth,
  requireTenant,
  requirePermission('users', 'editRoles'),
  auditLog('UPDATE', 'Usuarios'),
  async (req, res, next) => {
    try {
      const parsed = updateUserSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      try {
        const user = await updateUser({
          tenantId: req.tenantId!,
          userId: req.params.id,
          ...parsed.data,
        });

        if (!user) {
          res.status(404).json({
            success: false,
            error: 'Usuario no encontrado',
            code: 'USER_NOT_FOUND',
          });
          return;
        }

        res.json({
          success: true,
          user,
          auditDetails: `Actualizó usuario ${user.name}`,
        });
      } catch (err: any) {
        if (err.message === 'EMAIL_ALREADY_EXISTS') {
          res.status(409).json({
            success: false,
            error: 'El email ya está registrado',
            code: 'EMAIL_ALREADY_EXISTS',
          });
          return;
        }
        if (err.message === 'INVALID_ROLE') {
          res.status(400).json({
            success: false,
            error: 'Rol no válido',
            code: 'INVALID_ROLE',
          });
          return;
        }
        throw err;
      }
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// DELETE /api/users/:id — Desactivar
// ═════════════════════════════════════════════

usersRouter.delete(
  '/:id',
  requireAuth,
  requireTenant,
  requirePermission('users', 'editRoles'),
  auditLog('DELETE', 'Usuarios'),
  async (req, res, next) => {
    try {
      const requestingUserId = req.user!.userId;
      const ok = await deleteUser(req.tenantId!, req.params.id, requestingUserId);

      if (!ok) {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        id: req.params.id,
        message: 'Usuario desactivado',
        auditDetails: `Desactivó usuario ${req.params.id}`,
      });
    } catch (err: any) {
      if (err.message === 'CANNOT_DELETE_SELF') {
        res.status(400).json({
          success: false,
          error: 'No puedes desactivar tu propio usuario',
          code: 'CANNOT_DELETE_SELF',
        });
        return;
      }
      if (err.message === 'CANNOT_DELETE_LAST_ADMIN') {
        res.status(400).json({
          success: false,
          error: 'No puedes desactivar el último administrador activo',
          code: 'CANNOT_DELETE_LAST_ADMIN',
        });
        return;
      }
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// PATCH /api/users/:id/activate — Reactivar
// ═════════════════════════════════════════════

usersRouter.patch(
  '/:id/activate',
  requireAuth,
  requireTenant,
  requirePermission('users', 'editRoles'),
  auditLog('UPDATE', 'Usuarios'),
  async (req, res, next) => {
    try {
      const user = await reactivateUser(req.tenantId!, req.params.id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        user,
        auditDetails: `Reactivó usuario ${user.name}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// PATCH /api/users/:id/role — Cambiar rol
// ═════════════════════════════════════════════

usersRouter.patch(
  '/:id/role',
  requireAuth,
  requireTenant,
  requirePermission('users', 'editRoles'),
  auditLog('STATUS_CHANGE', 'Usuarios'),
  async (req, res, next) => {
    try {
      const parsed = changeRoleSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      try {
        const user = await changeUserRole(
          req.tenantId!,
          req.params.id,
          parsed.data.role,
          req.user!.userId
        );

        if (!user) {
          res.status(404).json({
            success: false,
            error: 'Usuario no encontrado',
            code: 'USER_NOT_FOUND',
          });
          return;
        }

        res.json({
          success: true,
          user,
          auditDetails: `Cambió rol de ${user.name} a ${user.role}`,
        });
      } catch (err: any) {
        if (err.message === 'CANNOT_CHANGE_OWN_ROLE') {
          res.status(400).json({
            success: false,
            error: 'No puedes cambiar tu propio rol',
            code: 'CANNOT_CHANGE_OWN_ROLE',
          });
          return;
        }
        if (err.message === 'INVALID_ROLE') {
          res.status(400).json({
            success: false,
            error: 'Rol no válido',
            code: 'INVALID_ROLE',
          });
          return;
        }
        if (err.message === 'CANNOT_DEMOTE_LAST_ADMIN') {
          res.status(400).json({
            success: false,
            error: 'No puedes degradar al último administrador activo',
            code: 'CANNOT_DEMOTE_LAST_ADMIN',
          });
          return;
        }
        throw err;
      }
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// POST /api/users/:id/reset-password — Resetear password
// ═════════════════════════════════════════════

usersRouter.post(
  '/:id/reset-password',
  requireAuth,
  requireTenant,
  requirePermission('users', 'editRoles'),
  auditLog('UPDATE', 'Usuarios'),
  async (req, res, next) => {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const ok = await resetUserPassword(
        req.tenantId!,
        req.params.id,
        parsed.data.newPassword
      );

      if (!ok) {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Contraseña actualizada correctamente',
        auditDetails: `Reseteó contraseña de usuario ${req.params.id}`,
      });
    } catch (err) {
      next(err);
    }
  }
);