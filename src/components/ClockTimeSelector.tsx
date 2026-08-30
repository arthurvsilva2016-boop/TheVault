import React, { useState, useEffect } from 'react';
import SaveButton from './SaveButton';
import { Clock, Check, Sparkles, Sliders } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ClockTimeSelectorProps {
  value: string;
  onChange: (time: string) => void;
  isPersistentConfig?: boolean;
  onSetDefault?: (time: string) => void;
  className?: string;
}

export const CLOCK_PRESET_TIMES = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '14:00',
  '15:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00'
];

export function getPersistentGroupTime(): string {
  return localStorage.getItem('vault_default_group_time') || '19:00';
}

export function setPersistentGroupTime(time: string): void {
  localStorage.setItem('vault_default_group_time', time);
}

export default function ClockTimeSelector({
  value,
  onChange,
  isPersistentConfig = false,
  onSetDefault,
  className = ''
}: ClockTimeSelectorProps) {
  const { t } = useLanguage();
  const [customTime, setCustomTime] = useState(value || '19:00');
  const [showCustom, setShowCustom] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (value) setCustomTime(value);
  }, [value]);

  const handleSelectPreset = (time: string) => {
    onChange(time);
    if (isPersistentConfig) {
      setPersistentGroupTime(time);
      onSetDefault?.(time);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomTime(val);
    onChange(val);
    if (isPersistentConfig) {
      setPersistentGroupTime(val);
      onSetDefault?.(val);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-200 flex items-center">
          <Clock className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
          {isPersistentConfig 
            ? t('selectedGroupTime', 'Default Group Clock Time') 
            : t('time', 'Group Class Time')}
        </label>
        
        {isPersistentConfig && savedFeedback && (
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center animate-fadeIn">
            <Check className="w-3 h-3 mr-1" /> Saved as default!
          </span>
        )}

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-600/20 text-purple-300 border border-purple-500/30">
            {value || '19:00'} BRT
          </span>
        </div>
      </div>

      {/* Preset Clock Items Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {CLOCK_PRESET_TIMES.map(time => {
          const isSelected = value === time;
          return (
            <button
              key={time}
              type="button"
              onClick={() => handleSelectPreset(time)}
              className={`px-2 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer flex items-center justify-center border ${
                isSelected
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/40 ring-1 ring-purple-400'
                  : 'bg-brand-dark hover:bg-purple-950/40 text-slate-300 border-brand-border hover:border-purple-500/40'
              }`}
            >
              {isSelected && <Check className="w-2.5 h-2.5 mr-1 text-white shrink-0" />}
              <span>{time}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Time Option Toggle */}
      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="text-purple-400 hover:text-purple-300 hover:underline flex items-center cursor-pointer"
        >
          <Sliders className="w-3 h-3 mr-1" />
          {showCustom ? 'Hide custom time input' : '+ Set custom specific time'}
        </button>

        {isPersistentConfig && (
          <span className="text-[10px] text-slate-500 italic">
            Applies to newly created groups and quick slots
          </span>
        )}
      </div>

      {showCustom && (
        <div className="p-3 bg-brand-dark rounded-xl border border-brand-border flex items-center space-x-3 animate-fadeIn">
          <label className="text-xs text-slate-300 font-medium shrink-0">Custom Time:</label>
          <input
            type="time"
            value={customTime}
            onChange={handleCustomChange}
            className="flex-1 bg-brand-card border border-brand-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
          />
        </div>
      )}
    </div>
  );
}
