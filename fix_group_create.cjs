const fs = require('fs');
let text = fs.readFileSync('src/components/Groups.tsx', 'utf8');

text = text.replace(
  "if (!groupCode.trim() || !teacher || selectedDays.length === 0 || !classTime || !startDate) return;",
  "if (!groupCode.trim() || selectedDays.length === 0 || !classTime || !startDate) return;"
);

text = text.replace(
  /<select\s+value=\{teacher\}[\s\S]*?onChange=\{e => setTeacher\(e\.target\.value\)\}[\s\S]*?className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition cursor-pointer"\s+required\s*>/g,
  `<select
                  value={teacher}
                  onChange={e => setTeacher(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition cursor-pointer"
                >`
);

text = text.replace(
  '<option value="">Assign Teacher...</option>',
  '<option value="">Assign Teacher... (Optional)</option>'
);

fs.writeFileSync('src/components/Groups.tsx', text);
