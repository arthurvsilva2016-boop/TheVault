/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import StudentDirectory from './components/StudentDirectory';
import StudentProfile from './components/StudentProfile';
import Groups from './components/Groups';
import Finance from './components/Finance';
import TeacherPortal from './components/TeacherPortal';
import Occurrences from './components/Occurrences';
import TaskManager from './components/TaskManager';
import StaffManager from './components/StaffManager';
import Preferences from './components/Preferences';
import Meetings from './components/Meetings';
import CollectionsManager from './components/CollectionsManager';
import Chat from './components/Chat';
import World from './components/game/World';
import Login from './components/Login';
import StudentApp from './components/StudentApp';
import VaultCallOverlay from './components/calling/VaultCallOverlay';
import { Tab, Student, AppAccess, Employee, Group, Transaction, Occurrence, ClassSession, Meeting, BookCollection, RolePreset, AppNotification, Task, EmployeeChatMessage, EmployeeMessageReaction } from './types';
import { MOCK_STUDENTS, MOCK_GROUPS, MOCK_EMPLOYEES, MOCK_TXS, MOCK_OCCURRENCES, MOCK_CLASS_SESSIONS, MOCK_MEETINGS, MOCK_COLLECTIONS, MOCK_ROLE_PRESETS, MOCK_MESSAGES, MOCK_TASKS } from './data';
import { resetAllAppDataToDefaults } from './utils/resetData';

