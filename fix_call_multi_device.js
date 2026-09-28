const fs = require('fs');
let code = fs.readFileSync('src/context/LiveCallContext.tsx', 'utf8');

if (!code.includes('localParticipantIdRef')) {
  // Add ref
  code = code.replace(
    '  const [isCallMinimized, setIsCallMinimized] = useState(false);',
    '  const [isCallMinimized, setIsCallMinimized] = useState(false);\n  const localParticipantIdRef = useRef<string>(`part-${Math.random().toString(36).substr(2, 9)}`);'
  );
  
  // Make sure useRef is imported
  if (!code.includes('useRef')) {
     code = code.replace('useState, useEffect, useCallback, createContext', 'useState, useEffect, useCallback, createContext, useRef');
  }

  // Update onSnapshot
  code = code.replace(
    /const localP = prev.participants.find\(p => p.isLocal\);\s*const myLocalUserId = localP\?.id \|\| currentEmployee\?.id \|\| currentStudent\?.id \|\| 'guest';/g,
    'const localP = prev.participants.find(p => p.isLocal);\n          const myLocalUserId = localParticipantIdRef.current;'
  );

  // Update joinCall
  code = code.replace(
    /const localParticipant: CallParticipant = \{\s*id: user.id,/g,
    'const localParticipant: CallParticipant = {\n      id: localParticipantIdRef.current,'
  );

  // In joinCall, replace user.id filtering
  code = code.replace(
    /const otherParticipants = existingCall.participants.filter\(p => p.id !== user.id\)/g,
    'const otherParticipants = existingCall.participants.filter(p => p.id !== localParticipantIdRef.current)'
  );
  
  code = code.replace(
    /hostId: user.id,/g,
    'hostId: localParticipantIdRef.current,'
  );

  fs.writeFileSync('src/context/LiveCallContext.tsx', code);
}
console.log('Fixed LiveCallContext for multi-device');
