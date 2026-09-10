// Initial demo datasets for multi-tenant simulation
import {
  TenantBranding,
  User,
  Client,
  Policy,
  BankAccount,
  ClientDocument,
  ClientNote,
  ClientActivity,
  Pipeline,
  WhatsAppConfig,
  WhatsAppConversation,
  SmtpConfig,
  MessageTemplate,
  ChatChannel,
  ChatMessage,
  IssabelConfig,
  CallRecord,
  Campaign,
  AuditLogEntry,
  CustomFieldDefinition,
  MasterCatalogs,
  PermissionMatrix,
  N8nConfig,
  AiIntegrationConfig,
  ScheduledRule,
  AntiSpamSettings,
  AppNotification,
  SaasDelegatedAdmin,
  SaasLandingConfig,
  TenantLandingConfig,
  TenantSubscription
} from '../types';

export const DEFAULT_PERMISSIONS: Record<string, PermissionMatrix> = {
  admin: {
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
  supervisor: {
    clients: { view: true, create: true, edit: true, delete: false, export: true },
    policies: { view: true, create: true, edit: true, delete: false },
    pipeline: { view: true, edit: true, moveCards: true, manageStages: true },
    whatsapp: { view: true, send: true, configure: false },
    email: { view: true, send: true, configure: false },
    campaigns: { view: true, create: true, execute: true },
    reports: { view: true, export: true },
    banking: { view: true, edit: true, viewSensitive: false },
    telephony: { view: true, call: true, viewCdr: true, configure: false },
    branding: { view: true, edit: false },
    users: { view: true, invite: true, editRoles: false },
    audit: { view: true },
    integrations: { view: true, configure: false },
  },
  agent: {
    clients: { view: true, create: true, edit: true, delete: false, export: false },
    policies: { view: true, create: true, edit: true, delete: false },
    pipeline: { view: true, edit: false, moveCards: true, manageStages: false },
    whatsapp: { view: true, send: true, configure: false },
    email: { view: true, send: true, configure: false },
    campaigns: { view: false, create: false, execute: false },
    reports: { view: false, export: false },
    banking: { view: true, edit: true, viewSensitive: false },
    telephony: { view: true, call: true, viewCdr: true, configure: false },
    branding: { view: false, edit: false },
    users: { view: false, invite: false, editRoles: false },
    audit: { view: false },
    integrations: { view: true, configure: false },
  },
  readonly: {
    clients: { view: true, create: false, edit: false, delete: false, export: false },
    policies: { view: true, create: false, edit: false, delete: false },
    pipeline: { view: true, edit: false, moveCards: false, manageStages: false },
    whatsapp: { view: true, send: false, configure: false },
    email: { view: true, send: false, configure: false },
    campaigns: { view: true, create: false, execute: false },
    reports: { view: true, export: false },
    banking: { view: false, edit: false, viewSensitive: false },
    telephony: { view: false, call: false, viewCdr: true, configure: false },
    branding: { view: false, edit: false },
    users: { view: false, invite: false, editRoles: false },
    audit: { view: false },
    integrations: { view: true, configure: false },
  }
};

export const INITIAL_TENANTS: TenantBranding[] = [
  {
    id: 'tenant-ateendia',
    name: 'Ateendia Seguros',
    legalName: 'Ateendia Health & Financial Services LLC',
    taxId: 'EIN-84-9382103',
    logoUrl: '',
    primaryColor: '#7c3aed', // Purple / Indigo
    secondaryColor: '#10b981', // Emerald green
    accentColor: '#f59e0b', // Amber
    currency: 'USD',
    language: 'es',
    subscription: {
      plan: 'Enterprise',
      status: 'active',
      monthlyPrice: 299,
      renewalDate: '2026-09-30',
      userQuota: 25,
      whatsappLinesQuota: 5,
      storageGb: 100,
      contactEmail: 'admin@ateendia.com'
    },
    landingConfig: {
      tenantId: 'tenant-ateendia',
      isEnabled: true,
      agencyName: 'Ateendia Health & Financial Services',
      tagline: 'Asesoría experta en Planes de Salud ACA, Vida y Finanzas Familiares.',
      heroImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80',
      aboutText: 'Somos una agencia líder de corretaje de seguros en el estado de Florida y Texas con más de 8 años de experiencia garantizando cobertura médica de calidad al menor costo.',
      whatsappDirectNumber: '+1 (786) 450-2819',
      callDirectNumber: '+1 (800) 555-0199',
      officeAddress: '8300 NW 33rd St, Suite 400, Doral, FL 33122',
      officeHours: 'Lunes a Viernes: 8:30 AM - 6:30 PM | Sábados: 9:00 AM - 2:00 PM',
      carriersOffered: ['Florida Blue', 'Ambetter', 'Oscar Health', 'UnitedHealthcare', 'Aetna', 'Cigna'],
      servicesOffered: ['Inscripción y Renovación ACA / Obamacare', 'Seguros de Vida con Beneficios en Vida', 'Planes Dentales y Visión', 'Pólizas Suplementarias contra Accidentes'],
      quoteFormEnabled: true,
      assignedAgentId: 'usr-1',
      leadCapturePipelineId: 'pipe-1',
      slug: 'ateendia',
      themeColor: '#7c3aed'
    }
  },
  {
    id: 'tenant-optima',
    name: 'Optima Health Brokers',
    legalName: 'Optima Insurance Group Corp',
    taxId: 'EIN-72-1094852',
    logoUrl: '',
    primaryColor: '#2563eb', // Blue
    secondaryColor: '#059669', // Green
    accentColor: '#d97706',
    currency: 'USD',
    language: 'es',
    subscription: {
      plan: 'Pro Business',
      status: 'active',
      monthlyPrice: 149,
      renewalDate: '2026-09-15',
      userQuota: 10,
      whatsappLinesQuota: 2,
      storageGb: 50,
      contactEmail: 'contact@optimabrokers.com'
    },
    landingConfig: {
      tenantId: 'tenant-optima',
      isEnabled: true,
      agencyName: 'Optima Health Brokers',
      tagline: 'Tu bienestar y el de tu familia protegido con las mejores aseguradoras.',
      heroImage: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&auto=format&fit=crop&q=80',
      aboutText: 'Especialistas en planes de salud accesibles con subsidios del gobierno y cobertura preventiva 100% libre de copagos.',
      whatsappDirectNumber: '+1 (305) 555-0188',
      callDirectNumber: '+1 (888) 421-9988',
      officeAddress: '1200 Brickell Ave, Suite 900, Miami, FL 33131',
      officeHours: 'Lunes a Viernes: 9:00 AM - 6:00 PM',
      carriersOffered: ['Florida Blue', 'Molina Healthcare', 'Oscar Health', 'Ambetter'],
      servicesOffered: ['Obamacare 2026', 'Seguros para Pequeñas Empresas', 'Gastos Médicos Mayores'],
      quoteFormEnabled: true,
      assignedAgentId: 'usr-optima-1',
      leadCapturePipelineId: 'pipe-optima-1',
      slug: 'optima',
      themeColor: '#2563eb'
    }
  },
  {
    id: 'tenant-sol',
    name: 'Seguros Sol Naciente',
    legalName: 'Sol Naciente Financial & Insurance Inc',
    taxId: 'EIN-65-8819204',
    logoUrl: '',
    primaryColor: '#059669', // Emerald
    secondaryColor: '#0284c7',
    accentColor: '#eab308',
    currency: 'USD',
    language: 'es',
    subscription: {
      plan: 'Starter',
      status: 'active',
      monthlyPrice: 79,
      renewalDate: '2026-09-22',
      userQuota: 5,
      whatsappLinesQuota: 1,
      storageGb: 20,
      contactEmail: 'info@solnacienteseguros.com'
    },
    landingConfig: {
      tenantId: 'tenant-sol',
      isEnabled: true,
      agencyName: 'Seguros Sol Naciente',
      tagline: 'Protección integral y calidez humana para la comunidad hispana.',
      heroImage: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&auto=format&fit=crop&q=80',
      aboutText: 'Brindamos asesoría en español para que aproveches al máximo los beneficios de salud disponibles en tu condado.',
      whatsappDirectNumber: '+1 (407) 555-0144',
      callDirectNumber: '+1 (800) 765-4321',
      officeAddress: '5401 S Kirkman Rd, Suite 310, Orlando, FL 32819',
      officeHours: 'Lunes a Viernes: 9:00 AM - 5:30 PM',
      carriersOffered: ['Florida Blue', 'UnitedHealthcare', 'Ambetter'],
      servicesOffered: ['Salud Familiar', 'Vida y Ahorro', 'Medicare'],
      quoteFormEnabled: true,
      assignedAgentId: 'usr-sol-1',
      leadCapturePipelineId: 'pipe-sol-1',
      slug: 'solnaciente',
      themeColor: '#059669'
    }
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    tenantId: 'tenant-ateendia',
    name: 'Víctor Aray (Admin)',
    email: 'victoraray8@gmail.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (786) 450-2819',
    extension: '101',
    status: 'active',
    lastLogin: '2026-08-29 15:45',
    commissionRate: 15,
    twoFactorEnabled: true
  },
  {
    id: 'usr-2',
    tenantId: 'tenant-ateendia',
    name: 'Carolina Méndez',
    email: 'carolina.mendez@ateendia.com',
    role: 'supervisor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (305) 912-4433',
    extension: '102',
    status: 'active',
    lastLogin: '2026-08-29 14:10',
    commissionRate: 12,
    twoFactorEnabled: false
  },
  {
    id: 'usr-3',
    tenantId: 'tenant-ateendia',
    name: 'Alejandro Ramos',
    email: 'alejandro.ramos@ateendia.com',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (786) 322-9011',
    extension: '103',
    status: 'active',
    lastLogin: '2026-08-29 11:20',
    commissionRate: 10,
    twoFactorEnabled: false
  },
  {
    id: 'usr-4',
    tenantId: 'tenant-ateendia',
    name: 'Valeria Gómez',
    email: 'valeria.gomez@ateendia.com',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (407) 871-3329',
    extension: '104',
    status: 'active',
    lastLogin: '2026-08-28 17:30',
    commissionRate: 10,
    twoFactorEnabled: false
  },
  {
    id: 'usr-optima-1',
    tenantId: 'tenant-optima',
    name: 'Andrés Bello (Admin)',
    email: 'andres@optimabrokers.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (305) 555-0188',
    extension: '201',
    status: 'active',
    lastLogin: '2026-08-29 16:10',
    commissionRate: 15,
    twoFactorEnabled: true
  },
  {
    id: 'usr-optima-2',
    tenantId: 'tenant-optima',
    name: 'Sofía Carvajal',
    email: 'sofia@optimabrokers.com',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (305) 555-0199',
    extension: '202',
    status: 'active',
    lastLogin: '2026-08-29 12:00',
    commissionRate: 10,
    twoFactorEnabled: false
  },
  {
    id: 'usr-sol-1',
    tenantId: 'tenant-sol',
    name: 'Gabriel Solano (Admin)',
    email: 'gabriel@solnacienteseguros.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (407) 555-0144',
    extension: '301',
    status: 'active',
    lastLogin: '2026-08-29 15:00',
    commissionRate: 15,
    twoFactorEnabled: true
  },
  {
    id: 'usr-sol-2',
    tenantId: 'tenant-sol',
    name: 'Mariana Cruz',
    email: 'mariana@solnacienteseguros.com',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (407) 555-0145',
    extension: '302',
    status: 'active',
    lastLogin: '2026-08-28 16:45',
    commissionRate: 10,
    twoFactorEnabled: false
  }
];

export const INITIAL_CATALOGS: MasterCatalogs = {
  carriers: [
    'Florida Blue',
    'Ambetter Health',
    'Oscar Health',
    'UnitedHealthcare',
    'Aetna / CVS Health',
    'Cigna Healthcare',
    'Humana',
    'Molina Healthcare',
    'National General',
    'MetLife'
  ],
  plans: {
    'Florida Blue': ['BlueCare Silver 1450', 'BlueOptions Gold 1400', 'BlueSelect Bronze 8550', 'myBlue HMO Essential'],
    'Ambetter Health': ['Ambetter Clear Silver', 'Ambetter Balanced Care 11', 'Ambetter Everyday Bronze', 'Ambetter Secure Care 5'],
    'Oscar Health': ['Oscar Classic Silver', 'Oscar Simple Bronze', 'Oscar Elite Gold'],
    'UnitedHealthcare': ['UHC Silver Advantage', 'UHC Gold Choice', 'UHC Bronze Essential'],
    'Aetna / CVS Health': ['Aetna Silver S02', 'Aetna Gold G01', 'Aetna Bronze B04'],
    'Cigna Healthcare': ['Cigna Connect Silver 3000', 'Cigna Total Gold', 'Cigna Simple Bronze']
  },
  leadSources: [
    'Micro-Landing Web',
    'WhatsApp (Línea 1 - Ventas)',
    'WhatsApp (Línea 2 - Asesoría)',
    'WhatsApp Entrante',
    'Facebook Ads',
    'Google Ads / Search',
    'Referido por Cliente',
    'Llamada Inbound Issabel',
    'Base de Datos Importada',
    'Evento Comunitario'
  ],
  clientCategories: [
    'VIP / Alto Valor',
    'Renovación ACA 2026',
    'Prospecto Calificado',
    'Póliza Vida Activa',
    'Complementario Dental',
    'Riesgo de Cancelación',
    'Regular'
  ],
  documentTypes: [
    'Cédula / Documento de Identidad',
    'Pasaporte Vigente',
    'Green Card / Residencia',
    'Formulario W-2 / Taxes',
    'Comprobante de Ingresos (Paystub)',
    'Carta de Empleo',
    'Consentimiento Escrito / Firma',
    'Comprobante de Domicilio'
  ],
  banks: [
    'JPMorgan Chase Bank',
    'Bank of America',
    'Wells Fargo',
    'Citibank',
    'Capital One',
    'TD Bank',
    'PNC Bank',
    'Banesco USA',
    'Mercantil Bank'
  ],
  paymentMethods: [
    'ACH Débito Automático',
    'Tarjeta de Crédito / Débito',
    'Transferencia Bancaria',
    'Pago en Portal de Aseguradora'
  ]
};

export const INITIAL_PIPELINES: Pipeline[] = [
  {
    id: 'pipe-1',
    tenantId: 'tenant-ateendia',
    name: 'Inscripciones ACA & Salud 2026',
    isDefault: true,
    stages: [
      { id: 'stg-1', name: 'Nuevo Lead', color: '#6366f1', order: 1, winProbability: 15 },
      { id: 'stg-2', name: 'Contactado', color: '#3b82f6', order: 2, winProbability: 35 },
      { id: 'stg-3', name: 'Cotización Enviada', color: '#8b5cf6', order: 3, winProbability: 60 },
      { id: 'stg-4', name: 'Docs Recibidos', color: '#f59e0b', order: 4, winProbability: 80 },
      { id: 'stg-5', name: 'Póliza Emitida / Ganado', color: '#10b981', order: 5, winProbability: 100 },
      { id: 'stg-6', name: 'Perdido / Descartado', color: '#ef4444', order: 6, winProbability: 0 }
    ]
  },
  {
    id: 'pipe-2',
    tenantId: 'tenant-ateendia',
    name: 'Seguros de Vida & Retiro',
    isDefault: false,
    stages: [
      { id: 'stg-21', name: 'Lead Calificado', color: '#6366f1', order: 1, winProbability: 20 },
      { id: 'stg-22', name: 'Evaluación Médica', color: '#3b82f6', order: 2, winProbability: 50 },
      { id: 'stg-23', name: 'Propuesta Presentada', color: '#f59e0b', order: 3, winProbability: 75 },
      { id: 'stg-24', name: 'Aprobado por Underwriting', color: '#10b981', order: 4, winProbability: 100 }
    ]
  },
  {
    id: 'pipe-optima-1',
    tenantId: 'tenant-optima',
    name: 'Ventas ACA & Salud Optima',
    isDefault: true,
    stages: [
      { id: 'stg-opt-1', name: 'Lead Entrante Web/WA', color: '#3b82f6', order: 1, winProbability: 20 },
      { id: 'stg-opt-2', name: 'En Cotización', color: '#8b5cf6', order: 2, winProbability: 50 },
      { id: 'stg-opt-3', name: 'Póliza Aprobada', color: '#10b981', order: 3, winProbability: 100 }
    ]
  },
  {
    id: 'pipe-sol-1',
    tenantId: 'tenant-sol',
    name: 'Embudo Medicare & ACA Sol',
    isDefault: true,
    stages: [
      { id: 'stg-sol-1', name: 'Nuevo Contacto', color: '#059669', order: 1, winProbability: 20 },
      { id: 'stg-sol-2', name: 'Asesoría Agendada', color: '#0ea5e9', order: 2, winProbability: 60 },
      { id: 'stg-sol-3', name: 'Inscripción Completada', color: '#10b981', order: 3, winProbability: 100 }
    ]
  }
];

export const INITIAL_CUSTOM_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'cf-1',
    tenantId: 'tenant-ateendia',
    entityType: 'client',
    name: 'annualIncome',
    label: 'Ingreso Anual Estimado ($)',
    type: 'number',
    required: true,
    section: 'Datos Financieros & ACA',
    order: 1
  },
  {
    id: 'cf-2',
    tenantId: 'tenant-ateendia',
    entityType: 'client',
    name: 'householdSize',
    label: 'Tamaño del Núcleo Familiar (Taxes)',
    type: 'number',
    required: true,
    section: 'Datos Financieros & ACA',
    order: 2
  },
  {
    id: 'cf-3',
    tenantId: 'tenant-ateendia',
    entityType: 'client',
    name: 'immigrationStatus',
    label: 'Estatus Migratorio',
    type: 'select',
    options: ['Ciudadano', 'Residente Permanente (Green Card)', 'Permiso de Trabajo / TPS', 'Asilo Pendiente', 'Visa de Trabajo'],
    required: false,
    section: 'Documentación Legal',
    order: 3
  },
  {
    id: 'cf-4',
    tenantId: 'tenant-ateendia',
    entityType: 'policy',
    name: 'portalConfirmationCode',
    label: 'Código de Confirmación Marketplace',
    type: 'text',
    required: false,
    section: 'Detalles de Emisión',
    order: 1
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    tenantId: 'tenant-ateendia',
    firstName: 'Carlos Eduardo',
    lastName: 'Hernández Morales',
    email: 'carlos.hernandez@gmail.com',
    phone: '+1 (786) 554-1928',
    secondaryPhone: '+1 (786) 332-1100',
    birthDate: '1988-08-29', // Birthday today!
    gender: 'M',
    idNumber: 'SSN-***-**-8491',
    address: {
      street: '8420 NW 56th St Apt 304',
      city: 'Doral',
      state: 'FL',
      zipCode: '33166',
      country: 'Estados Unidos'
    },
    maritalStatus: 'Casado/a',
    category: 'VIP / Alto Valor',
    tags: ['ACA 2026', 'Familia 4', 'Florida Blue'],
    status: 'Cliente Activo',
    assignedAgentId: 'usr-1',
    pipelineId: 'pipe-1',
    stageId: 'stg-5',
    dealValue: 1450,
    leadSource: 'WhatsApp Entrante',
    customFields: {
      annualIncome: 38500,
      householdSize: 4,
      immigrationStatus: 'Residente Permanente (Green Card)'
    },
    createdAt: '2026-01-15 10:20',
    updatedAt: '2026-08-29 09:15'
  },
  {
    id: 'cli-2',
    tenantId: 'tenant-ateendia',
    firstName: 'Mariana Isabel',
    lastName: 'Suárez Colmenares',
    email: 'mariana.suarez@outlook.com',
    phone: '+1 (305) 749-8821',
    birthDate: '1994-08-31', // Birthday this week!
    gender: 'F',
    idNumber: 'SSN-***-**-3912',
    address: {
      street: '1040 Biscayne Blvd #1208',
      city: 'Miami',
      state: 'FL',
      zipCode: '33132',
      country: 'Estados Unidos'
    },
    maritalStatus: 'Soltero/a',
    category: 'Renovación ACA 2026',
    tags: ['Ambetter', 'Odontología'],
    status: 'Cliente Activo',
    assignedAgentId: 'usr-3',
    pipelineId: 'pipe-1',
    stageId: 'stg-5',
    dealValue: 380,
    leadSource: 'Facebook Ads',
    customFields: {
      annualIncome: 27000,
      householdSize: 1,
      immigrationStatus: 'Permiso de Trabajo / TPS'
    },
    createdAt: '2026-02-10 14:00',
    updatedAt: '2026-08-28 16:40'
  },
  {
    id: 'cli-3',
    tenantId: 'tenant-ateendia',
    firstName: 'Roberto',
    lastName: 'García Peña',
    email: 'roberto.garcia.p@gmail.com',
    phone: '+1 (407) 621-9944',
    birthDate: '1979-11-14',
    gender: 'M',
    idNumber: 'SSN-***-**-6021',
    address: {
      street: '4901 S Orange Blossom Trail',
      city: 'Orlando',
      state: 'FL',
      zipCode: '32839',
      country: 'Estados Unidos'
    },
    maritalStatus: 'Casado/a',
    category: 'Prospecto Calificado',
    tags: ['Salud + Vida', 'UHC'],
    status: 'Cotizado',
    assignedAgentId: 'usr-2',
    pipelineId: 'pipe-1',
    stageId: 'stg-3',
    dealValue: 920,
    leadSource: 'Referido por Cliente',
    customFields: {
      annualIncome: 42000,
      householdSize: 3,
      immigrationStatus: 'Ciudadano'
    },
    createdAt: '2026-08-20 11:30',
    updatedAt: '2026-08-29 11:00'
  },
  {
    id: 'cli-4',
    tenantId: 'tenant-ateendia',
    firstName: 'Gabriela',
    lastName: 'Pérez Silva',
    email: 'gaby.perez@yahoo.com',
    phone: '+1 (786) 902-1144',
    birthDate: '1996-03-22',
    gender: 'F',
    idNumber: 'SSN-***-**-1194',
    address: {
      street: '7230 SW 40th St',
      city: 'Miami',
      state: 'FL',
      zipCode: '33155',
      country: 'Estados Unidos'
    },
    maritalStatus: 'Soltero/a',
    category: 'Riesgo de Cancelación',
    tags: ['Oscar Health', 'Pago Pendiente'],
    status: 'Cliente Activo',
    assignedAgentId: 'usr-4',
    pipelineId: 'pipe-1',
    stageId: 'stg-4',
    dealValue: 410,
    leadSource: 'Google Ads / Search',
    customFields: {
      annualIncome: 24500,
      householdSize: 1,
      immigrationStatus: 'Permiso de Trabajo / TPS'
    },
    createdAt: '2026-03-01 09:00',
    updatedAt: '2026-08-29 12:15'
  },
  {
    id: 'cli-5',
    tenantId: 'tenant-ateendia',
    firstName: 'Andrés',
    lastName: 'Mendoza Castillo',
    email: 'andres.mendoza@gmail.com',
    phone: '+1 (813) 441-2099',
    birthDate: '1983-09-02', // Birthday this week!
    gender: 'M',
    idNumber: 'SSN-***-**-7711',
    address: {
      street: '1504 E Fowler Ave',
      city: 'Tampa',
      state: 'FL',
      zipCode: '33612',
      country: 'Estados Unidos'
    },
    maritalStatus: 'Casado/a',
    category: 'Póliza Vida Activa',
    tags: ['Vida Indexada IUL', 'MetLife'],
    status: 'Cerrado/Ganado',
    assignedAgentId: 'usr-1',
    pipelineId: 'pipe-2',
    stageId: 'stg-24',
    dealValue: 2500,
    leadSource: 'Llamada Inbound Issabel',
    customFields: {
      annualIncome: 85000,
      householdSize: 2,
      immigrationStatus: 'Ciudadano'
    },
    createdAt: '2026-04-18 16:30',
    updatedAt: '2026-08-27 10:00'
  },
  {
    id: 'cli-opt-1',
    tenantId: 'tenant-optima',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    email: 'carlos.mendoza@optima-client.com',
    phone: '+1 (305) 980-3321',
    birthDate: '1985-06-15',
    gender: 'M',
    idNumber: 'SSN-***-**-5521',
    address: {
      street: '1200 Brickell Ave',
      city: 'Miami',
      state: 'FL',
      zipCode: '33131',
      country: 'Estados Unidos'
    },
    maritalStatus: 'Casado/a',
    category: 'VIP / Alto Valor',
    tags: ['Florida Blue Gold', 'Familiar'],
    status: 'Cliente Activo',
    assignedAgentId: 'usr-optima-1',
    pipelineId: 'pipe-optima-1',
    stageId: 'stg-opt-3',
    dealValue: 1850,
    leadSource: 'Micro-Landing Web',
    customFields: {
      annualIncome: 55000,
      householdSize: 3
    },
    createdAt: '2026-02-01 10:00',
    updatedAt: '2026-08-29 14:00'
  },
  {
    id: 'cli-opt-2',
    tenantId: 'tenant-optima',
    firstName: 'Mariana',
    lastName: 'Valenzuela',
    email: 'mariana.valenzuela@gmail.com',
    phone: '+1 (786) 450-8912',
    birthDate: '1992-11-20',
    gender: 'F',
    idNumber: 'SSN-***-**-9182',
    address: {
      street: '750 NW 57th Ave',
      city: 'Miami',
      state: 'FL',
      zipCode: '33126',
      country: 'Estados Unidos'
    },
    maritalStatus: 'Soltero/a',
    category: 'Renovación ACA 2026',
    tags: ['Ambetter', 'Salud Individual'],
    status: 'Cliente Activo',
    assignedAgentId: 'usr-optima-2',
    pipelineId: 'pipe-optima-1',
    stageId: 'stg-opt-3',
    dealValue: 420,
    leadSource: 'WhatsApp Entrante',
    customFields: {
      annualIncome: 31000,
      householdSize: 1
    },
    createdAt: '2026-03-10 11:20',
    updatedAt: '2026-08-28 17:00'
  },
  {
    id: 'cli-opt-3',
    tenantId: 'tenant-optima',
    firstName: 'Elizabeth',
    lastName: 'Betancur',
    email: 'elizabeth.betancur@gmail.com',
    phone: '+584249380524',
    birthDate: '1989-04-12',
    gender: 'F',
    idNumber: 'ID-***-**-3341',
    address: {
      street: '3340 Coral Way',
      city: 'Miami',
      state: 'FL',
      zipCode: '33145',
      country: 'Estados Unidos'
    },
    maritalStatus: 'Casado/a',
    category: 'Prospecto Calificado',
    tags: ['Landing Web', 'Seguro de Vida (IUL / Término)', 'Cotización Online'],
    status: 'Lead',
    assignedAgentId: 'usr-optima-1',
    pipelineId: 'pipe-optima-1',
    stageId: 'stg-opt-1',
    dealValue: 2400,
    leadSource: 'Micro-Landing Web',
    customFields: {
      service: 'Seguros de Vida (IUL / Retiro)',
      state: 'Florida',
      estimatedIncome: 65000,
      householdSize: 2,
      notes: 'Solicitud de cotización vía Micro Landing de Optima Health Brokers.'
    },
    createdAt: '2026-08-29 15:30',
    updatedAt: '2026-08-29 15:30'
  },
  {
    id: 'cli-sol-1',
    tenantId: 'tenant-sol',
    firstName: 'Jorge',
    lastName: 'Ramírez',
    email: 'jorge.ramirez@solclient.com',
    phone: '+1 (407) 555-9122',
    birthDate: '1961-07-08',
    gender: 'M',
    idNumber: 'SSN-***-**-7193',
    address: {
      street: '5401 S Kirkman Rd',
      city: 'Orlando',
      state: 'FL',
      zipCode: '32819',
      country: 'Estados Unidos'
    },
    maritalStatus: 'Casado/a',
    category: 'Prospecto Calificado',
    tags: ['Medicare', 'Landing Web'],
    status: 'Lead',
    assignedAgentId: 'usr-sol-1',
    pipelineId: 'pipe-sol-1',
    stageId: 'stg-sol-1',
    dealValue: 0,
    leadSource: 'Micro-Landing Web',
    customFields: {
      service: 'Medicare Advantage',
      state: 'Florida'
    },
    createdAt: '2026-08-29 14:45',
    updatedAt: '2026-08-29 14:45'
  },
  {
    id: 'cli-sol-2',
    tenantId: 'tenant-sol',
    firstName: 'Claudia',
    lastName: 'Vivas',
    email: 'claudia.vivas@gmail.com',
    phone: '+1 (407) 555-8371',
    birthDate: '1984-03-25',
    gender: 'F',
    idNumber: 'SSN-***-**-6642',
    address: {
      street: '100 E Pine St',
      city: 'Orlando',
      state: 'FL',
      zipCode: '32801',
      country: 'Estados Unidos'
    },
    maritalStatus: 'Soltero/a',
    category: 'Renovación ACA 2026',
    tags: ['Florida Blue', 'ACA 2026'],
    status: 'Cliente Activo',
    assignedAgentId: 'usr-sol-2',
    pipelineId: 'pipe-sol-1',
    stageId: 'stg-sol-3',
    dealValue: 320,
    leadSource: 'Referido por Cliente',
    customFields: {
      annualIncome: 28000,
      householdSize: 1
    },
    createdAt: '2026-01-20 09:30',
    updatedAt: '2026-08-29 10:00'
  }
];

