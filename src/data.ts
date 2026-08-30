import { Student, Group, Transaction, Occurrence, Task, Employee, ClassSession, Meeting, BookCollection, RolePreset, EmployeeChatMessage } from './types';

export const MOCK_COLLECTIONS: BookCollection[] = [];

export const MOCK_ROLE_PRESETS: RolePreset[] = [
  {
    id: 'rp-master',
    name: 'Master',
    isAssociate: true,
    permissions: [
      'dashboard', 'calendar', 'students', 'groups', 'collections', 'teacher', 'finance', 'occurrences', 'tasks', 'staff', 'preferences', 'meetings', 'chat',
      'edit:students', 'edit:groups', 'edit:collections', 'edit:finance', 'edit:occurrences', 'edit:tasks', 'edit:staff', 'edit:chat',
      'admin', 'manage:staff', 'manage:roles', 'delete:records', 'delete:superadmin', 'manage:master'
    ]
  },
  {
    id: 'rp-superadmin',
    name: 'Super Admin',
    isAssociate: true,
    permissions: [
      'dashboard', 'calendar', 'students', 'groups', 'collections', 'teacher', 'finance', 'occurrences', 'tasks', 'staff', 'preferences', 'meetings', 'chat',
      'edit:students', 'edit:groups', 'edit:collections', 'edit:finance', 'edit:occurrences', 'edit:tasks', 'edit:staff', 'edit:chat',
      'admin', 'manage:staff', 'manage:roles', 'delete:records'
    ]
  },
  {
    id: 'rp-1',
    name: 'Teacher',
    isAssociate: false,
    permissions: ['dashboard', 'calendar', 'teacher', 'tasks', 'meetings', 'chat']
  },
  {
    id: 'rp-2',
    name: 'Pedagogical Coordinator',
    isAssociate: false,
    permissions: ['dashboard', 'calendar', 'students', 'groups', 'teacher', 'tasks', 'meetings', 'chat', 'edit:students', 'edit:groups', 'edit:tasks']
  },
  {
    id: 'rp-3',
    name: 'Secretary',
    isAssociate: false,
    permissions: ['dashboard', 'calendar', 'students', 'groups', 'finance', 'occurrences', 'tasks', 'chat', 'edit:students', 'edit:finance', 'edit:occurrences']
  }
];

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    username: 'Arthur',
    name: 'Arthur',
    roleTitle: 'Master',
    isMaster: true,
    password: '040806',
    birthday: '2006-08-04',
    permissions: [
      'dashboard', 'calendar', 'students', 'groups', 'collections', 'teacher', 'finance', 'occurrences', 'tasks', 'staff', 'preferences', 'meetings', 'chat',
      'edit:students', 'edit:groups', 'edit:collections', 'edit:finance', 'edit:occurrences', 'edit:tasks', 'edit:staff', 'edit:chat',
      'admin', 'manage:staff', 'manage:roles', 'delete:records', 'delete:superadmin', 'manage:master'
    ],
    isAssociate: true,
  },
  {
    id: '2',
    username: 'Isa',
    name: 'Isabella Rodrigues Motta',
    roleTitle: 'Super Admin',
    password: '250406',
    birthday: '2006-04-25',
    permissions: [
      'dashboard', 'calendar', 'students', 'groups', 'collections', 'teacher', 'finance', 'occurrences', 'tasks', 'staff', 'preferences', 'meetings', 'chat',
      'edit:students', 'edit:groups', 'edit:collections', 'edit:finance', 'edit:occurrences', 'edit:tasks', 'edit:staff', 'edit:chat',
      'admin', 'manage:staff', 'manage:roles', 'delete:records'
    ],
    isAssociate: true,
  },
  {
    id: '3',
    username: 'doin',
    name: 'Gabriel Doin',
    roleTitle: 'Super Admin',
    password: '190302',
    birthday: '2002-03-19',
    permissions: [
      'dashboard', 'calendar', 'students', 'groups', 'collections', 'teacher', 'finance', 'occurrences', 'tasks', 'staff', 'preferences', 'meetings', 'chat',
      'edit:students', 'edit:groups', 'edit:collections', 'edit:finance', 'edit:occurrences', 'edit:tasks', 'edit:staff', 'edit:chat',
      'admin', 'manage:staff', 'manage:roles', 'delete:records'
    ],
    isAssociate: true,
  },
  {
    id: '4',
    username: 'benji',
    name: 'Benyamin Ortiz Godolfredo',
    roleTitle: 'Super Admin',
    password: '04032000',
    birthday: '2000-03-04',
    permissions: [
      'dashboard', 'calendar', 'students', 'groups', 'collections', 'teacher', 'finance', 'occurrences', 'tasks', 'staff', 'preferences', 'meetings', 'chat',
      'edit:students', 'edit:groups', 'edit:collections', 'edit:finance', 'edit:occurrences', 'edit:tasks', 'edit:staff', 'edit:chat',
      'admin', 'manage:staff', 'manage:roles', 'delete:records'
    ],
    isAssociate: true,
  }
];

export const MOCK_STUDENTS: Student[] = [];

export const MOCK_GROUPS: Group[] = [];

export const MOCK_CLASS_SESSIONS: ClassSession[] = [];

export const MOCK_TXS: Transaction[] = [];

export const MOCK_OCCURRENCES: Occurrence[] = [];

export const MOCK_TASKS: Task[] = [];

export const MOCK_MEETINGS: Meeting[] = [];

export const MOCK_MESSAGES: EmployeeChatMessage[] = [
  {
    id: 'msg-welcome-1',
    senderId: '1',
    senderName: 'Arthur',
    senderRole: 'Administrator',
    isAssociate: true,
    channelId: 'general',
    text: 'Welcome to the Staff Interemployee Chat! You can send real-time team messages, share files/images, and start direct chats with colleagues.',
    timestamp: new Date().toISOString(),
    reactions: [{ emoji: '👋', users: ['1'] }, { emoji: '🎉', users: ['1'] }]
  }
];
