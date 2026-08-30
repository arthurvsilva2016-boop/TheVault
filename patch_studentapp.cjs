const fs = require('fs');
let code = fs.readFileSync('src/components/StudentApp.tsx', 'utf8');

// Find the block:
// if (student.mustChangePassword && !isAdminViewing) {
//   return ( ... );
// }
const blockRegex = /if\s*\(student\.mustChangePassword\s*&&\s*!isAdminViewing\)\s*\{\s*return\s*\([\s\S]*?\n\s*\);\s*\}/m;
const match = code.match(blockRegex);

if (match) {
  const block = match[0];
  code = code.replace(block, "");
  
  // Find the final return statement
  const finalReturnRegex = /return\s*\(\s*<div\s+className="h-\[100dvh\]/m;
  const finalMatch = code.match(finalReturnRegex);
  
  if (finalMatch) {
    const finalReturn = finalMatch[0];
    code = code.replace(finalReturn, block + "\n\n  " + finalReturn);
    fs.writeFileSync('src/components/StudentApp.tsx', code);
    console.log("Patched successfully");
  } else {
    console.log("Could not find final return");
  }
} else {
  console.log("Could not find mustChangePassword block");
}
