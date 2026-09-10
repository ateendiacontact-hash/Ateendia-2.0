import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Smartphone,
  Sparkles,
  Search,
  Paperclip,
  Smile,
  Mic,
  Play,
  Pause,
  Download,
  Eye,
  FileText,
  CheckCheck,
  MoreVertical,
  Sliders,
  Settings,
  Phone,
  ArrowRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Instagram,
  Facebook,
  SendIcon
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { DomainService } from '../../domain/domainService';
import { MediaViewerModal, MediaViewerItem } from '../media/MediaViewerModal';
import { EmojiPickerPopup, QUICK_EMOJIS } from '../chat/EmojiPickerPopup';
import { StickerGifPicker } from '../chat/StickerGifPicker';
import { VoiceAudioRecorder } from '../chat/VoiceAudioRecorder';
import { WhatsAppConversation } from '../../types';
import { useWhatsAppSocket } from '../../services/whatsappSocketService';

interface WhatsAppModuleProps {
  onNavigateToTab?: (tab: string) => void;
}
// --- INICIO: Configuración de Evolution API ---
const EVOLUTION_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || 'http://13.140.37.155:8080';
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || 'evolution2026';

const getInstanceName = (tenantId: string, account: 'WA1' | 'WA2') => `${tenantId}-${account.toLowerCase()}`;

const checkWhatsAppConnection = async (instanceName: string) => {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    const data = await response.json();
    const instance = data.find((inst: any) => inst.name === instanceName || inst.instanceName === instanceName);
    if (!instance) return 'disconnected';
    // VALIDACIÓN ESTRICTA: Solo connectionStatus === 'open' = connected
    if (instance.connectionStatus === 'open') return 'connected';
    if (instance.connectionStatus === 'connecting') return 'qr';
    return 'disconnected';
  } catch (error) {
    return 'disconnected';
  }
};

// Función para obtener el QR de Evolution API - consumo directo de GET /instance/connect/:instanceName
  const getWhatsAppQR = async (instanceName: string): Promise<string | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
        headers: { 'apikey': EVOLUTION_API_KEY },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      return data.base64 || data.qrcode?.base64 || data.qrcode?.code || data.code || null;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn(`⏰ Timeout de 10s al obtener QR para ${instanceName}`);
      } else {
        console.error('Error obteniendo QR:', error);
      }
      return null;
    }
  };

