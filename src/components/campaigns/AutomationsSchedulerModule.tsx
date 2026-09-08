import React, { useState } from 'react';
import {
  CalendarClock,
  Clock,
  Cake,
  FileWarning,
  CreditCard,
  Send,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Mail,
  MessageSquare,
  Play,
  Pause,
  Plus,
  Trash2,
  Sparkles,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { ScheduledRule } from '../../types';

export const AutomationsSchedulerModule: React.FC = () => {
  const {
    scheduledRules,
    updateScheduledRules,
    antiSpamSettings,
    updateAntiSpamSettings,
    templates,
    clients
  } = useTenant();

  const [activeTab, setActiveTab] = useState<'rules' | 'antispam' | 'queue'>('rules');

  // Anti-spam configuration local states
  const [maxDailyWhatsApp, setMaxDailyWhatsApp] = useState(antiSpamSettings.maxDailyWhatsApp || 50);
  const [maxDailyEmail, setMaxDailyEmail] = useState(antiSpamSettings.maxDailyEmail || 150);
  const [minIntervalSeconds, setMinIntervalSeconds] = useState(antiSpamSettings.minIntervalSeconds || 25);
  const [randomJitter, setRandomJitter] = useState(antiSpamSettings.randomJitter || true);
  const [alertOnSpamRisk, setAlertOnSpamRisk] = useState(antiSpamSettings.alertOnSpamRisk || true);

  // New Rule Form Modal / Inline
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<'birthday' | 'doc_expiry' | 'payment_due'>('birthday');
  const [newRuleChannel, setNewRuleChannel] = useState<'whatsapp' | 'email' | 'both'>('whatsapp');
  const [newRuleDays, setNewRuleDays] = useState(0);
  const [newRuleTime, setNewRuleTime] = useState('09:00');
  const [newRuleTemplateId, setNewRuleTemplateId] = useState(templates[0]?.id || 'tpl-2');

  const handleToggleRule = (ruleId: string) => {
    const updated = scheduledRules.map((r) => {
      if (r.id === ruleId) {
        return { ...r, isEnabled: !r.isEnabled };
      }
      return r;
    });
    updateScheduledRules(updated);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('¿Eliminar esta regla automatizada?')) {
      const updated = scheduledRules.filter((r) => r.id !== ruleId);
      updateScheduledRules(updated);
    }
  };

  const handleSaveAntiSpam = (e: React.FormEvent) => {
    e.preventDefault();
    updateAntiSpamSettings({
      maxDailyWhatsApp,
      maxDailyEmail,
      minIntervalSeconds,
      randomJitter,
      alertOnSpamRisk
    });
    alert('¡Configuración de seguridad anti-spam guardada exitosamente!');
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName) return;

    const newRule: ScheduledRule = {
      id: `rule-${Date.now()}`,
      tenantId: 'tenant-ateendia',
      name: newRuleName,
      triggerType: newRuleType,
      channel: newRuleChannel,
      daysOffset: newRuleDays,
      scheduledTime: newRuleTime,
      templateId: newRuleTemplateId,
      isEnabled: true,
      sentCountToday: 0,
      totalExecuted: 0
    };

    updateScheduledRules([...scheduledRules, newRule]);
    setShowAddRule(false);
    setNewRuleName('');
    alert('¡Nueva regla automatizada creada con éxito!');
  };

  // Mock calculation of daily usage
  const whatsAppUsedToday = 18;
  const emailUsedToday = 42;
  const whatsAppPercent = Math.min(Math.round((whatsAppUsedToday / maxDailyWhatsApp) * 100), 100);
  const emailPercent = Math.min(Math.round((emailUsedToday / maxDailyEmail) * 100), 100);

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">Programación de Mensajes & Motor Anti-Spam</h1>
            <p className="text-xs text-slate-500">
              Disparos automáticos por cumpleaños, vencimiento de pólizas y cobros con control de seguridad Meta.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'rules' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Reglas Programadas</span>
          </button>
          <button
            onClick={() => setActiveTab('antispam')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'antispam' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Seguridad & Límites Anti-Spam</span>
          </button>
        </div>
      </div>

      {/* Prominent Anti-Spam Live HUD Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WhatsApp Quota HUD */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black text-slate-900">Consumo Diario WhatsApp (WA1)</span>
            </div>
            <span className="text-xs font-extrabold text-emerald-700 font-mono">
              {whatsAppUsedToday} / {maxDailyWhatsApp} enviados hoy
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all rounded-full ${
                whatsAppPercent > 80 ? 'bg-rose-500' : whatsAppPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${whatsAppPercent}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Espaciado seguro activo (25s - 45s entre envíos)</span>
            <span>{whatsAppPercent}% de cuota diaria</span>
          </div>
        </div>

        {/* Email Quota HUD */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-black text-slate-900">Consumo Diario Email SMTP (Gmail)</span>
            </div>
            <span className="text-xs font-extrabold text-purple-700 font-mono">
              {emailUsedToday} / {maxDailyEmail} enviados hoy
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all rounded-full"
              style={{ width: `${emailPercent}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Calentamiento de dominio & SPF/DKIM Verificado</span>
            <span>{emailPercent}% de cuota diaria</span>
          </div>
        </div>
      </div>

      {/* TAB 1: SCHEDULED RULES */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Reglas Activas de Disparo Automatizado ({scheduledRules.length})
              </h2>
              <p className="text-xs text-slate-500">
                El sistema evalúa diariamente a medianoche la base de clientes y agenda los envíos con el espaciado configurado.
              </p>
            </div>

            <button
              onClick={() => setShowAddRule(!showAddRule)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddRule ? 'Cancelar' : 'Nueva Regla Automatizada'}</span>
            </button>
          </div>

          {/* Add Rule Form Inline */}
          {showAddRule && (
            <form onSubmit={handleAddRule} className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm space-y-4">
              <div className="text-xs font-black text-purple-950 uppercase tracking-wider">
                Configurar Nueva Regla de Disparo
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre de la Regla</label>
                  <input
                    type="text"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    placeholder="Ej: Felicitación Cumpleaños 2026"
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Evento Disparador</label>
                  <select
                    value={newRuleType}
                    onChange={(e) => setNewRuleType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-purple-700"
                  >
                    <option value="birthday">🎂 Cumpleaños del Cliente (Mismo día)</option>
                    <option value="doc_expiry">📄 Documento por Vencer</option>
                    <option value="payment_due">💳 Cuota / Prima Mensual por Vencer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Canal de Envío</label>
                  <select
                    value={newRuleChannel}
                    onChange={(e) => setNewRuleChannel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold"
                  >
                    <option value="whatsapp">📱 Solo WhatsApp WA1</option>
                    <option value="email">📧 Solo Correo Electrónico</option>
                    <option value="both">📱 + 📧 Ambos Canales (Recomendado)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Días de Anticipación / Desfase
                  </label>
                  <input
                    type="number"
                    value={newRuleDays}
                    onChange={(e) => setNewRuleDays(parseInt(e.target.value) || 0)}
                    placeholder="0 = mismo día, -7 = 7 días antes"
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hora de Disparo</label>
                  <input
                    type="time"
                    value={newRuleTime}
                    onChange={(e) => setNewRuleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Plantilla de Mensaje</label>
                  <select
                    value={newRuleTemplateId}
                    onChange={(e) => setNewRuleTemplateId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800"
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRule(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Crear Regla
                </button>
              </div>
            </form>
          )}

          {/* Rules Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scheduledRules.map((rule) => {
              const tpl = templates.find((t) => t.id === rule.templateId);
              return (
                <div
                  key={rule.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 bg-white ${
                    rule.isEnabled ? 'border-purple-200 shadow-xs' : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-xl ${
                          rule.triggerType === 'birthday'
                            ? 'bg-rose-100 text-rose-700'
                            : rule.triggerType === 'doc_expiry'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {rule.triggerType === 'birthday' ? (
                          <Cake className="w-5 h-5" />
                        ) : rule.triggerType === 'doc_expiry' ? (
                          <FileWarning className="w-5 h-5" />
                        ) : (
                          <CreditCard className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-xs text-slate-900">{rule.name}</h3>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          Hora: {rule.scheduledTime}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        rule.isEnabled ? 'text-purple-600 hover:bg-purple-50' : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={rule.isEnabled ? 'Pausar regla' : 'Reanudar regla'}
                    >
                      {rule.isEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Canal:</span>
                      <span className="font-bold text-slate-800 uppercase">{rule.channel}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Anticipación:</span>
                      <span className="font-bold text-purple-700">
                        {rule.daysOffset === 0 ? 'El mismo día' : `${rule.daysOffset} días antes`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Plantilla:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[130px]" title={tpl?.name}>
                        {tpl?.name || 'Por defecto'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Enviados hoy: {rule.sentCountToday || 0}</span>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Eliminar regla"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ANTI-SPAM SAFETY & WARNINGS */}
      {activeTab === 'antispam' && (
        <div className="space-y-5">
          {/* Critical Anti-Spam Warning Banner */}
          <div className="bg-amber-500/10 border-2 border-amber-500/30 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Política Estricta de Protección Anti-Spam & Seguridad de Envío
                </h3>
                <p className="text-xs text-slate-600">
                  ¿Por qué Ateendia CRM restringe los envíos masivos simultáneos y aplica retardos dinámicos?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-1">
                <strong className="text-amber-900 block font-black">1. Prevención de Baneo de WhatsApp (Meta)</strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Meta detecta ráfagas de mensajes idénticos enviados en menos de 10 segundos y bloquea el número de teléfono permanentemente. El espaciado aleatorio de 25-45s garantiza un comportamiento humano 100% seguro.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-1">
                <strong className="text-amber-900 block font-black">2. Reputación de Dominio SMTP (Email)</strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Proveedores como Gmail, Yahoo y Outlook penalizan los correos masivos enviándolos a la carpeta de SPAM o listando el servidor en listas negras internacionales (Spamhaus, Barracuda).
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-1">
                <strong className="text-amber-900 block font-black">3. Máxima Tasa de Apertura y Confianza</strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Los mensajes escalonados con nombre personalizado del titular logran una tasa de lectura y respuesta del 96%, a diferencia de campañas masivas sin filtro que generan reportes de spam.
                </p>
              </div>
            </div>
          </div>

          {/* Form Settings */}
          <form onSubmit={handleSaveAntiSpam} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-3">
              Límites Operativos Diarios Configurables
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Límite Máximo de Mensajes de WhatsApp por Día (Por Línea)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={maxDailyWhatsApp}
                  onChange={(e) => setMaxDailyWhatsApp(parseInt(e.target.value) || 50)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold"
                />
                <span className="text-[10px] text-slate-400">Recomendado para números nuevos o estándar: 50 envíos/día.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Límite Máximo de Correos Electrónicos por Día (SMTP)
                </label>
                <input
                  type="number"
                  min="20"
                  max="1000"
                  value={maxDailyEmail}
                  onChange={(e) => setMaxDailyEmail(parseInt(e.target.value) || 150)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold"
                />
                <span className="text-[10px] text-slate-400">Recomendado para Gmail Workspace: 150 a 250 envíos/día.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Intervalo Mínimo entre Mensajes Consecutivos (Segundos)
                </label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={minIntervalSeconds}
                  onChange={(e) => setMinIntervalSeconds(parseInt(e.target.value) || 25)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold"
                />
                <span className="text-[10px] text-slate-400">Tiempo de espera para despachar el siguiente mensaje en cola.</span>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={randomJitter}
                    onChange={(e) => setRandomJitter(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Activar Jitter Aleatorio (+5s a +15s de variación por mensaje)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertOnSpamRisk}
                    onChange={(e) => setAlertOnSpamRisk(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Notificar a Administrador si se supera el 85% de la cuota diaria
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                Guardar Políticas Anti-Spam
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
