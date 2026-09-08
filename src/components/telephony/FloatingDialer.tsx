import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  X,
  Minimize2,
  Maximize2,
  Delete,
  FileText,
  User,
  Shield
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

export const FloatingDialer: React.FC = () => {
  const { showSoftphone, setShowSoftphone, activeCall, startCall, endCall, currentUser } = useTenant();

  const [dialPadNumber, setDialPadNumber] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (activeCall && activeCall.active) {
      setShowSoftphone(true);
    }
  }, [activeCall?.active]);

  if (!showSoftphone) return null;

  const handleKeyPress = (num: string) => {
    setDialPadNumber((prev) => prev + num);
  };

  const handleBackspace = () => {
    setDialPadNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (!dialPadNumber) return;
    startCall(dialPadNumber, 'Marcación Manual');
  };

  const handleHangup = () => {
    endCall(callNotes || 'Llamada finalizada');
    setCallNotes('');
    setDialPadNumber('');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5">
      <div
        className={`bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden transition-all duration-300 ${
          isMinimized ? 'w-72' : 'w-80'
        }`}
      >
        {/* Header */}
        <div className="p-3.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                activeCall?.active ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'
              }`}
            ></div>
            <span className="font-bold text-xs">Issabel Softphone (Ext. {currentUser.extension})</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setShowSoftphone(false)}
              className="p-1 text-slate-400 hover:text-rose-400 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ACTIVE CALL VIEW */}
        {activeCall && activeCall.active ? (
          <div className="p-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Llamada en Curso</div>
              <div className="text-base font-extrabold text-white truncate">{activeCall.clientName}</div>
              <div className="text-xs font-mono text-slate-400">{activeCall.number}</div>
              <div className="text-2xl font-black font-mono text-purple-300 mt-2">
                {formatTimer(activeCall.duration)}
              </div>
            </div>

            {/* Controls: Mute, Hold, Transfer */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-full text-xs font-bold transition-colors ${
                  isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title={isMuted ? 'Desactivar Silencio' : 'Silenciar Micrófono'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOnHold(!isOnHold)}
                className={`p-3 rounded-full text-xs font-bold transition-colors ${
                  isOnHold ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title={isOnHold ? 'Reanudar Llamada' : 'Poner en Espera'}
              >
                {isOnHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>

              {/* Hangup Button */}
              <button
                onClick={handleHangup}
                className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                title="Colgar llamada"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>

            {/* Disposition Notes Input */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Tipificación / Resumen de llamada
              </label>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Escribe el resultado de la llamada..."
                rows={2}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
              ></textarea>
            </div>
          </div>
        ) : (
          /* DIALER KEYPAD VIEW */
          !isMinimized && (
            <div className="p-4 space-y-4">
              {/* Number Display */}
              <div className="flex items-center justify-between bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <input
                  type="text"
                  value={dialPadNumber}
                  onChange={(e) => setDialPadNumber(e.target.value)}
                  placeholder="Número a marcar..."
                  className="bg-transparent text-center text-lg font-mono font-bold text-white tracking-wider w-full focus:outline-hidden"
                />
                {dialPadNumber && (
                  <button onClick={handleBackspace} className="p-1 text-slate-400 hover:text-white">
                    <Delete className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dialpad Matrix (0-9, *, #) */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleKeyPress(digit)}
                    className="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-base transition-colors active:scale-95 shadow-xs"
                  >
                    {digit}
                  </button>
                ))}
              </div>

              {/* Call Trigger Button */}
              <button
                onClick={handleCall}
                disabled={!dialPadNumber}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Marcar por Central Issabel</span>
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};
