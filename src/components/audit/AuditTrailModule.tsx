import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  History,
  Lock,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  Activity
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

export const AuditTrailModule: React.FC = () => {
  const { auditLogs, currentTenant } = useTenant();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('all');

  const filteredLogs = auditLogs.filter((log: any) => {
    const entityLabel = log.targetName || log.module || log.entityName || '';
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      !term ||
      (log.action || '').toLowerCase().includes(term) ||
      (log.userName || '').toLowerCase().includes(term) ||
      (log.details || '').toLowerCase().includes(term) ||
      entityLabel.toLowerCase().includes(term);

    const matchesEntity = selectedEntity === 'all' || entityLabel.toLowerCase().includes((selectedEntity || '').toLowerCase());

    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>Registro de Auditoría & Trazabilidad Inmutable</span>
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                {auditLogs.length} eventos
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Bitácora de seguridad con antes/después, timestamps UTC, IPs de origen y firmas de integridad.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Tenant ID: {currentTenant.id}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, acción o registro..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium focus:outline-hidden"
          />
        </div>

        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          className="px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="all">Todas las Entidades</option>
          <option value="Client">Clientes (Client)</option>
          <option value="Policy">Pólizas (Policy)</option>
          <option value="BankAccount">Cuentas Bancarias (BankAccount)</option>
          <option value="WhatsApp">WhatsApp Gateway</option>
          <option value="SMTP">Configuración SMTP</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-4">Acción Realizada</th>
                <th className="py-3 px-4">Entidad Afectada</th>
                <th className="py-3 px-4">Dirección IP</th>
                <th className="py-3 px-4">Detalle / Diferencial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No se registraron eventos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">
                        {log.userName.charAt(0)}
                      </div>
                      <span>{log.userName}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {log.targetName || log.module || (log as any).entityName || 'General'}{' '}
                      {(log.targetId || (log as any).entityId) && (
                        <span className="text-[10px] font-mono text-slate-400">
                          #{log.targetId || (log as any).entityId}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      {log.details ? (
                        <div className="font-mono text-[10px] bg-slate-50 p-1.5 rounded-md border border-slate-200 truncate">
                          {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
