import React, { useState, useEffect } from 'react';
import {
  Search,
  User,
  Shield,
  CreditCard,
  Phone,
  ArrowRight,
  X,
  FileText
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (clientId: string) => void;
  onNavigateTab?: (tab: any) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectClient,
  onNavigateTab,
  onNavigateToTab
}) => {
  const { clients, policies, bankAccounts } = useTenant();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = (query || '').toLowerCase().trim();

  const matchedClients = clients.filter(
    (c) =>
      (c.firstName || '').toLowerCase().includes(q) ||
      (c.lastName || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(query || '') ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.idNumber && c.idNumber.toLowerCase().includes(q))
  );

  const matchedPolicies = policies.filter(
    (p) =>
      (p.policyNumber || '').toLowerCase().includes(q) ||
      (p.carrier || '').toLowerCase().includes(q) ||
      (p.clientName || '').toLowerCase().includes(q)
  );

  const matchedAccounts = bankAccounts.filter(
    (b) =>
      (b.accountHolder || '').toLowerCase().includes(q) ||
      (b.bankName || '').toLowerCase().includes(q) ||
      (b.accountNumber || '').includes(query || '')
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 pt-20">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-purple-600 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente, teléfono, póliza, SSN/ID o cuenta bancaria..."
            className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-hidden placeholder-slate-400"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {query.trim() === '' ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Escribe cualquier término para buscar en toda la plataforma.
            </div>
          ) : (
            <>
              {/* Clients Section */}
              {matchedClients.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">
                    Clientes Encontrados ({matchedClients.length})
                  </div>
                  <div className="space-y-1">
                    {matchedClients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => {
                          onSelectClient(client.id);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-purple-50 flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                            {client.firstName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 group-hover:text-purple-700">
                              {client.firstName} {client.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {client.phone} • {client.category}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policies Section */}
              {matchedPolicies.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">
                    Pólizas ({matchedPolicies.length})
                  </div>
                  <div className="space-y-1">
                    {matchedPolicies.map((pol) => (
                      <div
                        key={pol.id}
                        onClick={() => {
                          onSelectClient(pol.clientId);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-purple-50 flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                            <Shield className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900">
                              Póliza #{pol.policyNumber} ({pol.carrier})
                            </div>
                            <div className="text-[11px] text-slate-400">Titular: {pol.clientName || 'Cliente'}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bank Accounts Section */}
              {matchedAccounts.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">
                    Cuentas Bancarias ({matchedAccounts.length})
                  </div>
                  <div className="space-y-1">
                    {matchedAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        onClick={() => {
                          (onNavigateTab || onNavigateToTab)?.('banking');
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-purple-50 flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900">
                              {acc.bankName} - {acc.accountHolder}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              ••••••••{acc.accountNumber.slice(-4)} | Routing: {acc.routingNumber}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchedClients.length === 0 && matchedPolicies.length === 0 && matchedAccounts.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No se encontraron resultados para "{query}".
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
