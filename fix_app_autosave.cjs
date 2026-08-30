const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf8');

text = text.replace(
  'console.error("Auto-save to Google Drive failed", err);',
  'if (err.message !== "Authentication required") { console.error("Auto-save to Google Drive failed", err); }'
);

fs.writeFileSync('src/App.tsx', text);
