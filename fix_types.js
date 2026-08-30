const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code = code.replace(/  name: string;\n  avatarUrl\?: string;/g, '  name: string;');
fs.writeFileSync('src/types.ts', code);
