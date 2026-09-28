const fs = require('fs');
let code = fs.readFileSync('src/context/LiveCallContext.tsx', 'utf8');

code = code.replace(
  '        remoteStreams, setLocalStream] = useState<MediaStream | null>(null);',
  'setLocalStream] = useState<MediaStream | null>(null);'
);

// We need to add remoteStreams to the return of the hook
code = code.replace(
  '        localStream,\n        remoteStreams,\n        screenStream,',
  '        localStream,\n        remoteStreams,\n        screenStream,'
);

// Let's actually find the context provider value block
code = code.replace(
  '        localStream,\n        screenStream,',
  '        localStream,\n        remoteStreams,\n        screenStream,'
);

fs.writeFileSync('src/context/LiveCallContext.tsx', code);
