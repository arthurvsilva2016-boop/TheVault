const fs = require('fs');
let text = fs.readFileSync('src/components/Groups.tsx', 'utf8');

text = text.replace(
  "import GroupProfile from './GroupProfile';",
  "import GroupProfile from './GroupProfile';\nimport { createCalendarEventWithMeet } from '../lib/calendarApi';\nimport { getAccessToken, googleSignIn } from '../lib/googleAuth';"
);

fs.writeFileSync('src/components/Groups.tsx', text);
