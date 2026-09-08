import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Send,
  Phone,
  Clock,
  CheckCheck,
  Save,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { SaasWhatsAppCentralConfig } from '../../types';

// Configuración de Evolution API
const EVOLUTION_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || 'http://13.140.37.155:8080';
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || 'evolution2026';

// Country codes with flags for phone input
const COUNTRY_CODES = [
  { code: '1', flag: '🇺🇸', name: 'EE.UU.', dialCode: '+1' },
  { code: '58', flag: '🇻🇪', name: 'Venezuela', dialCode: '+58' },
  { code: '57', flag: '🇨🇴', name: 'Colombia', dialCode: '+57' },
  { code: '52', flag: '🇲🇽', name: 'México', dialCode: '+52' },
  { code: '34', flag: '🇪🇸', name: 'España', dialCode: '+34' },
  { code: '54', flag: '🇦🇷', name: 'Argentina', dialCode: '+54' },
  { code: '56', flag: '🇨🇱', name: 'Chile', dialCode: '+56' },
  { code: '51', flag: '🇵🇪', name: 'Perú', dialCode: '+51' },
  { code: '55', flag: '🇧🇷', name: 'Brasil', dialCode: '+55' },
  { code: '593', flag: '🇪🇨', name: 'Ecuador', dialCode: '+593' },
  { code: '595', flag: '🇵🇾', name: 'Paraguay', dialCode: '+595' },
  { code: '598', flag: '🇺🇾', name: 'Uruguay', dialCode: '+598' },
  { code: '591', flag: '🇧🇴', name: 'Bolivia', dialCode: '+591' },
  { code: '506', flag: '🇨🇷', name: 'Costa Rica', dialCode: '+506' },
  { code: '507', flag: '🇵🇦', name: 'Panamá', dialCode: '+507' },
  { code: '503', flag: '🇸🇻', name: 'El Salvador', dialCode: '+503' },
  { code: '504', flag: '🇭🇳', name: 'Honduras', dialCode: '+504' },
  { code: '505', flag: '🇳🇮', name: 'Nicaragua', dialCode: '+505' },
  { code: '502', flag: '🇬🇹', name: 'Guatemala', dialCode: '+502' },
];

// Helper to format phone to E.164
const formatPhoneE164 = (countryCode: string, localNumber: string): string => {
  const cleanLocal = localNumber.replace(/\D/g, '');
  return `${countryCode}${cleanLocal}`;
};

// Helper to parse E.164 phone to country code + local
const parsePhoneE164 = (phone: string): { countryCode: string; localNumber: string } => {
  const clean = phone.replace(/\D/g, '');
  for (const c of COUNTRY_CODES) {
    if (clean.startsWith(c.code)) {
      return { countryCode: c.code, localNumber: clean.slice(c.code.length) };
    }
  }
  // Default to US
  return { countryCode: '1', localNumber: clean };
};

