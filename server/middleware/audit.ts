// ===========================================
// server/middleware/audit.ts
// Middleware factory para auditar operaciones de negocio.
//
// Uso:
//   router.post('/clients',
//     requireAuth,
//     requireTenant,
//     requirePermission('clients', 'create'),
//     auditLog('CREATE', 'Clientes'),
//     createClientHandler
//   );
//
// Características:
//   - Fire-and-forget: no bloquea la respuesta al cliente.
//   - Solo registra si el status fue 2xx (éxito).
//   - Captura: userId, tenantId, IP, user-agent, timestamp.
//   - Guarda targetId automáticamente si el handler devuelve { id }.
// ===========================================

import type { Request, Response, NextFunction } from 'express';
import {
  writeAuditLog,
  extractClientIp,
  type AuditAction,
  type AuditModule,
} from '../services/auditService.js';

export function auditLog(action: AuditAction, module: AuditModule | string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Guardar referencia al método original res.json
    const originalJson = res.json.bind(res);

    // Guardar metadata del request ANTES de ejecutar el handler
    const auditContext = {
      tenantId: req.user?.tenantId ?? req.tenantId ?? 'unknown',
      userId: req.user?.userId ?? 'anonymous',
      userName: req.user?.name ?? 'Desconocido',
      userEmail: req.user?.email ?? 'unknown@unknown',
      ipAddress: extractClientIp(req as any),
    };

    // Interceptar res.json para capturar el body de respuesta
    res.json = function (body: any) {
      const statusCode = res.statusCode;

      // Solo auditar si la operación fue exitosa (2xx)
      if (statusCode >= 200 && statusCode < 300) {
        // Intentar extraer targetId del body de respuesta
        const targetId =
          body?.id ||
          body?.data?.id ||
          body?.client?.id ||
          undefined;

        // Extraer details opcional del body (si el handler lo proveyó)
        const details =
          body?.auditDetails ||
          body?.message ||
          undefined;

        // Fire-and-forget: no esperamos la escritura
        writeAuditLog({
          ...auditContext,
          action,
          module,
          targetId,
          details,
        });
      }

      // Continuar con la respuesta normal
      return originalJson(body);
    };

    next();
  };
}