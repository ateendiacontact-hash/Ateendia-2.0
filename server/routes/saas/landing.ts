// ===========================================
// server/routes/saas/landing.ts
// Endpoints para la configuración de la landing page SaaS.
//
//   GET /api/saas/landing   → público (sin auth)
//   PUT /api/saas/landing   → solo Super Admin SaaS
// ===========================================

import { Router } from 'express';
import {
  requireAuth,
  auditLog,
} from '../../middleware/index.js';
import {
  getLandingConfig,
  updateLandingConfig,
} from '../../services/saasLandingService.js';

export const landingRouter = Router();

// ─────────────────────────────────────────────
// GET /api/saas/landing (PÚBLICO)
// ─────────────────────────────────────────────
landingRouter.get('/', async (_req, res, next) => {
  try {
    const config = await getLandingConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// PUT /api/saas/landing (PROTEGIDO — Super Admin)
// ─────────────────────────────────────────────
landingRouter.put(
  '/',
  requireAuth,
  (req, res, next) => {
    if (!req.user || req.user.role !== 'saas_super_admin') {
      res.status(403).json({
        success: false,
        error: 'Solo el Super Admin SaaS puede modificar la landing',
        code: 'PLATFORM_USER_REQUIRED',
      });
      return;
    }
    next();
  },
  auditLog('UPDATE', 'saas_landing'),
  async (req, res, next) => {
    try {
      const updated = await updateLandingConfig(req.body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);