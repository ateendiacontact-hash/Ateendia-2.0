import React, { useState, useEffect } from 'react';
import {
  Mail,
  Save,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Server,
  Lock,
  ExternalLink
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { smtpService } from '../../services/smtpService';

export const SmtpConfigModule: React.FC = () => {
  const { currentTenant } = useTenant();
  const [formData, setFormData] = useState({
    host: '',
    port: 465,
    protocol: 'ssl',
    senderEmail: '',
    senderName: '',
    appPassword: '',
    isConfigured: false,
    tenantId: currentTenant?.id || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestInProgress, setIsTestInProgress] = useState(false);

  // Load existing SMTP config from PocketBase on component mount
  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await smtpService.getConfig();
        if (result.success && result.data) {
          setFormData(prev => ({
            ...result.data,
            tenantId: currentTenant?.id || prev.tenantId,
          }));
        }
      } catch (err) {
        console.error('Error loading SMTP config:', err);
        setError('Error al cargar la configuración SMTP');
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [currentTenant?.id]);

  // Test Email State
  const [testRecipient, setTestRecipient] = useState('supervisor.crm@atomscloud.com');
  const [testSubject, setTestSubject] = useState('Correo de prueba - CRM Atoms Seguros');
  const [testBody, setTestBody] = useState(
    'Hola,\n\nEste es un mensaje de prueba enviado exitosamente desde el servidor SMTP de Atoms Cloud CRM.\n\nSaludos,\nEquipo de Soporte.'
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveSuccess(false);
    setIsLoading(true);

    try {
      const result = await smtpService.updateConfig(formData);
      if (result.success) {
        setSaveSuccess(true);
        setError(null);
      } else {
        setError(`Error al guardar la configuración: ${result.error}`);
      }
    } catch (err) {
      setError(`Error inesperado al guardar la configuración: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient || !testSubject || !testBody) {
      setTestResult({ success: false, message: 'Faltan campos requeridos para la prueba' });
      return;
    }
    
    setIsTestInProgress(true);
    setTestResult(null);
    setError(null);

    try {
      const testData = {
        toEmail: testRecipient,
        config: formData,
        isSaas: false,
      };
      
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/email/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        });
        
        if (response.ok) {
          const result = await response.json();
          setTestResult({ success: true, message: result.message || 'Correo de prueba enviado exitosamente' });
          setTestSuccess(true);
        } else {
          const errorData = await response.json();
          setTestResult({ success: false, message: errorData.message || errorData.error || 'Error al enviar correo de prueba' });
        }
      } else {
        setTestResult({ 
          success: false, 
          message: '⚠️ No se ha detectado la URL de API backend (VITE_API_URL) ni el servicio activo para procesar el envío SMTP real.' 
        });
      }
    } catch (err) {
      setTestResult({ success: false, message: `Error al enviar correo de prueba: ${err instanceof Error ? err.message : 'Error de conexión'}` });
    } finally {
      setIsTestInProgress(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      {/* Top Header matching Screenshot 1 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Configuración SMTP</h1>
            <p className="text-xs text-slate-500">
              Configura el servidor SMTP para el envío de correos electrónicos desde la plataforma.
            </p>
          </div>
        </div>

        {formData.senderEmail && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>SMTP configurado: {formData.senderEmail}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Form Left, Guide & Test Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Credenciales de Gmail (Matching Screenshot 1) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Credenciales de Gmail / Servidor SMTP
              </h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold">
              SSL / Port 465
            </span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-slate-600">Cargando configuración...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Protocolo</label>
                <input
                  type="text"
                  value={formData.protocol || 'smtp'}
                  onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-semibold"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={formData.host || ''}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="ssl://smtp.gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-semibold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">SMTP Port</label>
                <input
                  type="number"
                  value={formData.port ?? 465}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 465 })}
                  placeholder="465"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo de Envío</label>
                <input
                  type="email"
                  value={formData.senderEmail || ''}
                  onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                  placeholder="obamacare.support@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Remitente</label>
              <input
                type="text"
                value={formData.senderName || ''}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                placeholder="Obamacare Support Team"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contraseña de Aplicación de Google
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.appPassword || ''}
                  onChange={(e) => setFormData({ ...formData, appPassword: e.target.value })}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full px-3 py-2 pr-10 bg-slate-50 border rounded-xl text-xs font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Usa una clave de aplicación de 16 dígitos generada en la consola de seguridad de Google.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {saveSuccess ? (
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Credenciales guardadas con éxito!</span>
                </div>
              ) : (
                <div></div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Guía Técnica Callout + Enviar Correo de Prueba (Screenshot 1) */}
        <div className="space-y-6">
          {/* Guía Técnica: ¿Cómo obtener la Contraseña de Aplicación de Google? */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              <span>Guía Técnica: ¿Cómo obtener la Contraseña de Aplicación de Google?</span>
            </div>

            <ol className="text-xs text-amber-950 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Ve a tu <strong>Cuenta de Google</strong> &gt; <strong>Seguridad</strong>.
              </li>
              <li>
                Activa la <strong>Verificación en dos pasos</strong> si aún no está activa en tu cuenta.
              </li>
              <li>
                En el apartado "Cómo accedes a Google", selecciona <strong>Contraseñas de aplicaciones</strong>.
              </li>
              <li>
                Genera una nueva contraseña seleccionando "Otra aplicación" (ejemplo: <em>CRM Atoms Seguros</em>).
              </li>
              <li>
                Copia la clave de <strong>16 caracteres</strong> generada y pégala en el campo de la izquierda (sin espacios).
              </li>
            </ol>
          </div>

          {/* Enviar Correo de Prueba Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Enviar Correo de Prueba</h2>
                <p className="text-xs text-slate-400">Verifica la entrega SMTP antes de enviar a clientes reales.</p>
              </div>
              <Send className="w-4 h-4 text-purple-600" />
            </div>

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

            <form onSubmit={handleSendTest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Destinatario</label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="destinatario@ejemplo.com"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                  required
                  disabled={isTestInProgress}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asunto</label>
                <input
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold"
                  required
                  disabled={isTestInProgress}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mensaje</label>
                <textarea
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                  required
                  disabled={isTestInProgress}
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {testSuccess ? (
                  <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Correo de prueba enviado con éxito!</span>
                  </div>
                ) : (
                  <div></div>
                )}

                <button
                  type="submit"
                  disabled={isTestInProgress || !testRecipient || !testSubject || !testBody}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-98 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTestInProgress ? 'Enviando...' : 'Enviar Correo de Prueba'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmtpConfigModule;