export const INITIAL_POLICIES: Policy[] = [
  {
    id: 'pol-1',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-1',
    type: 'Salud/ACA',
    carrier: 'Florida Blue',
    planName: 'BlueCare Silver 1450',
    policyNumber: 'FLB-88392019',
    effectiveDate: '2026-01-01',
    expirationDate: '2026-12-31',
    monthlyPremium: 1450,
    subsidyAptc: 1435,
    clientPortion: 15,
    paymentDueDay: 1, // Due on the 1st
    status: 'Activa',
    agentId: 'usr-1',
    members: [
      {
        id: 'mem-1',
        firstName: 'Carlos Eduardo',
        lastName: 'Hernández Morales',
        relationship: 'Titular',
        birthDate: '1988-08-29',
        gender: 'M',
        idNumber: 'SSN-***-**-8491',
        tobaccoUser: false,
        status: 'Activo'
      },
      {
        id: 'mem-2',
        firstName: 'Elena Sofía',
        lastName: 'López de Hernández',
        relationship: 'Cónyuge',
        birthDate: '1990-05-12',
        gender: 'F',
        idNumber: 'SSN-***-**-9912',
        tobaccoUser: false,
        status: 'Activo'
      },
      {
        id: 'mem-3',
        firstName: 'Mateo',
        lastName: 'Hernández López',
        relationship: 'Hijo/a',
        birthDate: '2016-09-14',
        gender: 'M',
        tobaccoUser: false,
        status: 'Activo'
      },
      {
        id: 'mem-4',
        firstName: 'Valeria',
        lastName: 'Hernández López',
        relationship: 'Hijo/a',
        birthDate: '2020-02-18',
        gender: 'F',
        tobaccoUser: false,
        status: 'Activo'
      }
    ],
    versionHistory: [
      {
        version: 1,
        timestamp: '2026-01-01 09:00',
        changedBy: 'Víctor Aray',
        changesSummary: 'Emisión inicial póliza Salud ACA grupo familiar (4 miembros)',
        snapshot: { monthlyPremium: 1450, status: 'Activa' }
      }
    ],
    notes: 'Póliza subsidiada 99% mediante crédito tributario federal APTC. Débito automático de $15 activo en Chase.',
    createdAt: '2026-01-01 09:00',
    updatedAt: '2026-01-01 09:00'
  },
  {
    id: 'pol-2',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-1',
    type: 'Complementario',
    carrier: 'MetLife',
    planName: 'Dental & Vision Preferred Plus',
    policyNumber: 'MET-4491028',
    effectiveDate: '2026-02-01',
    monthlyPremium: 82,
    subsidyAptc: 0,
    clientPortion: 82,
    paymentDueDay: 15,
    status: 'Activa',
    agentId: 'usr-1',
    members: [
      {
        id: 'mem-21',
        firstName: 'Carlos Eduardo',
        lastName: 'Hernández Morales',
        relationship: 'Titular',
        birthDate: '1988-08-29',
        gender: 'M',
        tobaccoUser: false,
        status: 'Activo'
      },
      {
        id: 'mem-22',
        firstName: 'Elena Sofía',
        lastName: 'López de Hernández',
        relationship: 'Cónyuge',
        birthDate: '1990-05-12',
        gender: 'F',
        tobaccoUser: false,
        status: 'Activo'
      }
    ],
    versionHistory: [],
    createdAt: '2026-02-01 10:00',
    updatedAt: '2026-02-01 10:00'
  },
  {
    id: 'pol-3',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-2',
    type: 'Salud/ACA',
    carrier: 'Ambetter Health',
    planName: 'Ambetter Clear Silver',
    policyNumber: 'AMB-91028471',
    effectiveDate: '2026-02-15',
    expirationDate: '2026-12-31',
    monthlyPremium: 420,
    subsidyAptc: 420,
    clientPortion: 0,
    paymentDueDay: 5,
    status: 'Activa',
    agentId: 'usr-3',
    members: [
      {
        id: 'mem-31',
        firstName: 'Mariana Isabel',
        lastName: 'Suárez Colmenares',
        relationship: 'Titular',
        birthDate: '1994-08-31',
        gender: 'F',
        tobaccoUser: false,
        status: 'Activo'
      }
    ],
    versionHistory: [],
    notes: 'Prima $0 / mes con cobertura completa y subsidio total.',
    createdAt: '2026-02-15 11:00',
    updatedAt: '2026-02-15 11:00'
  },
  {
    id: 'pol-4',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-4',
    type: 'Salud/ACA',
    carrier: 'Oscar Health',
    planName: 'Oscar Simple Bronze',
    policyNumber: 'OSC-10492833',
    effectiveDate: '2026-03-01',
    monthlyPremium: 380,
    subsidyAptc: 350,
    clientPortion: 30,
    paymentDueDay: 30, // Due in 1 day!
    status: 'Pendiente de Pago',
    agentId: 'usr-4',
    members: [
      {
        id: 'mem-41',
        firstName: 'Gabriela',
        lastName: 'Pérez Silva',
        relationship: 'Titular',
        birthDate: '1996-03-22',
        gender: 'F',
        tobaccoUser: false,
        status: 'Activo'
      }
    ],
    versionHistory: [],
    notes: 'Requiere recordar pago de prima de $30 antes del fin de mes para evitar suspensión.',
    createdAt: '2026-03-01 09:00',
    updatedAt: '2026-08-25 10:00'
  },
  {
    id: 'pol-opt-1',
    tenantId: 'tenant-optima',
    clientId: 'cli-opt-1',
    clientName: 'Carlos Mendoza',
    type: 'Salud/ACA',
    carrier: 'Florida Blue',
    planName: 'BlueOptions Gold 1400',
    policyNumber: 'FLB-88392019',
    effectiveDate: '2026-01-01',
    expirationDate: '2026-12-31',
    monthlyPremium: 450,
    subsidyAptc: 430,
    clientPortion: 20,
    paymentDueDay: 5,
    status: 'Activa',
    agentId: 'usr-optima-1',
    members: [
      {
        id: 'mem-opt-1',
        firstName: 'Carlos',
        lastName: 'Mendoza',
        relationship: 'Titular',
        birthDate: '1985-06-15',
        gender: 'M',
        status: 'Activo'
      }
    ],
    versionHistory: [],
    notes: 'Póliza activa y en cumplimiento con Florida Blue.',
    createdAt: '2026-02-01 10:00',
    updatedAt: '2026-08-29 14:00'
  },
  {
    id: 'pol-opt-2',
    tenantId: 'tenant-optima',
    clientId: 'cli-opt-2',
    clientName: 'Mariana Valenzuela',
    type: 'Salud/ACA',
    carrier: 'Ambetter Health',
    planName: 'Ambetter Clear Silver',
    policyNumber: 'AMB-91028471',
    effectiveDate: '2026-03-01',
    expirationDate: '2026-12-31',
    monthlyPremium: 380,
    subsidyAptc: 380,
    clientPortion: 0,
    paymentDueDay: 1,
    status: 'Activa',
    agentId: 'usr-optima-2',
    members: [
      {
        id: 'mem-opt-2',
        firstName: 'Mariana',
        lastName: 'Valenzuela',
        relationship: 'Titular',
        birthDate: '1992-11-20',
        gender: 'F',
        status: 'Activo'
      }
    ],
    versionHistory: [],
    notes: 'Plan $0 mensual con subsidio completo.',
    createdAt: '2026-03-10 11:20',
    updatedAt: '2026-08-28 17:00'
  },
  {
    id: 'pol-sol-1',
    tenantId: 'tenant-sol',
    clientId: 'cli-sol-2',
    clientName: 'Claudia Vivas',
    type: 'Salud/ACA',
    carrier: 'Florida Blue',
    planName: 'myBlue HMO Essential',
    policyNumber: 'SOL-2026-1194',
    effectiveDate: '2026-02-01',
    expirationDate: '2026-12-31',
    monthlyPremium: 320,
    subsidyAptc: 310,
    clientPortion: 10,
    paymentDueDay: 1,
    status: 'Activa',
    agentId: 'usr-sol-2',
    members: [
      {
        id: 'mem-sol-1',
        firstName: 'Claudia',
        lastName: 'Vivas',
        relationship: 'Titular',
        birthDate: '1984-03-25',
        gender: 'F',
        status: 'Activo'
      }
    ],
    versionHistory: [],
    notes: 'Póliza HMO activa gestionada por Seguros Sol Naciente.',
    createdAt: '2026-01-20 09:30',
    updatedAt: '2026-08-29 10:00'
  }
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bnk-1',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-1',
    clientName: 'Carlos Eduardo Hernández Morales',
    type: 'bank_account',
    accountHolder: 'Carlos E Hernández',
    holderIdNumber: 'SSN-***-**-8491',
    bankName: 'JPMorgan Chase Bank',
    routingNumber: '063100277',
    accountNumber: '482910394821',
    accountType: 'Checking / Corriente',
    paymentMethod: 'ACH Débito Automático',
    isDefault: true,
    verified: true,
    updatedAt: '2026-01-15 10:30'
  },
  {
    id: 'bnk-1-card',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-1',
    clientName: 'Carlos Eduardo Hernández Morales',
    type: 'credit_card',
    accountHolder: 'Carlos E Hernández Morales',
    bankName: 'Chase Sapphire Preferred',
    routingNumber: 'N/A',
    accountNumber: '4532891209384821',
    accountType: 'Tarjeta Débito/Crédito',
    paymentMethod: 'Tarjeta de Crédito',
    cardBrand: 'Visa',
    cardHolder: 'Carlos E Hernández Morales',
    cardNumber: '4532891209384821',
    cardExpDate: '11/29',
    cardExpMonth: '11',
    cardExpYear: '2029',
    cardCvv: '839',
    cardType: 'Crédito',
    isDefault: false,
    verified: true,
    updatedAt: '2026-01-15 11:00'
  },
  {
    id: 'bnk-2',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-2',
    clientName: 'Mariana Isabel Suárez Colmenares',
    type: 'bank_account',
    accountHolder: 'Mariana I Suárez',
    holderIdNumber: 'SSN-***-**-3912',
    bankName: 'Bank of America',
    routingNumber: '063000047',
    accountNumber: '992837192847',
    accountType: 'Savings / Ahorros',
    paymentMethod: 'ACH Débito Automático',
    isDefault: true,
    verified: true,
    updatedAt: '2026-02-10 14:15'
  },
  {
    id: 'bnk-3',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-4',
    clientName: 'Gabriela Pérez Silva',
    type: 'credit_card',
    accountHolder: 'Gabriela Pérez',
    bankName: 'Capital One Quicksilver',
    routingNumber: 'N/A',
    accountNumber: '5424189039201948',
    accountType: 'Tarjeta Débito/Crédito',
    paymentMethod: 'Tarjeta de Crédito',
    cardBrand: 'Mastercard',
    cardHolder: 'Gabriela Pérez Silva',
    cardNumber: '5424189039201948',
    cardExpDate: '07/28',
    cardExpMonth: '07',
    cardExpYear: '2028',
    cardCvv: '419',
    cardType: 'Crédito',
    isDefault: true,
    verified: true,
    updatedAt: '2026-03-01 09:30'
  }
];

