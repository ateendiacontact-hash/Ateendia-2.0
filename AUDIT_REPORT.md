---
## 📊 Informe de Auditoría - Ateendia CRM 2.0
**Fecha:** 2026-09-24
**Fase del proyecto:** Fase 0 (completada) + Fase 1 Sesión 2 (en progreso)

### ✅ Lo que está implementado y funcionando

**Infraestructura:**
- `docker-compose.yml`: MariaDB 11.4 en puerto 3307, phpMyAdmin en 8081, red `ateendia-network`
- `vite.config.ts`: Puerto 3100, proxy `/api` → `http://localhost:4000`
- `wrangler.toml`: Limpio, solo sirve build estático (dist/) en Cloudflare Pages, sin D1
- `package.json`: Dependencias Express, Prisma, MySQL2, JWT, bcryptjs, cors, helmet, morgan, cookie-parser, nodemailer, socket.io, zod
- `.env.local` (root): `VITE_BACKEND_MODE=express`, `VITE_API_BASE_URL=/api`
- `server/.env`, `server/.env.example`, `server/.env.local`: Configuración completa para Express + MariaDB + JWT + SMTP + Evolution API + N8N

**Backend (`server/`):**
- `server/index.ts`: Punto de entrada Express con Helmet, CORS, morgan, cookie-parser, error handler global, graceful shutdown
- `server/env.ts`: Validación Zod de variables de entorno (falla al arrancar si faltan críticas)
- `server/db.ts`: Cliente Prisma singleton con logging condicional
- `server/routes/health.ts`: GET `/api/health` con verificación de DB (`SELECT 1`)
- `server/prisma/schema.prisma`: **14 modelos** (audit_logs, bank_accounts, call_records, clients, pipeline_stages, pipelines, policies, policy_members, smtp_configs, tenant_subscriptions, tenants, users, whatsapp_conversations, whatsapp_messages) con relaciones, índices y cascadas
- `server/prisma/seed.ts`: Crea tenant demo + usuario admin (admin@ateendia.cloud / Admin123!) + pipeline default con 5 etapas
- Scripts npm: `db:generate`, `db:push`, `db:migrate`, `db:studio`, `db:seed`, `dev:api`, `build:api`

**Base de datos:**
- `schema.mariadb.sql`: **14 tablas** idénticas a modelos Prisma (tenants, tenant_subscriptions, users, pipelines, pipeline_stages, clients, policies, policy_members, bank_accounts, whatsapp_conversations, whatsapp_messages, smtp_configs, call_records, audit_logs) — InnoDB, utf8mb4, FK reales
- `schema.sql.old`: Esquema SQLite/D1 anterior (12 tablas, sin policy_members, sin call_records en el listado original)
- `seed.sql`: Script SQL directo para poblar
- Coincidencia exacta: **14 tablas SQL = 14 modelos Prisma**

**Frontend (`src/`):**
- `src/context/TenantContext.tsx`: Estado global multi-tenant con mock data + fetch a `/api/*` (fallback a localState)
- `src/services/apiClient.ts`: Cliente API multi-modo (localStorage, express, supabase, rest) con headers tenantId, JWT
- `src/services/databaseService.ts`: Clase `DatabaseService` usando Prisma Client directamente (para uso en backend o scripts)
- 27 servicios en `src/services/`: authService, bankingService, clientsService, policiesService, databaseService, auditService, whatsappService, whatsAppCloudService, evolutionApi, metaGraphService, smtpService, n8nService, integrationsService, telephonyService, pbxService, paymentService, pipelineService, templatesService, usersService, campaignsService, brandingService, saasService, clientExtrasService, pocketbase, index.ts (export barrel)
- Componentes organizados por dominio en `src/components/` (23 subcarpetas)

### ⚠️ Lo que está a medias

- **`functions/api/*` (Cloudflare Pages Functions)**: Todavía existen y tienen **22 errores TypeScript** — usan modelos Prisma con nombres singulares (`prisma.client`, `prisma.policy`, `prisma.bankAccount`, `prisma.user`) pero el schema Prisma usa nombres en snake_case plural (`clients`, `policies`, `bank_accounts`, `users`, `audit_logs`, etc.). Son código legado de la fase D1 que no se ha limpiado.
- **`src/services/databaseService.ts`**: Usa Prisma con nombres de modelo incorrectos (mismos errores que `functions/api/*`) — 40+ errores TS por `prisma.client`, `prisma.policy`, `prisma.bankAccount`, `prisma.auditLog`, `prisma.pipeline`, `prisma.tenant`, `prisma.user`
- **`TenantContext.tsx`**: 17 errores TS — tipos `TenantBranding`, `User`, `Policy`, `BankAccount` no coinciden con definiciones en `src/types/index.ts` (faltan campos como `tagline`, `clientCategories`, `policyTypes`, `validUntil`, etc.)
- **Componentes UI**: 100+ errores TS por propiedades faltantes en `TenantContextType` (`dismissAlert`, `auditLogs`, `requires2FA`, `resendOtp`, `createClient`, `templates`, `chatMessages`, `moveClientStage`, `createPolicy`, `roles`, `whatsAppConfig`, `issabelConfig`, `saasDatabaseConfig`, `n8nConfig`, `aiConfig`, etc.)
- **`src/services/apiClient.ts`**: 3 errores TS (tipado genérico `Promise<T>`, acceso a `error.message` en `unknown`)
- **`src/index.ts`**: 6 errores TS (tipos genéricos `Record`, `Promise`, `Partial` sin argumentos)

