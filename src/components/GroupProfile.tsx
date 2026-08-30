import React, { useState } from 'react';
import { Group, Employee, Student, ClassSession, WhiteboardFile, BookCollection, GroupCustomSlideshow } from '../types';
import VirtualWhiteboard, { WhiteboardSnapshotData } from './VirtualWhiteboard';
import GroupSlideshowManager from './GroupSlideshowManager';
import ClassroomStudio from './ClassroomStudio';
import { useLiveCall } from '../context/LiveCallContext';
import { 
  Trash2, 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Edit2, 
  Check, 
  X, 
  Calendar, 
  BookOpen, 
  Clock, 
  Users, 
  CalendarDays, 
  Award, 
  Plus, 
  Save,
  Presentation,
  FileText,
  Download,
  Eye,
  Paintbrush,
  Sparkles,
  Maximize2,
  Layers,
  ShieldCheck,
  Tv, Video
} from 'lucide-react';
import { isSuperAdmin } from '../utils/roles';
import { jsPDF } from 'jspdf';

interface GroupProfileProps {
  onNavigate?: (type: 'student' | 'group' | 'staff', id: string) => void;
  students: Student[];
  group: Group;
  activeEmployee: Employee;
  employees?: Employee[];
  collections?: BookCollection[];
  classSessions?: ClassSession[];
  onUpdateClassSession?: (session: ClassSession) => void;
  onAddClassSession?: (session: ClassSession) => void;
  onDeleteClassSession?: (id: string) => void;
  onClose: () => void;
  onUpdateGroup: (g: Group) => void;
  onDeleteGroup?: (id: string) => void;
}

