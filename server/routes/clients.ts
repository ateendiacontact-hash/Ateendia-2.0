// ===========================================
// server/routes/clients.ts
// Endpoints REST del módulo de clientes.
//
//   GET    /api/clients        → listar (paginado + filtros)
//   GET    /api/clients/:id    → detalle
//   POST   /api/clients        → crear (auditado)
//   PATCH  /api/clients/:id    → editar (auditado)
//   DELETE /api/clients/:id    → soft delete (auditado)
//
// Todos los endpoints requieren: auth + tenant + permiso.
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
  listClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from '../services/clientsService.js';

export const clientsRouter = Router();

// ═════════════════════════════════════════════
// Esquemas de validación con Zod
// ═════════════════════════════════════════════

const createClientSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido').max(128),
  lastName: z.string().min(1, 'Apellido requerido').max(128),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(1, 'Teléfono requerido').max(32),
  secondaryPhone: z.string().max(32).optional(),
  birthDate: z.string().optional(),          // "YYYY-MM-DD"
  gender: z.enum(['M', 'F', 'Otro']).optional(),
  idNumber: z.string().max(64).optional(),
  category: z.string().max(64).optional(),
  status: z.string().max(32).optional(),
  leadSource: z.string().max(128).optional(),
  assignedAgentId: z.string().max(64).optional(),
  dealValue: z.number().nonnegative().optional(),
});

const updateClientSchema = createClientSchema.partial();

// ═════════════════════════════════════════════
// GET /api/clients — Listar
// ═════════════════════════════════════════════

clientsRouter.get(
  '/',
  requireAuth,
  requireTenant,
  requirePermission('clients', 'view'),
  async (req, res, next) => {
    try {
      const result = await listClients({
        tenantId: req.tenantId!,
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
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
// GET /api/clients/:id — Detalle
// ═════════════════════════════════════════════

clientsRouter.get(
  '/:id',
  requireAuth,
  requireTenant,
  requirePermission('clients', 'view'),
  async (req, res, next) => {
    try {
      const client = await getClientById(req.tenantId!, req.params.id);

      if (!client) {
        res.status(404).json({
          success: false,
          error: 'Cliente no encontrado',
          code: 'CLIENT_NOT_FOUND',
        });
        return;
      }

      res.json({ success: true, client });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// POST /api/clients — Crear (auditado)
// ═════════════════════════════════════════════

clientsRouter.post(
  '/',
  requireAuth,
  requireTenant,
  requirePermission('clients', 'create'),
  auditLog('CREATE', 'Clientes'),
  async (req, res, next) => {
    try {
      const parsed = createClientSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const client = await createClient({
        tenantId: req.tenantId!,
        ...parsed.data,
        email: parsed.data.email || undefined,   // '' → undefined
      });

      res.status(201).json({
        success: true,
        client,
        auditDetails: `Creó cliente ${client.fullName}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// PATCH /api/clients/:id — Editar (auditado)
// ═════════════════════════════════════════════

clientsRouter.patch(
  '/:id',
  requireAuth,
  requireTenant,
  requirePermission('clients', 'edit'),
  auditLog('UPDATE', 'Clientes'),
  async (req, res, next) => {
    try {
      const parsed = updateClientSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const client = await updateClient({
        tenantId: req.tenantId!,
        clientId: req.params.id,
        ...parsed.data,
      });

      if (!client) {
        res.status(404).json({
          success: false,
          error: 'Cliente no encontrado',
          code: 'CLIENT_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        client,
        auditDetails: `Actualizó cliente ${client.fullName}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════
// DELETE /api/clients/:id — Soft delete (auditado)
// ═════════════════════════════════════════════

clientsRouter.delete(
  '/:id',
  requireAuth,
  requireTenant,
  requirePermission('clients', 'delete'),
  auditLog('DELETE', 'Clientes'),
  async (req, res, next) => {
    try {
      const ok = await deleteClient(req.tenantId!, req.params.id);

      if (!ok) {
        res.status(404).json({
          success: false,
          error: 'Cliente no encontrado',
          code: 'CLIENT_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        id: req.params.id,
        message: 'Cliente marcado como inactivo',
        auditDetails: `Marcó cliente ${req.params.id} como inactivo`,
      });
    } catch (err) {
      next(err);
    }
  }
);