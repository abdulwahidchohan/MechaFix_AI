"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { VERIFIED_PINOUTS } from "@/lib/pinouts/pinoutData";
import { PRESETS } from "@/lib/presets";

interface SearchResultItem {
  id: string;
  type: "pinout" | "preset" | "guide";
  title: string;
  subtitle: string;
  categoryBadge: string;
  icon: string;
  itemData: any;
}

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

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQueryText("");
    setSelectedIndex(0);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setQueryText("");
    setSelectedIndex(0);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K shortcut overrides default browser search intentionally
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        } else {
          handleOpen();
        }
        return;
      }

      // Ignore single-key shortcuts when typing in inputs
      if (isEditableTarget(e.target)) return;

      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    const handleOpenEvent = () => handleOpen();

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("open-search-modal", handleOpenEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("open-search-modal", handleOpenEvent);
    };
  }, [isOpen, handleClose, handleOpen]);

  // Build searchable items
  const allSearchItems: SearchResultItem[] = [
    ...VERIFIED_PINOUTS.map((p) => ({
      id: `pinout-${p.id}`,
      type: "pinout" as const,
      title: p.name,
      subtitle: `${p.description} (${p.operatingVoltage})`,
      categoryBadge: "Pinout Reference",
      icon: "memory",
      itemData: p,
    })),
    ...PRESETS.map((p) => ({
      id: `preset-${p.id}`,
      type: "preset" as const,
      title: p.label,
      subtitle: `${p.board || "Arduino"} • ${p.problemCategory}`,
      categoryBadge: "Hardware Preset",
      icon: p.icon || "build",
      itemData: p,
    })),
    {
      id: "guide-5v",
      type: "guide",
      title: "5V Power Rail & Voltage Drop Check",
      subtitle: "Troubleshoot unpowered sensors, brownouts, and voltage drops",
      categoryBadge: "Troubleshooting Guide",
      icon: "bolt",
      itemData: { topic: "power-rail" },
    },
    {
      id: "guide-gnd",
      type: "guide",
      title: "Common Ground Reference Setup",
      subtitle: "Prevent floating signal levels and erratic sensor readings",
      categoryBadge: "Troubleshooting Guide",
      icon: "cable",
      itemData: { topic: "common-ground" },
    },
    {
      id: "guide-logic",
      type: "guide",
      title: "3.3V vs 5V Logic Level Converter Guide",
      subtitle: "Protect ESP32 / Raspberry Pi GPIO pins from 5V ultrasonic pulses",
      categoryBadge: "Troubleshooting Guide",
      icon: "shield",
      itemData: { topic: "logic-shifter" },
    },
  ];

  const filteredItems = allSearchItems.filter((item) => {
    if (!queryText.trim()) return true;
    const q = queryText.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.categoryBadge.toLowerCase().includes(q)
    );
  });

  const handleSelect = (item: SearchResultItem) => {
    handleClose();
    if (item.type === "pinout") {
      document.dispatchEvent(
        new CustomEvent("open-pinout-viewer", { detail: { pinoutId: item.itemData.id } })
      );
    } else if (item.type === "preset") {
      document.dispatchEvent(
        new CustomEvent("open-diagnosis-with-preset", { detail: { preset: item.itemData } })
      );
    } else {
      document.dispatchEvent(new CustomEvent("open-diagnosis"));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter" && filteredItems.length > 0) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex % filteredItems.length]);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-text/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        className="fixed inset-0" 
        onClick={handleClose} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-xl bg-surface border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200">
        <h2 id="search-modal-title" className="sr-only">Global Hardware Search</h2>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-border flex items-center gap-3 bg-surface-sunken">
          <span className="material-symbols-outlined text-primary text-xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={queryText}
            onChange={(e) => {
              setQueryText(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search pinouts, hardware presets, or error symptoms..."
            className="flex-1 bg-transparent font-sans text-sm text-text placeholder:text-text-muted outline-none border-none"
          />
          {queryText && (
            <button
              onClick={() => setQueryText("")}
              className="text-text-muted hover:text-text p-2 rounded-full text-xs min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
              aria-label="Clear search input"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-3 py-1.5 bg-surface border border-border rounded-lg text-text-muted text-[11px] font-mono hover:bg-surface-dim transition-colors min-h-[36px] flex items-center justify-center cursor-pointer"
            aria-label="Close search modal"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <span className="material-symbols-outlined text-3xl text-text-muted">search_off</span>
              <p className="font-sans text-sm text-text font-medium">No matching hardware results found</p>
              <p className="font-sans text-xs text-text-muted">
                Try searching for <strong>&quot;Arduino&quot;</strong>, <strong>&quot;ESP32&quot;</strong>, <strong>&quot;HC-SR04&quot;</strong>, or <strong>&quot;5V Rail&quot;</strong>.
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-primary-container border border-primary/20 text-primary"
                      : "hover:bg-surface-sunken text-text border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-primary text-surface" : "bg-surface-sunken text-text-muted"
                    }`}>
                      <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-sans font-semibold text-sm truncate">{item.title}</h4>
                      <p className="font-sans text-xs text-text-muted truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-1 rounded font-mono text-[10px] font-medium shrink-0 uppercase tracking-wider ${
                    isSelected ? "bg-primary/20 text-primary" : "bg-surface-sunken text-text-muted"
                  }`}>
                    {item.categoryBadge}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 bg-surface-sunken border-t border-border flex items-center justify-between text-[11px] font-mono text-text-muted">
          <span>Use ↑ ↓ to navigate</span>
          <span>↵ to select</span>
        </div>
      </div>
    </div>
  );
}
