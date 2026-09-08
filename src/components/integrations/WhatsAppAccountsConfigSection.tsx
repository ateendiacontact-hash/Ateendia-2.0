import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  QrCode,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Save,
  Send,
  Plus,
  Trash2,
  Clock,
  Shield,
  User,
  Phone,
  Layers,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  Zap,
  Activity,
  Radio,
  Sliders,
  Bell,
  MessageSquare,
  Bot
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { WhatsAppAccountConfig, WhatsAppAlertRecipient } from '../../types';
import { useWhatsAppSocket } from '../../services/whatsappSocketService';
import { getEvolutionConfig } from '../../services/evolutionApi';

// Configuración de Evolution API
const EVOLUTION_API_URL = import.meta.env.VITE_WHATSAPP_API_URL;
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY;

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

export const WhatsAppAccountsConfigSection: React.FC = () => {
  const {
    currentTenant,
    currentUser,
    whatsAppConfig,
    updateWhatsAppAccountConfig,
    saveWhatsAppConfig,
    pipelines,
    users,
    startWhatsAppConversation,
    recordAudit
  } = useTenant();

  // Active account tab: WA1 or WA2
  const [activeAccountTab, setActiveAccountTab] = useState<'WA1' | 'WA2'>('WA1');

  // Form states
  const [selectedPipeline, setSelectedPipeline] = useState<string>('pipe-1');
  const [autoReply, setAutoReply] = useState<boolean>(true);
  const [roundRobin, setRoundRobin] = useState<boolean>(true);
  const [isSimulatingScan, setIsSimulatingScan] = useState<boolean>(false);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);

  // Estados aislados por instancia (WA1 / WA2)
  const [evolutionQrCode, setEvolutionQrCode] = useState<Record<'WA1' | 'WA2', string | null>>({
    WA1: null,
    WA2: null
  });
  const [evolutionStatus, setEvolutionStatus] = useState<Record<'WA1' | 'WA2', 'disconnected' | 'connecting' | 'connected'>>({
    WA1: 'disconnected',
    WA2: 'disconnected'
  });
  const [isFetchingQr, setIsFetchingQr] = useState<Record<'WA1' | 'WA2', boolean>>({
    WA1: false,
    WA2: false
});
  // Estados para control de tiempo y reintentos de QR
  const [isWaitingQr, setIsWaitingQr] = useState<Record<'WA1' | 'WA2', boolean>>({
    WA1: false,
    WA2: false
  });
  const [qrRetryCount, setQrRetryCount] = useState<Record<'WA1' | 'WA2', number>>({
    WA1: 0,
    WA2: 0
  });
  const qrTimeoutRef = useRef<Record<'WA1' | 'WA2', NodeJS.Timeout | null>>({
    WA1: null,
    WA2: null
  });
  // Countdown para el QR (60 segundos) - independiente por instancia
  const [qrCountdown, setQrCountdown] = useState<Record<'WA1' | 'WA2', number>>({
    WA1: 60,
    WA2: 60
  });
  const qrTimerRef = useRef<Record<'WA1' | 'WA2', NodeJS.Timeout | null>>({
    WA1: null,
    WA2: null
  });

  // Helper to get instance name
  const getInstanceName = (tab: 'WA1' | 'WA2') => `${currentTenant.id}-${tab.toLowerCase()}`;

  // Helper to get current tab's QR state
  const getCurrentQrCode = () => evolutionQrCode[activeAccountTab];
  const getCurrentStatus = () => evolutionStatus[activeAccountTab];
  const getCurrentIsFetching = () => isFetchingQr[activeAccountTab];
  const getCurrentCountdown = () => qrCountdown[activeAccountTab];

  // Iniciar countdown cuando se genera el QR (por instancia)
  const startQrCountdown = (tab: 'WA1' | 'WA2') => {
    if (qrTimerRef.current[tab]) {
      clearInterval(qrTimerRef.current[tab]!);
    }

    setQrCountdown(prev => ({ ...prev, [tab]: 60 }));

    const timer = setInterval(() => {
      setQrCountdown(prev => {
        const current = prev[tab];
        if (current <= 1) {
          clearInterval(timer);
          qrTimerRef.current[tab] = null;
          // QR expirado - limpiar estado de esta instancia
          setEvolutionQrCode(prevQr => ({ ...prevQr, [tab]: null }));
          setEvolutionStatus(prevStatus => ({ ...prevStatus, [tab]: 'disconnected' }));
          return { ...prev, [tab]: 0 };
        }
        return { ...prev, [tab]: current - 1 };
      });
    }, 1000);

    qrTimerRef.current[tab] = timer;
  };

  // Limpiar timers cuando el componente se desmonte
  useEffect(() => {
    return () => {
      (['WA1', 'WA2'] as const).forEach(tab => {
        if (qrTimerRef.current[tab]) {
          clearInterval(qrTimerRef.current[tab]!);
        }
      });
    };
  }, []);

  // Función para crear/verificar instancia en Evolution API
  const createEvolutionInstance = async (instanceName: string) => {
    try {
      // Intento de eliminación limpia previa de la instancia para liberar sesiones colgadas
      console.log(`🗑️ Eliminación previa de instancia colgada (${instanceName})...`);
      try {
        await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
          method: 'DELETE',
          headers: { 'apikey': EVOLUTION_API_KEY }
        });
        console.log('✅ Intento de borrado limpio completado');
      } catch (deleteError) {
        // Ignorar errores (por ejemplo 404) y proceder inmediatamente
        console.log('ℹ️ Error al eliminar instancia previa ignorado, procediendo:', deleteError);
      }

      // Verificar si ya existe y está conectada (después del borrado limpio)
      const checkResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        headers: { 'apikey': EVOLUTION_API_KEY }
      });
      const instances = await checkResponse.json();
      const exists = instances.find((inst: any) => inst.name === instanceName);

      // Si ya existe y está conectada, no hacemos nada
      if (exists && exists.connectionStatus === 'open') {
        console.log(`✅ Instancia ${instanceName} ya está conectada`);
        return { alreadyConnected: true, status: 'connected' };
      }

      // Crear nueva instancia limpia
      console.log(` Creando nueva instancia ${instanceName}...`);
      const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: instanceName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true
        })
      });

      const data = await response.json();

      // Si responde 403 o 400 (instancia ya existe en estado no conectado), NO reintentar creación
      // En su lugar, el llamador debería intentar GET /instance/connect/ directamente
      if (response.status === 403 || response.status === 400) {
        console.warn(`⚠️ Error ${response.status} al crear instancia (posiblemente ya existe). Se intentará obtener QR directamente.`);
        return { status: response.status, data, needsDirectConnect: true };
      }

      console.log('✅ Instancia creada correctamente:', data);
      return { status: 'created', data };
    } catch (error) {
      console.error('❌ Error creando instancia:', error);
      return { status: 'error', data: null };
    }
  };

  // Función para obtener QR de Evolution API - consumo directo del endpoint /instance/connect/:instanceName
  const fetchEvolutionQR = async (instanceName: string, tab: 'WA1' | 'WA2') => {
    setIsFetchingQr(prev => ({ ...prev, [tab]: true }));
    setIsWaitingQr(prev => ({ ...prev, [tab]: true }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
        headers: { 'apikey': EVOLUTION_API_KEY },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      // Extraer base64 de múltiples formatos posibles de respuesta
      const qrBase64 = data.base64 || data.qrcode?.base64 || data.qrcode?.code || data.code || null;

      if (qrBase64) {
        setEvolutionQrCode(prev => ({ ...prev, [tab]: qrBase64 }));
        setIsWaitingQr(prev => ({ ...prev, [tab]: false }));
        setQrRetryCount(prev => ({ ...prev, [tab]: 0 }));
        setEvolutionStatus(prev => ({ ...prev, [tab]: 'connecting' }));
        startQrCountdown(tab);
      } else if (data.status === 'open') {
        setEvolutionStatus(prev => ({ ...prev, [tab]: 'connected' }));
        setIsWaitingQr(prev => ({ ...prev, [tab]: false }));
        if (qrTimerRef.current[tab]) {
          clearInterval(qrTimerRef.current[tab]!);
          qrTimerRef.current[tab] = null;
        }
      } else {
        setIsWaitingQr(prev => ({ ...prev, [tab]: true }));
      }

      setIsFetchingQr(prev => ({ ...prev, [tab]: false }));
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn(`⏰ Timeout de 10s para QR de ${instanceName}`);
        setIsWaitingQr(prev => ({ ...prev, [tab]: true }));
        setQrRetryCount(prev => ({ ...prev, [tab]: (prev[tab] || 0) + 1 }));
      } else {
        console.error('Error obteniendo QR:', error);
        setIsWaitingQr(prev => ({ ...prev, [tab]: true }));
      }
      setIsFetchingQr(prev => ({ ...prev, [tab]: false }));
      return null;
    }
  };

  const checkEvolutionConnection = async (instanceName: string, tab: 'WA1' | 'WA2') => {
    try {
      // Intentar primero endpoint directo de estado
      let instance = null;
      let usedEndpoint = '';
      
      try {
        const stateResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
          headers: { 'apikey': EVOLUTION_API_KEY }
        });
        if (stateResponse.ok) {
          const stateData = await stateResponse.json();
          usedEndpoint = 'connectionState';
          // Evolution API v2 connectionState puede devolver: { state: 'open' }, { status: 'open' }, { connectionStatus: 'open' }
          const status = stateData?.state || stateData?.status || stateData?.connectionStatus;
          if (status === 'open') {
            console.log(`✅ [${usedEndpoint}] ${instanceName} - Sesión ACTIVA`);
            setEvolutionStatus(prev => ({ ...prev, [tab]: 'connected' }));
            return true;
          }
          // Si el endpoint directo responde pero no es 'open', usar ese estado
          console.log(`⏳ [${usedEndpoint}] ${instanceName} - Estado: ${status}`);
          setEvolutionStatus(prev => ({ ...prev, [tab]: status === 'connecting' ? 'connecting' : 'disconnected' }));
          return false;
        }
      } catch (e) {
        // Endpoint connectionState no disponible, continuar con fetchInstances
        console.log('ℹ️ Endpoint connectionState no disponible, usando fetchInstances...');
      }

      // Fallback: /instance/fetchInstances - manejar múltiples formatos de respuesta
      const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        headers: { 'apikey': EVOLUTION_API_KEY }
      });

      const rawData = await response.json();
      usedEndpoint = 'fetchInstances';
      console.log(`📡 [${usedEndpoint}] Respuesta cruda:`, rawData);

      // Normalizar respuesta: puede ser array directo, { instance: [...] }, { instances: [...] }, o { data: [...] }
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
        console.warn(`⚠️ Formato de respuesta no reconocido en ${usedEndpoint}:`, rawData);
        instances = [];
      }

      // Buscar instancia por name o instanceName
      instance = instances.find((inst: any) => 
        inst?.name === instanceName || inst?.instanceName === instanceName
      );

      console.log(`🔍 [${usedEndpoint}] Instancia encontrada:`, instance);

      // VALIDACIÓN ESTRICTA: Solo connectionStatus === 'open' (o state/status) indica sesión activa
      const instanceStatus = instance?.connectionStatus || instance?.state || instance?.status;
      
      if (instance && instanceStatus === 'open') {
        console.log(`✅ [${usedEndpoint}] ${instanceName} - Sesión ACTIVA (status: ${instanceStatus})`);
        setEvolutionStatus(prev => ({ ...prev, [tab]: 'connected' }));
        return true;
      }

      // Si existe pero no está 'open', reportar estado real
      if (instance) {
        console.log(`⏳ [${usedEndpoint}] ${instanceName} - Estado actual: ${instanceStatus}`);
        if (instanceStatus === 'connecting') {
          setEvolutionStatus(prev => ({ ...prev, [tab]: 'connecting' }));
        } else {
          // close, disconnected, etc.
          setEvolutionStatus(prev => ({ ...prev, [tab]: 'disconnected' }));
        }
        return false;
      }

      console.log(`❌ [${usedEndpoint}] ${instanceName} no existe`);
      setEvolutionStatus(prev => ({ ...prev, [tab]: 'disconnected' }));
      return false;
    } catch (error) {
      console.error('Error verificando conexión:', error);
      return false;
    }
  };

  // Helper to get account config safely
  const getAccountData = (accId: 'WA1' | 'WA2'): WhatsAppAccountConfig => {
    const defaultAccounts: Record<'WA1' | 'WA2', WhatsAppAccountConfig> = {
      WA1: {
        id: 'WA1',
        name: 'WhatsApp Cloud WA1 (Línea Principal)',
        phone: whatsAppConfig.connectedPhone || '+1 (786) 450-2819',
        deviceType: `${currentTenant.name || 'Ateendia Cloud CRM'} - Nodo Principal`,
        selectedPipelineId: whatsAppConfig.selectedPipelineId || 'pipe-1',
        defaultPipelineId: 'pipe-1',
        qrConnected: false,
        qrStatus: 'ready_to_scan',
        qrGeneratedAt: 'Hace un momento',
        autoReply: true,
        roundRobinAgents: true,
        webhookUrl: 'https://webhook.atomscloudcrm.com/v1/wa1/inbound',
        alertRecipients: whatsAppConfig.alertRecipients || [
          { id: 'rec-1', name: 'Víctor Aray', role: 'Administrador', phone: '17864502819', isActive: true },
          { id: 'rec-2', name: 'Carolina Méndez', role: 'Supervisora', phone: '13059124433', isActive: true }
        ],
        changeLog: [
          { date: '2026-08-20 10:15', user: 'Víctor Aray', action: 'Modificación', change: 'Vinculación de sesión WhatsApp WA1 vía QR completada' },
          { date: '2026-08-22 14:30', user: 'Víctor Aray', action: 'Modificación', change: 'Pipeline asignado a "Inscripciones ACA & Salud 2026"' },
          { date: '2026-08-28 18:15', user: 'Víctor Aray', action: 'Modificación', change: 'Sesión activa y sincronización multicanal OK' }
        ]
      },
      WA2: {
        id: 'WA2',
        name: 'WhatsApp Cloud WA2 (Línea Secundaria / Soporte)',
        phone: '+1 (786) 555-0244',
        deviceType: `${currentTenant.name || 'Ateendia Cloud CRM'} - Nodo Principal`,
        selectedPipelineId: 'pipe-1',
        defaultPipelineId: 'pipe-1',
        qrConnected: false,
        qrStatus: 'ready_to_scan',
        qrGeneratedAt: 'Hace 5 minutos',
        autoReply: true,
        roundRobinAgents: false,
        webhookUrl: 'https://webhook.atomscloudcrm.com/v1/wa2/inbound',
        alertRecipients: [
          { id: 'rec-w2-1', name: 'Alejandro Ramos', role: 'Agente', phone: '17863229011', isActive: true },
          { id: 'rec-w2-2', name: 'Valeria Gómez', role: 'Agente', phone: '14078713329', isActive: true }
        ],
        changeLog: [
          { date: '2026-08-24 09:30', user: 'Carolina Méndez', action: 'Vinculación', change: 'Enlace de número WhatsApp WA2 (+1 786 555-0244) vía QR exitoso' },
          { date: '2026-08-27 16:20', user: 'Carolina Méndez', action: 'Modificación', change: 'Enrutamiento configurado para Renovaciones y Cobranzas' }
        ]
      }
    };

    if (whatsAppConfig.accounts && whatsAppConfig.accounts[accId]) {
      return whatsAppConfig.accounts[accId];
    }
    return defaultAccounts[accId];
  };

  const currentAcc = getAccountData(activeAccountTab);

  // Alert Recipients form modal / inline
  const [showAddRecipient, setShowAddRecipient] = useState<boolean>(false);
  const [newRecName, setNewRecName] = useState<string>('');
  const [newRecPhone, setNewRecPhone] = useState<string>('');
  const [newRecRole, setNewRecRole] = useState<string>('Supervisor');

  // Test dispatch form
  const [testPhone, setTestPhone] = useState<string>('17865550199');
  const [testCountryCode, setTestCountryCode] = useState<string>('1');
  const [testMessage, setTestMessage] = useState<string>(
     `Hola, mensaje de prueba desde ${currentAcc.name} - ${currentTenant?.name || 'Ateendia Cloud CRM'}.`
  );
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);
  const [testErrorMessage, setTestErrorMessage] = useState<string | null>(null);

  // Keep local pipeline in sync when tab changes
  const handleTabChange = (tab: 'WA1' | 'WA2') => {
    setActiveAccountTab(tab);
    // Sync form states with the new tab's data
    const acc = getAccountData(tab);
    setSelectedPipeline(acc.selectedPipelineId || 'pipe-1');
    setAutoReply(acc.autoReply ?? true);
    setRoundRobin(acc.roundRobinAgents ?? true);
    setTestMessage(`Hola, mensaje de prueba desde ${acc.name} - ${currentTenant?.name || 'Ateendia Cloud CRM'}.`);
    setTestSuccessMessage(null);
    setTestErrorMessage(null);
  };

  // Save Pipeline and routing settings
  const handleSaveSettings = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const pipelineObj = pipelines.find((p) => p.id === selectedPipeline);
    const pipeName = pipelineObj ? pipelineObj.name : selectedPipeline;

    const newLogItem = {
      date: dateStr,
      user: currentUser.name,
      action: 'Modificación',
      change: `Pipeline de entrada configurado en "${pipeName}"`
    };

    updateWhatsAppAccountConfig(activeAccountTab, {
      selectedPipelineId: selectedPipeline,
      defaultPipelineId: selectedPipeline,
      autoReply,
      roundRobinAgents: roundRobin,
      changeLog: [newLogItem, ...(currentAcc.changeLog || [])]
    });

    setTestSuccessMessage(`¡Configuración de ${currentAcc.name} guardada exitosamente!`);
    setTimeout(() => setTestSuccessMessage(null), 4000);
  };

  // Generar Nuevo QR para la pestaña activa - consumo directo de /instance/connect/:instanceName
  const handleGenerateQR = async () => {
    console.log(` Generando QR para ${activeAccountTab}...`);
    const tab = activeAccountTab;
    const instanceName = getInstanceName(tab);
    
    setEvolutionQrCode(prev => ({ ...prev, [tab]: null }));
    setEvolutionStatus(prev => ({ ...prev, [tab]: 'disconnected' }));
    setIsWaitingQr(prev => ({ ...prev, [tab]: false }));
    setQrRetryCount(prev => ({ ...prev, [tab]: 0 }));
    
    if (qrTimerRef.current[tab]) {
      clearInterval(qrTimerRef.current[tab]!);
      qrTimerRef.current[tab] = null;
    }
    if (qrTimeoutRef.current[tab]) {
      clearTimeout(qrTimeoutRef.current[tab]!);
      qrTimeoutRef.current[tab] = null;
    }

    try {
      const qrData = await fetchEvolutionQR(instanceName, tab);
      
      if (!qrData || !evolutionQrCode[tab]) {
        console.error('❌ No se pudo obtener el QR');
        alert('No se pudo obtener el QR. Intenta de nuevo.');
      }
    } finally {
      setIsFetchingQr(prev => ({ ...prev, [tab]: false }));
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newLogItem = {
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${timeStr}`,
      user: currentUser.name,
      action: 'Actualización QR',
      change: `Nuevo código QR generado para ${currentAcc.name} (Evolution API)`
    };

    updateWhatsAppAccountConfig(activeAccountTab, {
      qrGeneratedAt: `Generado a las ${timeStr}`,
      qrStatus: 'ready_to_scan',
      changeLog: [newLogItem, ...(currentAcc.changeLog || [])]
    });
  };

  // Verificar conexión (equivalente a handleSimulateScan)
  const handleVerifyConnection = async () => {
    setIsSimulatingScan(true);
    
    const tab = activeAccountTab;
    const instanceName = getInstanceName(tab);

    const isConnected = await checkEvolutionConnection(instanceName, tab);

    if (isConnected) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const newLogItem = {
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${timeStr}`,
        user: currentUser.name,
        action: 'Vinculación',
        change: `Sesión de ${currentAcc.name} vinculada con éxito vía QR (Evolution API)`
      };

      updateWhatsAppAccountConfig(activeAccountTab, {
        qrConnected: true,
        qrStatus: 'connected',
        qrGeneratedAt: 'Sesión activa',
        changeLog: [newLogItem, ...(currentAcc.changeLog || [])]
      });

      setTestSuccessMessage(`¡Dispositivo vinculado con éxito para ${currentAcc.name}!`);
      setTimeout(() => setTestSuccessMessage(null), 4000);
    } else {
      alert('Aún no se ha escaneado el QR en WhatsApp. Por favor escanea el código QR con tu teléfono.');
    }
    
    setIsSimulatingScan(false);
  };

  // Desconectar sesión
  const handleDisconnect = () => {
    if (!confirm(`¿Estás seguro de desvincular la sesión de ${currentAcc.name}?`)) return;

    const tab = activeAccountTab;
    const instanceName = getInstanceName(tab);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newLogItem = {
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${timeStr}`,
      user: currentUser.name,
      action: 'Desconexión',
      change: `Sesión de ${currentAcc.name} cerrada por el usuario`
    };

    updateWhatsAppAccountConfig(activeAccountTab, {
      qrConnected: false,
      qrStatus: 'disconnected',
      changeLog: [newLogItem, ...(currentAcc.changeLog || [])]
    });

    // Limpiar estado local
    setEvolutionQrCode(prev => ({ ...prev, [tab]: null }));
    setEvolutionStatus(prev => ({ ...prev, [tab]: 'disconnected' }));
    if (qrTimerRef.current[tab]) {
      clearInterval(qrTimerRef.current[tab]!);
      qrTimerRef.current[tab] = null;
    }
  };

     // Simulate scanning QR - AHORA VERIFICA CONEXIÓN REAL Y RECARGA
  const handleSimulateScan = async () => {
    setIsSimulatingScan(true);
    
    // Forzar recarga de la configuración actual
    const acc = getAccountData(activeAccountTab);
    
    // Verificar si está conectado en Evolution API
    const instanceName = getInstanceName(activeAccountTab);
    const isConnected = await checkEvolutionConnection(instanceName, activeAccountTab);
    
    if (isConnected) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const newLogItem = {
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${timeStr}`,
        user: currentUser.name,
        action: 'Vinculación',
        change: `Sesión de ${currentAcc.name} vinculada con éxito vía QR (Evolution API)`
      };

      updateWhatsAppAccountConfig(activeAccountTab, {
        qrConnected: true,
        qrStatus: 'connected',
        qrGeneratedAt: 'Sesión activa',
        changeLog: [newLogItem, ...(currentAcc.changeLog || [])]
      });

      setTestSuccessMessage(`¡Dispositivo vinculado con éxito para ${currentAcc.name}!`);
      setTimeout(() => setTestSuccessMessage(null), 4000);
      
      // No se recarga la página, el polling se encarga de las actualizaciones
    } else {
      alert('Aún no se ha escaneado el QR en WhatsApp. Por favor escanea el código QR con tu teléfono.');
    }
    
    setIsSimulatingScan(false);
  };

  // Add Alert Recipient
  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecName || !newRecPhone) return;

    const cleanPhone = newRecPhone.replace(/\D/g, '');
    const newRec: WhatsAppAlertRecipient = {
      id: `rec-${Date.now()}`,
      name: newRecName,
      phone: cleanPhone,
      role: newRecRole,
      isActive: true,
      active: true
    };

    const updatedRecipients = [...(currentAcc.alertRecipients || []), newRec];

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newLogItem = {
      date: dateStr,
      user: currentUser.name,
      action: 'Creación',
      change: `Destinatario de alerta agregado: ${newRecName} (${cleanPhone})`
    };

    updateWhatsAppAccountConfig(activeAccountTab, {
      alertRecipients: updatedRecipients,
      changeLog: [newLogItem, ...(currentAcc.changeLog || [])]
    });

    setShowAddRecipient(false);
    setNewRecName('');
    setNewRecPhone('');
  };

  // Remove Alert Recipient
  const handleRemoveRecipient = (recId: string) => {
    const target = (currentAcc.alertRecipients || []).find((r) => r.id === recId);
    const updated = (currentAcc.alertRecipients || []).filter((r) => r.id !== recId);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newLogItem = {
      date: dateStr,
      user: currentUser.name,
      action: 'Eliminación',
      change: `Destinatario eliminado: ${target?.name || recId}`
    };

    updateWhatsAppAccountConfig(activeAccountTab, {
      alertRecipients: updated,
      changeLog: [newLogItem, ...(currentAcc.changeLog || [])]
    });
  };

  // Toggle Alert Recipient active state
  const handleToggleRecipient = (recId: string) => {
    const updated = (currentAcc.alertRecipients || []).map((r) =>
      r.id === recId ? { ...r, isActive: !r.isActive, active: !r.isActive } : r
    );
    updateWhatsAppAccountConfig(activeAccountTab, { alertRecipients: updated });
  };

  // Helper to format phone to E.164 (clean digits only, no + or spaces)
  const formatPhoneE164 = (countryCode: string, localNumber: string): string => {
    const cleanLocal = localNumber.replace(/\D/g, '');
    return `${countryCode}${cleanLocal}`;
  };

  // Verificar estado de conexión de la instancia antes de enviar
  const checkInstanceConnection = async (instanceName: string): Promise<{ connected: boolean; status?: string }> => {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        headers: { 'apikey': EVOLUTION_API_KEY }
      });
      const instances = await response.json();
      const instance = instances.find((inst: any) => inst.name === instanceName);
      
      if (instance && instance.connectionStatus === 'open') {
        return { connected: true, status: instance.connectionStatus };
      }
      return { connected: false, status: instance?.connectionStatus || 'not_found' };
    } catch (error) {
      console.error('Error verificando conexión:', error);
      return { connected: false, status: 'error' };
    }
  };

  // Send Test Message via Evolution API
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMessage || !testCountryCode) return;

    setIsSendingTest(true);
    setTestSuccessMessage(null);
    setTestErrorMessage(null);

    const instanceName = `${currentTenant.id}-${activeAccountTab.toLowerCase()}`;
    const formattedPhone = formatPhoneE164(testCountryCode, testPhone);

    // 1. Verificar estado de conexión antes de enviar
    const connectionCheck = await checkInstanceConnection(instanceName);
    if (!connectionCheck.connected) {
      const errorMsg = `La sesión de WhatsApp (${activeAccountTab}) está desconectada (estado: ${connectionCheck.status}). Por favor presiona 'Verificar Conexión' o 'Generar Nuevo QR' para reconectar antes de enviar.`;
      setTestErrorMessage(`❌ ${errorMsg}`);
      
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const newLogItem = {
        date: dateStr,
        user: currentUser.name,
        action: 'Error Envío',
        change: `Fallo envío de prueba - instancia desconectada: ${errorMsg}`
      };
      
      updateWhatsAppAccountConfig(activeAccountTab, {
        changeLog: [newLogItem, ...(currentAcc.changeLog || [])]
      });
      
      setIsSendingTest(false);
      setTimeout(() => setTestErrorMessage(null), 8000);
      return;
    }

    try {
      const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: testMessage
        })
      });

      const data = await response.json();

      if (response.ok && data) {
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const newLogItem = {
          date: dateStr,
          user: currentUser.name,
          action: 'Envío de Prueba',
          change: `Mensaje de prueba enviado vía Evolution API a ${formattedPhone} (${activeAccountTab})`
        };

        updateWhatsAppAccountConfig(activeAccountTab, {
          changeLog: [newLogItem, ...(currentAcc.changeLog || [])]
        });

        setTestSuccessMessage(`¡Mensaje de prueba enviado exitosamente a ${formattedPhone} vía ${activeAccountTab}!`);
      } else {
        // Capturar error detallado de la respuesta (incluyendo 500)
        const errorDetail = data?.message || data?.error || data?.details || JSON.stringify(data);
        throw new Error(`Error ${response.status}: ${errorDetail}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al enviar mensaje';
      setTestErrorMessage(`❌ Error: ${errorMsg}`);
      
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const newLogItem = {
        date: dateStr,
        user: currentUser.name,
        action: 'Error Envío',
        change: `Fallo envío de prueba a ${formattedPhone}: ${errorMsg}`
      };
      
      updateWhatsAppAccountConfig(activeAccountTab, {
        changeLog: [newLogItem, ...(currentAcc.changeLog || [])]
      });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => {
        setTestSuccessMessage(null);
        setTestErrorMessage(null);
      }, 6000);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(currentAcc.webhookUrl || 'https://webhook.atomscloudcrm.com/v1/wa1/inbound');
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

// Initialize connection state on mount / tab change - NO auto-generate QR
  useEffect(() => {
    const initializeWhatsApp = async () => {
      // Verificar si hay conexión activa
      const instanceName = getInstanceName(activeAccountTab);
      const isConnected = await checkEvolutionConnection(instanceName, activeAccountTab);
      
      if (isConnected) {
        // Si ya está conectado, actualizar UI
        updateWhatsAppAccountConfig(activeAccountTab, {
          qrConnected: true,
          qrStatus: 'connected',
          qrGeneratedAt: 'Sesión activa'
        });
        // Limpiar countdown si existe
        if (qrTimerRef.current[activeAccountTab]) {
          clearInterval(qrTimerRef.current[activeAccountTab]!);
          qrTimerRef.current[activeAccountTab] = null;
        }
      } else if (!isConnected && evolutionStatus[activeAccountTab] !== 'connecting') {
        // Si no está conectado, NO generar QR automáticamente (mostrar indicador discreto)
        // El usuario decidirá cuándo generar QR manualmente
        console.log('No hay sesión activa, esperando acción manual del usuario');
      }
    };

    initializeWhatsApp();

    // Polling: verificar cada 5 segundos el estado de AMBAS pestañas (solo estado, sin QR auto)
    const pollInterval = setInterval(async () => {
      // Verificar pestaña activa
      const activeInstanceName = getInstanceName(activeAccountTab);
      const isConnected = await checkEvolutionConnection(activeInstanceName, activeAccountTab);
      if (isConnected && evolutionStatus[activeAccountTab] !== 'connected') {
        setEvolutionStatus(prev => ({ ...prev, [activeAccountTab]: 'connected' }));
        updateWhatsAppAccountConfig(activeAccountTab, {
          qrConnected: true,
          qrStatus: 'connected',
          qrGeneratedAt: 'Sesión activa'
        });
        // Limpiar countdown
        if (qrTimerRef.current[activeAccountTab]) {
          clearInterval(qrTimerRef.current[activeAccountTab]!);
          qrTimerRef.current[activeAccountTab] = null;
        }
      } else if (!isConnected && evolutionStatus[activeAccountTab] === 'connected') {
        setEvolutionStatus(prev => ({ ...prev, [activeAccountTab]: 'disconnected' }));
      }

      // Verificar pestaña inactiva (solo estado, sin QR auto)
      const inactiveTab = activeAccountTab === 'WA1' ? 'WA2' : 'WA1';
      const inactiveInstanceName = getInstanceName(inactiveTab);
      try {
        const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
          headers: { 'apikey': EVOLUTION_API_KEY }
        });
        const instances = await response.json();
        const instance = instances.find((inst: any) => inst.name === inactiveInstanceName);
        
        if (instance && instance.connectionStatus === 'open') {
          setEvolutionStatus(prev => ({ ...prev, [inactiveTab]: 'connected' }));
        } else if (instance) {
          setEvolutionStatus(prev => ({ ...prev, [inactiveTab]: instance.connectionStatus === 'connecting' ? 'connecting' : 'disconnected' }));
        } else {
          setEvolutionStatus(prev => ({ ...prev, [inactiveTab]: 'disconnected' }));
        }
      } catch (e) {
        // Silenciar errores de polling de pestaña inactiva
      }
    }, 5000); // Cada 5 segundos
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [activeAccountTab]);

  // Suscribirse a los eventos de Socket.io del Evolution API con monitoreo de errores específicos
  const socketService = useWhatsAppSocket();

  useEffect(() => {
    const unsubscribeConnection = socketService?.on('connection.update', (data: any) => {
      const { instance, connectionStatus, disconnectReason } = data;
      const instanceName = instance || '';
      
      // VERIFICAR errores específicos de límite de dispositivos
      if ((connectionStatus === 'close' || connectionStatus === 'disconnected' || connectionStatus === 'logged_out') && 
          (disconnectReason === 401 || disconnectReason === 'session_logged_out')) {
        // Mostrar alerta clara sobre límite de dispositivos
        alert(`Límite de dispositivos de WhatsApp alcanzado (máximo 4). Desconecta una sesión desde tu teléfono e reintenta.`);
        // Actualizar estado local
        setEvolutionStatus(prev => ({ ...prev, [instanceName as 'WA1' | 'WA2']: 'disconnected' }));
        return;
      }

      if (evolutionStatus[instanceName as 'WA1' | 'WA2'] === connectionStatus) return;

      if (connectionStatus === 'open' || connectionStatus === 'connected') {
        // Conexión exitosa
        setEvolutionStatus(prev => ({ ...prev, [instanceName as 'WA1' | 'WA2']: 'connected' }));
        updateWhatsAppAccountConfig(instanceName as 'WA1' | 'WA2', {
          qrConnected: true,
          qrStatus: 'connected',
          qrGeneratedAt: 'Sesión activa'
        });
        // Limpiar countdown
        if (qrTimerRef.current[instanceName as 'WA1' | 'WA2']!) {
          clearInterval(qrTimerRef.current[instanceName as 'WA1' | 'WA2']!);
          qrTimerRef.current[instanceName as 'WA1' | 'WA2'] = null;
        }
        // Notificar al TenantContext para habilitar envío de mensajes
        console.log(`✅ WhatsApp ${instanceName} conectado vía Socket.io`);
      } else if (connectionStatus === 'close' || connectionStatus === 'disconnected' || connectionStatus === 'logged_out') {
        // Desconexión (caso general, no el de límite de dispositivos)
        if (!((disconnectReason === 401 || disconnectReason === 'session_logged_out') && 
              (connectionStatus === 'close' || connectionStatus === 'disconnected' || connectionStatus === 'logged_out'))) {
          setEvolutionStatus(prev => ({ ...prev, [instanceName as 'WA1' | 'WA2']: 'disconnected' }));
          alert(`La sesión de WhatsApp ${instanceName} ha sido desconectada. ${data.lastDisconnect?.reason || ''}`);
          qrTimerRef.current[instanceName as 'WA1' | 'WA2'] = null;
          // Permitir regenerar QR automáticamente
          setEvolutionQrCode(prev => ({ ...prev, [instanceName as 'WA1' | 'WA2']: null }));
        }
      }
    });

    const unsubscribeQr = socketService?.on('qrcode', (data: any) => {
      const { instance, qrCode } = data;
      
      // Manejar múltiples formatos de respuesta
      const qrBase64 = qrCode?.base64 || qrCode?.code || qrCode || data.base64 || data.code || null;
      
      if (qrBase64) {
        setEvolutionQrCode(prev => ({ ...prev, [instance as 'WA1' | 'WA2']: qrBase64 }));
        setIsWaitingQr(prev => ({ ...prev, [instance as 'WA1' | 'WA2']: false }));
        setQrRetryCount(prev => ({ ...prev, [instance as 'WA1' | 'WA2']: 0 }));
        setEvolutionStatus(prev => ({ ...prev, [instance as 'WA1' | 'WA2']: 'connecting' }));
        startQrCountdown(instance as 'WA1' | 'WA2');
      }
    });

    const unsubscribeCreds = socketService?.on('creds.update', (data: any) => {
      const { instance, creds } = data;
      // Actualizar credenciales persistidas si es necesario
      console.log('🔄 Credenciales actualizadas para', instance);
    });

    // Conectar al socket.io del Evolution API
    socketService?.connect();

    // POLLING DE RESCATE: verificar cada 5 segundos usando endpoint de conexión directa
    const pollInterval = setInterval(async () => {
      (['WA1', 'WA2'] as const).forEach(async (tab) => {
        const instanceName = getInstanceName(tab);
        try {
          const stateResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
            headers: { 'apikey': EVOLUTION_API_KEY }
          });
          if (stateResponse.ok) {
            const stateData = await stateResponse.json();
            const status = stateData?.state || stateData?.status || stateData?.connectionStatus;
            
            if (status === 'open' && evolutionStatus[tab] !== 'connected') {
              // Si está abierto, cerrar el modal de QR, actualizar UI y marcar como conectado
              setEvolutionStatus(prev => ({ ...prev, [tab]: 'connected' }));
              updateWhatsAppAccountConfig(tab, {
                qrConnected: true,
                qrStatus: 'connected',
                qrGeneratedAt: 'Sesión activa'
              });
              if (qrTimerRef.current[tab]) {
                clearInterval(qrTimerRef.current[tab]!);
                qrTimerRef.current[tab] = null;
              }
              // Mostrar modal de QR si hay QR generado y el usuario puede escanear
              if (evolutionQrCode[tab]) {
                alert('¡WhatsApp conectado! El código QR ya no es necesario.');
                setEvolutionQrCode(prev => ({ ...prev, [tab]: null }));
              }
            } else if (status !== 'open' && evolutionStatus[tab] === 'connected') {
              // Si dejó de estar abierto, actualizar estado
              setEvolutionStatus(prev => ({ ...prev, [tab]: 'disconnected' }));
            }
          }
        } catch (error) {
          // Endpoint de connectionState no disponible, silenciar error
        }
      });
    }, 5000);

    return () => {
      unsubscribeConnection();
      unsubscribeQr();
      unsubscribeCreds();
      socketService?.disconnect();
      clearInterval(pollInterval);
    };
  }, [socketService, evolutionStatus, updateWhatsAppAccountConfig, qrTimerRef, startQrCountdown, qrCountdown, activeAccountTab]);

  return (
    <div className="space-y-6">
      {/* Account Selector Tabs (WA1 vs WA2) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Configuración de Cuentas WhatsApp Cloud
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Multi-Línea 2.0
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Administra tus números de WhatsApp, códigos QR de sesión, destinatarios de alertas y pruebas en tiempo real.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
          <button
            id="tab-wa1-config"
            onClick={() => handleTabChange('WA1')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 md:flex-initial justify-center ${
              activeAccountTab === 'WA1'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${evolutionStatus.WA1 === 'connected' ? 'bg-emerald-300 animate-pulse' : evolutionStatus.WA1 === 'connecting' ? 'bg-amber-300 animate-pulse' : 'bg-amber-400'}`} />
            <span>WA1: Línea Principal</span>
            <span className="text-[10px] opacity-80 font-mono">({getAccountData('WA1').phone.split(' ')[1] || '786'})</span>
          </button>

          <button
            id="tab-wa2-config"
            onClick={() => handleTabChange('WA2')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 md:flex-initial justify-center ${
              activeAccountTab === 'WA2'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${evolutionStatus.WA2 === 'connected' ? 'bg-purple-300 animate-pulse' : evolutionStatus.WA2 === 'connecting' ? 'bg-amber-300 animate-pulse' : 'bg-amber-400'}`} />
            <span>WA2: Soporte / Cobranza</span>
            <span className="text-[10px] opacity-80 font-mono">({getAccountData('WA2').phone.split(' ')[1] || '555'})</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {testSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{testSuccessMessage}</span>
          </div>
          <button onClick={() => setTestSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
            Cerrar
          </button>
        </div>
      )}

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Pipeline, QR Pairing, Quick Webhook */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Pipeline & Routing Config */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Pipeline de Entrada de WhatsApp ({activeAccountTab})</h3>
                  <p className="text-xs text-slate-500">
                    Define en qué embudo y etapa se crearán automáticamente los contactos entrantes de esta línea.
                  </p>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                activeAccountTab === 'WA1' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {activeAccountTab}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pipeline Asignado
                </label>
                <select
                  id={`select-pipeline-${activeAccountTab}`}
                  value={selectedPipeline}
                  onChange={(e) => setSelectedPipeline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {pipelines.map((pipe) => (
                    <option key={pipe.id} value={pipe.id}>
                      {pipe.name} ({pipe.stages?.length || 5} etapas)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Número Telefónico Vinculado
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={currentAcc.phone}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-mono"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            {/* Smart Routing Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={autoReply}
                  onChange={(e) => setAutoReply(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Respuesta Automática IA</span>
                  <span className="text-[11px] text-slate-500">Responder saludos fuera de horario</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={roundRobin}
                  onChange={(e) => setRoundRobin(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Asignación Round-Robin</span>
                  <span className="text-[11px] text-slate-500">Repartir leads equitativamente</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id={`btn-save-settings-${activeAccountTab}`}
                onClick={handleSaveSettings}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Configuración ({activeAccountTab})</span>
              </button>
            </div>
          </div>

          {/* Card 2: Vinculación del Sistema (QR & Sesión) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Vinculación del Sistema WhatsApp ({activeAccountTab})</h3>
                  <p className="text-xs text-slate-500">Escanea el código con tu WhatsApp para enlazar la sesión de forma persistente.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id={`btn-refresh-qr-${activeAccountTab}`}
                  onClick={handleGenerateQR}
                  disabled={getCurrentIsFetching()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${getCurrentIsFetching() ? 'animate-spin' : ''}`} />
                  <span>{getCurrentIsFetching() ? 'Generando...' : 'Generar Nuevo QR'}</span>
                </button>
              </div>
            </div>

            {/* QR View & Device Info side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              
              {/* QR Container */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="relative p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                  {/* QR Code - Real o Simulado */}
                  {isWaitingQr[activeAccountTab] ? (
                      <div className="w-36 h-36 rounded-lg flex items-center justify-center mx-auto mb-3 bg-amber-50 border border-amber-200">
                        <AlertCircle className="w-8 h-8 text-amber-600 animate-pulse" />
                        <span className="text-xs text-amber-800 ml-2">Esperando QR...</span>
                      </div>
                    ) : getCurrentQrCode() && getCurrentStatus() === 'connecting' ? (
                    // QR REAL de Evolution API
                    <img 
                      src={getCurrentQrCode()} 
                      alt="WhatsApp QR Code" 
                      className="w-36 h-36 rounded-lg"
                    />
                  ) : (
                    // QR Simulado (fallback)
                    <svg className="w-36 h-36" viewBox="0 0 160 160" fill="none">
                      <rect width="160" height="160" fill="white" rx="8" />
                      {/* Top-Left Finder */}
                      <rect x="12" y="12" width="40" height="40" rx="6" fill="#0f172a" />
                      <rect x="18" y="18" width="28" height="28" rx="3" fill="white" />
                      <rect x="24" y="24" width="16" height="16" rx="2" fill="#059669" />
                      {/* Top-Right Finder */}
                      <rect x="108" y="12" width="40" height="40" rx="6" fill="#0f172a" />
                      <rect x="114" y="18" width="28" height="28" rx="3" fill="white" />
                      <rect x="120" y="24" width="16" height="16" rx="2" fill="#059669" />
                      {/* Bottom-Left Finder */}
                      <rect x="12" y="108" width="40" height="40" rx="6" fill="#0f172a" />
                      <rect x="18" y="114" width="28" height="28" rx="3" fill="white" />
                      <rect x="24" y="120" width="16" height="16" rx="2" fill="#059669" />
                      {/* Data Matrix Dots */}
                      <rect x="58" y="16" width="10" height="10" rx="2" fill="#334155" />
                      <rect x="74" y="16" width="18" height="8" rx="2" fill="#334155" />
                      <rect x="58" y="32" width="16" height="8" rx="2" fill="#0f172a" />
                      <rect x="80" y="32" width="14" height="12" rx="2" fill="#334155" />
                      <rect x="58" y="48" width="8" height="18" rx="2" fill="#334155" />
                      <rect x="72" y="52" width="18" height="18" rx="2" fill="#059669" />
                      <rect x="96" y="52" width="10" height="12" rx="2" fill="#334155" />
                      <rect x="112" y="58" width="16" height="12" rx="2" fill="#334155" />
                      <rect x="134" y="58" width="14" height="18" rx="2" fill="#0f172a" />
                      <rect x="16" y="58" width="34" height="8" rx="2" fill="#334155" />
                      <rect x="16" y="74" width="14" height="18" rx="2" fill="#334155" />
                      <rect x="36" y="78" width="16" height="12" rx="2" fill="#0f172a" />
                      <rect x="58" y="78" width="18" height="12" rx="2" fill="#334155" />
                      <rect x="82" y="78" width="12" height="16" rx="2" fill="#334155" />
                      <rect x="100" y="78" width="22" height="12" rx="2" fill="#059669" />
                      <rect x="128" y="82" width="20" height="12" rx="2" fill="#334155" />
                      <rect x="58" y="98" width="14" height="16" rx="2" fill="#334155" />
                      <rect x="78" y="100" width="18" height="12" rx="2" fill="#0f172a" />
                      <rect x="102" y="98" width="14" height="18" rx="2" fill="#334155" />
                      <rect x="122" y="100" width="26" height="10" rx="2" fill="#334155" />
                      <rect x="58" y="122" width="22" height="12" rx="2" fill="#0f172a" />
                      <rect x="86" y="120" width="16" height="18" rx="2" fill="#059669" />
                      <rect x="108" y="124" width="18" height="12" rx="2" fill="#334155" />
                      <rect x="132" y="120" width="16" height="24" rx="2" fill="#334155" />
                      <rect x="58" y="140" width="14" height="8" rx="2" fill="#334155" />
                      <rect x="78" y="142" width="24" height="8" rx="2" fill="#334155" />
                      <rect x="108" y="142" width="14" height="8" rx="2" fill="#0f172a" />
                    </svg>
                  )}
                  
                  {isWaitingQr[activeAccountTab] && (
                    <div className="mt-2 text-center">
                      <button
                        onClick={handleGenerateQR}
                        disabled={getCurrentIsFetching()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${getCurrentIsFetching() ? 'animate-spin' : ''}`} />
                        <span>Reintentar generación</span>
                      </button>
                    </div>
                  )}
                  
                  {getCurrentStatus() === 'connected' && (
                    <div className="absolute inset-0 bg-emerald-900/15 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                      <div className="bg-white/95 text-emerald-700 px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-md flex items-center gap-1.5 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Enlazado</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center mt-2.5">
                  <p className="text-[11px] text-slate-500 font-medium">
  {getCurrentStatus() === 'connecting' && getCurrentCountdown() > 0 ? (
    <span className="flex items-center gap-1">
      <Clock className="w-3 h-3" />
      Escanea el QR con WhatsApp ({getCurrentCountdown()}s restantes)
    </span>
  ) : getCurrentStatus() === 'connecting' && getCurrentCountdown() === 0 ? (
    <span className="text-red-600 font-bold">⚠️ QR Expirado - Genera uno nuevo</span>
  ) : (
    currentAcc.qrGeneratedAt || 'Hace un momento'
  )}
</p>
                  {getCurrentStatus() === 'connected' && (
                    <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ Conectado con Evolution API</p>
                  )}
                </div>
              </div>

             {/* Status Info */}
              <div className="sm:col-span-7 space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">ESTADO DEL SISTEMA:</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                      evolutionStatus === 'connected' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${evolutionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {evolutionStatus === 'connected' ? 'VINCULADO (SESIÓN ACTIVA)' : 'DESCONECTADO / SESIÓN CERRADA'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-200/60 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Instancia:</span>
                      <span className="font-semibold text-slate-800">
                        {currentTenant.id}-${activeAccountTab.toLowerCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Canal:</span>
                      <span className="font-semibold text-slate-800">WhatsApp Web Multi-Device v2.3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Uptime:</span>
                      <span className="font-semibold text-emerald-600">99.98% Operativo</span>
                    </div>
                  </div>
                </div>

                {/* Simulation / Reconnect buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    id={`btn-verify-connection-${activeAccountTab}`}
                    onClick={handleVerifyConnection}
                    disabled={isSimulatingScan}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSimulatingScan ? 'Verificando...' : 'Verificar Conexión'}</span>
                  </button>

                  <button
                    id={`btn-disconnect-${activeAccountTab}`}
                    onClick={handleDisconnect}
                    className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-200"
                  >
                    Desvincular
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook & n8n Integration endpoint for this line */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold tracking-wide">Webhook Endpoint Inbound ({activeAccountTab})</span>
              </div>
              <span className="text-[10px] bg-purple-500/30 text-purple-300 font-mono px-2 py-0.5 rounded-md border border-purple-400/30">
                JSON REST
              </span>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
              <code className="text-[11px] text-purple-200 font-mono flex-1 truncate">
                {currentAcc.webhookUrl || `https://webhook.atomscloudcrm.com/v1/${activeAccountTab.toLowerCase()}/inbound`}
              </code>
              <button
                onClick={handleCopyWebhook}
                className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                title="Copiar URL"
              >
                {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Alert Recipients, Live Test Message, Change Log */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 3: Destinatarios de Alertas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Destinatarios de Alertas</h3>
                  <p className="text-xs text-slate-500">Notificar a agentes cuando entra un lead en {activeAccountTab}</p>
                </div>
              </div>

              <button
                id={`btn-open-add-recipient-${activeAccountTab}`}
                onClick={() => setShowAddRecipient(!showAddRecipient)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            {/* Add recipient inline form */}
            {showAddRecipient && (
              <form onSubmit={handleAddRecipient} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="text-xs font-bold text-slate-800">Nuevo Destinatario de Alerta:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nombre Completo"
                    value={newRecName}
                    onChange={(e) => setNewRecName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Teléfono (ej: 17864502819)"
                    value={newRecPhone}
                    onChange={(e) => setNewRecPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <select
                    value={newRecRole}
                    onChange={(e) => setNewRecRole(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Supervisora">Supervisora</option>
                    <option value="Agente">Agente</option>
                    <option value="Soporte">Soporte Técnico</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRecipient(false)}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-xs font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Recipients Table */}
            <div className="overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Usuario</th>
                    <th className="px-3 py-2.5">Teléfono</th>
                    <th className="px-3 py-2.5 text-center">Estado</th>
                    <th className="px-3 py-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(currentAcc.alertRecipients || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-slate-400 text-xs">
                        No hay destinatarios registrados para esta línea.
                      </td>
                    </tr>
                  ) : (
                    currentAcc.alertRecipients.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-slate-800">
                          <div>{rec.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{rec.role}</div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">{rec.phone}</td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => handleToggleRecipient(rec.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.isActive ?? true
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${rec.isActive ?? true ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {rec.isActive ?? true ? 'Activas' : 'Pausado'}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={() => handleRemoveRecipient(rec.id)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Eliminar destinatario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 4: Prueba de Envío en Vivo */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Prueba de Envío ({activeAccountTab})</h3>
                  <p className="text-xs text-slate-500">Verifica la entrega inmediata de mensajes desde esta línea.</p>
                </div>
              </div>
            </div>

            {testSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{testSuccessMessage}</span>
              </div>
            )}

            {testErrorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{testErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSendTest} className="space-y-3">
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Nota:</strong> Seleccione el código de país e ingrese el número local sin el signo +.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Teléfono (Código País + Número Local)
                </label>
                <div className="flex gap-2">
                  <div className="relative w-32 flex-shrink-0">
                    <select
                      value={testCountryCode}
                      onChange={(e) => setTestCountryCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.dialCode} ({c.name})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <span className="text-xs text-slate-500">🌐</span>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      required
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Número local (ej: 7865550199)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      inputMode="numeric"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Formato E.164 resultante: +{testCountryCode}{testPhone.replace(/\D/g, '') || '7865550199'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mensaje de Prueba
                </label>
                <textarea
                  rows={2}
                  required
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                id={`btn-send-test-${activeAccountTab}`}
                disabled={isSendingTest}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-pulse' : ''}`} />
                <span>{isSendingTest ? 'Transmitiendo...' : `Enviar Mensaje de Prueba desde ${activeAccountTab}`}</span>
              </button>
            </form>
          </div>

          {/* Card 5: Log de Cambios & Auditoría */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Log de Cambios & Eventos ({activeAccountTab})</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Últimas 24h</span>
            </div>

            <div className="overflow-y-auto max-h-44 divide-y divide-slate-100 text-xs">
              {(currentAcc.changeLog || []).map((log, idx) => (
                <div key={idx} className="py-2 flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{log.user}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                        {log.action || 'Modificación'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{log.change || log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">{log.date}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
