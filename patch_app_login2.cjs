const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<Login[\s\S]*?onUpdateAccess=\{[\s\S]*?\}\s*\/>/,
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
        onLoginStaff={(id) => {
          setActiveEmployeeId(id);
          setAuthType('staff');
        }}
        onLoginStudent={(id) => {
          setActiveStudentId(id);
          setAuthType('student');
        }}
      />`
);

fs.writeFileSync('src/App.tsx', code);
