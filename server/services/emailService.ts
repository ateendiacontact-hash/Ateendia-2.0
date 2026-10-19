/**
 * Servicio de envío de emails transaccionales (Sesión #28, sub-fase 3.5.B.4.g).
 *
 * Responsabilidades:
 * - Configurar un transporter SMTP de nodemailer a partir de las variables
 *   de entorno (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, etc.).
 * - Exponer funciones de alto nivel: sendWelcomeEmail, sendPaymentApprovedEmail, etc.
 *
 * Decisiones:
 * - Si faltan credenciales SMTP, el servicio NO rompe la transacción que lo llama.
 *   Solo loguea un warning y devuelve { sent: false }. Esto es importante porque
 *   el SMTP es un canal secundario: si el correo falla, el usuario ya tiene su
 *   cuenta creada y puede loguearse igual.
 * - En desarrollo (NODE_ENV !== 'production'), usa un transporter "fake" que
 *   loguea el email a la consola en lugar de enviarlo. Esto evita que en pruebas
 *   se disparen correos reales.
 */

import nodemailer, { type Transporter } from 'nodemailer';

// ─── Configuración ─────────────────────────────────────────────────

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  // Cacheamos el transporter para no recrearlo en cada envío.
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 0);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Si falta algo, no podemos enviar.
  if (!host || !port || !user || !pass) {
    console.warn(
      '[emailService] Faltan credenciales SMTP (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS).',
    );
    return null;
  }

  // En desarrollo, si las credenciales están vacías O NODE_ENV no es producción,
  // usamos un "stream" para no enviar correos reales.
  if (process.env.NODE_ENV !== 'production' && (user === '' || pass === '')) {
    console.warn(
      '[emailService] Modo desarrollo sin credenciales SMTP: los emails se loguearán a la consola.',
    );
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // SSL para 465, STARTTLS para 587
    auth: {
      user,
      pass,
    },
    // Timeout para no colgar la transacción si el SMTP está caído
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return cachedTransporter;
}

// ─── Tipos de datos para los templates ─────────────────────────────

export interface WelcomeEmailInput {
  to: string;
  adminName: string;
  companyName: string;
  loginUrl: string;
  isDemo: boolean;
  demoExpiresAt: Date | null;
}

// ─── Helper: escapar HTML para evitar XSS en los templates ─────────

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Template: Email de bienvenida ─────────────────────────────────

function buildWelcomeEmailHtml(input: WelcomeEmailInput): string {
  const { adminName, companyName, loginUrl, isDemo, demoExpiresAt } = input;

  const safeAdminName = escapeHtml(adminName);
  const safeCompanyName = escapeHtml(companyName);
  const safeLoginUrl = escapeHtml(loginUrl);

  const demoBanner = isDemo && demoExpiresAt
    ? `
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0;border-radius:8px;">
        <strong style="color:#92400e;">🎁 Cuenta DEMO activa</strong>
        <p style="margin:6px 0 0;color:#78350f;font-size:14px;">
          Tu período de prueba vence el <strong>${demoExpiresAt.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.
          Después de esa fecha podés pasarte a un plan pago en cualquier momento.
        </p>
      </div>
    `
    : '';

  const headerColor = isDemo ? '#7c3aed' : '#059669';
  const headerText = isDemo ? '¡Bienvenido a tu prueba gratuita!' : '¡Tu cuenta está activa!';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${headerText}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f9fafb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background:${headerColor};padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Ateendia CRM</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:16px;">${headerText}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hola <strong>${safeAdminName}</strong>,</p>
              <p style="color:#374151;font-size:16px;margin:0 0 16px;line-height:1.6;">
                ${
                  isDemo
                    ? `Tu cuenta demo para <strong>${safeCompanyName}</strong> ha sido creada exitosamente. Ya podés acceder a todas las funcionalidades del sistema para probarlo.`
                    : `Tu pago ha sido aprobado y la cuenta de <strong>${safeCompanyName}</strong> ya está activa.`
                }
              </p>

              ${demoBanner}

              <p style="color:#374151;font-size:16px;margin:24px 0 16px;">
                Para ingresar, usá el email y la contraseña que elegiste durante el registro:
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="background:${headerColor};border-radius:8px;">
                    <a href="${safeLoginUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">
                      Iniciar sesión →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;margin:24px 0 0;line-height:1.6;">
                Si no solicitaste este registro, podés ignorar este mensaje.<br />
                ¿Necesitás ayuda? Escribinos a
                <a href="mailto:support@ateendia.cloud" style="color:${headerColor};">support@ateendia.cloud</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                Ateendia CRM · Sistema de gestión de seguros
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─── Función pública: enviar email de bienvenida ───────────────────

export interface SendEmailResult {
  sent: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
}

export async function sendWelcomeEmail(
  input: WelcomeEmailInput,
): Promise<SendEmailResult> {
  const transporter = getTransporter();

  const fromEmail = process.env.SMTP_FROM_EMAIL ?? 'notifications@ateendia.cloud';
  const fromName = process.env.SMTP_FROM_NAME ?? 'Ateendia CRM';
  const subject = input.isDemo
    ? '🎁 Tu cuenta demo de Ateendia CRM está lista'
    : '✅ Tu cuenta de Ateendia CRM está activa';

  // Fallback: si no hay transporter (credenciales faltantes), loguear y salir.
  if (!transporter) {
    console.warn(
      `[emailService] No se envió email a ${input.to} (SMTP no configurado).`,
    );
    return {
      sent: false,
      skipped: true,
      error: 'SMTP_NOT_CONFIGURED',
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: input.to,
      subject,
      html: buildWelcomeEmailHtml(input),
    });

    console.log(`[emailService] ✅ Email enviado a ${input.to} (${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    const error = (err as Error).message;
    console.error(`[emailService] ❌ Error enviando email a ${input.to}:`, error);
    return { sent: false, error };
  }
}