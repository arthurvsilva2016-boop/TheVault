const fs = require('fs');
let text = fs.readFileSync('src/hooks/useFirebaseSync.ts', 'utf8');

text = text.replace(
  "] {",
  ", boolean] {"
);

fs.writeFileSync('src/hooks/useFirebaseSync.ts', text);
