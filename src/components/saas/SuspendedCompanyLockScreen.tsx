import React, { useState } from 'react';
import {
  Lock,
  AlertTriangle,
  CreditCard,
  Upload,
  CheckCircle2,
  Calendar,
  DollarSign,
  Building2,
  Phone,
  Mail,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
  Copy,
  Check
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { getSaasBaseDomain } from '../../utils/urlUtils';

export const SuspendedCompanyLockScreen: React.FC = () => {
  const {
    currentTenant,
    saasLandingConfig,
    saasPlans,
    submitRenewalPaymentReceipt,
    currentUser,
    setCurrentTenantId,
    tenants
  } = useTenant();

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [copiedBankInfo, setCopiedBankInfo] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'zelle' | 'bank_transfer' | 'credit_card' | 'crypto_usdt'>('zelle');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptFileType, setReceiptFileType] = useState('image/jpeg');
  const [receiptFileSize, setReceiptFileSize] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const planName = currentTenant.subscription?.plan || 'Pro Business';
  const matchingPlan = saasPlans.find((p) => p.name.toLowerCase() === planName.toLowerCase()) || saasPlans[1];
  const renewalAmount = currentTenant.subscription?.monthlyPrice || matchingPlan.price;
  const renewalDate = currentTenant.subscription?.renewalDate || '2026-08-25';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('El archivo no debe superar los 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      setReceiptUrl(result);
      setReceiptFileName(file.name);
      setReceiptFileType(file.type || 'image/jpeg');
      setReceiptFileSize(sizeStr);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankInfo(id);
    setTimeout(() => setCopiedBankInfo(null), 2000);
  };

  const handleSubmitRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptUrl) {
      setErrorMsg('Por favor adjunta el comprobante de pago de tu renovación.');
      return;
    }

    setIsUploading(true);
    try {
      await submitRenewalPaymentReceipt({
        tenantId: currentTenant.id,
        tenantName: currentTenant.name,
        adminEmail: currentUser.email,
        adminName: currentUser.name,
        adminPhone: currentUser.phone,
        planId: matchingPlan.id,
        planName: matchingPlan.name,
        amount: renewalAmount,
        currency: 'USD',
        billingCycle: 'monthly',
        paymentMethod,
        referenceNumber: referenceNumber || `REN-${Math.floor(100000 + Math.random() * 900000)}`,
        receiptUrl,
        receiptFileName,
        receiptFileType,
        receiptFileSize,
        notes
      });

      setIsSubmittedSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al enviar el comprobante.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white">
      <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Top Warning Banner */}
        <div className="bg-rose-600 px-6 py-4 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-white shrink-0 animate-pulse" />
          <div>
            <h2 className="text-sm sm:text-base font-black text-white">
              Acceso Suspendido por Vencimiento de Suscripción
            </h2>
            <p className="text-xs text-rose-100 mt-0.5">
              Empresa: <strong className="text-white">{currentTenant.name}</strong> • Plazo de 5 días de gracia expirado
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {!isSubmittedSuccess ? (
            <>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">
                  Renueva tu Plan para Reactivar el Acceso Inmediato
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  La suscripción al plan <strong>{planName}</strong> venció el <strong>{renewalDate}</strong> y ha concluido el período de gracia de 5 días. Tus datos, pólizas y clientes están resguardados de forma segura con cifrado AES-256. Adjunta tu comprobante de pago para que finanzas verifique la transacción y reactive el acceso a todos tus agentes.
                </p>
              </div>

              {/* Amount Box */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Monto de Renovación Mensual:</span>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">
                    ${renewalAmount} <span className="text-xs font-normal text-slate-400">USD</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400">Plan:</span>
                  <div className="font-bold text-indigo-400">{planName}</div>
                </div>
              </div>

              {/* Payment details */}
              <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cuentas para Realizar tu Pago:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-800/40">
                    <div className="flex items-center justify-between font-bold text-purple-300">
                      <span>🟣 Zelle</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('billing@atomscloudcrm.com', 'zelle')}
                        className="text-[10px] text-purple-400 hover:text-white"
                      >
                        {copiedBankInfo === 'zelle' ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <div className="font-mono text-white text-xs mt-1">billing@atomscloudcrm.com</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Atoms Cloud Technologies LLC</div>
                  </div>

                  <div className="p-3 bg-blue-950/30 rounded-xl border border-blue-800/40">
                    <div className="font-bold text-blue-300">🏦 Bank of America (ACH)</div>
                    <div className="font-mono text-white text-xs mt-1">Cta: 8940-2819-4820</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Routing: 063100277</div>
                  </div>
                </div>
              </div>

              {/* Form to submit renewal receipt */}
              <form onSubmit={handleSubmitRenewal} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Adjuntar Comprobante de Pago *
                  </label>

                  {receiptUrl ? (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{receiptFileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReceiptUrl('')}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold ml-2 shrink-0"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer text-center">
                      <Upload className="w-6 h-6 text-indigo-400 mb-2" />
                      <span className="text-xs font-bold text-slate-200">
                        Seleccionar o arrastrar comprobante
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG o PDF</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Método Utilizado
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      <option value="zelle">Zelle (USA)</option>
                      <option value="bank_transfer">Transferencia Bancaria ACH</option>
                      <option value="credit_card">Tarjeta de Crédito / Stripe</option>
                      <option value="crypto_usdt">USDT Cripto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      N° de Referencia / Voucher
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Ej: #ZL-492019"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUploading || !receiptUrl}
                  className={`w-full py-3 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
                    receiptUrl && !isUploading
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enviando Comprobante...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Enviar Comprobante de Renovación para Reactivación</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Comprobante de Renovación Recibido
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Hemos enviado una notificación al departamento financiero y a los 2 administradores del SaaS. En cuanto sea confirmado el depósito bancario, tu cuenta será reactivada automáticamente con su nueva fecha de vencimiento.
              </p>
            </div>
          )}

          {/* Bottom Switch Tenant (if Admin / SuperAdmin) */}
          {(currentUser.role === 'admin' || currentUser.isSuperAdmin) && (
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Modo SuperAdmin:</span>
              <select
                value={currentTenant.id}
                onChange={(e) => setCurrentTenantId(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subscription?.status || 'active'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
