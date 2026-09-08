import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Phone,
  MessageSquare,
  Mail,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Tag,
  Calendar,
  DollarSign,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Client } from '../../types';
import { DomainService } from '../../domain/domainService';

interface ClientsListViewProps {
  onOpenClient: (clientId: string) => void;
  onOpenNewClient: () => void;
  onOpenImport: () => void;
  onNavigateToTab?: (tab: any) => void;
}

export const ClientsListView: React.FC<ClientsListViewProps> = ({
  onOpenClient,
  onOpenNewClient,
  onOpenImport,
  onNavigateToTab
}) => {
  const {
    clients,
    policies,
    catalogs,
    users,
    can,
    startWhatsAppConversation,
    startCall,
    currentTenant
  } = useTenant();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter clients
  const filteredClients = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return clients.filter((c) => {
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
      const matchSearch =
        !term ||
        fullName.includes(term) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.idNumber && c.idNumber.toLowerCase().includes(term));

      const matchCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const matchStatus = selectedStatus === 'all' || c.status === selectedStatus;
      const matchAgent = selectedAgent === 'all' || c.assignedAgentId === selectedAgent;

      return matchSearch && matchCategory && matchStatus && matchAgent;
    });
  }, [clients, searchTerm, selectedCategory, selectedStatus, selectedAgent]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Nombre', 'Apellido', 'Email', 'Telefono', 'Fecha_Nacimiento', 'Categoria', 'Estado', 'Agente_Asignado', 'Pólizas_Activas', 'Valor_Deal'];
    const rows = filteredClients.map((c) => {
      const agent = users.find((u) => u.id === c.assignedAgentId);
      const clientPolicies = policies.filter((p) => p.clientId === c.id);
      return [
        c.id,
        `"${c.firstName}"`,
        `"${c.lastName}"`,
        `"${c.email || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.birthDate || ''}"`,
        `"${c.category || ''}"`,
        `"${c.status || ''}"`,
        `"${agent?.name || ''}"`,
        clientPolicies.length,
        c.dealValue || 0
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clientes_${currentTenant.id}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>Directorio de Clientes & Núcleo DDD</span>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
              {filteredClients.length} contactos
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión integral de agregados: datos personales, N pólizas con miembros, bancos, docs y bitácora.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {can('clients', 'export') && (
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          )}

          {can('clients', 'create') && (
            <button
              onClick={onOpenImport}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Importar CSV</span>
            </button>
          )}

          {can('clients', 'create') && (
            <button
              onClick={onOpenNewClient}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre, email, teléfono o ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-purple-500 font-medium text-slate-800"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-purple-500 font-semibold text-slate-700"
            >
              <option value="all">Todas las Categorías</option>
              {catalogs.clientCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-purple-500 font-semibold text-slate-700"
            >
              <option value="all">Todos los Estados</option>
              <option value="Lead">Lead</option>
              <option value="Contactado">Contactado</option>
              <option value="Cotizado">Cotizado</option>
              <option value="Cerrado/Ganado">Cerrado / Ganado</option>
              <option value="Cliente Activo">Cliente Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Perdido">Perdido</option>
            </select>
          </div>

          {/* Agent Filter */}
          <div>
            <select
              value={selectedAgent}
              onChange={(e) => {
                setSelectedAgent(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-purple-500 font-semibold text-slate-700"
            >
              <option value="all">Todos los Agentes</option>
              {users
                .filter((u) => u.tenantId === currentTenant.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Cliente / Identificación</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Categoría & Tags</th>
                <th className="py-3 px-4">Pólizas & Cobertura</th>
                <th className="py-3 px-4">Agente Asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <User className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <div className="text-sm font-bold text-slate-700">No se encontraron clientes</div>
                    <p className="text-xs">Prueba ajustando los filtros de búsqueda o crea un nuevo cliente.</p>
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => {
                  const clientPolicies = policies.filter((p) => p.clientId === client.id);
                  const assignedAgent = users.find((u) => u.id === client.assignedAgentId);
                  const totalMonthly = clientPolicies.reduce((acc, p) => acc + (p.monthlyPremium || 0), 0);

                  return (
                    <tr key={client.id} className="hover:bg-purple-50/30 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => onOpenClient(client.id)}
                          className="font-bold text-slate-900 hover:text-purple-600 cursor-pointer flex items-center gap-2 group"
                        >
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            {client.firstName.charAt(0)}
                          </div>
                          <div>
                            <span className="group-hover:underline">
                              {client.firstName} {client.lastName}
                            </span>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {client.idNumber || 'Sin ID registrado'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{client.phone}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{client.email || 'Sin correo'}</div>
                      </td>

                      {/* Category & Tags */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 font-semibold text-[11px]">
                            {client.category}
                          </span>
                          {client.tags && client.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {client.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Policies */}
                      <td className="py-3.5 px-4">
                        {clientPolicies.length > 0 ? (
                          <div>
                            <div className="font-bold text-slate-800">
                              {clientPolicies.length} Póliza(s)
                            </div>
                            <div className="text-[11px] text-emerald-600 font-semibold font-mono">
                              ${totalMonthly}/mes ({clientPolicies.map((p) => p.carrier).join(', ')})
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sin póliza activa</span>
                        )}
                      </td>

                      {/* Agent */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700">{assignedAgent?.name || 'Sin asignar'}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{assignedAgent?.role || ''}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            client.status === 'Cliente Activo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : client.status === 'Cotizado'
                              ? 'bg-purple-100 text-purple-800'
                              : client.status === 'Lead'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Call Issabel Button */}
                          <button
                            onClick={() => startCall(client.phone, `${client.firstName} ${client.lastName}`, client.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition-colors"
                            title="Llamada Click-to-Call Issabel"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp Button */}
                          <button
                            onClick={() => {
                              startWhatsAppConversation(client.id, client.phone, `${client.firstName} ${client.lastName}`);
                              onNavigateToTab?.('whatsapp');
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors"
                            title="Chat WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Open Full Modal */}
                          <button
                            onClick={() => onOpenClient(client.id)}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-xs transition-all"
                          >
                            Ver Ficha
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <div>
            Mostrando página <strong className="text-slate-800">{currentPage}</strong> de{' '}
            <strong className="text-slate-800">{totalPages}</strong> ({filteredClients.length} clientes en total)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700 px-2">{currentPage}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
