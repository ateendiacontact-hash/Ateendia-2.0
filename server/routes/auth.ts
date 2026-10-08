// ===========================================
// server/routes/auth.ts
// Endpoints de autenticación.
//   POST /api/auth/login                     → login con email + password
//   GET  /api/auth/me                        → datos del usuario actual (protegido)
//   POST /api/auth/logout                    → no-op en JWT stateless
//   GET  /api/auth/permissions               → matriz de permisos del rol
//   POST /api/auth/change-initial-password   → primer cambio obligatorio
// ===========================================

import { Router } from 'express';
import { z } from 'zod';
import { login, getCurrentUser, changeInitialPassword } from '../services/authService.js';
import { requireAuth, requireTenant, getPermissionsForRole, auditLog } from '../middleware/index.js';

export const authRouter = Router();

// ─── Validación de body con Zod ───

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password requerido'),
});

// Regex de contraseña: mínimo 6 caracteres, al menos 1 mayúscula,
// 1 minúscula, 1 número y 1 carácter especial.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

const changeInitialPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z
      .string()
      .min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
      .regex(
        PASSWORD_REGEX,
        'La nueva contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial'
      ),
    confirmPassword: z.string().min(1, 'Confirmación requerida'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// ─── POST /api/auth/login ───

authRouter.post('/login', async (req, res, next) => {
  try {
    // 1. Validar body
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    // 2. Intentar login
    const result = await login(parsed.data);

    // 3. Responder (incluye mustResetPassword para forzar cambio si aplica)
    res.json({
      success: true,
      token: result.token,
      user: result.user,
      mustResetPassword: result.mustResetPassword,
    });
  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({
        success: false,
        error: 'Email o contraseña incorrectos',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    if (err.message === 'USER_INACTIVE') {
      res.status(403).json({
        success: false,
        error: 'La cuenta está inactiva',
        code: 'USER_INACTIVE',
      });
      return;
    }

    next(err);
  }
});

// ─── GET /api/auth/me ───

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const user = await getCurrentUser(userId);

    res.json({
      success: true,
      user,
    });
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND',
      });
      return;
    }
    next(err);
  }
});

// ─── POST /api/auth/logout ───
// En JWT stateless el logout es responsabilidad del cliente (borrar el token).
// Este endpoint existe para que el frontend pueda llamar siempre al mismo URL.

authRouter.post('/logout', (_req, res) => {
  res.json({
    success: true,
    message: 'Sesión cerrada. Elimina el token del cliente.',
  });
});

// ─── GET /api/auth/permissions ───
// Devuelve la matriz de permisos del usuario autenticado.
// Útil para que el frontend sepa qué mostrar/ocultar según el rol.

authRouter.get(
  '/permissions',
  requireAuth,
  requireTenant,
  async (req, res, next) => {
    try {
      const roleKey = req.user!.role;
      const permissions = await getPermissionsForRole(roleKey);

      res.json({
        success: true,
        role: roleKey,
        tenantId: req.tenantId,
        permissions,
        count: permissions.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/auth/change-initial-password ───
// Cambia la contraseña de un usuario que tiene must_reset_password = true.
// Requiere JWT válido. NO invalida la sesión actual.

authRouter.post(
  '/change-initial-password',
  requireAuth,
  auditLog('UPDATE_PASSWORD', 'Autenticación'),
  async (req, res, next) => {
    try {
      // 1. Validar body
      const parsed = changeInitialPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      // 2. Ejecutar cambio
      const userId = req.user!.userId;
      await changeInitialPassword(
        userId,
        parsed.data.currentPassword,
        parsed.data.newPassword
      );

      // 3. Responder
      res.json({
        success: true,
        message: 'Contraseña actualizada correctamente',
      });
    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      if (err.message === 'PASSWORD_ALREADY_SET') {
        res.status(400).json({
          success: false,
          error: 'La contraseña ya fue cambiada previamente',
          code: 'PASSWORD_ALREADY_SET',
        });
        return;
      }

      if (err.message === 'INVALID_CURRENT_PASSWORD') {
        res.status(401).json({
          success: false,
          error: 'La contraseña actual es incorrecta',
          code: 'INVALID_CURRENT_PASSWORD',
        });
        return;
      }

      next(err);
    }
  }
);