const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf8');

const hooks = [
  "employees", "rolePresets", "students", "groups", "collections", 
  "classSessions", "transactions", "occurrences", "tasks", "meetings"
];

for (const hook of hooks) {
  const cap = hook.charAt(0).toUpperCase() + hook.slice(1);
  text = text.replace(
    `const [${hook}, set${cap}] = useFirebaseSync`,
    `const [${hook}, set${cap}, ${hook}Loaded] = useFirebaseSync`
  );
}

const allLoadedCheck = hooks.map(h => `${h}Loaded`).join(" && ");

// Add a loading screen before if (authType === 'none')
const loadingScreen = `
  const isDataLoaded = ${allLoadedCheck};

  if (!isDataLoaded) {
    return (
      <div className="min-h-[100dvh] bg-brand-dark flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Syncing Vault Data...</p>
        </div>
      </div>
    );
  }
`;

text = text.replace(
  "if (authType === 'none') {",
  loadingScreen + "\n  if (authType === 'none') {"
);

fs.writeFileSync('src/App.tsx', text);
