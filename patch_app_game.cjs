const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("import World from './components/game/World';")) {
  code = code.replace(
    "import Chat from './components/Chat';",
    "import Chat from './components/Chat';\nimport World from './components/game/World';"
  );
}

code = code.replace(
  "      case 'chat':",
  "      case 'game':\n        return <World student={activeEmployee as any} isTeacher={true} />;\n      case 'chat':"
);

fs.writeFileSync('src/App.tsx', code);