export const INITIAL_DOCUMENTS: ClientDocument[] = [
  {
    id: 'doc-1',
    clientId: 'cli-1',
    name: 'Green_Card_Carlos_Hernandez.pdf',
    type: 'Green Card / Residencia',
    fileSize: '1.4 MB',
    expirationDate: '2030-08-15',
    uploadedAt: '2026-01-15 10:25',
    status: 'Válido',
    verifiedBy: 'Víctor Aray',
    description: 'Tarjeta de Residente Permanente (I-551) legible por ambos lados.'
  },
  {
    id: 'doc-2',
    clientId: 'cli-1',
    name: 'W2_Form_2025_Carlos_Hernandez.pdf',
    type: 'Formulario W-2 / Taxes',
    fileSize: '840 KB',
    uploadedAt: '2026-01-15 10:26',
    status: 'Válido',
    verifiedBy: 'Víctor Aray',
    description: 'Comprobante de ingresos W-2 del empleador para subsidio ACA.'
  },
  {
    id: 'doc-3',
    clientId: 'cli-2',
    name: 'Permiso_Trabajo_EAD_Mariana.pdf',
    type: 'Cédula / Documento de Identidad',
    fileSize: '2.1 MB',
    expirationDate: '2026-09-05', // Expiring in 7 days!
    uploadedAt: '2026-02-10 14:10',
    status: 'Por Vencer',
    verifiedBy: 'Carolina Méndez',
    description: 'Documento de Autorización de Empleo (EAD) con fecha de expiración próxima.'
  },
  {
    id: 'doc-4',
    clientId: 'cli-4',
    name: 'ID_Florida_Gabriela_Perez.pdf',
    type: 'Cédula / Documento de Identidad',
    fileSize: '950 KB',
    expirationDate: '2026-08-10', // Already expired!
    uploadedAt: '2026-03-01 09:10',
    status: 'Vencido',
    verifiedBy: 'Valeria Gómez',
    description: 'Licencia de conducir de Florida vencida que requiere renovación.'
  }
];

