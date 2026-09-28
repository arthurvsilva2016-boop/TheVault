import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useWebRTC } from '../hooks/useWebRTC';
import { LiveCallSession, CallParticipant, CallType, Employee, Student } from '../types';

interface StartCallParams {
  title: string;
  roomCode: string;
  type: CallType;
  groupId?: string;
  groupCode?: string;
  meetingId?: string;
  hostUser: {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
  };
  initialParticipants?: CallParticipant[];
}

interface LiveCallContextType {
  activeCall: LiveCallSession | null;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  screenStream: MediaStream | null;
  isMicMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isCallMinimized: boolean;
  isWhiteboardActive: boolean;
  isChatDrawerOpen: boolean;
  audioLevel: number;
  hasMediaPermissions: boolean;
  mediaError: string | null;
  networkQuality: 'good' | 'poor';
  // Actions
  startCall: (roomCode: string, hostUser: { id: string; name: string; role: string; avatarUrl?: string }, title: string, type?: CallType) => Promise<void>;
  joinCall: (roomCode: string, user: { id: string; name: string; role: string; avatarUrl?: string }, callTitle?: string, type?: CallType) => Promise<void>;
  leaveCall: () => void;
  toggleMic: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  approveScreenShare: (participantId: string) => void;
  denyScreenShare: () => void;
  toggleHandRaise: () => void;
  setIsCallMinimized: (minimized: boolean) => void;
  setIsWhiteboardActive: (active: boolean) => void;
  setIsChatDrawerOpen: (open: boolean) => void;
  sendCallMessage: (text: string, sender: { id: string; name: string }) => void;
  broadcastLiveCaption: (caption: { speakerId: string; speakerName: string; originalText: string; sourceLang?: string }) => void;
  updatePresentationSlide: (index: number) => void;
  updatePresentationDeck: (deckSource: 'custom' | 'curriculum', deckId?: string, unitNumber?: number) => void;
  muteAllStudents: () => void;
  toggleParticipantAudio: (participantId: string) => void;
  removeParticipant: (participantId: string) => void;
  ringParticipant: (name: string) => void;
  incomingCall: { roomCode: string; callerName: string; title: string; type: CallType } | null;
  acceptIncomingCall: (user: { id: string; name: string; role: string; avatarUrl?: string }) => void;
  declineIncomingCall: () => void;
}

const LiveCallContext = createContext<LiveCallContextType | undefined>(undefined);

const STORAGE_KEY_ACTIVE_CALL = 'vault_active_live_call';
const STORAGE_KEY_CALL_EVENT = 'vault_live_call_event';

