import React, { useState } from 'react';
import {
  Database,
  Cpu,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  Sparkles,
  Layers,
  MessageSquare,
  Bot,
  Terminal,
  Play,
  Trash2,
  RefreshCw,
  Zap,
  Code,
  ExternalLink,
  Shield,
  FileCode,
  Activity,
  Sliders,
  ChevronDown,
  ChevronUp,
  Eye,
  Send,
  HelpCircle,
  ArrowRight,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { VectorDocChunk } from '../../types';

export interface VectorDocument {
  id: string;
  name: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'csv' | 'xlsx';
  fileSize: string;
  chunksCount: number;
  embeddingModel: string;
  vectorDimensions: number;
  status: 'vectorized' | 'processing' | 'error';
  uploadedAt: string;
  category: 'ACA & Obamacare' | 'Copagos & Coberturas' | 'Estatus Migratorio' | 'Políticas de Agencia' | 'General';
  chunks: Array<{
    id: string;
    text: string;
    tokenCount: number;
    embeddingPreview: number[];
  }>;
}

const INITIAL_VECTOR_DOCUMENTS: VectorDocument[] = [
  {
    id: 'vdoc-1',
    name: 'Tabla_FPL_Subsidios_ACA_2026.pdf',
    fileType: 'pdf',
    fileSize: '1.4 MB',
    chunksCount: 4,
    embeddingModel: 'text-embedding-3-small (OpenAI)',
    vectorDimensions: 1536,
    status: 'vectorized',
    uploadedAt: 'Hoy a las 09:30 AM',
    category: 'ACA & Obamacare',
    chunks: [
      {
        id: 'chk-1-1',
        text: 'Para el año 2026, los límites federales de pobreza (FPL) para subsidios del Mercado de Salud (ACA): 1 persona ($15,060 - $60,240), 2 personas ($20,440 - $81,760), 3 personas ($25,820 - $103,280), 4 personas ($31,200 - $124,800).',
        tokenCount: 88,
        embeddingPreview: [0.0142, -0.0521, 0.0894, -0.0031, 0.1245, -0.0782]
      },
      {
        id: 'chk-1-2',
        text: 'Los solicitantes con ingresos entre el 100% y el 150% del FPL tienen derecho a primas mensuales de $0 en planes Plata de referencia con el crédito fiscal para la prima (APTC) completo.',
        tokenCount: 65,
        embeddingPreview: [-0.0312, 0.0941, -0.0125, 0.0451, 0.0812, -0.0219]
      }
    ]
  },
  {
    id: 'vdoc-2',
    name: 'Guia_Planes_Plata_CSR_FloridaBlue_Oscar.docx',
    fileType: 'docx',
    fileSize: '840 KB',
    chunksCount: 3,
    embeddingModel: 'text-embedding-3-small (OpenAI)',
    vectorDimensions: 1536,
    status: 'vectorized',
    uploadedAt: 'Hoy a las 09:45 AM',
    category: 'Copagos & Coberturas',
    chunks: [
      {
        id: 'chk-2-1',
        text: 'Los planes Plata con Reducción de Costos Compartidos (CSR 94%) ofrecen médico primario a $0 copago, especialistas entre $10 y $15, medicamentos genéricos a $0-$3, y deducible anual reducido a $0.',
        tokenCount: 74,
        embeddingPreview: [0.0811, -0.0143, 0.0429, 0.1092, -0.0631, 0.0381]
      }
    ]
  },
  {
    id: 'vdoc-3',
    name: 'Requisitos_Estatus_Migratorio_Aceptados.txt',
    fileType: 'txt',
    fileSize: '320 KB',
    chunksCount: 2,
    embeddingModel: 'text-embedding-3-small (OpenAI)',
    vectorDimensions: 1536,
    status: 'vectorized',
    uploadedAt: 'Ayer',
    category: 'Estatus Migratorio',
    chunks: [
      {
        id: 'chk-3-1',
        text: 'Estatus migratorios calificados para el Mercado ACA: Residencia Permanente (Green Card), Permiso de Trabajo vigente (I-766), Solicitud de Asilo con permiso o recibo I-797, TPS, Parol Humanitario y Visas de no inmigrante vigentes.',
        tokenCount: 82,
        embeddingPreview: [-0.0452, 0.0633, -0.0891, 0.0124, 0.1456, -0.0392]
      }
    ]
  }
];

export const AiVectorConfigSection: React.FC = () => {
  const { currentTenant, aiConfig, updateAiConfig } = useTenant();

  // Vector Engine & Embedding Model State
  const [embeddingModel, setEmbeddingModel] = useState<string>('text-embedding-3-small');
  const [vectorDimension, setVectorDimension] = useState<number>(1536);
  const [chunkSize, setChunkSize] = useState<number>(512);
  const [chunkOverlap, setChunkOverlap] = useState<number>(50);
  const [similarityMetric, setSimilarityMetric] = useState<'cosine' | 'dot' | 'euclidean'>('cosine');
  const [topKRetrieval, setTopKRetrieval] = useState<number>(aiConfig.ragTopK || 4);
  const [minSimilarityThreshold, setMinSimilarityThreshold] = useState<number>(75);

  // Channel Context Toggles
  const [enableWhatsAppRAG, setEnableWhatsAppRAG] = useState<boolean>(true);
  const [enableInternalChatRAG, setEnableInternalChatRAG] = useState<boolean>(true);
  const [enableFacebookRAG, setEnableFacebookRAG] = useState<boolean>(false);
  const [handoffIfNoContext, setHandoffIfNoContext] = useState<boolean>(true);

  // Documents & Ingestion State
  const [documents, setDocuments] = useState<VectorDocument[]>(INITIAL_VECTOR_DOCUMENTS);
  const [selectedDocForChunks, setSelectedDocForChunks] = useState<string | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadCurrentStage, setUploadCurrentStage] = useState<string>('');
  const [newDocCategory, setNewDocCategory] = useState<VectorDocument['category']>('ACA & Obamacare');

  // Semantic Retrieval Tester State
  const [searchTestQuery, setSearchTestQuery] = useState<string>(
    '¿Qué copagos tiene el plan Plata con CSR 94% y cuál es el deducible?'
  );
  const [isSearchingVectors, setIsSearchingVectors] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<
    Array<{
      docName: string;
      chunkText: string;
      similarityScore: number;
      tokenCount: number;
      category: string;
    }>
  >([]);

  // Interactive Endpoint Showcase State
  const [selectedEndpoint, setSelectedEndpoint] = useState<'rag_query' | 'whatsapp_bot' | 'internal_chat' | 'ingest'>(
    'rag_query'
  );
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'python' | 'n8n'>('curl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isTestingEndpoint, setIsTestingEndpoint] = useState<boolean>(false);
  const [endpointLiveResponse, setEndpointLiveResponse] = useState<any>(null);

  // Handle Model Change
  const handleEmbeddingModelChange = (modelId: string) => {
    setEmbeddingModel(modelId);
    if (modelId === 'text-embedding-3-small') setVectorDimension(1536);
    else if (modelId === 'text-embedding-3-large') setVectorDimension(3072);
    else if (modelId === 'gemini-text-embedding-004') setVectorDimension(768);
    else if (modelId === 'bge-m3-multilingual') setVectorDimension(1024);
    else if (modelId === 'nomic-embed-text') setVectorDimension(768);
  };

  // Simulate file upload and vectorization
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingUpload(true);
    setUploadProgress(15);
    setUploadCurrentStage('1/4: Extrayendo texto limpio del documento...');

    setTimeout(() => {
      setUploadProgress(45);
      setUploadCurrentStage('2/4: Segmentando en chunks de ' + chunkSize + ' tokens (solapamiento ' + chunkOverlap + ')...');

      setTimeout(() => {
        setUploadProgress(75);
        setUploadCurrentStage(`3/4: Generando vectores de ${vectorDimension}d con ${embeddingModel}...`);

        setTimeout(() => {
          setUploadProgress(100);
          setUploadCurrentStage('4/4: Guardando índices vectoriales en el contexto del Tenant.');

          const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
          const validExt = (['pdf', 'docx', 'txt', 'csv', 'xlsx'].includes(fileExt)
            ? fileExt
            : 'pdf') as VectorDocument['fileType'];

          const newVectorDoc: VectorDocument = {
            id: `vdoc-${Date.now()}`,
            name: file.name,
            fileType: validExt,
            fileSize: `${(file.size / 1024).toFixed(0)} KB`,
            chunksCount: Math.floor(Math.random() * 3) + 2,
            embeddingModel: `${embeddingModel} (${vectorDimension}d)`,
            vectorDimensions: vectorDimension,
            status: 'vectorized',
            uploadedAt: 'Hace un instante',
            category: newDocCategory,
            chunks: [
              {
                id: `chk-${Date.now()}-1`,
                text: `[Fragmento 1 de ${file.name}]: Documento de referencia para el Tenant ${currentTenant?.name || 'Ateendia'}. Información detallada de políticas, requisitos de elegibilidad, documentación de asegurados y normas del mercado.`,
                tokenCount: 68,
                embeddingPreview: [0.0381, -0.0612, 0.0914, -0.0144, 0.1102, -0.0431]
              },
              {
                id: `chk-${Date.now()}-2`,
                text: `[Fragmento 2 de ${file.name}]: Cláusulas de cobertura y procedimientos de asistencia directa para agentes y clientes vía WhatsApp y plataforma web.`,
                tokenCount: 54,
                embeddingPreview: [-0.0123, 0.0781, -0.0345, 0.0672, 0.0419, -0.0188]
              }
            ]
          };

          setDocuments((prev) => [newVectorDoc, ...prev]);

          // Also update tenant knowledgeBase chunks
          const newChunk: VectorDocChunk = {
            id: `chunk-${Date.now()}`,
            title: `${file.name} - Vectorizado`,
            content: newVectorDoc.chunks[0].text,
            tokenCount: newVectorDoc.chunks[0].tokenCount,
            status: 'ready',
            updatedAt: 'Hace un instante'
          };
          const updatedKnowledge = [newChunk, ...(aiConfig.knowledgeBase || [])];
          updateAiConfig({
            knowledgeBase: updatedKnowledge,
            ragTopK: topKRetrieval,
            ragEnabled: true
          });

          setIsProcessingUpload(false);
          setUploadProgress(0);
          setUploadCurrentStage('');
        }, 600);
      }, 700);
    }, 600);
  };

  // Delete Document
  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (selectedDocForChunks === id) setSelectedDocForChunks(null);
  };

  // Test Semantic Retrieval Simulation
  const handleExecuteVectorSearch = () => {
    if (!searchTestQuery.trim()) return;
    setIsSearchingVectors(true);
    setSearchResults([]);

    setTimeout(() => {
      setIsSearchingVectors(false);
      const queryLower = searchTestQuery.toLowerCase();

      // Find matching chunks
      const results: Array<{
        docName: string;
        chunkText: string;
        similarityScore: number;
        tokenCount: number;
        category: string;
      }> = [];

      documents.forEach((doc) => {
        doc.chunks.forEach((chk, idx) => {
          let score = 78.4;
          if (
            queryLower.includes('plata') ||
            queryLower.includes('copago') ||
            queryLower.includes('csr') ||
            queryLower.includes('deducible')
          ) {
            if (doc.category === 'Copagos & Coberturas' || chk.text.includes('Plata')) score = 95.8 - idx * 2.1;
          } else if (
            queryLower.includes('ingreso') ||
            queryLower.includes('fpl') ||
            queryLower.includes('tabla') ||
            queryLower.includes('subsidio')
          ) {
            if (doc.category === 'ACA & Obamacare' || chk.text.includes('FPL')) score = 96.4 - idx * 1.8;
          } else if (
            queryLower.includes('estatus') ||
            queryLower.includes('residencia') ||
            queryLower.includes('permiso') ||
            queryLower.includes('migratorio')
          ) {
            if (doc.category === 'Estatus Migratorio' || chk.text.includes('migratorio')) score = 94.2 - idx * 2.5;
          } else {
            score = 81.5 - idx * 3.4;
          }

          if (score >= minSimilarityThreshold) {
            results.push({
              docName: doc.name,
              chunkText: chk.text,
              similarityScore: parseFloat(score.toFixed(1)),
              tokenCount: chk.tokenCount,
              category: doc.category
            });
          }
        });
      });

      results.sort((a, b) => b.similarityScore - a.similarityScore);
      setSearchResults(results.slice(0, topKRetrieval));
    }, 700);
  };

  // Run Test for selected API Endpoint
  const handleTestEndpointExecution = () => {
    setIsTestingEndpoint(true);
    setEndpointLiveResponse(null);

    setTimeout(() => {
      setIsTestingEndpoint(false);
      const timestamp = new Date().toISOString();

      if (selectedEndpoint === 'rag_query') {
        setEndpointLiveResponse({
          success: true,
          status: 200,
          timestamp,
          tenantId: currentTenant?.id || 'tenant-default',
          query: '¿Cuáles son los requisitos de subsidio para 2 personas?',
          retrievedChunksCount: 2,
          similarityMetric: similarityMetric,
          topChunks: [
            {
              id: 'chk-1-1',
              document: 'Tabla_FPL_Subsidios_ACA_2026.pdf',
              similarityScore: 0.942,
              tokenCount: 88,
              content: 'Para el año 2026, los límites federales de pobreza (FPL)... 2 personas ($20,440 - $81,760)...'
            },
            {
              id: 'chk-1-2',
              document: 'Tabla_FPL_Subsidios_ACA_2026.pdf',
              similarityScore: 0.891,
              tokenCount: 65,
              content: 'Los solicitantes con ingresos entre el 100% y el 150% del FPL tienen primas de $0...'
            }
          ]
        });
      } else if (selectedEndpoint === 'whatsapp_bot') {
        setEndpointLiveResponse({
          success: true,
          status: 200,
          timestamp,
          channel: 'whatsapp',
          recipientPhone: '+13055550199',
          customerMessage: 'Hola, ¿con $22,000 al año para 2 personas tengo subsidio en Florida?',
          groundedContextUsed: true,
          contextSources: ['Tabla_FPL_Subsidios_ACA_2026.pdf (Chunk #1)'],
          aiGeneratedResponse:
            '¡Hola! Sí, calificas perfectamente para el subsidio de Obamacare (ACA) en 2026. Para un hogar de 2 personas, el rango elegible va desde $20,440 hasta $81,760 al año. Con $22,000 te ubicas bajo el 150% del FPL, por lo que puedes obtener un Plan Plata con $0 de prima mensual y copagos reducidos. ¿Deseas que te ayudemos a revisar las opciones disponibles?',
          confidenceScore: 0.96
        });
      } else if (selectedEndpoint === 'internal_chat') {
        setEndpointLiveResponse({
          success: true,
          status: 200,
          timestamp,
          agentId: 'agent-01',
          copilotMode: 'internal_advisor_assist',
          query: '¿Qué deducible tiene Oscar Silver con CSR 94%?',
          suggestedAnswerToAgent:
            '📌 **Respuesta para el Asesor:** El plan Oscar Silver con CSR 94% tiene un deducible médico de **$0 USD**, consultas con médico primario a **$0 copago**, y especialistas entre **$10 y $15**. Puedes presentárselo como la opción más conveniente para clientes bajo el 150% FPL.',
          referencedDocuments: ['Guia_Planes_Plata_CSR_FloridaBlue_Oscar.docx']
        });
      } else if (selectedEndpoint === 'ingest') {
        setEndpointLiveResponse({
          success: true,
          status: 201,
          timestamp,
          documentId: 'vdoc-api-98214',
          fileName: 'Manual_Operativo_Agencia_2026.pdf',
          chunksCreated: 6,
          vectorDimensions: vectorDimension,
          embeddingModel: embeddingModel,
          totalTokensProcessed: 1420,
          message: 'Documento procesado y vectorizado exitosamente en el índice del Tenant.'
        });
      }
    }, 900);
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Endpoint Details definitions
  const ENDPOINTS = {
    rag_query: {
      title: '1. Endpoint de Recuperación Semántica (Vector Query)',
      method: 'POST',
      url: 'https://api.ateendia.io/v1/ai/rag/query',
      desc: 'Consulta los fragmentos más relevantes para una pregunta del usuario. Ideal para construir pipelines RAG personalizados en n8n o backend.',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ateendia_sec_live_9921478201',
        'X-Tenant-ID': currentTenant?.id || 'tenant-ateendia-fl'
      },
      requestBody: {
        query: '¿Cuáles son los requisitos de subsidio para 2 personas?',
        topK: topKRetrieval,
        similarityThreshold: minSimilarityThreshold / 100,
        categoryFilter: 'ACA & Obamacare'
      }
    },
    whatsapp_bot: {
      title: '2. Endpoint de Completado para Bot de WhatsApp (RAG Auto-Responder)',
      method: 'POST',
      url: 'https://api.ateendia.io/v1/ai/whatsapp/rag-completion',
      desc: 'Endpoint optimizado para webhooks de WhatsApp (Evolution API / Cloud API). Inyecta automáticamente los documentos del CRM y responde fundamentado.',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ateendia_sec_live_9921478201',
        'X-Tenant-ID': currentTenant?.id || 'tenant-ateendia-fl'
      },
      requestBody: {
        senderPhone: '+13055550199',
        messageText: 'Hola, ¿con $22,000 al año para 2 personas tengo subsidio en Florida?',
        systemPersona: 'obamacare_advisor',
        injectDocumentContext: true,
        autoSendReply: true
      }
    },
    internal_chat: {
      title: '3. Endpoint Copiloto para Chat Interno & Asesores (Internal Copilot)',
      method: 'POST',
      url: 'https://api.ateendia.io/v1/ai/internal-chat/copilot-query',
      desc: 'Provee respuestas y citas documentales instantáneas a los asesores mientras atienden llamadas o chatean en la bandeja de entrada.',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ateendia_sec_live_9921478201',
        'X-Tenant-ID': currentTenant?.id || 'tenant-ateendia-fl'
      },
      requestBody: {
        agentUserId: 'usr-agent-01',
        leadId: 'lead-884920',
        question: '¿Qué deducible tiene Oscar Silver con CSR 94%?',
        responseFormat: 'bullet_points_with_citations'
      }
    },
    ingest: {
      title: '4. Endpoint de Ingesta & Vectorización Automática (Document Ingest)',
      method: 'POST',
      url: 'https://api.ateendia.io/v1/ai/embeddings/ingest',
      desc: 'Sube y vectoriza documentos programáticamente desde n8n, Google Drive o Typeform mediante Base64 o URL directa.',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ateendia_sec_live_9921478201',
        'X-Tenant-ID': currentTenant?.id || 'tenant-ateendia-fl'
      },
      requestBody: {
        fileName: 'Nuevas_Tarifas_Florida_2026.pdf',
        fileBase64: 'JVBERi0xLjQKJcfsj6q...[BASE64_STRING]',
        category: 'Copagos & Coberturas',
        chunkSize: chunkSize,
        embeddingModel: embeddingModel
      }
    }
  };

  const currentEndpointInfo = ENDPOINTS[selectedEndpoint];

  // Code Snippets Generator
  const getCodeSnippet = () => {
    const ep = currentEndpointInfo;
    if (selectedLanguage === 'curl') {
      return `curl -X ${ep.method} "${ep.url}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: ${ep.headers.Authorization}" \\
  -H "X-Tenant-ID: ${ep.headers['X-Tenant-ID']}" \\
  -d '${JSON.stringify(ep.requestBody, null, 2)}'`;
    }

    if (selectedLanguage === 'javascript') {
      return `// Llamada con Axios o Fetch en Node.js / React
import axios from 'axios';

async function queryAteendiaRag() {
  try {
    const response = await axios.post(
      '${ep.url}',
      ${JSON.stringify(ep.requestBody, null, 2)},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': '${ep.headers.Authorization}',
          'X-Tenant-ID': '${ep.headers['X-Tenant-ID']}'
        }
      }
    );

    console.log('✅ Contexto RAG Recuperado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error llamando al endpoint:', error.response?.data || error.message);
  }
}`;
    }

    if (selectedLanguage === 'python') {
      return `# Llamada en Python con librería requests
import requests
import json

url = "${ep.url}"
headers = {
    "Content-Type": "application/json",
    "Authorization": "${ep.headers.Authorization}",
    "X-Tenant-ID": "${ep.headers['X-Tenant-ID']}"
}
payload = ${JSON.stringify(ep.requestBody, null, 4)}

response = requests.post(url, headers=headers, data=json.dumps(payload))
print("Status:", response.status_code)
print("Respuesta:", response.json())`;
    }

    if (selectedLanguage === 'n8n') {
      return `// Parámetros para el nodo "HTTP Request" en n8n:
{
  "method": "${ep.method}",
  "url": "${ep.url}",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      { "name": "Authorization", "value": "${ep.headers.Authorization}" },
      { "name": "X-Tenant-ID", "value": "${ep.headers['X-Tenant-ID']}" }
    ]
  },
  "sendBody": true,
  "contentType": "json",
  "bodyParameters": {
    "json": ${JSON.stringify(ep.requestBody, null, 2)}
  }
}`;
    }

    return '';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-purple-200 border border-white/10">
              <Database className="w-3.5 h-3.5 text-amber-300" />
              <span>Base Vectorial RAG &amp; Contexto para Bots</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Configuración de IA &amp; Datos Vectoriales (RAG)
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed">
              Sube tus pólizas, tablas de subsidios y normativas en formato <strong>PDF, TXT, DOCX o CSV</strong> para convertirlos en <strong>vectores semánticos</strong>. Estos vectores alimentan automáticamente las respuestas del <strong>Bot de WhatsApp</strong> y el <strong>Chat Interno de Asesores</strong> con información 100% verídica.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-semibold">
                <FileText className="w-3.5 h-3.5 text-emerald-300" />
                <span>Documentos</span>
              </div>
              <div className="text-base font-black text-white mt-0.5">{documents.length} Indexados</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-semibold">
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>Vectores Totales</span>
              </div>
              <div className="text-base font-black text-white mt-0.5">
                {documents.reduce((acc, d) => acc + d.chunksCount, 0)} Chunks
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-semibold">
                <Cpu className="w-3.5 h-3.5 text-sky-300" />
                <span>Modelo Embedding</span>
              </div>
              <div className="text-xs font-mono font-bold text-white mt-1 truncate">{vectorDimension}d Vectors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 1. Embedding Model & Vector Settings + 2. Context Toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vector Engine Settings (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">1. Motor de Embeddings &amp; Segmentación</h3>
                <p className="text-[11px] text-slate-500">
                  Define el modelo matemático que transformará tus textos en coordenadas multidimensionales.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-mono font-black rounded-lg">
              {vectorDimension} Dimensiones
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Embedding Model Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Modelo de Embedding</label>
              <select
                value={embeddingModel}
                onChange={(e) => handleEmbeddingModelChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-purple-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="text-embedding-3-small">OpenAI text-embedding-3-small (1536d - Recomendado)</option>
                <option value="text-embedding-3-large">OpenAI text-embedding-3-large (3072d - Máxima Precisión)</option>
                <option value="gemini-text-embedding-004">Google Gemini text-embedding-004 (768d - Rápido)</option>
                <option value="bge-m3-multilingual">BGE-M3 Multilingual (1024d - Excelente en Español)</option>
                <option value="nomic-embed-text">Nomic Embed Text v1.5 (768d - Local / Ollama)</option>
              </select>
            </div>

            {/* Similarity Metric */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Métrica de Similitud Vectorial</label>
              <select
                value={similarityMetric}
                onChange={(e) => setSimilarityMetric(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="cosine">Similitud Coseno (Cosine Similarity - Estándar)</option>
                <option value="dot">Producto Punto (Dot Product - Normalizado)</option>
                <option value="euclidean">Distancia Euclidiana L2</option>
              </select>
            </div>
          </div>

          {/* Chunking Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Tamaño de Chunk</span>
                <span className="text-purple-600 font-mono">{chunkSize} tokens</span>
              </div>
              <input
                type="range"
                min="128"
                max="1024"
                step="64"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <p className="text-[10px] text-slate-400">~{Math.round(chunkSize * 0.75)} palabras por fragmento</p>
            </div>

            <div className="space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Solapamiento (Overlap)</span>
                <span className="text-purple-600 font-mono">{chunkOverlap} tokens</span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="10"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <p className="text-[10px] text-slate-400">Mantiene la coherencia contextual</p>
            </div>

            <div className="space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Top-K Recuperación</span>
                <span className="text-purple-600 font-mono">{topKRetrieval} fragmentos</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={topKRetrieval}
                onChange={(e) => setTopKRetrieval(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <p className="text-[10px] text-slate-400">Chunks inyectados en el prompt</p>
            </div>
          </div>
        </div>

        {/* Channel Activation & Context Guardrails (1 col) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bot className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-black text-slate-900">Inyección de Contexto RAG</h3>
              <p className="text-[11px] text-slate-500">¿Dónde usar los vectores de conocimiento?</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* WhatsApp */}
            <div
              onClick={() => setEnableWhatsAppRAG(!enableWhatsAppRAG)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                enableWhatsAppRAG
                  ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Bot de WhatsApp</div>
                  <div className="text-[10px] text-slate-500">Responde a clientes 24/7</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableWhatsAppRAG}
                onChange={() => {}}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </div>

            {/* Internal Chat Copilot */}
            <div
              onClick={() => setEnableInternalChatRAG(!enableInternalChatRAG)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                enableInternalChatRAG
                  ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Chat Interno (Copiloto)</div>
                  <div className="text-[10px] text-slate-500">Asistencia técnica para agentes</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableInternalChatRAG}
                onChange={() => {}}
                className="w-4 h-4 text-purple-600 rounded"
              />
            </div>

            {/* Minimum Similarity Filter */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center justify-between font-bold text-[11px] text-slate-700">
                <span>Umbral Mínimo de Confianza</span>
                <span className="text-emerald-700 font-mono">{minSimilarityThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={minSimilarityThreshold}
                onChange={(e) => setMinSimilarityThreshold(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <p className="text-[10px] text-slate-400">Descarta fragmentos con baja correlación</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone & Vector Documents Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Dropzone (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900">2. Cargar Documentos para Vectorizar</h3>
            <p className="text-xs text-slate-500">Formatos compatibles: PDF, DOCX, TXT, CSV, XLSX</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Categoría del Conocimiento</label>
              <select
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="ACA & Obamacare">ACA &amp; Seguros Médicos</option>
                <option value="Copagos & Coberturas">Tablas de Copagos &amp; Planes Plata</option>
                <option value="Estatus Migratorio">Estatus Migratorio &amp; Documentos</option>
                <option value="Políticas de Agencia">Políticas &amp; Comisiones de Agencia</option>
                <option value="General">Información General</option>
              </select>
            </div>

            {/* Drag & Drop Card */}
            <div className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/40 rounded-3xl p-6 text-center space-y-3 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer inline-block shadow-xs transition-transform active:scale-95">
                  <span>Seleccionar Archivo</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
                    onChange={handleFileUpload}
                    disabled={isProcessingUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500">o arrastra tu archivo aquí</p>
              </div>
              <p className="text-[10px] text-slate-400">
                Segmentación automática en chunks y vectorización con {vectorDimension} dimensiones.
              </p>
            </div>

            {/* Live Vectorizing Progress Simulation */}
            {isProcessingUpload && (
              <div className="p-4 bg-purple-100/80 rounded-2xl border border-purple-300 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-700" />
                    <span>Vectorizando documento...</span>
                  </div>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-purple-800 font-mono leading-tight">{uploadCurrentStage}</p>
              </div>
            )}
          </div>
        </div>

        {/* Vectorized Documents Table & Inspector (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-black text-slate-900">
                Documentos en el Índice Vectorial ({documents.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Tenant: {currentTenant?.name || 'Ateendia'}</span>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-purple-300 bg-slate-50/60 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold">
                      {doc.fileType === 'pdf' ? (
                        <FileText className="w-5 h-5 text-rose-600" />
                      ) : doc.fileType === 'docx' ? (
                        <FileText className="w-5 h-5 text-blue-600" />
                      ) : (
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{doc.name}</span>
                        <span className="px-2 py-0.5 bg-slate-200/80 text-slate-700 text-[10px] font-bold rounded-md">
                          {doc.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{doc.fileSize}</span>
                        <span>•</span>
                        <span>{doc.chunksCount} chunks</span>
                        <span>•</span>
                        <span>{doc.vectorDimensions}d</span>
                        <span>•</span>
                        <span>{doc.uploadedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Vectorizado</span>
                    </span>
                    <button
                      onClick={() =>
                        setSelectedDocForChunks(selectedDocForChunks === doc.id ? null : doc.id)
                      }
                      className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{selectedDocForChunks === doc.id ? 'Ocultar Chunks' : 'Ver Chunks'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar documento e índices"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Chunks and Embeddings Viewer */}
                {selectedDocForChunks === doc.id && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-2 animate-in fade-in">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span>Fragmentos &amp; Vectores Generados:</span>
                      <span className="text-[10px] font-mono text-purple-600">
                        Embedding: {doc.embeddingModel}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {doc.chunks.map((chk, idx) => (
                        <div
                          key={chk.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-purple-800">Chunk #{idx + 1} ({chk.id})</span>
                            <span className="font-mono text-slate-400">{chk.tokenCount} tokens</span>
                          </div>
                          <p className="text-slate-700 text-xs leading-relaxed font-sans">{chk.text}</p>
                          <div className="p-2 bg-slate-900 text-purple-300 rounded-lg font-mono text-[9px] truncate">
                            Vector [{chk.embeddingPreview.join(', ')}, ... +{doc.vectorDimensions - 6} floats]
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Semantic Retrieval Playground (Simulator) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-sm font-black text-slate-900">3. Simulador de Búsqueda Semántica Vectorial</h3>
              <p className="text-xs text-slate-500">
                Prueba cómo el motor de embeddings encuentra los fragmentos exactos que responderán a tus clientes.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            Top-{topKRetrieval} Chunks Activo
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchTestQuery}
            onChange={(e) => setSearchTestQuery(e.target.value)}
            placeholder="Escribe una pregunta de prueba (ej: ¿Cuáles son los límites de ingresos para ACA en 2026?)"
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <button
            onClick={handleExecuteVectorSearch}
            disabled={isSearchingVectors}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Search className={`w-3.5 h-3.5 ${isSearchingVectors ? 'animate-spin' : ''}`} />
            <span>{isSearchingVectors ? 'Buscando Vectores...' : 'Consultar Vectores'}</span>
          </button>
        </div>

        {/* Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3 pt-2 animate-in fade-in">
            <div className="text-xs font-black text-slate-800">
              Resultados Recuperados por Similitud Coseno ({searchResults.length}):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((res, i) => (
                <div
                  key={i}
                  className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-purple-950 truncate max-w-[200px]">{res.docName}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                      {res.similarityScore}% Similitud
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed bg-white p-3 rounded-xl border border-purple-100">
                    "{res.chunkText}"
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Categoría: {res.category}</span>
                    <span>{res.tokenCount} tokens</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Endpoints & Developer Integration Hub */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-black text-white">
                4. Endpoints de API REST para Inyección de Contexto RAG
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Conecta tu Bot de WhatsApp (Evolution API / Baileys), Chat Interno o flujos de n8n para consultar la memoria vectorial.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestEndpointExecution}
              disabled={isTestingEndpoint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isTestingEndpoint ? 'animate-spin' : ''}`} />
              <span>{isTestingEndpoint ? 'Ejecutando Test...' : '⚡ Probar Endpoint en Vivo'}</span>
            </button>
          </div>
        </div>

        {/* Endpoint Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            {
              id: 'rag_query',
              title: 'POST /rag/query',
              desc: 'Recuperación de Chunks Semánticos',
              icon: Database
            },
            {
              id: 'whatsapp_bot',
              title: 'POST /whatsapp/rag',
              desc: 'Bot de WhatsApp con RAG Context',
              icon: MessageSquare
            },
            {
              id: 'internal_chat',
              title: 'POST /internal-chat',
              desc: 'Copiloto de Asesores en CRM',
              icon: Sparkles
            },
            {
              id: 'ingest',
              title: 'POST /embeddings/ingest',
              desc: 'Carga & Vectorización API',
              icon: Upload
            }
          ].map((item) => {
            const isSelected = selectedEndpoint === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedEndpoint(item.id as any);
                  setEndpointLiveResponse(null);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600/30 border-purple-400 text-white ring-1 ring-purple-400'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-purple-300' : 'text-slate-400'}`} />
                  <span className="text-xs font-mono font-bold">{item.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 truncate">{item.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Endpoint URL and Description Banner */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-xs rounded-md font-mono">
                {currentEndpointInfo.method}
              </span>
              <span className="font-mono text-xs text-purple-300 font-bold break-all">
                {currentEndpointInfo.url}
              </span>
            </div>

            <button
              onClick={() => copyToClipboard(currentEndpointInfo.url, 'url')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
            >
              {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'url' ? '¡URL Copiada!' : 'Copiar URL'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-300">{currentEndpointInfo.desc}</p>
        </div>

        {/* Code Snippets & Live Response Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Code Viewer (7 cols) */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex bg-slate-800 p-0.5 rounded-xl text-[11px] font-bold">
                {(['curl', 'javascript', 'python', 'n8n'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-3 py-1 rounded-lg uppercase transition-all cursor-pointer ${
                      selectedLanguage === lang ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <button
                onClick={() => copyToClipboard(getCodeSnippet(), 'code')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedKey === 'code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'code' ? '¡Copiado!' : 'Copiar Snippet'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl text-xs font-mono text-emerald-400 border border-slate-800 max-h-80 overflow-y-auto leading-relaxed">
              {getCodeSnippet()}
            </pre>
          </div>

          {/* Response Console (5 cols) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>Respuesta del Servidor (HTTP 200)</span>
              </div>
              {endpointLiveResponse && (
                <span className="text-[10px] text-emerald-400 font-mono">Payload Válido ✓</span>
              )}
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-purple-300 max-h-80 overflow-y-auto">
              {endpointLiveResponse ? (
                <pre className="text-[11px] leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(endpointLiveResponse, null, 2)}
                </pre>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                  <Play className="w-8 h-8 text-slate-700" />
                  <p className="text-xs">
                    Haz clic en <span className="text-emerald-400 font-bold">"⚡ Probar Endpoint en Vivo"</span> para ejecutar una petición de prueba.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
