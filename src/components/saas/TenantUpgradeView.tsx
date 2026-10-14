/**
 * @file TenantUpgradeView.tsx
 * @description Pantalla de upgrade demo → pago para tenants.
 *
 * Permite a un tenant en estado `demo` (o `expired` dentro del grace period)
 * convertir su cuenta a un plan pago SIN perder datos, usuarios ni configuración.
 *
 * Flujo:
 *   1. Al montar → consulta elegibilidad vía GET /api/saas/upgrade/eligibility.
 *   2. Si NO elegible → muestra pantalla informativa con el motivo.
 *   3. Si elegible → muestra formulario (plan + billing cycle + método pago + notas).
 *   4. Al submit → POST /api/saas/upgrade, espera requestId.
 *   5. En éxito → pantalla de confirmación con link a CheckStatusModal.
 *
 * Reutiliza:
 *   - `registrationService.fetchPlansPublic()`        → catálogo de planes
 *   - `registrationService.fetchPaymentMethodsPublic()` → métodos de pago
 *   - `upgradeService.checkEligibility()`             → GET eligibility
 *   - `upgradeService.createUpgradeRequest()`         → POST upgrade
 *   - `CheckStatusModal`                              → consulta de estado post-submit
 *
 * @see src/services/upgradeService.ts
 * @see src/services/registrationService.ts
 * @see server/routes/saas/upgrade.ts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Crown,
  Clock,
  CreditCard,
  FileText,
  RefreshCw,
  ExternalLink,
  UploadCloud,
  X,           
} from 'lucide-react';
import { upgradeService } from '../../services/upgradeService';
import { registrationService } from '../../services/registrationService';
import { CheckStatusModal } from '../auth/CheckStatusModal';
import type {
  UpgradeEligibility,
  SaasPlanPublic,
  PublicPaymentMethod,
  BillingCycle,
} from '../../types';

// ────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────

interface TenantUpgradeViewProps {
  /** Callback opcional cuando el usuario quiere volver al dashboard. */
  onBackToDashboard?: () => void;
}

// ────────────────────────────────────────────────────────────────────
// Estados internos del componente (discriminated union)
// ────────────────────────────────────────────────────────────────────

type ViewState =
  | { kind: 'loading' }
  | { kind: 'not_eligible'; eligibility: UpgradeEligibility }
  | { kind: 'eligible'; eligibility: UpgradeEligibility }
  | { kind: 'submitting' }
  | {
      kind: 'success';
      requestId: string;
      planName: string;
      priceAmount: number;
      currency: string;
      billingCycle: BillingCycle;
    }
  | { kind: 'error'; message: string; code: string }
  // ─── NUEVO (3.5.B.4.e.1): solicitud duplicada ─────────────────────
  | { kind: 'already_pending' };

// ────────────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────────────

