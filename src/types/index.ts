// Atoms Cloud CRM - Core DDD Types & Models

export type UserRole = 'admin' | 'supervisor' | 'agent' | 'readonly';

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  extension?: string; // Issabel extension e.g. 101, 102
  status: 'active' | 'inactive';
  active?: boolean;
  isSuperAdmin?: boolean;
  lastLogin?: string;
  commissionRate?: number; // %
  assignedPipelineId?: string;
  twoFactorEnabled?: boolean;
}

export interface PermissionMatrix {
  clients: { view: boolean; create: boolean; edit: boolean; delete: boolean; export: boolean };
  policies: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  pipeline: { view: boolean; edit: boolean; moveCards: boolean; manageStages: boolean };
  whatsapp: { view: boolean; send: boolean; configure: boolean };
  email: { view: boolean; send: boolean; configure: boolean };
  campaigns: { view: boolean; create: boolean; execute: boolean };
  reports: { view: boolean; export: boolean };
  banking: { view: boolean; edit: boolean; viewSensitive: boolean };
  telephony: { view: boolean; call: boolean; viewCdr: boolean; configure: boolean };
  branding: { view: boolean; edit: boolean };
  users: { view: boolean; invite: boolean; editRoles: boolean };
  audit: { view: boolean };
  integrations: { view: boolean; configure: boolean };
}

export type ModuleKey = keyof PermissionMatrix;

export interface TenantSubscription {
  plan: 'Starter' | 'Pro Business' | 'Enterprise' | string;
  planId?: string;
  status: 'active' | 'trial' | 'suspended' | 'past_due' | 'pending_payment' | 'inactive';
  monthlyPrice: number;
  renewalDate: string;
  startDate?: string;
  userQuota: number;
  whatsappLinesQuota: number;
  storageGb: number;
  contactEmail?: string;
  billingCycle?: 'monthly' | 'quarterly' | 'annual';
  gracePeriodDays?: number; // 5 days default
  lastPaymentDate?: string;
  lastPaymentReceiptId?: string;
  isAutoSuspended?: boolean;
}

export interface SaasPaymentReceipt {
  id: string;
  tenantId: string;
  tenantName: string;
  adminEmail: string;
  adminName: string;
  adminPhone?: string;
  planId: string;
  planName: string;
  amount: number;
  amountPaid?: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  paymentMethod: 'zelle' | 'bank_transfer' | 'credit_card' | 'crypto_usdt' | 'other';
  referenceNumber?: string;
  receiptUrl: string; // Base64 or mock URL
  receiptImageUrl?: string;
  receiptFileName: string;
  receiptFileType: string; // 'image/png' | 'image/jpeg' | 'application/pdf' | string
  receiptFileSize?: string;
  notes?: string;
  submittedAt: string;
  createdAt?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  validFrom?: string;
  validUntil?: string;
  type: 'new_registration' | 'renewal' | 'plan_upgrade';
}

export interface SaasPlanFeatureLimit {
  id: string;
  name: string;
  price: number;
  annualPrice?: number;
  billingPeriod: string;
  popular?: boolean;
  description: string;
  maxUsers: number;
  maxClients: number;
  maxPolicies: number;
  maxWhatsAppLines: number;
  storageGb: number;
  features: string[];
  enabledModules: {
    aiAssistant: boolean;
    campaigns: boolean;
    telephonyPBX: boolean;
    massImport: boolean;
    customFields: boolean;
    webhooks: boolean;
    advancedAutomations: boolean;
  };
  status: 'active' | 'archived';
}

export interface SaasSmtpConfig {
  host: string;
  port: number;
  protocol: 'ssl' | 'tls' | 'smtp';
  senderEmail: string;
  senderName: string;
  appPassword: string;
  isConfigured: boolean;
  lastTestStatus?: 'success' | 'failed' | null;
  lastTestDate?: string;
}

export interface SaasEmailTemplateItem {
  id: string;
  name: string;
  subject: string;
  body: string;
  enabled: boolean;
  description: string;
  variables: string[];
}

