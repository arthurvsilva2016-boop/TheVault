import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirebaseSync<T>(
  documentName: string,
  initialData: T[]
): [T[], (action: T[] | ((prev: T[]) => T[])) => void, boolean] {
  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;

  const [data, setData] = useState<T[]>(() => {
    try {
      const cached = localStorage.getItem(`vault_sync_${documentName}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && (parsed.length > 0 || initialData.length === 0)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`Failed to parse cached data for ${documentName}`, e);
    }
    return initialData;
  });

  const dataRef = useRef<T[]>(data);
  const lastSyncedJsonRef = useRef<string>('');
  const initialized = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<T[] | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Synchronous flush on page reload/navigation to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingDataRef.current !== null) {
        try {
          const sanitizedList = JSON.parse(JSON.stringify(pendingDataRef.current));
          setDoc(doc(db, 'app_state', documentName), { list: sanitizedList });
        } catch (e) {
          console.warn(`BeforeUnload save warning on ${documentName}:`, e);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [documentName]);

  // Firestore Realtime Listener
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'app_state', documentName),
      (docSnap) => {
        if (docSnap.exists()) {
          const rawRemote = docSnap.data();
          const remoteList = rawRemote?.list;
          
          if (Array.isArray(remoteList)) {
            const remoteJson = JSON.stringify(remoteList);
            lastSyncedJsonRef.current = remoteJson;
            setData(remoteList);
            try {
              localStorage.setItem(`vault_sync_${documentName}`, remoteJson);
            } catch (e) {
              console.warn(`LocalStorage write error on ${documentName}:`, e);
            }
          }
          setIsLoaded(true);
          initialized.current = true;
        } else {
          // Document does not exist in Firestore yet: seed from current local state or initialData
          if (!initialized.current) {
            const seedSource = dataRef.current.length > 0 ? dataRef.current : initialDataRef.current;
            const sanitizedInitial = JSON.parse(JSON.stringify(seedSource));
            lastSyncedJsonRef.current = JSON.stringify(sanitizedInitial);
            setDoc(doc(db, 'app_state', documentName), { list: sanitizedInitial }).catch(e =>
              console.error(`Firestore init error on ${documentName}:`, e)
            );
            setIsLoaded(true);
            initialized.current = true;
          }
        }
      },
      (err) => {
        console.error(`Firestore snapshot error for ${documentName}:`, err);
        setIsLoaded(true);
      }
    );

    return () => unsub();
  }, [documentName]);

  const setSyncedData = useCallback(
    (action: T[] | ((prev: T[]) => T[])) => {
      const next = typeof action === 'function' ? (action as any)(dataRef.current) : action;
      dataRef.current = next;
      pendingDataRef.current = next;
      setData(next);

      const nextJson = JSON.stringify(next);
      try {
        localStorage.setItem(`vault_sync_${documentName}`, nextJson);
      } catch (e) {
        console.warn(`LocalStorage quota exceeded on ${documentName}:`, e);
      }

      if (nextJson === lastSyncedJsonRef.current) {
        return;
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          lastSyncedJsonRef.current = nextJson;
          pendingDataRef.current = null;
          const sanitizedList = JSON.parse(JSON.stringify(next));
          await setDoc(doc(db, 'app_state', documentName), { list: sanitizedList });
        } catch (e) {
          console.error(`Firestore save error on ${documentName}:`, e);
        }
      }, 250);
    },
    [documentName]
  );

  return [data, setSyncedData, isLoaded];
}
