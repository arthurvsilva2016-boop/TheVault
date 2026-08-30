import React from 'react';
import { Save, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AutoSaveIndicatorProps {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onSaveNow?: () => void;
  className?: string;
}

export default function AutoSaveIndicator({
  lastSaved,
  isSaving,
  hasUnsavedChanges,
  onSaveNow,
  className = ''
}: AutoSaveIndicatorProps) {
  const { t } = useLanguage();

  return (
    <div className={`flex items-center space-x-2 text-[11px] py-1 px-2.5 rounded-lg border bg-brand-dark/70 transition-all ${className} ${
      isSaving 
        ? 'border-purple-500/50 text-purple-300' 
        : hasUnsavedChanges 
          ? 'border-amber-500/40 text-amber-300' 
          : 'border-brand-border text-slate-400'
    }`}>
      {isSaving ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin text-purple-400 shrink-0" />
          <span className="font-medium text-purple-300">{t('savingChanges', 'Saving draft...')}</span>
        </>
      ) : lastSaved ? (
        <>
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate">
            {t('draftAutoSaved', 'Auto-saved')} ({lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
          </span>
        </>
      ) : (
        <>
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{t('draftAutoSaved', 'Auto-save active (30s)')}</span>
        </>
      )}

      {hasUnsavedChanges && onSaveNow && (
        <button
          type="button"
          onClick={onSaveNow}
          className="ml-1 text-[10px] text-purple-400 hover:text-purple-300 hover:underline flex items-center font-semibold cursor-pointer"
          title="Save draft immediately"
        >
          <Save className="w-2.5 h-2.5 mr-0.5" />
          {t('saveNow', 'Save now')}
        </button>
      )}
    </div>
  );
}
