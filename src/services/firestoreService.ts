import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { JournalInteraction, ChatTurn } from '../types';

/**
 * Strips all undefined properties from an object recursively to guarantee
 * zero-crash Firestore payload hygiene.
 */
export function sanitizePayload<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => (value === undefined ? null : value))
  );
}

/**
 * Saves or updates a journal interaction in the user's isolated subcollection:
 * /users/{userId}/interactions/{interactionId}
 */
export async function saveJournalInteraction(
  userId: string,
  data: Omit<JournalInteraction, 'id'>,
  customId?: string
): Promise<string> {
  if (!userId) {
    throw new Error('User ID is required to save interaction.');
  }

  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const interactionDoc = customId ? doc(interactionsRef, customId) : doc(interactionsRef);

  const payload: any = sanitizePayload({
    ...data,
    userId,
    updatedAt: Date.now(),
    createdAt: data.createdAt || Date.now(),
    turns: data.turns || [],
    tags: data.tags || [],
  });

  await setDoc(interactionDoc, payload, { merge: true });
  return interactionDoc.id;
}

/**
 * Fetches all journal interactions for a user, sorted chronologically.
 */
export async function fetchUserInteractions(userId: string): Promise<JournalInteraction[]> {
  if (!userId) return [];

  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const q = query(interactionsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId || userId,
      title: data.title || 'Untitled Reflection',
      entryText: data.entryText || '',
      mode: data.mode || 'reflection',
      mood: data.mood || 'thoughtful',
      aiResponse: data.aiResponse || '',
      modelUsed: data.modelUsed,
      tags: data.tags || [],
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
      turns: data.turns || [],
    } as JournalInteraction;
  });
}

/**
 * Subscribes in real-time to user's journal interactions.
 */
export function subscribeToUserInteractions(
  userId: string,
  onUpdate: (interactions: JournalInteraction[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const q = query(interactionsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: JournalInteraction[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || 'Untitled Reflection',
          entryText: data.entryText || '',
          mode: data.mode || 'reflection',
          mood: data.mood || 'thoughtful',
          aiResponse: data.aiResponse || '',
          modelUsed: data.modelUsed,
          tags: data.tags || [],
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          turns: data.turns || [],
        } as JournalInteraction;
      });
      onUpdate(list);
    },
    (err) => {
      console.error('Error listening to user interactions:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Deletes a journal interaction.
 */
export async function deleteJournalInteraction(userId: string, interactionId: string): Promise<void> {
  if (!userId || !interactionId) return;
  const docRef = doc(db, 'users', userId, 'interactions', interactionId);
  await deleteDoc(docRef);
}

/**
 * Adds a follow-up conversation turn to an existing reflection.
 */
export async function appendChatTurn(
  userId: string,
  interactionId: string,
  newTurn: ChatTurn,
  existingTurns: ChatTurn[]
): Promise<void> {
  if (!userId || !interactionId) return;

  const docRef = doc(db, 'users', userId, 'interactions', interactionId);
  const updatedTurns = [...existingTurns, newTurn];

  await setDoc(
    docRef,
    sanitizePayload({
      turns: updatedTurns,
      updatedAt: Date.now(),
    }),
    { merge: true }
  );
}
