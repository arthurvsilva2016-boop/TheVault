import { useState } from 'react';
import { Tab, Employee } from '../types';
import { Bell, Settings, User, Sun, Moon, Library } from 'lucide-react';
import NotificationsModal from './NotificationsModal';

interface HeaderProps {
  activeTab: Tab | 'student-profile';
  setActiveTab: (tab: Tab) => void;
  activeEmployee: Employee;
  employees: Employee[];
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onSwitchEmployee: (id: string) => void;
  onNavigate?: (type: any, id?: string) => void;
}

export default function Header({ 
  activeTab, 
  setActiveTab, 
  activeEmployee, 
  employees, 
  theme = 'dark',
  onToggleTheme,
  onSwitchEmployee,
  onNavigate
}: HeaderProps) {
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  const getNavClass = (tabId: string) => {
    const isActive = activeTab === tabId || (tabId === 'students' && activeTab === 'student-profile');
    return `px-3.5 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
      isActive ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
    }`;
  };

  const hasAccess = (tab: Tab) => activeEmployee.permissions.includes(tab) || activeEmployee.isAssociate;

  const handleModalNavigate = (tab: Tab, id?: string) => {
    if (onNavigate && id) {
      if (tab === 'students') onNavigate('student', id);
      else if (tab === 'groups') onNavigate('group', id);
      else onNavigate(tab, id);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-brand-border bg-brand-card/80 backdrop-blur px-6 flex items-center justify-between shrink-0 overflow-x-auto no-scrollbar z-30">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 mr-4">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center cursor-pointer focus:outline-none"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600 text-2xl font-black tracking-widest uppercase">
              Vault
            </span>
          </button>
        </div>

        {/* Central Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-brand-dark/60 p-1 rounded-lg border border-brand-border shrink-0">
          {hasAccess('dashboard') && (
            <button onClick={() => setActiveTab('dashboard')} className={getNavClass('dashboard')}>
              Dashboard
            </button>
          )}
          {hasAccess('calendar') && (
            <button onClick={() => setActiveTab('calendar')} className={getNavClass('calendar')}>
              Calendar
            </button>
          )}
          {hasAccess('students') && (
            <button onClick={() => setActiveTab('students')} className={getNavClass('students')}>
              Students
            </button>
          )}
          {hasAccess('groups') && (
            <button onClick={() => setActiveTab('groups')} className={getNavClass('groups')}>
              Groups
            </button>
          )}
          {hasAccess('collections') && (
            <button onClick={() => setActiveTab('collections')} className={getNavClass('collections')}>
              Collections
            </button>
          )}
          {hasAccess('teacher') && (
            <button onClick={() => setActiveTab('teacher')} className={getNavClass('teacher')}>
              Teacher Portal
            </button>
          )}
          {hasAccess('finance') && (
            <button onClick={() => setActiveTab('finance')} className={getNavClass('finance')}>
              Financials
            </button>
          )}
          <div className="w-px h-4 bg-brand-border mx-1"></div>
          {hasAccess('occurrences') && (
            <button onClick={() => setActiveTab('occurrences')} className={getNavClass('occurrences')}>
              Occurrences
            </button>
          )}
          {hasAccess('tasks') && (
            <button onClick={() => setActiveTab('tasks')} className={getNavClass('tasks')}>
              Tasks
            </button>
          )}
          <button onClick={() => setActiveTab('meetings')} className={getNavClass('meetings')}>
            Meetings
          </button>
          {hasAccess('staff') && (
            <>
              <div className="w-px h-4 bg-brand-border mx-1"></div>
              <button onClick={() => setActiveTab('staff')} className={getNavClass('staff')}>
                Staff
              </button>
            </>
          )}
        </nav>

        {/* Right Controls: Employee Switcher, Theme Toggle, Full-screen Notifications Overlay Button, and Preferences */}
        <div className="flex items-center space-x-3 ml-4 shrink-0">
          {/* Quick Dark / Light Mode Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg border bg-brand-dark border-brand-border text-slate-400 hover:text-amber-400 transition cursor-pointer shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
            </button>
          )}

          <div className="flex items-center space-x-2 bg-brand-dark/80 px-2.5 py-1 rounded-xl border border-brand-border">
            {activeEmployee.avatarUrl ? (
              <img 
                src={activeEmployee.avatarUrl} 
                alt={activeEmployee.name} 
                className="w-6 h-6 rounded-full object-cover border border-purple-500/40"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center text-[10px] font-bold border border-purple-500/30">
                {activeEmployee.name.charAt(0)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-none">Acting As</span>
              <select
                value={activeEmployee.id}
                onChange={(e) => onSwitchEmployee(e.target.value)}
                className="bg-transparent text-xs text-purple-300 font-semibold focus:outline-none cursor-pointer py-0.5"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id} className="bg-brand-dark text-slate-200">
                    {emp.name} ({emp.roleTitle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notifications Button -> triggers screen overlay */}
          {/* Preferences Icon Button in Top Right */}
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`p-2 rounded-lg border transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'preferences' 
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30' 
                : 'bg-brand-dark border-brand-border text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
            title="Preferences & Settings"
            aria-label="Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Screen Overlay Modal for Notifications */}
      <NotificationsModal 
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        onNavigate={handleModalNavigate}
      />
    </>
  );
}
