Proyecto: ateendia-crm 2.0
Descripción General
Sistema CRM (Customer Relationship Management) multi-tenant para la gestión integral de clientes, pólizas de seguros, alertas automáticas, auditoría, banca, branding y telefonía. Arquitectura SaaS con aislamiento de datos por tenant, diseñada para centralizar la operación comercial y financiera de agencias de seguros y servicios financieros.

Arquitectura y Tecnología
Tipo de aplicación: Web app moderna SPA (Single Page Application)

Backend: TypeScript + Express 4 + Prisma ORM + MariaDB + JWT (bcryptjs, jsonwebtoken). Cloudflare Pages solo sirve el build estático (dist/). Legacy Cloudflare D1/PocketBase en `functions/` — por eliminar.

Frontend: React 19 con TypeScript, Vite 6, TailwindCSS 4, Lucide React (iconos), Motion (animaciones)

Base de datos: MariaDB 11.4 (InnoDB, utf8mb4) como única base de datos. Esquema definido en `server/prisma/schema.prisma` (23 modelos) y `schema.mariadb.sql` (23 tablas, idénticas). Puerto local: 3307 (host) / 3306 (contenedor).

Control de versiones: Git

Infraestructura: Despliegue en Cloudflare Pages (frontend) + VPS (Contabo, OVH, Hetzner, DigitalOcean, AWS) con Docker, Nginx, Certbot SSL. Backend Express en puerto 4000.

Puertos de desarrollo local:
- Vite (frontend): 3100
- Express (API): 4000
- MariaDB: 3307 (host) / 3306 (contenedor)
- phpMyAdmin: 8081

Reglas de Desarrollo
Estilo de código: Seguir las guías de estilo de ESLint + Prettier para TypeScript/React. Ejecutar `npm run lint` (tsc --noEmit) antes de commitear.

Nomenclatura: camelCase para variables, funciones, hooks y propiedades; PascalCase para componentes React, interfaces, types y clases; UPPER_SNAKE_CASE para constantes y enums.

Comentarios: Documentar funciones complejas, servicios y APIs con JSDoc/TSDoc. Los componentes no requieren comentarios extensos si son autoexplicativos.

Estructura de componentes: Mantener los componentes modulares dentro de src/components/ según su dominio funcional:
- alerts/ - Centro de alertas automáticas (cumpleaños, documentos, pagos)
- auth/ - Vistas de login, 2FA, recuperación de contraseña
- banking/ - Gestión central de métodos de pago (ACH, tarjetas) con RBAC
- branding/ - White-labeling, landing pages, configuración visual
- clients/ - CRUD de clientes, pipeline, etapas
- campaigns/ - Campañas WhatsApp/Email con segmentación
- dashboard/ - Vistas principales y métricas
- documents/ - Gestión documental con alertas de vencimiento
- email/ - Configuración SMTP, plantillas, envío
- import/ - Importación masiva de datos
- integrations/ - n8n, Meta Graph, Webhooks, IA/RAG
- media/ - Gestión de archivos multimedia
- notes/ - Notas y actividades por cliente
- notifications/ - Centro de notificaciones en tiempo real
- pipeline/ - Kanban de oportunidades
- policies/ - Gestión de pólizas de seguros (ACA, Vida, Dental, etc.)
- search/ - Búsqueda global
- telephony/ - Issabel PBX, CDR, softphone WebRTC
- templates/ - Plantillas de mensajes (WhatsApp, Email)
- users/ - Gestión de usuarios y permisos RBAC

Estado: Usar React Context (TenantContext) para estado global multi-tenant. Evitar Redux/Zustand salvo necesidad crítica.

Servicios: Capa de servicios en src/services/ (authService, bankingService, whatsappService, telephonyService, smtpService, auditService, etc.) con cliente API centralizado (apiClient.ts). **Pendiente: migrar servicios a usar apiClient en modo 'express' y eliminar fallback mock.**

Tipado: Definir todos los modelos en src/types/index.ts (DDD: User, Policy, Client, BankAccount, AuditLogEntry, SystemAlert, TenantBranding, SaasPaymentReceipt, etc.). **Pendiente: sincronizar tipos con Prisma schema y TenantContext.**

Permisos: Matriz de permisos granular (PermissionMatrix) por módulo y acción. Hook can(module, action) en TenantContext. **Pendiente: implementar RBAC real en backend (middleware/rbac.ts).**

Multi-tenancy: Aislamiento estricto por tenantId en todas las queries MariaDB. Partition key + encryption level configurable.

Autenticación: Login con email/password + 2FA (OTP 6 dígitos). Recuperación de contraseña vía email (SMTP). Sesión persistida en localStorage. Fallback modo mock/offline con usuarios demo. **Pendiente: implementar auth real en server/routes/auth.ts (JWT + 2FA + password reset).**

APIs Backend: Express + Prisma en `server/` con rutas REST `/api/*`. CORS habilitado. Respuestas JSON consistentes. Legacy Cloudflare Pages Functions en `functions/api/` — **por eliminar (22 errores TS, no compilan).**

Tiempo real: Socket.io para notificaciones; WhatsApp via Cloud API / Evolution API / QR Bridge; Issabel AMI + WebRTC para telefonía. **Pendiente: implementar Socket.io server en Express.**

Automatizaciones: n8n para workflows; reglas programadas (cumpleaños, vencimientos, pagos) con anti-spam; IA/RAG multi-proveedor (OpenRouter, Gemini, OpenAI, Anthropic, DeepSeek) para auto-responder. **Pendiente: conectar n8n webhooks a Express routes.**

Auditoría: AuditLogEntry para trazabilidad completa (CREATE/UPDATE/DELETE/LOGIN/LOGOUT/EXPORT/CALL/SEND_MESSAGE/STATUS_CHANGE) por módulo. Modelo `audit_logs` en Prisma + tabla en MariaDB. **Pendiente: middleware de auditoría automática + server/routes/audit.ts.**

Branding: TenantBranding con colores, logo, dominio personalizado, landing page micro-sitio, configuración de coberturas y testimonios.

Estructura del Backend (`server/`):
```
server/
├── index.ts              # Punto de entrada Express (Helmet, CORS, morgan, cookie-parser, error handler, graceful shutdown)
├── env.ts                # Validación Zod de variables de entorno (falla al arrancar si faltan críticas)
├── db.ts                 # Cliente Prisma singleton (logging condicional dev/prod)
├── tsconfig.json         # Config TS para backend (ESM, strict, outDir: dist)
├── types/
│   └── landing.ts        # Tipos backend: LandingHero, LandingFeature, LandingTestimonial, LandingFooter, SaasLandingConfig
├── services/
│   └── saasLandingService.ts  # Servicio landing config: get, update, normalize, default
├── prisma/
│   ├── schema.prisma     # 24 modelos: audit_logs, bank_accounts, call_records, clients, pipeline_stages, pipelines, policies, policy_members, saas_payment_methods, saas_plans, saas_platform_settings, smtp_configs, tenant_subscriptions, tenants, users, whatsapp_conversations, whatsapp_messages (+ landing_config_json)
│   └── seed.ts           # Tenant demo + admin (admin@ateendia.cloud / Admin123!) + pipeline default 5 etapas + saas_super_admin + plan DEMO
├── routes/
│   ├── health.ts         # GET /api/health (verifica DB con SELECT 1)
│   └── saas/
│       └── landing.ts    # Sub-router: GET/PUT /api/saas/landing
├── .env                  # Variables reales (no commitear)
├── .env.example          # Template
└── .env.local            # Override local (gitignored)
```
**Pendiente por crear:**
- `middleware/auth.ts` — JWT verify, attach user/tenant
- `middleware/tenant.ts` — Resolve tenantId from header/JWT
- `middleware/rbac.ts` — PermissionMatrix enforcement
- `middleware/errorHandler.ts` — Centralizado (básico ya en index.ts)
- `routes/auth.ts` — Login, register, 2FA, password reset, refresh, logout
- `routes/clients.ts` — CRUD clientes (migrar desde functions/api/clients.ts)
- `routes/policies.ts` — CRUD pólizas (migrar desde functions/api/policies.ts)
- `routes/banking.ts` — CRUD cuentas bancarias (migrar desde functions/api/banking/accounts.ts)
- `routes/users.ts` — Gestión usuarios + RBAC
- `routes/tenants.ts` — Gestión tenants, branding, suscripciones
- `routes/audit.ts` — Audit logs (fase 5)

## Variables de entorno — Reglas

### Distribución por archivo

| Archivo | Contenido | Quién lo lee | ¿Git? |
|---------|-----------|--------------|-------|
| `.env.example` (raíz) | Solo `VITE_*` (públicas) | Vite | ✅ Sí |
| `.env.local` (raíz) | Valores reales `VITE_*` | Vite | ❌ No |
| `server/.env.example` | Plantilla de secretos | Referencia | ✅ Sí |
| `server/.env.local` | Secretos reales (DB, JWT, SMTP) | `server/env.ts` (dotenv) | ❌ No |
| `server/.env` | Copia de `.env.local` | Prisma CLI | ❌ No |

### ⚠️ Reglas críticas

1. **NUNCA** poner prefijo `VITE_` a secretos. Todo lo `VITE_*` termina en el 
   bundle del navegador. Los secretos (JWT_SECRET, DB_PASSWORD, SMTP_PASS, 
   STRIPE_SECRET_KEY) **NUNCA** llevan ese prefijo.
2. `DATABASE_URL` vive SOLO en `server/.env` y `server/.env.local`.
3. **Nunca** debe haber un `.env` con secretos en la raíz del proyecto. 
   La raíz es territorio del frontend (todo público).
4. Si el CLI de Prisma dice `Environment variables loaded from ..\.env`, hay un 
   `.env` residual en la raíz rompiendo todo. Renombrarlo a `.env.old`.

### Duplicación deliberada `.env` vs `.env.local` en server/

- `server/.env` → lo lee **Prisma CLI** (convención suya: siempre busca `.env`)
- `server/.env.local` → lo lee **tu código** vía `dotenv.config({ path: '.env.local' })`

Ambos deben tener exactamente el mismo contenido.

## Reglas del Backend (server/)

### Uso de Prisma Client

**Regla crítica de naming:** Prisma genera los modelos con el nombre EXACTO 
de la tabla SQL (plural, snake_case). Esto significa:

```ts
// ✅ CORRECTO
await prisma.users.findUnique({ where: { email } });
await prisma.clients.findMany({ where: { tenant_id } });
await prisma.bank_accounts.create({ data: { tenant_id, client_id, ... } });
await prisma.audit_logs.create({ data: { tenant_id, user_id, ... } });

// ❌ INCORRECTO (causa error "Property X does not exist")
prisma.user.findUnique(...)         // singular
prisma.bankAccount.create(...)      // camelCase
prisma.client.findMany({ where: { tenantId } })  // camelCase
```

Los campos también mantienen snake_case: `tenant_id`, `password_hash`, 
`primary_color`, `is_active`, `created_at`, `updated_at`, etc.

### Manejo de columnas JSON

MariaDB guarda `JSON` como LONGTEXT y Prisma lo expone como `String?`. 
Se maneja manualmente:

```ts
// Guardar
await prisma.clients.create({
  data: {
    address_json: JSON.stringify({ street, city, state, zipCode, country }),
  }
});

// Leer
const address = client.address_json ? JSON.parse(client.address_json) : null;
```

### Inicialización de dotenv en scripts

Cualquier script que se ejecute con `tsx` o `node` (no vía Prisma CLI) 
debe cargar dotenv manualmente al inicio, apuntando al `.env` correcto:

```ts
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Ahora sí, importar Prisma y usarlo
import { PrismaClient } from '@prisma/client';
```

### Imports con extensión .js

Con `module: ESNext` en `tsconfig.json`, los imports entre archivos `.ts` 
se hacen con `.js`:

```ts
import { env } from './env.js';      // ✅ correcto
import { env } from './env';          // ❌ no resuelve en runtime
```

### Estructura de un nuevo endpoint

Al agregar una ruta nueva:
1. Crear `server/routes/<nombre>.ts` con `express.Router()`
2. Importarlo en `server/index.ts` y montarlo con `app.use('/api', <router>)`
3. Usar `prisma.<modelo_plural>` para queries
4. Validar el body con Zod antes de tocar la DB
5. Envolver errores en try/catch o dejar que el error handler central los capture

### Middlewares y usuarios de plataforma
- Todo middleware de tenant DEBE tener excepción para `tenantId === 'platform'`.
- Los Super Admins SaaS (`is_platform_user = 1`) NO están sujetos a verificaciones de tenant.
- Ejemplo en `requireTenant`: si `req.user.tenantId === 'platform'`, saltar verificación.

### Naming de Prisma
- Los modelos mantienen snake_case del SQL: `prisma.saas_plans`, `prisma.saas_payment_methods`, `prisma.saas_platform_settings`.
- Los campos también: `price_monthly`, `max_users`, `is_public`, etc.

### JSON en MariaDB
- Prisma convierte JSON a `String?` en MariaDB.
- Serializar con `JSON.stringify()` al guardar.
- Parsear con `JSON.parse()` al leer.
- Ejemplo: `features_json` en `saas_plans`.

### Precios con decimales
- Los precios DEBEN mostrarse con 2 decimales en la UI (`$29.00`, `$29.50`).
- Backend usa `DECIMAL(10,2)`.
- Los límites numéricos son enteros (`max_users`, `max_clients`).
- `sort_order` es entero.

## Comandos útiles

### Base de datos (Docker)

