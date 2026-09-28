const fs = require('fs');
let code = fs.readFileSync('src/context/LiveCallContext.tsx', 'utf8');

const syncStr = `
  useEffect(() => {
    if (activeCall && localStream) {
      const me = activeCall.participants.find(p => p.id === localParticipantIdRef.current);
      if (me) {
        if (me.isAudioOn !== !isMicMuted) {
           setIsMicMuted(!me.isAudioOn);
           localStream.getAudioTracks().forEach(track => track.enabled = me.isAudioOn);
        }
        if (me.isVideoOn !== !isVideoMuted) {
           setIsVideoMuted(!me.isVideoOn);
           localStream.getVideoTracks().forEach(track => track.enabled = me.isVideoOn);
        }
      }
    }
  }, [activeCall, localStream, isMicMuted, isVideoMuted]);
`;

code = code.replace(
  '  // Broadcast / Listen for multi-tab live sync',
  syncStr + '\n  // Broadcast / Listen for multi-tab live sync'
);

fs.writeFileSync('src/context/LiveCallContext.tsx', code);
