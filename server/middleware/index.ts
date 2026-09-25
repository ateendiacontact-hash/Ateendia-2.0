// ===========================================
// server/middleware/index.ts
// Barrel export para simplificar imports.
// ===========================================

export { requireAuth, attachAuthIfPresent } from './auth.js';
export { requireTenant, invalidateTenantCache } from './tenant.js';
export {
  requirePermission,
  getPermissionsForRole,
  invalidatePermissionsCache,
  invalidateAllPermissionsCache,
} from './rbac.js';