const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// add imports if missing
if (!code.includes("import { auth } from './firebase';")) {
  code = code.replace("import { Menu,", "import { auth } from './firebase';\nimport { signOut } from 'firebase/auth';\nimport { Menu,");
}

code = code.replace(
  /onLogout=\{\(\) => \{\s*setIsAdminInStudentMode\(false\);\s*localStorage\.removeItem\('vault_admin_student_mode'\);\s*setAuthType\('none'\);\s*\}\}/,
  "onLogout={() => {\n          setIsAdminInStudentMode(false);\n          localStorage.removeItem('vault_admin_student_mode');\n          signOut(auth).then(() => setAuthType('none'));\n        }}"
);

code = code.replace(
  /onLogout=\{\(\) => setAuthType\('none'\)\}/,
  "onLogout={() => { signOut(auth).then(() => setAuthType('none')); }}"
);

fs.writeFileSync('src/App.tsx', code);
