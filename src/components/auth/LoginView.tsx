import React, { useState, useEffect } from 'react';
import {
  Shield,
  Mail,
  Lock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Key,
  RotateCcw,
  ChevronLeft
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { authService, LoginCredentials } from '../../services/authService';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'credentials' | 'otp' | 'forgot' | 'reset'>('credentials');
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [otpCode, setOtpCode] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [userEmail, setUserEmail] = useState<string>('');

  // Resend timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const result = await authService.login({
        email: credentials.email,
        password: credentials.password,
      });

      if (result.success && result.requires2FA) {
        // OTP sent, move to step 2
        setUserEmail(credentials.email);
        setStep('otp');
        setOtpSent(true);
        setResendTimer(60);
      } else if (result.success) {
        // Direct login (no 2FA)
        onLoginSuccess();
      } else {
        setError(result.error || 'Credenciales inválidas');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await authService.login({
        email: userEmail,
        password: credentials.password,
        twoFactorCode: otpCode,
      });

      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Código inválido');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await authService.resendOtp(userEmail);
      setOtpSent(true);
      setResendTimer(60);
      setOtpCode('');
    } catch (err: any) {
      setError(err.message || 'Error al reenviar código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Ingresa tu correo electrónico');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const result = await authService.requestPasswordReset(forgotEmail);
      if (result.success) {
        setSuccess('Se ha enviado un enlace de restablecimiento a tu correo. Revisa tu bandeja de entrada y spam.');
        setStep('credentials');
        setForgotEmail('');
      } else {
        setError(result.error || 'Error al solicitar restablecimiento');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!resetToken) {
      setError('Token de restablecimiento requerido');
      return;
    }
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.confirmPasswordReset(resetToken, newPassword, confirmPassword);
      if (result.success) {
        setSuccess('Contraseña actualizada correctamente. Redirigiendo al inicio de sesión...');
        setTimeout(() => {
          setStep('credentials');
          setResetToken('');
          setNewPassword('');
          setConfirmPassword('');
        }, 2000);
      } else {
        setError(result.error || 'Error al restablecer contraseña');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtpCode('');
    setOtpSent(false);
    setResendTimer(0);
    setUserEmail('');
    setError(null);
    setSuccess(null);
  };

  const handleShowForgot = () => {
    setStep('forgot');
    setError(null);
    setSuccess(null);
  };

  const handleShowReset = () => {
    // Extract token from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
    }
    setStep('reset');
    setError(null);
    setSuccess(null);
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
          <p className="text-sm text-slate-500 mt-1">Inicia sesión para acceder a tu panel</p>
        </div>

        {/* Step Indicator - only for login flow */}
        {(step === 'credentials' || step === 'otp') && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`flex items-center gap-1.5 ${step === 'credentials' ? 'text-purple-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'credentials' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>1</div>
              <span className="hidden sm:inline text-xs font-semibold">Credenciales</span>
            </div>
            <div className={`w-12 h-1 bg-gradient-to-r ${step === 'otp' ? 'from-purple-600 to-indigo-600' : 'bg-slate-200'} rounded`} />
            <div className={`flex items-center gap-1.5 ${step === 'otp' ? 'text-purple-600' : 'text-slate-400'}`}>
              <span className="hidden sm:inline text-xs font-semibold">Código OTP</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'otp' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>2</div>
            </div>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
          {(error || success) && (
            <div className={`mb-5 p-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in ${
              error ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              {error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{error || success}</span>
            </div>
          )}

          {/* Step 1: Credentials */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value.toLowerCase() })}
                    placeholder="tu@empresa.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleShowForgot}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>¿Olvidaste tu contraseña?</span>
                </button>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <div className="space-y-5">
              <div className="text-center space-y-2 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Verificación en Dos Pasos</h3>
                <p className="text-xs text-slate-500">
                  Hemos enviado un código de 6 dígitos a
                </p>
                <p className="text-sm font-mono font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg inline-block">
                  {userEmail}
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">CÓDIGO DE 6 DÍGITOS</label>
                  <div className="flex justify-center gap-2">
                    {[...Array(6)].map((_, i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength={1}
                        value={otpCode[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length === 1) {
                            const newCode = otpCode.substring(0, i) + val + otpCode.substring(i + 1);
                            setOtpCode(newCode);
                            const nextInput = document.getElementById(`otp-${i + 1}`);
                            nextInput?.focus();
                          } else if (val.length === 0) {
                            const newCode = otpCode.substring(0, i) + '' + otpCode.substring(i + 1);
                            setOtpCode(newCode);
                            const prevInput = document.getElementById(`otp-${i - 1}`);
                            prevInput?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otpCode[i] && i > 0) {
                            const prevInput = document.getElementById(`otp-${i - 1}`);
                            prevInput?.focus();
                          }
                        }}
                        id={`otp-${i}`}
                        className={`w-10 h-12 text-center text-2xl font-mono font-bold tracking-widest rounded-xl border-2 ${
                          otpCode[i] 
                            ? 'border-purple-500 bg-purple-50 text-purple-800' 
                            : 'border-slate-200 bg-white focus:border-purple-500'
                        } focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all`}
                        disabled={isLoading}
                        autoComplete="one-time-code"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>Verificar y Acceder</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Resend OTP */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || isLoading}
                  className={`w-full text-xs font-semibold flex items-center justify-center gap-1.5 ${
                    resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-purple-600 hover:underline'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {resendTimer > 0 
                      ? `Reenviar código en ${resendTimer}s` 
                      : 'No recibiste el código? Reenviar'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="w-full text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Volver a credenciales</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Forgot Password - Request Reset Email */}
          {step === 'forgot' && (
            <div className="space-y-5">
              <div className="text-center space-y-2 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Recuperar Contraseña</h3>
                <p className="text-xs text-slate-500">
                  Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value.toLowerCase())}
                      placeholder="tu@empresa.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      required
                      autoComplete="email"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !forgotEmail}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar enlace de restablecimiento</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="w-full text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Volver al inicio de sesión</span>
                </button>
              </form>
            </div>
          )}

          {/* Step 4: Reset Password - New Password Form */}
          {step === 'reset' && (
            <div className="space-y-5">
              <div className="text-center space-y-2 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Nueva Contraseña</h3>
                <p className="text-xs text-slate-500">
                  Define tu nueva contraseña de acceso.
                </p>
              </div>

              <form onSubmit={handleResetSubmit} className="space-y-5">
                {resetToken && (
                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs text-purple-700 font-mono text-center">
                    Token de restablecimiento detectado en la URL ✓
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nueva Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      required
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirmar Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      required
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <span>Guardar nueva contraseña</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="w-full text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Cancelar y volver</span>
                </button>
              </form>
            </div>
          )}

          {/* Security Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Sesión encriptada con aislamiento multi-empresa</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;