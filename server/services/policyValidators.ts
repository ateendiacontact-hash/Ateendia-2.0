// ===========================================
// server/services/policyValidators.ts
// Validación dinámica de campos específicos por tipo de póliza.
//
// Lee policy_type_schemas desde la DB y construye un schema Zod
// en runtime. Si el schema cambia en DB, la validación se adapta.
// ===========================================

import { z, type ZodTypeAny } from 'zod';
import { prisma } from '../db.js';

// ─── Cache de validadores por tipo ───
interface CachedValidator {
  schema: z.ZodObject<any>;
  cachedAt: number;
}

const VALIDATOR_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const validatorsCache = new Map<string, CachedValidator>();

/**
 * Convierte un field_type de la DB a un validador Zod.
 */
function buildZodField(
  fieldType: string,
  isRequired: boolean,
  options: string[] | null
): ZodTypeAny {
  let schema: ZodTypeAny;

  switch (fieldType) {
    case 'text':
      schema = z.string().max(500);
      break;
    case 'textarea':
      schema = z.string().max(5000);
      break;
    case 'number':
      schema = z.coerce.number().int();
      break;
    case 'decimal':
      schema = z.coerce.number();
      break;
    case 'currency':
      schema = z.coerce.number().nonnegative();
      break;
    case 'percentage':
      schema = z.coerce.number().min(0).max(100);
      break;
    case 'date':
      schema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha: YYYY-MM-DD');
      break;
    case 'boolean':
      schema = z.boolean();
      break;
    case 'select':
      if (options && options.length > 0) {
        schema = z.enum(options as [string, ...string[]]);
      } else {
        schema = z.string();
      }
      break;
    case 'multiselect':
      schema = z.array(z.string());
      break;
    case 'email':
      schema = z.string().email();
      break;
    case 'phone':
      schema = z.string().min(5).max(32);
      break;
    case 'ssn':
      schema = z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, 'SSN inválido');
      break;
    case 'vin':
      schema = z.string().length(17, 'VIN debe tener 17 caracteres');
      break;
    case 'plate':
      schema = z.string().min(2).max(16);
      break;
    default:
      schema = z.string();
  }

  if (!isRequired) {
    schema = schema.optional().nullable();
  }

  return schema;
}

/**
 * Construye un validador Zod para un tipo de póliza específico.
 * Lee los schemas desde la DB y los cachea por 5 min.
 */
export async function getValidatorForType(
  typeId: string
): Promise<z.ZodObject<any>> {
  const now = Date.now();
  const cached = validatorsCache.get(typeId);

  if (cached && now - cached.cachedAt < VALIDATOR_CACHE_TTL_MS) {
    return cached.schema;
  }

  const schemas = await prisma.policy_type_schemas.findMany({
    where: { type_id: typeId, is_active: true },
    orderBy: { sort_order: 'asc' },
  });

  const shape: Record<string, ZodTypeAny> = {};

  for (const schema of schemas) {
    let options: string[] | null = null;

    if (schema.options_json) {
      try {
        const parsed = JSON.parse(schema.options_json as string);
        if (Array.isArray(parsed?.options)) {
          options = parsed.options;
        }
      } catch {
        // JSON inválido en DB — ignorar
      }
    }

    shape[schema.field_key] = buildZodField(
      schema.field_type,
      Boolean(schema.is_required),
      options
    );
  }

  const zodSchema = z.object(shape);

  validatorsCache.set(typeId, { schema: zodSchema, cachedAt: now });

  return zodSchema;
}

/**
 * Invalida el cache de un tipo específico.
 * Útil cuando se edita el schema de un tipo desde el panel admin.
 */
export function invalidateValidatorCache(typeId: string): void {
  validatorsCache.delete(typeId);
}

/**
 * Invalida TODO el cache de validadores.
 * Se llama después de re-seed.
 */
export function invalidateAllValidatorCache(): void {
  validatorsCache.clear();
}