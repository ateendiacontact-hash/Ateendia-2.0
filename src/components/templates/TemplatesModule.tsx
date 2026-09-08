import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  MessageSquare,
  Mail,
  Copy,
  Eye,
  CheckCircle2,
  Save,
  X
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { MessageTemplate } from '../../types';
import { DomainService } from '../../domain/domainService';

export const TemplatesModule: React.FC = () => {
  const { templates, createTemplate, updateTemplate, deleteTemplate, clients, currentTenant } = useTenant();

  const [activeChannel, setActiveChannel] = useState<'all' | 'whatsapp' | 'email'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(templates[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [testClientIndex, setTestClientIndex] = useState(0);

  // Form State
  const [formData, setFormData] = useState<Partial<MessageTemplate>>({
    name: '',
    channel: 'whatsapp',
    category: 'Cobranza',
    subject: '',
    body: '',
    variables: ['{{nombre}}', '{{poliza}}', '{{fecha_pago}}', '{{prima}}']
  });

  const availableVariables = [
    { tag: '{{nombre}}', desc: 'Nombre del cliente' },
    { tag: '{{apellido}}', desc: 'Apellido del cliente' },
    { tag: '{{poliza}}', desc: 'Número de póliza' },
    { tag: '{{compania}}', desc: 'Aseguradora (Carrier)' },
    { tag: '{{prima}}', desc: 'Prima mensual ($)' },
    { tag: '{{fecha_pago}}', desc: 'Día de cobro' },
    { tag: '{{agente}}', desc: 'Nombre del asesor' },
    { tag: '{{empresa}}', desc: 'Nombre de la empresa' }
  ];

  const filteredTemplates = templates.filter((t) => {
    if (activeChannel === 'whatsapp') return t.channel === 'whatsapp' || t.channel === 'both';
    if (activeChannel === 'email') return t.channel === 'email' || t.channel === 'both';
    return true;
  });

  const handleStartCreate = () => {
    setFormData({
      name: '',
      channel: 'whatsapp',
      category: 'General',
      subject: '',
      body: '¡Hola {{nombre}}! Te contactamos de {{empresa}} para...',
      variables: ['{{nombre}}', '{{empresa}}']
    });
    setSelectedTemplate(null);
    setIsEditing(true);
  };

  const handleStartEdit = (t: MessageTemplate) => {
    setFormData(t);
    setSelectedTemplate(t);
    setIsEditing(true);
  };

  const handleInsertVariable = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      body: (prev.body || '') + ' ' + tag
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.body) return;

    if (selectedTemplate && selectedTemplate.id) {
      updateTemplate({
        ...formData,
        id: selectedTemplate.id
      } as MessageTemplate);
    } else {
      createTemplate(formData as any);
    }

    setIsEditing(false);
  };

  const testClient = clients[testClientIndex] || clients[0];

  // Render preview with test client
  const previewBody = selectedTemplate
    ? DomainService.interpolateTemplate(selectedTemplate.body, {
        client: testClient,
        tenant: currentTenant
      })
    : '';

  const previewSubject = selectedTemplate?.subject
    ? DomainService.interpolateTemplate(selectedTemplate.subject, {
        client: testClient,
        tenant: currentTenant
      })
    : '';

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>Plantillas de Mensajes Multicanal</span>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
              {templates.length} plantillas
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Diseña respuestas rápidas para WhatsApp y Email con etiquetas dinámicas autorrellenables.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Plantilla</span>
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Template List (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          {/* Channel Filters */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveChannel('all')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeChannel === 'all' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setActiveChannel('whatsapp')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeChannel === 'whatsapp' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setActiveChannel('email')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeChannel === 'email' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
          </div>

          {/* List of Templates */}
          <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
            {filteredTemplates.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id && !isEditing;
              return (
                <div
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTemplate(tpl);
                    setIsEditing(false);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-purple-50/70 border-purple-400 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {tpl.channel === 'whatsapp' ? (
                        <span className="p-1 rounded bg-emerald-100 text-emerald-700">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-purple-100 text-purple-700">
                          <Mail className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className="font-bold text-xs text-slate-900">{tpl.name}</span>
                    </div>

                    <span className="text-[10px] px-2 py-0.2 bg-white text-slate-600 border border-slate-200 rounded-full font-medium">
                      {tpl.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{tpl.body}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Editor OR Live Preview (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          {isEditing ? (
            /* Template Editor Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-extrabold text-slate-900">
                  {selectedTemplate ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Plantilla *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Recordatorio de Pago Mensual"
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Canal</label>
                  <select
                    value={formData.channel || 'whatsapp'}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-purple-700"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="both">Ambos (Universal)</option>
                  </select>
                </div>
              </div>

              {formData.channel !== 'whatsapp' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asunto del Correo (Email)</label>
                  <input
                    type="text"
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Ej: Aviso importante sobre tu póliza {{poliza}}"
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold"
                  />
                </div>
              )}

              {/* Clickable Variable Tag Pills */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                  Variables Disponibles (Clic para insertar en el texto):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableVariables.map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => handleInsertVariable(v.tag)}
                      className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-mono font-bold transition-colors"
                      title={v.desc}
                    >
                      {v.tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cuerpo del Mensaje *</label>
                <textarea
                  value={formData.body || ''}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={6}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-xs focus:outline-hidden focus:border-purple-500 font-medium"
                  required
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Plantilla</span>
                </button>
              </div>
            </form>
          ) : selectedTemplate ? (
            /* Template Detail & Live Simulation with Test Client */
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedTemplate.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full uppercase">
                      {selectedTemplate.channel}
                    </span>
                    <span className="text-xs text-slate-400">Categoría: {selectedTemplate.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(selectedTemplate)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar plantilla ${selectedTemplate.name}?`)) {
                        deleteTemplate(selectedTemplate.id);
                        setSelectedTemplate(templates[0] || null);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Raw Template Code */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código de la Plantilla</div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap">
                  {selectedTemplate.body}
                </div>
              </div>

              {/* Live Preview with Client Simulation */}
              <div className="bg-gradient-to-br from-purple-50/50 to-indigo-50/30 p-4 rounded-xl border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Simulación en Vivo con Datos Reales de Cliente</span>
                  </div>
                  {clients.length > 1 && (
                    <button
                      onClick={() => setTestClientIndex((i) => (i + 1) % clients.length)}
                      className="text-[11px] font-bold text-purple-700 hover:underline"
                    >
                      Probar con otro cliente ({testClient?.firstName})
                    </button>
                  )}
                </div>

                {previewSubject && (
                  <div className="text-xs">
                    <strong className="text-slate-700">Asunto: </strong>
                    <span className="font-semibold text-slate-900">{previewSubject}</span>
                  </div>
                )}

                <div className="p-4 bg-white rounded-xl border border-purple-100 shadow-sm text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {previewBody}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Selecciona una plantilla para previsualizarla o crea una nueva.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
