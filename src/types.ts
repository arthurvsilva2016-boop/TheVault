export type Role = string;
export type Tab = 'dashboard' | 'calendar' | 'students' | 'groups' | 'collections' | 'teacher' | 'finance' | 'occurrences' | 'tasks' | 'student-profile' | 'staff' | 'preferences' | 'meetings' | 'chat' | 'game';
export type Permission = Tab | 'dashboard:all' | 'calendar:all' | 'groups:all' |  'edit:students' | 'edit:groups' | 'edit:collections' | 'edit:finance' | 'edit:occurrences' | 'edit:tasks' | 'edit:staff' | 'edit:chat' | 'admin' | 'manage:staff' | 'manage:roles' | 'delete:records' | 'delete:superadmin' | 'manage:master';

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
  size?: number;
  mimeType?: string;
}

export interface WhiteboardStroke {
  id: string;
  tool: 'pen' | 'highlighter' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle';
  points: { x: number; y: number }[];
  color: string;
  size: number;
  opacity?: number;
}

export interface WhiteboardText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

export interface WhiteboardSticky {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string; // bg color e.g. '#fef08a'
  author?: string;
}

export interface WhiteboardImage {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
  name?: string;
}

export interface WhiteboardState {
  strokes: WhiteboardStroke[];
  texts: WhiteboardText[];
  stickies: WhiteboardSticky[];
  images: WhiteboardImage[];
  imageString?: string;
  updatedAt?: string;
}

export interface EmployeeMessageReaction {
  emoji: string;
  users: string[]; // employee ids
}

export interface EmployeeChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  isAssociate?: boolean;
  channelId: string; // 'general' | 'teachers' | 'announcements' | 'urgent' | 'dm_{id1}_{id2}'
  text: string;
  timestamp: string;
  attachments?: ChatAttachment[];
  reactions?: EmployeeMessageReaction[];
  pinned?: boolean;
  readBy?: string[];
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  type: 'channel' | 'dm';
  icon?: string;
  unreadCount?: number;
  recipientEmployeeId?: string;
  isPrivate?: boolean;
}

export interface WhiteboardFile {
  id: string;
  title: string;
  timestamp: string;
  teacherName?: string;
  authorName?: string;
  topic?: string;
  groupId?: string;
  sessionId?: string;
  collectionId?: string;
  unitNumber?: number;
  imageDataUrl: string;
  pdfDataUrl?: string;
  stateSnapshot?: WhiteboardState;
}

export interface SlideBox {
  id: string;
  type: 'text' | 'callout' | 'quote' | 'formula' | 'shape' | 'note';
  title?: string;
  content: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  alignment?: 'left' | 'center' | 'right';
  widthPercent?: number;
}

export interface SlideImage {
  id: string;
  url: string;
  caption?: string;
  position?: 'inline' | 'left' | 'right' | 'top' | 'background';
  widthPercent?: number;
}

export interface SlideItem {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  vocabulary?: string[];
  grammarRule?: string;
  dialogue?: { speaker: string; text: string }[];
  bulletPoints?: string[];
  imageUrl?: string;
  imageCaption?: string;
  images?: SlideImage[];
  boxes?: SlideBox[];
  exercisePrompt?: string;
  exerciseAnswer?: string;
  notes?: string; // Speaker/Teacher notes
  backgroundColor?: string;
  themeColor?: string;
}

