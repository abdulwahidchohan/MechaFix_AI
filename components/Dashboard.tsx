"use client";

import { PRESETS, PresetConfig } from "@/lib/presets";

export default function Dashboard({ onViewChange }: { onViewChange?: (view: string) => void }) {
  const handlePresetClick = (preset: PresetConfig) => {
    document.dispatchEvent(
      new CustomEvent("open-diagnosis-with-preset", { detail: { preset } })
    );
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-12 pb-12 animate-in fade-in zoom-in duration-500">
      <section className="space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-sunken text-primary border border-border shadow-neu-pressed w-max">
          <span className="material-symbols-outlined text-[16px]">image_search</span>
          <span className="font-sans text-sm font-medium tracking-wide uppercase">Photo-aware troubleshooting</span>
        </div>
        <h2 className="font-sans text-4xl md:text-[44px] text-text max-w-2xl leading-tight font-bold">
          Let’s figure out what’s <span className="text-primary relative inline-block">
            not working.
            <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary opacity-30" preserveAspectRatio="none" viewBox="0 0 100 10">
              <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="4"></path>
            </svg>
          </span>
        </h2>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          onClick={() => document.dispatchEvent(new CustomEvent('open-diagnosis'))}
          className="md:col-span-2 group relative h-48 rounded-[24px] bg-surface text-left overflow-hidden shadow-neu-raised hover:shadow-neu-raised-hover transition-all flex p-8 border border-border"
        >
          <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-5 transition-opacity"></div>
          <div className="relative z-10 flex flex-col h-full justify-between w-full">
            <div className="w-12 h-12 rounded-2xl bg-primary text-surface flex items-center justify-center shadow-neu-raised group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">add_a_photo</span>
            </div>
            <div>
              <h3 className="font-sans font-semibold text-text text-xl mb-1">New diagnosis</h3>
              <p className="font-sans text-text-muted text-sm">Upload a photo or describe your board setup</p>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity group-hover:translate-x-2 group-hover:-translate-y-2 text-text">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
          </div>
        </button>
        
        <button 
          onClick={() => onViewChange?.('active-projects')}
          className="h-48 rounded-[24px] bg-surface p-6 text-left border border-border hover:border-primary/50 shadow-neu-raised hover:shadow-neu-raised-hover transition-all flex flex-col justify-between group"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-surface-sunken text-primary flex items-center justify-center shadow-neu-pressed">
              <span className="material-symbols-outlined">play_arrow</span>
            </div>
            <span className="px-2 py-1 bg-surface-sunken text-text-muted font-mono text-[11px] font-medium rounded uppercase tracking-wider">In Progress</span>
          </div>
          <div>
            <h3 className="font-sans font-semibold text-text mb-1 flex items-center gap-1 group-hover:text-primary transition-colors">
              Continue session
              <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">arrow_forward</span>
            </h3>
            <div className="font-mono font-medium text-text-muted text-xs truncate">
              View active diagnostic projects
            </div>
          </div>
        </button>
      </section>

      <section className="space-y-4">
        <h3 className="font-sans text-text text-lg font-semibold">Start with a common issue</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {PRESETS.map((preset) => (
            <button 
              key={preset.id} 
              onClick={() => handlePresetClick(preset)}
              className="p-4 rounded-2xl bg-surface border border-border shadow-neu-raised hover:shadow-neu-raised-hover hover:-translate-y-1 transition-all flex flex-col gap-3 group text-left"
            >
              <div className="w-10 h-10 rounded-full bg-surface shadow-neu-pressed flex items-center justify-center text-text-muted group-hover:text-primary border border-border transition-colors">
                <span className="material-symbols-outlined text-[20px]">{preset.icon}</span>
              </div>
              <span className="font-sans font-medium text-sm text-text-muted group-hover:text-text transition-colors">{preset.label}</span>
            </button>
          ))}
          <button 
            onClick={() => document.dispatchEvent(new CustomEvent('open-diagnosis'))}
            className="p-4 rounded-2xl bg-surface-sunken border border-border border-dashed hover:bg-surface hover:border-primary/50 transition-all flex flex-col gap-3 group text-left items-center justify-center text-center"
          >
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-muted group-hover:text-primary shadow-sm border border-border transition-colors">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <span className="font-sans font-medium text-sm text-text-muted group-hover:text-primary transition-colors">Something else</span>
          </button>
        </div>
      </section>
    </div>
  );
}

