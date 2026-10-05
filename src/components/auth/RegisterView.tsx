import React, { useState, useCallback } from 'react';
import { RegisterForm } from './RegisterForm';
import { RegisterSuccessView } from './RegisterSuccessView';

// ─────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────

interface RegisterViewProps {
  /** Callback para volver al login (desde el formulario o la pantalla de éxito). */
  onBackToLogin: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// Estado del flujo
// ─────────────────────────────────────────────────────────────────────

interface SuccessState {
  requestId: string;
  type: 'demo' | 'payment';
}

// ─────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────

export const RegisterView: React.FC<RegisterViewProps> = ({ onBackToLogin }) => {
  const [successState, setSuccessState] = useState<SuccessState | null>(null);

  const handleSuccess = useCallback((requestId: string, type: 'demo' | 'payment') => {
    setSuccessState({ requestId, type });
  }, []);

  const handleBackToLoginFromSuccess = useCallback(() => {
    // Reseteamos el estado por si el usuario vuelve y quiere registrarse de nuevo
    setSuccessState(null);
    onBackToLogin();
  }, [onBackToLogin]);

  if (successState) {
    return (
      <RegisterSuccessView
        requestId={successState.requestId}
        type={successState.type}
        onBackToLogin={handleBackToLoginFromSuccess}
      />
    );
  }

  return (
    <RegisterForm
      onSuccess={handleSuccess}
      onBackToLogin={onBackToLogin}
    />
  );
};

export default RegisterView;