export const INITIAL_NOTES: ClientNote[] = [
  {
    id: 'not-1',
    clientId: 'cli-1',
    userId: 'usr-1',
    userName: 'Víctor Aray',
    content: 'Cliente confirmó inscripción familiar de 4 personas con Florida Blue. Quedó muy satisfecho con el copago $0 en medicina primaria.',
    category: 'General',
    images: [],
    createdAt: '2026-01-15 11:30'
  },
  {
    id: 'not-2',
    clientId: 'cli-1',
    userId: 'usr-1',
    userName: 'Víctor Aray',
    content: 'Llamada de seguimiento mensual. Todo en orden con las tarjetas físicas del seguro recibidas por correo. Adjunto captura de confirmación del portal.',
    category: 'Llamada',
    images: [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="320" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><rect x="40" y="40" width="520" height="60" rx="12" fill="%237c3aed"/><text x="60" y="78" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="20">Florida Blue - Confirmación de Cobertura</text><text x="40" y="140" fill="%23334155" font-family="sans-serif" font-weight="bold" font-size="14">Asegurado: Carlos Eduardo Hernández</text><text x="40" y="170" fill="%2364748b" font-family="monospace" font-size="13">Póliza ID: FLB-9482-ACA • Plan Silver 87</text><text x="40" y="200" fill="%2316a34a" font-family="sans-serif" font-weight="bold" font-size="14">Estado: ACTIVO • Copago $0 Medicina Primaria</text><rect x="40" y="230" width="220" height="60" rx="10" fill="%23f1f5f9"/><text x="55" y="255" fill="%23475569" font-family="sans-serif" font-size="11">Prima Mensual</text><text x="55" y="278" fill="%237c3aed" font-family="monospace" font-weight="bold" font-size="18">$18.50 / mes</text><rect x="280" y="230" width="220" height="60" rx="10" fill="%23f1f5f9"/><text x="295" y="255" fill="%23475569" font-family="sans-serif" font-size="11">Subsidio APTC</text><text x="295" y="278" fill="%2316a34a" font-family="monospace" font-weight="bold" font-size="18">$485.00 / mes</text></svg>'
    ],
    createdAt: '2026-05-10 15:20'
  },
  {
    id: 'not-3',
    clientId: 'cli-4',
    userId: 'usr-4',
    userName: 'Valeria Gómez',
    content: 'Se le recordó por WhatsApp que su tarjeta de identificación está vencida y que su pago de $30 de Oscar vence a fin de mes.',
    category: 'Cobranza',
    images: [],
    createdAt: '2026-08-25 10:15'
  }
];

export const INITIAL_ACTIVITIES: ClientActivity[] = [
  {
    id: 'act-1',
    clientId: 'cli-1',
    type: 'whatsapp',
    title: 'Mensaje WhatsApp enviado',
    description: 'Plantilla de bienvenida y detalles de póliza enviada con éxito.',
    userId: 'usr-1',
    userName: 'Víctor Aray',
    timestamp: '2026-01-15 10:45'
  },
  {
    id: 'act-2',
    clientId: 'cli-1',
    type: 'call',
    title: 'Llamada Issabel PBX',
    description: 'Llamada saliente duración 4m 12s. Calificación: Positiva.',
    userId: 'usr-1',
    userName: 'Víctor Aray',
    timestamp: '2026-05-10 15:15'
  },
  {
    id: 'act-3',
    clientId: 'cli-2',
    type: 'stage_change',
    title: 'Avance de etapa en Pipeline',
    description: 'Movido a "Póliza Emitida / Ganado".',
    userId: 'usr-3',
    userName: 'Alejandro Ramos',
    timestamp: '2026-02-15 11:05'
  }
];

