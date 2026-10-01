-- =============================================================
-- Ateendia CRM 2.0 - Esquema MariaDB 11.4
-- Charset: utf8mb4 (soporta emojis y acentos correctamente)
-- Engine: InnoDB (transacciones ACID + foreign keys reales)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────
-- 1. TENANTS (Agencias / Organizaciones)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
    id              VARCHAR(64)  NOT NULL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    legal_name      VARCHAR(255) NULL,
    tax_id          VARCHAR(64)  NULL,
    logo_url        TEXT         NULL,
    primary_color   VARCHAR(16)  NOT NULL DEFAULT '#7c3aed',
    secondary_color VARCHAR(16)  NULL,
    accent_color    VARCHAR(16)  NULL,
    currency        VARCHAR(8)   NOT NULL DEFAULT 'USD',
    language        VARCHAR(8)   NOT NULL DEFAULT 'es',
    timezone        VARCHAR(64)  NOT NULL DEFAULT 'America/Caracas',
    country         VARCHAR(64)  NULL,
    city            VARCHAR(64)  NULL,
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    subdomain       VARCHAR(128) NULL UNIQUE,
    custom_domain   VARCHAR(255) NULL UNIQUE,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenants_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 2. SUBSCRIPTIONS (Suscripciones SaaS)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id                    VARCHAR(64)   NOT NULL PRIMARY KEY,
    tenant_id             VARCHAR(64)   NOT NULL UNIQUE,
    plan                  VARCHAR(64)   NOT NULL DEFAULT 'Pro Business',
    plan_id               VARCHAR(64)   NULL,
    status                VARCHAR(32)   NOT NULL DEFAULT 'active',
    monthly_price         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    renewal_date          DATETIME      NULL,
    start_date            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_quota            INT           NOT NULL DEFAULT 5,
    whatsapp_lines_quota  INT           NOT NULL DEFAULT 2,
    storage_gb            INT           NOT NULL DEFAULT 10,
    contact_email         VARCHAR(255)  NULL,
    billing_cycle         VARCHAR(16)   NOT NULL DEFAULT 'monthly',
    grace_period_days     INT           NOT NULL DEFAULT 5,
    last_payment_date     DATETIME      NULL,
    is_auto_suspended     TINYINT(1)    NOT NULL DEFAULT 0,
    created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_subs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 3. USERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                    VARCHAR(64)  NOT NULL PRIMARY KEY,
    tenant_id             VARCHAR(64)  NOT NULL,
    name                  VARCHAR(255) NOT NULL,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    password_hash         VARCHAR(255) NOT NULL,
    role                  VARCHAR(32)  NOT NULL DEFAULT 'agent',
    avatar                TEXT         NULL,
    phone                 VARCHAR(32)  NULL,
    extension             VARCHAR(16)  NULL,
    status                VARCHAR(16)  NOT NULL DEFAULT 'active',
    is_super_admin        TINYINT(1)   NOT NULL DEFAULT 0,
    commission_rate       DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    assigned_pipeline_id  VARCHAR(64)  NULL,
    two_factor_enabled    TINYINT(1)   NOT NULL DEFAULT 0,
    two_factor_secret     VARCHAR(255) NULL,
    is_platform_user      TINYINT(1)   NOT NULL DEFAULT 0,
    last_login            DATETIME     NULL,
    created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_users_tenant (tenant_id),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 3.1. ROLES (Sistema + custom por tenant)
