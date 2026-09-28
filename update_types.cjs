const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('deviceId?: string;')) {
  code = code.replace(
    '  id: string;',
    '  id: string;\n  userId?: string;\n  deviceId?: string;'
  );
  fs.writeFileSync('src/types.ts', code);
  console.log('Added userId and deviceId to CallParticipant');
}