```bash
docker compose up -d          # Levantar MariaDB + phpMyAdmin
docker compose down           # Bajar servicios (conserva datos)
docker compose down -v        # Bajar Y borrar volumen (⚠️ pierde datos)
docker compose ps             # Ver estado (buscar "healthy")
docker compose logs mariadb   # Ver logs de MariaDB

# Conectar a MariaDB por CLI
docker compose exec mariadb mariadb -uateendia -pateendia_password ateendia_crm -e "SHOW TABLES;"
docker compose exec mariadb mariadb -uateendia -pateendia_password ateendia_crm -e "DESCRIBE clients;"
```

### Prisma

```bash
npx prisma db pull --schema=server/prisma/schema.prisma    # Sincronizar schema desde DB
npx prisma generate --schema=server/prisma/schema.prisma   # Generar cliente TypeScript
npx tsx server/prisma/seed.ts                              # Poblar datos iniciales
```

⚠️ Los comandos de Prisma CLI requieren `server/.env` (no `.env.local`).

### Desarrollo

```bash
npm run dev           # Frontend (3100) + Backend (4000) juntos
npm run dev:web       # Solo Vite (3100)
npm run dev:api       # Solo Express (4000)
npm run lint          # TypeScript check
npm run build         # Build producción frontend
```

### Puertos del proyecto (desarrollo local)

| Servicio | Puerto | Notas |
|----------|--------|-------|
| Vite (frontend) | 3100 | Proxy `/api` → 4000 |
| Express (backend) | 4000 | API REST |
| MariaDB | 3307 (host) / 3306 (contenedor) | Usuario: `ateendia` |
| phpMyAdmin | 8081 | Login: `root` / `rootpassword` |
| Evolution API (WhatsApp) | 8080 | Ya existente, reutilizar |
| Chatwoot | 3000 | Ya existente (otro proyecto) |
| edentals-db | 3306 | Ya existente (otro proyecto) |

⚠️ Los puertos 3306, 3000, 8080 están ocupados por otros proyectos. 
Por eso Ateendia usa 3307, 3100, 4000.

---

## Estado Actual del Proyecto (Actualizado: 2026-10-12)

### ✅ Fase 0 — Infraestructura (COMPLETADA)
- Docker Compose con MariaDB 11.4 + phpMyAdmin
- 16 tablas en MariaDB con InnoDB, utf8mb4, foreign keys
- Variables de entorno separadas (frontend / backend)
- Vite con proxy /api → localhost:4000
- Scripts npm: db:pull, db:generate, db:seed, dev, docker:up, etc.

### ✅ Fase 1 — Backend Base (COMPLETADA)
- Express 4 + TypeScript + Prisma 5.22
- Middleware: requireAuth, requireTenant, requirePermission, auditLog
- Auth: POST /login, GET /me, POST /logout, GET /permissions
- RBAC: 4 roles globales (admin, supervisor, agent, readonly)
- 156 permisos (39 por rol × 4 roles)
- Auditoría automática en mutaciones

### ✅ Fase 2 — Clients (COMPLETADA)
- CRUD completo con paginación y filtros
- Aislamiento multi-tenant
- Soft delete
- Audit logs automáticos

### ✅ Fase 3.1 — Banking (COMPLETADA)
- CRUD de cuentas ACH y tarjetas
- Enmascaramiento por defecto (****1234)
- Endpoint /reveal con permiso banking:viewSensitive
- Set-default único por cliente

### ✅ Fase 3.5.B.3.b — Panel Super Admin aprobar/rechazar registros (COMPLETADA)
- Endpoints: GET /api/saas/registrations, POST /approve, POST /reject
- Servicio saasRegistrationReviewService (transacción atómica tenant+user+subscription)
- Middleware requirePlatformUser (rbac.ts)
- Campo users.must_reset_password
- Lazy check expiración al listar solicitudes
- 7/7 pruebas end-to-end exitosas

### ✅ Fase 3.5.B.4.a.1 — Backend: endpoint /payment-methods/public (COMPLETADA)
- Nuevo endpoint público: GET /api/saas/payment-methods/public (sin auth)
- DTO público explícito: PublicPaymentMethod (sin provider_config_json ni crypto_explorer_api)
- Seed de 3 métodos en saas_payment_methods: Zelle (manual), USDT TRC-20 (crypto_semi_auto), Stripe (automatic)
- Sub-router dentro de saasRouter, named exports, type guards en servicio
- 4 archivos backend nuevos/modificados + 1 frontend

### ✅ Fase 3.5.B.4.a.2 — Frontend: RegisterForm + integración (COMPLETADA)
- RegisterForm.tsx (~690 líneas) con toggle demo/pago, carga de catálogos, validación client-side
- RegisterSuccessView.tsx (~190 líneas) genérico para ambos flujos
- RegisterView.tsx (~58 líneas) wrapper con estado authView en App.tsx
- Integración en LoginView.tsx con link "Registrate gratis"
- Tipos frontend espejo del DTO backend en src/types/index.ts
- Prueba end-to-end exitosa: submit demo → RegisterSuccessView con requestId real + DB verifica solicitud pending

### ✅ Fase 3.5.B.4.b — Página pública de consulta de estado (COMPLETADA)
- Endpoint público: GET /api/saas/registrations/:requestId/status (sin auth, rate limit 10 req/15min)
- Servicio saasRegistrationService.getRegistrationStatus() — lee request, mapea status a label user-facing
- Middleware rateLimiters.ts — rate limiting por IP configurable (10 req/15min para status check)
- CheckStatusModal.tsx (~410 líneas) — modal accesible con animaciones Motion, estados: pending/approved/rejected/expired
- RegisterSuccessView.tsx — link "Consultar estado" abre modal con requestId pre-cargado
- LoginView.tsx — link "Consultar estado de solicitud" abre modal
- Tipos frontend: RegistrationStatusResponse, RegistrationStatusLabel map
- 10/10 pruebas end-to-end exitosas (demo/pending, approved, rejected, expired, rate limit, not found, etc.)
- 10 archivos: server/middleware/rateLimiters.ts, server/routes/saas/registrationStatus.ts, server/routes/saas.ts, server/services/saasRegistrationService.ts, server/types/registration.ts, src/components/auth/CheckStatusModal.tsx, src/components/auth/LoginView.tsx, src/components/auth/RegisterSuccessView.tsx, src/services/registrationService.ts, src/types/index.ts

