import React, { useState, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Smartphone,
  Instagram,
  Facebook,
  Send as SendIcon,
  Search,
  Paperclip,
  Smile,
  Mic,
  Play,
  Pause,
  Download,
  Eye,
  FileText,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { WhatsAppConversation, ChannelSource } from '../../types';
import { MediaViewerModal, MediaViewerItem } from '../media/MediaViewerModal';
import { EmojiPickerPopup, QUICK_EMOJIS } from './EmojiPickerPopup';
import { StickerGifPicker } from './StickerGifPicker';
import { VoiceAudioRecorder } from './VoiceAudioRecorder';

export const MultichannelInbox: React.FC<{
  onNavigateToTab?: (tab: string) => void;
}> = ({ onNavigateToTab }) => {
  const {
    currentTenant,
    conversations,
    chatMessages,
    activeConversationId,
    setActiveConversationId,
    clients,
    currentUser,
    tenants
  } = useTenant();

  const [inboxSearch, setInboxSearch] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<ChannelSource | 'all'>('all');
  const [composerInput, setComposerInput] = useState('');
  const [showComposerEmojiPicker, setShowComposerEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItem, setViewerItem] = useState<MediaViewerItem | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv: WhatsAppConversation | undefined = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const activeClient = activeConv?.clientId ? clients.find((c) => c.id === activeConv.clientId) : null;

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (selectedChannelFilter !== 'all' && (c.channelSource || 'whatsapp') !== selectedChannelFilter) {
        return false;
      }
      if (!inboxSearch) return true;
      const term = inboxSearch.toLowerCase().trim();
      const nameMatch = (c.contactName || c.clientName || '').toLowerCase().includes(term);
      const phoneMatch = (c.contactPhone || c.clientPhone || '').includes(term);
      const lastMsgMatch = c.messages.some((m) => (m.content || m.text || '').toLowerCase().includes(term));
      return nameMatch || phoneMatch || lastMsgMatch;
    });
  }, [conversations, selectedChannelFilter, inboxSearch]);

  const channelStats = useMemo(() => {
    const stats: Record<ChannelSource, number> = { whatsapp: 0, instagram: 0, facebook: 0, landing: 0 };
    conversations.forEach((c) => {
      const source = c.channelSource || 'whatsapp';
      stats[source] = (stats[source] || 0) + 1;
    });
    return stats;
  }, [conversations]);

  const totalConversations = conversations.length;

  const getChannelPercentage = (source: ChannelSource) => {
    if (totalConversations === 0) return 0;
    return Math.round((channelStats[source] / totalConversations) * 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const sizeStr = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : 'document';
      handleSendMedia(type, url, file.name, sizeStr);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendMedia = (type: 'image' | 'audio' | 'video' | 'sticker' | 'gif' | 'document', url: string, name: string, size?: string, duration?: number) => {
    if (!activeConv) return;
    setComposerInput('');
  };

  const openMediaViewer = (type: 'image' | 'video' | 'audio' | 'gif' | 'sticker' | 'document', url: string, name: string, senderName?: string, timestamp?: string, size?: string) => {
    setViewerItem({ type, url, name, senderName, timestamp, size });
    setViewerOpen(true);
  };

  const getChannelBadge = (source?: ChannelSource) => {
    const channel = source || 'whatsapp';
    const channelInfo: Record<ChannelSource, { label: string; color: string; bg: string; text: string }> = {
      whatsapp: { label: 'WhatsApp', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700' },
      instagram: { label: 'Instagram', color: 'pink', bg: 'bg-pink-50', text: 'text-pink-700' },
      facebook: { label: 'Facebook', color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700' },
      landing: { label: 'Web Landing', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-700' }
    };
    const info = channelInfo[channel];
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${info.bg} ${info.text}`}>
        {channel === 'whatsapp' && <Smartphone className="w-3 h-3 inline mr-1" />}
        {channel === 'instagram' && <Instagram className="w-3 h-3 inline mr-1" />}
        {channel === 'facebook' && <Facebook className="w-3 h-3 inline mr-1" />}
        {channel === 'landing' && <SendIcon className="w-3 h-3 inline mr-1" />}
        <span>{info.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Header Bar with Marketing Attribution */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">Bandeja Multicanal</h1>
            <p className="text-xs text-slate-500">
              Centraliza mensajes de WhatsApp, Instagram, Facebook y Landing Page
            </p>
          </div>
        </div>

        {/* Marketing Attribution Panel */}
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-700">Atribución de Marketing</h3>
            <select
              value={selectedChannelFilter}
              onChange={(e) => setSelectedChannelFilter(e.target.value as ChannelSource | 'all')}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos los canales</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="landing">Web Landing</option>
            </select>
          </div>

          {/* Channel Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {(['whatsapp', 'instagram', 'facebook', 'landing'] as ChannelSource[]).map((channel) => {
              const count = channelStats[channel] || 0;
              const percent = getChannelPercentage(channel);
              const colors: Record<ChannelSource, string> = { whatsapp: 'emerald', instagram: 'pink', facebook: 'blue', landing: 'amber' };
              return (
                <div key={channel} className="text-center">
                  <div className={`text-xs font-bold text-${colors[channel]}-600`}>
                    <span className={`bg-${colors[channel]}-100 px-2 py-0.5 rounded-full`}>{count}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Inbox Layout */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs h-[calc(100vh-300px)] min-h-[580px] flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-full md:w-84 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/60">
          {/* Search */}
          <div className="p-2.5 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={inboxSearch}
                onChange={(e) => setInboxSearch(e.target.value)}
                placeholder="Buscar por cliente, teléfono..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-semibold text-slate-600">No hay conversaciones</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                const lastMsg = conv.messages[conv.messages.length - 1];
                const channelSource = conv.channelSource || 'whatsapp';
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`p-3 cursor-pointer transition-colors flex items-start gap-3 relative ${
                      isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                        {(conv.contactName || conv.clientName || 'C').charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {conv.contactName || conv.clientName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                          {lastMsg?.timestamp?.slice(-5) || ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5 font-normal">
                        {lastMsg?.content || lastMsg?.text || 'Sin mensajes previos'}
                      </p>
                    </div>

                    {getChannelBadge(channelSource)}

                    {(conv.unreadCount || 0) > 0 && (
                      <div className="absolute right-3 bottom-3 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-slate-50/40 min-w-0">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                  {(activeConv.contactName || activeConv.clientName || 'C').charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span className="truncate">{activeConv.contactName || activeConv.clientName}</span>
                    {getChannelBadge(activeConv.channelSource)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{activeConv.contactPhone}</div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
              {activeConv.messages.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Inicia la conversación aquí.
                </div>
              ) : (
                activeConv.messages.map((msg) => {
                  const isOutbound = msg.direction === 'outbound' || msg.sender === 'agent' || msg.sender === 'system';
                  const channelSource = msg.channelSource || activeConv.channelSource || 'whatsapp';
                  const channelColors: Record<ChannelSource, { bg: string; text: string }> = {
                    whatsapp: { bg: 'bg-emerald-600', text: 'text-white' },
                    instagram: { bg: 'bg-pink-600', text: 'text-white' },
                    facebook: { bg: 'bg-blue-600', text: 'text-white' },
                    landing: { bg: 'bg-amber-600', text: 'text-white' }
                  };
                  const colors = channelColors[channelSource];

                  return (
                    <div key={msg.id} className={`flex flex-col group ${isOutbound ? 'items-end' : 'items-start'}`}>
                      <div className={`relative max-w-[85%] sm:max-w-md ${isOutbound ? colors.bg : 'bg-white border border-slate-200'}`}>
                        <div className={`rounded-2xl px-4 py-2.5 text-xs ${
                          isOutbound ? `${colors.bg} ${colors.text} rounded-br-none` : 'text-slate-800'
                        }`}>
                          {!isOutbound && (
                            <div className="text-[10px] font-black text-slate-600 mb-0.5">
                              {activeConv.contactName || activeConv.clientName || 'Cliente'}
                            </div>
                          )}

                          {isOutbound && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-90 border-b border-white/20 pb-1 mb-1">
                              <User className="w-3 h-3" />
                              <span>{msg.senderName || msg.sender || 'Agente'}</span>
                              {getChannelBadge(channelSource)}
                            </div>
                          )}

                          {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                          
                          <div className={`text-[10px] text-right font-mono flex items-center justify-end gap-1 ${
                            isOutbound ? 'text-white/80' : 'text-slate-400'
                          }`}>
                            <span>{msg.timestamp}</span>
                            {isOutbound && <CheckCheck className="w-3.5 h-3.5 text-white/90" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
                
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>

                <button type="button" onClick={() => setShowComposerEmojiPicker(!showComposerEmojiPicker)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors">
                  <Smile className="w-4 h-4" />
                </button>

                <button type="button" onClick={() => setShowVoiceRecorder(true)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors">
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={composerInput}
                  onChange={(e) => setComposerInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />

                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar</span>
                </button>
              </form>

              {/* Popovers */}
              {showVoiceRecorder && (
                <VoiceAudioRecorder
                  onSendAudio={(url, dur) => { handleSendMedia('audio', url, 'Nota de voz', '100 KB', dur); setShowVoiceRecorder(false); }}
                  onCancel={() => setShowVoiceRecorder(false)}
                />
              )}

              {showStickerPicker && (
                <StickerGifPicker
                  onSelectMedia={(type, url, name) => { handleSendMedia(type, url, name); setShowStickerPicker(false); }}
                  onClose={() => setShowStickerPicker(false)}
                />
              )}

              {showComposerEmojiPicker && (
                <EmojiPickerPopup
                  onSelectEmoji={(emoji) => { setComposerInput(prev => prev + emoji); setShowComposerEmojiPicker(false); }}
                  onClose={() => setShowComposerEmojiPicker(false)}
                  position="top"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs p-8">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-bold text-slate-700">Selecciona una conversación</p>
          </div>
        )}
      </div>

      {/* Media Viewer */}
      <MediaViewerModal isOpen={viewerOpen} onClose={() => setViewerOpen(false)} item={viewerItem} />
    </div>
  );
};