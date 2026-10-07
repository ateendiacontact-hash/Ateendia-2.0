import React, { useEffect } from 'react';
import {
  CheckCircle2,
  Mail,
  ArrowLeft,
  Clock,
  Shield,
  Sparkles,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────

interface RegisterSuccessViewProps {
  /** ID de la solicitud creada (para mostrar como referencia). */
  requestId: string;
  /** Tipo de registro (demo o payment). */
  type: 'demo' | 'payment';
  /** Callback para volver al login. */
  onBackToLogin: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────

export const RegisterSuccessView: React.FC<RegisterSuccessViewProps> = ({
  requestId,
  type,
  onBackToLogin,
}) => {
  const isDemo = type === 'demo';
  
  // Persistir el requestId en localStorage para que CheckStatusModal
  // pueda autocompletar el input la próxima vez (Sesión 3.5.B.4.b).
  // Clave compartida: ver src/components/auth/CheckStatusModal.tsx → LOCALSTORAGE_KEY.
  useEffect(() => {
    if (requestId) {
      localStorage.setItem('ateendia_last_registration_request_id', requestId);
    }
  }, [requestId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white">
              ¡Solicitud recibida!
            </h1>
            <p className="text-purple-100 mt-2">
              {isDemo
                ? 'Tu demo está siendo procesada'
                : 'Tu solicitud de contratación está siendo procesada'}
            </p>
          </div>

          {/* Contenido */}
          <div className="p-8 space-y-6">
            {/* Mensaje principal */}
            <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-300 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-white mb-1">
                    ¿Qué pasa ahora?
                  </h2>
                  <p className="text-purple-100 text-sm leading-relaxed">
                    {isDemo ? (
                      <>
                        Nuestro equipo va a revisar tu solicitud. Una vez aprobada,
                        vas a recibir un <strong className="text-white">email con tus credenciales de acceso</strong>{' '}
                        y podrás empezar a usar la demo de inmediato.
                      </>
                    ) : (
                      <>
                        Nuestro equipo va a revisar tu solicitud y verificar el pago.
                        Una vez confirmado, vas a recibir un{' '}
                        <strong className="text-white">email con tus credenciales de acceso</strong>{' '}
                        y los detalles de tu plan.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Pasos siguientes */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-purple-200 uppercase tracking-wide">
                Próximos pasos
              </h3>

              <Step
                icon={<Mail className="w-5 h-5" />}
                title="Revisá tu email"
                description="Te vamos a contactar al email de la empresa que ingresaste. Si no ves el correo, revisá la carpeta de spam."
                step={1}
              />

              <Step
                icon={<Clock className="w-5 h-5" />}
                title={isDemo ? 'Aprobación en menos de 24h' : 'Verificación de pago'}
                description={
                  isDemo
                    ? 'Nuestro equipo suele aprobar las solicitudes demo en menos de 24 horas hábiles.'
                    : 'Vamos a verificar tu pago manualmente. Una vez confirmado, activamos tu cuenta.'
                }
                step={2}
              />

              <Step
                icon={<Shield className="w-5 h-5" />}
                title="Credenciales seguras"
                description="Por seguridad, tu contraseña actual se descarta. Te enviaremos una contraseña temporal que deberás cambiar al primer ingreso."
                step={3}
              />
            </div>

            {/* Referencia */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-xs text-purple-300 uppercase tracking-wide mb-1">
                Número de referencia
              </p>
              <p className="font-mono text-sm text-white break-all">
                {requestId}
              </p>
              <p className="text-xs text-purple-300 mt-2">
                Guardá este número por si necesitás consultar el estado de tu solicitud.
              </p>
            </div>

            {/* Botón */}
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al inicio de sesión
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-purple-300 mt-6">
          ¿Problemas? Escribinos a{' '}
          <a
            href="mailto:support@ateendia.cloud"
            className="text-purple-200 hover:text-white underline-offset-2 hover:underline"
          >
            support@ateendia.cloud
          </a>
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// Sub-componente Step (paso numerado)
// ─────────────────────────────────────────────────────────────────────

interface StepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  step: number;
}

const Step: React.FC<StepProps> = ({ icon, title, description, step }) => {
  return (
    <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-purple-400">
            PASO {step}
          </span>
        </div>
        <h4 className="font-semibold text-white text-sm">{title}</h4>
        <p className="text-purple-200 text-sm mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

export default RegisterSuccessView;