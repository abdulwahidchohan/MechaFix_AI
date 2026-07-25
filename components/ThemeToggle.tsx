"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";

export type ThemeId = "cloud" | "matcha" | "peach" | "bubblegum" | "midnight";

interface ThemeOption {
  id: ThemeId;
  name: string;
  icon: string;
  colorBg: string;
  colorAccent: string;
}

const THEMES: ThemeOption[] = [
  { id: "cloud", name: "Cloud", icon: "cloud", colorBg: "#F4F6FA", colorAccent: "#4F46E5" },
  { id: "matcha", name: "Matcha", icon: "eco", colorBg: "#F2F7F4", colorAccent: "#059669" },
  { id: "peach", name: "Peach Pop", icon: "light_mode", colorBg: "#FAF4F2", colorAccent: "#EA580C" },
  { id: "bubblegum", name: "Bubblegum", icon: "auto_awesome", colorBg: "#FAF4F8", colorAccent: "#DB2777" },
  { id: "midnight", name: "Midnight", icon: "dark_mode", colorBg: "#0F172A", colorAccent: "#818CF8" },
];

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("theme-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("theme-change", callback);
  };
}

function getThemeSnapshot(): ThemeId {
  if (typeof window === "undefined") return "cloud";
  const saved = localStorage.getItem("mechafix-theme") as ThemeId | null;
  return saved && THEMES.some((t) => t.id === saved) ? saved : "cloud";
}

function getServerThemeSnapshot(): ThemeId {
  return "cloud";
}

export default function ThemeToggle() {
  const currentTheme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [currentTheme]);

  const changeTheme = (themeId: ThemeId) => {
    document.documentElement.setAttribute("data-theme", themeId);
    localStorage.setItem("mechafix-theme", themeId);
    window.dispatchEvent(new Event("theme-change"));
    setIsOpen(false);
  };

  const activeThemeObj = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border shadow-neu-raised hover:shadow-neu-raised-hover hover:scale-[0.98] transition-all text-xs sm:text-sm font-medium text-text"
        title="Switch Theme"
        aria-label="Switch UI Theme"
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
          style={{ backgroundColor: activeThemeObj.colorAccent }}
        />
        <span className="hidden sm:inline font-sans">{activeThemeObj.name}</span>
        <span className="material-symbols-outlined text-base text-text-muted">palette</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface border border-border shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 text-xs font-semibold text-text-muted border-b border-border mb-1">
            Select Theme
          </div>
          <div className="space-y-1">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => changeTheme(theme.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  currentTheme === theme.id
                    ? "bg-primary-container text-primary font-semibold"
                    : "text-text hover:bg-surface-sunken"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: theme.colorAccent }}
                  />
                  <span>{theme.name}</span>
                </div>
                {currentTheme === theme.id && (
                  <span className="material-symbols-outlined text-sm text-primary">check</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
