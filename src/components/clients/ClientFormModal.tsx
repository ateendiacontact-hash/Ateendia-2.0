import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Sparkles, Building2 } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Client } from '../../types';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  clientToEdit
}) => {
  const { currentTenant, users, catalogs, createClient, updateClient, pipelines, customFields } = useTenant();

  const defaultPipeline = pipelines[0];
  const firstStage = defaultPipeline?.stages[0];

  const [formData, setFormData] = useState<Partial<Client>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    idNumber: '',
    birthDate: '',
    gender: 'Masculino',
    maritalStatus: 'Soltero(a)',
    category: 'Seguro de Salud / ACA',
    status: 'Lead',
    assignedAgentId: '',
    leadSource: 'WhatsApp Inbound',
    pipelineId: defaultPipeline?.id || 'pipe-01',
    stageId: firstStage?.id || 'stage-01',
    dealValue: 0,
    address: {
      street: '',
      city: '',
      state: 'FL',
      zipCode: '',
      country: 'USA'
    },
    customFields: {},
    tags: []
  });

  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (clientToEdit) {
      setFormData(clientToEdit);
      setTagsInput(clientToEdit.tags ? clientToEdit.tags.join(', ') : '');
    } else {
      const activeAgents = users.filter((u) => u.tenantId === currentTenant.id && u.status === 'active');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        secondaryPhone: '',
        idNumber: '',
        birthDate: '',
        gender: 'Masculino',
        maritalStatus: 'Soltero(a)',
        category: 'Seguro de Salud / ACA',
        status: 'Lead',
        assignedAgentId: activeAgents[0]?.id || '',
        leadSource: 'WhatsApp Inbound',
        pipelineId: defaultPipeline?.id || 'pipe-01',
        stageId: firstStage?.id || 'stage-01',
        dealValue: 0,
        address: {
          street: '',
          city: '',
          state: 'FL',
          zipCode: '',
          country: 'USA'
        },
        customFields: {},
        tags: []
      });
      setTagsInput('');
    }
  }, [clientToEdit, isOpen, currentTenant.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      alert('Por favor completa nombre, apellido y teléfono principal.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (clientToEdit) {
      updateClient(clientToEdit.id, {
        ...formData,
        tags
      } as any);
    } else {
      createClient({
        ...formData,
        tags
      } as any);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {clientToEdit ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente / Prospecto'}
              </h2>
              <p className="text-xs text-slate-500">
                Empresa: <strong className="text-slate-800">{currentTenant.name}</strong> • Tenant ID: {currentTenant.id}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Personal Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Información Personal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Ej: Carlos"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium focus:border-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Apellido *</label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Ej: Mendoza"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium focus:border-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Principal *</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (786) 555-0192"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium focus:border-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Secundario</label>
                <input
                  type="tel"
                  value={formData.secondaryPhone || ''}
                  onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                  placeholder="+1 (305) 555-0188"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="carlos.mendoza@email.com"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ID / SSN / Pasaporte</label>
                <input
                  type="text"
                  value={formData.idNumber || ''}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  placeholder="XXX-XX-9821"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Género</label>
                <select
                  value={formData.gender || 'Masculino'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado Civil</label>
                <select
                  value={formData.maritalStatus || 'Soltero(a)'}
                  onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                >
                  <option value="Soltero(a)">Soltero(a)</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="Divorciado(a)">Divorciado(a)</option>
                  <option value="Viudo(a)">Viudo(a)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Classification & Assignment */}
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Clasificación & Asignación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-purple-700"
                >
                  {catalogs.clientCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                <select
                  value={formData.status || 'Lead'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-emerald-700"
                >
                  <option value="Lead">Lead</option>
                  <option value="Contactado">Contactado</option>
                  <option value="Cotizado">Cotizado</option>
                  <option value="Cerrado/Ganado">Cerrado/Ganado</option>
                  <option value="Cliente Activo">Cliente Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Agente Asignado</label>
                <select
                  value={formData.assignedAgentId || ''}
                  onChange={(e) => setFormData({ ...formData, assignedAgentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                >
                  <option value="">Sin asignar</option>
                  {users
                    .filter((u) => u.tenantId === currentTenant.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Origen del Lead</label>
                <select
                  value={formData.leadSource || ''}
                  onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                >
                  {catalogs.leadSources.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Dirección</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Calle y Número</label>
                <input
                  type="text"
                  value={formData.address?.street || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...(formData.address || {}), street: e.target.value } as any
                    })
                  }
                  placeholder="8400 NW 36th St, Suite 450"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ciudad</label>
                <input
                  type="text"
                  value={formData.address?.city || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...(formData.address || {}), city: e.target.value } as any
                    })
                  }
                  placeholder="Doral"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado / ZIP</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.address?.state || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...(formData.address || {}), state: e.target.value } as any
                      })
                    }
                    placeholder="FL"
                    className="w-16 px-2 py-2 bg-slate-50 border rounded-xl text-xs uppercase"
                  />
                  <input
                    type="text"
                    value={formData.address?.zipCode || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...(formData.address || {}), zipCode: e.target.value } as any
                      })
                    }
                    placeholder="33166"
                    className="flex-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Etiquetas / Tags (Separadas por coma)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Renovación, ACA2025, Alta Prioridad"
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
            />
          </div>

          {/* Dynamic Custom Fields from Tenant */}
          {customFields.filter((f) => f.entityType === 'client').length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Campos Personalizados de {currentTenant.name}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {customFields
                  .filter((f) => f.entityType === 'client')
                  .map((field) => (
                    <div key={field.id}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">{field.label}</label>
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={formData.customFields?.[field.name] || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customFields: {
                              ...(formData.customFields || {}),
                              [field.name]: e.target.value
                            }
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{clientToEdit ? 'Guardar Cambios' : 'Crear Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
