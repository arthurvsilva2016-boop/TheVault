import { Group, Meeting, Employee } from '../types';

export interface ConflictDetail {
  type: 'group' | 'meeting';
  title: string;
  teacherName: string;
  dayOrDate: string;
  hour: string;
  description: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: ConflictDetail[];
  warningMessage?: string;
}

// Helper to extract hour string like "19:00" from schedule string
export function extractHour(scheduleStr: string): string {
  if (!scheduleStr) return '19:00';
  const match = scheduleStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const h = parseInt(match[1], 10);
    return `${String(h).padStart(2, '0')}:00`;
  }
  const lower = scheduleStr.toLowerCase();
  if (lower.includes('08:00') || lower.includes('8:00')) return '08:00';
  if (lower.includes('09:00') || lower.includes('9:00')) return '09:00';
  if (lower.includes('10:00')) return '10:00';
  if (lower.includes('11:00')) return '11:00';
  if (lower.includes('12:00')) return '12:00';
  if (lower.includes('13:00') || lower.includes('1:00')) return '13:00';
  if (lower.includes('14:00') || lower.includes('2:00')) return '14:00';
  if (lower.includes('15:00') || lower.includes('3:00')) return '15:00';
  if (lower.includes('16:00') || lower.includes('4:00')) return '16:00';
  if (lower.includes('17:00') || lower.includes('5:00')) return '17:00';
  if (lower.includes('18:00') || lower.includes('6:00')) return '18:00';
  if (lower.includes('19:00') || lower.includes('7:00')) return '19:00';
  if (lower.includes('20:00') || lower.includes('8:00')) return '20:00';
  if (lower.includes('21:00') || lower.includes('9:00')) return '21:00';
  return '19:00';
}

// Check if a group matches a day key ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')
export function groupMatchesDayKey(group: Group, dayKey: string): boolean {
  const sched = (group.schedule || '').toLowerCase();
  if (dayKey === 'Sun') return sched.includes('sun') || sched.includes('dom');
  if (dayKey === 'Mon') return sched.includes('mon') || sched.includes('seg');
  if (dayKey === 'Tue') return sched.includes('tue') || sched.includes('ter');
  if (dayKey === 'Wed') return sched.includes('wed') || sched.includes('qua');
  if (dayKey === 'Thu') return sched.includes('thu') || sched.includes('qui');
  if (dayKey === 'Fri') return sched.includes('fri') || sched.includes('sex');
  if (dayKey === 'Sat') return sched.includes('sat') || sched.includes('sab');
  return false;
}

// Convert day index (0=Sun, 1=Mon, ..., 6=Sat) to day key
export function getDayKeyFromDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const dayKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayKeys[d.getDay()] || 'Mon';
  } catch {
    return 'Mon';
  }
}

/**
 * Check if assigning a group to a teacher on a day & hour conflicts with existing groups or meetings
 */
export function checkGroupScheduleConflict(
  groupId: string,
  teacherName: string,
  dayKey: string,
  targetHour: string,
  allGroups: Group[],
  allMeetings: Meeting[],
  employees: Employee[]
): ConflictCheckResult {
  const conflicts: ConflictDetail[] = [];
  const normalizedTeacher = teacherName.toLowerCase().trim();
  const normalizedHour = extractHour(targetHour);

  // 1. Check existing groups taught by this teacher on the same day & hour (excluding the current group being edited)
  const conflictingGroups = allGroups.filter(g => {
    if (g.id === groupId) return false;
    const gTeacher = g.teacher.toLowerCase().trim();
    if (gTeacher !== normalizedTeacher) return false;
    if (!groupMatchesDayKey(g, dayKey)) return false;
    const gHour = extractHour(g.schedule);
    return gHour === normalizedHour;
  });

  for (const g of conflictingGroups) {
    conflicts.push({
      type: 'group',
      title: `Group Code ${g.code} (${g.level})`,
      teacherName: g.teacher,
      dayOrDate: dayKey,
      hour: normalizedHour,
      description: `${g.teacher} already has Group Code ${g.code} scheduled on ${dayKey} at ${normalizedHour}`
    });
  }

  // 2. Check meetings involving this teacher on the same day of week & hour
  const teacherEmp = employees.find(e => 
    e.name.toLowerCase().trim() === normalizedTeacher ||
    e.username.toLowerCase().trim() === normalizedTeacher
  );

  if (teacherEmp) {
    const conflictingMeetings = allMeetings.filter(m => {
      const isAttendee = m.attendees.includes(teacherEmp.id) || m.organizerId === teacherEmp.id;
      if (!isAttendee) return false;
      const mHour = extractHour(m.time);
      if (mHour !== normalizedHour) return false;
      const mDayKey = getDayKeyFromDate(m.date);
      return mDayKey === dayKey;
    });

    for (const m of conflictingMeetings) {
      conflicts.push({
        type: 'meeting',
        title: `Meeting: "${m.title}"`,
        teacherName: teacherEmp.name,
        dayOrDate: m.date,
        hour: normalizedHour,
        description: `${teacherEmp.name} has a scheduled meeting "${m.title}" at this time`
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    warningMessage: conflicts.length > 0
      ? `Schedule Conflict: ${teacherName} already has ${conflicts.length} commitment(s) at ${dayKey} ${normalizedHour} (${conflicts.map(c => c.title).join(', ')})`
      : undefined
  };
}

/**
 * Check if a meeting conflicts with existing groups or other meetings for any of the invited attendees
 */
export function checkMeetingConflict(
  meetingDate: string,
  meetingTime: string,
  attendeeIds: string[],
  allGroups: Group[],
  allMeetings: Meeting[],
  employees: Employee[],
  excludeMeetingId?: string
): ConflictCheckResult {
  const conflicts: ConflictDetail[] = [];
  const meetingDayKey = getDayKeyFromDate(meetingDate);
  const normalizedHour = extractHour(meetingTime);

  for (const attId of attendeeIds) {
    const employee = employees.find(e => e.id === attId);
    if (!employee) continue;

    const empName = employee.name.toLowerCase().trim();

    // Check groups
    const empGroups = allGroups.filter(g => {
      if (g.teacher.toLowerCase().trim() !== empName) return false;
      if (!groupMatchesDayKey(g, meetingDayKey)) return false;
      return extractHour(g.schedule) === normalizedHour;
    });

    for (const g of empGroups) {
      conflicts.push({
        type: 'group',
        title: `Group Code ${g.code} (${g.level})`,
        teacherName: employee.name,
        dayOrDate: meetingDate,
        hour: normalizedHour,
        description: `${employee.name} teaches Group ${g.code} on ${meetingDayKey} at ${normalizedHour}`
      });
    }

    // Check overlapping meetings on exact date & time
    const empMeetings = allMeetings.filter(m => {
      if (excludeMeetingId && m.id === excludeMeetingId) return false;
      if (m.date !== meetingDate) return false;
      if (extractHour(m.time) !== normalizedHour) return false;
      return m.attendees.includes(attId) || m.organizerId === attId;
    });

    for (const m of empMeetings) {
      conflicts.push({
        type: 'meeting',
        title: `Meeting: "${m.title}"`,
        teacherName: employee.name,
        dayOrDate: meetingDate,
        hour: normalizedHour,
        description: `${employee.name} is already attending meeting "${m.title}" at this time`
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    warningMessage: conflicts.length > 0
      ? `Schedule Conflict: Attendee(s) have ${conflicts.length} overlapping appointment(s) at ${meetingDate} ${normalizedHour}.`
      : undefined
  };
}
