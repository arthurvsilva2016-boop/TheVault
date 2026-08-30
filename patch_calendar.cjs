const fs = require('fs');
let code = fs.readFileSync('src/components/Calendar.tsx', 'utf8');

code = code.replace(
  "export default function Calendar({ students, groups, employees, activeEmployee, meetings, classSessions, onAddMeeting, onUpdateMeeting, onNavigate }: CalendarProps) {",
  `export default function Calendar({ students, groups, employees, activeEmployee, meetings, classSessions, onAddMeeting, onUpdateMeeting, onNavigate }: CalendarProps) {
  const canViewAll = activeEmployee.isMaster || activeEmployee.isAssociate || activeEmployee.isCoordinator || activeEmployee.permissions.includes('calendar:all');
  const viewableGroups = canViewAll ? groups : groups.filter(g => g.teacher === activeEmployee.name);
  const viewableSessions = canViewAll ? classSessions : classSessions.filter(s => s.teacherName === activeEmployee.name || s.teacher === activeEmployee.name);
  const viewableMeetings = canViewAll ? meetings : meetings.filter(m => m.organizerId === activeEmployee.id || m.attendees.includes(activeEmployee.id));`
);

code = code.replace(/groups\.filter\(/g, "viewableGroups.filter(");
code = code.replace(/groups\.map\(/g, "viewableGroups.map(");
code = code.replace(/groups\.find\(/g, "viewableGroups.find(");

code = code.replace(/classSessions\.filter\(/g, "viewableSessions.filter(");
code = code.replace(/classSessions\.some\(/g, "viewableSessions.some(");

code = code.replace(/meetings\.filter\(/g, "viewableMeetings.filter(");
code = code.replace(/meetings\.reduce\(/g, "viewableMeetings.reduce(");

fs.writeFileSync('src/components/Calendar.tsx', code);
