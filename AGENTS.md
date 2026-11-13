# AGENTS.md — Memory Bank de Ateendia CRM 2.0

> **Última actualización:** 2026-11-13 (Sesión #37 — Cierre de Fase 3.5.G.3)
> **Progreso global:** ~86%
> **Sesiones completadas:** 37
> **Último commit:** `<hash_del_commit>` — fix(fase-3.5.g.3): type hardening en ClientFormModal, ClientModal y PolicyFormModal + fix catalogs en TenantContext

---

## 📌 Tabla de Contenidos

1. [Contexto del Proyecto](#1-contexto-del-proyecto)
2. [Reglas Operativas](#2-reglas-operativas)
3. [Estado Actual del Proyecto](#3-estado-actual-del-proyecto)
4. [Roadmap y Fases](#4-roadmap-y-fases)
5. [Sistema DEMO + Registro + Upgrade](#5-sistema-demo--registro--upgrade)
6. [Canales de Mensajería](#6-canales-de-mensajería)
7. [Decisiones Estratégicas](#7-decisiones-estratégicas)
8. [Deuda Técnica Registrada](#8-deuda-técnica-registrada)
9. [Historial de Sesiones](#9-historial-de-sesiones)
10. [Lecciones Aprendidas Acumuladas](#10-lecciones-aprendidas-acumuladas)
11. [Próximos Pasos](#11-próximos-pasos)

---

## 1. CONTEXTO DEL PROYECTO

### Descripción General
Sistema CRM (Customer Relationship Management) multi-tenant para la gestión integral de clientes, pólizas de seguros, alertas automáticas, auditoría, banca, branding y telefonía. Arquitectura SaaS con aislamiento de datos por tenant, diseñada para centralizar la operación comercial y financiera de agencias de seguros y servicios financieros.

### Stack Tecnológico
- **Backend:** TypeScript + Express 4 + Prisma ORM + MariaDB + JWT (bcryptjs, jsonwebtoken)
- **Frontend:** React 19 + TypeScript + Vite 6 + TailwindCSS 4 + Lucide React + Motion
- **Base de datos:** MariaDB 11.4 (InnoDB, utf8mb4). 24 modelos en Prisma.
- **Infraestructura:** Docker local. Cloudflare Pages (frontend) + VPS (backend).
- **Control de versiones:** Git

### Puertos y Servicios (desarrollo local)
| Servicio | Puerto | Notas |
|----------|--------|-------|
| Vite (frontend) | 3100 | Proxy `/api` → 4000 |
| Express (backend) | 4000 | API REST |
| MariaDB | 3307 (host) / 3306 (contenedor) | Usuario: `ateendia` |
| phpMyAdmin | 8081 | Login: `root` / `rootpassword` |
| Evolution API (WhatsApp) | 8080 | Bug de nginx, no usar |
| Chatwoot | 3000 | Otro proyecto |
| edentals-db | 3306 | Otro proyecto |

⚠️ **Los puertos 3306, 3000, 8080 están ocupados por otros proyectos.** Por eso Ateendia usa 3307, 3100, 4000.

### Estructura del Backend (`server/`)
server/
├── index.ts # Punto de entrada Express
├── env.ts # Validación Zod de variables de entorno
├── db.ts # Cliente Prisma singleton
├── tsconfig.json # Config TS para backend (ESM, strict)
├── types/ # Tipos backend (landing, registration, upgrade, etc.)
├── services/ # Servicios de dominio
├── prisma/
│ ├── schema.prisma # 24 modelos
│ └── seed.ts # Tenant demo + admin + plan DEMO
├── routes/ # Rutas REST organizadas por dominio
├── middleware/ # requireAuth, requireTenant, rbac, rateLimiters
├── .env # Variables reales (no commitear)
├── .env.example # Template
└── .env.local # Override local (gitignored)

text

### Variables de Entorno — Reglas Críticas

| Archivo | Contenido | Quién lo lee | ¿Git? |
|---------|-----------|--------------|-------|
| `.env.example` (raíz) | Solo `VITE_*` (públicas) | Vite | ✅ Sí |
| `.env.local` (raíz) | Valores reales `VITE_*` | Vite | ❌ No |
| `server/.env.example` | Plantilla de secretos | Referencia | ✅ Sí |
| `server/.env.local` | Secretos reales | `server/env.ts` | ❌ No |
| `server/.env` | Copia de `.env.local` | Prisma CLI | ❌ No |

**Reglas:**
1. **NUNCA** poner prefijo `VITE_` a secretos. Todo lo `VITE_*` termina en el bundle del navegador.
2. `DATABASE_URL` vive SOLO en `server/.env` y `server/.env.local`.
3. **Nunca** debe haber un `.env` con secretos en la raíz del proyecto.
4. Si Prisma CLI dice `Environment variables loaded from ..\.env`, hay un `.env` residual en la raíz rompiendo todo.

---

## 2. REGLAS OPERATIVAS

### Sección 1 — Estilo de Trabajo

**1. GUÍA PASO A PASO**
- Instrucciones numeradas, sin saltarse nada.
- Cada paso con su comando/código exacto para copiar y pegar.

**2. CÓDIGO COMPLETO, NO FRAGMENTOS**
- Todo lo que se dé para pegar va completo (archivo entero si es nuevo, o bloque reemplazable si es edición).
- Nada de `// ... resto igual`.

**3. EXPLICAR EL POR QUÉ**
- Cada comando, archivo o línea no obvia: qué hace y por qué.
- No dar nada por sabido.

**4. NIVEL DE EXIGENCIA**
- No disculparse por exigir. Un SaaS serio se construye con método, verificación y paciencia.
- Frase guía: *"Un proyecto profesional no se mide por la velocidad con la que se construye, sino por la solidez con la que se sostiene."*

### Sección 2 — Verificación

**5. VERIFICACIÓN DOBLE**
- Cuando se puede verificar (output, archivo, captura): verificar 2 veces antes de responder.
- Cuando NO se puede verificar: decirlo explícitamente — "Asumo X, confirmá antes de actuar".
- Cuando el número es dudoso: usar la fuente de verdad (`information_schema` para DB, `git status` para archivos, `docker compose ps` para contenedores).
- Cuando hay error: reconocerlo y corregir en el momento.

**6. VERIFICACIÓN INICIAL POR CÓDIGO (Regla 19)**
- Al inicio de cada chat nuevo, verificar el estado real del proyecto con comandos antes de asumir nada.
- El `AGENTS.md` es punto de partida, no fuente de verdad.
- Comandos:
  ```powershell
  git log --oneline -3
  git status --short
  docker compose ps
  npx tsc --noEmit -p server/tsconfig.json
  curl.exe -i http://localhost:4000/api/health
7. CONFIANZA EN HERRAMIENTAS

Confiar en npx tsc --noEmit -p server/tsconfig.json (NO en cSpell de VS Code).

Confiar en information_schema para conteo de tablas/columnas.

Confiar en docker compose ps para estado de contenedores.

Sección 3 — Git y Versionado
8. GIT AL FINAL DE CADA (SUB)FASE

Solo cuando una sub-fase está completa y verificada.

Proporcionar:

powershell
git add <archivos selectivos>
git commit -m "<mensaje descriptivo>"
git push
NUNCA hacer git add . o git add -A si hay deuda técnica.

9. GRÁFICO ASCII DE PROGRESO

Después de cada commit, mostrar el bloque ASCII con barras de progreso del proyecto por fase y sub-fase.

10. PROMPT PARA KILO CODE (MEMORY BANK)

Al cerrar cada (sub)fase, entregar un prompt completo listo para pegar en Kilo Code.

El prompt debe estar en MODO SOLO-EDICIÓN del AGENTS.md (NO toca código, NO ejecuta git).

11. COMMITS SIN DEUDA TÉCNICA

Antes del commit, revisar git diff --stat de los archivos afectados.

Hacer git add selectivo (lista explícita de archivos).

Verificar con git status --short que solo los archivos correctos estén staged.

Sección 4 — Gestión de Contexto
12. AVISO DE LÍMITE DE CONTEXTO

Cuando el chat se alargue (~25-30 intercambios con archivos largos), avisar proactivamente.

Generar prompt de traspaso completo + lista de archivos a adjuntar en el nuevo chat + resumen ejecutivo del estado.

13. PROMPT DE TRASPASO ESTRUCTURADO

Contexto del proyecto.

Reglas personales.

Estado de infraestructura verificado.

Lo que se hizo en la sesión anterior.

Decisiones tomadas para la siguiente sesión.

Middlewares/tablas críticas.

Deuda técnica registrada.

Siguiente paso.

Primera tarea concreta para el asistente nuevo.

Sección 5 — Reglas Técnicas Críticas
14. ⚠️ EPERM EN WINDOWS

Antes de npm run db:generate o prisma generate, SIEMPRE detener Express (Ctrl + C).

Si falla con EPERM: operation not permitted, rename → es eso.

15. ⚠️ POWERSHELL + CURL CON JSON

El escape con \" rompe en PowerShell.

Usar Invoke-RestMethod con hashtables + ConvertTo-Json -Depth 5.

Para strings con ACENTOS:

powershell
$json = $body | ConvertTo-Json -Depth 5
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
Invoke-RestMethod -Uri "..." -Body $bytes -ContentType "application/json; charset=utf-8"
PowerShell NO soporta < para redirección stdin:

Opción A: Get-Content archivo.sql -Raw | docker compose exec -T ...

Opción B: cmd /c "docker compose exec -T ... < archivo.sql"

- `key` es palabra reservada en MariaDB/MySQL. Siempre usar backticks
  cuando se haga SQL crudo sobre columnas llamadas `key`, `order`,
  `group`, `desc`, `status`, etc.
- Alternativa robusta: usar `Get-Content archivo.sql -Raw | docker
  compose exec -T ...` (Regla 15, Opción A).

16. ⚠️ CSPELL EN VS CODE

Los "Unknown word cSpell" NO son errores reales.

Solo confiar en npx tsc --noEmit -p server/tsconfig.json.

17. ⚠️ NAMING PRISMA

Modelos: plural + snake_case (prisma.users, prisma.clients).

Nunca singular ni camelCase.

Campos también en snake_case (tenant_id, created_at).

18. ⚠️ JSON EN MARIADB

Prisma lo expone como String?.

Serializar con JSON.stringify() al guardar.

Parsear con JSON.parse() al leer.

19. ⚠️ IMPORTS CON EXTENSIÓN .JS

Con module: ESNext, imports entre .ts con .js:

import { x } from './y.js' ✅

import { x } from './y' ❌

20. ⚠️ DOTENV EN SCRIPTS

Todo script ejecutado con tsx/node (no vía Prisma CLI) debe cargar dotenv manualmente apuntando al .env correcto.

21. ⚠️ ROUTER.USE() DESPUÉS DE DECLARACIÓN

Los router.use() van DESPUÉS de export const xRouter = Router().

Los imports sí pueden ir arriba (hoisted).

22. ⚠️ TENANTID === 'PLATFORM'

Todo middleware de tenant DEBE tener excepción para tenantId === 'platform'.

Los Super Admins SaaS (is_platform_user = 1) NO están sujetos a verificaciones de tenant.

23. ⚠️ MARIADB POST-CRASH

Si docker exec funciona pero desde el host Windows todo falla con P1017 / "Server has closed the connection":

powershell
docker compose restart mariadb
NO borra datos, solo reinicia el proceso.

24. ⚠️ FOREIGN KEYS EN PRISMA

Verificar las FKs reales en la DB antes de escribir servicios que crean registros relacionados.

Los nombres pueden diferir de lo asumido.

29. ⚠️ TYPE GUARD PARA response.json() (unknown)

Con TypeScript estricto, response.json() devuelve unknown.

NUNCA acceder a .success o .data directamente.

Patrón correcto:

ts
const body: unknown = await res.json();
if (
  typeof body === 'object' &&
  body !== null &&
  'success' in body &&
  (body as { success: unknown }).success === true &&
  'data' in body &&
  Array.isArray((body as { data: unknown }).data)
) {
  const data = (body as { data: MyType[] }).data;
  // usar data
}
Sección 6 — Documentación
25. MEMORY BANK AL FINAL DE CADA FASE

Actualizar AGENTS.md con cada fase completada.

Registrar decisiones tomadas, lecciones aprendidas, deuda técnica.

IMPORTANTE: Siempre entregar un prompt para Kilo Code (no texto para copiar/pegar) para mantener el orden.

26. DEUDA TÉCNICA EXPLÍCITA

Cuando se detecta deuda técnica, registrarla en una sección dedicada del AGENTS.md con:

Descripción del problema.

Causa raíz.

Solución propuesta.

Prioridad (bloqueante / no bloqueante).

27. JSDOC EN FUNCIONES COMPLEJAS

Documentar funciones complejas, servicios y APIs con JSDoc/TSDoc.

Los componentes no requieren comentarios extensos si son autoexplicativos.

Sección 7 — Reglas de Producción (CRÍTICA)
28. ⚠️ SISTEMA PARA PRODUCCIÓN, NO PARA SIMULACIÓN

Regla estricta: Todo el sistema debe funcionar para producción real.
Los datos mock, hardcodeados, de ejemplo o simulados en componentes de gestión (paneles, listados, dashboards, tablas) están PROHIBIDOS.

Qué está permitido:

✅ Datos de seed (server/prisma/seed.ts) como punto de partida inicial.

✅ Estados de carga / loading skeletons mientras se traen datos reales.

✅ Fallbacks visuales vacíos ("No hay datos todavía") cuando la DB está vacía.

Qué está PROHIBIDO:

❌ Hardcodear arrays mock en el frontend.

❌ Usar datos de ejemplo para rellenar tablas de gestión.

❌ Fallbacks silenciosos a mocks cuando un fetch falla.

❌ Componentes que "se ven llenos" pero no reflejan el estado real de la DB.

Excepción única:

Los archivos src/domain/saasDefaults.ts (y similares) pueden tener configuraciones por defecto (colores, textos, planes sugeridos). NO es mock de datos de gestión, es default de configuración.

Cómo verificar que se cumple:

Abrí cualquier panel de gestión (Empresas, Comprobantes, Usuarios, Pólizas, etc.).

Si los datos que ves NO coinciden con lo que hay en la DB (SELECT * FROM ...), hay un mock escondido. Debe arreglarse.

Si vaciás la DB (o filtrás por un criterio que no matchea nada) y el panel sigue mostrando datos, hay un mock escondido. Debe arreglarse.
Impacto: Cada componente que se agregue debe consumir datos REALES desde endpoints backend. Si un endpoint no existe, se crea. NO se mockea en frontend.

🔹 CATEGORÍA 9 — REGLAS NUEVAS (SESIÓN #35)

Regla 34 — ⚠️ EDICIÓN QUIRÚRGICA POR BLOQUES EN ARCHIVOS MASIVOS

Problema observado: Al intentar modificar archivos de 1000+ líneas (como SaasCentralDashboard.tsx o WhatsAppAccountsConfigSection.tsx), reescribir el archivo completo genera regresiones y errores.

Regla: Cuando el archivo a modificar es masivo (1000+ líneas), NUNCA dar el código completo. Proveer únicamente los bloques exactos de código a reemplazar, indicando claramente el bloque anterior y el nuevo, usando comentarios en el código para ubicar visualmente el cambio.

Aplicable a: WhatsAppAccountsConfigSection.tsx, SaasCentralDashboard.tsx, TenantContext.tsx, y cualquier archivo > 800 líneas.

Regla 35 — ⚠️ VERIFICAR STAGING CON git status --short DESPUÉS DE CADA git add

Problema observado: Al hacer git commit sin verificar el staging, el commit falla con "no changes added to commit" porque los archivos no estaban staged.

Regla: Después de cada git add <archivo>, verificar con git status --short que el archivo esté staged correctamente.

Señal visual clave:
- ` M archivo` (con espacio antes de M) → modificado pero NO staged.
- `M  archivo` (sin espacio, M en primera columna) → modificado Y staged.

Si la M tiene un espacio antes, el commit va a fallar con "no changes added to commit".

Aplicable a: todo commit con git add selectivo.

Regla 36 — ⚠️ POWERSHELL HEREDOC SINGLE-QUOTE (@'...'@) PARA STRINGS CON BACKTICKS/ACENTOS

Problema observado: Al crear archivos .md con here-string @"..."@ (double-quote) en PowerShell, los backticks de markdown se consumen como caracteres de escape, y los acentos se rompen (U+FFFD).

Regla: Usar @'...'@ (single-quote) para here-strings. Esto NO interpreta backticks ni variables.

Ejemplo correcto:
@'
# _archive/ - Archivos Historicos
Codigo con `backticks` y acentos: configuracion
'@ | Out-File -FilePath "archivo.md" -Encoding UTF8

Aplicable a: creación de archivos .md, .txt, .json con contenido que tenga backticks, acentos o caracteres especiales.

Regla 37 — ⚠️ NO CONFUNDIR ERRORES DE VS CODE CON ERRORES DE tsc

Problema observado: El panel "Problemas" de VS Code mostraba errores de un archivo, pero npx tsc --noEmit no los reportaba. Confusión al buscar el archivo correcto.

Regla: VS Code usa su propio TS Server, que puede mostrar errores de todo el proyecto (no solo del archivo abierto). La fuente de verdad es npx tsc --noEmit. Cuando VS Code y tsc discrepen, confiar en tsc (Regla 7).

Verificar siempre con: npx tsc --noEmit 2>&1 | Select-String -Pattern "<archivo>" antes de asumir errores.

Regla 38 — ⚠️ ARCHIVAR LEGACY EN _archive/ EN VEZ DE ELIMINAR SI TIENE VALOR HISTÓRICO

Problema observado: Al limpiar archivos legacy (functions/, prisma.old/, MIGRATION_GUIDE.md), la decisión entre eliminar vs archivar no era clara.

Regla: Cuando se detecten archivos legacy (obsoletos pero con valor histórico):
1. Hacer backup en .zip (Regla 39).
2. Clasificar:
   - Sin valor histórico → eliminar permanentemente.
   - Con valor histórico → mover a _archive/ (con README explicativo).
3. Agregar _archive/* al .gitignore con excepción !_archive/README.md.

El README de _archive/ debe explicar: qué contiene, por qué se archivó, cómo se usa (o no se usa).

Aplicable a: functions/, prisma.old/, MIGRATION_GUIDE.md, schema.sql.old, seed.sql, src/index.ts, src/lib/.

Regla 39 — ⚠️ BACKUP (.ZIP) ANTES DE ELIMINAR/MOVER ARCHIVOS LEGACY

Problema observado: Al eliminar archivos legacy, no había red de seguridad para recuperarlos si algo salía mal.

Regla: Antes de cualquier operación destructiva (eliminar, mover), crear un backup comprimido.

Comando en PowerShell:
Compress-Archive -Path "archivo1", "carpeta1", "archivo2" `
  -DestinationPath "backup_legacy_<contexto>_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip" `
  -Force

Verificar inmediatamente después:
Get-ChildItem backup_legacy_*.zip | Select-Object Name, Length, LastWriteTime

El backup NO debe commitearse a Git: agregar al .gitignore con backup_legacy_*.zip.

Aplicable a: todo cleanup de archivos legacy (F.5, F.7, futuras fases de limpieza).

🎯 Resumen Ejecutivo (39 reglas)

Categoría	Total	Números
Estilo de Trabajo	4	1-4
Verificación	3	5-7
Git y Versionado	4	8-11
Gestión de Contexto	2	12-13
Reglas Técnicas Críticas	11	14-24
Documentación	3	25-27
Reglas de Producción	2	28-29
Reglas Nuevas (#31)	4	30-33
Reglas Nuevas (#35)	6	34-39
TOTAL	39	1-39

---

## 3. ESTADO ACTUAL DEL PROYECTO
Progreso Global
Total estimado: ~40 sesiones

Completadas: 35 sesiones

Restantes: ~5 sesiones

Progreso global: ~83%

Progreso por Fase
Fase	Descripción	Progreso
Fase 0	Infraestructura	100% ✅
Fase 1	Backend Base	100% ✅
Fase 2	Clients	100% ✅
Fase 3.1	Banking	100% ✅
Fase 3.5.A	SaaS Plans Base	100% ✅
Fase 3.5.B	Landing + Registro + Demo	100% ✅
Fase 3.5.C	Pagos, Verificación, Suspensión	~95% 🔄
Fase 3.5.D	Frontend SaaS Central	100% ✅
Fase 3.5.E	Verificación de límites	100% ✅
Fase 3.5.F	Cleanup y Estabilización	100% ✅
Fase 3.5.G	Type Hardening	⏳ 55% (Sesión #37)
Fase 4	Multibandeja Unificada	0% ⏳
Fase 5	IA + Automatizaciones	0% ⏳
Fase 6	Analytics + Reportes	0% ⏳
Fase 7	Producción	0% ⏳
Fase 3.6	Telefonía Avanzada	0% ⏳
Endpoints Funcionales (54 endpoints)
Método	Endpoint	Descripción
GET	/api/health	Health check
POST	/api/auth/login	Login + JWT
GET	/api/auth/me	Usuario actual + permisos
POST	/api/auth/logout	Logout
GET	/api/auth/permissions	Permisos del usuario
POST	/api/auth/change-initial-password	Cambio obligatorio de contraseña
GET	/api/clients	Listar clientes
GET	/api/clients/:id	Obtener cliente
POST	/api/clients	Crear cliente
PATCH	/api/clients/:id	Actualizar cliente
DELETE	/api/clients/:id	Soft delete cliente
GET	/api/banking/accounts	Listar cuentas
GET	/api/banking/accounts/:id	Obtener cuenta
POST	/api/banking/accounts	Crear cuenta
PATCH	/api/banking/accounts/:id	Actualizar cuenta
DELETE	/api/banking/accounts/:id	Eliminar cuenta
POST	/api/banking/accounts/:id/set-default	Marcar como default
POST	/api/banking/accounts/:id/reveal	Revelar datos sensibles
GET	/api/saas/plans	Lista admin
GET	/api/saas/plans/public	Lista pública
GET	/api/saas/plans/:id	Detalle de plan
POST	/api/saas/plans	Crear plan
PATCH	/api/saas/plans/:id	Editar plan
DELETE	/api/saas/plans/:id	Archivar plan
GET	/api/saas/landing	Obtener config landing
PUT	/api/saas/landing	Actualizar config landing
POST	/api/saas/register	Registro público demo/pago
GET	/api/saas/payment-methods/public	Métodos de pago públicos
GET	/api/saas/registrations	Listar solicitudes
POST	/api/saas/registrations/:id/approve	Aprobar solicitud
POST	/api/saas/registrations/:id/reject	Rechazar solicitud
GET	/api/saas/registrations/:requestId/status	Consulta pública estado
GET	/api/saas/upgrade/eligibility	Consulta elegibilidad upgrade
POST	/api/saas/upgrade	Crear solicitud upgrade
GET	/api/saas/tenants	Lista tenants reales (Super Admin) — Sesión #26
GET	/api/saas/me/limits	Límites del plan + uso actual del tenant — Sesión #34
Base de Datos
24 modelos Prisma / tablas MariaDB.

Modelos principales: tenants, users, clients, policies, bank_accounts, audit_logs, saas_plans, saas_payment_methods, saas_registration_requests, tenant_subscriptions, saas_platform_settings, whatsapp_conversations, whatsapp_messages, pipelines, pipeline_stages, call_records, smtp_configs, etc.

Usuarios y Roles Configurados
saas_super_admin: saas@ateendia.cloud / SuperAdmin123!

tenant_admin demo: admin@ateendia.cloud / Admin123!

Bug Conocido
users.name = 'María Test' está guardado como Mar�a Test (U+FFFD). No bloqueante.

4. ROADMAP Y FASES
Fase 0 — Infraestructura [✅ 100%]
Docker Compose con MariaDB 11.4 + phpMyAdmin. Variables separadas. Vite proxy.

Fase 1 — Backend Base [✅ 100%]
Express 4 + TypeScript + Prisma. Middleware auth/tenant/rbac/audit. Auth endpoints.

Fase 2 — Clients [✅ 100%]
CRUD completo con paginación, filtros, soft delete, audit logs.

Fase 3.1 — Banking [✅ 100%]
CRUD de cuentas ACH y tarjetas con enmascaramiento y RBAC.

Fase 3.2-3.4 — Core CRM (Policies, Users, SMTP) [⏳]
Pendientes. Estimado: 8 sesiones.

Fase 3.5.A — SaaS Plans Base [✅ 100%]
Tablas saas_plans, saas_payment_methods. Rol saas_super_admin. CRUD de planes.

Fase 3.5.B — Landing + Registro + Demo [~99%]
3.5.B.1 — Base DEMO + Registro ✅

3.5.B.2 — Landing configurable ✅

3.5.B.3.a — Endpoint público POST /api/saas/register ✅

3.5.B.3.b — Panel Super Admin aprobar/rechazar ✅

3.5.B.4.a.1 — Backend endpoint /payment-methods/public ✅

3.5.B.4.a.2 — Frontend RegisterForm ✅

3.5.B.4.b — Página pública de estado ✅

3.5.B.4.c — Primer login con must_reset_password ✅

3.5.B.4.d — Endpoint upgrade demo → pago ✅

3.5.B.4.e — Frontend pantalla de upgrade ✅

3.5.B.4.e.1 — Uploader de comprobante + auto-aprobación DEMO ✅

3.5.B.4.e.2 — Panel SaaS con datos reales ✅

3.5.B.4.e.3 — Super Admin ve datos reales de cada tenant ✅

3.5.B.4.f — Middleware verificación de límites ✅

3.5.B.4.g — SMTP transaccional SaaS ✅

Fase 3.5.C — Pagos, Verificación, Suspensión [⏳ ~10 sesiones]
Fase 3.5.D — Frontend SaaS Central [⏳ 4 sesiones]
Fase 3.5.E — Verificación de límites [✅ 100% — Sesión #34]
Fase 3.5.F — Cleanup y Estabilización [✅ 100%]
- F.1: Eliminación de mocks en paneles SaaS ✅
- F.2: Corrección de tipos en componentes críticos ✅
- F.3: Limpieza de WhatsAppModule + tsconfig ✅
- F.4: Type guards en Evolution API & SMTP ✅
- F.5: Archivar legacy + versionar tsconfig ✅
- F.6: Activar strictNullChecks + fix WhatsAppAccountsConfig ✅

Fase 3.5.G — Type Hardening [▓▓▓▓░░░░░] 55% (Sesión #37)
- F.7.1: Fix WhatsAppAccountsConfigSection (15 errores) ✅
- F.7.2: Fix evolutionApi.ts (~10 errores) ✅
- F.7.3: Fix smtpService.ts (~10 errores) ✅
- F.7.4: Fix paymentService.ts (~5 errores) ✅
- F.7.5: Fix metaGraphService.ts (~4 errores) ✅
- F.7.6: Fix apiClient.ts (~4 errores) ✅
- F.7.7: Fix UI nullability (SuspendedCompanyLockScreen, UsersRolesModule, WhatsAppModule) ✅
- F.7.8: Fix archivos medianos (ClientModal, PolicyFormModal, ClientFormModal) ✅
- F.7.9: Fix archivos pequeños (AlertsCenterModal, CompanyBrandingModule, etc.) ⏳
- F.7.10: Fix archivos grandes (whatsAppCloudService) ⏳
Objetivo: 96 errores → 48 errores restantes con `strictNullChecks: true`.
Estimado: ~2-3 sesiones más.

Fase 3.6 — Telefonía Avanzada [⏳ ~9 sesiones]
Módulo de gestión de extensiones Issabel + 3 proveedores VoIP (Twilio, RingCentral, RedVozTelecom, CloudTalk).

Fase 4 — Multibandeja Unificada [⏳ 10 sesiones]
Fase 5 — IA + Automatizaciones [⏳ 9 sesiones]
Fase 6 — Analytics + Reportes [⏳ 5 sesiones]
Fase 7 — Producción [⏳ 6 sesiones]
5. SISTEMA DEMO + REGISTRO + UPGRADE
Plan DEMO
id: 'plan-demo', key: 'demo', price_monthly: 0

Límites: 2 usuarios, 20 clientes, 30 pólizas, 1 WhatsApp, 100 msgs/día, 1 GB storage.

Duración: configurable (default 14 días).

Grace period: 30 días.

Estados de Tenant
demo — Cuenta de prueba gratuita
pending_payment — Registro pago, esperando aprobación
active — Cuenta activa con plan pago
suspended — Suspendido por falta de pago
cancelled — Cancelado voluntariamente
expired — Demo expirado sin conversión
Configuración Global (saas_platform_settings)
Fila única (id = 'global') con: demo_enabled, demo_duration_days, demo_grace_period_days, demo_watermark_enabled, demo_plan_id, default_currency, grace_period_days, auto_suspend_on_expire, support_email, support_whatsapp, platform_name.
Flujo de Registro
Demo: usuario completa formulario → solicitud creada → AUTO-APROBADA → tenant + user + subscription creados → usuario puede loguearse inmediatamente.
Pago: usuario completa formulario + sube comprobante → solicitud queda pending → Super Admin revisa y aprueba/rechaza manualmente → usuario recibe password temporal.
Flujo de Upgrade (demo → pago)
Tenant en estado demo navega a "Upgrade a Pago".
Ve catálogo de planes + métodos de pago.
Selecciona plan, billing cycle, método de pago.
Si método es manual o crypto_semi_auto → sube comprobante obligatorio.
Submit → solicitud creada con type='upgrade' y created_tenant_id pre-poblado.
Super Admin aprueba → UPSERT de subscription → tenant pasa a active.
Flujo de Auto-aprobación de DEMO (Sesión #25)
En createRegistrationRequest, si type === 'demo', se llama a autoApproveDemoRegistration(requestId).
Esta función reutiliza approveRegistration con reviewerUserId = null y nota automática.
Si falla, la solicitud queda pending como fallback (el Super Admin puede aprobarla manualmente).
6. CANALES DE MENSAJERÍA
Canal	Key interno	Configuración	Permisos
WhatsApp Vendedores	whatsapp_sales	integrations/	whatsapp.view, whatsapp.send
WhatsApp Seguimiento	whatsapp_support	integrations/	whatsapp.view, whatsapp.send
Telegram Empresa	telegram	integrations/	telegram.view, telegram.send
Telegram SaaS	telegram_saas	saas/	roles SaaS
Web/Microlanding	web	integrations/	web.view
Instagram	instagram	integrations/	instagram.view, instagram.send
Facebook	facebook	integrations/	facebook.view, facebook.send
Arquitectura Unificada
Tabla ÚNICA conversations con columna channel (no una tabla por canal).
Tabla ÚNICA messages con direction y sender_type.
Migración: whatsapp_conversations → conversations (en Fase 4.1).
sql
conversations (id, tenant_id, channel, channel_account, client_id, contact_name, contact_handle, last_message, last_message_at, unread_count, assigned_agent_id, status, metadata_json)
messages (id, conversation_id, direction, sender_type, sender_id, sender_name, content, media_type, media_url, status, timestamp, metadata_json)
7. DECISIONES ESTRATÉGICAS

### Decisión de Negocio — Cuentas DEMO con acceso completo
Las cuentas DEMO deben tener acceso a **TODAS las funcionalidades del sistema** (equivalente al plan más alto), limitadas únicamente por el tiempo (`demo_expires_at`), para permitir una evaluación completa del SaaS.

Telegram
Bot global de Ateendia (no por tenant).
Vinculación con token PERMANENTE.
Anti-spam: rate limit por tenant configurable por plan.
IA premium (planes Pro+).
IA
Proveedor: OpenRouter (multi-modelo).
Diseño: 1 resumen por conversación (no por mensaje — control de costos).
Feature premium (planes Pro+).
Planes SaaS
Tabla saas_plans editable por Super Admin.
Feature flags por plan (Telegram, IA, WhatsApp, etc.).
Límites por plan (users, clients, msgs/día, IA tokens/mes).
Tenants heredan límites de su plan.
Policies
13 tipos GLOBALES: Salud/ACA, Salud Privada, Vida, Dental/Visión, Auto, Hogar/Propiedad, Accidentes Personales, Gastos Médicos Mayores, Viaje, Responsabilidad Civil, Mascotas, Funerario, Indemnización.
Formularios dinámicos: campos comunes en columnas + específicos en JSON.
Historial: tabla policy_versions.
Estados (8): Activa, En Proceso, Pendiente de Pago, Vencida, Cancelada, Renovada, Suspendida, En Revisión.
Retención
Por plan: Starter 30d, Pro 1a, Enterprise ilimitado.
Media externa: Cloudflare R2 o S3.
8. DEUDA TÉCNICA REGISTRADA
Prioridad ALTA
Fase B.5 — Protección de saas_super_admin
Problema: Reglas de visibilidad/gestión de super admins no implementadas.
Reglas a implementar: Solo saas_super_admin puede ver/crear/editar/eliminar otros super admins. Un tenant_admin ve SOLO usuarios de su tenant. No se puede degradar saas_super_admin ↔ rol tenant sin autorización.
Prioridad: ALTA (seguridad multi-tenant).
SMTP-CREDENTIALS-DEPLOY — Configurar credenciales SMTP reales en producción
Problema: El servicio emailService.ts está implementado pero SMTP_USER y SMTP_PASS están vacíos en server/.env. En dev los emails solo se loguean a consola, no se envían.
Causa raíz: No se han configurado credenciales de Gmail (o proveedor equivalente) con App Password.
Solución propuesta: En producción, setear SMTP_USER y SMTP_PASS en el .env del servidor con credenciales válidas. Idealmente usar SMTP dedicado (SendGrid / Mailgun) en lugar de Gmail.
Prioridad: ALTA (solo cuando se pase a producción; en dev no bloquea).
DEUDA-ARQ-RECEIPTS (NUEVA, Sesión #31)
Problema: El frontend tiene saasService.approveReceipt() y saasService.rejectReceipt() apuntando a /api/saas/receipts/* que NO existe en el backend Express. El backend real usa /api/saas/registrations/:id/approve.
Solución Sesión #32: usar reviewService.ts (nuevo) en lugar de saasService.receipts. Deuda de eliminar saasService.receipts.* en Sesión #33 (Cleanup 3.5.F).
Prioridad: MEDIA.
Prioridad MEDIA
BUG-AUTH-1 — JWT expirado sin redirección a login
Problema: Cuando el JWT expira, los endpoints devuelven 401 AUTH_TOKEN_MISSING, pero el frontend no redirige a login. El usuario ve errores crípticos en consola.
Causa raíz: No hay interceptor global de 401 ni manejo centralizado de sesión expirada.
Solución propuesta: Agregar un helper fetchWithAuth() que detecte 401 y llame a authService.logout() + redirija a login. — RESUELTO en Sesión #29.
Prioridad: MEDIA.
BUG-PERFIL-1 — El avatar del usuario no persiste
Problema: Al cambiar el avatar (predeterminado o subido), se actualiza visualmente en memoria, pero al recargar vuelve al original.
Causa raíz:
ProfileModal.tsx llama a updateUser del TenantContext.
TenantContext.updateUser solo hace setCurrentUserState (estado en memoria, no persistente).
authService.updateProfile existe pero usa endpoint legacy /api/user/profile que NO existe en el backend Express actual.
Al recargar, App.tsx lee authService.getState().user desde localStorage (sin el avatar nuevo) y sobrescribe currentUser.
Solución propuesta:
1. Crear PATCH /api/auth/me en Express (actualiza name y avatar en tabla users).
2. Modificar TenantContext.updateUser para llamar al endpoint con JWT.
3. Modificar authService para persistir el user actualizado en localStorage.ateendia_session. — RESUELTO en Sesión #29.
Prioridad: MEDIA.
TenantSubscription['status'] desactualizado
Problema: El tipo frontend no incluye 'demo' ni 'expired' que sí usa el backend.
Afecta: Sidebar.tsx (condición de visibilidad del item Upgrade).
Solución propuesta: Sincronizar tipo frontend con enum real del backend.
Fase B.6 — Roles Custom
Objetivo: Permitir que cada tenant cree roles personalizados.
Archivos a modificar: server/routes/roles.ts (nuevo), server/services/roleService.ts (nuevo), UsersRolesModule.tsx, TenantContext.tsx.
Prioridad: MEDIA (~2-3 horas).
Evolution API crash de nginx
Problema: El contenedor Evolution API crashea con nginx: [emerg] invalid value "must-revalidate".
Impacto: Endpoint /socket.io/ y /instance/fetchInstances responden 401.
Prioridad: MEDIA (bloquea reconectar WhatsApp real).
SMTP-EMAIL-BATCH — Extender emailService con más templates
Problema: Solo existe el template welcome. Faltan: payment_approved, payment_rejected, subscription_expiring, password_reset.
Prioridad: MEDIA.
BUG-ZOD-SYNC (NUEVA, Sesión #31)
Problema: Los tipos ApproveRegistrationOptions del servicio tenían receiptId declarado, pero approveBodySchema (Zod) no lo listaba. Con .strict() activo, el body era rechazado.
Solución: Regla nueva 31 para prevenir futuros casos: siempre verificar schema Zod vs type al agregar campos.
Prioridad: MEDIA.

### DEUDA-TYPE-HARDENING (NUEVA, Sesión #35)

**Problema:** Con `strictNullChecks: true` activado, `npx tsc --noEmit` reporta **96 errores** de tipado en el frontend. Estos errores existían antes pero estaban ocultos por la configuración laxa del `tsconfig.json`.

**Distribución de los 96 errores (top archivos):**
- `PolicyFormModal.tsx` (~8)
- `whatsAppCloudService.ts` (~8)
- `ClientModal.tsx` (~6)
- `ClientFormModal.tsx` (~5)
- `SaasSubscriptionsView.tsx` (~5)
- `paymentService.ts` (~5)
- `metaGraphService.ts` (~4)
- Y ~25 archivos con 1-3 errores cada uno.

**Categorías de error:**
- **TS2554** (~30): argumentos mal llamados (ej: `Expected 3 args, got 4`).
- **TS18047/TS2722** (~20): nullability (`'currentUser' is possibly 'null'`).
- **TS2322/TS2339/TS2820** (~40): tipos incompatibles.
- **TS18046** (~20): `response.json()` devuelve unknown (Regla 29).

**Causa raíz:** El `tsconfig.json` estuvo con `strictNullChecks: false` (implícito) durante muchas sesiones. La deuda se acumuló silenciosamente.

**Solución propuesta:** Fase 3.5.G — Type Hardening (ver sección 4).

**Prioridad:** MEDIA-ALTA. No bloquea el build de Vite (que usa esbuild, no `tsc`), pero bloquea el CI cuando se configure y puede causar bugs sutiles en producción.

**Progreso:** Sesión #35 arregló 15 errores en `WhatsAppAccountsConfigSection.tsx`. Sesión #36 arregló ~29 errores en servicios core y UI (evolutionApi, smtpService, paymentService, metaGraphService, apiClient, SuspendedCompanyLockScreen, UsersRolesModule, WhatsAppModule). Sesión #37 arregló ~19 errores en `ClientFormModal`, `ClientModal`, `PolicyFormModal` y `TenantContext`. **96 → 48 errores restantes**.

Prioridad BAJA
RegisterForm.tsx duplica lógica de fetch
Problema: RegisterForm duplica la lógica de fetch de planes/métodos.
Solución: Consumir registrationService.fetchPlansPublic() y fetchPaymentMethodsPublic().
Prioridad: BAJA.
Indentación cosmética en TenantContext.tsx
Problema: Diff de git muestra cambio de indentación de 2 espacios, no de lógica.
Solución: Limpiar en sesión de cleanup.
Prioridad: BAJA.
Bug encoding María Test
Problema: El usuario María Test está guardado como Mar�a Test (U+FFFD).
Causa: Invoke-RestMethod sin UTF-8 en sesión anterior. NO es bug de producción.
Solución: UPDATE users SET name='María Test' WHERE ...
Prioridad: BAJA (cosmético).
Fase C.0 — Migración tipada de WhatsApp/Evolution
Problema: WhatsAppAccountsConfigSection.tsx tiene 29 errores TS porque response.json() devuelve unknown.
Solución: Tipar cada response.json() as EvolutionApiResponse.
Prioridad: BAJA (no bloqueante).
4 errores TS preexistentes en SaasCentralDashboard.tsx
Problema: Los errores Type 'X' is not assignable to type 'IntrinsicAttributes' en las líneas 1305, 1317, 1330 y 2698 son preexistentes (props no declaradas en los tipos de los sub-componentes).
Solución: Declarar las props faltantes en las interfaces de SaasPlansManagementSection, SaasSmtpConfigSection, SaasWhatsAppCentralSection y ajustar SaasLandingPreviewModal.
Prioridad: BAJA (no bloqueante).

### BUG-RESOLVE-LIMIT-PARALLEL (NUEVA, Sesión #34)
Problema: `saasLimitsService.getTenantLimits()` hace 1 query para contar suscripciones y 1 query más para leer plan/planName, ambas podrían paralelizarse con las 3 queries de count.
Causa raíz: Implementación inicial priorizó claridad sobre performance.
Solución propuesta: Unificar en una sola transacción paralela o usar `include` en la query de suscripción. Optimización cosmética.
Prioridad: BAJA (no bloquea, volumen de tenants aún bajo).

### BUG-EMPTY-SRC-RECEIPT (NUEVA, Sesión #33)
Problema: En `PaymentReceiptViewerModal.tsx`, cuando un comprobante no tiene `receiptImageUrl` o es un string vacío, React lanza un warning en consola (`An empty string ("") was passed to the src attribute`).
Solución: Usar renderizado condicional para evitar poner el atributo `src` si la URL está vacía.
Prioridad: BAJA.

### Sesión #35 (Continuación) — Cierre Fase 3.5.F + Apertura Fase 3.5.G
**Fecha:** 2026-11-12
**Commits:**
- `a6b63d4` — chore(cleanup): Fase 3.5.F.5 - archivar legacy y versionar tsconfig
- `1bd3c5b` — chore(fase-3.5.f.6): activar strictNullChecks + cerrar Fase 3.5.F

**Objetivo cumplido:**
- **F.5 completada:** 4 archivos legacy eliminados (`MIGRATION_GUIDE.md`, `prisma.old/`, `schema.sql.old`, `seed.sql`).
- **F.5 completada:** 3 archivos movidos a `_archive/` (`functions/`, `src/index.ts`, `src/lib/`).
- **F.5 completada:** `_archive/README.md` creado y versionado.
- **F.5 completada:** `.gitignore` reescrito (encoding arreglado, `_archive/*` ignorado, `backup_legacy_F5_*.zip` ignorado).
- **F.5 completada:** `tsconfig.json` versionado (eliminado del `.gitignore`, crítica para nuevos devs).
- **F.6 completada:** `strictNullChecks: true` activado en `tsconfig.json` (decisión de producción).
- **F.6 completada:** 15 errores resueltos en `WhatsAppAccountsConfigSection.tsx` (4 por `instance: never`, 10 por `currentUser` null, 1 por `src: null`).

**Archivos NUEVOS (3):**
- `_archive/README.md` — Documenta los archivos archivados.
- `_archive/functions/` — Código de Cloudflare Workers antiguo (ignorado por Git).
- `_archive/src/` — Entry point y libs del frontend antiguo (ignorado por Git).

**Archivos MODIFICADOS (3):**
- `.gitignore` — Reescrito. `_archive/*` ignorado, `tsconfig.json` des-ignorado, backup ignorado.
- `tsconfig.json` — `strictNullChecks: true` agregado. `noImplicitAny: false`.
- `src/components/integrations/WhatsAppAccountsConfigSection.tsx` — 15 fixes de nullability.

**Archivos ELIMINADOS (4):**
- `MIGRATION_GUIDE.md`, `prisma.old/`, `schema.sql.old`, `seed.sql`.

**Lecciones aprendidas:**
- **Regla 34 (Edición Quirúrgica):** los archivos de 1000+ líneas requieren cambios por bloques, no reescrituras.
- **StrictNullChecks es obligatorio para producción:** activarlo revela ~40 errores de nullability que estaban ocultos. Es deuda real.
- **`Compress-Archive` + `Test-Path`:** siempre hacer backup antes de mover/borrar archivos legacy.
- **PowerShell heredoc con single-quote (`@'...'@`):** la única forma segura de escribir strings con backticks, acentos y variables sin escapes.

**Deuda técnica registrada:** ver `DEUDA-TYPE-HARDENING` (nueva, sección 8).

**Estado al cierre:** ✅ Fase 3.5.F al 100%. Fase 3.5.G abierta.

### Sesión #36 — Fase 3.5.G.2: Type Hardening (Servicios Core + UI Nullability)
**Fecha:** 2026-11-13
**Commit:** `HEAD` (pendiente de push)

**Objetivo cumplido:**
- Reducir errores TypeScript de 96 a 67 (~29 errores resueltos en esta sesión).
- Aplicar Regla 29 (type guards para `response.json()`) a servicios core.
- Corregir nullability de `currentUser` en componentes UI críticos.

**Archivos MODIFICADOS (9):**
- `src/services/evolutionApi.ts` — Type guards en `fetchQR`, `sendTextMessage`, `sendMediaMessage`. Eliminados `any` en catches.
- `src/services/smtpService.ts` — Añadido tipo `PbRecord<T>` para tipar respuestas de PocketBase. Eliminados `any`.
- `src/services/paymentService.ts` — Type guards en retornos de Stripe/PayPal y uploads.
- `src/services/metaGraphService.ts` — Type guards en `data` y errores.
- `src/services/apiClient.ts` — Type guards en `request<T>` y manejo de `unknown`.
- `src/components/saas/SuspendedCompanyLockScreen.tsx` — Optional chaining en `currentUser`.
- `src/components/users/UsersRolesModule.tsx` — Optional chaining en `currentUser`.
- `src/components/whatsapp/WhatsAppModule.tsx` — Optional chaining en `currentUser` (10 fixes).

**Lecciones aprendidas:**
- **Regla 29 + strictNullChecks:** La combinación obliga a tipar cada `response.json()` con type guards exhaustivos. El patrón `const raw: unknown = await res.json(); if (isSuccessResponse(raw)) { ... }` escala mejor que casts inline.
- **Eliminación de `any` en catches:** En TS estricto, `catch (e: unknown)` + type guard `e instanceof Error` es más seguro que `catch (e: any)`.
- **Optional chaining masivo:** 10 fixes en `WhatsAppModule.tsx` demuestran que `currentUser?.property` resuelve TS2722/TS18047 sin cambiar lógica.
- **Progreso incremental:** Atacar archivos por categoría (servicios → UI) permite medir avance real (96→67).

**Deuda técnica pendiente (Fase 3.5.G.3):**
- Errores TS2554 (Argumentos incorrectos en `ClientModal.tsx` y `PolicyFormModal.tsx`).
- Sincronizar tipos en `ClientFormModal.tsx` (enums de estado civil y género).
- Archivos pequeños restantes (`AlertsCenterModal`, `CompanyBrandingModule`, etc.).

**Estado al cierre:** ✅ Fase 3.5.G.2 completada. Fase 3.5.G al ~40%.

### Sesión #37 — Fase 3.5.G.3: Type Hardening (Modales Clientes + Pólizas + Catalogos TenantContext)
**Fecha:** 2026-11-13
**Commit:** `<hash_del_commit>` — fix(fase-3.5.g.3): type hardening en ClientFormModal, ClientModal y PolicyFormModal + fix catalogs en TenantContext

**Objetivo cumplido:**
- Reducir errores TypeScript de 67 a **48** (~19 errores resueltos en esta sesión).
- Corregir errores TS2554 (argumentos incorrectos) en `ClientModal.tsx` y `PolicyFormModal.tsx`.
- Sincronizar enums de género y estado civil en `ClientFormModal.tsx`.
- Restaurar interfaz `catalogs` completa en `TenantContext.tsx`.

**Archivos MODIFICADOS (4):**
- `src/components/clients/ClientFormModal.tsx` — Alineación de enums de género (`'M'`) y estado civil (`'Soltero/a'`). Fallback seguro para `catalogs.leadSources`.
- `src/components/clients/ClientModal.tsx` — Corrección de argumentos en `addNote`, `addDocument`, `deleteDocument` y `startWhatsAppConversation`. Eliminación de 4to argumento en `sendEmailMessage`.
- `src/components/policies/PolicyFormModal.tsx` — Corrección de `startDate` a `effectiveDate`. Cast temporal `(catalogs as any)` para `carriers` y `plans`. Corrección de argumentos en `updatePolicy`.
- `src/context/TenantContext.tsx` — Restauración de la interfaz `catalogs` completa (clientCategories, leadSources, policyTypes).

**Lecciones aprendidas:**
- **Regla 34 (Edición Quirúrgica):** Los archivos de 1000+ líneas se modifican por bloques exactos. El código completo solo se entrega cuando el usuario lo solicita explícitamente para evitar regresiones.
- **Regla 37 (No confundir VS Code con tsc):** Los errores de cSpell (ortografía) saturan el panel de VS Code. La única fuente de verdad es `npx tsc --noEmit`.
- **Verificación de guardado:** Siempre verificar que el puntito blanco de VS Code haya desaparecido antes de correr `tsc`. Si el archivo no está guardado, el compilador lee la versión anterior.

**Deuda técnica pendiente (Fase 3.5.G.4):**
- Archivos pequeños restantes (`AlertsCenterModal`, `CompanyBrandingModule`, etc.).
- 2 archivos grandes (`whatsappCloudService`).

**Estado al cierre:** ✅ Fase 3.5.G.3 completada. Fase 3.5.G al ~55%.

### Sesión #34 — Fase 3.5.E: Verificación de Límites (Completada)
**Fecha:** 2026-11-11
**Commit:** `<hash_del_commit>`
**Push:** origin/main

**Objetivo cumplido:**
- Refactor arquitectónico ARQ-LIMITS: eliminar duplicación entre
  `checkLimits.ts` (middleware) y `saasLimitsService.ts` (servicio).
  Ahora `checkLimits.ts` importa `resolveLimit()` del servicio.
- Aplicar `checkLimit('clients')` en POST /api/clients.
- Aplicar `checkLimit('policies')` en POST /api/policies.
- Prueba de Oro end-to-end exitosa (Regla 32).

**Archivos NUEVOS (5):**
- `server/services/saasLimitsService.ts` — Servicio con `resolveLimit()` (fuente
  única) y `getTenantLimits()` (para UI, 3 queries en paralelo).
- `server/routes/saas/limits.ts` — Endpoint GET /api/saas/me/limits
  (bypass Regla 22 para super_admin).
- `server/types/limits.ts` — DTOs: TenantLimitsDTO, LimitResource,
  GetLimitsResult (discriminated union).
- `src/services/limitsService.ts` — Cliente HTTP frontend (Regla 29 type guards).
- `src/components/ui/UsageProgressBar.tsx` — Barra de progreso con 3 estados
  (verde <80%, ámbar >=80%, rojo >=100%).

**Archivos MODIFICADOS (7):**
- `server/middleware/checkLimits.ts` — REFACTOR: usa `saasLimitsService.resolveLimit()`
  en vez de duplicar lookup. Añadido manejo de `limit === -1` (ilimitado).
- `server/routes/saas.ts` — Monta `/me/limits` (import + use).
- `server/routes/clients.ts` — Añadido `checkLimit('clients')` en POST.
- `server/routes/policies.ts` — Añadido `checkLimit('policies')` en POST.
- `src/context/TenantContext.tsx` — Añadido: `tenantLimits`, `tenantLimitsLoading`,
  `refreshTenantLimits`, useEffect que recarga al cambiar `activeTenantId`.
- `src/components/branding/CompanyPlanBillingTab.tsx` — Reescrito para consumir
  `tenantLimits` reales. Eliminados mocks. Integra UsageProgressBar.
- (verificación adicional) `src/components/layout/Header.tsx` — Confirmado:
  `HEADER-HARDCODED` resuelto en Sesión #33 (usa `saasTenants` reales).

**Lecciones aprendidas:**
- **Regla ARQ-LIMITS:** cuando dos capas (middleware + servicio) resuelven el
  mismo dato, la refactorización a fuente única (`resolveLimit()`) es más
  limpia que mantener dos implementaciones.
- **Regla 32 (Prueba de Oro)** demostró su valor: detectó que `clients.ts` y
  `policies.ts` NO tenían `checkLimit` aplicado (deuda desde Sesión #27).
  Sin la prueba, el bug habría llegado a producción.
- PowerShell + bcrypt hash: los caracteres `$` del hash pueden requerir
  escribir el SQL en un archivo temporal con UTF-8 (alternativa a `-e`).
- El tenant DEMO de prueba (ChiclaSend) con `max_clients=20` fue ideal para
  Prueba de Oro: se llena rápido, tiene margen para verificar fallos.

**Deuda técnica registrada:** ver sección 8 (BUG-RESOLVE-LIMIT-PARALLEL,
prioridad BAJA).

**Estado al cierre:** ✅ Sesión cerrada. Fase 3.5.E al 100%.

### Sesión #35 — Fase 3.5.F: Cleanup y Estabilización (Sub-fase F.4 Completada)
**Fecha:** 2026-11-12
**Commit:** `6d55540`
**Push:** origin/main (b89a533..6d55540)

**Objetivo cumplido (Sub-fase F.4):**
- Aplicar Regla 29 (type guards para `response.json()`) a los 4 archivos con 77 errores TS2339:
  1. `src/services/evolutionApi.ts` (~15 errores)
  2. `src/services/smtpService.ts` (~10 errores)
  3. `src/components/integrations/WhatsAppAccountsConfigSection.tsx` (~30 errores)
  4. `src/components/saas/SaasWhatsAppCentralSection.tsx` (~20 errores + 1 error TS2503 NodeJS namespace)
- Corregir `NodeJS.Timeout` → `ReturnType<typeof setInterval>` en ambos componentes (compatibilidad tras excluir `server/` del `tsconfig.json`).

**Archivos MODIFICADOS (4):**
- `src/services/evolutionApi.ts` — Type guards en `createInstance`, `checkConnectionState`, `fetchInstances` normalization.
- `src/services/smtpService.ts` — Type guards en `testConnection`, `sendEmail`, `testSaasConnection`.
- `src/components/integrations/WhatsAppAccountsConfigSection.tsx` — Tipos `EvolutionInstance`, `EvolutionQrResponse`, `EvolutionInstanceCreateResponse`; type guards en todos los `fetch` (createInstance, fetchQR, checkConnection, fetchInstances, checkInstanceConnection, sendTextMessage).
- `src/components/saas/SaasWhatsAppCentralSection.tsx` — Mismos tipos; type guards en polling, createInstance, fetchQR, checkConnection, sendTextMessage; fix `NodeJS.Timeout`.

**Lecciones aprendidas:**
- **Regla 29 aplicada sistemáticamente:** El patrón `const raw: unknown = await res.json(); if (raw && typeof raw === 'object') { const data = raw as MyType; }` elimina todos los TS2339 ("Property does not exist on type 'unknown'") en llamadas a Evolution API y SMTP.
- **Namespace `NodeJS` en frontend:** Tras excluir `server/` del `tsconfig.json` (F.3), `NodeJS.Timeout` deja de estar disponible. La solución portable es `ReturnType<typeof setInterval>` / `ReturnType<typeof setTimeout>`.
- **Evolution API respuestas variables:** La API devuelve array directo, `{ instance: [...] }`, `{ instances: [...] }`, o `{ data: [...] }`. La normalización con type guards maneja los 4 casos sin `any`.
- **Edición quirúrgica (Regla 34):** Bloques reemplazables precisos en archivos de 1000+ líneas evitan regresiones.

**Deuda técnica pendiente (Sub-fases F.5, F.6):**
- F.5: 9 archivos legacy sin trackear (functions/, prisma.old/, src/index.ts, src/lib/, src/services/databaseService.ts, MIGRATION_GUIDE.md, schema.sql.old, seed.sql, .vscode/).
- F.6: Indentación cosmética en TenantContext.tsx (2 espacios) + 4 errores TS preexistentes en SaasCentralDashboard.tsx.

**Estado al cierre:** ✅ Sub-fase F.4 completada. Fase 3.5.F al ~75%.

### Sesión #32 — Fase 3.5.C: Frontend de Aprobación de Comprobantes (Completada)
**Fecha:** 2026-10-26
**Commit:** `97787a8`
**Push:** origin/main (46ea85a..97787a8)

**Objetivo cumplido:**
- Integrar el PaymentReceiptViewerModal en el panel de suscripciones.
- Reescribir reviewService.ts usando fetchWithAuth y Type Guards.
- Crear el adaptador registrationToReceipt.ts para unir backend y UI.
- Verificación visual end-to-end del flujo de aprobación y activación de empresa.

**Archivos NUEVOS (2):**
- `src/services/reviewService.ts` — Servicio reescrito con type guards (Regla 29) y manejo de tokens con fetchWithAuth.
- `src/adapters/registrationToReceipt.ts` — Puente entre el DTO del backend (SaasRegistrationRequest) y el tipo de la UI (SaasPaymentReceipt).

**Archivos MODIFICADOS (2):**
- `src/components/saas/SaasSubscriptionsView.tsx` — Añadida sección de comprobantes pendientes y conexión con el Modal.
- `AGENTS.md` — Actualización de memoria.

**Lecciones aprendidas:**
- Los Type Guards de la Regla 29 deben ser flexibles para aceptar variaciones en la estructura de respuesta (ej. `{ data: [...] }` vs `{ data: { items: [...] } }`).
- Los adaptadores son la mejor solución para no tener que reescribir componentes visuales ya probados cuando la estructura de datos del backend difiere del frontend.

**Deuda técnica registrada:** ver sección 8.

**Estado al cierre:** ✅ Sesión cerrada. Fase 3.5.C (Backend + Frontend) al 100%.

### Sesión #33 — Fase 3.5.D: Limpieza de Paneles SaaS, Datos Reales y Filtros (Completada)
**Fecha:** 2026-10-27
**Commit:** `14b4365`
**Push:** origin/main (97787a8..14b4365)

**Objetivo cumplido:**
- Eliminación de fallbacks a mock en `SaasCentralDashboard.tsx` (Regla 28). `tenantsSource` ahora es estrictamente `saasTenants`.
- Refactorización de la vista Grid y Tabla para usar `usersCount`, `clientsCount` y `policiesCount` del `SaasTenantDTO`.
- Añadido indicador visual de estado de suscripción (Al día / Vencida) en Grid y Tabla.
- Integración de la función `loadRegistrationHistory` en un `useEffect` al entrar a la pestaña `payment_receipts`.
- Reemplazo del renderizado de la tabla de comprobantes para usar el array `allRegistrations` (historial completo) en lugar de `saasPaymentReceipts`.
- Uso del adaptador `mapRegistrationToReceipt` para transformar los DTOs reales al formato visual del modal.
- Actualización del badge contador de la pestaña para leer de `allRegistrations`.
- Modificación de `reviewService.ts` para aceptar parámetro `status: 'pending' | 'all' | 'approved' | 'rejected'` (default 'pending').

**Archivos MODIFICADOS (2):**
- `src/components/saas/SaasCentralDashboard.tsx` — Limpieza completa de mocks, integración de datos reales, filtros y adaptadores.
- `src/services/reviewService.ts` — Parámetro `status` en `listPendingRegistrations`.

**Lecciones aprendidas:**
- **Regla 34 (Edición Quirúrgica por Bloques)**: Cuando el usuario es principiante y el archivo a modificar es masivo (como el Dashboard SaaS), NUNCA dar el código completo. Proveer únicamente los bloques exactos de código a reemplazar (indicando claramente el bloque anterior y el nuevo), usando comentarios en el código para ubicar visualmente el cambio.

**Deuda técnica registrada:** ver sección 8 (BUG-EMPTY-SRC-RECEIPT).

**Estado al cierre:** ✅ Sesión cerrada. Fase 3.5.D (Frontend SaaS Central) al 100%.

### Sesión #31 — Fase 3.5.C: Flujo de Aprobación de Comprobantes (Backend + Prueba de Oro)
**Fecha:** 2026-10-25
**Commit:** `46ea85a`
**Push:** origin/main (9e8f06e..46ea85a)

**Objetivo cumplido:**
- Completar la lógica de backend para el flujo de aprobación de comprobantes.
- Asegurar que las fechas de vigencia (validFrom/validUntil) del modal se persistan correctamente en la suscripción.
- Añadir trazabilidad del comprobante aprobado (`receiptId`) en las notas de la solicitud.
- Validar todo el flujo end-to-end con una "Prueba de Oro" usando curl + SQL.

**Archivos MODIFICADOS (3):**
- `server/services/saasRegistrationReviewService.ts` — Fix A.1 (start_date en update), Fix A.2 (receiptId en review_notes), integración de options.validFrom/validUntil.
- `server/routes/saas/registrations.ts` — Fix complementario: agregado `receiptId` al `approveBodySchema` para que Zod no lo rechace.
- `AGENTS.md` — Actualizado con los cambios y nuevas reglas.

**Lecciones aprendidas:**
- La Regla 31 (Sincronización Zod ↔ Type) nació de un bug real en esta sesión. Es crucial verificar ambas capas de validación.
- La Regla 32 (Prueba de Oro) demostró ser invaluable para detectar que el backend no aplicaba las fechas de vigencia correctamente, antes de empezar a construir la UI.
- La Regla 33 (Docker Exec sin espacio en -p) es un detalle pequeño pero que puede costar tiempo de debugging.

**Deuda técnica registrada:** ver sección 8 (DEUDA-ARQ-RECEIPTS, BUG-ZOD-SYNC).

**Estado al cierre:** ✅ Sesión cerrada. Backend de la Fase 3.5.C al 100%.

### Sesión #30 — Fase 3.5.C: Pagos y Suscripciones (Backend + Panel Super Admin)
**Fecha:** 2026-10-22
**Commit:** `9e8f06e`
**Push:** origin/main (b4793bf..9e8f06e)

**Objetivo cumplido:**
- Implementación exitosa de la capa de backend (servicio + endpoints) para la gestión de suscripciones SaaS.
- Creación del panel de gestión para el Super Admin en el frontend (tabla con estados y acciones).
- Verificación end-to-end del flujo de listado y cambio de estado (PATCH).

**Archivos NUEVOS (4):**
- `server/services/saasSubscriptionService.ts` — Servicio con funciones para obtener, listar y actualizar el estado de suscripciones (transacciones atómicas).
- `server/routes/saas/subscriptions.ts` — Endpoints REST: `GET /me`, `GET /`, `PATCH /:id/status`.
- `src/services/subscriptionService.ts` — Cliente HTTP con type guards (Regla 29) para el frontend.
- `src/components/saas/SaasSubscriptionsView.tsx` — Componente de tabla para el Super Admin con acciones de suspender/activar.

**Archivos MODIFICADOS (3):**
- `server/routes/saas.ts` — Montaje del nuevo router `/subscriptions`.
- `src/components/saas/SaasCentralDashboard.tsx` — Integración de la nueva pestaña "Estado de Suscripciones".
- `src/types/index.ts` — Nuevo tipo `SubscriptionDTO` (espejo del backend).

**Lecciones aprendidas:**
- El "narrowing" (estrechamiento de tipos) de TypeScript funciona mejor cuando se evalúa primero el caso de éxito (`if (result.success)`) en lugar de la negación. Esto permite que el bloque `else` tipifique correctamente `result.error`.
- Es fundamental aplicar el casteo `as React.ComponentType<any>` a componentes que aún no tienen sus props tipadas para evitar errores de TS en el archivo padre sin modificar los hijos.

**Deuda técnica registrada:** ver sección 8.

**Estado al cierre:** ✅ Sesión cerrada.
`git log --oneline -3` confirma 9e8f06e como HEAD y origin/main.

### Sesión #29 — Cleanup y Estabilización (3.5.F)
**Fecha:** 2026-10-20
**Commits:** `cfb6c3f`, `877cccc`, `3c504e4`, `6f942d7`, `b4793bf`
**Push:** origin/main (35cca1d..b4793bf)

**Objetivo cumplido:**
- Resolución de BUG-AUTH-1 y BUG-PERFIL-1.
- Limpieza de deuda técnica de `src/` (23 archivos commiteados).
- Configuración de `.gitignore` y destrackeo de archivos legacy.

**Archivos NUEVOS/MODIFICADOS (Backend):**
- `server/routes/auth.ts`: Nuevo endpoint `PATCH /api/auth/me`.
- `server/prisma/schema.prisma`: Campo `avatar` cambiado a `@db.LongText`.

**Archivos NUEVOS/MODIFICADOS (Frontend):**
- `src/services/authService.ts`: Implementado `fetchWithAuth` (interceptor 401).
- `src/context/TenantContext.tsx`: Refactorizado para usar `fetchWithAuth`. `updateUser` ahora persiste en backend.
- `src/components/layout/ProfileModal.tsx`: Redimensión de imágenes a 256x256 antes de guardar.

**Lecciones aprendidas:**
- Los avatares en Base64 pueden exceder el límite de `TEXT` (64KB). Usar `LONGTEXT` en Prisma y comprimir en el frontend con `<canvas>`.
- El interceptor de 401 (`fetchWithAuth`) es esencial para la estabilidad de la sesión.

### Sesión #28 — Fix permisos DEMO + SMTP transaccional (3.5.B.4.g)
**Fecha:** 2026-10-19
**Commit:** 35cca1d
**Push:** origin/main (009f164..35cca1d)
**Archivos commiteados:** 6 (650 insertions, 92 deletions)

**Objetivo cumplido:**
- Resuelta deuda técnica ALTA `BUG-DEMO-PERMISSIONS-FIX`.
- Implementada sub-fase 3.5.B.4.g (SMTP transaccional SaaS).

**Archivos NUEVOS (2):**
- `server/prisma/seedTenantAdminRole.ts` — Seed idempotente del rol
  global tenant_admin + 22 permisos base.
- `server/services/emailService.ts` — Transporter nodemailer + template
  welcome HTML + fallback seguro sin credenciales.

**Archivos MODIFICADOS (2):**
- `server/services/saasRegistrationReviewService.ts` — Refactor del
  bloque de permisos (copia desde rol global) + llamada a
  sendWelcomeEmail() fuera de la transacción.
- `server/package.json` (+ lock) — Deps: nodemailer, @types/nodemailer.

**Lecciones aprendidas:**
- Los roles globales de Prisma requieren `tenant_id = NULL` explícito;
  no basta con `tenant_id` ausente.
- En SQL puro, `key` es palabra reservada en MariaDB → backticks
  obligatorios. Esto se suma a la Regla 15 (usar archivo .sql en
  PowerShell para evitar problemas de escaping).
- Los emails transaccionales DEBEN enviarse fuera de la transacción
  de DB, para que un fallo SMTP no revierta la creación del tenant.
- Un servicio de email debe ser idempotente / fail-safe: mejor loguear
  y seguir que romper el flujo principal.

**Verificación end-to-end:**
- `npx tsc --noEmit -p server/tsconfig.json` → 0 errores.
- Tenant `test-email` creado con 22 permisos (paridad exacta con rol
  global).
- Registro DEMO exitoso → aprobación automática → login exitoso →
  dashboard accesible.
- Log de Express muestra `[approveRegistration] Email de bienvenida
  NO enviado... SMTP_NOT_CONFIGURED` (fallback esperado).

**Deuda técnica registrada:** ver sección 8.

**Estado al cierre:** ✅ Sesión cerrada.

`git log --oneline -3` confirma 35cca1d como HEAD y origin/main.

`git status --short` muestra 0 archivos del commit pendientes
(solo queda deuda técnica preexistente de Sesión #29).

Fase 3.5.B al 100% (todas las sub-fases B.1 a B.4.g completadas).

Los ~28 archivos M en src/ + 9 legacy sin trackear + tsconfig.json
.kilo/kilo.jsonc quedan FUERA de este commit intencionalmente.
Serán atendidos en Sesión #29 (3.5.F Cleanup).

### Sesión #27 — Middleware verificación de límites + Fix auto-aprobación DEMO (3.5.B.4.f)
**Fecha:** 2026-10-19
**Commit:** <hash_del_commit>
**Push:** <hash_push>

**Objetivo cumplido:** Implementación exitosa de middleware de límites (3.5.B.4.f) en users.ts. Se corrigió el flujo de auto-aprobación de demos (Opción B) para que usen la contraseña original y obtengan el plan más alto. Queda pendiente la creación automática de permisos (deuda técnica).

**Archivos MODIFICADOS (Backend):**
- `server/middleware/checkLimits.ts`: Nuevo middleware `checkLimit()` para verificar límites del plan antes de crear recursos.
- `server/routes/users.ts`: Aplicado middleware `checkLimit('users')` en ruta POST.
- `server/services/saasRegistrationReviewService.ts`: Modificado `autoApproveDemoRegistration` para usar `passwordHash` de la solicitud y `must_reset_password = 0`, y asignar el plan más alto disponible.

**Deudas técnicas nuevas registradas (ver sección 8):**
- BUG-DEMO-PERMISSIONS-FIX: La creación automática de permisos para demos falla por conflicto de claves foráneas (ALTA).
- Mejora de middleware de límites: extender `checkLimit()` a `clients` y `policies` (BAJA).

**Próximo paso:** Fase 3.5.B.4.g — SMTP transaccional SaaS.

Sesión #26 — Panel SaaS con datos reales (3.5.B.4.e.2)
Fecha: 2026-10-14

Objetivo cumplido: El panel SaaS ahora muestra todos los tenants reales de la DB, no solo el mock del contexto.

Archivos NUEVOS (2):

server/services/saasTenantsService.ts — Servicio con listAllTenants() que lee tenants de la DB con stats agregadas (users, clients, policies) + subscription.

server/routes/saas/tenants.ts — Router con GET /api/saas/tenants (protegido por requireAuth + requirePlatformUser).

Archivos MODIFICADOS (4):

server/routes/saas.ts — Import + mount del saasTenantsRouter.

src/types/index.ts — Tipo SaasTenantDTO espejo del backend.

src/context/TenantContext.tsx — Estado saasTenants + saasTenantsLoading + función refreshSaasTenants() que hace fetch a /api/saas/tenants cuando el usuario es saas_super_admin.

src/components/saas/SaasCentralDashboard.tsx — Consume saasTenants (real) en lugar de tenants (mock). Nuevo filtro por estado. Nuevo botón "Refrescar". Loading state. Métricas calculadas en base a tenants reales. Se llama refreshSaasTenants() tras aprobar/rechazar comprobantes.

Endpoints nuevos (1): GET /api/saas/tenants.

Pruebas end-to-end exitosas:

El panel muestra los 3 tenants reales de la DB (415c939d... demo, platform cancelled, tenant-demo active).

Indicador "● Datos reales" en verde.

Contador correcto: "3 de 3 empresas".

Filtro por estado funciona (demo/active/suspended).

Botón "Refrescar" recarga la lista.

Métricas globales calculadas correctamente (MRR=$0 porque todas están en plan DEMO/sin plan).

Bug detectado y corregido durante la sesión: TypeScript no hacía narrowing sobre response.json() (unknown). Solución: type guard explícito con 'success' in body && ... (Regla 29 agregada).

Deuda técnica nueva registrada:

3.5.B.4.e.3 — Super Admin ve datos reales de cada tenant (ALTA). Al hacer clic en "Entrar a Instancia", el branding se actualiza pero los datos no se recargan.

Próximo paso: Fase 3.5.B.4.e.3 — Super Admin ve datos reales de cada tenant.

Sesión #25 — Fix auto-aprobación DEMO + Uploader comprobante (3.5.B.4.e.1)
Fecha: 2026-10-13

Contexto: Se detectaron 2 bugs críticos durante las pruebas de la Sesión #24:

Los registros DEMO quedaban en pending esperando aprobación humana.

El panel SaaS no mostraba tenants nuevos (solo el del seed).

Archivos MODIFICADOS (Backend):

server/services/saasRegistrationReviewService.ts:

Firma de approveRegistration cambiada: reviewerUserId: string | null.

Nueva función autoApproveDemoRegistration(requestId).

server/services/saasRegistrationService.ts:

createRegistrationRequest ahora auto-aprueba registros type='demo'.

Archivos MODIFICADOS (Frontend):

src/components/saas/TenantUpgradeView.tsx:

Estado interno para comprobante (receiptFile, receiptBase64, etc.).

Handlers handleReceiptChange, handleReceiptClear, helper formatFileSize.

Nueva sección "4. Comprobante de pago" con badge OBLIGATORIO/OPCIONAL.

Validación en submit + botón deshabilitado.

Payload incluye receiptUrl, receiptFilename, receiptFileSize.

Nuevo estado already_pending + componente AlreadyPendingCard.

Regla nueva: Sección 7 — Regla 28: "Sistema para producción, no para simulación".

Deuda técnica registrada: 3.5.B.4.e.2 (Panel SaaS con datos reales) — ALTA.

Próximo paso: Fase 3.5.B.4.e.2 — Panel SaaS con datos reales.

Sesión #24 — Fase 3.5.B.4.e: Frontend pantalla de upgrade
Fecha: 2026-10-13

Commit: a1ec881 (padre: 517d0da).

Objetivo: Pantalla frontend de upgrade demo → pago.

Archivos NUEVOS (2): src/services/upgradeService.ts, src/components/saas/TenantUpgradeView.tsx.
Archivos MODIFICADOS (4): src/types/index.ts, src/services/registrationService.ts, src/components/layout/Sidebar.tsx, src/App.tsx.

Pruebas end-to-end (4/4 exitosas): item en sidebar, carga de planes/métodos, submit, verificación en DB.

Bug resuelto: El item "Upgrade a Pago" aparecía para saas_super_admin. Fix: exclusión explícita en Sidebar.

Deuda técnica registrada: 3.5.B.4.e.1 (uploader de comprobante).

Sesión #23 — Fase 3.5.B.4.d: Endpoint upgrade demo → pago
Fecha: 2026-10-12

Commit: 67118c3 (padre: e3e7de9).

Objetivo: Endpoint backend para upgrade demo → pago sin perder cuenta/datos.

Archivos NUEVOS (3): server/types/upgrade.ts, server/services/saasUpgradeService.ts, server/routes/saas/upgrade.ts.
Archivos MODIFICADOS (4): saasRegistrationReviewService.ts (detección type='upgrade'), saasRegistrationService.ts (normalizeRegistrationType reconoce 'upgrade'), types/registration.ts, routes/saas.ts.

Endpoints nuevos (2): GET /api/saas/upgrade/eligibility, POST /api/saas/upgrade.

Pruebas end-to-end (7/7 exitosas): incluye la "PRUEBA DE ORO" (aprobar upgrade sin duplicar tenant/user).

Decisiones arquitectónicas:

Reutilizar created_tenant_id como vínculo al tenant existente.

type='upgrade' sin migración (VARCHAR(16) sin CHECK).

tenant_id del JWT, no del body (anti-IDOR).

Sesión #22 — Kill Switch WhatsApp + Fix Sidebar por Rol
Fecha: 2026-10-12

Commits: 07ffaad (Kill Switch WhatsApp), e3e7de9 (Fix Sidebar por Rol).

Logros Fase A — Kill Switch WhatsApp:

Problema: bucle infinito de errores WebSocket (49,000+ errores) al abrir Integraciones.

Causa: Evolution API crashea por bug de nginx + frontend reintenta cada 5s.

Solución: SOCKET_IO_ENABLED = false en whatsappSocketService.ts + silenciar polling.

Logros Fase B — Fix Sidebar por Rol:

Problema: sidebar mostraba "Operaciones & SaaS" a usuarios tenant.

Causa: can() era un stub que devolvía true siempre + isSuperAdmin chequeaba email hardcodeado.

Solución: implementación real de can() + isSaasSuperAdmin chequea currentUser.role === 'saas_super_admin'.

Deuda técnica registrada: B.5 (protección saas_super_admin), B.6 (roles custom), C.0 (migración tipada Evolution).

Sesión #20 — Fix Pantallas en Blanco (Bloque Base)
Fecha: 2026-10-11

Commit: a4e9ebe.

Logros: 16 stubs agregados en TenantContext. 5/6 pantallas desbloqueadas. Fix bug charAt en ClientsListView.

Deuda técnica: ~40 stubs restantes. Cast as unknown as TenantBranding. 30 archivos M sin commitear. 9 archivos legacy sin trackear.

Sesión 3.5.B.4.c — Primer login con must_reset_password
Fecha: 2026-10-11

Commit: 7d370f0 (padre: 14017af).

Logros: Endpoint POST /api/auth/change-initial-password + frontend FirstLoginPasswordChangeView.tsx. Fix bucle infinito en TenantContext.

Reglas password: min 6, 1 mayúscula, 1 minúscula, 1 número, 1 especial.

Deuda técnica: SMTP transaccional pendiente (3.5.B.4.g). 2FA + forgot/reset pendientes.

Sesión 3.5.B.4.b — Página pública de consulta de estado
Fecha: 2026-10-06

Commit: 92ee6f0 (padre: 9fa1aba).

Logros: Endpoint público GET /api/saas/registrations/:requestId/status con rate limit 10/15min. CheckStatusModal.tsx reutilizable.

Deuda técnica: Email de soporte hardcodeado (support@ateendia.cloud).

Sesión 3.5.B.4.a.2 — Frontend RegisterForm + integración
Fecha: 2026-10-05

Commit: 9fa1aba (padre: b211673).

Logros: RegisterForm.tsx (~690 líneas) con toggle demo/pago. RegisterSuccessView.tsx genérico. Integración en App.tsx.

Sesión 3.5.B.4.a.1 — Endpoint público de métodos de pago
Fecha: 2026-10-05

Commit: b211673 (padre: 161f381).

Logros: Endpoint GET /api/saas/payment-methods/public. Seed de 3 métodos (Zelle, USDT, Stripe). DTO público sin datos sensibles.

Sesión 3.5.B.3.b — Panel Super Admin aprobar/rechazar
Fecha: 2026-10-02

Commit: 161f381 (padre: 4774e46).

Logros: approveRegistration() con transacción atómica (tenant + user + subscription). requirePlatformUser. Campo must_reset_password.

Pruebas end-to-end (7/7 exitosas).

Sesión 3.5.B.3.a — Endpoint público POST /api/saas/register
Fecha: 2026-10-01

Commit: 4774e46 (padre: 2bf6f13).

Logros: Rate limiting 5/15min. Validación Zod. Anti-enumeración (requestId fake dup_* si duplicado).

Sesión 3.5.B.2 — Landing Configurable
Fecha: 2026-10-01

Commit: 2bf6f13 (padre: 6916c0d).

Logros: Columna landing_config_json. Endpoints GET/PUT /api/saas/landing. Servicio saasLandingService.

10. LECCIONES APRENDIDAS ACUMULADAS
PowerShell + Windows
Para JSON con acentos: usar [System.Text.Encoding]::UTF8.GetBytes($json) + -Body $bytes -ContentType "application/json; charset=utf-8".
Redirección stdin: PowerShell NO soporta <. Usar pipeline (|) o cmd /c.
Comillas en JSON: usar Invoke-RestMethod con hashtables + ConvertTo-Json -Depth 5.
Login JWT response es PLANA: { success, token, user, mustResetPassword }, no { success, data: { token } }.
Docker + MariaDB
EPERM al regenerar Prisma: detener Express antes de npm run db:generate.
MariaDB post-crash: si docker exec funciona pero desde host falla con P1017, reiniciar solo el contenedor mariadb.
Backticks en PowerShell: los backticks de columnas reservadas se comen mal. Usar heredoc con Out-File.
Prisma + DB
Naming: modelos plural + snake_case. Campos snake_case.
JSON en MariaDB: Prisma lo expone como String?. Serializar con JSON.stringify(), parsear con JSON.parse().
UPSERT: requiere un campo @unique en el where.
Imports con .js: con module: ESNext, imports entre archivos .ts con .js.
Relación 1-a-1: include: { tenant_subscriptions: true } devuelve objeto único, no array.
TypeScript
Narrowing: no siempre funciona en uniones discriminadas complejas. Usar comparaciones explícitas (=== true, === false).
Cast doble: as unknown as X es la técnica estándar cuando el tipo destino no declara todos los campos que el origen sí tiene.
Fallbacks en type guards: al agregar un nuevo valor a un union type, actualizar TODOS los type guards que lo consumen.
response.json() devuelve unknown: no acceder a .success ni .data sin type guard (Regla 29).
React
useCallback + useRef: resuelven bucles infinitos de useEffect cuando las funciones del contexto se recrean en cada render.
Render condicional en App.tsx: el orden importa. authView debe chequearse ANTES de isAuthenticated.
localStorage sobreescribe el mock: cuando el usuario ya hizo login, el currentUser viene de localStorage, no del defaultUser del mock.
useMemo para cálculos derivados: calcular MRR y stats globales en base a saasTenants con useMemo evita re-cálculos innecesarios.
useMemo para filtros: filtrar tenants por búsqueda + estado con useMemo mejora performance.
Git
Commits multilínea en PowerShell: usar comillas dobles y \ para escape. Alternativa: git commit -F archivo.txt.
git add selectivo: NUNCA git add . ni git add -A si hay deuda técnica.
git diff --stat: útil para verificar el alcance de los cambios antes del commit.
Auto-aprobación de DEMO (Sesión #25)
Los registros sin pago NO requieren aprobación humana. Reutilizar approveRegistration con reviewerUserId = null es más limpio que duplicar la transacción.
Fallback en auto-aprobación: si falla, dejar la solicitud en pending.
Validación de archivos (Sesión #25)
Validar tipo MIME Y tamaño ANTES de convertir a Base64.
Limpiar e.target.value = '' en caso de error para permitir reintentar con el mismo archivo.
Badge de obligatoriedad: mostrar visualmente si el comprobante es OBLIGATORIO u OPCIONAL reduce fricción.
Errores esperados (Sesión #25)
Estado already_pending: los errores esperados (como UPGRADE_ALREADY_PENDING) merecen una UI propia, no un ErrorCard genérico.
Regla de producción (Sesión #25)
Los componentes de gestión NUNCA deben hardcodear datos mock. Si un endpoint no existe, se crea. No se mockea en frontend.
Panel SaaS con datos reales (Sesión #26)
DTO espejo del backend: el tipo SaasTenantDTO es el mismo en backend y frontend (camelCase).
Fuente única de datos: el panel consume saasTenants cuando está disponible, si no cae al mock del contexto. Así no queda vacío si el fetch falla.
Refrescar tras mutaciones: después de aprobar/rechazar comprobantes, se llama refreshSaasTenants() para actualizar la lista.
useMemo para métricas derivadas: MRR, counts por estado, etc. se calculan con useMemo a partir de saasTenants.
No todos los datos vienen de la DB: las stats agregadas (usersCount, clientsCount, policiesCount) las calcula el backend con queries paralelas (Promise.all).
Type guard para response.json(): con TS estricto, hay que validar 'success' in body antes de acceder (Regla 29).
### Regla 34 — Edición Quirúrgica por Bloques (Sesión #33)
Cuando el usuario es principiante y el archivo a modificar es masivo (como el Dashboard SaaS), NUNCA dar el código completo. Proveer únicamente los bloques exactos de código a reemplazar (indicando claramente el bloque anterior y el nuevo), usando comentarios en el código para ubicar visualmente el cambio.
### Rama / Release (Sesión #28)
Al verificar un commit, correr git log --oneline -3 Y git status --short
en el mismo bloque. El log confirma que el commit entró; el status confirma
que no quedaron archivos del commit sin stagear.
El formato de git commit multilínea en PowerShell funciona bien con
comillas dobles + salto de línea real (Enter). Evitar tildes en el
mensaje del commit para prevenir problemas de encoding (Regla 15).
git restore --staged <archivo> es la herramienta correcta para
desstagear sin tocar el archivo en disco. git reset HEAD <archivo>
funciona pero es más ruidoso en la salida.
git diff --cached --stat (no git diff --stat) es el comando correcto
para ver el resumen de lo que está en staging ANTES del commit.
### Límites SaaS (Sesión #34)

- **Fuente única de verdad:** cuando dos capas resuelven el mismo dato
  (ej: middleware y servicio), refactorizar a una función compartida
  (`resolveLimit()`) evita divergencias futuras.
- **Prueba de Oro = obligatoria** antes de cerrar sub-fase. Regla 32.
  Detectó hueco de 2 sesiones (checkLimit no aplicado en clients/policies
  desde Sesión #27).
- **`Promise.all` para conteos:** 3 queries de count en paralelo reduce
  latencia del endpoint `/me/limits` de ~150ms a ~50ms.
- **`limit === -1` significa "ilimitado":** el middleware debe NO bloquear
  cuando recibe -1 (planes Enterprise o super_admin).
- **Fail-open en middleware:** si `resolveLimit()` o `countCurrent()` fallan,
  el middleware deja pasar el request (`next()`) en vez de bloquear.
  Mejor un cliente ocasional por encima del límite que un SaaS roto.
- **Type guards en frontend (Regla 29):** `limitsService.ts` usa el patrón
  completo para `response.json()` (unknown → validación → tipado).

11. PRÓXIMOS PASOS
**Sub-fase inmediata:**
Sesión #38 — Fase 3.5.G.4 (Type Hardening).
Objetivo: Resolver errores en archivos pequeños restantes (`AlertsCenterModal`, `CompanyBrandingModule`, etc.) y atacar los 2 archivos grandes (`whatsappCloudService`).
Estimado: Bajar de 48 a ~20 errores.

**Deuda técnica prioritaria para sesiones futuras:**
- SMTP-CREDENTIALS-DEPLOY — Configurar SMTP reales en producción (ALTA).
- Fase B.5 — Protección de saas_super_admin (ALTA).
- Fase B.6 — Roles custom (MEDIA).
- DEUDA-ARQ-RECEIPTS — Eliminar métodos obsoletos en saasService (MEDIA).
════════════════════════════════════════════════════════════════════
FIN DEL AGENTS.md
Última actualización: 2026-11-13 (Sesión #37 - Cierre Fase 3.5.G.3)
Progreso global: ~86%
Último commit: `<hash_del_commit>`
Siguiente sub-fase: 3.5.G.4 — Type Hardening (archivos pequeños + whatsappCloudService)
Siguiente sesión: #38 — Type Hardening
════════════════════════════════════════════════════════════════════