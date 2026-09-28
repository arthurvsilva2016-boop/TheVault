const fs = require('fs');
let code = fs.readFileSync('src/components/VirtualWhiteboard.tsx', 'utf8');

code = code.replace(
  '                       onClick={() => setStickies(prev => prev.map(s => s.id === sticky.id ? { ...s, color: c.hex } : s))}',
  '                       onClick={() => { pushHistory(); setStickies(prev => prev.map(s => s.id === sticky.id ? { ...s, color: c.hex } : s)); }}'
);

code = code.replace(
  '                  const val = e.target.value;\n                  setStickies(prev => prev.map(s => s.id === sticky.id ? { ...s, text: val } : s));\n                }}',
  '                  const val = e.target.value;\n                  setStickies(prev => prev.map(s => s.id === sticky.id ? { ...s, text: val } : s));\n                }}\n                onBlur={() => {\n                  pushHistory();\n                }}'
);

fs.writeFileSync('src/components/VirtualWhiteboard.tsx', code);
