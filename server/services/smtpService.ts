// ===========================================
// server/services/smtpService.ts
// Configuración de SMTP y envío de emails por tenant.
//
// Uso: cada tenant configura su propio SMTP.
// Permite enviar emails transaccionales desde el CRM
// usando la identidad de cada agencia.
//
// Seguridad:
//   - app_password NUNCA se devuelve al frontend (enmascarado).
//   - Solo se accede con permiso email:configure.
// ===========================================

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { prisma } from '../db.js';

// ─── Tipos ───

export interface SaveSmtpConfigInput {
  tenantId: string;
  host: string;
  port: number;
  protocol: 'ssl' | 'tls' | 'smtp';
  senderEmail: string;
  senderName: string;
  appPassword: string;
}

export interface TestSmtpInput {
  tenantId: string;
}

export interface SendTestEmailInput {
  tenantId: string;
  to: string;
  subject?: string;
  body?: string;
}

// ─── Helpers ───

/**
 * Enmascara el password para no exponerlo en responses.
 * Muestra solo los últimos 2 caracteres si el password tiene más de 4.
 */
function maskPassword(password: string): string {
  if (!password || password.length <= 4) return '••••••••';
  return '••••••••' + password.slice(-2);
}

/**
 * Formatea la config SMTP para devolver al frontend.
 * Oculta el password real.
 */
function formatSmtpConfig(config: any) {
  return {
    id: config.id,
    tenantId: config.tenant_id,
    host: config.host,
    port: config.port,
    protocol: config.protocol,
    senderEmail: config.sender_email,
    senderName: config.sender_name,
    appPasswordMasked: maskPassword(config.app_password),
    isConfigured: Boolean(config.is_configured),
    updatedAt: config.updated_at,
  };
}

/**
 * Construye el host completo para nodemailer.
 * Formato: <protocol>://<host>:<port>
 * Ejemplo: ssl://smtp.gmail.com:465
 */
function buildFullHost(config: {
  host: string;
  port: number;
  protocol: string;
}): string {
  // Si el host ya tiene protocolo, respetarlo
  if (config.host.startsWith('smtp://') ||
      config.host.startsWith('smtps://') ||
      config.host.startsWith('ssl://') ||
      config.host.startsWith('tls://')) {
    return config.host;
  }

  // Construir según el protocolo
  const protocolMap: Record<string, string> = {
    'ssl': 'smtps',
    'tls': 'smtp',
    'smtp': 'smtp',
  };

  const prefix = protocolMap[config.protocol] ?? 'smtp';
  return `${prefix}://${config.host}:${config.port}`;
}

/**
 * Crea un transporter de nodemailer a partir de una config.
 * NUNCA loguear ni exponer el password.
 */
