import {
  SaasPlanFeatureLimit,
  SaasSmtpConfig,
  SaasNotificationTemplates,
  SaasWhatsAppCentralConfig,
  SaasPaymentReceipt
} from '../types';

export const DEFAULT_SAAS_PLANS: SaasPlanFeatureLimit[] = [
  {
    id: 'plan_starter',
    name: 'Starter Agency',
    price: 79,
    annualPrice: 790,
    billingPeriod: '/mes',
    popular: false,
    description: 'Ideal para agencias independientes y asesores que inician en el mercado de seguros.',
    maxUsers: 5,
    maxClients: 500,
    maxPolicies: 500,
    maxWhatsAppLines: 1,
    storageGb: 25,
    features: [
      'Hasta 5 Agentes / Usuarios',
      'Gestión de hasta 500 Clientes y Pólizas',
      '1 Línea Oficial de WhatsApp',
      'Micro-Landing Informativa de Agencia',
      'Gestión de Comisiones y Pagos',
      '25 GB Almacenamiento Seguro (AES-256)'
    ],
    enabledModules: {
      aiAssistant: true,
      campaigns: true,
      telephonyPBX: false,
      massImport: true,
      customFields: true,
      webhooks: false,
      advancedAutomations: false
    },
    status: 'active'
  },
  {
    id: 'plan_pro',
    name: 'Pro Business',
    price: 149,
    annualPrice: 1490,
    billingPeriod: '/mes',
    popular: true,
    description: 'Para agencias en crecimiento que necesitan automatización, IA y doble canal WhatsApp.',
    maxUsers: 15,
    maxClients: 5000,
    maxPolicies: 5000,
    maxWhatsAppLines: 2,
    storageGb: 100,
    features: [
      'Hasta 15 Agentes con Roles Granulares',
      'Hasta 5,000 Clientes y Pólizas Activas',
      '2 Líneas de WhatsApp con Distribución Round-Robin',
      'Centralita PBX Issabel / Asterisk con Softphone',
      'Asistente de IA Gemini & Búsqueda Vectorial',
      'Automatizaciones de Cumpleaños y Vencimientos',
      '100 GB Almacenamiento Cifrado'
    ],
    enabledModules: {
      aiAssistant: true,
      campaigns: true,
      telephonyPBX: true,
      massImport: true,
      customFields: true,
      webhooks: true,
      advancedAutomations: true
    },
    status: 'active'
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise Agency',
    price: 299,
    annualPrice: 2990,
    billingPeriod: '/mes',
    popular: false,
    description: 'Control corporativo total, llamadas ilimitadas, webhooks n8n y soporte prioritario 24/7.',
    maxUsers: 50,
    maxClients: 50000,
    maxPolicies: 50000,
    maxWhatsAppLines: 5,
    storageGb: 500,
    features: [
      'Hasta 50 Agentes / Supervisores',
      '50,000+ Clientes y Pólizas',
      'Hasta 5 Líneas de WhatsApp Asignadas',
      'Partición Dedicada y Webhooks n8n',
      'Campañas Masivas de WhatsApp y Correo SMTP',
      'Telefonía PBX Completa con Grabación de Llamadas',
      '500 GB Almacenamiento + Auditoría Forense'
    ],
    enabledModules: {
      aiAssistant: true,
      campaigns: true,
      telephonyPBX: true,
      massImport: true,
      customFields: true,
      webhooks: true,
      advancedAutomations: true
    },
    status: 'active'
  }
];

export const DEFAULT_SAAS_SMTP_CONFIG: SaasSmtpConfig = {
  host: 'ssl://smtp.gmail.com',
  port: 465,
  protocol: 'ssl',
  senderEmail: 'soporte.saas@ateendiacloudcrm.com',
  senderName: 'Ateendia Cloud CRM - Facturación Central',
  appPassword: 'hkmz fqtx jbvy plso',
  isConfigured: true,
  lastTestStatus: 'success',
  lastTestDate: '2026-09-01 08:30'
};