export const INITIAL_WHATSAPP_CONFIG: WhatsAppConfig = {
  tenantId: 'tenant-ateendia',
  activeAccountTab: 'WA1',
  selectedPipelineId: 'pipe-1',
  connectionType: 'qr_bridge',
  qrConnected: true,
  connectedPhone: '+1 (786) 450-2819',
  alertRecipients: [
    { id: 'rec-1', name: 'Víctor Aray', role: 'Administrador', phone: '17864502819', isActive: true },
    { id: 'rec-2', name: 'Carolina Méndez', role: 'Supervisora', phone: '13059124433', isActive: true }
  ],
  changeLog: [
    { date: '2026-08-20 10:15', user: 'Víctor Aray', action: 'Modificación', change: 'Vinculación de sesión WhatsApp WA1 vía QR completada' },
    { date: '2026-08-22 14:30', user: 'Víctor Aray', action: 'Modificación', change: 'Pipeline asignado a "Inscripciones ACA & Salud 2026"' }
  ],
  accounts: {
    WA1: {
      id: 'WA1',
      name: 'WhatsApp Cloud WA1 (Línea Principal)',
      phone: '+1 (786) 450-2819',
      deviceType: 'Atoms Cloud PBX',
      selectedPipelineId: 'pipe-1',
      defaultPipelineId: 'pipe-1',
      qrConnected: true,
      qrStatus: 'connected',
      qrGeneratedAt: 'Hace un momento',
      autoReply: true,
      roundRobinAgents: true,
      webhookUrl: 'https://webhook.atomscloudcrm.com/v1/wa1/inbound',
      alertRecipients: [
        { id: 'rec-1', name: 'Víctor Aray', role: 'Administrador', phone: '17864502819', isActive: true },
        { id: 'rec-2', name: 'Carolina Méndez', role: 'Supervisora', phone: '13059124433', isActive: true }
      ],
      changeLog: [
        { date: '2026-08-20 10:15', user: 'Víctor Aray', action: 'Modificación', change: 'Vinculación de sesión WhatsApp WA1 vía QR completada' },
        { date: '2026-08-22 14:30', user: 'Víctor Aray', action: 'Modificación', change: 'Pipeline asignado a "Inscripciones ACA & Salud 2026"' },
        { date: '2026-08-28 18:15', user: 'Víctor Aray', action: 'Modificación', change: 'Sesión activa y sincronización multicanal OK' }
      ]
    },
    WA2: {
      id: 'WA2',
      name: 'WhatsApp Cloud WA2 (Línea Soporte / Renovaciones)',
      phone: '+1 (786) 555-0244',
      deviceType: 'Atoms Cloud PBX - Nodo B',
      selectedPipelineId: 'pipe-1',
      defaultPipelineId: 'pipe-1',
      qrConnected: true,
      qrStatus: 'connected',
      qrGeneratedAt: 'Hace 5 minutos',
      autoReply: true,
      roundRobinAgents: false,
      webhookUrl: 'https://webhook.atomscloudcrm.com/v1/wa2/inbound',
      alertRecipients: [
        { id: 'rec-w2-1', name: 'Alejandro Ramos', role: 'Agente', phone: '17863229011', isActive: true },
        { id: 'rec-w2-2', name: 'Valeria Gómez', role: 'Agente', phone: '14078713329', isActive: true }
      ],
      changeLog: [
        { date: '2026-08-24 09:30', user: 'Carolina Méndez', action: 'Vinculación', change: 'Enlace de número WhatsApp WA2 (+1 786 555-0244) vía QR exitoso' },
        { date: '2026-08-27 16:20', user: 'Carolina Méndez', action: 'Modificación', change: 'Enrutamiento configurado para Renovaciones y Cobranzas' }
      ]
    }
  }
};

export const INITIAL_SMTP_CONFIG: SmtpConfig = {
  tenantId: 'tenant-ateendia',
  protocol: 'smtp',
  host: 'ssl://smtp.gmail.com',
  port: 465,
  senderEmail: 'obamacare.support@gmail.com',
  senderName: 'Obamacare Ateendia',
  appPassword: 'abcd efgh ijkl mnop',
  isConfigured: true,
  lastTestedAt: '2026-08-29 14:00',
  testStatus: 'success'
};

export const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl-1',
    tenantId: 'tenant-ateendia',
    name: 'Recordatorio de Pago de Póliza',
    channel: 'both',
    category: 'Cobranza',
    subject: 'Recordatorio de Pago de tu Seguro - {{compania}}',
    body: 'Hola {{nombre}}, te recordamos que el día {{fecha_pago}} vence tu cuota mensual de ${{prima}} para tu póliza {{poliza}} con {{compania}}. Para mantener activa tu cobertura médica, por favor realiza tu pago a tiempo o responde este mensaje si necesitas asistencia.',
    variables: ['nombre', 'fecha_pago', 'prima', 'poliza', 'compania'],
    createdAt: '2026-01-10 10:00'
  },
  {
    id: 'tpl-2',
    tenantId: 'tenant-ateendia',
    name: 'Felicitación de Cumpleaños Especial',
    channel: 'both',
    category: 'Cumpleaños',
    subject: '¡Feliz Cumpleaños te desea el equipo de {{empresa}}! 🎂🎉',
    body: '¡Hola {{nombre}}! 🎂 En este día tan especial, todo el equipo de {{empresa}} te desea un muy feliz cumpleaños lleno de salud, alegría y bendiciones junto a tus seres queridos. ¡Estamos siempre para cuidarte!',
    variables: ['nombre', 'empresa'],
    createdAt: '2026-01-10 10:30'
  },
  {
    id: 'tpl-3',
    tenantId: 'tenant-ateendia',
    name: 'Solicitud de Documento por Vencer',
    channel: 'both',
    category: 'Documento Requerido',
    subject: 'Actualización requerida de documento para tu póliza {{poliza}}',
    body: 'Estimado/a {{nombre}}, te contactamos de {{empresa}} para solicitarte una copia actualizada de tu documento de identidad o estatus migratorio para mantener tu expediente al día con {{compania}}. Puedes enviarlo en foto o PDF respondiendo a este mensaje.',
    variables: ['nombre', 'empresa', 'poliza', 'compania'],
    createdAt: '2026-02-01 11:00'
  },
  {
    id: 'tpl-4',
    tenantId: 'tenant-ateendia',
    name: 'Bienvenida a Nueva Póliza Emitida',
    channel: 'both',
    category: 'Bienvenida',
    subject: '¡Bienvenido/a! Tu póliza {{poliza}} con {{compania}} está activa',
    body: '¡Felicidades {{nombre}}! Tu póliza {{poliza}} con {{compania}} ha sido emitida con éxito con fecha efectiva {{fecha_efectiva}}. Tu agente asignado es {{agente}}. Te enviamos tus comprobantes por este medio.',
    variables: ['nombre', 'poliza', 'compania', 'fecha_efectiva', 'agente'],
    createdAt: '2026-01-12 14:00'
  }
];