export interface SaasNotificationTemplates {
  paymentPending: SaasEmailTemplateItem;
  accountApproved: SaasEmailTemplateItem;
  planExpiring: SaasEmailTemplateItem;
  renewalApproved: SaasEmailTemplateItem;
  adminNewPaymentAlert: SaasEmailTemplateItem;
}

export interface SaasWhatsAppCentralConfig {
  isConnected: boolean;
  connectedPhoneNumber?: string;
  qrCodeData?: string;
  lastConnectedAt?: string;
  adminPhone1: string;
  adminPhone2: string;
  adminName1?: string;
  adminName2?: string;
  notifyOnNewRegistration: boolean;
  notifyOnPaymentSubmitted: boolean;
  notifyOnPlanExpiring: boolean;
  messageLog?: Array<{
    id: string;
    to: string;
    recipientName: string;
    message: string;
    timestamp: string;
    type: 'new_registration' | 'payment_review' | 'account_activated' | 'plan_expired' | 'renewal';
    status: 'sent' | 'delivered' | 'read';
  }>;
}

export interface TenantBranding {
  id: string;
  name: string;
  legalName?: string;
  taxId?: string; // RIF, EIN, RUT
  logoUrl?: string;
  primaryColor: string; // Hex e.g. #7c3aed
  secondaryColor?: string;
  accentColor?: string;
  currency: string;
  language: string;
  timezone?: string;
  country?: string;
  city?: string;
  isActive?: boolean;
  paymentReceipts?: SaasPaymentReceipt[];
  categories?: string[];
  customFields?: CustomFieldDefinition[];
  customFieldDefinitions?: CustomFieldDefinition[];
  subscription?: TenantSubscription;
  landingConfig?: TenantLandingConfig;
  subdomain?: string;
  customDomain?: string;
  databaseIsolation?: {
    partitionKey: string;
    encryptionLevel: 'AES-256' | 'KMS-Dedicated';
    storageQuotaGb: number;
    maxClientsQuota: number;
    maxPoliciesQuota: number;
    status: 'Isolated' | 'Enforced' | 'Active';
    dedicatedWebhookUrl?: string;
  };
}

export interface CustomFieldDefinition {
  id: string;
  tenantId: string;
  entityType: 'client' | 'policy';
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'email' | 'phone';
  options?: string[]; // for select
  required: boolean;
  section: string; // e.g. "Datos Generales", "Información Médica", "Datos de Empleo"
  order: number;
}

export interface MasterCatalogs {
  carriers: string[]; // e.g. Florida Blue, Ambetter, Oscar, UnitedHealthcare, Aetna, Cigna, Mapfre
  plans: { [carrier: string]: string[] };
  healthPlans?: { [carrier: string]: string[] };
  leadSources: string[]; // e.g. Facebook Ads, Google Ads, Referido, WhatsApp Orgánico, Llamada Fría
  clientCategories: string[]; // e.g. VIP, Prospecto Calificado, Renovación 2026, Riesgo Alto, Regular
  documentTypes: string[]; // e.g. Cédula/ID, Pasaporte, Green Card, W-2/Taxes, Comprobante de Ingresos, Carta de Empleo
  banks: string[]; // e.g. Chase, Bank of America, Wells Fargo, Banesco, Mercantil, BBVA, Banco de Chile
  paymentMethods: string[]; // e.g. ACH / Débito Automático, Tarjeta de Crédito, Transferencia Zelle, Efectivo
}

// Dependent / Member entity inside a Policy
export interface PolicyMember {
  id: string;
  policyId?: string;
  firstName: string;
  lastName: string;
  relationship: 'Titular' | 'Cónyuge' | 'Hijo/a' | 'Hijo(a)' | 'Dependiente' | 'Padre/Madre' | string;
  birthDate: string; // YYYY-MM-DD
  gender: 'M' | 'F' | 'Otro' | 'Masculino' | 'Femenino' | string;
  idNumber?: string; // SSN or National ID
  tobaccoUser?: boolean;
  status: 'Activo' | 'Inactivo' | 'En Espera' | string;
}

