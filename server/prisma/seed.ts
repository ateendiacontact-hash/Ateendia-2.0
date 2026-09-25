// ===========================================
// server/prisma/seed.ts
// Datos iniciales: 1 tenant demo + 1 usuario admin + 1 pipeline.
// Uso: npm run db:seed  (o: npx tsx server/prisma/seed.ts)
// Credenciales: admin@ateendia.cloud / Admin123!
// ===========================================

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar .env.local de server/ ANTES de importar Prisma
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_TENANT_ID = 'tenant-demo';
const DEMO_TENANT_NAME = 'Ateendia Demo Agency';

const DEMO_USER_ID = 'usr-admin-demo';
const DEMO_USER_EMAIL = 'admin@ateendia.cloud';
const DEMO_USER_PASSWORD = 'Admin123!';

async function main() {
  console.log('');
  console.log('🌱 Sembrando datos iniciales...');
  console.log('');

  // ─── 1. Tenant demo ───
  const tenant = await prisma.tenants.upsert({
    where: { id: DEMO_TENANT_ID },
    update: { name: DEMO_TENANT_NAME },
    create: {
      id: DEMO_TENANT_ID,
      name: DEMO_TENANT_NAME,
      legal_name: 'Ateendia Demo LLC',
      tax_id: 'DEMO-123456',
      primary_color: '#7c3aed',
      secondary_color: '#06B6D4',
      currency: 'USD',
      language: 'es',
      timezone: 'America/Caracas',
      country: 'VE',
      city: 'Caracas',
      is_active: true,
      subdomain: 'demo',
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── 2. Usuario admin ───
  const passwordHash = await bcrypt.hash(DEMO_USER_PASSWORD, 10);

  const user = await prisma.users.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: { password_hash: passwordHash, role: 'admin', status: 'active' },
    create: {
      id: DEMO_USER_ID,
      tenant_id: DEMO_TENANT_ID,
      name: 'Admin Demo',
      email: DEMO_USER_EMAIL,
      password_hash: passwordHash,
      role: 'admin',
      status: 'active',
      is_super_admin: true,
      two_factor_enabled: false,
    },
  });
  console.log(`✅ Usuario: ${user.email} (${user.id})`);

  // ─── 3. Pipeline default ───
  const existingPipeline = await prisma.pipelines.findFirst({
    where: { tenant_id: DEMO_TENANT_ID, is_default: true },
  });

  if (!existingPipeline) {
    const pipeline = await prisma.pipelines.create({
      data: {
        id: 'pipe-default',
        tenant_id: DEMO_TENANT_ID,
        name: 'Ventas 2026',
        is_default: true,
      },
    });
    console.log(`✅ Pipeline: ${pipeline.name} (${pipeline.id})`);

    const stages = [
      { id: 'stage-lead',      name: 'Lead',           color: '#94a3b8', order: 1, prob: 10  },
      { id: 'stage-contacted', name: 'Contactado',     color: '#60a5fa', order: 2, prob: 25  },
      { id: 'stage-quoted',    name: 'Cotizado',       color: '#fbbf24', order: 3, prob: 50  },
      { id: 'stage-won',       name: 'Cerrado/Ganado', color: '#10b981', order: 4, prob: 100 },
      { id: 'stage-lost',      name: 'Perdido',        color: '#ef4444', order: 5, prob: 0   },
    ];
    for (const s of stages) {
      await prisma.pipeline_stages.create({
        data: {
          id: s.id,
          pipeline_id: pipeline.id,
          name: s.name,
          color: s.color,
          stage_order: s.order,
          win_probability: s.prob,
        },
      });
    }
    console.log(`✅ ${stages.length} etapas del pipeline creadas`);
  } else {
    console.log('ℹ️  Pipeline default ya existe, se omite');
  }


  // ─── 4. Roles globales del sistema ───
  console.log('');
  console.log('🔐 Sembrando roles globales...');

  const GLOBAL_ROLES = [
    {
      id: 'role-sys-admin',
      key: 'admin',
      name: 'Administrador',
      description: 'Acceso completo a todos los módulos de la agencia',
      permissions: {
        clients:      { view: true,  create: true,  edit: true,  delete: true,  export: true  },
        policies:     { view: true,  create: true,  edit: true,  delete: true  },
        pipeline:     { view: true,  edit: true,  moveCards: true,  manageStages: true  },
        whatsapp:     { view: true,  send: true,  configure: true  },
        email:        { view: true,  send: true,  configure: true  },
        campaigns:    { view: true,  create: true,  execute: true  },
        reports:      { view: true,  export: true  },
        banking:      { view: true,  edit: true,  viewSensitive: true  },
        telephony:    { view: true,  call: true,  viewCdr: true,  configure: true  },
        branding:     { view: true,  edit: true  },
        users:        { view: true,  invite: true,  editRoles: true  },
        audit:        { view: true  },
        integrations: { view: true,  configure: true  },
      },
    },
    {
      id: 'role-sys-supervisor',
      key: 'supervisor',
      name: 'Supervisor',
      description: 'Gestión de equipos y reportes, sin acceso a configuración crítica',
      permissions: {
        clients:      { view: true,  create: true,  edit: true,  delete: false,  export: true  },
        policies:     { view: true,  create: true,  edit: true,  delete: false  },
        pipeline:     { view: true,  edit: true,  moveCards: true,  manageStages: false  },
        whatsapp:     { view: true,  send: true,  configure: false  },
        email:        { view: true,  send: true,  configure: false  },
        campaigns:    { view: true,  create: true,  execute: true  },
        reports:      { view: true,  export: true  },
        banking:      { view: true,  edit: false,  viewSensitive: false  },
        telephony:    { view: true,  call: true,  viewCdr: true,  configure: false  },
        branding:     { view: true,  edit: false  },
        users:        { view: true,  invite: true,  editRoles: false  },
        audit:        { view: true  },
        integrations: { view: true,  configure: false  },
      },
    },
    {
      id: 'role-sys-agent',
      key: 'agent',
      name: 'Agente',
      description: 'Acceso a la operación diaria: clientes, pólizas, mensajería',
      permissions: {
        clients:      { view: true,  create: true,  edit: true,  delete: false,  export: false  },
        policies:     { view: true,  create: true,  edit: true,  delete: false  },
        pipeline:     { view: true,  edit: true,  moveCards: true,  manageStages: false  },
        whatsapp:     { view: true,  send: true,  configure: false  },
        email:        { view: true,  send: true,  configure: false  },
        campaigns:    { view: true,  create: false,  execute: false  },
        reports:      { view: false,  export: false  },
        banking:      { view: true,  edit: false,  viewSensitive: false  },
        telephony:    { view: true,  call: true,  viewCdr: false,  configure: false  },
        branding:     { view: false,  edit: false  },
        users:        { view: false,  invite: false,  editRoles: false  },
        audit:        { view: false  },
        integrations: { view: false,  configure: false  },
      },
    },
    {
      id: 'role-sys-readonly',
      key: 'readonly',
      name: 'Solo Lectura',
      description: 'Puede ver información pero no modificarla. Ideal para auditores o consultores.',
      permissions: {
        clients:      { view: true,  create: false,  edit: false,  delete: false,  export: true  },
        policies:     { view: true,  create: false,  edit: false,  delete: false  },
        pipeline:     { view: true,  edit: false,  moveCards: false,  manageStages: false  },
        whatsapp:     { view: true,  send: false,  configure: false  },
        email:        { view: true,  send: false,  configure: false  },
        campaigns:    { view: true,  create: false,  execute: false  },
        reports:      { view: true,  export: true  },
        banking:      { view: true,  edit: false,  viewSensitive: false  },
        telephony:    { view: true,  call: false,  viewCdr: true,  configure: false  },
        branding:     { view: true,  edit: false  },
        users:        { view: false,  invite: false,  editRoles: false  },
        audit:        { view: true  },
        integrations: { view: true,  configure: false  },
      },
    },
  ];

  for (const roleData of GLOBAL_ROLES) {
    const role = await prisma.roles.upsert({
      where: { id: roleData.id },
      update: {
        name: roleData.name,
        description: roleData.description,
      },
      create: {
        id: roleData.id,
        tenant_id: null,
        key: roleData.key,
        name: roleData.name,
        description: roleData.description,
        is_system: true,
        is_platform_role: false,
      },
    });

    // Idempotente: borra y recrea permisos
    await prisma.role_permissions.deleteMany({
      where: { role_id: role.id },
    });

    const permissionsToInsert: Array<{
      id: string;
      role_id: string;
      module: string;
      action: string;
      allowed: boolean;
    }> = [];

    for (const [module, actions] of Object.entries(roleData.permissions)) {
      for (const [action, allowed] of Object.entries(actions as Record<string, boolean>)) {
        permissionsToInsert.push({
          id: `perm-${role.key}-${module}-${action}`,
          role_id: role.id,
          module,
          action,
          allowed,
        });
      }
    }

    await prisma.role_permissions.createMany({
      data: permissionsToInsert,
    });

    console.log(`✅ Rol: ${role.name} (${role.key}) — ${permissionsToInsert.length} permisos`);
  }

  console.log('');
  console.log('🎉 Seed completado');
  console.log('');
  console.log('📋 Credenciales para login (Sesión 3):');
  console.log(`   Email:    ${DEMO_USER_EMAIL}`);
  console.log(`   Password: ${DEMO_USER_PASSWORD}`);
  console.log(`   Tenant:   ${DEMO_TENANT_ID}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });