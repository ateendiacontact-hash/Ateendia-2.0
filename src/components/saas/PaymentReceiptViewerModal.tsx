import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  Building2,
  Mail,
  Phone,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Send,
  Maximize2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { SaasPaymentReceipt, TenantBranding } from '../../types';

interface PaymentReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: SaasPaymentReceipt | null;
  onApprove: (receiptId: string, validFrom: string, validUntil: string) => void;
  onReject: (receiptId: string, reason: string) => void;
}

export const PaymentReceiptViewerModal: React.FC<PaymentReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  receipt,
  onApprove,
  onReject
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Default dates: Today to Today + 30 days
  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonthStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const [validFrom, setValidFrom] = useState(todayStr);
  const [validUntil, setValidUntil] = useState(nextMonthStr);

  if (!isOpen || !receipt) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = receipt.receiptUrl;
    link.download = receipt.receiptFileName || `comprobante_${receipt.tenantName}_${receipt.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmApproval = () => {
    onApprove(receipt.id, validFrom, validUntil);
    onClose();
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    onReject(receipt.id, rejectionReason.trim());
    setIsRejecting(false);
    onClose();
  };

  const isImage = receipt.receiptFileType?.includes('image') ||
    receipt.receiptUrl?.startsWith('data:image') ||
    receipt.receiptFileName?.match(/\.(jpg|jpeg|png|webp|gif)$/i);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 rounded-3xl w-full max-w-5xl h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-slate-700 text-white">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Visor Oficial de Comprobante de Pago
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    receipt.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : receipt.status === 'rejected'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {receipt.status === 'approved' ? '✓ Aprobado & Verificado' : receipt.status === 'rejected' ? '✗ Rechazado' : '⏳ Pendiente de Aprobación'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono">
                  {receipt.type === 'new_registration' ? 'Nuevo Registro' : receipt.type === 'renewal' ? 'Renovación de Plan' : 'Cambio de Plan'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {receipt.tenantName} • Archivo: <span className="font-mono text-slate-300">{receipt.receiptFileName}</span> ({receipt.receiptFileSize || 'Doc'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Grid: Left Viewer + Right Payment Metadata */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* ============ LEFT: INTERACTIVE IMAGE / FILE VISOR (7 Cols) ============ */}
          <div className="lg:col-span-7 bg-slate-950 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden relative">
            {/* Viewer Controls Toolbar */}
            <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 z-10">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Alejar Zoom (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-indigo-400 px-1 select-none">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Acercar Zoom (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[10px] font-bold"
                  title="Restablecer a 100%"
                >
                  100%
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                  title="Rotar 90 grados"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotar {rotation !== 0 ? `(${rotation}°)` : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>
              </div>
            </div>

            {/* Canvas / Image Display */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
              {isImage ? (
                <div
                  className="transition-transform duration-200 ease-out origin-center select-none shadow-2xl rounded-xl overflow-hidden border border-slate-700"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                  }}
                >
                  <img
                    src={receipt.receiptUrl}
                    alt="Comprobante Bancario"
                    className="max-h-[60vh] max-w-full object-contain block bg-white"
                  />
                </div>
              ) : (
                <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-white">{receipt.receiptFileName}</h4>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Este documento es un comprobante en formato PDF o no-imagen.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar y Abrir Documento</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ============ RIGHT: METADATA & ACTIONS (5 Cols) ============ */}
          <div className="lg:col-span-5 bg-slate-900 flex flex-col overflow-y-auto p-6 space-y-5">
            {/* Empresa & Plan Info Box */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Detalles de Empresa</span>
                <span className="text-[11px] font-mono text-slate-400">{receipt.submittedAt}</span>
              </div>

              <h3 className="text-lg font-bold text-white">{receipt.tenantName}</h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-slate-400">Admin:</span>
                  <span className="font-semibold text-white">{receipt.adminName} ({receipt.adminEmail})</span>
                </div>
                {receipt.adminPhone && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-slate-400">WhatsApp:</span>
                    <span className="font-semibold text-white">{receipt.adminPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Summary Box */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Datos Financieros</span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Plan Solicitado</div>
                  <div className="font-bold text-white text-sm mt-0.5">{receipt.planName}</div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Monto Depositado</div>
                  <div className="font-bold text-emerald-400 text-sm mt-0.5">${receipt.amount} USD</div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Método de Pago</div>
                  <div className="font-semibold text-slate-200 capitalize mt-0.5">
                    {receipt.paymentMethod === 'zelle' ? '🟣 Zelle' : receipt.paymentMethod === 'bank_transfer' ? '🏦 Banco / ACH' : receipt.paymentMethod === 'crypto_usdt' ? '🪙 Cripto USDT' : '💳 Tarjeta'}
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[11px]">N° de Referencia</div>
                  <div className="font-mono font-bold text-indigo-300 text-xs mt-0.5 truncate">
                    {receipt.referenceNumber || 'N/A'}
                  </div>
                </div>
              </div>

              {receipt.notes && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <span className="text-slate-500 font-bold block mb-1">Notas del Comprobante:</span>
                  {receipt.notes}
                </div>
              )}
            </div>

            {/* Dates of Validity to Apply */}
            {receipt.status !== 'approved' && !isRejecting && (
              <div className="p-4 bg-indigo-950/40 rounded-2xl border border-indigo-800/40 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>Vigencia a Asignar para Habilitación:</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 font-bold"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                  Al hacer clic en <strong>"Comprobar Pago y Habilitar Empresa"</strong>, el sistema activará el acceso inmediato a la empresa, registrará las fechas de vigencia y enviará automáticamente el correo con credenciales y la notificación por WhatsApp.
                </p>
              </div>
            )}

            {/* Rejection Form */}
            {isRejecting && (
              <form onSubmit={handleConfirmRejection} className="p-4 bg-rose-950/40 rounded-2xl border border-rose-800/40 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Motivo del Rechazo del Comprobante:</span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ej: El número de referencia no coincide con el depósito bancario o el monto es inferior."
                  className="w-full p-2.5 bg-slate-950 border border-rose-800/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs"
                  >
                    Confirmar Rechazo y Notificar
                  </button>
                </div>
              </form>
            )}

            {/* Action Buttons */}
            {receipt.status !== 'approved' && !isRejecting && (
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rechazar Comprobante</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  className="w-full sm:flex-1 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.01]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Comprobar Pago y Habilitar Empresa</span>
                </button>
              </div>
            )}

            {receipt.status === 'approved' && (
              <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">Comprobante Aprobado y Validado</div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">
                    Vigencia activa del <strong>{receipt.validFrom}</strong> al <strong>{receipt.validUntil}</strong>.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