-- tenant_id = NULL → rol global (del sistema SaaS)
-- tenant_id = valor → rol custom de un tenant específico
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id               VARCHAR(64)  NOT NULL PRIMARY KEY,
    tenant_id        VARCHAR(64)  NULL,
    `key`            VARCHAR(32)  NOT NULL,
    name             VARCHAR(128) NOT NULL,
    description      TEXT         NULL,
    is_system        TINYINT(1)   NOT NULL DEFAULT 0,
    is_platform_role TINYINT(1)   NOT NULL DEFAULT 0,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_roles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_per_tenant (tenant_id, `key`),
    INDEX idx_roles_tenant (tenant_id),
    INDEX idx_roles_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 3.2. ROLE_PERMISSIONS (permisos por rol)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
    id         VARCHAR(64)  NOT NULL PRIMARY KEY,
    role_id    VARCHAR(64)  NOT NULL,
    module     VARCHAR(64)  NOT NULL,
    action     VARCHAR(32)  NOT NULL,
    allowed    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_perm_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_perm_per_role (role_id, module, action),
    INDEX idx_perm_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 4. PIPELINES & STAGES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipelines (
    id          VARCHAR(64)  NOT NULL PRIMARY KEY,
    tenant_id   VARCHAR(64)  NOT NULL,
    name        VARCHAR(255) NOT NULL,
    is_default  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pipelines_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_pipelines_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pipeline_stages (
    id              VARCHAR(64)  NOT NULL PRIMARY KEY,
    pipeline_id     VARCHAR(64)  NOT NULL,
    name            VARCHAR(128) NOT NULL,
    color           VARCHAR(16)  NOT NULL DEFAULT '#6366f1',
    stage_order     INT          NOT NULL DEFAULT 0,
    win_probability INT          NOT NULL DEFAULT 100,
    CONSTRAINT fk_stages_pipeline FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    INDEX idx_stages_pipeline (pipeline_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 5. CLIENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
    id                VARCHAR(64)   NOT NULL PRIMARY KEY,
    tenant_id         VARCHAR(64)   NOT NULL,
    first_name        VARCHAR(128)  NOT NULL,
    last_name         VARCHAR(128)  NOT NULL,
    email             VARCHAR(255)  NULL,
    phone             VARCHAR(32)   NOT NULL,
    secondary_phone   VARCHAR(32)   NULL,
    birth_date        DATE          NULL,
    gender            VARCHAR(16)   NULL,
    id_number         VARCHAR(64)   NULL,
    address_json      JSON          NULL,
    marital_status    VARCHAR(32)   NULL,
    category          VARCHAR(64)   NOT NULL DEFAULT 'General',
    tags_json         JSON          NULL,
    status            VARCHAR(32)   NOT NULL DEFAULT 'Lead',
    assigned_agent_id VARCHAR(64)   NULL,
    pipeline_id       VARCHAR(64)   NULL,
    stage_id          VARCHAR(64)   NULL,
    deal_value        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    lead_source       VARCHAR(128)  NULL,
    custom_fields_json JSON         NULL,
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_clients_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_clients_agent  FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_clients_pipe   FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE SET NULL,
    CONSTRAINT fk_clients_stage  FOREIGN KEY (stage_id) REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    INDEX idx_clients_tenant (tenant_id),
    INDEX idx_clients_phone (phone),
    INDEX idx_clients_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 6. POLICIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policies (
    id                VARCHAR(64)   NOT NULL PRIMARY KEY,
    tenant_id         VARCHAR(64)   NOT NULL,
    client_id         VARCHAR(64)   NOT NULL,
    type_id            VARCHAR(64)  NULL,
    custom_fields_json JSON         NULL,
    type              VARCHAR(64)   NOT NULL,
    carrier           VARCHAR(128)  NOT NULL,
    plan_name         VARCHAR(255)  NOT NULL,
    policy_number     VARCHAR(64)   NOT NULL,
    effective_date    DATE          NOT NULL,
    expiration_date   DATE          NULL,
    monthly_premium   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    subsidy_aptc      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    client_portion    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_due_day   INT           NOT NULL DEFAULT 1,
    status            VARCHAR(32)   NOT NULL DEFAULT 'Activa',
    agent_id          VARCHAR(64)   NULL,
    custom_fields_json JSON         NULL,
    notes             TEXT          NULL,
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_policies_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_policies_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_policies_agent  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_policies_type FOREIGN KEY (type_id) REFERENCES policy_types(id) ON DELETE SET NULL,
    INDEX idx_policies_tenant (tenant_id),
    INDEX idx_policies_client (client_id),
    INDEX idx_policies_status (status),
    INDEX idx_policies_expiration (expiration_date)
    INDEX idx_policies_type (type_id),
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 7. POLICY MEMBERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_members (
    id            VARCHAR(64)  NOT NULL PRIMARY KEY,
    policy_id     VARCHAR(64)  NOT NULL,
    first_name    VARCHAR(128) NOT NULL,
    last_name     VARCHAR(128) NOT NULL,
    relationship  VARCHAR(64)  NOT NULL,
    birth_date    DATE         NULL,
    gender        VARCHAR(16)  NULL,
    id_number     VARCHAR(64)  NULL,
    tobacco_user  TINYINT(1)   NOT NULL DEFAULT 0,
    status        VARCHAR(32)  NOT NULL DEFAULT 'Activo',
    CONSTRAINT fk_members_policy FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE,
    INDEX idx_members_policy (policy_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 8. BANK ACCOUNTS & CARDS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_accounts (
    id                 VARCHAR(64)  NOT NULL PRIMARY KEY,
    tenant_id          VARCHAR(64)  NOT NULL,
    client_id          VARCHAR(64)  NOT NULL,
    type               VARCHAR(32)  NOT NULL DEFAULT 'bank_account',
    account_holder     VARCHAR(255) NOT NULL,
    holder_id_number   VARCHAR(64)  NULL,
    bank_name          VARCHAR(255) NOT NULL,
    routing_number     VARCHAR(32)  NULL,
    account_number     VARCHAR(64)  NOT NULL,
    account_type       VARCHAR(64)  NULL,
    payment_method     VARCHAR(64)  NULL,
    card_brand         VARCHAR(32)  NULL,
    card_number_masked VARCHAR(32)  NULL,
    card_exp_date      VARCHAR(8)   NULL,
    card_cvv           VARCHAR(8)   NULL,
    card_type          VARCHAR(16)  NULL,
    is_default         TINYINT(1)   NOT NULL DEFAULT 1,
    verified           TINYINT(1)   NOT NULL DEFAULT 0,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bank_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_bank_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_bank_tenant (tenant_id),
    INDEX idx_bank_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 9. WHATSAPP CONVERSATIONS & MESSAGES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id                VARCHAR(64)  NOT NULL PRIMARY KEY,
    tenant_id         VARCHAR(64)  NOT NULL,
    account           VARCHAR(8)   NOT NULL DEFAULT 'WA1',
    client_id         VARCHAR(64)  NULL,
    contact_name      VARCHAR(255) NOT NULL,
    contact_phone     VARCHAR(32)  NOT NULL,
    last_message      TEXT         NULL,
    last_message_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unread_count      INT          NOT NULL DEFAULT 0,
    assigned_agent_id VARCHAR(64)  NULL,
    channel_source    VARCHAR(32)  NOT NULL DEFAULT 'whatsapp',
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wa_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_wa_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    CONSTRAINT fk_wa_agent  FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_wa_tenant (tenant_id),
    INDEX idx_wa_phone (contact_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id              VARCHAR(64)  NOT NULL PRIMARY KEY,
    conversation_id VARCHAR(64)  NOT NULL,
    direction       VARCHAR(16)  NOT NULL,
    sender          VARCHAR(128) NOT NULL,
    sender_name     VARCHAR(255) NULL,
    sender_id       VARCHAR(64)  NULL,
    sender_avatar   TEXT         NULL,
    content         TEXT         NULL,
    media_type      VARCHAR(32)  NOT NULL DEFAULT 'text',
    media_url       TEXT         NULL,
    media_duration  INT          NULL,
    media_name      VARCHAR(255) NULL,
    media_size      VARCHAR(32)  NULL,
    status          VARCHAR(16)  NOT NULL DEFAULT 'sent',
    timestamp       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    INDEX idx_msg_conv (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 10. SMTP CONFIGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smtp_configs (
    id             VARCHAR(64)  NOT NULL PRIMARY KEY,
    tenant_id      VARCHAR(64)  NOT NULL UNIQUE,
    host           VARCHAR(255) NOT NULL,
    port           INT          NOT NULL,
    protocol       VARCHAR(16)  NOT NULL DEFAULT 'smtp',
    sender_email   VARCHAR(255) NOT NULL,
    sender_name    VARCHAR(255) NOT NULL,
    app_password   VARCHAR(255) NOT NULL,
    is_configured  TINYINT(1)   NOT NULL DEFAULT 1,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_smtp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 11. CALL RECORDS / CDR
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS call_records (
    id                 VARCHAR(64)  NOT NULL PRIMARY KEY,
    tenant_id          VARCHAR(64)  NOT NULL,
    client_id          VARCHAR(64)  NULL,
    agent_id           VARCHAR(64)  NOT NULL,
    agent_extension    VARCHAR(16)  NOT NULL,
    destination_number VARCHAR(32)  NOT NULL,
    direction          VARCHAR(16)  NOT NULL,
    status             VARCHAR(32)  NOT NULL,
    duration_seconds   INT          NOT NULL DEFAULT 0,
    recording_url      TEXT         NULL,
    notes              TEXT         NULL,
    timestamp          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cdr_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_cdr_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    CONSTRAINT fk_cdr_agent  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_cdr_tenant (tenant_id),
    INDEX idx_cdr_agent (agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 12. AUDIT LOGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id         VARCHAR(64)  NOT NULL PRIMARY KEY,
    tenant_id  VARCHAR(64)  NOT NULL,
    user_id    VARCHAR(64)  NOT NULL,
    user_name  VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action     VARCHAR(32)  NOT NULL,
    module     VARCHAR(64)  NOT NULL,
    target_id  VARCHAR(64)  NULL,
    details    TEXT         NULL,
    ip_address VARCHAR(64)  NULL,
    timestamp  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_audit_tenant (tenant_id),
    INDEX idx_audit_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 6.1. POLICY_CATEGORIES (Categorías de seguros)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_categories (
    id          VARCHAR(64)  NOT NULL PRIMARY KEY,
    key         VARCHAR(64)  NOT NULL UNIQUE,
    name        VARCHAR(128) NOT NULL,
    description TEXT         NULL,
    icon        VARCHAR(64)  NULL,
    color       VARCHAR(16)  NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_policy_cat_active (is_active),
    INDEX idx_policy_cat_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 6.2. POLICY_TYPES (Tipos de seguros)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_types (
    id          VARCHAR(64)  NOT NULL PRIMARY KEY,
    category_id VARCHAR(64)  NOT NULL,
    key         VARCHAR(64)  NOT NULL UNIQUE,
    name        VARCHAR(128) NOT NULL,
    short_name  VARCHAR(64)  NULL,
    description TEXT         NULL,
    icon        VARCHAR(64)  NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ptype_category FOREIGN KEY (category_id) REFERENCES policy_categories(id) ON DELETE RESTRICT,
    INDEX idx_ptype_category (category_id),
    INDEX idx_ptype_active (is_active),
    INDEX idx_ptype_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 6.3. POLICY_TYPE_SCHEMAS (Definición de campos por tipo)
-- Define dinámicamente los campos específicos de cada tipo de póliza
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_type_schemas (
    id            VARCHAR(64)   NOT NULL PRIMARY KEY,
    type_id       VARCHAR(64)   NOT NULL,
    field_key     VARCHAR(64)   NOT NULL,
    label         VARCHAR(128)  NOT NULL,
    description   TEXT          NULL,
    field_type    VARCHAR(32)   NOT NULL,
    options_json  JSON          NULL,
    default_value VARCHAR(255)  NULL,
    placeholder   VARCHAR(255)  NULL,
    is_required   TINYINT(1)    NOT NULL DEFAULT 0,
    section       VARCHAR(64)   NULL,
    sort_order    INT           NOT NULL DEFAULT 0,
    validation_json JSON        NULL,
    is_active     TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ptype_schema_type FOREIGN KEY (type_id) REFERENCES policy_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_field_per_type (type_id, field_key),
    INDEX idx_ptype_schema_type (type_id),
    INDEX idx_ptype_schema_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 6.4. POLICY_VERSIONS (Historial de cambios de pólizas)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_versions (
    id            VARCHAR(64)  NOT NULL PRIMARY KEY,
    policy_id     VARCHAR(64)  NOT NULL,
    version       INT          NOT NULL DEFAULT 1,
    changed_by    VARCHAR(64)  NOT NULL,
    change_reason VARCHAR(255) NULL,
    snapshot_json JSON         NOT NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pver_policy FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE,
    INDEX idx_pver_policy (policy_id),
    INDEX idx_pver_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 13. SAAS_PLANS (Planes de suscripción SaaS)
-- Editables por Super Admin SaaS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saas_plans (
    id                VARCHAR(64)   NOT NULL PRIMARY KEY,
    `key`             VARCHAR(64)   NOT NULL UNIQUE,
    name              VARCHAR(128)  NOT NULL,
    description       TEXT          NULL,
    price_monthly     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_quarterly   DECIMAL(10,2) NULL,
    price_annual      DECIMAL(10,2) NULL,
    currency          VARCHAR(8)    NOT NULL DEFAULT 'USD',
    max_users         INT           NOT NULL DEFAULT 5,
    max_clients       INT           NOT NULL DEFAULT 100,
    max_policies      INT           NOT NULL DEFAULT 200,
    max_whatsapp      INT           NOT NULL DEFAULT 1,
    max_telegram      INT           NOT NULL DEFAULT 0,
    storage_gb        INT           NOT NULL DEFAULT 5,
    max_messages_day  INT           NOT NULL DEFAULT 100,
    max_ai_tokens     INT           NOT NULL DEFAULT 0,
    features_json     JSON          NULL,
    message_retention_days INT      NOT NULL DEFAULT 30,
    is_active         TINYINT(1)    NOT NULL DEFAULT 1,
    is_public         TINYINT(1)    NOT NULL DEFAULT 1,
    popular           TINYINT(1)    NOT NULL DEFAULT 0,
    sort_order        INT           NOT NULL DEFAULT 0,
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_saas_plans_active (`is_active`),
    INDEX idx_saas_plans_public (`is_public`),
    INDEX idx_saas_plans_sort (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 14. SAAS_PAYMENT_METHODS (Métodos de pago SaaS)
-- Manual, crypto semi-automático, automático
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saas_payment_methods (
    id              VARCHAR(64)  NOT NULL PRIMARY KEY,
    `key`           VARCHAR(64)  NOT NULL UNIQUE,
    name            VARCHAR(128) NOT NULL,
    description     TEXT         NULL,
    `type`          VARCHAR(32)  NOT NULL DEFAULT 'manual',
    payment_data_json JSON       NULL,
    logo_url        TEXT         NULL,
    qr_code_url     TEXT         NULL,
    instructions    TEXT         NULL,
    crypto_network  VARCHAR(32)  NULL,
    crypto_symbol   VARCHAR(16)  NULL,
    crypto_wallet   VARCHAR(255) NULL,
    crypto_explorer_api VARCHAR(64) NULL,
    provider_config_json JSON    NULL,
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    status                 VARCHAR(32)  NOT NULL DEFAULT 'active',
    demo_expires_at        DATETIME     NULL,
    grace_period_ends_at   DATETIME     NULL,
    sort_order      INT          NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_payment_methods_active (`is_active`),
    INDEX idx_payment_methods_type (`type`),
    INDEX idx_payment_methods_sort (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 15. SAAS_PLATFORM_SETTINGS (Configuración global SaaS)
-- Fila única (id = 'global')
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saas_platform_settings (
    id                      VARCHAR(64)   NOT NULL PRIMARY KEY,
    demo_enabled            TINYINT(1)    NOT NULL DEFAULT 1,
    demo_duration_days      INT           NOT NULL DEFAULT 14,
    demo_grace_period_days  INT           NOT NULL DEFAULT 30,
    demo_requires_email     TINYINT(1)    NOT NULL DEFAULT 0,
    demo_watermark_enabled  TINYINT(1)    NOT NULL DEFAULT 1,
    demo_plan_id            VARCHAR(64)   NULL,
    default_currency        VARCHAR(8)    NOT NULL DEFAULT 'USD',
    grace_period_days       INT           NOT NULL DEFAULT 5,
    auto_suspend_on_expire  TINYINT(1)    NOT NULL DEFAULT 1,
    support_email           VARCHAR(255)  NULL,
    support_whatsapp        VARCHAR(32)   NULL,
    platform_name           VARCHAR(128)  NOT NULL DEFAULT 'Ateendia',
    created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 16. SAAS_REGISTRATION_REQUESTS (Registros de tenants)
-- Soporta: DEMO (gratis) + PAYMENT (pago)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saas_registration_requests (
    id                    VARCHAR(64)   NOT NULL PRIMARY KEY,
    `type`                VARCHAR(16)   NOT NULL DEFAULT 'payment',
    
    -- Datos de la empresa
    company_name          VARCHAR(255)  NOT NULL,
    company_tax_id        VARCHAR(64)   NULL,
    company_email         VARCHAR(255)  NOT NULL,
    company_phone         VARCHAR(32)   NOT NULL,
    company_country       VARCHAR(64)   NULL,
    company_city          VARCHAR(64)   NULL,
    
    -- Datos del admin
    admin_name            VARCHAR(255)  NOT NULL,
    admin_email           VARCHAR(255)  NOT NULL,
    admin_phone           VARCHAR(32)   NULL,
    admin_position        VARCHAR(128)  NULL,
    admin_password_hash   VARCHAR(255)  NOT NULL,
    
    -- Plan seleccionado
    plan_id               VARCHAR(64)   NOT NULL,
    plan_key              VARCHAR(64)   NOT NULL,
    plan_name             VARCHAR(128)  NOT NULL,
    billing_cycle         VARCHAR(16)   NOT NULL DEFAULT 'monthly',
    price_amount          DECIMAL(10,2) NOT NULL,
    currency              VARCHAR(8)    NOT NULL DEFAULT 'USD',
    
    -- Método de pago (solo si type='payment')
    payment_method_id     VARCHAR(64)   NULL,
    payment_method_key    VARCHAR(64)   NULL,
    payment_method_name   VARCHAR(128)  NULL,
    
    -- Comprobante
    receipt_url           TEXT          NULL,
    receipt_filename      VARCHAR(255)  NULL,
    receipt_file_size     VARCHAR(32)   NULL,
    receipt_uploaded_at   DATETIME      NULL,
    
    -- Crypto
    crypto_tx_hash        VARCHAR(255)  NULL,
    crypto_verified       TINYINT(1)    NULL,
    crypto_verified_at    DATETIME      NULL,
    
    -- Estado
    `status`              VARCHAR(32)   NOT NULL DEFAULT 'pending',
    reviewed_by           VARCHAR(64)   NULL,
    reviewed_at           DATETIME      NULL,
    review_notes          TEXT          NULL,
    rejection_reason      TEXT          NULL,
    created_tenant_id     VARCHAR(64)   NULL,
    created_user_id       VARCHAR(64)   NULL,
    
    -- Metadata
    ip_address            VARCHAR(64)   NULL,
    user_agent            TEXT          NULL,
    referral_source       VARCHAR(128)  NULL,
    created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at            DATETIME      NULL,
    
    CONSTRAINT fk_reg_plan 
        FOREIGN KEY (plan_id) REFERENCES saas_plans(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reg_method 
        FOREIGN KEY (payment_method_id) REFERENCES saas_payment_methods(id) ON DELETE RESTRICT,
    
    INDEX idx_reg_status (`status`),
    INDEX idx_reg_type (`type`),
    INDEX idx_reg_created (created_at),
    INDEX idx_reg_email (company_email),
    INDEX idx_reg_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;