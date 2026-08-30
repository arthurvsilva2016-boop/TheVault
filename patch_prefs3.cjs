const fs = require('fs');
let code = fs.readFileSync('src/components/Preferences.tsx', 'utf8');

code = code.replace(
  /permissions: \['dashboard', 'calendar', 'students', 'groups', 'chat'\],/g,
  "permissions: ['dashboard', 'calendar', 'students', 'groups', 'chat'] as any[],"
);

fs.writeFileSync('src/components/Preferences.tsx', code);