export const INITIAL_CONVERSATIONS: WhatsAppConversation[] = [
  {
    id: 'conv-1',
    tenantId: 'tenant-ateendia',
    account: 'WA1',
    clientId: 'cli-1',
    contactName: 'Carlos Hernández',
    contactPhone: '+1 (786) 554-1928',
    lastMessage: 'Muchas gracias Víctor, ya recibí las tarjetas en mi casa.',
    lastMessageTime: 'Hoy 14:22',
    unreadCount: 0,
    assignedAgentId: 'usr-1',
    channelSource: 'whatsapp',
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        direction: 'outbound',
        sender: 'Víctor Aray',
        content: '¡Hola Carlos! Te confirmo que tu póliza con Florida Blue está 100% activa. ¿Has recibido las tarjetas médicas físicas por correo?',
        timestamp: 'Hoy 14:15',
        status: 'read'
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        direction: 'inbound',
        sender: 'Carlos Hernández',
        content: 'Muchas gracias Víctor, ya recibí las tarjetas en mi casa.',
        timestamp: 'Hoy 14:22',
        status: 'read'
      }
    ]
  },
  {
    id: 'conv-2',
    tenantId: 'tenant-ateendia',
    account: 'WA1',
    clientId: 'cli-4',
    contactName: 'Gabriela Pérez',
    contactPhone: '+1 (786) 902-1144',
    lastMessage: 'Hola Valeria, ¿me podrías indicar a qué enlace puedo pagar los $30?',
    lastMessageTime: 'Hoy 11:40',
    unreadCount: 1,
    assignedAgentId: 'usr-4',
    messages: [
      {
        id: 'msg-201',
        conversationId: 'conv-2',
        direction: 'outbound',
        sender: 'Valeria Gómez',
        content: 'Hola Gabriela, te recordamos que tu pago de $30 para Oscar Health vence este fin de mes.',
        timestamp: 'Ayer 16:00',
        status: 'read'
      },
      {
        id: 'msg-202',
        conversationId: 'conv-2',
        direction: 'inbound',
        sender: 'Gabriela Pérez',
        content: 'Hola Valeria, ¿me podrías indicar a qué enlace puedo pagar los $30?',
        timestamp: 'Hoy 11:40',
        status: 'read'
      }
    ]
  },
  {
    id: 'conv-3',
    tenantId: 'tenant-ateendia',
    account: 'WA2',
    clientId: 'cli-2',
    contactName: 'Mariana Suárez',
    contactPhone: '+1 (305) 749-8821',
    lastMessage: 'Hola Alejandro, ¿la cobertura dental de Ambetter incluye limpieza gratuita este mes?',
    lastMessageTime: 'Hoy 13:05',
    unreadCount: 1,
    assignedAgentId: 'usr-3',
    messages: [
      {
        id: 'msg-301',
        conversationId: 'conv-3',
        direction: 'inbound',
        sender: 'Mariana Suárez',
        content: 'Hola Alejandro, ¿la cobertura dental de Ambetter incluye limpieza gratuita este mes?',
        timestamp: 'Hoy 13:05',
        status: 'read'
      }
    ]
  },
  {
    id: 'conv-4',
    tenantId: 'tenant-ateendia',
    account: 'WA2',
    clientId: 'cli-3',
    contactName: 'Roberto García Peña',
    contactPhone: '+1 (407) 621-9944',
    lastMessage: 'Buenas tardes, acabo de enviar el comprobante de ingresos W-2 por correo.',
    lastMessageTime: 'Ayer 18:30',
    unreadCount: 0,
    assignedAgentId: 'usr-2',
    messages: [
      {
        id: 'msg-401',
        conversationId: 'conv-4',
        direction: 'inbound',
        sender: 'Roberto García Peña',
        content: 'Buenas tardes, acabo de enviar el comprobante de ingresos W-2 por correo.',
        timestamp: 'Ayer 18:30',
        status: 'read'
      }
    ]
  },
  {
    id: 'conv-opt-1',
    tenantId: 'tenant-optima',
    account: 'WA1',
    clientId: 'cli-opt-1',
    contactName: 'Carlos Mendoza',
    contactPhone: '+1 (305) 980-3321',
    lastMessage: 'Buenas tardes, le envío el comprobante de pago de la póliza de vida.',
    lastMessageTime: 'Hoy 14:10',
    unreadCount: 0,
    assignedAgentId: 'usr-optima-1',
    messages: [
      {
        id: 'msg-opt-1',
        conversationId: 'conv-opt-1',
        direction: 'outbound',
        sender: 'Andrés Bello',
        content: 'Hola Carlos, te confirmamos que tu póliza con Florida Blue está activa. ¿Pudiste procesar tu pago de prima?',
        timestamp: 'Hoy 13:50',
        status: 'read'
      },
      {
        id: 'msg-opt-2',
        conversationId: 'conv-opt-1',
        direction: 'inbound',
        sender: 'Carlos Mendoza',
        content: 'Buenas tardes, le envío el comprobante de pago de la póliza de vida.',
        timestamp: 'Hoy 14:10',
        status: 'read'
      }
    ]
  },
  {
    id: 'conv-opt-2',
    tenantId: 'tenant-optima',
    account: 'WA1',
    clientId: 'cli-opt-2',
    contactName: 'Mariana Valenzuela',
    contactPhone: '+1 (786) 450-8912',
    lastMessage: '¡Hola! Necesito renovar mi póliza de salud Ambetter para el próximo mes.',
    lastMessageTime: 'Hoy 15:00',
    unreadCount: 1,
    assignedAgentId: 'usr-optima-2',
    messages: [
      {
        id: 'msg-opt-201',
        conversationId: 'conv-opt-2',
        direction: 'inbound',
        sender: 'Mariana Valenzuela',
        content: '¡Hola! Necesito renovar mi póliza de salud Ambetter para el próximo mes.',
        timestamp: 'Hoy 15:00',
        status: 'delivered'
      }
    ]
  },
  {
    id: 'conv-sol-1',
    tenantId: 'tenant-sol',
    account: 'WA1',
    clientId: 'cli-sol-1',
    contactName: 'Jorge Ramírez',
    contactPhone: '+1 (407) 555-9122',
    lastMessage: 'Hola Gabriel, gracias por la información del plan Medicare.',
    lastMessageTime: 'Hoy 11:20',
    unreadCount: 0,
    assignedAgentId: 'usr-sol-1',
    channelSource: 'whatsapp',
    messages: [
      {
        id: 'msg-sol-1',
        conversationId: 'conv-sol-1',
        direction: 'inbound',
        sender: 'Jorge Ramírez',
        content: 'Hola Gabriel, gracias por la información del plan Medicare.',
        timestamp: 'Hoy 11:20',
        status: 'read'
      }
    ]
  },

  // Instagram DM conversation
  {
    id: 'conv-ig-1',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-4',
    contactName: 'Gabriela Pérez',
    contactPhone: '+1 (786) 902-1144',
    lastMessage: '¡Gracias por ayudarme con mi cotización! Me quedé con dudas sobre el medicamento que tomo.',
    lastMessageTime: 'Hoy 10:45',
    unreadCount: 1,
    assignedAgentId: 'usr-4',
    channelSource: 'instagram',
    messages: [
      {
        id: 'msg-ig-1',
        conversationId: 'conv-ig-1',
        direction: 'inbound',
        sender: 'Gabriela Pérez (IG)',
        content: '¡Gracias por ayudarme con mi cotización! Me quedé con dudas sobre el medicamento que tomo.',
        timestamp: 'Hoy 10:45',
        status: 'delivered'
      }
    ]
  },

  // Facebook Messenger conversation
  {
    id: 'conv-fb-1',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-2',
    contactName: 'Mariana Suárez',
    contactPhone: '+1 (305) 749-8821',
    lastMessage: '¿Puedes enviarme el comprobante de pago que mencionaste?',
    lastMessageTime: 'Ayer 16:20',
    unreadCount: 2,
    assignedAgentId: 'usr-3',
    channelSource: 'facebook',
    messages: [
      {
        id: 'msg-fb-1',
        conversationId: 'conv-fb-1',
        direction: 'outbound',
        sender: 'Alejandro Ramos',
        content: 'Claro, te envío el comprobante por mensaje privado.',
        timestamp: 'Ayer 16:00',
        status: 'read'
      },
      {
        id: 'msg-fb-2',
        conversationId: 'conv-fb-1',
        direction: 'inbound',
        sender: 'Mariana Suárez',
        content: '¿Puedes enviarme el comprobante de pago que mencionaste?',
        timestamp: 'Ayer 16:20',
        status: 'delivered'
      }
    ]
  },

  // Web Landing conversation (form submission)
  {
    id: 'conv-landing-1',
    tenantId: 'tenant-optima',
    clientId: 'cli-opt-3',
    contactName: 'Elizabeth Betancur',
    contactPhone: '+584249380524',
    lastMessage: 'Buenas tardes, acabo de completar el formulario de cotización para vivienda.',
    lastMessageTime: 'Hoy 09:15',
    unreadCount: 0,
    assignedAgentId: 'usr-optima-1',
    channelSource: 'landing',
    messages: [
      {
        id: 'msg-landing-1',
        conversationId: 'conv-landing-1',
        direction: 'inbound',
        sender: 'Elizabeth Betancur',
        content: 'Buenas tardes, acabo de completar el formulario de cotización para vivienda.',
        timestamp: 'Hoy 09:15',
        status: 'read'
      }
    ]
  },
  {
    id: 'conv-landing-2',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-5',
    contactName: 'Laura Fernández',
    contactPhone: '+1 (786) 555-0199',
    lastMessage: 'Buenas tardes, solicité información sobre pólizas de salud a través del sitio web.',
    lastMessageTime: 'Hoy 11:30',
    unreadCount: 1,
    assignedAgentId: 'usr-2',
    channelSource: 'landing',
    messages: [
      {
        id: 'msg-landing-2',
        conversationId: 'conv-landing-2',
        direction: 'inbound',
        sender: 'Laura Fernández',
        content: 'Buenas tardes, solicité información sobre pólizas de salud a través del sitio web.',
        timestamp: 'Hoy 11:30',
        status: 'read'
      }
    ]
  }
];

export const INITIAL_CHAT_CHANNELS: ChatChannel[] = [
  { id: 'chn-1', tenantId: 'tenant-ateendia', name: 'general', description: 'Canal principal de Ateendia Seguros', isPrivate: false, memberUserIds: ['usr-1', 'usr-2', 'usr-3', 'usr-4'] },
  { id: 'chn-2', tenantId: 'tenant-ateendia', name: 'agentes-salud-aca', description: 'Coordinación de inscripciones ACA y cotizaciones', isPrivate: false, memberUserIds: ['usr-1', 'usr-2', 'usr-3', 'usr-4'] },
  { id: 'chn-3', tenantId: 'tenant-ateendia', name: 'renovaciones-2026', description: 'Estrategia de retención y alertas de pago', isPrivate: false, memberUserIds: ['usr-1', 'usr-2'] },
  { id: 'chn-opt-1', tenantId: 'tenant-optima', name: 'general-optima', description: 'Canal de coordinación general de Optima Health Brokers', isPrivate: false, memberUserIds: ['usr-optima-1', 'usr-optima-2'] },
  { id: 'chn-sol-1', tenantId: 'tenant-sol', name: 'general-sol', description: 'Canal general de Seguros Sol Naciente', isPrivate: false, memberUserIds: ['usr-sol-1', 'usr-sol-2'] }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'cmsg-1',
    channelId: 'chn-1',
    senderUserId: 'usr-1',
    senderName: 'Víctor Aray',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: '¡Excelente semana equipo! Ya tenemos activas las alertas automáticas de cumpleaños y vencimientos de pólizas para el mes.',
    timestamp: 'Hoy 09:00'
  },
  {
    id: 'cmsg-2',
    channelId: 'chn-1',
    senderUserId: 'usr-2',
    senderName: 'Carolina Méndez',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    content: '¡Perfecto Víctor! Ya revisé el pipeline de Salud y tenemos 5 cotizaciones listas para cerrar hoy.',
    timestamp: 'Hoy 09:12'
  }
];

export const INITIAL_ISSABEL_CONFIG: IssabelConfig = {
  tenantId: 'tenant-ateendia',
  host: 'pbx.ateendia-cloud.com',
  amiPort: 5038,
  amiUser: 'crm_agent',
  amiSecret: 'issabel_ami_sec_2026',
  webrtcWssUrl: 'wss://pbx.ateendia-cloud.com:8089/ws',
  defaultContext: 'from-internal',
  isConnected: true
};

export const INITIAL_CALL_RECORDS: CallRecord[] = [
  {
    id: 'cdr-1',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-1',
    clientName: 'Carlos Eduardo Hernández Morales',
    agentId: 'usr-1',
    agentName: 'Víctor Aray',
    agentExtension: '101',
    destinationNumber: '+1 (786) 554-1928',
    direction: 'outbound',
    status: 'ANSWERED',
    durationSeconds: 252,
    recordingUrl: 'https://example.com/recordings/call_20260510_101_7865541928.mp3',
    notes: 'Seguimiento de tarjetas físicas de seguro. Todo confirmado.',
    timestamp: '2026-05-10 15:15'
  },
  {
    id: 'cdr-2',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-5',
    clientName: 'Andrés Mendoza Castillo',
    agentId: 'usr-1',
    agentName: 'Víctor Aray',
    agentExtension: '101',
    destinationNumber: '+1 (813) 441-2099',
    direction: 'inbound',
    status: 'ANSWERED',
    durationSeconds: 380,
    recordingUrl: 'https://example.com/recordings/call_20260418_8134412099.mp3',
    notes: 'Consulta sobre póliza de Vida MetLife IUL. Se completó el cierre de póliza.',
    timestamp: '2026-04-18 16:20'
  },
  {
    id: 'cdr-3',
    tenantId: 'tenant-ateendia',
    clientId: 'cli-3',
    clientName: 'Roberto García Peña',
    agentId: 'usr-2',
    agentName: 'Carolina Méndez',
    agentExtension: '102',
    destinationNumber: '+1 (407) 621-9944',
    direction: 'outbound',
    status: 'ANSWERED',
    durationSeconds: 184,
    notes: 'Presentación de cotización UnitedHealthcare familiar.',
    timestamp: '2026-08-20 11:35'
  }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp-1',
    tenantId: 'tenant-ateendia',
    name: 'Campaña Recordatorio Cobranza Fin de Mes',
    channel: 'whatsapp',
    templateId: 'tpl-1',
    targetSegment: {
      policyStatus: 'Pendiente de Pago',
      carrier: 'Todos'
    },
    totalAudience: 18,
    sentCount: 18,
    deliveredCount: 18,
    readCount: 16,
    repliedCount: 9,
    status: 'Completada',
    createdAt: '2026-08-25 10:00'
  },
  {
    id: 'cmp-2',
    tenantId: 'tenant-ateendia',
    name: 'Renovaciones Anticipadas ACA 2026',
    channel: 'email',
    templateId: 'tpl-4',
    targetSegment: {
      category: 'Renovación ACA 2026'
    },
    totalAudience: 45,
    sentCount: 45,
    deliveredCount: 44,
    readCount: 31,
    repliedCount: 12,
    status: 'Completada',
    createdAt: '2026-08-15 09:00'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    tenantId: 'tenant-ateendia',
    userId: 'usr-1',
    userName: 'Víctor Aray',
    userEmail: 'victoraray8@gmail.com',
    action: 'LOGIN',
    module: 'Usuarios',
    details: 'Inicio de sesión exitoso con autenticación 2FA verificada.',
    ipAddress: '190.72.18.94',
    timestamp: '2026-08-29 15:45:10'
  },
  {
    id: 'aud-2',
    tenantId: 'tenant-ateendia',
    userId: 'usr-1',
    userName: 'Víctor Aray',
    userEmail: 'victoraray8@gmail.com',
    action: 'UPDATE',
    module: 'Email',
    targetName: 'Configuración SMTP Gmail',
    details: 'Actualización de credenciales de correo de envío obamacare.support@gmail.com con puerto 465 SSL.',
    ipAddress: '190.72.18.94',
    timestamp: '2026-08-29 14:00:22'
  },
  {
    id: 'aud-3',
    tenantId: 'tenant-ateendia',
    userId: 'usr-1',
    userName: 'Víctor Aray',
    userEmail: 'victoraray8@gmail.com',
    action: 'CREATE',
    module: 'Pólizas',
    targetName: 'FLB-88392019 (Florida Blue)',
    details: 'Creación de póliza de Salud ACA para cliente Carlos Hernández con 4 miembros.',
    ipAddress: '190.72.18.94',
    timestamp: '2026-01-01 09:00:00'
  }
];

