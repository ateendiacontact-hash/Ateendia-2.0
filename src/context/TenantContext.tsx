/**
 * TenantContext — Estado global multi-tenant del CRM.
 *
 * Este contexto centraliza:
 *   - Datos del tenant actual (branding, suscripción, catálogos)
 *   - Datos del usuario autenticado y lista de usuarios del tenant
 *   - Colecciones de datos (clientes, pólizas, banco, campañas, etc.)
 *   - Funciones de fetch/mutación contra el backend
 *   - Estado de integraciones (Issabel, n8n, IA, WhatsApp, SMTP)
 *   - Estado del SaaS Central (planes, tenants, receipts)
 *
 * ────────────────────────────────────────────────────────────────────
 * FILOSOFÍA DE LOS STUBS
 * ────────────────────────────────────────────────────────────────────
 * Muchos métodos de este contexto son STUBS (marcados con [STUB] en el
 * console.warn). Esto significa que:
 *   1. La firma y el shape son los correctos (idénticos al backend real).
 *   2. La implementación es local (en memoria), no persiste.
 *   3. Al llamarlos, se emite un console.warn para recordar que falta
 *      conectarlos al backend real.
 *
 * Cuando llegue la sesión de conexión, solo hay que reemplazar el cuerpo
 * de cada stub por el fetch correspondiente al endpoint backend.
 *
 * ────────────────────────────────────────────────────────────────────
 * CONVENCIÓN DE COMANDOS BACKEND (cuando se conecten)
 * ────────────────────────────────────────────────────────────────────
 *   - GET    /api/<recurso>             → fetch inicial
 *   - POST   /api/<recurso>             → create
 *   - PATCH  /api/<recurso>/:id         → update
 *   - DELETE /api/<recurso>/:id         → delete
 *
 * Todas las llamadas pasan por el proxy de Vite (`/api/*` → localhost:4000).
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  TenantBranding,
  Policy,
  User,
  BankAccount,
  UserRole,
  Role,
  IssabelConfig,
  CallRecord,
  MessageTemplate,
  Campaign,
  AuditLogEntry,
  N8nConfig,
  AiIntegrationConfig,
  VectorDocChunk,
  // ═══════════════════════════════════════════════════════════════
  // NUEVOS TIPOS — Sesión Fix Pantallas Bloque Extendido (WhatsApp + IG/FB)
  // ═══════════════════════════════════════════════════════════════
  WhatsAppConfig,
  WhatsAppAccountConfig,
  WhatsAppAlertRecipient,
  WhatsAppMessage,
  InstagramConfig,
  FacebookConfig,
  ChatMessage,
  ScheduledRule,
  AntiSpamSettings,
  CustomFieldDefinition,
  SmtpConfig,
  SystemAlert,
  AppNotification,
  SaasDatabaseConfig,
  SaasVpsDeploymentConfig,
  SaasPaymentReceipt,
} from '../types';

// ═══════════════════════════════════════════════════════════════════
// TIPOS DEL CONTEXTO
// ═══════════════════════════════════════════════════════════════════

interface TenantContextType {
  // ─── Datos principales ───
  clients: any[];
  policies: Policy[];
  currentTenant: TenantBranding;
  currentUser: User | null;
  users: User[];
  activeConversationId: string | null;
  saasLandingConfig: any;
  loadingClients: boolean;

  // ─── Colecciones de datos ───
  alerts: any[];
  notifications: any[];
  appNotifications: any[];
  conversations: any[];
  campaigns: Campaign[];
  pipelines: any[];
  bankAccounts: BankAccount[];
  documents: any[];
  notes: any[];
  activities: any[];

  // ─── Clientes ───
  fetchClients: () => Promise<void>;
  addClient: (newClientData: any) => Promise<any>;
  updateClient: (id: string, updatedData: any) => Promise<any>;
  deleteClient: (id: string) => Promise<void>;

  // ─── Pólizas ───
  fetchPolicies: () => Promise<void>;
  addPolicy: (policyData: any) => Promise<any>;
  updatePolicy: (id: string, policyData: any) => Promise<any>;
  deletePolicy: (id: string) => Promise<void>;

  // ─── Banco ───
  fetchBankAccounts: () => Promise<void>;
  addBankAccount: (accountData: any) => Promise<any>;
  updateBankAccount: (id: string, accountData: any) => Promise<any>;
  deleteBankAccount: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (clientId: string, accountId: string) => Promise<void>;

  // ─── Setters ───
  setCurrentTenantId: (id: string) => void;
  setCurrentTenant: (tenant: any) => void;
  setCurrentUser: (user: any) => void;
  setActiveConversationId: (id: string | null) => void;
  logoutUser: () => void;
  updateUser: (userData: any) => Promise<any>;

  // ─── Permisos ───
  can: (module: string, action: string) => boolean;

  // ─── Notificaciones ───
  markAppNotificationRead: (id: string) => void;
  markAllAppNotificationsRead: () => void;
  deleteAppNotification: (id: string) => void;
  browserNotificationPermission?: string;
  requestBrowserNotificationPermission?: () => void;

  // ─── Simulaciones (dev only) ───
  simulateIncomingWhatsAppMessage?: (...args: any[]) => void;
  simulatePolicyStatusChange?: (...args: any[]) => void;
  simulateWebLeadQuoteRequest?: (...args: any[]) => void;

  // ─── Telefonía (Issabel) ───
  startCall: (phone: string, clientName: string, clientId?: string) => void;
  startWhatsAppConversation: (clientId: string, phone: string, clientName: string) => void;
  issabelConfig: IssabelConfig;
  updateIssabelConfig: (config: Partial<IssabelConfig>) => void;
  callRecords: CallRecord[];
  showSoftphone: boolean;
  setShowSoftphone: (show: boolean) => void;
  activeCall?: any;

  // ─── Multi-tenant SaaS Central ───
  tenants: any[];
  usersList?: any[];
  createTenant: (tenantData: any, adminData: any) => void;
  updateTenantSubscription: (tenantId: string, subscriptionData: any) => void;
  updateTenantSubscriptionPlan: (tenantId: string, planName: string) => void;
  toggleTenantStatus: (tenantId: string) => void;
  resetTenantData: (tenantId: string) => void;
  updateTenantBranding?: (data: any) => void;
  currentTenantLandingConfig?: any;
  updateTenantLandingConfig?: (tenantId: string, config: any) => void;

  // ─── SaaS Admins ───
  saasAdmins: any[];
  addSaasAdmin: (adminData: any) => void;
  updateSaasAdmin: (id: string, adminData: any) => void;
  deleteSaasAdmin: (id: string) => void;

  // ─── SaaS Landing ───
  updateSaasLandingConfig: (config: any) => void;

  // ─── SaaS Plans ───
  saasPlans: any[];
  updateSaasPlans: (plans: any[]) => void;

  // ─── SaaS SMTP ───
  saasSmtpConfig: any;
  updateSaasSmtpConfig: (config: any) => void;
  testSaasSmtpConnection: (config: any) => Promise<boolean>;

  // ─── SaaS Notification Templates ───
  saasNotificationTemplates: any[];
  updateSaasNotificationTemplates: (templates: any[]) => void;

  // ─── SaaS WhatsApp Central ───
  saasWhatsAppCentralConfig: any;
  updateSaasWhatsAppCentralConfig: (config: any) => void;
  sendWhatsAppCentralTestMessage: (phone: string, text: string) => Promise<boolean>;

  // ─── SaaS Payment Receipts ───
  saasPaymentReceipts: any[];
  approvePaymentReceipt: (receiptId: string, validFrom?: string, validUntil?: string) => void;
  rejectPaymentReceipt: (receiptId: string, reason?: string) => void;
  globalSaasMetrics: any;

  // ─── Catálogos ───
  catalogs: {
    clientCategories: string[];
    policyTypes: string[];
  };

  // ─── STUBS Sesión #20 (Fix Pantallas Bloque Base) ───

  /** Plantillas de mensaje (WhatsApp / Email) reutilizables en campañas */
  templates: MessageTemplate[];
  /** Crea una campaña masiva (WhatsApp / Email) */
  createCampaign: (campaignData: Partial<Campaign>) => void;
  /** Roles RBAC del tenant con su matriz de permisos */
  roles: Role[];
  /** Actualiza la matriz de permisos de un rol específico */
  updateRolePermissions: (roleKey: UserRole, permissions: Role['permissions']) => void;
  /** Invita a un nuevo usuario al tenant (envía email de invitación) */
  inviteUser: (userData: { name: string; email: string; role: UserRole; extension?: string }) => void;
  /** Activa/desactiva un usuario del tenant */
  toggleUserStatus: (userId: string) => void;
  /** Bitácora inmutable de auditoría del tenant */
  auditLogs: AuditLogEntry[];
  /** Configuración de integración con n8n */
  n8nConfig: N8nConfig;
  /** Actualiza la configuración de n8n */
  updateN8nConfig: (config: Partial<N8nConfig>) => void;
  /** Configuración del proveedor de IA (OpenRouter, Gemini, etc.) */
  aiConfig: AiIntegrationConfig;
  /** Actualiza la configuración de IA */
  updateAiConfig: (config: Partial<AiIntegrationConfig>) => void;

  // ═══════════════════════════════════════════════════════════════════
  // NUEVOS STUBS — Sesión Fix Pantallas Bloque Extendido
  // ═══════════════════════════════════════════════════════════════════

  // ─── Bloque 11: WhatsApp ───
  /** Configuración multi-cuenta de WhatsApp (WA1 y WA2).
   * Se carga desde GET /api/whatsapp/config en la sesión de conexión. */
  whatsAppConfig: WhatsAppConfig;
  /** Actualiza parcialmente la configuración de una cuenta específica (WA1/WA2). */
  updateWhatsAppAccountConfig: (accountId: 'WA1' | 'WA2', config: Partial<WhatsAppAccountConfig>) => void;
  /** Persiste toda la configuración de WhatsApp del tenant. */
  saveWhatsAppConfig: (config: Partial<WhatsAppConfig>) => void;
  /** Envía un mensaje de texto en una conversación de WhatsApp existente. */
  sendWhatsAppMessage: (conversationId: string, text: string) => Promise<void>;
  /** Alterna una reacción (emoji) en un mensaje de WhatsApp. */
  toggleWhatsAppReaction: (messageId: string, emoji: string) => void;

  // ─── Bloque 12: Instagram / Facebook ───
  /** Configuración de la integración con Instagram (Meta Graph). */
  instagramConfig: InstagramConfig;
  /** Persiste la configuración de Instagram del tenant. */
  saveInstagramConfig: (config: Partial<InstagramConfig>) => void;
  /** Configuración de la integración con Facebook Messenger (Meta Graph). */
  facebookConfig: FacebookConfig;
  /** Persiste la configuración de Facebook del tenant. */
  saveFacebookConfig: (config: Partial<FacebookConfig>) => void;

  // ─── Bloque 13: Auditoría global ───
  /** Registra un evento manual en la bitácora de auditoría del tenant. */
  recordAudit: (
    action: AuditLogEntry['action'],
    module: AuditLogEntry['module'],
    targetId?: string,
    details?: string
  ) => void;

  // ─── Bloque 1: Notificaciones y Alertas ───
  /** Descarta (marca como leída) una alerta del sistema. */
  dismissAlert: (id: string) => void;
  /** Última notificación en vivo (WhatsApp entrante, lead, etc.). */
  latestLiveNotification: AppNotification | null;
  /** Limpia la última notificación en vivo. */
  clearLatestLiveNotification: () => void;

  // ─── Bloque 2: Clientes Extendido ───
  /** Alias de addClient con firma DDD. */
  createClient: (clientData: any) => Promise<any>;
  /** Definiciones de campos personalizados del tenant. */
  customFields: CustomFieldDefinition[];
  /** Agrega una definición de campo personalizado. */
  addCustomField: (field: CustomFieldDefinition) => void;
  /** Agrega una nota a un cliente. */
  addNote: (clientId: string, note: any) => Promise<void>;
  /** Agrega un documento a un cliente. */
  addDocument: (clientId: string, doc: any) => Promise<void>;
  /** Elimina un documento de un cliente. */
  deleteDocument: (clientId: string, docId: string) => Promise<void>;
  /** Configuración SMTP del tenant. */
  smtpConfig: SmtpConfig;
  /** Envía un email transaccional. */
  sendEmailMessage: (to: string, subject: string, body: string) => Promise<boolean>;

  // ─── Bloque 3: Pólizas Extendido ───
  /** Alias de addPolicy con firma DDD. */
  createPolicy: (policyData: any) => Promise<any>;

  // ─── Bloque 4: Pipeline ───
  /** Mueve un cliente a otra etapa del pipeline. */
  moveClientStage: (clientId: string, stageId: string) => Promise<void>;

  // ─── Bloque 5: Plantillas ───
  /** Crea una plantilla de mensaje. */
  createTemplate: (data: Partial<MessageTemplate>) => Promise<void>;
  /** Actualiza una plantilla existente. */
  updateTemplate: (id: string, data: Partial<MessageTemplate>) => Promise<void>;
  /** Elimina una plantilla. */
  deleteTemplate: (id: string) => Promise<void>;

  // ─── Bloque 6: Telefonía Extendido ───
  /** Finaliza una llamada activa. */
  endCall: (callId: string) => void;

  // ─── Bloque 7: Auth y 2FA ───
  /** Indica si el usuario ya pasó la verificación 2FA. */
  isTwoFactorVerified: boolean;
  /** Datos pendientes del segundo factor (email parcial, etc.). */
  pendingTwoFactor: any | null;
  /** Verifica un código OTP de 6 dígitos. */
  verify2FACode: (code: string) => Promise<boolean>;
  /** Login alternativo (email + password). */
  loginUser: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean }>;

  // ─── Bloque 8: Header / Sidebar ───
  /** Setter por ID (alternativa a setCurrentUser). */
  setCurrentUserId: (id: string) => void;
  /** Mensajes del chat interno (multicanal). */
  chatMessages: ChatMessage[];

  // ─── Bloque 9: Automatizaciones ───
  /** Reglas programadas (cumpleaños, vencimientos, pagos). */
  scheduledRules: ScheduledRule[];
  /** Actualiza las reglas programadas. */
  updateScheduledRules: (rules: ScheduledRule[]) => void;
  /** Configuración anti-spam (límites diarios, jitter, etc.). */
  antiSpamSettings: AntiSpamSettings;
  /** Actualiza la configuración anti-spam. */
  updateAntiSpamSettings: (settings: Partial<AntiSpamSettings>) => void;

  // ─── Bloque 10: Chat Interno ───
  /** Envía un mensaje a un canal del chat interno. */
  sendInternalChatMessage: (channelId: string, text: string) => Promise<void>;
  /** Alterna una reacción en un mensaje del chat interno. */
  toggleInternalChatReaction: (messageId: string, emoji: string) => void;

  // ─── Bloque 14: SaaS Extendido ───
  /** Envía un comprobante de pago de renovación al Super Admin. */
  submitRenewalPaymentReceipt: (receipt: Partial<SaasPaymentReceipt>) => Promise<void>;
  /** Envía un lead desde la micro-landing pública. */
  submitMicroLandingLead: (lead: any) => Promise<void>;
  /** Registra un nuevo tenant con flujo de pago completo (wizard). */
  registerNewTenantWithPayment: (data: any) => Promise<void>;
  /** Configuración de la base de datos SaaS (VPS). */
  saasDatabaseConfig: SaasDatabaseConfig;
  /** Actualiza la configuración de la base de datos SaaS. */
  updateSaasDatabaseConfig: (config: Partial<SaasDatabaseConfig>) => void;
  /** Prueba la conexión a la base de datos SaaS. */
  testDatabaseConnection: (config: Partial<SaasDatabaseConfig>) => Promise<boolean>;
  /** Configuración de despliegue VPS (Hetzner, Contabo, etc.). */
  saasVpsConfig: SaasVpsDeploymentConfig;
  /** Actualiza la configuración de despliegue VPS. */
  updateSaasVpsConfig: (config: Partial<SaasVpsDeploymentConfig>) => void;
}