export interface PolicyVersion {
  version: number;
  timestamp: string;
  changedBy: string;
  changesSummary: string;
  snapshot: Partial<Policy>;
}

export interface Policy {
  id: string;
  tenantId: string;
  clientId: string;
  clientName?: string;
  type: 'Salud/ACA' | 'Vida' | 'Complementario' | 'Dental/Visión' | 'Accidentes' | 'Gastos Médicos';
  carrier: string; // e.g. Florida Blue
  planName: string; // e.g. BlueCare Silver 1450
  policyNumber: string;
  effectiveDate: string; // YYYY-MM-DD
  expirationDate?: string;
  monthlyPremium: number; // Prima total $
  subsidyAptc?: number; // Subsidio APTC $
  clientPortion: number; // Prima que paga el cliente $
  paymentDueDay: number; // 1 to 31
  status: 'Activa' | 'En Proceso' | 'Pendiente de Pago' | 'Vencida' | 'Cancelada' | 'Renovada';
  agentId: string;
  members: PolicyMember[];
  customFields?: Record<string, any>;
  versionHistory: PolicyVersion[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  id: string;
  tenantId: string;
  clientId: string;
  clientName?: string;
  type?: 'bank_account' | 'credit_card'; // Payment method type: ACH Bank vs Card
  accountHolder: string;
  holderIdNumber?: string; // SSN, RUT, DNI
  bankName: string;
  routingNumber: string; // Routing / Código Banco
  accountNumber: string;
  accountType: 'Checking / Corriente' | 'Savings / Ahorros' | 'Tarjeta Débito/Crédito';
  paymentMethod: 'ACH Débito Automático' | 'Tarjeta de Crédito' | 'Tarjeta de Débito' | 'Transferencia' | 'Ventanilla';
  // Card specific fields
  cardBrand?: 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Otro';
  cardHolder?: string;
  cardNumber?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  cardExpDate?: string; // e.g. "08/28"
  cardCvv?: string;
  cardType?: 'Crédito' | 'Débito';
  
  isDefault: boolean;
  verified: boolean;
  updatedAt: string;
}

export interface ClientDocument {
  id: string;
  tenantId?: string;
  clientId: string;
  name: string;
  type: string; // Document type from catalog
  fileUrl?: string;
  previewUrl?: string;
  fileSize?: string;
  expirationDate?: string; // for alerts
  uploadedAt: string;
  status: 'Válido' | 'Por Vencer' | 'Vencido' | 'Pendiente de Revisión';
  verifiedBy?: string;
  description?: string;
}

export interface ClientNote {
  id: string;
  tenantId?: string;
  clientId: string;
  userId: string;
  userName: string;
  userRole?: string;
  userAvatar?: string;
  content: string;
  category: 'General' | 'Llamada' | 'Reunión' | 'Cobranza' | 'Reclamo' | 'WhatsApp';
  images?: string[]; // Base64 data URLs or image preview URLs attached to note
  createdAt: string;
}

export interface ClientActivity {
  id: string;
  tenantId?: string;
  clientId: string;
  type: 'call' | 'whatsapp' | 'email' | 'stage_change' | 'policy_added' | 'status_update' | 'note';
  title: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Client {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'M' | 'F' | 'Otro';
  idNumber?: string; // SSN, RUT, DNI
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  maritalStatus?: 'Soltero/a' | 'Casado/a' | 'Divorciado/a' | 'Viudo/a' | 'Unión Libre';
  category: string; // from catalog
  tags: string[];
  status: 'Lead' | 'Contactado' | 'Cotizado' | 'Cerrado/Ganado' | 'Cliente Activo' | 'Inactivo' | 'Perdido';
  assignedAgentId: string;
  pipelineId?: string;
  stageId?: string;
  dealValue?: number;
  leadSource?: string;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Pipeline & Stages
export interface PipelineStage {
  id: string;
  name: string;
  color: string; // Hex or tailwind color
  order: number;
  winProbability: number; // 0 - 100%
}

export interface Pipeline {
  id: string;
  tenantId: string;
  name: string;
  isDefault: boolean;
  stages: PipelineStage[];
}

// WhatsApp Integration Config & Models
export interface WhatsAppAlertRecipient {
  id: string;
  name: string;
  role: string;
  phone: string;
  isActive?: boolean;
  active?: boolean;
}

export interface WhatsAppAccountConfig {
  id: 'WA1' | 'WA2';
  name: string;
  phone: string;
  deviceType?: string;
  selectedPipelineId: string;
  defaultPipelineId?: string;
  qrConnected: boolean;
  qrStatus: 'connected' | 'ready_to_scan' | 'disconnected';
  qrGeneratedAt?: string;
  alertRecipients: WhatsAppAlertRecipient[];
  changeLog: { date: string; user: string; action?: string; change?: string; details?: string }[];
  autoReply?: boolean;
  roundRobinAgents?: boolean;
  webhookUrl?: string;
  apiKey?: string;
}

export interface WhatsAppConfig {
  tenantId: string;
  activeAccountTab?: 'WA1' | 'WA2';
  accounts?: {
    WA1: WhatsAppAccountConfig;
    WA2: WhatsAppAccountConfig;
  };
  selectedPipelineId: string;
  defaultPipelineId?: string;
  alertRecipients: WhatsAppAlertRecipient[];
  connectionType: 'cloud_api' | 'chatwoot' | 'qr_bridge';
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
  chatwootUrl?: string;
  chatwootApiKey?: string;
  chatwootAccountId?: string;
  qrConnected: boolean;
  connectedPhone?: string;
  webhookUrl?: string;
  changeLog?: { date: string; user: string; action?: string; change?: string; details?: string }[];
  changeLogs?: { date: string; user: string; action?: string; change?: string; details?: string }[];
}

export interface InstagramConfig {
  tenantId: string;
  instagramId?: string;
  accessToken?: string;
  verifyToken?: string;
  webhookUrl?: string;
  connectionType: 'meta_graph' | 'none';
  changeLog?: { date: string; user: string; action?: string; change?: string; details?: string }[];
  changeLogs?: { date: string; user: string; action?: string; change?: string; details?: string }[];
}

export interface FacebookConfig {
  tenantId: string;
  pageId?: string;
  accessToken?: string;
  verifyToken?: string;
  webhookUrl?: string;
  connectionType: 'meta_graph' | 'none';
  changeLog?: { date: string; user: string; action?: string; change?: string; details?: string }[];
  changeLogs?: { date: string; user: string; action?: string; change?: string; details?: string }[];
}

export interface WhatsAppMessageReaction {
  emoji: string;
  users: string[]; // User IDs or 'client'
  userNames?: string[];
}

export type ChannelSource = 'whatsapp' | 'instagram' | 'facebook' | 'landing';

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  sender: string;
  senderName?: string;
  senderId?: string;
  senderRole?: string;
  senderAvatar?: string;
  content: string;
  text?: string;
  mediaType?: 'text' | 'image' | 'audio' | 'video' | 'sticker' | 'gif' | 'document';
  mediaUrl?: string;
  mediaDuration?: number;
  mediaName?: string;
  mediaSize?: string;
  reactions?: WhatsAppMessageReaction[];
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: { name: string; url: string; type: string; size?: string }[];
  channelSource?: ChannelSource;
}

export interface WhatsAppConversation {
  id: string;
  tenantId: string;
  account?: 'WA1' | 'WA2';
  clientId?: string;
  contactName: string;
  clientName?: string;
  contactPhone: string;
  clientPhone?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  assignedAgentId?: string;
  messages: WhatsAppMessage[];
  channelSource?: ChannelSource;
}

// SMTP Email Config
export interface SmtpConfig {
  tenantId: string;
  protocol: 'smtp';
  host: string; // e.g. ssl://smtp.gmail.com
  port: number; // 465, 587
  senderEmail: string; // e.g. obamacare.support@gmail.com
  senderName: string; // e.g. Obamacare / Ateendia
  appPassword: string; // 16-char Google app password
  isConfigured: boolean;
  lastTestedAt?: string;
  testStatus?: 'success' | 'failed';
}

// Message Templates
export interface MessageTemplate {
  id: string;
  tenantId: string;
  name: string;
  channel: 'whatsapp' | 'email' | 'both';
  category: 'Cobranza' | 'Cumpleaños' | 'Renovación ACA' | 'Bienvenida' | 'Documento Requerido' | 'Confirmación de Cita' | 'General';
  subject?: string; // For email
  body: string;
  variables: string[]; // e.g. ['nombre', 'poliza', 'fecha_pago', 'prima', 'compania']
  createdAt: string;
}

// Internal Chat
export interface ChatChannel {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  isPrivate: boolean;
  memberUserIds: string[];
}

export interface ChatMessage {
  id: string;
  channelId?: string;
  channel?: string;
  recipientUserId?: string; // For direct message
  senderUserId: string;
  senderId?: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  text?: string;
  mediaType?: 'text' | 'image' | 'audio' | 'video' | 'sticker' | 'gif' | 'document';
  mediaUrl?: string;
  mediaDuration?: number;
  mediaName?: string;
  mediaSize?: string;
  timestamp: string;
  reactions?: { emoji: string; users: string[]; userNames?: string[] }[];
}

// Issabel Telephony Config & CDR
export interface IssabelConfig {
  tenantId: string;
  host: string; // e.g. 192.168.1.100 or pbx.midominio.com
  amiPort: number; // e.g. 5038
  amiUser: string;
  amiSecret: string;
  webrtcWssUrl?: string; // wss://pbx.midominio.com:8089/ws
  defaultContext: string; // from-internal
  isConnected: boolean;
}

export interface CallRecord {
  id: string;
  tenantId: string;
  clientId?: string;
  clientName?: string;
  agentId: string;
  agentName: string;
  agentExtension: string;
  extension?: string;
  destinationNumber: string;
  direction: 'outbound' | 'inbound';
  status: 'ANSWERED' | 'NO ANSWER' | 'BUSY' | 'FAILED';
  disposition?: string;
  durationSeconds: number;
  duration?: number;
  recordingUrl?: string;
  notes?: string;
  timestamp: string;
  startTime?: string;
}

// Campaigns & Reports
export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  channel: 'whatsapp' | 'email';
  templateId: string;
  targetSegment: {
    category?: string;
    policyStatus?: string;
    carrier?: string;
    upcomingBirthdays?: boolean;
    expiringPolicies?: boolean;
  };
  totalAudience: number;
  targetAudienceCount?: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  openedCount?: number;
  repliedCount: number;
  status: 'Borrador' | 'Programada' | 'En Ejecución' | 'Completada';
  scheduledDate?: string;
  createdAt: string;
}

// Audit Trail
export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'CALL' | 'SEND_MESSAGE' | 'STATUS_CHANGE';
  module: 'Clientes' | 'Pólizas' | 'Pipeline' | 'WhatsApp' | 'Email' | 'Bancos' | 'Telefonía' | 'Configuración' | 'Usuarios' | 'Campañas' | 'Integraciones';
  targetId?: string;
  targetName?: string;
  entityId?: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

// N8N Workflow Automation Config
export interface N8nTriggerEvent {
  id: string;
  name: string;
  event: string;
  description: string;
  enabled: boolean;
  samplePayload: Record<string, any>;
}

export interface N8nConfig {
  tenantId: string;
  instanceUrl?: string;
  apiToken?: string;
  webhookUrl: string;
  apiKey: string;
  isActive: boolean;
  isEnabled?: boolean;
  activeEvents?: string[];
  triggers: N8nTriggerEvent[];
  lastTriggeredAt?: string;
  lastResponseStatus?: number;
  logs: {
    id: string;
    event: string;
    timestamp: string;
    status: 'success' | 'error' | 'pending';
    payload: any;
    response?: string;
  }[];
  webhookLogs?: {
    id: string;
    event: string;
    timestamp: string;
    status: 'success' | 'error' | 'pending';
    payload: any;
    response?: string;
  }[];
}

// AI Integration & Vector Knowledge Base
export interface VectorDocChunk {
  id: string;
  docId?: string;
  title: string;
  category?: string;
  content: string;
  tokens?: number;
  tokenCount?: number;
  similarity?: number;
  embeddingDimension?: number;
  status?: string;
  updatedAt?: string;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'csv' | 'json';
  size: string;
  uploadedAt: string;
  chunksCount: number;
  vectorDimensions: number;
  status: 'vectorized' | 'processing' | 'error';
  summary: string;
  tags: string[];
}

export interface AiIntegrationConfig {
  tenantId: string;
  provider: 'openrouter' | 'gemini' | 'openai' | 'anthropic' | 'claude' | 'deepseek' | 'custom';
  apiKey: string;
  customBaseUrl?: string;
  model: string;
  modelName?: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  ragEnabled: boolean;
  ragTopK: number;
  confidenceThreshold?: number;
  autoResponderChannels?: ('whatsapp' | 'instagram' | 'facebook' | 'web')[];
  knowledgeBase?: VectorDocChunk[];
  autoResponder: {
    enabled: boolean;
    whatsapp: boolean;
    instagram: boolean;
    facebook: boolean;
    confidenceThreshold: number; // 0 - 100%
    handoffOnNegativeSentiment: boolean;
    businessHoursOnly: boolean;
  };
  knowledgeDocuments: KnowledgeDocument[];
}

// Scheduled Messaging & Automations with Anti-Spam Safety
export interface ScheduledRule {
  id: string;
  tenantId?: string;
  name: string;
  triggerType: 'birthday' | 'doc_expiry' | 'document_expiry' | 'payment_due' | 'pipeline_inactivity';
  channel: 'whatsapp' | 'email' | 'both';
  enabled?: boolean;
  isEnabled?: boolean;
  scheduledTime: string; // e.g. "09:00"
  daysBefore?: number;
  daysOffset?: number;
  templateId: string;
  customMessage?: string;
  targetCount?: number;
  sentCountToday?: number;
  totalExecuted?: number;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface AntiSpamSettings {
  whatsappDailyLimit?: number;
  maxDailyWhatsApp?: number;
  whatsappSentToday?: number;
  emailDailyLimit?: number;
  maxDailyEmail?: number;
  emailSentToday?: number;
  minIntervalSeconds?: number;
  maxIntervalSeconds?: number;
  randomizeDelay?: boolean;
  randomJitter?: boolean;
  alertOnSpamRisk?: boolean;
  autoPauseOnHighFailureRate?: boolean;
  lastResetDate?: string;
}

// System Alerts
export interface SystemAlert {
  id: string;
  type: 'birthday_today' | 'birthday_week' | 'expiring_document' | 'upcoming_payment' | 'lead_stale';
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  policyId?: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
}

// Real-Time App Notifications (WhatsApp Messages, Policy Status Changes, Web Leads, etc.)
export interface AppNotification {
  id: string;
  tenantId: string;
  type: 'web_lead' | 'whatsapp_message' | 'policy_status_change' | 'policy_created' | 'client_registered' | 'document_expired' | 'payment_due' | 'deal_won' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  metadata?: {
    conversationId?: string;
    clientPhone?: string;
    clientName?: string;
    clientId?: string;
    policyId?: string;
    policyNumber?: string;
    carrier?: string;
    oldStatus?: string;
    newStatus?: string;
    account?: 'WA1' | 'WA2';
    service?: string;
    state?: string;
    estimatedIncome?: number;
    householdSize?: number;
    leadNotes?: string;
    leadSource?: string;
    stageId?: string;
    receiptId?: string;
    tenantId?: string;
    amount?: number;
    dealValue?: number;
    plan?: string;
  };
}

// SaaS Central & Delegated Admin Permissions
export interface SaasDelegatedAdminPermissions {
  viewGlobalMetrics: boolean;
  viewTenantsList: boolean;
  createTenant: boolean;
  editTenantSettings: boolean;
  suspendTenant: boolean;
  viewSensitiveClientData: boolean;
  manageSaasAdmins: boolean;
  manageSaasLanding: boolean;
  exportGlobalReports: boolean;
}

export interface SaasDelegatedAdmin {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'super_admin' | 'saas_auditor' | 'support_manager' | 'custom_delegated';
  status: 'active' | 'inactive';
  createdAt: string;
  allowedTenantIds: string[]; // empty or ['*'] means all tenants
  permissions: SaasDelegatedAdminPermissions;
}

// SaaS Central Public Landing Page Configuration
export interface SaasLandingFeature {
  icon: string;
  title: string;
  description: string;
  tag?: string;
}

export interface SaasLandingPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  popular?: boolean;
  description: string;
  features: string[];
}

export interface SaasLandingTestimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  quote: string;
  rating: number;
}

