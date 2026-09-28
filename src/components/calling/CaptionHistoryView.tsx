import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Captions, Globe, Search, ArrowDown, Copy, Check, FileDown, 
  Trash2, Volume2, Mic, Radio, Square, MessageSquare, 
  Send, RefreshCw, X, ChevronDown, Sparkles
} from 'lucide-react';
import { 
  SUPPORTED_LANGUAGES, 
  SupportedLanguage, 
  QUICK_SPEECH_PRESETS,
  speakText 
} from '../../utils/translationService';

export interface CaptionLogItem {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerRole?: string;
  originalText: string;
  translatedText?: string;
  sourceLang?: string;
  targetLang?: string;
  timestamp: string;
  isSelf?: boolean;
}

interface CaptionHistoryViewProps {
  captionsLog: CaptionLogItem[];
  preferredLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  voiceRecognitionMode: 'push-to-talk' | 'hands-free';
  onToggleVoiceMode: (mode: 'push-to-talk' | 'hands-free') => void;
  audioLevel?: number;
  interimSpeechText?: string;
  speechEngineStatus?: 'idle' | 'listening' | 'error' | 'unsupported' | 'permission_denied' | 'muted';
  onRestartSpeechEngine?: () => void;
  onSendCaptionToChat?: (text: string) => void;
  onClearCaptions?: () => void;
  onTriggerPresetSpeech?: (presetText: string) => void;
  onCloseOverlay?: () => void;
  isOverlay?: boolean;
}

