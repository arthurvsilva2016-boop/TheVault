import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveCall } from '../../context/LiveCallContext';
import LiveVideoTile from './LiveVideoTile';
import VirtualWhiteboard from '../VirtualWhiteboard';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Tv, 
  Hand, 
  MessageSquare, 
  PenTool, 
  VolumeX, 
  Volume2,
  PhoneOff, 
  Maximize2, 
  Minimize2, 
  Send, 
  X, 
  Share2, 
  Users, 
  Grid, 
  Layout, 
  Sparkles, 
  Check, 
  Layers, 
  HelpCircle,
  Columns,
  SplitSquareHorizontal,
  Languages,
  Download,
  Copy,
  Search,
  MessageSquareQuote,
  FileDown,
  Captions,
  Radio,
  Sparkle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowDown,
  RefreshCw,
  MoreHorizontal,
  SlidersHorizontal,
  Settings,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Employee, Student } from '../../types';
import { 
  SUPPORTED_LANGUAGES, 
  SupportedLanguage, 
  QUICK_SPEECH_PRESETS,
  translateCaption, 
  speakText 
} from '../../utils/translationService';

interface LiveCallModalProps {
  currentUser?: { id: string; name: string; role: string; avatarUrl?: string };
  employees?: Employee[];
  students?: Student[];
}

