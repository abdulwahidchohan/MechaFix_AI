"use client";

import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Sidebar({ currentView, onViewChange }: { currentView: string, onViewChange: (view: string) => void }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    const handleClose = () => setIsMobileOpen(false);

    document.addEventListener("toggle-mobile-sidebar", handleToggle);
    document.addEventListener("close-mobile-sidebar", handleClose);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("toggle-mobile-sidebar", handleToggle);
      document.removeEventListener("close-mobile-sidebar", handleClose);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handleNavClick = (view: string) => {
    onViewChange(view);
    setIsMobileOpen(false);
  };

  const navContent = (
    <>
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-surface flex items-center justify-center shadow-neu-raised shrink-0">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
          </div>
          <div>
            <h1 className="font-sans text-xl font-bold text-primary tracking-tight">MechaFix AI</h1>
            <p className="font-sans text-xs font-medium text-text-muted">Hardware Diagnostic Lab</p>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileOpen(false)} 
          className="md:hidden text-text-muted p-1 rounded-lg hover:bg-surface-sunken"
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      
      <button 
        className="w-full bg-primary text-surface py-3 px-4 rounded-xl font-sans font-semibold shadow-neu-raised hover:shadow-neu-raised-hover hover:bg-primary-hover mb-8 flex items-center justify-center gap-2 group transition-all"
        onClick={() => {
          setIsMobileOpen(false);
          document.dispatchEvent(new CustomEvent('open-diagnosis'));
        }}
      >
        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
        New Diagnosis
      </button>
      
      <div className="flex flex-col gap-2 flex-grow">
        <a 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-surface-sunken text-primary font-semibold shadow-neu-pressed' : 'text-text-muted hover:bg-surface-sunken hover:text-text hover:scale-[0.98]'}`}
          href="#"
          onClick={(e) => { e.preventDefault(); handleNavClick('dashboard'); }}
        >
          <span className="material-symbols-outlined" style={currentView === 'dashboard' ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
          <span>Home</span>
        </a>
        <a 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'active-projects' ? 'bg-surface-sunken text-primary font-semibold shadow-neu-pressed' : 'text-text-muted hover:bg-surface-sunken hover:text-text hover:scale-[0.98]'}`}
          href="#"
          onClick={(e) => { e.preventDefault(); handleNavClick('active-projects'); }}
        >
          <span className="material-symbols-outlined" style={currentView === 'active-projects' ? { fontVariationSettings: "'FILL' 1" } : {}}>build</span>
          <span>Active Projects</span>
        </a>
        <a 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'repair-history' ? 'bg-surface-sunken text-primary font-semibold shadow-neu-pressed' : 'text-text-muted hover:bg-surface-sunken hover:text-text hover:scale-[0.98]'}`}
          href="#"
          onClick={(e) => { e.preventDefault(); handleNavClick('repair-history'); }}
        >
          <span className="material-symbols-outlined" style={currentView === 'repair-history' ? { fontVariationSettings: "'FILL' 1" } : {}}>history</span>
          <span>Repair History</span>
        </a>
      </div>
      
      <div className="flex flex-col gap-2 mt-auto pt-6 border-t border-border">
        <div className="flex items-center justify-between px-4 py-2 bg-surface-sunken rounded-xl border border-border/50 mb-1">
          <span className="font-sans text-xs font-semibold text-text-muted">Theme</span>
          <ThemeToggle />
        </div>
        <a 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'safety-protocols' ? 'bg-surface-sunken text-primary font-semibold shadow-neu-pressed' : 'text-text-muted hover:bg-surface-sunken hover:text-text hover:scale-[0.98]'}`}
          href="#"
          onClick={(e) => { e.preventDefault(); handleNavClick('safety-protocols'); }}
        >
          <span className="material-symbols-outlined" style={currentView === 'safety-protocols' ? { fontVariationSettings: "'FILL' 1" } : {}}>shield</span>
          <span className="font-sans text-sm font-medium">Safety Protocols</span>
        </a>
        <a 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'documentation' ? 'bg-surface-sunken text-primary font-semibold shadow-neu-pressed' : 'text-text-muted hover:bg-surface-sunken hover:text-text hover:scale-[0.98]'}`}
          href="#"
          onClick={(e) => { e.preventDefault(); handleNavClick('documentation'); }}
        >
          <span className="material-symbols-outlined" style={currentView === 'documentation' ? { fontVariationSettings: "'FILL' 1" } : {}}>description</span>
          <span className="font-sans text-sm font-medium">Documentation</span>
        </a>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <nav className="w-[280px] h-screen flex-col flex overflow-y-auto bg-surface shadow-neu-raised fixed left-0 top-0 p-6 z-40 custom-scrollbar hidden md:flex border-r border-border">
        {navContent}
      </nav>

      {/* Mobile Slide-in Drawer */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-text/30 backdrop-blur-sm z-50 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside 
        aria-label="Mobile Navigation Menu"
        className={`fixed left-0 top-0 h-full w-[280px] bg-surface shadow-2xl z-50 flex flex-col p-6 overflow-y-auto transition-transform duration-300 ease-in-out md:hidden border-r border-border ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}

