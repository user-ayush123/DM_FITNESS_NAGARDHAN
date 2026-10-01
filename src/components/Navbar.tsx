import React from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import {
  Dumbbell,
  Users,
  Settings,
  Cloud,
  LogIn,
  LogOut,
  Plus
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  authLoading: boolean;
  onOpenAddModal: () => void;
  totalMembersCount: number;
  activeTab: 'members' | 'settings';
  onTabChange: (tab: 'members' | 'settings') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  authLoading,
  onOpenAddModal,
  totalMembersCount,
  activeTab,
  onTabChange,
}) => {
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Sign-in failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#0c0d12]/90 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onTabChange('members')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 shadow-lg shadow-emerald-500/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <Dumbbell className="h-5 w-5 text-black stroke-[2.2]" />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold tracking-tight text-white">
                  DM <span className="text-emerald-400">FITNESS</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-emerald-400 border border-emerald-500/20 uppercase">
                  Admin
                </span>
              </div>
              <p className="hidden sm:block text-[10px] font-medium tracking-wide text-zinc-400">
                POWER • STRENGTH • ENDURANCE
              </p>
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs: Members vs Settings */}
        <div className="flex items-center gap-1 rounded-2xl bg-zinc-950/80 p-1 border border-zinc-800/80">
          <button
            onClick={() => onTabChange('members')}
            className={`flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            <span>Members</span>
            <span className="hidden md:inline-block rounded-md bg-zinc-900 px-1.5 py-0.2 text-[10px] text-zinc-400">
              {totalMembersCount}
            </span>
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Settings className="h-3.5 w-3.5 text-emerald-400" />
            <span>Settings</span>
          </button>
        </div>

        {/* Right Actions & Firebase Auth */}
        <div className="flex items-center gap-2.5">
          {/* Quick Add Member button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-black shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Member</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Sync indicator & Auth */}
          <div className="flex items-center gap-1.5 rounded-xl bg-zinc-900/90 p-1 border border-zinc-800">
            {user ? (
              <div className="flex items-center gap-2 pr-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Admin'}
                    className="h-7 w-7 rounded-lg object-cover ring-1 ring-emerald-500/50"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    {(user.displayName || user.email || 'A')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left text-[11px] leading-tight max-w-[110px] truncate">
                  <p className="font-semibold text-zinc-200 truncate">
                    {user.displayName || 'Gym Admin'}
                  </p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <Cloud className="h-2.5 w-2.5 inline" /> Synced
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer"
                title="Connect with Google Sign-in to sync to Firebase cloud database"
              >
                <LogIn className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
