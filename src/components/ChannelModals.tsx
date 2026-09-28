import React, { useState, useEffect } from 'react';
import { 
  X, 
  Hash, 
  BookOpen, 
  Megaphone, 
  Briefcase, 
  Sparkles, 
  Flame, 
  Star, 
  Globe, 
  MessageSquare, 
  Shield, 
  HelpCircle, 
  Palette, 
  Video, 
  GraduationCap, 
  Compass, 
  Coffee, 
  Trophy, 
  Code, 
  Music,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Users,
  Check,
  AlertTriangle,
  User,
  ShieldCheck,
  Search,
  CheckCircle2,
  Folder
} from 'lucide-react';
import { ChatChannel, Employee, EmployeeChatMessage } from '../types';
import { isSuperAdmin } from '../utils/roles';

export const CHANNEL_ICON_MAP: Record<string, any> = {
  Hash,
  BookOpen,
  Megaphone,
  Briefcase,
  Sparkles,
  Flame,
  Star,
  Globe,
  MessageSquare,
  Shield,
  HelpCircle,
  Palette,
  Video,
  GraduationCap,
  Compass,
  Coffee,
  Trophy,
  Code,
  Music,
  Folder
};

export const AVAILABLE_CHANNEL_ICONS = [
  { id: 'Hash', label: 'General / Topic', icon: Hash },
  { id: 'BookOpen', label: 'Curriculum / Class', icon: BookOpen },
  { id: 'Megaphone', label: 'Announcements', icon: Megaphone },
  { id: 'Briefcase', label: 'Operations & Admin', icon: Briefcase },
  { id: 'Sparkles', label: 'Innovation / Special', icon: Sparkles },
  { id: 'GraduationCap', label: 'Academic / Pedagogy', icon: GraduationCap },
  { id: 'Flame', label: 'Urgent / Priority', icon: Flame },
  { id: 'Star', label: 'Achievements', icon: Star },
  { id: 'Globe', label: 'International / Languages', icon: Globe },
  { id: 'MessageSquare', label: 'General Lounge', icon: MessageSquare },
  { id: 'Compass', label: 'Planning & Strategy', icon: Compass },
  { id: 'Coffee', label: 'Social & Breakroom', icon: Coffee },
  { id: 'Trophy', label: 'Contests & Exams', icon: Trophy },
  { id: 'Palette', label: 'Creative & Design', icon: Palette },
  { id: 'Code', label: 'Tech & Development', icon: Code },
  { id: 'Music', label: 'Audio & Media', icon: Music }
];

export const CHANNEL_CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'department', label: 'Department' },
  { id: 'projects', label: 'Projects & Events' },
  { id: 'academic', label: 'Academic & Courses' },
  { id: 'custom', label: 'Custom' }
];

// Helper to sanitize channel slug
export const sanitizeChannelName = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 40);
};

// ==========================================
// 1. CREATE CHANNEL / START DM MODAL
// ==========================================
interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEmployee: Employee;
  employees: Employee[];
  existingChannels: ChatChannel[];
  onCreateChannel: (newChannel: ChatChannel, initialMessage?: string) => void;
  onSelectDm: (employee: Employee) => void;
}