### ✅ Fase 3.5.B.4.c — Primer login con must_reset_password (COMPLETADA)
- Backend: endpoint POST /api/auth/change-initial-password (JWT protegido)
- Backend: login ahora devuelve mustResetPassword: boolean
- Backend: getCurrentUser devuelve mustResetPassword: boolean
- Backend: nueva función changeInitialPassword() en authService
- Backend: nuevo tipo AuditAction 'UPDATE_PASSWORD'
- Backend: nuevo archivo server/types/auth.ts
- Frontend: nuevo componente FirstLoginPasswordChangeView.tsx (~318 líneas)
- Frontend: LoginView adaptado al discriminated union LoginResult
- Frontend: authService migrado a Express (/api/auth/*) con fallback mock
- Frontend: nuevo authView 'firstLoginPasswordChange' en App.tsx
- Frontend: TenantContext refactorizado con useCallback + useRef
  (fix del bucle infinito "Maximum update depth exceeded")
- Frontend: tipos AuthLoginResponse, AuthLoginResult, ChangeInitialPassword*
- Reglas password nueva: min 6, 1 mayúscula, 1 minúscula, 1 número, 1 especial
- 6/6 pruebas end-to-end exitosas
- Audit log UPDATE_PASSWORD registrado correctamente

### Resumen de endpoints funcionales (53 endpoints)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/health | Health check |
| POST | /api/auth/login | Login + JWT + 2FA |
| GET | /api/auth/me | Usuario actual + tenant + permisos |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/permissions | Permisos del usuario |
| POST | /api/auth/change-initial-password | Cambio obligatorio de contraseña (JWT) |
| GET | /api/clients | Listar clientes (paginado, filtros) |
| GET | /api/clients/:id | Obtener cliente por ID |
| POST | /api/clients | Crear cliente |
| PATCH | /api/clients/:id | Actualizar cliente |
| DELETE | /api/clients/:id | Soft delete cliente |
| GET | /api/banking/accounts | Listar cuentas bancarias |
| GET | /api/banking/accounts/:id | Obtener cuenta |
| POST | /api/banking/accounts | Crear cuenta (ACH/tarjeta) |
| PATCH | /api/banking/accounts/:id | Actualizar cuenta |
| DELETE | /api/banking/accounts/:id | Eliminar cuenta |
| POST | /api/banking/accounts/:id/set-default | Marcar como default |
| POST | /api/banking/accounts/:id/reveal | Revelar datos sensibles |
| GET | /api/saas/plans | Lista admin (incluye inactivos) |
| GET | /api/saas/plans/public | Lista pública (sin auth, para landing) |
| GET | /api/saas/plans/:id | Detalle de plan |
| POST | /api/saas/plans | Crear plan (auditado) |
| PATCH | /api/saas/plans/:id | Editar plan (auditado) |
| DELETE | /api/saas/plans/:id | Archivar plan (soft delete) |
| GET | /api/saas/landing | Obtener config landing (público) |
| PUT | /api/saas/landing | Actualizar config landing (Super Admin) |
| POST | /api/saas/register | Registro público demo/pago (anti-enumeración, rate limit) |
| GET | /api/saas/payment-methods/public | Lista métodos de pago públicos sanitizados |
| GET | /api/saas/registrations | Listar solicitudes (filtro por estado, paginado) |
| POST | /api/saas/registrations/:id/approve | Aprobar solicitud (crea tenant + user + subscription) |
| POST | /api/saas/registrations/:id/reject | Rechazar solicitud (guarda reason) |
| GET | /api/saas/registrations/:requestId/status | Consulta pública estado solicitud (rate limit 10/15min) |
| GET | /api/saas/upgrade/eligibility | Consulta si el tenant puede upgradear (JWT tenant) |
| POST | /api/saas/upgrade | Crea solicitud de upgrade demo→pago (JWT tenant) |

---

### ✅ Sesión #20 — Fix Pantallas en Blanco (Bloque Base) — 2026-10-11
- Commit: a4e9ebe
- 3 archivos, 787 inserciones, 92 eliminaciones
- 16 stubs agregados, 5/6 pantallas desbloqueadas
- Fix bug charAt en ClientsListView

### ✅ Sesión #22 — Fase A + Fase B (COMPLETADA) — 2026-10-12
- Commit 07ffaad: Kill Switch WhatsApp (cortar bucle infinito)
- Commit e3e7de9: Fix Sidebar por Rol + reorganización grupos
- 6 archivos tocados, 2 bugs resueltos
- Deuda técnica registrada: B.5, B.6, C.0, Evolution API nginx

---

## Sistema DEMO + Registro

Documenta el sistema DEMO y su flujo:

### Plan DEMO
- `id: 'plan-demo'`, `key: 'demo'`, `price_monthly: 0`
- `sort_order: 0` (aparece primero en la landing)
- Límites: 2 usuarios, 20 clientes, 30 pólizas, 1 WhatsApp, 100 msgs/día, 1 GB storage
- Features deshabilitadas: IA, Telegram, Instagram, Facebook, webhooks, import masivo, landing page
- Features habilitadas: WhatsApp básico, audit logs
- Duración: configurable desde `saas_platform_settings` (default 14 días)
- Grace period: 30 días en modo lectura antes de suspensión total
- Marca de agua "DEMO" en UI (frontend lee `tenant.status === 'demo'`)

### Estados de Tenant
Los tenants pueden estar en uno de 6 estados:
- `demo` — Cuenta de prueba gratuita (14 días default)
- `pending_payment` — Registro pago, esperando aprobación del Super Admin
- `active` — Cuenta activa con plan pago
- `suspended` — Suspendido por falta de pago
- `cancelled` — Cancelado voluntariamente o por impago prolongado
- `expired` — Demo expirado sin conversión

### Configuración Global (saas_platform_settings)
Fila única (`id = 'global'`) que define:
- `demo_enabled` — Activar/desactivar registro demo
- `demo_duration_days` — Duración del demo (14 default)
- `demo_grace_period_days` — Días de lectura tras expirar (30 default)
- `demo_requires_email` — Requiere verificación email (0 default)
- `demo_watermark_enabled` — Marca de agua activa (1 default)
- `demo_plan_id` — ID del plan usado para demos (`plan-demo`)
- `default_currency` — Moneda por defecto (USD)
- `grace_period_days` — Días de gracia para pago (5 default)
- `auto_suspend_on_expire` — Auto-suspender al expirar (1 default)
- `support_email`, `support_whatsapp`, `platform_name` — Info de contacto

---

## Roadmap del Proyecto (Fases 3-7)

### Fase 3 — Core CRM (en curso)
- 3.1 Banking ✅ COMPLETADA
- 3.2 Policies (13 tipos + formularios dinámicos) ⏳ SIGUIENTE — 5 sesiones
- 3.3 Users (gestión usuarios + roles) ⏳ — 2 sesiones
- 3.4 SMTP (envío emails) ⏳ — 1 sesión
- 3.5 SaaS Central ⏳ — 19 sesiones

### Roadmap Fase 3.5 (SaaS Central)

### 3.5.A — SaaS Plans Base [✅ 100% COMPLETADA]
- Tablas: saas_plans, saas_payment_methods
- Rol: saas_super_admin + 8 permisos SaaS
- Usuario: saas@ateendia.cloud / SuperAdmin123!
- Endpoints: 5 (CRUD de planes)
- Frontend pendiente

### 3.5.B — Landing + Registro + Demo [~97% ✅]
- **3.5.B.1 — Base DEMO + Registro [✅ COMPLETADA]**
  - tenants: +status, +demo_expires_at, +grace_period_ends_at
  - saas_platform_settings (config global)
  - Plan DEMO en seed
- **3.5.B.2 — Landing configurable [✅ COMPLETADA]**
  - Servicio saasLandingService
  - Endpoints: GET/PUT /api/saas/landing
  - Tipos TypeScript (server/types/landing.ts + src/types/index.ts)
  - Columna landing_config_json en saas_platform_settings
- **3.5.B.3.a — Endpoint público POST /api/saas/register [✅ COMPLETADA]**
  - Tabla saas_registration_requests creada
  - Servicio saasRegistrationService (normalize, checkDuplicate, create)
  - Rate limiting: 5 req / 15 min por IP
  - Validación Zod estricta + captura server-side ip_address/user_agent
  - Respuesta minimalista anti-enumeración (201 con requestId fake dup_* si duplicado)
  - Password admin hasheado con bcrypt (no se transfiere al user al aprobar)
- **3.5.B.3.b — Panel Super Admin aprobar/rechazar [✅ COMPLETADA]**
  - Endpoints: GET /api/saas/registrations, POST /approve, POST /reject
  - Servicio saasRegistrationReviewService (transacción atómica)
  - Middleware requirePlatformUser
  - Campo users.must_reset_password
  - Lazy check expiración (sin cron en MVP)
  - 7/7 pruebas end-to-end exitosas
- **3.5.B.4.a.1 — Backend endpoint /payment-methods/public [✅ COMPLETADA]**
- **3.5.B.4.a.2 — Frontend RegisterForm + integración [✅ COMPLETADA]**
- **3.5.B.4.b — Página pública de estado de solicitud [✅ COMPLETADA]**
- **3.5.B.4.c — Primer login con must_reset_password [✅ COMPLETADA]**
- **3.5.B.4.d — Endpoint upgrade demo → pago [✅ COMPLETADA]**
- **3.5.B.4.e — Frontend pantalla de upgrade [⏳]**
- **3.5.B.4.f — Middleware verificación de límites [⏳]**
- **3.5.B.4.g — SMTP transaccional SaaS [⏳]**

### 3.5.C — Pagos, Verificación, Suspensión [⏳ ~10 sesiones]
- 3.5.C.1 — Métodos de pago (manual + crypto + auto)
- 3.5.C.2 — Flujo manual (comprobantes + revisión)
- 3.5.C.3 — Flujo crypto (Trust Wallet + blockchain API)
- 3.5.C.4 — Flujo automático (Stripe + PayPal)
- 3.5.C.5 — Ciclo de vida (renovaciones, upgrade, suspensión)
- 3.5.C.6 — Cron jobs (expiración, notificaciones)

### 3.5.D — Frontend SaaS Central [⏳ 4 sesiones]
- Dashboard con MRR, conversión demo→pago
- Pipeline de tenants (demo → pending → active → suspended)
- Filtros avanzados por estado/plan/fecha
- Verificación de pagos
- Configuración de landing general

### 3.5.E — Verificación de límites [⏳ 1 sesión]
- Middleware que valida límites al crear recursos

### Fase 4 — Multibandeja Unificada (10 sesiones)
- 4.1 Refactor: conversations + messages unificadas
- 4.2 WhatsApp Vendedores (Evolution #1)
- 4.3 WhatsApp Seguimiento (Evolution #2)
- 4.4 Web / Microlanding (leads + respuesta por email)
- 4.5 Telegram Empresa (bot global + vinculación permanente)
- 4.6 Instagram + Facebook (Meta Graph)
- 4.7 Telegram SaaS Central (leads de plataforma)

### Fase 5 — IA + Automatizaciones (9 sesiones)
- 5.1 IA resúmenes por conversación (OpenRouter)
- 5.2 IA sugerencias + auto-respuestas (RAG)
- 5.3 n8n webhooks bidireccionales
- 5.4 Cron jobs (cumpleaños, vencimientos, pagos)
- 5.5 Socket.io realtime

### Fase 6 — Analytics + Reportes (5 sesiones)
- 6.1 Dashboard ejecutivo
- 6.2 Reportes exportables
- 6.3 Auditoría avanzada

### Fase 7 — Producción (6 sesiones)
- 7.1 CI/CD GitHub Actions
- 7.2 Nginx + SSL + Dominios
- 7.3 Backups automáticos
- 7.4 Monitoring
- 7.5 Tests E2E Playwright

---

## Canales de Mensajería (Multibandeja)

Documenta los 7 canales:

| Canal | key interno | Propósito | Configuración | Permisos |
|-------|-------------|-----------|---------------|----------|
| WhatsApp Vendedores | whatsapp_sales | Atención comercial | integrations/ + switch | whatsapp.view, whatsapp.send |
| WhatsApp Seguimiento | whatsapp_support | Post-venta | integrations/ + switch | whatsapp.view, whatsapp.send |
| Telegram Empresa | telegram | Clientes finales | integrations/ + switch | telegram.view, telegram.send |
| Telegram SaaS | telegram_saas | Leads plataforma | saas/ + switch | (roles SaaS) |
| Web/Microlanding | web | Consultas desde landing | integrations/ + switch | web.view |
| Instagram | instagram | DMs de Instagram | integrations/ + switch | instagram.view, instagram.send |
| Facebook | facebook | Messenger | integrations/ + switch | facebook.view, facebook.send |

**Reglas:**
- Cada canal aparece en la multibandeja SOLO si el switch está activo
- Cada tenant selecciona qué usuarios gestionan cada canal
- Todos los mensajes identifican: quién envía, quién responde, timestamp, canal
- Web: la respuesta se envía al email que el cliente colocó en el formulario

---

## Arquitectura de Mensajería (Unificada)

Decisión arquitectónica:
- Tabla ÚNICA `conversations` con columna `channel` (no una tabla por canal)
- Tabla ÚNICA `messages` con `direction` y `sender_type`
- VENTAJAS: 1 query por multibandeja, fácil agregar canales, búsqueda global, reportes con GROUP BY
- MIGRACIÓN: `whatsapp_conversations` → `conversations` (en Fase 4.1)
- DEPRECAR: tablas viejas después de migrar

Esquema propuesto:

```sql
conversations (
  id, tenant_id, channel, channel_account,
  client_id, contact_name, contact_handle,
  last_message, last_message_at, unread_count,
  assigned_agent_id, status, metadata_json
)

messages (
  id, conversation_id, direction, sender_type, sender_id,
  sender_name, content, media_type, media_url, status,
  timestamp, metadata_json
)
```

---

## Decisiones Estratégicas Tomadas

Registra estas decisiones para no perderlas:

### Telegram
- Bot global de Ateendia (no por tenant)
- Vinculación con token PERMANENTE (no expira, solo revocable)
- Anti-spam: rate limit por tenant configurable por plan
- IA premium (planes Pro+)

### IA
- Proveedor: OpenRouter (multi-modelo)
- Diseño: 1 resumen por conversación (no por mensaje — control de costos)
- Feature premium (planes Pro+)

### Planes SaaS
- Tabla saas_plans editable por Super Admin
- Feature flags por plan (Telegram, IA, WhatsApp, etc.)
- Límites por plan (users, clients, msgs/día, IA tokens/mes)
- Tenants heredan límites de su plan

### Policies
- 13 tipos GLOBALES: Salud/ACA, Salud Privada, Vida, Dental/Visión, Auto, Hogar/Propiedad, Accidentes Personales, Gastos Médicos Mayores, Viaje, Responsabilidad Civil, Mascotas, Funerario, Indemnización
- Formularios dinámicos: campos comunes en columnas + específicos en JSON
- Catálogos: policy_types + policy_type_schemas
- Historial: tabla policy_versions
- Estados (8): Activa, En Proceso, Pendiente de Pago, Vencida, Cancelada, Renovada, Suspendida, En Revisión

### Retención
- Por plan: Starter 30d, Pro 1a, Enterprise ilimitado
- Media externa: Cloudflare R2 o S3

---

## Progreso del Proyecto

Documenta:

- Total estimado: ~40 sesiones
- Completadas: 23 sesiones
- Restantes: ~17 sesiones
- Progreso global: **~60%**

### Progreso por fase:

| Fase | Descripción | Progreso |
|------|-------------|----------|
| Fase 0 | Infraestructura | 100% ✅ |
| Fase 1 | Backend Base | 100% ✅ |
| Fase 2 | Clients | 100% ✅ |
| Fase 3.1-3.4 | Core CRM (Banking, Policies, Users, SMTP) | 100% ✅ |
| Fase 3.5.A | SaaS Plans Base | 100% ✅ |
| Fase 3.5.B | Landing + Registro + Demo | 100% ✅ |
| Fase 3.5.C-E | Pagos, Frontend SaaS, Límites | 0% ⏳ |
| Fase 4 | Multibandeja Unificada | 0% ⏳ |
| Fase 5 | IA + Automatizaciones | 0% ⏳ |
| Fase 6 | Analytics + Reportes | 0% ⏳ |
| Fase 7 | Producción | 0% ⏳ |

---

## Siguiente paso

**Próximo paso inmediato:**

Fase 3.5.B.4.e — Frontend pantalla de upgrade (consumir
POST /api/saas/upgrade desde el panel del tenant).

Alternativas si se prioriza otra cosa:
- Fase B.5 — Protección de saas_super_admin
- Evolution API nginx fix

---

## Reglas del Desarrollo

### Verificación doble
- Antes de responder, verificar cada dato técnico 2 veces.
- Cuando no se pueda verificar, decirlo explícitamente.
- Confiar en las herramientas (Prisma, `docker compose ps`, `information_schema`) antes que en el conteo mental.

### Commits al final de cada sesión
- git add → git commit → git push.
- Nunca dejar un commit sin push.

### Memory Bank al final de cada fase
- Actualizar AGENTS.md con cada fase completada.
- Registrar decisiones tomadas.

---

## Sesión 3.5.B.2 — Landing Configurable (2026-10-01)

### Resumen de Cambios

#### Base de Datos
- Nueva columna `landing_config_json TEXT NULL` en tabla `saas_platform_settings`
- Total: 24 tablas en MariaDB (sin cambios en este número)
- Schema Prisma: 24 modelos, `landing_config_json` agregado al modelo `saas_platform_settings`

#### Backend Nuevo
- `server/types/landing.ts` — Tipos backend: LandingHero, LandingFeature, LandingTestimonial, LandingFooter, SaasLandingConfig
- `server/services/saasLandingService.ts` — Servicio con:
  - `getLandingConfig()` — Lee JSON de DB, parsea, normaliza, devuelve default si vacío
  - `updateLandingConfig(config)` — Normaliza, guarda como JSON string
  - `normalizeLandingConfig(input)` — Valida cada campo con type guards
  - `getDefaultLandingConfig()` — Devuelve el default
- `server/routes/saas/landing.ts` — Sub-router con:
  - `GET /api/saas/landing` (público, sin auth)
  - `PUT /api/saas/landing` (protegido: JWT + rol saas_super_admin + auditLog)

#### Backend Modificado
- `server/routes/saas.ts` — Importa `landingRouter` desde './saas/landing.js' y lo monta con `saasRouter.use('/landing', landingRouter)` al final del archivo (después de la declaración de saasRouter para evitar error "usar antes de declarar")

#### Frontend
- `src/types/index.ts` — Tipos frontend agregados al final: LandingHero, LandingFeature, LandingTestimonial, LandingFooter, SaasLandingConfig

#### SQL
- `schema.mariadb.sql` — Columna `landing_config_json TEXT NULL` agregada a `saas_platform_settings` (después de platform_name)

### Estructura de la Configuración Landing
```json
{
  "hero": { "title", "subtitle", "ctaText", "ctaLink", "backgroundImage" },
  "features": [{ "icon", "title", "description" }],
  "testimonials": [{ "name", "company", "text", "avatarUrl" }],
  "footer": { "email", "whatsapp", "social": { "twitter", "linkedin", "facebook", "instagram" } }
}
```

### Decisiones Arquitectónicas
- **Sub-router en lugar de router separado** — Se monta landingRouter DENTRO de saasRouter (no en index.ts) para mantener cohesión del dominio SaaS.
- **Named exports** — Se usa `export const landingRouter = Router();` en lugar de `export default router` para consistencia con el resto del proyecto.
- **Import desde barrel file** — Se importa desde `../../middleware/index.js` (no path directo a audit.js) para seguir el patrón del proyecto.
- **Validación inline de rol** — Se valida `req.user.role !== 'saas_super_admin'` inline porque `requirePlatformUser` NO existe en el middleware actual. TODO: Crear `requirePlatformUser` en `middleware/rbac.ts` cuando se necesite en más rutas.
- **Type guards en lugar de Zod** — Para la config de landing se usan type guards manuales (`isValidHero`, `isValidFeature`, etc.) en lugar de Zod, porque la estructura es flexible y queremos que campos faltantes caigan al default sin error 400.

### Verificaciones
- ✅ `npx tsc --noEmit -p server/tsconfig.json` limpio
- ✅ `GET /api/saas/landing` devuelve JSON con config default (hero, features, testimonials, footer)
- ✅ `PUT /api/saas/landing` sin token devuelve `{"success":false,"error":"Token de autenticación requerido","code":"AUTH_TOKEN_MISSING"}`

### Commit
- Hash: `2bf6f13`
- Mensaje: `"feat(saas): Sesión 3.5.B.2 - Landing Configurable"`
- 7 archivos cambiados, 330 inserciones, 1 eliminación
- Push: `6916c0d..2bf6f13 main -> main`

### Reglas Aprendidas en Esta Sesión
- **Windows + PowerShell + curl**: Para JSON complejo con `-d`, PowerShell rompe las comillas. Usar `Invoke-RestMethod` con hashtables + `ConvertTo-Json -Depth 5` O guardar en archivo temporal y usar `--data "@body.json"`.
- **EPERM al regenerar Prisma**: Siempre detener Express (Ctrl + C) antes de `npm run db:generate`, luego reiniciar con `npm run dev:api`.
- **tsc con pestaña "Problemas" de VS Code**: Los errores de cSpell (palabras "Unknown word") no son errores reales de TypeScript. Solo confiar en `npx tsc --noEmit -p server/tsconfig.json`.
- **Block-scoped variable usada antes de declarar**: Los `router.use()` deben ir DESPUÉS de la declaración `export const xRouter = Router()`. Los imports sí pueden ir arriba (hoisted).

---

## Sesión 3.5.B.3.a — Endpoint público POST /api/saas/register (2026-10-01)

### Commit
- Hash: `4774e46`
- Padre: `2bf6f13`
- Mensaje: `"feat(saas): Sesion 3.5.B.3.a - Endpoint publico POST /api/saas/register"`
- 8 archivos cambiados, 851 inserciones, 27 deleciones
- Push: `2bf6f13..4774e46 main -> main`

### Backend Nuevo
- `server/types/registration.ts` — Tipos backend del registro:
  - `RegistrationType` ('demo' | 'payment')
  - `BillingCycle` ('monthly' | 'yearly')
  - `RegistrationStatus` ('pending' | 'approved' | 'rejected' | 'expired')
  - `RegisterRequestPayload` (payload del frontend)
  - `RegisterRequestMeta` (ipAddress, userAgent — capturados server-side)
  - `RegisterRequestResult` (requestId, expiresAt)
  - `NormalizedRegisterPayload` (snake_case listo para Prisma)

- `server/services/saasRegistrationService.ts` — Servicio con:
  - `normalizeRegistrationPayload(input, meta)` — sanitiza, hashea password con bcrypt, calcula expires_at (+7 días)
  - `checkDuplicateRequest(email, taxId)` — anti-spam (mismo email o tax_id pendiente)
  - `createRegistrationRequest(input, meta)` — normaliza, verifica duplicados, inserta, devuelve resultado minimalista
  - `RegistrationValidationError` — error de dominio
  - Decisiones de seguridad: password del admin NO se transfiere al user creado al aprobar; se generará password temporal en 3.5.B.3.b

- `server/routes/saas/register.ts` — Sub-router público:
  - `POST /api/saas/register`
  - Rate limiting: 5 requests / 15 min por IP (express-rate-limit 7.4.1)
  - Validación con Zod (schema con `.strict()` anti-injection)
  - Captura server-side de `ip_address` y `user_agent`
  - Respuesta minimalista anti-enumeración
  - Error handler con 400 (Zod/dominio) y 429 (rate limit)

### Backend Modificado
- `server/routes/saas.ts` — Agregado import y mount:
  ```ts
  import { registerRouter } from './saas/register.js';
  // ...
  saasRouter.use('/register', registerRouter);
  ```
- `server/types/landing.ts` — RENOMBRADO `SaasLandingConfig` → `SaasLandingContentConfig` (para resolver colisión con el `SaasLandingConfig` del CMS Super Admin).
- `server/services/saasLandingService.ts` — Actualizado el tipo en todas las referencias.

### Frontend Modificado
- `src/types/index.ts`:
  - Agregados tipos del registro: `BillingCycle`, `RegisterRequestPayload`, `RegisterRequestResult`, `RegisterResponse`, `RegisterErrorResponse`.
  - Renombrada la segunda interface `SaasLandingConfig` (línea ~1330) → `SaasLandingContentConfig`.
  - Reutiliza `SaasRegistrationType` y `SaasRegistrationStatus` existentes (evita duplicación).

### Decisiones Arquitectónicas Tomadas en Esta Sesión
1. **Anti-enumeración en registro público:**
   - Si el email ya existe como pending, el endpoint devuelve 201 igual con un requestId fake que empieza con `dup_`.
   - NO se devuelve 409 Conflict para evitar revelar al atacante qué emails están registrados.

2. **Password del admin NO se transfiere:**
   - El usuario tipea un password en el formulario, pero NO se guarda en claro.
   - Se hashea con bcrypt (60 chars, 10 rounds) y se guarda en `admin_password_hash` como defensa en profundidad.
   - Al aprobar (3.5.B.3.b), se generará un password temporal nuevo y se marcará `must_reset_password`.
   - El password original se descarta tras el hasheo.

3. **Rate limiting quirúrgico:**
   - Solo en POST /api/saas/register (5 req / 15 min por IP).
   - NO en toda la API.
   - Instalado `express-rate-limit@7.4.1` (ya estaba en package.json).

4. **Colisión SaasLandingConfig resuelta:**
   - Había DOS interfaces con el mismo nombre en `src/types/index.ts`:
     - Línea ~886: CMS completo del Super Admin (crmName, heroBadge, pricingPlans).
     - Línea ~1330: config de contenido del backend 3.5.B.2 (hero, features, footer).
   - La #2 se renombró a `SaasLandingContentConfig`.
   - La #1 se mantiene como `SaasLandingConfig`.
   - Arrastrada desde 3.5.B.2 (no detectada hasta ahora).

### Verificaciones
- ✅ `npx tsc --noEmit -p server/tsconfig.json` limpio (backend)
- ✅ `npm run lint | Select-String "src/types/index.ts"` limpio (frontend, colisión resuelta)
- ✅ Prueba 1: POST válido demo → 201 con requestId uuid real
- ✅ Prueba 2: POST inválido → 400 (Zod rechaza)
- ✅ Prueba 3: POST duplicado → 201 con requestId dup_* (anti-enumeración funcionando)
- ✅ Prueba 4: rate limit → 429 después del 5to request (verificado)
- ✅ Prueba 5: SELECT en DB → 2 filas insertadas, hashes bcrypt de 60 chars, expires_at +7 días
- ✅ Prueba 6: ip_address = ::1, user_agent capturado (server-side)

### Deuda Técnica Detectada (registrar para futura sesión)
299 errores de lint en el frontend (preexistentes, NO bloqueantes):

- `src/context/TenantContext.tsx` — 12 errores (tagline, clientCategories, policyTypes no existen en TenantBranding)
- `src/services/databaseService.ts` — 35 errores (usa prisma.tenant/user/client singular en lugar de plural)
- `src/services/evolutionApi.ts` — 17 errores (propiedades sobre unknown)
- `src/services/smtpService.ts` — 10 errores (propiedades sobre unknown)
- `src/services/whatsAppCloudService.ts` — 8 errores
- Legacy functions/api/* — 16 errores (archivos por eliminar)
- Otros ~200 errores varios en componentes y servicios

**Archivos legacy por eliminar (sin commitear):**
- `functions/` (Cloudflare Workers legacy, AGENTS.md dice "por eliminar")
- `prisma.old/` (schema viejo)
- `schema.sql.old`, `seed.sql` (SQLite/D1 legacy)
- `src/index.ts` (entrypoint Cloudflare Worker legacy)
- `src/lib/` (probablemente prisma.ts legacy)
- `src/services/databaseService.ts` (DatabaseService legacy con naming incorrecto)
- `MIGRATION_GUIDE.md` (obsoleto: documenta migración D1→MariaDB ya completada)
- 35 archivos modificados sin commitear en src/components/*, src/services/*, src/context/*, .kilo/kilo.jsonc, tsconfig.json — investigar en sesión dedicada.

**Lecciones aprendidas sesión 3.5.B.3.b (agregar a deuda técnica):**
1. **Bug encoding PowerShell + Invoke-RestMethod:** Los acentos se guardan como EFBFBD (U+FFFD) en DB. NO es bug de producción (frontend fetch envía UTF-8 bien). Solución: usar `[System.Text.Encoding]::UTF8.GetBytes($json)` + `-Body $bytes -ContentType "application/json; charset=utf-8"`, o Postman/navegador.
2. **PowerShell no soporta '<' para redirección stdin:** Solución A: `Get-Content archivo.sql -Raw | docker compose exec -T ...` Solución B: `cmd /c "docker compose exec -T mariadb ... < archivo.sql"`
3. **MariaDB post-crash inconsistente:** docker exec funciona, pero desde host falla con P1017 / "Server has closed the connection". Solución: `docker compose restart mariadb` (no borra datos).

---

## Sesión 3.5.B.3.b — Panel Super Admin aprobar/rechazar registros (2026-10-02)

### Resumen de Cambios

#### Commit
- Hash: `161f381`
- Padre: `4774e46`
- Mensaje: `"feat(saas): Sesion 3.5.B.3.b - Panel Super Admin aprobar/rechazar registros"`
- 6 archivos cambiados, 802 inserciones(+), 3 eliminaciones(-)
- Push: `4774e46..161f381 main -> main`

#### Archivos Nuevos
- `server/services/saasRegistrationReviewService.ts` (~520 líneas)
- `server/routes/saas/registrations.ts` (~230 líneas)

#### Archivos Modificados
- `server/middleware/rbac.ts` (+47: función requirePlatformUser)
- `server/middleware/index.ts` (+1: export requirePlatformUser)
- `server/prisma/schema.prisma` (+1: campo must_reset_password en users)
- `server/routes/saas.ts` (+13/-3: import + mount registrationsRouter)

#### Base de Datos
- Nueva columna: `users.must_reset_password TINYINT(1) NOT NULL DEFAULT 0`
- Ubicación: entre `password_hash` y `role`

#### Endpoints Nuevos (3)
- `GET  /api/saas/registrations?status=<pending|approved|rejected|expired|all>`
- `POST /api/saas/registrations/:id/approve`  body: `{ notes?: string }`
- `POST /api/saas/registrations/:id/reject`   body: `{ reason: string }`
- Todos requieren `requireAuth` + `requirePlatformUser`
- Total endpoints del proyecto: 50 (era 46)

#### Servicio saasRegistrationReviewService.ts — FUNCIONES
- `generateSlug(name)`: normaliza NFD, elimina acentos, lowercase, colapsa guiones, trim. Devuelve slug listo para subdominio.
- `findUniqueSubdomain(companyName)`: genera slug + maneja 48 reservados + colisiones (sufijo -2, -3, ..., hasta 100 intentos).
- `generateTempPassword()`: 16 chars base64url con randomBytes.
- `expireStaleRegistrations()`: `UPDATE saas_registration_requests SET status='expired' WHERE status='pending' AND expires_at < NOW()`.
- `listRegistrations(filters)`: lazy check + query paginada en Promise.all (findMany + count) + DTO limpio (sin hashes ni metadata interna).
- `approveRegistration(id, reviewerUserId, notes)`: TRANSACCIÓN ATÓMICA `prisma.$transaction()` que crea tenant + user admin + subscription y actualiza la request. Devuelve `{ requestId, tenantId, userId, subscriptionId, subdomain, tempPassword }`.
- `rejectRegistration(id, reviewerUserId, reason)`: marca como rejected, guarda rejection_reason. NO crea tenant.
- `RegistrationReviewError`: clase con code + statusCode para mapeo HTTP.

#### Decisiones Tomadas en Esta Sesión
1. **Password del admin del registro NO se transfiere al user creado.** Se genera uno temporal nuevo + `must_reset_password=1`.
2. **Slug auto-generado desde company_name** con 48 reservados y desambiguación numérica (-2, -3, ...).
3. **Lazy check de expiración**: sin cron en MVP. Se ejecuta al listar solicitudes.
4. **Transacción atómica**: si falla algún paso, se revierte todo.
5. **tenant_subscriptions.plan** usa plan_name denormalizado de la request (no requiere JOIN).
6. **tenant_subscriptions.plan_id** usa el plan_id real (FK).
7. **renewal_date** se calcula según billing_cycle (monthly=30d, yearly=365d).
8. **demo_expires_at = 14 días**. **grace_period_ends_at = 14+30 = 44 días**.

#### Middleware Nuevo
- `requirePlatformUser` en `server/middleware/rbac.ts`: valida que `req.user.role === 'saas_super_admin'`. Retorna 401 si no hay req.user (`AUTH_REQUIRED_BEFORE_PLATFORM_CHECK`) o 403 si el rol no coincide (`PLATFORM_USER_REQUIRED`). Síncrono (usa el rol del JWT, no consulta DB).

#### Pruebas End-to-End (7/7 exitosas)
- 5.1 Crear solicitud demo → requestId real + expiresAt +7d ✅
- 5.2 GET sin token → 401 AUTH_TOKEN_MISSING ✅
- 5.3 GET con token → DTO limpio sin hashes ✅
- 5.4 POST /approve → 200 con tenantId, userId, subscriptionId, subdomain, tempPassword ✅
- 5.5 Verificar transacción → tenant (status=demo, demo_expires_at=+14d, grace_period_ends_at=+44d) + user (role=tenant_admin, must_reset_password=1) + subscription (plan=DEMO, plan_id=plan-demo, renewal_date=+30d) ✅
- 5.5.5 Comparación HEX hashes: hash_request ≠ hash_user (son_iguales=0) ✅
- 5.6 POST /reject → status=rejected, created_tenant_id=NULL ✅
- 5.7 Lazy check expiración → expiredCount=1, status cambió de pending a expired ✅

#### Lecciones Aprendidas / Deuda Técnica (para sección deuda técnica)
1. **Bug encoding en pruebas con PowerShell + Invoke-RestMethod:**
   - Los acentos se guardan como EFBFBD (U+FFFD) en DB.
   - NO es bug de producción (frontend fetch envía UTF-8 bien).
   - Solución para pruebas: usar `[System.Text.Encoding]::UTF8.GetBytes($json)` + `-Body $bytes -ContentType "application/json; charset=utf-8"`, o Postman/navegador.
2. **PowerShell no soporta '<' para redirección stdin:**
   - Solución A: `Get-Content archivo.sql -Raw | docker compose exec -T ...`
   - Solución B: `cmd /c "docker compose exec -T mariadb ... < archivo.sql"`
3. **MariaDB puede quedar en estado inconsistente post-crash:**
   - Síntoma: docker exec funciona, pero desde host Windows todo falla con P1017 / "Server has closed the connection".
   - Solución: `docker compose restart mariadb` (no borra datos).

#### Verificaciones
- ✅ `npx tsc --noEmit -p server/tsconfig.json` limpio
- ✅ 7/7 pruebas end-to-end exitosas (ver detalle arriba)

#### Reglas Aprendidas en Esta Sesión
1. **PowerShell + UTF-8 en Invoke-RestMethod:** El parámetro `-Body` con string no garantiza UTF-8. Usar bytes explícitos con `ContentType "application/json; charset=utf-8"`.
2. **Redirección stdin en PowerShell:** No soporta `< archivo`. Usar pipeline (`|`) o `cmd /c` como workaround.
3. **MariaDB post-crash:** Reiniciar solo el contenedor mariadb resuelve conexiones rotas desde host sin perder datos.

---

## Sesión 3.5.B.4.a.1 — Endpoint público de métodos de pago + seed (2026-10-05)

### Commit
- Hash: `b211673`
- Padre: `161f381`
- 3 archivos backend nuevos, 1 archivo frontend nuevo, 1 archivo modificado backend, 1 archivo modificado SQL

### Archivos Nuevos Backend
- `server/types/paymentMethod.ts` — Tipos backend: SaasPaymentMethod, PublicPaymentMethod, SaasPaymentMethodType (manual | crypto_semi_auto | automatic), PaymentProviderConfig, SaasPaymentMethodsPublicResponse
- `server/services/saasPaymentMethodsService.ts` — Servicio con:
  - `getPublicPaymentMethods()` — Lee de DB, filtra solo activos, mapea a DTO público (excluye provider_config_json y crypto_explorer_api)
  - `mapToPublicPaymentMethod(row)` — Type guard que valida y transforma cada fila
  - Decisión: type guards en lugar de Zod para tolerar campos opcionales faltantes sin error 400
- `server/routes/saas/paymentMethods.ts` — Sub-router público:
  - `GET /api/saas/payment-methods/public` (sin auth, rate limit no aplicado en MVP)
  - Named exports: `export const paymentMethodsRouter = Router();`

### Archivo Nuevo Frontend
- `src/services/registrationService.ts` — Servicio unificado de registro:
  - `fetchPlansPublic()` — GET /api/saas/plans/public
  - `fetchPaymentMethodsPublic()` — GET /api/saas/payment-methods/public
  - `submitRegistration(payload)` — POST /api/saas/register
  - Tipos discriminados: `RegistrationResult = RegistrationSuccess | RegistrationError`

### Archivo Modificado Backend
- `server/routes/saas.ts` — Importa y monta `paymentMethodsRouter`:
  ```ts
  import { paymentMethodsRouter } from './saas/paymentMethods.js';
  // ...
  saasRouter.use('/payment-methods', paymentMethodsRouter);
  ```

### Archivo Modificado SQL (Seed)
- `server/prisma/seeds/seedSaas.ts` — Seed de 3 métodos de pago en `saas_payment_methods`:
  1. **Zelle** — `type: 'manual'`, `provider: 'zelle'`, requires_proof=true, sort_order=1
  2. **USDT TRC-20** — `type: 'crypto_semi_auto'`, `provider: 'usdt_trc20'`, crypto_explorer_api=trongrid, requires_proof=true, sort_order=2
  3. **Stripe** — `type: 'automatic'`, `provider: 'stripe'`, provider_config_json con webhook_secret_ref, requires_proof=false, sort_order=3

### Endpoint Nuevo
- `GET /api/saas/payment-methods/public` — Público, sin autenticación
- Respuesta: `{ success: true, data: PublicPaymentMethod[] }`
- DTO `PublicPaymentMethod` incluye solo: id, name, type, provider, description, icon_url, requires_proof, sort_order
- **Excluye deliberadamente:** provider_config_json, crypto_explorer_api (datos sensibles de configuración)

### Decisiones Arquitectónicas
- **Sub-router dentro de saasRouter** — Montado como `/payment-methods` para cohesión del dominio SaaS
- **Named exports** — Consistencia con `landingRouter` y `registerRouter`
- **Type guards en servicio** — Valida estructura de cada fila, campos faltantes → undefined (no error)
- **DTO público explícito** — Separación clara entre modelo interno y API pública
- **Resultado discriminado en frontend** — `RegistrationResult = { success: true, data: ... } | { success: false, error: ... }` para type-safe handling

### Verificaciones
- ✅ `npx tsc --noEmit -p server/tsconfig.json` limpio
- ✅ `GET /api/saas/payment-methods/public` devuelve 3 métodos con estructura correcta
- ✅ Frontend compila sin errores nuevos en tipos relacionados

### Deuda Técnica Detectada
- `src/services/databaseService.ts` — 35 errores de lint (usa `prisma.tenant/user/client` singular en lugar de plural)
- `src/context/TenantContext.tsx` — 12 errores (tagline, clientCategories, policyTypes no existen en TenantBranding)
- Archivos legacy sin commitear: 35 archivos M en src/components/*, src/services/*, src/context/*, .kilo/kilo.jsonc, tsconfig.json

---

## Sesión 3.5.B.4.a.2 — Frontend RegisterForm + integración App (2026-10-05)

### Commit
- Hash: `9fa1aba`
- Padre: `b211673`
- 6 archivos cambiados: 1120 inserciones, 7 eliminaciones

### Archivos Frontend Nuevos (3)
- `src/components/auth/RegisterForm.tsx` (~690 líneas) — Formulario principal de registro:
  - Toggle visual entre modo **Demo** y **Pago** (radio buttons con estilos distinctos)
  - Carga de catálogos SIEMPRE al montar (`useEffect` vacío): planes (`fetchPlansPublic`) + métodos de pago (`fetchPaymentMethodsPublic`)
  - Modo Demo: selecciona automáticamente plan DEMO (gratis), oculta campos de pago
  - Modo Pago: muestra selector de plan (Starter $29, Pro Business $79 ★, Enterprise $199), billing cycle (mensual/anual), selector de método de pago
  - Auto-reset de campos condicionales al cambiar modo (plan, billing_cycle, payment_method_id)
  - Validación client-side complementaria (required, email, longitud, coincidencia password)
  - Payload construido con spread condicional: `...(mode === 'payment' && { plan_id, billing_cycle, payment_method_id })`
  - Manejo de resultado discriminado con `Extract<typeof result, { success: false }>` para type-narrowing del error
  - Estados: loading, error, success → navega a RegisterSuccessView

- `src/components/auth/RegisterSuccessView.tsx` (~190 líneas) — Pantalla de éxito genérica:
  - Recibe `requestId` y `mode` (demo | payment) como props
  - Mensaje diferenciado: Demo → "Tu cuenta demo se está creando" / Pago → "Tu solicitud ha sido enviada"
  - **NO muestra detalles de pago** (comprobante, método, etc.) — esos van en email transaccional futuro (3.5.B.4.g)
  - Botón "Volver al login" + link para consultar estado (placeholder 3.5.B.4.b)
  - localStorage pendiente para persistir requestId entre sesiones

- `src/components/auth/RegisterView.tsx` (~58 líneas) — Wrapper simple:
  - Renderiza RegisterForm o RegisterSuccessView según estado local `view: 'form' | 'success'`
  - Recibe `onSuccess(requestId, mode)` callback

### Archivos Frontend Modificados (3)
- `src/App.tsx`:
  - Nuevo estado `authView: 'login' | 'register'`
  - Render condicional: `authView === 'login' ? <LoginView onGoToRegister={...} /> : <RegisterView onBackToLogin={...} />`

- `src/components/auth/LoginView.tsx`:
  - Nueva prop `onGoToRegister: () => void`
  - Link "¿No tenés cuenta? **Registrate gratis**" que dispara el callback

- `src/types/index.ts` — Tipos agregados al final:
  - `SaasPlanFeatures` — feature flags del plan (whatsapp, telegram, instagram, facebook, ai, webhooks, bulk_import, landing_page)
  - `SaasPlanPublic` — plan público (id, key, name, description, price_monthly, price_yearly, limits, features, sort_order, is_popular)
  - `SaasPlansPublicResponse` — `{ success: true, data: SaasPlanPublic[] }`
  - `SaasPaymentMethodType` — reutilizado: `'manual' | 'crypto_semi_auto' | 'automatic'`
  - `PublicPaymentMethod` — espejo exacto del DTO backend (id, name, type, provider, description, icon_url, requires_proof, sort_order)
  - `PublicPaymentMethodsResponse` — `{ success: true, data: PublicPaymentMethod[] }`

### Decisiones Arquitectónicas
- **Espejo exacto del DTO backend** — Tipos frontend clonan estructura de `PublicPaymentMethod` y `SaasPlanPublic` para type-safety end-to-end
- **Carga de catálogos siempre al montar** — Incluso en modo Demo se cargan planes y métodos (demo necesita plan DEMO para submit)
- **Toggle demo/payment con auto-reset** — Al cambiar modo, se limpian campos irrelevantes (plan_id, billing_cycle, payment_method_id)
- **Payload con spread condicional** — `...(mode === 'payment' && { plan_id, billing_cycle, payment_method_id })` evita enviar campos undefined
- **Validación client-side complementaria** — Backend valida con Zod `.strict()`; frontend da feedback inmediato
- **Manejo de resultado discriminado** — `Extract<typeof result, { success: false }>` permite type-narrowing seguro del error
- **RegisterSuccessView genérica** — No muestra detalles de pago; email transaccional futuro (3.5.B.4.g) llevará comprobante e instrucciones
- **localStorage pendiente** — Para persistir requestId y permitir consultar estado tras recarga (3.5.B.4.b)

### Verificaciones
- ✅ `npm run lint 2>&1 | Select-String "src/types/index.ts|RegisterForm|RegisterSuccessView|RegisterView"` → 0 errores nuevos
- ⚠️ Errores preexistentes en `App.tsx:84` (useEffect retorna `() => boolean`) y `LoginView.tsx` (props `requires2FA`, `resendOtp`, `requestPasswordReset`, `confirmPasswordReset` no usadas) → **DEUDA TÉCNICA registrada** (features pendientes de `routes/auth.ts`)
- ✅ Prueba end-to-end EXITOSA:
  - Backend vivo: `GET /api/health` → status ok
  - LoginView muestra link "Registrate gratis"
  - Navegación a RegisterForm funciona
  - Toggle demo/payment funciona
  - Planes cargan desde backend: Starter $29, Pro Business $79 (popular), Enterprise $199
  - Métodos de pago cargan: Zelle, USDT TRC-20, Stripe
  - Submit demo → RegisterSuccessView con requestId real
  - DB verifica: solicitud en `saas_registration_requests` con `status='pending'`

### Archivos Legacy Pendientes de Eliminar
- `functions/` (Cloudflare Workers legacy)
- `prisma.old/`
- `schema.sql.old`
- `seed.sql`
- `src/index.ts`
- `src/lib/`
- `src/services/databaseService.ts`
- `MIGRATION_GUIDE.md`
- 35 archivos M preexistentes en `src/components/*`, `src/services/*`, `src/context/*`
- **Nota:** NO se commitean en cada sub-fase. Sesión dedicada de cleanup.

### Nota para 3.5.B.4.b y 3.5.C (visión del usuario sobre flujos de pago)
Los métodos de pago tienen TRES flujos diferenciados, y el panel Super Admin debe soportarlos todos:

**Automático (Stripe, PayPal):**
- Webhook confirma el pago sin intervención humana.
- El sistema crea el tenant + user + subscription automáticamente.
- **BOTÓN MANUAL DE RESPALDO:** si por algún error (webhook falló, pago rechazado, etc.) el acceso quedó NO habilitado pero el pago sí se completó, el Super Admin debe poder habilitar el acceso manualmente desde el panel.
- El panel debe mostrar: datos del nuevo usuario, datos de la empresa, método de pago, comprobante (ID de transacción de Stripe), estatus, y botón "Otorgar acceso".

**Semi-automático (Trust Wallet, USDT, crypto):**
- El usuario envía el pago a la wallet y pega el tx_hash.
- El sistema verifica automáticamente el hash contra la blockchain (explorer API).
- Si la verificación es exitosa: mismo flujo que automático.
- Si la verificación falla o es ambigua: pasa a revisión manual.
- **BOTÓN MANUAL DE RESPALDO:** idéntico al caso automático.

**Manual (transferencias, Zelle, pago móvil):**
- El usuario sube el comprobante (imagen/PDF).
- El sistema NO verifica automáticamente.
- El Super Admin revisa el comprobante manualmente.
- **BOTÓN MANUAL:** "Otorgar acceso" tras validar el pago.

**Regla unificada para el panel Super Admin:**
TODOS los métodos de pago deben llegar al panel Super Admin con el mismo formato de tarjeta:
- Datos del nuevo usuario (nombre, email, teléfono)
- Datos de la empresa (nombre, tax ID, email, teléfono, país, ciudad)
- Método de pago empleado (Zelle / USDT / Stripe)
- Comprobante (imagen, PDF, o tx_hash según método)
- Estatus (pending / approved / rejected / expired)
- Botón "Otorgar acceso" (visible para todos los métodos, para casos de respaldo donde el flujo automático falló)

Esto aplica a 3.5.C (Pagos, Verificación, Suspensión) y debe reflejarse en:
- El diseño del modelo `saas_registration_requests` (ya soporta comprobante y status).
- El servicio `saasRegistrationReviewService` (ya tiene `approveRegistration` y `rejectRegistration`).
- El endpoint de listado `GET /api/saas/registrations` (ya soporta filtros por status).
- El frontend del panel Super Admin (que se hará en 3.5.D).

**Nota adicional para 3.5.B.4.b:** cuando implementemos la página pública de consulta de estado, debemos tener en cuenta que el usuario puede ver:
- `pending`: "en revisión"
- `approved`: "aprobado, revisá tu email"
- `rejected`: "no aprobado" (con motivo genérico, sin exponer detalles internos)
- `expired`: "expirado"
Pero NO debe ver detalles del comprobante ni notas internas del revisor.

---

## Sesión 3.5.B.4.b — Página pública de consulta de estado (2026-10-06)

### Commit
- Hash: `92ee6f0`
- Padre: `9fa1aba`
- Mensaje: `"feat(saas): Sesion 3.5.B.4.b - Pagina publica de consulta de estado de solicitud"`
- 10 archivos cambiados, 1059 inserciones(+), 9 eliminaciones(-)
- Push: `9fa1aba..92ee6f0 main -> main`

### Archivos (10)
1. `server/middleware/rateLimiters.ts` (+80 líneas) — Middleware de rate limiting por IP configurable (createRateLimiter, rateLimiterMiddleware, presets para register/statusCheck/saasAdmin)
2. `server/routes/saas/registrationStatus.ts` (+114 líneas) — Sub-router público: `GET /api/saas/registrations/:requestId/status` (sin auth, rate limit 10 req/15min)
3. `server/routes/saas.ts` (+18/-1) — Import y mount de `registrationStatusRouter`
4. `server/services/saasRegistrationService.ts` (+96 líneas) — Nueva función `getRegistrationStatus(requestId)` que lee request, mapea status a label user-facing, valida requestId UUID, maneja not found
5. `server/types/registration.ts` (+102 líneas) — Tipos backend: `RegistrationStatusResponse`, `RegistrationStatus` (pending/approved/rejected/expired), `RegistrationStatusLabel` map, `RegistrationStatusLabels` tipo
6. `src/components/auth/CheckStatusModal.tsx` (+410 líneas) — Modal accesible con animaciones Motion, estados: pending/approved/rejected/expired, rate limit handling, accessible (ARIA, focus trap, Escape para cerrar)
7. `src/components/auth/LoginView.tsx` (+28/-1) — Link "Consultar estado de solicitud" abre CheckStatusModal
8. `src/components/auth/RegisterSuccessView.tsx` (+11/-1) — Link "Consultar estado" abre CheckStatusModal con requestId pre-cargado
9. `src/services/registrationService.ts` (+132/-1) — Nueva función `fetchRegistrationStatus(requestId)` para consumir endpoint público, tipos `RegistrationStatusResponse`
10. `src/types/index.ts` (+77/-1) — Tipos frontend: `RegistrationStatusResponse`, `RegistrationStatusLabel` map, reutiliza `SaasRegistrationStatus`

### Funcionalidades Implementadas
- **Endpoint público sin autenticación**: GET /api/saas/registrations/:requestId/status
- **Rate limiting**: 10 requests por 15 minutos por IP (configurable via `rateLimiters.ts`)
- **Mapeo de estados a labels user-facing**:
  - `pending` → "En revisión"
  - `approved` → "Aprobado, revisá tu email"
  - `rejected` → "No aprobado"
  - `expired` → "Expirado"
- **CheckStatusModal**: Modal reutilizable con animaciones (Motion), accesibilidad completa (ARIA, focus management, keyboard navigation), manejo de rate limit (429), estados de carga/error
- **Integración en LoginView**: Link "Consultar estado de solicitud" abre modal vacío
- **Integración en RegisterSuccessView**: Link "Consultar estado" abre modal con requestId pre-cargado
- **Servicio frontend unificado**: `registrationService.fetchRegistrationStatus()` con tipos discriminados

### Decisiones Arquitectónicas
- **Rate limiter reutilizable**: `server/middleware/rateLimiters.ts` exporta `createRateLimiter` genérico + presets (`registerRateLimiter`, `statusCheckRateLimiter`, `saasAdminRateLimiter`) para uso futuro en otros endpoints públicos
- **Endpoint público sin auth**: No requiere JWT, usa requestId como token de acceso (UUID v4, 122 bits de entropía)
- **Type guards en backend**: `getRegistrationStatus` valida UUID y mapea status con type guards, no Zod (flexibilidad)
- **DTO público explícito**: `RegistrationStatusResponse` expone solo: `requestId`, `status`, `statusLabel`, `createdAt`, `expiresAt` (NO expone: email, company data, payment details, rejection_reason, notas internas)
- **Modal accesible**: CheckStatusModal implementa focus trap, ARIA roles, Escape key, animaciones Motion para entrada/salida
- **Integración lazy**: CheckStatusModal se importa dinámicamente solo cuando se necesita (code splitting)

### Verificaciones (10/10 pruebas end-to-end exitosas)
1. ✅ `GET /api/saas/registrations/<uuid-pending>/status` → 200, status=pending, label="En revisión"
2. ✅ `GET /api/saas/registrations/<uuid-approved>/status` → 200, status=approved, label="Aprobado, revisá tu email"
3. ✅ `GET /api/saas/registrations/<uuid-rejected>/status` → 200, status=rejected, label="No aprobado"
4. ✅ `GET /api/saas/registrations/<uuid-expired>/status` → 200, status=expired, label="Expirado"
5. ✅ `GET /api/saas/registrations/<uuid-inexistente>/status` → 404, error="Solicitud no encontrada", code="REGISTRATION_NOT_FOUND"
6. ✅ `GET /api/saas/registrations/<uuid-invalido>/status` → 400, error="requestId debe ser un UUID válido", code="INVALID_REQUEST_ID"
7. ✅ Rate limit: 11 requests en < 15 min → 429, error="Demasiadas consultas. Intentá de nuevo en 15 minutos.", code="RATE_LIMIT_EXCEEDED", retryAfter headers
8. ✅ LoginView: link "Consultar estado de solicitud" abre modal vacío → usuario ingresa requestId → consulta exitosa
9. ✅ RegisterSuccessView (demo): link "Consultar estado" abre modal con requestId pre-cargado → consulta exitosa
10. ✅ `npx tsc --noEmit -p server/tsconfig.json` limpio + `npm run lint` sin errores nuevos en archivos modificados

### Deuda Técnica Nueva
- **Email de soporte hardcodeado**: `support@ateendia.cloud` aparece en:
  - `src/components/auth/CheckStatusModal.tsx` (línea ~180, en estado approved)
  - `src/components/auth/RegisterSuccessView.tsx` (línea ~45, en mensaje de éxito pago)
- **Acción requerida**: Mover a `saas_platform_settings.support_email` y exponer vía endpoint público (ej. `GET /api/saas/platform-info`) en sub-fase 3.5.D (Frontend SaaS Central). Actualmente `saas_platform_settings` ya tiene el campo `support_email` (ver sección "Configuración Global").

### Notas para 3.5.B.4.c (Primer login con must_reset_password)
- El backend ya tiene `users.must_reset_password` (columna `TINYINT(1)` desde 3.5.B.3.b)
- El endpoint `POST /api/saas/registrations/:id/approve` ya genera password temporal y lo devuelve **UNA VEZ** en la respuesta (`tempPassword`)
- **Falta frontend**: Pantalla para forzar cambio de password en primer login (detectar `must_reset_password` en `/auth/me` o login response)
- **Falta backend**: Endpoint `POST /api/auth/change-initial-password` (validar password actual temporal + nuevo password + confirmación, limpiar `must_reset_password`)
- **Flujo esperado**: Usuario recibe tempPassword por email (3.5.B.4.g) → primer login → detecta must_reset_password → redirige a cambio obligatorio → posterior login normal

---

## Sesión 3.5.B.4.c — Primer login con must_reset_password (2026-10-11)

### Commit
- Hash: `7d370f0`
- Padre: `14017af`
- Mensaje: `"feat(auth): Sesion 3.5.B.4.c - Frontend primer login con must_reset_password"`
- 6 archivos cambiados, 1160 inserciones(+), 3829 eliminaciones(-)
- Push: `14017af..7d370f0 main -> main`

### Backend (commiteado en 14017af, sesión previa del mismo chat)
- **Nuevo endpoint**: POST /api/auth/change-initial-password (JWT protegido)
- **Login modificado**: ahora devuelve `mustResetPassword: boolean`
- **getCurrentUser modificado**: devuelve `mustResetPassword: boolean`
- **Nueva función** `changeInitialPassword()` en `server/services/authService.ts`
- **Nuevo tipo** `AuditAction 'UPDATE_PASSWORD'` en `server/services/auditService.ts`
- **Nuevo archivo** `server/types/auth.ts` con:
  - `LoginResponse`
  - `ChangeInitialPasswordPayload`
  - `ChangeInitialPasswordResponse`
- **Reglas de password nueva** (Zod):
  - Mínimo 6 caracteres
  - Al menos 1 mayúscula
  - Al menos 1 minúscula
  - Al menos 1 número
  - Al menos 1 carácter especial
  - Confirmación obligatoria (debe coincidir)

### Frontend
- **Nuevo archivo**: `src/components/auth/FirstLoginPasswordChangeView.tsx` (~318 líneas)
  - Formulario bloqueante tras primer login
  - Validación client-side espejo del backend (5 reglas)
  - Checklist en vivo
  - Botón "Cerrar Sesión" para abandonar el flujo
  - Redirige al dashboard al éxito
- **Modificado**: `src/components/auth/LoginView.tsx`
  - Adaptado al nuevo tipo discriminado `LoginResult`
  - `onLoginSuccess(mustResetPassword: boolean)` en la firma
  - Stubs para OTP/forgot/reset (pendientes de backend real)
- **Modificado**: `src/services/authService.ts`
  - Migrado a `/api/auth/login` (Express) con fallback a DEMO_USERS
  - Nuevo método `changeInitialPassword()`
  - Estado extendido con `mustResetPassword`
  - Persistencia del flag en localStorage
- **Modificado**: `src/App.tsx`
  - Nuevo `authView: 'firstLoginPasswordChange'`
  - Render condicional: primero `authView`, después `isAuthenticated`
  - `handleLoginSuccess(mustResetPassword)` con redirección
  - `useEffect` con deps `[]` para evitar re-ejecuciones
- **Modificado**: `src/context/TenantContext.tsx`
  - `useCallback` en `setCurrentTenant`, `setCurrentUser`, `setCurrentTenantId`, `logoutUser`
  - `useCallback` en `fetchClients`, `fetchPolicies`
  - Nuevo `currentTenantIdRef` para evitar deps cíclicas
  - Fix del bucle infinito "Maximum update depth exceeded"
- **Modificado**: `src/types/index.ts`
  - `AuditLogEntry.action` incluye `'UPDATE_PASSWORD'`
  - `AuditLogEntry.module` incluye `'Autenticación'`
  - Tipos: `AuthLoginUser`, `AuthLoginResponse`, `AuthLoginResult`,
    `ChangeInitialPasswordPayload`, `ChangeInitialPasswordResponse`,
    `ChangeInitialPasswordErrorResponse`, `ChangeInitialPasswordResult`

### Flujo end-to-end
1. Usuario aprobado por Super Admin (fase 3.5.B.3.b) recibe `tempPassword` por email
2. Login con `tempPassword` → backend devuelve `mustResetPassword: true`
3. Frontend redirige a `FirstLoginPasswordChangeView`
4. Usuario ingresa tempPassword + nueva + confirmar
5. Backend valida, hashea, actualiza `password_hash`, setea `must_reset_password = 0`
6. Audit log `UPDATE_PASSWORD` registrado
7. Frontend redirige al dashboard
8. Próximo login NO pide cambio

### Decisiones arquitectónicas
1. **Reglas password**: min 6, mayúscula, minúscula, número, especial.
2. **JWT NO se regenera** tras el cambio (sigue válido).
3. **Endpoint vive en `server/routes/auth.ts`** (cohesión del dominio auth).
4. **`UPDATE_PASSWORD` como AuditAction propio** (Opción A confirmada).
5. **Fix del bucle infinito** con `useCallback` + `useRef` en TenantContext.
6. **Render condicional** en App.tsx: `authView` debe chequearse ANTES de `isAuthenticated` para el flujo de must_reset_password.

### Verificaciones (6/6 exitosas)
1. ✅ Login con `must_reset_password=1` devuelve `mustResetPassword: true`
2. ✅ Cambio con currentPassword incorrecta → 401 INVALID_CURRENT_PASSWORD
3. ✅ Cambio con newPassword débil → 400 VALIDATION_ERROR
4. ✅ Cambio con datos válidos → 200 + message
5. ✅ Login con nueva contraseña → `mustResetPassword: false`
6. ✅ Cambio cuando `must_reset_password=0` → 400 PASSWORD_ALREADY_SET
7. ✅ DB: `must_reset_password` 1 → 0, `password_hash` de 60 chars
8. ✅ Audit log `UPDATE_PASSWORD` + `module: Autenticación`
9. ✅ Frontend: validación en vivo funciona
10. ✅ Frontend: redirección al dashboard tras éxito
11. ✅ Fix del bucle infinito (no más "Maximum update depth exceeded")

### Deuda técnica NUEVA detectada
- **SMTP transaccional pendiente**: el `tempPassword` se devuelve UNA VEZ
  en el response del endpoint `/approve`. En producción debe enviarse por
  email. Planificado para sub-fase 3.5.B.4.g.
- **2FA + forgot/reset password**: el `LoginView` tiene stubs que devuelven
  "no disponible todavía". Pendientes de backend real + SMTP transaccional.

### Deuda técnica preexistente detectada (NO bloqueante)
- **6 pantallas en blanco** por props faltantes en TenantContext:
  - Clientes (DDD) — bug charAt en ClientsListView.tsx:285
  - Central Telefónica Issabel — issabelConfig, callRecords, etc.
  - Campañas & Reportes — props faltantes
  - Integraciones — props faltantes
  - Roles & Permisos (RBAC) — roles, inviteUser, toggleUserStatus
  - Auditoría Inmutable — auditLogs
  - **Acción**: sesión dedicada de "Fix de pantallas en blanco" (Opción A — stubs)
- **12 errores TS en TenantContext.tsx** (tagline, clientCategories, policyTypes)
- **35 errores TS en databaseService.ts** (naming singular, por eliminar)
- **31 archivos M preexistentes** + ~9 legacy sin commitear
- **`audit_logs.timestamp`** (no `created_at`): corregir en doc AGENTS.md

### Lecciones aprendidas
1. **TypeScript no siempre hace narrowing** en uniones discriminadas complejas.
   Solución: comparaciones explícitas (`=== true`, `=== false`) en lugar de
   `if (result.success)`.
2. **useCallback + useRef** resuelven bucles infinitos de `useEffect` cuando
   las funciones del contexto se recrean en cada render.
3. **Render condicional en App.tsx**: el orden importa. `authView` debe
   chequearse ANTES de `isAuthenticated` para el flujo de must_reset_password.
4. **PowerShell + curl con JSON**: usar `Invoke-RestMethod` con bytes UTF-8
   para evitar corrupción de acentos.
5. **SQL con `$` en PowerShell**: usar heredoc `@'...'@ | Out-File -Encoding ascii`
   y ejecutar con `cmd /c "docker compose exec -T mariadb mariadb ... < archivo.sql"`.

   ---

## Sesión #20 — Fix Pantallas en Blanco (Bloque Base) — 2026-10-11

### Commit
- Hash: `a4e9ebe`
- Padre: `7d370f0`
- 3 archivos cambiados, 787 inserciones(+), 92 deleciones(-)
- Push: `7d370f0..a4e9ebe main -> main`

### Archivos Modificados
1. `src/types/index.ts` — interface `Role` agregada después de `ModuleKey`
2. `src/context/TenantContext.tsx` — reescrito con 16 stubs nuevos
3. `src/components/clients/ClientsListView.tsx` — fix bug `charAt`

### Stubs Agregados (16)
| Stub | Tipo | Componente que lo usa |
|------|------|----------------------|
| `startCall` | función | ClientsListView, IssabelModule |
| `startWhatsAppConversation` | función | ClientsListView |
| `issabelConfig` | objeto | IssabelModule |
| `updateIssabelConfig` | función | IssabelModule |
| `callRecords` | array | IssabelModule |
| `templates` | array | CampaignsModule |
| `createCampaign` | función | CampaignsModule |
| `roles` | array | UsersRolesModule |
| `updateRolePermissions` | función | UsersRolesModule |
| `inviteUser` | función | UsersRolesModule |
| `toggleUserStatus` | función | UsersRolesModule |
| `auditLogs` | array | AuditTrailModule |
| `n8nConfig` | objeto | IntegrationsModule |
| `updateN8nConfig` | función | IntegrationsModule |
| `aiConfig` | objeto | IntegrationsModule |
| `updateAiConfig` | función | IntegrationsModule |

### Pantallas Desbloqueadas (5/6)
- ✅ **Clientes (DDD)** — con bug `charAt` resuelto
- ✅ **Central Telefónica Issabel** — con form + CDR mock
- ✅ **Campañas & Reportes** — con 3 templates mock
- ✅ **Roles & Permisos (RBAC)** — con 4 roles base + matriz editable
- ✅ **Auditoría Inmutable** — con 2 eventos mock
- ❌ **Integraciones** — sigue en blanco (crash en `WhatsAppAccountsConfigSection`)

### Fix Bug `charAt`
- **Ubicación:** `ClientsListView.tsx:285`
- **Causa:** `client.firstName.charAt(0)` crasheaba si `firstName` era `undefined`/`null`
- **Solución:** guards defensivos (`safeFirstName`, `safeLastName`, `safeFullName`, `safeInitial`, `safePhone`, `safeEmail`, `safeCategory`, `safeStatus`)

### Deuda Técnica Registrada
1. **~40 stubs restantes** (documentados en prompt de traspaso del próximo chat)
2. **Cast `as unknown as TenantBranding`** en `normalizeTenantData`
   - **Causa:** `TenantBranding` no declara `tagline`, `clientCategories`, `policyTypes`
   - **Solución:** actualizar `TenantBranding` en sesión de cleanup de tipos
3. **30 archivos M preexistentes** sin commitear
4. **9 archivos legacy** sin trackear (`functions/`, `prisma.old/`, etc.)

### Próximo Paso
- **Sub-fase:** Fix Pantallas — Bloque Extendido (~40 stubs)
- **Prioridad 1:** WhatsApp + Instagram + Facebook (desbloquea Integraciones)
- **Prioridad 2:** Automatizaciones, Chat Interno, Auth 2FA, SaaS Extendido
- **Prioridad 3:** Clientes Extendido, Notificaciones, Pólizas, Pipeline, Templates
- Ver prompt de traspaso para detalle completo

### Lecciones Aprendidas
- **Diagnóstico inicial subestimó el alcance:** se pensaba 16 props faltantes, eran ~40.
- **Los tipos ya existían:** la mayoría de los tipos de dominio (`IssabelConfig`, `CallRecord`, `WhatsAppConfig`, etc.) ya estaban en `types/index.ts`. NO crear duplicados.
- **Cast doble** (`as unknown as X`) es la técnica estándar cuando el tipo destino no declara todos los campos que el origen sí tiene.
- **console.warn [STUB]** como TODO auto-documentado en runtime: buscar `[STUB]` en consola para saber qué falta conectar.

---

## Sesión #22 — Fase A (Kill Switch WhatsApp) + Fase B (Fix Sidebar por Rol)
Fecha: 2026-10-12

### Commit 1: 07ffaad — Kill Switch WhatsApp
- Padre: a4e9ebe
- Mensaje: "fix(integraciones): cortar bucle infinito de WhatsApp Socket.io"
- 3 archivos cambiados, +797 inserciones, -70 eliminaciones
- Push: a4e9ebe..07ffaad main -> main

### Commit 2: e3e7de9 — Fix Sidebar por Rol (Fase B)
- Padre: 07ffaad
- Mensaje: "feat(sidebar): Fase B - Fix sidebar por rol + reorganizacion grupos"
- 3 archivos cambiados, +113 inserciones, -27 eliminaciones
- Push: 07ffaad..e3e7de9 main -> main

### Logros Fase A — Kill Switch WhatsApp

**Problema:** Bucle infinito de errores WebSocket (49,000+ errores y subiendo)
que congelaba el equipo al abrir la pantalla de Integraciones.

**Causa raíz:**
- El contenedor Evolution API crashea por bug de nginx interno:
  `nginx: [emerg] invalid value "must-revalidate" in /etc/nginx/conf.d/nginx.conf:11`
- El frontend intentaba conectar a `/socket.io/` cada 5 segundos (2 setInterval).
- Cada intento fallaba con error WebSocket y spameaba la consola.

**Solución aplicada:**
1. `.env.local`: agregar alias `VITE_WHATSAPP_API_URL=http://localhost:8080`
   (el código busca `VITE_WHATSAPP_API_URL` pero el archivo tenía `VITE_EVOLUTION_API_URL`).
2. `whatsappSocketService.ts`: constante `SOCKET_IO_ENABLED = false` +
   early return en `connect()` + log único (no spam).
3. `WhatsAppAccountsConfigSection.tsx`:
   - Silenciado `console.log` de "Endpoint connectionState no disponible".
   - `if (true) return;` al inicio de los 2 `setInterval` de polling.
   - Comentado `socketService?.connect()`.

**Resultado:** Bucle cortado. Pantalla funcional sin congelamiento.

**Reactivar cuando Evolution API esté estable:** cambiar
`SOCKET_IO_ENABLED = false` a `true` en `whatsappSocketService.ts` y
reiniciar Vite. Una sola línea.

### Logros Fase B — Fix Sidebar por Rol

**Problema:** El sidebar mostraba "Operaciones & SaaS" a usuarios con rol
`admin` (tenant), incluyendo la sección exclusiva del Super Admin SaaS.

**Causa raíz (2 bugs combinados):**
1. `can()` en `TenantContext.tsx` era un STUB que siempre devolvía `true`.
2. `isSuperAdmin` en `Sidebar.tsx` chequeaba un email hardcodeado
   (`victoraray8@gmail.com`), no el rol real del usuario.

**Solución aplicada:**

**A) `src/types/index.ts`:**
- `UserRole` ahora incluye `'saas_super_admin'`.
  Antes: `'admin' | 'supervisor' | 'agent' | 'readonly'`
  Ahora: `'admin' | 'supervisor' | 'agent' | 'readonly' | 'saas_super_admin'`

**B) `src/context/TenantContext.tsx`:**
- `can(module, action)` reemplazado por implementación real:
  - Si `currentUser.role === 'saas_super_admin'` → `true` siempre.
  - Si rol tenant (`admin`/`supervisor`/`agent`/`readonly`) →
    busca en `initialRolesMock` y devuelve `permissions[module][action]`.
  - Fail-safe: si módulo o acción no existen → `false`.
  - Envuelto en `useCallback` con dependencia `[currentUser?.role]`.
- `defaultUser.role` cambiado a `'saas_super_admin'` + `isSuperAdmin: true`
  (mock temporal, se reemplaza por JWT real en Fase C).

**C) `src/components/layout/Sidebar.tsx`:**
- Reorganizado de 4 a 5 grupos:
  1. "Principal & Clientes" (sin cambios)
  2. "Comunicaciones & Contacto" (sin cambios)
  3. "Operaciones" (era "Operaciones & SaaS", eliminada la ambigüedad)
     - Solo contiene items del tenant: `banking`, `campaigns`
  4. "Configuración & Empresa" (sin cambios)
  5. "Plataforma SaaS" (NUEVO) — Solo visible para `saas_super_admin`
     - Contiene: `saas_central` (Central SaaS Multiempresa)
- `isSuperAdmin` renombrado a `isSaasSuperAdmin` y ahora chequea
  `currentUser.role === 'saas_super_admin'` (no email hardcodeado).
- `integrations` ahora usa `can('integrations', 'view')` en lugar de `true`.

**Verificación end-to-end:**
- Login como `tenant_admin` → NO ve "Plataforma SaaS" ✅
- Login como `saas_super_admin` → SÍ ve "Plataforma SaaS" + panel SaaS
  completo con los 10 tabs (Empresas, Comprobantes, Planes, SMTP, WhatsApp,
  VPS, Métricas, etc.) ✅

### Decisiones Arquitectónicas de la Sesión #22

1. **Kill switch con flag booleano** (no comentar código): permite reactivar
   con 1 línea.
2. **Separación semántica de grupos:** "Operaciones" (tenant) vs
   "Plataforma SaaS" (super admin) — evita confusión de audiencia.
3. **`can()` con useCallback + dep `[currentUser?.role]`:** evita re-renders
   innecesarios del Sidebar.
4. **Fail-safe en `can()`:** si el módulo/acción no existe → `false`
   (principio de menor privilegio).
5. **Mock con `role: 'saas_super_admin'`:** para probar el panel SaaS sin
   necesidad de credenciales reales.

### Deuda Técnica Registrada en Sesión #22

#### Fase B.5 — Protección de `saas_super_admin` (⏳ pendiente)

**Reglas a implementar:**
1. Solo `saas_super_admin` puede ver la lista de `saas_super_admin`.
2. Solo `saas_super_admin` puede crear/editar/eliminar usuarios `saas_super_admin`.
3. Un `saas_super_admin` NO pertenece a ningún tenant (`is_platform_user = 1`).
4. Un `tenant_admin` ve SOLO usuarios de su tenant con roles tenant.
5. No se puede degradar `saas_super_admin` ↔ rol tenant sin autorización
   explícita de otro `saas_super_admin`.

**Archivos a modificar:**
- `server/routes/users.ts` (filtrado por rol en queries)
- `server/middleware/rbac.ts` (agregar `requirePlatformUser`)
- `src/components/users/UsersRolesModule.tsx` (filtrar usuarios por rol)
- `src/context/TenantContext.tsx` (helper `isPlatformUser`)
- DB: `users.is_platform_user = 1` para `saas_super_admin` (columna ya existe)

**Prioridad:** Alta — es un tema de seguridad multi-tenant.

#### Fase B.6 — Roles Custom (⏳ pendiente)

**Objetivo:** Permitir que cada tenant cree roles personalizados además de
los 4 roles de sistema (ej: "Customer Service", "Auditor", etc.).

**Caso de uso típico:** "Customer Service" con permisos específicos
(ver clientes + enviar WhatsApp, sin banking ni audit).

**Archivos a modificar:**
- `server/routes/roles.ts` (NUEVO — endpoints CRUD)
- `server/services/roleService.ts` (NUEVO — lógica creación/validación)
- `src/components/users/UsersRolesModule.tsx` (botón "Crear Nuevo Rol")
- `src/context/TenantContext.tsx` (agregar `createRole`, `deleteRole`)
- DB: usar tabla `roles` existente (mock actual hardcodeado)

**Validaciones:**
- Un rol custom no puede tener más permisos que el `tenant_admin` que lo crea.
- Roles de sistema (`isSystem: true`) no se pueden eliminar.
- Al eliminar rol custom, reasignar usuarios a `readonly` o pedir confirmación.

**Prioridad:** Media — requiere ~2-3 horas de trabajo.

#### Fase C.0 — Migración tipada de WhatsApp/Evolution (⏳ pendiente)

**Contexto:** `WhatsAppAccountsConfigSection.tsx` tiene 29 errores TS
porque `response.json()` devuelve `unknown`.

**Solución:**
- Tipar cada `response.json() as EvolutionApiResponse` o similar.
- Agregar type guards para `state`, `status`, `connectionStatus`, `instance`,
  `instances`, `data`, etc.
- Manejar `currentUser` null con optional chaining (`currentUser?.name`).

**Prioridad:** Baja — NO bloqueante. Mejora calidad de tipos.

#### Evolution API crash de nginx (⏳ pendiente)

**Contexto:** El contenedor Evolution API crashea con:
`nginx: [emerg] invalid value "must-revalidate" in /etc/nginx/conf.d/nginx.conf:11`

**Impacto:** Endpoint `/socket.io/` y `/instance/fetchInstances` responden 401.

**Solución:** Revisar `nginx.conf` del contenedor y corregir el valor inválido.
Sesión dedicada fuera del scope del CRM.

**Prioridad:** Media — bloquea reconectar WhatsApp real.

### Reglas Aprendidas en Sesión #22

1. **localStorage sobreescribe el mock:** cuando el usuario ya hizo login,
   el `currentUser` viene de `localStorage`, no del `defaultUser` del mock.
   Para probar roles diferentes, hay que hacer logout + login real.
2. **`useCallback` en `can()`:** previene re-renders del Sidebar en cada
   render del Provider.
3. **Separación semántica de grupos del sidebar:** audiencia > mezcla.
   "Operaciones" (tenant) vs "Plataforma SaaS" (super admin).
4. **Fail-safe en `can()`:** retornar `false` si el módulo/acción no existe
   (principio de menor privilegio).
5. **PowerShell + git commit multilínea:** usar comillas dobles y `\` para
   escape. Alternativa: usar `git commit -F archivo.txt`.
6. **`docker exec <container>` vs `<service>`:** el nombre del contenedor
   puede diferir del nombre del servicio. Usar `docker compose ps` para
   confirmar.

═### Reglas Aprendidas en Sesión #22

1. **localStorage sobreescribe el mock:** cuando el usuario ya hizo login,
   el `currentUser` viene de `localStorage`, no del `defaultUser` del mock.
   Para probar roles diferentes, hay que hacer logout + login real.
2. **`useCallback` en `can()`:** previene re-renders del Sidebar en cada
   render del Provider.
3. **Separación semántica de grupos del sidebar:** audiencia > mezcla.
   "Operaciones" (tenant) vs "Plataforma SaaS" (super admin).
4. **Fail-safe en `can()`:** retornar `false` si el módulo/acción no existe
   (principio de menor privilegio).
5. **PowerShell + git commit multilínea:** usar comillas dobles y `\` para
   escape. Alternativa: usar `git commit -F archivo.txt`.
6. **`docker exec <container>` vs `<service>`:** el nombre del contenedor
   puede diferir del nombre del servicio. Usar `docker compose ps` para
   confirmar.

## Sesión #23 — Fase 3.5.B.4.d: Endpoint upgrade demo → pago
Fecha: 2026-10-12

### Commit
- Hash: <hash_completo>
- Padre: e3e7de9
- Mensaje: "feat(saas): Sesion 3.5.B.4.d - Endpoint upgrade demo a pago"
- 7 archivos cambiados: 4 modificados + 3 nuevos
- Push: e3e7de9..<hash_corto> main -> main

### Objetivo cumplido
Permitir que un tenant en estado `demo` (o `expired` dentro del grace
period) pueda convertirse a plan pago SIN perder cuenta, datos, usuarios
ni configuración. Reutiliza toda la infraestructura de solicitudes de
registro pago (3.5.B.3.b) y el panel de aprobación del Super Admin.

### Archivos NUEVOS (3)
1. `server/types/upgrade.ts` (~90 líneas) — Tipos del flujo:
   - `UpgradeEligibleTenantStatus` ('demo' | 'expired')
   - `UpgradeRequestPayload` (planId, billingCycle, paymentMethodId?, etc.)
   - `UpgradeEligibility` (eligible, reason, code, tenantStatus, fechas)
   - `UpgradeRequestResult` (requestId, tenantId, planId, planName, etc.)

2. `server/services/saasUpgradeService.ts` (~330 líneas) — Servicio:
   - `getUpgradeEligibility(tenantId)` — valida si puede upgradear
   - `normalizeUpgradePayload()` — busca plan, calcula precio, resuelve
     método de pago
   - `createUpgradeRequest(tenantId, payload, meta)` — orquesta y crea
     la solicitud con type='upgrade' + created_tenant_id pre-poblado
   - Anti-duplicado: rechaza si ya hay otra solicitud pending para el
     mismo tenant (UPGRADE_ALREADY_PENDING)
   - `admin_password_hash` se rellena con hash dummy (no se usa en upgrade)

3. `server/routes/saas/upgrade.ts` (~180 líneas) — Router:
   - `GET  /api/saas/upgrade/eligibility` (requireAuth + requireTenant)
   - `POST /api/saas/upgrade`             (requireAuth + requireTenant)
   - El tenant_id NUNCA viene del body. Siempre del JWT (req.user.tenantId).
     Esto evita que el tenant A haga upgrade del tenant B (anti-IDOR).

### Archivos MODIFICADOS (4)
1. `server/services/saasRegistrationReviewService.ts` (+308/-95):
   - `approveRegistration()` ahora detecta `request.type === 'upgrade'`
     y ramifica:
     - Modo registro (actual): INSERT tenant + INSERT user + INSERT sub
     - Modo upgrade (nuevo):   UPDATE tenant existente + UPSERT sub
   - En modo upgrade NO se crea tenant ni user. El user admin ya existe
     y mantiene su password (no se regenera tempPassword).
   - UPSERT de subscription: si el tenant demo ya tenía una, se actualiza;
     si no, se crea. Necesario porque `tenant_subscriptions.tenant_id`
     tiene constraint UNIQUE.
   - El return devuelve placeholder para subdomain y tempPassword en modo
     upgrade: "(existente)" y "(mantiene su password)".
   - Validación pre-transacción: si es upgrade pero el tenant no existe
     → error UPGRADE_TENANT_NOT_FOUND (404). Si el tenant no tiene admin
     → error UPGRADE_TENANT_ADMIN_NOT_FOUND (409).

2. `server/services/saasRegistrationService.ts` (+20/-1):
   - `RegistrationValidationError` extendida con `code?: string` opcional
     (patrón idéntico a `RegistrationReviewError`). Retrocompatible: los
     usos existentes con 1 argumento siguen funcionando.
   - `normalizeRegistrationType()` ahora reconoce 'upgrade' además de
     'demo' y 'payment'. Sin este fix, el endpoint público de status
     devolvía `type: "demo"` para solicitudes de upgrade (bug detectado
     y corregido durante las pruebas end-to-end).

3. `server/types/registration.ts` (+2/-1):
   - `RegistrationType` ahora es `'demo' | 'payment' | 'upgrade'`.
   - `RegistrationStatusDTO.type` ya usaba `RegistrationType`, así que
     heredó el cambio automáticamente.

4. `server/routes/saas.ts` (+4):
   - Import de `upgradeRouter` desde './saas/upgrade.js'
   - Mount: `saasRouter.use('/upgrade', upgradeRouter)`

### Endpoints nuevos (2)
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | /api/saas/upgrade/eligibility | JWT tenant | Consulta si el tenant puede upgradear |
| POST | /api/saas/upgrade | JWT tenant | Crea solicitud de upgrade (type='upgrade') |

Total endpoints del proyecto: 53 (era 51).

### Decisiones arquitectónicas (registrar)
1. **Opción A: reutilizar `created_tenant_id`** como vínculo al tenant
   existente. Cero migración de DB, cero cambios al schema Prisma.
   Semántica: "tenant vinculado a esta solicitud" (en registro = creado,
   en upgrade = pre-existente). Documentado con comentario en el servicio.
2. **`type='upgrade'`** aprovecha que la columna `type` es VARCHAR(16)
   sin constraint CHECK. Tres valores válidos: 'demo' | 'payment' | 'upgrade'.
   El índice `idx_reg_type` ya lo soporta.
3. **Tenant_id del JWT, no del body** (anti-IDOR). El endpoint es del
   tenant, no del Super Admin. Requiere `requireAuth` + `requireTenant`,
   NO `requirePlatformUser`.
4. **`RegistrationValidationError` con `code` opcional** — patrón uniforme
   con `RegistrationReviewError`. Permite al router/frontend distinguir
   errores específicos sin parsear el mensaje.
5. **UPSERT de subscription en upgrade** — la tabla tiene constraint
   UNIQUE en `tenant_id`. Prisma expone `upsert({ where: { tenant_id } })`.
6. **`admin_password_hash` dummy en upgrade** — la columna es NOT NULL,
   se rellena con hash válido de un UUID aleatorio que nunca se usa.
7. **Anti-duplicado de upgrades** — `UPGRADE_ALREADY_PENDING` si ya hay
   una solicitud pending para el mismo tenant. Evita spam por doble clic.

### Pruebas end-to-end (7/7 exitosas)
1. ✅ GET /upgrade/eligibility sin token → 401 AUTH_TOKEN_MISSING
2. ✅ GET /upgrade/eligibility con JWT tenant demo → 200
     { eligible: true, tenantStatus: 'demo', fechas correctas }
3. ✅ POST /upgrade con planId inválido → 400 PLAN_NOT_FOUND
4. ✅ POST /upgrade con plan-starter válido → 201 con requestId real,
     type='upgrade', created_tenant_id pre-poblado
5. ✅ POST /upgrade duplicado → 400 UPGRADE_ALREADY_PENDING
6. ✅ GET /registrations/:id/status → 200
     { status: 'pending', type: 'upgrade', companyName: ... }
     (bug type='demo' detectado y corregido)
7. ✅ PRUEBA DE ORO — Aprobar con JWT saas_super_admin:
     - Response: tenantId y userId SON LOS MISMOS (no se duplicaron)
     - subdomain: "(existente)", tempPassword: "(mantiene su password)"
     - DB verifica: tenant.status demo → active
                    tenant.demo_expires_at → NULL
                    tenant.grace_period_ends_at → NULL
                    subscription.plan DEMO → Starter
                    subscription.plan_id plan-demo → plan-starter
                    subscription.monthly_price 0.00 → 29.00
                    subscription usa UPSERT (misma fila, no duplica)

### Deuda técnica NUEVA detectada
1. **Bug encoding preexistente en `users.name`** — el usuario
   `María Test` está guardado como `Mar�a Test` (U+FFFD en lugar de í).
   Causa: `Invoke-RestMethod` sin UTF-8 en sesión anterior.
   NO bloqueante. Fix: UPDATE users SET name='María Test' WHERE ...
2. **Restricción de rol en /upgrade** — actualmente cualquier rol tenant
   (tenant_admin, supervisor, agent) puede llamar al endpoint. En MVP es
   aceptable (acción del tenant sobre sí mismo). En B.5 se puede restringir
   a `tenant_admin` con un `requireRole('tenant_admin')` si se considera
   necesario.
3. **Frontend de upgrade** — falta pantalla para que el tenant elija plan
   y dispare POST /api/saas/upgrade. Planificado para 3.5.B.4.e.

### Lecciones aprendidas en esta sesión
1. **bcrypt hash generation con tsx inline** — para resetear passwords en
   DB sin tocar el backend:
   `npx tsx -e "import bcrypt from 'bcryptjs'; bcrypt.hash('Pass123!', 10).then(h => console.log(h));"`
2. **PowerShell + login JWT response es PLANA** — la respuesta de
   `/api/auth/login` es `{ success, token, user, mustResetPassword }`, no
   `{ success, data: { token, ... } }`. Usar `$login.token` directo.
3. **Docker + MariaDB + backticks en PowerShell** — los backticks de
   columnas reservadas (`key`) se comen mal si van en el `-e "..."`.
   Solución: omitir la columna conflictiva del SELECT (el `id` alcanza),
   o usar heredoc con Out-File.
4. **tsx watch recarga el servicio** — al modificar un servicio, el
   backend reinicia automáticamente. NO hace falta matar el proceso.
   Pero si un cambio no se refleja, `Ctrl + C` + `npm run dev:api`.
5. **UPSERT de Prisma** requiere un campo `@unique` en el `where`.
   `tenant_subscriptions.tenant_id` tiene constraint UNIQUE → funciona.
6. **Fallbacks en type guards** — al agregar un nuevo valor a un union
   type (ej. 'upgrade'), acordarse de actualizar TODOS los type guards
   que lo consumen (normalizeRegistrationType, etc.), no solo el tipo.

### Estado del proyecto tras esta sesión
- Progreso global: ~60% (era ~58%)
- Sesiones completadas: 23
- Sub-fases de 3.5.B: 3.5.B.4.d COMPLETADA ✅
- Siguiente sub-fase: 3.5.B.4.e (Frontend pantalla de upgrade)

════════════════════════════════════════════════════════════════════
ÚLTIMA ACTUALIZACIÓN: 2026-10-12 (Sesión #23)
Último commit: <hash_corto>
Push: origin/main
Progreso global: ~60%
════════════════════════════════════════════════════════════════════