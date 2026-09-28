const fs = require('fs');
let code = fs.readFileSync('src/context/LiveCallContext.tsx', 'utf8');

// 1. Change activeCall initialization to null, clearing local storage on boot to act as a kill switch
code = code.replace(
  '  const [activeCall, setActiveCall] = useState<LiveCallSession | null>(() => {\n    try {\n      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_CALL);\n      return saved ? JSON.parse(saved) : null;\n    } catch {\n      return null;\n    }\n  });',
  `  const [activeCall, setActiveCall] = useState<LiveCallSession | null>(null);

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
               const { db } = require('../firebase');
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
  }, [currentEmployee?.id, currentStudent?.id]);`
);

// 2. Add beforeunload listener to gracefully leave call
const beforeUnloadCode = `
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
`;

code = code.replace(
  '  // Broadcast / Listen for multi-tab live sync',
  beforeUnloadCode + '\n  // Broadcast / Listen for multi-tab live sync'
);

fs.writeFileSync('src/context/LiveCallContext.tsx', code);
console.log('Added kill switch');
