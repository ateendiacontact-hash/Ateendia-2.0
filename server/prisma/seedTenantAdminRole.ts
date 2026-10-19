/**
 * Seed idempotente del rol global `tenant_admin` (tenant_id = NULL).
 *
 * ¿Por qué existe este script?
 * - `rbac.ts` lee permisos SOLO del rol global (tenant_id = NULL).
 * - Si este rol no existe, ningún usuario con role='tenant_admin' puede
 *   pasar `requirePermission()`, y los tenants nuevos no tienen de dónde
 *   heredar sus permisos.
 *
 * Es idempotente: si el rol ya existe, no lo duplica; solo asegura que
 * cada permiso (módulo × acción) esté presente con allowed = true.
 *
 * Uso:
 *   npx tsx server/prisma/seedTenantAdminRole.ts
 */

import 'dotenv/config'; // Regla 20: cargar dotenv manualmente
import { randomUUID } from 'crypto';
import { prisma } from '../db.js';

/** Módulos y acciones que el rol tenant_admin debe poder hacer por defecto. */
const DEFAULT_PERMISSIONS: Array<{ module: string; action: string }> = [
  // clients
  { module: 'clients', action: 'view' },
  { module: 'clients', action: 'create' },
  { module: 'clients', action: 'update' },
  { module: 'clients', action: 'delete' },
  // policies
  { module: 'policies', action: 'view' },
  { module: 'policies', action: 'create' },
  { module: 'policies', action: 'update' },
  { module: 'policies', action: 'delete' },
  // users
  { module: 'users', action: 'view' },
  { module: 'users', action: 'create' },
  { module: 'users', action: 'update' },
  { module: 'users', action: 'delete' },
  // banking
  { module: 'banking', action: 'view' },
  { module: 'banking', action: 'create' },
  { module: 'banking', action: 'update' },
  { module: 'banking', action: 'delete' },
  // whatsapp
  { module: 'whatsapp', action: 'view' },
  { module: 'whatsapp', action: 'send' },
  // pipelines
  { module: 'pipelines', action: 'view' },
  { module: 'pipelines', action: 'create' },
  { module: 'pipelines', action: 'update' },
  { module: 'pipelines', action: 'delete' },
];

async function main() {
  console.log('🔧 Iniciando seed del rol global tenant_admin...');

  // 1. Buscar el rol global (tenant_id = NULL, key = 'tenant_admin')
  let role = await prisma.roles.findFirst({
    where: { tenant_id: null, key: 'tenant_admin' },
  });

  // 2. Si no existe, crearlo
  if (!role) {
    role = await prisma.roles.create({
      data: {
        id: randomUUID(),
        tenant_id: null,
        key: 'tenant_admin',
        name: 'Administrador de Empresa (global)',
        description:
          'Rol plantilla global. Los tenants nuevos heredan sus permisos al crearse.',
        is_system: true,
        is_platform_role: false,
      },
    });
    console.log(`✅ Rol global creado: ${role.id}`);
  } else {
    console.log(`ℹ️  Rol global ya existe: ${role.id}`);
  }

  // 3. Asegurar cada permiso (idempotente)
  let inserted = 0;
  let updated = 0;

  for (const perm of DEFAULT_PERMISSIONS) {
    const existing = await prisma.role_permissions.findUnique({
      where: {
        role_id_module_action: {
          role_id: role.id,
          module: perm.module,
          action: perm.action,
        },
      },
    });

    if (!existing) {
      await prisma.role_permissions.create({
        data: {
          id: randomUUID(),
          role_id: role.id,
          module: perm.module,
          action: perm.action,
          allowed: true,
        },
      });
      inserted++;
    } else if (!existing.allowed) {
      await prisma.role_permissions.update({
        where: { id: existing.id },
        data: { allowed: true },
      });
      updated++;
    }
  }

  console.log(`✅ Permisos insertados: ${inserted}`);
  console.log(`✅ Permisos reactivados: ${updated}`);
  console.log(`✅ Total permisos en el rol: ${DEFAULT_PERMISSIONS.length}`);
}

main()
  .catch((err) => {
    console.error('❌ Error en seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });