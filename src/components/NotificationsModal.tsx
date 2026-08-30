import React, { useState } from 'react';
import { Bell, X, CheckCheck, Trash2, Calendar, FileText, DollarSign, CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';
import { Tab, AppNotification } from '../types';

interface NotificationsModalProps {
  notifications?: AppNotification[];
  setNotifications?: any;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: Tab, id?: string) => void;
}


export const INITIAL_NOTIFICATIONS: AppNotification[] = [];


export default function NotificationsModal({ isOpen, onClose, onNavigate, notifications = [], setNotifications }: NotificationsModalProps) {
  
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notif: AppNotification) => {
    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
    onClose();
  };

  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.read;
    return n.type === filterType;
  });

  
  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'schedule':
        return <Calendar className="w-5 h-5 text-purple-400" />;
      case 'occurrence':
        return <MessageSquare className="w-5 h-5 text-amber-400" />;
      case 'system':
      default:
        return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 bg-brand-dark/60 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-300">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center">
                System Notifications
                {unreadCount > 0 && (
                  <span className="ml-2.5 px-2 py-0.5 text-xs font-semibold bg-purple-600 text-white rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Stay updated on student actions, invoices, tasks, and meetings.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-brand-dark rounded-xl transition cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & Bulk Action Buttons */}
        <div className="px-6 py-3 bg-brand-dark/40 border-b border-brand-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
            
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'schedule', label: 'Schedule' },
              { id: 'occurrence', label: 'Occurrences' },
              { id: 'system', label: 'System' }
            ].map(tab => (

              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                  filterType === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-brand-card border border-brand-border text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center px-2.5 py-1.5 text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center px-2.5 py-1.5 text-slate-400 hover:text-rose-300 bg-brand-card hover:bg-rose-900/20 border border-brand-border rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-6 overflow-y-auto space-y-3 no-scrollbar flex-1">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Bell className="w-10 h-10 mx-auto text-slate-600 opacity-40" />
              <p className="text-sm font-medium">No notifications in this view.</p>
              <p className="text-xs">You're all caught up with your school workspace alerts!</p>
            </div>
          ) : (
            filteredNotifs.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-start justify-between group ${
                  notif.read
                    ? 'bg-brand-dark/40 border-brand-border/60 opacity-80 hover:opacity-100 hover:border-brand-border'
                    : 'bg-gradient-to-r from-purple-950/40 to-brand-card border-purple-500/40 hover:border-purple-500 shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 min-w-0 pr-3">
                  <div className="p-2.5 bg-brand-dark rounded-xl border border-brand-border shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-sm font-semibold truncate ${notif.read ? 'text-slate-300' : 'text-slate-100'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center space-x-3 mt-2 text-[11px] text-slate-500">
                      <span>{new Date(notif.timestamp).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}</span>
                      
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => deleteNotification(notif.id, e)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-brand-dark rounded-lg transition cursor-pointer"
                    title="Dismiss Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-brand-dark/80 border-t border-brand-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Close Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