const sendEvolutionMessage = async (instanceName: string, phone: string, text: string) => {
  try {
    await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: phone.replace(/\D/g, ''), text: text })
    });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
  }
};
// --- FIN: Configuración de Evolution API ---
export const WhatsAppModule: React.FC<WhatsAppModuleProps> = ({ onNavigateToTab }) => {
  const {
    currentTenant,
    currentUser,
    whatsAppConfig,
    conversations,
    activeConversationId,
    setActiveConversationId,
    sendWhatsAppMessage,
    startWhatsAppConversation,
    toggleWhatsAppReaction,
    templates,
    clients
  } = useTenant();

  // Channel filter: 'ALL' | 'WA1' | 'WA2' | 'instagram' | 'facebook' | 'landing'
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<'ALL' | 'WA1' | 'WA2' | 'instagram' | 'facebook' | 'landing'>('ALL');
  // Estados para controlar el QR y la conexión
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'qr'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrModalTab, setQrModalTab] = useState<'WA1' | 'WA2'>('WA1');
  // Estados para timeout y reintentos de QR
  const [isWaitingQr, setIsWaitingQr] = useState<boolean>(false);
  const [qrRetryCount, setQrRetryCount] = useState<number>(0);
  const qrTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Search filter
  const [inboxSearch, setInboxSearch] = useState('');

  // Composer inputs
  const [inboxInput, setInboxInput] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Rich Media & Reaction states
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [showComposerEmojiPicker, setShowComposerEmojiPicker] = useState<boolean>(false);
  const [showStickerPicker, setShowStickerPicker] = useState<boolean>(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState<boolean>(false);
  const [viewerItem, setViewerItem] = useState<MediaViewerItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

const fileInputRef = useRef<HTMLInputElement>(null);
   const messagesEndRef = useRef<HTMLDivElement>(null);
   const scrollContainerRef = useRef<HTMLDivElement>(null);
   const [showScrollButtons, setShowScrollButtons] = useState(false);

   // Conversations filtered by channel & account line & search keyword
  const filteredConversations = conversations.filter((c) => {
    const channelSource = (c.channelSource || 'whatsapp') as 'whatsapp' | 'instagram' | 'facebook' | 'landing';
    const account = (c.account || 'WA1') as 'WA1' | 'WA2';

    switch (selectedChannelFilter) {
      case 'WA1':
        if (channelSource !== 'whatsapp' || account !== 'WA1') return false;
        break;
      case 'WA2':
        if (channelSource !== 'whatsapp' || account !== 'WA2') return false;
        break;
      case 'instagram':
        if (channelSource !== 'instagram') return false;
        break;
      case 'facebook':
        if (channelSource !== 'facebook') return false;
        break;
      case 'landing':
        if (channelSource !== 'landing') return false;
        break;
      default:
        break;
    }

    const term = (inboxSearch || '').toLowerCase().trim();
    if (!term) return true;

    const nameMatch = (c.contactName || c.clientName || '').toLowerCase().includes(term);
    const phoneMatch = (c.contactPhone || c.clientPhone || '').includes(term);
    const lastMsgMatch = c.messages.some((m) => (m.content || m.text || '').toLowerCase().includes(term));

    return nameMatch || phoneMatch || lastMsgMatch;
  });

  // Current active conversation
  const activeConv: WhatsAppConversation | undefined =
    conversations.find((c) => c.id === activeConversationId) ||
    filteredConversations[0] ||
    conversations[0];

  const activeClient = clients.find((c) => c.id === activeConv?.clientId);

  // Ensure active conversation matches view on deep-linking
  useEffect(() => {
    if (activeConversationId) {
      const conv = conversations.find((c) => c.id === activeConversationId);
      if (conv) {
        const convChannel = conv.channelSource || 'whatsapp';
        const convAccount = conv.account || 'WA1';
        let matchesFilter = false;

        if (selectedChannelFilter === 'ALL') {
          matchesFilter = true;
        } else if (selectedChannelFilter === 'WA1') {
          matchesFilter = convChannel === 'whatsapp' && convAccount === 'WA1';
        } else if (selectedChannelFilter === 'WA2') {
          matchesFilter = convChannel === 'whatsapp' && convAccount === 'WA2';
        } else if (selectedChannelFilter === 'instagram') {
          matchesFilter = convChannel === 'instagram';
        } else if (selectedChannelFilter === 'facebook') {
          matchesFilter = convChannel === 'facebook';
        } else if (selectedChannelFilter === 'landing') {
          matchesFilter = convChannel === 'landing';
        }

        if (!matchesFilter) {
          if (convChannel === 'whatsapp' && (convAccount === 'WA1' || convAccount === 'WA2')) {
            setSelectedChannelFilter(convAccount);
          } else {
            setSelectedChannelFilter(convChannel as 'instagram' | 'facebook' | 'landing');
          }
        }
      }
    }
  }, [activeConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  // Detectar si el contenedor de canales tiene contenido desbordante
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkOverflow = () => {
      setShowScrollButtons(container.scrollWidth > container.clientWidth + 1);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    return () => window.removeEventListener('resize', checkOverflow);
  }, []);

  // Socket-based real-time connection status updates (with polling fallback)
  const socketService = useWhatsAppSocket();

  useEffect(() => {
    // Conectar al socket al montar
    socketService?.connect();

    const account: 'WA1' | 'WA2' = selectedChannelFilter === 'WA2' ? 'WA2' : 'WA1';
    const instanceName = getInstanceName(currentTenant.id, account);

    const unsubscribeConnection = socketService?.on('connection.update', (data: any) => {
      const { connectionStatus } = data;
      
      // Actualizar estado local inmediatamente sin polling
      if (connectionStatus === 'open' || connectionStatus === 'connected') {
        setConnectionStatus('connected');
        console.log(`✅ ${account} conectado vía Socket.io`);
      } else if (connectionStatus === 'close' || connectionStatus === 'disconnected' || connectionStatus === 'logged_out') {
        setConnectionStatus('disconnected');
        alert(`La sesión de WhatsApp ${account} ha sido desconectada. Por favor vuelve a escanear el código QR.`);
        // Mostrar modal de QR automáticamente
        setShowQRModal(true);
        setQrModalTab(account);
        console.log(`⚠️ ${account} desconectado vía Socket.io`);
      } else if (connectionStatus === 'qr' || connectionStatus === 'connecting') {
        setConnectionStatus('qr');
        console.log(`🔄 ${account} en estado de escaneo QR`);
      }
    });

    const unsubscribeQr = socketService?.on('qrcode', (data: any) => {
      const { qrCode } = data;
      if (qrCode) {
        setQrCode(qrCode);
        setConnectionStatus('qr');
        if (showQRModal && qrModalTab !== 'WA1' && qrModalTab !== 'WA2') {
          // Auto-open modal if user is viewing QR section
          const tab = selectedChannelFilter === 'WA2' ? 'WA2' : 'WA1';
          setQrModalTab(tab);
          setShowQRModal(true);
        }
      }
    });

    // Fallback polling cada 30 segundos (reduced from 10s)
    const pollInterval = setInterval(async () => {
      const status = await checkWhatsAppConnection(instanceName);
      if (status !== connectionStatus) {
        setConnectionStatus(status);
        if (status === 'connected') {
          console.log(`✅ ${account} verificado conectado por polling`);
        }
      }
    }, 30000);

    return () => {
      unsubscribeConnection();
      unsubscribeQr();
      clearInterval(pollInterval);
    };
  }, [selectedChannelFilter, currentTenant.id, socketService, connectionStatus, showQRModal, qrModalTab, checkWhatsAppConnection]);

  // Initialize connection state on mount / tab change - NO auto-generate QR
  useEffect(() => {
    const checkStatus = async () => {
      // Check based on selected channel filter, default to WA1 for WA1/WA2 filters
      if (selectedChannelFilter === 'WA1' || selectedChannelFilter === 'WA2') {
        const account: 'WA1' | 'WA2' = selectedChannelFilter === 'WA2' ? 'WA2' : 'WA1';
        const instanceName = getInstanceName(currentTenant.id, account);
        const status = await checkWhatsAppConnection(instanceName);
        setConnectionStatus(status);
        // NO abrir modal automáticamente; el usuario decide vincular manualmente
      } else {
        // For non-WhatsApp channels, show disconnected status
        setConnectionStatus('disconnected');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Revisa cada 30 segundos
    return () => clearInterval(interval);
  }, [selectedChannelFilter, currentTenant.id, checkWhatsAppConnection]);

  const handleGenerateQR = async () => {
    const account: 'WA1' | 'WA2' = qrModalTab;
    const instanceName = getInstanceName(currentTenant.id, account);

    setIsWaitingQr(true);
    setQrRetryCount(prev => prev + 1);
    setQrCode(null);

    const base64 = await getWhatsAppQR(instanceName);

    if (base64) {
      setQrCode(base64);
      setIsWaitingQr(false);
      setQrRetryCount(0);
    } else {
      setIsWaitingQr(true);
    }
  };

  const handleSendInboxMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboxInput.trim() || !activeConv) return;
    
    // 1. Enviar al VPS (Evolution API) usando la instancia correcta por cuenta
    const account: 'WA1' | 'WA2' = activeConv.account || 'WA1';
    const instanceName = getInstanceName(currentTenant.id, account);
    const phone = activeConv.contactPhone || activeConv.clientPhone || '';
    await sendEvolutionMessage(instanceName, phone, inboxInput);
    
    // 2. Actualizar la pantalla localmente
    sendWhatsAppMessage(activeConv.id, inboxInput);
    setInboxInput('');
  };

  const handleSendMedia = (
    type: 'image' | 'audio' | 'video' | 'sticker' | 'gif' | 'document',
    url: string,
    name: string,
    size?: string,
    duration?: number
  ) => {
    if (!activeConv) return;
    sendWhatsAppMessage(activeConv.id, '', type, url, name, size, duration);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const isAud = file.type.startsWith('audio/');
      const sizeStr = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

      const type = isImg ? 'image' : isVid ? 'video' : isAud ? 'audio' : 'document';
      sendWhatsAppMessage(activeConv.id, '', type, url, file.name, sizeStr);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl && activeClient) {
      const interpolated = DomainService.interpolateTemplate(tpl.body, {
        client: activeClient,
        tenant: currentTenant
      });
      setInboxInput(interpolated);
    } else if (tpl && activeConv) {
      const interpolated = tpl.body
        .replace(/\{\{nombre\}\}/gi, activeConv.contactName || activeConv.clientName || 'Cliente')
        .replace(/\{\{agente\}\}/gi, currentUser.name)
        .replace(/\{\{telefono\}\}/gi, activeConv.contactPhone || activeConv.clientPhone || '');
      setInboxInput(interpolated);
    }
  };

  const openMediaViewer = (
    type: 'image' | 'video' | 'audio' | 'gif' | 'sticker' | 'document',
    url: string,
    name: string,
    senderName?: string,
    timestamp?: string,
    size?: string
  ) => {
    setViewerItem({
      type,
      url,
      name,
      senderName,
      timestamp,
      size
    });
    setIsViewerOpen(true);
  };

  // Get count stats
  const wa1Count = conversations.filter((c) => (c.account || 'WA1') === 'WA1' && (c.channelSource || 'whatsapp') === 'whatsapp').length;
  const wa2Count = conversations.filter((c) => c.account === 'WA2' && (c.channelSource || 'whatsapp') === 'whatsapp').length;
  const totalConversations = conversations.length;
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900">WhatsApp Cloud</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Líneas Activas
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Bandeja unificada de atención omnicanal con soporte multicuenta (WA1 & WA2).
            </p>
          </div>
        </div>

        {/* Action: Quick Jump to WhatsApp Config in Integrations */}
        <div className="flex items-center gap-2">
          <button
            id="btn-goto-wa-integrations"
            onClick={() => {
              if (onNavigateToTab) {
                onNavigateToTab('integrations');
              }
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
          >
            <Settings className="w-4 h-4 text-purple-600" />
            <span>Configurar Cuentas & QR (Integraciones)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>
      </div>

      {/* Main Unified Inbox Layout */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs h-[calc(100vh-230px)] min-h-[580px] flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Sidebar: Line Switcher & Conversation Threads */}
        <div className="w-full md:w-84 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/60">
          
          {/* Barra de Canales con "Todas" Fija y Scroll en Canales */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl mb-4 w-full">
            
            {/* 1. BOTÓN "TODAS" FIJO A LA IZQUIERDA */}
            <button
              type="button"
              onClick={() => {
                setSelectedChannelFilter('ALL');
              }}
              className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedChannelFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>Todas</span>
              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {conversations.length}
              </span>
            </button>

{/* DIVISOR DE SEPARACIÓN */}
            <div className="h-4 w-[1px] bg-slate-300 shrink-0" />

            {/* Botón navegación izquierda - ChevronLeft */}
            <button
              type="button"
              className={`shrink-0 p-1 rounded-md hover:bg-slate-100 transition-colors flex items-center justify-center ${
                showScrollButtons ? 'text-slate-600' : 'opacity-50'
              }`}
              onClick={() => {
                scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
              }}
              title="Desplazarse a la izquierda"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* 2. CONTENEDOR CON SCROLL HORIZONTAL PARA LOS CANALES */}
            <div
              ref={scrollContainerRef}
              className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 min-w-0"
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              style={{ cursor: 'grab' }}
              onMouseDown={(e) => {
                e.currentTarget.style.cursor = 'grabbing';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.cursor = 'grab';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.cursor = 'grab';
              }}
            >
              
              {/* WA1 */}
              <button
                type="button"
                onClick={() => {
                  setSelectedChannelFilter('WA1');
                }}
                className={`shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedChannelFilter === 'WA1'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-white/80 text-emerald-700 hover:bg-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>WA1</span>
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full text-[10px]">
                  {wa1Count}
                </span>
              </button>

              {/* WA2 */}
              <button
                type="button"
                onClick={() => {
                  setSelectedChannelFilter('WA2');
                }}
                className={`shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedChannelFilter === 'WA2'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white/80 text-purple-700 hover:bg-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>WA2</span>
                <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full text-[10px]">
                  {wa2Count}
                </span>
              </button>

              {/* INSTAGRAM */}
              <button
                type="button"
                onClick={() => {
                  setSelectedChannelFilter('instagram');
                }}
                className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedChannelFilter === 'instagram'
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white shadow-sm'
                    : 'bg-white/80 text-pink-700 hover:bg-white'
                }`}
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram</span>
                <span className="bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded-full text-[10px]">
                  {conversations.filter(c => c.channelSource === 'instagram').length}
                </span>
              </button>

              {/* FACEBOOK */}
              <button
                type="button"
                onClick={() => {
                  setSelectedChannelFilter('facebook');
                }}
                className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedChannelFilter === 'facebook'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white/80 text-blue-700 hover:bg-white'
                }`}
              >
                <Facebook className="w-3.5 h-3.5" />
                <span>Facebook</span>
                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-[10px]">
                  {conversations.filter(c => c.channelSource === 'facebook').length}
                </span>
              </button>

              {/* WEB CHAT */}
              <button
                type="button"
                onClick={() => {
                  setSelectedChannelFilter('landing');
                }}
                className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedChannelFilter === 'landing'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white/80 text-amber-700 hover:bg-white'
                }`}
              >
                <SendIcon className="w-3.5 h-3.5" />
                <span>Web Chat</span>
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-[10px]">
                  {conversations.filter(c => c.channelSource === 'landing').length}
                </span>
</button>

            </div>

            {/* Botón navegación derecha - ChevronRight */}
            <button
              type="button"
              className={`shrink-0 p-1 rounded-md hover:bg-slate-100 transition-colors flex items-center justify-center ${
                showScrollButtons ? 'text-slate-600' : 'opacity-50'
              }`}
              onClick={() => {
                scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
              }}
              title="Desplazarse a la derecha"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

          </div>
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={inboxSearch}
                onChange={(e) => setInboxSearch(e.target.value)}
                placeholder="Buscar por cliente, teléfono..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-semibold text-slate-600">No hay chats en esta línea</p>
                <p className="text-[11px] mt-0.5">Los mensajes entrantes aparecerán automáticamente aquí.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                const lastMsg = conv.messages[conv.messages.length - 1];
                const accountType = conv.account || 'WA1';

                return (
                  <div
                    key={conv.id}
                    id={`chat-thread-${conv.id}`}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`p-3 cursor-pointer transition-colors flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-100/70'
                    }`}
                  >
                    {/* Avatar with status */}
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-xs shadow-xs ${
                        accountType === 'WA2' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {(conv.contactName || conv.clientName || 'C').charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 px-1 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                        accountType === 'WA2' ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {accountType}
                      </span>
                    </div>

                    {/* Thread Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {conv.contactName || conv.clientName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                          {lastMsg ? lastMsg.timestamp.slice(-5) : ''}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {conv.contactPhone || conv.clientPhone}
                      </div>

                      <p className="text-[11px] text-slate-600 truncate mt-0.5 font-normal">
                        {lastMsg ? (
                          lastMsg.mediaType && lastMsg.mediaType !== 'text' ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              {lastMsg.mediaType === 'image' && '📷 Imagen adjunta'}
                              {lastMsg.mediaType === 'audio' && '🎤 Nota de voz'}
                              {lastMsg.mediaType === 'video' && '🎥 Video'}
                              {lastMsg.mediaType === 'sticker' && '✨ Sticker'}
                              {lastMsg.mediaType === 'gif' && '👾 GIF'}
                              {lastMsg.mediaType === 'document' && '📄 Documento PDF'}
                            </span>
                          ) : (
                            lastMsg.content || lastMsg.text
                          )
                        ) : (
                          'Sin mensajes previos'
                        )}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {(conv.unreadCount || 0) > 0 && (
                      <div className="absolute right-3 bottom-3 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {conv.unreadCount}
                      </div>
                    )}

                    {/* Channel source badge */}
                    {(conv.channelSource || 'whatsapp') && (
                      <div className="absolute right-6 bottom-3 flex items-center gap-1 text-[8px] font-bold rounded px-1.5 py-0.5 ${
                        (conv.channelSource || 'whatsapp') === 'whatsapp'
                          ? 'bg-emerald-100 text-emerald-800'
                          : (conv.channelSource || 'whatsapp') === 'instagram'
                            ? 'bg-pink-100 text-pink-700'
                          : (conv.channelSource || 'whatsapp') === 'facebook'
                            ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }">
                        {conv.channelSource && {
                          whatsapp: <Smartphone className="w-2.5 h-2.5" />,
                          instagram: <Instagram className="w-2.5 h-2.5" />,
                          facebook: <Facebook className="w-2.5 h-2.5" />,
                          landing: <SendIcon className="w-2.5 h-2.5" />
                        }[conv.channelSource]}
                        {conv.channelSource}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Chat Messages Body & Composer */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-slate-50/40 min-w-0">
            
            {/* Active Chat Header */}
            <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-xs shadow-xs shrink-0 ${
                  (activeConv.account || 'WA1') === 'WA2' ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {(activeConv.contactName || activeConv.clientName || 'C').charAt(0).toUpperCase()}
                </div>
                
                <div className="truncate">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2 flex-wrap">
                    <span className="truncate">{activeConv.contactName || activeConv.clientName}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full shrink-0 ${
                      (activeConv.account || 'WA1') === 'WA2'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      Línea {(activeConv.account || 'WA1')} (
                      {(activeConv.account || 'WA1') === 'WA2' ? '+1 786 555-0244' : '+1 786 450-2819'}
                      )
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                      activeConv.channelSource === 'instagram'
                        ? 'bg-pink-100 text-pink-700 border border-pink-200'
                        : activeConv.channelSource === 'facebook'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : activeConv.channelSource === 'landing'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {(activeConv.channelSource || 'whatsapp') === 'instagram'
                        ? 'Instagram Direct'
                        : (activeConv.channelSource || 'whatsapp') === 'facebook'
                          ? 'Facebook Messenger'
                          : (activeConv.channelSource || 'whatsapp') === 'landing'
                            ? 'Web Chat'
                            : (activeConv.account || 'WA1') === 'WA2'
                              ? 'WA2'
                              : 'WA1'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                    <span>{activeConv.contactPhone || activeConv.clientPhone}</span>
                    {activeClient && (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 rounded">
                        Cliente Registrado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Actions & Quick Template Picker */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 max-w-[150px] sm:max-w-[200px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Plantillas rápidas...</option>
                  {templates
                    .filter((t) => t.channel === 'whatsapp' || t.channel === 'both')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Message Bubble Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
              {activeConv.messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Inicia la conversación enviando un mensaje abajo.
                </div>
              ) : (
                activeConv.messages.map((msg) => {
                  const isOutbound =
                    msg.direction === 'outbound' ||
                    msg.sender === 'agent' ||
                    msg.sender === 'system' ||
                    msg.sender === currentUser.name;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col group ${isOutbound ? 'items-end' : 'items-start'}`}
                    >
                      {/* Message Bubble Container */}
                      <div className="relative max-w-[85%] sm:max-w-md">
                        
                        {/* Quick Emoji Reaction bar on hover */}
                        <div
                          className={`absolute -top-7 z-10 hidden group-hover:flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-lg border border-slate-200 ${
                            isOutbound ? 'right-0' : 'left-0'
                          }`}
                        >
                          {QUICK_EMOJIS.slice(0, 5).map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => toggleWhatsAppReaction(activeConv.id, msg.id, emoji)}
                              className="text-xs hover:scale-130 transition-transform p-0.5"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)
                            }
                            className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-emerald-600"
                            title="Más emojis"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Emoji Picker popup */}
                        {activeReactionMsgId === msg.id && (
                          <EmojiPickerPopup
                            onSelectEmoji={(emoji) => {
                              toggleWhatsAppReaction(activeConv.id, msg.id, emoji);
                              setActiveReactionMsgId(null);
                            }}
                            onClose={() => setActiveReactionMsgId(null)}
                            position="top"
                          />
                        )}

                        {/* Main Message Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs shadow-xs space-y-1.5 ${
                            isOutbound
                              ? (activeConv.account || 'WA1') === 'WA2'
                                ? 'bg-purple-600 text-white rounded-br-none'
                                : 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          {/* Outbound Attribution */}
                          {isOutbound && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-90 border-b border-white/20 pb-1 mb-1">
                              <User className="w-3 h-3" />
                              <span>{msg.senderName || msg.sender || currentUser.name}</span>
                              <span className="px-1.5 py-0.2 bg-black/20 rounded text-[9px]">
                                {activeConv.account || 'WA1'}
                              </span>
                            </div>
                          )}

                          {/* Inbound Attribution */}
                          {!isOutbound && (
                            <div className="text-[10px] font-black text-emerald-700 mb-0.5">
                              {activeConv.contactName || activeConv.clientName || 'Cliente'}
                            </div>
                          )}

                          {/* Media: Image */}
                          {msg.mediaType === 'image' && msg.mediaUrl && (
                            <div className="rounded-xl overflow-hidden border border-black/10 relative group/media cursor-pointer">
                              <img
                                src={msg.mediaUrl}
                                alt={msg.mediaName || 'Imagen'}
                                className="w-full max-h-64 object-cover rounded-xl"
                                referrerPolicy="no-referrer"
                                onClick={() =>
                                  openMediaViewer(
                                    'image',
                                    msg.mediaUrl!,
                                    msg.mediaName || 'Imagen WhatsApp',
                                    isOutbound ? msg.senderName || currentUser.name : activeConv.contactName,
                                    msg.timestamp,
                                    msg.mediaSize
                                  )
                                }
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={() =>
                                    openMediaViewer(
                                      'image',
                                      msg.mediaUrl!,
                                      msg.mediaName || 'Imagen WhatsApp',
                                      isOutbound ? msg.senderName || currentUser.name : activeConv.contactName,
                                      msg.timestamp,
                                      msg.mediaSize
                                    )
                                  }
                                  className="p-2 bg-white/90 text-slate-900 rounded-full hover:bg-white transition-all shadow-md"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Media: Sticker or GIF */}
                          {(msg.mediaType === 'sticker' || msg.mediaType === 'gif') && msg.mediaUrl && (
                            <div
                              className="rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform max-w-[200px]"
                              onClick={() =>
                                openMediaViewer(
                                  msg.mediaType === 'gif' ? 'gif' : 'sticker',
                                  msg.mediaUrl!,
                                  msg.mediaName || 'Sticker / GIF',
                                  isOutbound ? msg.senderName || currentUser.name : activeConv.contactName,
                                  msg.timestamp
                                )
                              }
                            >
                              <img
                                src={msg.mediaUrl}
                                alt="Sticker o GIF"
                                className="rounded-xl object-contain max-h-48"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          {/* Media: Audio Voice Note */}
                          {msg.mediaType === 'audio' && (
                            <div className="flex items-center gap-3 p-2 bg-black/10 rounded-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  setPlayingAudioId(playingAudioId === msg.id ? null : msg.id);
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                  isOutbound ? 'bg-white text-slate-800' : 'bg-emerald-600 text-white'
                                }`}
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4 ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center gap-1 h-4">
                                  <span className="w-1 bg-current opacity-70 h-2 rounded-full" />
                                  <span className="w-1 bg-current opacity-90 h-3 rounded-full" />
                                  <span className="w-1 bg-current h-4 rounded-full" />
                                  <span className="w-1 bg-current opacity-60 h-2.5 rounded-full" />
                                  <span className="w-1 bg-current opacity-80 h-3.5 rounded-full" />
                                  <span className="w-1 bg-current opacity-70 h-2 rounded-full" />
                                </div>
                                <div className="text-[10px] opacity-80 font-mono mt-0.5">
                                  0:{String(msg.mediaDuration || 4).padStart(2, '0')} Nota de Voz
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Media: Video */}
                          {msg.mediaType === 'video' && msg.mediaUrl && (
                            <div
                              className="relative rounded-xl overflow-hidden bg-black cursor-pointer group/video"
                              onClick={() =>
                                openMediaViewer(
                                  'video',
                                  msg.mediaUrl!,
                                  msg.mediaName || 'Video WhatsApp',
                                  isOutbound ? msg.senderName || currentUser.name : activeConv.contactName,
                                  msg.timestamp,
                                  msg.mediaSize
                                )
                              }
                            >
                              <video src={msg.mediaUrl} className="w-full max-h-56 object-cover rounded-xl" />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/video:bg-black/50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg">
                                  <Play className="w-5 h-5 ml-0.5 text-emerald-700" />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Media: Document */}
                          {msg.mediaType === 'document' && (
                            <div
                              className="flex items-center gap-3 p-2.5 bg-black/10 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() =>
                                openMediaViewer(
                                  'document',
                                  msg.mediaUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                                  msg.mediaName || 'Documento adjunto',
                                  isOutbound ? msg.senderName || currentUser.name : activeConv.contactName,
                                  msg.timestamp,
                                  msg.mediaSize
                                )
                              }
                            >
                              <div className="p-2 rounded-lg bg-white/20">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-xs truncate">{msg.mediaName || 'Documento.pdf'}</p>
                                <p className="text-[10px] opacity-75">{msg.mediaSize || '1.2 MB'} • PDF</p>
                              </div>
                              <Download className="w-4 h-4 opacity-80" />
                            </div>
                          )}

                          {/* Text Body */}
                          {msg.content && (
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content || msg.text}</p>
                          )}

                          {/* Timestamp & Checkmarks */}
                          <div
                            className={`text-[10px] text-right font-mono flex items-center justify-end gap-1 ${
                              isOutbound ? 'text-white/80' : 'text-slate-400'
                            }`}
                          >
                            <span>{msg.timestamp}</span>
                            {isOutbound && <CheckCheck className="w-3.5 h-3.5 text-white/90" />}
                          </div>
                        </div>

                        {/* Reaction Badges */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div
                            className={`flex flex-wrap items-center gap-1 mt-1 ${
                              isOutbound ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {msg.reactions.map((r, idx) => {
                              const isMine = r.users.includes(currentUser.id);
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => toggleWhatsAppReaction(activeConv.id, msg.id, r.emoji)}
                                  className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all ${
                                    isMine
                                      ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 font-extrabold scale-105 shadow-xs'
                                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
                                  }`}
                                  title={`Reacción de ${r.users.length} persona(s)`}
                                >
                                  <span>{r.emoji}</span>
                                  <span className="text-[10px] font-bold">{r.users.length}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer Area */}
            <div className="p-3 bg-white border-t border-slate-200 relative">
              {/* Sticker / GIF Picker */}
              {showStickerPicker && (
                <StickerGifPicker
                  onSelectMedia={(type, url, name) => {
                    handleSendMedia(type, url, name);
                    setShowStickerPicker(false);
                  }}
                  onClose={() => setShowStickerPicker(false)}
                />
              )}

              {/* Composer Emoji Picker */}
              {showComposerEmojiPicker && (
                <EmojiPickerPopup
                  onSelectEmoji={(emoji) => {
                    setInboxInput((prev) => prev + emoji);
                    setShowComposerEmojiPicker(false);
                  }}
                  onClose={() => setShowComposerEmojiPicker(false)}
                  position="top"
                />
              )}

              {/* Voice Recorder */}
              {showVoiceRecorder ? (
                <VoiceAudioRecorder
                  onSendAudio={(audioUrl, duration) => {
                    handleSendMedia('audio', audioUrl, 'Nota de Voz WhatsApp', '120 KB', duration);
                    setShowVoiceRecorder(false);
                  }}
                  onCancel={() => setShowVoiceRecorder(false)}
                />
              ) : (
                <form onSubmit={handleSendInboxMessage} className="flex items-center gap-2">
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  />

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                    title="Adjuntar Archivo o Imagen"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Stickers / GIFs */}
                  <button
                    type="button"
                    onClick={() => setShowStickerPicker(!showStickerPicker)}
                    className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                    title="Stickers y GIFs"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>

                  {/* Emoji Picker */}
                  <button
                    type="button"
                    onClick={() => setShowComposerEmojiPicker(!showComposerEmojiPicker)}
                    className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                    title="Emojis"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {/* Voice Note */}
                  <button
                    type="button"
                    onClick={() => setShowVoiceRecorder(true)}
                    className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                    title="Grabar Nota de Voz"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Main Text Input */}
                  <input
                    type="text"
                    value={inboxInput}
                    onChange={(e) => setInboxInput(e.target.value)}
                    placeholder={`Escribir a través de línea ${activeConv.account || 'WA1'}...`}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 transition-colors ${
                      (activeConv.account || 'WA1') === 'WA2'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </form>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs p-8">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30 text-slate-400" />
            <p className="font-bold text-slate-700 text-sm">Selecciona una conversación</p>
            <p className="text-slate-500 text-xs mt-1">Elige un chat de la lista lateral para ver los mensajes.</p>
          </div>
        )}
      </div>

{/* Discreet Session Status Banner (WhatsApp channels only) */}
      {connectionStatus === 'qr' && (selectedChannelFilter === 'WA1' || selectedChannelFilter === 'WA2') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-bold text-amber-800">Sin sesión activa en {selectedChannelFilter}</span>
          </div>
          <button
            onClick={() => { setQrModalTab(selectedChannelFilter as 'WA1' | 'WA2'); setShowQRModal(true); }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-all shrink-0"
          >
            Vincular número por QR
          </button>
        </div>
      )}
      {connectionStatus === 'connected' && (selectedChannelFilter === 'WA1' || selectedChannelFilter === 'WA2') && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-800">
            {selectedChannelFilter}: +1 786 {(selectedChannelFilter === 'WA2' ? '555' : '450')}-{selectedChannelFilter === 'WA2' ? '0244' : '2819'}
          </span>
        </div>
      )}

      {/* Global Media Viewer Modal */}
      <MediaViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        item={viewerItem}
      />

      {/* Manual QR Modal (only on user request) */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Vincular WhatsApp Real</h3>
            <p className="text-sm text-slate-600 mb-4">Escanea este código con tu celular</p>

            {isWaitingQr ? (
              <div className="w-64 h-64 mx-auto bg-amber-50 border border-amber-200 rounded-xl flex flex-col items-center justify-center mb-4">
                <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mb-2" />
                <span className="text-sm text-amber-800 font-medium">Generando QR...</span>
              </div>
            ) : qrCode ? (
              <img src={qrCode} alt="QR WhatsApp" className="w-64 h-64 mx-auto border-4 border-emerald-500 rounded-xl mb-4" />
            ) : (
              <div className="w-64 h-64 mx-auto bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-slate-500">Sin QR generado</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleGenerateQR} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition">
                {isWaitingQr ? 'Generando...' : 'Generar QR'}
              </button>
              <button onClick={() => setShowQRModal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-bold transition">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
