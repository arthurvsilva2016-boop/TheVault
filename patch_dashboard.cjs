const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Filter groups based on role
code = code.replace(
  "const displayGroups = groups.map(g => pendingChanges[g.id] || g);",
  "const canViewAll = activeEmployee.isMaster || activeEmployee.isAssociate || activeEmployee.isCoordinator || activeEmployee.permissions.includes('dashboard:all');\n  const displayGroups = groups.filter(g => canViewAll || g.teacher === activeEmployee.name).map(g => pendingChanges[g.id] || g);"
);

// We should also filter the schedule matrix
code = code.replace(
  "const cellGroups = displayGroups.filter(g => {",
  "const cellGroups = displayGroups.filter(g => {"
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
