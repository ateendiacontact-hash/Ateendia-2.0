import React, { useState } from 'react';
import { Smile, Search, Heart, ThumbsUp, Flame, Star, Sparkles, Laugh, Coffee } from 'lucide-react';

export const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '✅', '💼', '⭐'];

export const EMOJI_CATEGORIES = [
  {
    name: 'Frecuentes',
    emojis: ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '✅', '⭐', '🤝', '💯', '🚀', '💼', '📞', '📄', '💳', '🛡️', '🎂']
  },
  {
    name: 'Caritas & Emociones',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪', '😎', '🥳', '😏', '🤔', '🤫', '🤭', '😮', '😯', '😲', '🥺', '😢', '😭', '😱', '🤯', '🥱', '😴', '😷', '🤒', '🤕']
  },
  {
    name: 'Manos & Gestos',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '✍️', '👏', '🙌', '👐', '🤲', '🙏', '💪']
  },
  {
    name: 'Seguros, Oficina & Finanzas',
    emojis: ['🛡️', '🏥', '💊', '🩺', '👨‍⚕️', '👩‍⚕️', '💼', '📄', '📝', '📊', '📈', '📉', '💳', '💵', '💰', '🏦', '🏠', '🚗', '✈️', '🎂', '🎁', '📅', '🕒', '⏳', '📌', '📎', '📞', '📱', '✉️', '📧']
  },
  {
    name: 'Símbolos & Celebración',
    emojis: ['🎉', '🎊', '🎈', '⭐', '🌟', '✨', '🔥', '💥', '💯', '✅', '❌', '⚠️', '🚨', '🟢', '🔴', '🟡', '🟣', '💙', '💚', '💛', '💜', '🤍', '🤎', '🖤', '💔', '❣️', '💕']
  }
];

interface EmojiPickerPopupProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
  position?: 'top' | 'bottom';
}

export const EmojiPickerPopup: React.FC<EmojiPickerPopupProps> = ({
  onSelectEmoji,
  onClose,
  position = 'top'
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Frecuentes');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentCategoryObj = EMOJI_CATEGORIES.find((c) => c.name === activeCategory) || EMOJI_CATEGORIES[0];

  const filteredEmojis = searchQuery.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((emoji, idx, self) => self.indexOf(emoji) === idx)
    : currentCategoryObj.emojis;

  return (
    <div
      className={`absolute z-40 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 w-80 max-w-[92vw] animate-in fade-in zoom-in-95 duration-150 ${
        position === 'top' ? 'bottom-full mb-2 left-0 sm:left-2' : 'top-full mt-2 left-0 sm:left-2'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Quick Reaction Bar on top */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 gap-1 overflow-x-auto no-scrollbar">
        {QUICK_EMOJIS.slice(0, 7).map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
              if (onClose) onClose();
            }}
            className="text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-slate-100 flex items-center justify-center shrink-0"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Search Input (Like Win + .) */}
      <div className="relative mb-2">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar emojis (ej: feliz, seguro, pago)..."
          className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-transparent focus:border-purple-500 rounded-xl text-xs font-medium focus:outline-hidden"
          autoFocus
        />
      </div>

      {/* Category Pills */}
      {!searchQuery && (
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 border-b border-slate-100 text-[11px] font-bold">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(cat.name)}
              className={`px-2 py-1 rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === cat.name
                  ? 'bg-purple-100 text-purple-800 font-extrabold'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Emojis Grid */}
      <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto p-1">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
              if (onClose) onClose();
            }}
            className="w-9 h-9 flex items-center justify-center text-xl rounded-xl hover:bg-purple-50 hover:scale-120 transition-all cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Footer shortcut helper */}
      <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <span>Atajo de teclado:</span>
        <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-slate-600">
          Win + .
        </kbd>
      </div>
    </div>
  );
};
