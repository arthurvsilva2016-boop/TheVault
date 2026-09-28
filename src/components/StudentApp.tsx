import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles,
  CalendarDays, 
  Calendar, 
  FileText, FolderOpen, Eye, 
  CreditCard, 
  LogOut, 
  CheckCircle, 
  Video, 
  User, 
  MessageSquare, 
  PenTool, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Smile, 
  ShieldCheck, 
  ArrowLeft, 
  Users, 
  Hash, 
  Clock, 
  Download, 
  Share2, 
  Columns, 
  Maximize2,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Award,
  Bell,
  X,
  ExternalLink,
  ChevronDown,
  Mic,
  MicOff,
  Square,
  Globe,
  Loader2,
  Settings,
  Search,
  Pin,
  Radio,
  Headphones,
  Volume2,
  Languages,
  Captions,
  RefreshCw,
  ArrowDown,
  FileDown,
  Copy,
  Check,
  Sparkle,
  AlertCircle,
  MessageSquareQuote,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SaveButton from './SaveButton';
import VirtualWhiteboard from './VirtualWhiteboard';
import VaultCallOverlay from './calling/VaultCallOverlay';
import { CaptionHistoryView, CaptionLogItem } from './calling/CaptionHistoryView';
import World from './game/World';
import { useLiveCall } from '../context/LiveCallContext';
import { Student, Group, ClassSession, Transaction, Employee, EmployeeChatMessage, ChatAttachment } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
  SUPPORTED_LANGUAGES, 
  SupportedLanguage, 
  QUICK_SPEECH_PRESETS,
  translateCaption, 
  speakText 
} from '../utils/translationService';

interface StudentAppProps {
  student: Student;
  allStudents?: Student[];
  onSelectStudent?: (studentId: string) => void;
  groups: Group[];
  classSessions: ClassSession[];
  transactions: Transaction[];
  onLogout: () => void;
  onUpdateStudent: (updated: Student) => void;
  isAdminViewing?: boolean;
  activeEmployee?: Employee;
  onExitStudentMode?: () => void;
  messages?: EmployeeChatMessage[];
  onSendMessage?: (msg: EmployeeChatMessage) => void;
  onDeleteMessage?: (id: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onTogglePin?: (messageId: string) => void;
  onMarkMessageRead?: (messageId: string, readerId: string) => void;
}

export default function StudentApp({
  student,
  allStudents = [],
  onSelectStudent,
  groups,
  classSessions,
  transactions,
  onLogout,
  onUpdateStudent,
  isAdminViewing = false,
  activeEmployee,
  onExitStudentMode,
  messages = [],
  onSendMessage,
  onDeleteMessage,
  onToggleReaction,
  onTogglePin,
  onMarkMessageRead
}: StudentAppProps) {
  const { 
    activeCall, 
    startCall, 
    joinCall, 
    broadcastLiveCaption, 
    isMicMuted 
  } = useLiveCall();
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'whiteboard' | 'calendar' | 'grades' | 'finance' | 'profile' | 'files' | 'game' | 'preferences'>('overview');
  const { t } = useLanguage();

  const cleanGroup = student.group ? String(student.group).trim().toLowerCase() : '';
  const myGroup = groups.find(g => 
    (g.code && String(g.code).trim().toLowerCase() === cleanGroup) || 
    (g.id && String(g.id).trim().toLowerCase() === cleanGroup) || 
    (g.name && String(g.name).trim().toLowerCase() === cleanGroup) ||
    (cleanGroup === '1' && (g.name === 'Group Alpha' || g.code === '1')) ||
    (cleanGroup === '2' && (g.name === 'Group Beta' || g.code === '2')) ||
    (cleanGroup === '3' && (g.name === 'Group Gamma' || g.code === '3'))
  );
  
  const mySessions = classSessions.filter(cs => 
    (myGroup && (cs.groupId === myGroup.id || cs.groupCode === myGroup.code)) || 
    (cs.attendance && cs.attendance.some(a => a.studentId === student.id)) ||
    (cs.grades && cs.grades.some(g => g.studentId === student.id))
  );
  const myTransactions = transactions.filter(tx => tx.studentId === student.id || tx.studentName === student.name);

  // Profile update handling
  const [editedName, setEditedName] = useState(student.name);
  const [editedUsername, setEditedUsername] = useState(student.username);
        
  // Student Chat state
  const defaultChannelId = myGroup ? `group_${myGroup.code || myGroup.id}` : 'general';
  const [activeChannelId, setActiveChannelId] = useState<string>(defaultChannelId);
  const [chatMessageText, setChatMessageText] = useState('');
  const [chatViewLayout, setChatViewLayout] = useState<'chat' | 'split' | 'whiteboard' | 'captions'>('chat');
  const [isCaptionHistoryOverlayOpen, setIsCaptionHistoryOverlayOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const [chatAttachments, setChatAttachments] = useState<ChatAttachment[]>([]);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const getFileThumbnail = (att: ChatAttachment, isPreviewMode: boolean = false) => {
    const ext = att.name.split('.').pop()?.toLowerCase();
    
    if (ext === 'pdf') {
      return (
        <div className={`${isPreviewMode ? 'w-12 h-12' : 'w-10 h-12 shrink-0'} rounded-lg bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center`}>
          <FileText className={`${isPreviewMode ? 'w-4 h-4' : 'w-5 h-5'} text-red-400 mb-0.5`} />
          <span className="text-[7px] font-bold text-red-400 uppercase">PDF</span>
        </div>
      );
    }
    
    if (ext === 'doc' || ext === 'docx') {
      return (
        <div className={`${isPreviewMode ? 'w-12 h-12' : 'w-10 h-12 shrink-0'} rounded-lg bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center`}>
          <FileText className={`${isPreviewMode ? 'w-4 h-4' : 'w-5 h-5'} text-blue-400 mb-0.5`} />
          <span className="text-[7px] font-bold text-blue-400 uppercase">DOC</span>
        </div>
      );
    }

    return (
      <div className={`${isPreviewMode ? 'w-12 h-12' : 'w-10 h-12 shrink-0'} rounded-lg bg-brand-card border border-brand-border flex items-center justify-center`}>
        <FileText className={`${isPreviewMode ? 'w-4 h-4' : 'w-5 h-5'} text-slate-400`} />
      </div>
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Language & Translation State
  const [preferredLanguage, setPreferredLanguage] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0]); // Subtitles target
  const [inputLanguage, setInputLanguage] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0]); // Voice input language
  const [isCaptionsAutoScroll, setIsCaptionsAutoScroll] = useState<boolean>(true);
  const [speechEngineStatus, setSpeechEngineStatus] = useState<'listening' | 'idle' | 'muted' | 'unsupported' | 'error' | 'permission_denied'>('idle');
  const [engineRestartCount, setEngineRestartCount] = useState<number>(0);
  const [captionHistorySearch, setCaptionHistorySearch] = useState<string>('');
  const [copiedCaptionId, setCopiedCaptionId] = useState<string | null>(null);
  const [copiedAllTranscript, setCopiedAllTranscript] = useState<boolean>(false);
  const [ttsEnabledForCaptions, setTtsEnabledForCaptions] = useState<boolean>(false);
  const [interimSpeechText, setInterimSpeechText] = useState<string>('');

  // Active floating subtitle
  const [activeLiveCaption, setActiveLiveCaption] = useState<{
    id: string;
    speakerName: string;
    originalText: string;
    translatedText?: string;
    targetLang: string;
  } | null>(null);

  // Chronological full session transcript
  const [captionsLog, setCaptionsLog] = useState<Array<{
    id: string;
    timestamp: string;
    speakerId: string;
    speakerName: string;
    speakerRole?: string;
    originalText: string;
    translatedText?: string;
    langCode: string;
    isLocal?: boolean;
  }>>([
    {
      id: 'cap-init-welcome',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      speakerId: 'sys-welcome',
      speakerName: 'Vault Class System',
      speakerRole: 'System',
      originalText: 'Welcome to class! Live captions and real-time translation are active.',
      translatedText: 'Welcome to class! Live captions and real-time translation are active.',
      langCode: 'en',
      isLocal: false
    }
  ]);

  const captionsContainerRef = useRef<HTMLDivElement | null>(null);
  const captionsEndRef = useRef<HTMLDivElement | null>(null);
  const processedCaptionsRef = useRef<Set<string>>(new Set(['cap-init-welcome']));
  const captionDismissTimerRef = useRef<any>(null);
  const interimDebounceTimerRef = useRef<any>(null);
  const currentInterimTextRef = useRef<string>('');
  const micStreamRef = useRef<MediaStream | null>(null);

