const fs = require('fs');
let code = fs.readFileSync('src/hooks/useWebRTC.ts', 'utf8');

const replacement = `
  const candidateQueues = useRef<Record<string, RTCIceCandidateInit[]>>({});

  useEffect(() => {
    if (!roomCode || !localParticipantId || !localStream) return;
    
    const signalingRef = collection(db, 'live_calls', roomCode, 'signaling', localParticipantId, 'messages');
    
    const unsub = onSnapshot(signalingRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const from = data.from;
          if (from === localParticipantId) return;
          
          let pc = pcs.current[from];
          
          try {
            if (data.type === 'offer') {
               if (!pc) {
                  pc = createPeerConnection(from);
               }
               await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
               const answer = await pc.createAnswer();
               await pc.setLocalDescription(answer);
               
               await addDoc(collection(db, 'live_calls', roomCode, 'signaling', from, 'messages'), {
                 type: 'answer',
                 from: localParticipantId,
                 answer: { type: answer.type, sdp: answer.sdp }
               });
               
               // Process queued candidates
               if (candidateQueues.current[from]) {
                 for (const candidate of candidateQueues.current[from]) {
                   await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.warn(e));
                 }
                 candidateQueues.current[from] = [];
               }
            } else if (data.type === 'answer') {
               if (pc) {
                  await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                  // Process queued candidates
                  if (candidateQueues.current[from]) {
                    for (const candidate of candidateQueues.current[from]) {
                      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.warn(e));
                    }
                    candidateQueues.current[from] = [];
                  }
               }
            } else if (data.type === 'candidate') {
               if (!pc) {
                 pc = createPeerConnection(from);
               }
               if (pc.remoteDescription) {
                  await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(e => console.warn(e));
               } else {
                  if (!candidateQueues.current[from]) candidateQueues.current[from] = [];
                  candidateQueues.current[from].push(data.candidate);
               }
            }
          } catch (err) {
            console.error("WebRTC Signaling Error:", err);
          }
          
          deleteDoc(change.doc.ref).catch(() => {});
        }
      });
    });
    return () => unsub();
  }, [roomCode, localParticipantId, localStream]);
`;

code = code.replace(
  /  useEffect\(\(\) => \{\n    if \(\!roomCode \|\| \!localParticipantId \|\| \!localStream\) return;\s+\/\/ Listen to signaling data for this participant[\s\S]*?return \(\) => unsub\(\);\n  \}, \[roomCode, localParticipantId, localStream\]\);/,
  replacement.trim()
);

fs.writeFileSync('src/hooks/useWebRTC.ts', code);
