import React, { useState } from 'react';
import {
  PhoneCall,
  Server,
  Settings,
  Save,
  Play,
  Pause,
  Phone,
  PhoneForwarded,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  User,
  Clock,
  Volume2
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

export const IssabelModule: React.FC = () => {
  const { issabelConfig, updateIssabelConfig, callRecords, startCall, currentTenant } = useTenant();

  const [formData, setFormData] = useState({ ...issabelConfig });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [playingRecordId, setPlayingRecordId] = useState<string | null>(null);

  const [directDialNumber, setDirectDialNumber] = useState('');
  const [directDialName, setDirectDialName] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateIssabelConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleDirectDial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directDialNumber) return;
    startCall(directDialNumber, directDialName || 'Marcación Directa PBX');
    setDirectDialNumber('');
    setDirectDialName('');
  };

  const togglePlayAudio = (id: string) => {
    if (playingRecordId === id) {
      setPlayingRecordId(null);
    } else {
      setPlayingRecordId(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>Central Telefónica Issabel PBX & CDR</span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                AMI Conectado
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Integración de Asterisk / Issabel AMI, WebRTC SIP Gateway y registro histórico de llamadas (CDR).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-purple-50 text-purple-800 rounded-xl border border-purple-200 text-xs font-bold font-mono">
            Host: {issabelConfig.host}:{issabelConfig.amiPort}
          </div>
        </div>
      </div>

      {/* Grid: PBX Config & Direct Dial on Left, CDR on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Config Form + Quick Dialer */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Dialer Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Marcador Rápido Click-to-Call</span>
            </div>

            <form onSubmit={handleDirectDial} className="space-y-3">
              <div>
                <input
                  type="tel"
                  value={directDialNumber}
                  onChange={(e) => setDirectDialNumber(e.target.value)}
                  placeholder="Introduce número o extensión (ej: 786-555-0192)..."
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-bold text-slate-900"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={directDialName}
                  onChange={(e) => setDirectDialName(e.target.value)}
                  placeholder="Nombre de contacto (Opcional)"
                  className="w-full px-3 py-1.5 bg-slate-50 border rounded-xl text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Iniciar Llamada por Issabel</span>
              </button>
            </form>
          </div>

          {/* PBX Credentials Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Server className="w-4 h-4 text-purple-600" />
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Parámetros de Conexión Issabel / Asterisk
              </h2>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Host / IP del PBX</label>
                  <input
                    type="text"
                    value={formData.host || ''}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Puerto AMI</label>
                  <input
                    type="number"
                    value={formData.amiPort ?? 5038}
                    onChange={(e) => setFormData({ ...formData, amiPort: parseInt(e.target.value) || 5038 })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Usuario AMI</label>
                  <input
                    type="text"
                    value={formData.amiUser || ''}
                    onChange={(e) => setFormData({ ...formData, amiUser: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Secreto AMI</label>
                  <input
                    type="password"
                    value={formData.amiSecret || ''}
                    onChange={(e) => setFormData({ ...formData, amiSecret: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">WebRTC SIP Gateway (WSS)</label>
                <input
                  type="text"
                  value={formData.webrtcWssUrl || ''}
                  onChange={(e) => setFormData({ ...formData, webrtcWssUrl: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                {saveSuccess ? (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Guardado</span>
                  </span>
                ) : (
                  <div></div>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 7 Cols: Call Detail Records (CDR) Table */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Registro Detallado de Llamadas (CDR)</h2>
              <p className="text-xs text-slate-400">Historial completo con grabaciones de audio y notas de tipificación</p>
            </div>
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
              {callRecords.length} registros
            </span>
          </div>

          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Contacto / Destino</th>
                  <th className="p-2.5">Agente / Ext.</th>
                  <th className="p-2.5">Duración</th>
                  <th className="p-2.5">Estado</th>
                  <th className="p-2.5 text-right">Audio / Grabación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {callRecords.map((rec) => {
                  const isPlaying = playingRecordId === rec.id;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{rec.clientName || 'Desconocido'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{rec.destinationNumber}</div>
                        <div className="text-[10px] text-slate-400">{rec.timestamp || rec.startTime}</div>
                      </td>

                      <td className="p-2.5">
                        <div className="font-semibold text-slate-800">{rec.agentName}</div>
                        <div className="text-[10px] text-purple-700 font-mono">Ext #{rec.agentExtension || rec.extension || '101'}</div>
                      </td>

                      <td className="p-2.5 font-mono font-bold text-slate-700">
                        {Math.floor((rec.durationSeconds || rec.duration || 0) / 60)}:{String((rec.durationSeconds || rec.duration || 0) % 60).padStart(2, '0')} min
                      </td>

                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (rec.status || rec.disposition) === 'ANSWERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rec.status || rec.disposition || 'ANSWERED'}
                        </span>
                      </td>

                      <td className="p-2.5 text-right">
                        {rec.recordingUrl ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => togglePlayAudio(rec.id)}
                              className={`p-1.5 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-all ${
                                isPlaying
                                  ? 'bg-purple-600 text-white animate-pulse'
                                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                              }`}
                            >
                              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              <span>{isPlaying ? 'Reproduciendo' : 'Escuchar'}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Sin audio</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
