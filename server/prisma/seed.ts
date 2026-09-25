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