import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, ArrowRight, RefreshCw, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

export const TwoFactorModal: React.FC = () => {
  const { isTwoFactorVerified, pendingTwoFactor, verify2FACode, currentUser, currentTenant, loginUser } = useTenant();
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [demoCode, setDemoCode] = useState<string>('849201');

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  if (isTwoFactorVerified && !pendingTwoFactor) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 6) {
      setError('Por favor introduce el código de 6 dígitos.');
      return;
    }

    const success = verify2FACode(code);
    if (!success) {
      setError('Código incorrecto. Intenta con el código de prueba sugerido abajo.');
    } else {
      setError('');
    }
  };

  const handleResend = () => {
    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    setDemoCode(newCode);
    setTimeLeft(60);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Verificación en Dos Pasos (2FA)</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Por seguridad de <strong className="text-slate-800">{currentTenant.name}</strong>, introduce el código de seguridad enviado a tu dispositivo o app autenticadora.
          </p>
        </div>

        {/* Demo Pin helper */}
        <div className="mt-5 p-3 rounded-xl bg-purple-50/80 border border-purple-100 text-purple-900 text-xs flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-[11px] uppercase tracking-wider text-purple-700">Simulación de Código 2FA:</div>
            <div className="text-xs">
              Código de verificación generado: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-800 text-sm tracking-widest">{demoCode}</strong>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
              CÓDIGO DE 6 DÍGITOS
            </label>
            <div className="flex justify-center">
              <input
                id="two-factor-code-input"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/[^0-9]/g, ''));
                  setError('');
                }}
                placeholder="123456"
                className="w-48 text-center text-2xl font-mono tracking-widest px-4 py-2.5 rounded-xl border-2 border-purple-300 focus:border-purple-600 focus:outline-hidden font-bold text-slate-800 bg-slate-50"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-center text-xs text-rose-600 font-semibold mt-2 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          {/* Quick Auto-fill Demo Button */}
          <button
            type="button"
            onClick={() => {
              setCode(demoCode);
              verify2FACode(demoCode);
            }}
            className="w-full text-xs text-purple-700 bg-purple-100/70 hover:bg-purple-100 py-2 rounded-lg font-medium transition-colors"
          >
            ⚡ Auto-completar código ({demoCode}) y Acceder
          </button>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:shadow-lg active:scale-98"
          >
            <span>Verificar y Entrar al Sistema</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Resend code */}
        <div className="mt-4 text-center">
          <button
            onClick={handleResend}
            disabled={timeLeft > 0}
            className={`text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto ${
              timeLeft > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-purple-600 hover:underline'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{timeLeft > 0 ? `Reenviar código en ${timeLeft}s` : 'Reenviar nuevo código'}</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Sesión encriptada con aislamiento multi-empresa</span>
        </div>
      </div>
    </div>
  );
};
