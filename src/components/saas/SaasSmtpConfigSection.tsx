import React, { useState } from 'react';
import {
  Mail,
  Server,
  Key,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  Clock,
  Zap,
  Save,
  RotateCcw
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { SaasSmtpConfig, SaasNotificationTemplates, SaasEmailTemplateItem } from '../../types';
import { DEFAULT_SAAS_EMAIL_TEMPLATES } from '../../domain/saasDefaults';

export const SaasSmtpConfigSection: React.FC = () => {
  const {
    saasSmtpConfig,
    updateSaasSmtpConfig,
    saasNotificationTemplates,
    updateSaasNotificationTemplates,
    testSaasSmtpConnection
  } = useTenant();

  // Local Form for SMTP Settings
  const [smtpForm, setSmtpForm] = useState<SaasSmtpConfig>(saasSmtpConfig);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('director.saas@atomscloud.com');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccessAlert, setSavedSuccessAlert] = useState(false);

  // Active Template Tab for editing
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<keyof SaasNotificationTemplates>('paymentPending');
  const [templatesForm, setTemplatesForm] = useState<SaasNotificationTemplates>(
    saasNotificationTemplates || DEFAULT_SAAS_EMAIL_TEMPLATES
  );
  const [templateSaveSuccess, setTemplateSaveSuccess] = useState(false);

  const activeTemplate = templatesForm[selectedTemplateKey];

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    updateSaasSmtpConfig(smtpForm);
    setSavedSuccessAlert(true);
    setTimeout(() => setSavedSuccessAlert(false), 3000);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) return;
    setIsTestingSmtp(true);
    setTestResult(null);
    try {
      const result = await testSaasSmtpConnection(testEmailRecipient, smtpForm);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Error al conectar con el servidor SMTP. Verifica las credenciales.'
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSaveTemplates = () => {
    updateSaasNotificationTemplates(templatesForm);
    setTemplateSaveSuccess(true);
    setTimeout(() => setTemplateSaveSuccess(false), 3000);
  };

  const handleResetTemplate = (key: keyof SaasNotificationTemplates) => {
    setTemplatesForm((prev) => ({
      ...prev,
      [key]: DEFAULT_SAAS_EMAIL_TEMPLATES[key]
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/30">
            <Mail className="w-3.5 h-3.5" /> Servidor SMTP & Sistema de Notificaciones Central SaaS
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Configuración SMTP para Avisos de Pagos, Credenciales y Vencimientos
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Configura el servidor de correo emisor oficial para la plataforma. Este servidor despachará automáticamente los correos de <strong>pago en revisión</strong>, <strong>cuenta habilitada con credenciales</strong>, <strong>avisos de vencimiento con 5 días de gracia</strong> y <strong>confirmación de renovaciones</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ============ LEFT COLUMN: SMTP SERVER CREDENTIALS (5 Cols) ============ */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSaveSmtp} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Credenciales del Servidor SMTP</h3>
                  <p className="text-[10px] text-slate-500">Google Workspace, Gmail, AWS SES o Custom</p>
                </div>
              </div>

              {smtpForm.isConfigured && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Activo</span>
                </span>
              )}
            </div>

            {savedSuccessAlert && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuración SMTP guardada exitosamente.</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Protocolo & Seguridad
                </label>
                <select
                  value={smtpForm.protocol}
                  onChange={(e) => setSmtpForm({ ...smtpForm, protocol: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                >
                  <option value="ssl">SSL (Puerto 465) - Recomendado Google</option>
                  <option value="tls">TLS / STARTTLS (Puerto 587)</option>
                  <option value="smtp">SMTP Estándar (Puerto 25)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Host / Servidor SMTP *
                </label>
                <input
                  type="text"
                  required
                  value={smtpForm.host}
                  onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                  placeholder="ssl://smtp.gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-700 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Puerto SMTP *
                </label>
                <input
                  type="number"
                  required
                  value={smtpForm.port}
                  onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 465 })}
                  placeholder="465"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico Emisor *
                </label>
                <input
                  type="email"
                  required
                  value={smtpForm.senderEmail}
                  onChange={(e) => setSmtpForm({ ...smtpForm, senderEmail: e.target.value })}
                  placeholder="soporte.saas@atomscloudcrm.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Remitente Visible *
                </label>
                <input
                  type="text"
                  required
                  value={smtpForm.senderName}
                  onChange={(e) => setSmtpForm({ ...smtpForm, senderName: e.target.value })}
                  placeholder="Atoms Cloud CRM - Facturación Central"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contraseña de Aplicación / App Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={smtpForm.appPassword}
                    onChange={(e) => setSmtpForm({ ...smtpForm, appPassword: e.target.value })}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full px-3 py-2 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Para Gmail, genera una contraseña de aplicación de 16 caracteres en Cuenta de Google {'>'} Seguridad.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Credenciales SMTP</span>
              </button>
            </div>
          </form>

          {/* Test Email Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Send className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">Probar Envío en Tiempo Real</h3>
            </div>

            <p className="text-[11px] text-slate-500">
              Envía un correo de prueba para verificar que las credenciales SMTP están autenticando y entregando correctamente.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Correo Electrónico Destino
              </label>
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="tu-correo@gmail.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={isTestingSmtp || !testEmailRecipient}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {isTestingSmtp ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enviando Correo de Prueba...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Correo de Prueba</span>
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* ============ RIGHT COLUMN: 5 AUTOMATIC NOTIFICATION TEMPLATES (7 Cols) ============ */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Plantillas de Correos Automáticos del Sistema SaaS
                </h3>
                <p className="text-[11px] text-slate-500">
                  Personaliza los mensajes y variables que recibirán los directores de las empresas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveTemplates}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Todas las Plantillas</span>
              </button>
            </div>

            {templateSaveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Plantillas guardadas y activadas para envíos automáticos.</span>
              </div>
            )}

            {/* Template Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTemplateKey('paymentPending')}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                  selectedTemplateKey === 'paymentPending'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-2xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-indigo-600 uppercase font-extrabold">Paso 1</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <div className="truncate">1. Pago en Revisión</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplateKey('accountApproved')}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                  selectedTemplateKey === 'accountApproved'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-2xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-emerald-600 uppercase font-extrabold">Paso 2</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="truncate">2. Cuenta Habilitada</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplateKey('planExpiring')}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                  selectedTemplateKey === 'planExpiring'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-2xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-rose-600 uppercase font-extrabold">+5 Días Gracia</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                </div>
                <div className="truncate">3. Aviso de Vencimiento</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplateKey('renewalApproved')}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                  selectedTemplateKey === 'renewalApproved'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-2xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-teal-600 uppercase font-extrabold">Renovación</span>
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                </div>
                <div className="truncate">4. Renovación Exitosa</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplateKey('adminNewPaymentAlert')}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                  selectedTemplateKey === 'adminNewPaymentAlert'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-2xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-purple-600 uppercase font-extrabold">SuperAdmin</span>
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                </div>
                <div className="truncate">5. Alerta SuperAdmin</div>
              </button>
            </div>

            {/* Active Template Editor */}
            {activeTemplate && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{activeTemplate.name}</h4>
                    <p className="text-xs text-slate-500">{activeTemplate.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleResetTemplate(selectedTemplateKey)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    title="Restablecer a plantilla predeterminada"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restablecer</span>
                  </button>
                </div>

                {/* Available Variables Chips */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Variables Dinámicas Disponibles (Haz clic para copiar):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTemplate.variables?.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(v);
                        }}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-300 hover:border-indigo-400 text-[10px] font-mono font-bold text-indigo-700 cursor-pointer shadow-2xs hover:bg-indigo-50"
                        title="Haz clic para copiar"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Asunto del Correo Electrónico (Subject)
                  </label>
                  <input
                    type="text"
                    value={activeTemplate.subject}
                    onChange={(e) =>
                      setTemplatesForm((prev) => ({
                        ...prev,
                        [selectedTemplateKey]: { ...prev[selectedTemplateKey], subject: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Body Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cuerpo del Mensaje (Texto con Variables)
                  </label>
                  <textarea
                    rows={10}
                    value={activeTemplate.body}
                    onChange={(e) =>
                      setTemplatesForm((prev) => ({
                        ...prev,
                        [selectedTemplateKey]: { ...prev[selectedTemplateKey], body: e.target.value }
                      }))
                    }
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
