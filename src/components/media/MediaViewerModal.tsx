import React, { useState, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  FileText,
  Play,
  Pause,
  Volume2,
  ExternalLink,
  Printer
} from 'lucide-react';

export interface MediaViewerItem {
  type: 'image' | 'video' | 'audio' | 'gif' | 'sticker' | 'document';
  url: string;
  name: string;
  senderName?: string;
  timestamp?: string;
  size?: string;
}

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MediaViewerItem | null;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !item) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const handleDownload = () => {
    if (!item.url) return;
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.name || 'archivo_descargado';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Bar with Info & Actions */}
      <div
        className="w-full max-w-5xl flex items-center justify-between text-white bg-slate-900/80 px-4 py-3 rounded-2xl border border-slate-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 shrink-0">
            {item.type === 'video' ? (
              <Play className="w-5 h-5" />
            ) : item.type === 'audio' ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
          </div>
          <div className="truncate">
            <h3 className="text-sm font-bold text-slate-100 truncate">{item.name}</h3>
            <p className="text-xs text-slate-400">
              {item.senderName ? `Enviado por: ${item.senderName}` : 'Archivo multimedia'} {item.timestamp && `• ${item.timestamp}`}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {(item.type === 'image' || item.type === 'gif' || item.type === 'sticker') && (
            <>
              <button
                onClick={handleZoomIn}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Acercar (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Alejar (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleRotate}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Rotar 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm ml-1"
            title="Descargar archivo"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descargar</span>
          </button>

          {(item.type === 'image' || item.type === 'document' || item.type === 'gif') && (
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Imprimir documento / imagen"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-1"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Viewer Canvas */}
      <div
        className="flex-1 w-full max-w-5xl flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === 'image' || item.type === 'gif' || item.type === 'sticker' ? (
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={item.url}
              alt={item.name}
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-out',
                maxWidth: '85vw',
                maxHeight: '72vh'
              }}
              className="object-contain rounded-xl shadow-2xl select-none"
            />
          </div>
        ) : item.type === 'video' ? (
          <div className="w-full max-w-3xl max-h-[72vh] rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800 flex items-center justify-center">
            <video
              src={item.url}
              controls
              autoPlay
              className="w-full max-h-[70vh] rounded-xl"
            >
              Tu navegador no soporta reproducción de video.
            </video>
          </div>
        ) : item.type === 'audio' ? (
          <div className="w-full max-w-md bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto shadow-inner">
              <Volume2 className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">{item.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">Nota de audio de voz</p>
            </div>
            <audio src={item.url} controls autoPlay className="w-full rounded-lg">
              Tu navegador no soporta el reproductor de audio.
            </audio>
          </div>
        ) : (
          <div className="w-full max-w-md bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl text-center space-y-4 text-white">
            <FileText className="w-12 h-12 text-purple-400 mx-auto" />
            <div>
              <h4 className="font-bold text-base">{item.name}</h4>
              <p className="text-xs text-slate-400">{item.size || 'Documento adjunto'}</p>
            </div>
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 mx-auto"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Documento</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="text-xs text-slate-400 font-medium">
        Haz clic fuera del visor o presiona la cruz para cerrar.
      </div>
    </div>
  );
};
