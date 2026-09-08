import React, { useState } from 'react';
import { Search, Sparkles, Image as ImageIcon, Smile, Flame, Check } from 'lucide-react';

export interface StickerItem {
  id: string;
  name: string;
  url: string;
  category: string;
}

export interface GifItem {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
}

export const CURATED_STICKERS: StickerItem[] = [
  {
    id: 'stk-1',
    name: 'Póliza Aprobada',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&auto=format&fit=crop&q=80',
    category: 'Seguros'
  },
  {
    id: 'stk-2',
    name: 'Bienvenido a la Familia',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
    category: 'Bienvenida'
  },
  {
    id: 'stk-3',
    name: '¡Feliz Cumpleaños!',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=300&auto=format&fit=crop&q=80',
    category: 'Celebración'
  },
  {
    id: 'stk-4',
    name: 'Pago Recibido con Éxito',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=300&auto=format&fit=crop&q=80',
    category: 'Pagos'
  },
  {
    id: 'stk-5',
    name: 'Atención 24/7 Médica',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&auto=format&fit=crop&q=80',
    category: 'Salud'
  },
  {
    id: 'stk-6',
    name: 'Trámite Completado',
    url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300&auto=format&fit=crop&q=80',
    category: 'Seguros'
  }
];

export const CURATED_GIFS: GifItem[] = [
  {
    id: 'gif-1',
    title: 'Thumbs Up / Excelente',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/111ebonMs90YLu/200w.gif'
  },
  {
    id: 'gif-2',
    title: 'Celebración / Aprobado',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif'
  },
  {
    id: 'gif-3',
    title: 'Gracias / Thank You',
    url: 'https://media.giphy.com/media/3oEdva9BUHPIs2SkGk/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/3oEdva9BUHPIs2SkGk/200w.gif'
  },
  {
    id: 'gif-4',
    title: 'Feliz Cumpleaños / Fiesta',
    url: 'https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/g5R9dok94mrIvplmZd/200w.gif'
  },
  {
    id: 'gif-5',
    title: 'Manos a la obra / Trabajando',
    url: 'https://media.giphy.com/media/xT9IgG50Fb7LagOIUt/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/xT9IgG50Fb7LagOIUt/200w.gif'
  },
  {
    id: 'gif-6',
    title: 'Bienvenido / Hola',
    url: 'https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/ASd0Ukj0y3qMM/200w.gif'
  }
];

interface StickerGifPickerProps {
  onSelectMedia: (type: 'sticker' | 'gif', url: string, name: string) => void;
  onClose: () => void;
}

export const StickerGifPicker: React.FC<StickerGifPickerProps> = ({
  onSelectMedia,
  onClose
}) => {
  const [tab, setTab] = useState<'stickers' | 'gifs'>('stickers');
  const [search, setSearch] = useState<string>('');

  const filteredStickers = CURATED_STICKERS.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGifs = CURATED_GIFS.filter((g) =>
    g.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="absolute bottom-full mb-2 right-0 sm:right-10 z-40 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 w-84 max-w-[95vw] animate-in fade-in zoom-in-95"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
        <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab('stickers')}
            className={`px-3 py-1 rounded-lg transition-all ${
              tab === 'stickers'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎨 Stickers
          </button>
          <button
            type="button"
            onClick={() => setTab('gifs')}
            className={`px-3 py-1 rounded-lg transition-all ${
              tab === 'gifs'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎬 GIFs Animados
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-700 font-bold px-1.5 py-0.5"
        >
          Cerrar
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-2">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === 'stickers' ? 'Buscar stickers de seguros...' : 'Buscar GIFs de felicitación, gracias...'}
          className="w-full pl-8 pr-3 py-1.5 bg-slate-100 rounded-xl text-xs font-medium focus:outline-hidden"
        />
      </div>

      {/* Content Grid */}
      <div className="max-h-60 overflow-y-auto p-1">
        {tab === 'stickers' ? (
          <div className="grid grid-cols-3 gap-2">
            {filteredStickers.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                onClick={() => {
                  onSelectMedia('sticker', sticker.url, sticker.name);
                  onClose();
                }}
                className="group relative rounded-xl border border-slate-200 overflow-hidden hover:border-purple-500 hover:shadow-md transition-all p-1 bg-slate-50 flex flex-col items-center cursor-pointer"
              >
                <img
                  src={sticker.url}
                  alt={sticker.name}
                  className="w-16 h-16 object-cover rounded-lg group-hover:scale-105 transition-transform"
                />
                <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center mt-1">
                  {sticker.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredGifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => {
                  onSelectMedia('gif', gif.url, gif.title);
                  onClose();
                }}
                className="group relative rounded-xl border border-slate-200 overflow-hidden hover:border-purple-500 hover:shadow-md transition-all bg-black cursor-pointer aspect-video flex items-center justify-center"
              >
                <img
                  src={gif.previewUrl}
                  alt={gif.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-0 inset-x-0 bg-slate-950/75 text-[9px] text-white font-medium p-0.5 truncate text-center">
                  {gif.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
