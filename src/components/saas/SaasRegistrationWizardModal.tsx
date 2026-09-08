import React, { useState } from 'react';
import {
  X,
  Building2,
  User,
  CreditCard,
  CheckCircle2,
  Upload,
  ArrowRight,
  ArrowLeft,
  Lock,
  Globe,
  Sparkles,
  DollarSign,
  FileText,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Clock,
  Phone,
  Mail,
  Copy,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { SaasPlanFeatureLimit } from '../../types';
import { getSaasBaseDomain, slugify } from '../../utils/urlUtils';

interface SaasRegistrationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: SaasPlanFeatureLimit;
  onSuccess?: () => void;
}

export const SaasRegistrationWizardModal: React.FC<SaasRegistrationWizardModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  onSuccess
}) => {
  const {
    saasLandingConfig,
    saasSmtpConfig,
    saasNotificationTemplates,
    saasWhatsAppCentralConfig,
    saasPlans,
    registerNewTenantWithPayment
  } = useTenant();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedBankInfo, setCopiedBankInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Company
    companyName: '',
    subdomain: '',
    countryState: 'Florida, USA',
    currency: 'USD',
    phone: '',
    // Step 2: Admin
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: '',
    // Step 3: Payment
    paymentMethod: 'zelle' as 'zelle' | 'bank_transfer' | 'credit_card' | 'crypto_usdt',
    referenceNumber: '',
    notes: '',
    receiptUrl: '',
    receiptFileName: '',
    receiptFileType: 'image/jpeg',
    receiptFileSize: ''
  });

  if (!isOpen) return null;

  const baseDomain = getSaasBaseDomain(saasLandingConfig?.crmName);
  const derivedSubdomain = formData.subdomain
    ? slugify(formData.subdomain)
    : slugify(formData.companyName);

  const finalPublicUrl = `https://${derivedSubdomain || 'tu-agencia'}.${baseDomain}`;
  const planPrice = billingCycle === 'annual' && selectedPlan.annualPrice
    ? Math.round(selectedPlan.annualPrice / 12)
    : selectedPlan.price;
  const totalDue = billingCycle === 'annual' && selectedPlan.annualPrice
    ? selectedPlan.annualPrice
    : selectedPlan.price;

  const handleCompanyNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      companyName: name,
      subdomain: prev.subdomain ? prev.subdomain : slugify(name)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB)
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

      setFormData((prev) => ({
        ...prev,
        receiptUrl: result,
        receiptFileName: file.name,
        receiptFileType: file.type || 'image/jpeg',
        receiptFileSize: sizeStr
      }));
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankInfo(id);
    setTimeout(() => setCopiedBankInfo(null), 2000);
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      setErrorMsg('Por favor ingresa el nombre de tu empresa.');
      return;
    }
    setErrorMsg(null);
    setCurrentStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.adminName.trim() || !formData.adminEmail.trim() || !formData.adminPassword.trim()) {
      setErrorMsg('Por favor completa todos los campos del administrador.');
      return;
    }
    if (formData.adminPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setErrorMsg(null);
    setCurrentStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.receiptUrl) {
      setErrorMsg('Por favor adjunta la imagen o documento de tu comprobante de pago para validar la transacción.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await registerNewTenantWithPayment({
        companyName: formData.companyName,
        subdomain: derivedSubdomain,
        country: formData.countryState,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPhone: formData.adminPhone,
        password: formData.adminPassword,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        billingCycle,
        amount: totalDue,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        receiptUrl: formData.receiptUrl,
        receiptFileName: formData.receiptFileName,
        receiptFileType: formData.receiptFileType,
        receiptFileSize: formData.receiptFileSize,
        notes: formData.notes
      });

      setCurrentStep(4);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ocurrió un error al procesar el registro. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Contratación & Registro de Empresa
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-400/30">
                  Plan {selectedPlan.name}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {saasLandingConfig?.crmName || 'Plataforma SaaS'} • Sistema Seguro Multi-Empresa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Bar */}
        {currentStep !== 4 && (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0">
            <div className="flex items-center justify-between max-w-xl mx-auto">
              {/* Step 1 */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === 1
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-xs'
                      : currentStep > 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </div>
                <span className={`text-xs font-bold ${currentStep === 1 ? 'text-indigo-600' : 'text-slate-600'}`}>
                  Empresa
                </span>
              </div>

              <div className="h-0.5 w-12 sm:w-16 bg-slate-200" />

              {/* Step 2 */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === 2
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-xs'
                      : currentStep > 2
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {currentStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                </div>
                <span className={`text-xs font-bold ${currentStep === 2 ? 'text-indigo-600' : 'text-slate-600'}`}>
                  Administrador
                </span>
              </div>

              <div className="h-0.5 w-12 sm:w-16 bg-slate-200" />

              {/* Step 3 */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === 3
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-xs'
                      : currentStep > 3
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {currentStep > 3 ? <CheckCircle2 className="w-4 h-4" /> : '3'}
                </div>
                <span className={`text-xs font-bold ${currentStep === 3 ? 'text-indigo-600' : 'text-slate-600'}`}>
                  Pago & Comprobante
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body / Steps */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ================= STEP 1: COMPANY DATA ================= */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-5">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">
                    Paso 1: Configura los datos de tu nueva empresa
                  </h4>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Tu empresa tendrá una base de datos aislada, subdominio personalizado y panel de administración propio.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Comercial de la Empresa / Agencia *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    placeholder="Ej: Seguros Salud Miami LLC"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subdominio / Enlace Dedicado
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
                    <span className="px-3 text-xs font-mono text-slate-400 select-none bg-slate-100 py-2.5 border-r border-slate-200">
                      https://
                    </span>
                    <input
                      type="text"
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: slugify(e.target.value) })}
                      placeholder="mi-agencia"
                      className="flex-1 px-3 py-2.5 bg-transparent text-xs font-mono font-bold text-indigo-700 focus:outline-hidden"
                    />
                    <span className="px-3 text-xs font-mono text-slate-500 bg-slate-100 py-2.5 border-l border-slate-200">
                      .{baseDomain}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Tus agentes ingresarán a: <span className="font-mono text-indigo-600 font-semibold">{finalPublicUrl}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ubicación (País / Estado) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.countryState}
                    onChange={(e) => setFormData({ ...formData, countryState: e.target.value })}
                    placeholder="Ej: Florida, USA"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Moneda de Operación
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="USD">USD ($) - Dólares Americanos</option>
                    <option value="EUR">EUR (€) - Euros</option>
                    <option value="COP">COP ($) - Pesos Colombianos</option>
                    <option value="MXN">MXN ($) - Pesos Mexicanos</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono Principal de la Agencia
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (800) 555-0100"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all hover:gap-3"
                >
                  <span>Continuar a Administrador</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 2: ADMIN USER ================= */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Next} className="space-y-5">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <User className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">
                    Paso 2: Cuenta del Administrador Principal
                  </h4>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    A este correo enviaremos las notificaciones de revisión de pago, credenciales iniciales y avisos de vigencia.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Completo del Director / Administrador *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    placeholder="Ej: Carlos Eduardo Méndez"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico (Para Credenciales y Avisos) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@miempresa.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono WhatsApp del Administrador *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.adminPhone}
                    onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                    placeholder="+1 (786) 555-0199"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contraseña Inicial *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      placeholder="Crea una contraseña segura (mínimo 6 caracteres)"
                      className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Recibirás esta clave en el correo de habilitación de cuenta para tu resguardo.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all hover:gap-3"
                >
                  <span>Continuar a Pago</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 3: PAYMENT & RECEIPT ================= */}
          {currentStep === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-5">
              {/* Plan Summary Box */}
              <div className="bg-slate-900 text-white rounded-2xl p-4.5 shadow-md flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Plan Seleccionado</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 text-[10px] font-bold">
                      {selectedPlan.name}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-1">
                    ${totalDue} <span className="text-xs font-normal text-slate-300">USD ({billingCycle === 'annual' ? 'Anual' : 'Mensual'})</span>
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-300">
                    <span>👥 {selectedPlan.maxUsers} Agentes</span>
                    <span>•</span>
                    <span>📑 {selectedPlan.maxClients.toLocaleString()} Clientes</span>
                    <span>•</span>
                    <span>📱 {selectedPlan.maxWhatsAppLines} WhatsApp</span>
                  </div>
                </div>

                {/* Billing Cycle Switch */}
                <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      billingCycle === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                      billingCycle === 'annual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Anual</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black">
                      -20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Payment Methods & Instructions */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Selecciona el Método de Pago
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'zelle' })}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                      formData.paymentMethod === 'zelle'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    🟣 Zelle (USA)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'bank_transfer' })}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                      formData.paymentMethod === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    🏦 Transferencia ACH / Wire
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'credit_card' })}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                      formData.paymentMethod === 'credit_card'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    💳 Tarjeta / Stripe
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'crypto_usdt' })}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                      formData.paymentMethod === 'crypto_usdt'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    🪙 USDT / Cripto
                  </button>
                </div>

                {/* Bank / Zelle Deposit Details */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                    <span>Datos de Depósito Oficiales</span>
                    <span className="text-indigo-600">Monto Exacto: ${totalDue} USD</span>
                  </div>

                  {formData.paymentMethod === 'zelle' && (
                    <div className="flex items-center justify-between p-2 bg-purple-50/70 rounded-lg border border-purple-100">
                      <div>
                        <div className="font-bold text-purple-900">Zelle: billing@atomscloudcrm.com</div>
                        <div className="text-[11px] text-purple-700">Titular: Atoms Cloud Technologies LLC</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('billing@atomscloudcrm.com', 'zelle')}
                        className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        {copiedBankInfo === 'zelle' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedBankInfo === 'zelle' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  )}

                  {formData.paymentMethod === 'bank_transfer' && (
                    <div className="space-y-1.5 p-2 bg-blue-50/70 rounded-lg border border-blue-100 text-[11px] text-blue-950">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Banco:</span>
                        <span className="font-bold">Bank of America / Chase</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Cuenta Corriente:</span>
                        <span className="font-mono font-bold">8940-2819-4820</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Routing / ABA:</span>
                        <span className="font-mono font-bold">063100277</span>
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === 'crypto_usdt' && (
                    <div className="flex items-center justify-between p-2 bg-emerald-50/70 rounded-lg border border-emerald-100">
                      <div>
                        <div className="font-bold text-emerald-950">USDT (TRC-20):</div>
                        <div className="font-mono text-[10px] text-emerald-800 break-all">
                          TYa73b9xK8942NmQ18vLa9401pZxRkL8q
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('TYa73b9xK8942NmQ18vLa9401pZxRkL8q', 'crypto')}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        {copiedBankInfo === 'crypto' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedBankInfo === 'crypto' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  )}

                  {formData.paymentMethod === 'credit_card' && (
                    <div className="p-2 bg-indigo-50 rounded-lg text-[11px] text-indigo-900">
                      Realiza el pago mediante la pasarela segura e ingresa el ID de transacción generado o el comprobante PDF.
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Receipt Zone */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Adjuntar Comprobante de Pago (Imagen o PDF) *
                </label>

                {formData.receiptUrl ? (
                  <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {formData.receiptFileType.includes('image') ? (
                        <img
                          src={formData.receiptUrl}
                          alt="Comprobante"
                          className="w-14 h-14 rounded-xl object-cover border border-emerald-200 shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-emerald-800 font-bold text-xs truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{formData.receiptFileName}</span>
                        </div>
                        <div className="text-[10px] text-emerald-600 mt-0.5">
                          {formData.receiptFileSize} • Archivo listo para validación
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, receiptUrl: '', receiptFileName: '', receiptFileSize: '' })}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition-colors"
                    >
                      Cambiar Archivo
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Haz clic para seleccionar o arrastra tu comprobante aquí
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      Formatos soportados: JPG, PNG, PDF, WEBP (Hasta 10 MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Número de Referencia / Transacción (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.referenceNumber}
                      onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                      placeholder="Ej: #ZL-984021"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Notas Adicionales (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ej: Pago realizado por el director"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !formData.receiptUrl}
                  className={`px-7 py-3 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all ${
                    formData.receiptUrl && !isSubmitting
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Registrando y Enviando Comprobante...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completar Registro y Enviar Comprobante</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 4: SUCCESS CONFIRMATION ================= */}
          {currentStep === 4 && (
            <div className="py-6 text-center space-y-5 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="max-w-md mx-auto">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                  ¡Solicitud Recibida con Éxito!
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-3">
                  Tu Pago y Empresa Están en Proceso de Revisión
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Hemos registrado la empresa <strong className="text-slate-900">{formData.companyName}</strong> con el plan <strong className="text-slate-900">{selectedPlan.name}</strong>. Nuestro equipo de finanzas está verificando tu comprobante de pago.
                </p>
              </div>

              {/* Detail summary pill */}
              <div className="max-w-lg mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4.5 text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 font-bold">
                  <span className="text-slate-500">Estado de la Cuenta:</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Pago en Revisión</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Correo Notificado:</span>
                  <span className="font-semibold text-slate-900">{formData.adminEmail}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Subdominio Reservado:</span>
                  <span className="font-mono font-bold text-indigo-600">{finalPublicUrl}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Monto Comprobado:</span>
                  <span className="font-bold text-emerald-700">${totalDue} USD ({billingCycle === 'annual' ? 'Anual' : 'Mensual'})</span>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 text-[11px] flex items-start gap-2">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    Hemos enviado a <strong>{formData.adminEmail}</strong> la confirmación de pago en revisión. En cuanto sea verificado, recibirás por este medio la habilitación inmediata con tus credenciales.
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
                >
                  Entendido, Cerrar Ventana
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
