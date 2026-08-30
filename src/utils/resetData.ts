import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  MOCK_EMPLOYEES,
  MOCK_ROLE_PRESETS,
  MOCK_STUDENTS,
  MOCK_GROUPS,
  MOCK_COLLECTIONS,
  MOCK_CLASS_SESSIONS,
  MOCK_TXS,
  MOCK_OCCURRENCES,
  MOCK_TASKS,
  MOCK_MEETINGS,
  MOCK_MESSAGES
} from '../data';

export interface ResetDataPayload {
  employees: typeof MOCK_EMPLOYEES;
  rolePresets: typeof MOCK_ROLE_PRESETS;
  students: typeof MOCK_STUDENTS;
  groups: typeof MOCK_GROUPS;
  collections: typeof MOCK_COLLECTIONS;
  classSessions: typeof MOCK_CLASS_SESSIONS;
  transactions: typeof MOCK_TXS;
  occurrences: typeof MOCK_OCCURRENCES;
  tasks: typeof MOCK_TASKS;
  meetings: typeof MOCK_MEETINGS;
  employeeMessages: typeof MOCK_MESSAGES;
}

export const INITIAL_DEFAULT_DATA: ResetDataPayload = {
  employees: MOCK_EMPLOYEES,
  rolePresets: MOCK_ROLE_PRESETS,
  students: MOCK_STUDENTS,
  groups: MOCK_GROUPS,
  collections: MOCK_COLLECTIONS,
  classSessions: MOCK_CLASS_SESSIONS,
  transactions: MOCK_TXS,
  occurrences: MOCK_OCCURRENCES,
  tasks: MOCK_TASKS,
  meetings: MOCK_MEETINGS,
  employeeMessages: MOCK_MESSAGES,
};

/**
 * Resets all Firestore app_state collections and browser local storage caches back to the pristine default mock state.
 */
export async function resetAllAppDataToDefaults(): Promise<void> {
  // 1. Clear LocalStorage caches for sync and state
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('vault_sync_') || key.startsWith('vault_state_') || key.startsWith('vault_whiteboard_') || key.startsWith('vault_slideshow_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    // Reset individual sync caches to initial values
    localStorage.setItem('vault_sync_employees', JSON.stringify(MOCK_EMPLOYEES));
    localStorage.setItem('vault_sync_rolePresets', JSON.stringify(MOCK_ROLE_PRESETS));
    localStorage.setItem('vault_sync_students', JSON.stringify(MOCK_STUDENTS));
    localStorage.setItem('vault_sync_groups', JSON.stringify(MOCK_GROUPS));
    localStorage.setItem('vault_sync_collections', JSON.stringify(MOCK_COLLECTIONS));
    localStorage.setItem('vault_sync_classSessions', JSON.stringify(MOCK_CLASS_SESSIONS));
    localStorage.setItem('vault_sync_transactions', JSON.stringify(MOCK_TXS));
    localStorage.setItem('vault_sync_occurrences', JSON.stringify(MOCK_OCCURRENCES));
    localStorage.setItem('vault_sync_tasks', JSON.stringify(MOCK_TASKS));
    localStorage.setItem('vault_sync_meetings', JSON.stringify(MOCK_MEETINGS));
    localStorage.setItem('vault_sync_employee_messages', JSON.stringify(MOCK_MESSAGES));
  } catch (err) {
    console.warn('Could not clear some local storage keys:', err);
  }

  // 2. Write defaults directly into Firestore app_state documents
  const collectionsMap: Record<string, any[]> = {
    employees: MOCK_EMPLOYEES,
    rolePresets: MOCK_ROLE_PRESETS,
    students: MOCK_STUDENTS,
    groups: MOCK_GROUPS,
    collections: MOCK_COLLECTIONS,
    classSessions: MOCK_CLASS_SESSIONS,
    transactions: MOCK_TXS,
    occurrences: MOCK_OCCURRENCES,
    tasks: MOCK_TASKS,
    meetings: MOCK_MEETINGS,
    employee_messages: MOCK_MESSAGES,
  };

  const promises = Object.entries(collectionsMap).map(async ([docName, list]) => {
    try {
      const sanitized = JSON.parse(JSON.stringify(list));
      await setDoc(doc(db, 'app_state', docName), { list: sanitized });
    } catch (e) {
      console.error(`Failed to reset Firestore document: app_state/${docName}`, e);
    }
  });

  await Promise.all(promises);
}
