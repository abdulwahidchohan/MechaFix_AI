"use client";

import { useEffect, useRef } from "react";

interface ImageQualityModalProps {
  imageLimitations: string[];
  onRetake: () => void;
  onChooseAnother: () => void;
  onContinueAnyway: () => void;
  onClose: () => void;
}

export default function ImageQualityModal({
  imageLimitations = [],
  onRetake,
  onChooseAnother,
  onContinueAnyway,
  onClose,
}: ImageQualityModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-text/40 backdrop-blur-sm flex items-center justify-center p-4 z-[85] animate-in fade-in duration-200 print:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-surface w-full max-w-md rounded-2xl p-6 shadow-2xl border border-amber-500/30 space-y-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-quality-title"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">no_photography</span>
          </div>
          <div className="flex-1">
            <h3 id="image-quality-title" className="font-sans font-bold text-lg text-text">
              This photo needs another try
            </h3>
            <p className="font-sans text-xs text-text-muted mt-1 leading-relaxed">
              The AI detected image clarity limitations that might affect component identification or trace inspection accuracy.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-surface-sunken min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close image quality modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Reasons List */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
          <span className="font-sans font-semibold text-xs text-amber-700 uppercase tracking-wider block">
            Observed Visibility Issues:
          </span>
          <ul className="space-y-1.5 text-xs text-text">
            {imageLimitations.length > 0 ? (
              imageLimitations.map((limit, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-sm shrink-0 mt-0.5">warning</span>
                  <span>{limit}</span>
                </li>
              ))
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-sm shrink-0 mt-0.5">warning</span>
                  <span>Component labels and pin markings are blurry or obscured.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-sm shrink-0 mt-0.5">warning</span>
                  <span>Wiring connections or solder joints are shadowed or out of frame.</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onRetake}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-surface font-sans font-semibold text-xs shadow-neu-raised hover:bg-primary-hover transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span className="material-symbols-outlined text-base">photo_camera</span>
            <span>Retake Photo with Camera</span>
          </button>

          <button
            type="button"
            onClick={onChooseAnother}
            className="w-full py-2.5 px-4 rounded-xl bg-surface-sunken text-text font-sans font-semibold text-xs border border-border hover:bg-border/30 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span className="material-symbols-outlined text-base">file_upload</span>
            <span>Choose Another Image File</span>
          </button>

          <button
            type="button"
            onClick={onContinueAnyway}
            className="w-full py-2 px-4 rounded-xl text-text-muted hover:text-text font-sans font-medium text-xs transition-colors text-center"
          >
            Continue with Text-Only Diagnosis
          </button>
        </div>
      </div>
    </div>
  );
}
