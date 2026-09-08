import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  Download,
  StickyNote,
  Calendar,
  User,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { ClientNote } from '../../types';

interface NoteViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: ClientNote | null;
  clientName?: string;
}

export const NoteViewerModal: React.FC<NoteViewerModalProps> = ({
  isOpen,
  onClose,
  note,
  clientName = 'Cliente'
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedImageIndex(0);
    setZoom(100);
    setRotation(0);
  }, [note?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !note) return null;

  const images = note.images || [];
  const activeImage = images[selectedImageIndex];

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=750');
    if (!printWindow) {
      alert('Por favor habilita ventanas emergentes para imprimir la nota.');
      return;
    }

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nota de Bitácora - ${clientName}</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 24px;
              color: #0f172a;
              background: #ffffff;
            }
            .header {
              border-bottom: 2px solid #7c3aed;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .header h1 { margin: 0; font-size: 20px; color: #1e1b4b; }
            .header p { margin: 4px 0 0; font-size: 12px; color: #64748b; }
            .badge {
              display: inline-block;
              background: #f3e8ff;
              color: #7e22ce;
              font-weight: bold;
              font-size: 11px;
              padding: 3px 8px;
              border-radius: 6px;
              margin-bottom: 12px;
            }
            .content {
              font-size: 14px;
              line-height: 1.6;
              white-space: pre-wrap;
              background: #f8fafc;
              padding: 16px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              margin-bottom: 20px;
            }
            .image-container {
              margin-top: 20px;
              text-align: center;
            }
            .image-container img {
              max-width: 100%;
              max-height: 500px;
              object-fit: contain;
              border-radius: 8px;
              border: 1px solid #cbd5e1;
            }
            .footer {
              margin-top: 30px;
              font-size: 10px;
              color: #94a3b8;
              text-align: center;
              border-top: 1px dashed #cbd5e1;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Nota de Bitácora del Cliente</h1>
            <p>Cliente: <strong>${clientName}</strong> | Registrado por: <strong>${note.userName}</strong> el ${note.createdAt}</p>
          </div>
          <div>
            <span class="badge">Categoría: ${note.category}</span>
          </div>
          <div class="content">${note.content}</div>
          ${
            images.length > 0
              ? `
            <div class="image-container">
              <h3>Imágenes y Capturas Adjuntas (${images.length})</h3>
              ${images.map((img) => `<div style="margin-bottom: 16px;"><img src="${img}" alt="Captura adjunta" /></div>`).join('')}
            </div>
          `
              : ''
          }
          <div class="footer">
            Generado desde el sistema CRM / Gestión Integral de Seguros.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Detalle de Nota de Bitácora</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200">
                  {note.category}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cliente: <strong className="text-slate-700">{clientName}</strong> • {note.createdAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              title="Imprimir Nota e Imágenes"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Note Metadata Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-purple-600" />
              <span>
                Autor: <strong className="text-slate-900">{note.userName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-mono">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{note.createdAt}</span>
            </div>
          </div>

          {/* Text Content */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
            {note.content}
          </div>

          {/* Attached Images Section */}
          {images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  <span>Imágenes y Capturas Adjuntas ({images.length})</span>
                </div>
                {images.length > 1 && (
                  <div className="text-xs text-slate-500 font-mono">
                    Mostrando #{selectedImageIndex + 1} de {images.length}
                  </div>
                )}
              </div>

              {/* Main Image Stage */}
              <div className="bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[300px] max-h-[500px] overflow-hidden border border-slate-800">
                {/* Floating Image Tools */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700 text-white text-xs">
                  <button
                    onClick={() => setZoom((prev) => Math.max(prev - 25, 50))}
                    className="p-1 hover:bg-slate-800 rounded"
                    title="Reducir (-)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono px-1 font-bold">{zoom}%</span>
                  <button
                    onClick={() => setZoom((prev) => Math.min(prev + 25, 250))}
                    className="p-1 hover:bg-slate-800 rounded"
                    title="Aumentar (+)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-3 bg-slate-700 mx-1" />
                  <button
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="p-1 hover:bg-slate-800 rounded"
                    title="Girar 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={activeImage}
                    download={`nota_adjunto_${selectedImageIndex + 1}.png`}
                    className="p-1 hover:bg-slate-800 rounded"
                    title="Descargar"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Left/Right controls if multiple images */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-slate-950/70 hover:bg-purple-600 text-white rounded-full transition-colors z-10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-950/70 hover:bg-purple-600 text-white rounded-full transition-colors z-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Displayed Image */}
                <div
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.15s ease-out'
                  }}
                  className="max-h-[420px] flex items-center justify-center"
                >
                  <img
                    src={activeImage}
                    alt="Adjunto de nota"
                    className="max-h-[400px] max-w-full rounded-lg object-contain shadow-lg"
                  />
                </div>
              </div>

              {/* Thumbnails list if multiple */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto p-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImageIndex(idx);
                        setZoom(100);
                        setRotation(0);
                      }}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImageIndex === idx ? 'border-purple-600 shadow-md scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-white bg-slate-950/70 px-1 rounded">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
