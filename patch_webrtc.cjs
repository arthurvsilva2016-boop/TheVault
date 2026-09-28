const fs = require('fs');
let code = fs.readFileSync('src/hooks/useWebRTC.ts', 'utf8');

const targetStr = `return () => unsub();
  }, [roomCode, localParticipantId, localStream]);`;

const newStr = `return () => {
      unsub();
      // Clean up peer connections when roomCode becomes empty or unmounts
      Object.values(pcs.current).forEach(pc => pc.close());
      pcs.current = {};
      setRemoteStreams({});
    };
  }, [roomCode, localParticipantId, localStream]);`;

if(code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('src/hooks/useWebRTC.ts', code);
  console.log("Success patching useWebRTC");
} else {
  console.log("String not found in useWebRTC");
}
