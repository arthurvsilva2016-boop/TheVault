const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  'match /live_calls/{document=**} {\n      allow read, write: if true;\n    }',
  'match /live_calls/{document=**} {\n      allow read, write: if true;\n    }\n    match /live_calls/{callId}/signaling/{document=**} {\n      allow read, write: if true;\n    }'
);
fs.writeFileSync('firestore.rules', code);
console.log('Fixed firestore.rules');
