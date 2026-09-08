import React, { useState, useRef } from 'react';
import {
  X,
  User,
  FileSpreadsheet,
  CreditCard,
  FolderOpen,
  StickyNote,
  Activity,
  MessageSquare,
  Mail,
  Phone,
  Plus,
  Trash2,
  Edit,
  Shield,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Sparkles,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  History,
  Building,
  Star,
  Printer,
  Image as ImageIcon,
  Paperclip,
  ShieldAlert,
  ZoomIn,
  Maximize2,
  Search,
  Globe,
  ArrowRight
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Client, Policy, BankAccount, ClientDocument, ClientNote, MessageTemplate } from '../../types';
import { DomainService } from '../../domain/domainService';
import { DocumentViewerModal } from '../documents/DocumentViewerModal';
import { NoteViewerModal } from '../notes/NoteViewerModal';

interface ClientModalProps {
  clientId: string | null;
  onClose: () => void;
  onEditClient?: (client: Client) => void;
  onAddPolicy?: (clientId: string) => void;
  onNewPolicy?: (clientId: string) => void;
  onEditPolicy?: (policy: Policy) => void;
  isOpen?: boolean;
  onNavigateToTab?: (tab: any) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  clientId,
  onClose,
  onEditClient,
  onAddPolicy,
  onNewPolicy,
  onEditPolicy,
  onNavigateToTab
}) => {
  const {
    clients,
    policies,
    bankAccounts,
    documents,
    notes,
    activities,
    users,
    templates,
    smtpConfig,
    sendEmailMessage,
    startWhatsAppConversation,
    startCall,
    addNote,
    addDocument,
    deleteDocument,
    addBankAccount,
    deleteBankAccount,
    setDefaultPaymentMethod,
    deleteClient,
    deletePolicy,
    currentTenant,
    currentUser,
    can
  } = useTenant();

  const [activeTab, setActiveTab] = useState<
    'personal' | 'policies' | 'banking' | 'documents' | 'notes' | 'activity' | 'whatsapp_direct' | 'email_direct'
  >('personal');

  // Document Viewer Modal State
  const [viewerDoc, setViewerDoc] = useState<ClientDocument | null>(null);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);

  // Note Viewer Modal State
  const [viewerNote, setViewerNote] = useState<ClientNote | null>(null);
  const [isNoteViewerOpen, setIsNoteViewerOpen] = useState(false);

  // New Note state with image pasting support
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<ClientNote['category']>('General');
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const noteFileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter state for Notes
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [noteUserFilter, setNoteUserFilter] = useState('all');
  const [noteDateFilter, setNoteDateFilter] = useState('');
  const [noteCategoryFilter, setNoteCategoryFilter] = useState('all');

  // New Doc state
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Cédula / Documento de Identidad');
  const [docExpDate, setDocExpDate] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docFileUrl, setDocFileUrl] = useState<string | undefined>(undefined);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // New Payment Method (Metodos de Pago) state
  const [showAddBank, setShowAddBank] = useState(false);
  const [paymentMethodType, setPaymentMethodType] = useState<'bank_account' | 'credit_card'>('credit_card');
  
  // Bank Account fields
  const [bankHolder, setBankHolder] = useState('');
  const [bankName, setBankName] = useState('JPMorgan Chase Bank');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<BankAccount['accountType']>('Checking / Corriente');
  const [paymentMethod, setPaymentMethod] = useState<BankAccount['paymentMethod']>('ACH Débito Automático');
  
  // Card fields
  const [cardBrand, setCardBrand] = useState<'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Otro'>('Visa');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpDate, setCardExpDate] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardType, setCardType] = useState<'Crédito' | 'Débito'>('Crédito');
  const [isDefaultMethod, setIsDefaultMethod] = useState(true);

  // Masking toggle & permissions warning
  const [unmaskedAccounts, setUnmaskedAccounts] = useState<Record<string, boolean>>({});
  const [sensitiveWarning, setSensitiveWarning] = useState<string | null>(null);

  // WhatsApp composer state
  const [waMessage, setWaMessage] = useState('');
  const [selectedWaTemplate, setSelectedWaTemplate] = useState<string>('');

  // Email composer state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccessBadge, setEmailSuccessBadge] = useState(false);

  if (!clientId) return null;

  const client = clients.find((c) => c.id === clientId);
  if (!client) return null;

  const clientPolicies = policies.filter((p) => p.clientId === client.id);
  const clientBanks = bankAccounts.filter((b) => b.clientId === client.id);
  const clientDocs = documents.filter((d) => d.clientId === client.id);
  const clientNotes = notes.filter((n) => n.clientId === client.id);
  const clientActivities = activities.filter((a) => a.clientId === client.id);
  const assignedAgent = users.find((u) => u.id === client.assignedAgentId);

  // Filtered Notes by search, user, date, category
  const filteredClientNotes = clientNotes.filter((n) => {
    if (noteUserFilter && noteUserFilter !== 'all') {
      if (n.userId !== noteUserFilter && n.userName !== noteUserFilter) return false;
    }
    if (noteCategoryFilter && noteCategoryFilter !== 'all') {
      if (n.category !== noteCategoryFilter) return false;
    }
    if (noteDateFilter) {
      if (!n.createdAt.includes(noteDateFilter)) return false;
    }
    if (noteSearchQuery.trim()) {
      const q = noteSearchQuery.toLowerCase();
      const matchContent = n.content.toLowerCase().includes(q);
      const matchAuthor = (n.userName || '').toLowerCase().includes(q);
      const matchCat = (n.category || '').toLowerCase().includes(q);
      if (!matchContent && !matchAuthor && !matchCat) return false;
    }
    return true;
  });

  // Permission evaluation: only admin or users with explicit 'viewSensitive' RBAC permission can unmask
  const canRevealSensitive = currentUser?.role === 'admin' || can('banking', 'viewSensitive');

  // Handle WhatsApp Template selection
  const handleSelectWaTemplate = (templateId: string) => {
    setSelectedWaTemplate(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      const interpolated = DomainService.interpolateTemplate(tpl.body, {
        client,
        policy: clientPolicies[0],
        agent: assignedAgent,
        tenant: currentTenant
      });
      setWaMessage(interpolated);
    }
  };

  // Handle Email Template selection
  const handleSelectEmailTemplate = (templateId: string) => {
    setSelectedEmailTemplate(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      const interpolatedSubject = DomainService.interpolateTemplate(tpl.subject || '', {
        client,
        policy: clientPolicies[0],
        agent: assignedAgent,
        tenant: currentTenant
      });
      const interpolatedBody = DomainService.interpolateTemplate(tpl.body, {
        client,
        policy: clientPolicies[0],
        agent: assignedAgent,
        tenant: currentTenant
      });
      setEmailSubject(interpolatedSubject);
      setEmailBody(interpolatedBody);
    }
  };

  // Image Paste Handler for Notes
  const handleNotePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let foundImage = false;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        foundImage = true;
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setNoteImages((prev) => [...prev, event.target!.result as string]);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  // Image File Picker for Notes
  const handleNoteFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNoteImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset file input
    e.target.value = '';
  };

  const removeNoteImage = (index: number) => {
    setNoteImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Add Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() && noteImages.length === 0) return;
    addNote({
      clientId: client.id,
      content: newNoteContent,
      category: newNoteCategory,
      images: noteImages
    });
    setNewNoteContent('');
    setNoteImages([]);
  };

  // Add Document with real preview support
  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!docName) {
      setDocName(file.name);
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setDocFileUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    addDocument({
      clientId: client.id,
      name: docName,
      type: docType,
      fileSize: docFileUrl ? '1.8 MB' : '1.2 MB',
      fileUrl: docFileUrl,
      previewUrl: docFileUrl,
      description: docDescription || undefined,
      expirationDate: docExpDate || undefined,
      status: docExpDate && new Date(docExpDate) < new Date() ? 'Vencido' : 'Válido'
    });
    setDocName('');
    setDocExpDate('');
    setDocDescription('');
    setDocFileUrl(undefined);
    setShowDocUpload(false);
  };

  // Add Payment Method (Bank or Card)
  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${client.firstName} ${client.lastName}`;

    if (paymentMethodType === 'credit_card') {
      if (!cardNumber.trim()) return;
      const cleanNum = cardNumber.replace(/\s+/g, '');
      addBankAccount({
        clientId: client.id,
        clientName: fullName,
        type: 'credit_card',
        accountHolder: cardHolder || fullName,
        bankName: `${cardBrand} Card`,
        routingNumber: 'N/A',
        accountNumber: cleanNum,
        accountType: 'Tarjeta Débito/Crédito',
        paymentMethod: cardType === 'Crédito' ? 'Tarjeta de Crédito' : 'Tarjeta de Débito',
        cardBrand,
        cardHolder: cardHolder || fullName,
        cardNumber: cleanNum,
        cardExpDate: cardExpDate || '12/28',
        cardCvv: cardCvv || '***',
        cardType,
        isDefault: isDefaultMethod || clientBanks.length === 0,
        verified: true
      });
    } else {
      if (!accountNumber || !routingNumber) return;
      addBankAccount({
        clientId: client.id,
        clientName: fullName,
        type: 'bank_account',
        accountHolder: bankHolder || fullName,
        bankName,
        routingNumber,
        accountNumber,
        accountType,
        paymentMethod,
        isDefault: isDefaultMethod || clientBanks.length === 0,
        verified: true
      });
    }

    setShowAddBank(false);
    setCardNumber('');
    setCardHolder('');
    setCardExpDate('');
    setCardCvv('');
    setAccountNumber('');
    setRoutingNumber('');
    setBankHolder('');
  };

  // Send Direct Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.email || !emailSubject || !emailBody) return;
    setIsSendingEmail(true);
    await sendEmailMessage(client.email, emailSubject, emailBody, client.id);
    setIsSendingEmail(false);
    setEmailSuccessBadge(true);
    setTimeout(() => setEmailSuccessBadge(false), 4000);
  };

  // Security Unmask Toggle
  const toggleUnmask = (id: string) => {
    if (!canRevealSensitive) {
      setSensitiveWarning(
        'Acceso Restringido: Tu rol de usuario no tiene permisos para revelar los datos completos de métodos de pago. Solo el Administrador o roles con autorización de "Ver Datos Sensibles" pueden desbloquear la visualización completa.'
      );
      return;
    }
    setUnmaskedAccounts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">
          {/* Modal Top Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                {client.firstName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900">
                    {client.firstName} {client.lastName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200">
                    {client.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    {client.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                  <span>{client.phone}</span>
                  <span>•</span>
                  <span>{client.email || 'Sin correo'}</span>
                  <span>•</span>
                  <span>ID: {client.idNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('whatsapp_direct')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-98"
                title="WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              <button
                onClick={() => setActiveTab('email_direct')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-98"
                title="Email"
              >
                <Mail className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Email</span>
              </button>

              {can('clients', 'edit') && onEditClient && (
                <button
                  onClick={() => onEditClient(client)}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                  title="Editar Cliente"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}

              {can('clients', 'delete') && (
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar cliente ${client.firstName} ${client.lastName}?`)) {
                      deleteClient(client.id);
                      onClose();
                    }
                  }}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 transition-colors"
                  title="Eliminar Cliente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-700 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sensitive Access Warning */}
          {sensitiveWarning && (
            <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3 text-amber-900 text-xs">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-950">Protección de Datos Financieros: </strong>
                  <span>{sensitiveWarning}</span>
                </div>
              </div>
              <button
                onClick={() => setSensitiveWarning(null)}
                className="text-amber-700 hover:text-amber-950 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Tab Navigation (Horizontal) */}
          <div className="px-5 border-b border-slate-200 bg-white flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'personal', label: 'Datos Personales & Ficha', icon: User },
              { id: 'policies', label: `Pólizas & Miembros (${clientPolicies.length})`, icon: FileSpreadsheet },
              { id: 'banking', label: `Métodos de Pago (${clientBanks.length})`, icon: CreditCard },
              { id: 'documents', label: `Documentos (${clientDocs.length})`, icon: FolderOpen },
              { id: 'notes', label: `Notas & Bitácora (${clientNotes.length})`, icon: StickyNote },
              { id: 'activity', label: 'Actividad & Logs', icon: Activity },
              { id: 'whatsapp_direct', label: 'WhatsApp Directo', icon: MessageSquare },
              { id: 'email_direct', label: 'Enviar Email', icon: Mail }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                    isActive
                      ? 'border-purple-600 text-purple-700 bg-purple-50/40'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Modal Tab Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50">
            {/* TAB 1: DATOS PERSONALES */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                {/* Micro-Landing Web Lead Conversion Banner */}
                {(client.tags?.some((t) => t.toLowerCase().includes('lead') || t.toLowerCase().includes('micro-landing') || t.toLowerCase().includes('web')) || client.status === 'Lead' || client.leadSource?.toLowerCase().includes('web') || client.leadSource?.toLowerCase().includes('landing')) && (
                  <div className="p-4 rounded-2xl bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Solicitud de Cotización Web (Micro-Landing)
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                              Lead Entrante
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                            Este prospecto completó el formulario de cotización gratuita. Para maximizar la tasa de conversión, contáctalo rápidamente por WhatsApp o llamada directa.
                          </p>
                        </div>
                      </div>

                      {/* Lead Conversion Actions */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          onClick={() => {
                            if (client.phone) {
                              const greeting = `¡Hola ${client.firstName}! Te contactamos de ${currentTenant.name} referente a la cotización gratuita que solicitaste en nuestra página web. ¿Cómo te encuentras hoy?`;
                              startWhatsAppConversation(client.id, client.phone, `${client.firstName} ${client.lastName}`, greeting);
                              onClose();
                              onNavigateToTab?.('whatsapp');
                            }
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-98"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Contactar en WhatsApp</span>
                        </button>

                        <button
                          onClick={() => {
                            if (client.phone) {
                              startCall(client.phone, `${client.firstName} ${client.lastName}`, client.id);
                            }
                          }}
                          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-98"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Llamar PBX</span>
                        </button>

                        {onNewPolicy && (
                          <button
                            onClick={() => {
                              onNewPolicy(client.id);
                            }}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-98"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Crear Póliza</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Information Grid */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <span>Información General & Demográfica</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold block">Nombre Completo:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {client.firstName} {client.lastName}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block">Teléfono Principal:</span>
                      <span className="font-bold text-slate-900 font-mono">{client.phone}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block">Correo Electrónico:</span>
                      <span className="font-bold text-slate-900">{client.email || 'No registrado'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block">ID / SSN / TaxID:</span>
                      <span className="font-bold text-slate-900 font-mono">{client.idNumber || 'N/A'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block">Fecha de Nacimiento:</span>
                      <span className="font-bold text-slate-900">{client.birthDate || 'N/A'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block">Estatus Migratorio:</span>
                      <span className="font-bold text-slate-900">{client.customFields?.immigrationStatus || (client as any).immigrationStatus || 'No especificado'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block">Dirección Residencial:</span>
                      <span className="font-bold text-slate-900">{client.address?.street || (typeof client.address === 'string' ? client.address : 'N/A')}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block">Ciudad & Estado:</span>
                      <span className="font-bold text-slate-900">
                        {client.address?.city ? `${client.address.city}, ` : ''}
                        {client.address?.state || ''} {client.address?.zipCode || ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block">Ingreso Anual / Valor Deal:</span>
                      <span className="font-bold text-emerald-600 font-mono text-sm">
                        ${client.dealValue ? client.dealValue.toLocaleString() : '0'} / estimado
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assignment & Management Info */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>Asignación Comercial & Tenant</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold block">Asesor Asignado:</span>
                      <span className="font-bold text-slate-900">
                        {assignedAgent ? assignedAgent.name : 'Sin asignar'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block">Estado / Etapa:</span>
                      <span className="font-bold text-purple-700 capitalize">{client.status}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block">Fuente / Origen:</span>
                      <span className="font-bold text-slate-900">{client.leadSource || 'Directo'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: POLIZAS & MIEMBROS */}
            {activeTab === 'policies' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Pólizas Activas e Históricas ({clientPolicies.length})</h3>
                  {can('policies', 'create') && onNewPolicy && (
                    <button
                      onClick={() => onNewPolicy(client.id)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nueva Póliza</span>
                    </button>
                  )}
                </div>

                {clientPolicies.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                    No hay pólizas registradas para este cliente.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientPolicies.map((pol) => (
                      <div key={pol.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm">{pol.carrier}</span>
                              <span className="text-xs text-purple-700 font-semibold">({pol.planName})</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                {pol.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              Póliza Nº: <strong className="text-slate-700">{pol.policyNumber}</strong> • Tipo:{' '}
                              {pol.type}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {can('policies', 'edit') && onEditPolicy && (
                              <button
                                onClick={() => onEditPolicy(pol)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                              >
                                Editar Póliza
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Policy Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Prima Total</div>
                            <div className="font-extrabold text-slate-900 font-mono">${pol.monthlyPremium}/mes</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Subsidio APTC</div>
                            <div className="font-bold text-emerald-600 font-mono">${pol.subsidyAptc || 0}/mes</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Cuota Cliente</div>
                            <div className="font-extrabold text-purple-700 font-mono">${pol.clientPortion}/mes</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Día de Cobro</div>
                            <div className="font-bold text-slate-800">Día {pol.paymentDueDay} de c/mes</div>
                          </div>
                        </div>

                        {/* Members / Dependents Sub-Table */}
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-800">
                            Miembros Asegurados ({pol.members.length}):
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs bg-slate-50/70 rounded-xl overflow-hidden">
                              <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold">
                                <tr>
                                  <th className="p-2">Nombre</th>
                                  <th className="p-2">Parentesco</th>
                                  <th className="p-2">Fecha Nac.</th>
                                  <th className="p-2">ID / SSN</th>
                                  <th className="p-2">Estado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {pol.members.map((mem) => (
                                  <tr key={mem.id}>
                                    <td className="p-2 font-bold text-slate-800">
                                      {mem.firstName} {mem.lastName}
                                    </td>
                                    <td className="p-2">
                                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium text-[10px]">
                                        {mem.relationship}
                                      </span>
                                    </td>
                                    <td className="p-2 text-slate-600 font-mono">{mem.birthDate}</td>
                                    <td className="p-2 text-slate-600 font-mono">{mem.idNumber || '-'}</td>
                                    <td className="p-2">
                                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                        {mem.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MÉTODOS DE PAGO (Bancos & Tarjetas) */}
            {activeTab === 'banking' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <span>Métodos de Pago & Cuentas ({clientBanks.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cuentas bancarias ACH y tarjetas de crédito/débito para cobro automático de primas.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddBank(!showAddBank)}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddBank ? 'Cancelar' : 'Agregar Método de Pago'}</span>
                  </button>
                </div>

                {/* Add Payment Method Inline Form */}
                {showAddBank && (
                  <form onSubmit={handleAddPaymentMethod} className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-purple-900 uppercase tracking-wider">
                        Registrar Nuevo Método de Pago
                      </span>
                      {/* Method Selector */}
                      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setPaymentMethodType('credit_card')}
                          className={`px-3 py-1 rounded-lg transition-all ${
                            paymentMethodType === 'credit_card' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          💳 Tarjeta de Crédito / Débito
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethodType('bank_account')}
                          className={`px-3 py-1 rounded-lg transition-all ${
                            paymentMethodType === 'bank_account' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          🏦 Cuenta Bancaria (ACH)
                        </button>
                      </div>
                    </div>

                    {paymentMethodType === 'credit_card' ? (
                      /* Credit / Debit Card Fields */
                      <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Red de Tarjeta</label>
                            <select
                              value={cardBrand}
                              onChange={(e) => setCardBrand(e.target.value as any)}
                              className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-semibold"
                            >
                              <option value="Visa">Visa</option>
                              <option value="Mastercard">Mastercard</option>
                              <option value="Amex">American Express</option>
                              <option value="Discover">Discover</option>
                              <option value="Otro">Otro</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Tipo</label>
                            <select
                              value={cardType}
                              onChange={(e) => setCardType(e.target.value as any)}
                              className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-semibold"
                            >
                              <option value="Crédito">Crédito</option>
                              <option value="Débito">Débito</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Nombre en la Tarjeta</label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder={`${client.firstName} ${client.lastName}`}
                            className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Número de Tarjeta (16 Dígitos)</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4532 8912 0938 4821"
                            maxLength={19}
                            className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-mono font-bold"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Expiración (MM/AA)</label>
                            <input
                              type="text"
                              value={cardExpDate}
                              onChange={(e) => setCardExpDate(e.target.value)}
                              placeholder="08/28"
                              maxLength={5}
                              className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-mono text-center"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">CVV</label>
                            <input
                              type="password"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              placeholder="•••"
                              maxLength={4}
                              className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-mono text-center"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Bank ACH Account Fields */
                      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Titular de la Cuenta</label>
                            <input
                              type="text"
                              value={bankHolder}
                              onChange={(e) => setBankHolder(e.target.value)}
                              placeholder={`${client.firstName} ${client.lastName}`}
                              className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Entidad Bancaria</label>
                            <input
                              type="text"
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              placeholder="JPMorgan Chase, Bank of America..."
                              className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-medium"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Routing Number (9 Dígitos)</label>
                            <input
                              type="text"
                              value={routingNumber}
                              onChange={(e) => setRoutingNumber(e.target.value)}
                              placeholder="063100277"
                              className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Número de Cuenta</label>
                            <input
                              type="text"
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value)}
                              placeholder="482910394821"
                              className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-mono"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Tipo de Cuenta</label>
                            <select
                              value={accountType}
                              onChange={(e) => setAccountType(e.target.value as any)}
                              className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-medium"
                            >
                              <option value="Checking / Corriente">Checking / Corriente</option>
                              <option value="Savings / Ahorros">Savings / Ahorros</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Método</label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value as any)}
                              className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-medium"
                            >
                              <option value="ACH Débito Automático">ACH Débito Automático</option>
                              <option value="Transferencia">Transferencia</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Set as Default checkbox */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="defaultPaymentCheck"
                        checked={isDefaultMethod}
                        onChange={(e) => setIsDefaultMethod(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="defaultPaymentCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                        Establecer como método de pago actual / predeterminado
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAddBank(false)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700"
                      >
                        Guardar Método
                      </button>
                    </div>
                  </form>
                )}

                {/* Métodos de Pago List / Cards */}
                <div className="space-y-3">
                  {clientBanks.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                      Sin métodos de pago registrados para este cliente.
                    </div>
                  ) : (
                    clientBanks.map((acc) => {
                      const isCard = acc.type === 'credit_card' || acc.accountType === 'Tarjeta Débito/Crédito';
                      const isUnmasked = Boolean(unmaskedAccounts[acc.id]);
                      const last4 = acc.accountNumber ? acc.accountNumber.slice(-4) : '****';

                      return (
                        <div
                          key={acc.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            acc.isDefault
                              ? 'bg-white border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  isCard ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {isCard ? <CreditCard className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-slate-900 text-sm">{acc.bankName}</span>
                                  {acc.cardBrand && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">
                                      {acc.cardBrand}
                                    </span>
                                  )}
                                  {acc.isDefault && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                                      <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                                      <span>Método Actual / Predeterminado</span>
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs text-slate-500 mt-0.5">
                                  Titular: <strong className="text-slate-800">{acc.accountHolder}</strong> • {acc.paymentMethod}
                                </div>

                                {/* Numbers & Details */}
                                <div className="flex items-center gap-4 text-xs font-mono mt-2">
                                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                      {isCard ? 'Tarjeta' : 'Cuenta'}:
                                    </span>
                                    {isUnmasked ? (
                                      <span className="font-bold text-purple-700">{acc.accountNumber}</span>
                                    ) : (
                                      <span className="font-bold text-slate-800">
                                        {isCard ? `•••• •••• •••• ${last4}` : `••••••••${last4}`}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => toggleUnmask(acc.id)}
                                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                                      title={isUnmasked ? 'Ocultar datos' : 'Ver datos completos (Requiere permisos)'}
                                    >
                                      {isUnmasked ? <EyeOff className="w-3.5 h-3.5 text-purple-600" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>

                                  {isCard ? (
                                    acc.cardExpDate && (
                                      <span className="text-slate-500 text-[11px]">Vence: {acc.cardExpDate}</span>
                                    )
                                  ) : (
                                    <span className="text-slate-500 text-[11px]">Routing: {acc.routingNumber}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Actions: Set as Default & Delete */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {!acc.isDefault && (
                                <button
                                  onClick={() => setDefaultPaymentMethod(client.id, acc.id)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                  title="Establecer como método de cobro principal"
                                >
                                  Hacer Actual
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar este método de pago para ${acc.accountHolder}?`)) {
                                    deleteBankAccount(acc.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="Eliminar Método"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: DOCUMENTOS CON VISOR, ZOOM E IMPRESIÓN */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-purple-600" />
                      <span>Expediente Documental ({clientDocs.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Visualiza identificaciones, green cards, taxes y cartas de ingresos con zoom e impresión.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDocUpload(!showDocUpload)}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showDocUpload ? 'Cancelar' : 'Subir Documento'}</span>
                  </button>
                </div>

                {/* Upload Document Form */}
                {showDocUpload && (
                  <form onSubmit={handleAddDoc} className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm space-y-4">
                    <div className="text-xs font-extrabold text-purple-900 uppercase tracking-wider">
                      Cargar Nuevo Documento al Expediente
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Nombre del Archivo</label>
                        <input
                          type="text"
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          placeholder="Ej: Pasaporte_Vigente.pdf"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Tipo de Documento</label>
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-medium"
                        >
                          <option value="Cédula / Documento de Identidad">Cédula / Documento de Identidad</option>
                          <option value="Pasaporte Vigente">Pasaporte Vigente</option>
                          <option value="Green Card / Residencia">Green Card / Residencia</option>
                          <option value="Formulario W-2 / Taxes">Formulario W-2 / Taxes</option>
                          <option value="Comprobante de Ingresos (Paystub)">Comprobante de Ingresos (Paystub)</option>
                          <option value="Carta de Consentimiento ACA">Carta de Consentimiento ACA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Fecha de Vencimiento (Opcional)</label>
                        <input
                          type="date"
                          value={docExpDate}
                          onChange={(e) => setDocExpDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {/* File Attachment & Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Seleccionar Archivo / Imagen
                        </label>
                        <input
                          ref={docFileInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleDocFileSelect}
                          className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Nota o Descripción
                        </label>
                        <input
                          type="text"
                          value={docDescription}
                          onChange={(e) => setDocDescription(e.target.value)}
                          placeholder="Detalles sobre el documento..."
                          className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowDocUpload(false)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700"
                      >
                        Guardar en Expediente
                      </button>
                    </div>
                  </form>
                )}

                {/* Documents Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clientDocs.length === 0 ? (
                    <div className="col-span-2 bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                      No hay documentos cargados en el expediente.
                    </div>
                  ) : (
                    clientDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between gap-3 hover:border-purple-300 transition-all group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            onClick={() => {
                              setViewerDoc(doc);
                              setIsDocViewerOpen(true);
                            }}
                            className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 cursor-pointer group-hover:scale-105 transition-transform"
                            title="Abrir Visor"
                          >
                            <FolderOpen className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div
                              onClick={() => {
                                setViewerDoc(doc);
                                setIsDocViewerOpen(true);
                              }}
                              className="text-xs font-bold text-slate-900 truncate hover:text-purple-700 cursor-pointer"
                              title={doc.name}
                            >
                              {doc.name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {doc.type} • {doc.fileSize || '1.2 MB'}
                            </div>
                            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  doc.status === 'Válido'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : doc.status === 'Por Vencer'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {doc.status}
                              </span>
                              {doc.expirationDate && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Vence: {doc.expirationDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setViewerDoc(doc);
                              setIsDocViewerOpen(true);
                            }}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            title="Ver en pantalla completa con zoom e impresión"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Visualizar</span>
                          </button>
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Eliminar Documento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: NOTAS CON PEGADO DE IMÁGENES Y VISOR */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Note Composer with Image Paste Support */}
                <form
                  onSubmit={handleAddNote}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <StickyNote className="w-4 h-4 text-purple-600" />
                      <span>Agregar Nota o Bitácora</span>
                    </span>
                    <select
                      value={newNoteCategory}
                      onChange={(e) => setNewNoteCategory(e.target.value as any)}
                      className="text-xs px-2.5 py-1 bg-slate-50 border rounded-lg font-bold text-slate-700"
                    >
                      <option value="General">General</option>
                      <option value="Llamada">Llamada PBX</option>
                      <option value="Reunión">Reunión</option>
                      <option value="Cobranza">Cobranza</option>
                      <option value="Reclamo">Reclamo</option>
                      <option value="WhatsApp">WhatsApp</option>
                    </select>
                  </div>

                  <div className="relative">
                    <textarea
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      onPaste={handleNotePaste}
                      placeholder="Escribe aquí los acuerdos, resumen de llamada o novedades... (¡Puedes pegar imágenes directamente con Ctrl+V!)"
                      rows={3}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-purple-500 font-sans"
                    ></textarea>
                  </div>

                  {/* Attached Images Preview Strip in Composer */}
                  {noteImages.length > 0 && (
                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2">
                      <div className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                        <span>Imágenes / Capturas para adjuntar ({noteImages.length}):</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {noteImages.map((img, idx) => (
                          <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-purple-200 shadow-xs">
                            <img src={img} alt="Captura" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeNoteImage(idx)}
                              className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 shadow-sm hover:bg-rose-700"
                              title="Remover imagen"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions & Image Attachment trigger */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        ref={noteFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleNoteFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => noteFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Adjuntar capturas de pantalla o fotos"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Adjuntar Imagen / Captura</span>
                      </button>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        (o pega directo con Ctrl+V)
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                    >
                      Guardar Nota
                    </button>
                  </div>
                </form>

                {/* Notes Filter Bar by Date, User, Category and Search */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-purple-600" />
                      <span>Buscador & Filtros de Notas</span>
                    </span>
                    {(noteSearchQuery || noteUserFilter !== 'all' || noteDateFilter || noteCategoryFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setNoteSearchQuery('');
                          setNoteUserFilter('all');
                          setNoteDateFilter('');
                          setNoteCategoryFilter('all');
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:underline"
                      >
                        Limpiar Filtros
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {/* Keyword search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={noteSearchQuery}
                        onChange={(e) => setNoteSearchQuery(e.target.value)}
                        placeholder="Buscar en texto..."
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-medium focus:outline-hidden focus:border-purple-500"
                      />
                    </div>

                    {/* Filter by User / Author */}
                    <div>
                      <select
                        value={noteUserFilter}
                        onChange={(e) => setNoteUserFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:border-purple-500"
                      >
                        <option value="all">Todos los usuarios</option>
                        {Array.from(new Set(clientNotes.map((n) => n.userName || 'Sistema'))).map((uName) => (
                          <option key={uName} value={uName}>
                            👤 {uName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filter by Date */}
                    <div>
                      <input
                        type="date"
                        value={noteDateFilter}
                        onChange={(e) => setNoteDateFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:border-purple-500"
                        title="Filtrar por fecha específica"
                      />
                    </div>

                    {/* Filter by Category */}
                    <div>
                      <select
                        value={noteCategoryFilter}
                        onChange={(e) => setNoteCategoryFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:border-purple-500"
                      >
                        <option value="all">Todas las categorías</option>
                        <option value="General">General</option>
                        <option value="Llamada">Llamada PBX</option>
                        <option value="Reunión">Reunión</option>
                        <option value="Cobranza">Cobranza</option>
                        <option value="Reclamo">Reclamo</option>
                        <option value="WhatsApp">WhatsApp</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between pt-1">
                    <span>
                      Mostrando <strong>{filteredClientNotes.length}</strong> de <strong>{clientNotes.length}</strong> notas registradas
                    </span>
                  </div>
                </div>

                {/* Notes List */}
                <div className="space-y-3">
                  {filteredClientNotes.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                      {clientNotes.length === 0
                        ? 'No hay notas registradas para este cliente.'
                        : 'No se encontraron notas con los filtros seleccionados.'}
                    </div>
                  ) : (
                    filteredClientNotes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-purple-200 transition-all cursor-pointer"
                        onClick={() => {
                          setViewerNote(note);
                          setIsNoteViewerOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">
                              {(note.userName || 'U').charAt(0)}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900">{note.userName}</span>
                              {note.userRole && (
                                <span className="ml-1 text-[10px] text-slate-400">({note.userRole})</span>
                              )}
                            </div>
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold border border-purple-100">
                              {note.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {note.createdAt}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewerNote(note);
                                setIsNoteViewerOpen(true);
                              }}
                              className="p-1 hover:bg-slate-100 rounded-lg text-purple-600"
                              title="Ver nota e imprimir"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>

                        {/* Images Thumbnail Row */}
                        {note.images && note.images.length > 0 && (
                          <div className="pt-2 flex items-center gap-2 overflow-x-auto">
                            {note.images.map((img, idx) => (
                              <div
                                key={idx}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0 relative group shadow-2xs"
                              >
                                <img src={img} alt={`Captura ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ZoomIn className="w-4 h-4" />
                                </div>
                              </div>
                            ))}
                            <span className="text-[11px] text-purple-700 font-bold ml-1">
                              {note.images.length} {note.images.length === 1 ? 'captura adjunta' : 'capturas adjuntas'} • Clic para ampliar
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: ACTIVIDAD & BITÁCORA */}
            {activeTab === 'activity' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Historial Cronológico de Interacciones
                </div>
                {clientActivities.map((act) => (
                  <div key={act.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{act.title}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{act.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{act.description}</p>
                      <div className="text-[10px] text-slate-400 mt-1">Registrado por: {act.userName}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 7: WHATSAPP DIRECTO */}
            {activeTab === 'whatsapp_direct' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>Enviar Mensaje de WhatsApp a {client.firstName}</span>
                    </h3>
                    <p className="text-xs text-slate-500">Destino: {client.phone}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Plantilla:</span>
                    <select
                      value={selectedWaTemplate}
                      onChange={(e) => handleSelectWaTemplate(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-semibold text-purple-700"
                    >
                      <option value="">Seleccionar plantilla...</option>
                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} ({tpl.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <textarea
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    placeholder="Escribe el mensaje o selecciona una plantilla predeterminada..."
                    rows={5}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500 font-medium"
                  ></textarea>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400">
                    Las variables <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700">{'{{nombre}}'}</code> se rellenan automáticamente.
                  </div>
                  <button
                    onClick={() => {
                      if (!waMessage.trim()) return;
                      startWhatsAppConversation(client.id, client.phone, `${client.firstName} ${client.lastName}`, waMessage);
                      alert('¡Mensaje enviado por WhatsApp con éxito!');
                      setWaMessage('');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar por WhatsApp</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 8: EMAIL DIRECTO */}
            {activeTab === 'email_direct' && (
              <form onSubmit={handleSendEmail} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span>Enviar Correo SMTP a {client.firstName}</span>
                    </h3>
                    <p className="text-xs text-slate-500">Destinatario: {client.email || 'Sin correo registrado'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Plantilla:</span>
                    <select
                      value={selectedEmailTemplate}
                      onChange={(e) => handleSelectEmailTemplate(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-semibold text-purple-700"
                    >
                      <option value="">Seleccionar plantilla...</option>
                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Asunto</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Asunto del correo..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cuerpo del Mensaje</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Redacta el mensaje..."
                    rows={6}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-purple-500"
                    required
                  ></textarea>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500">
                    Remitente: <strong className="text-purple-700">{smtpConfig.senderEmail}</strong>
                  </div>

                  <div className="flex items-center gap-3">
                    {emailSuccessBadge && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>¡Correo enviado con éxito!</span>
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={isSendingEmail || !client.email}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingEmail ? 'Enviando vía SMTP...' : 'Enviar Correo'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer Modal with Zoom, Pan, Rotate, Print */}
      <DocumentViewerModal
        isOpen={isDocViewerOpen}
        onClose={() => {
          setIsDocViewerOpen(false);
          setViewerDoc(null);
        }}
        document={viewerDoc}
        documentsList={clientDocs}
        onSelectDocument={(doc) => setViewerDoc(doc)}
        clientName={`${client.firstName} ${client.lastName}`}
      />

      {/* Note Viewer Modal with Image Zoom & Print */}
      <NoteViewerModal
        isOpen={isNoteViewerOpen}
        onClose={() => {
          setIsNoteViewerOpen(false);
          setViewerNote(null);
        }}
        note={viewerNote}
        clientName={`${client.firstName} ${client.lastName}`}
      />
    </>
  );
};
