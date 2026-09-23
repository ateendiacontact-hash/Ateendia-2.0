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
    last_login            DATETIME     NULL,
    created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_users_tenant (tenant_id),
    INDEX idx_users_email (email)
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
    INDEX idx_policies_tenant (tenant_id),
    INDEX idx_policies_client (client_id),
    INDEX idx_policies_status (status),
    INDEX idx_policies_expiration (expiration_date)
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

SET FOREIGN_KEY_CHECKS = 1;