export const DEFAULT_SAAS_EMAIL_TEMPLATES: SaasNotificationTemplates = {
  paymentPending: {
    id: 'tpl_payment_pending',
    name: '1. Notificación: Pago en Revisión',
    subject: 'Tu solicitud y comprobante de pago para {{empresa}} están en revisión',
    description: 'Enviado automáticamente al registrar una nueva empresa o subir comprobante de renovación.',
    variables: ['{{usuario}}', '{{empresa}}', '{{plan}}', '{{monto}}', '{{referencia}}', '{{fecha}}'],
    enabled: true,
    body: `Hola {{usuario}},

Hemos recibido exitosamente el comprobante de pago por el monto de \${{monto}} USD para la suscripción al plan {{plan}} de tu empresa {{empresa}}.

📋 RESUMEN DE LA TRANSACCIÓN:
• Empresa: {{empresa}}
• Plan Seleccionado: {{plan}}
• N° Referencia / Transacción: {{referencia}}
• Fecha de Envío: {{fecha}}

🔍 ESTADO ACTUAL: EN REVISIÓN FINANCIERA
Nuestro departamento de conciliación bancaria está validando el depósito o transferencia. Tan pronto sea comprobado, recibirás por este mismo correo electrónico la notificación de HABILITACIÓN INMEDIATA de tu cuenta junto con tus credenciales de acceso iniciales y el enlace a tu sistema.

Si tienes alguna inquietud o requieres agilizar el proceso, puedes responder directamente a este correo o comunicarte con nuestro canal de soporte.

Atentamente,
Departamento de Facturación y Operaciones SaaS`
  },
  accountApproved: {
    id: 'tpl_account_approved',
    name: '2. Notificación: Cuenta Habilitada y Credenciales',
    subject: '¡Cuenta Habilitada! Bienvenido a tu sistema {{empresa}}',
    description: 'Enviado al aprobar el comprobante de pago y habilitar la empresa con sus fechas de vigencia.',
    variables: ['{{usuario}}', '{{empresa}}', '{{email}}', '{{password}}', '{{url_acceso}}', '{{plan}}', '{{fecha_inicio}}', '{{fecha_vencimiento}}'],
    enabled: true,
    body: `Estimado(a) {{usuario}},

¡Excelente noticia! Tu comprobante de pago ha sido verificado con éxito y la cuenta de tu empresa {{empresa}} ha sido HABILITADA oficialmente en nuestra plataforma.

🔑 CREDENCIALES DE ACCESO:
• Enlace de Acceso a tu CRM: {{url_acceso}}
• Usuario / Email Administrador: {{email}}
• Contraseña Temporal: {{password}}

📅 PERÍODO DE VIGENCIA DE TU PLAN ({{plan}}):
• Fecha de Habilitación / Inicio: {{fecha_inicio}}
• Próxima Fecha de Renovación: {{fecha_vencimiento}}

💡 RECOMENDACIÓN DE SEGURIDAD:
Al iniciar sesión por primera vez, te sugerimos ingresar al módulo de Configuración de Usuarios y actualizar tu contraseña personal, así como activar la Verificación en Dos Pasos (2FA) para máxima protección.

¡Mucho éxito gestionando tus prospectos, pólizas y agentes!

Atentamente,
Equipo de Soporte y Bienvenida Central SaaS`
  },
  planExpiring: {
    id: 'tpl_plan_expiring',
    name: '3. Notificación: Vencimiento de Plan y 5 Días de Gracia',
    subject: 'AVISO IMPORTANTE: Vencimiento de tu plan {{plan}} en {{empresa}}',
    description: 'Alerta automática cuando el plan está próximo a vencer o vencido con 5 días de gracia antes de corte.',
    variables: ['{{usuario}}', '{{empresa}}', '{{plan}}', '{{fecha_vencimiento}}', '{{fecha_corte_gracia}}', '{{monto_renovacion}}', '{{enlace_renovacion}}'],
    enabled: true,
    body: `Estimado(a) {{usuario}},

Te recordamos que la suscripción de tu empresa {{empresa}} correspondiente al plan {{plan}} tiene como fecha de vencimiento el {{fecha_vencimiento}}.

⏳ PLAZO DE GRACIA EXTRA (5 DÍAS):
Para garantizar que tus agentes de seguros no interrumpan la atención de clientes ni el seguimiento de pólizas, cuentas con un plazo de gracia de hasta 5 DÍAS CONTINUOS posteriores a tu fecha límite para realizar el pago de renovación.

⚠️ AVISO DE SUSPENSIÓN AUTOMÁTICA:
Si el pago de renovación no se registra y comprueba antes de la fecha límite de gracia ({{fecha_corte_gracia}}), el acceso a la plataforma para todos los usuarios de {{empresa}} será bloqueado automáticamente por el sistema hasta que se suba el nuevo comprobante y sea validado.

💳 DETALLES PARA RENOVAR:
• Monto de Renovación: \${{monto_renovacion}} USD
• Puedes realizar tu pago vía Zelle o Transferencia Bancaria y adjuntar tu comprobante en el siguiente enlace:
{{enlace_renovacion}}

Atentamente,
Departamento de Cobranzas y Suscripciones SaaS`
  },
  renewalApproved: {
    id: 'tpl_renewal_approved',
    name: '4. Notificación: Renovación de Plan Confirmada',
    subject: '¡Renovación Confirmada! Vigencia extendida para {{empresa}}',
    description: 'Enviado al comprobar un nuevo pago de renovación mensual o anual.',
    variables: ['{{usuario}}', '{{empresa}}', '{{plan}}', '{{fecha_inicio}}', '{{nueva_fecha_vencimiento}}', '{{monto}}'],
    enabled: true,
    body: `Estimado(a) {{usuario}},

Te confirmamos que el pago de renovación por \${{monto}} USD para el plan {{plan}} de tu empresa {{empresa}} ha sido validado satisfactoriamente.

✅ NUEVO PERÍODO DE VIGENCIA REGISTRADO:
• Vigencia activa desde: {{fecha_inicio}}
• Próximo vencimiento: {{nueva_fecha_vencimiento}}

Tu sistema se encuentra 100% al día. Todos tus agentes, líneas de WhatsApp y micro-landings continúan operando con normalidad.

¡Gracias por seguir creciendo con nosotros!

Atentamente,
Equipo de Facturación y Finanzas SaaS`
  },
  adminNewPaymentAlert: {
    id: 'tpl_admin_new_payment',
    name: '5. Alerta SuperAdmin: Nuevo Pago / Registro para Revisión',
    subject: '🔔 NUEVO COMPROBANTE RECIBIDO: {{empresa}} (\${{monto}} USD)',
    description: 'Enviado al correo del SuperAdmin con botón de aprobación rápida en 1 clic.',
    variables: ['{{empresa}}', '{{usuario}}', '{{email}}', '{{telefono}}', '{{plan}}', '{{monto}}', '{{referencia}}', '{{tipo_solicitud}}', '{{enlace_aprobacion}}'],
    enabled: true,
    body: `Se ha recibido un nuevo comprobante de pago en la plataforma Central SaaS:

📋 INFORMACIÓN DEL PAGO:
• Tipo de Solicitud: {{tipo_solicitud}}
• Empresa: {{empresa}}
• Contacto: {{usuario}} ({{email}})
• Teléfono WhatsApp: {{telefono}}
• Plan: {{plan}} (\${{monto}} USD)
• Referencia Bancaria: {{referencia}}

🔍 ACCIÓN REQUERIDA:
Por favor ingresa al Visor de Comprobantes de la Central SaaS para verificar el archivo adjunto y habilitar la empresa con sus fechas de vigencia:

➡️ Enlace de Aprobación Rápida:
{{enlace_aprobacion}}`
  }
};

