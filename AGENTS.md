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

## Estado Actual del Proyecto (Actualizado: 2026-10-01)

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

### Resumen de endpoints funcionales (45 endpoints)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/health | Health check |
| POST | /api/auth/login | Login + JWT + 2FA |
| GET | /api/auth/me | Usuario actual + tenant + permisos |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/permissions | Permisos del usuario |
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

### 3.5.B — Landing + Registro + Demo [⏳ EN CURSO]
- **3.5.B.1 — Base DEMO + Registro [✅ COMPLETADA]**
  - tenants: +status, +demo_expires_at, +grace_period_ends_at
  - saas_platform_settings (config global)
  - Plan DEMO en seed
- **3.5.B.2 — Landing configurable [✅ COMPLETADA]**
  - Servicio saasLandingService
  - Endpoints: GET/PUT /api/saas/landing
  - Tipos TypeScript (server/types/landing.ts + src/types/index.ts)
  - Columna landing_config_json en saas_platform_settings
- **3.5.B.3 — Tabla saas_registration_requests [⏳ SIGUIENTE]**
  - Con soporte para demo y pago
- **3.5.B.4 — Flujo de registro + upgrade [⏳]**
  - POST /api/saas/register
  - Endpoints de aprobación/rechazo

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
- Completadas: 13 sesiones
- Restantes: ~34 sesiones
- Progreso global: **~40%**

### Progreso por fase:

| Fase | Descripción | Progreso |
|------|-------------|----------|
| Fase 0 | Infraestructura | 100% ✅ |
| Fase 1 | Backend Base | 100% ✅ |
| Fase 2 | Clients | 100% ✅ |
| Fase 3.1-3.4 | Core CRM (Banking, Policies, Users, SMTP) | 100% ✅ |
| Fase 3.5.A | SaaS Plans Base | 100% ✅ |
| Fase 3.5.B | Landing + Registro + Demo | 25% ⏳ |
| Fase 3.5.C-E | Pagos, Frontend SaaS, Límites | 0% ⏳ |
| Fase 4 | Multibandeja Unificada | 0% ⏳ |
| Fase 5 | IA + Automatizaciones | 0% ⏳ |
| Fase 6 | Analytics + Reportes | 0% ⏳ |
| Fase 7 | Producción | 0% ⏳ |

---

## Siguiente paso

**Próximo paso inmediato:**
1. Crear tabla `saas_registration_requests` (SQL 3)
2. Actualizar schema.mariadb.sql
3. Regenerar Prisma
4. Commit

**Siguiente fase:**
- Sesión 3.5.B.3 — Tabla saas_registration_requests
- Endpoints POST /api/saas/register (crear saas_registration_requests)
- Endpoints de aprobación/rechazo (Super Admin)
- Servicio que crea tenant + user + subscription al aprobar
- Servicio que expira registros a los 7 días

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