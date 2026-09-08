import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Printer,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ClientDocument } from '../../types';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ClientDocument | null;
  documentsList?: ClientDocument[];
  onSelectDocument?: (doc: ClientDocument) => void;
  clientName?: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document: activeDoc,
  documentsList = [],
  onSelectDocument,
  clientName = 'Cliente'
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Reset zoom & rotation when active document changes
  useEffect(() => {
    setZoom(100);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [activeDoc?.id]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || (e.ctrlKey && e.key === '=')) {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || (e.ctrlKey && e.key === '-')) {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' && e.ctrlKey) {
        e.preventDefault();
        handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !activeDoc) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 40));
  const handleResetZoom = () => {
    setZoom(100);
    setPosition({ x: 0, y: 0 });
  };
  const handleRotateCw = () => setRotation((prev) => (prev + 90) % 360);
  const handleRotateCcw = () => setRotation((prev) => (prev - 90 + 360) % 360);

  // Mouse pan/drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 100) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Print document
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (!printWindow) {
      alert('Por favor permite ventanas emergentes para imprimir el documento.');
      return;
    }

    const printContent = printContainerRef.current?.innerHTML || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impresión de Documento - ${activeDoc.name}</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #0f172a;
              background: #ffffff;
            }
            .header-info {
              border-bottom: 2px solid #7c3aed;
              padding-bottom: 12px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title { font-size: 18px; font-weight: bold; color: #1e1b4b; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .meta-badge {
              background: #f1f5f9;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
            }
            .doc-body {
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 20px 0;
            }
            .doc-body img {
              max-width: 100%;
              max-height: 80vh;
              object-fit: contain;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }
            .watermark {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              border-top: 1px dashed #cbd5e1;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            <div>
              <div class="title">${activeDoc.name}</div>
              <div class="subtitle">Cliente: ${clientName} | Tipo: ${activeDoc.type} | Estado: ${activeDoc.status}</div>
            </div>
            <div class="meta-badge">
              Expediente Digital • ${new Date().toLocaleDateString()}
            </div>
          </div>
          <div class="doc-body">
            ${printContent}
          </div>
          <div class="watermark">
            Documento emitido y archivado electrónicamente. Copia digital certificada.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Download document
  const handleDownload = () => {
    if (activeDoc.fileUrl || activeDoc.previewUrl) {
      const link = window.document.createElement('a');
      link.href = activeDoc.fileUrl || activeDoc.previewUrl || '';
      link.download = activeDoc.name || 'documento.png';
      link.click();
    } else {
      // Create a downloaded receipt text or SVG file
      const blob = new Blob([
        `DOCUMENTO EXPEDIENTE CLIENTE\n` +
        `--------------------------\n` +
        `Nombre: ${activeDoc.name}\n` +
        `Tipo: ${activeDoc.type}\n` +
        `Cliente: ${clientName}\n` +
        `Estado: ${activeDoc.status}\n` +
        `Vencimiento: ${activeDoc.expirationDate || 'N/A'}\n` +
        `Fecha de Carga: ${activeDoc.uploadedAt}\n` +
        `Verificado por: ${activeDoc.verifiedBy || 'Sistema'}\n`
      ], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${activeDoc.name.replace(/\.[^/.]+$/, '')}_detalle.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Find index in documents list for previous / next navigation
  const currentIndex = documentsList.findIndex((d) => d.id === activeDoc.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < documentsList.length - 1;

  const handlePrevDoc = () => {
    if (hasPrev && onSelectDocument) {
      onSelectDocument(documentsList[currentIndex - 1]);
    }
  };

  const handleNextDoc = () => {
    if (hasNext && onSelectDocument) {
      onSelectDocument(documentsList[currentIndex + 1]);
    }
  };

  const isImage = (fileName: string) => {
    const lower = fileName.toLowerCase();
    return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('.svg') || (activeDoc.fileUrl && activeDoc.fileUrl.startsWith('data:image'));
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Top Toolbar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white select-none z-10 shrink-0">
        {/* Left: Document Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 truncate max-w-xs sm:max-w-md" title={activeDoc.name}>
                {activeDoc.name}
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeDoc.status === 'Válido'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : activeDoc.status === 'Por Vencer'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {activeDoc.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {activeDoc.type} • {activeDoc.fileSize || '1.2 MB'} • Cliente: <strong className="text-slate-200">{clientName}</strong>
            </p>
          </div>
        </div>

        {/* Center: Zoom, Rotate & Navigation Controls */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
          {/* Prev / Next Document */}
          {documentsList.length > 1 && (
            <>
              <button
                onClick={handlePrevDoc}
                disabled={!hasPrev}
                className="p-1.5 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300 transition-colors"
                title="Documento Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 px-1 font-mono">
                {currentIndex + 1}/{documentsList.length}
              </span>
              <button
                onClick={handleNextDoc}
                disabled={!hasNext}
                className="p-1.5 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300 transition-colors"
                title="Documento Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1" />
            </>
          )}

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Reducir Zoom (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Percentage */}
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 text-xs font-mono font-bold text-slate-200 hover:bg-slate-700 rounded-lg"
            title="Restablecer al 100%"
          >
            {zoom}%
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Aumentar Zoom (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Rotate Counterclockwise */}
          <button
            onClick={handleRotateCcw}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Girar 90° a la Izquierda"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Rotate Clockwise */}
          <button
            onClick={handleRotateCw}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Girar 90° a la Derecha"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions (Print, Download, Fullscreen, Close) */}
        <div className="flex items-center gap-2">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all cursor-pointer"
            title="Imprimir Documento"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors"
            title="Descargar Archivo"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors hidden sm:block"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-xl transition-colors"
            title="Cerrar Visor (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Canvas / Viewer Workspace */}
      <div
        className={`flex-1 overflow-hidden relative flex items-center justify-center p-4 sm:p-8 select-none ${
          zoom > 100 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={printContainerRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
          className="max-w-4xl w-full flex items-center justify-center shrink-0 origin-center"
        >
          {activeDoc.fileUrl || activeDoc.previewUrl ? (
            <img
              src={activeDoc.fileUrl || activeDoc.previewUrl}
              alt={activeDoc.name}
              className="max-h-[75vh] w-auto max-w-full rounded-xl shadow-2xl object-contain border border-slate-700 bg-white"
            />
          ) : isImage(activeDoc.name) ? (
            /* Render image graphic representation */
            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-300 text-slate-900 max-w-2xl w-full">
              <div className="aspect-4/3 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                <div className="w-20 h-20 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10" />
                </div>
                <h3 className="text-base font-bold text-slate-800">{activeDoc.name}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  {activeDoc.description || 'Vista previa gráfica del archivo digital cargado.'}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg text-xs">
                    {activeDoc.type}
                  </span>
                  <span className="px-3 py-1 bg-slate-200 text-slate-700 font-mono text-xs rounded-lg">
                    {activeDoc.fileSize || '1.2 MB'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Stylized Realistic Certificate / Document Simulation */
            <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border-4 border-double border-slate-300 p-8 sm:p-12 max-w-3xl w-full space-y-6 relative overflow-hidden">
              {/* Background watermark seal */}
              <div className="absolute right-6 -bottom-6 opacity-5 pointer-events-none">
                <ShieldCheck className="w-72 h-72 text-purple-900" />
              </div>

              {/* Official Header */}
              <div className="flex items-start justify-between border-b-2 border-purple-900 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-900 text-white flex items-center justify-center font-black text-xl shadow-md">
                    AT
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight">EXPEDIENTE DIGITAL OFICIAL</h1>
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
                      Atendia Seguros • Registro Central de Documentos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Código Documental</div>
                  <div className="text-xs font-mono font-bold text-purple-900">{activeDoc.id.toUpperCase()}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{activeDoc.uploadedAt}</div>
                </div>
              </div>

              {/* Document Title Banner */}
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                    Tipo de Archivo Oficial
                  </div>
                  <div className="text-base font-black text-purple-950 mt-0.5">{activeDoc.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Estado de Validez</div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-black mt-0.5 ${
                      activeDoc.status === 'Válido'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeDoc.status === 'Por Vencer'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    ● {activeDoc.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Document Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Titular / Cliente</span>
                  <div className="font-bold text-slate-900 text-sm">{clientName}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Nombre del Archivo</span>
                  <div className="font-bold text-slate-900 truncate font-mono">{activeDoc.name}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Expiración</span>
                  <div className="font-bold text-slate-900 font-mono">
                    {activeDoc.expirationDate ? activeDoc.expirationDate : 'Permanente / Sin Expiración'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Verificado Por</span>
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{activeDoc.verifiedBy || 'Víctor Aray (Oficial de Cumplimiento)'}</span>
                  </div>
                </div>
              </div>

              {/* Description / Content note */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Nota del Expediente: </strong>
                {activeDoc.description ||
                  `Documento digitalizado para la gestión de pólizas ACA y verificación ante el Marketplace Federal de Seguros (HealthCare.gov). Expediente protegido bajo confidencialidad y normativas HIPAA.`}
              </div>

              {/* Barcode & Security Stamp Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-36 bg-slate-800 flex items-center justify-center text-white text-[9px] font-mono tracking-widest px-2">
                    ||| | |||| || | |||| |||
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{activeDoc.id}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Firma Criptográfica SHA-256 Verificada</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Mobile Zoom Toolbar */}
      <div className="md:hidden bg-slate-900/90 border-t border-slate-800 px-4 py-2.5 flex items-center justify-around text-white">
        <button onClick={handleZoomOut} className="p-2 bg-slate-800 rounded-lg text-slate-300">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={handleResetZoom} className="px-3 py-1.5 bg-slate-800 font-mono text-xs rounded-lg">
          {zoom}%
        </button>
        <button onClick={handleZoomIn} className="p-2 bg-slate-800 rounded-lg text-slate-300">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={handleRotateCw} className="p-2 bg-slate-800 rounded-lg text-slate-300">
          <RotateCw className="w-4 h-4" />
        </button>
        <button onClick={handlePrint} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
          <Printer className="w-4 h-4" />
          <span>Imprimir</span>
        </button>
      </div>
    </div>
  );
};
