import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Plus, Trash2, Save, Users, Calendar, DollarSign, Shield } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Policy, PolicyMember } from '../../types';

interface PolicyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  policyToEdit?: Policy | null;
}

export const PolicyFormModal: React.FC<PolicyFormModalProps> = ({
  isOpen,
  onClose,
  clientId,
  policyToEdit
}) => {
  const { clients, catalogs, createPolicy, updatePolicy, currentTenant } = useTenant();

  const client = clients.find((c) => c.id === clientId);

  const [formData, setFormData] = useState<Partial<Policy>>({
    carrier: 'Florida Blue',
    planName: 'BlueOptions Silver 1410',
    policyNumber: '',
    type: 'Salud / ACA',
    monthlyPremium: 480,
    subsidyAptc: 450,
    clientPortion: 30,
    paymentDueDay: 1,
    status: 'Activa',
    startDate: new Date().toISOString().slice(0, 10),
    members: []
  });

  const [members, setMembers] = useState<PolicyMember[]>([]);

  useEffect(() => {
    if (policyToEdit) {
      setFormData(policyToEdit);
      setMembers(policyToEdit.members || []);
    } else if (client) {
      setFormData({
        carrier: catalogs.carriers[0] || 'Florida Blue',
        planName: catalogs.plans?.[catalogs.carriers[0]]?.[0] || 'Silver Essential Plan',
        policyNumber: `POL-${Math.floor(100000 + Math.random() * 900000)}`,
        type: 'Salud / ACA',
        monthlyPremium: 480,
        subsidyAptc: 450,
        clientPortion: 30,
        paymentDueDay: 1,
        status: 'Activa',
        startDate: new Date().toISOString().slice(0, 10),
        members: []
      });

      // Default primary member is the client themselves
      setMembers([
        {
          id: `mem-${Date.now()}`,
          policyId: '',
          firstName: client.firstName,
          lastName: client.lastName,
          relationship: 'Titular',
          birthDate: client.birthDate || '1985-05-12',
          gender: client.gender || 'Masculino',
          idNumber: client.idNumber || '',
          status: 'Activo'
        }
      ]);
    }
  }, [policyToEdit, isOpen, client]);

  if (!isOpen || !client) return null;

  // Add dependent member
  const handleAddMember = () => {
    const newMember: PolicyMember = {
      id: `mem-${Date.now()}`,
      policyId: policyToEdit?.id || '',
      firstName: '',
      lastName: client.lastName,
      relationship: 'Hijo(a)',
      birthDate: '',
      gender: 'Masculino',
      status: 'Activo'
    };
    setMembers([...members, newMember]);
  };

  const handleRemoveMember = (idx: number) => {
    if (members.length === 1) {
      alert('La póliza debe tener al menos un miembro titular.');
      return;
    }
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleMemberChange = (idx: number, field: keyof PolicyMember, value: any) => {
    const updated = [...members];
    updated[idx] = { ...updated[idx], [field]: value };
    setMembers(updated);
  };

  // Recalculate client portion automatically
  const handlePremiumChange = (total: number, subsidy: number) => {
    const portion = Math.max(total - subsidy, 0);
    setFormData((prev) => ({
      ...prev,
      monthlyPremium: total,
      subsidyAptc: subsidy,
      clientPortion: portion
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.policyNumber || !formData.carrier) {
      alert('Por favor especifica compañía y número de póliza.');
      return;
    }

    if (policyToEdit) {
      updatePolicy(
        policyToEdit.id,
        {
          ...formData,
          members
        } as any,
        'Modificación de detalles y miembros de póliza'
      );
    } else {
      createPolicy({
        ...formData,
        clientId: client.id,
        members
      } as any);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {policyToEdit ? 'Modificar Póliza de Seguros' : 'Emitir / Registrar Nueva Póliza'}
              </h2>
              <p className="text-xs text-slate-500">
                Cliente Titular: <strong className="text-slate-900">{client.firstName} {client.lastName}</strong> ({client.phone})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: Carrier & Plan */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Datos de la Compañía Aseguradora & Plan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Aseguradora (Carrier) *</label>
                <select
                  value={formData.carrier || ''}
                  onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-purple-700"
                  required
                >
                  {catalogs.carriers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Póliza</label>
                <select
                  value={formData.type || 'Salud / ACA'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                >
                  <option value="Salud / ACA">Salud / ACA (Obamacare)</option>
                  <option value="Vida / Seguro de Vida">Vida / Seguro de Vida</option>
                  <option value="Dental & Visión">Dental & Visión</option>
                  <option value="Suplementario / Hospital">Suplementario / Hospital</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Plan</label>
                <input
                  type="text"
                  value={formData.planName || ''}
                  onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                  placeholder="Ej: BlueOptions Silver 1410"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Número de Póliza / ID *</label>
                <input
                  type="text"
                  value={formData.policyNumber || ''}
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  placeholder="POL-849201"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financials & Payment Rules */}
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Cálculo de Primas & Día de Cobro
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prima Total ($/mes)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthlyPremium ?? 0}
                  onChange={(e) => handlePremiumChange(parseFloat(e.target.value) || 0, formData.subsidyAptc || 0)}
                  className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-700 mb-1">Subsidio APTC ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.subsidyAptc ?? 0}
                  onChange={(e) => handlePremiumChange(formData.monthlyPremium || 0, parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-700 mb-1">Pago Cliente ($)</label>
                <input
                  type="number"
                  value={formData.clientPortion ?? 0}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 border rounded-xl text-xs font-mono font-extrabold text-purple-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Día de Cobro (1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.paymentDueDay ?? 1}
                  onChange={(e) => setFormData({ ...formData, paymentDueDay: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de Póliza</label>
                <select
                  value={formData.status || 'Activa'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-bold text-emerald-700"
                >
                  <option value="Activa">Activa</option>
                  <option value="Pendiente de Pago">Pendiente de Pago</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="En Renovación">En Renovación</option>
                  <option value="Expirada">Expirada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Independent Members & Dependents Builder */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Miembros & Dependientes Asegurados ({members.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Agregado DDD: Gestiona titular, cónyuge e hijos con estatus y datos propios.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddMember}
                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Dependiente</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {members.map((mem, idx) => (
                <div
                  key={mem.id || idx}
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-2.5 items-center"
                >
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Nombre</label>
                    <input
                      type="text"
                      value={mem.firstName || ''}
                      onChange={(e) => handleMemberChange(idx, 'firstName', e.target.value)}
                      placeholder="Nombre"
                      className="w-full px-2 py-1.5 bg-white border rounded-lg text-xs font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Apellido</label>
                    <input
                      type="text"
                      value={mem.lastName || ''}
                      onChange={(e) => handleMemberChange(idx, 'lastName', e.target.value)}
                      placeholder="Apellido"
                      className="w-full px-2 py-1.5 bg-white border rounded-lg text-xs font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Parentesco</label>
                    <select
                      value={mem.relationship || 'Titular'}
                      onChange={(e) => handleMemberChange(idx, 'relationship', e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-white border rounded-lg text-xs font-medium"
                    >
                      <option value="Titular">Titular</option>
                      <option value="Cónyuge">Cónyuge</option>
                      <option value="Hijo(a)">Hijo(a)</option>
                      <option value="Dependiente">Dependiente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Fecha Nacimiento</label>
                    <input
                      type="date"
                      value={mem.birthDate || ''}
                      onChange={(e) => handleMemberChange(idx, 'birthDate', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">ID / SSN</label>
                    <input
                      type="text"
                      value={mem.idNumber || ''}
                      onChange={(e) => handleMemberChange(idx, 'idNumber', e.target.value)}
                      placeholder="XXX-XX-0000"
                      className="w-full px-2 py-1.5 bg-white border rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-3 sm:pt-0">
                    <select
                      value={mem.status || 'Activo'}
                      onChange={(e) => handleMemberChange(idx, 'status', e.target.value as any)}
                      className="px-2 py-1.5 bg-white border rounded-lg text-xs font-bold text-emerald-700 flex-1"
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                      <option value="Excluido">Excluido</option>
                    </select>
                    {members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Eliminar dependiente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
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
              <span>{policyToEdit ? 'Guardar Cambios' : 'Emitir Póliza'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
