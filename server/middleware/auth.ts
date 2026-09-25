// ===========================================
// server/middleware/auth.ts
// Middleware de autenticación JWT.
//
// Uso:
//   router.get('/me', requireAuth, handler);              // Ruta protegida
//   router.get('/landing', attachAuthIfPresent, handler); // Ruta pública con contexto
// ===========================================

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env, type JwtPayload } from '../env.js';

// ─── Helpers ───

/**
 * Extrae el token del header Authorization.
 * Formato esperado: "Bearer eyJhbGci..."
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * Verifica y decodifica el JWT. Devuelve el payload o null si es inválido.
 * Captura todos los errores de jwt.verify (expirado, firma inválida, etc.)
 */
function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded !== 'object' || decoded === null) {
      return null;
    }
    const payload = decoded as jwt.JwtPayload & Partial<JwtPayload>;

    if (!payload.userId || !payload.tenantId || !payload.role) {
      return null;
    }

    return {
      userId: String(payload.userId),
      tenantId: String(payload.tenantId),
      role: String(payload.role),
      email: payload.email ? String(payload.email) : undefined,
      name: payload.name ? String(payload.name) : undefined,
    };
  } catch {
    return null;
  }
}

// ─── Middlewares ───

/**
 * Requiere un JWT válido. Si no lo hay, responde 401.
 * Si lo hay, adjunta el usuario al request como `req.user`.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Token de autenticación requerido',
      code: 'AUTH_TOKEN_MISSING',
    });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Token inválido o expirado',
      code: 'AUTH_TOKEN_INVALID',
    });
    return;
  }

  req.user = {
    userId: payload.userId,
    tenantId: payload.tenantId,
    role: payload.role,
    email: payload.email,
    name: payload.name,
  };

  next();
}

/**
 * Adjunta el usuario si hay token válido, pero NO rechaza si no lo hay.
 * Útil para rutas públicas que quieren saber si hay usuario logueado.
 */
export function attachAuthIfPresent(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = {
        userId: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
        email: payload.email,
        name: payload.name,
      };
    }
  }

  next();
}