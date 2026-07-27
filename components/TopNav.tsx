"use client";

import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function TopNav() {
  const { user, signIn, signOut } = useAuth();

  const avatarUrl =
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || "User")}`;

  const handleOpenSearch = () => {
    document.dispatchEvent(new CustomEvent("open-search-modal"));
  };

  return (
    <header className="h-16 w-full sticky top-0 bg-surface/80 border-b border-border backdrop-blur-md flex justify-between items-center px-4 md:px-8 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))}
          className="md:hidden text-text-muted rounded-lg hover:bg-surface-sunken transition-all min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <button
          onClick={handleOpenSearch}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-sunken border border-border shadow-neu-pressed text-xs font-mono text-text-muted hover:border-primary/50 hover:text-text transition-all cursor-pointer group"
          title="Search pinouts, hardware presets, or error symptoms (Ctrl+K)"
        >
          <span className="material-symbols-outlined text-[16px] text-primary group-hover:scale-110 transition-transform">search</span>
          <span>Search pinouts, boards, or error symptoms...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-sans font-medium text-text-muted group-hover:text-primary">Ctrl+K</kbd>
        </button>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Search Button */}
        <button
          onClick={handleOpenSearch}
          className="md:hidden text-text-muted rounded-lg hover:bg-surface-sunken transition-all min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
          aria-label="Open search"
          title="Search pinouts and presets"
        >
          <span className="material-symbols-outlined text-xl text-primary">search</span>
        </button>

        <ThemeToggle />

        <div
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-surface-sunken border border-border shadow-neu-pressed"
          aria-label="AI service ready"
          title="Gemini AI Diagnostic Service Ready"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0"></span>
          <span className="hidden sm:inline font-mono text-xs font-medium text-primary whitespace-nowrap">AI Ready</span>
        </div>
        
        {user ? (
          <button
            onClick={signOut}
            className="w-10 h-10 rounded-full border border-border overflow-hidden hover:ring-2 ring-primary transition-all shadow-neu-raised flex items-center justify-center relative shrink-0 min-w-[40px] min-h-[40px] cursor-pointer"
            title={`Signed in as ${user.email || "User"}. Click to sign out.`}
            aria-label="User profile, click to sign out"
          >
            <Image
              src={avatarUrl}
              alt="User Avatar"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </button>
        ) : (
          <button 
            onClick={signIn}
            className="px-4 py-2 bg-primary text-surface rounded-full font-semibold shadow-neu-raised hover:bg-primary-hover transition-all text-xs sm:text-sm min-h-[40px] flex items-center justify-center whitespace-nowrap cursor-pointer"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
