import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
// Set local persistence
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore using the configured database ID
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
}, firebaseConfig.firestoreDatabaseId || '(default)');

export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // If popup is blocked by iframe or browser policy, fallback to redirect or throw detailed error
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      console.warn('Popup was blocked or closed, attempting sign-in via redirect fallback if applicable');
    }
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { FirebaseUser };
