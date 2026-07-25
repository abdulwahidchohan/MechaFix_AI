"use client";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function TopNav() {
  const { user, signIn, signOut } = useAuth();

  const avatarUrl = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || "User")}`;

  return (
    <header className="h-16 w-full sticky top-0 bg-surface/80 border-b border-border backdrop-blur-md flex justify-between items-center px-4 md:px-8 z-30">
      <button 
        onClick={() => document.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
        className="md:hidden text-text-muted rounded-lg hover:bg-surface-sunken transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Toggle navigation menu"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>
      <div className="flex-1"></div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle />

        <div 
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-surface-sunken border border-border" 
          aria-label="AI service ready"
          title="AI Service Ready"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0"></span>
          <span className="hidden sm:inline font-mono text-xs font-medium text-primary whitespace-nowrap">AI Ready</span>
        </div>
        
        {user ? (
          <button 
            onClick={signOut}
            className="w-11 h-11 rounded-full border border-border overflow-hidden hover:ring-2 ring-primary transition-all shadow-neu-raised flex items-center justify-center relative shrink-0 min-w-[44px] min-h-[44px]"
            title="Sign Out"
            aria-label="User profile, click to sign out"
          >
            <Image 
              src={avatarUrl} 
              alt="User Avatar" 
              width={44} 
              height={44} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </button>
        ) : (
          <button 
            onClick={signIn}
            className="px-4 py-2 bg-primary text-surface rounded-full font-semibold shadow-neu-raised hover:bg-primary-hover transition-all text-xs sm:text-sm min-h-[44px] flex items-center justify-center whitespace-nowrap"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