export const TenantUpgradeView: React.FC<TenantUpgradeViewProps> = ({
  onBackToDashboard,
}) => {
  // Estado principal
  const [view, setView] = useState<ViewState>({ kind: 'loading' });

  // Catálogos (se cargan al montar)
  const [plans, setPlans] = useState<SaasPlanPublic[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PublicPaymentMethod[]>(
    []
  );
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [catalogsError, setCatalogsError] = useState<string | null>(null);

  // Selección del formulario
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedBillingCycle, setSelectedBillingCycle] =
    useState<BillingCycle>('monthly');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] =
    useState<string>('');
    const [notes, setNotes] = useState<string>('');

  // ─── Estado para el comprobante de pago ─────────────────────────────
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [receiptFilename, setReceiptFilename] = useState<string | null>(null);
  const [receiptFileSize, setReceiptFileSize] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  // Modal de consulta de estado (post-submit)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // ─── Efecto 1: consultar elegibilidad al montar ────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadEligibility = async () => {
      setView({ kind: 'loading' });
      const result = await upgradeService.checkEligibility();

      if (cancelled) return;

            if (result.success === false) {
        setView({
          kind: 'error',
          message: result.error,
          code: result.code,
        });
        return;
      }

      if (result.data.eligible) {
        setView({ kind: 'eligible', eligibility: result.data });
      } else {
        setView({ kind: 'not_eligible', eligibility: result.data });
      }
    };

    loadEligibility();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Efecto 2: cargar catálogos al montar ──────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadCatalogs = async () => {
      setCatalogsLoading(true);
      setCatalogsError(null);

      const [plansResult, methodsResult] = await Promise.all([
        registrationService.fetchPlansPublic(),
        registrationService.fetchPaymentMethodsPublic(),
      ]);

      if (cancelled) return;

            if (plansResult.success === false) {
        setCatalogsError(plansResult.error);
        setCatalogsLoading(false);
        return;
      }

      if (methodsResult.success === false) {
        setCatalogsError(methodsResult.error);
        setCatalogsLoading(false);
        return;
      }

      // Filtramos el plan DEMO (no se puede "upgradear" a demo).
      const paidPlans = plansResult.data.filter((p) => p.key !== 'demo');
      setPlans(paidPlans);
      setPaymentMethods(methodsResult.data);

      // Preseleccionamos el plan popular o el primero.
      if (paidPlans.length > 0) {
        const popular = paidPlans.find((p) => p.popular);
        setSelectedPlanId(popular ? popular.id : paidPlans[0].id);
      }
      if (methodsResult.data.length > 0) {
        setSelectedPaymentMethodId(methodsResult.data[0].id);
      }

      setCatalogsLoading(false);
    };

    loadCatalogs();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Handler: reintentar elegibilidad ──────────────────────────────
  const handleRetry = useCallback(() => {
    setView({ kind: 'loading' });
        upgradeService.checkEligibility().then((result) => {
      if (result.success === false) {
        setView({
          kind: 'error',
          message: result.error,
          code: result.code,
        });
        return;
      }
      if (result.data.eligible) {
        setView({ kind: 'eligible', eligibility: result.data });
      } else {
        setView({ kind: 'not_eligible', eligibility: result.data });
      }
    });
  }, []);

    // ─── Handler: cambio de archivo de comprobante ─────────────────────
  const handleReceiptChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Limpiamos errores previos.
      setReceiptError(null);

      // ─── Validación 1: tipo MIME ─────────────────────────────────
      const ALLOWED_TYPES = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'application/pdf',
      ];
      if (!ALLOWED_TYPES.includes(file.type)) {
        setReceiptError(
          'Formato no permitido. Solo aceptamos PNG, JPG o PDF.'
        );
        // Limpiamos el input para permitir reintentar con el mismo archivo.
        e.target.value = '';
        return;
      }

      // ─── Validación 2: tamaño máximo 5 MB ────────────────────────
      const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
      if (file.size > MAX_SIZE_BYTES) {
        setReceiptError(
          `El archivo es demasiado grande (${formatFileSize(file.size)}). El máximo es 5 MB.`
        );
        e.target.value = '';
        return;
      }

      // ─── Conversión a Base64 con FileReader ──────────────────────
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          setReceiptError('No pudimos leer el archivo. Intentá de nuevo.');
          return;
        }
        // `result` es un data URL: "data:image/png;base64,iVBORw0KG..."
        setReceiptBase64(result);
      };

      reader.onerror = () => {
        setReceiptError('Error al leer el archivo. Intentá de nuevo.');
      };

      // Disparamos la lectura asíncrona.
      reader.readAsDataURL(file);

      // Actualizamos el resto de los estados inmediatamente.
      setReceiptFile(file);
      setReceiptFilename(file.name);
      setReceiptFileSize(formatFileSize(file.size));
    },
    []
  );

  // ─── Handler: eliminar comprobante ─────────────────────────────────
  const handleReceiptClear = useCallback(() => {
    setReceiptFile(null);
    setReceiptBase64(null);
    setReceiptFilename(null);
    setReceiptFileSize(null);
    setReceiptError(null);
  }, []);

  // ─── Helper: formatear tamaño de archivo ───────────────────────────
  /**
   * Convierte bytes a un string legible (ej: "2.5 MB", "340 KB").
   * Se usa tanto para mostrar en la previsualización como en el
   * mensaje de error de tamaño excedido.
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ─── Handler: submit del formulario ────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlanId) {
      setView({
        kind: 'error',
        message: 'Elegí un plan para continuar.',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    if (!selectedPlan) {
      setView({
        kind: 'error',
        message: 'El plan seleccionado ya no está disponible.',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    setView({ kind: 'submitting' });

        // ─── Validación: comprobante obligatorio según método de pago ────
    const selectedMethod = paymentMethods.find(
      (m) => m.id === selectedPaymentMethodId
    );
    const isReceiptRequired =
      selectedMethod?.type === 'manual' ||
      selectedMethod?.type === 'crypto_semi_auto';

    if (isReceiptRequired && !receiptBase64) {
      setReceiptError(
        'Este método de pago requiere que subas el comprobante.'
      );
      return; // No cambiamos de vista, solo mostramos el error.
    }

    setView({ kind: 'submitting' });

    const priceAmount =
      selectedBillingCycle === 'yearly'
        ? selectedPlan.priceAnnual
        : selectedPlan.priceMonthly;

    const result = await upgradeService.createUpgradeRequest({
      planId: selectedPlanId,
      billingCycle: selectedBillingCycle,
      paymentMethodId: selectedPaymentMethodId || undefined,
      notes: notes.trim() || undefined,
      // ─── NUEVOS CAMPOS (3.5.B.4.e.1) ─────────────────────────────
      receiptUrl: receiptBase64 || undefined,
      receiptFilename: receiptFilename || undefined,
      receiptFileSize: receiptFileSize || undefined,
    });

        if (result.success === false) {
      // ─── Caso especial: ya hay una solicitud pendiente ────────────
      if (result.code === 'UPGRADE_ALREADY_PENDING') {
        setView({ kind: 'already_pending' });
        return;
      }

      // ─── Cualquier otro error: ErrorCard genérico ─────────────────
      setView({
        kind: 'error',
        message: result.error,
        code: result.code,
      });
      return;
    }

    setView({
      kind: 'success',
      requestId: result.data.requestId,
      planName: result.data.planName,
      priceAmount: result.data.priceAmount,
      currency: result.data.currency,
      billingCycle: result.data.billingCycle,
    });
  };

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center transition-colors"
            aria-label="Volver al dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Upgrade a Plan Pago
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Convertí tu cuenta demo en un plan pago sin perder datos ni usuarios.
          </p>
        </div>
      </div>

      {/* Contenido según estado */}
      {view.kind === 'loading' && <LoadingCard />}

      {view.kind === 'not_eligible' && (
        <NotEligibleCard eligibility={view.eligibility} onRetry={handleRetry} />
      )}

      {view.kind === 'error' && (
        <ErrorCard
          message={view.message}
          code={view.code}
          onRetry={handleRetry}
        />
      )}

      {view.kind === 'eligible' && (
        <EligibleForm
          eligibility={view.eligibility}
          plans={plans}
          paymentMethods={paymentMethods}
          catalogsLoading={catalogsLoading}
          catalogsError={catalogsError}
          selectedPlanId={selectedPlanId}
          selectedBillingCycle={selectedBillingCycle}
          selectedPaymentMethodId={selectedPaymentMethodId}
          notes={notes}
          onPlanChange={setSelectedPlanId}
          onBillingCycleChange={setSelectedBillingCycle}
          onPaymentMethodChange={setSelectedPaymentMethodId}
          onNotesChange={setNotes}
          onSubmit={handleSubmit}
          // ─── NUEVAS PROPS (3.5.B.4.e.1) ────────────────────────
          receiptFile={receiptFile}
          receiptFilename={receiptFilename}
          receiptFileSize={receiptFileSize}
          receiptError={receiptError}
          onReceiptChange={handleReceiptChange}
          onReceiptClear={handleReceiptClear}
        />
      )}

            {view.kind === 'already_pending' && (
        <AlreadyPendingCard
          onOpenStatusModal={() => setIsStatusModalOpen(true)}
        />
      )}

      {view.kind === 'submitting' && <SubmittingCard />}

      {view.kind === 'success' && (
        <SuccessCard
          requestId={view.requestId}
          planName={view.planName}
          priceAmount={view.priceAmount}
          currency={view.currency}
          billingCycle={view.billingCycle}
          onOpenStatusModal={() => setIsStatusModalOpen(true)}
        />
      )}

      {/* Modal de consulta de estado */}
      <CheckStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────
