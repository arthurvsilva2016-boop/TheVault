const fs = require('fs');
let code = fs.readFileSync('src/components/StudentApp.tsx', 'utf8');

// replace the if block with nothing
const blockRegex = /if\s*\(student\.mustChangePassword\s*&&\s*!isAdminViewing\)\s*\{\s*return\s*\([\s\S]*?\n\s*\);\s*\}/g;
code = code.replace(blockRegex, "");

// also let's remove the password form at the bottom (Settings tab)
const settingsPassRegex = /\{\/\*\s*Password Change Subform\s*\*\/\}[\s\S]*?Update Password\s*<\/button>\s*<\/form>\s*<\/div>/g;
code = code.replace(settingsPassRegex, "");

fs.writeFileSync('src/components/StudentApp.tsx', code);
