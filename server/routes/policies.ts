// ===========================================
// server/routes/policies.ts
// Endpoints REST del módulo de pólizas.
//
//   GET    /api/policies                      → listar
//   GET    /api/policies/:id                  → detalle
//   GET    /api/policies/:id/versions         → historial
//   POST   /api/policies                      → crear (auditado)
//   PATCH  /api/policies/:id                  → editar (auditado)
//   DELETE /api/policies/:id                  → cancelar (auditado)
//   POST   /api/policies/:id/members          → agregar miembro
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
  listPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  addPolicyMember,
  getPolicyVersions,
} from '../services/policiesService.js';

export const policiesRouter = Router();

// ═════════════════════════════════════════════
// Esquemas de validación con Zod
// ═════════════════════════════════════════════

const memberSchema = z.object({
  firstName: z.string().min(1).max(128),
  lastName: z.string().min(1).max(128),
  relationship: z.string().min(1).max(64),
  birthDate: z.string().optional(),
  gender: z.string().max(16).optional(),
  idNumber: z.string().max(64).optional(),
  tobaccoUser: z.boolean().optional(),
  status: z.string().max(32).optional(),
});

const createPolicySchema = z.object({
  clientId: z.string().min(1),
  typeId: z.string().min(1),
  carrier: z.string().min(1).max(128),
  planName: z.string().min(1).max(255),
  policyNumber: z.string().min(1).max(64),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  monthlyPremium: z.number().nonnegative(),
  subsidyAptc: z.number().nonnegative().optional(),
  clientPortion: z.number().nonnegative(),
  paymentDueDay: z.number().int().min(1).max(31).optional(),
  status: z.string().max(32).optional(),
  agentId: z.string().max(64).optional(),
  notes: z.string().max(2000).optional(),
  customFields: z.record(z.any()).optional(),
  members: z.array(memberSchema).optional(),
});

const updatePolicySchema = createPolicySchema.partial().extend({
  reason: z.string().max(255).optional(),
});

// ═════════════════════════════════════════════
// GET /api/policies — Listar
// ═════════════════════════════════════════════

policiesRouter.get(
  '/',
  requireAuth,
  requireTenant,
  requirePermission('policies', 'view'),
  async (req, res, next) => {
    try {
      const result = await listPolicies({
        tenantId: req.tenantId!,
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
        clientId: typeof req.query.clientId === 'string' ? req.query.clientId : undefined,
        typeId: typeof req.query.typeId === 'string' ? req.query.typeId : undefined,
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
// GET /api/policies/:id — Detalle
// ═════════════════════════════════════════════

policiesRouter.get(
  '/:id',
  requireAuth,
  requireTenant,
  requirePermission('policies', 'view'),
  async (req, res, next) => {
    try {
      const policy = await getPolicyById(req.tenantId!, req.params.id);

      if (!policy) {
        res.status(404).json({
          success: false,
          error: 'Póliza no encontrada',
          code: 'POLICY_NOT_FOUND',
        });
        return;
      }

      res.json({ success: true, policy });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// GET /api/policies/:id/versions — Historial
// ═════════════════════════════════════════════

policiesRouter.get(
  '/:id/versions',
  requireAuth,
  requireTenant,
  requirePermission('policies', 'view'),
  async (req, res, next) => {
    try {
      const versions = await getPolicyVersions(req.tenantId!, req.params.id);

      if (!versions) {
        res.status(404).json({
          success: false,
          error: 'Póliza no encontrada',
          code: 'POLICY_NOT_FOUND',
        });
        return;
      }

      res.json({ success: true, versions });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// POST /api/policies — Crear
// ═════════════════════════════════════════════

policiesRouter.post(
  '/',
  requireAuth,
  requireTenant,
  requirePermission('policies', 'create'),
  auditLog('CREATE', 'Pólizas'),
  async (req, res, next) => {
    try {
      const parsed = createPolicySchema.safeParse(req.body);

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
        const policy = await createPolicy({
          tenantId: req.tenantId!,
          ...parsed.data,
          createdBy: req.user!.userId,
        });

        res.status(201).json({
          success: true,
          policy,
          auditDetails: `Creó póliza ${policy.policyNumber} (${policy.type})`,
        });
      } catch (err: any) {
        // Manejar errores específicos del servicio
        if (err.message === 'POLICY_TYPE_NOT_FOUND') {
          res.status(400).json({
            success: false,
            error: 'Tipo de póliza no válido',
            code: 'POLICY_TYPE_NOT_FOUND',
          });
          return;
        }
        if (err.message === 'CUSTOM_FIELDS_INVALID') {
          res.status(400).json({
            success: false,
            error: 'Campos específicos del tipo inválidos',
            code: 'CUSTOM_FIELDS_INVALID',
            details: err.details,
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
// PATCH /api/policies/:id — Editar
// ═════════════════════════════════════════════

policiesRouter.patch(
  '/:id',
  requireAuth,
  requireTenant,
  requirePermission('policies', 'edit'),
  auditLog('UPDATE', 'Pólizas'),
  async (req, res, next) => {
    try {
      const parsed = updatePolicySchema.safeParse(req.body);

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
        const { reason, ...fields } = parsed.data;
        const policy = await updatePolicy({
          tenantId: req.tenantId!,
          policyId: req.params.id,
          changedBy: req.user!.userId,
          changeReason: reason,
          ...fields,
        });

        if (!policy) {
          res.status(404).json({
            success: false,
            error: 'Póliza no encontrada',
            code: 'POLICY_NOT_FOUND',
          });
          return;
        }

        res.json({
          success: true,
          policy,
          auditDetails: `Actualizó póliza ${policy.policyNumber}`,
        });
      } catch (err: any) {
        if (err.message === 'CUSTOM_FIELDS_INVALID') {
          res.status(400).json({
            success: false,
            error: 'Campos específicos del tipo inválidos',
            code: 'CUSTOM_FIELDS_INVALID',
            details: err.details,
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
// DELETE /api/policies/:id — Cancelar (soft)
// ═════════════════════════════════════════════

policiesRouter.delete(
  '/:id',
  requireAuth,
  requireTenant,
  requirePermission('policies', 'delete'),
  auditLog('DELETE', 'Pólizas'),
  async (req, res, next) => {
    try {
      const ok = await deletePolicy(req.tenantId!, req.params.id);

      if (!ok) {
        res.status(404).json({
          success: false,
          error: 'Póliza no encontrada',
          code: 'POLICY_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        id: req.params.id,
        message: 'Póliza marcada como cancelada',
        auditDetails: `Canceló póliza ${req.params.id}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// POST /api/policies/:id/members — Agregar miembro
// ═════════════════════════════════════════════

policiesRouter.post(
  '/:id/members',
  requireAuth,
  requireTenant,
  requirePermission('policies', 'edit'),
  auditLog('UPDATE', 'Pólizas'),
  async (req, res, next) => {
    try {
      const parsed = memberSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const member = await addPolicyMember(
        req.tenantId!,
        req.params.id,
        parsed.data
      );

      if (!member) {
        res.status(404).json({
          success: false,
          error: 'Póliza no encontrada',
          code: 'POLICY_NOT_FOUND',
        });
        return;
      }

      res.status(201).json({
        success: true,
        member,
        auditDetails: `Agregó miembro ${member.firstName} ${member.lastName} a póliza ${req.params.id}`,
      });
    } catch (err) {
      next(err);
    }
  }
);