// ═══════════════════════════════════════════════════════════════════
// VALORES POR DEFECTO / MOCKS
// ═══════════════════════════════════════════════════════════════════

const defaultTenant: TenantBranding = {
  id: 'tenant-demo',
  name: 'Clínica Demo Ateendia',
  tagline: 'Sistema Integrado CRM',
  logoUrl: '',
  primaryColor: '#7c3aed',
  secondaryColor: '#06B6D4',
  clientCategories: ['Salud / ACA', 'Vida', 'Dental', 'Visión', 'Medicare'],
  policyTypes: ['Salud ACA', 'Vida Término', 'IUL', 'Dental', 'Suplementario'],
  subscription: {
    status: 'active',
    plan: 'enterprise',
    validUntil: '2026-12-31',
  },
} as any; // cast: TenantBranding no declara tagline/clientCategories/policyTypes todavía

/**
 * Usuario simulado del mock (Sesión Fix Sidebar por Rol — Fase B).
 *
 * ⚠️ MOCK TEMPORAL: se cambiará por el usuario real del JWT cuando
 * conectemos el backend en Fase C.
 *
 * Para probar el sidebar como `saas_super_admin`, el rol está fijado a
 * `'saas_super_admin'`. Para probar como admin de tenant, cambiar a
 * `'admin'` y reiniciar Vite.
 */
const defaultUser: User = {
  id: 'usr-superadmin',
  tenantId: 'tenant-demo',
  name: 'Víctor Medina',
  email: 'victoraray8@gmail.com',
  role: 'saas_super_admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  status: 'active',
  isSuperAdmin: true,
};

const initialClientsMock = [
  { id: 'cli-1', name: 'Carlos Mendoza', email: 'carlos.mendoza@email.com', phone: '+13059803321', status: 'active', type: 'Salud / ACA' },
  { id: 'cli-2', name: 'Mariana Valenzuela', email: 'mariana.v@email.com', phone: '+17864508912', status: 'lead', type: 'Vida' },
  { id: 'cli-3', name: 'Roberto Gómez', email: 'roberto.gomez@email.com', phone: '+13055550199', status: 'active', type: 'Dental' }
];

