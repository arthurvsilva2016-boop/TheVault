const fs = require('fs');
let code = fs.readFileSync('src/components/StudentDirectory.tsx', 'utf8');

code = code.replace(
  /tempPassword:\s*`GRT-\$\{randomCode\}`,\s*mustChangePassword:\s*true,/,
  ""
);

fs.writeFileSync('src/components/StudentDirectory.tsx', code);