  // Voice Recording State & Mode
  const [voiceRecognitionMode, setVoiceRecognitionMode] = useState<'push-to-talk' | 'hands-free'>('push-to-talk');
  const [isAutoScrollLocked, setIsAutoScrollLocked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionMode, setTranscriptionMode] = useState<'live' | 'text'>('live');
  const [autoInsertTranscription, setAutoInsertTranscription] = useState(true);
  const [pendingTranscription, setPendingTranscription] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const isHandsFreeRunningRef = useRef(false);

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const avg = sum / dataArray.length;
    // Map avg (0-255) to 0-100
    setAudioLevel(Math.min(100, Math.round((avg / 255) * 100 * 1.5)));
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  // Synchronize incoming room call live captions into captionsLog with translation
  useEffect(() => {
    if (!activeCall?.liveCaptions?.length) return;
    const latestCaptions = activeCall.liveCaptions;
    
    latestCaptions.forEach(async (cap) => {
      const capKey = `${cap.speakerId}-${cap.timestamp}-${cap.originalText}`;
      if (!processedCaptionsRef.current.has(capKey)) {
        processedCaptionsRef.current.add(capKey);

        const translated = await translateCaption(cap.originalText, preferredLanguage.code, cap.sourceLang || 'en');

        // Set active floating caption
        setActiveLiveCaption({
          id: `cap-active-${Date.now()}`,
          speakerName: cap.speakerName,
          originalText: cap.originalText,
          translatedText: translated,
          targetLang: preferredLanguage.code
        });

        if (captionDismissTimerRef.current) clearTimeout(captionDismissTimerRef.current);
        captionDismissTimerRef.current = setTimeout(() => {
          setActiveLiveCaption(null);
        }, 5000);

        // Append to caption history log
        setCaptionsLog(prev => [
          ...prev,
          {
            id: `cap-room-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date(cap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            speakerId: cap.speakerId,
            speakerName: cap.speakerName,
            speakerRole: cap.speakerId === student.id ? 'Student' : 'Classroom',
            originalText: cap.originalText,
            translatedText: translated,
            langCode: preferredLanguage.code,
            isLocal: cap.speakerId === student.id
          }
        ]);

        if (ttsEnabledForCaptions && cap.speakerId !== student.id) {
          speakText(translated || cap.originalText, preferredLanguage.speechLang);
        }
      }
    });
  }, [activeCall?.liveCaptions, preferredLanguage.code, preferredLanguage.speechLang, ttsEnabledForCaptions, student.id]);

  // Dynamically re-translate all existing captions when student switches preferredLanguage
  const handlePreferredLanguageChange = async (newLang: SupportedLanguage) => {
    setPreferredLanguage(newLang);
    showToast(`🌐 Subtitles translated to ${newLang.flag} ${newLang.name}`);
    
    const updated = await Promise.all(
      captionsLog.map(async (item) => {
        if (item.originalText) {
          const translated = await translateCaption(item.originalText, newLang.code, inputLanguage.code);
          return {
            ...item,
            translatedText: translated,
            langCode: newLang.code
          };
        }
        return item;
      })
    );
    setCaptionsLog(updated);

    if (activeLiveCaption && activeLiveCaption.originalText) {
      const activeTrans = await translateCaption(activeLiveCaption.originalText, newLang.code, inputLanguage.code);
      setActiveLiveCaption(prev => prev ? {
        ...prev,
        translatedText: activeTrans,
        targetLang: newLang.code
      } : null);
    }
  };

  // Commit a raw transcript item (translates, updates history, broadcasts, and inserts to chat)
  const commitSpeechTranscript = async (rawText: string) => {
    if (!rawText || rawText.trim().length < 1) return;
    const cleanText = rawText.trim();
    const capId = `cap-local-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    processedCaptionsRef.current.add(capId);

    const translated = await translateCaption(cleanText, preferredLanguage.code, inputLanguage.code);

    // Broadcast to room peers if live call context is active
    if (broadcastLiveCaption) {
      broadcastLiveCaption({
        speakerId: student.id,
        speakerName: student.name,
        originalText: cleanText,
        sourceLang: inputLanguage.code
      });
    }

    // Set floating live subtitle
    setActiveLiveCaption({
      id: capId,
      speakerName: student.name,
      originalText: cleanText,
      translatedText: translated,
      targetLang: preferredLanguage.code
    });

    if (captionDismissTimerRef.current) clearTimeout(captionDismissTimerRef.current);
    captionDismissTimerRef.current = setTimeout(() => {
      setActiveLiveCaption(null);
    }, 5000);

    // Commit to caption history log
    setCaptionsLog(prev => [
      ...prev,
      {
        id: capId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        speakerId: student.id,
        speakerName: student.name,
        speakerRole: 'Student',
        originalText: cleanText,
        translatedText: translated,
        langCode: preferredLanguage.code,
        isLocal: true
      }
    ]);

    // Insert into chat if auto-insert is enabled
    if (autoInsertTranscription) {
      setChatMessageText(prev => (prev ? prev.trim() + ' ' : '') + cleanText);
      showToast("Speech added to chat message.");
    } else {
      setPendingTranscription(cleanText);
    }

    if (ttsEnabledForCaptions) {
      speakText(translated || cleanText, preferredLanguage.speechLang);
    }
  };

  // Auto-scroll caption history container when new captions arrive
  useEffect(() => {
    if (isCaptionsAutoScroll && (chatViewLayout === 'captions' || isCaptionHistoryOverlayOpen)) {
      if (captionsContainerRef.current) {
        captionsContainerRef.current.scrollTo({
          top: captionsContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
      captionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [captionsLog, activeLiveCaption, interimSpeechText, isCaptionsAutoScroll, chatViewLayout, isCaptionHistoryOverlayOpen]);

  const handleCaptionsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 60;
    setIsCaptionsAutoScroll(isNearBottom);
  };

  const handleDownloadCaptionsTranscript = () => {
    if (captionsLog.length === 0) {
      showToast("No captions to download yet.");
      return;
    }
    const transcriptText = captionsLog.map(c => 
      `[${c.timestamp}] ${c.speakerName} (${c.speakerRole || 'Participant'})\n` +
      `Original: ${c.originalText}\n` +
      (c.translatedText && c.translatedText !== c.originalText ? `Translated (${c.langCode.toUpperCase()}): ${c.translatedText}\n` : '') +
      `----------------------------------------`
    ).join('\n\n');

    const fullContent = `VAULT CLASS MEETING TRANSCRIPT\nStudent: ${student.name} (${student.id})\nGroup: ${myGroup?.name || 'Class'}\nDate: ${new Date().toLocaleDateString()}\nTime: ${new Date().toLocaleTimeString()}\nPreferred Subtitle Language: ${preferredLanguage.name} (${preferredLanguage.code})\nTotal Captions: ${captionsLog.length}\n========================================\n\n${transcriptText}`;

    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `class-captions-${student.username || 'student'}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("📄 Caption transcript downloaded!");
  };

  const handleCopyAllTranscript = () => {
    if (captionsLog.length === 0) return;
    const text = captionsLog.map(c => `[${c.timestamp}] ${c.speakerName}: ${c.translatedText || c.originalText}`).join('\n');
    navigator.clipboard?.writeText(text);
    setCopiedAllTranscript(true);
    showToast("📋 Full transcript copied to clipboard!");
    setTimeout(() => setCopiedAllTranscript(false), 2500);
  };

  const handleCopySingleCaption = (captionId: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCaptionId(captionId);
    showToast("Caption line copied!");
    setTimeout(() => setCopiedCaptionId(null), 2000);
  };

  // Start real-time speech recognition engine
  const startSpeechEngine = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      // 1. Initialize audio analyser for real-time visual waveform
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          audioContextRef.current = new AudioContext();
          const source = audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          source.connect(analyserRef.current);
          updateAudioLevel();
        }
      } catch (streamErr) {
        console.warn("Could not attach audio analyser:", streamErr);
      }

      if (!SpeechRecognition) {
        setSpeechEngineStatus('unsupported');
        setIsRecording(true);
        showToast("⚠️ Browser Speech API not available. Voice note recording active.");
        startRecordingFallback();
        return;
      }

      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = inputLanguage.speechLang || 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        isHandsFreeRunningRef.current = true;
        setSpeechEngineStatus('listening');
        showToast(`🎙️ Microphone active (${inputLanguage.flag} ${inputLanguage.name}) — Subtitles in ${preferredLanguage.flag} ${preferredLanguage.name}`);
      };

      recognition.onresult = async (event: any) => {
        let interimChunk = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += trans + ' ';
          } else {
            interimChunk += trans + ' ';
          }
        }

        if (interimChunk.trim()) {
          const interim = interimChunk.trim();
          currentInterimTextRef.current = interim;
          setInterimSpeechText(interim);

          // Real-time live subtitle preview
          const translatedInterim = await translateCaption(interim, preferredLanguage.code, inputLanguage.code);
          setActiveLiveCaption({
            id: 'interim-live',
            speakerName: student.name,
            originalText: interim,
            translatedText: translatedInterim,
            targetLang: preferredLanguage.code
          });

          // Debounce interim chunk to commit if speech stops without an isFinal event
          if (interimDebounceTimerRef.current) clearTimeout(interimDebounceTimerRef.current);
          interimDebounceTimerRef.current = setTimeout(() => {
            if (currentInterimTextRef.current && isHandsFreeRunningRef.current) {
              const textToCommit = currentInterimTextRef.current;
              currentInterimTextRef.current = '';
              setInterimSpeechText('');
              commitSpeechTranscript(textToCommit);
            }
          }, 2400);
        }

        if (finalChunk.trim()) {
          if (interimDebounceTimerRef.current) clearTimeout(interimDebounceTimerRef.current);
          currentInterimTextRef.current = '';
          setInterimSpeechText('');
          await commitSpeechTranscript(finalChunk.trim());
          if (voiceRecognitionMode === 'push-to-talk') {
            stopSpeechEngine();
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setSpeechEngineStatus('permission_denied');
          showToast("❌ Microphone permission denied. Enable microphone in browser settings.");
          stopSpeechEngine();
        } else if (event.error !== 'no-speech') {
          setSpeechEngineStatus('error');
        }
      };

      recognition.onend = () => {
        if (isHandsFreeRunningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setTimeout(() => {
              if (isHandsFreeRunningRef.current) {
                try { recognition.start(); } catch (err) {}
              }
            }, 300);
          }
        } else {
          setSpeechEngineStatus('idle');
          setIsRecording(false);
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition startup error:", err);
      setSpeechEngineStatus('error');
      startRecordingFallback();
    }
  };

  const stopSpeechEngine = () => {
    isHandsFreeRunningRef.current = false;
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    setAudioLevel(0);
    setInterimSpeechText('');
    setIsRecording(false);
    setSpeechEngineStatus('idle');
  };

  const restartSpeechEngine = () => {
    stopSpeechEngine();
    setEngineRestartCount(prev => prev + 1);
    setTimeout(() => {
      startSpeechEngine();
      showToast("🔄 Speech engine re-initialized!");
    }, 400);
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopSpeechEngine();
      showToast("Microphone muted / stopped.");
    } else {
      startSpeechEngine();
    }
  };

  useEffect(() => {
    return () => {
      isHandsFreeRunningRef.current = false;
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.abort(); } catch (e) {}
      }
      if (captionDismissTimerRef.current) clearTimeout(captionDismissTimerRef.current);
      if (interimDebounceTimerRef.current) clearTimeout(interimDebounceTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startRecordingFallback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        const newAttachment: ChatAttachment = {
          id: `att-audio-${Date.now()}`,
          name: `Voice_Note_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`,
          url: url,
          type: 'file',
          size: audioBlob.size,
          mimeType: 'audio/webm'
        };
        setChatAttachments(prev => [...prev, newAttachment]);
        showToast("Voice note attached to message.");
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone fallback:", err);
      showToast("Microphone access is required to use voice notes.");
    }
  };

  const stopRecording = () => {
    stopSpeechEngine();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSaveProfile = () => {
    onUpdateStudent({
      ...student,
      name: editedName,
      username: editedUsername
    });
  };

  
  

  const upcomingSession = mySessions
    .filter(s => s.status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  // Channels available for student
  const studentChannels = [
    {
      id: myGroup ? `group_${myGroup.code || myGroup.id}` : 'group_general',
      name: myGroup ? `${myGroup.name || `Group ${myGroup.code}`}` : 'My Study Group',
      desc: myGroup ? `Class discussion & whiteboard (${myGroup.schedule})` : 'Class discussion',
      icon: Users,
      badge: myGroup ? `Group ${myGroup.code}` : 'Class'
    },
    {
      id: 'general',
      name: 'School Lounge',
      desc: 'General school chat, news and announcements',
      icon: Hash,
      badge: 'Public'
    },
    {
      id: `dm_${student.id}_teacher`,
      name: myGroup?.teacher ? `Teacher: ${myGroup.teacher}` : 'Teacher Helpdesk',
      desc: 'Private questions to your instructor',
      icon: User,
      badge: 'Direct'
    }
  ];

  // Filter messages for active channel
  const channelMessages = messages.filter(m => m.channelId === activeChannelId);
  const displayedMessages = channelMessages.filter(m => !searchQuery.trim() || m.text.toLowerCase().includes(searchQuery.toLowerCase()));
  const pinnedMessages = channelMessages.filter(m => m.pinned);

  const renderMessageText = (text: string) => {
    if (!searchQuery.trim()) return <>{text}</>;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? <mark key={i} className="bg-yellow-400/80 text-black rounded px-0.5">{part}</mark> : part
        )}
      </>
    );
  };

  // Mark messages as read
  useEffect(() => {
    if (activeTab === 'chat' && onMarkMessageRead) {
      channelMessages.forEach(msg => {
        if (msg.senderId !== student.id && (!msg.readBy || !msg.readBy.includes(student.id))) {
          onMarkMessageRead(msg.id, student.id);
        }
      });
    }
  }, [activeTab, channelMessages, onMarkMessageRead, student.id]);

  // Scroll to bottom of chat with auto-scroll lock check
  useEffect(() => {
    if (activeTab === 'chat' && !isAutoScrollLocked) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channelMessages.length, activeTab, isAutoScrollLocked]);

  // Send message
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageText.trim() && chatAttachments.length === 0) return;
    if (!onSendMessage) return;

    const newMsg: EmployeeChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId: student.id,
      senderName: student.name,
      senderRole: isAdminViewing ? 'Admin (Student Mode)' : 'Student',
      channelId: activeChannelId,
      text: chatMessageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: chatAttachments.length > 0 ? chatAttachments : undefined
    };

    onSendMessage(newMsg);
    setChatMessageText('');
    setChatAttachments([]);
  };

  const handleShareWhiteboardToChat = (imageUrl: string, noteText?: string) => {
    if (!onSendMessage) return;

    const attachment: ChatAttachment = {
      id: `att-${Date.now()}`,
      name: `whiteboard-snapshot-${new Date().toISOString().split('T')[0]}.png`,
      url: imageUrl,
      type: 'image'
    };

    const newMsg: EmployeeChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId: student.id,
      senderName: student.name,
      senderRole: isAdminViewing ? 'Admin (Student Mode)' : 'Student',
      channelId: activeChannelId,
      text: noteText || 'Shared a Virtual Whiteboard drawing to class 🎨',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: [attachment]
    };

    onSendMessage(newMsg);
    setChatViewLayout('chat');
    setActiveTab('chat');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 800 * 1024) {
        showToast(`File "${file.name}" is too large (max 800KB). Please use a smaller file.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setChatAttachments(prev => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            name: file.name,
            url,
            type,
            size: file.size,
            mimeType: file.type
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Calculate student stats
  const completedSessions = mySessions.filter(s => s.status === 'completed');
  const gradedSessions = completedSessions.filter(s => s.grades?.some(g => g.studentId === student.id));
  const attendanceCount = completedSessions.filter(s => s.attendance?.some(a => a.studentId === student.id && (a.status === 'present' || a.status === 'late'))).length;
  const attendanceRate = completedSessions.length > 0 ? Math.round((attendanceCount / completedSessions.length) * 100) : 100;

  const handleDownloadSessionRecording = (session: ClassSession) => {
    const content = `VAULT CLASS RECORDING TRANSCRIPT & METADATA\n` +
      `=============================================\n` +
      `Group: ${session.groupCode || myGroup?.name || 'Class'}\n` +
      `Date: ${session.date}\n` +
      `Topic: ${session.topic || 'Class Lesson'}\n` +
      `Instructor: ${session.teacherName || myGroup?.teacher || 'Instructor'}\n` +
      `Status: ${session.status}\n` +
      `Meeting Link: ${session.meetLink || 'N/A'}\n` +
      `Generated At: ${new Date().toISOString()}\n` +
      `=============================================\n` +
      `Audio/Video stream archived and verifiable.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Class_Recording_${session.date}_${(session.topic || 'Lesson').replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Class session recording metadata downloaded!');
  };

  const handleDownloadGradesPDF = async () => {
    const element = document.getElementById('grades-summary-container');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#0f172a' }); // brand-dark bg
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${student.name.replace(/\s+/g, '_')}_Grades_Summary.pdf`);
      showToast('Grades report exported successfully!');
    } catch (error) {
      console.error('Error generating PDF', error);
      showToast('Failed to generate PDF export.');
    }
  };

  

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-brand-dark text-slate-200 flex flex-col overflow-hidden">
      {/* Top Admin Banner if admin is previewing */}
      {isAdminViewing && (
        <div className="bg-gradient-to-r from-purple-900/95 via-indigo-900/95 to-purple-900/95 border-b border-purple-500/50 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs z-50 shrink-0 shadow-md">
          <div className="flex items-center space-x-2 truncate">
            <span className="px-2 py-0.5 rounded bg-purple-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Previewing Student
            </span>
            {allStudents.length > 0 && onSelectStudent && (
              <select
                value={student.id}
                onChange={(e) => onSelectStudent(e.target.value)}
                className="bg-brand-dark border border-purple-500/40 text-purple-200 font-semibold rounded-md px-2 py-0.5 text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                {allStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Group {s.group || 'None'})
                  </option>
                ))}
              </select>
            )}
          </div>
          {onExitStudentMode && (
            <button
              onClick={onExitStudentMode}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md border border-white/20 transition flex items-center space-x-1 cursor-pointer font-semibold text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Staff</span>
            </button>
          )}
        </div>
      )}

      {/* Mobile Top Header - Optimized for Vertical Layout */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-brand-border bg-brand-card/95 backdrop-blur-md shrink-0 z-30 shadow-sm">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-purple-500 flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="truncate">
            <h2 className="font-bold text-sm text-slate-100 truncate leading-tight">{student.name}</h2>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-[10px] text-purple-300 font-medium truncate">
                {myGroup ? (myGroup.name || `Group ${myGroup.code}`) : 'Enrolled Student'}
              </span>
              {myGroup?.level && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                  {myGroup.level}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {myGroup?.meetLink && (
            <button
              onClick={() => {
                joinCall(
                  myGroup.meetLink.startsWith('http') ? myGroup.meetLink.split('/').pop() || myGroup.meetLink : myGroup.meetLink,
                  { id: student.id, name: student.name, role: 'Student', avatarUrl: student.avatarUrl },
                  `Group ${myGroup.code}`,
                  'class'
                );
              }}
              className="p-2 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition cursor-pointer"
              title="Join Live Class Call"
            >
              <Video className="w-4 h-4" />
            </button>
          )}

          <button 
            onClick={isAdminViewing && onExitStudentMode ? onExitStudentMode : onLogout} 
            className="p-2 text-slate-400 hover:text-red-400 bg-brand-dark rounded-xl border border-brand-border transition cursor-pointer" 
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex w-64 bg-brand-card/95 backdrop-blur-md border-r border-brand-border flex-col sticky top-0 h-full shrink-0 overflow-hidden">
          <div className="p-5 border-b border-brand-border flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent leading-none">
                Vault
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">Student Portal</span>
            </div>
          </div>

          <div className="p-3.5 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: CheckCircle },
              { id: 'game', label: 'Vivlío', icon: Globe },
              { id: 'chat', label: 'Class & Chat', icon: MessageSquare, badge: channelMessages.length > 0 ? String(channelMessages.length) : undefined },
              { id: 'whiteboard', label: 'Virtual Board', icon: PenTool },
              { id: 'calendar', label: 'Schedule & Files', icon: Calendar },
              { id: 'grades', label: 'Grades', icon: FileText },
              { id: 'finance', label: 'Finance', icon: CreditCard },
              { id: 'profile', label: 'My Profile', icon: User },
              { id: 'preferences', label: 'Preferences', icon: Settings }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition text-xs font-semibold cursor-pointer ${
                  activeTab === item.id 
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-brand-dark/70'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-brand-border space-y-3 shrink-0 bg-brand-card/50">
            <div className="p-3 bg-brand-dark/80 rounded-xl border border-brand-border">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Logged In Student</p>
              <p className="text-xs font-bold text-purple-300 truncate mt-0.5">{student.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{myGroup ? (myGroup.name || `Group ${myGroup.code}`) : 'No Group Assigned'}</p>
            </div>

            <button 
              onClick={isAdminViewing && onExitStudentMode ? onExitStudentMode : onLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isAdminViewing ? 'Exit Student View' : 'Sign Out'}</span>
            </button>
          </div>
        </aside>

        {/* Main Dynamic View Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 min-w-0 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-5 pb-16 md:pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
            {/* ========================================================================= */}
            {/* TAB: OVERVIEW (Vertical Mobile-First Layout)                                */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                {/* HERO: Student Header Card */}
                <div className="bg-gradient-to-br from-purple-900/40 via-brand-card to-brand-card rounded-3xl border border-purple-500/30 p-4 sm:p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-semibold border border-purple-500/30 mb-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Academic Student Portal</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
                        Hello, {student.name.split(' ')[0]}!
                      </h1>
                      <p className="text-slate-400 text-xs sm:text-sm">
                        {myGroup ? `${myGroup.name || `Group ${myGroup.code}`} • ${myGroup.schedule}` : 'Ready for your next learning session.'}
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/20 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Open Class Chat</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('whiteboard')}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-brand-dark hover:bg-slate-800 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <PenTool className="w-4 h-4" />
                        <span>Virtual Board</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-5 pt-4 border-t border-brand-border/60 text-center">
                    <div className="bg-brand-dark/70 rounded-2xl p-2.5 sm:p-3 border border-brand-border">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attendance</p>
                      <p className="text-base sm:text-xl font-black text-emerald-400 mt-0.5">{attendanceRate}%</p>
                    </div>
                    <div className="bg-brand-dark/70 rounded-2xl p-2.5 sm:p-3 border border-brand-border">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Classes</p>
                      <p className="text-base sm:text-xl font-black text-purple-300 mt-0.5">{completedSessions.length}</p>
                    </div>
                    <div className="bg-brand-dark/70 rounded-2xl p-2.5 sm:p-3 border border-brand-border">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Graded</p>
                      <p className="text-base sm:text-xl font-black text-amber-400 mt-0.5">{gradedSessions.length}</p>
                    </div>
                  </div>
                </div>

                {/* NEXT CLASS & ENROLLMENT VERTICAL STACK */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Next Class Hero */}
                  <div className="bg-brand-card rounded-3xl border border-brand-border p-5 shadow-xl flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
                      <h3 className="text-sm font-bold text-slate-100 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-amber-400" />
                        Upcoming Class Session
                      </h3>
                      {upcomingSession && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Scheduled
                        </span>
                      )}
                    </div>

                    {upcomingSession ? (
                      <div className="space-y-3">
                        <div className="p-3.5 bg-brand-dark rounded-2xl border border-brand-border space-y-1.5">
                          <p className="text-base font-bold text-slate-100">
                            {new Date(upcomingSession.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-purple-300 flex items-center font-semibold">
                            <Clock className="w-3.5 h-3.5 mr-1 text-purple-400" />
                            {upcomingSession.time}
                          </p>
                          <p className="text-xs text-slate-400 pt-0.5">Topic: <strong className="text-slate-200">{upcomingSession.topic}</strong></p>
                        </div>

                        {myGroup?.meetLink ? (
                          <button 
                            onClick={() => {
                              joinCall(
                                myGroup.meetLink.startsWith('http') ? myGroup.meetLink.split('/').pop() || myGroup.meetLink : myGroup.meetLink,
                                { id: student.id, name: student.name, role: 'Student', avatarUrl: student.avatarUrl },
                                `Group ${myGroup.code}`,
                                'class'
                              );
                            }}
                            className="w-full inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-2xl font-bold text-xs transition shadow-lg shadow-emerald-600/25 cursor-pointer"
                          >
                            <Video className="w-4 h-4" />
                            <span>Join Live Video Class Now</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveTab('calendar')}
                            className="w-full py-2.5 text-center text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 rounded-xl"
                          >
                            View Full Schedule →
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 bg-brand-dark/50 rounded-2xl border border-brand-border text-center text-slate-400 text-xs">
                        {myGroup?.status === 'waiting' 
                          ? 'Group is currently waiting for student enrollment. Schedule will activate once the group begins!'
                          : 'No upcoming classes scheduled this week.'}
                      </div>
                    )}
                  </div>

                  {/* Study Group Enrollment */}
                  <div className="bg-brand-card rounded-3xl border border-brand-border p-5 shadow-xl flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
                      <h3 className="text-sm font-bold text-slate-100 flex items-center">
                        <GraduationCap className="w-4 h-4 mr-2 text-purple-400" />
                        Class Enrollment
                      </h3>
                      {myGroup && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </div>

                    {myGroup ? (
                      <div className="space-y-2.5 text-xs">
                        <div className="p-2.5 bg-brand-dark rounded-xl border border-brand-border flex justify-between items-center">
                          <span className="text-slate-400">Group Name</span>
                          <span className="font-bold text-slate-100">{myGroup.name || `Group ${myGroup.code}`}</span>
                        </div>
                        <div className="p-2.5 bg-brand-dark rounded-xl border border-brand-border flex justify-between items-center">
                          <span className="text-slate-400">Teacher</span>
                          <span className="font-bold text-purple-300">{myGroup.teacher || 'Assigned Instructor'}</span>
                        </div>
                        <div className="p-2.5 bg-brand-dark rounded-xl border border-brand-border flex justify-between items-center">
                          <span className="text-slate-400">Level & Collection</span>
                          <span className="font-bold text-slate-100">{myGroup.level || 'Standard'}</span>
                        </div>
                        <div className="p-2.5 bg-brand-dark rounded-xl border border-brand-border flex justify-between items-center">
                          <span className="text-slate-400">Schedule</span>
                          <span className="font-bold text-slate-100">{myGroup.schedule}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-brand-dark/50 rounded-2xl border border-brand-border text-center text-slate-400 text-xs">
                        You are not currently assigned to an active class group.
                      </div>
                    )}
                  </div>
                </div>

                {/* QUICK NAVIGATION SHORTCUT CARDS (Taking advantage of vertical mobile scrolling) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="p-4 bg-brand-card hover:bg-brand-dark/80 rounded-2xl border border-brand-border flex flex-col items-center text-center space-y-2 transition cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">Class Chat</span>
                    <span className="text-[10px] text-slate-400">Discussions & Notes</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('whiteboard')}
                    className="p-4 bg-brand-card hover:bg-brand-dark/80 rounded-2xl border border-brand-border flex flex-col items-center text-center space-y-2 transition cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
                      <PenTool className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">Virtual Board</span>
                    <span className="text-[10px] text-slate-400">Draw & Sketch</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('grades')}
                    className="p-4 bg-brand-card hover:bg-brand-dark/80 rounded-2xl border border-brand-border flex flex-col items-center text-center space-y-2 transition cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">My Grades</span>
                    <span className="text-[10px] text-slate-400">Feedback & Scores</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('calendar')}
                    className="p-4 bg-brand-card hover:bg-brand-dark/80 rounded-2xl border border-brand-border flex flex-col items-center text-center space-y-2 transition cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">Schedule</span>
                    <span className="text-[10px] text-slate-400">Class Whiteboards</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            
            {/* ========================================================================= */}
            {/* TAB: FILES & RESOURCES                                                       */}
            {/* ========================================================================= */}
            {activeTab === 'files' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-100">Files & Resources</h1>
                </div>
                
                <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
                  <div className="p-4 border-b border-brand-border bg-brand-dark/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-purple-400" />
                      Class Session Files
                    </h3>
                  </div>
                  <div className="p-4 divide-y divide-brand-border/30">
                    {mySessions.length === 0 ? (
                       <div className="text-center p-6 text-slate-500 text-sm">No class sessions found.</div>
                    ) : mySessions.map(session => {
                      const sessionWbFiles = session.whiteboardFiles || [];
                      const hasRecording = session.status === 'completed';
                      
                      if (sessionWbFiles.length === 0 && !hasRecording) return null;

                      return (
                        <div key={session.id} className="py-4 first:pt-0 last:pb-0">
                          <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                             <CalendarDays className="w-4 h-4 text-purple-400" />
                             {session.date} - {session.topic}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {sessionWbFiles.map((wb, idx) => (
                               <div key={idx} className="bg-slate-900 border border-brand-border rounded-lg p-3 flex flex-col justify-between hover:border-purple-500/50 transition">
                                 <div className="flex items-start gap-2 mb-3">
                                   <FileText className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                                   <div>
                                     <p className="text-xs font-semibold text-slate-200 line-clamp-2">{wb.title}</p>
                                     <p className="text-[10px] text-slate-500">{new Date(wb.timestamp).toLocaleDateString()}</p>
                                   </div>
                                 </div>
                                 <button onClick={() => setSelectedImagePreview(wb.imageDataUrl)} className="w-full px-2 py-1 bg-brand-dark border border-brand-border text-xs text-slate-300 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1">
                                   <Eye className="w-3 h-3" /> View Whiteboard
                                 </button>
                               </div>
                            ))}
                            {hasRecording && (
                               <div className="bg-slate-900 border border-brand-border rounded-lg p-3 flex flex-col justify-between hover:border-purple-500/50 transition">
                                 <div className="flex items-start gap-2 mb-3">
                                   <Video className="w-4 h-4 text-sky-400 mt-1 shrink-0" />
                                   <div>
                                     <p className="text-xs font-semibold text-slate-200 line-clamp-2">Class Recording Transcript</p>
                                     <p className="text-[10px] text-slate-500">Verified class archive</p>
                                   </div>
                                 </div>
                                 <button 
                                   onClick={() => handleDownloadSessionRecording(session)} 
                                   className="w-full px-2 py-1 bg-sky-900/30 border border-sky-500/30 text-xs text-sky-300 hover:text-white rounded hover:bg-sky-900/60 transition cursor-pointer flex items-center justify-center gap-1"
                                 >
                                   <Download className="w-3 h-3" /> Download Metadata
                                 </button>
                               </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CLASS CHAT & VIRTUAL BOARD                                            */}
            {/* ========================================================================= */}
            {activeTab === 'chat' && (
              <div className="space-y-3 flex flex-col h-[calc(100dvh-130px)] md:h-[650px] animate-fadeIn">
                {/* Top Channel Bar */}
                <div className="flex items-center justify-between gap-2 bg-brand-card p-3 rounded-2xl border border-brand-border shrink-0">
                  {/* Channels Horizontal Scroll */}
                  <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {studentChannels.map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => setActiveChannelId(ch.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 shrink-0 transition cursor-pointer ${
                          activeChannelId === ch.id 
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm' 
                            : 'bg-brand-dark border-brand-border text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <ch.icon className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{ch.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Mode switcher */}
                  <div className="hidden sm:flex bg-brand-dark p-1 rounded-xl border border-brand-border shrink-0 space-x-1 text-xs">
                    <button
                      onClick={() => setChatViewLayout('chat')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                        chatViewLayout === 'chat' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => setChatViewLayout('split')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                        chatViewLayout === 'split' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Split
                    </button>
                    <button
                      onClick={() => setChatViewLayout('whiteboard')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                        chatViewLayout === 'whiteboard' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Board
                    </button>
                    <button
                      onClick={() => setChatViewLayout('captions')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                        chatViewLayout === 'captions' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Captions className="w-3.5 h-3.5" />
                      <span>Captions</span>
                      {captionsLog.length > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                          chatViewLayout === 'captions' ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {captionsLog.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Main Chat / Whiteboard / Captions Stage */}
                <div className="flex-1 min-h-0 bg-brand-card rounded-3xl border border-brand-border overflow-hidden flex flex-col shadow-xl">
                  {chatViewLayout === 'captions' ? (
                    <div className="flex-1 p-2 flex flex-col min-h-0">
                      <CaptionHistoryView
                        captionsLog={captionsLog.map(c => ({
                          id: c.id,
                          speakerId: c.speakerId,
                          speakerName: c.speakerName,
                          speakerRole: c.speakerRole,
                          originalText: c.originalText,
                          translatedText: c.translatedText,
                          sourceLang: inputLanguage.code,
                          targetLang: preferredLanguage.code,
                          timestamp: c.timestamp,
                          isSelf: c.speakerId === student.id || c.isLocal
                        }))}
                        preferredLanguage={preferredLanguage}
                        onLanguageChange={handlePreferredLanguageChange}
                        isRecording={isRecording}
                        onToggleRecording={toggleVoiceRecording}
                        voiceRecognitionMode={voiceRecognitionMode}
                        onToggleVoiceMode={(mode) => setVoiceRecognitionMode(mode)}
                        audioLevel={audioLevel}
                        interimSpeechText={interimSpeechText}
                        speechEngineStatus={speechEngineStatus}
                        onRestartSpeechEngine={restartSpeechEngine}
                        onSendCaptionToChat={(text) => {
                          setChatMessageText(prev => (prev ? prev.trim() + ' ' : '') + text);
                          setChatViewLayout('chat');
                          showToast("Caption inserted into chat message!");
                        }}
                        onClearCaptions={() => {
                          setCaptionsLog([]);
                          showToast("Captions history cleared.");
                        }}
                        onTriggerPresetSpeech={(presetText) => {
                          commitSpeechTranscript(presetText);
                        }}
                      />
                    </div>
                  ) : chatViewLayout === 'whiteboard' ? (
                    <div className="flex-1 p-2 flex flex-col min-h-0">
                      <VirtualWhiteboard
                        boardId={`student_board_${activeChannelId}`}
                        title={`Virtual Board — ${studentChannels.find(c => c.id === activeChannelId)?.name}`}
                        authorName={student.name}
                        onShareToChat={handleShareWhiteboardToChat}
                        heightClass="h-full"
                      />
                    </div>
                  ) : chatViewLayout === 'split' ? (
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 p-2 min-h-0">
                      {/* Left: Chat Feed */}
                      <div className="flex flex-col h-full bg-brand-dark/60 rounded-2xl border border-brand-border overflow-hidden">
                        <div 
                          onScroll={(e) => {
                            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                            const isNearBottom = scrollHeight - scrollTop - clientHeight < 65;
                            setIsAutoScrollLocked(!isNearBottom);
                          }}
                          className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar relative"
                        >
                          {displayedMessages.map(msg => (
                            <div key={msg.id} className={`group flex flex-col ${msg.senderId === student.id ? 'items-end' : 'items-start'}`}>
                              <div className={`relative max-w-[85%] rounded-2xl p-2.5 text-xs ${
                                msg.senderId === student.id 
                                  ? 'bg-purple-600 text-white rounded-tr-xs' 
                                  : 'bg-brand-card border border-brand-border text-slate-200 rounded-tl-xs'
                              }`}>
                                <div className="flex justify-between items-baseline mb-0.5 space-x-2">
                                  <span className="font-bold text-[10px] opacity-90">{msg.senderName}</span>
                                  {msg.pinned && <Pin className="w-2.5 h-2.5 text-amber-300 fill-current opacity-80" />}
                                  <span className="text-[9px] opacity-60">{msg.timestamp}</span>
                                </div>
                                <p className="text-xs whitespace-pre-wrap leading-relaxed">{renderMessageText(msg.text)}</p>
                              </div>
                                <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition absolute -bottom-3 bg-brand-dark/95 px-2 py-0.5 rounded-full border border-brand-border z-10 shadow-lg backdrop-blur-sm">
                                  {['👍', '❤️', '😂', '👏'].map(emoji => (
                                     <motion.button 
                                       key={emoji} 
                                       whileHover={{ scale: 1.35 }}
                                       whileTap={{ scale: 0.75 }}
                                       onClick={() => onToggleReaction && onToggleReaction(msg.id, emoji)} 
                                       className="text-xs transition cursor-pointer"
                                     >
                                       {emoji}
                                     </motion.button>
                                  ))}
                                  {onTogglePin && (
                                    <motion.button
                                      whileHover={{ scale: 1.2 }}
                                      whileTap={{ scale: 0.8 }}
                                      onClick={() => onTogglePin(msg.id)}
                                      className="text-slate-400 hover:text-amber-400 ml-1 transition cursor-pointer"
                                      title={msg.pinned ? "Unpin message" : "Pin message"}
                                    >
                                      <Pin className="w-3 h-3" />
                                    </motion.button>
                                  )}
                                </div>
                                {msg.reactions && msg.reactions.length > 0 && (
                                  <div className="flex items-center flex-wrap gap-1 mt-1">
                                    {msg.reactions.map((r, rIdx) => {
                                      const hasReacted = r.users.includes(student.id);
                                      return (
                                        <motion.button
                                          key={`${r.emoji}-${rIdx}`}
                                          initial={{ scale: 0.7, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          whileHover={{ scale: 1.12 }}
                                          whileTap={{ scale: 0.85 }}
                                          transition={{ type: "spring", stiffness: 450, damping: 22 }}
                                          onClick={() => onToggleReaction && onToggleReaction(msg.id, r.emoji)}
                                          className={`px-1.5 py-0.5 rounded-md text-[10px] flex items-center gap-1 border transition cursor-pointer ${
                                            hasReacted
                                              ? 'bg-purple-500/30 border-purple-500/60 text-purple-200'
                                              : 'bg-brand-dark/80 border-brand-border text-slate-300'
                                          }`}
                                        >
                                          <motion.span
                                            key={r.users.length}
                                            initial={{ scale: 1.35 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.15 }}
                                          >
                                            {r.emoji}
                                          </motion.span>
                                          <span className="font-mono text-[9px] font-bold">{r.users.length}</span>
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                )}
                              {msg.senderId === student.id && msg.readBy && msg.readBy.length > 0 && (
                                <span className="text-[9px] text-purple-300 mt-0.5 flex items-center gap-0.5 px-1">
                                  <CheckCircle className="w-2.5 h-2.5" /> Seen
                                </span>
                              )}
                            </div>
                          ))}
                          
                          {/* Auto scroll lock Jump to Latest button in split mode */}
                          <AnimatePresence>
                            {isAutoScrollLocked && (
                              <motion.button
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                onClick={() => {
                                  setIsAutoScrollLocked(false);
                                  chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="sticky bottom-2 ml-auto z-20 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-[10px] font-bold shadow-lg shadow-purple-900/60 flex items-center gap-1 border border-purple-400/40 transition cursor-pointer"
                              >
                                <ChevronDown className="w-3 h-3 animate-bounce" />
                                <span>Jump to latest</span>
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      {/* Right: Board */}
                      <div className="flex flex-col h-full bg-brand-dark/60 rounded-2xl border border-brand-border p-2 overflow-hidden">
                        <VirtualWhiteboard
                          boardId={`split_student_board_${activeChannelId}`}
                          title={`Class Board — ${studentChannels.find(c => c.id === activeChannelId)?.name}`}
                          authorName={student.name}
                          onShareToChat={handleShareWhiteboardToChat}
                          heightClass="h-full"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Default Full Height Mobile Chat View */
                    <div className="flex-1 flex flex-col min-h-0 relative">
                      {/* Channel title & Call launcher */}
                      <div className="px-4 py-2.5 bg-brand-dark/80 border-b border-brand-border flex items-center justify-between shrink-0 flex-wrap gap-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          <MessageSquare className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[120px] sm:max-w-[200px]">
                            {studentChannels.find(c => c.id === activeChannelId)?.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 ml-auto">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search..."
                              className="pl-7 pr-2 py-1 bg-brand-dark border border-brand-border rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500 w-24 sm:w-32 transition-all placeholder:text-slate-500"
                            />
                          </div>

                          <button
                            onClick={() => setShowPinned(!showPinned)}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer border ${
                              showPinned 
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                                : 'bg-brand-dark hover:bg-brand-card text-slate-400 border-brand-border'
                            }`}
                            title="Pinned Messages"
                          >
                            <Pin className="w-3.5 h-3.5" />
                            {pinnedMessages.length > 0 && (
                              <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-[9px] text-amber-300 font-bold ml-1">
                                {pinnedMessages.length}
                              </span>
                            )}
                          </button>

                          {/* Caption History Overlay Button */}
                          <button
                            onClick={() => setIsCaptionHistoryOverlayOpen(true)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer border ${
                              isCaptionHistoryOverlayOpen
                                ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                                : 'bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border-purple-500/30'
                            }`}
                            title="Open Live Captions & Translation History"
                          >
                            <Captions className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Captions</span>
                            {captionsLog.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/40 ml-0.5">
                                {captionsLog.length}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              startCall(
                                `vault-room-channel-${activeChannelId}`,
                                { id: student.id, name: student.name, role: 'Student', avatarUrl: student.avatarUrl },
                                `Channel: ${studentChannels.find(c => c.id === activeChannelId)?.name || activeChannelId}`,
                                'class'
                              );
                            }}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer hidden sm:flex"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </button>

                          <button
                            onClick={() => setActiveTab('whiteboard')}
                            className="px-2 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold hover:bg-purple-600 hover:text-white transition flex items-center space-x-1 cursor-pointer"
                            title="Virtual Whiteboard"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 flex overflow-hidden relative">
                        <div className="flex-1 flex flex-col min-w-0">
                          {/* Chat Messages Feed */}
                          <div 
                            onScroll={(e) => {
                              const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                              const isNearBottom = scrollHeight - scrollTop - clientHeight < 70;
                              setIsAutoScrollLocked(!isNearBottom);
                            }}
                            className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 custom-scrollbar min-h-0 relative"
                          >
                          {displayedMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2 p-6 text-center">
                              <div className="w-12 h-12 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-400 mb-1">
                                {searchQuery ? <Search className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                              </div>
                              <p className="font-bold text-slate-300">{searchQuery ? 'No matching messages' : 'No messages in this channel yet'}</p>
                              <p className="text-[11px] text-slate-500 max-w-xs">{searchQuery ? 'Try a different search term.' : 'Start the conversation, ask questions to your teacher, or share a whiteboard drawing!'}</p>
                            </div>
                          ) : (
                            displayedMessages.map(msg => (
                              <div key={msg.id} className={`group flex flex-col ${msg.senderId === student.id ? 'items-end' : 'items-start'}`}>
                                <div className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 text-xs ${
                                  msg.senderId === student.id 
                                    ? 'bg-purple-600 text-white rounded-tr-xs shadow-md shadow-purple-600/15' 
                                    : 'bg-brand-dark border border-brand-border text-slate-200 rounded-tl-xs'
                                }`}>
                                  <div className="flex justify-between items-baseline mb-1 space-x-2">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="font-bold text-[11px]">{msg.senderName}</span>
                                      {msg.senderRole && (
                                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-black/30 font-medium opacity-80 uppercase">
                                          {msg.senderRole}
                                        </span>
                                      )}
                                      {msg.pinned && (
                                        <Pin className="w-2.5 h-2.5 text-amber-300 fill-current opacity-80" />
                                      )}
                                    </div>
                                    <span className="text-[9px] opacity-60 font-mono">{msg.timestamp}</span>
                                  </div>
                                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{renderMessageText(msg.text)}</p>

                                  <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition absolute -bottom-3 bg-brand-dark/95 px-2 py-0.5 rounded-full border border-brand-border z-10 shadow-lg backdrop-blur-sm">
                                    {['👍', '❤️', '😂', '👏'].map(emoji => (
                                      <motion.button 
                                        key={emoji} 
                                        whileHover={{ scale: 1.35 }}
                                        whileTap={{ scale: 0.75 }}
                                        onClick={() => onToggleReaction && onToggleReaction(msg.id, emoji)} 
                                        className="text-xs transition cursor-pointer"
                                      >
                                        {emoji}
                                      </motion.button>
                                    ))}
                                    {onTogglePin && (
                                      <motion.button
                                        whileHover={{ scale: 1.25 }}
                                        whileTap={{ scale: 0.8 }}
                                        onClick={() => onTogglePin(msg.id)}
                                        className="text-slate-400 hover:text-amber-400 ml-1 transition cursor-pointer"
                                        title={msg.pinned ? "Unpin message" : "Pin message"}
                                      >
                                        <Pin className="w-3 h-3" />
                                      </motion.button>
                                    )}
                                  </div>

                                {msg.reactions && msg.reactions.length > 0 && (
                                  <div className="flex items-center flex-wrap gap-1 mt-2">
                                    {msg.reactions.map((r, rIdx) => {
                                      const hasReacted = r.users.includes(student.id);
                                      return (
                                        <motion.button
                                          key={`${r.emoji}-${rIdx}`}
                                          initial={{ scale: 0.7, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          whileHover={{ scale: 1.12 }}
                                          whileTap={{ scale: 0.85 }}
                                          transition={{ type: "spring", stiffness: 450, damping: 22 }}
                                          onClick={() => onToggleReaction && onToggleReaction(msg.id, r.emoji)}
                                          className={`px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1 border transition cursor-pointer ${
                                            hasReacted
                                              ? 'bg-purple-500/30 border-purple-500/60 text-purple-200'
                                              : 'bg-brand-dark/80 border-brand-border text-slate-300'
                                          }`}
                                        >
                                          <motion.span
                                            key={r.users.length}
                                            initial={{ scale: 1.4 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.18 }}
                                          >
                                            {r.emoji}
                                          </motion.span>
                                          <span className="font-mono text-[9px] font-bold">{r.users.length}</span>
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Attachments */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="mt-2 space-y-1.5">
                                    {msg.attachments.map(att => (
                                      <div key={att.id} className="rounded-xl overflow-hidden border border-white/20 bg-black/20">
                                        {att.type === 'image' ? (
                                          <img 
                                            src={att.url} 
                                            alt={att.name} 
                                            onClick={() => setSelectedImagePreview(att.url)}
                                            className="max-h-56 w-full object-contain rounded-lg bg-black/40 cursor-pointer hover:opacity-90 transition" 
                                          />
                                        ) : (
                                          <a href={att.url} download={att.name} className="flex items-center p-2 text-xs hover:bg-black/30 transition group">
                                            {getFileThumbnail(att)}
                                            <div className="ml-3 flex flex-col overflow-hidden">
                                              <span className="truncate font-semibold text-slate-200 group-hover:text-purple-300 transition">{att.name}</span>
                                              <span className="text-[9px] text-slate-400">{att.size ? (att.size / 1024).toFixed(1) + ' KB' : 'Document'}</span>
                                            </div>
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {msg.senderId === student.id && msg.readBy && msg.readBy.length > 0 && (
                                <span className="text-[9px] text-purple-300 mt-0.5 flex items-center gap-0.5 px-1">
                                  <CheckCircle className="w-2.5 h-2.5" /> Seen
                                </span>
                              )}
                            </div>
                          ))
                        )}
                        <div ref={chatEndRef} />

                        {/* Floating Jump to Latest Button with Auto Scroll Lock */}
                        <AnimatePresence>
                          {isAutoScrollLocked && (
                            <motion.button
                              initial={{ opacity: 0, y: 15, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 15, scale: 0.9 }}
                              onClick={() => {
                                setIsAutoScrollLocked(false);
                                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="fixed bottom-24 right-8 z-30 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs font-bold shadow-xl shadow-purple-950/70 flex items-center gap-1.5 border border-purple-400/40 transition cursor-pointer"
                            >
                              <ChevronDown className="w-4 h-4 animate-bounce" />
                              <span>Jump to latest</span>
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Attachments preview tray */}
                      {chatAttachments.length > 0 && (
                        <div className="px-3 py-2 bg-brand-dark/80 border-t border-brand-border flex items-center space-x-2 overflow-x-auto shrink-0">
                          {chatAttachments.map(att => (
                            <div key={att.id} className="relative group shrink-0">
                              {att.type === 'image' ? (
                                <img src={att.url} alt={att.name} className="w-12 h-12 object-cover rounded-xl border border-purple-500" />
                              ) : (
                                getFileThumbnail(att, true)
                              )}
                              <button
                                type="button"
                                onClick={() => setChatAttachments(prev => prev.filter(a => a.id !== att.id))}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center cursor-pointer shadow"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message Input Box */}
                      <div className="p-2.5 sm:p-3 border-t border-brand-border bg-brand-dark/60 shrink-0">
                        {/* Live Floating Caption Subtitle Banner */}
                        <AnimatePresence>
                          {(activeLiveCaption || interimSpeechText) && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="mb-2 p-2.5 bg-gradient-to-r from-purple-950/90 via-slate-900 to-brand-dark border border-purple-500/40 rounded-2xl shadow-xl backdrop-blur-md flex items-center justify-between gap-3 animate-fadeIn"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-7 h-7 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                                  <Captions className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[10px] font-bold text-purple-300 truncate">
                                      {activeLiveCaption?.speakerName || student.name}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-200 border border-purple-400/30 font-medium">
                                      {preferredLanguage.flag} {preferredLanguage.code.toUpperCase()}
                                    </span>
                                    {isRecording && (
                                      <span className="text-[8px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30 animate-pulse">
                                        Live Mic
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-100 font-semibold truncate leading-tight">
                                    "{activeLiveCaption?.translatedText || activeLiveCaption?.originalText || interimSpeechText}"
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setIsCaptionHistoryOverlayOpen(true)}
                                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold shadow-sm transition cursor-pointer"
                                >
                                  History
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveLiveCaption(null)}
                                  className="p-1 text-slate-400 hover:text-slate-200 rounded-md hover:bg-white/10 transition cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {pendingTranscription && (
                          <div className="mb-2 p-2.5 bg-brand-dark border border-brand-border rounded-xl flex items-center justify-between animate-fadeIn">
                            <div className="text-xs text-slate-300 italic flex-1 truncate pr-3">"{pendingTranscription}"</div>
                            <div className="flex space-x-2 shrink-0">
                              <button type="button" onClick={() => setPendingTranscription(null)} className="px-3 py-1 bg-brand-card hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition cursor-pointer">Discard</button>
                              <button type="button" onClick={() => { setChatMessageText(prev => (prev + (prev ? " " : "") + pendingTranscription)); setPendingTranscription(null); }} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-semibold text-white transition shadow shadow-purple-500/20 cursor-pointer">Insert</button>
                            </div>
                          </div>
                        )}
                        <form onSubmit={handleSendChatMessage} className="flex items-center space-x-1.5 relative">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => handleFileUpload(e, 'file')}
                            className="hidden"
                          />
                          <input
                            type="file"
                            ref={imageInputRef}
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'image')}
                            className="hidden"
                          />

                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="p-2.5 text-slate-400 hover:text-purple-400 bg-brand-dark border border-brand-border rounded-xl transition cursor-pointer"
                            title="Attach Image"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 text-slate-400 hover:text-purple-400 bg-brand-dark border border-brand-border rounded-xl transition cursor-pointer"
                            title="Attach Document"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>

                          {/* Toggle Voice Recognition Mode button */}
                          <button
                            type="button"
                            onClick={() => {
                              const newMode = voiceRecognitionMode === 'push-to-talk' ? 'hands-free' : 'push-to-talk';
                              setVoiceRecognitionMode(newMode);
                              if (isRecording) {
                                toggleVoiceRecording();
                              }
                              showToast(newMode === 'hands-free' 
                                ? "🎙️ Switched to 'Hands-free Voice-to-Text' mode (mic stays active until stopped)" 
                                : "📻 Switched to 'Push-to-Talk' voice mode"
                              );
                            }}
                            className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                              voiceRecognitionMode === 'hands-free'
                                ? 'bg-purple-600/25 text-purple-300 border-purple-500/60 shadow-sm'
                                : 'bg-brand-dark text-slate-400 border-brand-border hover:text-slate-200'
                            }`}
                            title={voiceRecognitionMode === 'hands-free' ? "Voice Mode: Hands-free Voice-to-Text (Continuous) - Click to switch to Push-to-Talk" : "Voice Mode: Push-to-Talk - Click to switch to Hands-free Voice-to-Text"}
                          >
                            <Radio className={`w-4 h-4 ${voiceRecognitionMode === 'hands-free' ? 'text-purple-400 animate-pulse' : ''}`} />
                            <span className="text-[10px] hidden md:inline font-bold">
                              {voiceRecognitionMode === 'hands-free' ? 'Hands-Free' : 'PTT'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTranscriptionMode(prev => prev === 'live' ? 'text' : 'live')}
                            className="p-2.5 text-slate-400 hover:text-purple-400 bg-brand-dark border border-brand-border rounded-xl transition cursor-pointer relative"
                            title={transcriptionMode === 'live' ? "Live Transcription Mode" : "Standard Text Mode"}
                          >
                            {transcriptionMode === 'live' ? <MessageSquare className="w-4 h-4 text-purple-400" /> : <FileText className="w-4 h-4" />}
                            {transcriptionMode === 'live' && (
                              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)] animate-pulse" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={toggleVoiceRecording}
                            className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 ${
                              isRecording 
                                ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse' 
                                : 'bg-brand-dark border border-brand-border text-slate-400 hover:text-purple-400'
                            }`}
                            title={
                              isRecording 
                                ? "Stop Microphone" 
                                : voiceRecognitionMode === 'hands-free' 
                                  ? "Start Hands-free Voice-to-Text" 
                                  : "Push-to-Talk Recording"
                            }
                          >
                            {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                          </button>

                          <div className="flex-1 relative">
                            {isRecording ? (
                              <div className="absolute inset-0 bg-brand-dark border border-red-500/50 rounded-xl px-3.5 flex items-center overflow-hidden">
                                <span className="text-xs text-red-400 font-medium animate-pulse shrink-0">
                                  {voiceRecognitionMode === 'hands-free' ? 'Listening hands-free...' : 'Recording...'}
                                </span>
                                <div className="flex-1 h-full flex items-center ml-3">
                                  <svg className="w-full h-6 text-red-400" viewBox="0 0 200 32" preserveAspectRatio="none">
                                    <path
                                      d={`M 0 16 Q 25 ${16 - audioLevel/4} 50 16 T 100 16 T 150 16 T 200 16`}
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      className="transition-all duration-75"
                                    />
                                    <path
                                      d={`M 0 16 Q 25 ${16 + audioLevel/5} 50 16 T 100 16 T 150 16 T 200 16`}
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      opacity="0.3"
                                      className="transition-all duration-75"
                                    />
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={chatMessageText}
                                onChange={e => setChatMessageText(e.target.value)}
                                placeholder={
                                  isTranscribing 
                                    ? "Transcribing audio..." 
                                    : voiceRecognitionMode === 'hands-free'
                                      ? "Message or click mic to dictate hands-free..."
                                      : "Message group or teacher..."
                                }
                                disabled={isTranscribing}
                                className="w-full bg-brand-dark border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                              />
                            )}
                            {isTranscribing && !isRecording && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                              </div>
                            )}
                          </div>

                          <button
                            type="submit"
                            disabled={!chatMessageText.trim() && chatAttachments.length === 0}
                            className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/30 shrink-0"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                      
                      {showPinned && (
                        <div className="absolute right-0 top-0 bottom-0 w-64 bg-brand-card border-l border-brand-border z-20 shadow-2xl flex flex-col transition-all">
                          <div className="p-3 border-b border-brand-border flex items-center justify-between bg-brand-dark/50">
                            <h3 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                              <Pin className="w-3.5 h-3.5 fill-current" /> Pinned
                            </h3>
                            <button onClick={() => setShowPinned(false)} className="text-slate-400 hover:text-white transition cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {pinnedMessages.length === 0 ? (
                              <p className="text-center text-slate-500 text-[10px] py-4">No pinned messages.</p>
                            ) : (
                              pinnedMessages.map(msg => (
                                <div key={`pinned-${msg.id}`} className="bg-brand-dark p-2.5 rounded-xl border border-brand-border/50 text-xs shadow-md shadow-black/20">
                                  <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-bold text-[10px] text-amber-200 truncate pr-2">{msg.senderName}</span>
                                    <span className="text-[8px] text-slate-500 opacity-80 shrink-0">{msg.timestamp}</span>
                                  </div>
                                  <p className="text-slate-300 line-clamp-3 leading-relaxed">{renderMessageText(msg.text)}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Caption History Drawer / Overlay */}
                      {isCaptionHistoryOverlayOpen && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex justify-end animate-fadeIn">
                          <div className="w-full sm:w-[480px] lg:w-[540px] h-full bg-brand-card border-l border-brand-border shadow-2xl flex flex-col overflow-hidden">
                            <CaptionHistoryView
                              isOverlay={true}
                              onCloseOverlay={() => setIsCaptionHistoryOverlayOpen(false)}
                              captionsLog={captionsLog.map(c => ({
                                id: c.id,
                                speakerId: c.speakerId,
                                speakerName: c.speakerName,
                                speakerRole: c.speakerRole,
                                originalText: c.originalText,
                                translatedText: c.translatedText,
                                sourceLang: inputLanguage.code,
                                targetLang: preferredLanguage.code,
                                timestamp: c.timestamp,
                                isSelf: c.speakerId === student.id || c.isLocal
                              }))}
                              preferredLanguage={preferredLanguage}
                              onLanguageChange={handlePreferredLanguageChange}
                              isRecording={isRecording}
                              onToggleRecording={toggleVoiceRecording}
                              voiceRecognitionMode={voiceRecognitionMode}
                              onToggleVoiceMode={(mode) => setVoiceRecognitionMode(mode)}
                              audioLevel={audioLevel}
                              interimSpeechText={interimSpeechText}
                              speechEngineStatus={speechEngineStatus}
                              onRestartSpeechEngine={restartSpeechEngine}
                              onSendCaptionToChat={(text) => {
                                setChatMessageText(prev => (prev ? prev.trim() + ' ' : '') + text);
                                setIsCaptionHistoryOverlayOpen(false);
                                showToast("Caption inserted into chat message!");
                              }}
                              onClearCaptions={() => {
                                setCaptionsLog([]);
                                showToast("Captions history cleared.");
                              }}
                              onTriggerPresetSpeech={(presetText) => {
                                commitSpeechTranscript(presetText);
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                    </div>
                  </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB: DEDICATED VIRTUAL BOARD                                                */}
            {/* ========================================================================= */}
            {activeTab === 'whiteboard' && (
              <div className="space-y-3 flex flex-col h-[calc(100dvh-130px)] md:h-[700px] animate-fadeIn">
                <div className="bg-brand-card p-3 rounded-2xl border border-brand-border flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-2">
                    <PenTool className="w-4 h-4 text-purple-400" />
                    <h2 className="text-xs sm:text-sm font-bold text-slate-100">
                      Virtual Whiteboard & Scratchpad
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="px-3 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>View Chat</span>
                  </button>
                </div>

                <div className="flex-1 min-h-0 bg-brand-card rounded-3xl border border-brand-border p-2 shadow-xl flex flex-col overflow-hidden">
                  <VirtualWhiteboard
                    boardId={`student_dedicated_${student.id}`}
                    title={`${student.name}'s Virtual Board`}
                    authorName={student.name}
                    onShareToChat={handleShareWhiteboardToChat}
                    heightClass="h-full"
                  />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB: CALENDAR, SCHEDULE & WHITEBOARD ARCHIVES                               */}
            {/* ========================================================================= */}
            {activeTab === 'calendar' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-100">
                    Class Schedule & Archives
                  </h1>
                  <span className="text-xs text-purple-300 font-semibold bg-purple-500/10 px-3 py-1 rounded-xl border border-purple-500/20">
                    {mySessions.length} Sessions
                  </span>
                </div>

                <div className="space-y-3">
                  {mySessions.length > 0 ? mySessions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(session => {
                    const sessionWbFiles = (session.whiteboardFiles || []).concat(
                      (myGroup?.whiteboardFiles || []).filter(w => w.sessionId === session.id)
                    );

                    return (
                      <div key={session.id} className="p-4 rounded-2xl bg-brand-card border border-brand-border shadow-lg space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-bold text-sm sm:text-base text-slate-100">
                              {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {session.time}
                            </p>
                            <p className="text-xs text-purple-300 font-semibold mt-0.5">{session.topic}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase self-start sm:self-auto ${
                            session.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            session.status === 'upcoming' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {session.status}
                          </span>
                        </div>

                        {/* Class Whiteboard Snapshots from Teacher */}
                        {sessionWbFiles.length > 0 && (
                          <div className="pt-2.5 border-t border-brand-border/60">
                            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block mb-2">
                              📋 Class Whiteboard Files ({sessionWbFiles.length})
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {sessionWbFiles.map((w, idx) => (
                                <div key={idx} className="bg-brand-dark rounded-xl border border-brand-border overflow-hidden flex flex-col">
                                  <div 
                                    onClick={() => setSelectedImagePreview(w.imageDataUrl)}
                                    className="aspect-video bg-black/60 overflow-hidden block cursor-pointer"
                                  >
                                    <img src={w.imageDataUrl} alt={w.title} className="w-full h-full object-cover hover:scale-105 transition" />
                                  </div>
                                  <div className="p-2 flex items-center justify-between text-[10px]">
                                    <span className="text-slate-300 truncate font-semibold">{w.title}</span>
                                    <a
                                      href={w.imageDataUrl}
                                      download={`${w.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`}
                                      className="text-purple-400 hover:text-purple-300 ml-1 p-1"
                                      title="Download Snapshot"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="text-center py-12 text-slate-400 text-xs bg-brand-card rounded-2xl border border-brand-border">
                      No scheduled class sessions found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB: ACADEMIC GRADES & PERFORMANCE                                         */}
            {/* ========================================================================= */}
            {activeTab === 'grades' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-100">
                    Academic Grades & Evaluation
                  </h1>
                  <button 
                    onClick={handleDownloadGradesPDF}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition shadow-lg text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    Share PDF
                  </button>
                </div>

                <div id="grades-summary-container" className="space-y-3 p-2 bg-brand-dark rounded-xl">
                  {/* Header for PDF */}
                  <div className="mb-2 text-center pb-2 border-b border-brand-border/50">
                    <h2 className="text-lg font-bold text-slate-100">{student.name}</h2>
                    <p className="text-xs text-slate-400">Academic Performance Summary</p>
                  </div>
                  
                  <div className="space-y-3">
                  {mySessions.filter(s => s.status === 'completed' && s.grades?.some(g => g.studentId === student.id)).length > 0 ? 
                    mySessions.filter(s => s.status === 'completed').map(session => {
                      const grade = session.grades?.find(g => g.studentId === student.id);
                      if (!grade) return null;
                      return (
                        <div key={session.id} className="p-4 sm:p-5 rounded-2xl bg-brand-card border border-brand-border shadow-lg space-y-3">
                          <div className="flex justify-between items-center border-b border-brand-border/60 pb-2.5">
                            <div>
                              <p className="font-bold text-sm sm:text-base text-slate-100">{session.topic}</p>
                              <p className="text-[10px] text-slate-400">{new Date(session.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                            <div className="bg-brand-dark p-2.5 rounded-xl border border-brand-border">
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Speaking</p>
                              <p className="text-sm sm:text-base font-black text-purple-400 mt-0.5">{grade.speaking}</p>
                            </div>
                            <div className="bg-brand-dark p-2.5 rounded-xl border border-brand-border">
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Listening</p>
                              <p className="text-sm sm:text-base font-black text-amber-400 mt-0.5">{grade.listening}</p>
                            </div>
                            <div className="bg-brand-dark p-2.5 rounded-xl border border-brand-border">
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Homework</p>
                              <p className="text-sm sm:text-base font-black text-emerald-400 mt-0.5">{grade.homework}</p>
                            </div>
                          </div>

                          {grade.feedback && (
                            <div className="text-xs text-slate-300 italic bg-brand-dark/70 p-3 rounded-xl border border-brand-border/60">
                              "{grade.feedback}"
                            </div>
                          )}
                        </div>
                      );
                    }) : (
                    <div className="text-center py-12 text-slate-400 text-xs bg-brand-card rounded-2xl border border-brand-border">
                      No grades recorded yet. Grades will appear after class reviews!
                    </div>
                  )}
                </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB: FINANCE & TUITION                                                     */}
            {/* ========================================================================= */}
            {activeTab === 'finance' && (
              <div className="space-y-4 animate-fadeIn">
                <h1 className="text-xl sm:text-2xl font-black text-slate-100">
                  Tuition & Financial Records
                </h1>

                <div className="space-y-3">
                  {myTransactions.length > 0 ? myTransactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-brand-card border border-brand-border shadow-lg">
                      <div>
                        <p className="font-bold text-sm text-slate-100">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Due: {new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-base text-slate-100">$ {tx.amount.toFixed(2)}</p>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                          tx.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          tx.status === 'overdue' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-slate-400 text-xs bg-brand-card rounded-2xl border border-brand-border">
                      No financial records found for your account.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB: PROFILE & SECURITY                                                    */}
            {/* ========================================================================= */}
            {activeTab === 'profile' && (
              <div className="space-y-4 animate-fadeIn max-w-xl">
                <h1 className="text-xl sm:text-2xl font-black text-slate-100">
                  My Profile & Settings
                </h1>

                <div className="bg-brand-card rounded-3xl border border-brand-border p-5 sm:p-6 shadow-xl space-y-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Display Name</label>
                      <input 
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
                      <input 
                        type="text"
                        value={editedUsername}
                        onChange={(e) => setEditedUsername(e.target.value)}
                        className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                      <input 
                        type="email"
                        value={student.email}
                        disabled
                        className="w-full bg-brand-dark/50 border border-brand-border/50 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <SaveButton onClick={handleSaveProfile} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-purple-600/20 cursor-pointer text-xs" label="Save Profile Details" savedLabel="Saved!" onSave={() => {}} />
                  </div>

                  
                </div>
              </div>
            )}

            {activeTab === 'game' && (
              <div className="space-y-4 animate-fadeIn h-full flex flex-col">
                <div className="flex items-center justify-between shrink-0">
                  <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    <span>Vivlío</span>
                  </h2>
                </div>
                <World student={student} isTeacher={isAdminViewing} />
              </div>
            )}
            
            {activeTab === 'preferences' && (
              <div className="space-y-4 animate-fadeIn max-w-xl">
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center">
                  <Settings className="w-6 h-6 mr-3 text-purple-400" />
                  App Preferences
                </h1>

                <div className="bg-brand-card rounded-3xl border border-brand-border p-5 sm:p-6 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 mb-3 border-b border-brand-border pb-2">Voice Transcription</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-brand-dark/50 p-4 rounded-xl border border-brand-border/50">
                        <div className="pr-4">
                          <p className="text-sm font-bold text-slate-200">Auto-Insert Transcriptions</p>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Automatically place transcribed text directly into the chat box without prompting for confirmation.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAutoInsertTranscription(!autoInsertTranscription)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                            autoInsertTranscription ? 'bg-purple-600' : 'bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              autoInsertTranscription ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      
      {/* MOBILE BOTTOM NAVIGATION DOCK (Touch-Friendly, Labeled, Responsive) */}
      <nav className="md:hidden flex bg-brand-card/95 backdrop-blur-md border-t border-brand-border shrink-0 z-30 pb-safe">
        {[
          { id: 'overview', label: 'Home', icon: CheckCircle },
          { id: 'game', label: 'World', icon: Globe },
          { id: 'chat', label: 'Chat', icon: MessageSquare, badge: channelMessages.length > 0 ? String(channelMessages.length) : undefined },
          { id: 'whiteboard', label: 'Board', icon: PenTool },
          { id: 'calendar', label: 'Schedule', icon: Calendar },
          { id: 'grades', label: 'Grades', icon: FileText },
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'preferences', label: 'Prefs', icon: Settings }
        ].map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex-1 py-2.5 flex flex-col items-center justify-center transition cursor-pointer relative ${
                isActive 
                  ? 'text-purple-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                {item.badge && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-purple-500 absolute -top-0.5 -right-0.5 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">{item.label}</span>
              {isActive && (
                <span className="w-6 h-0.5 bg-purple-400 rounded-full absolute bottom-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {/* FULLSCREEN IMAGE PREVIEW MODAL */}
      {selectedImagePreview && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedImagePreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedImagePreview(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={selectedImagePreview} 
              alt="Preview" 
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl border border-brand-border"
            />
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900/95 text-slate-100 border border-purple-500/50 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-2 text-xs font-semibold animate-fadeIn">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <VaultCallOverlay currentUser={student} employees={[]} students={allStudents} />
    </div>
  );
}
