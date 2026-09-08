import React, { useState, useRef } from 'react';
import {
  MessagesSquare,
  Send,
  Hash,
  User,
  Users,
  Search,
  CheckCircle2,
  Sparkles,
  Bot,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Mic,
  Play,
  Pause,
  Download,
  Printer,
  Eye,
  FileText,
  CheckCheck,
  X
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { MediaViewerModal, MediaViewerItem } from '../media/MediaViewerModal';
import { EmojiPickerPopup, QUICK_EMOJIS } from './EmojiPickerPopup';
import { StickerGifPicker } from './StickerGifPicker';
import { VoiceAudioRecorder } from './VoiceAudioRecorder';

export const InternalChatModule: React.FC = () => {
  const {
    chatMessages,
    sendInternalChatMessage,
    toggleInternalChatReaction,
    users,
    currentUser,
    currentTenant
  } = useTenant();

  const [activeChannel, setActiveChannel] = useState<string>('#general');
  const [inputText, setInputText] = useState<string>('');
  const [chatSearch, setChatSearch] = useState<string>('');

  // Rich Media & Reactions State
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [showComposerEmojiPicker, setShowComposerEmojiPicker] = useState<boolean>(false);
  const [showStickerPicker, setShowStickerPicker] = useState<boolean>(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState<boolean>(false);
  const [viewerItem, setViewerItem] = useState<MediaViewerItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tenantUsers = users.filter((u) => u.tenantId === currentTenant.id);

  const channels = [
    { id: '#general', name: 'general', description: 'Canal principal del equipo' },
    { id: '#agentes-salud', name: 'agentes-salud', description: 'Cotizaciones ACA y enrolamientos' },
    { id: '#renovaciones', name: 'renovaciones', description: 'Seguimiento de pólizas por vencer' }
  ];

  const filteredMessages = chatMessages.filter((m) => {
    return m.channelId === activeChannel || m.channel === activeChannel;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendInternalChatMessage(inputText, activeChannel);
    setInputText('');
  };

  const handleSendMedia = (
    type: 'image' | 'audio' | 'video' | 'sticker' | 'gif' | 'document',
    url: string,
    name: string,
    size?: string,
    duration?: number
  ) => {
    sendInternalChatMessage('', activeChannel, type, url, name, size, duration);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const isAud = file.type.startsWith('audio/');
      const sizeStr = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

      const type = isImg ? 'image' : isVid ? 'video' : isAud ? 'audio' : 'document';
      sendInternalChatMessage('', activeChannel, type, url, file.name, sizeStr);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openMediaViewer = (
    type: 'image' | 'video' | 'audio' | 'gif' | 'sticker' | 'document',
    url: string,
    name: string,
    senderName?: string,
    timestamp?: string,
    size?: string
  ) => {
    setViewerItem({
      type,
      url,
      name,
      senderName,
      timestamp,
      size
    });
    setIsViewerOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs h-[78vh] flex overflow-hidden animate-in fade-in">
      {/* Left Sidebar: Channels & Team Members */}
      <div className="w-64 sm:w-72 border-r border-slate-200 bg-slate-50/70 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <MessagesSquare className="w-5 h-5 text-purple-600" />
            <h2 className="font-extrabold text-sm text-slate-900">Chat Interno de Equipo</h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Comunicaciones del equipo en tiempo real</p>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Canales Departamentales
            </div>
            <div className="space-y-0.5">
              {channels.map((ch) => {
                const isActive = activeChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    <Hash className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Team Members */}
          <div>
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Equipo ({tenantUsers.length})
            </div>
            <div className="space-y-1">
              {tenantUsers.map((u) => {
                const isMe = u.id === currentUser?.id;
                const safeName = u.name || 'Usuario';
                const dmChannel = `@${safeName.toLowerCase().replace(/\s+/g, '-')}`;
                const isActive = activeChannel === dmChannel;
                return (
                  <button
                    key={u.id}
                    onClick={() => setActiveChannel(dmChannel)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs font-bold'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="relative">
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center">
                          {u.name.charAt(0)}
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5"></span>
                      </div>
                      <span className="truncate">
                        {u.name} {isMe && '(Tú)'}
                      </span>
                    </div>
                    <span className={`text-[10px] capitalize ${isActive ? 'text-purple-100' : 'text-slate-400'}`}>
                      {u.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Conversation View */}
      <div className="flex-1 flex flex-col bg-slate-50/30 min-w-0">
        {/* Chat Room Header */}
        <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-purple-100 text-purple-700 font-bold text-xs">
              {activeChannel.startsWith('#') ? '#' : '@'}
            </span>
            <div>
              <h3 className="font-extrabold text-xs text-slate-900">{activeChannel}</h3>
              <p className="text-[10px] text-slate-400">Canal activo • {currentTenant.name}</p>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              <MessagesSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <div>Inicio de la conversación en {activeChannel}</div>
              <p className="text-[11px] mt-1">Escribe un mensaje para empezar.</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMine = (msg.senderUserId || msg.senderId) === currentUser.id;

              return (
                <div key={msg.id} className="flex items-start gap-3 group relative">
                  {/* User Avatar */}
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {msg.senderName.charAt(0)}
                  </div>

                  <div className="space-y-1 max-w-xl flex-1 relative">
                    {/* Header: Sender Name & Timestamp */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                    </div>

                    {/* Hover Quick Reaction Bar (Win + .) */}
                    <div className="absolute top-0 right-0 hidden group-hover:flex items-center gap-1 bg-white px-2 py-0.5 rounded-full shadow-md border border-slate-200 z-10">
                      {QUICK_EMOJIS.slice(0, 5).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => toggleInternalChatReaction(msg.id, emoji)}
                          className="text-xs hover:scale-130 transition-transform p-0.5"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)
                        }
                        className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-purple-600"
                        title="Más emojis (Win + .)"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Win + . Emoji Picker Popup */}
                    {activeReactionMsgId === msg.id && (
                      <EmojiPickerPopup
                        onSelectEmoji={(emoji) => {
                          toggleInternalChatReaction(msg.id, emoji);
                          setActiveReactionMsgId(null);
                        }}
                        onClose={() => setActiveReactionMsgId(null)}
                        position="top"
                      />
                    )}

                    {/* Message Bubble */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl rounded-tl-none shadow-xs text-xs text-slate-800 leading-relaxed space-y-2">
                      {/* Image Preview */}
                      {msg.mediaType === 'image' && msg.mediaUrl && (
                        <div
                          className="rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() =>
                            openMediaViewer(
                              'image',
                              msg.mediaUrl!,
                              msg.mediaName || 'Imagen Chat',
                              msg.senderName,
                              msg.timestamp,
                              msg.mediaSize
                            )
                          }
                        >
                          <img
                            src={msg.mediaUrl}
                            alt={msg.mediaName || 'Imagen'}
                            className="max-h-60 rounded-xl object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Sticker / GIF Preview */}
                      {(msg.mediaType === 'sticker' || msg.mediaType === 'gif') && msg.mediaUrl && (
                        <div
                          className="rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform max-w-[200px]"
                          onClick={() =>
                            openMediaViewer(
                              msg.mediaType === 'gif' ? 'gif' : 'sticker',
                              msg.mediaUrl!,
                              msg.mediaName || 'Sticker / GIF',
                              msg.senderName,
                              msg.timestamp
                            )
                          }
                        >
                          <img
                            src={msg.mediaUrl}
                            alt="Sticker o GIF"
                            className="rounded-xl object-contain max-h-48"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Audio Voice Note Preview */}
                      {msg.mediaType === 'audio' && (
                        <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-xl border border-purple-200/50">
                          <button
                            type="button"
                            onClick={() => setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)}
                            className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs"
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-1 h-4">
                              <span className="w-1 bg-purple-600 h-2 rounded-full"></span>
                              <span className="w-1 bg-purple-600 h-4 rounded-full"></span>
                              <span className="w-1 bg-purple-600 h-3 rounded-full"></span>
                              <span className="w-1 bg-purple-600 h-5 rounded-full"></span>
                              <span className="w-1 bg-purple-600 h-2 rounded-full"></span>
                            </div>
                            <div className="text-[10px] text-purple-700 font-mono mt-0.5">
                              0:{String(msg.mediaDuration || 4).padStart(2, '0')} Nota de Voz
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Video Preview */}
                      {msg.mediaType === 'video' && msg.mediaUrl && (
                        <div
                          className="relative rounded-xl overflow-hidden bg-black cursor-pointer group/vid max-w-sm"
                          onClick={() =>
                            openMediaViewer(
                              'video',
                              msg.mediaUrl!,
                              msg.mediaName || 'Video Chat',
                              msg.senderName,
                              msg.timestamp,
                              msg.mediaSize
                            )
                          }
                        >
                          <video src={msg.mediaUrl} className="w-full max-h-52 object-cover rounded-xl" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/vid:bg-black/50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-white/90 text-purple-700 flex items-center justify-center shadow-lg">
                              <Play className="w-5 h-5 ml-0.5" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Document Preview */}
                      {msg.mediaType === 'document' && (
                        <div
                          className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() =>
                            openMediaViewer(
                              'document',
                              msg.mediaUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                              msg.mediaName || 'Documento adjunto',
                              msg.senderName,
                              msg.timestamp,
                              msg.mediaSize
                            )
                          }
                        >
                          <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate">{msg.mediaName || 'Documento.pdf'}</p>
                            <p className="text-[10px] text-slate-500">{msg.mediaSize || '1.2 MB'} • Archivo</p>
                          </div>
                          <Download className="w-4 h-4 text-slate-400" />
                        </div>
                      )}

                      {/* Text Content */}
                      {msg.content && <p className="whitespace-pre-wrap">{msg.content || msg.text}</p>}
                    </div>

                    {/* Reaction Badges Pill Container */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {msg.reactions.map((r, idx) => {
                          const isMineReaction = r.users.includes(currentUser.id);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleInternalChatReaction(msg.id, r.emoji)}
                              className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all ${
                                isMineReaction
                                  ? 'bg-purple-100 border border-purple-300 text-purple-900 font-extrabold scale-105 shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
                              }`}
                              title={`Reacción de ${r.users.length} personas`}
                            >
                              <span>{r.emoji}</span>
                              <span className="text-[10px] font-bold">{r.users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chat Input & Media Composer */}
        <div className="p-3.5 bg-white border-t border-slate-200 relative">
          {/* Sticker / GIF Picker Popup */}
          {showStickerPicker && (
            <StickerGifPicker
              onSelectMedia={(type, url, name) => {
                handleSendMedia(type, url, name);
                setShowStickerPicker(false);
              }}
              onClose={() => setShowStickerPicker(false)}
            />
          )}

          {/* Emoji Picker for Composer */}
          {showComposerEmojiPicker && (
            <EmojiPickerPopup
              onSelectEmoji={(emoji) => {
                setInputText((prev) => prev + emoji);
                setShowComposerEmojiPicker(false);
              }}
              onClose={() => setShowComposerEmojiPicker(false)}
              position="top"
            />
          )}

          {/* Voice Recorder Overlay */}
          {showVoiceRecorder ? (
            <VoiceAudioRecorder
              onSendAudio={(audioUrl, duration) => {
                handleSendMedia('audio', audioUrl, 'Nota de Voz Chat Interno', '100 KB', duration);
                setShowVoiceRecorder(false);
              }}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              />

              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                title="Adjuntar Archivo o Imagen"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Stickers / GIFs Button */}
              <button
                type="button"
                onClick={() => setShowStickerPicker(!showStickerPicker)}
                className="p-2 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                title="Stickers y GIFs"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              {/* Emojis Button (Win + .) */}
              <button
                type="button"
                onClick={() => setShowComposerEmojiPicker(!showComposerEmojiPicker)}
                className="p-2 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                title="Emojis (Win + .)"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Voice Note Button */}
              <button
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                className="p-2 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                title="Grabar Nota de Voz"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Main Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Escribe un mensaje en ${activeChannel}...`}
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-purple-500 font-medium"
              />

              {/* Send Button */}
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-98 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Global Media Viewer Modal (Zoom, Rotate, Print, Download) */}
      <MediaViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        item={viewerItem}
      />
    </div>
  );
};
