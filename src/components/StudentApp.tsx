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
  Square,
  Globe
} from 'lucide-react';
import SaveButton from './SaveButton';
import VirtualWhiteboard from './VirtualWhiteboard';
import VaultCallOverlay from './calling/VaultCallOverlay';
import World from './game/World';
import { useLiveCall } from '../context/LiveCallContext';
import { Student, Group, ClassSession, Transaction, Employee, EmployeeChatMessage, ChatAttachment } from '../types';
import { useLanguage } from '../context/LanguageContext';

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
  const { joinCall, startCall } = useLiveCall();
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'whiteboard' | 'calendar' | 'grades' | 'finance' | 'profile' | 'files' | 'game'>('overview');
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
  const [chatViewLayout, setChatViewLayout] = useState<'chat' | 'split' | 'whiteboard'>('chat');
  const [chatAttachments, setChatAttachments] = useState<ChatAttachment[]>([]);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
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

      mediaRecorder.onstop = () => {
        // Simulated transcription service
        const transcribedText = "This is a recorded voice message transcript.";
        setChatMessageText(prev => (prev + " " + transcribedText).trim());
        showToast("Voice message transcribed to chat!");
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      showToast("Microphone access is required to use voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channelMessages.length, activeTab]);

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
              { id: 'profile', label: 'My Profile', icon: User }
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
                        chatViewLayout === 'chat' ? 'bg-purple-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => setChatViewLayout('split')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                        chatViewLayout === 'split' ? 'bg-purple-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Split
                    </button>
                    <button
                      onClick={() => setChatViewLayout('whiteboard')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                        chatViewLayout === 'whiteboard' ? 'bg-purple-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Board
                    </button>
                  </div>
                </div>

                {/* Main Chat / Whiteboard Stage */}
                <div className="flex-1 min-h-0 bg-brand-card rounded-3xl border border-brand-border overflow-hidden flex flex-col shadow-xl">
                  {chatViewLayout === 'whiteboard' ? (
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
                        <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                          {channelMessages.map(msg => (
                            <div key={msg.id} className={`group flex flex-col ${msg.senderId === student.id ? 'items-end' : 'items-start'}`}>
                              <div className={`relative max-w-[85%] rounded-2xl p-2.5 text-xs ${
                                msg.senderId === student.id 
                                  ? 'bg-purple-600 text-white rounded-tr-xs' 
                                  : 'bg-brand-card border border-brand-border text-slate-200 rounded-tl-xs'
                              }`}>
                                <div className="flex justify-between items-baseline mb-0.5 space-x-2">
                                  <span className="font-bold text-[10px] opacity-90">{msg.senderName}</span>
                                  <span className="text-[9px] opacity-60">{msg.timestamp}</span>
                                </div>
                                <p className="text-xs whitespace-pre-wrap">{msg.text}</p>
                              </div>
                                <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition">
                                  {['👍', '❤️', '😂', '👏'].map(emoji => (
                                     <button 
                                       key={emoji} 
                                       onClick={() => onToggleReaction && onToggleReaction(msg.id, emoji)} 
                                       className="text-xs hover:scale-125 transition cursor-pointer"
                                     >
                                       {emoji}
                                     </button>
                                  ))}
                                </div>
                                {msg.reactions && msg.reactions.length > 0 && (
                                  <div className="flex items-center flex-wrap gap-1 mt-1">
                                    {msg.reactions.map((r, rIdx) => (
                                      <button
                                        key={rIdx}
                                        onClick={() => onToggleReaction && onToggleReaction(msg.id, r.emoji)}
                                        className={`px-1.5 py-0.5 rounded-md text-[10px] flex items-center gap-1 border transition ${
                                          r.users.includes(student.id)
                                            ? 'bg-purple-500/30 border-purple-500/60 text-purple-200'
                                            : 'bg-brand-dark/80 border-brand-border text-slate-300'
                                        }`}
                                      >
                                        <span>{r.emoji}</span>
                                        <span className="font-mono text-[9px]">{r.users.length}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                            </div>
                          ))}
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
                    <div className="flex-1 flex flex-col min-h-0">
                      {/* Channel title & Call launcher */}
                      <div className="px-4 py-2.5 bg-brand-dark/80 border-b border-brand-border flex items-center justify-between shrink-0">
                        <div className="flex items-center space-x-2 truncate">
                          <MessageSquare className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                            {studentChannels.find(c => c.id === activeChannelId)?.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => {
                              startCall(
                                `vault-room-channel-${activeChannelId}`,
                                { id: student.id, name: student.name, role: 'Student', avatarUrl: student.avatarUrl },
                                `Channel: ${studentChannels.find(c => c.id === activeChannelId)?.name || activeChannelId}`,
                                'class'
                              );
                            }}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Start Call</span>
                          </button>

                          <button
                            onClick={() => setActiveTab('whiteboard')}
                            className="px-2.5 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold hover:bg-purple-600 hover:text-white transition flex items-center space-x-1 cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Whiteboard</span>
                          </button>
                        </div>
                      </div>

                      {/* Chat Messages Feed */}
                      <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 custom-scrollbar min-h-0">
                        {channelMessages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2 p-6 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-400 mb-1">
                              <MessageSquare className="w-6 h-6" />
                            </div>
                            <p className="font-bold text-slate-300">No messages in this channel yet</p>
                            <p className="text-[11px] text-slate-500 max-w-xs">Start the conversation, ask questions to your teacher, or share a whiteboard drawing!</p>
                          </div>
                        ) : (
                          channelMessages.map(msg => (
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
                                  </div>
                                  <span className="text-[9px] opacity-60 font-mono">{msg.timestamp}</span>
                                </div>
                                <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                                <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition absolute -bottom-3 bg-brand-dark/90 px-2 py-0.5 rounded-full border border-brand-border z-10">
                                  {['👍', '❤️', '😂', '👏'].map(emoji => (
                                    <button 
                                      key={emoji} 
                                      onClick={() => onToggleReaction && onToggleReaction(msg.id, emoji)} 
                                      className="text-xs hover:scale-125 transition cursor-pointer"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>

                                {msg.reactions && msg.reactions.length > 0 && (
                                  <div className="flex items-center flex-wrap gap-1 mt-2">
                                    {msg.reactions.map((r, rIdx) => (
                                      <button
                                        key={rIdx}
                                        onClick={() => onToggleReaction && onToggleReaction(msg.id, r.emoji)}
                                        className={`px-1.5 py-0.5 rounded-md text-[10px] flex items-center gap-1 border transition ${
                                          r.users.includes(student.id)
                                            ? 'bg-purple-500/30 border-purple-500/60 text-purple-200'
                                            : 'bg-brand-dark/80 border-brand-border text-slate-300'
                                        }`}
                                      >
                                        <span>{r.emoji}</span>
                                        <span className="font-mono text-[9px]">{r.users.length}</span>
                                      </button>
                                    ))}
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
                                          <a href={att.url} download={att.name} className="flex items-center p-2 text-xs hover:underline">
                                            <Paperclip className="w-3.5 h-3.5 mr-1.5 text-purple-300" />
                                            <span className="truncate">{att.name}</span>
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
                      </div>

                      {/* Attachments preview tray */}
                      {chatAttachments.length > 0 && (
                        <div className="px-3 py-2 bg-brand-dark/80 border-t border-brand-border flex items-center space-x-2 overflow-x-auto shrink-0">
                          {chatAttachments.map(att => (
                            <div key={att.id} className="relative group shrink-0">
                              {att.type === 'image' ? (
                                <img src={att.url} alt={att.name} className="w-12 h-12 object-cover rounded-xl border border-purple-500" />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-brand-card border border-brand-border flex items-center justify-center text-xs">
                                  <Paperclip className="w-4 h-4 text-purple-400" />
                                </div>
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
                        <form onSubmit={handleSendChatMessage} className="flex items-center space-x-1.5">
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

                          <button
                            type="button"
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 ${
                              isRecording 
                                ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse' 
                                : 'bg-brand-dark border border-brand-border text-slate-400 hover:text-purple-400'
                            }`}
                            title={isRecording ? "Stop Recording" : "Voice Record"}
                          >
                            {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                          </button>

                          <input
                            type="text"
                            value={chatMessageText}
                            onChange={e => setChatMessageText(e.target.value)}
                            placeholder="Message group or teacher..."
                            className="flex-1 bg-brand-dark border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                          />

                          <button
                            type="submit"
                            disabled={!chatMessageText.trim() && chatAttachments.length === 0}
                            className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition disabled:opacity-40 cursor-pointer shadow-md shadow-purple-600/20 shrink-0"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
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
          { id: 'profile', label: 'Profile', icon: User }
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
