const fs = require('fs');
let code = fs.readFileSync('src/components/StudentApp.tsx', 'utf8');

// Remove password states
code = code.replace(/const \[newPassword, setNewPassword\].*\n/g, "");
code = code.replace(/const \[confirmPassword, setConfirmPassword\].*\n/g, "");
code = code.replace(/const \[passwordError, setPasswordError\].*\n/g, "");
code = code.replace(/const \[passwordSuccess, setPasswordSuccess\].*\n/g, "");

// Remove handleChangePassword function
const handleChangePasswordRegex = /const handleChangePassword = \([^)]*\) => \{[\s\S]*?setConfirmPassword\(''\);\n  \};\n/m;
code = code.replace(handleChangePasswordRegex, "");

fs.writeFileSync('src/components/StudentApp.tsx', code);
