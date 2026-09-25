// ===========================================
// server/env.ts
// Validación de variables de entorno con Zod.
// Si falta alguna variable crítica, el servidor no arranca.
// ===========================================

import 'dotenv/config';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

// En ESM necesitamos calcular __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env.local del directorio server/
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().length(32, 'ENCRYPTION_KEY debe tener 32 caracteres').optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().optional(),
  SMTP_FROM_NAME: z.string().optional(),

  CORS_ORIGINS: z.string().default('http://localhost:3100'),

  EVOLUTION_API_URL: z.string().url().optional(),
  EVOLUTION_API_KEY: z.string().optional(),

  N8N_WEBHOOK_URL: z.string().url().optional(),
  N8N_API_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas o faltantes:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';