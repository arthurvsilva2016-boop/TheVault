const fs = require('fs');
let text = fs.readFileSync('src/lib/driveApi.ts', 'utf8');

text = text.replace(
  "export const uploadBackupToDrive = async (jsonData: string, filename: string) => {",
  "export const uploadBackupToDrive = async (jsonData: string, filename: string, allowSignIn = false) => {"
);

text = text.replace(
  /if \(\!token\) \{\s+const authRes \= await googleSignIn\(\)\;\s+token \= authRes\?\.accessToken \|\| null\;\s+\}/,
  "if (!token && allowSignIn) {\n    const authRes = await googleSignIn();\n    token = authRes?.accessToken || null;\n  }"
);

fs.writeFileSync('src/lib/driveApi.ts', text);