export interface SaasLandingConfig {
  crmName: string;
  logoUrl?: string;
  logoIconText?: string;
  faviconUrl?: string;
  publicUrl: string;
  primaryColor: string;
  accentColor?: string;
  heroBadge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  ctaPrimaryText: string;
  ctaPrimaryUrl?: string;
  ctaSecondaryText: string;
  ctaSecondaryUrl?: string;
  demoVideoUrl?: string;
  headerNavItems?: { label: string; href: string }[];
  features: SaasLandingFeature[];
  pricingPlans: SaasLandingPlan[];
  testimonials: SaasLandingTestimonial[];
  complianceNotice?: string;
  copyrightText?: string;
  companyAddress?: string;
  companyLegalName?: string;
  supportEmail?: string;
  domainName?: string;
  contactEmail: string;
  contactPhone: string;
  isPublished: boolean;
  customSlug?: string;
}

// SaaS Database & VPS Deployment Configuration Types
export type SaasDatabaseEngine = 'local' | 'pocketbase' | 'supabase' | 'firebase' | 'mongodb' | 'postgresql';

export interface SaasDatabasePocketbaseConfig {
  url?: string;
  apiUrl?: string;
  adminEmail?: string;
  adminPassword?: string;
  autoCreateCollections?: boolean;
}

