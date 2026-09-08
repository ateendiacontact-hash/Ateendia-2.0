import React, { useState } from 'react';
import {
  Users,
  Shield,
  Plus,
  CheckCircle2,
  Lock,
  UserCheck,
  UserX,
  Mail,
  Edit,
  Save,
  Key
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { UserRole } from '../../types';

export const UsersRolesModule: React.FC = () => {
  const { users, roles, updateRolePermissions, inviteUser, toggleUserStatus, currentTenant, currentUser } = useTenant();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [selectedRoleKey, setSelectedRoleKey] = useState<UserRole>('agent');

  // New User Invite Form
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('agent');
  const [inviteExt, setInviteExt] = useState('105');

  const tenantUsers = users.filter((u) => u.tenantId === currentTenant.id);

  const selectedRole = roles.find((r) => r.key === selectedRoleKey) || roles[0];

  const modulesList = [
    { key: 'clients', name: 'Clientes & CRM', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { key: 'policies', name: 'Pólizas & Asegurados', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'pipeline', name: 'Pipeline Comercial', actions: ['view', 'edit', 'moveCards', 'manageStages'] },
    { key: 'whatsapp', name: 'WhatsApp Multicanal', actions: ['view', 'send', 'configure'] },
    { key: 'email', name: 'Correo Electrónico & SMTP', actions: ['view', 'send', 'configure'] },
    { key: 'campaigns', name: 'Campañas Masivas', actions: ['view', 'create', 'execute'] },
    { key: 'reports', name: 'Reportes y Métricas', actions: ['view', 'export'] },
    { key: 'banking', name: 'Métodos de Pago (Tarjetas & Cuentas)', actions: ['view', 'edit', 'viewSensitive'] },
    { key: 'telephony', name: 'Telefonía Issabel PBX', actions: ['view', 'call', 'viewCdr', 'configure'] },
    { key: 'branding', name: 'Personalización de Marca', actions: ['view', 'edit'] },
    { key: 'users', name: 'Usuarios y Roles', actions: ['view', 'invite', 'editRoles'] },
    { key: 'audit', name: 'Registro de Auditoría', actions: ['view'] }
  ];

  const checkPermission = (rolePermissions: any, moduleKey: string, action: string): boolean => {
    if (!rolePermissions) return false;
    const modulePerms = rolePermissions[moduleKey];
    if (!modulePerms) return false;
    if (Array.isArray(modulePerms)) {
      return modulePerms.includes(action);
    }
    if (typeof modulePerms === 'object') {
      return Boolean(modulePerms[action]);
    }
    return false;
  };

  const handleTogglePermission = (moduleKey: string, action: string) => {
    const rolePerms = selectedRole?.permissions || {};
    const modulePerms = rolePerms[moduleKey];

    let isGranted = false;
    if (Array.isArray(modulePerms)) {
      isGranted = modulePerms.includes(action);
    } else if (modulePerms && typeof modulePerms === 'object') {
      isGranted = Boolean(modulePerms[action]);
    }

    let updatedModulePerms: any;
    if (Array.isArray(modulePerms)) {
      updatedModulePerms = isGranted
        ? modulePerms.filter((a: string) => a !== action)
        : [...modulePerms, action];
    } else {
      updatedModulePerms = {
        ...(typeof modulePerms === 'object' ? modulePerms : {}),
        [action]: !isGranted
      };
    }

    updateRolePermissions(selectedRoleKey, {
      ...rolePerms,
      [moduleKey]: updatedModulePerms
    });
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    inviteUser({
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      extension: inviteExt
    });

    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>Usuarios, Roles & Matriz de Permisos RBAC</span>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
              {tenantUsers.length} usuarios
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Control de accesos granulares, asignación de extensiones telefónicas y seguridad multi-tenant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'users' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              👥 Usuarios ({tenantUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'matrix' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              🛡️ Matriz de Permisos
            </button>
          </div>

          {activeTab === 'users' && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Invitar Usuario</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Correo Electrónico</th>
                  <th className="py-3 px-4">Rol Asignado</th>
                  <th className="py-3 px-4">Extensión PBX</th>
                  <th className="py-3 px-4">2FA Autenticación</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenantUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <span>
                        {u.name} {u.id === currentUser.id && '(Tú)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px] uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">Ext. {u.extension || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.twoFactorEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {u.twoFactorEnabled ? 'Protegido 2FA' : 'Desactivado'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (u.status === 'active' || u.active) ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {(u.status === 'active' || u.active) ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                            (u.status === 'active' || u.active)
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {(u.status === 'active' || u.active) ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EDITABLE RBAC PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Matriz Granular de Permisos por Rol</h2>
              <p className="text-xs text-slate-400">
                Selecciona un rol y marca las acciones permitidas para cada módulo del sistema.
              </p>
            </div>

            {/* Role Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {roles.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setSelectedRoleKey(r.key)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                    selectedRoleKey === r.key ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="space-y-4">
            {modulesList.map((mod) => (
              <div
                key={mod.key}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">{mod.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">module: {mod.key}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {mod.actions.map((action) => {
                    const isGranted = checkPermission(selectedRole?.permissions, mod.key, action);
                    return (
                      <button
                        key={action}
                        type="button"
                        onClick={() => handleTogglePermission(mod.key, action)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isGranted
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="capitalize">{action}</span>
                        <span>{isGranted ? '✓' : '×'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Invitar Nuevo Asesor / Usuario</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Ej: Carolina Gomez"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="carolina.g@obamacareflorida.com"
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rol</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold"
                  >
                    <option value="admin">Administrador</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="agent">Agente Asesor</option>
                    <option value="readonly">Solo Lectura</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Extensión PBX</label>
                  <input
                    type="text"
                    value={inviteExt}
                    onChange={(e) => setInviteExt(e.target.value)}
                    placeholder="105"
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Enviar Invitación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