export const INITIAL_N8N_CONFIG: N8nConfig = {
  tenantId: 'tenant-ateendia',
  instanceUrl: 'https://n8n.tu-instancia.com',
  apiToken: 'n8n_api_9948271038572019847192abcdef89',
  webhookUrl: 'https://n8n.instance.ateendia.io/webhook/ateendia-sync-crm-v1',
  apiKey: 'n8n_sec_9948271038572019847192',
  isActive: true,
  triggers: [
    {
      id: 'n8n-trg-1',
      name: 'Nuevo Lead Creado',
      event: 'lead.created',
      description: 'Dispara cuando ingresa un lead por formulario, Facebook Lead Ads o WhatsApp.',
      enabled: true,
      samplePayload: {
        event: 'lead.created',
        tenantId: 'tenant-ateendia',
        client: { id: 'cli-1', name: 'Carlos Hernández', phone: '+13055550192', email: 'carlos.h@gmail.com' },
        timestamp: '2026-08-30T10:00:00Z'
      }
    },
    {
      id: 'n8n-trg-2',
      name: 'Póliza Emitida / Renovada',
      event: 'policy.created',
      description: 'Envía los datos de la nueva póliza y miembros al sistema contable y N8N.',
      enabled: true,
      samplePayload: {
        event: 'policy.created',
        policyNumber: 'FLB-88392019',
        carrier: 'Florida Blue',
        premium: 0.0,
        membersCount: 4
      }
    },
    {
      id: 'n8n-trg-3',
      name: 'Mensaje de WhatsApp Recibido',
      event: 'whatsapp.message_received',
      description: 'Envía cada mensaje entrante a flujos de IA conversacional y RAG en N8N.',
      enabled: true,
      samplePayload: {
        event: 'whatsapp.message_received',
        phone: '+13055550192',
        message: 'Hola, tengo una pregunta sobre mi prima del mes',
        sender: 'Carlos Hernández'
      }
    },
    {
      id: 'n8n-trg-4',
      name: 'Documento por Vencer Detectado',
      event: 'document.expiring',
      description: 'Notifica 30/15/7 días antes de la fecha de caducidad de un documento.',
      enabled: true,
      samplePayload: {
        event: 'document.expiring',
        documentName: 'Declaración de Impuestos 1040 (2025)',
        daysLeft: 15,
        clientId: 'cli-1'
      }
    }
  ],
  lastTriggeredAt: '2026-08-30 09:12:00',
  lastResponseStatus: 200,
  logs: [
    {
      id: 'log-101',
      event: 'lead.created',
      timestamp: '2026-08-30 09:12:00',
      status: 'success',
      payload: { clientId: 'cli-5', name: 'Patricia Ramos', phone: '+13055550196' },
      response: '{"status":"ok","workflowExecutionId":"exec_88392"}'
    },
    {
      id: 'log-102',
      event: 'whatsapp.message_received',
      timestamp: '2026-08-30 08:45:12',
      status: 'success',
      payload: { from: '+13055550192', text: 'Confirmado el pago' },
      response: '{"status":"ok","ragRetrievedChunks":2}'
    }
  ]
};

export const INITIAL_AI_CONFIG: AiIntegrationConfig = {
  tenantId: 'tenant-ateendia',
  provider: 'openrouter',
  apiKey: 'sk-or-v1-88392019482019482019482019482019',
  customBaseUrl: 'https://openrouter.ai/api/v1',
  model: 'anthropic/claude-3.5-sonnet',
  temperature: 0.2,
  maxTokens: 1024,
  systemPrompt: `Eres AteendIA Bot, el asistente oficial de seguros de salud y vida de Ateendia CRM. Tu objetivo es asistir a los asesores y responder consultas sobre Obamacare (ACA), pólizas Florida Blue, Ambetter, Oscar Health, períodos de inscripción especial (SEP), subsidios de primas y requisitos documentales. Sé preciso, profesional, empático y brinda respuestas concisas con base en el contexto y los documentos RAG adjuntos.`,
  ragEnabled: true,
  ragTopK: 3,
  autoResponder: {
    enabled: true,
    whatsapp: true,
    instagram: false,
    facebook: false,
    confidenceThreshold: 85,
    handoffOnNegativeSentiment: true,
    businessHoursOnly: false
  },
  knowledgeDocuments: [
    {
      id: 'kdoc-1',
      name: 'Guía_Subsidios_ACA_Obamacare_2026.pdf',
      type: 'pdf',
      size: '2.4 MB',
      uploadedAt: '2026-08-20',
      chunksCount: 42,
      vectorDimensions: 1536,
      status: 'vectorized',
      summary: 'Tablas de ingreso FPL (Federal Poverty Level) para 2026, cálculo de créditos fiscales para primas y reglas de elegibilidad SEP.',
      tags: ['ACA', 'Obamacare', 'FPL', 'Subsidios']
    },
    {
      id: 'kdoc-2',
      name: 'Catalogo_Planes_Florida_Blue_2026.pdf',
      type: 'pdf',
      size: '5.1 MB',
      uploadedAt: '2026-08-22',
      chunksCount: 88,
      vectorDimensions: 1536,
      status: 'vectorized',
      summary: 'Detalles de copagos, deducibles, red BlueCare HMO / BlueOptions PPO, beneficios de telemedicina y cobertura dental.',
      tags: ['Florida Blue', 'Planes', 'Copagos', 'Deducibles']
    },
    {
      id: 'kdoc-3',
      name: 'Requisitos_Documentales_Marketplace.docx',
      type: 'docx',
      size: '850 KB',
      uploadedAt: '2026-08-25',
      chunksCount: 18,
      vectorDimensions: 1536,
      status: 'vectorized',
      summary: 'Lista de verificación de documentos válidos: W2, 1040, Carta de Empleador, Permiso de Trabajo (EAD), Residencia y Cédula.',
      tags: ['Documentos', 'Estatus Migratorio', 'Ingresos']
    }
  ]
};

export const INITIAL_SCHEDULED_RULES: ScheduledRule[] = [
  {
    id: 'rule-1',
    tenantId: 'tenant-ateendia',
    name: '🎂 Felicitación de Cumpleaños Automática',
    triggerType: 'birthday',
    channel: 'both',
    isEnabled: true,
    enabled: true,
    scheduledTime: '09:00',
    daysOffset: 0,
    daysBefore: 0,
    templateId: 'tpl-2',
    targetCount: 14,
    sentCountToday: 3,
    totalExecuted: 89,
    lastRunAt: '2026-08-30 09:00',
    nextRunAt: '2026-08-31 09:00'
  },
  {
    id: 'rule-2',
    tenantId: 'tenant-ateendia',
    name: '📄 Alerta de Vencimiento de Documento (15 días antes)',
    triggerType: 'doc_expiry',
    channel: 'whatsapp',
    isEnabled: true,
    enabled: true,
    scheduledTime: '10:30',
    daysOffset: 15,
    daysBefore: 15,
    templateId: 'tpl-3',
    targetCount: 8,
    sentCountToday: 5,
    totalExecuted: 142,
    lastRunAt: '2026-08-30 10:30',
    nextRunAt: '2026-08-31 10:30'
  },
  {
    id: 'rule-3',
    tenantId: 'tenant-ateendia',
    name: '💳 Recordatorio de Pago / Cuota de Póliza (5 días antes)',
    triggerType: 'payment_due',
    channel: 'both',
    isEnabled: true,
    enabled: true,
    scheduledTime: '11:00',
    daysOffset: 5,
    daysBefore: 5,
    templateId: 'tpl-1',
    targetCount: 12,
    sentCountToday: 10,
    totalExecuted: 230,
    lastRunAt: '2026-08-30 11:00',
    nextRunAt: '2026-08-31 11:00'
  }
];

export const INITIAL_ANTISPAM_SETTINGS: AntiSpamSettings = {
  whatsappDailyLimit: 50,
  maxDailyWhatsApp: 50,
  whatsappSentToday: 18,
  emailDailyLimit: 150,
  maxDailyEmail: 150,
  emailSentToday: 42,
  minIntervalSeconds: 25,
  maxIntervalSeconds: 45,
  randomizeDelay: true,
  randomJitter: true,
  alertOnSpamRisk: true,
  autoPauseOnHighFailureRate: true,
  lastResetDate: '2026-08-30'
};