export interface SaasDatabaseSupabaseConfig {
  projectUrl: string;
  anonPublicKey?: string;
  serviceRoleKey?: string;
  dbPassword?: string;
  schema?: string;
}

export interface SaasDatabaseFirebaseConfig {
  projectId: string;
  apiKey?: string;
  authDomain?: string;
  storageBucket?: string;
}

export interface SaasDatabaseMongoConfig {
  connectionUri: string;
  databaseName?: string;
  authDatabase?: string;
}

export interface SaasDatabasePostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl: boolean;
}

export interface SaasDatabaseConfig {
  provider?: SaasDatabaseEngine;
  engine?: SaasDatabaseEngine;
  status?: 'connected' | 'disconnected' | 'error' | 'syncing';
  pocketbase?: SaasDatabasePocketbaseConfig;
  supabase?: SaasDatabaseSupabaseConfig;
  firebase?: SaasDatabaseFirebaseConfig;
  mongodb?: SaasDatabaseMongoConfig;
  postgresql?: SaasDatabasePostgresConfig;
  instanceUrl?: string; // PocketBase / Supabase URL
  host?: string; // PostgreSQL / MongoDB host
  port?: number;
  databaseName?: string;
  username?: string;
  password?: string;
  apiKey?: string; // Supabase Anon Key / PocketBase token
  serviceRoleKey?: string; // Supabase Service Role Key
  projectId?: string; // Firebase Project ID
  clientEmail?: string; // Firebase Client Email
  privateKey?: string; // Firebase Private Key
  connectionString?: string; // MongoDB URI / Postgres URI
  sslMode?: 'disable' | 'require' | 'verify-full' | 'prefer';
  autoSync?: boolean;
  isConnected?: boolean;
  latencyMs?: number;
  lastTestedAt?: string;
  lastSyncAt?: string;
  lastSync?: string;
  tablesCount?: number;
}

