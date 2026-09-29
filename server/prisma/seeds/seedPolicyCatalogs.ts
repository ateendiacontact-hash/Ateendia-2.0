// ===========================================
// server/prisma/seeds/seedPolicyCatalogs.ts
// Puebla las tablas de catálogos:
//   - policy_categories
//   - policy_types
//   - policy_type_schemas
//
// Idempotente: usa upsert para no duplicar datos.
// Se importa desde seed.ts.
// ===========================================

import { PrismaClient } from '@prisma/client';
import { POLICY_CATEGORIES } from './policyCategories.js';
import { POLICY_TYPES } from './policyTypes.js';
import { POLICY_TYPE_SCHEMAS } from './policyTypeSchemas.js';

export async function seedPolicyCatalogs(prisma: PrismaClient): Promise<void> {
  console.log('');
  console.log('📚 Sembrando catálogos de pólizas...');
  console.log('');

  // ─── 1. Categorías ───
  let categoriesCreated = 0;
  for (const cat of POLICY_CATEGORIES) {
    await prisma.policy_categories.upsert({
      where: { id: cat.id },
      update: {
        key: cat.key,
        name: cat.name,
        description: cat.description,
        icon: cat.icon ?? null,
        color: cat.color ?? null,
        sort_order: cat.sortOrder,
      },
      create: {
        id: cat.id,
        key: cat.key,
        name: cat.name,
        description: cat.description,
        icon: cat.icon ?? null,
        color: cat.color ?? null,
        sort_order: cat.sortOrder,
        is_active: true,
      },
    });
    categoriesCreated++;
  }
  console.log(`✅ Categorías: ${categoriesCreated}`);

  // ─── 2. Tipos de póliza ───
  let typesCreated = 0;
  for (const type of POLICY_TYPES) {
    await prisma.policy_types.upsert({
      where: { id: type.id },
      update: {
        category_id: type.categoryId,
        key: type.key,
        name: type.name,
        short_name: type.shortName,
        description: type.description,
        icon: type.icon ?? null,
        sort_order: type.sortOrder,
      },
      create: {
        id: type.id,
        category_id: type.categoryId,
        key: type.key,
        name: type.name,
        short_name: type.shortName,
        description: type.description,
        icon: type.icon ?? null,
        sort_order: type.sortOrder,
        is_active: true,
      },
    });
    typesCreated++;
  }
  console.log(`✅ Tipos de póliza: ${typesCreated}`);

  // ─── 3. Schemas (campos específicos por tipo) ───
  let schemasCreated = 0;
  let schemasDeleted = 0;

  for (const type of POLICY_TYPES) {
    const fields = POLICY_TYPE_SCHEMAS[type.key];
    if (!fields) {
      console.log(`⚠️  Sin schema para tipo: ${type.key}`);
      continue;
    }

    // Borrar todos los schemas de este tipo antes de re-insertar
    // (idempotente + permite modificar campos sin duplicados)
    const deleteResult = await prisma.policy_type_schemas.deleteMany({
      where: { type_id: type.id },
    });
    schemasDeleted += deleteResult.count;

    // Insertar los campos en orden
    let order = 1;
    for (const field of fields) {
      await prisma.policy_type_schemas.create({
        data: {
          id: `schema-${type.key}-${field.key}`,
          type_id: type.id,
          field_key: field.key,
          label: field.label,
          description: field.description ?? null,
          field_type: field.type,
          options_json: field.options ? JSON.stringify({ options: field.options }) : null,
          default_value: field.defaultValue ?? null,
          placeholder: field.placeholder ?? null,
          is_required: field.required ?? false,
          section: field.section ?? null,
          sort_order: order,
          validation_json: field.validation ? JSON.stringify(field.validation) : null,
          is_active: true,
        },
      });
      order++;
      schemasCreated++;
    }
  }

  console.log(`✅ Schemas de campos: ${schemasCreated} (borrados previos: ${schemasDeleted})`);
  console.log('');
  console.log('📚 Catálogos de pólizas completados.');
  console.log('');
}