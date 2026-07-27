"use client";

import { useEffect, useState, useCallback } from "react";
import { Command, X, Search, PlusCircle, Palette, Cpu, HelpCircle } from "lucide-react";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable='true']") !== null
  );
}

export default function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleOpen = useCallback(() => setIsOpen(true), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when user is typing in editable inputs
      if (isEditableTarget(e.target)) return;

      // Ignore modifier combinations like Ctrl+C, Alt+T, etc. (except Shift+?)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Toggle shortcuts modal with Shift + ? or ?
      if (e.key === "?") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    const handleOpenEvent = () => handleOpen();

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("open-keyboard-shortcuts", handleOpenEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("open-keyboard-shortcuts", handleOpenEvent);
    };
  }, [isOpen, handleClose, handleOpen]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: "Ctrl + K / ⌘ + K", description: "Open Quick Search (Pinouts & Presets)", icon: Search },
    { key: "N", description: "Start New Diagnosis Drawer", icon: PlusCircle },
    { key: "T", description: "Cycle Visual Theme (5 Themes)", icon: Palette },
    { key: "P", description: "Open Verified Pinouts Viewer", icon: Cpu },
    { key: "?", description: "Toggle Keyboard Shortcuts Cheat Sheet", icon: HelpCircle },
    { key: "Esc", description: "Close any active modal or drawer", icon: Command },
  ];

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        className="fixed inset-0" 
        onClick={handleClose} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-md bg-surface border border-border shadow-2xl rounded-3xl overflow-hidden z-10 p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-primary" />
            <h3 id="shortcuts-modal-title" className="font-sans font-bold text-text text-base">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-text-muted hover:text-text rounded-xl hover:bg-surface-sunken transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close keyboard shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-surface-sunken border border-border/60 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-surface text-primary border border-border flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-sans text-xs text-text font-medium truncate">{s.description}</span>
                </div>
                <kbd className="px-2 py-1 bg-surface border border-border rounded-lg text-[11px] font-mono font-semibold text-primary shrink-0 shadow-neu-pressed">
                  {s.key}
                </kbd>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center text-text-muted font-mono text-[11px]">
          Press <kbd className="px-1 rounded bg-surface border border-border">Esc</kbd> or click outside to dismiss
        </div>
      </div>
    </div>
  );
}