export const DEFAULT_SAAS_WHATSAPP_CONFIG: SaasWhatsAppCentralConfig = {
  isConnected: true,
  connectedPhoneNumber: '+1 (786) 920-4100',
  qrCodeData: 'WASAAS-AUTH-CENTRAL-QR-SESSION-2026-ENCRYPTED-V9',
  lastConnectedAt: '2026-09-01 09:00',
  adminPhone1: '+1 (786) 555-0101',
  adminPhone2: '+1 (305) 555-0102',
  adminName1: 'Víctor Aray (Director SaaS)',
  adminName2: 'Supervisor de Finanzas',
  notifyOnNewRegistration: true,
  notifyOnPaymentSubmitted: true,
  notifyOnPlanExpiring: true,
  messageLog: [
    {
      id: 'wamsg-1',
      to: '+1 (786) 555-0101',
      recipientName: 'Víctor Aray (Director SaaS)',
      message: '🔔 [CENTRAL SAAS] Nuevo registro recibido: "Horizon Health Partners LLC" seleccionó el Plan Pro Business ($149). Comprobante adjunto listo para revisión.',
      timestamp: '2026-09-01 08:45',
      type: 'new_registration',
      status: 'read'
    },
    {
      id: 'wamsg-2',
      to: '+1 (305) 555-0102',
      recipientName: 'Supervisor de Finanzas',
      message: '💳 [CENTRAL SAAS] Comprobante de pago recibido de "Seguros Caracas Express" por $79 USD (Zelle ref: #ZL-993821).',
      timestamp: '2026-09-01 08:15',
      type: 'payment_review',
      status: 'delivered'
    }
  ]
};

