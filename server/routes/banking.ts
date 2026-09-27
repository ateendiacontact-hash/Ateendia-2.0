// ===========================================
// server/routes/banking.ts
// Endpoints REST del módulo bancario.
//
//   GET    /api/banking                       → lista (paginada)
//   GET    /api/banking/:id                   → detalle (enmascarado)
//   POST   /api/banking                       → crear (auditado)
//   PATCH  /api/banking/:id                   → editar (auditado)
//   POST   /api/banking/set-default           → marcar predeterminado
//   POST   /api/banking/:id/reveal            → datos completos (permiso especial)
//   DELETE /api/banking/:id                   → eliminar (auditado)
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
  listBankAccounts,
  getBankAccountById,
  createBankAccount,
  updateBankAccount,
  setDefaultPaymentMethod,
  revealBankAccount,
  deleteBankAccount,
} from '../services/bankingService.js';

export const bankingRouter = Router();

// ═════════════════════════════════════════════
// Esquemas de validación
// ═════════════════════════════════════════════

const createBankingSchema = z.object({
  clientId: z.string().min(1),
  type: z.enum(['bank_account', 'credit_card']),
  accountHolder: z.string().min(1).max(255),
  holderIdNumber: z.string().max(64).optional(),
  bankName: z.string().min(1).max(255),
  routingNumber: z.string().max(32).optional(),
  accountNumber: z.string().min(4).max(64),
  accountType: z.string().max(64).optional(),
  paymentMethod: z.string().max(64).optional(),
  cardBrand: z.string().max(32).optional(),
  cardHolder: z.string().max(255).optional(),
  cardNumber: z.string().max(64).optional(),
  cardExpDate: z.string().max(8).optional(),
  cardCvv: z.string().max(8).optional(),
  cardType: z.string().max(16).optional(),
  isDefault: z.boolean().optional(),
});

const updateBankingSchema = createBankingSchema.partial().extend({
  verified: z.boolean().optional(),
});

const setDefaultSchema = z.object({
  clientId: z.string().min(1),
  paymentMethodId: z.string().min(1),
});

// ═════════════════════════════════════════════
// GET /api/banking — Lista
// ═════════════════════════════════════════════

bankingRouter.get(
  '/',
  requireAuth,
  requireTenant,
  requirePermission('banking', 'view'),
  async (req, res, next) => {
    try {
      const result = await listBankAccounts({
        tenantId: req.tenantId!,
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 50,
        clientId: typeof req.query.clientId === 'string' ? req.query.clientId : undefined,
        type: req.query.type === 'bank_account' || req.query.type === 'credit_card'
          ? req.query.type
          : undefined,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// GET /api/banking/:id — Detalle (enmascarado)
// ═════════════════════════════════════════════

bankingRouter.get(
  '/:id',
  requireAuth,
  requireTenant,
  requirePermission('banking', 'view'),
  async (req, res, next) => {
    try {
      const account = await getBankAccountById(req.tenantId!, req.params.id);

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Cuenta no encontrada',
          code: 'BANK_ACCOUNT_NOT_FOUND',
        });
        return;
      }

      res.json({ success: true, account });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// POST /api/banking/:id/reveal — Datos completos (permiso especial)
// ═════════════════════════════════════════════

bankingRouter.post(
  '/:id/reveal',
  requireAuth,
  requireTenant,
  requirePermission('banking', 'viewSensitive'),   // ⬅️ Permiso especial
  auditLog('UPDATE', 'Bancos'),                    // ⬅️ Se audita el reveal
  async (req, res, next) => {
    try {
      const account = await revealBankAccount(req.tenantId!, req.params.id);

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Cuenta no encontrada',
          code: 'BANK_ACCOUNT_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        account,
        auditDetails: `Reveló datos sensibles de cuenta ${req.params.id}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// POST /api/banking/set-default
// ═════════════════════════════════════════════

bankingRouter.post(
  '/set-default',
  requireAuth,
  requireTenant,
  requirePermission('banking', 'edit'),
  auditLog('UPDATE', 'Bancos'),
  async (req, res, next) => {
    try {
      const parsed = setDefaultSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const account = await setDefaultPaymentMethod(
        req.tenantId!,
        parsed.data.clientId,
        parsed.data.paymentMethodId
      );

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Cuenta no encontrada',
          code: 'BANK_ACCOUNT_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        account,
        auditDetails: `Marcó cuenta ${parsed.data.paymentMethodId} como predeterminada`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// POST /api/banking — Crear
// ═════════════════════════════════════════════

bankingRouter.post(
  '/',
  requireAuth,
  requireTenant,
  requirePermission('banking', 'edit'),
  auditLog('CREATE', 'Bancos'),
  async (req, res, next) => {
    try {
      const parsed = createBankingSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const account = await createBankAccount({
        tenantId: req.tenantId!,
        ...parsed.data,
      });

      res.status(201).json({
        success: true,
        account,
        auditDetails: `Creó cuenta ${account.bankName} para cliente ${account.clientId}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// PATCH /api/banking/:id — Editar
// ═════════════════════════════════════════════

bankingRouter.patch(
  '/:id',
  requireAuth,
  requireTenant,
  requirePermission('banking', 'edit'),
  auditLog('UPDATE', 'Bancos'),
  async (req, res, next) => {
    try {
      const parsed = updateBankingSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const account = await updateBankAccount({
        tenantId: req.tenantId!,
        id: req.params.id,
        ...parsed.data,
      });

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Cuenta no encontrada',
          code: 'BANK_ACCOUNT_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        account,
        auditDetails: `Actualizó cuenta ${req.params.id}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// DELETE /api/banking/:id — Eliminar (hard delete)
// ═════════════════════════════════════════════

bankingRouter.delete(
  '/:id',
  requireAuth,
  requireTenant,
  requirePermission('banking', 'edit'),
  auditLog('DELETE', 'Bancos'),
  async (req, res, next) => {
    try {
      const ok = await deleteBankAccount(req.tenantId!, req.params.id);

      if (!ok) {
        res.status(404).json({
          success: false,
          error: 'Cuenta no encontrada',
          code: 'BANK_ACCOUNT_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        id: req.params.id,
        message: 'Cuenta eliminada',
        auditDetails: `Eliminó cuenta ${req.params.id}`,
      });
    } catch (err) {
      next(err);
    }
  }
);