const fs = require('fs');
let code = fs.readFileSync('src/components/Preferences.tsx', 'utf8');

code = code.replace(
  /export default function Preferences\(\{[\s\S]*?\}\: PreferencesProps\) \{/,
  `export default function Preferences({ 
  activeEmployee, 
  onUpdateEmployee,
  theme = 'dark',
  onToggleTheme,
  onSwitchToStudentMode,
  systemData,
  onRestoreSystemData,
  onResetSystemData,
  appAccesses = [],
  onUpdateAccess,
  onDeleteAccess,
  employees = [],
  setEmployees,
  students = [],
  setStudents
}: PreferencesProps) {`
);

fs.writeFileSync('src/components/Preferences.tsx', code);
