import React, { useState } from 'react';
import { Users, Video, Calendar, BookOpen, Clock, ShieldAlert, Search, Plus, CheckCircle, XCircle, Clock3, Award, ExternalLink, CalendarDays, BarChart3, CheckSquare, Square, Check, Layers, Library } from 'lucide-react';
import { Group, Employee, Student, ClassSession, BookCollection } from '../types';
import GroupProfile from './GroupProfile';

import { getAccessToken, googleSignIn } from '../lib/googleAuth';
import AttendanceChart from './AttendanceChart';

interface GroupsProps {
  onNavigate?: (type: any, id?: string) => void;
  students: Student[];
  groups: Group[];
  employees: Employee[];
  activeEmployee: Employee;
  classSessions: ClassSession[];
  collections?: BookCollection[];
  onAddGroup: (g: Group) => void;
  onUpdateGroup: (g: Group) => void;
  onDeleteGroup?: (id: string) => void;
  onUpdateClassSession: (session: ClassSession) => void;
  onAddClassSession: (session: ClassSession) => void;
  onDeleteClassSession: (id: string) => void;
  onBulkAddClassSessions: (sessions: ClassSession[]) => void;
  selectedGroup: Group | null;
  onSelectGroup: (g: Group | null) => void;
}

export default function Groups({ 
  groups, 
  students, 
  employees, 
  activeEmployee, 
  classSessions,
  collections = [],
  onAddGroup, 
  onUpdateGroup,
  onDeleteGroup,
  onUpdateClassSession,
  onAddClassSession,
  onDeleteClassSession,
  onBulkAddClassSessions,
  selectedGroup, 
  onSelectGroup, 
  onNavigate 
}: GroupsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'groups' | 'classes' | 'analytics'>('groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreating, setIsCreating] = useState(false);

  // Bulk action selection state for class sessions
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  // Group creation form state
  const [groupCode, setGroupCode] = useState(String(groups.length + 1));
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id || '');
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>(collections[0]?.volumes[0]?.id || '');
  const [level, setLevel] = useState('');
  const [teacher, setTeacher] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [classTime, setClassTime] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [status, setStatus] = useState<Group['status']>('upcoming');

  // New Class Session form state
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionGroupId, setSessionGroupId] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');

  // Selected session for viewing/editing rollcall & grades
  const [activeSessionDetail, setActiveSessionDetail] = useState<ClassSession | null>(null);

  const canEdit = activeEmployee.isAssociate || activeEmployee.permissions.includes('edit:groups');

  const filteredGroups = groups.filter((group) => {
    const q = searchQuery.toLowerCase().trim();
    const codeMatch = group.code.toLowerCase().includes(q) || `group ${group.code}`.toLowerCase().includes(q) || `group #${group.code}`.toLowerCase().includes(q);
    const levelMatch = group.level.toLowerCase().includes(q);
    const teacherMatch = group.teacher.toLowerCase().includes(q);
    const scheduleMatch = group.schedule.toLowerCase().includes(q);
    const matchesSearch = !q || codeMatch || levelMatch || teacherMatch || scheduleMatch;
    const matchesStatus = filterStatus === 'all' || group.status === filterStatus;
    const matchesLevel = filterLevel === 'all' || group.level.toLowerCase().includes(filterLevel.toLowerCase());
    return matchesSearch && matchesStatus && matchesLevel;
  });

  const sortedClassSessions = [...classSessions].sort((a, b) => {
    return new Date(`${a.date}T${a.time.replace(/[^0-9:]/g, '') || '00:00'}`).getTime() - 
           new Date(`${b.date}T${b.time.replace(/[^0-9:]/g, '') || '00:00'}`).getTime();
  });

  const filteredClassSessions = sortedClassSessions.filter(session => {
    const q = searchQuery.toLowerCase().trim();
    const group = groups.find(g => g.id === session.groupId);
    const groupCode = session.groupCode || group?.code || '';
    const matchQuery = !q || 
      groupCode.toLowerCase().includes(q) || 
      session.topic.toLowerCase().includes(q) || 
      session.teacher.toLowerCase().includes(q) ||
      session.date.includes(q);
    return matchQuery;
  });

  // Bulk action handlers
  const handleToggleSelectAll = () => {
    if (selectedSessionIds.length === filteredClassSessions.length && filteredClassSessions.length > 0) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(filteredClassSessions.map(s => s.id));
    }
  };

  const handleToggleSession = (sessionId: string) => {
    setSelectedSessionIds(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId) 
        : [...prev, sessionId]
    );
  };

  const handleBulkUpdateStatus = (newStatus: 'completed' | 'upcoming' | 'in-progress') => {
    if (selectedSessionIds.length === 0) return;

    selectedSessionIds.forEach(id => {
      const session = classSessions.find(s => s.id === id);
      if (session) {
        onUpdateClassSession({
          ...session,
          status: newStatus
        });
      }
    });

    setBulkFeedback(`Successfully marked ${selectedSessionIds.length} session(s) as ${newStatus}!`);
    setSelectedSessionIds([]);
    setTimeout(() => setBulkFeedback(null), 3500);
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeCol = collections.find(c => c.id === selectedCollectionId);
    const activeVol = activeCol?.volumes.find(v => v.id === selectedVolumeId) || activeCol?.volumes[0];

    const computedLevel = activeCol && activeVol 
      ? `${activeCol.name} (${activeVol.name})`
      : (level.trim() || 'General English (Vol 1)');

    if (!groupCode.trim()) return;
    if (status !== 'waiting' && (selectedDays.length === 0 || !classTime || !startDate)) return;

    const unitsCount = activeVol?.unitsCount || 12;
    const scheduleStr = selectedDays.length > 0 && classTime ? `${selectedDays.join('/')} ${classTime}` : 'TBD (Flexible)';

    // Calculate end date & class dates if startDate is set
    let generatedDates: string[] = [];
    let computedEndDate = 'TBD';

    if (startDate && selectedDays.length > 0) {
      let current = new Date(startDate + 'T00:00:00');
      const dayMap: Record<string, number> = { 'Sun':0, 'Mon':1, 'Tue':2, 'Wed':3, 'Thu':4, 'Fri':5, 'Sat':6 };
      const validDays = selectedDays.map(d => dayMap[d]);
      
      while (generatedDates.length < unitsCount) {
        if (validDays.includes(current.getDay())) {
          const yyyy = current.getFullYear();
          const mm = String(current.getMonth() + 1).padStart(2, '0');
          const dd = String(current.getDate()).padStart(2, '0');
          generatedDates.push(`${yyyy}-${mm}-${dd}`);
        }
        current.setDate(current.getDate() + 1);
      }
      computedEndDate = generatedDates[generatedDates.length - 1] || 'TBD';
    }

    setIsCreating(false);

    const newGroupId = Date.now().toString();
    let finalMeetLink = meetLink.trim() || `vault-room-group-${groupCode.trim()}`;

    const newGroup: Group = {
      id: newGroupId,
      code: groupCode.trim(),
      name: `${computedLevel} ${groupCode.trim()}`,
      level: computedLevel,
      collectionId: selectedCollectionId || undefined,
      volumeId: selectedVolumeId || undefined,
      teacher: employees.find(emp => emp.username === teacher)?.name || teacher || 'Unassigned',
      schedule: scheduleStr,
      startDate: status === 'waiting' ? (startDate || 'TBD') : startDate,
      endDate: status === 'waiting' ? (computedEndDate || 'TBD') : computedEndDate,
      studentsCount: 0,
      meetLink: finalMeetLink,
      status: status,
      isWaitingForStudents: status === 'waiting',
      grades: [],
      messages: []
    };
    
    onAddGroup(newGroup);

    if (generatedDates.length > 0) {
      const newSessions: ClassSession[] = generatedDates.map((date, idx) => ({
        id: `cs-${newGroupId}-${idx}`,
        groupId: newGroupId,
        groupCode: newGroup.code,
        date,
        time: classTime || '19:00',
        topic: `Unit ${idx + 1}`,
        teacher: newGroup.teacher,
        status: 'upcoming',
        attendance: [],
        grades: []
      }));

      if (onBulkAddClassSessions) {
        onBulkAddClassSessions(newSessions);
      }
    }

    setGroupCode(String(groups.length + 2));
    setLevel('');
    setTeacher('');
    setSelectedDays([]);
    setClassTime('');
    setStartDate('');
    setEndDate('');
    setMeetLink('');
  };


  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionGroupId || !sessionDate || !sessionTime || !sessionTopic) return;
    const targetGroup = groups.find(g => g.id === sessionGroupId);
    if (!targetGroup) return;

    const groupStudents = students.filter(s => 
      s.group === targetGroup.code || 
      s.group === targetGroup.id || 
      s.group === targetGroup.name || 
      s.group === `${targetGroup.level} ${targetGroup.code}`
    );

    const newSession: ClassSession = {
      id: `cs-${Date.now()}`,
      groupId: targetGroup.id,
      groupCode: targetGroup.code,
      date: sessionDate,
      time: sessionTime,
      topic: sessionTopic.trim(),
      teacher: targetGroup.teacher,
      status: 'upcoming',
      attendance: groupStudents.map(s => ({
        studentId: s.id,
        studentName: s.name,
        status: 'pending',
        note: ''
      })),
      grades: groupStudents.map(s => ({
        studentId: s.id,
        studentName: s.name,
        speaking: "",
        listening: "",
        homework: ""
      }))
    };

    onAddClassSession(newSession);
    setIsCreatingSession(false);
    setSessionGroupId('');
    setSessionDate('');
    setSessionTime('');
    setSessionTopic('');
  };

  const handleAttendanceChange = (sessionId: string, studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    const session = classSessions.find(s => s.id === sessionId);
    if (!session) return;
    const updatedAttendance = session.attendance.map(a => 
      a.studentId === studentId ? { ...a, status } : a
    );
    const updatedSession = { ...session, attendance: updatedAttendance };
    onUpdateClassSession(updatedSession);
    if (activeSessionDetail?.id === sessionId) {
      setActiveSessionDetail(updatedSession);
    }
  };

  const handleGradeChange = (sessionId: string, studentId: string, field: 'speaking' | 'listening' | 'homework', value: number) => {
    const session = classSessions.find(s => s.id === sessionId);
    if (!session) return;
    const updatedGrades = session.grades.map(g => 
      g.studentId === studentId ? { ...g, [field]: value } : g
    );
    const updatedSession = { ...session, grades: updatedGrades };
    onUpdateClassSession(updatedSession);
    if (activeSessionDetail?.id === sessionId) {
      setActiveSessionDetail(updatedSession);
    }
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

  const handleUpdateCurrentGroup = (updated: Group) => {
    onUpdateGroup(updated);
    onSelectGroup(updated);
  };

  if (selectedGroup) {
    return (
      <GroupProfile 
        group={selectedGroup}
        students={students} 
        activeEmployee={activeEmployee} 
        employees={employees}
        collections={collections}
        classSessions={classSessions.filter(cs => cs.groupId === selectedGroup.id || cs.groupCode === selectedGroup.code)}
        onUpdateClassSession={onUpdateClassSession}
        onAddClassSession={onAddClassSession}
        onDeleteClassSession={onDeleteClassSession}
        onClose={() => onSelectGroup(null)} 
        onUpdateGroup={handleUpdateCurrentGroup}
        onDeleteGroup={onDeleteGroup}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <section className="space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Study Groups & Class Schedule</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage group tracks, class session dates, attendance rollcall, and student performance.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-brand-dark border border-brand-border rounded-lg p-1">
            <button
              onClick={() => setActiveSubTab('groups')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'groups' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Groups</span>
            </button>
            <button
              onClick={() => setActiveSubTab('classes')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'classes' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Classes & Grades</span>
            </button>
            <button
              onClick={() => setActiveSubTab('analytics')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'analytics' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Attendance (30D)</span>
            </button>
          </div>

          {canEdit && activeSubTab !== 'analytics' && (
            activeSubTab === 'groups' ? (
              <button 
                onClick={() => setIsCreating(!isCreating)}
                className="px-3.5 py-1.5 shrink-0 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-500 transition cursor-pointer flex items-center shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {isCreating ? 'Cancel' : 'New Group'}
              </button>
            ) : (
              <button 
                onClick={() => setIsCreatingSession(!isCreatingSession)}
                className="px-3.5 py-1.5 shrink-0 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-500 transition cursor-pointer flex items-center shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {isCreatingSession ? 'Cancel' : 'Schedule Class'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Accessible Search & Filter Bar */}
      <div className="bg-brand-card p-4 rounded-xl border border-brand-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeSubTab === 'groups' ? "Search groups by code (e.g. 1, 2), level, teacher, or schedule..." : "Filter classes by date (YYYY-MM-DD), group code, topic, or teacher..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg pl-9 pr-8 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {activeSubTab === 'groups' && (
          <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="upcoming">Upcoming Only</option>
              <option value="waiting">Waiting for Students</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}
      </div>

      {/* Create Group Form Modal / Inline Box */}
      {isCreating && canEdit && activeSubTab === 'groups' && (
        <div className="bg-brand-card p-5 rounded-xl border border-purple-500/50 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-brand-border pb-3">
            <h3 className="text-sm font-bold text-purple-300">Create New Study Group (By Code Number)</h3>
            <span className="text-xs text-slate-400">Group Name is strictly its Code Number (1, 2, 3, etc.)</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Group ID Number</label>
                <div className="w-full bg-brand-dark/50 border border-brand-border/50 text-sm rounded-lg px-3 py-2 text-slate-400 cursor-not-allowed font-mono font-bold">
                  {groupCode}
                </div>
              </div>
              {/* Select Collection Dropdown */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs text-slate-400 font-semibold">Curriculum Collection *</label>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('collections')}
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                    >
                      + Manage Series
                    </button>
                  )}
                </div>
                <select
                  value={selectedCollectionId}
                  onChange={e => {
                    const newColId = e.target.value;
                    setSelectedCollectionId(newColId);
                    const col = collections.find(c => c.id === newColId);
                    if (col && col.volumes.length > 0) {
                      setSelectedVolumeId(col.volumes[0].id);
                    } else {
                      setSelectedVolumeId('');
                    }
                  }}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition cursor-pointer"
                  required
                >
                  <option value="">Choose a Collection...</option>
                  {collections.map(col => (
                    <option key={col.id} value={col.id}>
                      {col.name} ({col.category || 'General'}) — {col.volumes.length} Vols
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Volume Dropdown */}
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">Volume / Level *</label>
                {selectedCollectionId && collections.find(c => c.id === selectedCollectionId)?.volumes.length ? (
                  <select
                    value={selectedVolumeId}
                    onChange={e => setSelectedVolumeId(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition cursor-pointer"
                    required
                  >
                    {collections.find(c => c.id === selectedCollectionId)?.volumes.map(vol => (
                      <option key={vol.id} value={vol.id}>
                        {vol.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Vol 1, Level 2"
                    value={level}
                    onChange={e => setLevel(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                    required
                  />
                )}
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Primary Teacher</label>
                <select
                  value={teacher}
                  onChange={e => setTeacher(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition cursor-pointer"
                >
                  <option value="">Assign Teacher... (Optional)</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.username}>{emp.name} ({emp.roleTitle})</option>
                  ))}
                </select>
              </div>

              
              {/* Schedule Days */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Schedule Day(s)</label>
                <div className="flex space-x-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition ${selectedDays.includes(day) ? 'bg-purple-600 text-white' : 'bg-brand-dark text-slate-400 border border-brand-border hover:bg-brand-card'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>


              
              {/* Schedule Time */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Schedule Time</label>
                <input
                  type="time"
                  value={classTime}
                  onChange={(e) => setClassTime(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition [color-scheme:dark] cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Start Date {status === 'waiting' ? '(Optional)' : '*'}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition [color-scheme:dark]"
                  required={status !== 'waiting'}
                />
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Initial Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as Group['status'])}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition cursor-pointer"
                  required
                >
                  <option value="upcoming">Upcoming (Scheduled)</option>
                  <option value="waiting">Waiting for Students (Undefined Start/End)</option>
                  <option value="active">Active (In Progress)</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)} 
                className="px-4 py-2 bg-brand-dark text-slate-400 text-xs rounded-lg hover:text-white transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-500 transition cursor-pointer"
              >
                Save Group {groupCode}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Class Session Form Modal */}
      {isCreatingSession && canEdit && (
        <div className="bg-brand-card p-5 rounded-xl border border-purple-500/50 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-brand-border pb-3">
            <h3 className="text-sm font-bold text-purple-300">Schedule Upcoming Class Session</h3>
            <span className="text-xs text-slate-400">Class date will be organized in chronological attendance & grades table</span>
          </div>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Select Group</label>
                <select
                  value={sessionGroupId}
                  onChange={e => setSessionGroupId(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition cursor-pointer"
                  required
                >
                  <option value="">Select Group Number...</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>Group {g.code} ({g.level})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Class Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition [color-scheme:dark]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Class Time</label>
                <input
                  type="text"
                  placeholder="e.g. 19:00 BRT"
                  value={sessionTime}
                  onChange={e => setSessionTime(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Topic / Unit / Lesson</label>
                <input
                  type="text"
                  placeholder="e.g. Unit 5: Business Presentations"
                  value={sessionTopic}
                  onChange={e => setSessionTopic(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button 
                type="button" 
                onClick={() => setIsCreatingSession(false)} 
                className="px-4 py-2 bg-brand-dark text-slate-400 text-xs rounded-lg hover:text-white transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-500 transition cursor-pointer"
              >
                Schedule Class Session
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 1: Groups Grid View */}
      {activeSubTab === 'groups' && (
        filteredGroups.length === 0 ? (
          <div className="bg-brand-card p-12 rounded-xl border border-brand-border text-center space-y-3">
            <p className="text-slate-300 font-medium">No study groups match your search criteria.</p>
            <p className="text-xs text-slate-500">Try searching with a different group code number or clear the search filter.</p>
            <button 
              onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterLevel('all'); }} 
              className="px-4 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs rounded-lg hover:bg-purple-600 hover:text-white transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGroups.map((group) => {
              const enrolledStudents = students.filter(s => 
                s.group === group.code || 
                s.group === group.id || 
                s.group === group.name || 
                s.group === `${group.level} ${group.code}`
              );
              return (
                <div
                  key={group.id}
                  onClick={() => onSelectGroup(group)}
                  className="bg-brand-card p-5 rounded-xl border border-brand-border hover:border-purple-500/50 transition duration-200 group cursor-pointer space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold font-mono text-purple-300 text-base group-hover:bg-purple-600 group-hover:text-white transition">
                          {group.code}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-100 group-hover:text-purple-300 transition text-base line-clamp-2">
                            {group.name || group.code}
                          </h4>
                          <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-[9px] uppercase font-semibold rounded border ${getStatusColor(group.status || 'upcoming')}`}>
                            {group.status === 'waiting' ? '⏳ Waiting for Students' : (group.status || 'upcoming')}
                          </span>
                        </div>
                      </div>
                      <span className="flex items-center px-2 py-1 text-[11px] bg-brand-dark text-slate-300 rounded-md border border-brand-border">
                        <Users className="w-3.5 h-3.5 mr-1 text-purple-400" />
                        {enrolledStudents.length}/10
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-400 pt-1">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-purple-400/70 shrink-0" />
                        <span className="truncate">{group.level}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-purple-400/70 shrink-0" />
                        <span>{group.schedule}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-purple-400/70 shrink-0" />
                        <span className="truncate">
                          {group.status === 'waiting'
                            ? 'Undefined (Waiting for Students)'
                            : (group.startDate && group.endDate ? `${group.startDate} to ${group.endDate}` : 'Dates TBD')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-brand-border flex items-center justify-between text-xs">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('staff', group.teacher); }}
                      className="text-purple-400 hover:text-purple-300 hover:underline flex items-center cursor-pointer"
                    >
                      Teacher: {group.teacher}
                    </button>
                    <span className="text-slate-400 font-medium group-hover:text-purple-300 transition flex items-center">
                      Open Group Profile →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* VIEW 2: Upcoming Classes Table (Grades & Attendance by Date) */}
      {activeSubTab === 'classes' && (
        <div className="space-y-4">
          {/* Bulk Feedback Banner */}
          {bulkFeedback && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center text-xs text-emerald-300 animate-fadeIn">
              <Check className="w-4 h-4 mr-2 text-emerald-400 shrink-0" />
              {bulkFeedback}
            </div>
          )}

          {/* Bulk Action Toolbar */}
          {selectedSessionIds.length > 0 && (
            <div className="p-3.5 bg-purple-950/90 border border-purple-500/50 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fadeIn">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-purple-600 text-white font-bold text-xs rounded-lg shadow-sm">
                  {selectedSessionIds.length} Selected
                </span>
                <span className="text-xs text-purple-200">Bulk Actions for Selected Sessions:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleBulkUpdateStatus('completed')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center shadow-sm cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Mark as 'Completed'
                </button>
                <button
                  onClick={() => handleBulkUpdateStatus('upcoming')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition flex items-center shadow-sm cursor-pointer"
                >
                  <Clock3 className="w-3.5 h-3.5 mr-1" />
                  Mark as 'Pending' (Upcoming)
                </button>
                <button
                  onClick={() => handleBulkUpdateStatus('in-progress')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition flex items-center shadow-sm cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Mark as 'In-Progress'
                </button>
                <button
                  onClick={() => setSelectedSessionIds([])}
                  className="px-3 py-1.5 bg-brand-dark hover:bg-brand-border text-slate-300 hover:text-white text-xs rounded-lg transition cursor-pointer border border-brand-border"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
            <div className="p-4 bg-brand-dark/60 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center">
                  <CalendarDays className="w-4 h-4 mr-2 text-purple-400" />
                  Upcoming & Scheduled Classes (Grades & Attendance by Date)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Chronologically organized class sessions with bulk status management.</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-purple-300 font-mono bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
                  {filteredClassSessions.length} Sessions
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-brand-dark/90 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredClassSessions.length > 0 && selectedSessionIds.length === filteredClassSessions.length}
                        onChange={handleToggleSelectAll}
                        className="accent-purple-600 w-4 h-4 rounded cursor-pointer"
                        title="Select All Sessions"
                      />
                    </th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Group Code</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Topic / Curriculum</th>
                    <th className="p-4">Teacher</th>
                    <th className="p-4">Attendance Rollcall</th>
                    <th className="p-4">Grades</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filteredClassSessions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No upcoming classes match your query. Click "Schedule Class" to add upcoming class dates.
                      </td>
                    </tr>
                  ) : (
                    filteredClassSessions.map((session) => {
                      const isPast = new Date(session.date).getTime() < new Date().setHours(0,0,0,0);
                      const isToday = session.date === new Date().toISOString().split('T')[0];
                      const presentCount = session.attendance.filter(a => a.status === 'present').length;
                      const totalStudents = session.attendance.length;
                      const isSelected = selectedSessionIds.includes(session.id);

                      const avgGrade = session.grades.length > 0 
                        ? "N/A"
                        : null;

                      return (
                        <tr 
                          key={session.id} 
                          className={`transition ${isSelected ? 'bg-purple-900/25 border-l-2 border-purple-500' : 'hover:bg-purple-900/10'}`}
                        >
                          {/* Bulk Checkbox */}
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSession(session.id)}
                              className="accent-purple-600 w-4 h-4 rounded cursor-pointer"
                            />
                          </td>

                          {/* Date & Time */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-100 flex items-center space-x-2">
                              <span>{session.date}</span>
                              {isToday && <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 font-bold">TODAY</span>}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center">
                              <Clock className="w-3 h-3 mr-1 text-slate-500" />
                              {session.time}
                            </div>
                          </td>

                          {/* Group Code */}
                          <td className="p-4 whitespace-nowrap">
                            <button
                              onClick={() => onNavigate && onNavigate('group', session.groupCode || session.groupId)}
                              className="px-2.5 py-1 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600 hover:text-white text-purple-300 font-bold rounded-lg transition font-mono cursor-pointer"
                            >
                              Group {session.groupCode}
                            </button>
                          </td>

                          {/* Session Status */}
                          <td className="p-4 whitespace-nowrap">
                            {session.status === 'completed' && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30 text-[10px] font-semibold">
                                <CheckCircle className="w-3 h-3 mr-1" /> Completed
                              </span>
                            )}
                            {session.status === 'upcoming' && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md border border-blue-500/30 text-[10px] font-semibold">
                                <Clock3 className="w-3 h-3 mr-1" /> Pending
                              </span>
                            )}
                            {session.status === 'in-progress' && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30 text-[10px] font-semibold">
                                <Clock className="w-3 h-3 mr-1" /> Live
                              </span>
                            )}
                            {session.status === 'cancelled' && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-md border border-rose-500/30 text-[10px] font-semibold">
                                Cancelled
                              </span>
                            )}
                          </td>

                          {/* Topic */}
                          <td className="p-4">
                            <div className="font-medium text-slate-200 max-w-xs">{session.topic}</div>
                          </td>

                          {/* Teacher */}
                          <td className="p-4 whitespace-nowrap">
                            <span 
                              onClick={() => onNavigate && onNavigate('staff', session.teacher)}
                              className="text-slate-300 hover:text-purple-300 hover:underline cursor-pointer"
                            >
                              {session.teacher}
                            </span>
                          </td>

                          {/* Attendance */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-slate-200">
                                {totalStudents > 0 ? `${presentCount}/${totalStudents} Present` : 'No Students'}
                              </span>
                              {totalStudents > 0 && (
                                <div className="flex -space-x-1">
                                  {session.attendance.map((att) => (
                                    <span 
                                      key={att.studentId} 
                                      title={`${att.studentName}: ${att.status}`}
                                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border border-brand-dark ${
                                        att.status === 'present' ? 'bg-emerald-500 text-white' :
                                        att.status === 'absent' ? 'bg-rose-500 text-white' :
                                        att.status === 'late' ? 'bg-amber-500 text-white' :
                                        'bg-slate-600 text-slate-300'
                                      }`}
                                    >
                                      {att.studentName.charAt(0)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Grades */}
                          <td className="p-4 whitespace-nowrap">
                            {avgGrade && Number(avgGrade) > 0 ? (
                              <div className="flex items-center space-x-1.5">
                                <Award className="w-3.5 h-3.5 text-purple-400" />
                                <span className="font-bold text-purple-300 font-mono">{avgGrade} Avg</span>
                                <span className="text-slate-500 text-[10px]">({session.grades.length} graded)</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Pending input</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setActiveSessionDetail(activeSessionDetail?.id === session.id ? null : session)}
                              className="px-3 py-1 bg-brand-dark border border-brand-border hover:border-purple-500 text-slate-200 hover:text-white rounded-lg transition cursor-pointer text-xs"
                            >
                              {activeSessionDetail?.id === session.id ? 'Close Details' : 'Record / View'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Session Detail & Inline Grading / Rollcall Editor */}
          {activeSessionDetail && (
            <div className="bg-brand-card p-6 rounded-xl border border-purple-500/50 shadow-2xl space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-purple-600 text-white rounded font-mono text-xs font-bold">
                      Group {activeSessionDetail.groupCode}
                    </span>
                    <h4 className="text-base font-bold text-slate-100">{activeSessionDetail.topic}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Date: <strong className="text-slate-200">{activeSessionDetail.date}</strong> at <strong className="text-slate-200">{activeSessionDetail.time}</strong> • Teacher: <strong className="text-purple-300">{activeSessionDetail.teacher}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setActiveSessionDetail(null)}
                  className="p-1.5 bg-brand-dark border border-brand-border text-slate-400 hover:text-white rounded-lg transition self-start sm:self-auto cursor-pointer text-xs"
                >
                  ✕ Close Detail
                </button>
              </div>

              {/* Table of Enrolled Students for this specific Class Date */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Rollcall Attendance & Student Performance for {activeSessionDetail.date}
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-brand-dark text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Attendance Status</th>
                        <th className="p-3">Speaking (0-10)</th>
                        <th className="p-3">Listening (0-10)</th>
                        <th className="p-3">Homework (0-10)</th>
                        <th className="p-3">Session Average</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {activeSessionDetail.attendance.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500">
                            No students enrolled in Group {activeSessionDetail.groupCode} yet.
                          </td>
                        </tr>
                      ) : (
                        activeSessionDetail.attendance.map((att) => {
                          const studentGrade = activeSessionDetail.grades.find(g => g.studentId === att.studentId) || {
                            speaking: "",
                            listening: "",
                            homework: ""
                          };
                          const studentAvg = "N/A";

                          return (
                            <tr key={att.studentId} className="hover:bg-brand-dark/50">
                              <td className="p-3 font-semibold text-slate-200">
                                <button
                                  type="button"
                                  onClick={() => onNavigate && onNavigate('student', att.studentId)}
                                  className="text-purple-400 hover:underline cursor-pointer text-left"
                                >
                                  {att.studentName}
                                </button>
                              </td>
                              <td className="p-3">
                                <select
                                  value={att.status}
                                  onChange={(e) => handleAttendanceChange(activeSessionDetail.id, att.studentId, e.target.value as any)}
                                  className="bg-brand-dark border border-brand-border rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                                >
                                  <option value="present">Present</option>
                                  <option value="absent">Absent</option>
                                  <option value="late">Late</option>
                                  <option value="excused">Excused</option>
                                  <option value="pending">Pending</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.5"
                                  value={studentGrade.speaking}
                                  onChange={(e) => handleGradeChange(activeSessionDetail.id, att.studentId, 'speaking', parseFloat(e.target.value) || 0)}
                                  className="w-16 bg-brand-dark border border-brand-border rounded px-2 py-1 text-center text-slate-200 focus:outline-none focus:border-purple-500"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.5"
                                  value={studentGrade.listening}
                                  onChange={(e) => handleGradeChange(activeSessionDetail.id, att.studentId, 'listening', parseFloat(e.target.value) || 0)}
                                  className="w-16 bg-brand-dark border border-brand-border rounded px-2 py-1 text-center text-slate-200 focus:outline-none focus:border-purple-500"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.5"
                                  value={studentGrade.homework}
                                  onChange={(e) => handleGradeChange(activeSessionDetail.id, att.studentId, 'homework', parseFloat(e.target.value) || 0)}
                                  className="w-16 bg-brand-dark border border-brand-border rounded px-2 py-1 text-center text-slate-200 focus:outline-none focus:border-purple-500"
                                />
                              </td>
                              <td className="p-3 font-bold font-mono text-purple-300">
                                {studentAvg}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: Attendance Recharts Bar Chart View */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <AttendanceChart
            classSessions={classSessions}
            groups={groups}
            selectedGroupId={null}
          />
        </div>
      )}
    </section>
  );
}
