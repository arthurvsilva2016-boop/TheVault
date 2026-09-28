const fs = require('fs');
let code = fs.readFileSync('src/context/LiveCallContext.tsx', 'utf8');

const cleanupStr = `
  useEffect(() => {
    if (!activeCall && localStream) {
       cleanupMedia();
    }
  }, [activeCall]);
`;

code = code.replace(
  '  // Broadcast / Listen for multi-tab live sync',
  cleanupStr + '\n  // Broadcast / Listen for multi-tab live sync'
);

fs.writeFileSync('src/context/LiveCallContext.tsx', code);
console.log('Added media cleanup');
