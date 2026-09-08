import React, { useState } from 'react';
import {
  Kanban,
  Plus,
  DollarSign,
  ChevronRight,
  MoveRight,
  MoreVertical,
  Phone,
  MessageSquare,
  User,
  Sparkles,
  Settings,
  GripVertical,
  Layers,
  ArrowRightLeft,
  Globe,
  Share2,
  Search,
  PhoneCall,
  Users,
  FileSpreadsheet,
  Filter,
  UserCheck,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Client, PipelineStage } from '../../types';
import { DomainService } from '../../domain/domainService';

interface PipelineViewProps {
  onOpenClient: (clientId: string) => void;
  onOpenNewClient: () => void;
  onNavigateToTab?: (tab: any) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  onOpenClient,
  onOpenNewClient,
  onNavigateToTab
}) => {
  const {
    pipelines,
    clients,
    moveClientStage,
    startCall,
    startWhatsAppConversation,
    users,
    currentTenant,
    updateClient,
    can
  } = useTenant();

  const [activePipelineId, setActivePipelineId] = useState<string>(pipelines[0]?.id || 'pipe-01');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [draggedClientId, setDraggedClientId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [assigningClientId, setAssigningClientId] = useState<string | null>(null);

  const currentPipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];

  const getLeadSourceInfo = (source?: string, tags?: string[]) => {
    const src = (source || tags?.find((t) => t.toLowerCase().includes('landing') || t.toLowerCase().includes('whatsapp')) || '').toLowerCase();

    if (src.includes('landing') || src.includes('web') || src.includes('micro')) {
      return {
        label: source || 'Micro-Landing Web',
        icon: Globe,
        colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      };
    }
    if (src.includes('whatsapp 1') || src.includes('línea 1') || src.includes('linea 1')) {
      return {
        label: 'WhatsApp (Línea 1 - Ventas)',
        icon: MessageSquare,
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (src.includes('whatsapp 2') || src.includes('línea 2') || src.includes('linea 2')) {
      return {
        label: 'WhatsApp (Línea 2 - Asesoría)',
        icon: MessageSquare,
        colorClass: 'bg-teal-50 text-teal-700 border-teal-200'
      };
    }
    if (src.includes('whatsapp')) {
      return {
        label: source || 'WhatsApp Inbound',
        icon: MessageSquare,
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (src.includes('facebook') || src.includes('meta')) {
      return {
        label: 'Facebook Ads',
        icon: Share2,
        colorClass: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    }
    if (src.includes('google') || src.includes('search')) {
      return {
        label: 'Google Ads / Search',
        icon: Search,
        colorClass: 'bg-amber-50 text-amber-800 border-amber-200'
      };
    }
    if (src.includes('llamada') || src.includes('issabel') || src.includes('pbx') || src.includes('inbound')) {
      return {
        label: 'Llamada Issabel PBX',
        icon: PhoneCall,
        colorClass: 'bg-cyan-50 text-cyan-800 border-cyan-200'
      };
    }
    if (src.includes('referido')) {
      return {
        label: 'Referido de Cliente',
        icon: Users,
        colorClass: 'bg-purple-50 text-purple-700 border-purple-200'
      };
    }
    if (src.includes('csv') || src.includes('import')) {
      return {
        label: 'Importación CSV',
        icon: FileSpreadsheet,
        colorClass: 'bg-slate-100 text-slate-700 border-slate-200'
      };
    }
    return {
      label: source || 'Directo / Agencia',
      icon: Sparkles,
      colorClass: 'bg-slate-100 text-slate-600 border-slate-200'
    };
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    // Source filter
    if (selectedSourceFilter !== 'all') {
      const srcInfo = getLeadSourceInfo(c.leadSource, c.tags);
      if (selectedSourceFilter === 'landing' && !srcInfo.label.toLowerCase().includes('landing') && !srcInfo.label.toLowerCase().includes('web')) return false;
      if (selectedSourceFilter === 'whatsapp' && !srcInfo.label.toLowerCase().includes('whatsapp')) return false;
      if (selectedSourceFilter === 'facebook' && !srcInfo.label.toLowerCase().includes('facebook')) return false;
      if (selectedSourceFilter === 'google' && !srcInfo.label.toLowerCase().includes('google')) return false;
      if (selectedSourceFilter === 'telephony' && !srcInfo.label.toLowerCase().includes('llamada') && !srcInfo.label.toLowerCase().includes('issabel')) return false;
      if (selectedSourceFilter === 'referral' && !srcInfo.label.toLowerCase().includes('referido')) return false;
    }
    // Agent filter
    if (selectedAgentFilter !== 'all') {
      if (selectedAgentFilter === 'unassigned' && c.assignedAgentId) return false;
      if (selectedAgentFilter !== 'unassigned' && c.assignedAgentId !== selectedAgentFilter) return false;
    }
    return true;
  });

  const totalPipelineValue = filteredClients.reduce((acc, c) => acc + (c.dealValue || 0), 0);

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData('text/plain', clientId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedClientId(clientId);
  };

  const handleDragEnd = () => {
    setDraggedClientId(null);
    setDragOverStageId(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: string) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      if (dragOverStageId === stageId) {
        setDragOverStageId(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const clientId = e.dataTransfer.getData('text/plain') || draggedClientId;
    if (clientId) {
      moveClientStage(clientId, targetStageId);
    }
    setDraggedClientId(null);
    setDragOverStageId(null);
  };

  const handleQuickReassign = (clientId: string, newAgentId: string) => {
    updateClient(clientId, { assignedAgentId: newAgentId });
    setAssigningClientId(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">Pipeline de Ventas & Oportunidades</h1>
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                {filteredClients.length} prospectos
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-medium">
                <ArrowRightLeft className="w-3 h-3 text-purple-600" />
                Arrastrar & Soltar Activo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualiza en tiempo real el origen de cada prospecto (Micro-Landing, WhatsApp 1/2, Ads) y el asesor asignado para su atención.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Pipeline Selector */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Tablero:</span>
              <select
                value={activePipelineId}
                onChange={(e) => setActivePipelineId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Valor Total: {DomainService.formatCurrency(totalPipelineValue)}</span>
            </div>

            {can('clients', 'create') && (
              <button
                onClick={onOpenNewClient}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Prospecto</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar: Lead Source & Assigned Agent */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-purple-600" />
            <span>Filtrar por:</span>
          </div>

          {/* Lead Source Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSourceFilter}
              onChange={(e) => setSelectedSourceFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Todos los Orígenes</option>
              <option value="landing">🌐 Micro-Landing Web</option>
              <option value="whatsapp">💬 WhatsApp (Líneas 1 y 2)</option>
              <option value="facebook">📱 Facebook Ads</option>
              <option value="google">🔍 Google Ads / Search</option>
              <option value="telephony">📞 Llamada Issabel PBX</option>
              <option value="referral">👥 Referidos</option>
            </select>
          </div>

          {/* Assigned Agent Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Todos los Asesores</option>
              <option value="unassigned">⚠️ Sin Asesor Asignado</option>
              {users
                .filter((u) => u.tenantId === currentTenant.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    👤 {u.name} ({u.role})
                  </option>
                ))}
            </select>
          </div>

          {(selectedSourceFilter !== 'all' || selectedAgentFilter !== 'all') && (
            <button
              onClick={() => {
                setSelectedSourceFilter('all');
                setSelectedAgentFilter('all');
              }}
              className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-purple-700 bg-slate-100 hover:bg-purple-50 text-[11px] font-bold transition-colors"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[calc(100vh-300px)] select-none">
        {currentPipeline?.stages.map((stage, sIdx) => {
          const stageClients = filteredClients.filter(
            (c) => (c.stageId || currentPipeline.stages[0].id) === stage.id
          );
          const stageTotalValue = stageClients.reduce((acc, c) => acc + (c.dealValue || 0), 0);
          const isDragOver = dragOverStageId === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={(e) => handleDragLeave(e, stage.id)}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`w-72 sm:w-80 shrink-0 rounded-2xl p-3 border transition-all duration-200 flex flex-col max-h-[82vh] ${
                isDragOver
                  ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-300 ring-offset-1 shadow-lg scale-[1.01]'
                  : 'bg-slate-100/80 border-slate-200/80'
              }`}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: stage.color }}></span>
                  <h3 className="font-bold text-xs text-slate-800 tracking-tight truncate max-w-[140px]">
                    {stage.name}
                  </h3>
                  <span className="px-2 py-0.5 bg-white text-slate-700 rounded-full text-[11px] font-bold shadow-xs">
                    {stageClients.length}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-purple-700 font-mono">
                  ${stageTotalValue}
                </div>
              </div>

              {/* Drop Target Indicator */}
              {isDragOver && (
                <div className="mb-2 py-2 border-2 border-dashed border-purple-400 bg-purple-100/60 rounded-xl text-center text-xs font-bold text-purple-700 animate-pulse flex items-center justify-center gap-1.5">
                  <MoveRight className="w-3.5 h-3.5" />
                  Soltar prospecto aquí ({stage.winProbability}% prob.)
                </div>
              )}

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 min-h-[120px]">
                {stageClients.length === 0 && !isDragOver ? (
                  <div className="text-center py-8 text-slate-400 text-xs italic border-2 border-dashed border-slate-200 rounded-xl bg-white/40 flex flex-col items-center justify-center gap-1">
                    <Layers className="w-4 h-4 text-slate-300" />
                    <span>Sin prospectos en esta etapa</span>
                  </div>
                ) : (
                  stageClients.map((client) => {
                    const agent = users.find((u) => u.id === client.assignedAgentId);
                    const isBeingDragged = draggedClientId === client.id;
                    const srcInfo = getLeadSourceInfo(client.leadSource, client.tags);
                    const SourceIcon = srcInfo.icon;
                    const isAssigningThis = assigningClientId === client.id;

                    return (
                      <div
                        key={client.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, client.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white rounded-xl p-3.5 border transition-all group space-y-2.5 cursor-grab active:cursor-grabbing ${
                          isBeingDragged
                            ? 'opacity-40 border-purple-400 scale-95 shadow-none'
                            : 'border-slate-200 hover:border-purple-300 shadow-xs hover:shadow-md'
                        }`}
                      >
                        {/* Card Top: Grip handle, Name & Category */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-1.5 min-w-0">
                            <div className="mt-0.5 text-slate-300 group-hover:text-purple-400 transition-colors shrink-0" title="Arrastrar tarjeta entre etapas">
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenClient(client.id);
                                }}
                                className="font-bold text-xs text-slate-900 hover:text-purple-600 cursor-pointer line-clamp-1"
                              >
                                {client.firstName} {client.lastName}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="inline-block px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 text-[10px] font-semibold">
                                  {client.category || 'Prospecto'}
                                </span>
                                {client.customFields?.service && (
                                  <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-medium truncate max-w-[120px]">
                                    {client.customFields.service}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono text-xs font-black text-slate-900">
                              ${client.dealValue || 0}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">{stage.winProbability}% prob.</div>
                          </div>
                        </div>

                        {/* LEAD SOURCE ORIGIN BADGE */}
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${srcInfo.colorClass}`}
                            title={`Origen del Prospecto: ${srcInfo.label}`}
                          >
                            <SourceIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[170px]">{srcInfo.label}</span>
                          </div>
                        </div>

                        {/* ASSIGNED AGENT ROW & QUICK REASSIGN */}
                        <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {agent ? (
                              <>
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0 shadow-2xs"
                                  style={{ backgroundColor: currentTenant.primaryColor || '#7c3aed' }}
                                >
                                  {agent.name.charAt(0)}
                                </div>
                                <div className="truncate">
                                  <span className="text-[10px] text-slate-400 block leading-tight">Asesor:</span>
                                  <span className="text-slate-800 font-bold text-[11px] truncate block leading-tight">
                                    {agent.name}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center gap-1 text-amber-700 font-bold text-[10px]">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>Sin Asesor Asignado</span>
                              </div>
                            )}
                          </div>

                          {/* Reassign Button or Dropdown */}
                          {isAssigningThis ? (
                            <select
                              autoFocus
                              onChange={(e) => {
                                if (e.target.value) handleQuickReassign(client.id, e.target.value);
                              }}
                              onBlur={() => setAssigningClientId(null)}
                              className="text-[10px] bg-white border border-purple-300 rounded px-1.5 py-0.5 font-bold text-slate-800"
                              defaultValue={agent?.id || ''}
                            >
                              <option value="">-- Asignar --</option>
                              {users
                                .filter((u) => u.tenantId === currentTenant.id)
                                .map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name.split(' ')[0]} ({u.role})
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssigningClientId(client.id);
                              }}
                              className="text-[10px] text-purple-600 hover:text-purple-800 hover:underline font-semibold shrink-0"
                              title="Cambiar asesor asignado"
                            >
                              {agent ? 'Cambiar' : 'Asignar'}
                            </button>
                          )}
                        </div>

                        {/* Phone Contact & Quick Comms */}
                        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="font-mono text-xs font-semibold text-slate-700 truncate">{client.phone}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startCall(client.phone, `${client.firstName} ${client.lastName}`, client.id);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition-colors"
                              title="Llamar con Issabel PBX"
                            >
                              <Phone className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startWhatsAppConversation(client.id, client.phone, `${client.firstName} ${client.lastName}`);
                                onNavigateToTab?.('whatsapp');
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors"
                              title="Abrir WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Card Stage Mover */}
                        <div className="flex items-center justify-between pt-1">
                          {sIdx < currentPipeline.stages.length - 1 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveClientStage(client.id, currentPipeline.stages[sIdx + 1].id);
                              }}
                              className="w-full py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors"
                              title={`Mover a siguiente etapa: ${currentPipeline.stages[sIdx + 1].name}`}
                            >
                              <span>Avanzar a {currentPipeline.stages[sIdx + 1].name}</span>
                              <MoveRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <div className="w-full py-1 rounded-lg bg-emerald-50 text-emerald-700 text-center text-[10px] font-bold flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Oportunidad Ganada / Finalizada</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