export interface GroupCustomSlideshow {
  id: string;
  groupId: string;
  unitNumber: number;
  unitTitle: string;
  theme?: string;
  embedUrl?: string;
  slides: SlideItem[];
  originalCollectionId?: string;
  originalVolumeId?: string;
  editedByTeacherId: string;
  editedByTeacherName: string;
  updatedAt: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  assignedApproverId?: string;
  assignedApproverName?: string;
  approverRole?: string;
  approvalNotes?: string;
  teacherSubmissionNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface UnitSlideshow {
  id: string;
  collectionId: string;
  volumeId?: string;
  unitNumber: number;
  unitTitle: string;
  theme?: string;
  embedUrl?: string;
  slides: SlideItem[];
  savedWhiteboards?: WhiteboardFile[];
  pdfDownloadUrl?: string;
  lastUpdated?: string;
}

export interface BookVolume {
  id: string;
  name: string; // e.g. "Vol 1", "Vol 2", "Starter", "Level 1"
  description?: string;
  unitsCount?: number;
}

export interface BookCollection {
  id: string;
  name: string; // e.g. "Amethyst", "Obsidian", "Quartz", "Cambridge Touchstone"
  description?: string;
  category?: 'General English' | 'Business English' | 'Exam Prep' | 'Kids & Teens' | 'Custom';
  volumes: BookVolume[];
  unitSlideshows?: UnitSlideshow[];
  createdAt?: string;
}

export interface RolePreset {
  id: string;
  name: string; // e.g. "Teacher", "Coordinator", "Receptionist"
  permissions: (Tab | Permission)[];
  isAssociate?: boolean;
}

export interface AppNotification {
  id: string;
  employeeId: string; // The employee this notification is meant for
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'schedule' | 'occurrence' | 'system';
}

export interface AppAccess {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  lastAccess: string;
  status: 'pending' | 'assigned_staff' | 'assigned_student';
}

export interface Employee {
  id: string;
  username: string;
  name: string;
  roleTitle: string;
  password?: string;
  birthday?: string;
  avatarUrl?: string;
  permissions: (Tab | Permission)[];
  isAssociate: boolean;
  isMaster?: boolean;
  isCoordinator?: boolean;
  email?: string;
  phone?: string;
}

export interface Student {
  id: string;
  name: string;
  major: string;
  avatarUrl?: string;
  group?: string; // Group code number e.g. "1", "2", "3"
  phone: string;
  email: string;
  timezone: string;
  username: string;
  birthday?: string;
  tempPassword?: string;
  password?: string;
  mustChangePassword?: boolean;
  lastLogin?: string;
  status: 'active' | 'enrolled' | 'concluded' | 'paused';
  lastBook?: string;
  attendance?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface ClassSessionAttendance {
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'pending';
  note?: string;
}

export interface ClassSessionGrades {
  studentId: string;
  studentName: string;
  speaking: string;
  listening: string;
  homework: string;
  feedback?: string;
}

export interface ClassSession {
  id: string;
  groupId: string;
  groupCode: string;
  date: string;
  days?: string[];
  endDate?: string; // YYYY-MM-DD
  time: string;
  topic: string;
  teacher: string;
  teacherName?: string;
  meetLink?: string;
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  attendance: ClassSessionAttendance[];
  grades: ClassSessionGrades[];
  whiteboardFiles?: WhiteboardFile[];
}

export interface Group {
  id: string;
  code: string; // "1", "2", "3"
  name?: string;
  coverImage?: string;
  level: string;
  collectionId?: string;
  volumeId?: string;
  teacher?: string;
  schedule: string;
  startDate: string;
  endDate: string;
  studentsCount: number;
  meetLink: string;
  status?: 'upcoming' | 'active' | 'completed' | 'waiting';
  isWaitingForStudents?: boolean;
  grades?: { studentId: string; speaking: string; listening: string; homework: string }[];
  messages?: ChatMessage[];
  whiteboardFiles?: WhiteboardFile[];
  customSlideshows?: GroupCustomSlideshow[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  organizerId: string;
  organizerName: string;
  attendees: string[];
  link: string; // Internal Vault Room Code e.g. "vault-room-..."
  days?: string[];
  endDate?: string;
}

export type CallType = 'class' | 'meeting' | '1on1';

export interface CallParticipant {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  isLocal?: boolean;
  isTeacher?: boolean;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing?: boolean;
  isSpeaking?: boolean;
  isHandRaised?: boolean;
  joinedAt?: string;
  connectionQuality?: 'good' | 'fair' | 'poor';
}

export interface LiveCallSession {
  id: string;
  title: string;
  roomCode: string;
  type: CallType;
  groupId?: string;
  groupCode?: string;
  meetingId?: string;
  hostId: string;
  hostName: string;
  startedAt: string;
  participants: CallParticipant[];
  currentSlideIndex?: number;
  activeDeckSource?: 'custom' | 'curriculum';
  activeDeckId?: string;
  activeCollectionId?: string;
  activeVolumeId?: string;
  activeUnitNumber?: number;
  isWhiteboardOpen?: boolean;
  isChatOpen?: boolean;
  screenShareParticipantId?: string;
  screenShareRequest?: { participantId: string; name: string };
  screenShareApprovedFor?: string;
  messages: Array<{ id: string; senderId: string; senderName: string; text: string; time: string }>;
}


export interface Transaction {
  id: string;
  studentId?: string;
  studentName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  type: 'tuition' | 'material' | 'fee';
  paymentMethod?: 'PIX' | 'Credit Card' | 'Boleto' | 'Bank Transfer' | 'Cash';
  notes?: string;
}

export interface Occurrence {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  type: 'academic' | 'behavior' | 'attendance' | 'administrative';
  description: string;
  status: 'open' | 'resolved';
  reportedBy: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  observation?: string;
  relatedEntity?: string;
  deadline?: string;
  assignee: Role;
  createdBy: Role;
  status: 'todo' | 'in-progress' | 'done';
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  type: 'task' | 'contract' | 'meeting' | 'finance' | 'academic';
  title: string;
  text: string;
  time: string;
  read: boolean;
  targetTab?: Tab;
  targetId?: string;
}
