const fs = require('fs');
let code = fs.readFileSync('src/context/LiveCallContext.tsx', 'utf8');

if (!code.includes('removeParticipant: (')) {
  // interface
  code = code.replace(
    '  toggleParticipantAudio: (participantId: string) => void;',
    '  toggleParticipantAudio: (participantId: string) => void;\n  removeParticipant: (participantId: string) => void;'
  );
  
  // impl
  const impl = `  const removeParticipant = (participantId: string) => {
    if (!activeCall) return;
    const updated = activeCall.participants.filter(p => p.id !== participantId);
    saveCallState({ ...activeCall, participants: updated });
  };
`;
  code = code.replace(
    '  // RING / INVITE PARTICIPANT',
    impl + '\n  // RING / INVITE PARTICIPANT'
  );
  
  code = code.replace(
    '        toggleParticipantAudio,',
    '        toggleParticipantAudio,\n        removeParticipant,'
  );
  fs.writeFileSync('src/context/LiveCallContext.tsx', code);
  console.log('Added removeParticipant');
}
