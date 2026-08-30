const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the Login component block
code = code.replace(
  /<Login[\s\S]*?onBecomeSuperAdmin=\{[\s\S]*?\}\s*\/>/,
  `<Login 
        employees={employees}
        students={students}
        appAccesses={appAccesses}
        onUpdateAccess={(acc) => {
          if (appAccesses.some(a => a.id === acc.id)) {
            setAppAccesses(prev => prev.map(a => a.id === acc.id ? acc : a));
          } else {
            setAppAccesses(prev => [...prev, acc]);
          }
        }}
      />`
);

fs.writeFileSync('src/App.tsx', code);
