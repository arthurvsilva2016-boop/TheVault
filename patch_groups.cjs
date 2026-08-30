const fs = require('fs');
let code = fs.readFileSync('src/components/Groups.tsx', 'utf8');

code = code.replace(
  "export default function Groups({",
  `export default function Groups({`
);

code = code.replace(
  "const [searchTerm, setSearchTerm] = useState('');",
  "const [searchTerm, setSearchTerm] = useState('');\n  const canViewAll = activeEmployee.isMaster || activeEmployee.isAssociate || activeEmployee.isCoordinator || activeEmployee.permissions.includes('groups:all');\n  const viewableGroups = canViewAll ? groups : groups.filter(g => g.teacher === activeEmployee.name);"
);

code = code.replace(
  "const filteredGroups = groups.filter(g => {",
  "const filteredGroups = viewableGroups.filter(g => {"
);

fs.writeFileSync('src/components/Groups.tsx', code);
