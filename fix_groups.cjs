const fs = require('fs');
let text = fs.readFileSync('src/components/Groups.tsx', 'utf8');

if (!text.includes("import { getAccessToken, googleSignIn } from '../lib/googleAuth';")) {
  text = text.replace(
    "import SaveButton from './SaveButton';",
    "import SaveButton from './SaveButton';\nimport { getAccessToken, googleSignIn } from '../lib/googleAuth';"
  );
}

text = text.replace(
  "const { getAccessToken, googleSignIn } = await import('../lib/googleAuth');",
  ""
);

fs.writeFileSync('src/components/Groups.tsx', text);
