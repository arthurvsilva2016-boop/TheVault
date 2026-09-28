const fs = require('fs');
let code = fs.readFileSync('src/context/LiveCallContext.tsx', 'utf8');

if (!code.includes('useWebRTC')) {
  // 1. Add import
  code = code.replace(
    'import { db } from \'../firebase\';',
    'import { db } from \'../firebase\';\nimport { useWebRTC } from \'../hooks/useWebRTC\';'
  );

  // 2. Add hook usage inside LiveCallProvider
  code = code.replace(
    '  const [mediaError, setMediaError] = useState<string | null>(null);',
    '  const [mediaError, setMediaError] = useState<string | null>(null);\n\n  const { remoteStreams, connectToPeer } = useWebRTC(activeCall?.roomCode || "", localParticipantIdRef.current, localStream);'
  );

  // 3. Update activeCall onSnapshot to connect to new peers
  code = code.replace(
    'setActiveCall((prev) => {',
    'setActiveCall((prev) => {\n          // Connect to new peers\n          remoteCall.participants.forEach(p => {\n             if (p.id !== myLocalUserId && (!prev || !prev.participants.find(oldP => oldP.id === p.id))) {\n                 connectToPeer(p.id);\n             }\n          });'
  );
  
  // 4. Add remoteStreams to context type and Provider value
  code = code.replace(
    'localStream: MediaStream | null;',
    'localStream: MediaStream | null;\n  remoteStreams: Record<string, MediaStream>;'
  );
  
  code = code.replace(
    'localStream,',
    'localStream,\n        remoteStreams,'
  );

  fs.writeFileSync('src/context/LiveCallContext.tsx', code);
  console.log('Integrated WebRTC into LiveCallContext');
}
