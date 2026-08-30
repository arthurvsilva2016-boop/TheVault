const fs = require('fs');
let code = fs.readFileSync('src/components/Calendar.tsx', 'utf8');

const anchor = `}: CalendarProps) {`;
const insert = `
  const canViewAll = activeEmployee.isMaster || activeEmployee.isAssociate || activeEmployee.isCoordinator || activeEmployee.permissions.includes('calendar:all');
  const viewableGroups = canViewAll ? groups : groups.filter(g => g.teacher === activeEmployee.name);
  const viewableSessions = canViewAll ? classSessions : classSessions.filter(s => s.teacherName === activeEmployee.name || s.teacher === activeEmployee.name);
  const viewableMeetings = canViewAll ? meetings : meetings.filter(m => m.organizerId === activeEmployee.id || m.attendees.includes(activeEmployee.id));
`;

code = code.replace(anchor, anchor + insert);
fs.writeFileSync('src/components/Calendar.tsx', code);
