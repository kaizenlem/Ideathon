import React from 'react';
import { UserProfile } from '../types';
import { Sparkles, LogOut, ShieldCheck, BookOpen } from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewEntry?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onSignOut, onNewEntry }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#262626] bg-[#0d0d0d]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24201a] border border-[#3d362a] text-[#c5b396] shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-semibold tracking-tight text-[#f5f5f5]">
                Gemini Reflections
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#12241a] border border-[#1e3d2b] px-2 py-0.5 text-xs font-medium text-[#6ee7b7]">
                <ShieldCheck className="h-3 w-3" />
                Isolated Firestore
              </span>
            </div>
            <p className="text-xs text-[#8a8a8a]">Gemini 3.6 Flash &bull; Private Journal Sandbox</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {onNewEntry && (
                <button
                  id="btn-new-entry"
                  onClick={onNewEntry}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#c5b396] px-3.5 py-1.5 text-xs font-semibold text-[#0a0a0a] shadow-xs hover:bg-[#d6c7ae] transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  New Reflection
                </button>
              )}

              <div className="flex items-center gap-2.5 rounded-full border border-[#262626] bg-[#141414] py-1 pl-1.5 pr-3 shadow-xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-6 w-6 rounded-full object-cover ring-1 ring-[#333333]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#262626] text-xs font-medium text-[#d4d4d4]">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-[#d4d4d4] max-w-[120px] truncate hidden md:inline-block">
                  {user.displayName || user.email}
                </span>
              </div>

              <button
                id="btn-sign-out"
                onClick={onSignOut}
                title="Sign Out"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#262626] bg-[#141414] text-[#a3a3a3] hover:bg-[#1e1e1e] hover:text-[#f5f5f5] transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
};
