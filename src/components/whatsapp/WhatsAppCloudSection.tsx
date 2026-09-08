import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Save,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Key,
  MessageSquare,
  Zap,
  Shield,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { whatsAppCloudService } from '../../services/whatsAppCloudService';

const META_API_VERSION = 'v20.0';

export const WhatsAppCloudSection: React.FC = () => {
  const {
    currentTenant,
    whatsAppConfig,
    saveWhatsAppConfig,
    recordAudit
  } = useTenant();

  const [phoneNumberId, setPhoneNumberId] = useState<string>(whatsAppConfig.phoneNumberId || '');
  const [wabaId, setWabaId] = useState<string>(whatsAppConfig.wabaId || '');
  const [accessToken, setAccessToken] = useState<string>(whatsAppConfig.accessToken || '');
  const [webhookUrl, setWebhookUrl] = useState<string>(
    whatsAppConfig.webhookUrl || whatsAppCloudService.generateWebhookUrl(currentTenant.id)
  );
  const [verifyToken, setVerifyToken] = useState<string>(
    whatsAppConfig.webhookUrl?.includes('verify_token=')
      ? (() => {
          const parts = whatsAppConfig.webhookUrl.split('verify_token=');
          return parts.length > 1 ? parts[1].split('&')[0] : whatsAppCloudService.generateVerifyToken();
        })()
      : whatsAppCloudService.generateVerifyToken()
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

  const isConfigured = whatsAppCloudService.isConfigured(whatsAppConfig);

  useEffect(() => {
    if (whatsAppConfig.phoneNumberId) setPhoneNumberId(whatsAppConfig.phoneNumberId);
    if (whatsAppConfig.wabaId) setWabaId(whatsAppConfig.wabaId);
    if (whatsAppConfig.accessToken) setAccessToken(whatsAppConfig.accessToken);
    if (whatsAppConfig.webhookUrl) setWebhookUrl(whatsAppConfig.webhookUrl);
  }, [whatsAppConfig]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    saveWhatsAppConfig({
      phoneNumberId,
      wabaId,
      accessToken,
      webhookUrl: `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}verify_token=${verifyToken}`,
      connectionType: 'cloud_api'
    });

    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      recordAudit?.('UPDATE', 'WhatsApp', `Configuración WhatsApp Cloud API guardada para ${currentTenant.name}`);
    }, 500);
  }, [phoneNumberId, wabaId, accessToken, webhookUrl, verifyToken, saveWhatsAppConfig, currentTenant.name, recordAudit]);

  const verifyCredentials = useCallback(async () => {
    if (!phoneNumberId || !accessToken) return;

    setIsVerifyingCredentials(true);
    setCredentialsValid(null);

    const result = await whatsAppCloudService.checkPhoneNumberId(phoneNumberId, accessToken);

    setIsVerifyingCredentials(false);
    setCredentialsValid(result.valid);
  }, [phoneNumberId, accessToken]);

  const handleSendTestMessage = useCallback(async () => {
    if (!testPhoneNumber || !testMessage) return;

    setIsSending(true);
    setSendResult(null);

    const isDevMode = !isConfigured || !accessToken;

    if (isDevMode) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const result = whatsAppCloudService.mockSendMessage(testPhoneNumber, testMessage, () => {
        setMessageCount(prev => prev + 1);
      });
      setSendResult({
        success: result.success,
        message: result.success
          ? `Mensaje simulado enviado exitosamente (Mock Mode - sin API real)`
          : result.error || 'Error en simulación',
        messageId: result.messageId
      });
    } else {
      const result = await whatsAppCloudService.sendTextMessage(
        { ...whatsAppConfig, phoneNumberId, wabaId, accessToken },
        testPhoneNumber,
        testMessage,
        currentTenant.id
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
    }

    setIsSending(false);
  }, [testPhoneNumber, testMessage, isConfigured, accessToken, whatsAppConfig, phoneNumberId, wabaId, currentTenant.id]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const regenerateVerifyToken = () => {
    const newToken = whatsAppCloudService.generateVerifyToken();
    setVerifyToken(newToken);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">WhatsApp Cloud API</h3>
          <p className="text-xs text-slate-500">Meta Graph API v{META_API_VERSION} - Multi-Tenant</p>
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
            Credenciales de WhatsApp Business API
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
          {/* Phone Number ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Phone Number ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="106580352305555"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              El ID del número de teléfono de tu WhatsApp Business. Lo encontrarás en la sección "Phone Numbers" de tu app.
            </p>
          </div>

          {/* WABA ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              WhatsApp Business Account ID (WABA)
            </label>
            <input
              type="text"
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value)}
              placeholder="1234567890123456"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              ID de tu WhatsApp Business Account. Lo encontrarás en Business Settings de Meta.
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
                placeholder="EAAxxxxxxxxxxxxxxx..."
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
              Token de acceso permanente de tu app de Meta. Debe tener permisos de 'whatsapp_business_management' y 'whatsapp_business_messaging'.
            </p>
          </div>

          {/* Verify Credentials Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={verifyCredentials}
              disabled={!phoneNumberId || !accessToken || isVerifyingCredentials}
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

      {/* Webhook Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-600" />
            Configuración del Webhook
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Configura esta URL en tu app de Meta para recibir eventos entrantes
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Webhook URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">URL del Webhook</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                readOnly
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 font-mono text-xs"
              />
              <button
                onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                title="Copiar URL"
              >
                {copiedField === 'webhook' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>
          </div>

          {/* Verify Token */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Verify Token</label>
              <button
                onClick={regenerateVerifyToken}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerar
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 font-mono text-xs"
              />
              <button
                onClick={() => copyToClipboard(verifyToken, 'verify')}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                title="Copiar Verify Token"
              >
                {copiedField === 'verify' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Usa este token al configurar el webhook en Meta for Developers. Debe coincidir exactamente.
            </p>
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
              disabled={!testPhoneNumber || !testMessage || isSending}
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

          {/* Mock Mode Notice */}
          {!isConfigured && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-800">Modo Mock / Desarrollo</p>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  No hay credenciales configuradas. Los mensajes se simularán sin enviarse realmente a la API de Meta.
                  Configura las credenciales arriba para habilitar el envío real.
                </p>
              </div>
            </div>
          )}
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

export default WhatsAppCloudSection;
