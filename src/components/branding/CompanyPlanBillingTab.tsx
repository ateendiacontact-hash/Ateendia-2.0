import React, { useState } from 'react';
import {
  CreditCard,
  Layers,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  DollarSign,
  Users,
  FileSpreadsheet,
  Smartphone,
  HardDrive,
  Upload,
  Download,
  Eye,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { SaasPlanFeatureLimit, SaasPaymentReceipt } from '../../types';

export const CompanyPlanBillingTab: React.FC = () => {
  const {
    currentTenant,
    saasPlans,
    users,
    clients,
    policies,
    updateTenantSubscriptionPlan,
    submitRenewalPaymentReceipt,
    currentUser
  } = useTenant();

  const currentPlanName = currentTenant.subscription?.plan || 'Pro Business';
  const matchingPlan = saasPlans.find((p) => p.name.toLowerCase() === currentPlanName.toLowerCase()) || saasPlans[1];

  const subscriptionStatus = currentTenant.subscription?.status || 'active';
  const renewalDate = currentTenant.subscription?.renewalDate || '2026-09-25';
  const monthlyPrice = currentTenant.subscription?.monthlyPrice || matchingPlan.price;

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<SaasPlanFeatureLimit | null>(null);

  // Renewal Form
  const [paymentMethod, setPaymentMethod] = useState<'zelle' | 'bank_transfer' | 'credit_card' | 'crypto_usdt'>('zelle');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [renewalReceiptUrl, setRenewalReceiptUrl] = useState('');
  const [renewalReceiptFileName, setRenewalReceiptFileName] = useState('');
  const [renewalReceiptFileSize, setRenewalReceiptFileSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [renewalSuccess, setRenewalSuccess] = useState(false);

  // Calculate consumption
  const currentUsersCount = users.length;
  const maxUsers = matchingPlan.maxUsers;
  const userUsagePercent = Math.min(Math.round((currentUsersCount / maxUsers) * 100), 100);

  const currentClientsCount = clients.length;
  const maxClients = matchingPlan.maxClients;
  const clientUsagePercent = Math.min(Math.round((currentClientsCount / maxClients) * 100), 100);

  const currentPoliciesCount = policies.length;
  const maxPolicies = matchingPlan.maxPolicies;
  const policyUsagePercent = Math.min(Math.round((currentPoliciesCount / maxPolicies) * 100), 100);

  const currentWALines = 1;
  const maxWALines = matchingPlan.maxWhatsAppLines;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      setRenewalReceiptUrl(result);
      setRenewalReceiptFileName(file.name);
      setRenewalReceiptFileSize(sizeStr);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpgrade = (newPlan: SaasPlanFeatureLimit) => {
    updateTenantSubscriptionPlan(currentTenant.id, newPlan);
    setIsUpgradeModalOpen(false);
  };

  const handleSubmitRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalReceiptUrl) return;

    setIsSubmitting(true);
    try {
      await submitRenewalPaymentReceipt({
        tenantId: currentTenant.id,
        tenantName: currentTenant.name,
        adminEmail: currentUser.email,
        adminName: currentUser.name,
        adminPhone: currentUser.phone,
        planId: matchingPlan.id,
        planName: matchingPlan.name,
        amount: monthlyPrice,
        currency: 'USD',
        billingCycle: 'monthly',
        paymentMethod,
        referenceNumber: referenceNumber || `REN-${Math.floor(100000 + Math.random() * 900000)}`,
        receiptUrl: renewalReceiptUrl,
        receiptFileName: renewalReceiptFileName,
        receiptFileType: 'image/jpeg',
        receiptFileSize: renewalReceiptFileSize
      });

      setRenewalSuccess(true);
      setTimeout(() => {
        setIsRenewalModalOpen(false);
        setRenewalSuccess(false);
        setRenewalReceiptUrl('');
        setReferenceNumber('');
      }, 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Current Plan Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              Plan Contratado
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                subscriptionStatus === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : subscriptionStatus === 'pending_payment'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {subscriptionStatus === 'active' ? '✓ Suscripción Activa' : subscriptionStatus === 'pending_payment' ? '⏳ Pago en Revisión' : '⚠️ Suspendido / Vencido'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            {matchingPlan.name}
          </h2>

          <div className="flex items-center gap-4 mt-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400 text-base">
              ${monthlyPrice} USD / mes
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Próximo Vencimiento: <strong className="text-white">{renewalDate}</strong>
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            Plazo de gracia del sistema: Hasta <strong>5 días continuos</strong> posteriores a la fecha de vencimiento antes de suspensión automática.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-2 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Cambiar de Plan</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRenewalModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-transform hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Renovar Suscripción</span>
          </button>
        </div>
      </div>

      {/* Quota Limits & Consumption Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" /> Agentes / Usuarios
            </span>
            <span className="font-bold text-slate-900">
              {currentUsersCount} / {maxUsers}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                userUsagePercent > 85 ? 'bg-rose-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${userUsagePercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 text-right">
            {maxUsers - currentUsersCount} licencias disponibles
          </div>
        </div>

        {/* Clients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Clientes y Leads
            </span>
            <span className="font-bold text-slate-900">
              {currentClientsCount} / {maxClients.toLocaleString()}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                clientUsagePercent > 85 ? 'bg-rose-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${clientUsagePercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 text-right">
            Capacidad: {clientUsagePercent}% utilizada
          </div>
        </div>

        {/* Policies */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> Pólizas Activas
            </span>
            <span className="font-bold text-slate-900">
              {currentPoliciesCount} / {maxPolicies.toLocaleString()}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all"
              style={{ width: `${policyUsagePercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 text-right">
            {maxPolicies - currentPoliciesCount} cupos de pólizas restantes
          </div>
        </div>

        {/* WhatsApp Lines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-600" /> Líneas WhatsApp
            </span>
            <span className="font-bold text-slate-900">
              {currentWALines} / {maxWALines}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${(currentWALines / maxWALines) * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 text-right">
            Canales QR vinculados al CRM
          </div>
        </div>
      </div>

      {/* Upgrade / Change Plan Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200 my-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Cambiar / Actualizar Plan de la Empresa</h3>
                <p className="text-xs text-slate-400">Selecciona el plan deseado para ajustar tus límites y módulos</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {saasPlans.map((plan) => {
                const isCurrent = plan.name.toLowerCase() === currentPlanName.toLowerCase();
                return (
                  <div
                    key={plan.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-bold text-slate-900">{plan.name}</h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">
                            Actual
                          </span>
                        )}
                      </div>

                      <div className="text-2xl font-black text-slate-900 mb-3">
                        ${plan.price} <span className="text-xs font-normal text-slate-500">USD/mes</span>
                      </div>

                      <ul className="space-y-1.5 text-xs text-slate-600 mb-4">
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Hasta {plan.maxUsers} Agentes</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{plan.maxClients.toLocaleString()} Clientes</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{plan.maxWhatsAppLines} Líneas WhatsApp</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => handleConfirmUpgrade(plan)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        isCurrent
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      {isCurrent ? 'Plan Actual' : 'Seleccionar este Plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Renewal Modal */}
      {isRenewalModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 my-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Renovación de Suscripción</h3>
                <p className="text-xs text-slate-400">Adjunta tu comprobante para extender la vigencia de tu plan</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRenewalModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {renewalSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">¡Comprobante Enviado a Finanzas!</h4>
                <p className="text-xs text-slate-600">
                  En breve recibirás la confirmación de extensión de vigencia en tu correo electrónico.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRenewal} className="p-6 space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan a Renovar:</span>
                    <span className="font-bold text-slate-900">{matchingPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monto Mensual:</span>
                    <span className="font-bold text-emerald-700">${monthlyPrice} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Zelle Oficial:</span>
                    <span className="font-mono font-bold text-purple-700">billing@atomscloudcrm.com</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Método de Pago Utilizado
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="zelle">Zelle (USA)</option>
                    <option value="bank_transfer">Transferencia Bancaria ACH / Wire</option>
                    <option value="credit_card">Tarjeta / Stripe</option>
                    <option value="crypto_usdt">USDT Cripto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    N° de Referencia / Voucher
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Ej: #ZL-984019"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Adjuntar Comprobante (Imagen o PDF) *
                  </label>
                  {renewalReceiptUrl ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                      <span className="font-bold truncate">{renewalReceiptFileName}</span>
                      <button
                        type="button"
                        onClick={() => setRenewalReceiptUrl('')}
                        className="text-rose-600 font-bold ml-2 shrink-0"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer text-center bg-slate-50">
                      <Upload className="w-6 h-6 text-indigo-600 mb-1" />
                      <span className="text-xs font-bold text-slate-800">Seleccionar Comprobante</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRenewalModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !renewalReceiptUrl}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Comprobante'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
