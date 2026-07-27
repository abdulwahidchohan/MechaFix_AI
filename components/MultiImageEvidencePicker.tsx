"use client";

import React, { useState } from "react";
import { Upload, X, AlertTriangle, CheckCircle, Image as ImageIcon } from "lucide-react";

export interface SelectedImageItem {
  id: string;
  data: string; // Base64
  mimeType: string;
  evidenceType: "photo" | "schematic" | "measurement_display" | "close_up_damage" | "other";
  fileName: string;
  sizeBytes: number;
  qualityWarning?: string;
}

interface MultiImageEvidencePickerProps {
  images: SelectedImageItem[];
  onChange: (images: SelectedImageItem[]) => void;
  maxImages?: number;
}

export function MultiImageEvidencePicker({
  images,
  onChange,
  maxImages = 5,
}: MultiImageEvidencePickerProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > maxImages) {
      setErrorMsg(`You can attach up to a maximum of ${maxImages} images per diagnostic session.`);
      return;
    }

    setErrorMsg(null);

    files.forEach((file) => {
      if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
        setErrorMsg("Only JPG, PNG, and WebP image formats are supported.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`File ${file.name} exceeds the 5 MB maximum size limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        // Strip data url prefix for base64 storage
        const base64Data = resultStr.split(",")[1] || resultStr;

        let warning: string | undefined;
        if (file.size < 30 * 1024) {
          warning = "Low resolution image. Text or small component labels may be hard to read.";
        }

        const newItem: SelectedImageItem = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          data: base64Data,
          mimeType: file.type === "image/jpg" ? "image/jpeg" : file.type,
          evidenceType: "photo",
          fileName: file.name,
          sizeBytes: file.size,
          qualityWarning: warning,
        };

        onChange([...images, newItem]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  const updateType = (
    id: string,
    type: "photo" | "schematic" | "measurement_display" | "close_up_damage" | "other"
  ) => {
    onChange(
      images.map((img) => (img.id === id ? { ...img, evidenceType: type } : img))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
          Visual Evidence Attachments ({images.length} / {maxImages})
        </label>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Up to 5 images (Max 5MB each: JPG, PNG, WebP)
        </span>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative group border border-border rounded-xl p-2.5 bg-surface-sunken flex flex-col gap-2"
          >
            <div className="relative h-32 w-full bg-surface rounded-lg overflow-hidden flex items-center justify-center border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${img.mimeType};base64,${img.data}`}
                alt={img.fileName}
                className="object-cover w-full h-full"
              />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute top-1 right-1 min-w-[44px] min-h-[44px] flex items-center justify-center bg-slate-900/80 hover:bg-red-600 text-white rounded-full transition-colors touch-manipulation z-10"
                aria-label={`Remove image ${img.fileName}`}
                title={`Remove image ${img.fileName}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <span className="font-medium truncate text-slate-700 dark:text-slate-300" title={img.fileName}>
                {img.fileName}
              </span>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{(img.sizeBytes / 1024).toFixed(0)} KB</span>
                {img.qualityWarning ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-[11px]">
                    <AlertTriangle className="w-3 h-3" /> Low Res
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                    <CheckCircle className="w-3 h-3" /> Clear
                  </span>
                )}
              </div>

              <select
                value={img.evidenceType}
                onChange={(e) => updateType(img.id, e.target.value as any)}
                className="mt-1 px-2 py-1 text-xs rounded border border-border bg-surface text-text focus:outline-none focus:border-primary"
              >
                <option value="photo">Hardware Photo</option>
                <option value="close_up_damage">Close-Up Damage / Solder</option>
                <option value="schematic">Wiring / Schematic Diagram</option>
                <option value="measurement_display">Multimeter / Display</option>
                <option value="other">Other Visual Reference</option>
              </select>
            </div>
          </div>
        ))}

        {images.length < maxImages && (
          <label className="border-2 border-dashed border-border hover:border-primary rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors h-48 bg-surface-sunken">
            <Upload className="w-6 h-6 text-text-muted" />
            <span className="text-xs font-medium text-text">
              Add Evidence Image
            </span>
            <span className="text-[11px] text-text-muted text-center">
              Drag & drop or click to upload
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}