export default function LiveCallModal({
  currentUser,
  employees = [],
  students = []
}: LiveCallModalProps) {
  const {
    activeCall,
    localStream,
    remoteStreams,
    screenStream,
    isMicMuted,
    isVideoMuted,
    isScreenSharing,
    isHandRaised,
    isCallMinimized,
    isWhiteboardActive,
    isChatDrawerOpen,
    audioLevel,
    mediaError,
    toggleMic,
    toggleVideo,
    toggleScreenShare,
    approveScreenShare,
    denyScreenShare,
    toggleHandRaise,
    setIsCallMinimized,
    setIsWhiteboardActive,
    setIsChatDrawerOpen,
    sendCallMessage,
    broadcastLiveCaption,
    leaveCall,
    muteAllStudents,
    toggleParticipantAudio,
    ringParticipant
  } = useLiveCall();

  const [activeTab, setActiveTab] = useState<'video' | 'slides'>('video');
  const [isWhiteboardDrawerOpen, setIsWhiteboardDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(460);
  const [rightPanelMode, setRightPanelMode] = useState<'split' | 'tabs'>('tabs');
  const [activeRightTab, setActiveRightTab] = useState<'whiteboard' | 'chat' | 'captions'>('chat');
  const [isResizing, setIsResizing] = useState(false);
  
  const [layoutMode, setLayoutMode] = useState<'grid' | 'spotlight'>('grid');
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [callDuration, setCallDuration] = useState('00:00');
  const [meetingNotes, setMeetingNotes] = useState(
    '📝 Live Meeting Agenda & Minutes:\n• Welcome & Check-in\n• Academic and administrative review\n• Action items & next steps'
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const captionsBottomRef = useRef<HTMLDivElement | null>(null);
  const captionsContainerRef = useRef<HTMLDivElement | null>(null);

  // Live Captions, Translation & TTS State
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(true);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [sourceLanguage, setSourceLanguage] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0]); // English default input
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0]); // Subtitles target
  const [speechEngineStatus, setSpeechEngineStatus] = useState<'listening' | 'idle' | 'muted' | 'unsupported' | 'error' | 'permission_denied'>('idle');
  const [speechEngineError, setSpeechEngineError] = useState<string | null>(null);
  const [customCaptionInput, setCustomCaptionInput] = useState('');
  const [captionSearchQuery, setCaptionSearchQuery] = useState('');
  const [interimLiveText, setInterimLiveText] = useState('');
  const [interimLiveTranslation, setInterimLiveTranslation] = useState('');
  const [engineRestartCount, setEngineRestartCount] = useState(0);
  const [activeCaption, setActiveCaption] = useState<{
    id: string;
    speakerName: string;
    originalText: string;
    translatedText: string;
    targetLang: string;
  } | null>(null);

  const [captionsLog, setCaptionsLog] = useState<Array<{
    id: string;
    timestamp: string;
    speakerId: string;
    speakerName: string;
    originalText: string;
    translatedText: string;
    langCode: string;
  }>>([
    {
      id: 'init-cap-1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      speakerId: 'system',
      speakerName: 'Vault AI Voice Engine',
      originalText: 'Live speech captions and real-time translation activated.',
      translatedText: 'Live speech captions and real-time translation activated.',
      langCode: 'en'
    }
  ]);

  const speechRecognitionRef = useRef<any>(null);
  const isRecognizingRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<any>(null);
  const captionTimerRef = useRef<any>(null);
  const interimCommitTimerRef = useRef<any>(null);
  const pendingTranscriptRef = useRef<string>('');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const processedCaptionsRef = useRef<Set<string>>(new Set(['init-cap-1']));

  // Commit recognized speech or manual text to captionsLog and broadcast to room
  const commitTranscript = useCallback(async (text: string) => {
    if (!text || text.trim().length < 1) return;
    const cleanText = text.trim();
    const capId = `log-local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Mark as processed so local echo doesn't duplicate
    processedCaptionsRef.current.add(capId);

    const translated = await translateCaption(cleanText, targetLanguage.code, sourceLanguage.code);

    // Broadcast to room peers
    broadcastLiveCaption({
      speakerId: currentUser?.id || 'local',
      speakerName: currentUser?.name || 'You',
      originalText: cleanText,
      sourceLang: sourceLanguage.code
    });

    const capItem = {
      id: capId,
      speakerName: currentUser?.name || 'You',
      originalText: cleanText,
      translatedText: translated,
      targetLang: targetLanguage.code
    };
    setActiveCaption(capItem);

    if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
    captionTimerRef.current = setTimeout(() => {
      setActiveCaption(null);
    }, 4500);

    setCaptionsLog(prev => [
      ...prev,
      {
        id: capId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        speakerId: currentUser?.id || 'local',
        speakerName: currentUser?.name || 'You',
        originalText: cleanText,
        translatedText: translated,
        langCode: targetLanguage.code
      }
    ]);

    if (isTtsEnabled) {
      speakText(translated || cleanText, targetLanguage.speechLang);
    }
  }, [broadcastLiveCaption, currentUser, sourceLanguage.code, targetLanguage.code, targetLanguage.speechLang, isTtsEnabled]);

  // Broadcast manual caption or quick preset
  const handleBroadcastManualCaption = async (text: string) => {
    if (!text.trim()) return;
    await commitTranscript(text.trim());
  };

  // Download entire session transcript as text file
  const handleDownloadTranscript = () => {
    if (captionsLog.length === 0) return;
    const textLines = captionsLog.map(c => 
      `[${c.timestamp}] ${c.speakerName}:\n` +
      `  Spoken: "${c.originalText}"\n` +
      (c.translatedText && c.translatedText !== c.originalText ? `  Translated (${c.langCode.toUpperCase()}): "${c.translatedText}"\n` : '') +
      `--------------------------------------------------`
    ).join('\n\n');

    const header = `VAULT LIVE CALL CAPTIONS & TRANSCRIPT\nRoom: ${activeCall?.roomCode || 'Vault-Call'}\nDate: ${new Date().toLocaleDateString()}\nTime: ${new Date().toLocaleTimeString()}\nInput Language: ${sourceLanguage.name} (${sourceLanguage.code})\nSubtitle Language: ${targetLanguage.name} (${targetLanguage.code})\nTotal Captions Logged: ${captionsLog.length}\n==================================================\n\n`;

    const blob = new Blob([header + textLines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vault-call-transcript-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy all captions to clipboard
  const handleCopyAllCaptions = () => {
    if (captionsLog.length === 0) return;
    const text = captionsLog.map(c => `[${c.timestamp}] ${c.speakerName}: ${c.translatedText || c.originalText}`).join('\n');
    navigator.clipboard?.writeText(text);
  };

  // Clear captions log
  const handleClearCaptions = () => {
    setCaptionsLog([]);
  };

  // Re-initialize speech recognition on demand or on config changes
  const restartSpeechEngine = useCallback(() => {
    setEngineRestartCount(c => c + 1);
  }, []);

  // Live speech recognition for real-time captions with auto-reconnect and interim commit
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechEngineStatus('unsupported');
      return;
    }

    if (!isCaptionsEnabled || isMicMuted) {
      setSpeechEngineStatus(isMicMuted ? 'muted' : 'idle');
      if (speechRecognitionRef.current && isRecognizingRef.current) {
        try {
          isRecognizingRef.current = false;
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      return;
    }

    let isMounted = true;
    let recognition: any = null;

    try {
      recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = sourceLanguage.speechLang || 'en-US';

      recognition.onstart = () => {
        if (!isMounted) return;
        isRecognizingRef.current = true;
        setSpeechEngineStatus('listening');
        setSpeechEngineError(null);
      };

      recognition.onresult = async (event: any) => {
        if (!isMounted) return;
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += trans;
          } else {
            interimTranscript += trans;
          }
        }

        const activeText = (finalTranscript || interimTranscript).trim();
        if (activeText.length > 0) {
          setInterimLiveText(activeText);

          // Fast translation preview for floating subtitle banner
          translateCaption(activeText, targetLanguage.code, sourceLanguage.code).then(translated => {
            if (isMounted) {
              setInterimLiveTranslation(translated);
              setActiveCaption({
                id: `cap-active-${Date.now()}`,
                speakerName: currentUser?.name || 'You',
                originalText: activeText,
                translatedText: translated,
                targetLang: targetLanguage.code
              });

              if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
              captionTimerRef.current = setTimeout(() => {
                if (isMounted) setActiveCaption(null);
              }, 4500);
            }
          });

          // Finalized speech segment
          if (finalTranscript.trim().length > 1) {
            if (interimCommitTimerRef.current) clearTimeout(interimCommitTimerRef.current);
            pendingTranscriptRef.current = '';
            setInterimLiveText('');
            commitTranscript(finalTranscript.trim());
          } else if (interimTranscript.trim().length > 1) {
            // Keep pending and debounce commit in case user pauses without final flag
            pendingTranscriptRef.current = interimTranscript.trim();
            if (interimCommitTimerRef.current) clearTimeout(interimCommitTimerRef.current);
            interimCommitTimerRef.current = setTimeout(() => {
              if (isMounted && pendingTranscriptRef.current.trim().length > 1) {
                const textToCommit = pendingTranscriptRef.current.trim();
                pendingTranscriptRef.current = '';
                setInterimLiveText('');
                commitTranscript(textToCommit);
              }
            }, 900);
          }
        }
      };

      recognition.onerror = (err: any) => {
        if (!isMounted) return;
        const errType = err.error || 'unknown';
        if (errType === 'no-speech' || errType === 'aborted') {
          // Normal silence or browser abort, stay listening
          return;
        }
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setSpeechEngineStatus('permission_denied');
          setSpeechEngineError('Microphone permission required for speech captions.');
          isRecognizingRef.current = false;
          return;
        }
        console.warn('Live speech recognition warning:', errType);
        setSpeechEngineStatus('error');
      };

      recognition.onend = () => {
        isRecognizingRef.current = false;
        if (!isMounted) return;
        
        // If there was uncommitted interim speech when recognition ended, commit it now so nothing is lost
        if (pendingTranscriptRef.current.trim().length > 1) {
          const textToCommit = pendingTranscriptRef.current.trim();
          pendingTranscriptRef.current = '';
          setInterimLiveText('');
          commitTranscript(textToCommit);
        }

        // Fast auto-restart when active and unmuted
        if (isCaptionsEnabled && !isMicMuted) {
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (isMounted && isCaptionsEnabled && !isMicMuted && !isRecognizingRef.current) {
              try {
                recognition.start();
              } catch (e) {}
            }
          }, 80);
        } else {
          setSpeechEngineStatus(isMicMuted ? 'muted' : 'idle');
        }
      };

      try {
        recognition.start();
        isRecognizingRef.current = true;
      } catch (startErr) {
        console.warn('Speech recognition immediate start caught:', startErr);
      }
      speechRecognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition instance creation failed:', err);
      setSpeechEngineStatus('error');
    }

    return () => {
      isMounted = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (interimCommitTimerRef.current) clearTimeout(interimCommitTimerRef.current);
      if (speechRecognitionRef.current) {
        try {
          isRecognizingRef.current = false;
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
      if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
    };
  }, [
    isCaptionsEnabled, 
    isMicMuted, 
    sourceLanguage.code, 
    sourceLanguage.speechLang, 
    targetLanguage.code, 
    isTtsEnabled, 
    currentUser, 
    commitTranscript,
    engineRestartCount
  ]);

  // Synchronize live captions broadcast across all participants in the room
  useEffect(() => {
    if (!activeCall?.liveCaptions?.length) return;

    const latestCaptions = activeCall.liveCaptions;
    const newItems = latestCaptions.filter(c => !processedCaptionsRef.current.has(c.id));

    if (newItems.length === 0) return;

    newItems.forEach(async (cap) => {
      processedCaptionsRef.current.add(cap.id);
      
      const translated = await translateCaption(cap.originalText, targetLanguage.code, cap.sourceLang || 'en');

      if (isCaptionsEnabled) {
        setActiveCaption({
          id: cap.id,
          speakerName: cap.speakerName,
          originalText: cap.originalText,
          translatedText: translated,
          targetLang: targetLanguage.code
        });

        if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
        captionTimerRef.current = setTimeout(() => {
          setActiveCaption(null);
        }, 4500);
      }

      setCaptionsLog(prev => {
        if (prev.some(p => p.id === cap.id)) return prev;
        return [
          ...prev,
          {
            id: cap.id,
            timestamp: cap.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            speakerId: cap.speakerId,
            speakerName: cap.speakerName,
            originalText: cap.originalText,
            translatedText: translated,
            langCode: targetLanguage.code
          }
        ];
      });

      // Speak if TTS is enabled and not local user's own caption
      if (isTtsEnabled && cap.speakerId !== (currentUser?.id || 'local')) {
        speakText(`${cap.speakerName}: ${translated || cap.originalText}`, targetLanguage.speechLang);
      }
    });
  }, [activeCall?.liveCaptions, isCaptionsEnabled, targetLanguage.code, targetLanguage.speechLang, isTtsEnabled, currentUser?.id]);

  // TTS for incoming messages and new captions
  const lastSpokenMessageIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isTtsEnabled || !activeCall?.messages?.length) return;
    const latestMsg = activeCall.messages[activeCall.messages.length - 1];
    if (!latestMsg || latestMsg.id === lastSpokenMessageIdRef.current) return;
    if (latestMsg.senderId === currentUser?.id) return; // don't echo own chat

    lastSpokenMessageIdRef.current = latestMsg.id;
    speakText(`${latestMsg.senderName} says: ${latestMsg.text}`, targetLanguage.speechLang);
  }, [activeCall?.messages, isTtsEnabled, currentUser?.id, targetLanguage.speechLang]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeCall?.messages]);

  // Auto-scroll captions log to bottom when new entries arrive or active tab is captions
  useEffect(() => {
    if (isAutoScroll && activeRightTab === 'captions') {
      const container = captionsContainerRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
      captionsBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [captionsLog, activeCaption, interimLiveText, isAutoScroll, activeRightTab]);

  // Tab switch scroll helper
  useEffect(() => {
    if (activeRightTab === 'captions') {
      setTimeout(() => {
        captionsContainerRef.current?.scrollTo({
          top: captionsContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
        captionsBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [activeRightTab]);

  const handleCaptionsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 60;
    setIsAutoScroll(isNearBottom);
  };

  const participants = activeCall?.participants || [];
  const raisedHandsCount = participants.filter(p => p.isHandRaised).length;
  const isRightPanelOpen = isWhiteboardDrawerOpen || isChatDrawerOpen;

  const handleCopyInvite = () => {
    if (activeCall?.roomCode) {
      navigator.clipboard?.writeText(activeCall.roomCode);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendCallMessage(chatInput.trim(), {
        id: currentUser?.id || 'guest',
        name: currentUser?.name || 'Guest'
      });
      setChatInput('');
    }
  };

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = rightPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.min(Math.max(startWidth + deltaX, 320), 850);
      setRightPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [rightPanelWidth]);

  const filteredCaptions = captionsLog.filter(c => 
    c.speakerName.toLowerCase().includes(captionSearchQuery.toLowerCase()) ||
    c.translatedText.toLowerCase().includes(captionSearchQuery.toLowerCase()) ||
    (c.originalText && c.originalText.toLowerCase().includes(captionSearchQuery.toLowerCase()))
  );

  // SPOTLIGHT PARTICIPANT RESOLUTION
  const spotlightParticipant = spotlightId 
    ? participants.find(p => p.id === spotlightId) 
    : participants.find(p => p.isScreenSharing) || participants.find(p => p.isTeacher) || participants[0];

  // If minimized, display picture-in-picture floating box
  if (isCallMinimized) {
    return (
      <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 w-[calc(100vw-24px)] max-w-[320px] sm:w-80 bg-slate-950/95 backdrop-blur-xl border border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        {/* Minimized Header */}
        <div className="p-2.5 sm:p-3 bg-gradient-to-r from-purple-900/60 to-slate-900 border-b border-purple-500/30 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-100 line-clamp-1">{activeCall.title}</span>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-[10px] font-mono text-purple-300 mr-1">{callDuration}</span>
            <button
              onClick={() => setIsCallMinimized(false)}
              className="p-1 rounded-md bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition cursor-pointer"
              title="Expand call to fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={leaveCall}
              className="p-1 rounded-md bg-red-600/80 hover:bg-red-600 text-white transition cursor-pointer"
              title="Leave call"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Small Video Preview */}
        <div className="h-36 sm:h-40 bg-slate-900 relative flex items-center justify-center">
          {localStream && !isVideoMuted ? (
            <video
              autoPlay
              playsInline
              muted
              ref={localVideoRef}
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center mx-auto text-purple-300 font-bold mb-2">
                {currentUser?.name?.[0] || 'V'}
              </div>
              <p className="text-xs text-slate-300 font-semibold">{currentUser?.name || 'Vault Call'}</p>
            </div>
          )}

          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] text-slate-300 border border-slate-800">
            {participants.length} connected
          </div>
        </div>

        {/* Minimized Controls */}
        <div className="p-2.5 bg-slate-950 flex justify-around items-center border-t border-slate-800">
          <button
            onClick={toggleMic}
            className={`p-2 rounded-xl text-xs font-semibold cursor-pointer ${
              isMicMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200'
            }`}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-2 rounded-xl text-xs font-semibold cursor-pointer ${
              isVideoMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200'
            }`}
          >
            {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-purple-400" />}
          </button>
          <button
            onClick={() => setIsTtsEnabled(prev => !prev)}
            className={`p-2 rounded-xl text-xs font-semibold cursor-pointer ${
              isTtsEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
            title={isTtsEnabled ? 'Text-to-Speech Enabled' : 'Text-to-Speech Disabled'}
          >
            {isTtsEnabled ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleHandRaise}
            className={`p-2 rounded-xl text-xs font-semibold cursor-pointer ${
              isHandRaised ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200'
            }`}
          >
            <Hand className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCallMinimized(false)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden animate-fadeIn select-none">
      {/* CONFERENCE TOP HEADER */}
      <header className="px-2.5 py-2 sm:px-3.5 sm:py-3 bg-slate-900/90 backdrop-blur-md border-b border-brand-border flex justify-between items-center shrink-0 z-20 gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/20 text-white font-bold shrink-0">
            <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] sm:text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate">{activeCall.title}</h2>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">
              Room: <strong className="text-purple-300">{activeCall.roomCode}</strong> • {callDuration}
            </p>
          </div>
        </div>

        {/* View Switchers & Top Tools */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Main Stage Tabs */}
          <div className="flex bg-slate-950 p-0.5 sm:p-1 rounded-xl border border-brand-border text-xs">
            <button
              onClick={() => setActiveTab('video')}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'video' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Video Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>

            <button
              onClick={() => setActiveTab('slides')}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'slides' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Meeting Agenda"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>

          {/* Dual Spoken & Subtitle Language Selectors in Header (Desktop) */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-brand-border text-xs">
            {/* Spoken Audio Input Language */}
            <div className="flex items-center px-2 py-1 gap-1.5 text-slate-300 border-r border-slate-800">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-slate-400 font-semibold">Spoken:</span>
              <select
                value={sourceLanguage.code}
                onChange={e => {
                  const found = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                  if (found) setSourceLanguage(found);
                }}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
                title="Select Spoken Voice Input Language"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Subtitles Translation Language */}
            <div className="flex items-center px-2 py-1 gap-1.5 text-slate-300">
              <Languages className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] text-slate-400 font-semibold">Subtitles:</span>
              <select
                value={targetLanguage.code}
                onChange={e => {
                  const found = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                  if (found) setTargetLanguage(found);
                }}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
                title="Select Subtitle Translation Language"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle Live Captions Display */}
          <button
            onClick={() => setIsCaptionsEnabled(prev => !prev)}
            className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isCaptionsEnabled 
                ? 'bg-emerald-600/90 text-white border-emerald-500 shadow-md shadow-emerald-600/20' 
                : 'bg-slate-950 text-slate-400 border-brand-border hover:text-slate-200'
            }`}
            title="Toggle Live Speech Captions Display"
          >
            <Captions className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CC: {isCaptionsEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Text-to-Speech Toggle in Header (Desktop) */}
          <button
            onClick={() => setIsTtsEnabled(prev => !prev)}
            className={`hidden sm:flex px-3 py-1.5 rounded-xl border text-xs font-semibold items-center gap-1.5 transition cursor-pointer ${
              isTtsEnabled 
                ? 'bg-indigo-600/90 text-white border-indigo-500 shadow-md shadow-indigo-600/20' 
                : 'bg-slate-950 text-slate-400 border-brand-border hover:text-slate-200'
            }`}
            title="Toggle Text-to-Speech Audio Reader for Call Messages & Captions"
          >
            {isTtsEnabled ? <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">TTS: {isTtsEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Right Side Tools Toggle (Desktop) */}
          <div className="hidden md:flex bg-slate-950 p-1 rounded-xl border border-brand-border text-xs">
            <button
              onClick={() => setIsWhiteboardDrawerOpen(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isWhiteboardDrawerOpen ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Side Whiteboard"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Whiteboard</span>
            </button>

            <button
              onClick={() => {
                setIsChatDrawerOpen(true);
                setActiveRightTab('chat');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isChatDrawerOpen && activeRightTab === 'chat' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle In-Call Chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => {
                setIsChatDrawerOpen(true);
                setActiveRightTab('captions');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isChatDrawerOpen && activeRightTab === 'captions' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Live Captions Transcript Log"
            >
              <Captions className="w-3.5 h-3.5" />
              <span>Captions Log</span>
            </button>
          </div>

          {/* Invite Code button (Desktop) */}
          <button
            onClick={handleCopyInvite}
            className="hidden sm:flex px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-brand-border rounded-xl text-xs font-semibold items-center gap-1.5 transition cursor-pointer"
            title="Copy meeting code"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-purple-400" />}
            <span>{copiedLink ? 'Copied' : 'Invite'}</span>
          </button>

          {/* Mobile Tools Menu Launcher */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex md:hidden p-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 border border-purple-500/40 transition cursor-pointer items-center justify-center"
            title="More Call Settings & Language Options"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Minimize Button */}
          <button
            onClick={() => setIsCallMinimized(true)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-brand-border transition cursor-pointer"
            title="Minimize call to floating PIP"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CALL NOTIFICATION / SCREEN SHARE PERMISSION BANNER */}
      {activeCall?.screenShareRequest && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-blue-950/95 backdrop-blur-md border border-blue-500/80 rounded-2xl shadow-2xl animate-slideDown">
          <div className="p-2 rounded-xl bg-blue-600 text-white">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Screen Sharing Permission Request</p>
            <p className="text-[11px] text-blue-200">
              <strong className="text-white">{activeCall.screenShareRequest.name}</strong> wants to share their screen with the class.
            </p>
          </div>
          <div className="flex gap-2 ml-3">
            <button 
              onClick={() => approveScreenShare(activeCall.screenShareRequest!.participantId)} 
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md"
            >
              Allow Sharing
            </button>
            <button 
              onClick={() => denyScreenShare()} 
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer transition border border-slate-700"
            >
              Deny
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONFERENCE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT / CENTER: PRIMARY MEDIA STAGE */}
        <div className="flex-1 flex flex-col p-3 overflow-y-auto min-w-0 transition-all">
          {/* TAB 1: VIDEO CONFERENCING GRID / SPOTLIGHT */}
          {activeTab === 'video' && (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              {/* Screen share banner if active */}
              {activeCall.screenShareParticipantId && (
                <div className="p-2.5 bg-blue-950/60 border border-blue-500/40 rounded-xl flex items-center justify-between text-xs text-blue-200">
                  <div className="flex items-center space-x-2">
                    <Tv className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span>
                      <strong className="text-white">
                        {participants.find(p => p.id === activeCall.screenShareParticipantId)?.name || 'Participant'}
                      </strong> is presenting their screen.
                    </span>
                  </div>
                  {isScreenSharing && (
                    <button
                      onClick={toggleScreenShare}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition text-[11px] cursor-pointer"
                    >
                      Stop Sharing
                    </button>
                  )}
                </div>
              )}

              {/* View Layout Controls */}
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>{participants.length} Active in Room</span>
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-brand-border text-xs">
                  <button
                    onClick={() => {
                      setLayoutMode('grid');
                      setSpotlightId(null);
                    }}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      layoutMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Grid Layout"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setLayoutMode('spotlight')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      layoutMode === 'spotlight' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Speaker Spotlight Layout"
                  >
                    <Layout className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* VIDEO GRID LAYOUT */}
              {layoutMode === 'grid' && (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 min-h-0 auto-rows-fr">
                  {participants.map(participant => (
                    <LiveVideoTile
                      key={participant.id}
                      participant={participant}
                      stream={participant.isLocal ? (isScreenSharing && screenStream ? screenStream : localStream) : remoteStreams[participant.id]}
                      audioLevel={participant.isLocal ? audioLevel : (participant.isSpeaking ? 0.6 : 0)}
                      isSpotlight={false}
                      onPinSpotlight={() => {
                        setSpotlightId(participant.id);
                        setLayoutMode('spotlight');
                      }}
                      onToggleMute={() => toggleParticipantAudio(participant.id)}
                      showTeacherControls={true}
                    />
                  ))}
                </div>
              )}

              {/* SPOTLIGHT SPEAKER LAYOUT */}
              {layoutMode === 'spotlight' && spotlightParticipant && (
                <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
                  {/* Spotlight Stage */}
                  <div className="flex-1 min-h-[350px] bg-slate-900 rounded-2xl overflow-hidden border border-purple-500/40 shadow-2xl relative">
                    <LiveVideoTile
                      participant={spotlightParticipant}
                      stream={spotlightParticipant.isLocal ? (isScreenSharing && screenStream ? screenStream : localStream) : remoteStreams[spotlightParticipant.id]}
                      audioLevel={spotlightParticipant.isLocal ? audioLevel : 0.7}
                      isSpotlight={true}
                      showTeacherControls={true}
                    />
                  </div>

                  {/* Sidebar Tiles */}
                  <div className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto shrink-0 pb-1">
                    {participants.filter(p => p.id !== spotlightParticipant?.id).map(participant => (
                      <div key={participant.id} className="h-32 lg:h-36 shrink-0 w-44 lg:w-full">
                        <LiveVideoTile
                          participant={participant}
                          stream={participant.isLocal ? localStream : remoteStreams[participant.id]}
                          audioLevel={participant.isLocal ? audioLevel : 0}
                          isSpotlight={false}
                          onPinSpotlight={() => setSpotlightId(participant.id)}
                          onToggleMute={() => toggleParticipantAudio(participant.id)}
                          showTeacherControls={true}
                          compact={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LIVE FLOATING CAPTIONS SUBTITLE OVERLAY */}
              {isCaptionsEnabled && activeCaption && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40 max-w-2xl w-[92%] px-4 py-3 bg-slate-950/95 backdrop-blur-xl border border-emerald-500/50 rounded-2xl shadow-2xl animate-slideUp text-center">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Captions className="w-3 h-3 text-emerald-400" />
                        {activeCaption.speakerName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {sourceLanguage.flag} → {targetLanguage.flag} {targetLanguage.name} ({targetLanguage.code.toUpperCase()})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => speakText(activeCaption.translatedText || activeCaption.originalText, targetLanguage.speechLang)}
                        className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition cursor-pointer text-[10px] flex items-center gap-1 font-semibold"
                        title="Speak translated text using Text-to-Speech"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Speak</span>
                      </button>

                      <button
                        onClick={() => setActiveCaption(null)}
                        className="p-1 rounded-md bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition cursor-pointer"
                        title="Dismiss caption"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-100 leading-snug">
                    "{activeCaption.translatedText || activeCaption.originalText}"
                  </p>
                  {activeCaption.translatedText && activeCaption.translatedText !== activeCaption.originalText && (
                    <p className="text-xs text-slate-400 italic mt-0.5 line-clamp-1">
                      Original ({sourceLanguage.code}): {activeCaption.originalText}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEETING NOTES & AGENDA */}
          {activeTab === 'slides' && (
            <div className="flex-1 flex flex-col bg-slate-900 border border-brand-border rounded-2xl p-5 shadow-2xl space-y-4 max-w-4xl mx-auto w-full">
              <div className="flex justify-between items-center pb-3 border-b border-brand-border">
                <h3 className="text-base font-bold text-slate-100 flex items-center">
                  <Layers className="w-5 h-5 mr-2 text-purple-400" />
                  Shared Live Meeting Notes & Action Items
                </h3>
                <span className="text-xs text-purple-300 font-semibold bg-purple-600/20 px-2.5 py-1 rounded-lg border border-purple-500/30">
                  Auto-saved in Vault
                </span>
              </div>
              <textarea
                value={meetingNotes}
                onChange={e => setMeetingNotes(e.target.value)}
                rows={16}
                className="w-full bg-slate-950 border border-brand-border rounded-xl p-4 text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-purple-500 resize-none shadow-inner"
                placeholder="Type real-time meeting minutes, key takeaways, and action items..."
              />
            </div>
          )}
        </div>

        {/* RESIZABLE RIGHT SIDEBAR (WHITEBOARD, CHAT & CAPTIONS LOG) */}
        {isRightPanelOpen && (
          <>
            {/* Draggable Resize Handle (Desktop Only) */}
            <div
              onMouseDown={startResizing}
              className={`hidden md:block w-1.5 bg-brand-border hover:bg-purple-500 active:bg-purple-400 cursor-col-resize z-40 transition-colors ${
                isResizing ? 'bg-purple-500' : ''
              }`}
              title="Drag to resize right panel"
            />

            <div 
              style={{ width: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : `${rightPanelWidth}px` }} 
              className="fixed inset-0 z-50 md:relative md:inset-auto md:z-30 w-full bg-slate-900 md:border-l border-brand-border flex flex-col shrink-0 shadow-2xl relative md:min-w-[320px] md:max-w-[950px]"
            >
              {/* Right Panel Header with 3-Way Tabs */}
              <div className="p-2 sm:p-2.5 border-b border-brand-border flex justify-between items-center bg-slate-950 shrink-0">
                <div className="flex items-center space-x-1 bg-slate-900 p-0.5 sm:p-1 rounded-lg border border-slate-800 text-xs">
                  {isWhiteboardDrawerOpen && isChatDrawerOpen && (
                    <button
                      onClick={() => setRightPanelMode('split')}
                      className={`hidden sm:flex px-2.5 py-1 rounded font-semibold transition cursor-pointer items-center gap-1 ${
                        rightPanelMode === 'split' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Side-by-Side Split View"
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span>Split</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setRightPanelMode('tabs');
                      setActiveRightTab('whiteboard');
                      setIsWhiteboardDrawerOpen(true);
                    }}
                    className={`px-2.5 py-1.5 sm:py-1 rounded font-semibold transition cursor-pointer flex items-center gap-1 ${
                      (rightPanelMode === 'tabs' && activeRightTab === 'whiteboard') || (isWhiteboardDrawerOpen && !isChatDrawerOpen)
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Board</span>
                  </button>

                  <button
                    onClick={() => {
                      setRightPanelMode('tabs');
                      setActiveRightTab('chat');
                      setIsChatDrawerOpen(true);
                    }}
                    className={`px-2.5 py-1.5 sm:py-1 rounded font-semibold transition cursor-pointer flex items-center gap-1 ${
                      (rightPanelMode === 'tabs' && activeRightTab === 'chat') || (isChatDrawerOpen && !isWhiteboardDrawerOpen && activeRightTab === 'chat')
                        ? 'bg-purple-600 text-white' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>

                  <button
                    onClick={() => {
                      setRightPanelMode('tabs');
                      setActiveRightTab('captions');
                      setIsChatDrawerOpen(true);
                    }}
                    className={`px-2.5 py-1.5 sm:py-1 rounded font-semibold transition cursor-pointer flex items-center gap-1 ${
                      activeRightTab === 'captions' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Captions className="w-3.5 h-3.5" />
                    <span>Log ({captionsLog.length})</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setIsWhiteboardDrawerOpen(false);
                      setIsChatDrawerOpen(false);
                    }}
                    className="p-2 sm:p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Close Right Panel"
                  >
                    <X className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              {/* Right Panel Body */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {/* BOTH OPEN - SPLIT MODE */}
                {isWhiteboardDrawerOpen && isChatDrawerOpen && rightPanelMode === 'split' && (
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Whiteboard half */}
                    <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-brand-border p-2 min-h-0 overflow-hidden">
                      <VirtualWhiteboard
                        boardId={`meeting_wb_${activeCall.roomCode}`}
                        title={`Whiteboard • ${activeCall.title}`}
                        authorName={currentUser?.name || 'Meeting Host'}
                        heightClass="h-full min-h-[300px]"
                        showTeacherControls={true}
                      />
                    </div>

                    {/* Chat half */}
                    <div className="w-full md:w-72 flex flex-col min-h-0 shrink-0 bg-slate-950/40">
                      <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans text-xs">
                        {activeCall.messages?.map(msg => {
                          const isSys = msg.senderId === 'system';
                          const isMe = currentUser && msg.senderId === currentUser.id;

                          if (isSys) {
                            return (
                              <div key={msg.id} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 text-center italic">
                                {msg.text}
                              </div>
                            );
                          }

                          return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center space-x-1.5 mb-0.5 text-[10px] text-slate-400">
                                <span className="font-bold text-purple-300">{msg.senderName}</span>
                                <span>{msg.time}</span>
                                <button
                                  onClick={() => speakText(msg.text, targetLanguage.speechLang)}
                                  className="text-slate-400 hover:text-purple-300 transition"
                                  title="Read aloud"
                                >
                                  <Volume2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className={`p-2.5 rounded-xl max-w-[90%] text-slate-100 ${
                                isMe 
                                  ? 'bg-purple-600 text-white rounded-tr-none' 
                                  : 'bg-slate-800 border border-slate-700 rounded-tl-none'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatBottomRef} />
                      </div>

                      {/* Chat Input */}
                      <form onSubmit={handleSendChat} className="p-2.5 bg-slate-950 border-t border-brand-border flex items-center space-x-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          placeholder="Type message..."
                          className="flex-1 bg-slate-900 border border-brand-border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim()}
                          className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer shadow-md"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* TAB 1: WHITEBOARD ONLY */}
                {rightPanelMode === 'tabs' && activeRightTab === 'whiteboard' && (
                  <div className="flex-1 flex flex-col p-2 min-h-0 overflow-hidden">
                    <VirtualWhiteboard
                      boardId={`meeting_wb_${activeCall.roomCode}`}
                      title={`Whiteboard • ${activeCall.title}`}
                      authorName={currentUser?.name || 'Meeting Host'}
                      heightClass="h-full min-h-[450px]"
                      showTeacherControls={true}
                    />
                  </div>
                )}

                {/* TAB 2: CHAT ONLY */}
                {rightPanelMode === 'tabs' && activeRightTab === 'chat' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans text-xs">
                      {activeCall.messages?.map(msg => {
                        const isSys = msg.senderId === 'system';
                        const isMe = currentUser && msg.senderId === currentUser.id;

                        if (isSys) {
                          return (
                            <div key={msg.id} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 text-center italic">
                              {msg.text}
                            </div>
                          );
                        }

                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center space-x-1.5 mb-0.5 text-[10px] text-slate-400">
                              <span className="font-bold text-purple-300">{msg.senderName}</span>
                              <span>{msg.time}</span>
                              <button
                                onClick={() => speakText(msg.text, targetLanguage.speechLang)}
                                className="text-slate-400 hover:text-purple-300 transition"
                                title="Listen message with Text-to-Speech"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className={`p-2.5 rounded-xl max-w-[85%] text-slate-100 ${
                              isMe 
                                ? 'bg-purple-600 text-white rounded-tr-none' 
                                : 'bg-slate-800 border border-slate-700 rounded-tl-none'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat input box */}
                    <form onSubmit={handleSendChat} className="p-3 bg-slate-950 border-t border-brand-border flex items-center space-x-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Send message to call..."
                        className="flex-1 bg-slate-900 border border-brand-border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/20"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 3: CAPTIONS LOG & REAL-TIME TRANSLATION TRANSCRIPT */}
                {rightPanelMode === 'tabs' && activeRightTab === 'captions' && (
                  <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60">
                    {/* Log Controls Header */}
                    <div className="p-3 border-b border-brand-border bg-slate-900/80 flex flex-col gap-2 shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Captions className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-slate-100">Live Captions & Translation</h4>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setIsAutoScroll(prev => !prev)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                              isAutoScroll 
                                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                            title={isAutoScroll ? 'Auto-scroll is enabled' : 'Auto-scroll is paused'}
                          >
                            <ArrowDown className={`w-3 h-3 ${isAutoScroll ? 'text-emerald-400' : 'text-slate-500'}`} />
                            <span>{isAutoScroll ? 'Auto-scroll: ON' : 'Auto-scroll: OFF'}</span>
                          </button>

                          <button
                            onClick={restartSpeechEngine}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition cursor-pointer border border-slate-700"
                            title="Re-initialize speech recognition"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400" />
                          </button>

                          <button
                            onClick={() => setCaptionsLog([
                              {
                                id: `init-reset-${Date.now()}`,
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                speakerId: 'system',
                                speakerName: 'System',
                                originalText: 'Captions history cleared.',
                                translatedText: 'Captions history cleared.',
                                langCode: targetLanguage.code
                              }
                            ])}
                            className="p-1.5 bg-slate-800 hover:bg-red-600/80 text-slate-400 hover:text-white rounded-lg text-xs transition cursor-pointer"
                            title="Clear Captions Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={handleDownloadTranscript}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-lg text-[11px] font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                            title="Download Full Meeting Transcript (.txt)"
                          >
                            <Download className="w-3 h-3 text-emerald-400" />
                            <span>Export</span>
                          </button>
                        </div>
                      </div>

                      {/* Diagnostic Status Indicator */}
                      <div className={`px-2.5 py-1.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
                        isMicMuted
                          ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                          : speechEngineStatus === 'listening'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : speechEngineStatus === 'permission_denied'
                          ? 'bg-red-950/40 border-red-500/40 text-red-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}>
                        <div className="flex items-center gap-2 truncate">
                          {isMicMuted ? (
                            <>
                              <MicOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">Mic muted — Unmute to speak live captions</span>
                            </>
                          ) : speechEngineStatus === 'listening' ? (
                            <>
                              <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                              <span className="truncate">Listening ({sourceLanguage.flag} {sourceLanguage.name}) {audioLevel > 18 ? `• Active Voice (${audioLevel}%)` : ''}</span>
                            </>
                          ) : speechEngineStatus === 'permission_denied' ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              <span className="truncate">Mic permission required. Click presets or restart below</span>
                            </>
                          ) : (
                            <>
                              <Captions className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span className="truncate">Captions engine active — Speak or use presets</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {audioLevel > 15 && !isMicMuted && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              Voice
                            </span>
                          )}
                          <span className="text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-400">
                            {captionsLog.length} items
                          </span>
                        </div>
                      </div>

                      {/* Panel Quick Actions (Download, Copy All, Clear) */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 gap-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleDownloadTranscript}
                            disabled={captionsLog.length === 0}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold border border-slate-800 transition cursor-pointer flex items-center gap-1"
                            title="Download full meeting transcript"
                          >
                            <Download className="w-3 h-3 text-emerald-400" />
                            <span>Export</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyAllCaptions}
                            disabled={captionsLog.length === 0}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold border border-slate-800 transition cursor-pointer flex items-center gap-1"
                            title="Copy transcript to clipboard"
                          >
                            <Copy className="w-3 h-3 text-indigo-400" />
                            <span>Copy All</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleClearCaptions}
                          disabled={captionsLog.length === 0}
                          className="px-2 py-1 bg-slate-900 hover:bg-red-950/50 disabled:opacity-40 text-slate-400 hover:text-red-300 rounded-lg text-[10px] font-semibold border border-slate-800 hover:border-red-500/40 transition cursor-pointer flex items-center gap-1"
                          title="Clear current captions history"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      </div>

                      {/* Language Selectors Inside Panel */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Spoken Language (Input)</label>
                          <select
                            value={sourceLanguage.code}
                            onChange={e => {
                              const found = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                              if (found) setSourceLanguage(found);
                            }}
                            className="w-full bg-slate-950 border border-brand-border rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            {SUPPORTED_LANGUAGES.map(lang => (
                              <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                                {lang.flag} {lang.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Subtitles (Translation)</label>
                          <select
                            value={targetLanguage.code}
                            onChange={e => {
                              const found = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                              if (found) setTargetLanguage(found);
                            }}
                            className="w-full bg-slate-950 border border-brand-border rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            {SUPPORTED_LANGUAGES.map(lang => (
                              <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                                {lang.flag} {lang.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Search in transcripts */}
                      <div className="relative mt-1">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={captionSearchQuery}
                          onChange={e => setCaptionSearchQuery(e.target.value)}
                          placeholder="Search captions & translations..."
                          className="w-full bg-slate-950 border border-brand-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Quick Speech Presets Pill Bar */}
                    <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/40 shrink-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Sparkle className="w-3 h-3 text-purple-400" />
                          Quick Broadcast Presets
                        </span>
                        <span className="text-[10px] text-slate-500">1-click speak & caption</span>
                      </div>

                      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {QUICK_SPEECH_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleBroadcastManualCaption(preset.text)}
                            className="shrink-0 px-2.5 py-1 bg-slate-900 hover:bg-emerald-600/90 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium border border-slate-800 hover:border-emerald-500 transition cursor-pointer flex items-center gap-1 shadow-sm"
                            title={`Broadcast: "${preset.text}"`}
                          >
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Log List Container with Auto-Scroll & Scroll Event */}
                    <div 
                      ref={captionsContainerRef}
                      onScroll={handleCaptionsScroll}
                      className="flex-1 p-3 overflow-y-auto space-y-2.5 font-sans text-xs relative min-h-0"
                    >
                      {filteredCaptions.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs space-y-2">
                          <Captions className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                          <p>No captions matching "{captionSearchQuery}"</p>
                          <p className="text-[11px] text-slate-600">Speak into your mic or click a quick preset above to generate live captions.</p>
                        </div>
                      ) : (
                        filteredCaptions.map(cap => (
                          <div
                            key={cap.id}
                            className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition space-y-1.5 shadow-sm"
                          >
                            <div className="flex justify-between items-center text-[10px]">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-emerald-300">{cap.speakerName}</span>
                                <span className="text-slate-500">{cap.timestamp}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-mono uppercase text-slate-300 border border-slate-700">
                                  {cap.langCode}
                                </span>
                                <button
                                  onClick={() => speakText(cap.translatedText || cap.originalText, targetLanguage.speechLang)}
                                  className="p-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition cursor-pointer"
                                  title="Listen with TTS"
                                >
                                  <Volume2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <p className="text-slate-100 font-medium leading-relaxed">
                              {cap.translatedText}
                            </p>

                            {cap.originalText && cap.originalText !== cap.translatedText && (
                              <p className="text-[11px] text-slate-400 italic border-t border-slate-800/60 pt-1">
                                Original: "{cap.originalText}"
                              </p>
                            )}
                          </div>
                        ))
                      )}

                      {/* Real-time Interim Live Voice Feedback */}
                      {Boolean(interimLiveText || (audioLevel > 18 && !isMicMuted)) && (
                        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 animate-pulse flex items-start gap-2 shadow-lg">
                          <Radio className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-spin" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold mb-0.5">
                              <span>Speaking right now ({currentUser?.name || 'You'})</span>
                              <span className="font-mono bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-200 border border-emerald-600/40">
                                {audioLevel}% Mic
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-white italic mb-1">
                              "{interimLiveText || 'Listening to your speech...'}"
                            </p>
                            {interimLiveTranslation && (
                              <div className="mt-1 p-1.5 rounded-lg bg-emerald-900/40 border border-emerald-500/30 text-[11px] text-emerald-100">
                                <span className="text-[9px] font-bold uppercase text-emerald-400 block mb-0.5">
                                  {targetLanguage.flag} {targetLanguage.name} Live Subtitle:
                                </span>
                                {interimLiveTranslation}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div ref={captionsBottomRef} className="h-1" />

                      {/* Floating Scroll to Latest Pill */}
                      {!isAutoScroll && (
                        <div className="sticky bottom-2 flex justify-center z-20 pointer-events-auto">
                          <button
                            onClick={() => {
                              setIsAutoScroll(true);
                              captionsContainerRef.current?.scrollTo({
                                top: captionsContainerRef.current.scrollHeight,
                                behavior: 'smooth'
                              });
                              captionsBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xl shadow-emerald-950/80 border border-emerald-400/50 flex items-center gap-1.5 transition cursor-pointer animate-bounce"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                            <span>Scroll to latest captions</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Manual Type & Broadcast Caption Input */}
                    <form 
                      onSubmit={e => {
                        e.preventDefault();
                        if (customCaptionInput.trim()) {
                          handleBroadcastManualCaption(customCaptionInput);
                          setCustomCaptionInput('');
                        }
                      }} 
                      className="p-2.5 bg-slate-950 border-t border-brand-border flex items-center space-x-2 shrink-0"
                    >
                      <input
                        type="text"
                        value={customCaptionInput}
                        onChange={e => setCustomCaptionInput(e.target.value)}
                        placeholder="Type live caption to broadcast..."
                        className="flex-1 bg-slate-900 border border-brand-border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={!customCaptionInput.trim()}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center gap-1"
                        title="Broadcast Caption to Room"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Caption</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* CONFERENCE BOTTOM CONTROL BAR */}
      <footer className="shrink-0 z-20">
        {/* MOBILE CONTROL DOCK (< md) */}
        <div className="flex md:hidden justify-between items-center px-3 py-2.5 bg-slate-900/98 backdrop-blur-xl border-t border-brand-border gap-2">
          {/* Mic */}
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer shadow-md ${
              isMicMuted 
                ? 'bg-red-600 text-white shadow-red-600/30' 
                : 'bg-slate-800 text-slate-200 border border-slate-700 active:scale-95'
            }`}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer shadow-md ${
              isVideoMuted 
                ? 'bg-red-600 text-white shadow-red-600/30' 
                : 'bg-slate-800 text-slate-200 border border-slate-700 active:scale-95'
            }`}
            title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5 text-purple-400" />}
          </button>

          {/* Leave Call */}
          <button
            onClick={leaveCall}
            className="px-4 h-12 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black tracking-wide uppercase transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/30 active:scale-95"
            title="Leave Call"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave</span>
          </button>

          {/* Chat & Captions Drawer Launcher */}
          <button
            onClick={() => {
              setIsChatDrawerOpen(true);
              setActiveRightTab('chat');
            }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer border relative ${
              isChatDrawerOpen
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-slate-800 text-slate-200 border-slate-700 active:scale-95'
            }`}
            title="Open Chat & Captions Drawer"
          >
            <MessageSquare className="w-5 h-5 text-purple-300" />
            {captionsLog.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-[9px] font-bold text-slate-950">
                {captionsLog.length > 99 ? '99+' : captionsLog.length}
              </span>
            )}
          </button>

          {/* More Options / Settings Action Sheet */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-12 h-12 rounded-2xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-300 flex items-center justify-center transition cursor-pointer active:scale-95 shadow-md"
            title="More Options & Language Settings"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* DESKTOP CONTROL DOCK (≥ md) */}
        <div className="hidden md:flex p-3.5 bg-slate-900/95 backdrop-blur-md border-t border-brand-border flex-wrap justify-between items-center gap-3">
          {/* Left Side Status */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-brand-border text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold">{participants.length} Active</span>
            </div>

            {/* Live Captions Toggle */}
            <button
              onClick={() => setIsCaptionsEnabled(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isCaptionsEnabled 
                  ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Live Subtitles & AI Translations"
            >
              <Captions className="w-4 h-4 text-emerald-400" />
              <span>Captions: {isCaptionsEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Text-to-Speech Toggle Button */}
            <button
              onClick={() => setIsTtsEnabled(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isTtsEnabled 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Text-to-Speech Audio engine"
            >
              {isTtsEnabled ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4" />}
              <span>TTS: {isTtsEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {raisedHandsCount > 0 && (
              <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-bounce">
                <Hand className="w-4 h-4 fill-amber-400" />
                <span>{raisedHandsCount} Hand{raisedHandsCount > 1 ? 's' : ''} Raised</span>
              </div>
            )}
          </div>

          {/* Center Media Controls */}
          <div className="flex items-center space-x-2">
            {/* Mute Mic */}
            <button
              onClick={toggleMic}
              className={`p-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-lg ${
                isMicMuted 
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
              <span className="hidden sm:inline">{isMicMuted ? 'Muted' : 'Mic'}</span>
            </button>

            {/* Toggle Video */}
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-lg ${
                isVideoMuted 
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-purple-400" />}
              <span className="hidden sm:inline">{isVideoMuted ? 'Camera Off' : 'Camera'}</span>
            </button>

            {/* Share Screen */}
            <button
              onClick={toggleScreenShare}
              className={`px-3 sm:px-4 py-3 rounded-xl transition cursor-pointer flex items-center gap-2 text-xs font-bold shadow-lg ${
                isScreenSharing 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Your Screen'}
            >
              <Tv className={`w-4 h-4 ${isScreenSharing ? 'text-white' : 'text-blue-400'}`} />
              <span className="hidden sm:inline">{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
            </button>

            {/* Raise Hand */}
            <button
              onClick={toggleHandRaise}
              className={`px-3 sm:px-4 py-3 rounded-xl transition cursor-pointer flex items-center gap-2 text-xs font-bold shadow-lg ${
                isHandRaised 
                  ? 'bg-amber-500 text-slate-950' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Raise Hand"
            >
              <Hand className={`w-4 h-4 ${isHandRaised ? 'fill-slate-950' : 'text-amber-400'}`} />
              <span className="hidden md:inline">{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
            </button>

            {/* Mute All */}
            <button
              onClick={muteAllStudents}
              className="px-3 sm:px-4 py-3 bg-slate-800 hover:bg-red-600/30 text-red-300 hover:text-red-100 rounded-xl text-xs font-bold border border-red-500/30 transition flex items-center gap-1.5 cursor-pointer"
              title="Mute All Microphones"
            >
              <VolumeX className="w-4 h-4" />
              <span className="hidden lg:inline">Mute All</span>
            </button>

            {/* End / Leave Call */}
            <button
              onClick={leaveCall}
              className="px-4 sm:px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black tracking-wide uppercase transition flex items-center gap-2 cursor-pointer shadow-xl shadow-red-600/30"
              title="Leave Call"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave</span>
            </button>
          </div>

          {/* Right drawer toggles */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsWhiteboardDrawerOpen(true);
                setActiveRightTab('whiteboard');
              }}
              className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isWhiteboardDrawerOpen && activeRightTab === 'whiteboard'
                  ? 'bg-indigo-600 text-white border-indigo-500' 
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
              title="Open Live Whiteboard on Right Side"
            >
              <PenTool className="w-4 h-4 text-indigo-300" />
              <span className="hidden sm:inline">Whiteboard</span>
            </button>

            <button
              onClick={() => {
                setIsChatDrawerOpen(true);
                setActiveRightTab('chat');
              }}
              className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isChatDrawerOpen && activeRightTab === 'chat'
                  ? 'bg-purple-600 text-white border-purple-500' 
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
              title="Open Live Chat on Right Side"
            >
              <MessageSquare className="w-4 h-4 text-purple-300" />
              <span className="hidden sm:inline">Chat</span>
            </button>

            <button
              onClick={() => {
                setIsChatDrawerOpen(true);
                setActiveRightTab('captions');
              }}
              className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isChatDrawerOpen && activeRightTab === 'captions'
                  ? 'bg-emerald-600 text-white border-emerald-500' 
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
              title="Open Live Captions Transcript Log"
            >
              <Captions className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Captions</span>
            </button>
          </div>
        </div>
      </footer>

      {/* MOBILE ACTION SHEET MODAL */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-fadeIn md:hidden">
          <div 
            className="fixed inset-0"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative bg-slate-900 border-t border-purple-500/40 rounded-t-3xl p-4 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl z-10 animate-slideUp">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-1" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Call Settings & Tools</h3>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  toggleHandRaise();
                }}
                className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold transition border ${
                  isHandRaised 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/20' 
                    : 'bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                <Hand className={`w-4 h-4 ${isHandRaised ? 'fill-slate-950' : 'text-amber-400'}`} />
                <span>{isHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
              </button>

              <button
                onClick={() => {
                  toggleScreenShare();
                }}
                className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold transition border ${
                  isScreenSharing 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' 
                    : 'bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                <Tv className="w-4 h-4 text-blue-400" />
                <span>{isScreenSharing ? 'Stop Screen' : 'Share Screen'}</span>
              </button>

              <button
                onClick={() => {
                  setIsWhiteboardDrawerOpen(true);
                  setActiveRightTab('whiteboard');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-2.5 text-xs font-bold transition"
              >
                <PenTool className="w-4 h-4 text-indigo-400" />
                <span>Whiteboard</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('slides');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-2.5 text-xs font-bold transition"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Meeting Agenda</span>
              </button>

              <button
                onClick={() => {
                  setIsChatDrawerOpen(true);
                  setActiveRightTab('captions');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-2.5 text-xs font-bold transition"
              >
                <Captions className="w-4 h-4 text-emerald-400" />
                <span>Captions Log ({captionsLog.length})</span>
              </button>

              <button
                onClick={muteAllStudents}
                className="p-3 rounded-2xl bg-slate-800 border border-red-500/30 text-red-300 flex items-center gap-2.5 text-xs font-bold transition"
              >
                <VolumeX className="w-4 h-4" />
                <span>Mute Students</span>
              </button>
            </div>

            {/* Language & Captions Section */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-indigo-400" />
                  Live Audio & Translation
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Real-Time AI</span>
              </div>

              {/* Spoken Language Picker */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Mic className="w-3 h-3 text-emerald-400" />
                  Spoken Language (Your Voice Input):
                </label>
                <select
                  value={sourceLanguage.code}
                  onChange={e => {
                    const found = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                    if (found) setSourceLanguage(found);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-500"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Subtitles Language Picker */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Languages className="w-3 h-3 text-indigo-400" />
                  Subtitles Language (Screen Display):
                </label>
                <select
                  value={targetLanguage.code}
                  onChange={e => {
                    const found = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                    if (found) setTargetLanguage(found);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-500"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setIsCaptionsEnabled(prev => !prev)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                    isCaptionsEnabled
                      ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Captions className="w-3.5 h-3.5 text-emerald-400" />
                    Subtitles
                  </span>
                  <span className="text-[10px] uppercase font-mono">{isCaptionsEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => setIsTtsEnabled(prev => !prev)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                    isTtsEnabled
                      ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    TTS Reader
                  </span>
                  <span className="text-[10px] uppercase font-mono">{isTtsEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Room Info & Invite */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Room Code</p>
                <p className="text-xs font-mono font-bold text-purple-300">{activeCall.roomCode}</p>
              </div>
              <button
                onClick={handleCopyInvite}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