export function CreateChannelModal({
  isOpen,
  onClose,
  activeEmployee,
  employees,
  existingChannels,
  onCreateChannel,
  onSelectDm
}: CreateChannelModalProps) {
  const [modalTab, setModalTab] = useState<'channel' | 'dm'>('channel');
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Hash');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [isPrivate, setIsPrivate] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [dmSearch, setDmSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setChannelName('');
      setDescription('');
      setSelectedIcon('Hash');
      setSelectedCategory('general');
      setIsPrivate(false);
      setInitialMessage('');
      setDmSearch('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sanitizedSlug = sanitizeChannelName(channelName);

  const handleSubmitChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanitizedSlug) {
      setError('Please enter a valid channel name.');
      return;
    }

    if (existingChannels.some(c => c.name.toLowerCase() === sanitizedSlug.toLowerCase())) {
      setError(`A channel with the name "#${sanitizedSlug}" already exists.`);
      return;
    }

    const newChannelId = `channel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newChannel: ChatChannel = {
      id: newChannelId,
      name: sanitizedSlug,
      description: description.trim() || `Channel for ${sanitizedSlug}`,
      category: selectedCategory,
      icon: selectedIcon,
      type: 'channel',
      isPrivate,
      isDefault: false,
      createdBy: activeEmployee.id,
      createdByName: activeEmployee.name || activeEmployee.username,
      createdAt: new Date().toISOString()
    };

    onCreateChannel(newChannel, initialMessage.trim() || undefined);
    onClose();
  };

  const filteredDmEmployees = employees.filter(e => 
    e.id !== activeEmployee.id &&
    (e.name.toLowerCase().includes(dmSearch.toLowerCase()) || 
     e.roleTitle.toLowerCase().includes(dmSearch.toLowerCase()) ||
     e.username.toLowerCase().includes(dmSearch.toLowerCase()))
  );

  const SelectedIconComp = CHANNEL_ICON_MAP[selectedIcon] || Hash;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-brand-dark border border-brand-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-brand-border bg-brand-card/70 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New Chat or Channel</h2>
              <p className="text-xs text-slate-400">Add a dedicated room or initiate a direct staff conversation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-brand-dark/90 border-b border-brand-border flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalTab('channel')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
              modalTab === 'channel' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>New Team Channel</span>
          </button>
          <button
            type="button"
            onClick={() => setModalTab('dm')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
              modalTab === 'dm' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Direct Message (1-on-1)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {modalTab === 'channel' ? (
            <form id="create-channel-form" onSubmit={handleSubmitChannel} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-2 text-xs text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Channel Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Channel Name <span className="text-purple-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold text-sm">#</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cambridge-exam-prep, social-media, teachers-weekly"
                    value={channelName}
                    onChange={(e) => {
                      setChannelName(e.target.value);
                      setError(null);
                    }}
                    className="w-full bg-brand-card/90 border border-brand-border rounded-xl pl-8 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 font-medium transition"
                  />
                </div>
                {sanitizedSlug && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Preview slug: <span className="font-mono text-purple-300 font-semibold">#{sanitizedSlug}</span>
                  </p>
                )}
              </div>

              {/* Category & Privacy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-brand-card/90 border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                  >
                    {CHANNEL_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Channel Access
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                      isPrivate 
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
                        : 'bg-brand-card/90 border-brand-border text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {isPrivate ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{isPrivate ? 'Restricted / Private' : 'Public to all staff'}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Toggle</span>
                  </button>
                </div>
              </div>

              {/* Description / Topic */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Topic / Purpose Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What is this channel about? (e.g. Planning, resources, feedback)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-brand-card/90 border border-brand-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none transition"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Channel Icon
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2 bg-brand-card/50 border border-brand-border rounded-xl">
                  {AVAILABLE_CHANNEL_ICONS.map(item => {
                    const IconComp = item.icon;
                    const isSelected = selectedIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedIcon(item.id)}
                        title={item.label}
                        className={`p-2.5 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
                          isSelected 
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 ring-2 ring-purple-400' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Welcome Post */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Initial Welcome Message <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Welcome everyone to the new coordination channel! 👋"
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  className="w-full bg-brand-card/90 border border-brand-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff colleague by name or role..."
                  value={dmSearch}
                  onChange={(e) => setDmSearch(e.target.value)}
                  className="w-full bg-brand-card/90 border border-brand-border rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                {filteredDmEmployees.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No colleagues found matching "{dmSearch}"</p>
                ) : (
                  filteredDmEmployees.map(emp => {
                    const isSuper = isSuperAdmin(emp);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          onSelectDm(emp);
                          onClose();
                        }}
                        className="w-full p-2.5 bg-brand-card/70 hover:bg-purple-600/20 border border-brand-border hover:border-purple-500/40 rounded-xl flex items-center justify-between text-left transition cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt={emp.name} className="w-8 h-8 rounded-full object-cover border border-brand-border" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                              {emp.name ? emp.name.substring(0, 2).toUpperCase() : emp.username.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold text-slate-200 group-hover:text-white">{emp.name || emp.username}</span>
                              {isSuper && <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />}
                            </div>
                            <p className="text-[10px] text-slate-400">{emp.roleTitle}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-purple-400 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                          Start Chat &rarr;
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-brand-border bg-brand-card/70 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>

          {modalTab === 'channel' && (
            <button
              type="submit"
              form="create-channel-form"
              disabled={!sanitizedSlug}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-purple-900/30"
            >
              <Check className="w-4 h-4" />
              <span>Create Channel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. EDIT CHANNEL NAME & DETAILS MODAL
// ==========================================
interface EditChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChatChannel | null;
  existingChannels: ChatChannel[];
  activeEmployee: Employee;
  onUpdateChannel: (updatedChannel: ChatChannel) => void;
  onRequestDelete: (channel: ChatChannel) => void;
}

export function EditChannelModal({
  isOpen,
  onClose,
  channel,
  existingChannels,
  activeEmployee,
  onUpdateChannel,
  onRequestDelete
}: EditChannelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [icon, setIcon] = useState('Hash');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (channel && isOpen) {
      setName(channel.name);
      setDescription(channel.description || '');
      setCategory(channel.category || 'general');
      setIcon(channel.icon || 'Hash');
      setIsPrivate(!!channel.isPrivate);
      setError(null);
    }
  }, [channel, isOpen]);

  if (!isOpen || !channel) return null;

  const sanitizedSlug = sanitizeChannelName(name);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanitizedSlug) {
      setError('Please provide a valid channel name.');
      return;
    }

    // Check for collision with other channels
    if (existingChannels.some(c => c.id !== channel.id && c.name.toLowerCase() === sanitizedSlug.toLowerCase())) {
      setError(`Another channel is already using the name "#${sanitizedSlug}".`);
      return;
    }

    const updated: ChatChannel = {
      ...channel,
      name: sanitizedSlug,
      description: description.trim(),
      category,
      icon,
      isPrivate
    };

    onUpdateChannel(updated);
    onClose();
  };

  const SelectedIcon = CHANNEL_ICON_MAP[icon] || Hash;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-brand-dark border border-brand-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-brand-border bg-brand-card/70 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Edit Channel: #{channel.name}</h2>
              <p className="text-xs text-slate-400">Update channel title, topic description, icon or privacy</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <form id="edit-channel-form" onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-2 text-xs text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Channel Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Channel Name <span className="text-purple-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold text-sm">#</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  className="w-full bg-brand-card/90 border border-brand-border rounded-xl pl-8 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium transition"
                />
              </div>
              {sanitizedSlug && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Formatted slug: <span className="font-mono text-purple-300 font-semibold">#{sanitizedSlug}</span>
                </p>
              )}
            </div>

            {/* Category & Privacy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-brand-card/90 border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                >
                  {CHANNEL_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Privacy Setting
                </label>
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                    isPrivate 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
                      : 'bg-brand-card/90 border-brand-border text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {isPrivate ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isPrivate ? 'Restricted' : 'Public'}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Change</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Topic Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Channel description..."
                className="w-full bg-brand-card/90 border border-brand-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none transition"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Channel Icon
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2 bg-brand-card/50 border border-brand-border rounded-xl">
                {AVAILABLE_CHANNEL_ICONS.map(item => {
                  const IconComp = item.icon;
                  const isSelected = icon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIcon(item.id)}
                      title={item.label}
                      className={`p-2.5 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
                        isSelected 
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 ring-2 ring-purple-400' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-3.5 bg-red-500/5 border border-red-500/20 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-red-400">Delete Channel</h4>
                  <p className="text-[11px] text-slate-400">Permanently remove this channel and all its messages</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestDelete(channel);
                  }}
                  className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-brand-border bg-brand-card/70 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-channel-form"
            disabled={!sanitizedSlug}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-purple-900/30"
          >
            <Check className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. DELETE CHANNEL MODAL
// ==========================================
interface DeleteChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChatChannel | null;
  messageCount: number;
  onConfirmDelete: (channelId: string, deleteMessages: boolean) => void;
}

export function DeleteChannelModal({
  isOpen,
  onClose,
  channel,
  messageCount,
  onConfirmDelete
}: DeleteChannelModalProps) {
  const [deleteMessages, setDeleteMessages] = useState(true);

  if (!isOpen || !channel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-brand-dark border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 mx-auto flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Delete Channel #{channel.name}?</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Are you sure you want to permanently delete this chat channel? This action cannot be undone.
          </p>

          <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl mb-4 text-left space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Channel Name:</span>
              <span className="font-mono text-slate-200 font-bold">#{channel.name}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Messages in channel:</span>
              <span className="text-amber-400 font-semibold">{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer justify-center select-none mb-2">
            <input
              type="checkbox"
              checked={deleteMessages}
              onChange={(e) => setDeleteMessages(e.target.checked)}
              className="rounded bg-brand-card border-brand-border text-purple-600 focus:ring-purple-500"
            />
            <span>Permanently purge all messages in this channel</span>
          </label>
        </div>

        <div className="p-4 border-t border-brand-border bg-brand-card/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(channel.id, deleteMessages);
              onClose();
            }}
            className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-lg shadow-red-900/40"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. CLEAR DM CONVERSATION MODAL
// ==========================================
interface ClearDmModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  messageCount: number;
  onConfirmClear: (dmChannelId: string) => void;
  dmChannelId: string;
}

export function ClearDmModal({
  isOpen,
  onClose,
  employee,
  messageCount,
  onConfirmClear,
  dmChannelId
}: ClearDmModalProps) {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-brand-dark border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Clear Conversation History?</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Clear all {messageCount} message{messageCount !== 1 ? 's' : ''} in your direct conversation with <span className="text-white font-bold">{employee.name || employee.username}</span>?
          </p>
        </div>

        <div className="p-4 border-t border-brand-border bg-brand-card/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmClear(dmChannelId);
              onClose();
            }}
            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-lg shadow-amber-900/40"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Messages</span>
          </button>
        </div>
      </div>
    </div>
  );
}
