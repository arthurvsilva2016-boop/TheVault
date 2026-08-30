import React from 'react';
import { AlertTriangle, Clock, Calendar, Users, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { ConflictDetail } from '../utils/conflictDetector';
import { useLanguage } from '../context/LanguageContext';

interface ConflictWarningModalProps {
  isOpen: boolean;
  conflicts: ConflictDetail[];
  title?: string;
  onCancel: () => void;
  onProceedAnyway: () => void;
  targetDetails?: {
    actionName: string; // e.g. "Assign Group 2 to Gabriel" or "Schedule 1-on-1 Sync"
    dayOrDate: string;
    time: string;
  };
}

export default function ConflictWarningModal({
  isOpen,
  conflicts,
  title,
  onCancel,
  onProceedAnyway,
  targetDetails
}: ConflictWarningModalProps) {
  const { t } = useLanguage();

  if (!isOpen || conflicts.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onCancel}
    >
      <div 
        className="w-full max-w-lg bg-brand-card border-2 border-rose-500/60 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-950/60 via-brand-dark to-brand-card border-b border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/40 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {title || t('conflictDetectedTitle', 'Schedule Conflict Detected')}
              </h3>
              <p className="text-xs text-rose-300/90 font-medium">
                {conflicts.length} overlapping appointment{conflicts.length > 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {targetDetails && (
            <div className="p-3.5 bg-brand-dark/80 rounded-xl border border-brand-border space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Attempted Schedule Action:</span>
              <div className="text-sm font-bold text-purple-300">{targetDetails.actionName}</div>
              <div className="flex items-center space-x-3 text-slate-300 text-[11px] pt-1">
                <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-purple-400" /> {targetDetails.dayOrDate}</span>
                <span className="flex items-center"><Clock className="w-3 h-3 mr-1 text-amber-400" /> {targetDetails.time}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-300 block">
              Conflicting Event{conflicts.length > 1 ? 's' : ''}:
            </span>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
              {conflicts.map((c, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-200 text-xs flex items-center">
                      <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-rose-400 shrink-0" />
                      {c.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30 capitalize">
                      {c.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">{c.description}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Assigning or scheduling during an occupied slot may result in a double-booking. You can cancel to select an alternate time or choose to override.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-brand-dark/90 border-t border-brand-border flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-brand-card hover:bg-brand-border text-slate-200 rounded-xl text-xs font-semibold border border-brand-border transition cursor-pointer"
          >
            {t('chooseDifferentTime', 'Cancel & Change Time')}
          </button>

          <button
            type="button"
            onClick={onProceedAnyway}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-900/30 cursor-pointer flex items-center"
          >
            <span>{t('proceedAnyway', 'Proceed Anyway (Override)')}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
