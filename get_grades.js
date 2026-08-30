const fs = require('fs');
const content = fs.readFileSync('src/components/GroupProfile.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes("groupView === 'grades'"));
const end = lines.findIndex((l, i) => i > start && l.includes("TAB: ATTENDANCE"));
console.log(lines.slice(start, end).join('\n'));
