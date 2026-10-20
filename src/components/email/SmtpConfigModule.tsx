import React, { useState, useEffect } from 'react';
import {
  Mail,
  Save,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Server,
  Loader2,
  Shield,
  User,
  Key,
  Globe,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { smtpService } from '../../services/smtpService';
import type { SmtpConfig } from '../../types';

export const SmtpConfigModule: React.FC = () => {
  const { currentTenant } = useTenant();

  const [formData, setFormData] = useState<Partial<SmtpConfig>>({
    host: '',
    port: 465,
    protocol: 'smtp',
    senderEmail: '',
    senderName: '',
    appPassword: '',
    isConfigured: false,
    tenantId: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestInProgress, setIsTestInProgress] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const [testRecipient, setTestRecipient] = useState('supervisor.crm@atomscloud.com');
  const [testSubject, setTestSubject] = useState('Correo de prueba - CRM Atoms Seguros');
  const [testBody, setTestBody] = useState(
    'Hola,\n\nEste es un mensaje de prueba enviado exitosamente desde el servidor SMTP de Atoms Cloud CRM.\n\nSaludos,\nEquipo de Soporte.'
  );

  useEffect(() => {
    if (!currentTenant?.id) return;

    setFormData((prev) => ({
      ...prev,
      tenantId: currentTenant.id,
    }));

    const loadConfig = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await smtpService.getConfig(currentTenant.id);
        if (result.success && result.data) {
          setFormData({
            ...result.data,
            tenantId: currentTenant.id,
          });
        } else if (result.error) {
          setError(result.error);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const activeTenantId = formData.tenantId || currentTenant?.id;
    if (!activeTenantId) {
      setError('No hay un Tenant ID activo disponible para guardar la configuración.');
      return;
    }

    setError(null);
    setSaveSuccess(false);
    setIsLoading(true);

    try {
      const payload = { ...formData, tenantId: activeTenantId } as Partial<SmtpConfig>;
      const result = await smtpService.updateConfig(payload);
      if (result.success) {
        setSaveSuccess(true);
        setFormData((prev) => ({ ...prev, isConfigured: true }));
        setError(null);
        setToastMessage('Configuración SMTP guardada exitosamente');
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 4000);
      } else {
        setError(`Error al guardar la configuración: ${result.error}`);
        setToastMessage(`Error al guardar: ${result.error}`);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 4000);
      }
    } catch (err) {
      const message = `Error inesperado al guardar la configuración: ${err instanceof Error ? err.message : 'Error desconocido'}`;
      setError(message);
      setToastMessage(message);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 4000);
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
      const result = await smtpService.testConnection({
        toEmail: testRecipient,
        config: formData as SmtpConfig,
      });

      setTestResult(result);
      if (result.success) {
        setTestSuccess(true);
        setFormData((prev) => ({ ...prev, lastTestedAt: new Date().toISOString(), testStatus: 'success' }));
      } else {
        setFormData((prev) => ({ ...prev, lastTestedAt: new Date().toISOString(), testStatus: 'failed' }));
      }
    } catch (err) {
      const message = `Error al enviar correo de prueba: ${err instanceof Error ? err.message : 'Error de conexión'}`;
      setTestResult({ success: false, message });
    } finally {
      setIsTestInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {toastVisible && toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-medium animate-slide-in ${
            saveSuccess || testSuccess ? 'bg-green-600' : 'bg-red-600'
          }`}
          role="alert"
        >
          {toastMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Server className="w-8 h-8 text-indigo-600" />
            Configuración SMTP
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configura tu servidor de correo saliente para el envío de notificaciones y comunicaciones.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Credenciales del Servidor
            </h2>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Protocolo
                </label>
                <select
                  value={formData.protocol || 'smtp'}
                  onChange={(e) => setFormData({ ...formData, protocol: e.target.value as 'smtp' })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
                  <option value="smtp">SMTP (SSL/TLS)</option>
                  <option value="smtps">SMTPS (SSL Implícito)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Host
                  </label>
                  <input
                    type="text"
                    value={formData.host || ''}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    placeholder="ssl://smtp.gmail.com"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Puerto
                  </label>
                  <input
                    type="number"
                    value={formData.port || 465}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 465 })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Correo del Remitente
                </label>
                <input
                  type="email"
                  value={formData.senderEmail || ''}
                  onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                  placeholder="obamacare.support@gmail.com"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nombre del Remitente
                </label>
                <input
                  type="text"
                  value={formData.senderName || ''}
                  onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                  placeholder="Obamacare / Ateendia"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Contraseña de Aplicación
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.appPassword || ''}
                    onChange={(e) => setFormData({ ...formData, appPassword: e.target.value })}
                    placeholder="Contraseña de 16 caracteres"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Usa una contraseña de aplicación de Google (16 caracteres)
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Configuración
                  </>
                )}
              </button>

              {saveSuccess && (
                <p className="text-green-600 dark:text-green-400 text-sm text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Configuración guardada correctamente
                </p>
              )}
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              Prueba de Envío
            </h2>

            <form onSubmit={handleSendTest} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Destinatario
                </label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="correo@destino.com"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Asunto
                </label>
                <input
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  placeholder="Asunto del correo de prueba"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Mensaje
                </label>
                <textarea
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-mono text-sm resize-y min-h-[120px]"
                />
              </div>

              <button
                type="submit"
                disabled={isTestInProgress || isLoading}
                className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestInProgress ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando prueba...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Correo de Prueba
                  </>
                )}
              </button>

              {testResult && (
                <div
                  className={`p-4 rounded-lg border flex items-start gap-3 ${
                    testResult.success
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">
                      {testResult.success ? 'Prueba exitosa' : 'Error en la prueba'}
                    </p>
                    <p className="text-sm mt-1">{testResult.message}</p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SmtpConfigModule;