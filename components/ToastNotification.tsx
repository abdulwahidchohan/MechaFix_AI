"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

export default function ToastNotification() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleShowToast = (e: any) => {
      const detail = e.detail || {};
      const title = detail.title || "Action completed";

      // Deduplicate identical active toasts
      setToasts((prev) => {
        if (prev.some((t) => t.title === title && t.message === detail.message)) {
          return prev;
        }

        const newToast: ToastMessage = {
          id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: detail.type || "success",
          title,
          message: detail.message,
          duration: detail.duration || 3500,
        };

        // Bounded queue: Maximum 4 active toasts
        const nextToasts = [...prev, newToast].slice(-4);

        setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== newToast.id));
        }, newToast.duration);

        return nextToasts;
      });
    };

    document.addEventListener("show-toast", handleShowToast);
    return () => document.removeEventListener("show-toast", handleShowToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div 
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === "warning" ? "alert" : "status"}
          className={`pointer-events-auto p-4 rounded-2xl border shadow-neu-raised flex items-start gap-3 transition-all animate-in slide-in-from-bottom-5 fade-in duration-300 ${
            toast.type === "success"
              ? "bg-surface border-emerald-500/30 text-emerald-900 dark:text-emerald-100"
              : toast.type === "warning"
              ? "bg-surface border-amber-500/30 text-amber-900 dark:text-amber-100"
              : "bg-surface border-primary/30 text-text"
          }`}
        >
          <div className="shrink-0 pt-0.5">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : toast.type === "warning" ? (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            ) : (
              <Info className="w-5 h-5 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-sans font-semibold text-xs text-text leading-snug">{toast.title}</h4>
            {toast.message && (
              <p className="font-sans text-[11px] text-text-muted mt-0.5 leading-normal">{toast.message}</p>
            )}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-text-muted hover:text-text p-2 rounded-lg transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