export const LiveCallProvider: React.FC<{ children: React.ReactNode; currentEmployee?: Employee | null; currentStudent?: Student | null }> = ({
  children,
  currentEmployee,
  currentStudent
}) => {
  const [activeCall, setActiveCall] = useState<LiveCallSession | null>(null);

  // EMERGENCY KILL SWITCH: Triggers when the app is reloaded
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_CALL);
      if (saved) {
         console.warn("Emergency Kill Switch: Cleaning up stale call after reload.");
         localStorage.removeItem(STORAGE_KEY_ACTIVE_CALL);
         const parsed = JSON.parse(saved);
         if (parsed && parsed.roomCode) {
            import('firebase/firestore').then(({ doc, getDoc, setDoc }) => {
               getDoc(doc(db, 'live_calls', parsed.roomCode)).then(snap => {
                  if (snap.exists()) {
                     const callData = snap.data();
                     // Attempt to remove ghost participants with our user ID
                     const myUserId = currentEmployee?.id || currentStudent?.id || 'guest';
                     const filtered = callData.participants.filter(p => p.userId !== myUserId);
                     if (filtered.length !== callData.participants.length) {
                         setDoc(doc(db, 'live_calls', parsed.roomCode), { ...callData, participants: filtered }, { merge: true });
                     }
                  }
               });
            }).catch(() => {});
         }
      }
    } catch (err) {
      console.error(err);
    }
  }, [currentEmployee?.id, currentStudent?.id]);

  const [localStream,
setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const localParticipantIdRef = useRef<string>(`part-${Math.random().toString(36).substr(2, 9)}`);
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasMediaPermissions, setHasMediaPermissions] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const { remoteStreams, connectToPeer, networkQuality, replaceVideoTrack } = useWebRTC(activeCall?.roomCode || "", localParticipantIdRef.current, localStream);

  // Incoming Call State
  const [incomingCall, setIncomingCall] = useState<{ roomCode: string; callerName: string; title: string; type: CallType } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);


  useEffect(() => {
    if (!activeCall && localStream) {
       cleanupMedia();
    }
  }, [activeCall]);


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


  useEffect(() => {
    const handleBeforeUnload = () => {
       if (activeCall) {
          localStorage.removeItem(STORAGE_KEY_ACTIVE_CALL);
          // Attempting synchronous cleanup might not work perfectly, but we remove the local state
       }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeCall]);

  // Broadcast / Listen for multi-tab live sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_ACTIVE_CALL && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setActiveCall(parsed);
        } catch (err) {
          console.error(err);
        }
      } else if (e.key === STORAGE_KEY_ACTIVE_CALL && !e.newValue) {
        setActiveCall(null);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Update localStorage when activeCall changes
  const saveCallState = useCallback((call: LiveCallSession | null) => {
    setActiveCall(call);
    if (call) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_CALL, JSON.stringify(call));
      setDoc(doc(db, 'live_calls', call.roomCode), JSON.parse(JSON.stringify(call))).catch(e => console.error("Firebase sync error:", e));
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_CALL);
      // We don't delete from Firebase so others stay in the call, but if we are the last one, we could.
    }
  }, []);

  // Sync with Firebase for multi-device live calls
  useEffect(() => {
    if (!activeCall?.roomCode) return;
    const unsub = onSnapshot(doc(db, 'live_calls', activeCall.roomCode), (docSnap) => {
      if (docSnap.exists()) {
        const remoteCall = docSnap.data() as LiveCallSession;
        
        setActiveCall((prev) => {
          const myLocalUserId = localParticipantIdRef.current;
          // Connect to new peers
          remoteCall.participants.forEach(p => {
             if (p.id !== myLocalUserId && (!prev || !prev.participants.find(oldP => oldP.id === p.id))) {
                 connectToPeer(p.id);
             }
          });
          if (!prev) return remoteCall;
          
          const localP = prev.participants.find(p => p.isLocal);
          
          const iAmInCall = remoteCall.participants.find(p => p.id === myLocalUserId);
          
          if (!iAmInCall) {
            // We were removed from the call (maybe we left on another device)
            return null;
          }
          
          // Preserve local states for our participant
          const updatedParticipants = remoteCall.participants.map(p => {
            if (p.id === myLocalUserId) {
              return { ...p, isLocal: true, isAudioOn: p.isAudioOn, isVideoOn: p.isVideoOn };
            }
            return { ...p, isLocal: false };
          });
          return { ...remoteCall, participants: updatedParticipants };
        });
      } else {
        setActiveCall(null);
        localStorage.removeItem(STORAGE_KEY_ACTIVE_CALL);
      }
    });
    return () => unsub();
  }, [activeCall?.roomCode, currentEmployee?.id, currentStudent?.id]);

  // Acquire user media stream (Camera & Mic)
  const initLocalMedia = async (): Promise<MediaStream | null> => {
    try {
      if (localStream) {
        return localStream;
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        setLocalStream(stream);
        setHasMediaPermissions(true);
        setMediaError(null);

        // Setup real-time audio volume analyzer for speaking detection
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkAudio = () => {
              if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
              }
              animFrameRef.current = requestAnimationFrame(checkAudio);
            };
            checkAudio();
          }
        } catch (audioErr) {
          console.warn('Audio analyser not supported:', audioErr);
        }

        return stream;
      }
    } catch (err: any) {
      console.warn('Media devices error or permission denied:', err);
      setMediaError(err?.message || 'Camera/Microphone permission denied or not available. Using interactive virtual avatar mode.');
      setHasMediaPermissions(false);
    }
    return null;
  };

  // Clean up media streams
  const cleanupMedia = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);
    setIsHandRaised(false);
  };

  // START A NEW LIVE CALL (Classroom / Staff Meeting / 1-on-1)
  const startCall = async (
    roomCode: string,
    hostUser: { id: string; name: string; role: string; avatarUrl?: string },
    title: string,
    type: CallType = 'meeting'
  ) => {
    // Check if it already exists in Firebase
    try {
      const { getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'live_calls', roomCode);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // Just join it
        return joinCall(roomCode, hostUser, title, type);
      }
    } catch (e) {
      console.warn("Could not fetch from Firebase:", e);
    }

    await initLocalMedia();

    const hostParticipant: CallParticipant = {
      id: localParticipantIdRef.current,
      userId: hostUser.id,
      deviceId: localParticipantIdRef.current,
      name: hostUser.name,
      role: hostUser.role,
      avatarUrl: hostUser.avatarUrl,
      isLocal: true,
      isTeacher: hostUser.role.toLowerCase().includes('teacher') || hostUser.role.toLowerCase().includes('admin'),
      isVideoOn: !isVideoMuted,
      isAudioOn: !isMicMuted,
      isHandRaised: false,
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      connectionQuality: 'good'
    };

    let allParticipants: CallParticipant[] = [hostParticipant];

    const newCall: LiveCallSession = {
      id: `call-${Date.now()}`,
      title: title,
      roomCode: roomCode,
      type: type,
      hostId: hostUser.id,
      hostName: hostUser.name,
      startedAt: new Date().toISOString(),
      participants: allParticipants,
      currentSlideIndex: 0,
      activeDeckSource: 'custom',
      isWhiteboardOpen: false,
      isChatOpen: false,
      messages: [
        {
          id: `m-sys-${Date.now()}`,
          senderId: 'system',
          senderName: 'Vault Room Bot',
          text: `Live ${type === 'class' ? 'Classroom' : 'Conference'} session started. Microphones, cameras, and presentation sync active.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    saveCallState(newCall);
    setIsCallMinimized(false);
  };

  // JOIN AN EXISTING LIVE CALL
  const joinCall = async (
    roomCode: string,
    user: { id: string; name: string; role: string; avatarUrl?: string },
    callTitle?: string,
    type: CallType = 'meeting'
  ) => {
    await initLocalMedia();

    let existingCall = activeCall;
    if (!existingCall || existingCall.roomCode !== roomCode) {
      try {
        const { getDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'live_calls', roomCode);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          existingCall = docSnap.data() as LiveCallSession;
        } else {
          const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_CALL);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.roomCode === roomCode) {
              existingCall = parsed;
            }
          }
        }
      } catch (e) {
        console.warn("Could not fetch from Firebase:", e);
      }
    }

    const localParticipant: CallParticipant = {
      id: localParticipantIdRef.current,
      userId: user.id,
      deviceId: localParticipantIdRef.current,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isLocal: true,
      isTeacher: user.role.toLowerCase().includes('teacher') || user.role.toLowerCase().includes('admin'),
      isVideoOn: !isVideoMuted,
      isAudioOn: !isMicMuted,
      isHandRaised: false,
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      connectionQuality: 'good'
    };

    if (existingCall) {
      const otherParticipants = existingCall.participants.filter(p => p.id !== localParticipantIdRef.current).map(p => ({ ...p, isLocal: false }));
      const updated: LiveCallSession = {
        ...existingCall,
        participants: [...otherParticipants, localParticipant],
        messages: [
          ...existingCall.messages,
          {
            id: `m-join-${Date.now()}`,
            senderId: 'system',
            senderName: 'Vault Room Bot',
            text: `${user.name} joined the room.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      };
      saveCallState(updated);
    } else {
      // Create session on-the-fly
      const newCall: LiveCallSession = {
        id: `call-${Date.now()}`,
        title: callTitle || `Room: ${roomCode}`,
        roomCode,
        type,
        hostId: localParticipantIdRef.current,
        hostName: user.name,
        startedAt: new Date().toISOString(),
        participants: [localParticipant],
        currentSlideIndex: 0,
        messages: [
          {
            id: `m-init-${Date.now()}`,
            senderId: 'system',
            senderName: 'Vault Room Bot',
            text: `Joined ${callTitle || 'call room'}.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      };
      saveCallState(newCall);
    }

    setIsCallMinimized(false);
  };

  // LEAVE CALL
  const leaveCall = () => {
    cleanupMedia();
    if (activeCall) {
      const localParticipant = activeCall.participants.find(p => p.isLocal);
      const myId = localParticipant?.id || currentEmployee?.id || currentStudent?.id || 'guest';
      const myName = localParticipant?.name || currentEmployee?.name || currentStudent?.name || 'A user';
      
      const updatedParticipants = activeCall.participants.filter(p => p.id !== myId);
      
      // Update Firebase to remove us
      const updatedCall = {
        ...activeCall,
        participants: updatedParticipants,
        messages: [
          ...activeCall.messages,
          {
            id: `m-leave-${Date.now()}`,
            senderId: 'system',
            senderName: 'Vault Room Bot',
            text: `${myName} left the room.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      };
      
      // If we were the last participant, delete the doc, otherwise update it
      if (updatedParticipants.length > 0) {
        setDoc(doc(db, 'live_calls', activeCall.roomCode), JSON.parse(JSON.stringify(updatedCall))).catch(e => console.error("Firebase sync error:", e));
      } else {
        deleteDoc(doc(db, 'live_calls', activeCall.roomCode)).catch(e => console.error("Firebase sync error:", e));
      }
    }
    
    // Pass null but bypass Firebase write in saveCallState so we don't nullify the DB for others
    setActiveCall(null);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_CALL);
  };

  // TOGGLE LOCAL MIC
  const toggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMicMuted;
      });
    }
    const nextState = !isMicMuted;
    setIsMicMuted(nextState);

    if (activeCall) {
      const updatedParticipants = activeCall.participants.map(p => 
        p.isLocal ? { ...p, isAudioOn: !nextState } : p
      );
      saveCallState({ ...activeCall, participants: updatedParticipants });
    }
  };

  // TOGGLE LOCAL VIDEO / CAMERA
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isVideoMuted;
      });
    }
    const nextState = !isVideoMuted;
    setIsVideoMuted(nextState);

    if (activeCall) {
      const updatedParticipants = activeCall.participants.map(p => 
        p.isLocal ? { ...p, isVideoOn: !nextState } : p
      );
      saveCallState({ ...activeCall, participants: updatedParticipants });
    }
  };

  const approveScreenShare = (participantId: string) => {
    if (activeCall) {
      saveCallState({
        ...activeCall,
        screenShareRequest: undefined,
        screenShareApprovedFor: participantId
      });
    }
  };

  const denyScreenShare = () => {
    if (activeCall) {
      saveCallState({
        ...activeCall,
        screenShareRequest: undefined
      });
    }
  };

  // TOGGLE SCREEN SHARING
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
        replaceVideoTrack(null);
      }
      setIsScreenSharing(false);
      if (activeCall) {
        saveCallState({
          ...activeCall,
          screenShareParticipantId: undefined,
          participants: activeCall.participants.map(p => p.isLocal ? { ...p, isScreenSharing: false } : p)
        });
      }
    } else {
      if (activeCall) {
        const localP = activeCall.participants.find(p => p.isLocal);
        if (localP && localP.role === "Student" && activeCall.screenShareApprovedFor !== localP.id) {
          saveCallState({
            ...activeCall,
            screenShareRequest: { participantId: localP.id, name: localP.name }
          });
          alert("Screen sharing request sent to the teacher.");
          return;
        }
      }
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });
          setScreenStream(stream);
          setIsScreenSharing(true);
          replaceVideoTrack(stream.getVideoTracks()[0]);

          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            setScreenStream(null);
            replaceVideoTrack(null);
            if (activeCall) {
              saveCallState({
                ...activeCall,
                screenShareParticipantId: undefined,
                participants: activeCall.participants.map(p => p.isLocal ? { ...p, isScreenSharing: false } : p)
              });
            }
          };

          if (activeCall) {
            const localP = activeCall.participants.find(p => p.isLocal);
            saveCallState({
              ...activeCall,
              screenShareParticipantId: localP?.id || 'local',
              participants: activeCall.participants.map(p => p.isLocal ? { ...p, isScreenSharing: true } : p)
            });
          }
        }
      } catch (err) {
        console.warn('Screen share error or cancelled:', err);
      }
    }
  };

  // TOGGLE HAND RAISE
  const toggleHandRaise = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    if (activeCall) {
      const updatedParticipants = activeCall.participants.map(p => 
        p.isLocal ? { ...p, isHandRaised: next } : p
      );
      saveCallState({ ...activeCall, participants: updatedParticipants });
    }
  };

  // SEND IN-CALL MESSAGE
  const sendCallMessage = (text: string, sender: { id: string; name: string }) => {
    if (!activeCall || !text.trim()) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: sender.id,
      senderName: sender.name,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    saveCallState({
      ...activeCall,
      messages: [...activeCall.messages, newMsg]
    });
  };

  // BROADCAST LIVE CAPTION TO ROOM (SHARED WITH ALL PARTICIPANTS)
  const broadcastLiveCaption = (caption: { speakerId: string; speakerName: string; originalText: string; sourceLang?: string }) => {
    if (!activeCall || !caption.originalText.trim()) return;
    const cleanText = caption.originalText.trim();
    const newCap = {
      id: `cap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      speakerId: caption.speakerId,
      speakerName: caption.speakerName,
      originalText: cleanText,
      sourceLang: caption.sourceLang || 'en',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    const prevCaptions = activeCall.liveCaptions || [];
    // Keep a generous buffer of up to 300 meeting captions so the entire conversation is documented
    const updatedCaptions = [...prevCaptions.slice(-299), newCap];
    saveCallState({
      ...activeCall,
      liveCaptions: updatedCaptions
    });
  };

  // UPDATE PRESENTATION SLIDE (SYNCED WITH ROOM)
  const updatePresentationSlide = (index: number) => {
    if (!activeCall) return;
    saveCallState({
      ...activeCall,
      currentSlideIndex: index
    });
  };

  // UPDATE PRESENTATION DECK SOURCE
  const updatePresentationDeck = (deckSource: 'custom' | 'curriculum', deckId?: string, unitNumber?: number) => {
    if (!activeCall) return;
    saveCallState({
      ...activeCall,
      activeDeckSource: deckSource,
      activeDeckId: deckId,
      activeUnitNumber: unitNumber,
      currentSlideIndex: 0
    });
  };

  // MUTE ALL STUDENTS
  const muteAllStudents = () => {
    if (!activeCall) return;
    const updated = activeCall.participants.map(p => {
      if (!p.isTeacher && !p.role.toLowerCase().includes('admin')) {
        return { ...p, isAudioOn: false };
      }
      return p;
    });
    saveCallState({
      ...activeCall,
      participants: updated,
      messages: [
        ...activeCall.messages,
        {
          id: `m-mute-${Date.now()}`,
          senderId: 'system',
          senderName: 'Teacher Control',
          text: 'Instructor muted all student microphones.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    });
  };

  // TOGGLE SPECIFIC PARTICIPANT AUDIO (TEACHER OVERRIDE)
  const toggleParticipantAudio = (participantId: string) => {
    if (!activeCall) return;
    const updated = activeCall.participants.map(p => {
      if (p.id === participantId) {
        return { ...p, isAudioOn: !p.isAudioOn };
      }
      return p;
    });
    saveCallState({ ...activeCall, participants: updated });
  };


  const removeParticipant = (participantId: string) => {
    if (!activeCall) return;
    const updated = activeCall.participants.filter(p => p.id !== participantId);
    saveCallState({ ...activeCall, participants: updated });
  };

  // RING PARTICIPANT
  const ringParticipant = (name: string) => {
    if (!activeCall) return;
    saveCallState({
      ...activeCall,
      messages: [
        ...activeCall.messages,
        {
          id: `m-ring-${Date.now()}`,
          senderId: 'system',
          senderName: 'Vault Call',
          text: `Ringing ${name}... inviting to join the live room.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    });
  };

  const acceptIncomingCall = async (user: { id: string; name: string; role: string; avatarUrl?: string }) => {
    if (!incomingCall) return;

    await joinCall(incomingCall.roomCode, user, incomingCall.title, incomingCall.type);
    setIncomingCall(null);
  };

  const declineIncomingCall = () => {
    setIncomingCall(null);
  };

  return (
    <LiveCallContext.Provider
      value={{
        activeCall,
        localStream,
        remoteStreams,
        screenStream,
        isMicMuted,
        isVideoMuted,
        isScreenSharing,
        isHandRaised,
        isCallMinimized,
        isWhiteboardActive,
        isChatDrawerOpen,
        audioLevel,
        hasMediaPermissions,
        mediaError,
        networkQuality,
        startCall,
        joinCall,
        leaveCall,
        toggleMic,
        toggleVideo,
        toggleScreenShare,
        approveScreenShare,
        denyScreenShare,
        toggleHandRaise,
        setIsCallMinimized,
        setIsWhiteboardActive,
        setIsChatDrawerOpen,
        sendCallMessage,
        broadcastLiveCaption,
        updatePresentationSlide,
        updatePresentationDeck,
        muteAllStudents,
        toggleParticipantAudio,
        removeParticipant,
        ringParticipant,
        incomingCall,
        acceptIncomingCall,
        declineIncomingCall
      }}
    >
      {children}
    </LiveCallContext.Provider>
  );
};

export const useLiveCall = () => {
  const context = useContext(LiveCallContext);
  if (!context) {
    throw new Error('useLiveCall must be used within a LiveCallProvider');
  }
  return context;
};
