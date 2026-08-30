import React, { useState } from 'react';
import { Group, Employee, Meeting, ClassSession } from '../types';
import { 
  CalendarDays, 
  Users, 
  Video, 
  Plus, 
  Filter, 
  Clock, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  GripVertical,
  X,
  Search,
  UserCheck,
  Check,
  ChevronDown,
  LayoutGrid,
  Columns,
  GraduationCap,
  Calendar as CalendarIcon,
  Layers,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useLiveCall } from '../context/LiveCallContext';
import { checkGroupScheduleConflict, checkMeetingConflict, ConflictDetail, extractHour } from '../utils/conflictDetector';
import ConflictWarningModal from './ConflictWarningModal';
import { getPersistentGroupTime } from './ClockTimeSelector';

interface DashboardProps {
  onUpdateGroups?: (groups: any[]) => void;
  groups: Group[];
  employees: Employee[];
  activeEmployee: Employee;
  meetings: Meeting[];
  classSessions: ClassSession[];
  onAddMeeting: (meeting: Meeting) => void;
  onUpdateGroup: (group: Group) => void;
  onNavigate: (type: any, id?: string) => void;
}

// 7 distinct days of the week from Sunday to Saturday (no duplicates)
const DAYS_OF_WEEK = [
  { key: 'Sun', nameEn: 'Sunday', namePt: 'Domingo', nameEs: 'Domingo', shortNameEn: 'Sun', shortNamePt: 'Dom', shortNameEs: 'Dom', dateLabel: 'Aug 23', dayIndex: 0 },
  { key: 'Mon', nameEn: 'Monday', namePt: 'Segunda-feira', nameEs: 'Lunes', shortNameEn: 'Mon', shortNamePt: 'Seg', shortNameEs: 'Lun', dateLabel: 'Aug 24', dayIndex: 1 },
  { key: 'Tue', nameEn: 'Tuesday', namePt: 'Terça-feira', nameEs: 'Martes', shortNameEn: 'Tue', shortNamePt: 'Ter', shortNameEs: 'Mar', dateLabel: 'Aug 25', dayIndex: 2 },
  { key: 'Wed', nameEn: 'Wednesday', namePt: 'Quarta-feira', nameEs: 'Miércoles', shortNameEn: 'Wed', shortNamePt: 'Qua', shortNameEs: 'Mié', dateLabel: 'Aug 26', dayIndex: 3 },
  { key: 'Thu', nameEn: 'Thursday', namePt: 'Quinta-feira', nameEs: 'Jueves', shortNameEn: 'Thu', shortNamePt: 'Qui', shortNameEs: 'Jue', dateLabel: 'Aug 27', dayIndex: 4 },
  { key: 'Fri', nameEn: 'Friday', namePt: 'Sexta-feira', nameEs: 'Viernes', shortNameEn: 'Fri', shortNamePt: 'Sex', shortNameEs: 'Vie', dateLabel: 'Aug 28', dayIndex: 5 },
  { key: 'Sat', nameEn: 'Saturday', namePt: 'Sábado', nameEs: 'Sábado', shortNameEn: 'Sat', shortNamePt: 'Sáb', shortNameEs: 'Sáb', dateLabel: 'Aug 29', dayIndex: 6 },
];

// Hourly slots for the vertical axis
const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00'
];