export default function GroupProfile({ 
  group, 
  students, 
  activeEmployee, 
  employees = [],
  collections = [],
  classSessions = [],
  onUpdateClassSession,
  onAddClassSession,
  onDeleteClassSession,
  onClose, 
  onUpdateGroup,
  onDeleteGroup,
  onNavigate 
}: GroupProfileProps) {
  const { startCall } = useLiveCall();
  const [groupView, setGroupView] = useState<'classroom' | 'classes' | 'slideshows' | 'overview' | 'chat'>('classroom');
  const [chatInput, setChatInput] = useState('');
  const [isChatWhiteboardOpen, setIsChatWhiteboardOpen] = useState(false);

  // Editing Group State
  const [isEditing, setIsEditing] = useState(false);
  const [editDays, setEditDays] = useState<string[]>([]);
  const [editTime, setEditTime] = useState<string>('');
  const [editData, setEditData] = useState<Partial<Group>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active Session for Class Whiteboard Modal / Studio
  const [activeSessionForWhiteboard, setActiveSessionForWhiteboard] = useState<ClassSession | null>(null);

  // Quick class scheduling inside group profile
  const [isSchedulingClass, setIsSchedulingClass] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionData, setEditSessionData] = useState<{date: string; time: string; topic: string}>({date: '', time: '', topic: ''});
  const [newClassDate, setNewClassDate] = useState('');
  const [newClassTime, setNewClassTime] = useState(group.schedule.split(' ')[1] || '19:00 BRT');
  const [newClassTopic, setNewClassTopic] = useState('');

  // Preview Whiteboard File Modal
  const [previewWhiteboardFile, setPreviewWhiteboardFile] = useState<WhiteboardFile | null>(null);

  const groupStudents = students.filter(s => 
    s.group === group.code || 
    s.group === group.id || 
    s.group === group.name ||
    (group.code === '1' && (s.group === 'Group Alpha' || s.group === '1')) ||
    (group.code === '2' && (s.group === 'Group Beta' || s.group === '2')) ||
    (group.code === '3' && (s.group === 'Group Gamma' || s.group === '3'))
  );

  const startEditing = () => {
    const parts = group.schedule.split(' ');
    const parsedDays = parts[0] ? parts[0].split('/') : [];
    const parsedTime = parts[1] || '';
    setEditDays(parsedDays);
    setEditTime(parsedTime);
    setEditData({
      code: group.code,
      level: group.level,
      teacher: group.teacher,
      schedule: group.schedule,
      startDate: group.startDate,
      endDate: group.endDate,
      meetLink: group.meetLink,
      status: group.status,
    });
    setIsEditing(true);
  };

  const saveEditing = () => {
    if (onUpdateGroup) {
      const finalSchedule = editDays.length > 0 && editTime ? `${editDays.join('/')} ${editTime}` : editData.schedule;
      onUpdateGroup({
        ...group,
        ...editData,
        schedule: finalSchedule
      });
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    setIsEditing(false);
  };

  const groupSessions = classSessions?.filter(s => s.groupId === group.id) || [];

  const getStudentAttendance = (studentId: string) => {
    if (!groupSessions || groupSessions.length === 0) return '100%';
    let presentCount = 0;
    let totalCount = 0;
    groupSessions.forEach(session => {
      const att = session.attendance.find(a => a.studentId === studentId);
      if (att) {
        totalCount++;
        if (att.status === 'present' || att.status === 'late') {
          presentCount++;
        }
      }
    });
    if (totalCount === 0) return '100%';
    return Math.round((presentCount / totalCount) * 100) + '%';
  };

  const getLetterGrade = (avgNum: number) => {
    if (avgNum >= 9.0) return 'A';
    if (avgNum >= 8.0) return 'B';
    if (avgNum >= 7.0) return 'C';
    if (avgNum >= 6.0) return 'D';
    return 'F';
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'active': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'upcoming': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'waiting': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'completed': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default: return 'bg-brand-dark text-slate-400 border-brand-border';
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      senderId: activeEmployee.id,
      senderName: activeEmployee.name,
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedGroup = {
      ...group,
      messages: [...(group.messages || []), newMessage]
    };
    
    onUpdateGroup(updatedGroup);
    setChatInput('');
  };

  const handleScheduleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassDate || !newClassTopic) return;

    const newSession: ClassSession = {
      id: `session-${Date.now()}`,
      groupId: group.id,
      groupCode: group.code,
      date: newClassDate,
      time: newClassTime,
      topic: newClassTopic,
      teacher: group.teacher || 'Teacher',
      status: 'upcoming',
      attendance: groupStudents.map(st => ({
        studentId: st.id,
        studentName: st.name,
        status: 'present'
      })),
      grades: groupStudents.map(st => ({
        studentId: st.id,
        studentName: st.name,
        speaking: "",
        listening: "",
        homework: ""
      })),
      whiteboardFiles: []
    };

    if (onAddClassSession) {
      onAddClassSession(newSession);
    }
    setIsSchedulingClass(false);
    setNewClassTopic('');
  };

  const handleSessionAttendance = (sessionId: string, studentId: string, status: 'present' | 'absent' | 'late' | 'excused' | 'pending') => {
    if (!onUpdateClassSession) return;
    const session = classSessions.find(s => s.id === sessionId);
    if (!session) return;

    const updatedAttendance = session.attendance.map(a => {
      if (a.studentId === studentId) {
        return { ...a, status };
      }
      return a;
    });

    onUpdateClassSession({ ...session, attendance: updatedAttendance });
  };

  const handleSessionGrade = (sessionId: string, studentId: string, field: 'speaking' | 'listening' | 'homework', val: string) => {
    if (!onUpdateClassSession) return;
    const session = classSessions.find(s => s.id === sessionId);
    if (!session) return;

    const updatedGrades = [...session.grades];
    const existingIndex = updatedGrades.findIndex(g => g.studentId === studentId);
    if (existingIndex >= 0) {
      updatedGrades[existingIndex] = { ...updatedGrades[existingIndex], [field]: val };
    } else {
      updatedGrades.push({
        studentId,
        studentName: session.attendance.find(a => a.studentId === studentId)?.studentName || '',
        speaking: "",
        listening: "",
        homework: "",
        [field]: val
      });
    }
    
    onUpdateClassSession({ ...session, grades: updatedGrades });
  };

  // -------------------------------------------------------------
  // CLASS SESSION & GROUP WHITEBOARD HANDLERS (BRUSH & SEND)
  // -------------------------------------------------------------
  const handleTeacherBrushGroupWhiteboard = (snapshot: WhiteboardSnapshotData) => {
    const newWbFile: WhiteboardFile = {
      id: `wb-file-${Date.now()}`,
      title: `Group ${group.code} • ${group.level} (Brushed)`,
      timestamp: new Date().toISOString(),
      teacherName: activeEmployee.name,
      authorName: activeEmployee.name,
      topic: `${group.name || group.code} Collaborative Board`,
      groupId: group.id,
      sessionId: activeSessionForWhiteboard?.id || undefined,
      imageDataUrl: snapshot.imageDataUrl,
      stateSnapshot: snapshot.state
    };

    // 1. Save to group
    const updatedGroup: Group = {
      ...group,
      whiteboardFiles: [...(group.whiteboardFiles || []), newWbFile]
    };
    onUpdateGroup(updatedGroup);

    // 2. If active class session is open, save to that session too
    if (activeSessionForWhiteboard && onUpdateClassSession) {
      const updatedSession: ClassSession = {
        ...activeSessionForWhiteboard,
        whiteboardFiles: [...(activeSessionForWhiteboard.whiteboardFiles || []), newWbFile]
      };
      onUpdateClassSession(updatedSession);
      setActiveSessionForWhiteboard(updatedSession);
    }
  };

  const handleTeacherSendGroupWhiteboard = (snapshot: WhiteboardSnapshotData) => {
    const newWbFile: WhiteboardFile = {
      id: `wb-file-${Date.now()}`,
      title: `Group ${group.code} • ${activeSessionForWhiteboard?.topic || group.level} (Snapshot)`,
      timestamp: new Date().toISOString(),
      teacherName: activeEmployee.name,
      authorName: activeEmployee.name,
      topic: activeSessionForWhiteboard?.topic || `${group.name || group.code} Board`,
      groupId: group.id,
      sessionId: activeSessionForWhiteboard?.id || undefined,
      imageDataUrl: snapshot.imageDataUrl,
      stateSnapshot: snapshot.state
    };

    const updatedGroup: Group = {
      ...group,
      whiteboardFiles: [...(group.whiteboardFiles || []), newWbFile]
    };
    onUpdateGroup(updatedGroup);

    if (activeSessionForWhiteboard && onUpdateClassSession) {
      const updatedSession: ClassSession = {
        ...activeSessionForWhiteboard,
        whiteboardFiles: [...(activeSessionForWhiteboard.whiteboardFiles || []), newWbFile]
      };
      onUpdateClassSession(updatedSession);
      setActiveSessionForWhiteboard(updatedSession);
    }
  };

  // Download PDF
  const handleDownloadWhiteboardPDF = (wb: WhiteboardFile) => {
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 12;

      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      pdf.setFillColor(30, 41, 59);
      pdf.roundedRect(margin, margin, pageWidth - margin * 2, 22, 3, 3, 'F');

      pdf.setTextColor(241, 245, 249);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(wb.title, margin + 6, margin + 9);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Group ${group.code} (${group.level})   •   Teacher: ${wb.teacherName || wb.authorName || 'Teacher'}   •   Topic: ${wb.topic || 'Class'}`, margin + 6, margin + 16);

      const dateStr = new Date(wb.timestamp).toLocaleString();
      pdf.setTextColor(192, 132, 252);
      pdf.text(dateStr, pageWidth - margin - 6, margin + 12, { align: 'right' });

      const imgWidth = pageWidth - margin * 2;
      const imgHeight = pageHeight - margin * 2 - 28 - 10;
      const imgY = margin + 26;

      pdf.addImage(wb.imageDataUrl, 'PNG', margin, imgY, imgWidth, imgHeight, undefined, 'FAST');

      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(margin, imgY, imgWidth, imgHeight, 2, 2, 'D');

      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('School Vault Academic Records   •   Classroom Whiteboard Session', pageWidth / 2, pageHeight - 5, { align: 'center' });

      pdf.save(`${wb.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  const handleDownloadSessionRecording = (session: ClassSession) => {
    const content = `VAULT CLASS RECORDING METADATA & TRANSCRIPT\n` +
      `=============================================\n` +
      `Group: ${group.name} (${group.code})\n` +
      `Level: ${group.level}\n` +
      `Date: ${session.date}\n` +
      `Topic: ${session.topic || 'Class Session'}\n` +
      `Teacher: ${session.teacherName || group.teacher || activeEmployee.name}\n` +
      `Status: ${session.status}\n` +
      `Meeting Link: ${session.meetLink || 'N/A'}\n` +
      `Generated At: ${new Date().toISOString()}\n` +
      `=============================================\n` +
      `Archived media log ready for student review.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Class_Recording_${group.code}_${session.date}_${(session.topic || 'Lesson').replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Group class sessions sorted by date
  const sortedSessions = [...classSessions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <section className="space-y-6 flex flex-col h-full">
      {group.coverImage && (
        <div className="w-full h-32 md:h-48 rounded-xl overflow-hidden shrink-0 border border-brand-border">
          <img src={group.coverImage} alt="Group Cover" className="w-full h-full object-cover" />
        </div>
      )}
      {/* Group Profile Top Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onClose}
            className="p-2.5 bg-brand-dark border border-brand-border rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            title="Back to Groups Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-bold font-mono text-purple-300 text-sm shrink-0">
                {group.code}
              </span>
              <h2 className="text-xl font-bold text-slate-100 line-clamp-1">{group.name || group.code}</h2>
              <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded border shrink-0 ${getStatusColor(group.status!)}`}>
                {group.status}
              </span>
            </div>
            <div className="flex items-center space-x-3 mt-1 text-xs">
              <button 
                type="button"
                onClick={() => onNavigate && onNavigate('staff', group.teacher)}
                className="text-purple-400 hover:text-purple-300 hover:underline cursor-pointer"
              >
                Teacher: {group.teacher}
              </button>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{group.level}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{group.schedule}</span>
            </div>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex bg-brand-dark border border-brand-border rounded-lg p-1 shrink-0 overflow-x-auto no-scrollbar gap-1">
          <button 
            onClick={() => setGroupView('classroom')} 
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${groupView === 'classroom' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Tv className="w-3.5 h-3.5 text-purple-300" />
            <span className="whitespace-nowrap">Classroom</span>
          </button>
          <button 
            onClick={() => setGroupView('classes')} 
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${groupView === 'classes' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Classes</span>
          </button>
          <button 
            onClick={() => setGroupView('slideshows')} 
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${groupView === 'slideshows' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Slideshows</span>
            {(group.customSlideshows || []).filter(s => s.status === 'pending_approval').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </button>
          <button 
            onClick={() => setGroupView('chat')} 
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${groupView === 'chat' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Chat & Whiteboard</span>
          </button>

          <button 
            onClick={() => setGroupView('overview')} 
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${groupView === 'overview' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span className="whitespace-nowrap">Overview</span>
          </button>
        </div>
      </div>

      {/* CLASS WHITEBOARD MODAL (WHEN LAUNCHED FROM A CLASS SESSION) */}
      {activeSessionForWhiteboard && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-brand-border rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-brand-dark border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 rounded bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold font-mono">
                  {activeSessionForWhiteboard.date}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{activeSessionForWhiteboard.topic}</h3>
                  <p className="text-xs text-slate-400">Class Whiteboard for Group {group.code} ({group.level})</p>
                </div>
              </div>

              <button
                onClick={() => setActiveSessionForWhiteboard(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-hidden">
              <VirtualWhiteboard
                boardId={`class_session_${activeSessionForWhiteboard.id}`}
                title={`${activeSessionForWhiteboard.topic} • Class Board`}
                authorName={activeEmployee.name}
                heightClass="h-full min-h-[500px]"
                showTeacherControls={true}
                onBrush={handleTeacherBrushGroupWhiteboard}
                onSendCurrentBoard={handleTeacherSendGroupWhiteboard}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB: UNIFIED CLASSROOM STUDIO (SLIDE VIEWER & PRESENTER + LIVE WHITEBOARD) */}
      {groupView === 'classroom' && (
        <ClassroomStudio
          group={group}
          students={students}
          activeEmployee={activeEmployee}
          employees={employees}
          collections={collections}
          classSessions={classSessions}
          onUpdateGroup={onUpdateGroup}
          onNavigate={onNavigate}
        />
      )}

      {/* TAB: UPCOMING CLASSES TABLE ORGANIZED BY DATE & WHITEBOARDS */}
      {groupView === 'classes' && (
        <div className="space-y-5">
          {/* Rollcall Table */}
          <div className="mb-6">
            <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
              <div className="p-4 bg-brand-dark border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Rollcall & Attendance Records (Group {group.code})</h3>
                  <p className="text-xs text-slate-400">Class attendance rates for enrolled students.</p>
                </div>
                <div className="flex space-x-2">
                  <input type="date" className="bg-brand-dark border border-brand-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none [color-scheme:dark]" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-brand-dark/80 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-4">No.</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Recent Attendance</th>
                      <th className="p-4">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {groupStudents.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">No students enrolled.</td></tr>
                    ) : (
                      groupStudents.map((student, idx) => (
                        <tr key={student.id} className="hover:bg-purple-900/10 transition">
                          <td className="p-4 text-slate-500 font-mono">{String(idx + 1).padStart(2, '0')}</td>
                          <td className="p-4 font-medium text-slate-200 cursor-pointer hover:text-purple-400 hover:underline" onClick={() => onNavigate && onNavigate('student', student.id)}>{student.name}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                              Present (Latest Class)
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-200">
                            {getStudentAttendance(student.id)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Classes Schedule with Whiteboard Files */}
          <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
            <div className="p-4 bg-brand-dark/70 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center">
                  <CalendarDays className="w-4 h-4 mr-2 text-purple-400" />
                  Schedule & Class Whiteboard Files ({group.name || group.code})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Chronologically organized dates with whiteboard archives and attendance marking.</p>
              </div>
              <button
                onClick={() => setIsSchedulingClass(!isSchedulingClass)}
                className="px-3.5 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-500 transition cursor-pointer flex items-center self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {isSchedulingClass ? 'Cancel' : 'Schedule Class Date'}
              </button>
            </div>

            {/* Quick schedule form */}
            {isSchedulingClass && (
              <form onSubmit={handleScheduleClassSubmit} className="p-4 bg-brand-dark/90 border-b border-brand-border grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Class Date</label>
                  <input 
                    type="date" 
                    value={newClassDate} 
                    onChange={e => setNewClassDate(e.target.value)} 
                    className="w-full bg-brand-card border border-brand-border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Class Time</label>
                  <input 
                    type="text" 
                    value={newClassTime} 
                    onChange={e => setNewClassTime(e.target.value)} 
                    className="w-full bg-brand-card border border-brand-border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500" 
                    required 
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">Topic / Lesson Unit</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Unit 4: Debates & Vocabulary" 
                    value={newClassTopic} 
                    onChange={e => setNewClassTopic(e.target.value)} 
                    className="w-full bg-brand-card border border-brand-border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500" 
                    required 
                  />
                </div>
                <div>
                  <button type="submit" className="w-full py-1.5 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-500 transition cursor-pointer">
                    Save Class Date
                  </button>
                </div>
              </form>
            )}

            {/* Table of Class Sessions organized by Date */}
            <div className="divide-y divide-brand-border">
              {sortedSessions.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-xs">
                  No upcoming classes scheduled yet for Group {group.code}. Click "Schedule Class Date" to create one.
                </div>
              ) : (
                sortedSessions.map((session) => {
                  const isPast = new Date(session.date).getTime() < new Date().setHours(0,0,0,0);
                  const isToday = session.date === new Date().toISOString().split('T')[0];
                  
                  // Whiteboard files for this session or group
                  const sessionWbFiles = (session.whiteboardFiles || []).concat(
                    (group.whiteboardFiles || []).filter(w => w.sessionId === session.id)
                  );

                  return (
                    <div key={session.id} className="p-4 hover:bg-brand-dark/30 transition space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          <div className="px-3 py-1 bg-brand-dark border border-brand-border rounded-lg text-center font-mono">
                            <span className="block text-xs font-bold text-purple-300">{session.date}</span>
                            <span className="block text-[10px] text-slate-400">{session.time}</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-slate-200 text-sm">{session.topic}</h4>
                              {isToday && <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">TODAY</span>}
                              {!isToday && !isPast && <span className="px-1.5 py-0.2 text-[9px] bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">UPCOMING</span>}
                              {isPast && <span className="px-1.5 py-0.2 text-[9px] bg-slate-500/20 text-slate-400 rounded border border-slate-500/30">PAST</span>}
                            </div>
                            <span className="text-xs text-slate-400">Teacher: {session.teacher}</span>
                          </div>
                        </div>

                        {/* Class Whiteboard Action Button */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setActiveSessionForWhiteboard(session)}
                            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Presentation className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Launch Class Whiteboard</span>
                          </button>
                          {isSuperAdmin(activeEmployee) && onDeleteClassSession && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this class session?')) {
                                  onDeleteClassSession(session.id);
                                }
                              }}
                              className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                              title="Delete Session"
                            >
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {session.status === 'completed' && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-brand-border/50">
                          <span className="text-xs text-slate-400 flex items-center gap-1"><Video className="w-3.5 h-3.5 text-sky-400"/> Recording available (expires in 7 days)</span>
                          <button 
                            onClick={() => handleDownloadSessionRecording(session)} 
                            className="ml-auto px-2.5 py-1 bg-sky-900/30 hover:bg-sky-900/50 text-sky-300 rounded border border-sky-500/30 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Download Metadata
                          </button>
                        </div>
                      )}

                      {/* Attached Class Whiteboard Files Strip */}
                      {sessionWbFiles.length > 0 && (
                        <div className="p-3 bg-brand-dark/80 rounded-xl border border-purple-500/30 space-y-2">
                          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            Class Whiteboard Snapshots ({sessionWbFiles.length})
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {sessionWbFiles.map((w, idx) => (
                              <div key={idx} className="bg-slate-900 rounded-lg border border-brand-border overflow-hidden flex flex-col group/wb">
                                <div 
                                  className="aspect-video bg-black/60 overflow-hidden cursor-pointer relative"
                                  onClick={() => setPreviewWhiteboardFile(w)}
                                >
                                  <img src={w.imageDataUrl} alt={w.title} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/wb:opacity-100 transition flex items-center justify-center">
                                    <Eye className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                                <div className="p-2 flex items-center justify-between text-[10px]">
                                  <span className="text-slate-300 truncate font-semibold">{w.title}</span>
                                  <button
                                    onClick={() => handleDownloadWhiteboardPDF(w)}
                                    className="text-purple-400 hover:text-purple-300 ml-1 p-0.5 cursor-pointer"
                                    title="Download PDF"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attendance & Grades Grid */}
                      <div className="overflow-x-auto bg-brand-dark/50 rounded-lg p-2 border border-brand-border/60">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="text-slate-400 uppercase text-[9px] border-b border-brand-border/40">
                            <tr>
                              <th className="p-2">Student</th>
                              <th className="p-2">Attendance Status</th>
                              <th className="p-2 text-center">Speaking (0-10)</th>
                              <th className="p-2 text-center">Listening (0-10)</th>
                              <th className="p-2 text-center">Homework (0-10)</th>
                              <th className="p-2 text-right">Class Avg</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-border/30">
                            {session.attendance.map((att) => {
                              const grade = session.grades.find(g => g.studentId === att.studentId);
                              let avgOutput = '-';
                              if (grade && (grade.speaking !== "" || grade.listening !== "" || grade.homework !== "")) {
                                const mapLetterToValue = (l: string) => {
                                  switch (l.toUpperCase()) {
                                    case 'A+': return 4.3; case 'A': return 4.0; case 'A-': return 3.7;
                                    case 'B+': return 3.3; case 'B': return 3.0; case 'B-': return 2.7;
                                    case 'C+': return 2.3; case 'C': return 2.0; case 'C-': return 1.7;
                                    case 'D+': return 1.3; case 'D': return 1.0; case 'F': return 0.0;
                                    default: return null;
                                  }
                                };
                                const mapValueToLetter = (v: number) => {
                                  if (v >= 4.15) return 'A+'; if (v >= 3.85) return 'A'; if (v >= 3.5) return 'A-';
                                  if (v >= 3.15) return 'B+'; if (v >= 2.85) return 'B'; if (v >= 2.5) return 'B-';
                                  if (v >= 2.15) return 'C+'; if (v >= 1.85) return 'C'; if (v >= 1.5) return 'C-';
                                  if (v >= 1.15) return 'D+'; if (v >= 0.85) return 'D'; return 'F';
                                };
                                const vals = [grade.speaking, grade.listening, grade.homework].map(mapLetterToValue).filter(v => v !== null) as number[];
                                if (vals.length > 0) {
                                  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                                  avgOutput = mapValueToLetter(avg);
                                }
                              }

                              return (
                                <tr key={att.studentId} className="hover:bg-purple-900/10">
                                  <td className="p-2 font-medium text-slate-200">
                                    <button 
                                      type="button" 
                                      onClick={() => onNavigate && onNavigate('student', att.studentId)}
                                      className="text-purple-400 hover:underline cursor-pointer"
                                    >
                                      {att.studentName}
                                    </button>
                                  </td>
                                  <td className="p-2">
                                    <select
                                      value={att.status}
                                      onChange={(e) => handleSessionAttendance(session.id, att.studentId, e.target.value as any)}
                                      className="bg-brand-card border border-brand-border text-[11px] rounded px-2 py-0.5 text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                                    >
                                      <option value="present">Present</option>
                                      <option value="absent">Absent</option>
                                      <option value="late">Late</option>
                                      <option value="excused">Excused</option>
                                      <option value="pending">Pending</option>
                                    </select>
                                  </td>
                                  <td className="p-2 text-center">
                                    <select 
                                      value={grade?.speaking || ''}
                                      onChange={e => handleSessionGrade(session.id, att.studentId, 'speaking', e.target.value)}
                                      className="w-14 bg-brand-card border border-brand-border text-center rounded px-0.5 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500 uppercase cursor-pointer"
                                    >
                                      <option value="">-</option>
                                      <option value="A+">A+</option>
                                      <option value="A">A</option>
                                      <option value="A-">A-</option>
                                      <option value="B+">B+</option>
                                      <option value="B">B</option>
                                      <option value="B-">B-</option>
                                      <option value="C+">C+</option>
                                      <option value="C">C</option>
                                      <option value="C-">C-</option>
                                      <option value="D+">D+</option>
                                      <option value="D">D</option>
                                      <option value="F">F</option>
                                    </select>
                                  </td>
                                  <td className="p-2 text-center">
                                    <select 
                                      value={grade?.listening || ''}
                                      onChange={e => handleSessionGrade(session.id, att.studentId, 'listening', e.target.value)}
                                      className="w-14 bg-brand-card border border-brand-border text-center rounded px-0.5 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500 uppercase cursor-pointer"
                                    >
                                      <option value="">-</option>
                                      <option value="A+">A+</option>
                                      <option value="A">A</option>
                                      <option value="A-">A-</option>
                                      <option value="B+">B+</option>
                                      <option value="B">B</option>
                                      <option value="B-">B-</option>
                                      <option value="C+">C+</option>
                                      <option value="C">C</option>
                                      <option value="C-">C-</option>
                                      <option value="D+">D+</option>
                                      <option value="D">D</option>
                                      <option value="F">F</option>
                                    </select>
                                  </td>
                                  <td className="p-2 text-center">
                                    <select 
                                      value={grade?.homework || ''}
                                      onChange={e => handleSessionGrade(session.id, att.studentId, 'homework', e.target.value)}
                                      className="w-14 bg-brand-card border border-brand-border text-center rounded px-0.5 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500 uppercase cursor-pointer"
                                    >
                                      <option value="">-</option>
                                      <option value="A+">A+</option>
                                      <option value="A">A</option>
                                      <option value="A-">A-</option>
                                      <option value="B+">B+</option>
                                      <option value="B">B</option>
                                      <option value="B-">B-</option>
                                      <option value="C+">C+</option>
                                      <option value="C">C</option>
                                      <option value="C-">C-</option>
                                      <option value="D+">D+</option>
                                      <option value="D">D</option>
                                      <option value="F">F</option>
                                    </select>
                                  </td>
                                  <td className="p-2 text-right font-mono font-bold text-purple-300">
                                    {avgOutput}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: CUSTOM GROUP SLIDESHOWS & APPROVALS */}
      {groupView === 'slideshows' && (
        <GroupSlideshowManager
          group={group}
          activeEmployee={activeEmployee}
          employees={employees}
          collections={collections}
          onUpdateGroup={onUpdateGroup}
          onOpenInClassroom={(unitNumber) => setGroupView('classroom')}
        />
      )}

      {/* TAB: OVERVIEW */}
      {groupView === 'overview' && (
        <div className="bg-brand-card rounded-xl border border-brand-border p-6 space-y-4 relative">
          {!isEditing ? (
            <button onClick={startEditing} className="absolute top-6 right-6 p-2 bg-brand-dark border border-brand-border rounded-lg text-slate-400 hover:text-white transition cursor-pointer" title="Edit Group">
              <Edit2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="absolute top-6 right-6 flex space-x-2">
              {isSuperAdmin(activeEmployee) && onDeleteGroup && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to completely delete this group? This action cannot be undone.')) {
                      onDeleteGroup(group.id);
                      onClose();
                    }
                  }}
                  className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500 hover:text-white transition cursor-pointer flex items-center justify-center"
                  title="Delete Group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setIsEditing(false)} className="p-2 bg-brand-dark border border-brand-border rounded-lg text-slate-400 hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
              <button onClick={saveEditing} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition cursor-pointer flex items-center">
                {saveSuccess ? <><Check className="w-4 h-4 mr-1"/> Saved</> : <><Save className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          <h3 className="text-lg font-bold text-slate-200 border-b border-brand-border pb-4">{group.name || group.code} Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <div className="flex justify-between border-b border-brand-border/50 pb-2 items-center">
                <span className="text-slate-400">Group Name:</span>
                {isEditing ? (
                  <input type="text" placeholder="e.g. Super English" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-right w-48" />
                ) : <span className="text-slate-200 font-bold">{group.name || '-'}</span>}
              </div>
              <div className="flex justify-between border-b border-brand-border/50 pb-2 items-center">
                <span className="text-slate-400">Cover Image URL:</span>
                {isEditing ? (
                  <input type="text" placeholder="https://..." value={editData.coverImage || ''} onChange={e => setEditData({...editData, coverImage: e.target.value})} className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-right w-48" />
                ) : <span className="text-slate-200 truncate max-w-[200px]">{group.coverImage || '-'}</span>}
              </div>
              <div className="flex justify-between border-b border-brand-border/50 pb-2 items-center">
                <span className="text-slate-400">Group Code Number:</span>
                <span className="text-slate-200 font-mono font-bold cursor-not-allowed opacity-80">{group.code}</span>
              </div>
              <div className="flex justify-between border-b border-brand-border/50 pb-2 items-center">
                <span className="text-slate-400">Level / Book:</span>
                {isEditing ? (
                  <input type="text" value={editData.level} onChange={e => setEditData({...editData, level: e.target.value})} className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-right w-48" />
                ) : <span className="text-slate-200">{group.level}</span>}
              </div>
              <div className="flex justify-between border-b border-brand-border/50 pb-2 items-center">
                <span className="text-slate-400">Teacher:</span>
                {isEditing ? (
                  <input type="text" value={editData.teacher} onChange={e => setEditData({...editData, teacher: e.target.value})} className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-right w-48" />
                ) : (
                  <button 
                    type="button" 
                    onClick={() => onNavigate && onNavigate('staff', group.teacher)} 
                    className="text-purple-400 hover:underline cursor-pointer"
                  >
                    {group.teacher}
                  </button>
                )}
              </div>
              <div className="flex justify-between border-b border-brand-border/50 pb-2 items-center">
                <span className="text-slate-400">Status:</span>
                {isEditing ? (
                  <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value as any, isWaitingForStudents: e.target.value === 'waiting'})} className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-right w-48 cursor-pointer">
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="waiting">Waiting for Students</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : (
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getStatusColor(group.status || 'upcoming')}`}>
                    {group.status === 'waiting' ? '⏳ Waiting for Students' : group.status}
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between border-b border-brand-border/50 pb-2 items-center">
                <span className="text-slate-400">Schedule:</span>
                {isEditing ? (
                  <input type="text" value={editData.schedule} onChange={e => setEditData({...editData, schedule: e.target.value})} className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-right w-48" />
                ) : <span className="text-slate-200">{group.schedule}</span>}
              </div>
              <div className="flex justify-between border-b border-brand-border/50 pb-2 items-center">
                <span className="text-slate-400">Duration:</span>
                {isEditing ? (
                  <div className="flex space-x-2 items-center">
                    <input type="date" value={editData.startDate || ''} onChange={e => setEditData({...editData, startDate: e.target.value})} className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none w-28 text-xs [color-scheme:dark]" />
                    <span className="text-slate-500">to</span>
                    <input type="date" value={editData.endDate || ''} onChange={e => setEditData({...editData, endDate: e.target.value})} className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none w-28 text-xs [color-scheme:dark]" />
                  </div>
                ) : (
                  <span className="text-slate-200">
                    {group.status === 'waiting' 
                      ? 'Undefined (Waiting for Students enrollment)' 
                      : (group.startDate && group.endDate ? `${group.startDate} to ${group.endDate}` : 'Undefined')}
                  </span>
                )}
              </div>
              <div className="flex justify-between border-b border-brand-border/50 pb-2 items-center">
                <span className="text-slate-400">Enrolled Students:</span>
                <span className="text-slate-200">{groupStudents.length} / 10 Max</span>
              </div>
              <div className="flex justify-between pb-2 items-center">
                <span className="text-slate-400">Virtual Room:</span>
                {isEditing ? (
                  <input type="text" value={editData.meetLink} onChange={e => setEditData({...editData, meetLink: e.target.value})} className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-right w-48" />
                ) : (
                  <button 
                    onClick={() => {
                      startCall(
                        group.meetLink || `vault-room-group-${group.code}`,
                        { id: activeEmployee.id, name: activeEmployee.name, role: activeEmployee.roleTitle, avatarUrl: activeEmployee.avatarUrl },
                        `Group ${group.code}`,
                        'class'
                      );
                    }}
                    className="text-purple-400 hover:text-purple-300 font-medium flex items-center cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 mr-1.5" />
                    Join Virtual Room
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Enrolled Students Directory for this Group */}
          <div className="pt-4 border-t border-brand-border space-y-3">
            <h4 className="text-sm font-bold text-slate-200">Enrolled Students</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {groupStudents.map((st) => (
                <div 
                  key={st.id}
                  onClick={() => onNavigate && onNavigate('student', st.id)}
                  className="p-3 bg-brand-dark rounded-lg border border-brand-border hover:border-purple-500/50 transition cursor-pointer flex justify-between items-center group"
                >
                  <div>
                    <span className="font-semibold text-slate-200 group-hover:text-purple-300 transition text-sm">{st.name}</span>
                    <span className="block text-[11px] text-slate-400">{st.email}</span>
                  </div>
                  <span className="text-xs text-purple-400">Profile →</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: CHAT (WITH INTEGRATED WHITEBOARD TOGGLE) */}
      {groupView === 'chat' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[500px]">
          {/* Left / Chat Pane */}
          <div className={`${isChatWhiteboardOpen ? 'lg:col-span-5' : 'lg:col-span-12'} bg-brand-card rounded-xl border border-brand-border flex flex-col transition-all duration-300`}>
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-dark rounded-t-xl">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 text-purple-400 mr-2" />
                <h3 className="font-bold text-slate-200">Group {group.code} Chat</h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    startCall(
                      group.meetLink || `vault-room-group-${group.code}`,
                      { id: activeEmployee.id, name: activeEmployee.name, role: activeEmployee.roleTitle, avatarUrl: activeEmployee.avatarUrl },
                      `Group ${group.code}`,
                      'class'
                    );
                  }}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg flex items-center space-x-1.5 text-xs font-semibold transition cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Start Call</span>
                </button>
                <button
                  onClick={() => setIsChatWhiteboardOpen(!isChatWhiteboardOpen)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    isChatWhiteboardOpen
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-purple-600/20 text-purple-300 border-purple-500/30 hover:bg-purple-600 hover:text-white'
                  }`}
                >
                  <Presentation className="w-3.5 h-3.5" />
                  <span>{isChatWhiteboardOpen ? 'Hide Whiteboard' : 'Open Group Whiteboard'}</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[500px]">
              {(!group.messages || group.messages.length === 0) ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  No messages yet in Group {group.code}. Start the conversation!
                </div>
              ) : (
                group.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === activeEmployee.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-xl p-3 ${msg.senderId === activeEmployee.id ? 'bg-purple-600 text-white rounded-tr-sm' : 'bg-brand-dark border border-brand-border text-slate-200 rounded-tl-sm'}`}>
                      <div className="flex justify-between items-baseline mb-1 space-x-4">
                        <span className="text-[10px] font-bold opacity-80">{msg.senderName}</span>
                        <span className="text-[9px] opacity-60">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-brand-border bg-brand-dark/50 rounded-b-xl">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type a message to Group..."
                  className="flex-1 bg-brand-card border border-brand-border text-sm rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                />
                <button type="submit" className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition disabled:opacity-50 cursor-pointer" disabled={!chatInput.trim()}>
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          {/* Right / Chat Whiteboard Pane */}
          {isChatWhiteboardOpen && (
            <div className="lg:col-span-7 bg-brand-card rounded-xl border border-brand-border overflow-hidden flex flex-col animate-fadeIn">
              <VirtualWhiteboard
                boardId={`group_chat_${group.id}`}
                title={`Group ${group.code} Chat Board`}
                authorName={activeEmployee.name}
                heightClass="h-full min-h-[500px]"
                showTeacherControls={true}
                onBrush={handleTeacherBrushGroupWhiteboard}
                onSendCurrentBoard={handleTeacherSendGroupWhiteboard}
              />
            </div>
          )}
        </div>
      )}



      {/* PREVIEW WHITEBOARD FILE MODAL */}
      {previewWhiteboardFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-brand-border rounded-2xl w-full max-w-4xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h4 className="text-sm font-bold text-slate-100">{previewWhiteboardFile.title}</h4>
                <p className="text-xs text-slate-400">
                  Recorded on {new Date(previewWhiteboardFile.timestamp).toLocaleString()} by {previewWhiteboardFile.teacherName || previewWhiteboardFile.authorName}
                </p>
              </div>
              <button
                onClick={() => setPreviewWhiteboardFile(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-brand-border">
              <img src={previewWhiteboardFile.imageDataUrl} alt={previewWhiteboardFile.title} className="max-h-[60vh] max-w-full object-contain" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
              <button
                onClick={() => handleDownloadWhiteboardPDF(previewWhiteboardFile)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Download className="w-4 h-4" />
                <span>Download as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