import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { Menu, Sparkles, Bell, LayoutDashboard, Calendar as CalendarIcon, MessageSquare, Users } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab | 'student-profile'>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('vault_theme') as 'dark' | 'light') || 'dark';
  });

  const [authType, setAuthType] = useState<'none' | 'staff' | 'student'>(() => {
    return (localStorage.getItem('vault_authType') as 'none' | 'staff' | 'student') || 'none';
  });
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>(() => {
    return localStorage.getItem('vault_activeEmployeeId') || '1';
  });
  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    return localStorage.getItem('vault_activeStudentId') || '';
  });
  const [isAdminInStudentMode, setIsAdminInStudentMode] = useState<boolean>(() => {
    return localStorage.getItem('vault_admin_student_mode') === 'true';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  
  const loadState = (key, fallback) => {
    try {
      const stored = localStorage.getItem('vault_state_' + key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  const [employees, setEmployees, employeesLoaded] = useFirebaseSync<Employee>('employees', MOCK_EMPLOYEES);
  const [rolePresets, setRolePresets, rolePresetsLoaded] = useFirebaseSync<RolePreset>('rolePresets', MOCK_ROLE_PRESETS);
  const [students, setStudents, studentsLoaded] = useFirebaseSync<Student>('students', MOCK_STUDENTS);
  const [groups, setGroups, groupsLoaded] = useFirebaseSync<Group>('groups', MOCK_GROUPS);
  const [collections, setCollections, collectionsLoaded] = useFirebaseSync<BookCollection>('collections', MOCK_COLLECTIONS);
  const [classSessions, setClassSessions, classSessionsLoaded] = useFirebaseSync<ClassSession>('classSessions', MOCK_CLASS_SESSIONS);
  const [transactions, setTransactions, transactionsLoaded] = useFirebaseSync<Transaction>('transactions', MOCK_TXS);
  const [occurrences, setOccurrences, occurrencesLoaded] = useFirebaseSync<Occurrence>('occurrences', MOCK_OCCURRENCES);
  const [tasks, setTasks, tasksLoaded] = useFirebaseSync<Task>('tasks', MOCK_TASKS);
  const [meetings, setMeetings, meetingsLoaded] = useFirebaseSync<Meeting>('meetings', MOCK_MEETINGS);
  const [employeeMessages, setEmployeeMessages, employeeMessagesLoaded] = useFirebaseSync<EmployeeChatMessage>('employee_messages', MOCK_MESSAGES);
  const [appAccesses, setAppAccesses, appAccessesLoaded] = useFirebaseSync<AppAccess>('app_accesses', []);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Initialize staff members once loaded, ensuring master permissions while preserving all custom edits
  const initializedStaffRef = useRef(false);
  useEffect(() => {
    if (employeesLoaded && !initializedStaffRef.current) {
      initializedStaffRef.current = true;
      const seenUsernames = new Set<string>();
      const deduped: Employee[] = [];

      for (const emp of employees) {
        const u = (emp.username || '').toLowerCase().trim();
        if (!u || seenUsernames.has(u)) continue;
        seenUsernames.add(u);

        if (u === 'arthur' || emp.id === '1') {
          deduped.push({
            ...emp,
            id: emp.id || '1',
            name: emp.name || 'Arthur',
            roleTitle: emp.roleTitle || 'Master',
            isMaster: emp.isMaster !== undefined ? emp.isMaster : true,
            isAssociate: emp.isAssociate !== undefined ? emp.isAssociate : true,
            birthday: emp.birthday || '2006-08-04',
            permissions: emp.permissions?.length ? emp.permissions : [
              'dashboard', 'calendar', 'students', 'groups', 'collections', 'teacher', 'finance', 'occurrences', 'tasks', 'staff', 'preferences', 'meetings', 'chat',
              'edit:students', 'edit:groups', 'edit:collections', 'edit:finance', 'edit:occurrences', 'edit:tasks', 'edit:staff', 'edit:chat',
              'admin', 'manage:staff', 'manage:roles', 'delete:records', 'delete:superadmin', 'manage:master'
            ]
          });
        } else {
          deduped.push(emp);
        }
      }

      // If empty or missing Arthur, ensure default Arthur exists
      if (!seenUsernames.has('arthur')) {
        const defaultArthur = MOCK_EMPLOYEES.find(m => m.username === 'arthur');
        if (defaultArthur) {
          deduped.unshift(defaultArthur);
        }
      }

      if (deduped.length !== employees.length || JSON.stringify(deduped) !== JSON.stringify(employees)) {
        setEmployees(deduped);
      }
    }
  }, [employeesLoaded, employees, setEmployees]);

  // Birthday notifications generator
  useEffect(() => {
    if (authType === 'staff') {
      const today = new Date();
      const currentM = today.getMonth() + 1;
      const currentD = today.getDate();
      
      const newNotifications: AppNotification[] = [];
      const allPeople = [...employees, ...students];
      
      const parseBirthday = (bday: string): { month: number; day: number } | null => {
        if (!bday || typeof bday !== 'string') return null;
        const clean = bday.trim();
        if (clean.includes('/')) {
          const parts = clean.split('/');
          if (parts.length >= 2) {
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            if (!isNaN(d) && !isNaN(m) && m >= 1 && m <= 12) return { month: m, day: d };
          }
        } else if (clean.includes('-')) {
          const parts = clean.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              const m = parseInt(parts[1], 10);
              const d = parseInt(parts[2], 10);
              if (!isNaN(m) && !isNaN(d)) return { month: m, day: d };
            } else {
              const d = parseInt(parts[0], 10);
              const m = parseInt(parts[1], 10);
              if (!isNaN(d) && !isNaN(m)) return { month: m, day: d };
            }
          }
        }
        return null;
      };

      allPeople.forEach(person => {
        if (!person.birthday) return;
        const parsed = parseBirthday(person.birthday);
        if (!parsed) return;
        const { month: m, day: d } = parsed;
        
        // Check for today
        if (m === currentM && d === currentD) {
          const id = `bday-${person.id}-${today.getFullYear()}`;
          if (!notifications.some(n => n.id === id)) {
            newNotifications.push({
              id,
              employeeId: activeEmployeeId,
              title: 'Birthday Today! 🎉',
              message: `Today is ${person.name}'s birthday!`,
              timestamp: new Date().toISOString(),
              read: false,
              type: 'system'
            });
          }
        }
        
        // Check for 7 days from now
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        if (m === nextWeek.getMonth() + 1 && d === nextWeek.getDate()) {
          const id = `bday-7d-${person.id}-${today.getFullYear()}`;
          if (!notifications.some(n => n.id === id)) {
            newNotifications.push({
              id,
              employeeId: activeEmployeeId,
              title: 'Upcoming Birthday',
              message: `${person.name}'s birthday is in 7 days!`,
              timestamp: new Date().toISOString(),
              read: false,
              type: 'system'
            });
          }
        }
      });
      
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
      }
    }
  }, [employees, students, authType, notifications, activeEmployeeId]);


  
  useEffect(() => {
    localStorage.setItem('vault_authType', authType);
  }, [authType]);

  useEffect(() => {
    localStorage.setItem('vault_activeEmployeeId', activeEmployeeId);
  }, [activeEmployeeId]);

  useEffect(() => {
    localStorage.setItem('vault_activeStudentId', activeStudentId);
  }, [activeStudentId]);

  // Synchronize theme to document root
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('vault_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  
  // Auto-save to LocalStorage removed in favor of Firebase sync

  // Auto-save to Google Drive periodically
  useEffect(() => {
    const syncToDrive = async () => {
      try {
        const { uploadBackupToDrive } = await import('./lib/driveApi');
        const backupData = {
          version: '1.0',
          timestamp: new Date().toISOString(),
          data: {
            employees, rolePresets, students, groups, collections, classSessions, transactions, occurrences, tasks, meetings
          }
        };
        await uploadBackupToDrive(JSON.stringify(backupData, null, 2), `vault_autobackup_${new Date().toISOString().split('T')[0]}.json`);
        console.log("Successfully auto-saved to Google Drive");
      } catch (err) {
        if (err.message !== "Authentication required") { console.error("Auto-save to Google Drive failed", err); }
      }
    };
    
    // Auto-save every 5 minutes if authenticated
    const interval = setInterval(syncToDrive, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [employees, rolePresets, students, groups, collections, classSessions, transactions, occurrences, tasks, meetings]);

  const activeEmployee = employees.find(e => e.id === activeEmployeeId) || employees[0];

  const handleRestoreSystemData = (parsedData: any) => {
    try {
      if (parsedData && parsedData.data) {
        if (Array.isArray(parsedData.data.employees) && parsedData.data.employees.length > 0) setEmployees(parsedData.data.employees);
        if (Array.isArray(parsedData.data.students)) setStudents(parsedData.data.students);
        if (Array.isArray(parsedData.data.groups)) setGroups(parsedData.data.groups);
        if (Array.isArray(parsedData.data.collections)) setCollections(parsedData.data.collections);
        if (Array.isArray(parsedData.data.classSessions)) setClassSessions(parsedData.data.classSessions);
        if (Array.isArray(parsedData.data.transactions)) setTransactions(parsedData.data.transactions);
        if (Array.isArray(parsedData.data.occurrences)) setOccurrences(parsedData.data.occurrences);
        if (Array.isArray(parsedData.data.meetings)) setMeetings(parsedData.data.meetings);
        if (Array.isArray(parsedData.data.rolePresets)) setRolePresets(parsedData.data.rolePresets);
        if (Array.isArray(parsedData.data.tasks)) setTasks(parsedData.data.tasks);
        if (Array.isArray(parsedData.data.employeeMessages)) setEmployeeMessages(parsedData.data.employeeMessages);
      }
    } catch (e) {
      console.error("Failed to restore system data", e);
    }
  };

  const handleResetAllData = async () => {
    try {
      // 1. Immediately reset state in memory
      setEmployees(MOCK_EMPLOYEES);
      setRolePresets(MOCK_ROLE_PRESETS);
      setStudents(MOCK_STUDENTS);
      setGroups(MOCK_GROUPS);
      setCollections(MOCK_COLLECTIONS);
      setClassSessions(MOCK_CLASS_SESSIONS);
      setTransactions(MOCK_TXS);
      setOccurrences(MOCK_OCCURRENCES);
      setTasks(MOCK_TASKS);
      setMeetings(MOCK_MEETINGS);
      setEmployeeMessages(MOCK_MESSAGES);
      setSelectedStudent(null);
      setSelectedGroup(null);
      setNotifications([]);

      // 2. Persist fresh defaults to Firestore & clear local caches
      await resetAllAppDataToDefaults();
    } catch (err) {
      console.error("Failed to reset application data", err);
    }
  };

  const handleNavigate = (type: any, idOrName?: string) => {
    if (type === 'student' && idOrName) {
      const student = students.find(s => s.id === idOrName || s.name === idOrName);
      if (student) {
        setSelectedStudent(student);
        setActiveTab('student-profile');
      }
    } else if (type === 'group' && idOrName) {
      const group = groups.find(g => g.id === idOrName || g.name === idOrName || g.code === idOrName);
      if (group) {
        setSelectedGroup(group);
        setActiveTab('groups');
      }
    } else if (type === 'collections') {
      setActiveTab('collections');
    } else if (type === 'staff') {
      setActiveTab('staff');
    } else if (type === 'groups') {
      setActiveTab('groups');
    } else if (type === 'students') {
      setActiveTab('students');
    } else if (type === 'finance') {
      setActiveTab('finance');
    } else if (type === 'calendar') {
      setActiveTab('calendar');
    } else if (type === 'meetings') {
      setActiveTab('meetings');
    } else if (type === 'tasks') {
      setActiveTab('tasks');
    } else if (type === 'occurrences') {
      setActiveTab('occurrences');
    } else if (type === 'dashboard') {
      setActiveTab('dashboard');
    } else if (type === 'game') {
      setActiveTab('game');
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setActiveTab('student-profile');
  };

  const handleAddEmployee = (emp: Employee) => {
    setEmployees([...employees, emp]);
  };

  const handleUpdateEmployee = (updated: Employee) => {
    setEmployees(employees.map(e => e.id === updated.id ? updated : e));
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
    if (activeEmployeeId === id && employees.length > 1) {
      const fallback = employees.find(e => e.id !== id);
      if (fallback) setActiveEmployeeId(fallback.id);
    }
  };

  
  const handleDeleteStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };
  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
  };

  const handleSwitchToStudentMode = (targetStudentId?: any) => {
    setIsAdminInStudentMode(true);
    localStorage.setItem('vault_admin_student_mode', 'true');
    let resolvedId = '';
    if (typeof targetStudentId === 'string' && targetStudentId && targetStudentId !== '[object Object]') {
      resolvedId = targetStudentId;
    } else if (activeStudentId && typeof activeStudentId === 'string' && activeStudentId !== '[object Object]') {
      resolvedId = activeStudentId;
    } else if (students.length > 0) {
      resolvedId = students[0].id;
    } else {
      resolvedId = 'preview-student-demo';
    }
    setActiveStudentId(resolvedId);
    setAuthType('student');
  };

  const handleExitStudentMode = () => {
    setIsAdminInStudentMode(false);
    localStorage.removeItem('vault_admin_student_mode');
    setAuthType('staff');
  };

  const handleAddStudent = (student: Student) => {
    setStudents([...students, student]);
  };

  const addNotification = (type: 'schedule' | 'occurrence' | 'system', title: string, message: string, targetEmployeeName?: string) => {
    // If targetEmployeeName is provided, find that employee. Else send to active.
    let targetId = activeEmployeeId;
    if (targetEmployeeName) {
      const target = employees.find(e => e.name === targetEmployeeName);
      if (target) targetId = target.id;
    }
    
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      employeeId: targetId,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleUpdateStudent = (updated: Student) => {
    setStudents(students.map(s => s.id === updated.id ? updated : s));
    if (selectedStudent?.id === updated.id) {
      setSelectedStudent(updated);
    }
  };

  const handleAddGroup = (group: Group) => {
    setGroups([...groups, group]);
    addNotification('schedule', 'New Group Assigned', `You have been assigned to group ${group.name || group.code}.`, group.teacher);
  };

  const handleUpdateGroups = (updatedGroups: Group[]) => {
    setGroups(prev => {
      let next = [...prev];
      for (const ug of updatedGroups) {
        next = next.map(g => g.id === ug.id ? ug : g);
      }
      return next;
    });
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    const oldGroup = groups.find(g => g.id === updatedGroup.id);
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
    if (selectedGroup?.id === updatedGroup.id) {
      setSelectedGroup(updatedGroup);
    }
    if (oldGroup && oldGroup.schedule !== updatedGroup.schedule) {
      addNotification('schedule', 'Schedule Changed', `The schedule for group ${updatedGroup.name || updatedGroup.code} has been updated to ${updatedGroup.schedule}.`, updatedGroup.teacher);
    } else if (oldGroup && oldGroup.teacher !== updatedGroup.teacher) {
      addNotification('schedule', 'Teacher Reassigned', `You have been assigned to group ${updatedGroup.name || updatedGroup.code}.`, updatedGroup.teacher);
    }
  };

  const handleAddCollection = (col: BookCollection) => {
    setCollections([...collections, col]);
  };

  const handleUpdateCollection = (updatedCol: BookCollection) => {
    setCollections(collections.map(c => c.id === updatedCol.id ? updatedCol : c));
  };

  const handleDeleteCollection = (id: string) => {
    setCollections(collections.filter(c => c.id !== id));
  };

  const handleAddOccurrence = (occurrence: Occurrence) => {
    setOccurrences([occurrence, ...occurrences]);
    const student = students.find(s => s.id === occurrence.studentId);
    if (student) {
      // Find the teacher of this student
      const group = groups.find(g => g.code === student.group || g.name === student.group);
      if (group && group.teacher) {
        addNotification('occurrence', 'New Occurrence Logged', `A new ${occurrence.type} occurrence was logged for ${student.name}.`, group.teacher);
      }
    }
  };

  const handleUpdateOccurrence = (updated: Occurrence) => {
    setOccurrences(occurrences.map(o => o.id === updated.id ? updated : o));
    const student = students.find(s => s.id === updated.studentId);
    if (student) {
      const group = groups.find(g => g.code === student.group || g.name === student.group);
      if (group && group.teacher) {
        addNotification('occurrence', 'Occurrence Updated', `An occurrence for ${student.name} was updated.`, group.teacher);
      }
    }
  };

  const handleDeleteOccurrence = (id: string) => {
    setOccurrences(occurrences.filter(o => o.id !== id));
  };

  const handleAddTransaction = (transaction: Transaction) => {
    setTransactions([transaction, ...transactions]);
  };

  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions(transactions.map(t => t.id === updated.id ? updated : t));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleUpdateClassSession = (updatedSession: ClassSession) => {
    setClassSessions(classSessions.map(cs => cs.id === updatedSession.id ? updatedSession : cs));
  };

  const handleDeleteClassSession = (id: string) => {
    setClassSessions(classSessions.filter(cs => cs.id !== id));
  };

  const handleAddClassSession = (session: ClassSession) => {
    setClassSessions([session, ...classSessions]);
  };

  const handleBulkAddClassSessions = (sessions: ClassSession[]) => {
    setClassSessions(prev => [...sessions, ...prev]);
  };


  const handleAddMeeting = (newMeeting: Meeting) => {
    setMeetings([newMeeting, ...meetings]);
    newMeeting.attendees.forEach(empId => {
      if (empId !== activeEmployeeId) {
        const emp = employees.find(e => e.id === empId);
        if (emp) {
          addNotification('schedule', 'New Meeting Scheduled', `${newMeeting.organizerName} scheduled "${newMeeting.title}" for ${newMeeting.date} at ${newMeeting.time}.`, emp.name);
        }
      }
    });
  };

  const handleUpdateMeeting = (updated: Meeting) => {
    setMeetings(meetings.map(m => m.id === updated.id ? updated : m));
    updated.attendees.forEach(empId => {
      if (empId !== activeEmployeeId) {
        const emp = employees.find(e => e.id === empId);
        if (emp) {
          addNotification('schedule', 'Meeting Updated', `The meeting "${updated.title}" has been updated.`, emp.name);
        }
      }
    });
  };

  const handleSendMessage = (msg: EmployeeChatMessage) => {
    setEmployeeMessages(prev => [...prev, msg]);
  };

  const handleDeleteMessage = (id: string) => {
    setEmployeeMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleMarkMessageRead = (messageId: string, readerId: string) => {
    setEmployeeMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      const readers = msg.readBy || [];
      if (readers.includes(readerId)) return msg;
      return { ...msg, readBy: [...readers, readerId] };
    }));
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    setEmployeeMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      const existingReactions = msg.reactions || [];
      const targetReaction = existingReactions.find(r => r.emoji === emoji);

      let updatedReactions: EmployeeMessageReaction[];
      if (targetReaction) {
        if (targetReaction.users.includes(activeEmployee.id)) {
          const updatedUsers = targetReaction.users.filter(uid => uid !== activeEmployee.id);
          if (updatedUsers.length === 0) {
            updatedReactions = existingReactions.filter(r => r.emoji !== emoji);
          } else {
            updatedReactions = existingReactions.map(r => r.emoji === emoji ? { ...r, users: updatedUsers } : r);
          }
        } else {
          updatedReactions = existingReactions.map(r => r.emoji === emoji ? { ...r, users: [...r.users, activeEmployee.id] } : r);
        }
      } else {
        updatedReactions = [...existingReactions, { emoji, users: [activeEmployee.id] }];
      }

      return { ...msg, reactions: updatedReactions };
    }));
  };

  const handleTogglePin = (messageId: string) => {
    setEmployeeMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      return { ...msg, pinned: !msg.pinned };
    }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            groups={groups}
 
            employees={employees} 
            activeEmployee={activeEmployee}
            meetings={meetings}
            classSessions={classSessions}
            onAddMeeting={handleAddMeeting}
            onUpdateGroup={handleUpdateGroup}
            onUpdateGroups={handleUpdateGroups}
            onNavigate={handleNavigate}
             
          />
        );
      case 'calendar':
        return (
          <Calendar
            students={students}
            groups={groups}

            employees={employees}
            activeEmployee={activeEmployee}
            meetings={meetings}
            classSessions={classSessions}
            onAddMeeting={handleAddMeeting}
            onUpdateMeeting={handleUpdateMeeting}
            onNavigate={handleNavigate}
          />
        );
      case 'students':
        return (
          <StudentDirectory 
            students={students} 
            groups={groups}
            activeEmployee={activeEmployee} 
            onSelectStudent={handleSelectStudent} 
            onAddStudent={handleAddStudent} 
            onNavigate={handleNavigate}
            onSwitchToStudentMode={handleSwitchToStudentMode}
          />
        );
      case 'student-profile':
        if (!selectedStudent) {
          setActiveTab('students');
          return null;
        }
        return (
          <StudentProfile 
            student={selectedStudent} 
            activeEmployee={activeEmployee}
            occurrences={occurrences}
            transactions={transactions}
            groups={groups}
            classSessions={classSessions}
            onBack={() => setActiveTab('students')} 
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onNavigate={handleNavigate} 
            onAddOccurrence={handleAddOccurrence}
            onSwitchToStudentMode={handleSwitchToStudentMode}
          />
        );
      case 'groups':
        return (
          <Groups 
            groups={groups}
 
            students={students} 
            employees={employees} 
            activeEmployee={activeEmployee} 
            classSessions={classSessions}
            collections={collections}
            onAddGroup={handleAddGroup} 
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup} 
            onUpdateClassSession={handleUpdateClassSession}
            onAddClassSession={handleAddClassSession}
            onDeleteClassSession={handleDeleteClassSession}
            onBulkAddClassSessions={handleBulkAddClassSessions}
            selectedGroup={selectedGroup} 
            onSelectGroup={setSelectedGroup} 
            onNavigate={handleNavigate} 
          />
        );
      case 'collections':
        return (
          <CollectionsManager
            collections={collections}
            groups={groups}

            students={students}
            activeEmployee={activeEmployee}
            onAddCollection={handleAddCollection}
            onUpdateCollection={handleUpdateCollection}
            onDeleteCollection={handleDeleteCollection}
            onUpdateGroup={handleUpdateGroup}
            onNavigate={handleNavigate}
          />
        );
      case 'teacher':
        return <TeacherPortal activeEmployee={activeEmployee} groups={groups}
 onNavigate={handleNavigate} />;
      case 'finance':
        return (
          <Finance 
            transactions={transactions} 
            students={students}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onNavigate={handleNavigate} 
          />
        );
      case 'occurrences':
        return (
          <Occurrences 
            occurrences={occurrences} 
            students={students}
            onAddOccurrence={handleAddOccurrence}
            onUpdateOccurrence={handleUpdateOccurrence}
            onDeleteOccurrence={handleDeleteOccurrence}
            onNavigate={handleNavigate} 
          />
        );
      case 'tasks':
        return <TaskManager currentRole={activeEmployee.username} employees={employees} onNavigate={handleNavigate} tasks={tasks} setTasks={setTasks} />;
      case 'meetings':
        return (
          <Meetings 
            activeEmployee={activeEmployee} 
            employees={employees} 
            meetings={meetings}
            onAddMeeting={handleAddMeeting}
          />
        );
      case 'staff':
        return (
          <StaffManager 
            employees={employees} 
            activeEmployee={activeEmployee}
            rolePresets={rolePresets}
            setRolePresets={setRolePresets}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        );
      case 'preferences':
        return (
          <Preferences 
            activeEmployee={activeEmployee} 
            onUpdateEmployee={handleUpdateEmployee}
            theme={theme}
            onToggleTheme={(t) => setTheme(t)}
            onSwitchToStudentMode={handleSwitchToStudentMode}
            onRestoreSystemData={handleRestoreSystemData}
            onResetSystemData={handleResetAllData}
            appAccesses={appAccesses}
            onUpdateAccess={(acc) => {
              if (appAccesses.some(a => a.id === acc.id)) {
                setAppAccesses(prev => prev.map(a => a.id === acc.id ? acc : a));
              } else {
                setAppAccesses(prev => [...prev, acc]);
              }
            }}
            onDeleteAccess={(id) => setAppAccesses(prev => prev.filter(a => a.id !== id))}
            employees={employees}
            setEmployees={setEmployees}
            students={students}
            setStudents={setStudents}
            systemData={{
              employees,
              students,
              groups,
              collections,
              classSessions,
              transactions,
              occurrences,
              meetings,
              tasks,
              employeeMessages,
              rolePresets
            }}
          />
        );
      case 'game':
        return <World student={activeEmployee as any} isTeacher={true} />;
      case 'chat':
        return (
          <Chat
            activeEmployee={activeEmployee}
            employees={employees}
            messages={employeeMessages}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onToggleReaction={handleToggleReaction}
            onTogglePin={handleTogglePin}
            onMarkMessageRead={handleMarkMessageRead}
          />
        );
      default:
        return null;
    }
  };

  
  const isDataLoaded = employeesLoaded && rolePresetsLoaded && studentsLoaded && groupsLoaded && collectionsLoaded && classSessionsLoaded && transactionsLoaded && occurrencesLoaded && tasksLoaded && meetingsLoaded && employeeMessagesLoaded && appAccessesLoaded;

  if (!isDataLoaded) {
    return (
      <div className="min-h-[100dvh] bg-brand-dark flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Syncing Vault Data...</p>
        </div>
      </div>
    );
  }

  if (authType === 'none') {
    return (
      <Login 
        employees={employees}
        students={students}
        appAccesses={appAccesses}
        onUpdateAccess={(acc) => {
          if (appAccesses.some(a => a.id === acc.id)) {
            setAppAccesses(prev => prev.map(a => a.id === acc.id ? acc : a));
          } else {
            setAppAccesses(prev => [...prev, acc]);
          }
        }}
        onLoginStaff={(id) => {
          setActiveEmployeeId(id);
          setAuthType('staff');
        }}
        onLoginStudent={(id) => {
          setActiveStudentId(id);
          setAuthType('student');
        }}
      />
    );
  }

  if (authType === 'student') {
    const fallbackDemoStudent: Student = {
      id: 'preview-student-demo',
      name: 'Demo Student (Preview)',
      username: 'demo.student',
      status: 'active',
      major: 'English Language',
      group: groups.length > 0 ? (groups[0].code || groups[0].id || '1') : '1',
      phone: '+55 (11) 99999-8888',
      email: 'student@vault.edu',
      timezone: 'BRT (Brasília)'
    };

    const student = (students.length > 0 && typeof activeStudentId === 'string' && activeStudentId && activeStudentId !== '[object Object]' && students.find(s => s.id === activeStudentId))
      || (students.length > 0 ? students[0] : null)
      || fallbackDemoStudent;

    return (
      <StudentApp 
        student={student}
        allStudents={students.length > 0 ? students : [fallbackDemoStudent]}
        onSelectStudent={(id) => setActiveStudentId(id)}
        groups={groups}
        classSessions={classSessions}
        transactions={transactions}
        onLogout={() => {
          setIsAdminInStudentMode(false);
          localStorage.removeItem('vault_admin_student_mode');
          signOut(auth).then(() => { console.log('Signed out!'); setAuthType('none'); }).catch(e => console.error('Sign out error:', e));
        }}
        onUpdateStudent={(updated) => {
          if (students.some(s => s.id === updated.id)) {
            handleUpdateStudent(updated);
          } else {
            setStudents(prev => [...prev, updated]);
          }
        }}
        isAdminViewing={isAdminInStudentMode}
        activeEmployee={activeEmployee}
        onExitStudentMode={handleExitStudentMode}
        messages={employeeMessages}
        onSendMessage={handleSendMessage}
        onDeleteMessage={handleDeleteMessage}
        onToggleReaction={handleToggleReaction}
        onTogglePin={handleTogglePin}
        onMarkMessageRead={handleMarkMessageRead}
      />
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row overflow-hidden bg-brand-dark text-slate-200">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-brand-card border-b border-brand-border shrink-0 z-40 relative shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-700 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent leading-none">
            Vault
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white bg-brand-dark rounded-lg border border-brand-border cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeEmployee={activeEmployee} 
        employees={employees}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSwitchEmployee={setActiveEmployeeId} 
        onNavigate={handleNavigate}
        onLogout={() => { console.log('Signing out...'); signOut(auth).then(() => { console.log('Signed out!'); setAuthType('none'); }).catch(e => console.error('Sign out error:', e)); }}
        onSwitchToStudentMode={handleSwitchToStudentMode}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar relative min-w-0">
        
        <div className="max-w-[1680px] w-full mx-auto space-y-6 pb-20 md:pb-0">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Staff Bottom Navigation Dock */}
      <nav className="md:hidden flex bg-brand-card/95 backdrop-blur-md border-t border-brand-border shrink-0 z-30 pb-safe">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
          { id: 'chat', label: 'Chat', icon: MessageSquare, badge: employeeMessages.length > 0 ? String(employeeMessages.length) : undefined },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'menu', label: 'Menu', icon: Menu, isMenu: true }
        ].map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isMenu) {
                  setIsMobileMenuOpen(true);
                } else {
                  setActiveTab(item.id as Tab);
                  setIsMobileMenuOpen(false);
                }
              }}
              className={`flex-1 py-2.5 flex flex-col items-center justify-center transition cursor-pointer relative ${
                isActive ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <item.icon className="w-4 h-4" />
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

      <VaultCallOverlay currentUser={activeEmployee} employees={employees} students={students} />
    </div>
  );
}
