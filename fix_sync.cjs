const fs = require('fs');
let code = fs.readFileSync('src/context/LiveCallContext.tsx', 'utf8');

code = code.replace(
  'isAudioOn: localP?.isAudioOn ?? p.isAudioOn, isVideoOn: localP?.isVideoOn ?? p.isVideoOn',
  'isAudioOn: p.isAudioOn, isVideoOn: p.isVideoOn'
);

fs.writeFileSync('src/context/LiveCallContext.tsx', code);