export const CaptionHistoryView: React.FC<CaptionHistoryViewProps> = ({
  captionsLog,
  preferredLanguage,
  onLanguageChange,
  isRecording,
  onToggleRecording,
  voiceRecognitionMode,
  onToggleVoiceMode,
  audioLevel = 0,
  interimSpeechText = '',
  speechEngineStatus = 'idle',
  onRestartSpeechEngine,
  onSendCaptionToChat,
  onClearCaptions,
  onTriggerPresetSpeech,
  onCloseOverlay,
  isOverlay = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasCopiedAll, setHasCopiedAll] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [showPresetsTray, setShowPresetsTray] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [interimTranslation, setInterimTranslation] = useState<string>('');

  // Close language dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time translation for live interim speech
  useEffect(() => {
    let isMounted = true;
    if (interimSpeechText && interimSpeechText.trim()) {
      import('../../utils/translationService').then(({ translateCaption }) => {
        translateCaption(interimSpeechText.trim(), preferredLanguage.code).then(translated => {
          if (isMounted) {
            setInterimTranslation(translated);
          }
        });
      });
    } else {
      setInterimTranslation('');
    }
    return () => {
      isMounted = false;
    };
  }, [interimSpeechText, preferredLanguage.code]);

  // Automatic smooth scrolling pinned to the latest captions and live speech
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
    endRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
  }, []);

  // Trigger scroll whenever captions list changes, new words are spoken, or view mounts
  useEffect(() => {
    if (isAutoScrollEnabled) {
      // Immediate scroll followed by animation frame to catch layout expansion
      scrollToBottom(true);
      const timer = setTimeout(() => scrollToBottom(true), 80);
      return () => clearTimeout(timer);
    }
  }, [captionsLog, interimSpeechText, interimTranslation, isAutoScrollEnabled, scrollToBottom]);

  // Scroll to bottom on initial mount or when overlay opens
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      scrollToBottom(false);
    }, 150);
    return () => clearTimeout(initialTimer);
  }, [scrollToBottom]);

  // Handle scroll event to detect if user manually scrolled up
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 75;
    if (isAutoScrollEnabled !== isNearBottom) {
      setIsAutoScrollEnabled(isNearBottom);
    }
  };

  // Filter captions
  const filteredCaptions = captionsLog.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.speakerName.toLowerCase().includes(q) ||
      c.originalText.toLowerCase().includes(q) ||
      (c.translatedText && c.translatedText.toLowerCase().includes(q))
    );
  });

  // Copy single caption
  const handleCopyCaption = (item: CaptionLogItem) => {
    const textToCopy = `[${item.timestamp}] ${item.speakerName}: ${item.originalText}${item.translatedText ? ` (${preferredLanguage.name}: ${item.translatedText})` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy entire session transcript
  const handleCopyAll = () => {
    if (captionsLog.length === 0) return;
    const fullText = captionsLog.map(item => 
      `[${item.timestamp}] ${item.speakerName} (${item.speakerRole || 'Member'}):\nOriginal: ${item.originalText}\n${preferredLanguage.name} Subtitle: ${item.translatedText || item.originalText}\n`
    ).join('\n---\n\n');
    
    navigator.clipboard.writeText(fullText);
    setHasCopiedAll(true);
    setTimeout(() => setHasCopiedAll(false), 2500);
  };

  // Download transcript as file
  const handleDownloadTranscript = () => {
    if (captionsLog.length === 0) return;
    const header = `=== VAULT CLASSROOM LIVE TRANSCRIPT & CAPTIONS ===\nDate: ${new Date().toLocaleString()}\nTarget Language: ${preferredLanguage.name} (${preferredLanguage.code})\nTotal Lines: ${captionsLog.length}\n==================================================\n\n`;
    const content = captionsLog.map(c => 
      `[${c.timestamp}] ${c.speakerName} [${c.speakerRole || 'User'}]:\n  Spoken: "${c.originalText}"\n  ${preferredLanguage.name}: "${c.translatedText || c.originalText}"\n`
    ).join('\n');

    const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vault-transcript-${preferredLanguage.code}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-full bg-brand-card rounded-3xl border border-brand-border overflow-hidden shadow-2xl ${isOverlay ? 'relative' : ''}`}>
      {/* HEADER BAR */}
      <div className="p-3.5 sm:p-4 bg-brand-dark/90 border-b border-brand-border flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Captions className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-100">Live Captions & Transcript</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                speechEngineStatus === 'listening' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' 
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              }`}>
                {speechEngineStatus === 'listening' ? '● Mic Active' : 'Ready'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {captionsLog.length} {captionsLog.length === 1 ? 'sentence' : 'sentences'} captured in session
            </p>
          </div>
        </div>

        {/* CONTROLS & LANGUAGE SELECTOR */}
        <div className="flex items-center flex-wrap gap-2">
          {/* LANGUAGE SELECTOR DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="px-2.5 py-1.5 bg-brand-dark border border-purple-500/40 hover:border-purple-400 rounded-xl text-xs font-semibold text-slate-200 flex items-center space-x-2 transition cursor-pointer shadow-sm"
              title="Change Target Subtitle Language"
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-base leading-none">{preferredLanguage.flag}</span>
              <span className="font-bold text-purple-200">{preferredLanguage.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isLangDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 w-52 bg-slate-900 border border-brand-border rounded-2xl shadow-2xl z-50 p-1.5 max-h-72 overflow-y-auto custom-scrollbar"
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-brand-border/60 mb-1">
                    Translate Captions To:
                  </div>
                  {SUPPORTED_LANGUAGES.map(lang => {
                    const isSelected = preferredLanguage.code === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          onLanguageChange(lang);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                          isSelected 
                            ? 'bg-purple-600 text-white font-bold' 
                            : 'text-slate-300 hover:bg-brand-dark/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Actions */}
          <button
            type="button"
            onClick={handleCopyAll}
            disabled={captionsLog.length === 0}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-brand-dark hover:bg-brand-card disabled:opacity-40 border border-brand-border rounded-xl text-xs font-semibold text-slate-300 transition flex items-center space-x-1 cursor-pointer"
            title="Copy full transcript to clipboard"
          >
            {hasCopiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{hasCopiedAll ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTranscript}
            disabled={captionsLog.length === 0}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-brand-dark hover:bg-brand-card disabled:opacity-40 border border-brand-border rounded-xl text-xs font-semibold text-slate-300 transition flex items-center space-x-1 cursor-pointer"
            title="Download transcript (.txt)"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {onRestartSpeechEngine && (
            <button
              type="button"
              onClick={onRestartSpeechEngine}
              className="p-1.5 bg-brand-dark hover:bg-brand-card border border-brand-border rounded-xl text-xs text-slate-400 hover:text-purple-300 transition cursor-pointer"
              title="Restart Speech Recognition Engine"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {onClearCaptions && (
            <button
              type="button"
              onClick={onClearCaptions}
              disabled={captionsLog.length === 0}
              className="p-1.5 bg-brand-dark hover:bg-red-500/20 text-slate-400 hover:text-red-400 disabled:opacity-30 border border-brand-border rounded-xl text-xs transition cursor-pointer"
              title="Clear transcript log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {isOverlay && onCloseOverlay && (
            <button
              type="button"
              onClick={onCloseOverlay}
              className="p-1.5 bg-brand-dark hover:bg-brand-card border border-brand-border text-slate-400 hover:text-white rounded-xl text-xs transition cursor-pointer"
              title="Close Caption History"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* FILTER & QUICK PRESETS BAR */}
      <div className="px-3.5 py-2 bg-brand-dark/50 border-b border-brand-border/60 flex items-center justify-between gap-2 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript or speakers..."
            className="w-full pl-8 pr-2.5 py-1 bg-brand-dark border border-brand-border rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setShowPresetsTray(!showPresetsTray)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition cursor-pointer ${
              showPresetsTray 
                ? 'bg-purple-600/30 text-purple-300 border-purple-500/50' 
                : 'bg-brand-dark text-slate-400 border-brand-border hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="hidden sm:inline">Quick Phrases</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition cursor-pointer ${
              isAutoScrollEnabled 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-brand-dark text-slate-400 border-brand-border'
            }`}
            title={isAutoScrollEnabled ? "Auto-scroll is Active (click to pause)" : "Auto-scroll Paused (click to resume)"}
          >
            <ArrowDown className={`w-3 h-3 ${isAutoScrollEnabled ? 'text-emerald-400 animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{isAutoScrollEnabled ? 'Auto-scroll On' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* QUICK PRESET PHRASES TRAY */}
      <AnimatePresence>
        {showPresetsTray && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-brand-dark/80 border-b border-brand-border/60 px-3.5 py-2.5 shrink-0"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                Click any phrase to broadcast caption & voice transcript:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar py-0.5">
              {QUICK_SPEECH_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onTriggerPresetSpeech && onTriggerPresetSpeech(preset.text)}
                  className="px-2.5 py-1 bg-brand-card hover:bg-purple-600 hover:text-white border border-brand-border rounded-lg text-xs text-slate-300 transition cursor-pointer flex items-center space-x-1"
                >
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCROLLABLE TRANSCRIPT LOG CONTAINER */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 custom-scrollbar min-h-0 relative"
      >
        {filteredCaptions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-3 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-1">
              <Captions className="w-7 h-7" />
            </div>
            <p className="font-bold text-slate-300 text-sm">
              {searchQuery ? 'No matching captions found' : 'Live Caption Stream is Ready'}
            </p>
            <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
              {searchQuery 
                ? 'Try a different search query.' 
                : 'Speak into your microphone or join a live call session. Spoken sentences will automatically appear, scroll, and translate into ' + preferredLanguage.name + ' in real-time.'}
            </p>
            {!isRecording && (
              <button
                type="button"
                onClick={onToggleRecording}
                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Start Microphone Voice-to-Text</span>
              </button>
            )}
          </div>
        ) : (
          filteredCaptions.map((item) => {
            const isSelf = item.isSelf;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-2xl border transition ${
                  isSelf 
                    ? 'bg-purple-950/20 border-purple-500/30 ml-4 sm:ml-8' 
                    : 'bg-brand-dark/70 border-brand-border mr-4 sm:mr-8'
                }`}
              >
                {/* Header row: Speaker name, role, timestamp, actions */}
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold text-xs ${isSelf ? 'text-purple-300' : 'text-slate-200'}`}>
                      {item.speakerName} {isSelf && '(You)'}
                    </span>
                    {item.speakerRole && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-black/40 text-slate-300 border border-white/10">
                        {item.speakerRole}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 opacity-80 hover:opacity-100 transition">
                    {/* TTS speech button */}
                    <button
                      type="button"
                      onClick={() => speakText(item.translatedText || item.originalText, preferredLanguage.speechLang)}
                      className="p-1 text-slate-400 hover:text-purple-300 rounded hover:bg-black/30 transition cursor-pointer"
                      title="Listen with Text-to-Speech"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy button */}
                    <button
                      type="button"
                      onClick={() => handleCopyCaption(item)}
                      className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-black/30 transition cursor-pointer"
                      title="Copy caption"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {/* Send to chat button */}
                    {onSendCaptionToChat && (
                      <button
                        type="button"
                        onClick={() => onSendCaptionToChat(item.translatedText || item.originalText)}
                        className="p-1 text-slate-400 hover:text-purple-300 rounded hover:bg-black/30 transition cursor-pointer"
                        title="Insert into chat message input"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Original Spoken Text */}
                <p className="text-xs text-slate-300 leading-relaxed mb-1.5 font-normal">
                  "{item.originalText}"
                </p>

                {/* Live Translation Subtitle Pill */}
                {item.translatedText && (
                  <div className="mt-2 p-2 rounded-xl bg-purple-900/30 border border-purple-500/40 flex items-start space-x-2 text-xs">
                    <span className="text-sm shrink-0">{preferredLanguage.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wide mb-0.5">
                        {preferredLanguage.name} Subtitle
                      </div>
                      <p className="text-xs font-semibold text-purple-100 leading-relaxed">
                        {item.translatedText}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}

        {/* Real-time Interim speech card when user is actively talking */}
        {isRecording && (interimSpeechText || audioLevel > 15) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-400/80 shadow-xl shadow-purple-950/60 ml-4 sm:ml-8"
          >
            <div className="flex items-center justify-between space-x-2 mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  You are speaking now...
                </span>
              </div>
              <span className="text-[10px] bg-purple-900/80 text-purple-200 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono">
                {audioLevel > 0 ? `${audioLevel}% Level` : 'Live Stream'}
              </span>
            </div>

            {/* Original Spoken Real-time Transcript */}
            <p className="text-xs font-semibold text-white leading-relaxed mb-2">
              "{interimSpeechText || 'Listening to your microphone...'}"
            </p>

            {/* Live Real-time Subtitle Translation Preview */}
            <div className="p-2 rounded-xl bg-purple-900/40 border border-purple-500/50 flex items-start space-x-2 text-xs">
              <span className="text-sm shrink-0">{preferredLanguage.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-bold text-purple-300 uppercase tracking-wide mb-0.5 flex items-center justify-between">
                  <span>Live Subtitle Preview ({preferredLanguage.name})</span>
                  <span className="text-[9px] font-normal text-purple-300/80">real-time</span>
                </div>
                <p className="text-xs font-semibold text-purple-100 italic leading-snug">
                  {interimTranslation || (interimSpeechText ? 'Translating speech...' : 'Waiting for words...')}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {/* FLOATING JUMP TO LATEST BUTTON */}
      <AnimatePresence>
        {!isAutoScrollEnabled && captionsLog.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-20 right-6 z-30 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs font-bold shadow-xl shadow-purple-950/80 flex items-center space-x-1.5 border border-purple-400/50 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            <span>Jump to latest captions</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* BOTTOM VOICE CAPTURE TOOLBAR */}
      <div className="p-3 sm:p-3.5 bg-brand-dark/90 border-t border-brand-border shrink-0 flex items-center justify-between gap-2.5">
        {/* Toggle Mode: PTT vs Hands-Free */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => onToggleVoiceMode(voiceRecognitionMode === 'push-to-talk' ? 'hands-free' : 'push-to-talk')}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              voiceRecognitionMode === 'hands-free'
                ? 'bg-purple-600/30 text-purple-300 border-purple-500/60'
                : 'bg-brand-dark text-slate-400 border-brand-border hover:text-slate-200'
            }`}
            title={voiceRecognitionMode === 'hands-free' ? "Continuous speech capture (stays open until stopped)" : "Single phrase Push-to-Talk"}
          >
            <Radio className={`w-3.5 h-3.5 ${voiceRecognitionMode === 'hands-free' ? 'text-purple-400 animate-pulse' : ''}`} />
            <span>{voiceRecognitionMode === 'hands-free' ? 'Hands-Free' : 'Push-to-Talk'}</span>
          </button>
        </div>

        {/* Live Audio Visualizer Bar */}
        <div className="flex-1 max-w-xs h-9 bg-brand-dark border border-brand-border rounded-xl px-3 flex items-center justify-center overflow-hidden">
          {isRecording ? (
            <div className="w-full flex items-center justify-between space-x-1">
              <span className="text-[11px] text-red-400 font-bold animate-pulse shrink-0">
                {voiceRecognitionMode === 'hands-free' ? 'Listening...' : 'Recording...'}
              </span>
              <div className="flex-1 h-5 flex items-center justify-center ml-2">
                <svg className="w-full h-5 text-purple-400" viewBox="0 0 160 24" preserveAspectRatio="none">
                  <path
                    d={`M 0 12 Q 20 ${12 - audioLevel/4} 40 12 T 80 12 T 120 12 T 160 12`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="transition-all duration-75"
                  />
                </svg>
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 italic">
              Mic is muted. Press button to speak.
            </span>
          )}
        </div>

        {/* Main Microphone Action Button */}
        <button
          type="button"
          onClick={onToggleRecording}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center space-x-2 shadow-lg ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 animate-pulse'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
          }`}
        >
          {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
          <span>{isRecording ? 'Stop Mic' : 'Talk Now'}</span>
        </button>
      </div>
    </div>
  );
};
