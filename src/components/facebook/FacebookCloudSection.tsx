import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Key,
  MessageSquare,
  Zap,
  Shield,
  Activity,
  Eye,
  EyeOff,
  Instagram,
  MessageCircle,
  ExternalLink,
  Save
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { MetaGraphService } from '../../services/metaGraphService';

export const FacebookCloudSection: React.FC = () => {
  const {
    currentTenant,
    facebookConfig,
    saveFacebookConfig,
    recordAudit
  } = useTenant();

  const [pageId, setPageId] = useState<string>(facebookConfig.pageId || '');
  const [accessToken, setAccessToken] = useState<string>(facebookConfig.accessToken || '');
  const [webhookUrl, setWebhookUrl] = useState<string>(
    facebookConfig.webhookUrl || ''
  );
  const [verifyToken, setVerifyToken] = useState<string>(
    facebookConfig.verifyToken || ''
  );
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>('');
  const [testMessage, setTestMessage] = useState<string>('Hola! Este es un mensaje de prueba desde Atoms CRM 🚀');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string; messageId?: string } | null>(null);
  const [showToken, setShowToken] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVerifyingCredentials, setIsVerifyingCredentials] = useState<boolean>(false);
  const [credentialsValid, setCredentialsValid] = useState<boolean | null>(null);
  const [messageCount, setMessageCount] = useState<number>(0);

  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isConfiguredLoading, setIsConfiguredLoading] = useState<boolean>(true);

  useEffect(() => {
    // Cargar configuración real de PocketBase asociada al tenant activo
    const loadConfig = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/integrations/facebook/config`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('pb_auth') ? JSON.parse(localStorage.getItem('pb_auth') || '{}').token : ''}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const config = data.data || data;
          if (config.tenantId === currentTenant.id || config.tenantId === undefined) {
            setIsConfigured(MetaGraphService.isConfigured(config));
            if (config.pageId) setPageId(config.pageId);
            if (config.accessToken) setAccessToken(config.accessToken);
            if (config.webhookUrl) setWebhookUrl(config.webhookUrl);
            if (config.verifyToken) setVerifyToken(config.verifyToken);
          }
        }
      } catch (e) {
        // Si no hay backend, usar configuración local
        setIsConfigured(MetaGraphService.isConfigured(facebookConfig));
        if (facebookConfig.pageId) setPageId(facebookConfig.pageId);
        if (facebookConfig.accessToken) setAccessToken(facebookConfig.accessToken);
        if (facebookConfig.webhookUrl) setWebhookUrl(facebookConfig.webhookUrl);
        if (facebookConfig.verifyToken) setVerifyToken(facebookConfig.verifyToken);
      } finally {
        setIsConfiguredLoading(false);
      }
    };
    loadConfig();
  }, [currentTenant.id]);

  const isConfiguredReal = isConfigured;

  useEffect(() => {
    if (facebookConfig.pageId) setPageId(facebookConfig.pageId);
    if (facebookConfig.accessToken) setAccessToken(facebookConfig.accessToken);
    if (facebookConfig.webhookUrl) setWebhookUrl(facebookConfig.webhookUrl);
    if (facebookConfig.verifyToken) setVerifyToken(facebookConfig.verifyToken);
  }, [facebookConfig]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    saveFacebookConfig({
      pageId,
      accessToken,
      webhookUrl,
      verifyToken,
      connectionType: 'meta_graph'
    });

    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      recordAudit?.('UPDATE', 'Integraciones', `Configuración Facebook Graph API guardada para ${currentTenant.name}`);
    }, 500);
  }, [pageId, accessToken, webhookUrl, verifyToken, saveFacebookConfig, currentTenant.name, recordAudit]);

  const verifyCredentials = useCallback(async () => {
    if (!pageId || !accessToken) return;

    setIsVerifyingCredentials(true);
    setCredentialsValid(null);

    const result = await MetaGraphService.checkPageAccess(pageId, accessToken);

    setIsVerifyingCredentials(false);
    setCredentialsValid(result.valid);
  }, [pageId, accessToken]);

  const handleSendTestMessage = useCallback(async () => {
    if (!testPhoneNumber || !testMessage) return;
    if (!accessToken || !pageId) {
      setSendResult({ success: false, message: 'Debe configurar las credenciales de Facebook antes de enviar mensajes reales.' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const result = await MetaGraphService.sendMessage(
        { pageId, accessToken, webhookUrl, verifyToken },
        testPhoneNumber,
        testMessage
      );

      if (result.success) {
        setMessageCount(prev => prev + 1);
      }

      setSendResult({
        success: result.success,
        message: result.success
          ? `Mensaje enviado exitosamente (Message ID: ${result.messageId})`
          : `Error: ${result.error}`,
        messageId: result.messageId
      });
    } catch (error) {
      setSendResult({ success: false, message: `Error de conexión con Meta Graph API: ${error instanceof Error ? error.message : 'Error desconocido'}` });
    } finally {
      setIsSending(false);
    }
  }, [testPhoneNumber, testMessage, pageId, accessToken, webhookUrl, verifyToken, messageCount]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const regenerateVerifyToken = () => {
    setVerifyToken(MetaGraphService.generateVerifyToken());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-md">
          <Instagram className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Facebook Messenger</h3>
          <p className="text-xs text-slate-500">Meta Graph API v20.0 - Multi-Tenant</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isConfigured ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Configurado
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              Sin Configurar
            </span>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className={`w-4 h-4 ${isConfigured ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Estado de Conexión</span>
          </div>
          <div className={`text-2xl font-bold ${isConfigured ? 'text-emerald-600' : 'text-slate-400'}`}>
            {isConfigured ? 'Conectado' : 'Desconectado'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isConfigured ? 'Listo para enviar mensajes' : 'Configura las credenciales abajo'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Mensajes Enviados</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{messageCount}</div>
          <p className="text-xs text-blue-500 mt-1">En esta sesión</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Plan</span>
          </div>
          <div className="text-lg font-bold text-purple-600 truncate">{currentTenant.name}</div>
          <p className="text-xs text-purple-500 mt-1">Tenant ID: {currentTenant.id}</p>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-600" />
            Credenciales de Facebook Graph API
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Obtén estas credenciales desde tu app de Meta for Developers en{' '}
            <a
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              developers.facebook.com <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Page ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Page ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              placeholder="123456789"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              El ID de tu página de Facebook. Lo encontrarás en la configuración de tu página.
            </p>
          </div>

          {/* Access Token */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Token Permanente <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAXxxxxxxxxxxxxxxx..."
                className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Token de acceso permanente de tu app de Meta. Debe tener permisos de 'pages_read_engagement' y 'pages_messaging'.
            </p>
          </div>

          {/* Verify Credentials Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={verifyCredentials}
              disabled={!pageId || !accessToken || isVerifyingCredentials}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifyingCredentials ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Verificar Credenciales
                </>
              )}
            </button>
            {credentialsValid !== null && (
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                credentialsValid
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {credentialsValid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Credenciales Válidas
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    Credenciales Inválidas
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Test Message Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
          <h4 className="font-bold text-blue-800 flex items-center gap-2">
            <Send className="w-4 h-4" />
            Prueba de Envío
          </h4>
          <p className="text-xs text-blue-600 mt-1">
            Envía un mensaje de prueba para verificar la configuración
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Test Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Número de Destino</label>
            <input
              type="tel"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              placeholder="+1 (786) 555-0199"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Test Message */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Mensaje</label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Send Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSendTestMessage}
              disabled={!testPhoneNumber || !testMessage || !accessToken || !pageId || isSending}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Mensaje de Prueba
                </>
              )}
            </button>

            {sendResult && (
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                sendResult.success
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {sendResult.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                {sendResult.message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            saved
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
          } disabled:opacity-50`}
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Guardado
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Configuración
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FacebookCloudSection;