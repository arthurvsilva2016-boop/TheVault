const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Import AppAccess
code = code.replace(
  "import { Employee, Student, Group, BookCollection, ClassSession, Transaction, Occurrence, Task, Meeting, EmployeeChatMessage, RolePreset, Tab } from './types';",
  "import { Employee, Student, Group, BookCollection, ClassSession, Transaction, Occurrence, Task, Meeting, EmployeeChatMessage, RolePreset, Tab, AppAccess } from './types';"
);

// Add state
code = code.replace(
  "const [employeeMessages, setEmployeeMessages, employeeMessagesLoaded] = useFirebaseSync<EmployeeChatMessage>('employee_messages', MOCK_MESSAGES);",
  "const [employeeMessages, setEmployeeMessages, employeeMessagesLoaded] = useFirebaseSync<EmployeeChatMessage>('employee_messages', MOCK_MESSAGES);\n  const [appAccesses, setAppAccesses, appAccessesLoaded] = useFirebaseSync<AppAccess>('app_accesses', []);"
);

// Update isDataLoaded
code = code.replace(
  "const isDataLoaded = employeesLoaded && rolePresetsLoaded && studentsLoaded && groupsLoaded && collectionsLoaded && classSessionsLoaded && transactionsLoaded && occurrencesLoaded && tasksLoaded && meetingsLoaded && employeeMessagesLoaded;",
  "const isDataLoaded = employeesLoaded && rolePresetsLoaded && studentsLoaded && groupsLoaded && collectionsLoaded && classSessionsLoaded && transactionsLoaded && occurrencesLoaded && tasksLoaded && meetingsLoaded && employeeMessagesLoaded && appAccessesLoaded;"
);

// Update Login component props
code = code.replace(
  "<Login \n        employees={employees}\n        students={students}",
  "<Login \n        employees={employees}\n        students={students}\n        appAccesses={appAccesses}\n        onUpdateAccess={(acc) => {\n          if (appAccesses.some(a => a.id === acc.id)) {\n            setAppAccesses(prev => prev.map(a => a.id === acc.id ? acc : a));\n          } else {\n            setAppAccesses(prev => [...prev, acc]);\n          }\n        }}\n        onBecomeSuperAdmin={(email, name, photoURL) => {\n           const newAdmin: Employee = {\n             id: 'admin-' + Date.now(),\n             username: 'admin',\n             name: name || 'Coordinator',\n             roleTitle: 'Coordinator',\n             permissions: ['dashboard', 'calendar', 'students', 'groups', 'curriculum', 'finance', 'staff', 'preferences', 'chat'],\n             isAssociate: false,\n             isMaster: true,\n             isCoordinator: true,\n             email: email,\n             avatarUrl: photoURL\n           };\n           setEmployees(prev => [...prev, newAdmin]);\n           setActiveEmployeeId(newAdmin.id);\n           setAuthType('staff');\n        }}"
);

// Pass props to Preferences
code = code.replace(
  "onResetSystemData={handleResetAllData}",
  "onResetSystemData={handleResetAllData}\n            appAccesses={appAccesses}\n            onUpdateAccess={(acc) => {\n              if (appAccesses.some(a => a.id === acc.id)) {\n                setAppAccesses(prev => prev.map(a => a.id === acc.id ? acc : a));\n              } else {\n                setAppAccesses(prev => [...prev, acc]);\n              }\n            }}\n            onDeleteAccess={(id) => setAppAccesses(prev => prev.filter(a => a.id !== id))}\n            employees={employees}\n            setEmployees={setEmployees}\n            students={students}\n            setStudents={setStudents}"
);

fs.writeFileSync('src/App.tsx', code);
