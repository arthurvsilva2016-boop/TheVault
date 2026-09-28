const fs = require('fs');
let code = fs.readFileSync('src/components/VirtualWhiteboard.tsx', 'utf8');

code = code.replace(
  '                onBlur={() => {\n                  pushHistory();\n                }}',
  '                onFocus={() => {\n                  pushHistory();\n                }}'
);

fs.writeFileSync('src/components/VirtualWhiteboard.tsx', code);
