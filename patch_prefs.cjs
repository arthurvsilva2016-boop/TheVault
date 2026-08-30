const fs = require('fs');
let code = fs.readFileSync('src/components/Preferences.tsx', 'utf8');

// Imports
code = code.replace(
  "import { Employee, Student, Group, ClassSession, Transaction, Occurrence, Task, BookCollection, Meeting, Permission } from '../types';",
  "import { Employee, Student, Group, ClassSession, Transaction, Occurrence, Task, BookCollection, Meeting, Permission, AppAccess } from '../types';"
);

// Props
code = code.replace(
  "  systemData?: {",
  `  appAccesses?: AppAccess[];
  onUpdateAccess?: (acc: AppAccess) => void;
  onDeleteAccess?: (id: string) => void;
  employees?: Employee[];
  setEmployees?: (emps: Employee[]) => void;
  students?: Student[];
  setStudents?: (stus: Student[]) => void;
  systemData?: {`
);

// Menu tabs
code = code.replace(
  "  const [activeMenu, setActiveMenu] = useState<'profile' | 'system' | 'notifications'>('profile');",
  "  const [activeMenu, setActiveMenu] = useState<'profile' | 'system' | 'notifications' | 'users'>('profile');"
);

const menuButtons = `          <button
            onClick={() => setActiveMenu('notifications')}
            className={\`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition cursor-pointer \${
              activeMenu === 'notifications' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-brand-dark/50'
            }\`}
          >
            <Bell className="w-4 h-4" />
            <span className="font-semibold text-xs">Notifications</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveMenu('users')}
              className={\`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition cursor-pointer \${
                activeMenu === 'users' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-brand-dark/50'
              }\`}
            >
              <Key className="w-4 h-4" />
              <span className="font-semibold text-xs">Configure Users</span>
            </button>
          )}`;

code = code.replace(
  /<button\s+onClick=\{\(\) => setActiveMenu\('notifications'\)\}[\s\S]*?<\/button>/,
  menuButtons
);

fs.writeFileSync('src/components/Preferences.tsx', code);
