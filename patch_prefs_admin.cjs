const fs = require('fs');
let code = fs.readFileSync('src/components/Preferences.tsx', 'utf8');

code = code.replace(
  "const isAdmin = activeEmployee.isAssociate || activeIsMasterUser || activeEmployee.permissions.includes('staff') || activeEmployee.permissions.includes('edit:staff');",
  "const isAdmin = activeEmployee.isAssociate || activeIsMasterUser || activeEmployee.isCoordinator || activeEmployee.permissions.includes('staff') || activeEmployee.permissions.includes('edit:staff');"
);

fs.writeFileSync('src/components/Preferences.tsx', code);