### ❌ Lo que NO está implementado (pendiente)

**Fase 1 — Auth & Middleware (Backend Express):**
- `server/middleware/` — **NO EXISTE** (debería tener: `auth.ts` JWT verify, `tenant.ts` tenant resolution, `rbac.ts` permisos, `errorHandler.ts`)
- `server/routes/auth.ts` — **NO EXISTE** (login, register, 2FA, password reset, refresh token, logout)
- `server/routes/clients.ts` — **NO EXISTE** (CRUD clientes, migración desde `functions/api/clients.ts`)
- `server/routes/policies.ts` — **NO EXISTE** (CRUD pólizas, migración desde `functions/api/policies.ts`)
- `server/routes/banking.ts` — **NO EXISTE** (CRUD cuentas bancarias, migración desde `functions/api/banking/accounts.ts`)
- `server/routes/audit.ts` — **NO EXISTE** (audit logs, fase 5)
- `server/routes/users.ts` — **NO EXISTE** (gestión usuarios/RBAC)
- `server/routes/tenants.ts` — **NO EXISTE** (gestión tenants, branding, suscripciones)

**Fase 2 — Integración Frontend → Backend Express:**
- Conectar `TenantContext` y servicios a `/api/*` real (eliminar fallback a localStorage)
- Migrar `databaseService.ts` a usar nombres correctos de modelos Prisma
- Eliminar `functions/api/*` legacy o migrarlos a Express

**Fase 3 — Features avanzadas:**
- WebSockets (Socket.io) para notificaciones tiempo real
- WhatsApp Evolution API / Cloud API integración real
- n8n workflows y webhooks
- Auditoría automática en middleware
- Tests: Vitest (unit) + Playwright (e2e)

### 🔄 Discrepancias con la Memory Bank anterior

| Memory Bank (AGENTS.md) | Realidad actual (código) |
|------------------------|-------------------------|
| Backend: "Cloudflare Workers / Pages Functions, PocketBase, Node.js/Express con MariaDB" | Backend: **Solo Express + Prisma + MariaDB** (D1/PocketBase legacy en `functions/`) |
| Base de datos: "MariaDB como principal; PocketBase, Supabase, Firebase, MongoDB, PostgreSQL, Cloudflare D1 como alternativas" | Base de datos: **Solo MariaDB** (D1 solo en `wrangler.toml` histórico, `functions/api/*` legacy roto) |
| APIs Backend: "Cloudflare Pages Functions en functions/api/ ... y Node.js/Express" | APIs Backend: **Solo Express en `server/`** (functions/api/* tiene 22 errores TS y no compila) |
| `TenantContext` usa "fetch API D1" | `TenantContext` usa `fetch('/api/*')` con fallback a mock local |
| `server/` no documentado | `server/` existe con estructura completa Fase 0 + salud |
| Puerto MariaDB: no documentado | Puerto MariaDB: **3307** (host) / 3306 (contenedor) |
| phpMyAdmin: no documentado | phpMyAdmin: **8081** |
| Prisma schema: no mencionado | Prisma schema: **14 modelos** en `server/prisma/schema.prisma` + `prisma/schema.prisma` (duplicado en raíz) |
| Seed: no mencionado | Seed: `server/prisma/seed.ts` funcional (tenant demo + admin + pipeline) |

### 📋 Próximos pasos sugeridos

1. **Limpiar código legacy**: Eliminar carpeta `functions/` completa (ya no se usa, rompe `npm run lint`)
2. **Corregir `databaseService.ts`**: Cambiar `prisma.client` → `prisma.clients`, `prisma.policy` → `prisma.policies`, `prisma.bankAccount` → `prisma.bank_accounts`, `prisma.auditLog` → `prisma.audit_logs`, `prisma.pipeline` → `prisma.pipelines`, `prisma.tenant` → `prisma.tenants`, `prisma.user` → `prisma.users`
3. **Crear `server/middleware/`**: `auth.ts` (JWT verify + attach user), `tenant.ts` (resolve tenantId from header/JWT), `rbac.ts` (permission matrix), `errorHandler.ts` (ya básico en index.ts)
4. **Crear `server/routes/auth.ts`**: Login (email/password + bcrypt), 2FA (TOTP 6 dígitos), refresh token, password reset (SMTP), logout, register
5. **Crear `server/routes/clients.ts`**: Migrar lógica de `functions/api/clients.ts` a Express + Prisma (nombres correctos)
6. **Crear `server/routes/policies.ts`**: Migrar lógica de `functions/api/policies.ts`
7. **Crear `server/routes/banking.ts`**: Migrar lógica de `functions/api/banking/accounts.ts`
8. **Actualizar `TenantContext` y servicios frontend**: Eliminar fallback mock, usar `apiClient` configurado en modo `express`, tipar correctamente `TenantContextType` según `src/types/index.ts`
9. **Ejecutar `npm run db:push` + `npm run db:seed`** para crear tablas en MariaDB
10. **Añadir tests**: Vitest para servicios, Playwright para flujos críticos (login, crear cliente, crear póliza, crear cuenta bancaria)