function createTransporter(config: any): Transporter {
  // ⚠️ Nodemailer espera el host SIN protocolo (solo "smtp.gmail.com")
  // y usa `secure: true` + port 465 para SSL directo.
  // El protocolo se usa solo para determinar `secure`.

  // Limpiar el host si viene con protocolo incluido
  let cleanHost = config.host;
  const protocolPrefixes = ['smtp://', 'smtps://', 'ssl://', 'tls://'];
  for (const prefix of protocolPrefixes) {
    if (cleanHost.startsWith(prefix)) {
      cleanHost = cleanHost.substring(prefix.length);
      break;
    }
  }

  // Quitar el puerto del host si viene incluido (ej: "smtp.gmail.com:465")
  const colonIndex = cleanHost.indexOf(':');
  if (colonIndex !== -1) {
    cleanHost = cleanHost.substring(0, colonIndex);
  }

  // Determinar si usar SSL directo
  const useSsl = config.protocol === 'ssl' || config.port === 465;

  return nodemailer.createTransport({
    host: cleanHost,        // ⬅️ Solo el nombre del host
    port: config.port,
    secure: useSsl,         // ⬅️ true para 465, false para 587
    auth: {
      user: config.sender_email,
      pass: config.app_password,
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });
}

// ─── Get config ───

export async function getSmtpConfig(tenantId: string) {
  const config = await prisma.smtp_configs.findUnique({
    where: { tenant_id: tenantId },
  });

  return config ? formatSmtpConfig(config) : null;
}

// ─── Save config (upsert) ───

export async function saveSmtpConfig(input: SaveSmtpConfigInput) {
  const id = `smtp-${input.tenantId}`;

  const config = await prisma.smtp_configs.upsert({
    where: { tenant_id: input.tenantId },
    update: {
      host: input.host,
      port: input.port,
      protocol: input.protocol,
      sender_email: input.senderEmail,
      sender_name: input.senderName,
      app_password: input.appPassword,
      is_configured: true,
    },
    create: {
      id,
      tenant_id: input.tenantId,
      host: input.host,
      port: input.port,
      protocol: input.protocol,
      sender_email: input.senderEmail,
      sender_name: input.senderName,
      app_password: input.appPassword,
      is_configured: true,
    },
  });

  return formatSmtpConfig(config);
}

// ─── Delete config ───

export async function deleteSmtpConfig(tenantId: string): Promise<boolean> {
  const existing = await prisma.smtp_configs.findUnique({
    where: { tenant_id: tenantId },
  });

  if (!existing) return false;

  await prisma.smtp_configs.delete({
    where: { tenant_id: tenantId },
  });

  return true;
}

// ─── Test connection ───

export async function testSmtpConnection(tenantId: string) {
  const config = await prisma.smtp_configs.findUnique({
    where: { tenant_id: tenantId },
  });

  if (!config) {
    throw new Error('SMTP_NOT_CONFIGURED');
  }

  const transporter = createTransporter(config);

  try {
    await transporter.verify();
    return {
      success: true,
      message: 'Conexión SMTP exitosa',
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Error al conectar con el servidor SMTP',
      error: err.message,
    };
  } finally {
    transporter.close();
  }
}

// ─── Send test email ───

export async function sendTestEmail(input: SendTestEmailInput) {
  const config = await prisma.smtp_configs.findUnique({
    where: { tenant_id: input.tenantId },
  });

  if (!config) {
    throw new Error('SMTP_NOT_CONFIGURED');
  }

  const transporter = createTransporter(config);

  const subject = input.subject ?? 'Test de configuración SMTP — Ateendia CRM';
  const htmlBody = input.body ?? `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #7c3aed;">✅ Configuración SMTP Exitosa</h2>
      <p>Este es un email de prueba enviado desde <strong>Ateendia CRM</strong>.</p>
      <p>Si estás leyendo esto, significa que tu configuración SMTP está funcionando correctamente.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        Enviado desde: ${config.sender_email}<br>
        ${new Date().toISOString()}
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${config.sender_name}" <${config.sender_email}>`,
      to: input.to,
      subject,
      html: htmlBody,
    });

    return {
      success: true,
      message: 'Email enviado correctamente',
      messageId: info.messageId,
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Error al enviar el email',
      error: err.message,
    };
  } finally {
    transporter.close();
  }
}

// ─── Send transactional email (uso interno) ───

/**
 * Envía un email transaccional (invitación, reset password, etc.)
 * desde el SMTP del tenant.
 *
 * Usado internamente por otros servicios (users, auth, etc.)
 */
export async function sendTransactionalEmail(input: {
  tenantId: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = await prisma.smtp_configs.findUnique({
    where: { tenant_id: input.tenantId },
  });

  if (!config || !config.is_configured) {
    return {
      success: false,
      error: 'SMTP_NOT_CONFIGURED',
    };
  }

  const transporter = createTransporter(config);

  try {
    const info = await transporter.sendMail({
      from: `"${config.sender_name}" <${config.sender_email}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  } finally {
    transporter.close();
  }
}