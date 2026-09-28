import { doc, onSnapshot, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useLiveCall } from "../context/LiveCallContext";
import React, { useState, useRef, useEffect } from 'react';
import { 
  Employee, 
  EmployeeChatMessage, 
  ChatAttachment, 
  EmployeeMessageReaction 
} from '../types';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Smile, 
  Trash2, 
  Reply, 
  Pin, 
  Search, 
  Hash, 
  User, 
  FileText, 
  Download, 
  X, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Video,
  VideoIcon,
  MoreVertical, 
  Maximize2, 
  ChevronDown,
  Volume2,
  Lock,
  Megaphone,
  BookOpen,
  Briefcase,
  Palette,
  Columns,
  CheckCircle,
  ArrowLeft,
  Plus,
  Edit2,
  Settings
} from 'lucide-react';
import { isSuperAdmin } from '../utils/roles';
import { useLanguage } from '../context/LanguageContext';
import VirtualWhiteboard from './VirtualWhiteboard';
import { ChatChannel } from '../types';
import { DEFAULT_CHAT_CHANNELS } from '../data';
import { 
  CreateChannelModal, 
  EditChannelModal, 
  DeleteChannelModal, 
  ClearDmModal, 
  CHANNEL_ICON_MAP,
  CHANNEL_CATEGORIES 
} from './ChannelModals';

