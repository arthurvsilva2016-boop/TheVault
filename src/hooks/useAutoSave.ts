import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseAutoSaveOptions<T> {
  intervalMs?: number; // Default: 30000 (30 seconds)
  storageKey?: string; // Optional localStorage key to persist draft
  enabled?: boolean;
  onSave?: (data: T) => void | Promise<void>;
}

export interface UseAutoSaveReturn<T> {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  saveNow: () => void;
  clearDraft: () => void;
  restoreDraft: () => T | null;
}

export function useAutoSave<T>(
  data: T,
  options: UseAutoSaveOptions<T> = {}
): UseAutoSaveReturn<T> {
  const {
    intervalMs = 30000, // 30 seconds default
    storageKey,
    enabled = true,
    onSave
  } = options;

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const dataRef = useRef<T>(data);
  const lastSavedDataRef = useRef<string>(JSON.stringify(data));
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  // Track changes
  useEffect(() => {
    dataRef.current = data;
    const currentStr = JSON.stringify(data);
    if (currentStr !== lastSavedDataRef.current) {
      setHasUnsavedChanges(true);
    }
  }, [data]);

  // Save implementation
  const performSave = useCallback(() => {
    if (!enabled) return;
    const currentStr = JSON.stringify(dataRef.current);
    
    // If no changes compared to last saved, skip
    if (currentStr === lastSavedDataRef.current && lastSaved !== null) {
      return;
    }

    setIsSaving(true);

    try {
      // 1. Save to local storage draft if key provided
      if (storageKey) {
        localStorage.setItem(`vault_autosave_${storageKey}`, currentStr);
      }

      // 2. Trigger custom onSave callback if provided
      if (onSaveRef.current) {
        onSaveRef.current(dataRef.current);
      }

      lastSavedDataRef.current = currentStr;
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (err) {
      console.warn('AutoSave error:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  }, [enabled, storageKey, lastSaved]);

  // Periodic interval auto-save every 30 seconds
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      performSave();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [enabled, intervalMs, performSave]);

  const clearDraft = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(`vault_autosave_${storageKey}`);
    }
    setHasUnsavedChanges(false);
  }, [storageKey]);

  const restoreDraft = useCallback((): T | null => {
    if (!storageKey) return null;
    try {
      const saved = localStorage.getItem(`vault_autosave_${storageKey}`);
      if (saved) {
        return JSON.parse(saved) as T;
      }
    } catch (e) {
      console.warn('Failed to restore auto-save draft', e);
    }
    return null;
  }, [storageKey]);

  return {
    lastSaved,
    isSaving,
    hasUnsavedChanges,
    saveNow: performSave,
    clearDraft,
    restoreDraft
  };
}
