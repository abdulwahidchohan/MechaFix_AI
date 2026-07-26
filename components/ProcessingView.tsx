"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function ProcessingView({ imageFile }: { imageFile: File | null }) {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-surface-sunken/50 animate-in fade-in duration-500">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left: Image Preview Widget */}
        <div className="md:col-span-5 flex justify-center">
          <div className="relative w-64 h-80 rounded-2xl shadow-neu-pressed bg-surface p-2">
            <div className="w-full h-full rounded-xl overflow-hidden relative group">
              {imageUrl ? (
                <Image src={imageUrl} alt="Uploaded Circuit" fill className="object-cover blur-sm scale-110 opacity-70" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-border blur-sm scale-110 opacity-70"></div>
              )}
              
              {/* Scanning Overlay Effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/20 to-primary/5 animate-[gentle-pulse_3s_ease-in-out_infinite]"></div>
              
              {/* Grid lines overlay */}
              <div 
                className="absolute inset-0 opacity-20" 
                style={{ backgroundImage: 'linear-gradient(#3525cd 1px, transparent 1px), linear-gradient(90deg, #3525cd 1px, transparent 1px)', backgroundSize: '20px 20px' }}
              ></div>
              
              {/* Center focus reticle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-primary/40 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Status and Skeletons */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <div>
            <h2 className="font-sans text-2xl font-semibold text-text mb-2 flex items-center gap-3">
              <svg className="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking image quality and visible components...
            </h2>
            <p className="font-sans text-text-muted">This usually takes a few seconds.</p>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            <div className="shadow-neu-pressed bg-surface rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-surface-sunken animate-pulse flex-shrink-0"></div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 w-1/3 rounded bg-surface-sunken animate-pulse"></div>
                <div className="h-3 w-1/4 rounded bg-surface-sunken animate-pulse opacity-60"></div>
              </div>
              <span className="material-symbols-outlined text-border animate-pulse">memory</span>
            </div>

            <div className="shadow-neu-pressed bg-surface rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-surface-sunken animate-pulse flex-shrink-0" style={{ animationDelay: '200ms' }}></div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 w-1/2 rounded bg-surface-sunken animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="h-3 w-1/3 rounded bg-surface-sunken animate-pulse opacity-60" style={{ animationDelay: '200ms' }}></div>
              </div>
              <span className="material-symbols-outlined text-border animate-pulse" style={{ animationDelay: '200ms' }}>search</span>
            </div>

            <div className="shadow-neu-pressed bg-surface rounded-xl p-4 flex items-center gap-4 opacity-50">
              <div className="w-10 h-10 rounded-lg bg-surface-sunken animate-pulse flex-shrink-0" style={{ animationDelay: '400ms' }}></div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 w-2/5 rounded bg-surface-sunken animate-pulse" style={{ animationDelay: '400ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
