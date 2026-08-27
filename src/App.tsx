/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signInWithGoogle, logOut, FirebaseUser } from './lib/firebase';
import { UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [newEntryTrigger, setNewEntryTrigger] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      // Clean, user-friendly error message for common Firebase auth issues
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Pop-up window was blocked by the browser. Please allow popups or open the app in a new tab.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError('This domain is not authorized in Firebase OAuth settings.');
      } else {
        setAuthError(err.message || 'Unable to sign in with Google. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setCurrentUser(null);
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  const handleTriggerNewEntry = () => {
    setNewEntryTrigger((prev) => prev + 1);
  };

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#262626] border-t-[#c5b396]" />
          <p className="mt-4 font-serif text-sm text-[#a3a3a3]">Initializing secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans antialiased selection:bg-[#c5b396]/20 selection:text-[#f5f5f5]">
      <Navbar
        user={currentUser}
        onSignOut={handleSignOut}
        onNewEntry={currentUser ? handleTriggerNewEntry : undefined}
      />

      <main>
        {currentUser ? (
          <Dashboard user={currentUser} onNewEntryTrigger={newEntryTrigger} />
        ) : (
          <LandingPage
            onSignIn={handleSignIn}
            isLoading={isSigningIn}
            error={authError}
          />
        )}
      </main>
    </div>
  );
}
