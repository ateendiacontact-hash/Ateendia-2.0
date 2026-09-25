// ===========================================
// server/services/auditService.ts
// Escritura de audit logs en MariaDB.
//
// Diseño "fire-and-forget": los errores de escritura se registran
// pero NO se propagan, porque la auditoría no debe bloquear la
// operación de negocio.
// ===========================================

import { prisma } from '../db.js';

// ─── Tipos ───

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'CALL'
  | 'SEND_MESSAGE'
  | 'STATUS_CHANGE';

export type AuditModule =
  | 'Clientes'
  | 'Pólizas'
  | 'Pipeline'
  | 'WhatsApp'
  | 'Email'
  | 'Bancos'
  | 'Telefonía'
  | 'Configuración'
  | 'Usuarios'
  | 'Campañas'
  | 'Integraciones'
  | 'Autenticación';

export interface AuditLogInput {
  tenantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: AuditAction;
  module: AuditModule | string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
}

// ─── Escritura ───

/**
 * Escribe un audit log en MariaDB.
 * "Fire-and-forget": los errores se loguean a consola pero no se propagan.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await prisma.audit_logs.create({
      data: {
        id,
        tenant_id: input.tenantId,
        user_id: input.userId,
        user_name: input.userName,
        user_email: input.userEmail,
        action: input.action,
        module: input.module,
        target_id: input.targetId ?? null,
        details: input.details ?? null,
        ip_address: input.ipAddress ?? null,
      },
    });
  } catch (err) {
    // NO propagar: la auditoría es best-effort
    console.error('⚠️  Error escribiendo audit log:', err);
  }
}

/**
 * Extrae la IP del cliente desde el request.
 * Soporta proxies (X-Forwarded-For) y también conexión directa.
 */
export function extractClientIp(req: {
  headers: Record<string, unknown>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }

  if (typeof req.ip === 'string' && req.ip.length > 0) {
    return req.ip;
  }

  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress;
  }

  return 'unknown';
}