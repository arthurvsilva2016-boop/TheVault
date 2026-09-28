const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importTarget = `import { auth } from './firebase';`;
const newImport = `import { useLiveCall } from './context/LiveCallContext';\nimport { auth } from './firebase';`;

if(code.includes(importTarget)) {
  code = code.replace(importTarget, newImport);
}

const funcTarget = `export default function App() {`;
const newFunc = `export default function App() {
  const { activeCall, leaveCall } = useLiveCall();
  
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeCall) {
        leaveCall();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeCall, leaveCall]);
`;

if(code.includes(funcTarget)) {
  code = code.replace(funcTarget, newFunc);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Success patching App.tsx");
} else {
  console.log("App.tsx function target not found");
}