export default function Dashboard({
  groups,
  employees,
  activeEmployee,
  meetings,
  classSessions,
  onAddMeeting,
  onUpdateGroup,
  onNavigate,
  onUpdateGroups
}: DashboardProps) {
  const { language, t } = useLanguage();
  const { startCall } = useLiveCall();

  // View mode: 'separate' (separate teacher schedules) | 'matrix' (master 7-day hourly grid)
  const [scheduleViewMode, setScheduleViewMode] = useState<'separate' | 'matrix'>('separate');

  // Teacher Filter: 'all' or specific teacher employee name/id
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('all');
  
  // Drag and drop state
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);

  const isAdmin = activeEmployee.isAssociate || activeEmployee.permissions.includes('edit:groups');
  const [pendingChanges, setPendingChanges] = useState<{ [groupId: string]: Group }>({});
  const [isSaving, setIsSaving] = useState(false);

  const canViewAll = activeEmployee.isMaster || activeEmployee.isAssociate || activeEmployee.isCoordinator || activeEmployee.permissions.includes('dashboard:all');
  const displayGroups = groups.filter(g => canViewAll || g.teacher === activeEmployee.name).map(g => pendingChanges[g.id] || g);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const sidebarGroups = displayGroups.filter(g => (!unassignedOnly || !g.teacher || g.teacher === '') && (g.name?.toLowerCase().includes(groupSearchQuery.toLowerCase()) || g.code.toLowerCase().includes(groupSearchQuery.toLowerCase())));

  const [dropTarget, setDropTarget] = useState<{ dayKey: string; hour: string; teacherName?: string } | null>(null);

  // Group search in pool (moved up)
  
  // Quick Meeting Modal
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('2026-08-25');
  const [meetingTime, setMeetingTime] = useState('14:00');
  const [meetingTeacherId, setMeetingTeacherId] = useState<string>(employees[0]?.id || '1');
  const [meetingLink, setMeetingLink] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Quick Slot Assignment Modal
  const [slotAssignModal, setSlotAssignModal] = useState<{ day: string; hour: string; teacherName?: string } | null>(null);
  const [selectedGroupToAssign, setSelectedGroupToAssign] = useState<string>(groups[0]?.id || '');
  const [selectedTeacherToAssign, setSelectedTeacherToAssign] = useState<string>(employees[0]?.name || 'Gabriel');

  // Manual reassign state for groups in pool
  const [assigningGroup, setAssigningGroup] = useState<Group | null>(null);
  const [targetTeacher, setTargetTeacher] = useState<string>(employees[0]?.name || 'Gabriel');
  const [targetSchedule, setTargetSchedule] = useState<string>('Mon/Wed 19:00 BRT');

  // Conflict Warning Modal State
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [activeConflicts, setActiveConflicts] = useState<ConflictDetail[]>([]);
  const [conflictTargetDetails, setConflictTargetDetails] = useState<{ actionName: string; dayOrDate: string; time: string } | undefined>(undefined);

  // Teachers list
  const teachersList = employees.filter(e => 
    e.roleTitle.toLowerCase().includes('teacher') || 
    e.roleTitle.toLowerCase().includes('coordinator') || 
    e.roleTitle.toLowerCase().includes('pedagogical') ||
    e.roleTitle.toLowerCase().includes('instructor') ||
    e.permissions.includes('teacher')
  );
  const activeTeachers = teachersList.length > 0 ? teachersList : employees;

  // Filtered teachers list based on selection
  const displayedTeachers = selectedTeacherFilter === 'all' 
    ? activeTeachers 
    : activeTeachers.filter(t => t.name.toLowerCase() === selectedTeacherFilter.toLowerCase() || t.id === selectedTeacherFilter);

  // Selected teacher object if not 'all'
  const activeTeacherObj = selectedTeacherFilter !== 'all' 
    ? activeTeachers.find(t => t.name.toLowerCase() === selectedTeacherFilter.toLowerCase() || t.id === selectedTeacherFilter) 
    : null;

  // Week Navigation State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    // 2026-08-23 is a Sunday
    return new Date(2026, 7, 23); // August 23, 2026
  });

  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  };

  const handleTodayWeek = () => {
    // 2026-08-23 is Sunday for the week of Aug 23 - 29.
    setCurrentWeekStart(new Date(2026, 7, 23)); 
  };

  // Generate dynamic DAYS_OF_WEEK based on currentWeekStart
  const dynamicDaysOfWeek = DAYS_OF_WEEK.map((d, index) => {
    const dateObj = new Date(currentWeekStart);
    dateObj.setDate(currentWeekStart.getDate() + index);
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const day = dateObj.getDate();
    return {
      ...d,
      dateLabel: `${month} ${day}`
    };
  });

  const getDayName = (d: typeof DAYS_OF_WEEK[0]) => {
    if (language === 'pt-BR') return d.namePt;
    if (language === 'es-LA') return d.nameEs;
    return d.nameEn;
  };

  const getDayShortName = (d: typeof DAYS_OF_WEEK[0]) => {
    if (language === 'pt-BR') return d.shortNamePt;
    if (language === 'es-LA') return d.shortNameEs;
    return d.shortNameEn;
  };

  // Helper to check if a group matches a day
  const groupMatchesDay = (group: Group, dayKey: string): boolean => {
    const sched = (group.schedule || '').toLowerCase();
    if (dayKey === 'Sun') return sched.includes('sun') || sched.includes('dom');
    if (dayKey === 'Mon') return sched.includes('mon') || sched.includes('seg') || sched.includes('lun');
    if (dayKey === 'Tue') return sched.includes('tue') || sched.includes('ter') || sched.includes('mar');
    if (dayKey === 'Wed') return sched.includes('wed') || sched.includes('qua') || sched.includes('mié');
    if (dayKey === 'Thu') return sched.includes('thu') || sched.includes('qui') || sched.includes('jue');
    if (dayKey === 'Fri') return sched.includes('fri') || sched.includes('sex') || sched.includes('vie');
    if (dayKey === 'Sat') return sched.includes('sat') || sched.includes('sab') || sched.includes('sáb');
    return false;
  };

  // Get items for Matrix slot
  const getItemsForSlot = (dayKey: string, hourSlot: string) => {
    const slotGroups = displayGroups.filter(g => {
      if (selectedTeacherFilter !== 'all') {
        const matchesTeacher = g.teacher.toLowerCase() === selectedTeacherFilter.toLowerCase() ||
          activeTeachers.find(t => t.id === selectedTeacherFilter)?.name.toLowerCase() === g.teacher.toLowerCase();
        if (!matchesTeacher) return false;
      }
      if (!groupMatchesDay(g, dayKey)) return false;
      const groupHour = extractHour(g.schedule);
      return groupHour === hourSlot;
    });

    const slotMeetings = meetings.filter(m => {
      if (selectedTeacherFilter !== 'all' && activeTeacherObj) {
        const isAttendee = m.attendees.includes(activeTeacherObj.id) || m.organizerId === activeTeacherObj.id;
        if (!isAttendee) return false;
      }
      const mHour = m.time ? `${m.time.split(':')[0]}:00` : '14:00';
      if (mHour !== hourSlot) return false;

      const d = new Date(m.date + 'T00:00:00');
      const dayIdx = d.getDay();
      const targetDay = DAYS_OF_WEEK.find(day => day.key === dayKey);
      return targetDay && targetDay.dayIndex === dayIdx;
    });

    return { groups: slotGroups, meetings: slotMeetings };
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, group: Group) => {
    e.dataTransfer.setData('text/plain', group.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedGroupId(group.id);
  };

  const handleDragOver = (e: React.DragEvent, dayKey: string, hour: string, teacherName?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ dayKey, hour, teacherName });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  // Safe commit with Conflict Detection Check
  const handleDrop = (e: React.DragEvent, dayKey: string, hour: string, specificTeacher?: string) => {
    e.preventDefault();
    setDropTarget(null);
    const groupId = e.dataTransfer.getData('text/plain') || draggedGroupId;
    if (!groupId) return;

    const group = displayGroups.find(g => g.id === groupId);
    if (!group) return;

    const assignedTeacher = specificTeacher || (selectedTeacherFilter !== 'all' && activeTeacherObj 
      ? activeTeacherObj.name 
      : group.teacher || activeTeachers[0]?.name || 'Gabriel');

    const dayObj = DAYS_OF_WEEK.find(d => d.key === dayKey) || DAYS_OF_WEEK[1];
    
    const newSched = `${dayObj.shortNameEn} ${hour} BRT`;

    const executeAssignment = () => {
      const updatedGroup: Group = {
        ...group,
        teacher: assignedTeacher,
        schedule: newSched,
      };

      setPendingChanges(prev => ({ ...prev, [updatedGroup.id]: updatedGroup }));
      setDraggedGroupId(null);
      showToast(`Group Code ${group.code} scheduled for ${getDayName(dayObj)} at ${hour} (${assignedTeacher})!`);
      setActiveConflicts([]);
      setPendingAction(null);
    };

    // Check for scheduling conflicts!
    const conflictResult = checkGroupScheduleConflict(
      group.id,
      assignedTeacher,
      dayKey,
      hour,
      groups,
      meetings,
      employees
    );

    if (conflictResult.hasConflict) {
      setActiveConflicts(conflictResult.conflicts);
      setConflictTargetDetails({
        actionName: `Assign Group Code ${group.code} to ${assignedTeacher}`,
        dayOrDate: getDayName(dayObj),
        time: `${hour} BRT`
      });
      setPendingAction(() => executeAssignment);
    } else {
      executeAssignment();
    }
  };

  // Slot modal submit with Conflict Check
  const handleSlotModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotAssignModal) return;

    const group = groups.find(g => g.id === selectedGroupToAssign);
    if (!group) return;

    const dayObj = DAYS_OF_WEEK.find(d => d.key === slotAssignModal.day) || DAYS_OF_WEEK[1];
    const newSched = `${dayObj.shortNameEn} ${slotAssignModal.hour} BRT`;
    const targetTeacher = selectedTeacherToAssign;

    const executeSlotAssignment = () => {
      const updated: Group = {
        ...group,
        teacher: targetTeacher,
        schedule: newSched,
      };

      onUpdateGroup(updated);
      setSlotAssignModal(null);
      showToast(`Group Code ${group.code} scheduled for ${getDayName(dayObj)} at ${slotAssignModal.hour} (${targetTeacher})!`);
      setActiveConflicts([]);
      setPendingAction(null);
    };

    // Check for conflicts
    const conflictResult = checkGroupScheduleConflict(
      group.id,
      targetTeacher,
      slotAssignModal.day,
      slotAssignModal.hour,
      groups,
      meetings,
      employees
    );

    if (conflictResult.hasConflict) {
      setActiveConflicts(conflictResult.conflicts);
      setConflictTargetDetails({
        actionName: `Assign Group Code ${group.code} to ${targetTeacher}`,
        dayOrDate: getDayName(dayObj),
        time: `${slotAssignModal.hour} BRT`
      });
      setPendingAction(() => executeSlotAssignment);
    } else {
      executeSlotAssignment();
    }
  };

  // Meeting creation submit with Conflict Check
  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;

    const targetEmp = employees.find(emp => emp.id === meetingTeacherId);
    const attendees = Array.from(new Set([activeEmployee.id, meetingTeacherId]));

    const executeCreateMeeting = () => {
      const newM: Meeting = {
        id: `m-${Date.now()}`,
        title: meetingTitle.trim(),
        date: meetingDate,
        time: meetingTime,
        organizerId: activeEmployee.id,
        organizerName: activeEmployee.name,
        attendees,
        link: meetingLink.trim() || `vault-room-${Date.now()}`
      };

      onAddMeeting(newM);
      setIsMeetingModalOpen(false);
      setMeetingTitle('');
      showToast(`Meeting "${newM.title}" scheduled with ${targetEmp?.name || 'Teacher'}!`);
      setActiveConflicts([]);
      setPendingAction(null);
    };

    // Check conflict for attendees
    const conflictResult = checkMeetingConflict(
      meetingDate,
      meetingTime,
      attendees,
      groups,
      meetings,
      employees
    );

    if (conflictResult.hasConflict) {
      setActiveConflicts(conflictResult.conflicts);
      setConflictTargetDetails({
        actionName: `Schedule Meeting "${meetingTitle}" with ${targetEmp?.name}`,
        dayOrDate: meetingDate,
        time: meetingTime
      });
      setPendingAction(() => executeCreateMeeting);
    } else {
      executeCreateMeeting();
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Filtered pool of groups for drag & drop sidebar
  const filteredGroupsPool = displayGroups.filter(g => {
    if (!groupSearchQuery) return true;
    const q = groupSearchQuery.toLowerCase();
    return g.code.toLowerCase().includes(q) || 
           g.level.toLowerCase().includes(q) || 
           g.teacher.toLowerCase().includes(q) ||
           (g.schedule && g.schedule.toLowerCase().includes(q));
  });

  
  const defaultGroupTime = getPersistentGroupTime();
  


  return (
    <section className="space-y-6">
      {/* Toast notification */}
      
      {/* Pending Changes Save Bar */}
      {Object.keys(pendingChanges).length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brand-dark/95 backdrop-blur-xl border border-brand-border p-4 rounded-2xl shadow-2xl flex items-center space-x-6 animate-slideUp">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-100">Unsaved Schedule Changes</span>
            <span className="text-xs text-slate-400">{Object.keys(pendingChanges).length} group(s) modified</span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setPendingChanges({})}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              Discard
            </button>
            <button 
              onClick={() => {
                // In a real app, this would persist to the backend and trigger Google Calendar API.
                // For now, we commit to global state.
                const updatedGroupsList = Object.values(pendingChanges);
                if (onUpdateGroups) { onUpdateGroups(updatedGroupsList); }
                setPendingChanges({});
                
                // Simulate notification to teachers & Google Calendar
                setSuccessToast("Changes saved! Teachers notified & Google Calendars updated.");
                setTimeout(() => setSuccessToast(null), 4000);
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-500/20"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 border border-emerald-400 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Conflict Warning Modal */}
      <ConflictWarningModal
        isOpen={activeConflicts.length > 0}
        conflicts={activeConflicts}
        targetDetails={conflictTargetDetails}
        onCancel={() => {
          setActiveConflicts([]);
          setPendingAction(null);
        }}
        onProceedAnyway={() => {
          if (pendingAction) {
            pendingAction();
          }
        }}
      />

      {/* Top Header & Pedagogical Planner Banner */}
      <div className="bg-brand-card p-6 rounded-2xl border border-brand-border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
              Pedagogical Coordinator Timetable
            </span>
            <div className="flex items-center space-x-1 bg-brand-dark rounded-md border border-brand-border px-1">
              <button onClick={handlePrevWeek} className="p-1 hover:text-purple-400 text-slate-400 cursor-pointer transition">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={handleTodayWeek} className="text-[10px] font-bold font-mono text-purple-300 hover:text-purple-200 cursor-pointer transition px-1">
                {dynamicDaysOfWeek[0].dateLabel} - {dynamicDaysOfWeek[6].dateLabel}
              </button>
              <button onClick={handleNextWeek} className="p-1 hover:text-purple-400 text-slate-400 cursor-pointer transition">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1.5 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2 text-purple-400" />
            {t('pedagogicalPlanner', 'Teacher Schedules & Pedagogical Timetable')}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            {t('dragDropInstructions', 'View separate, dedicated weekly schedules for each teacher side-by-side or toggle to the master 7-day hourly matrix. Effortlessly drag & drop groups, balance teaching loads, and organize syncs.')}
          </p>
        </div>

        {/* View Mode Switcher and Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Schedule View Mode Switcher */}
          <div className="flex items-center bg-brand-dark p-1 rounded-xl border border-brand-border shadow-inner">
            <button
              onClick={() => setScheduleViewMode('separate')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                scheduleViewMode === 'separate'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="View separate schedule cards for each teacher (with drag & drop)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>{t('separateSchedules', 'Separate Teacher Schedules')}</span>
            </button>
            <button
              onClick={() => setScheduleViewMode('matrix')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                scheduleViewMode === 'matrix'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="View combined 7-day hourly timetable matrix"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t('masterGrid', '7-Day Master Grid')}</span>
            </button>
          </div>

          <button
            onClick={() => setIsMeetingModalOpen(true)}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition flex items-center cursor-pointer shadow-sm"
          >
            <Video className="w-3.5 h-3.5 mr-1.5" />
            {t('addMeeting', 'Add Meeting')}
          </button>
        </div>
      </div>

      {/* Control Bar: Teacher Filter & Quick Selector */}
      <div className="bg-brand-card p-4 rounded-2xl border border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Teacher Selection Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-brand-dark px-3 py-1.5 rounded-xl border border-brand-border">
            <Filter className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium shrink-0">{t('filterTeachers', 'Filter Teachers:')}</span>
            <select
              value={selectedTeacherFilter}
              onChange={e => setSelectedTeacherFilter(e.target.value)}
              className="bg-transparent text-xs text-purple-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-brand-dark text-slate-200">
                {t('allTeachers', 'All Teachers')} ({activeTeachers.length} Instructors)
              </option>
              {activeTeachers.map(t => (
                <option key={t.id} value={t.name} className="bg-brand-dark text-slate-200">
                  {t.name} ({t.roleTitle})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Teacher Toggle Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedTeacherFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                selectedTeacherFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-brand-dark text-slate-400 hover:text-slate-200 border border-brand-border'
              }`}
            >
              {t('all', 'All')}
            </button>
            {activeTeachers.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTeacherFilter(t.name)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  selectedTeacherFilter.toLowerCase() === t.name.toLowerCase()
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-brand-dark text-slate-400 hover:text-slate-200 border border-brand-border'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Drag and Drop notice */}
        <div className="flex items-center space-x-2 text-xs text-purple-300 bg-purple-950/40 px-3 py-1.5 rounded-xl border border-purple-500/30">
          <GripVertical className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
          <span>Drag & drop groups directly between teacher cards and hourly slots.</span>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 space-y-6 min-w-0">
      {/* ========================================================================= */}
      {/* MODE 1: SEPARATE TEACHER SCHEDULES (Fully Drag-and-Drop enabled!)        */}
      {/* ========================================================================= */}
      {scheduleViewMode === 'separate' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
            {displayedTeachers.map(teacher => {
              // Find groups taught by this teacher
              const teacherGroups = displayGroups.filter(g => 
                g.teacher.toLowerCase() === teacher.name.toLowerCase() ||
                g.teacher.toLowerCase() === teacher.username.toLowerCase()
              );

              // Find meetings involving this teacher
              const teacherMeetings = meetings.filter(m => 
                m.attendees.includes(teacher.id) || m.organizerId === teacher.id
              );

              // Total students under this teacher
              const totalStudents = teacherGroups.reduce((acc, g) => acc + (g.studentsCount || 0), 0);

              // Weekly teaching hours estimate
              const estimatedHours = teacherGroups.length * 2;

              return (
                <div 
                  key={teacher.id} 
                  className="bg-brand-card rounded-2xl border border-brand-border hover:border-purple-500/40 transition flex flex-col shadow-sm overflow-hidden"
                >
                  {/* Teacher Header Bar */}
                  <div className="p-5 bg-gradient-to-r from-brand-dark to-brand-card border-b border-brand-border flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      {teacher.avatarUrl ? (
                        <img 
                          src={teacher.avatarUrl} 
                          alt={teacher.name} 
                          className="w-11 h-11 rounded-xl object-cover border border-purple-500/40 shadow-sm" 
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center text-sm font-bold border border-purple-500/30">
                          {teacher.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-bold text-slate-100">{teacher.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                            {teacher.roleTitle}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">@{teacher.username}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSlotAssignModal({ day: 'Mon', hour: defaultGroupTime, teacherName: teacher.name });
                        setSelectedTeacherToAssign(teacher.name);
                      }}
                      className="px-2.5 py-1.5 bg-brand-dark hover:bg-purple-900/30 text-purple-300 border border-purple-500/30 text-[11px] font-semibold rounded-lg transition flex items-center cursor-pointer"
                      title={`Assign a new group to ${teacher.name}`}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {t('addClass', 'Add Class')}
                    </button>
                  </div>

                  {/* Teacher Metric Summary */}
                  <div className="grid grid-cols-3 divide-x divide-brand-border bg-brand-dark/40 py-2.5 border-b border-brand-border text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('groups', 'Groups')}</span>
                      <p className="text-sm font-bold text-slate-200">{teacherGroups.length} Classes</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('students', 'Students')}</span>
                      <p className="text-sm font-bold text-purple-300">{totalStudents} Total</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('teachingLoad', 'Weekly Load')}</span>
                      <p className="text-sm font-bold text-emerald-400">~{estimatedHours} hrs/wk</p>
                    </div>
                  </div>

                  {/* Weekly Schedule Days Breakdown - Drag and Drop Active Zones */}
                  <div className="p-4 space-y-3 flex-1">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                      <span className="flex items-center">
                        <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                        {t('weeklyTimetable', 'Weekly Teaching Timetable')}
                      </span>
                      <span className="text-[10px] font-normal text-purple-300/80">Drop groups to schedule</span>
                    </h4>

                    <div className="space-y-2.5">
                      {dynamicDaysOfWeek.map(day => {
                        // Find groups for this teacher on this day
                        const dayGroups = teacherGroups.filter(g => groupMatchesDay(g, day.key));
                        
                        // Find meetings for this teacher on this day
                        const dayMeetings = teacherMeetings.filter(m => {
                          const d = new Date(m.date + 'T00:00:00');
                          return d.getDay() === day.dayIndex;
                        });

                        const hasActivities = dayGroups.length > 0 || dayMeetings.length > 0;
                        const isDropActive = dropTarget?.dayKey === day.key && dropTarget?.teacherName === teacher.name;

                        return (
                          <div 
                            key={day.key} 
                            onDragOver={(e) => handleDragOver(e, day.key, defaultGroupTime, teacher.name)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, day.key, defaultGroupTime, teacher.name)}
                            className={`p-3 rounded-xl border transition-all ${
                              isDropActive
                                ? 'bg-purple-900/40 border-purple-400 ring-2 ring-purple-400 ring-inset shadow-lg'
                                : hasActivities 
                                  ? 'bg-brand-dark/80 border-purple-500/30' 
                                  : 'bg-brand-dark/30 border-brand-border/60 hover:border-purple-500/40'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs font-bold ${hasActivities ? 'text-purple-300' : 'text-slate-400'}`}>
                                  {getDayName(day)}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">({day.dateLabel})</span>
                              </div>
                              {hasActivities ? (
                                <span className="text-[10px] px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded font-semibold">
                                  {dayGroups.length + dayMeetings.length} Session{dayGroups.length + dayMeetings.length > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono">{t('freeSlot', 'Free / Open')}</span>
                              )}
                            </div>

                            {/* Activities on this day */}
                            {hasActivities ? (
                              <div className="space-y-2 mt-2">
                                {/* Groups - Fully Draggable */}
                                {dayGroups.map(grp => (
                                  <div 
                                    key={grp.id}
                                    draggable={isAdmin} onDragStart={(e) => isAdmin && handleDragStart(e, grp)}
                                    className="p-2.5 bg-brand-card rounded-lg border border-brand-border hover:border-purple-500 transition flex flex-col space-y-1.5 shadow-sm cursor-grab active:cursor-grabbing group/item"
                                    title="Drag this group to reassign to another day/teacher, or click to view details"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-1.5">
                                        <GripVertical className="w-3 h-3 text-slate-500 group-hover/item:text-purple-400" />
                                        <span 
                                          onClick={() => onNavigate('group', grp.code)}
                                          className="text-xs font-bold text-blue-300 font-mono hover:underline cursor-pointer flex items-center"
                                        >
                                          <BookOpen className="w-3 h-3 mr-1 text-blue-400" />
                                          Code {grp.code}
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-semibold">
                                        <Clock className="w-2.5 h-2.5 inline mr-1" />
                                        {grp.schedule.split(' ')[1] || '19:00'} BRT
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                                      <span className="truncate max-w-[200px]">{grp.level}</span>
                                      <span className="text-purple-300 flex items-center shrink-0">
                                        <Users className="w-3 h-3 mr-0.5" />
                                        {grp.studentsCount} Students
                                      </span>
                                    </div>

                                    {/* Action Links */}
                                    <div className="pt-1.5 border-t border-brand-border/60 flex items-center justify-between text-[11px]">
                                      <button
                                        onClick={() => {
                                          startCall(
                                            grp.meetLink || `vault-room-group-${grp.code}`,
                                            { id: activeEmployee.id, name: activeEmployee.name, role: activeEmployee.roleTitle, avatarUrl: activeEmployee.avatarUrl },
                                            `Group ${grp.code}`,
                                            'class'
                                          );
                                        }}
                                        className="text-purple-400 hover:text-purple-300 flex items-center font-semibold cursor-pointer"
                                      >
                                        <Video className="w-3 h-3 mr-1" />
                                        Start Meet
                                      </button>
                                      <button
                                        onClick={() => onNavigate('group', grp.code)}
                                        className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                                      >
                                        Manage Group →
                                      </button>
                                    </div>
                                  </div>
                                ))}

                                {/* Meetings */}
                                {dayMeetings.map(mtg => (
                                  <div 
                                    key={mtg.id}
                                    className="p-2 bg-purple-950/40 rounded-lg border border-purple-500/50 text-[11px] space-y-1"
                                  >
                                    <div className="flex items-center justify-between text-purple-200 font-bold">
                                      <span className="flex items-center truncate">
                                        <Video className="w-3 h-3 mr-1 text-purple-400" />
                                        {mtg.title}
                                      </span>
                                      <span className="text-[10px] font-mono text-purple-300">{mtg.time}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                      <span>Host: {mtg.organizerName}</span>
                                      {mtg.link && (
                                        <a href={mtg.link} target="_blank" rel="noreferrer" className="text-purple-300 hover:underline">
                                          Join Call
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSlotAssignModal({ day: day.key, hour: defaultGroupTime, teacherName: teacher.name });
                                  setSelectedTeacherToAssign(teacher.name);
                                }}
                                className="w-full text-left text-[10px] text-slate-500 hover:text-purple-300 transition py-1 cursor-pointer flex items-center space-x-1"
                              >
                                <span>+ Click to schedule class on {getDayShortName(day)} ({defaultGroupTime})</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-3 bg-brand-dark border-t border-brand-border flex items-center justify-between">
                    <button
                      onClick={() => {
                        setMeetingTeacherId(teacher.id);
                        setIsMeetingModalOpen(true);
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5 mr-1" />
                      {t('scheduleSync', 'Schedule 1-on-1 Sync')}
                    </button>
                    <button
                      onClick={() => onNavigate('staff')}
                      className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Teacher Profile →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: COMBINED 7-DAY HOURLY TIMETABLE MATRIX & STUDY GROUPS POOL       */
        /* ========================================================================= */
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* HORIZONTAL DAYS X VERTICAL HOURS TIMETABLE (3 Columns on xl) */}
          <div className="xl:col-span-3 bg-brand-card rounded-2xl border border-brand-border overflow-hidden shadow-sm flex flex-col">
            
            {/* Table Header Bar */}
            <div className="p-4 bg-brand-dark/80 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <h3 className="text-sm font-bold text-slate-100">
                  {selectedTeacherFilter === 'all' 
                    ? 'Master Schedule — All Instructors' 
                    : `Weekly Hourly Timetable: ${activeTeacherObj?.name || selectedTeacherFilter}`}
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Week of Aug 23 – Aug 29, 2026
              </span>
            </div>

            {/* Timetable Grid Container */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[760px]">
                {/* Header Row: 7 Distinct Days (Sunday to Saturday) */}
                <thead>
                  <tr className="bg-brand-dark/90 border-b border-brand-border">
                    <th className="p-3 text-[11px] font-bold text-slate-400 uppercase w-20 border-r border-brand-border text-center">
                      <Clock className="w-3.5 h-3.5 mx-auto text-purple-400" />
                      <span>{t('time', 'Time')}</span>
                    </th>
                    {dynamicDaysOfWeek.map(day => (
                      <th 
                        key={day.key} 
                        className="p-3 text-center border-r border-brand-border last:border-r-0"
                      >
                        <div className="text-xs font-bold text-slate-200">{getDayName(day)}</div>
                        <div className="text-[10px] text-purple-400/80 font-mono mt-0.5">{day.dateLabel}</div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body: Vertical Hours with 7 Day Columns */}
                <tbody className="divide-y divide-brand-border">
                  {TIME_SLOTS.map(hour => (
                    <tr key={hour} className="hover:bg-brand-dark/20 transition group">
                      
                      {/* Hour Label Cell */}
                      <td className="p-3 text-[11px] font-bold font-mono text-slate-400 text-center border-r border-brand-border bg-brand-dark/50 select-none">
                        {hour}
                      </td>

                      {/* 7 Days Columns */}
                      {dynamicDaysOfWeek.map(day => {
                        const { groups: slotGroups, meetings: slotMeetings } = getItemsForSlot(day.key, hour);
                        const isDropActive = dropTarget?.dayKey === day.key && dropTarget?.hour === hour;
                        const hasContent = slotGroups.length > 0 || slotMeetings.length > 0;

                        return (
                          <td
                            key={day.key}
                            onDragOver={(e) => handleDragOver(e, day.key, hour)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, day.key, hour)}
                            className={`p-2 border-r border-brand-border last:border-r-0 align-top transition min-w-[110px] ${
                              isDropActive 
                                ? 'bg-purple-900/50 ring-2 ring-purple-400 ring-inset' 
                                : hasContent 
                                  ? 'bg-brand-dark/30' 
                                  : 'hover:bg-purple-950/10'
                            }`}
                          >
                            <div className="space-y-1.5 min-h-[48px] flex flex-col justify-start">
                              
                              {/* Render Groups in this slot */}
                              {slotGroups.map(group => (
                                <div
                                  key={group.id}
                                  draggable={isAdmin} onDragStart={(e) => isAdmin && handleDragStart(e, group)}
                                  onClick={() => onNavigate('group', group.code)}
                                  className="p-2 bg-brand-dark rounded-lg border border-blue-500/50 hover:border-blue-400 transition cursor-grab active:cursor-grabbing shadow-sm space-y-1 group/card"
                                  title={`Click to view profile or drag to reassign. Teacher: ${group.teacher}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-300 font-mono flex items-center">
                                      <BookOpen className="w-3 h-3 mr-1 text-blue-400 shrink-0" />
                                      Code {group.code}
                                    </span>
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                                      {group.teacher}
                                    </span>
                                  </div>

                                  <p className="text-[10px] text-slate-300 truncate font-medium">
                                    {group.level}
                                  </p>

                                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5 border-t border-brand-border/60">
                                    <span className="flex items-center text-purple-300">
                                      <Users className="w-2.5 h-2.5 mr-0.5" />
                                      {group.studentsCount}
                                    </span>
                                    <span className="text-[8px] text-blue-400 group-hover/card:underline">
                                      Profile →
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {/* Render Meetings in this slot */}
                              {slotMeetings.map(meeting => (
                                <div
                                  key={meeting.id}
                                  className="p-2 bg-purple-950/40 rounded-lg border border-purple-500/60 shadow-sm space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-purple-200 flex items-center truncate">
                                      <Video className="w-3 h-3 mr-1 text-purple-400 shrink-0" />
                                      {meeting.title}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-400 flex items-center justify-between">
                                    <span>{meeting.organizerName}</span>
                                    {meeting.link && (
                                      <a
                                        href={meeting.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-purple-300 hover:underline text-[9px]"
                                      >
                                        Join
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {/* Empty slot placeholder click helper */}
                              {!hasContent && (
                                <button
                                  onClick={() => setSlotAssignModal({ day: day.key, hour })}
                                  className="w-full h-full opacity-0 group-hover:opacity-100 text-[9px] text-slate-500 hover:text-purple-300 flex items-center justify-center transition py-2 cursor-pointer"
                                  title="Click to assign a group to this slot"
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* STUDY GROUPS POOL & QUICK ASSIGNMENT SIDEBAR (1 Column on xl) */}
          <div className="space-y-4">
            <div className="bg-brand-card p-5 rounded-2xl border border-brand-border shadow-sm flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center">
                    <BookOpen className="w-4 h-4 mr-1.5 text-purple-400" />
                    {t('studyGroupsPool', 'Study Groups Pool')}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Drag to hourly grid or click to open.</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 font-bold">
                  {groups.length} Groups
                </span>
              </div>

              {/* Search filter in pool */}
              <div className="my-3 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Code or Book..."
                  value={groupSearchQuery}
                  onChange={e => setGroupSearchQuery(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Groups list */}
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1 no-scrollbar">
                {filteredGroupsPool.map(group => (
                  <div
                    key={group.id}
                    draggable={isAdmin} onDragStart={(e) => isAdmin && handleDragStart(e, group)}
                    className="p-3.5 bg-brand-dark rounded-xl border border-brand-border hover:border-purple-500/60 transition cursor-grab active:cursor-grabbing shadow-sm space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        onClick={() => onNavigate('group', group.code)}
                        className="text-xs font-bold text-blue-300 font-mono hover:underline cursor-pointer flex items-center"
                      >
                        <BookOpen className="w-3 h-3 mr-1 text-blue-400" />
                        Code {group.code}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        group.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {group.status || 'active'}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-200 font-semibold">{group.level}</p>
                      <p className="text-[11px] text-purple-300 flex items-center mt-0.5">
                        <Users className="w-3 h-3 mr-1 text-purple-400" />
                        {group.studentsCount} Enrolled Students
                      </p>
                    </div>

                    <div className="p-2 bg-brand-card rounded-lg border border-brand-border/60 text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Teacher:</span>
                        <span className="text-slate-200 font-medium">{group.teacher}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Schedule:</span>
                        <span className="text-amber-300 font-mono">{group.schedule}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-[10px] text-slate-500 flex items-center">
                        <GripVertical className="w-3 h-3 mr-0.5 text-purple-400" />
                        Drag to Grid
                      </span>
                      <button
                        onClick={() => onNavigate('group', group.code)}
                        className="text-purple-400 hover:text-purple-300 hover:underline font-semibold cursor-pointer"
                      >
                        Manage →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* QUICK MEETING MODAL */}
      {isMeetingModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsMeetingModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 bg-brand-dark/80 border-b border-brand-border flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center">
                <Video className="w-4 h-4 mr-2 text-purple-400" />
                {t('addMeeting', 'Schedule Pedagogical Meeting')}
              </h3>
              <button 
                onClick={() => setIsMeetingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Meeting Title</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  placeholder="e.g. 1-on-1 Pedagogical Review"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Teacher / Staff Member</label>
                <select
                  value={meetingTeacherId}
                  onChange={e => setMeetingTeacherId(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.roleTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t('date', 'Date')}</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={e => setMeetingDate(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t('time', 'Time')}</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={e => setMeetingTime(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-brand-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2 bg-brand-dark text-slate-400 hover:text-white rounded-lg transition"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition cursor-pointer"
                >
                  {t('save', 'Schedule Meeting')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK SLOT ASSIGN MODAL */}
      {slotAssignModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setSlotAssignModal(null)}
        >
          <div 
            className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 bg-brand-dark/80 border-b border-brand-border flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-purple-400" />
                Assign Class to Slot: {slotAssignModal.day} {slotAssignModal.hour}
              </h3>
              <button 
                onClick={() => setSlotAssignModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSlotModalSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Study Group</label>
                <select
                  value={selectedGroupToAssign}
                  onChange={e => setSelectedGroupToAssign(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                >
                  {groups.map(grp => (
                    <option key={grp.id} value={grp.id}>
                      Code {grp.code} - {grp.level} ({grp.teacher})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Teacher</label>
                <select
                  value={selectedTeacherToAssign}
                  onChange={e => setSelectedTeacherToAssign(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {activeTeachers.map(t => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.roleTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-brand-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSlotAssignModal(null)}
                  className="px-4 py-2 bg-brand-dark text-slate-400 hover:text-white rounded-lg transition"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
        
        {/* Right Sidebar: Study Groups Pool */}
        <div className="w-full xl:w-96 shrink-0 bg-brand-card p-5 rounded-2xl border border-brand-border shadow-sm flex flex-col max-h-[800px]">
          <div className="pb-3 border-b border-brand-border space-y-3 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-purple-400" />
                Study Groups Pool
              </h3>
              <p className="text-xs text-slate-400 mt-1">Drag a group into any schedule slot</p>
            </div>
            
            {/* Filter */}
            <label className="flex items-center space-x-2 cursor-pointer bg-brand-dark p-2 rounded-lg border border-brand-border hover:border-purple-500/30 transition">
              <input 
                type="checkbox" 
                checked={unassignedOnly} 
                onChange={e => setUnassignedOnly(e.target.checked)}
                className="rounded border-slate-600 text-purple-500 focus:ring-purple-500 bg-brand-dark"
              />
              <span className="text-xs text-slate-300 font-medium">Show unassigned only</span>
            </label>
          </div>
          
          <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-3 no-scrollbar">
            {sidebarGroups.map(group => (
              <div
                key={group.id}
                draggable={isAdmin}
                onDragStart={(e) => isAdmin && handleDragStart(e, group)}
                className={`p-3 bg-brand-dark rounded-xl border border-brand-border hover:border-purple-500/80 transition shadow-sm space-y-2 group ${isAdmin ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    {isAdmin && <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />}
                    <span 
                      onClick={() => onNavigate('group', group.code)}
                      className={`text-xs font-bold text-blue-300 font-mono ${isAdmin ? 'hover:underline cursor-pointer' : ''}`}
                    >
                      Code {group.code}
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-card border border-brand-border text-slate-400 font-mono">
                    {group.schedule || 'Unscheduled'}
                  </span>
                </div>
                {group.name && <div className="text-sm font-bold text-slate-200">{group.name}</div>}
                
                <div className="flex items-center justify-between text-xs pt-1 border-t border-brand-border/50">
                  <span className="text-slate-400 flex items-center">
                    <UserCheck className="w-3 h-3 mr-1" />
                    {group.teacher ? group.teacher : <span className="text-rose-400 font-medium">Unassigned</span>}
                  </span>
                  <span className="text-slate-400 flex items-center">
                    <Users className="w-3 h-3 mr-1" /> {group.studentsCount}
                  </span>
                </div>
              </div>
            ))}
            {sidebarGroups.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs">
                No groups found.
              </div>
            )}
          </div>
        </div>
      </div>

    </section>
  );
}
