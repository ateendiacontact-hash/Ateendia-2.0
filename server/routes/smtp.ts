// ===========================================
// server/routes/smtp.ts
// Endpoints REST para configurar SMTP por tenant.
//
//   GET    /api/smtp/config       → ver config actual
//   PUT    /api/smtp/config       → guardar/actualizar
//   DELETE /api/smtp/config       → eliminar config
//   POST   /api/smtp/test         → probar conexión
//   POST   /api/smtp/send-test    → enviar email de prueba
//
// Todos requieren permiso email:configure.
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
  getSmtpConfig,
  saveSmtpConfig,
  deleteSmtpConfig,
  testSmtpConnection,
  sendTestEmail,
} from '../services/smtpService.js';

export const smtpRouter = Router();

// ═════════════════════════════════════════════
// Esquemas de validación
// ═════════════════════════════════════════════

const saveSmtpSchema = z.object({
  host: z.string().min(1).max(255),
  port: z.number().int().positive().max(65535),
  protocol: z.enum(['ssl', 'tls', 'smtp']),
  senderEmail: z.string().email(),
  senderName: z.string().min(1).max(255),
  appPassword: z.string().min(1).max(255),
});

const sendTestSchema = z.object({
  to: z.string().email(),
  subject: z.string().max(255).optional(),
  body: z.string().max(10000).optional(),
});

// ═════════════════════════════════════════════
// GET /api/smtp/config — Ver config
// ═════════════════════════════════════════════

smtpRouter.get(
  '/config',
  requireAuth,
  requireTenant,
  requirePermission('email', 'configure'),
  async (req, res, next) => {
    try {
      const config = await getSmtpConfig(req.tenantId!);

      res.json({
        success: true,
        config,   // null si no está configurado
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// PUT /api/smtp/config — Guardar config
// ═════════════════════════════════════════════

smtpRouter.put(
  '/config',
  requireAuth,
  requireTenant,
  requirePermission('email', 'configure'),
  auditLog('UPDATE', 'Configuración'),
  async (req, res, next) => {
    try {
      const parsed = saveSmtpSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const config = await saveSmtpConfig({
        tenantId: req.tenantId!,
        ...parsed.data,
      });

      res.json({
        success: true,
        config,
        auditDetails: `Actualizó configuración SMTP (${config.senderEmail})`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// DELETE /api/smtp/config — Eliminar config
// ═════════════════════════════════════════════

smtpRouter.delete(
  '/config',
  requireAuth,
  requireTenant,
  requirePermission('email', 'configure'),
  auditLog('DELETE', 'Configuración'),
  async (req, res, next) => {
    try {
      const ok = await deleteSmtpConfig(req.tenantId!);

      if (!ok) {
        res.status(404).json({
          success: false,
          error: 'Configuración SMTP no encontrada',
          code: 'SMTP_NOT_CONFIGURED',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Configuración SMTP eliminada',
        auditDetails: 'Eliminó configuración SMTP',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// POST /api/smtp/test — Probar conexión
// ═════════════════════════════════════════════

smtpRouter.post(
  '/test',
  requireAuth,
  requireTenant,
  requirePermission('email', 'configure'),
  async (req, res, next) => {
    try {
      const result = await testSmtpConnection(req.tenantId!);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        success: result.success,
        message: result.message,
        error: result.error,
      });
    } catch (err: any) {
      if (err.message === 'SMTP_NOT_CONFIGURED') {
        res.status(400).json({
          success: false,
          error: 'Debes configurar el SMTP primero',
          code: 'SMTP_NOT_CONFIGURED',
        });
        return;
      }
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// POST /api/smtp/send-test — Enviar email de prueba
// ═════════════════════════════════════════════

smtpRouter.post(
  '/send-test',
  requireAuth,
  requireTenant,
  requirePermission('email', 'configure'),
  auditLog('SEND_MESSAGE', 'Email'),
  async (req, res, next) => {
    try {
      const parsed = sendTestSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await sendTestEmail({
        tenantId: req.tenantId!,
        to: parsed.data.to,
        subject: parsed.data.subject,
        body: parsed.data.body,
      });

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        success: result.success,
        message: result.message,
        messageId: result.messageId,
        error: result.error,
        auditDetails: result.success
          ? `Envió email de prueba a ${parsed.data.to}`
          : undefined,
      });
    } catch (err: any) {
      if (err.message === 'SMTP_NOT_CONFIGURED') {
        res.status(400).json({
          success: false,
          error: 'Debes configurar el SMTP primero',
          code: 'SMTP_NOT_CONFIGURED',
        });
        return;
      }
      next(err);
    }
  }
);