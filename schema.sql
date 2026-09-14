-- Ateendia CRM - Schema SQL para Cloudflare D1 (SQLite)
-- Generado basado en los tipos y servicios del repositorio

-- ============================================
-- TABLAS PRINCIPALES DEL CRM
-- ============================================

-- Tabla de Tenants (Empresas/Clientes SaaS)
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_id TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#7c3aed',
    secondary_color TEXT,
    accent_color TEXT,
    currency TEXT DEFAULT 'USD',
    language TEXT DEFAULT 'es',
    timezone TEXT,
    country TEXT,
    city TEXT,
    is_active INTEGER DEFAULT 1,
    subdomain TEXT,
    custom_domain TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'supervisor', 'agent', 'readonly', 'super_admin')),
    avatar_url TEXT,
    phone TEXT,
    extension TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    commission_rate REAL,
    assigned_pipeline_id TEXT,
    two_factor_enabled INTEGER DEFAULT 0,
    last_login TEXT,
    is_super_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    secondary_phone TEXT,
    birth_date TEXT,
    gender TEXT CHECK (gender IN ('M', 'F', 'Otro')),
    id_number TEXT,
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip_code TEXT,
    address_country TEXT,
    marital_status TEXT,
    category TEXT,
    tags TEXT, -- JSON array
    status TEXT DEFAULT 'Lead' CHECK (status IN ('Lead', 'Contactado', 'Cotizado', 'Cerrado/Ganado', 'Cliente Activo', 'Inactivo', 'Perdido')),
    assigned_agent_id TEXT NOT NULL,
    pipeline_id TEXT,
    stage_id TEXT,
    deal_value REAL,
    lead_source TEXT,
    custom_fields TEXT, -- JSON
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de Pólizas
CREATE TABLE IF NOT EXISTS policies (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_name TEXT,
    type TEXT CHECK (type IN ('Salud/ACA', 'Vida', 'Complementario', 'Dental/Visión', 'Accidentes', 'Gastos Médicos')),
    carrier TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    policy_number TEXT NOT NULL UNIQUE,
    effective_date TEXT NOT NULL,
    expiration_date TEXT,
    monthly_premium REAL NOT NULL,
    subsidy_aptec REAL,
    client_portion REAL NOT NULL,
    payment_due_day INTEGER CHECK (payment_due_day >= 1 AND payment_due_day <= 31),
    status TEXT DEFAULT 'En Proceso' CHECK (status IN ('Activa', 'En Proceso', 'Pendiente de Pago', 'Vencida', 'Cancelada', 'Renovada')),
    agent_id TEXT NOT NULL,
    members TEXT, -- JSON array de PolicyMember
    custom_fields TEXT, -- JSON
    version_history TEXT, -- JSON array
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de Cuentas Bancarias / Métodos de Pago
CREATE TABLE IF NOT EXISTS bank_accounts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_name TEXT,
    type TEXT DEFAULT 'bank_account' CHECK (type IN ('bank_account', 'credit_card')),
    account_holder TEXT NOT NULL,
    holder_id_number TEXT,
    bank_name TEXT NOT NULL,
    routing_number TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_type TEXT CHECK (account_type IN ('Checking / Corriente', 'Savings / Ahorros', 'Tarjeta Débito/Crédito')),
    payment_method TEXT CHECK (payment_method IN ('ACH Débito Automático', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'Ventanilla')),
    card_brand TEXT CHECK (card_brand IN ('Visa', 'Mastercard', 'Amex', 'Discover', 'Otro')),
    card_holder TEXT,
    card_number TEXT,
    card_exp_month TEXT,
    card_exp_year TEXT,
    card_exp_date TEXT,
    card_cvv TEXT,
    card_type TEXT CHECK (card_type IN ('Crédito', 'Débito')),
    is_default INTEGER DEFAULT 0,
    verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Tabla de Documentos de Clientes
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    file_url TEXT,
    preview_url TEXT,
    file_size TEXT,
    expiration_date TEXT,
    uploaded_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'Válido' CHECK (status IN ('Válido', 'Por Vencer', 'Vencido', 'Pendiente de Revisión')),
    verified_by TEXT,
    description TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Tabla de Notas de Clientes
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT,
    user_avatar TEXT,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'General' CHECK (category IN ('General', 'Llamada', 'Reunión', 'Cobranza', 'Reclamo', 'WhatsApp')),
    images TEXT, -- JSON array
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de Actividades de Clientes
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('call', 'whatsapp', 'email', 'stage_change', 'policy_added', 'status_update', 'note')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    metadata TEXT, -- JSON
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- PIPELINES Y ETAPAS
-- ============================================

-- Tabla de Pipelines
CREATE TABLE IF NOT EXISTS pipelines (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    stages TEXT NOT NULL, -- JSON array de PipelineStage
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================
-- WHATSAPP & MENSAJERÍA
-- ============================================

-- Tabla de Configuración de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    active_account_tab TEXT DEFAULT 'WA1' CHECK (active_account_tab IN ('WA1', 'WA2')),
    selected_pipeline_id TEXT,
    default_pipeline_id TEXT,
    connection_type TEXT DEFAULT 'qr_bridge' CHECK (connection_type IN ('cloud_api', 'chatwoot', 'qr_bridge')),
    phone_number_id TEXT,
    waba_id TEXT,
    access_token TEXT,
    chatwoot_url TEXT,
    chatwoot_api_key TEXT,
    chatwoot_account_id TEXT,
    qr_connected INTEGER DEFAULT 0,
    connected_phone TEXT,
    webhook_url TEXT,
    wa1_config TEXT, -- JSON de WhatsAppAccountConfig
    wa2_config TEXT, -- JSON de WhatsAppAccountConfig
    alert_recipients TEXT, -- JSON array
    change_log TEXT, -- JSON array
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabla de Conversaciones de WhatsApp
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account TEXT CHECK (account IN ('WA1', 'WA2')),
    client_id TEXT,
    contact_name TEXT NOT NULL,
    client_name TEXT,
    contact_phone TEXT NOT NULL,
    client_phone TEXT,
    last_message TEXT,
    last_message_time TEXT,
    unread_count INTEGER DEFAULT 0,
    assigned_agent_id TEXT,
    channel_source TEXT DEFAULT 'whatsapp' CHECK (channel_source IN ('whatsapp', 'instagram', 'facebook', 'landing')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de Mensajes
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    sender TEXT NOT NULL,
    sender_name TEXT,
    sender_id TEXT,
    sender_role TEXT,
    sender_avatar TEXT,
    content TEXT NOT NULL,
    text TEXT,
    media_type TEXT CHECK (media_type IN ('text', 'image', 'audio', 'video', 'sticker', 'gif', 'document')),
    media_url TEXT,
    media_duration INTEGER,
    media_name TEXT,
    media_size TEXT,
    reactions TEXT, -- JSON array
    timestamp TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    attachments TEXT, -- JSON array
    channel_source TEXT CHECK (channel_source IN ('whatsapp', 'instagram', 'facebook', 'landing')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- ============================================
-- CONFIGURACIÓN SMTP & EMAIL
-- ============================================

-- Tabla de Configuración SMTP (Tenant)
CREATE TABLE IF NOT EXISTS smtp_config (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    protocol TEXT DEFAULT 'smtp' CHECK (protocol IN ('smtp')),
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    sender_email TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    app_password TEXT NOT NULL,
    is_configured INTEGER DEFAULT 0,
    last_tested_at TEXT,
    test_status TEXT CHECK (test_status IN ('success', 'failed')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabla de Plantillas de Mensajes
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'both')),
    category TEXT NOT NULL CHECK (category IN ('Cobranza', 'Cumpleaños', 'Renovación ACA', 'Bienvenida', 'Documento Requerido', 'Confirmación de Cita', 'General')),
    subject TEXT,
    body TEXT NOT NULL,
    variables TEXT, -- JSON array
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabla de Logs de Email
CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    to_address TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
    error TEXT,
    sent_at TEXT DEFAULT (datetime('now')),
    client_id TEXT,
    template_id TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================
-- CHAT INTERNO
-- ============================================

-- Tabla de Canales de Chat
CREATE TABLE IF NOT EXISTS chat_channels (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_private INTEGER DEFAULT 0,
    member_user_ids TEXT, -- JSON array
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabla de Mensajes de Chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    channel_id TEXT,
    channel TEXT,
    recipient_user_id TEXT,
    sender_user_id TEXT NOT NULL,
    sender_id TEXT,
    sender_name TEXT NOT NULL,
    sender_avatar TEXT,
    content TEXT NOT NULL,
    text TEXT,
    media_type TEXT CHECK (media_type IN ('text', 'image', 'audio', 'video', 'sticker', 'gif', 'document')),
    media_url TEXT,
    media_duration INTEGER,
    media_name TEXT,
    media_size TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    reactions TEXT, -- JSON array
    FOREIGN KEY (channel_id) REFERENCES chat_channels(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- TELEFONÍA (ISSABEL/PBX)
-- ============================================

-- Tabla de Configuración de Issabel
CREATE TABLE IF NOT EXISTS issabel_config (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    host TEXT NOT NULL,
    ami_port INTEGER NOT NULL,
    ami_user TEXT NOT NULL,
    ami_secret TEXT NOT NULL,
    webrtc_wss_url TEXT,
    default_context TEXT DEFAULT 'from-internal',
    is_connected INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabla de Registros de Llamadas (CDR)
CREATE TABLE IF NOT EXISTS call_records (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    client_id TEXT,
    client_name TEXT,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    agent_extension TEXT NOT NULL,
    extension TEXT,
    destination_number TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    status TEXT NOT NULL CHECK (status IN ('ANSWERED', 'NO ANSWER', 'BUSY', 'FAILED')),
    disposition TEXT,
    duration_seconds INTEGER NOT NULL,
    duration INTEGER,
    recording_url TEXT,
    notes TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    start_time TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- CAMPAÑAS
-- ============================================

-- Tabla de Campañas
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
    template_id TEXT NOT NULL,
    target_segment TEXT, -- JSON
    total_audience INTEGER NOT NULL,
    target_audience_count INTEGER,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    replied_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Programada', 'En Ejecución', 'Completada')),
    scheduled_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL
);

-- ============================================
-- AUDITORÍA
-- ============================================

-- Tabla de Logs de Auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'CALL', 'SEND_MESSAGE', 'STATUS_CHANGE')),
    module TEXT NOT NULL CHECK (module IN ('Clientes', 'Pólizas', 'Pipeline', 'WhatsApp', 'Email', 'Bancos', 'Telefonía', 'Configuración', 'Usuarios', 'Campañas', 'Integraciones')),
    target_id TEXT,
    target_name TEXT,
    entity_id TEXT,
    details TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- CAMPOS PERSONALIZADOS
-- ============================================

-- Tabla de Definiciones de Campos Personalizados
CREATE TABLE IF NOT EXISTS custom_fields (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'policy')),
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'boolean', 'email', 'phone')),
    options TEXT, -- JSON array para select
    required INTEGER DEFAULT 0,
    section TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================
-- CATÁLOGOS MAESTROS
-- ============================================

-- Tabla de Catálogos Maestros
CREATE TABLE IF NOT EXISTS catalogs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    carriers TEXT, -- JSON array
    plans TEXT, -- JSON object {carrier: [plans]}
    health_plans TEXT, -- JSON object
    lead_sources TEXT, -- JSON array
    client_categories TEXT, -- JSON array
    document_types TEXT, -- JSON array
    banks TEXT, -- JSON array
    payment_methods TEXT, -- JSON array
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================
-- INTEGRACIONES (N8N, AI, etc.)
-- ============================================

-- Tabla de Configuración N8N
CREATE TABLE IF NOT EXISTS n8n_config (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    instance_url TEXT,
    api_token TEXT,
    webhook_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    is_enabled INTEGER DEFAULT 0,
    active_events TEXT, -- JSON array
    triggers TEXT, -- JSON array
    last_triggered_at TEXT,
    last_response_status INTEGER,
    logs TEXT, -- JSON array
    webhook_logs TEXT, -- JSON array
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabla de Configuración de IA
CREATE TABLE IF NOT EXISTS ai_config (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL CHECK (provider IN ('openrouter', 'gemini', 'openai', 'anthropic', 'claude', 'deepseek', 'custom')),
    api_key TEXT NOT NULL,
    custom_base_url TEXT,
    model TEXT NOT NULL,
    model_name TEXT,
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    system_prompt TEXT,
    rag_enabled INTEGER DEFAULT 0,
    rag_top_k INTEGER DEFAULT 5,
    confidence_threshold REAL,
    auto_responder_channels TEXT, -- JSON array
    auto_responder_config TEXT, -- JSON
    knowledge_documents TEXT, -- JSON array
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabla de Reglas Programadas
CREATE TABLE IF NOT EXISTS scheduled_rules (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('birthday', 'doc_expiry', 'document_expiry', 'payment_due', 'pipeline_inactivity')),
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'both')),
    enabled INTEGER DEFAULT 1,
    is_enabled INTEGER DEFAULT 1,
    scheduled_time TEXT NOT NULL,
    days_before INTEGER,
    days_offset INTEGER,
    template_id TEXT NOT NULL,
    custom_message TEXT,
    target_count INTEGER,
    sent_count_today INTEGER DEFAULT 0,
    total_executed INTEGER DEFAULT 0,
    last_run_at TEXT,
    next_run_at TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL
);

-- Tabla de Configuración Anti-Spam
CREATE TABLE IF NOT EXISTS antispam_settings (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    whatsapp_daily_limit INTEGER DEFAULT 100,
    max_daily_whatsapp INTEGER DEFAULT 100,
    whatsapp_sent_today INTEGER DEFAULT 0,
    email_daily_limit INTEGER DEFAULT 100,
    max_daily_email INTEGER DEFAULT 100,
    email_sent_today INTEGER DEFAULT 0,
    min_interval_seconds INTEGER DEFAULT 30,
    max_interval_seconds INTEGER DEFAULT 300,
    randomize_delay INTEGER DEFAULT 1,
    random_jitter INTEGER DEFAULT 1,
    alert_on_spam_risk INTEGER DEFAULT 1,
    auto_pause_on_high_failure_rate INTEGER DEFAULT 1,
    last_reset_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================
-- NOTIFICACIONES Y ALERTAS
-- ============================================

-- Tabla de Notificaciones de la Aplicación
CREATE TABLE IF NOT EXISTS app_notifications (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('web_lead', 'whatsapp_message', 'policy_status_change', 'policy_created', 'client_registered', 'document_expired', 'payment_due', 'deal_won', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    read INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    metadata TEXT, -- JSON
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabla de Alertas del Sistema
CREATE TABLE IF NOT EXISTS system_alerts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('birthday_today', 'birthday_week', 'expiring_document', 'upcoming_payment', 'lead_stale')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    policy_id TEXT,
    due_date TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ============================================
-- SAAS CENTRAL (Administración Multi-Tenant)
-- ============================================

-- Tabla de Planes SaaS
CREATE TABLE IF NOT EXISTS saas_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    annual_price REAL,
    billing_period TEXT NOT NULL,
    popular INTEGER DEFAULT 0,
    description TEXT NOT NULL,
    max_users INTEGER NOT NULL,
    max_clients INTEGER NOT NULL,
    max_policies INTEGER NOT NULL,
    max_whatsapp_lines INTEGER NOT NULL,
    storage_gb INTEGER NOT NULL,
    features TEXT, -- JSON array
    enabled_modules TEXT, -- JSON object
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabla de Recibos de Pago SaaS
CREATE TABLE IF NOT EXISTS saas_receipts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    tenant_name TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    admin_name TEXT NOT NULL,
    admin_phone TEXT,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    amount REAL NOT NULL,
    amount_paid REAL,
    currency TEXT DEFAULT 'USD',
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('zelle', 'bank_transfer', 'credit_card', 'crypto_usdt', 'other')),
    reference_number TEXT,
    receipt_url TEXT NOT NULL,
    receipt_image_url TEXT,
    receipt_file_name TEXT NOT NULL,
    receipt_file_type TEXT NOT NULL,
    receipt_file_size TEXT,
    notes TEXT,
    submitted_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_at TEXT,
    reviewed_by TEXT,
    rejection_reason TEXT,
    valid_from TEXT,
    valid_until TEXT,
    type TEXT NOT NULL CHECK (type IN ('new_registration', 'renewal', 'plan_upgrade')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabla de Configuración SMTP SaaS Central
CREATE TABLE IF NOT EXISTS saas_smtp (
    id TEXT PRIMARY KEY,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    protocol TEXT NOT NULL CHECK (protocol IN ('ssl', 'tls', 'smtp')),
    sender_email TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    app_password TEXT NOT NULL,
    is_configured INTEGER DEFAULT 0,
    last_test_status TEXT CHECK (last_test_status IN ('success', 'failed')),
    last_test_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabla de Plantillas de Notificación SaaS
CREATE TABLE IF NOT EXISTS saas_notif_templates (
    id TEXT PRIMARY KEY,
    payment_pending TEXT, -- JSON de SaasEmailTemplateItem
    account_approved TEXT, -- JSON de SaasEmailTemplateItem
    plan_expiring TEXT, -- JSON de SaasEmailTemplateItem
    renewal_approved TEXT, -- JSON de SaasEmailTemplateItem
    admin_new_payment_alert TEXT, -- JSON de SaasEmailTemplateItem
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabla de WhatsApp Central SaaS
CREATE TABLE IF NOT EXISTS saas_wa_central (
    id TEXT PRIMARY KEY,
    is_connected INTEGER DEFAULT 0,
    connected_phone_number TEXT,
    qr_code_data TEXT,
    last_connected_at TEXT,
    admin_phone_1 TEXT NOT NULL,
    admin_phone_2 TEXT NOT NULL,
    admin_name_1 TEXT,
    admin_name_2 TEXT,
    notify_on_new_registration INTEGER DEFAULT 1,
    notify_on_payment_submitted INTEGER DEFAULT 1,
    notify_on_plan_expiring INTEGER DEFAULT 1,
    message_log TEXT, -- JSON array
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabla de Administradores Delegados SaaS
CREATE TABLE IF NOT EXISTS saas_delegated_admins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar TEXT,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'saas_auditor', 'support_manager', 'custom_delegated')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT DEFAULT (datetime('now')),
    allowed_tenant_ids TEXT, -- JSON array
    permissions TEXT -- JSON de SaasDelegatedAdminPermissions
);

-- Tabla de Configuración de Landing SaaS
CREATE TABLE IF NOT EXISTS saas_landing_config (
    id TEXT PRIMARY KEY,
    crm_name TEXT NOT NULL,
    logo_url TEXT,
    logo_icon_text TEXT,
    favicon_url TEXT,
    public_url TEXT NOT NULL,
    primary_color TEXT NOT NULL,
    accent_color TEXT,
    hero_badge TEXT NOT NULL,
    hero_title TEXT NOT NULL,
    hero_highlight TEXT NOT NULL,
    hero_subtitle TEXT NOT NULL,
    cta_primary_text TEXT NOT NULL,
    cta_primary_url TEXT,
    cta_secondary_text TEXT,
    cta_secondary_url TEXT,
    demo_video_url TEXT,
    header_nav_items TEXT, -- JSON array
    features TEXT, -- JSON array
    pricing_plans TEXT, -- JSON array
    testimonials TEXT, -- JSON array
    compliance_notice TEXT,
    copyright_text TEXT,
    company_address TEXT,
    company_legal_name TEXT,
    support_email TEXT,
    domain_name TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    is_published INTEGER DEFAULT 0,
    custom_slug TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabla de Configuración de Landing por Tenant
CREATE TABLE IF NOT EXISTS tenant_landing_config (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    is_enabled INTEGER DEFAULT 0,
    agency_name TEXT NOT NULL,
    logo_url TEXT,
    favicon_url TEXT,
    tagline TEXT NOT NULL,
    hero_headline TEXT,
    hero_subtitle TEXT,
    hero_image TEXT,
    banner_gradient TEXT,
    badge_text TEXT,
    about_title TEXT,
    about_text TEXT NOT NULL,
    whatsapp_direct_number TEXT NOT NULL,
    whatsapp_welcome_msg TEXT,
    call_direct_number TEXT NOT NULL,
    contact_email TEXT,
    office_address TEXT NOT NULL,
    office_hours TEXT NOT NULL,
    carriers_offered TEXT, -- JSON array
    services_offered TEXT, -- JSON array
    testimonials TEXT, -- JSON array
    quote_form_enabled INTEGER DEFAULT 1,
    quote_form_title TEXT,
    quote_form_subtitle TEXT,
    assigned_agent_id TEXT,
    lead_capture_pipeline_id TEXT,
    lead_capture_stage_id TEXT,
    default_lead_source TEXT,
    slug TEXT NOT NULL UNIQUE,
    custom_domain TEXT,
    theme_color TEXT,
    secondary_color TEXT,
    social_links TEXT, -- JSON array
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabla de Suscripciones de Tenant
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL,
    plan_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'trial', 'suspended', 'past_due', 'pending_payment', 'inactive')),
    monthly_price REAL NOT NULL,
    renewal_date TEXT NOT NULL,
    start_date TEXT,
    user_quota INTEGER NOT NULL,
    whatsapp_lines_quota INTEGER NOT NULL,
    storage_gb INTEGER NOT NULL,
    contact_email TEXT,
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
    grace_period_days INTEGER DEFAULT 5,
    last_payment_date TEXT,
    last_payment_receipt_id TEXT,
    is_auto_suspended INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabla de Configuración de Base de Datos SaaS
CREATE TABLE IF NOT EXISTS saas_database (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    provider TEXT CHECK (provider IN ('local', 'pocketbase', 'supabase', 'firebase', 'mongodb', 'postgresql')),
    engine TEXT CHECK (engine IN ('local', 'pocketbase', 'supabase', 'firebase', 'mongodb', 'postgresql')),
    status TEXT CHECK (status IN ('connected', 'disconnected', 'error', 'syncing')),
    pocketbase_config TEXT, -- JSON
    supabase_config TEXT, -- JSON
    firebase_config TEXT, -- JSON
    mongodb_config TEXT, -- JSON
    postgresql_config TEXT, -- JSON
    instance_url TEXT,
    host TEXT,
    port INTEGER,
    database_name TEXT,
    username TEXT,
    password TEXT,
    api_key TEXT,
    service_role_key TEXT,
    project_id TEXT,
    client_email TEXT,
    private_key TEXT,
    connection_string TEXT,
    ssl_mode TEXT CHECK (ssl_mode IN ('disable', 'require', 'verify-full', 'prefer')),
    auto_sync INTEGER DEFAULT 0,
    is_connected INTEGER DEFAULT 0,
    latency_ms INTEGER,
    last_tested_at TEXT,
    last_sync_at TEXT,
    tables_count INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabla de Configuración de VPS SaaS
CREATE TABLE IF NOT EXISTS saas_vps (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    provider TEXT CHECK (provider IN ('hetzner', 'contabo', 'ovh', 'digitalocean', 'aws', 'linode', 'hostinger', 'vultr', 'ubuntu', 'debian', 'docker', 'coolify', 'caprover', 'custom')),
    server_ip TEXT NOT NULL,
    ssh_port INTEGER NOT NULL,
    ssh_user TEXT NOT NULL,
    ssh_key_name TEXT,
    deploy_path TEXT,
    primary_domain TEXT NOT NULL,
    wildcard_domain TEXT,
    domain TEXT,
    certbot_email TEXT NOT NULL,
    app_port INTEGER NOT NULL,
    node_env TEXT DEFAULT 'production' CHECK (node_env IN ('production', 'staging', 'development')),
    use_docker INTEGER DEFAULT 0,
    use_nginx INTEGER DEFAULT 0,
    use_certbot_ssl INTEGER DEFAULT 0,
    ssl_enabled INTEGER DEFAULT 0,
    nginx_configured INTEGER DEFAULT 0,
    jwt_secret TEXT,
    encryption_key TEXT,
    backup_schedule TEXT CHECK (backup_schedule IN ('hourly', 'daily', 'weekly')),
    backup_retention_days INTEGER,
    contabo_config TEXT, -- JSON
    ovh_config TEXT, -- JSON
    hetzner_config TEXT, -- JSON
    digitalocean_config TEXT, -- JSON
    aws_config TEXT, -- JSON
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- ============================================

-- Índices en tabla users
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Índices en tabla clients
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_agent ON clients(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_category ON clients(category);
CREATE INDEX IF NOT EXISTS idx_clients_pipeline_stage ON clients(pipeline_id, stage_id);

-- Índices en tabla policies
CREATE INDEX IF NOT EXISTS idx_policies_tenant_id ON policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policies_client_id ON policies(client_id);
CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_policies_carrier ON policies(carrier);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_agent_id ON policies(agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_effective_date ON policies(effective_date);

-- Índices en tabla bank_accounts
CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant_id ON bank_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_client_id ON bank_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_type ON bank_accounts(type);

-- Índices en tabla documents
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiration_date ON documents(expiration_date);

-- Índices en tabla notes
CREATE INDEX IF NOT EXISTS idx_notes_tenant_id ON notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notes_client_id ON notes(client_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

-- Índices en tabla activities
CREATE INDEX IF NOT EXISTS idx_activities_tenant_id ON activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_client_id ON activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);

-- Índices en tabla conversations
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_phone ON conversations(contact_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_agent ON conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_time ON conversations(last_message_time);

-- Índices en tabla messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- Índices en tabla templates
CREATE INDEX IF NOT EXISTS idx_templates_tenant_id ON templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_templates_channel ON templates(channel);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);

-- Índices en tabla email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_tenant_id ON email_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Índices en tabla call_records
CREATE INDEX IF NOT EXISTS idx_call_records_tenant_id ON call_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_call_records_client_id ON call_records(client_id);
CREATE INDEX IF NOT EXISTS idx_call_records_agent_id ON call_records(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_records_timestamp ON call_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_call_records_direction ON call_records(direction);

-- Índices en tabla campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_channel ON campaigns(channel);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_date ON campaigns(scheduled_date);

-- Índices en tabla audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Índices en tabla custom_fields
CREATE INDEX IF NOT EXISTS idx_custom_fields_tenant_id ON custom_fields(tenant_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity_type ON custom_fields(entity_type);

-- Índices en tabla scheduled_rules
CREATE INDEX IF NOT EXISTS idx_scheduled_rules_tenant_id ON scheduled_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_rules_trigger_type ON scheduled_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_rules_enabled ON scheduled_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_scheduled_rules_next_run_at ON scheduled_rules(next_run_at);

-- Índices en tabla app_notifications
CREATE INDEX IF NOT EXISTS idx_app_notifications_tenant_id ON app_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_app_notifications_type ON app_notifications(type);
CREATE INDEX IF NOT EXISTS idx_app_notifications_read ON app_notifications(read);
CREATE INDEX IF NOT EXISTS idx_app_notifications_timestamp ON app_notifications(timestamp);

-- Índices en tabla system_alerts
CREATE INDEX IF NOT EXISTS idx_system_alerts_tenant_id ON system_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_client_id ON system_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_read ON system_alerts(read);

-- Índices en tabla saas_receipts
CREATE INDEX IF NOT EXISTS idx_saas_receipts_tenant_id ON saas_receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saas_receipts_status ON saas_receipts(status);
CREATE INDEX IF NOT EXISTS idx_saas_receipts_submitted_at ON saas_receipts(submitted_at);

-- Índices en tabla tenant_subscriptions
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_renewal_date ON tenant_subscriptions(renewal_date);
