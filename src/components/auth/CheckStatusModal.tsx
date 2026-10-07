/**
 * Modal para consultar el estado público de una solicitud de registro.
 *
 * Accesible desde LoginView. NO requiere autenticación: el usuario
 * pega su requestId (UUID que recibió al enviar el formulario) y el modal
 * consulta el endpoint público GET /api/saas/registrations/:id/status.
 *
 * Características:
 * - Autocompleta el input con el último requestId guardado en localStorage
 *   (clave: 'ateendia_last_registration_request_id').
 * - Estados internos: idle → loading → success | error.
 * - Renderiza diferente UI según el status recibido:
 *   - pending:  ⏳ amarillo — "En revisión. Suele tardar menos de 24h."
 *   - approved: ✅ verde    — "Aprobado. Revisá tu email."
 *   - rejected: ❌ rojo     — "No fue aprobada. Contactanos."
 *   - expired:  ⏰ gris     — "Expiró. Podés enviar una nueva."
 * - Accesibilidad:
 *   - Cierre con ESC y click en backdrop.
 *   - Bloquea scroll del body mientras está abierto.
 *   - `role="dialog"` y `aria-modal="true"`.
 *
 * @see src/services/registrationService.ts → fetchRegistrationStatus
 * @see src/types/index.ts → RegistrationStatusDTO
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  Calendar,
  Building2,
} from 'lucide-react';
import { registrationService } from '../../services/registrationService';
import type { RegistrationStatusDTO, FetchStatusResult } from '../../types';

// ─── Constantes ────────────────────────────────────────────────────────

/** Clave de localStorage donde RegisterSuccessView guarda el último requestId. */
const LOCALSTORAGE_KEY = 'ateendia_last_registration_request_id';

// ─── Tipos ─────────────────────────────────────────────────────────────

interface CheckStatusModalProps {
  /** Controla la visibilidad del modal. */
  isOpen: boolean;
  /** Callback al cerrar (ESC, backdrop o botón X). */
  onClose: () => void;
}

type ViewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; data: RegistrationStatusDTO }
  | { kind: 'error'; message: string };

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Formatea un timestamp ISO 8601 a un string legible en español.
 * Ej: "2026-10-05T16:39:43.000Z" → "5 de octubre de 2026, 16:39"
 */
function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso; // fallback: devolvemos el ISO crudo si el parseo falla
  }
}

// ─── Componente principal ──────────────────────────────────────────────

