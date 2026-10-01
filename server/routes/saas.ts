// ===========================================
// server/routes/saas.ts
// Endpoints REST de la plataforma SaaS.
//
// Gestión de planes de suscripción.
// Solo el Super Admin SaaS puede gestionarlos.
//
//   GET    /api/saas/plans          → lista admin (incluye inactivos)
//   GET    /api/saas/plans/public   → lista pública (para landing)
//   POST   /api/saas/plans          → crear (Super Admin)
//   PATCH  /api/saas/plans/:id      → editar (Super Admin)
//   DELETE /api/saas/plans/:id      → archivar (Super Admin)
// ===========================================

import { Router } from 'express';
import { landingRouter } from './saas/landing.js';
import { z } from 'zod';
import {
  requireAuth,
  requireTenant,
  requirePermission,
  auditLog,
} from '../middleware/index.js';
import {
  listPlans,
  getPlanById,
  createPlan,
  updatePlan,
  archivePlan,
} from '../services/saasPlansService.js';

export const saasRouter = Router();

// ═════════════════════════════════════════════
// Esquemas de validación con Zod
// ═════════════════════════════════════════════

const featuresSchema = z.record(z.boolean());

const createPlanSchema = z.object({
  key: z.string().min(2).max(64),
  name: z.string().min(2).max(128),
  description: z.string().max(2000).optional(),
  priceMonthly: z.number().nonnegative(),
  priceQuarterly: z.number().nonnegative().optional(),
  priceAnnual: z.number().nonnegative().optional(),
  currency: z.string().max(8).optional(),
  maxUsers: z.number().int().min(-1),
  maxClients: z.number().int().min(-1),
  maxPolicies: z.number().int().min(-1),
  maxWhatsapp: z.number().int().min(0),
  maxTelegram: z.number().int().min(0),
  storageGb: z.number().int().min(0),
  maxMessagesDay: z.number().int().min(-1),
  maxAiTokens: z.number().int().min(0),
  features: featuresSchema,
  messageRetentionDays: z.number().int().min(-1),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  popular: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const updatePlanSchema = createPlanSchema.partial();

// ═════════════════════════════════════════════
// GET /api/saas/plans/public — Lista pública
// ═════════════════════════════════════════════

/**
 * Endpoint público (sin auth) para la landing page.
 * Devuelve solo planes activos y públicos.
 */
saasRouter.get(
  '/plans/public',
  async (_req, res, next) => {
    try {
      const plans = await listPlans({
        publicOnly: true,
        includeInactive: false,
      });

      res.json({ success: true, plans });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// GET /api/saas/plans — Lista admin
// ═════════════════════════════════════════════

saasRouter.get(
  '/plans',
  requireAuth,
  requireTenant,
  requirePermission('saas', 'manage_plans'),
  async (req, res, next) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';

      const plans = await listPlans({
        includeInactive,
      });

      res.json({ success: true, plans });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// GET /api/saas/plans/:id — Detalle
// ═════════════════════════════════════════════

saasRouter.get(
  '/plans/:id',
  requireAuth,
  requireTenant,
  requirePermission('saas', 'manage_plans'),
  async (req, res, next) => {
    try {
      const plan = await getPlanById(req.params.id);

      if (!plan) {
        res.status(404).json({
          success: false,
          error: 'Plan no encontrado',
          code: 'PLAN_NOT_FOUND',
        });
        return;
      }

      res.json({ success: true, plan });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// POST /api/saas/plans — Crear
// ═════════════════════════════════════════════

saasRouter.post(
  '/plans',
  requireAuth,
  requireTenant,
  requirePermission('saas', 'manage_plans'),
  auditLog('CREATE', 'Configuración'),
  async (req, res, next) => {
    try {
      const parsed = createPlanSchema.safeParse(req.body);

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
        const plan = await createPlan(parsed.data);

        res.status(201).json({
          success: true,
          plan,
          auditDetails: `Creó plan SaaS ${plan.name} ($${plan.priceMonthly}/mes)`,
        });
      } catch (err: any) {
        if (err.message === 'PLAN_KEY_ALREADY_EXISTS') {
          res.status(409).json({
            success: false,
            error: 'La key del plan ya existe',
            code: 'PLAN_KEY_ALREADY_EXISTS',
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
// PATCH /api/saas/plans/:id — Editar
// ═════════════════════════════════════════════

saasRouter.patch(
  '/plans/:id',
  requireAuth,
  requireTenant,
  requirePermission('saas', 'manage_plans'),
  auditLog('UPDATE', 'Configuración'),
  async (req, res, next) => {
    try {
      const parsed = updatePlanSchema.safeParse(req.body);

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
        const plan = await updatePlan({
          id: req.params.id,
          ...parsed.data,
        });

        res.json({
          success: true,
          plan,
          auditDetails: `Actualizó plan SaaS ${plan.name}`,
        });
      } catch (err: any) {
        if (err.message === 'PLAN_NOT_FOUND') {
          res.status(404).json({
            success: false,
            error: 'Plan no encontrado',
            code: 'PLAN_NOT_FOUND',
          });
          return;
        }
        if (err.message === 'PLAN_KEY_ALREADY_EXISTS') {
          res.status(409).json({
            success: false,
            error: 'La key del plan ya existe en otro plan',
            code: 'PLAN_KEY_ALREADY_EXISTS',
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
// DELETE /api/saas/plans/:id — Archivar (soft)
// ═════════════════════════════════════════════

saasRouter.delete(
  '/plans/:id',
  requireAuth,
  requireTenant,
  requirePermission('saas', 'manage_plans'),
  auditLog('DELETE', 'Configuración'),
  async (req, res, next) => {
    try {
      const ok = await archivePlan(req.params.id);

      if (!ok) {
        res.status(404).json({
          success: false,
          error: 'Plan no encontrado',
          code: 'PLAN_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        id: req.params.id,
        message: 'Plan archivado',
        auditDetails: `Archivó plan SaaS ${req.params.id}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────
// Sub-router: Landing config
// Montado en /api/saas/landing
// ─────────────────────────────────────────────
saasRouter.use('/landing', landingRouter);