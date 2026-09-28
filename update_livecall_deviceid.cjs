const fs = require('fs');
let code = fs.readFileSync('src/context/LiveCallContext.tsx', 'utf8');

// Replace localParticipant definition to include userId and deviceId
code = code.replace(
  /const localParticipant: CallParticipant = \{\n\s*id: localParticipantIdRef.current,/g,
  'const localParticipant: CallParticipant = {\n      id: localParticipantIdRef.current,\n      userId: user.id,\n      deviceId: localParticipantIdRef.current,'
);

// We should also look at VaultCallOverlay to add the list of connected devices
fs.writeFileSync('src/context/LiveCallContext.tsx', code);
console.log('Updated LiveCallContext');