const initialPoliciesMock: Policy[] = [
  { id: 'pol-1', policyNumber: 'POL-98210', clientId: 'cli-1', clientName: 'Carlos Mendoza', insuranceCarrier: 'Ambetter Health', policyType: 'Salud ACA', status: 'Activa', premiumAmount: 350, startDate: '2026-01-01', endDate: '2026-12-31' },
  { id: 'pol-2', policyNumber: 'POL-44102', clientId: 'cli-2', clientName: 'Mariana Valenzuela', insuranceCarrier: 'National General', policyType: 'Vida Término', status: 'En Proceso', premiumAmount: 120, startDate: '2026-02-01', endDate: '2027-02-01' }
] as any; // cast: Policy tiene más campos obligatorios en types/index.ts

/**
 * Plantillas mock para Campañas.
 * En la sesión de conexión, esto se reemplaza por GET /api/templates.
 */
const initialTemplatesMock: MessageTemplate[] = [
  {
    id: 'tmpl-1',
    tenantId: 'tenant-demo',
    name: 'Recordatorio de Renovación ACA',
    channel: 'whatsapp',
    category: 'Renovación ACA',
    body: 'Hola {{nombre}}, tu póliza {{poliza}} vence el {{fecha_pago}}. ¿Querés que te ayudemos a renovarla?',
    variables: ['nombre', 'poliza', 'fecha_pago'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-2',
    tenantId: 'tenant-demo',
    name: 'Felicitación de Cumpleaños',
    channel: 'whatsapp',
    category: 'Cumpleaños',
    body: '🎉 ¡Feliz cumpleaños, {{nombre}}! Todo el equipo de la agencia te desea un gran día.',
    variables: ['nombre'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-3',
    tenantId: 'tenant-demo',
    name: 'Bienvenida a Nuevo Cliente',
    channel: 'email',
    category: 'Bienvenida',
    subject: '¡Bienvenido a nuestra agencia, {{nombre}}!',
    body: 'Hola {{nombre}}, gracias por confiar en nosotros. En breve un asesor se pondrá en contacto.',
    variables: ['nombre'],
    createdAt: new Date().toISOString(),
  },
];

/**
 * Roles RBAC base del sistema.
 * Se pueden extender con roles custom desde /api/roles (futuro).
 */
const initialRolesMock: Role[] = [
  {
    key: 'admin',
    name: 'Administrador',
    description: 'Acceso total al tenant, gestión de usuarios y configuración.',
    isSystem: true,
    permissions: {
      clients: { view: true, create: true, edit: true, delete: true, export: true },
      policies: { view: true, create: true, edit: true, delete: true },
      pipeline: { view: true, edit: true, moveCards: true, manageStages: true },
      whatsapp: { view: true, send: true, configure: true },
      email: { view: true, send: true, configure: true },
      campaigns: { view: true, create: true, execute: true },
      reports: { view: true, export: true },
      banking: { view: true, edit: true, viewSensitive: true },
      telephony: { view: true, call: true, viewCdr: true, configure: true },
      branding: { view: true, edit: true },
      users: { view: true, invite: true, editRoles: true },
      audit: { view: true },
      integrations: { view: true, configure: true },
    },
  },
  {
    key: 'supervisor',
    name: 'Supervisor',
    description: 'Supervisa agentes, ve reportes, gestiona pipelines.',
    isSystem: true,
    permissions: {
      clients: { view: true, create: true, edit: true, delete: false, export: true },
      policies: { view: true, create: true, edit: true, delete: false },
      pipeline: { view: true, edit: true, moveCards: true, manageStages: true },
      whatsapp: { view: true, send: true, configure: false },
      email: { view: true, send: true, configure: false },
      campaigns: { view: true, create: true, execute: true },
      reports: { view: true, export: true },
      banking: { view: true, edit: false, viewSensitive: false },
      telephony: { view: true, call: true, viewCdr: true, configure: false },
      branding: { view: true, edit: false },
      users: { view: true, invite: true, editRoles: false },
      audit: { view: true },
      integrations: { view: true, configure: false },
    },
  },
  {
    key: 'agent',
    name: 'Agente',
    description: 'Gestión de sus propios clientes, pólizas y conversaciones.',
    isSystem: true,
    permissions: {
      clients: { view: true, create: true, edit: true, delete: false, export: false },
      policies: { view: true, create: true, edit: true, delete: false },
      pipeline: { view: true, edit: true, moveCards: true, manageStages: false },
      whatsapp: { view: true, send: true, configure: false },
      email: { view: true, send: true, configure: false },
      campaigns: { view: true, create: false, execute: false },
      reports: { view: true, export: false },
      banking: { view: true, edit: false, viewSensitive: false },
      telephony: { view: true, call: true, viewCdr: false, configure: false },
      branding: { view: true, edit: false },
      users: { view: false, invite: false, editRoles: false },
      audit: { view: false },
      integrations: { view: false, configure: false },
    },
  },
  {
    key: 'readonly',
    name: 'Solo Lectura',
    description: 'Puede ver pero no modificar nada.',
    isSystem: true,
    permissions: {
      clients: { view: true, create: false, edit: false, delete: false, export: false },
      policies: { view: true, create: false, edit: false, delete: false },
      pipeline: { view: true, edit: false, moveCards: false, manageStages: false },
      whatsapp: { view: true, send: false, configure: false },
      email: { view: true, send: false, configure: false },
      campaigns: { view: true, create: false, execute: false },
      reports: { view: true, export: false },
      banking: { view: true, edit: false, viewSensitive: false },
      telephony: { view: true, call: false, viewCdr: false, configure: false },
      branding: { view: true, edit: false },
      users: { view: false, invite: false, editRoles: false },
      audit: { view: false },
      integrations: { view: false, configure: false },
    },
  },
];

/**
 * Registro mock de llamadas (CDR).
 * En la sesión de conexión, esto se reemplaza por GET /api/telephony/cdr.
 */
const initialCallRecordsMock: CallRecord[] = [
  {
    id: 'cdr-1',
    tenantId: 'tenant-demo',
    clientId: 'cli-1',
    clientName: 'Carlos Mendoza',
    agentId: 'usr-superadmin',
    agentName: 'Víctor Medina',
    agentExtension: '101',
    destinationNumber: '+13059803321',
    direction: 'outbound',
    status: 'ANSWERED',
    durationSeconds: 245,
    timestamp: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: 'cdr-2',
    tenantId: 'tenant-demo',
    clientId: 'cli-2',
    clientName: 'Mariana Valenzuela',
    agentId: 'usr-superadmin',
    agentName: 'Víctor Medina',
    agentExtension: '101',
    destinationNumber: '+17864508912',
    direction: 'outbound',
    status: 'NO ANSWER',
    durationSeconds: 0,
    timestamp: new Date(Date.now() - 7200_000).toISOString(),
  },
];

/**
 * Bitácora mock de auditoría.
 * En la sesión de conexión, esto se reemplaza por GET /api/audit.
 */
const initialAuditLogsMock: AuditLogEntry[] = [
  {
    id: 'aud-1',
    tenantId: 'tenant-demo',
    userId: 'usr-superadmin',
    userName: 'Víctor Medina',
    userEmail: 'victoraray8@gmail.com',
    action: 'LOGIN',
    module: 'Autenticación',
    details: 'Inicio de sesión exitoso',
    ipAddress: '127.0.0.1',
    timestamp: new Date(Date.now() - 1800_000).toISOString(),
  },
  {
    id: 'aud-2',
    tenantId: 'tenant-demo',
    userId: 'usr-superadmin',
    userName: 'Víctor Medina',
    userEmail: 'victoraray8@gmail.com',
    action: 'CREATE',
    module: 'Clientes',
    targetId: 'cli-3',
    targetName: 'Roberto Gómez',
    details: 'Cliente creado desde formulario',
    ipAddress: '127.0.0.1',
    timestamp: new Date(Date.now() - 3600_000).toISOString(),
  },
];

/**
 * Configuración por defecto de Issabel PBX.
 * Se carga desde GET /api/telephony/config en la sesión de conexión.
 */
const defaultIssabelConfig: IssabelConfig = {
  tenantId: 'tenant-demo',
  host: '',
  amiPort: 5038,
  amiUser: '',
  amiSecret: '',
  webrtcWssUrl: '',
  defaultContext: 'from-internal',
  isConnected: false,
};

/**
 * Configuración por defecto de n8n.
 * Se carga desde GET /api/integrations/n8n en la sesión de conexión.
 */
const defaultN8nConfig: N8nConfig = {
  tenantId: 'tenant-demo',
  instanceUrl: '',
  apiToken: '',
  webhookUrl: '',
  apiKey: '',
  isActive: false,
  isEnabled: false,
  activeEvents: [],
  triggers: [],
  logs: [],
  webhookLogs: [],
};

/**
 * Configuración por defecto del proveedor de IA.
 * Se carga desde GET /api/integrations/ai en la sesión de conexión.
 */
const defaultAiConfig: AiIntegrationConfig = {
  tenantId: 'tenant-demo',
  provider: 'openrouter',
  apiKey: '',
  model: 'anthropic/claude-3.5-sonnet',
  modelName: 'Claude 3.5 Sonnet',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: '',
  ragEnabled: false,
  ragTopK: 5,
  confidenceThreshold: 85,
  autoResponderChannels: [],
  knowledgeBase: [],
  autoResponder: {
    enabled: false,
    whatsapp: false,
    instagram: false,
    facebook: false,
    confidenceThreshold: 85,
    handoffOnNegativeSentiment: true,
    businessHoursOnly: false,
  },
  knowledgeDocuments: [],
};

// ═══════════════════════════════════════════════════════════════════
// NUEVOS MOCKS — Sesión Fix Pantallas Bloque Extendido
// ═══════════════════════════════════════════════════════════════════

/**
 * Configuración por defecto de WhatsApp multi-cuenta.
 * Se carga desde GET /api/whatsapp/config en la sesión de conexión.
 */
const defaultWhatsAppConfig: WhatsAppConfig = {
  tenantId: 'tenant-demo',
  activeAccountTab: 'WA1',
  selectedPipelineId: 'pipe-1',
  defaultPipelineId: 'pipe-1',
  alertRecipients: [],
  connectionType: 'qr_bridge',
  qrConnected: false,
  connectedPhone: '',
  accounts: {
    WA1: {
      id: 'WA1',
      name: 'WhatsApp WA1 (Línea Principal)',
      phone: '+1 (786) 450-2819',
      selectedPipelineId: 'pipe-1',
      defaultPipelineId: 'pipe-1',
      qrConnected: false,
      qrStatus: 'disconnected',
      alertRecipients: [],
      changeLog: [],
      autoReply: true,
      roundRobinAgents: true,
    },
    WA2: {
      id: 'WA2',
      name: 'WhatsApp WA2 (Soporte / Cobranza)',
      phone: '+1 (786) 555-0244',
      selectedPipelineId: 'pipe-1',
      defaultPipelineId: 'pipe-1',
      qrConnected: false,
      qrStatus: 'disconnected',
      alertRecipients: [],
      changeLog: [],
      autoReply: true,
      roundRobinAgents: false,
    },
  },
  changeLog: [],
};

/**
 * Configuración por defecto de Instagram (Meta Graph).
 * Se carga desde GET /api/integrations/instagram en la sesión de conexión.
 */
const defaultInstagramConfig: InstagramConfig = {
  tenantId: 'tenant-demo',
  connectionType: 'none',
  changeLog: [],
};

/**
 * Configuración por defecto de Facebook Messenger (Meta Graph).
 * Se carga desde GET /api/integrations/facebook en la sesión de conexión.
 */
const defaultFacebookConfig: FacebookConfig = {
  tenantId: 'tenant-demo',
  connectionType: 'none',
  changeLog: [],
};

/**
 * Configuración SMTP por defecto del tenant.
 * Se carga desde GET /api/email/config en la sesión de conexión.
 */
const defaultSmtpConfig: SmtpConfig = {
  tenantId: 'tenant-demo',
  protocol: 'smtp',
  host: '',
  port: 465,
  senderEmail: '',
  senderName: '',
  appPassword: '',
  isConfigured: false,
};

/**
 * Configuración por defecto de la base de datos SaaS (VPS).
 * Se carga desde GET /api/saas/database en la sesión de conexión.
 */
const defaultSaasDatabaseConfig: SaasDatabaseConfig = {
  provider: 'local',
  engine: 'local',
  status: 'disconnected',
  isConnected: false,
  autoSync: false,
};

/**
 * Configuración por defecto del despliegue VPS.
 * Se carga desde GET /api/saas/vps en la sesión de conexión.
 */
const defaultSaasVpsConfig: SaasVpsDeploymentConfig = {
  serverIp: '',
  sshPort: 22,
  sshUser: 'root',
  primaryDomain: '',
  certbotEmail: '',
  appPort: 4000,
  nodeEnv: 'production',
  useDocker: true,
  useNginx: true,
  useCertbotSsl: true,
  sslEnabled: false,
  nginxConfigured: false,
};

// ═══════════════════════════════════════════════════════════════════
// NORMALIZADORES
// ═══════════════════════════════════════════════════════════════════

const normalizeTenantData = (rawTenant: any): TenantBranding => {
  if (!rawTenant) return defaultTenant;
  return {
    id: rawTenant.id || defaultTenant.id,
    name: rawTenant.name || defaultTenant.name,
    tagline: rawTenant.tagline || (defaultTenant as any).tagline,
    logoUrl: rawTenant.logo_url || rawTenant.logoUrl || '',
    primaryColor: rawTenant.primary_color || rawTenant.primaryColor || '#7c3aed',
    secondaryColor: rawTenant.secondary_color || rawTenant.secondaryColor || '#06B6D4',
    clientCategories: rawTenant.clientCategories || (defaultTenant as any).clientCategories,
    policyTypes: rawTenant.policyTypes || (defaultTenant as any).policyTypes,
    subscription: rawTenant.subscription || defaultTenant.subscription,
    } as unknown as TenantBranding;
};

// ═══════════════════════════════════════════════════════════════════
// CONTEXTO
// ═══════════════════════════════════════════════════════════════════

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ─── Estado principal ───
  const [clients, setClients] = useState<any[]>(initialClientsMock);
  const [policies, setPolicies] = useState<Policy[]>(initialPoliciesMock);
  const [currentTenant, setCurrentTenantState] = useState<TenantBranding>(defaultTenant);
  const [currentUser, setCurrentUserState] = useState<User | null>(defaultUser);
  const [users, setUsers] = useState<User[]>([defaultUser]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [saasLandingConfig, setSaasLandingConfig] = useState<any>({
    crmName: 'Ateendia',
    publicUrl: 'https://ateendia.cloud',
    domainName: 'ateendia.cloud',
    primaryColor: '#4f46e5',
    accentColor: '#10b981',
    clientCategories: ['Salud / ACA', 'Vida', 'Dental', 'Visión', 'Medicare'],
    features: [],
    pricingPlans: [],
    testimonials: []
  });
  const [loadingClients, setLoadingClients] = useState<boolean>(false);

  // ─── Colecciones ───
  const [alerts, setAlerts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [appNotifications, setAppNotifications] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [showSoftphone, setShowSoftphone] = useState<boolean>(false);

  // ─── SaaS Central ───
  const [tenants, setTenants] = useState<any[]>([defaultTenant]);
  const [saasAdmins, setSaasAdmins] = useState<any[]>([]);
  const [saasPlans, setSaasPlans] = useState<any[]>([]);
  const [saasSmtpConfig, setSaasSmtpConfig] = useState<any>({ isEnabled: false });
  const [saasNotificationTemplates, setSaasNotificationTemplates] = useState<any[]>([]);
  const [saasWhatsAppCentralConfig, setSaasWhatsAppCentralConfig] = useState<any>({ isEnabled: false });
  const [saasPaymentReceipts, setSaasPaymentReceipts] = useState<any[]>([]);
  const [globalSaasMetrics, setGlobalSaasMetrics] = useState<any>({ totalMrr: 0 });

  // ─── ESTADOS Sesión #20 (Fix Pantallas Bloque Base) ───
  /** Plantillas de mensaje para campañas */
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplatesMock);
  /** Roles RBAC del tenant */
  const [roles, setRoles] = useState<Role[]>(initialRolesMock);
  /** Bitácora de auditoría */
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogsMock);
  /** Configuración de Issabel PBX */
  const [issabelConfig, setIssabelConfig] = useState<IssabelConfig>(defaultIssabelConfig);
  /** Registro de llamadas (CDR) */
  const [callRecords, setCallRecords] = useState<CallRecord[]>(initialCallRecordsMock);
  /** Configuración de n8n */
  const [n8nConfig, setN8nConfig] = useState<N8nConfig>(defaultN8nConfig);
  /** Configuración de IA */
  const [aiConfig, setAiConfig] = useState<AiIntegrationConfig>(defaultAiConfig);

  // ═══════════════════════════════════════════════════════════════════
  // NUEVOS ESTADOS — Sesión Fix Pantallas Bloque Extendido
  // ═══════════════════════════════════════════════════════════════════

  // ─── WhatsApp (Bloque 11) ───
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfig>(defaultWhatsAppConfig);

  // ─── Instagram / Facebook (Bloque 12) ───
  const [instagramConfig, setInstagramConfig] = useState<InstagramConfig>(defaultInstagramConfig);
  const [facebookConfig, setFacebookConfig] = useState<FacebookConfig>(defaultFacebookConfig);

  // ─── Notificaciones y Alertas (Bloque 1) ───
  const [latestLiveNotification, setLatestLiveNotification] = useState<AppNotification | null>(null);

  // ─── Clientes Extendido (Bloque 2) ───
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(defaultSmtpConfig);

  // ─── Auth y 2FA (Bloque 7) ───
  const [isTwoFactorVerified, setIsTwoFactorVerified] = useState<boolean>(false);
  const [pendingTwoFactor, setPendingTwoFactor] = useState<any | null>(null);

  // ─── Header / Sidebar (Bloque 8) ───
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // ─── Automatizaciones (Bloque 9) ───
  const [scheduledRules, setScheduledRules] = useState<ScheduledRule[]>([]);
  const [antiSpamSettings, setAntiSpamSettings] = useState<AntiSpamSettings>({
    whatsappDailyLimit: 200,
    emailDailyLimit: 500,
    minIntervalSeconds: 3,
    maxIntervalSeconds: 12,
    randomizeDelay: true,
    randomJitter: true,
    alertOnSpamRisk: true,
    autoPauseOnHighFailureRate: true,
  });

  // ─── SaaS Extendido (Bloque 14) ───
  const [saasDatabaseConfig, setSaasDatabaseConfig] = useState<SaasDatabaseConfig>(defaultSaasDatabaseConfig);
  const [saasVpsConfig, setSaasVpsConfig] = useState<SaasVpsDeploymentConfig>(defaultSaasVpsConfig);

  // ─── Refs para evitar re-ejecuciones ───
  const fetchedTenantRef = useRef<string | null>(null);
  const currentTenantIdRef = useRef<string>(defaultTenant.id);

  // Mantener ref sincronizado con el tenant actual
  useEffect(() => {
    currentTenantIdRef.current = currentTenant.id || 'tenant-demo';
  }, [currentTenant.id]);

  // ─── Setters con referencias estables (useCallback) ───
  const setCurrentTenant = useCallback((tenant: any) => {
    const normalized = normalizeTenantData(tenant);
    setCurrentTenantState(normalized);
  }, []);

  const setCurrentUser = useCallback((user: any) => {
    setCurrentUserState(user ? { ...defaultUser, ...user } : null);
  }, []);

  const setCurrentTenantId = useCallback((id: string) => {
    setCurrentTenantState((prev) => ({ ...prev, id }));
  }, []);

  const setCurrentUserId = useCallback((id: string) => {
    setCurrentUserState((prev) => (prev ? { ...prev, id } : null));
  }, []);

    /**
   * Verifica si el usuario actual tiene permiso para una acción.
   *
   * Lógica (Fase B — Sesión Fix Sidebar por Rol):
   *   1. Si el usuario es `saas_super_admin` → acceso total (siempre `true`).
   *   2. Si el rol es de tenant (`admin`/`supervisor`/`agent`/`readonly`)
   *      → busca la matriz en `initialRolesMock` y devuelve el valor.
   *   3. Fail-safe: si el módulo o la acción no existen → `false`.
   *
   * Cuando conectemos al backend real (Fase C), este método leerá los
   * permisos desde el JWT o desde `GET /api/auth/permissions`.
   *
   * @param module Módulo del PermissionMatrix (ej: 'clients', 'banking')
   * @param action Acción del módulo (ej: 'view', 'create', 'edit')
   * @returns `true` si tiene permiso, `false` si no
   */
  const can = useCallback((module: string, action: string): boolean => {
    // 1. saas_super_admin tiene acceso total a todo
    if (currentUser?.role === 'saas_super_admin') {
      return true;
    }

    // 2. Buscar el rol del usuario en la matriz de roles
    const userRole = currentUser?.role;
    if (!userRole) {
      return false; // sin rol = sin permisos
    }

    const roleDefinition = initialRolesMock.find((r) => r.key === userRole);
    if (!roleDefinition) {
      return false; // rol no encontrado
    }

    // 3. Leer la matriz de permisos del rol
    const permissions = roleDefinition.permissions as Record<string, Record<string, boolean>> | undefined;
    if (!permissions || typeof permissions !== 'object') {
      return false;
    }

    const modulePermissions = permissions[module];
    if (!modulePermissions || typeof modulePermissions !== 'object') {
      return false; // módulo no declarado para este rol
    }

    // 4. Devolver el valor booleano (con fallback a false si no existe)
    return modulePermissions[action] === true;
  }, [currentUser?.role]);

  // ─── SaaS Central setters ───
  const createTenant = (tenantData: any, adminData: any) => {
    const newT = { ...defaultTenant, ...tenantData, id: `tenant-${Date.now()}` };
    setTenants((prev) => [...prev, newT]);
  };
  const updateTenantSubscription = (tenantId: string, subscriptionData: any) => {
    console.warn('[STUB] updateTenantSubscription — pendiente de conectar a PATCH /api/tenants/:id/subscription');
  };
  const updateTenantSubscriptionPlan = (tenantId: string, planName: string) => {
    console.warn('[STUB] updateTenantSubscriptionPlan — pendiente de conectar a PATCH /api/tenants/:id/plan');
  };
  const toggleTenantStatus = (tenantId: string) => {
    console.warn('[STUB] toggleTenantStatus — pendiente de conectar a PATCH /api/tenants/:id/status');
  };
  const resetTenantData = (tenantId: string) => {
    console.warn('[STUB] resetTenantData — pendiente de conectar a POST /api/tenants/:id/reset');
  };
  const addSaasAdmin = (adminData: any) => {
    setSaasAdmins((prev) => [...prev, { ...adminData, id: `adm-${Date.now()}` }]);
  };
  const updateSaasAdmin = (id: string, adminData: any) => {
    console.warn('[STUB] updateSaasAdmin — pendiente de conectar a PATCH /api/saas/admins/:id');
  };
  const deleteSaasAdmin = (id: string) => {
    setSaasAdmins((prev) => prev.filter((a) => a.id !== id));
  };
  const updateSaasLandingConfig = (config: any) => {
    setSaasLandingConfig((prev: any) => ({ ...prev, ...config }));
  };
  const updateTenantLandingConfig = (tenantId: string, config: any) => {
    console.warn('[STUB] updateTenantLandingConfig — pendiente de conectar a PATCH /api/tenants/:id/landing');
  };
  const updateSaasPlans = (plans: any[]) => setSaasPlans(plans);
  const updateSaasSmtpConfig = (config: any) => setSaasSmtpConfig(config);
  const updateSaasNotificationTemplates = (templates: any[]) => setSaasNotificationTemplates(templates);
  const testSaasSmtpConnection = async () => true;
  const updateSaasWhatsAppCentralConfig = (config: any) => setSaasWhatsAppCentralConfig(config);
  const sendWhatsAppCentralTestMessage = async () => true;
  const approvePaymentReceipt = (receiptId: string) => {
    console.warn('[STUB] approvePaymentReceipt — pendiente de conectar a POST /api/saas/receipts/:id/approve');
  };
  const rejectPaymentReceipt = (receiptId: string) => {
    console.warn('[STUB] rejectPaymentReceipt — pendiente de conectar a POST /api/saas/receipts/:id/reject');
  };

  
  // ═══════════════════════════════════════════════════════════════════
  // STUBS Sesión #20 (Fix Pantallas Bloque Base)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Inicia una llamada saliente vía Issabel PBX (click-to-call).
   * STUB: pendiente de conectar a POST /api/telephony/call.
   */
  const startCall = useCallback((phone: string, clientName: string, clientId?: string) => {
    console.warn('[STUB] startCall — pendiente de conectar a POST /api/telephony/call', { phone, clientName, clientId });
    setShowSoftphone(true);
  }, []);

  /**
   * Inicia (o navega a) una conversación de WhatsApp con un cliente.
   * STUB: pendiente de conectar a POST /api/whatsapp/conversations.
   */
  const startWhatsAppConversation = useCallback((clientId: string, phone: string, clientName: string) => {
    console.warn('[STUB] startWhatsAppConversation — pendiente de conectar a POST /api/whatsapp/conversations', { clientId, phone, clientName });
  }, []);

  /**
   * Actualiza la configuración de Issabel PBX del tenant.
   * STUB: pendiente de conectar a PATCH /api/telephony/config.
   */
  const updateIssabelConfig = useCallback((config: Partial<IssabelConfig>) => {
    console.warn('[STUB] updateIssabelConfig — pendiente de conectar a PATCH /api/telephony/config', config);
    setIssabelConfig((prev) => ({ ...prev, ...config }));
  }, []);

  /**
   * Crea una campaña masiva (WhatsApp / Email).
   * STUB: pendiente de conectar a POST /api/campaigns.
   */
  const createCampaign = useCallback((campaignData: Partial<Campaign>) => {
    console.warn('[STUB] createCampaign — pendiente de conectar a POST /api/campaigns', campaignData);
    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      tenantId: currentTenantIdRef.current,
      name: campaignData.name || 'Nueva Campaña',
      channel: campaignData.channel || 'whatsapp',
      templateId: campaignData.templateId || '',
      targetSegment: campaignData.targetSegment || {},
      totalAudience: campaignData.totalAudience || 0,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      repliedCount: 0,
      status: 'Borrador',
      createdAt: new Date().toISOString(),
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
  }, []);

  /**
   * Actualiza la matriz de permisos de un rol.
   * STUB: pendiente de conectar a PATCH /api/roles/:key/permissions.
   */
  const updateRolePermissions = useCallback((roleKey: UserRole, permissions: Role['permissions']) => {
    console.warn('[STUB] updateRolePermissions — pendiente de conectar a PATCH /api/roles/:key/permissions', { roleKey, permissions });
    setRoles((prev) => prev.map((r) => (r.key === roleKey ? { ...r, permissions } : r)));
  }, []);

  /**
   * Invita a un nuevo usuario al tenant.
   * STUB: pendiente de conectar a POST /api/users/invite.
   */
  const inviteUser = useCallback((userData: { name: string; email: string; role: UserRole; extension?: string }) => {
    console.warn('[STUB] inviteUser — pendiente de conectar a POST /api/users/invite', userData);
    const newUser: User = {
      id: `usr-${Date.now()}`,
      tenantId: currentTenantIdRef.current,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      extension: userData.extension,
      status: 'active',
    };
    setUsers((prev) => [...prev, newUser]);
  }, []);

  /**
   * Activa/desactiva un usuario del tenant.
   * STUB: pendiente de conectar a PATCH /api/users/:id/status.
   */
  const toggleUserStatus = useCallback((userId: string) => {
    console.warn('[STUB] toggleUserStatus — pendiente de conectar a PATCH /api/users/:id/status', userId);
    setUsers((prev) => prev.map((u) => {
      if (u.id !== userId) return u;
      const isActive = u.status === 'active';
      return { ...u, status: isActive ? 'inactive' : 'active', active: !isActive };
    }));
  }, []);

  /**
   * Actualiza la configuración de n8n.
   * STUB: pendiente de conectar a PATCH /api/integrations/n8n.
   */
  const updateN8nConfig = useCallback((config: Partial<N8nConfig>) => {
    console.warn('[STUB] updateN8nConfig — pendiente de conectar a PATCH /api/integrations/n8n', config);
    setN8nConfig((prev) => ({ ...prev, ...config }));
  }, []);

  /**
   * Actualiza la configuración del proveedor de IA.
   * STUB: pendiente de conectar a PATCH /api/integrations/ai.
   */
  const updateAiConfig = useCallback((config: Partial<AiIntegrationConfig>) => {
    console.warn('[STUB] updateAiConfig — pendiente de conectar a PATCH /api/integrations/ai', config);
    setAiConfig((prev) => ({ ...prev, ...config }));
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // NUEVOS STUBS — Sesión Fix Pantallas Bloque Extendido
  // ═══════════════════════════════════════════════════════════════════

  // ─── Bloque 11: WhatsApp ───

  /**
   * Actualiza parcialmente la configuración de una cuenta WhatsApp (WA1/WA2).
   * STUB: pendiente de conectar a PATCH /api/whatsapp/config/:accountId.
   */
  const updateWhatsAppAccountConfig = useCallback(
    (accountId: 'WA1' | 'WA2', config: Partial<WhatsAppAccountConfig>) => {
      console.warn('[STUB] updateWhatsAppAccountConfig — pendiente de conectar a PATCH /api/whatsapp/config/:accountId', { accountId, config });
      setWhatsAppConfig((prev) => ({
        ...prev,
        accounts: prev.accounts
          ? {
              ...prev.accounts,
              [accountId]: { ...prev.accounts[accountId], ...config } as WhatsAppAccountConfig,
            }
          : prev.accounts,
      }));
    },
    []
  );

  /**
   * Persiste la configuración completa de WhatsApp del tenant.
   * STUB: pendiente de conectar a PUT /api/whatsapp/config.
   */
  const saveWhatsAppConfig = useCallback((config: Partial<WhatsAppConfig>) => {
    console.warn('[STUB] saveWhatsAppConfig — pendiente de conectar a PUT /api/whatsapp/config', config);
    setWhatsAppConfig((prev) => ({ ...prev, ...config }));
  }, []);

  /**
   * Envía un mensaje de texto en una conversación de WhatsApp.
   * STUB: pendiente de conectar a POST /api/whatsapp/messages.
   */
  const sendWhatsAppMessage = useCallback(async (conversationId: string, text: string) => {
    console.warn('[STUB] sendWhatsAppMessage — pendiente de conectar a POST /api/whatsapp/messages', { conversationId, text });
  }, []);

  /**
   * Alterna una reacción (emoji) en un mensaje de WhatsApp.
   * STUB: pendiente de conectar a POST /api/whatsapp/messages/:id/reactions.
   */
  const toggleWhatsAppReaction = useCallback((messageId: string, emoji: string) => {
    console.warn('[STUB] toggleWhatsAppReaction — pendiente de conectar a POST /api/whatsapp/messages/:id/reactions', { messageId, emoji });
  }, []);

  // ─── Bloque 12: Instagram / Facebook ───

  /**
   * Persiste la configuración de Instagram del tenant.
   * STUB: pendiente de conectar a PUT /api/integrations/instagram.
   */
  const saveInstagramConfig = useCallback((config: Partial<InstagramConfig>) => {
    console.warn('[STUB] saveInstagramConfig — pendiente de conectar a PUT /api/integrations/instagram', config);
    setInstagramConfig((prev) => ({ ...prev, ...config }));
  }, []);

  /**
   * Persiste la configuración de Facebook del tenant.
   * STUB: pendiente de conectar a PUT /api/integrations/facebook.
   */
  const saveFacebookConfig = useCallback((config: Partial<FacebookConfig>) => {
    console.warn('[STUB] saveFacebookConfig — pendiente de conectar a PUT /api/integrations/facebook', config);
    setFacebookConfig((prev) => ({ ...prev, ...config }));
  }, []);

  // ─── Bloque 13: Auditoría global ───

  /**
   * Registra un evento manual en la bitácora de auditoría del tenant.
   * STUB: pendiente de conectar a POST /api/audit.
   */
  const recordAudit = useCallback(
    (
      action: AuditLogEntry['action'],
      module: AuditLogEntry['module'],
      targetId?: string,
      details?: string
    ) => {
      console.warn('[STUB] recordAudit — pendiente de conectar a POST /api/audit', { action, module, targetId, details });
    },
    []
  );

  // ─── Bloque 1: Notificaciones y Alertas ───

  /**
   * Descarta (marca como leída) una alerta del sistema.
   * STUB: pendiente de conectar a PATCH /api/alerts/:id/dismiss.
   */
  const dismissAlert = useCallback((id: string) => {
    console.warn('[STUB] dismissAlert — pendiente de conectar a PATCH /api/alerts/:id/dismiss', id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  /**
   * Limpia la última notificación en vivo.
   * STUB: pendiente de conectar a WebSocket / Socket.io.
   */
  const clearLatestLiveNotification = useCallback(() => {
    console.warn('[STUB] clearLatestLiveNotification — pendiente de conectar a WebSocket / Socket.io');
    setLatestLiveNotification(null);
  }, []);

  // ─── Bloque 2: Clientes Extendido ───

  /**
   * Alias DDD de addClient.
   */
  const createClient = useCallback(async (clientData: any) => {
    console.warn('[STUB] createClient — alias de addClient, pendiente de conectar a POST /api/clients');
    return addClient(clientData);
  }, []);

  /**
   * Agrega una definición de campo personalizado.
   * STUB: pendiente de conectar a POST /api/custom-fields.
   */
  const addCustomField = useCallback((field: CustomFieldDefinition) => {
    console.warn('[STUB] addCustomField — pendiente de conectar a POST /api/custom-fields', field);
    setCustomFields((prev) => [...prev, field]);
  }, []);

  /**
   * Agrega una nota a un cliente.
   * STUB: pendiente de conectar a POST /api/clients/:id/notes.
   */
  const addNote = useCallback(async (clientId: string, note: any) => {
    console.warn('[STUB] addNote — pendiente de conectar a POST /api/clients/:id/notes', { clientId, note });
    setNotes((prev) => [...prev, { ...note, id: `note-${Date.now()}`, clientId }]);
  }, []);

  /**
   * Agrega un documento a un cliente.
   * STUB: pendiente de conectar a POST /api/clients/:id/documents.
   */
  const addDocument = useCallback(async (clientId: string, doc: any) => {
    console.warn('[STUB] addDocument — pendiente de conectar a POST /api/clients/:id/documents', { clientId, doc });
    setDocuments((prev) => [...prev, { ...doc, id: `doc-${Date.now()}`, clientId }]);
  }, []);

  /**
   * Elimina un documento de un cliente.
   * STUB: pendiente de conectar a DELETE /api/clients/:id/documents/:docId.
   */
  const deleteDocument = useCallback(async (clientId: string, docId: string) => {
    console.warn('[STUB] deleteDocument — pendiente de conectar a DELETE /api/clients/:id/documents/:docId', { clientId, docId });
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  }, []);

  /**
   * Envía un email transaccional.
   * STUB: pendiente de conectar a POST /api/email/send.
   */
  const sendEmailMessage = useCallback(async (to: string, subject: string, body: string) => {
    console.warn('[STUB] sendEmailMessage — pendiente de conectar a POST /api/email/send', { to, subject, body });
    return true;
  }, []);

  // ─── Bloque 3: Pólizas Extendido ───

  /**
   * Alias DDD de addPolicy.
   */
  const createPolicy = useCallback(async (policyData: any) => {
    console.warn('[STUB] createPolicy — alias de addPolicy, pendiente de conectar a POST /api/policies');
    return addPolicy(policyData);
  }, []);

  // ─── Bloque 4: Pipeline ───

  /**
   * Mueve un cliente a otra etapa del pipeline.
   * STUB: pendiente de conectar a PATCH /api/pipeline/clients/:id/stage.
   */
  const moveClientStage = useCallback(async (clientId: string, stageId: string) => {
    console.warn('[STUB] moveClientStage — pendiente de conectar a PATCH /api/pipeline/clients/:id/stage', { clientId, stageId });
  }, []);

  // ─── Bloque 5: Plantillas ───

  /**
   * Crea una plantilla de mensaje.
   * STUB: pendiente de conectar a POST /api/templates.
   */
  const createTemplate = useCallback(async (data: Partial<MessageTemplate>) => {
    console.warn('[STUB] createTemplate — pendiente de conectar a POST /api/templates', data);
    const newTemplate: MessageTemplate = {
      id: `tmpl-${Date.now()}`,
      tenantId: currentTenantIdRef.current,
      name: data.name || 'Nueva Plantilla',
      channel: data.channel || 'whatsapp',
      category: data.category || 'General',
      body: data.body || '',
      variables: data.variables || [],
      createdAt: new Date().toISOString(),
    };
    setTemplates((prev) => [newTemplate, ...prev]);
  }, []);

  /**
   * Actualiza una plantilla existente.
   * STUB: pendiente de conectar a PATCH /api/templates/:id.
   */
  const updateTemplate = useCallback(async (id: string, data: Partial<MessageTemplate>) => {
    console.warn('[STUB] updateTemplate — pendiente de conectar a PATCH /api/templates/:id', { id, data });
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  }, []);

  /**
   * Elimina una plantilla.
   * STUB: pendiente de conectar a DELETE /api/templates/:id.
   */
  const deleteTemplate = useCallback(async (id: string) => {
    console.warn('[STUB] deleteTemplate — pendiente de conectar a DELETE /api/templates/:id', id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Bloque 6: Telefonía Extendido ───

  /**
   * Finaliza una llamada activa.
   * STUB: pendiente de conectar a POST /api/telephony/call/:id/end.
   */
  const endCall = useCallback((callId: string) => {
    console.warn('[STUB] endCall — pendiente de conectar a POST /api/telephony/call/:id/end', callId);
  }, []);

  // ─── Bloque 7: Auth y 2FA ───

  /**
   * Verifica un código OTP de 6 dígitos.
   * STUB: pendiente de conectar a POST /api/auth/verify-2fa.
   */
  const verify2FACode = useCallback(async (code: string) => {
    console.warn('[STUB] verify2FACode — pendiente de conectar a POST /api/auth/verify-2fa', code);
    setIsTwoFactorVerified(true);
    setPendingTwoFactor(null);
    return true;
  }, []);

  /**
   * Login alternativo (email + password).
   * STUB: pendiente de conectar a POST /api/auth/login.
   */
  const loginUser = useCallback(async (email: string, password: string) => {
    console.warn('[STUB] loginUser — pendiente de conectar a POST /api/auth/login', { email });
    return { success: true, requires2FA: false };
  }, []);

  // ─── Bloque 10: Chat Interno ───

  /**
   * Envía un mensaje a un canal del chat interno.
   * STUB: pendiente de conectar a POST /api/chat/channels/:id/messages.
   */
  const sendInternalChatMessage = useCallback(async (channelId: string, text: string) => {
    console.warn('[STUB] sendInternalChatMessage — pendiente de conectar a POST /api/chat/channels/:id/messages', { channelId, text });
  }, []);

  /**
   * Alterna una reacción en un mensaje del chat interno.
   * STUB: pendiente de conectar a POST /api/chat/messages/:id/reactions.
   */
  const toggleInternalChatReaction = useCallback((messageId: string, emoji: string) => {
    console.warn('[STUB] toggleInternalChatReaction — pendiente de conectar a POST /api/chat/messages/:id/reactions', { messageId, emoji });
  }, []);

  // ─── Bloque 9: Automatizaciones ───

  /**
   * Actualiza las reglas programadas.
   * STUB: pendiente de conectar a PUT /api/automations/rules.
   */
  const updateScheduledRules = useCallback((rules: ScheduledRule[]) => {
    console.warn('[STUB] updateScheduledRules — pendiente de conectar a PUT /api/automations/rules', rules);
    setScheduledRules(rules);
  }, []);

  /**
   * Actualiza la configuración anti-spam.
   * STUB: pendiente de conectar a PUT /api/automations/anti-spam.
   */
  const updateAntiSpamSettings = useCallback((settings: Partial<AntiSpamSettings>) => {
    console.warn('[STUB] updateAntiSpamSettings — pendiente de conectar a PUT /api/automations/anti-spam', settings);
    setAntiSpamSettings((prev) => ({ ...prev, ...settings }));
  }, []);

  // ─── Bloque 14: SaaS Extendido ───

  /**
   * Envía un comprobante de pago de renovación al Super Admin.
   * STUB: pendiente de conectar a POST /api/saas/receipts.
   */
  const submitRenewalPaymentReceipt = useCallback(async (receipt: Partial<SaasPaymentReceipt>) => {
    console.warn('[STUB] submitRenewalPaymentReceipt — pendiente de conectar a POST /api/saas/receipts', receipt);
  }, []);

  /**
   * Envía un lead desde la micro-landing pública.
   * STUB: pendiente de conectar a POST /api/public/leads.
   */
  const submitMicroLandingLead = useCallback(async (lead: any) => {
    console.warn('[STUB] submitMicroLandingLead — pendiente de conectar a POST /api/public/leads', lead);
  }, []);

  /**
   * Registra un nuevo tenant con flujo de pago completo (wizard).
   * STUB: pendiente de conectar a POST /api/saas/register.
   */
  const registerNewTenantWithPayment = useCallback(async (data: any) => {
    console.warn('[STUB] registerNewTenantWithPayment — pendiente de conectar a POST /api/saas/register', data);
  }, []);

  /**
   * Actualiza la configuración de la base de datos SaaS.
   * STUB: pendiente de conectar a PUT /api/saas/database.
   */
  const updateSaasDatabaseConfig = useCallback((config: Partial<SaasDatabaseConfig>) => {
    console.warn('[STUB] updateSaasDatabaseConfig — pendiente de conectar a PUT /api/saas/database', config);
    setSaasDatabaseConfig((prev) => ({ ...prev, ...config }));
  }, []);

  /**
   * Prueba la conexión a la base de datos SaaS.
   * STUB: pendiente de conectar a POST /api/saas/database/test.
   */
  const testDatabaseConnection = useCallback(async (config: Partial<SaasDatabaseConfig>) => {
    console.warn('[STUB] testDatabaseConnection — pendiente de conectar a POST /api/saas/database/test', config);
    return true;
  }, []);

  /**
   * Actualiza la configuración de despliegue VPS.
   * STUB: pendiente de conectar a PUT /api/saas/vps.
   */
  const updateSaasVpsConfig = useCallback((config: Partial<SaasVpsDeploymentConfig>) => {
    console.warn('[STUB] updateSaasVpsConfig — pendiente de conectar a PUT /api/saas/vps', config);
    setSaasVpsConfig((prev) => ({ ...prev, ...config }));
  }, []);

  // ─── fetchClients con useCallback y ref para tenantId ───
  const fetchClients = useCallback(async () => {
    try {
      setLoadingClients(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const tenantId = currentTenantIdRef.current;

      const res = await fetch(`/api/clients?tenantId=${tenantId}`, {
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setClients(data);
            return;
          }
        }
      }
    } catch (error) {
      // Mantiene datos locales si falla la API
    } finally {
      setLoadingClients(false);
    }
  }, []);

  // ─── fetchPolicies con useCallback y ref para tenantId ───
  const fetchPolicies = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const tenantId = currentTenantIdRef.current;

      const res = await fetch(`/api/policies?tenantId=${tenantId}`, {
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPolicies(data);
            return;
          }
        }
      }
    } catch (error) {
      // Mantiene datos locales si falla la API
    }
  }, []);

  const addClient = async (newClientData: any) => {
    const clientWithId = { ...newClientData, id: `cli-${Date.now()}`, tenant_id: currentTenant.id };
    setClients((prev) => [clientWithId, ...(Array.isArray(prev) ? prev : [])]);
    return clientWithId;
  };

  const updateClient = async (id: string, updatedData: any) => {
    setClients((prev) =>
      (Array.isArray(prev) ? prev : []).map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );
    return { id, ...updatedData };
  };

  const deleteClient = async (id: string) => {
    setClients((prev) => (Array.isArray(prev) ? prev : []).filter((c) => c.id !== id));
  };

  const addPolicy = async (policyData: any) => {
    const newPol = { ...policyData, id: `pol-${Date.now()}` };
    setPolicies((prev) => [newPol, ...prev]);
    return newPol;
  };

  const updatePolicy = async (id: string, policyData: any) => {
    setPolicies((prev) => prev.map((p) => (p.id === id ? { ...p, ...policyData } : p)));
    return policyData;
  };

  const deletePolicy = async (id: string) => {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await fetch(`/api/banking/accounts?tenantId=${currentTenant.id}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBankAccounts(data);
        }
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const addBankAccount = async (accountData: any) => {
    try {
      const res = await fetch(`/api/banking/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...accountData, tenant_id: currentTenant.id }),
      }).catch(() => null);

      if (res && res.ok) {
        const newAccount = await res.json();
        setBankAccounts((prev) => [newAccount, ...(Array.isArray(prev) ? prev : [])]);
        return newAccount;
      }
    } catch (error) {
      console.error('Error adding bank account:', error);
    }
    const newAccount = { ...accountData, id: `bank-${Date.now()}`, tenant_id: currentTenant.id };
    setBankAccounts((prev) => [newAccount, ...(Array.isArray(prev) ? prev : [])]);
    return newAccount;
  };

  const updateBankAccount = async (id: string, accountData: any) => {
    try {
      const res = await fetch(`/api/banking/accounts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...accountData, id }),
      }).catch(() => null);

      if (res && res.ok) {
        const updatedAccount = await res.json();
        setBankAccounts((prev) =>
          (Array.isArray(prev) ? prev : []).map((a) => (a.id === id ? { ...a, ...updatedAccount } : a))
        );
        return updatedAccount;
      }
    } catch (error) {
      console.error('Error updating bank account:', error);
    }
    setBankAccounts((prev) =>
      (Array.isArray(prev) ? prev : []).map((a) => (a.id === id ? { ...a, ...accountData } : a))
    );
    return { id, ...accountData };
  };

  const deleteBankAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/banking/accounts?id=${id}`, {
        method: 'DELETE',
      }).catch(() => null);

      if (res && res.ok) {
        setBankAccounts((prev) => (Array.isArray(prev) ? prev : []).filter((a) => a.id !== id));
        return;
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
    }
    setBankAccounts((prev) => (Array.isArray(prev) ? prev : []).filter((a) => a.id !== id));
  };

  const setDefaultPaymentMethod = async (clientId: string, accountId: string) => {
    try {
      const res = await fetch(`/api/banking/accounts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: accountId, clientId, isDefault: true }),
      }).catch(() => null);

      if (res && res.ok) {
        setBankAccounts((prev) =>
          (Array.isArray(prev) ? prev : []).map((a) =>
            a.clientId === clientId ? { ...a, isDefault: a.id === accountId } : a
          )
        );
        return;
      }
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
    setBankAccounts((prev) =>
      (Array.isArray(prev) ? prev : []).map((a) =>
        a.clientId === clientId ? { ...a, isDefault: a.id === accountId } : a
      )
    );
  };

  const updateUser = async (userData: any) => {
    setCurrentUserState((prev) => (prev ? { ...prev, ...userData } : null));
    return userData;
  };

  // ─── logoutUser con useCallback ───
  const logoutUser = useCallback(() => {
    setCurrentUserState(null);
    setCurrentTenantState(defaultTenant);
    fetchedTenantRef.current = null;
  }, []);

  const markAppNotificationRead = (id: string) => {
    setAppNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAppNotificationsRead = () => {
    setAppNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteAppNotification = (id: string) => {
    setAppNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // ─── CONTROL DE EJECUCIÓN ÚNICA ───
  useEffect(() => {
    const currentId = currentTenant.id || 'tenant-demo';

    if (fetchedTenantRef.current === currentId) {
      return;
    }

    fetchedTenantRef.current = currentId;
    fetchClients();
    fetchPolicies();
  }, [currentTenant.id, fetchClients, fetchPolicies]);

  const catalogs = {
    clientCategories: (currentTenant as any).clientCategories || (defaultTenant as any).clientCategories,
    policyTypes: (currentTenant as any).policyTypes || (defaultTenant as any).policyTypes,
  };

  return (
    <TenantContext.Provider
      value={{
        // ─── Datos principales ───
        clients,
        policies,
        currentTenant,
        currentUser,
        users,
        activeConversationId,
        saasLandingConfig,
        loadingClients,

        // ─── Colecciones ───
        alerts,
        notifications,
        appNotifications,
        conversations,
        campaigns,
        pipelines,
        bankAccounts,
        documents,
        notes,
        activities,

        // ─── Clientes ───
        fetchClients,
        addClient,
        updateClient,
        deleteClient,

        // ─── Pólizas ───
        fetchPolicies,
        addPolicy,
        updatePolicy,
        deletePolicy,

        // ─── Banco ───
        fetchBankAccounts,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        setDefaultPaymentMethod,

        // ─── Setters ───
        setCurrentTenantId,
        setCurrentTenant,
        setCurrentUser,
        setActiveConversationId,
        logoutUser,
        updateUser,

        // ─── Permisos ───
        can,

        // ─── Notificaciones ───
        markAppNotificationRead,
        markAllAppNotificationsRead,
        deleteAppNotification,

        // ─── Telefonía ───
        startCall,
        startWhatsAppConversation,
        issabelConfig,
        updateIssabelConfig,
        callRecords,
        showSoftphone,
        setShowSoftphone,

        // ─── SaaS Central ───
        tenants,
        createTenant,
        updateTenantSubscription,
        updateTenantSubscriptionPlan,
        toggleTenantStatus,
        resetTenantData,
        updateTenantLandingConfig,

        // ─── SaaS Admins ───
        saasAdmins,
        addSaasAdmin,
        updateSaasAdmin,
        deleteSaasAdmin,

        // ─── SaaS Landing ───
        updateSaasLandingConfig,

        // ─── SaaS Plans ───
        saasPlans,
        updateSaasPlans,

        // ─── SaaS SMTP ───
        saasSmtpConfig,
        updateSaasSmtpConfig,
        testSaasSmtpConnection,

        // ─── SaaS Notification Templates ───
        saasNotificationTemplates,
        updateSaasNotificationTemplates,

        // ─── SaaS WhatsApp Central ───
        saasWhatsAppCentralConfig,
        updateSaasWhatsAppCentralConfig,
        sendWhatsAppCentralTestMessage,

        // ─── SaaS Payment Receipts ───
        saasPaymentReceipts,
        approvePaymentReceipt,
        rejectPaymentReceipt,
        globalSaasMetrics,

        // ─── Catálogos ───
        catalogs,

        // ─── Stubs Sesión #20 (Fix Pantallas Bloque Base) ───
        templates,
        createCampaign,
        roles,
        updateRolePermissions,
        inviteUser,
        toggleUserStatus,
        auditLogs,
        n8nConfig,
        updateN8nConfig,
        aiConfig,
        updateAiConfig,

        // ═══════════════════════════════════════════════════════════════
        // NUEVOS STUBS — Sesión Fix Pantallas Bloque Extendido
        // ═══════════════════════════════════════════════════════════════

        // ─── Bloque 11: WhatsApp ───
        whatsAppConfig,
        updateWhatsAppAccountConfig,
        saveWhatsAppConfig,
        sendWhatsAppMessage,
        toggleWhatsAppReaction,

        // ─── Bloque 12: Instagram / Facebook ───
        instagramConfig,
        saveInstagramConfig,
        facebookConfig,
        saveFacebookConfig,

        // ─── Bloque 13: Auditoría global ───
        recordAudit,

        // ─── Bloque 1: Notificaciones y Alertas ───
        dismissAlert,
        latestLiveNotification,
        clearLatestLiveNotification,

        // ─── Bloque 2: Clientes Extendido ───
        createClient,
        customFields,
        addCustomField,
        addNote,
        addDocument,
        deleteDocument,
        smtpConfig,
        sendEmailMessage,

        // ─── Bloque 3: Pólizas Extendido ───
        createPolicy,

        // ─── Bloque 4: Pipeline ───
        moveClientStage,

        // ─── Bloque 5: Plantillas ───
        createTemplate,
        updateTemplate,
        deleteTemplate,

        // ─── Bloque 6: Telefonía Extendido ───
        endCall,

        // ─── Bloque 7: Auth y 2FA ───
        isTwoFactorVerified,
        pendingTwoFactor,
        verify2FACode,
        loginUser,

        // ─── Bloque 8: Header / Sidebar ───
        setCurrentUserId,
        chatMessages,

        // ─── Bloque 9: Automatizaciones ───
        scheduledRules,
        updateScheduledRules,
        antiSpamSettings,
        updateAntiSpamSettings,

        // ─── Bloque 10: Chat Interno ───
        sendInternalChatMessage,
        toggleInternalChatReaction,

        // ─── Bloque 14: SaaS Extendido ───
        submitRenewalPaymentReceipt,
        submitMicroLandingLead,
        registerNewTenantWithPayment,
        saasDatabaseConfig,
        updateSaasDatabaseConfig,
        testDatabaseConnection,
        saasVpsConfig,
        updateSaasVpsConfig,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};


/**
 * Hook para consumir el TenantContext.
 * Debe usarse dentro de un <TenantProvider>. Si no, lanza error.
 *
 * @example
 * const { clients, fetchClients, can } = useTenant();
 */
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant debe ser usado dentro de un TenantProvider');
  }
  return context;
};