const fs = require('fs');
let code = fs.readFileSync('src/components/calling/LiveCallModal.tsx', 'utf8');

// Get remoteStreams from useLiveCall
code = code.replace(
  '    localStream,\n    screenStream,',
  '    localStream,\n    remoteStreams,\n    screenStream,'
);

// Add remote stream binding for grid layout
code = code.replace(
  /stream=\{participant.isLocal \? \(isScreenSharing && screenStream \? screenStream : localStream\) : undefined\}/g,
  'stream={participant.isLocal ? (isScreenSharing && screenStream ? screenStream : localStream) : remoteStreams[participant.id]}'
);

// And for sidebar/spotlight layout
code = code.replace(
  /stream=\{participant.isLocal \? localStream : undefined\}/g,
  'stream={participant.isLocal ? localStream : remoteStreams[participant.id]}'
);

code = code.replace(
  /stream=\{spotlightParticipant.isLocal \? \(isScreenSharing && screenStream \? screenStream : localStream\) : undefined\}/g,
  'stream={spotlightParticipant.isLocal ? (isScreenSharing && screenStream ? screenStream : localStream) : remoteStreams[spotlightParticipant.id]}'
);

fs.writeFileSync('src/components/calling/LiveCallModal.tsx', code);
console.log('Fixed LiveCallModal streams');
