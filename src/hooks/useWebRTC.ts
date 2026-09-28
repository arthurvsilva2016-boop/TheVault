import { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, addDoc, deleteDoc, getDocs } from 'firebase/firestore';

export function useWebRTC(roomCode: string, localParticipantId: string, localStream: MediaStream | null) {
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const pcs = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef(localStream);
  const activeVideoTrackRef = useRef<MediaStreamTrack | null>(localStream?.getVideoTracks()[0] || null);

  useEffect(() => {
    localStreamRef.current = localStream;
    if (!activeVideoTrackRef.current) {
      activeVideoTrackRef.current = localStream?.getVideoTracks()[0] || null;
    }
  }, [localStream]);

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
    return () => {
      unsub();
      // Clean up peer connections when roomCode becomes empty or unmounts
      Object.values(pcs.current).forEach(pc => pc.close());
      pcs.current = {};
      setRemoteStreams({});
    };
  }, [roomCode, localParticipantId, localStream]);

  const createPeerConnection = (remoteId: string) => {
    if (pcs.current[remoteId]) return pcs.current[remoteId];

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pcs.current[remoteId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        if (track.kind === 'video' && activeVideoTrackRef.current) {
          pc.addTrack(activeVideoTrackRef.current, localStreamRef.current!);
        } else {
          pc.addTrack(track, localStreamRef.current!);
        }
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(collection(db, 'live_calls', roomCode, 'signaling', remoteId, 'messages'), {
          type: 'candidate',
          from: localParticipantId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [remoteId]: event.streams[0]
      }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[remoteId];
          return next;
        });
        delete pcs.current[remoteId];
      }
    };

    return pc;
  };

  const [networkQuality, setNetworkQuality] = useState<'good' | 'poor'>('good');

  useEffect(() => {
    if (!roomCode) return;
    
    const intervalId = setInterval(async () => {
      let isPoor = false;
      const connections = Object.values(pcs.current);
      
      if (connections.length === 0) {
        if (networkQuality !== 'good') setNetworkQuality('good');
        return;
      }
      
      for (const pc of connections) {
        if (pc.connectionState !== 'connected') continue;
        
        try {
          const stats = await pc.getStats();
          stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              if (report.currentRoundTripTime > 0.3) {
                isPoor = true;
              }
            }
            if (report.type === 'inbound-rtp') {
              const lossRate = report.packetsLost / ((report.packetsReceived || 0) + report.packetsLost);
              if (lossRate > 0.05) {
                isPoor = true;
              }
            }
          });
        } catch (err) {
          console.warn("Could not get WebRTC stats:", err);
        }
      }
      
      setNetworkQuality(isPoor ? 'poor' : 'good');
    }, 3000);

    return () => clearInterval(intervalId);
  }, [roomCode, networkQuality]);

  const connectToPeer = async (remoteId: string) => {
    if (remoteId === localParticipantId || pcs.current[remoteId]) return;
    
    const pc = createPeerConnection(remoteId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await addDoc(collection(db, 'live_calls', roomCode, 'signaling', remoteId, 'messages'), {
      type: 'offer',
      from: localParticipantId,
      offer: { type: offer.type, sdp: offer.sdp }
    });
  };

  const replaceVideoTrack = async (newTrack: MediaStreamTrack | null) => {
    activeVideoTrackRef.current = newTrack || localStreamRef.current?.getVideoTracks()[0] || null;
    Object.values(pcs.current).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) {
        if (newTrack) {
          sender.replaceTrack(newTrack).catch(e => console.warn(e));
        } else {
          const defaultTrack = localStreamRef.current?.getVideoTracks()[0] || null;
          sender.replaceTrack(defaultTrack).catch(e => console.warn(e));
        }
      }
    });
  };

  return { remoteStreams, connectToPeer, createPeerConnection, networkQuality, replaceVideoTrack };
}