// Initial mock payment receipts for testing visor & approvals
export const INITIAL_PAYMENT_RECEIPTS: SaasPaymentReceipt[] = [
  {
    id: 'rec-101',
    tenantId: 'tenant-horizon-health',
    tenantName: 'Horizon Health Partners',
    adminEmail: 'contacto@horizonhealth.com',
    adminName: 'Roberto Gómez',
    adminPhone: '+1 (786) 555-0188',
    planId: 'plan_pro',
    planName: 'Pro Business',
    amount: 149,
    currency: 'USD',
    billingCycle: 'monthly',
    paymentMethod: 'zelle',
    referenceNumber: 'ZEL-9948201',
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1000&auto=format&fit=crop&q=80',
    receiptFileName: 'comprobante_zelle_horizon_149usd.jpg',
    receiptFileType: 'image/jpeg',
    receiptFileSize: '1.2 MB',
    notes: 'Transferencia Zelle realizada desde cuenta comercial Chase a nombre de Horizon Health LLC.',
    submittedAt: '2026-09-01 08:45',
    status: 'pending',
    type: 'new_registration'
  },
  {
    id: 'rec-102',
    tenantId: 'tenant-seguros-valencia',
    tenantName: 'Seguros Valencia & Asociados',
    adminEmail: 'gerencia@segurosvalencia.com',
    adminName: 'Elena Martínez',
    adminPhone: '+1 (305) 555-0144',
    planId: 'plan_starter',
    planName: 'Starter Agency',
    amount: 79,
    currency: 'USD',
    billingCycle: 'monthly',
    paymentMethod: 'bank_transfer',
    referenceNumber: 'ACH-481920-BOA',
    receiptUrl: 'https://images.unsplash.com/photo-1568261340772-a279069d30ca?w=1000&auto=format&fit=crop&q=80',
    receiptFileName: 'transferencia_bancaria_boa_79usd.png',
    receiptFileType: 'image/png',
    receiptFileSize: '850 KB',
    notes: 'Pago mensual de renovación de pólizas.',
    submittedAt: '2026-08-31 16:20',
    status: 'approved',
    reviewedAt: '2026-08-31 17:00',
    reviewedBy: 'SuperAdmin',
    validFrom: '2026-09-01',
    validUntil: '2026-10-01',
    type: 'renewal'
  }
];