export interface ContaboVpsConfig {
  clientId?: string;
  apiToken?: string;
  dataCenterRegion?: 'EU' | 'US-central' | 'US-east' | 'US-west' | 'SIN' | 'UK' | 'AUS';
  instanceType?: 'VPS S' | 'VPS M' | 'VPS L' | 'VPS XL' | 'VDS S' | 'VDS M';
  cloudInitEnabled?: boolean;
}

export interface OvhCloudVpsConfig {
  applicationKey?: string;
  applicationSecret?: string;
  consumerKey?: string;
  projectId?: string;
  region?: 'GRA' | 'SBG' | 'BHS' | 'WAW' | 'FRA' | 'UK' | 'VIN';
  vpsModel?: 'Value' | 'Essential' | 'Comfort' | 'Elite';
  antiDdosMode?: 'standard' | 'advanced' | 'game';
}

export interface SaasVpsDeploymentConfig {
  provider?: 'hetzner' | 'contabo' | 'ovh' | 'digitalocean' | 'aws' | 'linode' | 'hostinger' | 'vultr' | 'ubuntu' | 'debian' | 'docker' | 'coolify' | 'caprover' | 'custom';
  serverIp: string;
  sshPort: number;
  sshUser: string;
  sshKeyName?: string;
  deployPath?: string;
  primaryDomain: string; // e.g. "ateendia-crm.cloud"
  wildcardDomain?: string; // e.g. "*.ateendia-crm.cloud"
  domain?: string;
  certbotEmail: string;
  appPort: number;
  nodeEnv: 'production' | 'staging' | 'development';
  useDocker?: boolean;
  useNginx?: boolean;
  useCertbotSsl?: boolean;
  sslEnabled?: boolean;
  nginxConfigured?: boolean;
  jwtSecret?: string;
  encryptionKey?: string;
  backupSchedule?: 'hourly' | 'daily' | 'weekly';
  backupRetentionDays?: number;
  contabo?: ContaboVpsConfig;
  ovh?: OvhCloudVpsConfig;
  hetzner?: { apiToken?: string; location?: string; serverType?: string };
  digitalocean?: { apiToken?: string; region?: string; size?: string };
  aws?: { accessKeyId?: string; secretAccessKey?: string; region?: string };
}

