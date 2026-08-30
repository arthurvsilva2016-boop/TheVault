const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(
  "const hasAccess = (tab: Tab) => tab === 'chat' || tab === 'collections' || activeEmployee.permissions.includes(tab) || activeEmployee.isAssociate;",
  "const hasAccess = (tab: Tab) => tab === 'chat' || tab === 'collections' || activeEmployee.isMaster || activeEmployee.isCoordinator || activeEmployee.isAssociate || activeEmployee.permissions.includes(tab);"
);

fs.writeFileSync('src/components/Sidebar.tsx', code);