// Sub-componente: LoadingCard
// ────────────────────────────────────────────────────────────────────

const LoadingCard: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
    <p className="text-sm font-semibold text-slate-700">
      Verificando elegibilidad...
    </p>
    <p className="text-xs text-slate-400">
      Estamos consultando el estado de tu cuenta.
    </p>
  </div>
);

// ────────────────────────────────────────────────────────────────────
// Sub-componente: NotEligibleCard
// ────────────────────────────────────────────────────────────────────

interface NotEligibleCardProps {
  eligibility: UpgradeEligibility;
  onRetry: () => void;
}

const NotEligibleCard: React.FC<NotEligibleCardProps> = ({
  eligibility,
  onRetry,
}) => {
  // Mapeo de código a mensaje + ícono
  const config: Record<
    string,
    { title: string; description: string; color: string; bg: string; border: string }
  > = {
    TENANT_NOT_FOUND: {
      title: 'Cuenta no encontrada',
      description:
        'No pudimos encontrar tu cuenta. Contactá a soporte para revisarlo.',
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    },
    TENANT_NOT_IN_DEMO: {
      title: 'Ya tenés un plan pago activo',
      description:
        'Tu cuenta ya está en un plan pago. No necesitás hacer upgrade.',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    DEMO_GRACE_EXPIRED: {
      title: 'Tu demo expiró',
      description:
        'El período de gracia terminó. Contactá a soporte para reactivar tu cuenta.',
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    },
    TENANT_ALREADY_PAID: {
      title: 'Ya estás en un plan pago',
      description:
        'Tu cuenta ya tiene un plan pago activo. No podés hacer upgrade a otro plan desde acá.',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
  };

  const c = config[eligibility.code || ''] || {
    title: 'No podés hacer upgrade ahora',
    description:
      eligibility.reason || 'Contactá a soporte para más información.',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  };

  return (
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-8`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-xs`}>
          <AlertCircle className={`w-6 h-6 ${c.color}`} />
        </div>
        <div className="flex-1">
          <h2 className={`text-lg font-black ${c.color}`}>{c.title}</h2>
          <p className="text-sm text-slate-700 mt-1">{c.description}</p>
          {eligibility.tenantStatus && (
            <p className="text-xs text-slate-500 mt-3">
              Estado actual:{' '}
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                {eligibility.tenantStatus}
              </span>
            </p>
          )}
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────
// Sub-componente: ErrorCard
// ────────────────────────────────────────────────────────────────────

interface ErrorCardProps {
  message: string;
  code: string;
  onRetry: () => void;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ message, code, onRetry }) => (
  <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-8">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-xs">
        <AlertCircle className="w-6 h-6 text-rose-600" />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-black text-rose-700">
          No pudimos cargar la información
        </h2>
        <p className="text-sm text-slate-700 mt-1">{message}</p>
        <p className="text-xs text-slate-500 mt-2 font-mono">
          Código: {code}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reintentar
        </button>
      </div>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────────────
// Sub-componente: EligibleForm
// ────────────────────────────────────────────────────────────────────

interface EligibleFormProps {
  eligibility: UpgradeEligibility;
  plans: SaasPlanPublic[];
  paymentMethods: PublicPaymentMethod[];
  catalogsLoading: boolean;
  catalogsError: string | null;
  selectedPlanId: string;
  selectedBillingCycle: BillingCycle;
  selectedPaymentMethodId: string;
  notes: string;
  onPlanChange: (id: string) => void;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onPaymentMethodChange: (id: string) => void;
  onNotesChange: (notes: string) => void;
  onSubmit: (e: React.FormEvent) => void;
   // ─── NUEVAS PROPS (3.5.B.4.e.1) ──────────────────────────────
  receiptFile: File | null;
  receiptFilename: string | null;
  receiptFileSize: string | null;
  receiptError: string | null;
  onReceiptChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReceiptClear: () => void;
}

const EligibleForm: React.FC<EligibleFormProps> = ({
  eligibility,
  plans,
  paymentMethods,
  catalogsLoading,
  catalogsError,
  selectedPlanId,
  selectedBillingCycle,
  selectedPaymentMethodId,
  notes,
  onPlanChange,
  onBillingCycleChange,
  onPaymentMethodChange,
  onNotesChange,
  onSubmit,
  // ─── NUEVAS PROPS (3.5.B.4.e.1) ──────────────────────────────
  receiptFile,
  receiptFilename,
  receiptFileSize,
  receiptError,
  onReceiptChange,
  onReceiptClear,
}) => {
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Calculamos el precio según el ciclo elegido.
  const displayPrice = selectedPlan
    ? selectedBillingCycle === 'yearly'
      ? selectedPlan.priceAnnual
      : selectedPlan.priceMonthly
    : 0;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Banner de expiración demo */}
      {eligibility.demoExpiresAt && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-900">
            Tu demo expira el{' '}
            <span className="font-bold">
              {new Date(eligibility.demoExpiresAt).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            . Hacé upgrade antes para no perder acceso.
          </p>
        </div>
      )}

      {/* Estado de carga de catálogos */}
      {catalogsLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
          <p className="text-sm text-slate-600">Cargando planes...</p>
        </div>
      )}

      {catalogsError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-rose-700">
              No pudimos cargar los planes
            </p>
            <p className="text-xs text-rose-700 mt-1">{catalogsError}</p>
          </div>
        </div>
      )}

      {/* Sección: elegir plan */}
      {!catalogsLoading && !catalogsError && plans.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              1. Elegí tu plan
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map((plan) => {
              const isSelected = plan.id === selectedPlanId;
              const price =
                selectedBillingCycle === 'yearly'
                  ? plan.priceAnnual
                  : plan.priceMonthly;

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => onPlanChange(plan.id)}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white shadow">
                      ★ Popular
                    </span>
                  )}
                  <p className="text-sm font-black text-slate-900">
                    {plan.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    {plan.description || 'Sin descripción'}
                  </p>
                  <p className="text-xl font-black text-purple-700 mt-2">
                    ${Number(price).toFixed(2)}
                    <span className="text-xs font-semibold text-slate-500 ml-1">
                      /{selectedBillingCycle === 'yearly' ? 'año' : 'mes'}
                    </span>
                  </p>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Sección: billing cycle */}
      {!catalogsLoading && !catalogsError && plans.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              2. Ciclo de facturación
            </h2>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onBillingCycleChange('monthly')}
              className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                selectedBillingCycle === 'monthly'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => onBillingCycleChange('yearly')}
              className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all relative ${
                selectedBillingCycle === 'yearly'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              Anual
              <span className="absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                Ahorrás
              </span>
            </button>
          </div>
        </section>
      )}

            {/* Sección: método de pago */}
      {!catalogsLoading && !catalogsError && paymentMethods.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              3. Método de pago
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {paymentMethods.map((method) => {
              const isSelected = method.id === selectedPaymentMethodId;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => onPaymentMethodChange(method.id)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-bold text-slate-900">
                    {method.name}
                  </p>
                  {method.description && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {method.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Sección: comprobante de pago (NUEVO 3.5.B.4.e.1) */}
      {!catalogsLoading && !catalogsError && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                4. Comprobante de pago
              </h2>
            </div>
                        {/* Badge: Obligatorio / Opcional según el método de pago */}
            {(() => {
              const selectedMethod = paymentMethods.find(
                (m) => m.id === selectedPaymentMethodId
              );
              const isRequired =
                selectedMethod?.type === 'manual' ||
                selectedMethod?.type === 'crypto_semi_auto';

              return isRequired ? (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  OBLIGATORIO
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  OPCIONAL
                </span>
              );
            })()}
          </div>

          {/* Zona de upload */}
          {!receiptFile ? (
            <label
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                receiptError
                  ? 'border-rose-300 bg-rose-50'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-purple-400'
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className={`w-8 h-8 mb-2 ${receiptError ? 'text-rose-500' : 'text-slate-400'}`} />
                <p className="text-sm text-slate-600 font-semibold">
                  Hacé clic para subir tu comprobante
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PNG, JPG o PDF (máx. 5 MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
                onChange={onReceiptChange}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {receiptFilename}
                  </p>
                  <p className="text-xs text-slate-500">
                    {receiptFileSize}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onReceiptClear}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Eliminar comprobante"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mensaje de error */}
          {receiptError && (
            <div className="flex items-start gap-2 text-rose-600 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{receiptError}</p>
            </div>
          )}
        </section>
      )}

      {/* Sección: notas */}
      {!catalogsLoading && !catalogsError && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              4. Notas (opcional)
            </h2>
          </div>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ej: quiero activar el plan con facturación anual. Adjunto comprobante por email."
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-hidden text-sm text-slate-800 bg-slate-50 resize-none"
          />
          <p className="text-[11px] text-slate-400">
            {notes.length}/500 caracteres
          </p>
        </section>
      )}

      {/* Resumen y submit */}
      {!catalogsLoading && !catalogsError && selectedPlan && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">
                Total a pagar
              </p>
              <p className="text-3xl font-black text-purple-700 mt-1">
                ${Number(displayPrice).toFixed(2)}{' '}
                <span className="text-sm font-semibold text-slate-500">
                  {selectedPlan.currency} /{' '}
                  {selectedBillingCycle === 'yearly' ? 'año' : 'mes'}
                </span>
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Plan <span className="font-bold">{selectedPlan.name}</span>
              </p>
            </div>
          </div>

          <button
            type="submit"
                        disabled={
              !selectedPlanId ||
              !selectedPaymentMethodId ||
              (paymentMethods.find((m) => m.id === selectedPaymentMethodId)
                ?.type !== 'automatic' && !receiptFile)
            }
            className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:shadow-lg active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            Solicitar Upgrade
          </button>

          <p className="text-[11px] text-slate-500 text-center">
            Un administrador revisará tu solicitud y activará el plan tras
            verificar el pago.
          </p>
        </div>
      )}
    </form>
  );
};

// ────────────────────────────────────────────────────────────────────
// Sub-componente: SubmittingCard
// ────────────────────────────────────────────────────────────────────

const SubmittingCard: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
    <p className="text-sm font-semibold text-slate-700">
      Enviando solicitud de upgrade...
    </p>
    <p className="text-xs text-slate-400">Esto toma solo un momento.</p>
  </div>
);

// ────────────────────────────────────────────────────────────────────
// Sub-componente: SuccessCard
// ────────────────────────────────────────────────────────────────────

interface SuccessCardProps {
  requestId: string;
  planName: string;
  priceAmount: number;
  currency: string;
  billingCycle: BillingCycle;
  onOpenStatusModal: () => void;
}

const SuccessCard: React.FC<SuccessCardProps> = ({
  requestId,
  planName,
  priceAmount,
  currency,
  billingCycle,
  onOpenStatusModal,
}) => (
  <div className="bg-white rounded-2xl border-2 border-emerald-200 p-8 space-y-6">
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
      </div>
      <div className="flex-1">
        <h2 className="text-xl font-black text-emerald-700">
          ¡Solicitud enviada!
        </h2>
        <p className="text-sm text-slate-700 mt-1">
          Recibimos tu solicitud de upgrade al plan{' '}
          <span className="font-bold">{planName}</span>.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Un administrador la revisará y activará tu cuenta tras verificar el
          pago. Suele tardar menos de 24 horas hábiles.
        </p>
      </div>
    </div>

    <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-200">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-semibold">Plan</span>
        <span className="text-slate-900 font-bold">{planName}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-semibold">Ciclo</span>
        <span className="text-slate-900 font-bold">
          {billingCycle === 'yearly' ? 'Anual' : 'Mensual'}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-semibold">Monto</span>
        <span className="text-slate-900 font-bold">
          ${Number(priceAmount).toFixed(2)} {currency}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
        <span className="text-slate-500 font-semibold">N° de referencia</span>
        <span className="text-slate-900 font-mono text-[10px] truncate max-w-[200px]">
          {requestId}
        </span>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-3">
      <button
        type="button"
        onClick={onOpenStatusModal}
        className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
      >
        <ExternalLink className="w-4 h-4" />
        Consultar estado
      </button>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────────────
// Sub-componente: AlreadyPendingCard
// ────────────────────────────────────────────────────────────────────

interface AlreadyPendingCardProps {
  onOpenStatusModal: () => void;
}

const AlreadyPendingCard: React.FC<AlreadyPendingCardProps> = ({
  onOpenStatusModal,
}) => (
  <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-8">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-xs">
        <Clock className="w-6 h-6 text-amber-600" />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-black text-amber-700">
          Ya tenés una solicitud de upgrade pendiente
        </h2>
        <p className="text-sm text-slate-700 mt-1">
          Recibimos tu solicitud anterior y está siendo revisada por un
          administrador. No podés crear una nueva hasta que se resuelva.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Suele tardar menos de 24 horas hábiles. Si ya pasó ese tiempo,
          contactá a soporte.
        </p>
        <button
          type="button"
          onClick={onOpenStatusModal}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Consultar estado de mi solicitud
        </button>
      </div>
    </div>
  </div>
);

export default TenantUpgradeView;