import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  DollarSign,
  Globe,
} from 'lucide-react';
import { registrationService } from '../../services/registrationService';
import type {
  BillingCycle,
  RegisterRequestPayload,
  SaasPlanPublic,
  PublicPaymentMethod,
  SaasPlansPublicResponse,
  PublicPaymentMethodsResponse,
} from '../../types';

// ─────────────────────────────────────────────────────────────────────
// Tipos locales
// ─────────────────────────────────────────────────────────────────────

interface RegisterFormProps {
  /** Callback cuando el registro fue exitoso. Recibe requestId + type. */
  onSuccess: (requestId: string, type: 'demo' | 'payment') => void;
  /** Callback para volver al login. */
  onBackToLogin: () => void;
}

interface FormState {
  // Tipo de registro
  type: 'demo' | 'payment';

  // Empresa
  companyName: string;
  companyTaxId: string;
  companyEmail: string;
  companyPhone: string;
  companyCountry: string;
  companyCity: string;

  // Admin
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminPosition: string;
  adminPassword: string;
  adminPasswordConfirm: string;

  // Plan (solo se usa en type === 'payment'; en demo se autocompleta)
  planId: string;
  billingCycle: BillingCycle;

  // Pago (solo payment)
  paymentMethodId: string;

  // Marketing (opcional)
  referralSource: string;
}

const INITIAL_FORM_STATE: FormState = {
  type: 'demo',
  companyName: '',
  companyTaxId: '',
  companyEmail: '',
  companyPhone: '',
  companyCountry: '',
  companyCity: '',
  adminName: '',
  adminEmail: '',
  adminPhone: '',
  adminPosition: '',
  adminPassword: '',
  adminPasswordConfirm: '',
  planId: '',
  billingCycle: 'monthly',
  paymentMethodId: '',
  referralSource: '',
};

