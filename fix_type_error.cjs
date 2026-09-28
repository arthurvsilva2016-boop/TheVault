const fs = require('fs');
let code = fs.readFileSync('src/components/VirtualWhiteboard.tsx', 'utf8');

code = code.replace(
  '                                fontSize: 48,\n                                isEditing: false\n                             };',
  '                                fontSize: 48\n                             };'
);

fs.writeFileSync('src/components/VirtualWhiteboard.tsx', code);