export const SaasWhatsAppCentralSection: React.FC = () => {
  const {
    saasWhatsAppCentralConfig,
    updateSaasWhatsAppCentralConfig,
    sendWhatsAppCentralTestMessage
  } = useTenant();

  const [configForm, setConfigForm] = useState<SaasWhatsAppCentralConfig>(saasWhatsAppCentralConfig);
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [testMsgSent, setTestMsgSent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Estado para códigos de país de los admins
  const [admin1CountryCode, setAdmin1CountryCode] = useState<string>('1');
  const [admin1LocalNumber, setAdmin1LocalNumber] = useState<string>('7865550101');
  const [admin2CountryCode, setAdmin2CountryCode] = useState<string>('1');
  const [admin2LocalNumber, setAdmin2LocalNumber] = useState<string>('3055550102');

  // Estado para envío de prueba
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testSendResults, setTestSendResults] = useState<{
    admin1: { success: boolean; message: string };
    admin2: { success: boolean; message: string };
  } | null>(null);

  // Estados para Evolution API QR real
  const [evolutionQrCode, setEvolutionQrCode] = useState<string | null>(null);
  const [evolutionStatus, setEvolutionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isFetchingQr, setIsFetchingQr] = useState<boolean>(false);
  // Countdown para el QR (60 segundos)
  const [qrCountdown, setQrCountdown] = useState<number>(60);
  const qrTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Instancia única para Central SaaS
  const CENTRAL_INSTANCE_NAME = 'ateendia-saas-central';

  // Iniciar countdown cuando se genera el QR
  const startQrCountdown = () => {
    if (qrTimerRef.current) {
      clearInterval(qrTimerRef.current);
    }

    setQrCountdown(60);

    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          qrTimerRef.current = null;
          setEvolutionQrCode(null);
          setEvolutionStatus('disconnected');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    qrTimerRef.current = timer;
  };

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (qrTimerRef.current) {
        clearInterval(qrTimerRef.current);
      }
    };
  }, []);

  // Inicializar códigos de país y números locales desde configForm
  useEffect(() => {
    const admin1Parsed = parsePhoneE164(configForm.adminPhone1);
    const admin2Parsed = parsePhoneE164(configForm.adminPhone2);
    setAdmin1CountryCode(admin1Parsed.countryCode);
    setAdmin1LocalNumber(admin1Parsed.localNumber);
    setAdmin2CountryCode(admin2Parsed.countryCode);
    setAdmin2LocalNumber(admin2Parsed.localNumber);
  }, [configForm.adminPhone1, configForm.adminPhone2]);

  // Función para crear/verificar instancia en Evolution API
  const createEvolutionInstance = async () => {
    try {
      // Intento de eliminación limpia previa de la instancia para liberar sesiones colgadas
      console.log(`🗑️ Eliminación previa de instancia colgada (${CENTRAL_INSTANCE_NAME})...`);
      try {
        await fetch(`${EVOLUTION_API_URL}/instance/delete/${CENTRAL_INSTANCE_NAME}`, {
          method: 'DELETE',
          headers: { 'apikey': EVOLUTION_API_KEY }
        });
        console.log('✅ Intento de borrado limpio completado');
      } catch (deleteError) {
        console.log('ℹ️ Error al eliminar instancia previa ignorado, procediendo:', deleteError);
      }

      // Verificar si ya existe y está conectada
      const checkResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        headers: { 'apikey': EVOLUTION_API_KEY }
      });
      const instances = await checkResponse.json();
      const exists = instances.find((inst: any) => inst.name === CENTRAL_INSTANCE_NAME);

      if (exists && exists.connectionStatus === 'open' && exists.ownerJid) {
        console.log(`✅ Instancia ${CENTRAL_INSTANCE_NAME} ya está conectada`);
        return { alreadyConnected: true };
      }

      // Crear nueva instancia limpia
      console.log(` Creando nueva instancia ${CENTRAL_INSTANCE_NAME}...`);
      const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: CENTRAL_INSTANCE_NAME,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true
        })
      });

      const data = await response.json();

      if (response.status === 403 || response.status === 400) {
        console.warn(`⚠️ Error ${response.status} al crear instancia. Reintentando borrado e instalación...`);
        try {
          await fetch(`${EVOLUTION_API_URL}/instance/delete/${CENTRAL_INSTANCE_NAME}`, {
            method: 'DELETE',
            headers: { 'apikey': EVOLUTION_API_KEY }
          });
        } catch (e) {}

        const retryResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            instanceName: CENTRAL_INSTANCE_NAME,
            integration: 'WHATSAPP-BAILEYS',
            qrcode: true
          })
        });
        const retryData = await retryResponse.json();
        return retryData;
      }

      console.log('✅ Instancia creada correctamente:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creando instancia:', error);
      return null;
    }
  };

  // Función para obtener QR de Evolution API
  const fetchEvolutionQR = async () => {
    try {
      setIsFetchingQr(true);
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${CENTRAL_INSTANCE_NAME}`, {
        headers: { 'apikey': EVOLUTION_API_KEY }
      });

      const data = await response.json();

      if (data.base64) {
        setEvolutionQrCode(data.base64);
        setEvolutionStatus('connecting');
        startQrCountdown();
      } else if (data.status === 'open') {
        setEvolutionStatus('connected');
        if (qrTimerRef.current) {
          clearInterval(qrTimerRef.current);
          qrTimerRef.current = null;
        }
      }

      setIsFetchingQr(false);
      return data;
    } catch (error) {
      console.error('Error obteniendo QR:', error);
      setIsFetchingQr(false);
      return null;
    }
  };

  // Verificar conexión real - PRIMERO intenta connectionState endpoint para respuesta inmediata
  const checkEvolutionConnection = async (forceConnectionState = false): Promise<boolean> => {
    try {
      // PRIMERO: Intentar endpoint directo de estado de conexión para respuesta inmediata
      if (forceConnectionState || true) {
        try {
          const stateResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${CENTRAL_INSTANCE_NAME}`, {
            headers: { 'apikey': EVOLUTION_API_KEY }
          });
          if (stateResponse.ok) {
            const stateData = await stateResponse.json();
            // Evolution API v2 connectionState puede devolver: { state: 'open' }, { status: 'open' }, { connectionStatus: 'open' }
            const status = stateData?.state || stateData?.status || stateData?.connectionStatus;
            if (status === 'open') {
              console.log('✅ [connectionState] Central SaaS - Sesión ACTIVA');
              setEvolutionStatus('connected');
              return true;
            }
            console.log(`⏳ [connectionState] Central SaaS - Estado: ${status}`);
            // No retornar false aquí, dejar que fallback a fetchInstances
          }
        } catch (e) {
          console.log('ℹ️ Endpoint connectionState no disponible, usando fetchInstances...');
        }
      }

      // FALLBACK: /instance/fetchInstances
      const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        headers: { 'apikey': EVOLUTION_API_KEY }
      });

      const rawData = await response.json();
      console.log(`📡 [fetchInstances] Respuesta cruda:`, rawData);

      // Normalizar respuesta
      let instances = [];
      if (Array.isArray(rawData)) {
        instances = rawData;
      } else if (rawData?.instance && Array.isArray(rawData.instance)) {
        instances = rawData.instance;
      } else if (rawData?.instances && Array.isArray(rawData.instances)) {
        instances = rawData.instances;
      } else if (rawData?.data && Array.isArray(rawData.data)) {
        instances = rawData.data;
      } else {
        console.warn(`⚠️ Formato de respuesta no reconocido:`, rawData);
        instances = [];
      }

      // Buscar instancia
      const instance = instances.find((inst: any) => 
        inst?.name === CENTRAL_INSTANCE_NAME || inst?.instanceName === CENTRAL_INSTANCE_NAME
      );

      console.log(`🔍 [fetchInstances] Instancia encontrada:`, instance);

      // VALIDACIÓN ESTRICTA: Solo connectionStatus === 'open' indica sesión activa
      const instanceStatus = instance?.connectionStatus || instance?.state || instance?.status;
      
      if (instance && instanceStatus === 'open') {
        console.log(`✅ [fetchInstances] Central SaaS - Sesión ACTIVA (status: ${instanceStatus})`);
        setEvolutionStatus('connected');
        return true;
      }

      if (instance) {
        console.log(`⏳ [fetchInstances] Central SaaS Estado actual: ${instanceStatus}`);
        if (instanceStatus === 'connecting') {
          setEvolutionStatus('connecting');
        } else {
          setEvolutionStatus('disconnected');
        }
        return false;
      }

      console.log('❌ Central SaaS no existe la instancia');
      setEvolutionStatus('disconnected');
      return false;
    } catch (error) {
      console.error('Error verificando conexión Central SaaS:', error);
      return false;
    }
  };

  // Generar QR nuevo (equivalente a handleRefreshQr)
  const handleGenerateQR = async () => {
    console.log(' Iniciando generación de QR para Central SaaS...');
    setIsFetchingQr(true);
    setEvolutionQrCode(null);
    setEvolutionStatus('disconnected');
    if (qrTimerRef.current) {
      clearInterval(qrTimerRef.current);
      qrTimerRef.current = null;
    }

    const instanceData = await createEvolutionInstance();

    if (!instanceData) {
      console.error('❌ No se pudo crear la instancia Central SaaS');
      setIsFetchingQr(false);
      alert('No se pudo generar el QR. Revisa la consola para más detalles.');
      return;
    }

    if (instanceData.alreadyConnected) {
      console.log('✅ Central SaaS ya está conectado');
      setEvolutionStatus('connected');
      setIsFetchingQr(false);
      return;
    }

    console.log('📱 Obteniendo QR para Central SaaS...');
    const qrData = await fetchEvolutionQR();

    if (!qrData) {
      console.error('❌ No se pudo obtener el QR para Central SaaS');
      alert('No se pudo obtener el QR. Intenta de nuevo.');
    }

    setIsFetchingQr(false);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updated = {
      ...configForm,
      lastQrGeneratedAt: `Generado a las ${timeStr}`,
      qrStatus: 'ready_to_scan'
    };
    setConfigForm(updated);
    updateSaasWhatsAppCentralConfig(updated);
  };

  // Verificar conexión (equivalente a handleSimulateScan) - FORZAR connectionState endpoint
  const handleVerifyConnection = async () => {
    setIsScanningQR(true);

    // Forzar verificación inmediata con connectionState endpoint
    const isConnected = await checkEvolutionConnection(true);

    if (isConnected) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const updated = {
        ...configForm,
        isConnected: true,
        connectedPhoneNumber: '+1 (786) 920-4100',
        lastConnectedAt: new Date().toLocaleString(),
        qrStatus: 'connected'
      };
      setConfigForm(updated);
      updateSaasWhatsAppCentralConfig(updated);

      setTestMsgSent(true);
      setTimeout(() => setTestMsgSent(false), 4000);
    } else {
      alert('Aún no se ha escaneado el QR en WhatsApp. Por favor escanea el código QR con tu teléfono.');
    }

    setIsScanningQR(false);
  };

  // Desconectar
  const handleDisconnect = () => {
    if (!confirm('¿Estás seguro de desvincular la sesión de WhatsApp Central SaaS?')) return;

    const updated = {
      ...configForm,
      isConnected: false,
      connectedPhoneNumber: undefined,
      lastConnectedAt: undefined,
      qrStatus: 'disconnected'
    };
    setConfigForm(updated);
    updateSaasWhatsAppCentralConfig(updated);

    setEvolutionQrCode(null);
    setEvolutionStatus('disconnected');
    if (qrTimerRef.current) {
      clearInterval(qrTimerRef.current);
      qrTimerRef.current = null;
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    // Update configForm with formatted E.164 phone numbers
    const updatedConfig = {
      ...configForm,
      adminPhone1: formatPhoneE164(admin1CountryCode, admin1LocalNumber),
      adminPhone2: formatPhoneE164(admin2CountryCode, admin2LocalNumber)
    };
    updateSaasWhatsAppCentralConfig(updatedConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSendTestToAdmins = async () => {
    setIsSendingTest(true);
    setTestSendResults(null);

    const testMessage = `🔔 [CENTRAL SAAS] Prueba de notificación del sistema. Las alertas para nuevos registros y pagos están activadas correctamente.`;
    const instanceName = CENTRAL_INSTANCE_NAME;
    
    const admin1Phone = formatPhoneE164(admin1CountryCode, admin1LocalNumber);
    const admin2Phone = formatPhoneE164(admin2CountryCode, admin2LocalNumber);
    
    const admin1Name = configForm.adminName1 || 'Administrador 1';
    const admin2Name = configForm.adminName2 || 'Administrador 2';

    const results = {
      admin1: { success: false, message: '' },
      admin2: { success: false, message: '' }
    };

    const timestamp = new Date().toLocaleString();

    // 1. Verificar estado de conexión ANTES de enviar (usando connectionState endpoint)
    const isConnected = await checkEvolutionConnection(true);
    if (!isConnected) {
      const errorMsg = `La sesión de WhatsApp Central SaaS está desconectada. Por favor presiona 'Verificar Conexión' o 'Generar Nuevo QR' para reconectar antes de enviar.`;
      results.admin1 = { success: false, message: errorMsg };
      results.admin2 = { success: false, message: errorMsg };
      setTestSendResults(results);
      setIsSendingTest(false);
      return;
    }

    // Función auxiliar para enviar a un admin
    const sendToAdmin = async (phone: string, name: string, adminKey: 'admin1' | 'admin2') => {
      try {
        const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            number: phone,
            text: testMessage
          })
        });

        const data = await response.json();
        
        if (response.ok && data) {
          // Add to messageLog
          const newLogEntry = {
            id: `wamsg-${Date.now()}-${adminKey === 'admin1' ? 1 : 2}`,
            to: phone,
            recipientName: name,
            message: testMessage,
            timestamp,
            type: 'new_registration' as const,
            status: 'sent' as const
          };
          
          const updatedConfig = {
            ...configForm,
            messageLog: [newLogEntry, ...(configForm.messageLog || [])]
          };
          setConfigForm(updatedConfig);
          updateSaasWhatsAppCentralConfig(updatedConfig);
          
          return { success: true, message: `Enviado a ${phone}` };
        } else {
          // Capturar error detallado de la respuesta (incluyendo 500)
          const errorDetail = data?.message || data?.error || data?.details || JSON.stringify(data);
          return { success: false, message: `Error ${response.status}: ${errorDetail}` };
        }
      } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Error de red' };
      }
    };

    // Send to Admin 1
    results.admin1 = await sendToAdmin(admin1Phone, admin1Name, 'admin1');

    // Send to Admin 2
    results.admin2 = await sendToAdmin(admin2Phone, admin2Name, 'admin2');

    setTestSendResults(results);
    setIsSendingTest(false);
  };

  // Inicializar y verificar conexión al montar
  useEffect(() => {
    checkEvolutionConnection();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-900/50">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-500/30">
            <Smartphone className="w-3.5 h-3.5" /> WhatsApp Emisor Central & Alertas a 2 Administradores
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Vinculación de WhatsApp Central por QR & Alertas en Tiempo Real
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Conecta la línea oficial de WhatsApp del SaaS mediante código QR para notificar automáticamente a los <strong>2 números administradores</strong> cada vez que una nueva empresa se registre o suba un comprobante de pago para su revisión.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ============ LEFT: QR SCAN & CONNECTION STATUS (5 Cols) ============ */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Línea Emisora WhatsApp</h3>
                  <p className="text-[10px] text-slate-500">Sesión WebSocket / Baileys Gateway</p>
                </div>
              </div>

              {evolutionStatus === 'connected' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>VINCULADO (SESIÓN ACTIVA)</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                  DESCONECTADO / SESIÓN CERRADA
                </span>
              )}
            </div>

            {/* QR Visual Canvas */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center">
              {evolutionStatus === 'connected' ? (
                <div className="space-y-3 py-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">WhatsApp Central Vinculado</h4>
                    <p className="text-xs font-mono font-bold text-emerald-700 mt-1">
                      {configForm.connectedPhoneNumber || '+1 (786) 920-4100'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Conectado desde: {configForm.lastConnectedAt || 'Hoy'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-4 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                  >
                    Desvincular Sesión
                  </button>
                </div>
              ) : evolutionStatus === 'connecting' && evolutionQrCode ? (
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-2xl border-2 border-emerald-400 shadow-md inline-block">
                    {/* QR REAL de Evolution API */}
                    <img 
                      src={evolutionQrCode} 
                      alt="WhatsApp Central QR Code" 
                      className="w-40 h-40 rounded-lg" 
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-xl">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Expira en: {qrCountdown}s</span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    Abre WhatsApp en tu teléfono {'>'} Dispositivos vinculados {'>'} Vincular un dispositivo
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleVerifyConnection}
                      disabled={isScanningQR || isFetchingQr}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                      {isScanningQR ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verificando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Verificar Conexión</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateQR}
                      disabled={isFetchingQr}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFetchingQr ? 'animate-spin' : ''}`} />
                      <span>Nuevo QR</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-md inline-block">
                    <div className="w-40 h-40 flex items-center justify-center bg-slate-50 rounded-lg">
                      <WifiOff className="w-16 h-16 text-slate-300" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    Genera un código QR para vincular WhatsApp Central SaaS
                  </p>

                  <button
                    type="button"
                    onClick={handleGenerateQR}
                    disabled={isFetchingQr}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isFetchingQr ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generando QR...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Generar Código QR</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============ RIGHT: 2 ADMIN NUMBERS & ALERT SETTINGS (7 Cols) ============ */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Configuración de los 2 Números Administradores
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Estos 2 números recibirán las alertas directas cada vez que se reciba un pago o registro
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Números</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Números de notificación actualizados correctamente.</span>
              </div>
            )}

            {/* Admin 1 & Admin 2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Admin 1 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    1
                  </div>
                  <span>Administrador Principal (Admin 1)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nombre o Cargo
                  </label>
                  <input
                    type="text"
                    value={configForm.adminName1 || ''}
                    onChange={(e) => setConfigForm({ ...configForm, adminName1: e.target.value })}
                    placeholder="Ej: Víctor Aray (Director)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Número WhatsApp (Código País + Número Local) *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-32 flex-shrink-0">
                      <select
                        value={admin1CountryCode}
                        onChange={(e) => setAdmin1CountryCode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none cursor-pointer"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.dialCode} ({c.name})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="tel"
                        required
                        value={admin1LocalNumber}
                        onChange={(e) => setAdmin1LocalNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Número local (ej: 7865550101)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:outline-hidden"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    E.164: +{admin1CountryCode}{admin1LocalNumber}
                  </p>
                </div>
              </div>

              {/* Admin 2 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    2
                  </div>
                  <span>Administrador Secundario / Finanzas (Admin 2)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nombre o Cargo
                  </label>
                  <input
                    type="text"
                    value={configForm.adminName2 || ''}
                    onChange={(e) => setConfigForm({ ...configForm, adminName2: e.target.value })}
                    placeholder="Ej: Supervisor de Finanzas"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Número WhatsApp (Código País + Número Local) *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-32 flex-shrink-0">
                      <select
                        value={admin2CountryCode}
                        onChange={(e) => setAdmin2CountryCode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none cursor-pointer"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.dialCode} ({c.name})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="tel"
                        required
                        value={admin2LocalNumber}
                        onChange={(e) => setAdmin2LocalNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Número local (ej: 3055550102)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:outline-hidden"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    E.164: +{admin2CountryCode}{admin2LocalNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configForm.notifyOnNewRegistration}
                  onChange={(e) => setConfigForm({ ...configForm, notifyOnNewRegistration: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded-sm"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">Alertar por WhatsApp al registrarse una nueva empresa</div>
                  <div className="text-[10px] text-slate-500">Envía mensaje instantáneo con el nombre de la empresa, plan y monto.</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configForm.notifyOnPaymentSubmitted}
                  onChange={(e) => setConfigForm({ ...configForm, notifyOnPaymentSubmitted: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded-sm"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">Alertar cuando se sube un comprobante de pago</div>
                  <div className="text-[10px] text-slate-500">Incluye detalles del voucher, banco y referencia.</div>
                </div>
              </label>
            </div>

            {/* Test Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSendTestToAdmins}
                disabled={isSendingTest}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-pulse' : ''} text-emerald-400`} />
                <span>{isSendingTest ? 'Enviando...' : 'Enviar Notificación de Prueba a Ambos Administradores'}</span>
              </button>

              {testSendResults && (
                <div className="mt-3 space-y-2 animate-in fade-in">
                  <div className={`p-3 rounded-lg border text-[11px] font-medium ${
                    testSendResults.admin1.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {testSendResults.admin1.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>
                        <strong>Admin 1 ({configForm.adminName1 || 'Administrador 1'}):</strong>{' '}
                        {testSendResults.admin1.success ? '✓ Enviado correctamente' : `✗ ${testSendResults.admin1.message}`}
                      </span>
                    </div>
                    {testSendResults.admin1.success && (
                      <p className="text-[10px] text-emerald-600 mt-1 font-mono">
                        Destino: +{admin1CountryCode}{admin1LocalNumber}
                      </p>
                    )}
                  </div>

                  <div className={`p-3 rounded-lg border text-[11px] font-medium ${
                    testSendResults.admin2.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {testSendResults.admin2.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>
                        <strong>Admin 2 ({configForm.adminName2 || 'Administrador 2'}):</strong>{' '}
                        {testSendResults.admin2.success ? '✓ Enviado correctamente' : `✗ ${testSendResults.admin2.message}`}
                      </span>
                    </div>
                    {testSendResults.admin2.success && (
                      <p className="text-[10px] text-emerald-600 mt-1 font-mono">
                        Destino: +{admin2CountryCode}{admin2LocalNumber}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Recent WhatsApp Dispatch Log */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Historial de Notificaciones WhatsApp Despachadas
            </h4>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {configForm.messageLog?.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-emerald-700">{log.recipientName} ({log.to})</span>
                    <span className="text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-700 font-sans">{log.message}</p>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 font-bold">
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="capitalize">{log.status === 'read' ? 'Leído' : 'Entregado'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
