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
        className="md:hidden text-text-muted p-2 rounded-lg hover:bg-surface-sunken transition-all"
        aria-label="Toggle navigation menu"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>
      <div className="flex-1"></div>
      
      <div className="flex items-center gap-3 md:gap-4">
        <ThemeToggle />

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-sunken border border-border">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="font-mono text-xs font-medium text-primary">AI Ready</span>
        </div>
        
        {user ? (
          <button 
            onClick={signOut}
            className="w-10 h-10 rounded-full border border-border overflow-hidden hover:ring-2 ring-primary transition-all shadow-neu-raised scale-95 flex items-center justify-center relative"
            title="Sign Out"
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
            className="px-4 py-2 bg-primary text-surface rounded-full font-semibold shadow-neu-raised hover:bg-primary-hover transition-all text-sm"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
