// ===========================================
// src/components/auth/FirstLoginPasswordChangeView.tsx
// Vista de cambio obligatorio de contraseña en el primer login.
//
// Se muestra cuando el usuario tiene mustResetPassword === true
// después de un login exitoso (ej: tras aprobación de registro).
//
// Sesión 3.5.B.4.c
// ===========================================

import React, { useState, useMemo } from 'react';
import {
  Shield,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  Check,
  X,
  KeyRound,
} from 'lucide-react';
import { authService } from '../../services/authService';

interface FirstLoginPasswordChangeViewProps {
  /** Callback cuando el cambio de contraseña fue exitoso. */
  onSuccess: () => void;
  /** Callback cuando el usuario decide cerrar sesión (abandonar el flujo). */
  onLogout: () => void;
}

/**
 * Reglas de validación de la nueva contraseña.
 * Espejo EXACTO de la regex del backend (server/routes/auth.ts).
 */
const PASSWORD_RULES = {
  minLength: 6,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecial: /[^A-Za-z0-9]/,
};

/**
 * Valida una contraseña contra las reglas y devuelve un objeto con
 * el estado individual de cada requisito + un booleano global.
 */
function validatePassword(password: string) {
  return {
    minLength: password.length >= PASSWORD_RULES.minLength,
    hasUppercase: PASSWORD_RULES.hasUppercase.test(password),
    hasLowercase: PASSWORD_RULES.hasLowercase.test(password),
    hasNumber: PASSWORD_RULES.hasNumber.test(password),
    hasSpecial: PASSWORD_RULES.hasSpecial.test(password),
  };
}

export const FirstLoginPasswordChangeView: React.FC<FirstLoginPasswordChangeViewProps> = ({
  onSuccess,
  onLogout,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validación en vivo de la nueva contraseña
  const passwordChecks = useMemo(() => validatePassword(newPassword), [newPassword]);
  const allRulesPass = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    allRulesPass &&
    passwordsMatch &&
    !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) return;

    setIsLoading(true);
    try {
      const result = await authService.changeInitialPassword(
        currentPassword,
        newPassword,
        confirmPassword
      );

      if (result.success) {
        onSuccess();
      } else {
        // Mapeo de códigos a mensajes user-friendly
        const codeMessages: Record<string, string> = {
          INVALID_CURRENT_PASSWORD: 'La contraseña temporal es incorrecta.',
          PASSWORD_ALREADY_SET: 'Ya cambiaste tu contraseña anteriormente. Redirigiendo...',
          USER_NOT_FOUND: 'Tu usuario ya no existe. Contactá a soporte.',
          VALIDATION_ERROR: 'La nueva contraseña no cumple los requisitos.',
          AUTH_TOKEN_MISSING: 'Tu sesión expiró. Cerrá sesión y volvé a entrar.',
          AUTH_TOKEN_INVALID: 'Tu sesión expiró. Cerrá sesión y volvé a entrar.',
        };
        setError(codeMessages[result.code || ''] || result.error || 'Error al cambiar la contraseña.');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Ateendia CRM</h1>
          <p className="text-sm text-slate-500 mt-1">Configurá tu contraseña definitiva</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center space-y-2 pb-5 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Primer Inicio de Sesión</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Por seguridad, debés cambiar la contraseña temporal que recibiste por email antes de acceder al CRM.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mt-5 p-3 rounded-xl text-sm flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 mt-5">
            {/* Current (temporary) password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contraseña Temporal
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="La que recibiste por email"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Live requirements checklist */}
              {newPassword.length > 0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] animate-in fade-in">
                  <RequirementCheck label="Mínimo 6 caracteres" met={passwordChecks.minLength} />
                  <RequirementCheck label="Una mayúscula" met={passwordChecks.hasUppercase} />
                  <RequirementCheck label="Una minúscula" met={passwordChecks.hasLowercase} />
                  <RequirementCheck label="Un número" met={passwordChecks.hasNumber} />
                  <RequirementCheck label="Un carácter especial" met={passwordChecks.hasSpecial} />
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la nueva contraseña"
                  className={`w-full pl-10 pr-12 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    confirmPassword.length > 0 && !passwordsMatch
                      ? 'border-rose-300 focus:border-rose-500'
                      : 'border-slate-200 focus:border-purple-500'
                  }`}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1.5 text-[11px] text-rose-600 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  Las contraseñas no coinciden
                </p>
              )}
              {confirmPassword.length > 0 && passwordsMatch && (
                <p className="mt-1.5 text-[11px] text-emerald-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Las contraseñas coinciden
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <span>Cambiar Contraseña</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Logout fallback */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onLogout}
              disabled={isLoading}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1.5 mx-auto disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>¿No tenés la contraseña temporal? Cerrá sesión</span>
            </button>
          </div>

          {/* Security note */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Tu contraseña se encripta con bcrypt antes de guardarse</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Item de la checklist de requisitos de la contraseña.
 */
const RequirementCheck: React.FC<{ label: string; met: boolean }> = ({ label, met }) => (
  <div
    className={`flex items-center gap-1.5 transition-colors ${
      met ? 'text-emerald-600' : 'text-slate-400'
    }`}
  >
    {met ? (
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
    ) : (
      <X className="w-3.5 h-3.5 shrink-0" />
    )}
    <span className="font-medium">{label}</span>
  </div>
);

export default FirstLoginPasswordChangeView;