export const CheckStatusModal: React.FC<CheckStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [requestId, setRequestId] = useState<string>('');
  const [view, setView] = useState<ViewState>({ kind: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Efecto 1: autocompletar desde localStorage + focus ──────────────
  useEffect(() => {
    if (!isOpen) return;
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    if (saved) setRequestId(saved);
    setView({ kind: 'idle' });
    // Focus en el input al abrir (delay para que el DOM esté listo)
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // ─── Efecto 2: cierre con ESC + bloqueo de scroll ────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    // Bloquear scroll del body mientras el modal está abierto
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // ─── Handler: consultar estado ───────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = requestId.trim();

    if (!trimmed) {
      setView({ kind: 'error', message: 'Ingresá el número de referencia.' });
      return;
    }

    setView({ kind: 'loading' });

    const result = await registrationService.fetchRegistrationStatus(trimmed);

    if (result.success) {
  setView({ kind: 'success', data: result.data });
} else {
  // Cast defensivo porque TS no narrowa el union en este contexto.
  // El backend SIEMPRE devuelve { error, code } cuando success=false.
  const errorResult = result as { success: false; error: string; code: string };
  setView({ kind: 'error', message: errorResult.error });
}
  };

  // ─── Handler: resetear al estado idle ────────────────────────────────
  const handleReset = () => {
    setView({ kind: 'idle' });
  };

  // ─── Guard: no renderizar si está cerrado ────────────────────────────
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="check-status-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar (X) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-xs">
            <Search className="w-7 h-7" />
          </div>
          <h2
            id="check-status-title"
            className="text-xl font-black text-slate-900"
          >
            Consultar estado de solicitud
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Pegá tu número de referencia para ver en qué estado está tu solicitud.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="check-status-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              NÚMERO DE REFERENCIA
            </label>
            <input
              ref={inputRef}
              id="check-status-input"
              type="text"
              value={requestId}
              onChange={(e) => {
                setRequestId(e.target.value);
                if (view.kind === 'error') setView({ kind: 'idle' });
              }}
              placeholder="03fd727d-dbc5-4e21-b4b8-de32e0365837"
              disabled={view.kind === 'loading'}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-hidden text-sm font-mono text-slate-800 bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Lo recibiste al enviar el formulario de registro.
            </p>
          </div>

          <button
            type="submit"
            disabled={view.kind === 'loading' || !requestId.trim()}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:shadow-lg active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
          >
            {view.kind === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Consultando...</span>
              </>
            ) : (
              <>
                <span>Consultar estado</span>
                <Search className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resultado */}
        {view.kind === 'success' && (
          <StatusResult data={view.data} onReset={handleReset} />
        )}

        {view.kind === 'error' && (
          <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-900">No pudimos consultar</p>
              <p className="text-xs text-rose-700 mt-1">{view.message}</p>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline-offset-2 hover:underline mt-2"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          ¿Problemas? Escribinos a{' '}
          <a
            href="mailto:support@ateendia.cloud"
            className="text-purple-600 hover:text-purple-700 underline-offset-2 hover:underline"
          >
            support@ateendia.cloud
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-componente: render del resultado por estado ───────────────────

interface StatusResultProps {
  data: RegistrationStatusDTO;
  onReset: () => void;
}

const StatusResult: React.FC<StatusResultProps> = ({ data, onReset }) => {
  const config = getStatusConfig(data.status);

  return (
    <div className={`mt-5 p-5 rounded-xl border-2 ${config.containerClass}`}>
      {/* Header con ícono + estado */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.iconBgClass}`}>
          <config.Icon className={`w-5 h-5 ${config.iconColorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wide ${config.labelClass}`}>
            {config.label}
          </p>
          <p className={`text-sm font-semibold mt-0.5 ${config.messageClass}`}>
            {config.message}
          </p>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-2">
        <MetadataRow icon={<Building2 className="w-3.5 h-3.5" />} label="Empresa" value={data.companyName} />
        <MetadataRow icon={<Calendar className="w-3.5 h-3.5" />} label="Enviada" value={formatDate(data.createdAt)} />
        {data.reviewedAt && (
          <MetadataRow icon={<Mail className="w-3.5 h-3.5" />} label="Revisada" value={formatDate(data.reviewedAt)} />
        )}
      </div>

      {/* Botón reset */}
      <button
        type="button"
        onClick={onReset}
        className="mt-4 text-xs font-semibold text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
      >
        Consultar otra solicitud
      </button>
    </div>
  );
};

// ─── Sub-componente: fila de metadata ──────────────────────────────────

interface MetadataRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const MetadataRow: React.FC<MetadataRowProps> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="text-slate-400">{icon}</span>
    <span className="text-slate-500 font-medium">{label}:</span>
    <span className="text-slate-800 truncate">{value}</span>
  </div>
);

// ─── Config por estado ─────────────────────────────────────────────────

interface StatusConfig {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  message: string;
  containerClass: string;
  iconBgClass: string;
  iconColorClass: string;
  labelClass: string;
  messageClass: string;
}

/**
 * Devuelve la configuración visual (ícono, colores, mensaje) según el status.
 *
 * Mensajes (alineados con la decisión de la sub-fase 3.5.B.4.b):
 * - pending:  "En revisión. Suele tardar menos de 24h."
 * - approved: "Aprobado. Revisá tu email, te enviamos las credenciales."
 * - rejected: "Lo sentimos, no fue aprobada. Contactanos a support@ateendia.cloud"
 * - expired:  "Tu solicitud expiró. Podés enviar una nueva."
 */
function getStatusConfig(status: RegistrationStatusDTO['status']): StatusConfig {
  switch (status) {
    case 'pending':
      return {
        Icon: Clock,
        label: 'En revisión',
        message: 'Suele tardar menos de 24 horas hábiles.',
        containerClass: 'bg-amber-50 border-amber-200',
        iconBgClass: 'bg-amber-100',
        iconColorClass: 'text-amber-600',
        labelClass: 'text-amber-700',
        messageClass: 'text-amber-900',
      };
    case 'approved':
      return {
        Icon: CheckCircle2,
        label: 'Aprobada',
        message: 'Revisá tu email: te enviamos las credenciales de acceso.',
        containerClass: 'bg-emerald-50 border-emerald-200',
        iconBgClass: 'bg-emerald-100',
        iconColorClass: 'text-emerald-600',
        labelClass: 'text-emerald-700',
        messageClass: 'text-emerald-900',
      };
    case 'rejected':
      return {
        Icon: XCircle,
        label: 'No aprobada',
        message: 'Lo sentimos. Contactanos a support@ateendia.cloud.',
        containerClass: 'bg-rose-50 border-rose-200',
        iconBgClass: 'bg-rose-100',
        iconColorClass: 'text-rose-600',
        labelClass: 'text-rose-700',
        messageClass: 'text-rose-900',
      };
    case 'expired':
      return {
        Icon: AlertCircle,
        label: 'Expirada',
        message: 'Tu solicitud expiró. Podés enviar una nueva.',
        containerClass: 'bg-slate-50 border-slate-200',
        iconBgClass: 'bg-slate-200',
        iconColorClass: 'text-slate-600',
        labelClass: 'text-slate-700',
        messageClass: 'text-slate-900',
      };
  }
}

export default CheckStatusModal;