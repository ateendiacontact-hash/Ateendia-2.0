Proyecto: ateendia-crm 2.0
Descripción General
Sistema CRM (Customer Relationship Management) multi-tenant para la gestión integral de clientes, pólizas de seguros, alertas automáticas, auditoría, banca, branding y telefonía. Arquitectura SaaS con aislamiento de datos por tenant, diseñada para centralizar la operación comercial y financiera de agencias de seguros y servicios financieros.

Arquitectura y Tecnología
Tipo de aplicación: Web app moderna SPA (Single Page Application)

Backend: TypeScript + Express 4 + Prisma ORM + MariaDB + JWT (bcryptjs, jsonwebtoken). Cloudflare Pages solo sirve el build estático (dist/). Legacy Cloudflare D1/PocketBase en `functions/` — por eliminar.

Frontend: React 19 con TypeScript, Vite 6, TailwindCSS 4, Lucide React (iconos), Motion (animaciones)

Base de datos: MariaDB 11.4 (InnoDB, utf8mb4) como única base de datos. Esquema definido en `server/prisma/schema.prisma` (14 modelos) y `schema.mariadb.sql` (14 tablas, idénticas). Puerto local: 3307 (host) / 3306 (contenedor).

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
├── prisma/
│   ├── schema.prisma     # 14 modelos: audit_logs, bank_accounts, call_records, clients, pipeline_stages, pipelines, policies, policy_members, smtp_configs, tenant_subscriptions, tenants, users, whatsapp_conversations, whatsapp_messages
│   └── seed.ts           # Tenant demo + admin (admin@ateendia.cloud / Admin123!) + pipeline default 5 etapas
├── routes/
│   └── health.ts         # GET /api/health (verifica DB con SELECT 1)
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

## Estado Actual del Proyecto (Actualizado: 2026-09-28)

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

### Resumen de endpoints funcionales (17 endpoints)
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

---

## Roadmap del Proyecto (Fases 3-7)

### Fase 3 — Core CRM (en curso)
- 3.1 Banking ✅ COMPLETADA
- 3.2 Policies (13 tipos + formularios dinámicos) ⏳ SIGUIENTE — 5 sesiones
- 3.3 Users (gestión usuarios + roles) ⏳ — 2 sesiones
- 3.4 SMTP (envío emails) ⏳ — 1 sesión
- 3.5 SaaS Plans (planes editables + feature flags) ⏳ — 2 sesiones

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
- Completadas: 8 sesiones
- Restantes: ~32 sesiones
- Progreso: ~20%

### Progreso por fase:

| Fase | Descripción | Progreso |
|------|-------------|----------|
| Fase 0 | Infraestructura | 100% ✅ |
| Fase 1 | Backend Base | 100% ✅ |
| Fase 2 | Clients | 100% ✅ |
| Fase 3 | Core CRM | 30% ⏳ |
| Fase 4 | Multibandeja Unificada | 0% ⏳ |
| Fase 5 | IA + Automatizaciones | 0% ⏳ |
| Fase 6 | Analytics + Reportes | 0% ⏳ |
| Fase 7 | Producción | 0% ⏳ |

---

## Siguiente paso

Actualiza con:

**Sesión 3.2.1:** Definir los 13 tipos de seguros + campos específicos  
**Sesión 3.2.2:** Crear tablas policy_types, policy_type_schemas, policy_versions  
**Sesión 3.2.3:** policiesService + validación dinámica con Zod  
**Sesión 3.2.4:** routes/policies.ts + members + version history  
**Sesión 3.2.5:** Frontend formularios dinámicos