// ─────────────────────────────────────────────────────────────────────
// Validación client-side
// ─────────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.companyName.trim()) errors.companyName = 'El nombre de la empresa es obligatorio';
  if (!form.companyEmail.trim()) {
    errors.companyEmail = 'El email de la empresa es obligatorio';
  } else if (!EMAIL_REGEX.test(form.companyEmail)) {
    errors.companyEmail = 'Email de empresa inválido';
  }
  if (!form.companyPhone.trim()) errors.companyPhone = 'El teléfono es obligatorio';

  if (!form.adminName.trim()) errors.adminName = 'El nombre del admin es obligatorio';
  if (!form.adminEmail.trim()) {
    errors.adminEmail = 'El email del admin es obligatorio';
  } else if (!EMAIL_REGEX.test(form.adminEmail)) {
    errors.adminEmail = 'Email de admin inválido';
  }
  if (!form.adminPassword) {
    errors.adminPassword = 'La contraseña es obligatoria';
  } else if (form.adminPassword.length < 8) {
    errors.adminPassword = 'La contraseña debe tener al menos 8 caracteres';
  }
  if (form.adminPassword !== form.adminPasswordConfirm) {
    errors.adminPasswordConfirm = 'Las contraseñas no coinciden';
  }

  if (form.type === 'payment') {
    if (!form.planId) errors.planId = 'Seleccioná un plan';
    if (!form.paymentMethodId) errors.paymentMethodId = 'Seleccioná un método de pago';
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onBackToLogin }) => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Catálogos cargados desde el backend
  const [plans, setPlans] = useState<SaasPlanPublic[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PublicPaymentMethod[]>([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [catalogsError, setCatalogsError] = useState<string | null>(null);

  // ───────────────────────────────────────────────────────────────────
  // Carga de catálogos al montar (SIEMPRE, porque demo necesita el plan demo)
  // ───────────────────────────────────────────────────────────────────
    useEffect(() => {
    let cancelled = false;
    setCatalogsLoading(true);
    setCatalogsError(null);

    Promise.all([
      fetch('/api/saas/plans/public').then((r) => r.json() as Promise<SaasPlansPublicResponse>),
      fetch('/api/saas/payment-methods/public').then((r) => r.json() as Promise<PublicPaymentMethodsResponse>),
    ])
      .then(([plansRes, methodsRes]) => {
        if (cancelled) return;
        if (plansRes?.success && Array.isArray(plansRes.plans)) {
          setPlans(plansRes.plans);
        }
        if (methodsRes?.success && Array.isArray(methodsRes.data)) {
          setPaymentMethods(methodsRes.data);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCatalogsError('No se pudieron cargar los planes y métodos de pago. Reintentá.');
      })
      .finally(() => {
        if (cancelled) return;
        setCatalogsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────────────
  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleTypeChange = useCallback((newType: 'demo' | 'payment') => {
    setForm((prev) => ({
      ...prev,
      type: newType,
      planId: newType === 'demo' ? '' : prev.planId,
      paymentMethodId: newType === 'demo' ? '' : prev.paymentMethodId,
    }));
    setErrors({});
    setServerError(null);
  }, []);

  // ───────────────────────────────────────────────────────────────────
  // Submit — construye el payload EXACTO que el backend espera
  // ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // ── Determinar el plan a enviar ──
    // - demo: usamos el plan con key === 'demo' (cargado de la API)
    // - payment: usamos el plan elegido por el usuario
    let plan: SaasPlanPublic | undefined;

    if (form.type === 'demo') {
      plan = plans.find((p) => p.key === 'demo');
    } else {
      plan = plans.find((p) => p.id === form.planId);
    }

    if (!plan) {
      setServerError('No pudimos resolver el plan seleccionado. Recargá la página.');
      return;
    }

    // ── Determinar precio según ciclo ──
    const priceAmount =
      form.billingCycle === 'yearly' ? plan.priceAnnual : plan.priceMonthly;

    // ── Determinar método de pago (solo payment) ──
    const paymentMethod =
      form.type === 'payment'
        ? paymentMethods.find((m) => m.id === form.paymentMethodId)
        : undefined;

    if (form.type === 'payment' && !paymentMethod) {
      setServerError('No pudimos resolver el método de pago seleccionado. Recargá la página.');
      return;
    }

    // ── Construir payload ──
    const payload: RegisterRequestPayload = {
      type: form.type,

      // Empresa
      companyName: form.companyName.trim(),
      ...(form.companyTaxId.trim() && { companyTaxId: form.companyTaxId.trim() }),
      companyEmail: form.companyEmail.trim(),
      companyPhone: form.companyPhone.trim(),
      ...(form.companyCountry.trim() && { companyCountry: form.companyCountry.trim() }),
      ...(form.companyCity.trim() && { companyCity: form.companyCity.trim() }),

      // Admin
      adminName: form.adminName.trim(),
      adminEmail: form.adminEmail.trim(),
      ...(form.adminPhone.trim() && { adminPhone: form.adminPhone.trim() }),
      ...(form.adminPosition.trim() && { adminPosition: form.adminPosition.trim() }),
      adminPassword: form.adminPassword,

      // Plan (siempre obligatorio)
      planId: plan.id,
      planKey: plan.key,
      planName: plan.name,
      billingCycle: form.billingCycle,
      priceAmount,
      currency: plan.currency,

      // Pago (solo payment)
      ...(paymentMethod && {
        paymentMethodId: paymentMethod.id,
        paymentMethodKey: paymentMethod.key,
        paymentMethodName: paymentMethod.name,
      }),

      // Marketing (opcional)
      ...(form.referralSource.trim() && { referralSource: form.referralSource.trim() }),
    };

    setSubmitting(true);
    const result = await registrationService.register(payload);
    setSubmitting(false);

        if (result.success) {
      onSuccess(result.data.requestId, form.type);
      return;
    }

        // Aquí TypeScript ya sabe que result.success === false.
    // Usamos una variable explícita para forzar el narrow.
    const errorResult = result as Extract<typeof result, { success: false }>;
    const errorCode = errorResult.code;
    const messages: Record<typeof errorCode, string> = {
      VALIDATION_ERROR: 'Revisá los datos ingresados. Algunos campos no son válidos.',
      DOMAIN_VALIDATION_ERROR: 'Los datos ingresados no cumplen con las reglas del sistema.',
      RATE_LIMIT_EXCEEDED: 'Demasiados intentos. Esperá 15 minutos antes de reintentar.',
      NETWORK_ERROR: 'No se pudo conectar con el servidor. Verificá tu conexión.',
      UNKNOWN_ERROR: 'Ocurrió un error inesperado. Reintentá en unos minutos.',
    };
    setServerError(messages[errorCode] ?? 'Ocurrió un error inesperado.');
  };

  // ───────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────
  const isPayment = form.type === 'payment';
  const selectedPlan = plans.find((p) => p.id === form.planId);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              Crear tu cuenta
            </h1>
            <p className="text-purple-100 mt-2">
              Empezá gratis con una demo de 14 días, o elegí un plan pago.
            </p>
          </div>

          {/* Toggle tipo */}
          <div className="px-8 pt-6">
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => handleTypeChange('demo')}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  !isPayment
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'text-purple-200 hover:bg-white/5'
                }`}
              >
                🎁 Probar Demo (14 días)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('payment')}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  isPayment
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'text-purple-200 hover:bg-white/5'
                }`}
              >
                💳 Contratar Plan
              </button>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* ─── Empresa ─── */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-300" />
                Datos de la empresa
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Nombre de la empresa"
                  icon={<Building2 className="w-4 h-4" />}
                  value={form.companyName}
                  onChange={(v) => updateField('companyName', v)}
                  error={errors.companyName}
                  placeholder="Agencia de Seguros XYZ"
                />
                <Field
                  label="Tax ID / RIF (opcional)"
                  icon={<CreditCard className="w-4 h-4" />}
                  value={form.companyTaxId}
                  onChange={(v) => updateField('companyTaxId', v)}
                  error={errors.companyTaxId}
                  placeholder="J-12345678-9"
                />
                <Field
                  label="Email de la empresa"
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  value={form.companyEmail}
                  onChange={(v) => updateField('companyEmail', v)}
                  error={errors.companyEmail}
                  placeholder="contacto@empresa.com"
                />
                <Field
                  label="Teléfono"
                  icon={<Phone className="w-4 h-4" />}
                  value={form.companyPhone}
                  onChange={(v) => updateField('companyPhone', v)}
                  error={errors.companyPhone}
                  placeholder="+58 412 1234567"
                />
                <Field
                  label="País (opcional)"
                  icon={<Globe className="w-4 h-4" />}
                  value={form.companyCountry}
                  onChange={(v) => updateField('companyCountry', v)}
                  error={errors.companyCountry}
                  placeholder="Venezuela"
                />
                <Field
                  label="Ciudad (opcional)"
                  icon={<MapPin className="w-4 h-4" />}
                  value={form.companyCity}
                  onChange={(v) => updateField('companyCity', v)}
                  error={errors.companyCity}
                  placeholder="Caracas"
                />
              </div>
            </section>

            {/* ─── Admin ─── */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-300" />
                Datos del administrador
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Nombre completo"
                  icon={<User className="w-4 h-4" />}
                  value={form.adminName}
                  onChange={(v) => updateField('adminName', v)}
                  error={errors.adminName}
                  placeholder="Juan Pérez"
                />
                <Field
                  label="Cargo (opcional)"
                  icon={<User className="w-4 h-4" />}
                  value={form.adminPosition}
                  onChange={(v) => updateField('adminPosition', v)}
                  error={errors.adminPosition}
                  placeholder="Gerente General"
                />
                <Field
                  label="Email"
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  value={form.adminEmail}
                  onChange={(v) => updateField('adminEmail', v)}
                  error={errors.adminEmail}
                  placeholder="juan@empresa.com"
                />
                <Field
                  label="Teléfono (opcional)"
                  icon={<Phone className="w-4 h-4" />}
                  value={form.adminPhone}
                  onChange={(v) => updateField('adminPhone', v)}
                  error={errors.adminPhone}
                  placeholder="+58 412 1234567"
                />
                <Field
                  label="Contraseña"
                  icon={<Lock className="w-4 h-4" />}
                  type="password"
                  value={form.adminPassword}
                  onChange={(v) => updateField('adminPassword', v)}
                  error={errors.adminPassword}
                  placeholder="Mínimo 8 caracteres"
                />
                <Field
                  label="Confirmar contraseña"
                  icon={<Lock className="w-4 h-4" />}
                  type="password"
                  value={form.adminPasswordConfirm}
                  onChange={(v) => updateField('adminPasswordConfirm', v)}
                  error={errors.adminPasswordConfirm}
                  placeholder="Repetí la contraseña"
                />
              </div>
            </section>

            {/* ─── Plan y pago (solo payment) ─── */}
            {isPayment && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-300" />
                  Plan y método de pago
                </h2>

                {catalogsLoading && (
                  <div className="flex items-center gap-2 text-purple-200 py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando planes y métodos de pago...
                  </div>
                )}

                {catalogsError && (
                  <div className="bg-red-500/20 border border-red-500/40 text-red-100 rounded-lg p-3 text-sm">
                    {catalogsError}
                  </div>
                )}

                {!catalogsLoading && !catalogsError && (
                  <div className="space-y-4">
                    {/* Planes */}
                    <div>
                      <label className="block text-sm font-medium text-purple-100 mb-2">
                        Plan
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {plans
                          .filter((p) => p.key !== 'demo' && p.isActive)
                          .map((plan) => (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => updateField('planId', plan.id)}
                              className={`p-4 rounded-lg border text-left transition-all ${
                                form.planId === plan.id
                                  ? 'border-purple-400 bg-purple-500/20 shadow-lg'
                                  : 'border-white/10 bg-white/5 hover:border-white/30'
                              }`}
                            >
                              <div className="font-semibold text-white flex items-center gap-2">
                                {plan.name}
                                {plan.popular && (
                                  <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <div className="text-2xl font-bold text-purple-200 mt-1">
                                ${Number(plan.priceMonthly).toFixed(2)}
                                <span className="text-xs font-normal text-purple-300">/mes</span>
                              </div>
                            </button>
                          ))}
                      </div>
                      {errors.planId && (
                        <p className="text-red-300 text-sm mt-1">{errors.planId}</p>
                      )}
                    </div>

                    {/* Ciclo */}
                    <div>
                      <label className="block text-sm font-medium text-purple-100 mb-2">
                        Ciclo de facturación
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => updateField('billingCycle', 'monthly')}
                          className={`py-2 px-4 rounded-lg border font-medium transition-all ${
                            form.billingCycle === 'monthly'
                              ? 'border-purple-400 bg-purple-500/20 text-white'
                              : 'border-white/10 bg-white/5 text-purple-200 hover:border-white/30'
                          }`}
                        >
                          Mensual
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField('billingCycle', 'yearly')}
                          className={`py-2 px-4 rounded-lg border font-medium transition-all ${
                            form.billingCycle === 'yearly'
                              ? 'border-purple-400 bg-purple-500/20 text-white'
                              : 'border-white/10 bg-white/5 text-purple-200 hover:border-white/30'
                          }`}
                        >
                          Anual
                        </button>
                      </div>
                      {selectedPlan && (
                        <p className="text-sm text-purple-200 mt-2">
                          Total:{' '}
                          <span className="font-semibold text-white">
                            $
                            {Number(
                              form.billingCycle === 'yearly'
                                ? selectedPlan.priceAnnual
                                : selectedPlan.priceMonthly
                            ).toFixed(2)}
                          </span>{' '}
                          {selectedPlan.currency}
                        </p>
                      )}
                    </div>

                    {/* Método de pago */}
                    <div>
                      <label className="block text-sm font-medium text-purple-100 mb-2">
                        Método de pago
                      </label>
                      <div className="space-y-2">
                        {paymentMethods.map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => updateField('paymentMethodId', method.id)}
                            className={`w-full p-4 rounded-lg border text-left transition-all flex items-start gap-3 ${
                              form.paymentMethodId === method.id
                                ? 'border-purple-400 bg-purple-500/20 shadow-lg'
                                : 'border-white/10 bg-white/5 hover:border-white/30'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                form.paymentMethodId === method.id
                                  ? 'border-purple-400 bg-purple-400'
                                  : 'border-white/40'
                              }`}
                            >
                              {form.paymentMethodId === method.id && (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-white">{method.name}</div>
                              {method.description && (
                                <div className="text-sm text-purple-200 mt-1">
                                  {method.description}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      {errors.paymentMethodId && (
                        <p className="text-red-300 text-sm mt-1">{errors.paymentMethodId}</p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ─── Error de servidor ─── */}
            {serverError && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-100 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* ─── Botones ─── */}
            <div className="flex flex-col-reverse md:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onBackToLogin}
                disabled={submitting}
                className="px-6 py-3 rounded-lg border border-white/20 text-purple-100 hover:bg-white/5 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al login
              </button>
              <button
                type="submit"
                disabled={submitting || catalogsLoading}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando solicitud...
                  </>
                ) : (
                  <>{isPayment ? 'Contratar plan' : 'Comenzar demo gratis'}</>
                )}
              </button>
            </div>

            <p className="text-center text-sm text-purple-200">
              ¿Ya tenés cuenta?{' '}
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-purple-300 hover:text-purple-100 font-medium underline-offset-2 hover:underline"
              >
                Iniciá sesión
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// Sub-componente Field
// ─────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
}

const Field: React.FC<FieldProps> = ({
  label,
  icon,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-purple-100 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300 pointer-events-none">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-3 py-2.5 rounded-lg bg-white/5 border text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-white/20 focus:ring-purple-400 focus:border-transparent'
          }`}
        />
      </div>
      {error && <p className="text-red-300 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default RegisterForm;