// Tenant Informative Micro-Landing Page Configuration
export interface TenantLandingTestimonial {
  name: string;
  city: string;
  text: string;
  rating: number;
  policyType?: string;
}

export interface TenantLandingConfig {
  tenantId: string;
  isEnabled: boolean;
  agencyName: string;
  logoUrl?: string;
  faviconUrl?: string;
  tagline: string;
  heroHeadline?: string;
  heroSubtitle?: string;
  heroImage?: string;
  bannerGradient?: string;
  badgeText?: string;
  aboutTitle?: string;
  aboutText: string;
  whatsappDirectNumber: string;
  whatsappWelcomeMsg?: string;
  callDirectNumber: string;
  contactEmail?: string;
  officeAddress: string;
  officeHours: string;
  carriersOffered: string[];
  servicesOffered: string[]; // Coberturas ofrecidas por cada empresa
  testimonials?: TenantLandingTestimonial[];
  quoteFormEnabled: boolean;
  quoteFormTitle?: string;
  quoteFormSubtitle?: string;
  assignedAgentId?: string;
  leadCapturePipelineId?: string;
  leadCaptureStageId?: string;
  defaultLeadSource?: string;
  slug: string;
  customDomain?: string;
  themeColor?: string;
  secondaryColor?: string;
  socialLinks?: { platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'twitter'; url: string }[];
}