interface ChatProps {
  activeEmployee: Employee;
  employees: Employee[];
  messages: EmployeeChatMessage[];
  channels?: ChatChannel[];
  onSendMessage: (msg: EmployeeChatMessage) => void;
  onDeleteMessage?: (id: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onTogglePin?: (messageId: string) => void;
  onMarkMessageRead?: (messageId: string, readerId: string) => void;
  onAddChannel?: (channel: ChatChannel) => void;
  onUpdateChannel?: (channel: ChatChannel) => void;
  onDeleteChannel?: (channelId: string, deleteMessages?: boolean) => void;
  onClearDmMessages?: (dmChannelId: string) => void;
}

const EMOJI_OPTIONS = ['👍', '❤️', '👏', '🎉', '🔥', '🚀', '✅', '😂', '💡', '🙏'];

export default function Chat({
  activeEmployee,
  employees,
  messages,
  channels,
  onSendMessage,
  onDeleteMessage,
  onToggleReaction,
  onTogglePin,
  onMarkMessageRead,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
  onClearDmMessages
}: ChatProps) {
  const { t } = useLanguage();
  const { startCall, joinCall, activeCall, setIsCallMinimized } = useLiveCall();

  const [localChannels, setLocalChannels] = useState<ChatChannel[]>(DEFAULT_CHAT_CHANNELS);
  const currentChannels = (channels && channels.length > 0) ? channels : localChannels;

  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [activeDmEmployee, setActiveDmEmployee] = useState<Employee | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [channelToEdit, setChannelToEdit] = useState<ChatChannel | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<ChatChannel | null>(null);
  const [isClearDmOpen, setIsClearDmOpen] = useState(false);
  const [activeChannelMenuId, setActiveChannelMenuId] = useState<string | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const currentChannelInfo = currentChannels.find(c => c.id === activeChannelId);

  const currentCallId = activeDmEmployee ? `vault-room-dm-${[activeEmployee.id, activeDmEmployee.id].sort().join('-')}` : `vault-room-channel-${activeChannelId}`;
  const currentCallTitle = activeDmEmployee ? `Call with ${activeDmEmployee.name}` : `Channel: ${currentChannelInfo?.name || activeChannelId}`;

  const [ongoingCall, setOngoingCall] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'live_calls', currentCallId), (docSnap) => {
      if (docSnap.exists()) {
        setOngoingCall(docSnap.data());
      } else {
        setOngoingCall(null);
      }
    }, (err) => console.error("Error fetching ongoing call:", err));
    return () => unsub();
  }, [currentCallId]);
  
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [replyingTo, setReplyingTo] = useState<EmployeeChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPinnedDrawer, setShowPinnedDrawer] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [chatViewLayout, setChatViewLayout] = useState<'chat' | 'split' | 'whiteboard'>('chat');
  const [mobileView, setMobileView] = useState<'sidebar' | 'thread'>('sidebar');

  // Handle sharing snapshot from Virtual Whiteboard into chat
  const handleShareWhiteboardToChat = (imageUrl: string, noteText?: string) => {
    const newAttachment: ChatAttachment = {
      id: `att-wb-${Date.now()}`,
      name: 'Whiteboard-Snapshot.png',
      url: imageUrl,
      type: 'image',
      mimeType: 'image/png'
    };

    const newMsg: EmployeeChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId: activeEmployee.id,
      senderName: activeEmployee.name || activeEmployee.username,
      senderRole: activeEmployee.roleTitle || 'Staff',
      senderAvatar: activeEmployee.avatarUrl,
      isAssociate: isSuperAdmin(activeEmployee),
      channelId: activeChannelId,
      text: noteText || 'Shared a Virtual Whiteboard snapshot 🎨',
      timestamp: new Date().toISOString(),
      attachments: [newAttachment],
      reactions: []
    };

    onSendMessage(newMsg);
    // Switch to split or chat so they see the shared board
    if (chatViewLayout === 'whiteboard') {
      setChatViewLayout('split');
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on messages change
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [activeChannelId, activeDmEmployee]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Helper for DM Channel ID
  const getDmChannelId = (empId1: string, empId2: string) => {
    const sorted = [empId1, empId2].sort();
    return `dm_${sorted[0]}_${sorted[1]}`;
  };

  // Switch to standard channel
  const handleSelectChannel = (channel: ChatChannel) => {
    setActiveChannelId(channel.id);
    setActiveDmEmployee(null);
    setReplyingTo(null);
    setShowPinnedDrawer(false);
    setMobileView('thread');
    setActiveChannelMenuId(null);
  };

  // Switch to Direct Message
  const handleSelectDm = (emp: Employee) => {
    const dmId = getDmChannelId(activeEmployee.id, emp.id);
    setActiveChannelId(dmId);
    setActiveDmEmployee(emp);
    setReplyingTo(null);
    setShowPinnedDrawer(false);
    setMobileView('thread');
    setActiveChannelMenuId(null);
  };

  // Channel CRUD callbacks
  const handleCreateChannel = (newChannel: ChatChannel, initialMsg?: string) => {
    if (onAddChannel) {
      onAddChannel(newChannel);
    } else {
      setLocalChannels(prev => [...prev, newChannel]);
    }

    if (initialMsg) {
      const welcomeMessage: EmployeeChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderId: activeEmployee.id,
        senderName: activeEmployee.name || activeEmployee.username,
        senderRole: activeEmployee.roleTitle || (activeEmployee.isAssociate ? 'Superadmin' : 'Staff'),
        senderAvatar: activeEmployee.avatarUrl,
        isAssociate: isSuperAdmin(activeEmployee),
        channelId: newChannel.id,
        text: initialMsg,
        timestamp: new Date().toISOString(),
        reactions: []
      };
      onSendMessage(welcomeMessage);
    }

    setActiveChannelId(newChannel.id);
    setActiveDmEmployee(null);
    setMobileView('thread');
  };

  const handleUpdateChannelInfo = (updatedChannel: ChatChannel) => {
    if (onUpdateChannel) {
      onUpdateChannel(updatedChannel);
    } else {
      setLocalChannels(prev => prev.map(c => c.id === updatedChannel.id ? updatedChannel : c));
    }
  };

  const handleDeleteChannelConfirm = (channelId: string, deleteMessages: boolean) => {
    if (onDeleteChannel) {
      onDeleteChannel(channelId, deleteMessages);
    } else {
      setLocalChannels(prev => prev.filter(c => c.id !== channelId));
    }

    if (activeChannelId === channelId) {
      const remaining = currentChannels.filter(c => c.id !== channelId);
      const nextId = remaining[0]?.id || 'general';
      setActiveChannelId(nextId);
      setActiveDmEmployee(null);
    }
  };

  const handleClearDmConfirm = (dmChannelId: string) => {
    if (onClearDmMessages) {
      onClearDmMessages(dmChannelId);
    }
  };

  // Filter messages for current view
  const currentChannelMessages = messages.filter(m => m.channelId === activeChannelId);

  // Mark messages as read
  useEffect(() => {
    if (onMarkMessageRead) {
      currentChannelMessages.forEach(msg => {
        if (msg.senderId !== activeEmployee.id && (!msg.readBy || !msg.readBy.includes(activeEmployee.id))) {
          onMarkMessageRead(msg.id, activeEmployee.id);
        }
      });
    }
  }, [activeChannelId, currentChannelMessages, onMarkMessageRead, activeEmployee.id]);

  // Filter by search query if present
  const displayedMessages = searchQuery.trim()
    ? currentChannelMessages.filter(m => 
        m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.attachments?.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : currentChannelMessages;

  const pinnedMessages = currentChannelMessages.filter(m => m.pinned);

  // File & Image handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, forceType?: 'image' | 'file') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.size > 800 * 1024) {
        alert(`File  is too large (max 800KB). Please use a smaller file.`);
        return;
      }
      const isImg = forceType === 'image' || file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = () => {
        const resultUrl = reader.result as string;
        const newAttachment: ChatAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          url: resultUrl,
          type: isImg ? 'image' : 'file',
          size: file.size,
          mimeType: file.type
        };
        setAttachments(prev => [...prev, newAttachment]);
      };

      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Handle Drag & Drop Files
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.size > 800 * 1024) {
          alert(`File  is too large (max 800KB). Please use a smaller file.`);
          return;
        }
        const isImg = file.type.startsWith('image/');
        const reader = new FileReader();

        reader.onload = () => {
          const resultUrl = reader.result as string;
          const newAttachment: ChatAttachment = {
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            url: resultUrl,
            type: isImg ? 'image' : 'file',
            size: file.size,
            mimeType: file.type
          };
          setAttachments(prev => [...prev, newAttachment]);
        };

        reader.readAsDataURL(file);
      });
    }
  };

  // Handle Clipboard Paste (e.g. screenshots)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          if (file.size > 800 * 1024) {
            alert(`File  is too large (max 800KB).`);
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const resultUrl = reader.result as string;
            const newAttachment: ChatAttachment = {
              id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: `Pasted_Image_${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`,
              url: resultUrl,
              type: 'image',
              size: file.size,
              mimeType: file.type
            };
            setAttachments(prev => [...prev, newAttachment]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;

    const newMessage: EmployeeChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId: activeEmployee.id,
      senderName: activeEmployee.name || activeEmployee.username,
      senderRole: activeEmployee.roleTitle || (activeEmployee.isAssociate ? 'Superadmin' : 'Staff'),
      senderAvatar: activeEmployee.avatarUrl,
      isAssociate: isSuperAdmin(activeEmployee),
      channelId: activeChannelId,
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        senderName: replyingTo.senderName,
        text: replyingTo.text
      } : undefined
    };

    onSendMessage(newMessage);
    setInputText('');
    setAttachments([]);
    setReplyingTo(null);
    setShowEmojiPicker(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getRoleBadgeStyle = (roleTitle: string, isSuper?: boolean) => {
    if (isSuper || roleTitle.toLowerCase().includes('admin') || roleTitle.toLowerCase().includes('director')) {
      return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    }
    if (roleTitle.toLowerCase().includes('coordinator') || roleTitle.toLowerCase().includes('pedagogic')) {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    if (roleTitle.toLowerCase().includes('teacher') || roleTitle.toLowerCase().includes('professor')) {
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    }
    if (roleTitle.toLowerCase().includes('secretary') || roleTitle.toLowerCase().includes('reception')) {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatMessageDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (d.toDateString() === today.toDateString()) return 'Today';
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; items: EmployeeChatMessage[] }[] = [];
  displayedMessages.forEach(msg => {
    const dateLabel = formatMessageDate(msg.timestamp);
    const existingGroup = groupedMessages.find(g => g.date === dateLabel);
    if (existingGroup) {
      existingGroup.items.push(msg);
    } else {
      groupedMessages.push({ date: dateLabel, items: [msg] });
    }
  });

  const filteredEmployees = employees.filter(e => 
    e.id !== activeEmployee.id &&
    (e.name.toLowerCase().includes(sidebarSearch.toLowerCase()) || 
     e.roleTitle.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
     e.username.toLowerCase().includes(sidebarSearch.toLowerCase()))
  );

  return (
    <div 
      className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-4.5rem)] bg-brand-card/70 border border-brand-border rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md relative"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* DRAG OVERLAY */}
      {isDragging && (
        <div className="absolute inset-0 bg-purple-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center border-2 border-dashed border-purple-400 p-8">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 text-purple-300 animate-bounce">
            <Paperclip className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Drop files or images here</h3>
          <p className="text-sm text-purple-200">They will be attached to your next message automatically</p>
        </div>
      )}

      {/* LEFT SIDEBAR: CHANNELS & DIRECT MESSAGES */}
      <aside className={`w-full md:w-80 shrink-0 border-r border-brand-border bg-brand-dark/95 flex flex-col justify-between ${mobileView === 'sidebar' ? 'flex' : 'hidden md:flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-brand-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-100 text-sm tracking-wide">Staff Chat</h2>
                <p className="text-[11px] text-slate-400">Interemployee Network</p>
              </div>
            </div>
            <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter channels & colleagues..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full bg-brand-card/80 border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
            {sidebarSearch && (
              <button 
                onClick={() => setSidebarSearch('')} 
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Channels & DMs Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
          {/* TEAM CHANNELS */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Team Channels</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-400 font-medium">
                  {currentChannels.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer"
                title="Create New Channel or Direct Message"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            {/* Category Filter Pills (if more than 3 channels) */}
            {currentChannels.length > 3 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-2 px-1 custom-scrollbar text-[10px]">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition cursor-pointer ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-brand-card text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All
                </button>
                {CHANNEL_CATEGORIES.map(cat => {
                  const count = currentChannels.filter(c => c.category === cat.id).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition cursor-pointer ${
                        selectedCategoryFilter === cat.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-brand-card text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat.label} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Channels List */}
            <div className="space-y-0.5">
              {currentChannels
                .filter(c => selectedCategoryFilter === 'all' || c.category === selectedCategoryFilter)
                .filter(c => !sidebarSearch.trim() || c.name.toLowerCase().includes(sidebarSearch.toLowerCase()) || (c.description && c.description.toLowerCase().includes(sidebarSearch.toLowerCase())))
                .map(channel => {
                  const isActive = !activeDmEmployee && activeChannelId === channel.id;
                  const IconComp = CHANNEL_ICON_MAP[channel.icon || 'Hash'] || Hash;
                  const channelMessages = messages.filter(m => m.channelId === channel.id);
                  const unreadForChannel = channelMessages.filter(m => m.senderId !== activeEmployee.id && (!m.readBy || !m.readBy.includes(activeEmployee.id))).length;

                  return (
                    <div
                      key={channel.id}
                      className={`group relative flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${
                        isActive 
                          ? 'bg-purple-600/25 text-purple-200 border border-purple-500/40 shadow-sm' 
                          : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectChannel(channel)}
                        className="flex-1 flex items-center space-x-2 truncate cursor-pointer text-left py-0.5 min-w-0"
                      >
                        <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                        <span className="truncate">{channel.name}</span>
                        {channel.isPrivate && (
                          <span title="Private Channel" className="inline-flex shrink-0">
                            <Lock className="w-3 h-3 text-amber-400" />
                          </span>
                        )}
                      </button>

                      {/* Right-side Badges & Actions */}
                      <div className="flex items-center space-x-1 shrink-0">
                        {unreadForChannel > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[9px] font-bold animate-pulse">
                            {unreadForChannel}
                          </span>
                        )}

                        {/* Quick Edit/Delete Dropdown trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveChannelMenuId(activeChannelMenuId === channel.id ? null : channel.id);
                            }}
                            className={`p-1 rounded-lg transition cursor-pointer ${
                              activeChannelMenuId === channel.id 
                                ? 'bg-purple-600/40 text-white' 
                                : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                            title="Channel Settings"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Channel Action Dropdown Popup */}
                          {activeChannelMenuId === channel.id && (
                            <div 
                              className="absolute right-0 top-full mt-1 w-44 bg-slate-900 border border-brand-border rounded-xl shadow-2xl z-50 py-1.5 animate-fadeIn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="px-3 py-1 border-b border-brand-border/60 text-[10px] text-slate-400 font-mono font-bold truncate">
                                #{channel.name}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveChannelMenuId(null);
                                  setChannelToEdit(channel);
                                }}
                                className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 flex items-center space-x-2 transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                                <span>Edit Channel Name</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveChannelMenuId(null);
                                  setChannelToDelete(channel);
                                }}
                                className="w-full px-3 py-1.5 text-left text-xs text-red-300 hover:bg-red-500/20 flex items-center space-x-2 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>Delete Channel</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* DIRECT MESSAGES */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Direct Messages</span>
              <span className="text-[10px] text-slate-500 font-medium">{filteredEmployees.length}</span>
            </div>
            <div className="space-y-1">
              {filteredEmployees.length === 0 ? (
                <p className="text-[11px] text-slate-500 px-2 italic">No colleagues found</p>
              ) : (
                filteredEmployees.map(emp => {
                  const dmId = getDmChannelId(activeEmployee.id, emp.id);
                  const isActive = activeDmEmployee?.id === emp.id;
                  const isSuper = isSuperAdmin(emp);
                  const dmMessageCount = messages.filter(m => m.channelId === dmId).length;

                  return (
                    <button
                      key={emp.id}
                      onClick={() => handleSelectDm(emp)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer text-left group ${
                        isActive 
                          ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' 
                          : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate min-w-0">
                        <div className="relative shrink-0">
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt={emp.name} className="w-7 h-7 rounded-full object-cover border border-brand-border" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                              {emp.name ? emp.name.substring(0, 2).toUpperCase() : emp.username.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border border-brand-dark" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-medium text-slate-200 truncate">{emp.name || emp.username}</span>
                            {isSuper && (
                              <span title="Superadmin" className="inline-flex">
                                <ShieldCheck className="w-3 h-3 text-purple-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{emp.roleTitle}</p>
                        </div>
                      </div>
                      {dmMessageCount > 0 && (
                        <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-1">
                          {dmMessageCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Current Active Employee Info Badge */}
        <div className="p-3 border-t border-brand-border bg-brand-dark/60 flex items-center space-x-2.5">
          <div className="relative">
            {activeEmployee.avatarUrl ? (
              <img src={activeEmployee.avatarUrl} alt={activeEmployee.name} className="w-8 h-8 rounded-full object-cover border border-purple-500/40" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-200">
                {activeEmployee.name ? activeEmployee.name.substring(0, 2).toUpperCase() : activeEmployee.username.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border-2 border-brand-dark" />
          </div>
          <div className="truncate min-w-0">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-slate-200 truncate">{activeEmployee.name || activeEmployee.username}</span>
              {isSuperAdmin(activeEmployee) && (
                <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[8px] font-bold uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate">{activeEmployee.roleTitle || 'Staff Member'}</p>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CHAT AREA */}
      <main className={`flex-1 flex flex-col h-full bg-brand-card/40 overflow-hidden relative ${mobileView === 'thread' ? 'flex' : 'hidden md:flex'}`}>
        {/* Chat Channel Header */}
        <header className="px-3 sm:px-6 py-3 border-b border-brand-border bg-brand-card/90 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 truncate">
            {/* Mobile Back to Channels button */}
            <button
              onClick={() => setMobileView('sidebar')}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer flex items-center shrink-0"
              title="Back to Channels & Direct Messages"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {activeDmEmployee ? (
              <>
                <div className="relative">
                  {activeDmEmployee.avatarUrl ? (
                    <img src={activeDmEmployee.avatarUrl} alt={activeDmEmployee.name} className="w-9 h-9 rounded-full object-cover border border-brand-border" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-200">
                      {activeDmEmployee.name ? activeDmEmployee.name.substring(0, 2).toUpperCase() : activeDmEmployee.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border-2 border-brand-dark" />
                </div>
                <div className="truncate">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-100 text-sm">{activeDmEmployee.name || activeDmEmployee.username}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadgeStyle(activeDmEmployee.roleTitle, isSuperAdmin(activeDmEmployee))}`}>
                      {activeDmEmployee.roleTitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Direct 1-on-1 Conversation • End-to-end synced</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  {(() => {
                    const IconComp = CHANNEL_ICON_MAP[currentChannelInfo?.icon || 'Hash'] || Hash;
                    return <IconComp className="w-5 h-5" />;
                  })()}
                </div>
                <div className="truncate min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-100 text-sm truncate">#{currentChannelInfo?.name || activeChannelId}</h3>
                    {currentChannelInfo && (
                      <button
                        type="button"
                        onClick={() => setChannelToEdit(currentChannelInfo)}
                        className="p-1 text-slate-400 hover:text-purple-300 hover:bg-purple-600/20 rounded-md transition cursor-pointer"
                        title="Edit Channel Name & Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 border border-white/10 text-slate-300 shrink-0">
                      {currentChannelMessages.length} messages
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{currentChannelInfo?.description || 'Staff Team Channel'}</p>
                </div>
              </>
            )}
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center space-x-2">
            {ongoingCall ? (
              <div className="flex items-center space-x-2">
                {activeCall?.roomCode === currentCallId ? (
                  <button
                    onClick={() => setIsCallMinimized(false)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded-lg flex items-center space-x-1.5 text-xs font-semibold transition cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">In Call</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      joinCall(
                        currentCallId,
                        { id: activeEmployee.id, name: activeEmployee.name, role: activeEmployee.roleTitle, avatarUrl: activeEmployee.avatarUrl },
                        currentCallTitle,
                        'meeting'
                      );
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded-lg flex items-center space-x-1.5 text-xs font-semibold transition cursor-pointer shadow-lg shadow-emerald-900/50 animate-pulse"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Join Ongoing Call ({ongoingCall.participants?.length || 0})</span>
                  </button>
                )}
                
                {isSuperAdmin(activeEmployee) && (
                  <button
                    onClick={async () => {
                      try {
                        await deleteDoc(doc(db, 'live_calls', currentCallId));
                      } catch (err) {
                        console.error("Failed to end call", err);
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 rounded-lg flex items-center space-x-1.5 text-xs font-semibold transition cursor-pointer shadow-lg shadow-rose-900/50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">End Call</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  startCall(
                    currentCallId,
                    { id: activeEmployee.id, name: activeEmployee.name, role: activeEmployee.roleTitle, avatarUrl: activeEmployee.avatarUrl },
                    currentCallTitle,
                    'meeting'
                  );
                }}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg flex items-center space-x-1.5 text-xs font-semibold transition cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Start Call</span>
              </button>
            )}

            {/* Whiteboard Layout Toggles */}
            <div className="flex items-center bg-brand-dark/80 border border-brand-border rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setChatViewLayout('chat')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center space-x-1 ${
                  chatViewLayout === 'chat' 
                    ? 'bg-purple-600 text-white font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Chat Only"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chat</span>
              </button>

              <button
                onClick={() => setChatViewLayout('split')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center space-x-1 ${
                  chatViewLayout === 'split' 
                    ? 'bg-purple-600 text-white font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Split View (Chat + Whiteboard)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>

              <button
                onClick={() => setChatViewLayout('whiteboard')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center space-x-1 ${
                  chatViewLayout === 'whiteboard' 
                    ? 'bg-purple-600 text-white font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Virtual Whiteboard"
              >
                <Palette className="w-3.5 h-3.5 text-purple-300" />
                <span className="hidden sm:inline">Whiteboard</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative hidden lg:block">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-brand-dark/80 border border-brand-border rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition w-36 md:w-44"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Pinned Messages Button */}
            {pinnedMessages.length > 0 && (
              <button
                onClick={() => setShowPinnedDrawer(!showPinnedDrawer)}
                className={`p-2 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer ${
                  showPinnedDrawer 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-brand-dark/80 text-slate-300 border-brand-border hover:text-white hover:border-slate-600'
                }`}
                title="Pinned Messages"
              >
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline font-mono">{pinnedMessages.length}</span>
              </button>
            )}

            {/* Header More Actions Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                className="p-2 rounded-lg bg-brand-dark/80 border border-brand-border text-slate-300 hover:text-white hover:border-slate-600 transition cursor-pointer"
                title="Chat Options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {isHeaderMenuOpen && (
                <div 
                  className="absolute right-0 top-full mt-1.5 w-52 bg-slate-900 border border-brand-border rounded-xl shadow-2xl z-50 py-1.5 animate-fadeIn"
                  onClick={() => setIsHeaderMenuOpen(false)}
                >
                  {activeDmEmployee ? (
                    <>
                      <div className="px-3 py-1.5 border-b border-brand-border/60 text-[11px] text-slate-300 font-bold">
                        Direct Message Options
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsClearDmOpen(true)}
                        className="w-full px-3 py-2 text-left text-xs text-amber-300 hover:bg-amber-500/10 flex items-center space-x-2 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Clear DM History</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-1.5 border-b border-brand-border/60 text-[11px] text-slate-300 font-bold truncate">
                        #{currentChannelInfo?.name || activeChannelId}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentChannelInfo) setChannelToEdit(currentChannelInfo);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 flex items-center space-x-2 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Edit Channel Name & Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 flex items-center space-x-2 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Create New Channel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentChannelInfo) setChannelToDelete(currentChannelInfo);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/20 flex items-center space-x-2 transition cursor-pointer border-t border-brand-border/40 mt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Delete Channel</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PINNED MESSAGES DRAWER */}
        {showPinnedDrawer && pinnedMessages.length > 0 && (
          <div className="bg-amber-950/30 border-b border-amber-500/30 p-3 px-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold">
                <Pin className="w-3.5 h-3.5" />
                <span>Pinned Notices & Messages ({pinnedMessages.length})</span>
              </div>
              <button onClick={() => setShowPinnedDrawer(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
              {pinnedMessages.map(pin => (
                <div key={pin.id} className="bg-brand-card/90 border border-brand-border rounded-lg p-2.5 text-xs text-slate-300 flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-purple-300 mr-2">{pin.senderName}:</span>
                    <span>{pin.text}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-2">{formatMessageTime(pin.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FULL WHITEBOARD MODE */}
        {chatViewLayout === 'whiteboard' ? (
          <div className="flex-1 p-3 md:p-4 overflow-hidden h-full">
            <VirtualWhiteboard
              boardId={`staff_${activeChannelId}`}
              title={`Staff Virtual Whiteboard • #${currentChannelInfo?.name || activeDmEmployee?.name || 'whiteboard'}`}
              authorName={activeEmployee.name || activeEmployee.username}
              onShareToChat={handleShareWhiteboardToChat}
              onClose={() => setChatViewLayout('chat')}
              heightClass="h-full"
            />
          </div>
        ) : (
          /* CHAT FEED + OPTIONAL SPLIT WHITEBOARD */
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* CHAT MESSAGING COLUMN */}
            <div className={`flex-1 flex flex-col h-full min-w-0 ${chatViewLayout === 'split' ? 'border-r border-brand-border' : ''}`}>
              {/* MESSAGE FEED */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                {displayedMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                      <MessageSquare className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-300">
                        {searchQuery ? 'No messages found' : `Welcome to #${currentChannelInfo?.name || activeDmEmployee?.name || 'chat'}`}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        {searchQuery 
                          ? `No message matched "${searchQuery}". Try searching for another keyword.` 
                          : 'Start the conversation! Send real-time updates, announcements, or share pedagogical files and images with your team.'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
            groupedMessages.map((group, gIdx) => (
              <div key={group.date || gIdx} className="space-y-4">
                {/* Date Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-brand-border" />
                  </div>
                  <span className="relative px-3 py-0.5 rounded-full bg-brand-dark border border-brand-border text-[11px] font-semibold text-slate-400 tracking-wide uppercase">
                    {group.date}
                  </span>
                </div>

                {/* Messages in this date */}
                <div className="space-y-3">
                  {group.items.map(msg => {
                    const isMe = msg.senderId === activeEmployee.id;
                    const canDelete = isMe || isSuperAdmin(activeEmployee);
                    const isSenderSuper = msg.isAssociate || msg.senderRole.toLowerCase().includes('admin');

                    return (
                      <div 
                        key={msg.id}
                        className={`group relative flex items-start gap-3 p-2 rounded-xl transition ${
                          msg.pinned ? 'bg-amber-500/5 border border-amber-500/20' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="shrink-0 mt-0.5">
                          {msg.senderAvatar ? (
                            <img src={msg.senderAvatar} alt={msg.senderName} className="w-9 h-9 rounded-full object-cover border border-brand-border" />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${
                              isSenderSuper 
                                ? 'bg-purple-900/60 text-purple-200 border-purple-500/40' 
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {msg.senderName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Message Content Body */}
                        <div className="flex-1 min-w-0">
                          {/* Header: Sender Name, Role Badge, Timestamp */}
                          <div className="flex items-center space-x-2 mb-1 flex-wrap">
                            <span className="font-bold text-slate-100 text-xs md:text-sm">{msg.senderName}</span>
                            
                            {/* Role-Based Labeling */}
                            <span className={`px-2 py-0.2 rounded-md text-[10px] font-semibold border ${getRoleBadgeStyle(msg.senderRole, isSenderSuper)}`}>
                              {isSenderSuper && <ShieldCheck className="w-2.5 h-2.5 inline mr-1 -mt-0.5" />}
                              {msg.senderRole}
                            </span>

                            {msg.pinned && (
                              <span className="flex items-center space-x-0.5 text-amber-400 text-[10px] font-medium">
                                <Pin className="w-3 h-3" />
                                <span>Pinned</span>
                              </span>
                            )}

                            <span className="text-[11px] text-slate-500">{formatMessageTime(msg.timestamp)}</span>

                            {isMe && msg.readBy && msg.readBy.length > 0 && (
                              <span className="flex items-center space-x-0.5 text-purple-400 text-[10px] font-medium ml-2">
                                <CheckCircle className="w-3 h-3" />
                                <span>Read</span>
                              </span>
                            )}
                          </div>

                          {/* Replied Snippet if present */}
                          {msg.replyTo && (
                            <div className="mb-2 pl-2.5 py-1 border-l-2 border-purple-500 bg-purple-500/10 rounded-r-md text-xs text-slate-300 flex items-center space-x-2">
                              <Reply className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="font-semibold text-purple-300">{msg.replyTo.senderName}:</span>
                              <span className="truncate text-slate-400">{msg.replyTo.text}</span>
                            </div>
                          )}

                          {/* Message Text */}
                          {msg.text && (
                            <p className="text-xs md:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>
                          )}

                          {/* Attachments (Images & Files) */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2.5 space-y-2">
                              {/* Images Grid */}
                              {msg.attachments.filter(a => a.type === 'image').length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {msg.attachments.filter(a => a.type === 'image').map(img => (
                                    <div 
                                      key={img.id}
                                      onClick={() => setPreviewImage(img.url)}
                                      className="relative group/img cursor-pointer rounded-xl overflow-hidden border border-brand-border bg-brand-dark/80 max-w-xs hover:border-purple-500/60 transition"
                                    >
                                      <img 
                                        src={img.url} 
                                        alt={img.name} 
                                        className="max-h-60 rounded-xl object-cover hover:scale-[1.02] transition duration-200" 
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center">
                                        <div className="p-2 bg-brand-dark/90 rounded-full text-white">
                                          <Maximize2 className="w-4 h-4" />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Files List */}
                              {msg.attachments.filter(a => a.type === 'file').map(file => (
                                <div 
                                  key={file.id}
                                  className="flex items-center justify-between p-3 rounded-xl bg-brand-dark/90 border border-brand-border max-w-sm group/file hover:border-purple-500/50 transition"
                                >
                                  <div className="flex items-center space-x-3 truncate">
                                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="truncate">
                                      <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
                                      <p className="text-[10px] text-slate-500 font-mono">
                                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Document'}
                                      </p>
                                    </div>
                                  </div>
                                  <a
                                    href={file.url}
                                    download={file.name}
                                    className="p-2 rounded-lg bg-brand-card hover:bg-purple-600 text-slate-300 hover:text-white transition shrink-0 ml-2"
                                    title="Download File"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Emoji Reactions Row */}
                          <div className="flex items-center flex-wrap gap-1.5 mt-2">
                            {msg.reactions && msg.reactions.map(r => {
                              const hasReacted = r.users.includes(activeEmployee.id);
                              return (
                                <button
                                  key={r.emoji}
                                  onClick={() => onToggleReaction && onToggleReaction(msg.id, r.emoji)}
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1 border transition cursor-pointer ${
                                    hasReacted 
                                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-200' 
                                      : 'bg-brand-dark border-brand-border text-slate-400 hover:border-slate-600 hover:text-slate-200'
                                  }`}
                                >
                                  <span>{r.emoji}</span>
                                  <span className="font-mono text-[10px]">{r.users.length}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Hover Action Bar */}
                        <div className="opacity-0 group-hover:opacity-100 transition absolute right-3 top-2 bg-brand-dark/95 border border-brand-border rounded-lg shadow-lg p-1 flex items-center space-x-1 z-20 backdrop-blur-md">
                          {/* Quick Emoji Reaction Buttons */}
                          {['👍', '❤️', '🎉', '✅'].map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => onToggleReaction && onToggleReaction(msg.id, emoji)}
                              className="p-1 hover:bg-white/10 rounded text-xs transition cursor-pointer"
                              title={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}

                          {/* Reply Button */}
                          <button
                            onClick={() => setReplyingTo(msg)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
                            title="Reply to message"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>

                          {/* Pin Toggle */}
                          {onTogglePin && (
                            <button
                              onClick={() => onTogglePin(msg.id)}
                              className={`p-1 rounded transition cursor-pointer ${
                                msg.pinned ? 'text-amber-400 hover:bg-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-white/10'
                              }`}
                              title={msg.pinned ? 'Unpin message' : 'Pin message'}
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Button */}
                          {canDelete && onDeleteMessage && (
                            <button
                              onClick={() => {
                                if (window.confirm('Delete this message for everyone?')) {
                                  onDeleteMessage(msg.id);
                                }
                              }}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded transition cursor-pointer"
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT COMPOSER CONTAINER */}
        <footer className="p-4 border-t border-brand-border bg-brand-card/90 backdrop-blur-md shrink-0">
          {/* Reply Context Bar */}
          {replyingTo && (
            <div className="mb-2.5 px-3 py-1.5 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs text-slate-200 animate-fadeIn">
              <div className="flex items-center space-x-2 truncate">
                <Reply className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-slate-400">Replying to</span>
                <span className="font-bold text-purple-300">{replyingTo.senderName}:</span>
                <span className="truncate text-slate-300">{replyingTo.text}</span>
              </div>
              <button 
                onClick={() => setReplyingTo(null)} 
                className="text-slate-400 hover:text-white ml-2 shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Pending Attachments Preview Tray */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2 p-2 bg-brand-dark/80 border border-brand-border rounded-xl">
              {attachments.map((att, idx) => (
                <div key={att.id || idx} className="relative group/att bg-brand-card border border-brand-border rounded-lg p-1.5 flex items-center space-x-2 pr-7">
                  {att.type === 'image' ? (
                    <img src={att.url} alt={att.name} className="w-10 h-10 rounded object-cover border border-brand-border" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-purple-500/20 flex items-center justify-center text-purple-300">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="truncate max-w-[140px]">
                    <p className="text-[11px] font-medium text-slate-200 truncate">{att.name}</p>
                    <p className="text-[9px] text-slate-500 font-mono">
                      {att.size ? `${(att.size / 1024).toFixed(1)} KB` : 'Ready'}
                    </p>
                  </div>
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute right-1 top-1 p-1 bg-brand-dark/90 hover:bg-rose-600 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Emoji Picker Tray */}
          {showEmojiPicker && (
            <div className="mb-2.5 p-2 bg-brand-dark border border-brand-border rounded-xl shadow-xl flex items-center flex-wrap gap-2 animate-fadeIn">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    setInputText(prev => prev + emoji);
                    setShowEmojiPicker(false);
                    textareaRef.current?.focus();
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-lg transition cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Main Input Bar */}
          <div className="flex items-end gap-2 bg-brand-dark/95 border border-brand-border rounded-2xl p-2 focus-within:border-purple-500/60 transition shadow-inner">
            {/* Hidden File & Image Inputs */}
            <input 
              ref={fileInputRef} 
              type="file" 
              multiple 
              onChange={(e) => handleFileUpload(e, 'file')} 
              className="hidden" 
            />
            <input 
              ref={imageInputRef} 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={(e) => handleFileUpload(e, 'image')} 
              className="hidden" 
            />

            {/* Attach Buttons */}
            <div className="flex items-center space-x-1 pb-1">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-purple-300 hover:bg-purple-500/15 rounded-xl transition cursor-pointer"
                title="Share Image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-purple-300 hover:bg-purple-500/15 rounded-xl transition cursor-pointer"
                title="Attach Document or File"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  showEmojiPicker ? 'text-amber-400 bg-amber-500/20' : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/15'
                }`}
                title="Add Emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={
                activeDmEmployee 
                  ? `Message ${activeDmEmployee.name || activeDmEmployee.username}...` 
                  : `Message #${currentChannelInfo?.name || 'channel'}... (Paste images directly)`
              }
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none py-2 px-1 max-h-32 min-h-[38px] custom-scrollbar"
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim() && attachments.length === 0}
              className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl shadow-md shadow-purple-600/30 transition cursor-pointer flex items-center justify-center shrink-0 mb-0.5"
              title="Send Message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500">
            <span>Shift + Enter for new line • Enter to send</span>
            <span>Real-time team synchronization</span>
          </div>
        </footer>
      </div>

      {/* SPLIT WHITEBOARD COLUMN */}
      {chatViewLayout === 'split' && (
        <div className="w-1/2 hidden md:flex flex-col p-3 overflow-hidden bg-slate-950/60">
          <VirtualWhiteboard
            boardId={`staff_split_${activeChannelId}`}
            title={`Staff Whiteboard • #${currentChannelInfo?.name || activeDmEmployee?.name || 'whiteboard'}`}
            authorName={activeEmployee.name || activeEmployee.username}
            onShareToChat={handleShareWhiteboardToChat}
            onClose={() => setChatViewLayout('chat')}
            heightClass="h-full"
          />
        </div>
      )}
    </div>
  )}
</main>

      {/* FULL IMAGE LIGHTBOX MODAL */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl border border-brand-border" 
            />
            <div className="mt-4 flex items-center space-x-3">
              <a 
                href={previewImage} 
                download="chat_image.png" 
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 transition cursor-pointer shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Download Image</span>
              </a>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-brand-card hover:bg-brand-dark text-slate-300 text-xs font-semibold rounded-xl border border-brand-border transition cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANNEL MANAGEMENT MODALS */}
      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateChannel={handleCreateChannel}
        onSelectDm={handleSelectDm}
        existingChannels={currentChannels}
        employees={employees}
        activeEmployee={activeEmployee}
      />

      {channelToEdit && (
        <EditChannelModal
          isOpen={!!channelToEdit}
          channel={channelToEdit}
          onClose={() => setChannelToEdit(null)}
          onUpdateChannel={handleUpdateChannelInfo}
          existingChannels={currentChannels}
          activeEmployee={activeEmployee}
          onRequestDelete={(ch) => setChannelToDelete(ch)}
        />
      )}

      {channelToDelete && (
        <DeleteChannelModal
          isOpen={!!channelToDelete}
          channel={channelToDelete}
          messageCount={messages.filter(m => m.channelId === channelToDelete?.id).length}
          onClose={() => setChannelToDelete(null)}
          onConfirmDelete={handleDeleteChannelConfirm}
        />
      )}

      {activeDmEmployee && (
        <ClearDmModal
          isOpen={isClearDmOpen}
          employee={activeDmEmployee}
          dmChannelId={activeChannelId}
          messageCount={currentChannelMessages.length}
          onClose={() => setIsClearDmOpen(false)}
          onConfirmClear={handleClearDmConfirm}
        />
      )}
    </div>
  );
}
