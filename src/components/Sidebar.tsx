import { useState } from 'react';
import { Tab, Employee } from '../types';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Users, 
  Layers, 
  Library, 
  GraduationCap, 
  DollarSign, 
  AlertCircle, 
  CheckSquare, 
  Video, 
  ShieldCheck, 
  Settings, 
  Sun, 
  Moon, 
  Bell,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  MessageSquare,
  Crown
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import NotificationsModal from './NotificationsModal';
import { isMaster, isSuperAdmin } from '../utils/roles';

interface SidebarProps {
  activeTab: Tab | 'student-profile';
  setActiveTab: (tab: Tab) => void;
  activeEmployee: Employee;
  unreadNotificationsCount?: number;
  notifications?: any[];
  setNotifications?: any;
  employees: Employee[];
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onSwitchEmployee: (id: string) => void;
  onNavigate?: (type: any, id?: string) => void;
  onLogout?: () => void;
  onSwitchToStudentMode?: () => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  activeEmployee,
  employees,
  theme = 'dark',
  onToggleTheme,
  onSwitchEmployee,
  onNavigate,
  onLogout,
  onSwitchToStudentMode,
  unreadNotificationsCount = 0,
  notifications = [],
  setNotifications,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen
}: SidebarProps) {
  const { t } = useLanguage();
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const hasAccess = (tab: Tab) => tab === 'chat' || tab === 'collections' || activeEmployee.isMaster || activeEmployee.isCoordinator || activeEmployee.isAssociate || activeEmployee.permissions.includes(tab);

  const navItems: { id: Tab; label: string; icon: any; section?: string; badge?: string }[] = [
    { id: 'dashboard', label: t('dashboard', 'Dashboard'), icon: LayoutDashboard, section: 'Core' },
    { id: 'calendar', label: t('calendar', 'Calendar'), icon: CalendarIcon, section: 'Core' },
    { id: 'chat', label: t('chat', 'Staff Chat'), icon: MessageSquare, section: 'Core' },
    { id: 'students', label: t('students', 'Students'), icon: Users, section: 'Academic' },
    { id: 'groups', label: t('groups', 'Groups'), icon: Layers, section: 'Academic' },
    { id: 'collections', label: t('collections', 'Collections'), icon: Library, section: 'Academic' },
    { id: 'teacher', label: t('teacherPortal', 'Teacher Portal'), icon: GraduationCap, section: 'Teaching' },
    { id: 'finance', label: t('finance', 'Financials'), icon: DollarSign, section: 'Operations' },
    { id: 'occurrences', label: t('occurrences', 'Occurrences'), icon: AlertCircle, section: 'Operations' },
    { id: 'tasks', label: t('tasks', 'Tasks'), icon: CheckSquare, section: 'Operations' },
    { id: 'meetings', label: t('meetings', 'Meetings'), icon: Video, section: 'Operations' },
    { id: 'staff', label: t('staff', 'Staff Manager'), icon: ShieldCheck, section: 'Admin' },
    { id: 'preferences', label: t('preferences', 'Preferences'), icon: Settings, section: 'Admin' },
  ];

  const handleNavClick = (tabId: Tab) => {
    setActiveTab(tabId);
    if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const handleModalNavigate = (tab: Tab, id?: string) => {
    if (onNavigate && id) {
      if (tab === 'students') onNavigate('student', id);
      else if (tab === 'groups') onNavigate('group', id);
      else onNavigate(tab, id);
    } else {
      setActiveTab(tab);
    }
    if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  // Group items by section
  const sections = ['Core', 'Academic', 'Teaching', 'Operations', 'Admin'];

  return (
    <>
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
        />
      )}
      <aside 
        className={`fixed md:relative top-0 left-0 h-[100dvh] bg-brand-card/95 backdrop-blur-md border-r border-brand-border flex flex-col justify-between shrink-0 transition-all duration-300 z-50 select-none ${
          isCollapsed ? 'w-18' : 'w-64'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Top: Logo & Collapse Button */}
        <div className="p-4 border-b border-brand-border flex items-center justify-between">
          {!isCollapsed ? (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center space-x-2.5 focus:outline-none text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-700 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent leading-none">
                  Vault
                </span>
                <span className="text-[9px] text-slate-400 font-medium tracking-wide mt-0.5">
                  Language System
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-tr from-purple-700 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 cursor-pointer"
              title="Vault Language Management"
            >
              <span className="text-white font-black text-sm">V</span>
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-brand-dark/60 transition cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Middle: Vertical Navigation Screens List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 no-scrollbar">
          {sections.map(section => {
            const sectionItems = navItems.filter(item => item.section === section && hasAccess(item.id));
            if (sectionItems.length === 0) return null;

            return (
              <div key={t(section.toLowerCase() as any, section)} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {section}
                  </div>
                )}
                {sectionItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (item.id === 'students' && activeTab === 'student-profile');

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center rounded-xl font-medium transition duration-150 cursor-pointer ${
                        isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 space-x-3 text-sm'
                      } ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-brand-dark/70'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {!isCollapsed && item.id === 'dashboard' && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-purple-400/20 text-purple-200 font-bold">
                          Timetable
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom: Profile Switcher, Dark/Light, Notifications, and Status */}
        <div className="p-3 border-t border-brand-border bg-brand-dark/40 space-y-3">
          {/* Quick utility icons row */}
          <div className={`flex items-center ${isCollapsed ? 'flex-col space-y-2' : 'justify-between space-x-2'}`}>
            {/* Theme Toggle */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-lg border bg-brand-dark border-brand-border text-slate-400 hover:text-amber-400 transition cursor-pointer shadow-sm hover:border-purple-500/40"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
              </button>
            )}

            {/* Notifications Button */}
            <button
              onClick={() => setIsNotificationsModalOpen(true)}
              className="p-2 rounded-lg border bg-brand-dark border-brand-border text-slate-400 hover:text-slate-200 hover:border-purple-500/50 relative transition cursor-pointer shadow-sm"
              title={t('notifications', 'Notifications') || 'Notifications'}
              aria-label="Open System Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full border border-brand-card animate-pulse"></span>}
            </button>

            {/* Quick Preferences Button */}
            <button
              onClick={() => setActiveTab('preferences')}
              className={`p-2 rounded-lg border transition cursor-pointer shadow-sm ${
                activeTab === 'preferences'
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-brand-dark border-brand-border text-slate-400 hover:text-slate-200 hover:border-purple-500/40'
              }`}
              title="Open System Preferences"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Switch to Student Mode Button */}
            {onSwitchToStudentMode && (
              <button
                onClick={() => onSwitchToStudentMode()}
                className="p-2 rounded-lg border bg-brand-dark border-purple-500/30 text-purple-400 hover:text-white hover:bg-purple-600/30 transition cursor-pointer shadow-sm"
                title="Switch to Student Mode (Student Portal Preview)"
                aria-label="Switch to Student Mode"
              >
                <GraduationCap className="w-4 h-4" />
              </button>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-lg border bg-brand-dark border-brand-border text-slate-400 hover:text-red-400 hover:border-red-500/40 transition cursor-pointer shadow-sm"
                title={t('close', 'Sign Out') || 'Sign Out'}
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Acting As Profile Box */}
          <div className="pt-2 border-t border-brand-border/60">
            {!isCollapsed ? (
              <div className={`flex items-center space-x-2.5 p-2 rounded-xl border ${
                isMaster(activeEmployee)
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-sm ring-1 ring-amber-500/20'
                  : 'bg-brand-dark/80 border-brand-border'
              }`}>
                {activeEmployee.avatarUrl ? (
                  <img
                    src={activeEmployee.avatarUrl}
                    alt={activeEmployee.name}
                    className={`w-7 h-7 rounded-full object-cover shrink-0 ${
                      isMaster(activeEmployee) ? 'border-2 border-amber-400' : 'border border-purple-500/40'
                    }`}
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isMaster(activeEmployee)
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-400'
                      : 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                  }`}>
                    {isMaster(activeEmployee) ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : activeEmployee.name.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col min-w-0 flex-1 cursor-pointer" onClick={() => setActiveTab('preferences')}>
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-slate-400 leading-none">Logged In As</span>
                    {isMaster(activeEmployee) && (
                      <span className="text-[8px] font-black uppercase text-amber-400 bg-amber-500/20 px-1 py-0.2 rounded">Master</span>
                    )}
                  </div>
                  <span className={`text-xs font-bold truncate mt-0.5 ${
                    isMaster(activeEmployee) ? 'text-amber-200' : 'text-purple-300'
                  }`}>
                    {activeEmployee.name} ({isMaster(activeEmployee) ? 'Master' : activeEmployee.roleTitle})
                  </span>
                </div>
                {onLogout && (
                  <button onClick={onLogout} className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition" title="Logout">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  </button>
                )}
              </div>
            ) : (
              <div 
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold cursor-pointer ${
                  isMaster(activeEmployee)
                    ? 'bg-amber-500/30 text-amber-200 border-2 border-amber-400'
                    : 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                }`}
                title={`Acting As: ${activeEmployee.name} (${isMaster(activeEmployee) ? 'Master' : activeEmployee.roleTitle})`}
                onClick={() => setActiveTab('preferences')}
              >
                {isMaster(activeEmployee) ? <Crown className="w-4 h-4 text-amber-400" /> : activeEmployee.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Notifications full-screen/modal overlay */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        onNavigate={handleModalNavigate}
        notifications={notifications}
        setNotifications={setNotifications}
      />
    </>
  );
}
