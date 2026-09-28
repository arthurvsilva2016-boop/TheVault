const fs = require('fs');
let code = fs.readFileSync('src/context/LiveCallContext.tsx', 'utf8');

code = code.replace(
  /\} else \{\n\s+setActiveCall\(null\);\n\s+\}/g,
  `} else {
        setActiveCall(null);
        localStorage.removeItem(STORAGE_KEY_ACTIVE_CALL);
      }`
);

fs.writeFileSync('src/context/LiveCallContext.tsx', code);
console.log("Replaced ghost calls");
