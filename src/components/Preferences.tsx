import React, { useState, useRef, useEffect } from 'react';
import SaveButton from './SaveButton';
import { Employee, Student, Group, ClassSession, Transaction, Occurrence, Task, BookCollection, Meeting, Permission, AppAccess } from '../types';
import { 
  Settings, User, Bell, Globe, Sun, Moon, Database, Download, Upload, 
  Check, Image as ImageIcon, ShieldCheck, RefreshCw, AlertCircle, Sparkles, CheckCircle2, GraduationCap,
  RotateCcw, Trash2, AlertTriangle, Crown, Shield, Key, Eye, EyeOff, Mail, Phone, Calendar, CheckSquare
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';
import { isMaster, isSuperAdmin } from '../utils/roles';

interface PreferencesProps {
  activeEmployee: Employee;
  onUpdateEmployee: (emp: Employee) => void;
  // Theme state
  theme?: 'dark' | 'light';
  onToggleTheme?: (theme: 'dark' | 'light') => void;
  onSwitchToStudentMode?: () => void;
  // Backup & Restore system state
  appAccesses?: AppAccess[];
  onUpdateAccess?: (acc: AppAccess) => void;
  onDeleteAccess?: (id: string) => void;
  employees?: Employee[];
  setEmployees?: (emps: Employee[]) => void;
  students?: Student[];
  setStudents?: (stus: Student[]) => void;
  systemData?: {
    students: Student[];
    groups: Group[];
    collections?: BookCollection[];
    classSessions: ClassSession[];
    transactions: Transaction[];
    occurrences: Occurrence[];
    employees: Employee[];
    meetings?: Meeting[];
    tasks?: import('../types').Task[];
    employeeMessages?: import('../types').EmployeeChatMessage[];
    rolePresets?: import('../types').RolePreset[];
  };
  onRestoreSystemData?: (data: any) => void;
  onResetSystemData?: () => Promise<void> | void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
];

const ALL_POSSIBLE_PERMISSIONS: Permission[] = [
  'dashboard', 'calendar', 'students', 'groups', 'collections', 'teacher', 'finance', 'occurrences', 'tasks', 'staff', 'preferences', 'meetings', 'chat',
  'edit:students', 'edit:groups', 'edit:collections', 'edit:finance', 'edit:occurrences', 'edit:tasks', 'edit:staff', 'edit:chat',
  'admin', 'manage:staff', 'manage:roles', 'delete:records', 'delete:superadmin', 'manage:master'
];

const SCREEN_TABS: { id: Permission; label: string }[] = [
  { id: 'dashboard', label: 'Pedagogical Dashboard' },
  { id: 'calendar', label: 'Teacher Calendar' },
  { id: 'students', label: 'Student Directory' },
  { id: 'groups', label: 'Study Groups' },
  { id: 'collections', label: 'Collections' },
  { id: 'teacher', label: 'Teacher Portal' },
  { id: 'finance', label: 'Financials' },
  { id: 'occurrences', label: 'Occurrences' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'chat', label: 'Staff Chat' },
];

const ACTION_PERMS: { id: Permission; label: string }[] = [
  { id: 'edit:students', label: 'Edit & Add Students' },
  { id: 'edit:groups', label: 'Manage Groups & Classes' },
  { id: 'edit:collections', label: 'Manage Collections & Slides' },
  { id: 'edit:finance', label: 'Manage Financials & Tuition' },
  { id: 'edit:occurrences', label: 'Add/Edit Occurrences' },
  { id: 'edit:tasks', label: 'Manage Tasks' },
  { id: 'edit:staff', label: 'Manage Staff & Roles' },
  { id: 'edit:chat', label: 'Moderate Chat & Delete Messages' },
];

export default function Preferences({ 
  activeEmployee, 
  onUpdateEmployee,
  theme = 'dark',
  onToggleTheme,
  onSwitchToStudentMode,
  systemData,
  onRestoreSystemData,
  onResetSystemData,
  appAccesses = [],
  onUpdateAccess,
  onDeleteAccess,
  employees = [],
  setEmployees,
  students = [],
  setStudents
}: PreferencesProps) {
  const { language, setLanguage, t } = useLanguage();
  const [activeMenu, setActiveMenu] = useState<'configuration' | 'account' | 'notifications' | 'users'>('configuration');
  
  // Profile edit state - initialized with all active employee details
  const [name, setName] = useState(activeEmployee.name || '');
  const [username, setUsername] = useState(activeEmployee.username || '');
  const [password, setPassword] = useState(activeEmployee.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [birthday, setBirthday] = useState(activeEmployee.birthday || '');
  const [roleTitle, setRoleTitle] = useState(activeEmployee.roleTitle || '');
  const [email, setEmail] = useState(activeEmployee.email || '');
  const [phone, setPhone] = useState(activeEmployee.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(activeEmployee.avatarUrl || '');
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [isAssociate, setIsAssociate] = useState(isSuperAdmin(activeEmployee));
  const [isMasterRole, setIsMasterRole] = useState(isMaster(activeEmployee));
  const [permissions, setPermissions] = useState<Permission[]>(activeEmployee.permissions || []);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state whenever activeEmployee changes
  useEffect(() => {
    setName(activeEmployee.name || '');
    setUsername(activeEmployee.username || '');
    setPassword(activeEmployee.password || '');
    setBirthday(activeEmployee.birthday || '');
    setRoleTitle(activeEmployee.roleTitle || '');
    setEmail(activeEmployee.email || '');
    setPhone(activeEmployee.phone || '');
    setAvatarUrl(activeEmployee.avatarUrl || '');
    setIsAssociate(isSuperAdmin(activeEmployee));
    setIsMasterRole(isMaster(activeEmployee));
    setPermissions(activeEmployee.permissions || []);
  }, [activeEmployee]);

  const activeIsMasterUser = isMaster(activeEmployee);
  const isAdmin = activeEmployee.isAssociate || activeIsMasterUser || activeEmployee.isCoordinator || activeEmployee.permissions.includes('staff') || activeEmployee.permissions.includes('edit:staff');

  // Configuration state
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(theme);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File is larger than 2MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (customAvatarInput.trim()) {
      setAvatarUrl(customAvatarInput.trim());
      setCustomAvatarInput('');
    }
  };

  const handleTogglePermission = (perm: Permission) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter(p => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const handleGrantFullMasterAccess = () => {
    setIsMasterRole(true);
    setIsAssociate(true);
    setPermissions(ALL_POSSIBLE_PERMISSIONS);
  };

  const handleSaveProfile = () => {
    const isMasterEffective = isMasterRole || roleTitle.trim().toLowerCase() === 'master' || activeIsMasterUser;
    const isSuperEffective = isAssociate || isMasterEffective;

    const updated: Employee = {
      ...activeEmployee,
      name: name.trim() || activeEmployee.name,
      username: username.trim().toLowerCase() || activeEmployee.username,
      password: password || undefined,
      birthday: birthday || undefined,
      roleTitle: isMasterEffective && roleTitle.trim().toLowerCase() === 'master' ? 'Master' : (roleTitle.trim() || activeEmployee.roleTitle),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
      isAssociate: isSuperEffective,
      isMaster: isMasterEffective,
      permissions: isMasterEffective 
        ? ALL_POSSIBLE_PERMISSIONS 
        : (isSuperEffective ? (permissions.length ? permissions : ALL_POSSIBLE_PERMISSIONS.filter(p => p !== 'manage:master')) : permissions)
    };

    onUpdateEmployee(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setCurrentTheme(newTheme);
    onToggleTheme?.(newTheme);
  };

  const handleExportBackup = () => {
    const payload = {
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      exportedBy: activeEmployee.name,
      ...systemData
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault_admin_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupStatus('Backup exported successfully! File downloaded.');
    setTimeout(() => setBackupStatus(null), 3500);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          onRestoreSystemData?.(parsed);
          setBackupStatus(`System backup restored successfully (${new Date().toLocaleTimeString()})!`);
          setTimeout(() => setBackupStatus(null), 4000);
        } else {
          setRestoreError('Invalid JSON structure in uploaded backup file.');
        }
      } catch (err) {
        setRestoreError('Failed to parse backup JSON file. Ensure it is a valid Vault export.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmReset = async () => {
    if (!onResetSystemData) return;
    try {
      setIsResetting(true);
      await onResetSystemData();
      setIsResetModalOpen(false);
      setBackupStatus('All application data has been reset to clean defaults!');
      setTimeout(() => setBackupStatus(null), 4500);
    } catch (e) {
      console.error(e);
      setRestoreError('Failed to reset application data.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-purple-400" />
            {t('systemPreferences', 'System Preferences & Configuration')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('systemPreferencesDesc', 'Configure system settings, staff profile details, language, display themes, and database backups.')}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          <button 
            onClick={() => setActiveMenu('account')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer text-left ${
              activeMenu === 'account' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' 
                : 'text-slate-400 hover:bg-brand-card hover:text-slate-200 border border-transparent'
            }`}
          >
            <User className="w-5 h-5 shrink-0 text-purple-300" />
            <div>
              <span className="font-semibold text-sm block leading-tight flex items-center gap-1">
                Staff Profile
                {activeIsMasterUser && <Crown className="w-3.5 h-3.5 text-amber-400" />}
              </span>
              <span className="text-[10px] opacity-80">Edit all personal & role details</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveMenu('configuration')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition cursor-pointer text-left ${
              activeMenu === 'configuration' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' 
                : 'text-slate-400 hover:bg-brand-card hover:text-slate-200 border border-transparent'
            }`}
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-semibold text-sm block leading-tight">Configuration</span>
              <span className="text-[10px] opacity-80">Language, Themes & Backup</span>
            </div>
          </button>

                    <button
            onClick={() => setActiveMenu('notifications')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${
              activeMenu === 'notifications' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-brand-dark/50'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="font-semibold text-xs">Notifications</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveMenu('users')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${
                activeMenu === 'users' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-brand-dark/50'
              }`}
            >
              <Key className="w-4 h-4" />
              <span className="font-semibold text-xs">Configure Users</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-brand-card rounded-2xl border border-brand-border p-6 shadow-sm min-h-[500px]">
          
          {/* TAB 1: Staff Profile (Full Editing for Every Detail) */}
          {activeMenu === 'account' && (
            <div className="space-y-8 max-w-3xl animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-border">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-purple-600/20 text-purple-300 rounded-xl border border-purple-500/30">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      Edit Profile & Staff Credentials
                      {isMasterRole && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full">
                          <Crown className="w-3 h-3 text-amber-400" /> Master
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Update every single field of your personal account, credentials, contact information, and role privileges.
                    </p>
                  </div>
                </div>

                {activeIsMasterUser && (
                  <button
                    type="button"
                    onClick={handleGrantFullMasterAccess}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Apply Master All-Access
                  </button>
                )}
              </div>

              {/* Profile Avatar Card */}
              <div className="p-5 bg-brand-dark/50 rounded-xl border border-brand-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <h4 className="text-sm font-bold text-slate-200">Profile Picture & Avatar</h4>
                  </div>
                  <span className="text-xs text-purple-400 font-medium">{activeEmployee.name}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative group">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={name} 
                        className={`w-20 h-20 rounded-2xl object-cover shadow-md ${
                          isMasterRole ? 'border-2 border-amber-400 ring-2 ring-amber-500/20' : 'border-2 border-purple-500'
                        }`} 
                      />
                    ) : (
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-bold ${
                        isMasterRole 
                          ? 'bg-amber-500/20 text-amber-200 border-2 border-amber-400' 
                          : 'bg-purple-900/40 text-purple-300 border-2 border-purple-500/40'
                      }`}>
                        {name ? name.charAt(0) : 'U'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer flex items-center shadow-sm">
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        Upload Custom Photo
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleAvatarFileUpload} 
                          className="hidden" 
                        />
                      </label>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="px-3 py-1.5 bg-brand-dark hover:bg-brand-border text-slate-400 hover:text-rose-400 text-xs rounded-lg transition cursor-pointer border border-brand-border"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="Or paste an image URL here..."
                        value={customAvatarInput}
                        onChange={(e) => setCustomAvatarInput(e.target.value)}
                        className="flex-1 bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        className="px-3 py-1.5 bg-brand-card hover:bg-brand-border text-slate-200 text-xs font-medium rounded-lg border border-brand-border transition cursor-pointer"
                      >
                        Apply URL
                      </button>
                    </div>

                    {/* Preset Avatars */}
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Or choose a preset avatar:</span>
                      <div className="flex items-center space-x-2">
                        {PRESET_AVATARS.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Preset ${idx + 1}`}
                            onClick={() => setAvatarUrl(url)}
                            className={`w-8 h-8 rounded-xl object-cover cursor-pointer transition border-2 ${
                              avatarUrl === url ? 'border-purple-500 scale-110 shadow-md' : 'border-transparent hover:border-slate-400'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Credentials & Personal Details */}
              <div className="p-5 bg-brand-dark/50 rounded-xl border border-brand-border space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-brand-border pb-2">
                  Identity, Credentials & Contact Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Full Name *</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Arthur Silva"
                      className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 transition" 
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Username (Login ID) *</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. arthur"
                      className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 transition" 
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-300 font-semibold flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-purple-400" />
                        Login Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showPassword ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password or leave blank"
                        className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 transition pr-10" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      Birthday
                    </label>
                    <input 
                      type="date" 
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 transition [color-scheme:dark]" 
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Role Title *</label>
                    <input 
                      type="text" 
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="e.g. Master, Principal, Lead Teacher"
                      className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 transition" 
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-purple-400" />
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. arthurvsilva2016@gmail.com"
                      className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 transition" 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-purple-400" />
                      Phone Number
                    </label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +55 (11) 98765-4321"
                      className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 transition" 
                    />
                  </div>
                </div>
              </div>

              {/* Elevated Role Switches & Authorities */}
              <div className="p-5 bg-brand-dark/50 rounded-xl border border-brand-border space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-brand-border pb-2">
                  System Role Status & Jurisdiction
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-start space-x-3 p-3 bg-brand-dark border border-amber-500/30 rounded-xl cursor-pointer hover:border-amber-500 transition">
                    <input
                      type="checkbox"
                      checked={isAssociate || isMasterRole}
                      onChange={(e) => {
                        setIsAssociate(e.target.checked);
                        if (!e.target.checked) setIsMasterRole(false);
                      }}
                      className="mt-1 accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-amber-400" /> Super Admin Access
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Unrestricted operational access to all academic, pedagogical, and administrative tools.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent border border-amber-400/50 rounded-xl cursor-pointer hover:border-amber-400 transition">
                    <input
                      type="checkbox"
                      checked={isMasterRole}
                      onChange={(e) => {
                        setIsMasterRole(e.target.checked);
                        if (e.target.checked) {
                          setIsAssociate(true);
                          setPermissions(ALL_POSSIBLE_PERMISSIONS);
                        }
                      }}
                      className="mt-1 accent-amber-400 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-black text-amber-200 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-400" /> Master Account Authority
                      </span>
                      <p className="text-[10px] text-amber-300/80 mt-0.5">
                        Ultimate system authority including deletion rights over Super Admins and full data control.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Permissions Breakdown */}
                <div className={`space-y-4 pt-2 ${isMasterRole ? 'opacity-80' : ''}`}>
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-300">Granular Module & Action Permissions</h5>
                    {isMasterRole && (
                      <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Master has all permissions enabled
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-slate-400 block">Screen & Module Access</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SCREEN_TABS.map(tab => (
                          <label key={tab.id} className="flex items-center space-x-2 p-2 bg-brand-dark border border-brand-border rounded-lg cursor-pointer hover:border-purple-500/50 transition">
                            <input
                              type="checkbox"
                              checked={permissions.includes(tab.id) || isMasterRole}
                              disabled={isMasterRole}
                              onChange={() => handleTogglePermission(tab.id)}
                              className="accent-purple-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-xs text-slate-300">{tab.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-slate-400 block">Action & Editing Rights</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ACTION_PERMS.map(perm => (
                          <label key={perm.id} className="flex items-center space-x-2 p-2 bg-brand-dark border border-brand-border rounded-lg cursor-pointer hover:border-purple-500/50 transition">
                            <input
                              type="checkbox"
                              checked={permissions.includes(perm.id) || isMasterRole}
                              disabled={isMasterRole}
                              onChange={() => handleTogglePermission(perm.id)}
                              className="accent-purple-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-xs text-slate-300">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button Row */}
              <div className="flex items-center justify-between pt-4 border-t border-brand-border">
                {saveSuccess ? (
                  <span className="text-xs text-emerald-400 flex items-center font-bold animate-pulse">
                    <Check className="w-4 h-4 mr-1.5" /> Profile and details updated successfully!
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Changes will be saved to your active account</span>
                )}
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-purple-900/30 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save My Details
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Main System Configuration Tab */}
          {activeMenu === 'configuration' && (
            <div className="space-y-8 max-w-3xl animate-fade-in">
              
              {/* Section 1: Language Selector */}
              <div className="p-5 bg-brand-dark/50 rounded-xl border border-brand-border space-y-3">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-slate-100">{t('languageAndRegion', 'System Language & Regional Locale')}</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Select your active language. Changes are applied instantly across the entire interface and persisted.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {[
                    { id: 'en-US' as Language, label: 'English (US)', flag: '🇺🇸', desc: 'Default Interface (USD $)' },
                    { id: 'pt-BR' as Language, label: 'Português (Brasil)', flag: '🇧🇷', desc: 'Interface em Português (R$)' },
                    { id: 'es-LA' as Language, label: 'Español (LatAm)', flag: '🇪🇸', desc: 'Interface en Español ($)' },
                  ].map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setLanguage(lang.id);
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        language === lang.id
                          ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-sm ring-1 ring-purple-500'
                          : 'bg-brand-card border-brand-border text-slate-400 hover:text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base mr-2">{lang.flag}</span>
                        {language === lang.id && <Check className="w-3.5 h-3.5 text-purple-400 font-bold" />}
                      </div>
                      <div className="text-xs font-bold text-slate-200 mt-1">{lang.label}</div>
                      <div className="text-[10px] text-slate-400">{lang.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Dark / Light Mode Version */}
              <div className="p-5 bg-brand-dark/50 rounded-xl border border-brand-border space-y-3">
                <div className="flex items-center space-x-2">
                  {currentTheme === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  <h3 className="text-sm font-bold text-slate-100">{t('displayTheme', 'Display Theme (Dark / Light Mode)')}</h3>
                </div>
                <p className="text-xs text-slate-400">Toggle between the sleek Violet Darkroom and High-Contrast Light theme.</p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`p-4 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                      currentTheme === 'dark'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-sm ring-1 ring-purple-500'
                        : 'bg-brand-card border-brand-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-950/80 rounded-lg border border-purple-800/60 text-purple-400">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold block text-slate-100">{t('darkMode', 'Dark Mode (Default)')}</span>
                        <span className="text-[10px] text-slate-400">High comfort & violet accents</span>
                      </div>
                    </div>
                    {currentTheme === 'dark' && <Check className="w-4 h-4 text-purple-400" />}
                  </button>

                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`p-4 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                      currentTheme === 'light'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-sm ring-1 ring-purple-500'
                        : 'bg-brand-card border-brand-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/40 text-amber-400">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold block text-slate-100">{t('lightMode', 'Light Mode')}</span>
                        <span className="text-[10px] text-slate-400">Crisp high contrast daylight</span>
                      </div>
                    </div>
                    {currentTheme === 'light' && <Check className="w-4 h-4 text-purple-400" />}
                  </button>
                </div>
              </div>

              {/* Section 3: File Backup for Administrators */}
              <div className="p-5 bg-gradient-to-r from-purple-950/40 via-brand-dark/50 to-brand-card rounded-xl border border-purple-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-slate-100">{t('systemBackup', 'Administrator File Backup & Snapshot')}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                    Admin Tools
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Export complete data records (students, groups, classes, transactions, occurrences, staff) or restore from an existing JSON backup.
                </p>

                {backupStatus && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400 shrink-0" />
                    {backupStatus}
                  </div>
                )}

                {restoreError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 mr-2 text-rose-400 shrink-0" />
                    {restoreError}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={handleExportBackup}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition flex items-center shadow-lg shadow-purple-900/30 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    {t('exportBackup', 'Export Full System Backup (JSON)')}
                  </button>

                  <label className="px-4 py-2 bg-brand-dark hover:bg-brand-border border border-brand-border text-slate-200 hover:text-white text-xs font-semibold rounded-xl transition flex items-center cursor-pointer">
                    <Upload className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                    {t('restoreBackup', 'Restore Backup File')}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>

                  {isAdmin && onResetSystemData && (
                    <button
                      onClick={() => setIsResetModalOpen(true)}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-semibold rounded-xl transition flex items-center cursor-pointer ml-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                      Reset App Data
                    </button>
                  )}
                </div>
              </div>

              {/* Section 4: Student Mode Portal Preview */}
              {onSwitchToStudentMode && (
                <div className="p-5 bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-purple-900/20 rounded-xl border border-purple-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-bold text-slate-100">Student Mode Portal Access</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                      Staff & Admin Preview
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Switch your active session to Student Mode to preview what students experience, test class chats, participate in the Virtual Whiteboard, and verify assignments.
                  </p>
                  <button
                    onClick={() => onSwitchToStudentMode()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-purple-900/30 cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Launch Student Portal Mode</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Notifications */}
          {activeMenu === 'notifications' && (
            <div className="space-y-6 max-w-2xl text-xs animate-fade-in">
              <h3 className="text-base font-bold text-slate-200">Notification Alerts & Delivery</h3>
              <div className="space-y-3">
                {[
                  { title: 'New Student Enrollments', desc: 'Instant banner when a student signs contract or joins group.' },
                  { title: 'Tuition Payment Alerts', desc: 'Notifications on PIX and invoice status changes.' },
                  { title: 'Class Session Reminders', desc: 'Audio / prompt 15 minutes before scheduled Google Meet classes.' },
                  { title: 'Occurrence Escalation', desc: 'High priority alerts when student behavior/absence is logged.' },
                  { title: 'Staff Birthday Alerts', desc: 'Celebration reminders on employee and student birthdays.' }
                ].map((item, i) => (
                  <div key={i} className="p-3.5 bg-brand-dark/60 rounded-xl border border-brand-border flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">{item.title}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{item.desc}</div>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-purple-600 w-4 h-4 cursor-pointer" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Configure Users */}
          {activeMenu === 'users' && isAdmin && (
            <div className="space-y-6 max-w-4xl text-xs animate-fade-in">
              <h3 className="text-base font-bold text-slate-200 flex items-center">
                <Key className="w-5 h-5 mr-2 text-purple-400" />
                Access Control & Accounts
              </h3>
              
              <div className="bg-brand-dark/60 rounded-xl border border-brand-border p-4 space-y-4">
                <p className="text-slate-400">
                  Manage Google Accounts that have attempted to log in. Assign emails to Teachers, Coordinators, or Students.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 font-semibold text-[10px]">Google Account</th>
                        <th className="py-3 px-4 font-semibold text-[10px]">Last Access</th>
                        <th className="py-3 px-4 font-semibold text-[10px]">System Status</th>
                        <th className="py-3 px-4 font-semibold text-[10px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/50">
                      {appAccesses && appAccesses.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                            No access attempts recorded yet.
                          </td>
                        </tr>
                      )}
                      {appAccesses && appAccesses.map(acc => {
                        const isAssignedToEmployee = employees?.find(e => e.email?.toLowerCase() === acc.email.toLowerCase());
                        const isAssignedToStudent = students?.find(s => s.email?.toLowerCase() === acc.email.toLowerCase());
                        
                        let statusText = 'Pending';
                        let statusColor = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
                        if (isAssignedToEmployee) {
                          statusText = 'Staff: ' + isAssignedToEmployee.roleTitle;
                          statusColor = 'text-purple-400 bg-purple-400/10 border-purple-400/20';
                        } else if (isAssignedToStudent) {
                          statusText = 'Student: ' + isAssignedToStudent.name;
                          statusColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
                        }

                        return (
                          <tr key={acc.id} className="hover:bg-brand-card/50 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                {acc.photoURL ? (
                                  <img src={acc.photoURL} alt="" className="w-8 h-8 rounded-full object-cover border border-brand-border" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-brand-border">
                                    <User className="w-4 h-4 text-slate-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-slate-200">{acc.name}</div>
                                  <div className="text-slate-400 text-[11px]">{acc.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {new Date(acc.lastAccess).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColor}`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button 
                                  onClick={() => {
                                    const role = window.prompt('Assign to new Staff/Teacher? Type "teacher" or "coordinator".');
                                    if (role) {
                                      const newEmp = {
                                        id: 'emp-' + Date.now(),
                                        username: acc.email.split('@')[0],
                                        name: acc.name,
                                        roleTitle: role.toLowerCase() === 'coordinator' ? 'Coordinator' : 'Teacher',
                                        permissions: ['dashboard', 'calendar', 'students', 'groups', 'chat'] as any[],
                                        isAssociate: false,
                                        isCoordinator: role.toLowerCase() === 'coordinator',
                                        email: acc.email,
                                        avatarUrl: acc.photoURL
                                      };
                                      setEmployees?.([...(employees || []), newEmp]);
                                      onUpdateAccess?.({ ...acc, status: 'assigned_staff' });
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-brand-dark hover:bg-purple-600/20 text-purple-400 hover:text-purple-300 border border-brand-border hover:border-purple-500/30 rounded-lg transition"
                                >
                                  Assign Staff
                                </button>
                                <button 
                                  onClick={() => {
                                    if (window.confirm('Delete this access log?')) {
                                      onDeleteAccess?.(acc.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-card border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/30">
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Reset All App Data?</h3>
                <p className="text-xs text-rose-300 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 bg-brand-dark/70 rounded-xl border border-brand-border space-y-2 text-xs text-slate-300">
              <p>
                Resetting will restore the system to its initial default state:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pl-1">
                <li>Clear all custom students, groups, and schedules</li>
                <li>Clear financial transactions and occurrences</li>
                <li>Clear custom collections and tasks</li>
                <li>Restore default administrator staff credentials</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 bg-brand-dark hover:bg-brand-border border border-brand-border text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition flex items-center shadow-lg shadow-rose-900/40 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Confirm Full Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
