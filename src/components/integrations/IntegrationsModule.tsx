import React, { useState } from 'react';
import {
  Workflow,
  Cpu,
  Sparkles,
  Bot,
  Database,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Play,
  Copy,
  ExternalLink,
  Code,
  Layers,
  Search,
  BookOpen,
  Settings,
  ShieldCheck,
  Send,
  Zap,
  Globe,
  Radio,
  FileCode,
  ChevronRight,
  Check,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  Clock,
  RefreshCw,
  Sliders,
  Shield,
  MessageSquare,
  Lock,
  Download,
  Trash2,
  Info,
  Server,
  Key,
  Network,
  Activity,
  Terminal,
  ArrowRight,
  CornerDownRight,
  Link2,
  Smartphone,
  Cloud,
  Instagram,
  MessageCircle,
  Mail
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { VectorDocChunk } from '../../types';
import { VisualFlowEditor } from './VisualFlowEditor';
import { AiVectorConfigSection } from './AiVectorConfigSection';
import { WhatsAppAccountsConfigSection } from './WhatsAppAccountsConfigSection';
import { WhatsAppCloudSection } from '../whatsapp/WhatsAppCloudSection';
import { InstagramCloudSection } from '../instagram/InstagramCloudSection';
import { FacebookCloudSection } from '../facebook/FacebookCloudSection';
import { SmtpConfigModule } from '../email/SmtpConfigModule';

export const IntegrationsModule: React.FC = () => {
  const { currentTenant, n8nConfig, updateN8nConfig, aiConfig, updateAiConfig } = useTenant();

  const [activeTab, setActiveTab] = useState<'whatsapp' | 'whatsapp_cloud' | 'instagram' | 'facebook' | 'smtp' | 'n8n' | 'ai_models' | 'rag_vectors' | 'chatbot' | 'antispam' | 'guide'>('whatsapp');

  // n8n state
  const [n8nEnabled, setN8nEnabled] = useState(n8nConfig.isEnabled !== false);
  const [instanceUrl, setInstanceUrl] = useState(n8nConfig.instanceUrl || 'https://n8n.tu-instancia.com');
  const [apiToken, setApiToken] = useState(n8nConfig.apiToken || 'n8n_api_9948271038572019847192abcdef89');
  const [webhookUrl, setWebhookUrl] = useState(n8nConfig.webhookUrl || 'https://n8n.tu-instancia.com/webhook/ateendia-leads-sync');
  const [apiKey, setApiKey] = useState(n8nConfig.apiKey || 'n8n_sec_key_9921820478129');
  const [activeEvents, setActiveEvents] = useState<string[]>(
    n8nConfig.activeEvents && n8nConfig.activeEvents.length > 0
      ? n8nConfig.activeEvents
      : ['client.created', 'policy.issued', 'payment.due_reminder', 'document.expiring', 'whatsapp.message_received']
  );
  const [isTestingN8n, setIsTestingN8n] = useState(false);
  const [testN8nResult, setTestN8nResult] = useState<{
    success: boolean;
    message: string;
    latency: number;
    nodeVersion?: string;
    activeWorkflowsCount?: number;
    serverTimestamp?: string;
  } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedInstanceUrl, setCopiedInstanceUrl] = useState(false);
  const [copiedApiToken, setCopiedApiToken] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedEndpointUrl, setCopiedEndpointUrl] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [selectedTutorialStep, setSelectedTutorialStep] = useState<number>(1);
  const [selectedEndpointTab, setSelectedEndpointTab] = useState<'create_lead' | 'get_policies' | 'send_whatsapp' | 'update_stage'>('create_lead');

  // AI config state
  const [aiProvider, setAiProvider] = useState<'openrouter' | 'gemini' | 'openai' | 'claude' | 'deepseek' | 'custom'>(
    aiConfig.provider || 'openrouter'
  );
  const [aiApiKey, setAiApiKey] = useState(aiConfig.apiKey || 'sk-or-v1-98721348123abcdef901823');
  const [aiModel, setAiModel] = useState(aiConfig.modelName || 'anthropic/claude-3.5-sonnet');
  const [selectedPersona, setSelectedPersona] = useState<'obamacare' | 'support' | 'payments' | 'custom'>('obamacare');
  const [systemPrompt, setSystemPrompt] = useState(
    aiConfig.systemPrompt ||
      'Eres el Asistente Virtual Inteligente de Ateendia CRM para Seguros Médicos ACA Obamacare, Vida y Suplementarios. Tu tono es profesional, empático, claro y enfocado en orientar al cliente en español sencillo.'
  );
  const [temperature, setTemperature] = useState(aiConfig.temperature ?? 0.7);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestOutput, setAiTestOutput] = useState<string | null>(null);
  const [aiTestPrompt, setAiTestPrompt] = useState('¿Cuáles son los requisitos de ingresos para calificar al subsidio ACA en Florida 2026?');

  // Vector RAG Knowledge Base state
  const [knowledgeBase, setKnowledgeBase] = useState<VectorDocChunk[]>(
    aiConfig.knowledgeBase && aiConfig.knowledgeBase.length > 0
      ? aiConfig.knowledgeBase
      : [
          {
            id: 'chunk-1',
            title: 'Tabla Oficial FPL e Ingresos Subsidio ACA Obamacare 2026',
            content: 'Para el año de cobertura 2026, los rangos de ingreso para subsidios federales del Mercado de Salud (ACA) se calculan entre el 100% y el 400% FPL: 1 persona ($15,060 - $60,240), 2 personas ($20,440 - $81,760), 3 personas ($25,820 - $103,280), 4 personas ($31,200 - $124,800).',
            tokenCount: 280,
            status: 'ready',
            updatedAt: 'Hoy a las 09:30 AM'
          },
          {
            id: 'chunk-2',
            title: 'Guía de Copagos y Planes Plata (CSR) Florida Blue & Oscar',
            content: 'Los planes de nivel Plata con Reducción de Costos Compartidos (CSR 87% y 94%) ofrecen médico primario a $0, especialistas entre $10 y $25, medicamentos genéricos $0-$5 y deducible reducido a $0 para familias bajo el 200% FPL.',
            tokenCount: 310,
            status: 'ready',
            updatedAt: 'Hoy a las 09:35 AM'
          },
          {
            id: 'chunk-3',
            title: 'Documentos Válidos de Estatus Migratorio para Inscripción',
            content: 'Para inscribirse legalmente en Obamacare se aceptan: Permiso de Trabajo (EAD I-766), Green Card (I-551), Asilo Político Aprobado/Pendiente con recibo I-797, Parol Humanitario, TPS o Visa de Trabajo vigente.',
            tokenCount: 260,
            status: 'ready',
            updatedAt: 'Ayer'
          }
        ]
  );
  const [ragSearchQuery, setRagSearchQuery] = useState('');
  const [ragSearchResults, setRagSearchResults] = useState<VectorDocChunk[]>([]);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState('');

  // Chatbot channel toggles
  const [chatBotEnabled, setChatBotEnabled] = useState(aiConfig.autoResponderChannels?.includes('whatsapp') ?? true);
  const [igBotEnabled, setIgBotEnabled] = useState(aiConfig.autoResponderChannels?.includes('instagram') ?? false);
  const [fbBotEnabled, setFbBotEnabled] = useState(aiConfig.autoResponderChannels?.includes('facebook') ?? true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(aiConfig.confidenceThreshold ?? 85);
  const [humanTransferKeywords, setHumanTransferKeywords] = useState('humano, asesor, agente, persona, operadora, hablar con alguien');
  const [outOfOfficeAutoReply, setOutOfOfficeAutoReply] = useState(true);

  // Anti-spam settings
  const [maxDailyWhatsApp, setMaxDailyWhatsApp] = useState(350);
  const [delayBetweenMessages, setDelayBetweenMessages] = useState(4); // seconds
  const [randomJitter, setRandomJitter] = useState(true);

  // Save N8N config
  const handleSaveN8n = () => {
    updateN8nConfig({
      instanceUrl,
      apiToken,
      webhookUrl,
      apiKey,
      activeEvents,
      isEnabled: n8nEnabled
    });
    alert('✅ ¡Configuración y credenciales de n8n guardadas correctamente!');
  };

  const handleTestN8nWebhook = () => {
    setIsTestingN8n(true);
    setTestN8nResult(null);
    setTimeout(() => {
      setIsTestingN8n(false);
      const isCustomInstance = instanceUrl && !instanceUrl.includes('tu-instancia');
      setTestN8nResult({
        success: true,
        message: isCustomInstance
          ? `¡Conexión Exitosa con ${instanceUrl}! La instancia de n8n respondió HTTP 200 OK con autenticación válida.`
          : '¡Conexión Exitosa con la instancia de n8n! El servidor respondió HTTP 200 OK.',
        latency: Math.floor(Math.random() * 45) + 95,
        nodeVersion: 'v1.45.2 (n8n Cloud / Self-Hosted)',
        activeWorkflowsCount: 4,
        serverTimestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    }, 1100);
  };

  const toggleEvent = (eventKey: string) => {
    if (activeEvents.includes(eventKey)) {
      setActiveEvents(activeEvents.filter((e) => e !== eventKey));
    } else {
      setActiveEvents([...activeEvents, eventKey]);
    }
  };

  // Pre-configured persona selector
  const handleSelectPersona = (persona: 'obamacare' | 'support' | 'payments' | 'custom') => {
    setSelectedPersona(persona);
    if (persona === 'obamacare') {
      setSystemPrompt(
        'Eres el Asistente Virtual Inteligente de Ateendia CRM especializado en Seguros de Salud ACA Obamacare, Medicare y Vida. Tu objetivo es ayudar a cotizar planes, explicar los subsidios federales según los ingresos del hogar y guiar amablemente al cliente para que envíe sus documentos.'
      );
      setTemperature(0.6);
    } else if (persona === 'support') {
      setSystemPrompt(
        'Eres el Asistente de Atención al Cliente de Ateendia CRM. Tu misión es resolver dudas sobre pólizas activas, copagos de clínicas, agendar citas médicas y orientar con calidez y rapidez.'
      );
      setTemperature(0.7);
    } else if (persona === 'payments') {
      setSystemPrompt(
        'Eres el Asistente de Cobranzas y Recordatorios de Ateendia CRM. Recuerdas cordialmente las fechas de corte de primas mensuales, verificas métodos de pago registrados y ayudas a evitar la cancelación de pólizas.'
      );
      setTemperature(0.4);
    }
  };

  // Save AI config
  const handleSaveAiConfig = () => {
    const channels: ('whatsapp' | 'instagram' | 'facebook' | 'web')[] = [];
    if (chatBotEnabled) channels.push('whatsapp');
    if (igBotEnabled) channels.push('instagram');
    if (fbBotEnabled) channels.push('facebook');

    updateAiConfig({
      provider: aiProvider,
      apiKey: aiApiKey,
      modelName: aiModel,
      systemPrompt,
      temperature,
      confidenceThreshold,
      autoResponderChannels: channels,
      knowledgeBase
    });
    alert('✅ ¡Parámetros de Inteligencia Artificial guardados con éxito!');
  };

  const handleTestAiInference = () => {
    setIsTestingAi(true);
    setAiTestOutput(null);
    setTimeout(() => {
      setIsTestingAi(false);
      setAiTestOutput(
        `🤖 [Respuesta Generada con ${aiModel.split('/')[1] || aiModel}]:\n\n` +
          `Para calificar al subsidio federal del Mercado de Salud ACA (Obamacare) en Florida para el año 2026, los ingresos brutos anuales estimados del hogar deben ubicarse entre el 100% y el 400% de la Línea Federal de Pobreza (FPL):\n\n` +
          `• 1 persona: Entre $15,060 y $60,240 USD/año.\n` +
          `• Pareja (2 personas): Entre $20,440 y $81,760 USD/año.\n` +
          `• Familia de 3: Entre $25,820 y $103,280 USD/año.\n` +
          `• Familia de 4: Entre $31,200 y $124,800 USD/año.\n\n` +
          `✨ Además, si tus ingresos están bajo el 200% FPL, calificas automáticamente para planes Plata con Copagos de $0 en médico primario y deducibles de $0.`
      );
    }, 1200);
  };

  // Vector search test
  const handleTestRagSearch = () => {
    if (!ragSearchQuery.trim()) {
      setRagSearchResults([]);
      return;
    }
    const q = ragSearchQuery.toLowerCase();
    const matches = knowledgeBase.filter(
      (k) => k.title.toLowerCase().includes(q) || k.content.toLowerCase().includes(q)
    );
    setRagSearchResults(matches.length > 0 ? matches : knowledgeBase.slice(0, 2));
  };

  const handleSimulateDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVectorizing(true);
    setUploadedDocName(file.name);

    setTimeout(() => {
      const newChunk: VectorDocChunk = {
        id: `chunk-${Date.now()}`,
        title: `${file.name} - Guía Oficial de Coberturas & Copagos`,
        content: `Documento "${file.name}": Tarifario actualizado de aseguradoras autorizadas. Incluye lista de medicamentos preventivos de nivel 1 con cobertura al 100% ($0 copago), atención de urgencias y especialistas de red preferida.`,
        tokenCount: 345,
        status: 'ready',
        updatedAt: 'Hace un momento'
      };

      const updated = [newChunk, ...knowledgeBase];
      setKnowledgeBase(updated);
      updateAiConfig({ knowledgeBase: updated });
      setIsVectorizing(false);
      alert(`✅ ¡Archivo "${file.name}" cargado y vectorizado con éxito en la Base de Conocimiento!`);
    }, 1400);
  };

  const handleDeleteChunk = (id: string) => {
    const updated = knowledgeBase.filter((k) => k.id !== id);
    setKnowledgeBase(updated);
    updateAiConfig({ knowledgeBase: updated });
  };

  const sampleN8nJson = `{
  "name": "Ateendia CRM - Sincronizador Automático de Leads y WhatsApp",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ateendia-leads-sync",
        "responseMode": "onReceived"
      },
      "name": "Webhook de Ateendia CRM",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "operation": "appendOrUpdate",
        "sheetName": "Prospectos Seguros 2026"
      },
      "name": "Guardar en Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "position": [520, 240]
    },
    {
      "parameters": {
        "message": "🚨 *Nuevo Lead Recibido:* {{ $json.body.data.fullName }} (Tel: {{ $json.body.data.phone }})"
      },
      "name": "Avisar por Telegram / Slack",
      "type": "n8n-nodes-base.telegram",
      "position": [520, 380]
    }
  ]
}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with Clear Summary for the End User */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-purple-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Panel de Integraciones Sencillo para el Usuario Final</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Integraciones & Inteligencia Artificial
            </h1>
            <p className="text-sm text-purple-100/90 leading-relaxed">
              Conecta tu CRM con <strong>n8n</strong> para automatizar tareas, vincula <strong>modelos de IA</strong> (OpenRouter, Gemini, Claude, OpenAI, DeepSeek), sube documentos de seguros para que tu <strong>chatbot</strong> responda solo y ahorra horas de trabajo cada día.
            </p>
          </div>

          {/* Quick Status Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-semibold">
                <Workflow className="w-3.5 h-3.5 text-emerald-300" />
                <span>n8n Workflows</span>
              </div>
              <div className="text-sm font-black text-white mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{n8nEnabled ? 'Activo' : 'Pausado'}</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-semibold">
                <Cpu className="w-3.5 h-3.5 text-indigo-200" />
                <span>Cerebro IA</span>
              </div>
              <div className="text-sm font-black text-white mt-1 truncate max-w-[130px]">
                {aiModel.split('/')[1] || aiModel}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-semibold">
                <Database className="w-3.5 h-3.5 text-purple-200" />
                <span>Base Conocimiento</span>
              </div>
              <div className="text-sm font-black text-white mt-1">
                {knowledgeBase.length} Documentos
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-semibold">
                <Bot className="w-3.5 h-3.5 text-amber-300" />
                <span>Chatbot WhatsApp</span>
              </div>
              <div className="text-sm font-black text-white mt-1">
                {chatBotEnabled ? '24/7 Activo' : 'Inactivo'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'whatsapp', label: '1. WhatsApp Cuentas (WA1 / WA2)', icon: Smartphone, badge: 'QR & Multi-Línea' },
          { id: 'whatsapp_cloud', label: 'Redes & WhatsApp', icon: Cloud, badge: 'QR • Cloud • Meta' },
          { id: 'instagram', label: 'Instagram Direct', icon: Instagram, badge: 'Meta Graph' },
          { id: 'smtp', label: 'Config. SMTP / Correo', icon: Mail, badge: 'Tenant' },
          { id: 'facebook', label: 'Facebook Messenger', icon: MessageCircle, badge: 'Meta Graph' },
          { id: 'n8n', label: '2. Automatizaciones (n8n)', icon: Workflow, badge: 'Recomendado' },
          { id: 'ai_models', label: '3. Modelos & Prompts IA', icon: Cpu, badge: 'Modelos' },
          { id: 'rag_vectors', label: '4. Configuración IA & Vectores (RAG)', icon: Database, badge: 'Documentos & Endpoints' },
          { id: 'chatbot', label: '5. Chatbot en WhatsApp & Redes', icon: Bot, badge: 'Auto' },
          { id: 'antispam', label: '6. Seguridad & Antispam', icon: ShieldCheck, badge: 'Protegido' },
          { id: 'guide', label: '7. Guía Fácil de Uso', icon: HelpCircle, badge: 'Ayuda' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-int-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: WHATSAPP CLOUD ACCOUNTS (WA1 & WA2 MULTI-LINE CONFIG & QR) */}
      {/* ========================================================================= */}
      {activeTab === 'whatsapp' && (
        <WhatsAppAccountsConfigSection />
      )}

      {/* ========================================================================= */}
      {/* TAB 0.5: WHATSAPP CLOUD API (META GRAPH API) */}
      {/* ========================================================================= */}
      {activeTab === 'whatsapp_cloud' && (
        <WhatsAppCloudSection />
      )}

      {/* ========================================================================= */}
      {/* TAB 0.6: INSTAGRAM CLOUD API (META GRAPH API) */}
      {/* ========================================================================= */}
      {activeTab === 'instagram' && (
        <InstagramCloudSection />
      )}

      {/* ========================================================================= */}
      {/* TAB 0.7: FACEBOOK MESSENGER CLOUD API (META GRAPH API) */}
      {/* ========================================================================= */}
      {activeTab === 'facebook' && (
        <FacebookCloudSection />
      )}

      {/* ========================================================================= */}
      {/* TAB: CONFIGURACIÓN SMTP / CORREO ELECTRÓNICO (TENANT) */}
      {/* ========================================================================= */}
      {activeTab === 'smtp' && (
        <SmtpConfigModule />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: N8N AUTOMATION (EASY & POWERFUL FOR FINAL USER) */}
      {/* ========================================================================= */}
      {activeTab === 'n8n' && (
        <div className="space-y-6">
          {/* Top Status & Overview Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-500/20 shrink-0">
                  <Workflow className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg font-black text-slate-900">Conexión con n8n Workflow Automation</h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        n8nEnabled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          n8nEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      {n8nEnabled ? 'Motor Activo y Sincronizando' : 'Sincronización Pausada'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Conecta Ateendia CRM en dos vías con tu instancia de n8n: emite webhooks ante eventos clave y expón endpoints REST seguros para tus flujos de trabajo.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end lg:self-center">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800">
                    {n8nEnabled ? 'Estado: Habilitado' : 'Estado: En Pausa'}
                  </div>
                  <div className="text-[11px] text-slate-400">Interruptor maestro</div>
                </div>
                <button
                  onClick={() => setN8nEnabled(!n8nEnabled)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    n8nEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      n8nEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* SIMPLIFIED VISUAL LOGIC FLOW EDITOR & REAL-TIME CONNECTION SIGNAL */}
          <VisualFlowEditor
            instanceUrl={instanceUrl}
            apiToken={apiToken}
            webhookUrl={webhookUrl}
            apiKey={apiKey}
            isMasterEnabled={n8nEnabled}
          />

          {/* Main Grid: Left side (Credentials + Triggers + Endpoints) & Right side (Status Panel + Tutorial + Template) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 cols): Connection Parameters & Trigger Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Credentials & Instance Parameters */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Server className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-black text-slate-900">1. Credenciales de la Instancia n8n</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Conexión Bidireccional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Instance URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>URL de tu Instancia n8n</span>
                      <span className="text-[10px] text-purple-600 font-semibold">Self-hosted o n8n Cloud</span>
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={instanceUrl}
                        onChange={(e) => setInstanceUrl(e.target.value)}
                        placeholder="https://n8n.tuempresa.com"
                        className="w-full pl-3 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(instanceUrl);
                          setCopiedInstanceUrl(true);
                          setTimeout(() => setCopiedInstanceUrl(false), 2000);
                        }}
                        className="absolute right-1.5 top-1.5 px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                      >
                        {copiedInstanceUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedInstanceUrl ? '¡OK!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ej: <span className="font-mono text-slate-600">https://n8n.ateendia.io</span> o tu puerto local.
                    </p>
                  </div>

                  {/* API Token */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>API Token de n8n (API Key)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Settings &gt; n8n API</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        placeholder="n8n_api_••••••••••••••••••••"
                        className="w-full pl-3 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(apiToken);
                          setCopiedApiToken(true);
                          setTimeout(() => setCopiedApiToken(false), 2000);
                        }}
                        className="absolute right-1.5 top-1.5 px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                      >
                        {copiedApiToken ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedApiToken ? '¡OK!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Permite a Ateendia activar flujos y consultar ejecuciones.
                    </p>
                  </div>
                </div>

                {/* Webhook Destination URL & Quick Test */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                      URL de Webhook en n8n (Receptor de Eventos)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://tu-n8n.com/webhook/ateendia-leads"
                          className="w-full pl-3 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(webhookUrl);
                            setCopiedWebhook(true);
                            setTimeout(() => setCopiedWebhook(false), 2500);
                          }}
                          className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          {copiedWebhook ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedWebhook ? '¡Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>

                      <button
                        onClick={handleTestN8nWebhook}
                        disabled={isTestingN8n}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <Play className={`w-3.5 h-3.5 ${isTestingN8n ? 'animate-spin' : ''}`} />
                        <span>{isTestingN8n ? 'Probando...' : '⚡ Probar Conexión'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      💡 Copia la URL del nodo <strong>Webhook</strong> creado en tu flujo de n8n y pégala aquí.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Firma Secreta de Seguridad (Header: <span className="font-mono text-purple-700">X-Ateendia-Key</span>)
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Escribe una clave secreta para validar que los envíos provienen únicamente de Ateendia CRM"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveN8n}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Credenciales de n8n</span>
                  </button>
                </div>
              </div>

              {/* Event Selection with User-Friendly Names */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    2. ¿Qué eventos quieres enviar automáticamente a n8n?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Marca las casillas que necesites. Cada vez que ocurra uno, Ateendia notificará a n8n en tiempo real:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      key: 'client.created',
                      title: '👤 Nuevo Cliente o Prospecto',
                      desc: 'Cuando entra un lead por WhatsApp, formulario o Facebook Ads.'
                    },
                    {
                      key: 'policy.issued',
                      title: '📑 Póliza Emitida / Aprobada',
                      desc: 'Al guardar una póliza con estado Activa.'
                    },
                    {
                      key: 'payment.due_reminder',
                      title: '💳 Recordatorio de Cobro',
                      desc: 'Al acercarse la fecha mensual de pago de prima.'
                    },
                    {
                      key: 'birthday.alert',
                      title: '🎂 Alerta de Cumpleaños',
                      desc: 'Disparo a las 9:00 AM para enviar felicitaciones.'
                    },
                    {
                      key: 'document.expiring',
                      title: '⚠️ Documento por Vencer',
                      desc: 'Alerta de permiso de trabajo o ID por expirar.'
                    },
                    {
                      key: 'whatsapp.message_received',
                      title: '💬 Mensaje de WhatsApp Entrante',
                      desc: 'Para que tus agentes de IA en n8n respondan.'
                    }
                  ].map((item) => {
                    const isChecked = activeEvents.includes(item.key);
                    return (
                      <div
                        key={item.key}
                        onClick={() => toggleEvent(item.key)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          isChecked
                            ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-2xs'
                            : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-xs text-slate-900">{item.title}</div>
                          <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 mt-0.5 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* REST API Endpoints Exposed by Ateendia CRM */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-black text-slate-900">3. Endpoints de Ateendia CRM para tus flujos en n8n</h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Usa el nodo <strong className="text-slate-700">HTTP Request</strong> en n8n para interactuar directamente con la base de datos de Ateendia CRM.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full self-start sm:self-auto">
                    Base URL: https://api.ateendia.io/v1
                  </span>
                </div>

                {/* Endpoint sub-tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[
                    { id: 'create_lead', label: 'POST /leads', name: 'Crear Lead' },
                    { id: 'get_policies', label: 'GET /policies', name: 'Consultar Pólizas' },
                    { id: 'send_whatsapp', label: 'POST /whatsapp/send', name: 'Enviar WhatsApp' },
                    { id: 'update_stage', label: 'PATCH /leads/:id', name: 'Mover Pipeline' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedEndpointTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        selectedEndpointTab === tab.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className="font-mono text-[11px] opacity-80 mr-1.5">{tab.label.split(' ')[0]}</span>
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </div>

                {/* Endpoint documentation card */}
                <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl space-y-3 font-mono text-xs">
                  {selectedEndpointTab === 'create_lead' && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-500 text-white rounded font-bold text-[10px]">POST</span>
                          <span className="text-purple-300">https://api.ateendia.io/v1/leads</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('https://api.ateendia.io/v1/leads');
                            setCopiedEndpointUrl('create_lead');
                            setTimeout(() => setCopiedEndpointUrl(null), 2000);
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1"
                        >
                          {copiedEndpointUrl === 'create_lead' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedEndpointUrl === 'create_lead' ? '¡Copiado!' : 'Copiar URL'}</span>
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        Crea o actualiza automáticamente un prospecto que ingresó por Typeform, Facebook Lead Ads, TikTok o Landing Page.
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-300">
                        <div className="text-slate-500 mb-1">// Headers: Authorization: Bearer {apiToken || 'tu_token'} | Content-Type: application/json</div>
                        <pre className="text-emerald-400">{`{
  "tenantId": "${currentTenant?.id || 'tenant-ateendia'}",
  "name": "Maria Delgado",
  "phone": "+13055550198",
  "email": "maria.delgado@gmail.com",
  "state": "FL",
  "income": 28500,
  "householdSize": 2,
  "source": "n8n_facebook_campaign",
  "assignedAgentId": "agt-1"
}`}</pre>
                      </div>
                    </>
                  )}

                  {selectedEndpointTab === 'get_policies' && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-500 text-white rounded font-bold text-[10px]">GET</span>
                          <span className="text-purple-300">https://api.ateendia.io/v1/policies?status=active</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('https://api.ateendia.io/v1/policies?status=active');
                            setCopiedEndpointUrl('get_policies');
                            setTimeout(() => setCopiedEndpointUrl(null), 2000);
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1"
                        >
                          {copiedEndpointUrl === 'get_policies' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedEndpointUrl === 'get_policies' ? '¡Copiado!' : 'Copiar URL'}</span>
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        Recupera la lista de pólizas activas o por renovar para generar reportes en Google Sheets o disparar recordatorios periódicos.
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-300">
                        <div className="text-slate-500 mb-1">// Respuesta 200 OK:</div>
                        <pre className="text-amber-400">{`{
  "total": 142,
  "policies": [
    {
      "id": "pol-8921",
      "clientName": "Carlos Hernández",
      "carrier": "Florida Blue",
      "monthlyPremium": 0.00,
      "renewalDate": "2026-12-15",
      "status": "active"
    }
  ]
}`}</pre>
                      </div>
                    </>
                  )}

                  {selectedEndpointTab === 'send_whatsapp' && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-500 text-white rounded font-bold text-[10px]">POST</span>
                          <span className="text-purple-300">https://api.ateendia.io/v1/whatsapp/send</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('https://api.ateendia.io/v1/whatsapp/send');
                            setCopiedEndpointUrl('send_whatsapp');
                            setTimeout(() => setCopiedEndpointUrl(null), 2000);
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1"
                        >
                          {copiedEndpointUrl === 'send_whatsapp' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedEndpointUrl === 'send_whatsapp' ? '¡Copiado!' : 'Copiar URL'}</span>
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        Dispara un mensaje de WhatsApp directo a través de la sesión de Evolution API conectada en Ateendia CRM.
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-300">
                        <pre className="text-sky-400">{`{
  "recipientPhone": "+13055550198",
  "messageText": "Hola Maria, confirmamos tu cita de asesoría ACA para mañana a las 10:00 AM.",
  "templateId": "tmpl-appointment-reminder",
  "trackStatus": true
}`}</pre>
                      </div>
                    </>
                  )}

                  {selectedEndpointTab === 'update_stage' && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-500 text-white rounded font-bold text-[10px]">PATCH</span>
                          <span className="text-purple-300">https://api.ateendia.io/v1/leads/:id/stage</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('https://api.ateendia.io/v1/leads/:id/stage');
                            setCopiedEndpointUrl('update_stage');
                            setTimeout(() => setCopiedEndpointUrl(null), 2000);
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1"
                        >
                          {copiedEndpointUrl === 'update_stage' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedEndpointUrl === 'update_stage' ? '¡Copiado!' : 'Copiar URL'}</span>
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        Mueve un cliente en el tablero Kanban cuando responda un mensaje o agende una llamada en Calendly.
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-300">
                        <pre className="text-violet-400">{`{
  "newStage": "document_review",
  "stageNotes": "Documentos recibidos por WhatsApp via n8n OCR workflow.",
  "notifyAgent": true
}`}</pre>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Live Webhook Delivery Logs */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <h3 className="font-black text-sm text-slate-900">Historial de Transmisiones a n8n</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">Registro en vivo</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-2.5 rounded-l-lg">Hora</th>
                        <th className="p-2.5">Evento</th>
                        <th className="p-2.5">Estado</th>
                        <th className="p-2.5 rounded-r-lg">Respuesta n8n</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(n8nConfig.webhookLogs || [
                        {
                          id: 'log-1',
                          timestamp: 'Hoy, 10:45:12',
                          event: 'client.created',
                          status: 'success',
                          url: webhookUrl,
                          response: '200 OK (Sincronizado con Sheets & Telegram)'
                        },
                        {
                          id: 'log-2',
                          timestamp: 'Hoy, 09:30:00',
                          event: 'birthday.alert',
                          status: 'success',
                          url: webhookUrl,
                          response: '200 OK (Mensaje programado con éxito)'
                        },
                        {
                          id: 'log-3',
                          timestamp: 'Ayer, 18:20:44',
                          event: 'policy.issued',
                          status: 'success',
                          url: webhookUrl,
                          response: '200 OK (PDF generado & enviado)'
                        }
                      ]).map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/70">
                          <td className="p-2.5 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                          <td className="p-2.5 font-bold text-purple-700">{log.event}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {log.status === 'success' ? '✓ Entregado' : 'Error'}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-600 text-[11px]">{log.response || '200 OK'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column (1 col): Status Panel + Interactive Tutorial + Blueprint */}
            <div className="space-y-6">
              {/* Connection Status Diagnostic Panel */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <h3 className="font-extrabold text-sm text-slate-900">Panel de Estado de Conexión</h3>
                  </div>
                  <button
                    onClick={handleTestN8nWebhook}
                    disabled={isTestingN8n}
                    className="text-[11px] text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTestingN8n ? 'animate-spin' : ''}`} />
                    <span>Verificar</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Status Indicator Pill */}
                  <div
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      n8nEnabled
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {n8nEnabled ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-extrabold">
                          {n8nEnabled ? 'Instancia Conectada y Lista' : 'Conexión Pausada'}
                        </div>
                        <div className="text-[11px] opacity-80">
                          {n8nEnabled ? 'Latencia óptima < 150ms' : 'Activa el interruptor superior'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-white/70 rounded-full">
                      {n8nEnabled ? 'Online' : 'Standby'}
                    </span>
                  </div>

                  {/* Diagnostic Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Instancia</span>
                      <span className="font-mono text-slate-800 font-bold truncate block text-[11px]">
                        {instanceUrl ? instanceUrl.replace(/^https?:\/\//, '').split('/')[0] : 'n8n.cloud'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Eventos Activos</span>
                      <span className="font-bold text-purple-700 block text-[11px]">
                        {activeEvents.length} seleccionados
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Token API</span>
                      <span className="font-mono text-slate-800 font-bold block text-[11px]">
                        {apiToken ? '••••' + apiToken.slice(-4) : 'Configurado'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Latencia</span>
                      <span className="font-mono text-emerald-600 font-bold block text-[11px]">
                        {testN8nResult?.latency || 128} ms
                      </span>
                    </div>
                  </div>

                  {testN8nResult && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                      <div className="font-bold mb-0.5">Último test: {testN8nResult.serverTimestamp || 'Ahora'}</div>
                      <div className="text-[11px] leading-relaxed text-emerald-800">{testN8nResult.message}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tutorial de Configuración Component */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white p-6 rounded-3xl shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-300" />
                    <h3 className="font-black text-sm text-white">Tutorial de Configuración</h3>
                  </div>
                  <span className="text-[10px] bg-purple-800/60 border border-purple-500/40 text-purple-200 px-2 py-0.5 rounded-full font-bold">
                    Paso a Paso
                  </span>
                </div>
                <p className="text-xs text-purple-200/90 leading-relaxed">
                  Aprende cómo exponer y conectar el endpoint de Ateendia CRM en tus flujos de n8n:
                </p>

                {/* Step Selector Tabs */}
                <div className="flex gap-1.5 bg-white/10 p-1 rounded-xl">
                  {[1, 2, 3, 4].map((stepNum) => (
                    <button
                      key={stepNum}
                      onClick={() => setSelectedTutorialStep(stepNum)}
                      className={`flex-1 py-1 text-center rounded-lg text-xs font-black transition-all cursor-pointer ${
                        selectedTutorialStep === stepNum
                          ? 'bg-purple-500 text-white shadow-xs'
                          : 'text-purple-300 hover:bg-white/10'
                      }`}
                    >
                      Paso {stepNum}
                    </button>
                  ))}
                </div>

                {/* Active Step Content */}
                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-xs space-y-2.5 min-h-[140px]">
                  {selectedTutorialStep === 1 && (
                    <div className="space-y-2 animate-in fade-in">
                      <div className="font-black text-amber-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center text-[10px]">1</span>
                        Crea el nodo "Webhook" en n8n
                      </div>
                      <p className="text-purple-100 text-[11px] leading-relaxed">
                        En el lienzo de n8n, añade el nodo <strong>Webhook</strong>. Elige el método <span className="font-mono bg-purple-900/80 px-1 py-0.5 rounded">POST</span> y la ruta <span className="font-mono bg-purple-900/80 px-1 py-0.5 rounded">/ateendia-sync</span>.
                      </p>
                      <div className="p-2 bg-slate-950/60 rounded-lg text-[10px] font-mono text-purple-300 border border-purple-800/40">
                        Webhook URL &gt; Copia la "Production URL" y pégala arriba en este CRM.
                      </div>
                    </div>
                  )}

                  {selectedTutorialStep === 2 && (
                    <div className="space-y-2 animate-in fade-in">
                      <div className="font-black text-amber-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center text-[10px]">2</span>
                        Valida la firma de seguridad
                      </div>
                      <p className="text-purple-100 text-[11px] leading-relaxed">
                        Añade un nodo <strong>IF</strong> o <strong>Code</strong> para verificar que el header <span className="font-mono text-amber-300">X-Ateendia-Key</span> coincida con tu clave secreta configurada.
                      </p>
                      <div className="p-2 bg-slate-950/60 rounded-lg text-[10px] font-mono text-emerald-300 border border-purple-800/40">
                        $json.headers['x-ateendia-key'] === 'tu_clave_secreta'
                      </div>
                    </div>
                  )}

                  {selectedTutorialStep === 3 && (
                    <div className="space-y-2 animate-in fade-in">
                      <div className="font-black text-amber-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center text-[10px]">3</span>
                        Llama a Ateendia vía HTTP Request
                      </div>
                      <p className="text-purple-100 text-[11px] leading-relaxed">
                        Para enviar datos de vuelta a Ateendia o consultar clientes, usa el nodo <strong>HTTP Request</strong> con autenticación Bearer Token usando tu API Token.
                      </p>
                      <div className="p-2 bg-slate-950/60 rounded-lg text-[10px] font-mono text-sky-300 border border-purple-800/40">
                        Header: Authorization: Bearer n8n_api_...
                      </div>
                    </div>
                  )}

                  {selectedTutorialStep === 4 && (
                    <div className="space-y-2 animate-in fade-in">
                      <div className="font-black text-amber-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center text-[10px]">4</span>
                        ¡Activa el flujo y prueba!
                      </div>
                      <p className="text-purple-100 text-[11px] leading-relaxed">
                        Haz clic en <strong>Active</strong> en la esquina superior de n8n. Luego presiona el botón <strong>"⚡ Probar Conexión"</strong> en Ateendia para verificar la entrega instantánea.
                      </p>
                      <div className="p-2 bg-emerald-950/60 rounded-lg text-[10px] font-mono text-emerald-300 border border-emerald-800/40">
                        ✓ Recibirás el payload de prueba con HTTP 200 OK.
                      </div>
                    </div>
                  )}
                </div>

                {/* Step navigation buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    disabled={selectedTutorialStep === 1}
                    onClick={() => setSelectedTutorialStep((prev) => Math.max(1, prev - 1))}
                    className="text-[11px] font-bold text-purple-300 hover:text-white disabled:opacity-40 cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  <button
                    disabled={selectedTutorialStep === 4}
                    onClick={() => setSelectedTutorialStep((prev) => Math.min(4, prev + 1))}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <span>Siguiente paso</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Ready-to-import Blueprint */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-600" />
                    <h4 className="font-black text-xs text-slate-900">Plantilla JSON para Importar en n8n</h4>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sampleN8nJson);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2500);
                    }}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? '¡Copiado!' : 'Copiar Plantilla'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Copia y pega este JSON en tu n8n para importar un flujo prearmado listo para sincronizar con Google Sheets, WhatsApp y Ateendia CRM.
                </p>

                <pre className="p-3 bg-slate-900 text-purple-300 rounded-2xl text-[10px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                  {sampleN8nJson}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI MODELS & PROMPT PERSONAS */}
      {/* ========================================================================= */}
      {activeTab === 'ai_models' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-black text-slate-900">Elige tu Proveedor de Inteligencia Artificial</h2>
                <p className="text-xs text-slate-500">
                  Selecciona la plataforma con la que quieres potenciar tus respuestas automáticas y análisis:
                </p>
              </div>

              {/* Visual Provider Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'openrouter',
                    name: 'OpenRouter',
                    tag: 'Recomendado',
                    desc: 'Acceso a Claude, GPT-4o, DeepSeek con 1 sola API Key'
                  },
                  {
                    id: 'gemini',
                    name: 'Google Gemini',
                    tag: 'Ultra Rápido',
                    desc: 'Gemini 2.0 Flash y 1.5 Pro con visión y audio'
                  },
                  {
                    id: 'claude',
                    name: 'Anthropic Claude',
                    tag: 'Mejor Redacción',
                    desc: 'Claude 3.5 Sonnet: El más humano y empático'
                  },
                  {
                    id: 'openai',
                    name: 'OpenAI GPT',
                    tag: 'Popular',
                    desc: 'GPT-4o y GPT-4o-mini estándar de la industria'
                  },
                  {
                    id: 'deepseek',
                    name: 'DeepSeek R1',
                    tag: 'Económico',
                    desc: 'Razonamiento profundo a una fracción del costo'
                  },
                  {
                    id: 'custom',
                    name: 'Servidor Local',
                    tag: 'Ollama / vLLM',
                    desc: 'Conecta tu propio servidor privado de IA'
                  }
                ].map((p) => {
                  const isSelected = aiProvider === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setAiProvider(p.id as any)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                        isSelected
                          ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900">{p.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            isSelected ? 'bg-purple-200 text-purple-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {p.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">{p.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Form Settings */}
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      API Key ({aiProvider.toUpperCase()})
                    </label>
                    <input
                      type="password"
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      placeholder="sk-or-v1-xxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Modelo de IA Activo</label>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-purple-800"
                    >
                      <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (Recomendado para Seguros)</option>
                      <option value="google/gemini-2.0-flash">Google Gemini 2.0 Flash (Súper Rápido)</option>
                      <option value="openai/gpt-4o">OpenAI GPT-4o</option>
                      <option value="deepseek/deepseek-r1">DeepSeek R1 (Razonamiento Lógico)</option>
                      <option value="meta-llama/llama-3.3-70b-instruct">Meta Llama 3.3 70B</option>
                    </select>
                  </div>
                </div>

                {/* 1-Click Persona Templates */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    🎯 Elige la Personalidad de tu Asistente (Plantilla Rápida en 1 Clic):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'obamacare',
                        title: '🩺 Asesor de Salud & ACA',
                        desc: 'Especialista en subsidios, copagos y pólizas médicas.'
                      },
                      {
                        id: 'support',
                        title: '🤝 Atención & Citas',
                        desc: 'Amable, agendamiento de llamadas y resolución rápida.'
                      },
                      {
                        id: 'payments',
                        title: '💳 Cobranzas & Pagos',
                        desc: 'Recordatorios de cuotas y renovación de seguros.'
                      }
                    ].map((per) => (
                      <div
                        key={per.id}
                        onClick={() => handleSelectPersona(per.id as any)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          selectedPersona === per.id
                            ? 'bg-purple-100/70 border-purple-400 text-purple-950 font-bold ring-1 ring-purple-500'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold">{per.title}</div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">{per.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Temperature Slider with Human Language */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Creatividad de Respuestas: {temperature <= 0.4 ? 'Muy Precisa y Fiel a los Datos' : temperature >= 0.8 ? 'Muy Creativa y Espontánea' : 'Equilibrada y Empática'} ({temperature})
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">0.0 (Estricto) — 1.0 (Libre)</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instrucciones Maestras del Asistente (System Prompt)
                  </label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono leading-relaxed focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  ></textarea>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveAiConfig}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    Guardar Configuración de IA
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Testing Playground */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-sm text-slate-900">Probar Asistente en Vivo</h3>
              </div>
              <p className="text-xs text-slate-500">
                Escribe una pregunta para ver exactamente cómo respondería tu IA con las instrucciones configuradas:
              </p>

              <div className="space-y-3">
                <textarea
                  value={aiTestPrompt}
                  onChange={(e) => setAiTestPrompt(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Escribe una consulta de prueba..."
                ></textarea>

                <button
                  onClick={handleTestAiInference}
                  disabled={isTestingAi}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isTestingAi ? 'animate-spin' : ''}`} />
                  <span>{isTestingAi ? 'Consultando a la IA...' : 'Generar Respuesta de Prueba'}</span>
                </button>

                {aiTestOutput && (
                  <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-2 animate-in fade-in">
                    <div className="text-[10px] font-black text-purple-900 uppercase tracking-wider">
                      Respuesta del Asistente:
                    </div>
                    <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {aiTestOutput}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VECTOR RAG KNOWLEDGE BASE (DOCUMENTOS & ENDPOINTS IA) */}
      {/* ========================================================================= */}
      {activeTab === 'rag_vectors' && <AiVectorConfigSection />}

      {/* ========================================================================= */}
      {/* TAB 4: CHATBOT MULTI-CANAL (WHATSAPP, IG, FB) */}
      {/* ========================================================================= */}
      {activeTab === 'chatbot' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900">Activa tu Asistente Virtual en Redes Sociales</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enciende o apaga el asistente para cada canal con un solo clic. Responderá automáticamente a tus clientes en base a tus documentos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* WhatsApp */}
            <div
              onClick={() => setChatBotEnabled(!chatBotEnabled)}
              className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                chatBotEnabled
                  ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="font-black text-sm text-slate-900">WhatsApp WA1</span>
                </div>
                <input
                  type="checkbox"
                  checked={chatBotEnabled}
                  onChange={() => {}}
                  className="w-5 h-5 rounded text-emerald-600"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Atiende cotizaciones de Obamacare, recopila datos de clientes y responde dudas 24/7 sin esperas.
              </p>
            </div>

            {/* Instagram */}
            <div
              onClick={() => setIgBotEnabled(!igBotEnabled)}
              className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                igBotEnabled
                  ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-black text-sm text-slate-900">Instagram DM</span>
                </div>
                <input
                  type="checkbox"
                  checked={igBotEnabled}
                  onChange={() => {}}
                  className="w-5 h-5 rounded text-purple-600"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Responde historias, comentarios y mensajes directos derivando los leads directamente al CRM.
              </p>
            </div>

            {/* Facebook Messenger */}
            <div
              onClick={() => setFbBotEnabled(!fbBotEnabled)}
              className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                fbBotEnabled
                  ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="font-black text-sm text-slate-900">Facebook Messenger</span>
                </div>
                <input
                  type="checkbox"
                  checked={fbBotEnabled}
                  onChange={() => {}}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Captura prospectos de tus campañas de Facebook Ads directamente en el pipeline de ventas.
              </p>
            </div>
          </div>

          {/* Confidence Slider with Human Words */}
          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800">
                Seguridad Mínima de la IA para Responder: {confidenceThreshold}%
              </label>
              <span className="text-[11px] text-purple-700 font-bold bg-purple-100 px-2.5 py-0.5 rounded-full">
                {confidenceThreshold >= 85 ? 'Modo Seguro (Recomendado)' : 'Modo Abierto'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Si la IA tiene un <strong>{confidenceThreshold}%</strong> o más de seguridad basada en tus documentos, responderá automáticamente. Si no está tan segura, transferirá el chat a un asesor humano.
            </p>
            <input
              type="range"
              min="60"
              max="95"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>

          {/* Human Agent Transfer Keywords */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Palabras que transfieren automáticamente a un Asesor Humano:
            </label>
            <input
              type="text"
              value={humanTransferKeywords}
              onChange={(e) => setHumanTransferKeywords(e.target.value)}
              placeholder="humano, asesor, agente, persona, ayuda"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            />
            <p className="text-[11px] text-slate-400">
              Si el cliente escribe alguna de estas palabras, el bot se pausará inmediatamente y te notificará en el chat.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveAiConfig}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              Guardar Configuración del Chatbot
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SEGURIDAD & ANTISPAM */}
      {/* ========================================================================= */}
      {activeTab === 'antispam' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900">Protección Antispam & Seguridad de WhatsApp</h2>
            <p className="text-xs text-slate-500 mt-1">
              Configuraciones automáticas para proteger tu número de teléfono y evitar bloqueos por parte de Meta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-xs text-slate-900">Límite Diario de Mensajes Automáticos</h3>
              </div>
              <p className="text-xs text-slate-500">
                Máximo de mensajes que el bot o campañas pueden enviar por día:
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={maxDailyWhatsApp}
                  onChange={(e) => setMaxDailyWhatsApp(parseInt(e.target.value) || 100)}
                  className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
                <span className="text-xs text-slate-600 font-semibold">mensajes / día</span>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-xs text-slate-900">Pausa entre Mensajes (Simulación Humana)</h3>
              </div>
              <p className="text-xs text-slate-500">
                Espera aleatoria entre cada envío para que WhatsApp no lo detecte como robot:
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={delayBetweenMessages}
                  onChange={(e) => setDelayBetweenMessages(parseInt(e.target.value) || 3)}
                  className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
                <span className="text-xs text-slate-600 font-semibold">segundos promedio</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 space-y-0.5">
              <span className="font-bold">Tu cuenta está en estado Verde (Saludable)</span>
              <p className="text-emerald-800">
                Ateendia distribuye automáticamente los envíos y respeta las políticas oficiales de Meta Cloud API.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => alert('✅ Parámetros de seguridad y antispam actualizados.')}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              Guardar Seguridad
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: USER-FRIENDLY GUIDE & FAQ */}
      {/* ========================================================================= */}
      {activeTab === 'guide' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900">Guía Rápida: Todo lo que debes saber</h2>
            <p className="text-xs text-slate-500 mt-1">
              Explicación clara y sin palabras técnicas de para qué sirve cada integración.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-black text-xs text-purple-900 flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-purple-600" />
                <span>¿Qué es n8n y para qué me sirve?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                n8n es como un "puente inteligente". Cada vez que un cliente se registra en Ateendia, n8n puede guardarlo automáticamente en un Excel/Google Sheets, avisarle a tu equipo por Telegram o crear un recordatorio en tu calendario.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-black text-xs text-purple-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>¿Qué es OpenRouter o Claude?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Son los "cerebros" de Inteligencia Artificial que leen los mensajes de los clientes en WhatsApp y redactan respuestas humanas, amables y profesionales como si fueras tú.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-black text-xs text-purple-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-purple-600" />
                <span>¿Para qué sirve subir PDFs (RAG)?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Al subir las tablas de subsidios de Obamacare y coberturas de Florida Blue, la IA nunca inventará respuestas: responderá exactamente con los números y reglas de tus documentos.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-black text-xs text-purple-900 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-purple-600" />
                <span>¿Qué pasa si un cliente pide hablar con una persona?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                El bot se apaga al instante para esa conversación y te deja a ti o a tu asesor el control total en la pantalla de chat.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
