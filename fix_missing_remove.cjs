const fs = require('fs');
let code = fs.readFileSync('src/context/LiveCallContext.tsx', 'utf8');

const impl = `
  const removeParticipant = (participantId: string) => {
    if (!activeCall) return;
    const updated = activeCall.participants.filter(p => p.id !== participantId);
    saveCallState({ ...activeCall, participants: updated });
  };
`;

code = code.replace(
  '  // RING PARTICIPANT',
  impl + '\n  // RING PARTICIPANT'
);

fs.writeFileSync('src/context/LiveCallContext.tsx', code);
