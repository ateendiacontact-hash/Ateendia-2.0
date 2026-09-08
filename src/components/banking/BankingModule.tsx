import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Building,
  User,
  DollarSign,
  Star,
  ShieldAlert,
  Calendar,
  Layers,
  Filter,
  X,
  AlertCircle
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { BankAccount } from '../../types';

interface BankingModuleProps {
  onOpenClient: (clientId: string) => void;
}

export const BankingModule: React.FC<BankingModuleProps> = ({ onOpenClient }) => {
  const {
    bankAccounts,
    deleteBankAccount,
    addBankAccount,
    setDefaultPaymentMethod,
    clients,
    can,
    currentUser,
    currentTenant
  } = useTenant();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'bank_account' | 'credit_card'>('all');
  const [unmaskedAccounts, setUnmaskedAccounts] = useState<Record<string, boolean>>({});
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);

  // New Payment Method Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [methodType, setMethodType] = useState<'bank_account' | 'credit_card'>('credit_card');
  
  // Bank fields
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
  const [isDefault, setIsDefault] = useState(true);

  // Admin or explicitly authorized users can unmask full sensitive numbers
  const canRevealSensitive = currentUser?.role === 'admin' || can('banking', 'viewSensitive');

  const toggleUnmask = (id: string) => {
    if (!canRevealSensitive) {
      setPermissionWarning(
        'Acceso Restringido: Tu rol de usuario no tiene permisos para revelar números completos de tarjetas o cuentas bancarias. Solo administradores o roles con permiso "Ver Datos Sensibles" pueden visualizarlos.'
      );
      return;
    }
    setUnmaskedAccounts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreatePaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Cliente';

    if (methodType === 'credit_card') {
      if (!cardNumber.trim()) return;
      const cleanNumber = cardNumber.replace(/\s+/g, '');
      addBankAccount({
        clientId: selectedClientId,
        clientName,
        type: 'credit_card',
        accountHolder: cardHolder || clientName,
        bankName: `${cardBrand} Card`,
        routingNumber: 'N/A',
        accountNumber: cleanNumber,
        accountType: 'Tarjeta Débito/Crédito',
        paymentMethod: cardType === 'Crédito' ? 'Tarjeta de Crédito' : 'Tarjeta de Débito',
        cardBrand,
        cardHolder: cardHolder || clientName,
        cardNumber: cleanNumber,
        cardExpDate,
        cardCvv,
        cardType,
        isDefault,
        verified: true
      });
    } else {
      if (!accountNumber || !routingNumber) return;
      addBankAccount({
        clientId: selectedClientId,
        clientName,
        type: 'bank_account',
        accountHolder: bankHolder || clientName,
        bankName,
        routingNumber,
        accountNumber,
        accountType,
        paymentMethod,
        isDefault,
        verified: true
      });
    }

    setShowAddModal(false);
    // Reset fields
    setCardNumber('');
    setCardHolder('');
    setCardExpDate('');
    setCardCvv('');
    setAccountNumber('');
    setRoutingNumber('');
    setBankHolder('');
  };

  const filteredAccounts = bankAccounts.filter((acc) => {
    // Filter by type
    if (filterType === 'bank_account' && (acc.type === 'credit_card' || acc.accountType === 'Tarjeta Débito/Crédito')) {
      return false;
    }
    if (filterType === 'credit_card' && acc.type !== 'credit_card' && acc.accountType !== 'Tarjeta Débito/Crédito') {
      return false;
    }

    // Filter by text search
    const term = (searchTerm || '').toLowerCase();
    if (!term) return true;
    return (
      (acc.accountHolder || '').toLowerCase().includes(term) ||
      (acc.bankName || '').toLowerCase().includes(term) ||
      (acc.clientName || '').toLowerCase().includes(term) ||
      (acc.cardBrand || '').toLowerCase().includes(term) ||
      (acc.accountNumber || '').includes(searchTerm)
    );
  });

  return (
    <div className="space-y-5 animate-in fade-in max-w-7xl mx-auto">
      {/* Permission Warning Toast / Modal */}
      {permissionWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-3 text-amber-900 shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">Seguridad & Privacidad Financiera</h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">{permissionWarning}</p>
            </div>
          </div>
          <button
            onClick={() => setPermissionWarning(null)}
            className="p-1.5 text-amber-600 hover:text-amber-900 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>Gestión Central de Métodos de Pago</span>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
              {bankAccounts.length} registrados
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Cuentas bancarias ACH, tarjetas de crédito/débito, indicación de método actual y enmascaramiento con permisos RBAC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">
              {canRevealSensitive ? 'Modo Administrador (Acceso Total)' : 'Modo Protegido (Últimos 4 Dígitos)'}
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Método de Pago</span>
          </button>
        </div>
      </div>

      {/* Controls Bar (Search + Filter Tabs) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, titular, banco o tarjeta..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-purple-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'all' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({bankAccounts.length})
          </button>
          <button
            onClick={() => setFilterType('bank_account')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'bank_account' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏦 Cuentas ACH
          </button>
          <button
            onClick={() => setFilterType('credit_card')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'credit_card' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💳 Tarjetas
          </button>
        </div>
      </div>

      {/* Accounts & Cards Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Estado / Actual</th>
                <th className="py-3 px-4">Cliente & Titular</th>
                <th className="py-3 px-4">Entidad / Red</th>
                <th className="py-3 px-4">Routing / Detalles</th>
                <th className="py-3 px-4">Número (Enmascarado)</th>
                <th className="py-3 px-4">Tipo & Vencimiento</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No se encontraron métodos de pago con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const isCard = acc.type === 'credit_card' || acc.accountType === 'Tarjeta Débito/Crédito';
                  const isUnmasked = Boolean(unmaskedAccounts[acc.id]);
                  const last4 = acc.accountNumber ? acc.accountNumber.slice(-4) : '****';

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Default / Actual Indicator */}
                      <td className="py-3.5 px-4">
                        {acc.isDefault ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black">
                            <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                            <span>Actual / Predeterminado</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDefaultPaymentMethod(acc.clientId, acc.id)}
                            className="text-[10px] font-bold text-slate-500 hover:text-purple-700 hover:underline cursor-pointer"
                            title="Marcar este método como principal"
                          >
                            Hacer Actual
                          </button>
                        )}
                      </td>

                      {/* Client / Holder */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => onOpenClient(acc.clientId)}
                          className="font-bold text-slate-900 hover:text-purple-600 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{acc.accountHolder}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Cliente: <strong className="text-slate-600">{acc.clientName || 'Ver Ficha'}</strong>
                        </div>
                      </td>

                      {/* Bank or Card Brand */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isCard ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {isCard ? <CreditCard className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{acc.bankName}</div>
                            {acc.cardBrand && (
                              <div className="text-[10px] font-semibold text-purple-600">{acc.cardBrand}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Routing or Info */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {isCard ? (
                          <span className="text-[11px] text-slate-400">CVV: {isUnmasked ? acc.cardCvv || '***' : '•••'}</span>
                        ) : (
                          <span>Routing: {acc.routingNumber}</span>
                        )}
                      </td>

                      {/* Masked Number */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          {isUnmasked ? (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-800 font-bold rounded border border-purple-200">
                              {acc.accountNumber}
                            </span>
                          ) : (
                            <span className="text-slate-700 font-bold">
                              {isCard ? `•••• •••• •••• ${last4}` : `••••••••${last4}`}
                            </span>
                          )}
                          <button
                            onClick={() => toggleUnmask(acc.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                            title={isUnmasked ? 'Ocultar datos' : 'Ver número completo (Requiere permiso)'}
                          >
                            {isUnmasked ? <EyeOff className="w-3.5 h-3.5 text-purple-700" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Type & Exp */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700 text-xs">
                          {acc.paymentMethod}
                        </div>
                        {acc.cardExpDate ? (
                          <div className="text-[10px] text-slate-400 font-mono">Vence: {acc.cardExpDate}</div>
                        ) : (
                          <div className="text-[10px] text-slate-400">{acc.accountType}</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenClient(acc.clientId)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-bold text-[11px]"
                          >
                            Ficha
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar este método de pago para ${acc.accountHolder}?`)) {
                                deleteBankAccount(acc.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Eliminar Método"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Registrar Método de Pago</h3>
                  <p className="text-xs text-slate-500">Agrega tarjeta de crédito/débito o cuenta bancaria ACH</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePaymentMethod} className="space-y-4">
              {/* Select Client */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Cliente Asociado</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800"
                  required
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Bank vs Card */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMethodType('credit_card')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    methodType === 'credit_card' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Tarjeta de Crédito / Débito</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethodType('bank_account')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    methodType === 'bank_account' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Cuenta Bancaria (ACH)</span>
                </button>
              </div>

              {methodType === 'credit_card' ? (
                /* Card Form */
                <div className="space-y-3 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">Red de Tarjeta</label>
                      <select
                        value={cardBrand}
                        onChange={(e) => setCardBrand(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-semibold"
                      >
                        <option value="Visa">Visa</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="Amex">American Express</option>
                        <option value="Discover">Discover</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">Tipo</label>
                      <select
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-semibold"
                      >
                        <option value="Crédito">Crédito</option>
                        <option value="Débito">Débito</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">Nombre en la Tarjeta</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Ej: CARLOS E HERNANDEZ"
                      className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">Número de Tarjeta (16 Dígitos)</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 8912 0938 4821"
                      maxLength={19}
                      className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">Expiración (MM/AA)</label>
                      <input
                        type="text"
                        value={cardExpDate}
                        onChange={(e) => setCardExpDate(e.target.value)}
                        placeholder="08/28"
                        maxLength={5}
                        className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono text-center"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">Código de Seguridad (CVV)</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        maxLength={4}
                        className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono text-center"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Bank ACH Form */
                <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">Titular de la Cuenta</label>
                    <input
                      type="text"
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                      placeholder="Ej: Carlos E Hernández"
                      className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">Entidad Bancaria</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="JPMorgan Chase Bank, Bank of America..."
                      className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">Routing Number (9 Dígitos)</label>
                      <input
                        type="text"
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        placeholder="063100277"
                        className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">Número de Cuenta</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="482910394821"
                        className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">Tipo de Cuenta</label>
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-semibold"
                      >
                        <option value="Checking / Corriente">Checking / Corriente</option>
                        <option value="Savings / Ahorros">Savings / Ahorros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">Método</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-semibold"
                      >
                        <option value="ACH Débito Automático">ACH Débito Automático</option>
                        <option value="Transferencia">Transferencia</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Set as default checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isDefaultCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Establecer como método de pago actual y predeterminado
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Guardar Método
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
