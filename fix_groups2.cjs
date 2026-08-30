const fs = require('fs');
let text = fs.readFileSync('src/components/Groups.tsx', 'utf8');

if (!text.includes("import { createCalendarEventWithMeet } from '../lib/calendarApi';")) {
  text = text.replace(
    "import SaveButton from './SaveButton';",
    "import SaveButton from './SaveButton';\nimport { createCalendarEventWithMeet } from '../lib/calendarApi';"
  );
}

text = text.replace(
  "const { createCalendarEventWithMeet } = await import('../lib/calendarApi');",
  ""
);

fs.writeFileSync('src/components/Groups.tsx', text);
