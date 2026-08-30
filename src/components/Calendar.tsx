import React, { useState } from 'react';
import { Group, Employee, Meeting, ClassSession } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Clock, 
  Video, 
  Plus, 
  Users, 
  BookOpen, 
  Search,
  CheckCircle2,
  CalendarDays,
  X
} from 'lucide-react';
import { useLiveCall } from '../context/LiveCallContext';

interface CalendarProps {
  students: import('../types').Student[];
  groups: Group[];
  employees: Employee[];
  activeEmployee: Employee;
  meetings: Meeting[];
  classSessions: ClassSession[];
  onAddMeeting: (meeting: Meeting) => void;
  onUpdateMeeting?: (meeting: Meeting) => void;
  onNavigate: (type: 'student' | 'group' | 'staff', id: string) => void;
}

export default function Calendar({
  students,
  groups,
  employees,
  activeEmployee,
  meetings,
  classSessions,
  onAddMeeting,
  onUpdateMeeting,
  onNavigate
}: CalendarProps) {
  const canViewAll = activeEmployee.isMaster || activeEmployee.isAssociate || activeEmployee.isCoordinator || activeEmployee.permissions.includes('calendar:all');
  const viewableGroups = canViewAll ? groups : groups.filter(g => g.teacher === activeEmployee.name);
  const viewableSessions = canViewAll ? classSessions : classSessions.filter(s => s.teacherName === activeEmployee.name || s.teacher === activeEmployee.name);
  const viewableMeetings = canViewAll ? meetings : meetings.filter(m => m.organizerId === activeEmployee.id || m.attendees.includes(activeEmployee.id));

  const { startCall } = useLiveCall();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 24)); // August 24, 2026
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'classes' | 'meetings'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Meeting Modal State
  const [isAddingMeeting, setIsAddingMeeting] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('2026-08-25');
  const [meetingTime, setMeetingTime] = useState('14:00');
  const [meetingLink, setMeetingLink] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([activeEmployee.id]);

  const isAdmin = activeEmployee.isAssociate || activeEmployee.permissions.includes('staff');

  // Selected Day Detail State
  const [selectedDay, setSelectedDay] = useState<string | null>('2026-08-25');

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      setCurrentDate(new Date(year, month, currentDate.getDate() - 7));
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      setCurrentDate(new Date(year, month, currentDate.getDate() + 7));
    }
  };

  const setToday = () => {
    setCurrentDate(new Date(2026, 7, 24));
  };

  // Build days for month calendar
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
  
  // Previous month padding
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    monthDays.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    monthDays.push({ dateStr, dayNum: d, isCurrentMonth: true });
  }

  // Next month padding to fill 35 or 42 grid cells
  const remaining = 35 - monthDays.length > 0 ? 35 - monthDays.length : (42 - monthDays.length > 0 ? 42 - monthDays.length : 0);
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 1 : month + 2;
    const y = month === 11 ? year + 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    monthDays.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  // Build days for week calendar
  const startOfWeekDate = new Date(year, month, currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({length: 7}).map((_, i) => {
    const d = new Date(startOfWeekDate.getFullYear(), startOfWeekDate.getMonth(), startOfWeekDate.getDate() + i);
    const m = d.getMonth() + 1;
    return {
      dateStr: `${d.getFullYear()}-${String(m).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dayNum: d.getDate(),
      isCurrentMonth: true // In week view, we don't care about dimming other month days as much
    };
  });

  const displayDays = viewMode === 'month' ? monthDays : weekDays;

  // Filter events for a given date
  const getEventsForDate = (dateStr: string) => {
    const classes = viewableSessions.filter(cs => {
      if (cs.date !== dateStr) return false;
      if (selectedTeacher !== 'all' && cs.teacher.toLowerCase() !== selectedTeacher.toLowerCase()) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchCode = cs.groupCode.toLowerCase().includes(query);
        const matchTopic = cs.topic.toLowerCase().includes(query);
        const matchTeacher = cs.teacher.toLowerCase().includes(query);
        if (!matchCode && !matchTopic && !matchTeacher) return false;
      }
      return eventTypeFilter === 'all' || eventTypeFilter === 'classes';
    });

    const dayMeetings = viewableMeetings.filter(m => {
      if (m.date !== dateStr) return false;
      if (selectedTeacher !== 'all') {
        const teacherEmp = employees.find(e => e.name.toLowerCase() === selectedTeacher.toLowerCase() || e.username.toLowerCase() === selectedTeacher.toLowerCase());
        if (teacherEmp && !m.attendees.includes(teacherEmp.id) && m.organizerId !== teacherEmp.id) return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(query);
        const matchOrg = m.organizerName.toLowerCase().includes(query);
        if (!matchTitle && !matchOrg) return false;
      }
      return eventTypeFilter === 'all' || eventTypeFilter === 'meetings';
    });

    
    const dayBirthdays = [...employees, ...students].filter(person => {
      if (!person.birthday) return false;
      const [, m, d] = person.birthday.split('-');
      const [, dateM, dateD] = dateStr.split('-');
      return m === dateM && d === dateD;
    });

    return { classes, meetings: dayMeetings, birthdays: dayBirthdays };

  };

  const handleSaveMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !meetingDate || !meetingTime) return;

    if (editingMeetingId && onUpdateMeeting) {
      const existingM = meetings.find(m => m.id === editingMeetingId);
      if (existingM) {
        onUpdateMeeting({
          ...existingM,
          title: meetingTitle.trim(),
          date: meetingDate,
          time: meetingTime,
          attendees: selectedAttendees,
          link: meetingLink.trim() || `vault-room-meeting-${existingM.id}`
        });
      }
    } else {
      const newM: Meeting = {
        id: `m-${Date.now()}`,
        title: meetingTitle.trim(),
        date: meetingDate,
        time: meetingTime,
        organizerId: activeEmployee.id,
        organizerName: activeEmployee.name,
        attendees: selectedAttendees,
        link: meetingLink.trim() || `vault-room-${Date.now()}`
      };
      onAddMeeting(newM);
    }

    setIsAddingMeeting(false);
    setEditingMeetingId(null);
    setMeetingTitle('');
    setMeetingLink('');
  };

  const openEditMeeting = (m: Meeting) => {
    setEditingMeetingId(m.id);
    setMeetingTitle(m.title);
    setMeetingDate(m.date);
    setMeetingTime(m.time);
    setMeetingLink(m.link || '');
    setSelectedAttendees(m.attendees);
    setIsAddingMeeting(true);
  };

  const toggleAttendee = (id: string) => {
    if (selectedAttendees.includes(id)) {
      setSelectedAttendees(selectedAttendees.filter(a => a !== id));
    } else {
      setSelectedAttendees([...selectedAttendees, id]);
    }
  };

  // Selected Day events
  const selectedDayEvents = selectedDay ? getEventsForDate(selectedDay) : { classes: [], meetings: [], birthdays: [] };

  return (
    <section className="space-y-6">
      {/* Top Header & Filtering Toolbar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-brand-card p-5 rounded-xl border border-brand-border shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2.5 text-purple-400" />
            Teacher Schedule & Academic Calendar
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Master timetable for teacher schedules, study group sessions, and staff meetings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddingMeeting(true)}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition flex items-center cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Schedule Meeting
          </button>
        </div>
      </div>

      {/* Control Bar: Teacher Filter, Event Type Filter, Month Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-brand-card p-4 rounded-xl border border-brand-border">
        {/* Month / Year Navigator */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-brand-dark p-1 rounded-lg border border-brand-border mr-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded transition cursor-pointer ${
                viewMode === 'month' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded transition cursor-pointer ${
                viewMode === 'week' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Week
            </button>
          </div>
          <div className="flex items-center space-x-1 bg-brand-dark p-1 rounded-lg border border-brand-border">
            <button
              onClick={prevPeriod}
              className="p-1.5 hover:bg-brand-card text-slate-300 hover:text-white rounded transition cursor-pointer"
              title={viewMode === 'month' ? "Previous Month" : "Previous Week"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={setToday}
              className="px-2.5 py-1 text-xs font-semibold text-purple-300 hover:text-white transition cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={nextPeriod}
              className="p-1.5 hover:bg-brand-card text-slate-300 hover:text-white rounded transition cursor-pointer"
              title={viewMode === 'month' ? "Next Month" : "Next Week"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-base font-bold text-slate-100 min-w-36">
            {monthNames[month]} {year}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search code, topic, teacher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-brand-dark border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 w-44 md:w-56"
            />
          </div>

          {/* Teacher Selector Filter */}
          <div className="flex items-center space-x-2 bg-brand-dark px-3 py-1.5 rounded-lg border border-brand-border">
            <Filter className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium shrink-0">Teacher:</span>
            <select
              value={selectedTeacher}
              onChange={e => setSelectedTeacher(e.target.value)}
              className="bg-transparent text-xs text-purple-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-brand-dark text-slate-200">All Teachers ({employees.length})</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.name} className="bg-brand-dark text-slate-200">
                  {emp.name} ({emp.roleTitle})
                </option>
              ))}
            </select>
          </div>

          {/* Event Type Filter */}
          <div className="flex bg-brand-dark p-1 rounded-lg border border-brand-border">
            <button
              onClick={() => setEventTypeFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer ${
                eventTypeFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setEventTypeFilter('classes')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer ${
                eventTypeFilter === 'classes' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Classes Only
            </button>
            <button
              onClick={() => setEventTypeFilter('meetings')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer ${
                eventTypeFilter === 'meetings' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Meetings Only
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar Month Matrix + Selected Day Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar Grid (3 columns on xl) */}
        <div className="xl:col-span-3 bg-brand-card rounded-xl border border-brand-border overflow-hidden shadow-sm">
          {/* Day of week headers: Sunday to Saturday */}
          <div className="grid grid-cols-7 bg-brand-dark/80 border-b border-brand-border text-center py-2.5">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
              <span key={d} className={`text-[11px] font-bold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-purple-400/80' : 'text-slate-400'}`}>
                {d.slice(0, 3)}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-brand-border">
            {displayDays.map((dayItem, idx) => {
              const events = getEventsForDate(dayItem.dateStr);
              const classes = events.classes || [];
              const dayMts = events.meetings || [];
              const dayBdays = events.birthdays || [];
              const totalEvents = classes.length + dayMts.length + dayBdays.length;
              const isSelected = selectedDay === dayItem.dateStr;
              const isToday = dayItem.dateStr === '2026-08-24';

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(dayItem.dateStr)}
                  className={`min-h-[100px] p-2 flex flex-col justify-between transition cursor-pointer group ${
                    !dayItem.isCurrentMonth 
                      ? 'bg-brand-dark/30 opacity-40 hover:opacity-75' 
                      : isSelected
                      ? 'bg-purple-950/20 border-2 border-purple-500'
                      : 'hover:bg-brand-dark/60'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-purple-600 text-white font-black ring-2 ring-purple-400'
                          : isSelected
                          ? 'bg-purple-500/30 text-purple-200'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayItem.dayNum}
                    </span>
                    {totalEvents > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 font-bold">
                        {totalEvents}
                      </span>
                    )}
                  </div>

                  {/* Compact Event Pills inside day cell */}
                  <div className="space-y-1 overflow-hidden">
                    {classes.slice(0, 2).map(cs => (
                      <div
                        key={cs.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('group', cs.groupCode);
                        }}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-200 border border-blue-500/30 hover:bg-blue-800 transition font-mono"
                        title={`Code ${cs.groupCode}: ${cs.topic} (${cs.teacher})`}
                      >
                        <span className="font-bold text-blue-300">Code {cs.groupCode}</span> • {cs.time.split(' ')[0]}
                      </div>
                    ))}
                    {dayMts.slice(0, 2).map(m => (
                      <div
                        key={m.id}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-200 border border-purple-500/30 font-medium"
                        title={`Meeting: ${m.title} (${m.time})`}
                      >
                        <span className="font-bold">Sync</span>: {m.title}
                      </div>
                    ))}
                    {totalEvents > 2 && (
                      <span className="text-[9px] text-slate-500 block text-right">
                        +{totalEvents - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Inspector (1 column on xl) */}
        <div className="bg-brand-card p-5 rounded-xl border border-brand-border flex flex-col h-full shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border">
            <div>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Day Schedule Inspector</span>
              <h3 className="text-base font-bold text-slate-100">
                {selectedDay || 'Select a day'}
              </h3>
            </div>
            <button
              onClick={() => {
                if (selectedDay) {
                  setMeetingDate(selectedDay);
                }
                setIsAddingMeeting(true);
              }}
              className="p-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg transition border border-purple-500/30 cursor-pointer"
              title="Add meeting on this date"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
            {selectedDayEvents.classes.length === 0 && selectedDayEvents.meetings.length === 0 && selectedDayEvents.birthdays.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <CalendarIcon className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p className="text-xs">No classes or meetings scheduled for this date.</p>
              </div>
            ) : (
              <>
                {/* Classes Section */}
                
                {/* Birthdays Section */}
                {selectedDayEvents.birthdays && selectedDayEvents.birthdays.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center">
                      <span className="w-3.5 h-3.5 mr-1.5 flex items-center justify-center text-[10px]">🎁</span>
                      Birthdays ({selectedDayEvents.birthdays.length})
                    </h4>
                    {selectedDayEvents.birthdays.map((person, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-brand-dark rounded-lg border border-pink-500/30 group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-black text-pink-300 block mb-0.5">
                              {person.name}
                            </span>
                            <span className="text-[10px] text-slate-400">Happy Birthday!</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDayEvents.classes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center">
                      <BookOpen className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                      Class Sessions ({selectedDayEvents.classes.length})
                    </h4>
                    {selectedDayEvents.classes.map(cs => (
                      <div
                        key={cs.id}
                        onClick={() => onNavigate('group', cs.groupCode)}
                        className="p-3 bg-brand-dark rounded-lg border border-blue-500/30 hover:border-blue-400 transition cursor-pointer group"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-blue-300 font-mono">
                            Code {cs.groupCode}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-brand-card px-1.5 py-0.5 rounded border border-brand-border">
                            {cs.time}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-200 mt-1">{cs.topic}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-brand-border/60">
                          <span>Teacher: <strong className="text-purple-300">{cs.teacher}</strong></span>
                          <span className="text-blue-400 group-hover:underline">Open Group →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Meetings Section */}
                {selectedDayEvents.meetings.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center">
                      <Video className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                      Staff Meetings ({selectedDayEvents.meetings.length})
                    </h4>
                    {selectedDayEvents.meetings.map(m => (
                      <div
                        key={m.id}
                        className="p-3 bg-brand-dark rounded-lg border border-purple-500/30 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-purple-200">{m.title}</span>
                          <span className="text-[10px] text-slate-400 bg-brand-card px-1.5 py-0.5 rounded border border-brand-border">
                            {m.time}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 space-y-1 flex justify-between items-end">
                          <div>
                            <div>Host: <strong className="text-slate-200">{m.organizerName}</strong></div>
                            <div>{m.attendees.length} Staff Invited</div>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => openEditMeeting(m)}
                              className="text-purple-400 hover:text-purple-300 transition underline cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            startCall(
                              m.link || `vault-room-meeting-${m.id}`,
                              { id: activeEmployee.id, name: activeEmployee.name, role: activeEmployee.roleTitle, avatarUrl: activeEmployee.avatarUrl },
                              m.title,
                              'meeting'
                            );
                          }}
                          className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs rounded transition border border-purple-500/30 cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meeting</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* SCHEDULE/EDIT MEETING MODAL */}
      {isAddingMeeting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-md p-6 rounded-xl border border-purple-500 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-brand-border mb-4">
              <h3 className="text-sm font-bold text-purple-300 flex items-center">
                <Video className="w-4 h-4 mr-2" /> {editingMeetingId ? 'Edit Staff Meeting' : 'Schedule Staff Meeting'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingMeeting(false);
                  setEditingMeetingId(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMeeting} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Meeting Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Pedagogical Alignment"
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Date *</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={e => setMeetingDate(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Time *</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={e => setMeetingTime(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2 font-semibold">Invite Teachers & Staff</label>
                <div className="flex flex-wrap gap-1.5">
                  {employees.map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleAttendee(emp.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                        selectedAttendees.includes(emp.id)
                          ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                          : 'bg-brand-dark text-slate-400 border-brand-border hover:border-slate-500'
                      }`}
                    >
                      {emp.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsAddingMeeting(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-sm"
                >
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