export const INITIAL_APP_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-0',
    tenantId: 'tenant-ateendia',
    type: 'web_lead',
    title: '⚡ Nueva Cotización Solicitada (Obamacare ACA)',
    message: 'Camila Rodríguez (+1 786-334-9081) solicitó cotización de Obamacare / ACA desde la Micro-Landing de Ateendia Seguros.',
    timestamp: 'Hace 1 min',
    read: false,
    priority: 'high',
    metadata: {
      clientId: 'cli-1',
      clientName: 'Camila Rodríguez',
      clientPhone: '+1 (786) 334-9081',
      service: 'Obamacare / ACA (Salud)',
      state: 'Florida',
      estimatedIncome: 38000,
      householdSize: 3,
      leadSource: 'Micro-Landing Web',
      leadNotes: 'Busca plan Gold o Silver con subsidio familiar para 3 personas.'
    }
  },
  {
    id: 'notif-1',
    tenantId: 'tenant-ateendia',
    type: 'whatsapp_message',
    title: 'Nuevo Mensaje en WA1 (Línea Principal)',
    message: 'Carlos Mendoza: "Hola, ¿cuándo se me vence el plazo para enviar la carta de ingresos de ACA?"',
    timestamp: 'Hace 3 min',
    read: false,
    priority: 'high',
    metadata: {
      conversationId: 'conv-1',
      clientPhone: '+1 (786) 304-9812',
      clientName: 'Carlos Mendoza',
      clientId: 'cli-1',
      account: 'WA1'
    }
  },
  {
    id: 'notif-2',
    tenantId: 'tenant-ateendia',
    type: 'policy_status_change',
    title: 'Póliza Aprobada y Emitida (Activa)',
    message: 'Florida Blue #FLB-2026-8819 de Mariana Silva cambió de "En Proceso" a "Activa".',
    timestamp: 'Hace 18 min',
    read: false,
    priority: 'medium',
    metadata: {
      policyId: 'pol-2',
      policyNumber: 'FLB-2026-8819',
      carrier: 'Florida Blue',
      clientId: 'cl-2',
      clientName: 'Mariana Silva',
      oldStatus: 'En Proceso',
      newStatus: 'Activa'
    }
  },
  {
    id: 'notif-3',
    tenantId: 'tenant-ateendia',
    type: 'whatsapp_message',
    title: 'Nuevo Lead por WhatsApp WA2',
    message: 'Elena Rostova: "Buenas tardes, quisiera cotizar seguro de salud para 3 personas."',
    timestamp: 'Hace 42 min',
    read: false,
    priority: 'high',
    metadata: {
      conversationId: 'conv-4',
      clientPhone: '+1 (407) 819-2044',
      clientName: 'Elena Rostova',
      account: 'WA2'
    }
  },
  {
    id: 'notif-4',
    tenantId: 'tenant-ateendia',
    type: 'policy_status_change',
    title: 'Póliza Vencida por Falta de Pago',
    message: 'Ambetter #AMB-991203 de Roberto Gómez requiere renovación urgente.',
    timestamp: 'Hace 2 horas',
    read: true,
    priority: 'high',
    metadata: {
      policyId: 'pol-4',
      policyNumber: 'AMB-991203',
      carrier: 'Ambetter',
      clientId: 'cl-4',
      clientName: 'Roberto Gómez',
      oldStatus: 'Pendiente de Pago',
      newStatus: 'Vencida'
    }
  },
  {
    id: 'notif-opt-1',
    tenantId: 'tenant-optima',
    type: 'web_lead',
    title: '⚡ Cotización Web Solicitada (Seguro de Vida IUL)',
    message: 'Elizabeth Betancur (+584249380524) solicitó cotización desde la Micro-Landing de Optima Health Brokers.',
    timestamp: 'Hace 5 min',
    read: false,
    priority: 'high',
    metadata: {
      clientId: 'cli-opt-3',
      clientName: 'Elizabeth Betancur',
      clientPhone: '+584249380524',
      service: 'Seguros de Vida (IUL / Retiro)',
      leadSource: 'Micro-Landing Web'
    }
  },
  {
    id: 'notif-opt-2',
    tenantId: 'tenant-optima',
    type: 'whatsapp_message',
    title: 'Nuevo WhatsApp en WA1',
    message: 'Mariana Valenzuela (+1 786-450-8912): "¡Hola! Necesito renovar mi póliza de salud Ambetter para el próximo mes."',
    timestamp: 'Hace 12 min',
    read: false,
    priority: 'high',
    metadata: {
      conversationId: 'conv-opt-2',
      clientId: 'cli-opt-2',
      clientName: 'Mariana Valenzuela',
      clientPhone: '+1 (786) 450-8912',
      account: 'WA1'
    }
  },
  {
    id: 'notif-opt-3',
    tenantId: 'tenant-optima',
    type: 'policy_status_change',
    title: 'Actualización de Póliza #FLB-88392019',
    message: 'Póliza de Carlos Mendoza (Florida Blue) cambió a "Activa".',
    timestamp: 'Hace 25 min',
    read: true,
    priority: 'medium',
    metadata: {
      policyId: 'pol-opt-1',
      policyNumber: 'FLB-88392019',
      clientId: 'cli-opt-1',
      clientName: 'Carlos Mendoza',
      carrier: 'Florida Blue',
      oldStatus: 'En Proceso',
      newStatus: 'Activa'
    }
  },
  {
    id: 'notif-sol-1',
    tenantId: 'tenant-sol',
    type: 'web_lead',
    title: '⚡ Nueva Cotización Solicitada (Medicare)',
    message: 'Jorge Ramírez (+1 407-555-9122) solicitó cotización desde la Micro-Landing de Seguros Sol Naciente.',
    timestamp: 'Hace 10 min',
    read: false,
    priority: 'high',
    metadata: {
      clientId: 'cli-sol-1',
      clientName: 'Jorge Ramírez',
      clientPhone: '+1 (407) 555-9122',
      service: 'Medicare Advantage',
      leadSource: 'Micro-Landing Web'
    }
  }
];

export const INITIAL_SAAS_DELEGATED_ADMINS: SaasDelegatedAdmin[] = [
  {
    id: 'saas-adm-1',
    name: 'Víctor Aray (Super Admin)',
    email: 'victoraray8@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'super_admin',
    status: 'active',
    createdAt: '2026-01-01',
    allowedTenantIds: ['*'],
    permissions: {
      viewGlobalMetrics: true,
      viewTenantsList: true,
      createTenant: true,
      editTenantSettings: true,
      suspendTenant: true,
      viewSensitiveClientData: true,
      manageSaasAdmins: true,
      manageSaasLanding: true,
      exportGlobalReports: true
    }
  },
  {
    id: 'saas-adm-2',
    name: 'Lic. Fernando Rossi (Auditor de Métricas)',
    email: 'fernando.rossi@saasaudit.io',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    role: 'saas_auditor',
    status: 'active',
    createdAt: '2026-03-15',
    allowedTenantIds: ['*'],
    permissions: {
      viewGlobalMetrics: true,
      viewTenantsList: true,
      createTenant: false,
      editTenantSettings: false,
      suspendTenant: false,
      viewSensitiveClientData: false, // Limitación: ve métricas financieras y de uso, pero NO clientes sensibles
      manageSaasAdmins: false,
      manageSaasLanding: false,
      exportGlobalReports: true
    }
  },
  {
    id: 'saas-adm-3',
    name: 'Lucía Morales (Gerente de Cuentas / Onboarding)',
    email: 'lucia.onboarding@ateendiacloud.com',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: 'support_manager',
    status: 'active',
    createdAt: '2026-05-10',
    allowedTenantIds: ['tenant-optima', 'tenant-sol'], // Limitación: solo estas empresas asignadas
    permissions: {
      viewGlobalMetrics: true,
      viewTenantsList: true,
      createTenant: true,
      editTenantSettings: true,
      suspendTenant: false,
      viewSensitiveClientData: false,
      manageSaasAdmins: false,
      manageSaasLanding: true,
      exportGlobalReports: false
    }
  }
];

export const INITIAL_SAAS_LANDING_CONFIG: SaasLandingConfig = {
  crmName: 'Ateendia SaaS Cloud CRM',
  logoUrl: '',
  logoIconText: 'A',
  faviconUrl: 'https://api.iconify.design/lucide:shield-check.svg?color=%234f46e5',
  publicUrl: 'https://ateendia-crm.cloud',
  domainName: 'ateendia-crm.cloud',
  primaryColor: '#4f46e5',
  accentColor: '#10b981',
  heroBadge: '🚀 Ateendia Cloud CRM v3.0 • Especializado para Agencias de Seguros & Brokers',
  heroTitle: 'La Plataforma SaaS Integral para Escalar tu Agencia de Seguros',
  heroHighlight: 'con WhatsApp Multi-Línea e IA',
  heroSubtitle: 'Gestiona pólizas de salud ACA, vida y complementarios. Automatiza WhatsApp Cloud, conéctate a Issabel PBX, centraliza flujos n8n y brinda a cada asesor superpoderes con RAG Knowledge Base.',
  ctaPrimaryText: 'Comenzar Prueba Gratuita de 14 Días',
  ctaPrimaryUrl: '#pricing',
  ctaSecondaryText: 'Solicitar Demostración en Vivo',
  ctaSecondaryUrl: '#contacto',
  demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  headerNavItems: [
    { label: 'Funcionalidades', href: '#features' },
    { label: 'Planes & Precios', href: '#pricing' },
    { label: 'Seguridad Multiempresa', href: '#security' },
    { label: 'Casos de Éxito', href: '#testimonials' }
  ],
  features: [
    {
      icon: 'MessageSquare',
      title: 'WhatsApp Cloud Multi-Línea (WA1 + WA2)',
      description: 'Conecta 2 o más números de WhatsApp independientes por empresa (Oficial API Cloud o vinculación QR Web) con enrutamiento automático y chat simultáneo.',
      tag: 'Alta Conversión'
    },
    {
      icon: 'Sparkles',
      title: 'IA RAG & Base de Conocimientos Vectorial',
      description: 'Sube PDF de pólizas, tablas de subsidios y normativas ACA. El bot responde con precisión matemática citando fuentes exactas.',
      tag: 'Embeddings & RAG'
    },
    {
      icon: 'Building2',
      title: 'Arquitectura SaaS Multi-Empresa Estricta',
      description: 'Cada agencia cuenta con base de datos, catálogos, usuarios, líneas de WhatsApp y métricas 100% aisladas con cifrado de nivel bancario.',
      tag: 'Seguridad Total'
    },
    {
      icon: 'PhoneCall',
      title: 'Telefonía PBX Issabel & WebRTC Integrada',
      description: 'Softphone flotante, click-to-call, grabación de llamadas y registro CDR automático directamente en el expediente del cliente.',
      tag: 'Telefonía IP'
    },
    {
      icon: 'Kanban',
      title: 'Pipeline Visual & Miembros de Póliza',
      description: 'Seguimiento visual drag-and-drop de prospectos, miembros dependientes, primas APTC y cobros automatizados con anti-spam inteligente.',
      tag: 'Productividad'
    },
    {
      icon: 'Workflow',
      title: 'Automatizaciones n8n & Webhooks',
      description: 'Disparadores en tiempo real cuando cambia el estado de una póliza, llega un mensaje o se aproxima una fecha de pago.',
      tag: 'No-Code / Low-Code'
    }
  ],
  pricingPlans: [
    {
      id: 'plan-starter',
      name: 'Starter Agency',
      price: 79,
      billingPeriod: '/mes',
      description: 'Ideal para agentes independientes o agencias en crecimiento con hasta 5 asesores.',
      features: [
        'Hasta 5 Usuarios / Asesores',
        '1 Línea de WhatsApp Cloud (WA1)',
        'Hasta 1,500 Pólizas Activas',
        'Pipeline de Ventas y Recordatorios',
        'Central Telefónica Issabel PBX',
        'Soporte por Correo Electrónico'
      ]
    },
    {
      id: 'plan-pro',
      name: 'Pro Business',
      price: 149,
      billingPeriod: '/mes',
      popular: true,
      description: 'La opción más potente para agencias consolidadas que requieren IA y múltiples canales.',
      features: [
        'Hasta 12 Usuarios / Asesores',
        '2 Líneas de WhatsApp (WA1 + WA2 QR)',
        'Pólizas y Clientes Ilimitados',
        'IA Copilot & Base de Conocimientos RAG',
        'Webhooks e Integración con n8n',
        'Auditoría Inmutable & Doble Factor (2FA)',
        'Soporte Prioritario 24/7'
      ]
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise Master',
      price: 299,
      billingPeriod: '/mes',
      description: 'Para grandes corredurías, master brokers y franquicias de seguros.',
      features: [
        'Usuarios y Asesores Ilimitados',
        'Líneas de WhatsApp Ilimitadas',
        'Landing Pages Personalizadas por Sucursal',
        'Infraestructura Dedicada & Backups Diarios',
        'API Personalizada & Modelos IA Ajustados',
        'Account Manager Dedicado & Onboarding'
      ]
    }
  ],
  testimonials: [
    {
      name: 'Carlos Benítez',
      role: 'Director General',
      company: 'Florida Health Insurers',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      quote: 'Duplicamos la tasa de renovación durante el Open Enrollment gracias al bot con RAG y las alertas de vencimiento automáticas.',
      rating: 5
    },
    {
      name: 'Elena Santoro',
      role: 'Supervisora de Operaciones',
      company: 'Seguros Premier Miami',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      quote: 'El poder tener 2 líneas de WhatsApp (atención al cliente y ventas) en un solo CRM cambió por completo la dinámica de nuestro equipo.',
      rating: 5
    }
  ],
  complianceNotice: 'Conformidad HIPAA & Cifrado Bancario AES-256 en reposo y tránsito.',
  copyrightText: '© 2026 Ateendia Cloud Platform Inc. Todos los derechos reservados.',
  companyAddress: '1200 Brickell Ave, Suite 1900, Miami, FL 33131, USA',
  companyLegalName: 'Ateendia Cloud Technologies LLC',
  supportEmail: 'soporte@ateendiacloud.com',
  contactEmail: 'ventas@ateendiacloud.com',
  contactPhone: '+1 (800) 980-2910',
  isPublished: true,
  customSlug: 'https://ateendia-crm.cloud'
};

