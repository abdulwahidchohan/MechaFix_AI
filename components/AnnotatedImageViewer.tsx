"use client";

import React, { useState } from "react";
import { ImageAnnotation } from "@/lib/types";
import { ZoomIn, ZoomOut, RotateCcw, Tag, Eye, Info, AlertTriangle } from "lucide-react";

interface AnnotatedImageViewerProps {
  imageDataUrl: string;
  annotations?: ImageAnnotation[];
  title?: string;
}

export function AnnotatedImageViewer({
  imageDataUrl,
  annotations = [],
  title = "Hardware Evidence Image",
}: AnnotatedImageViewerProps) {
  const [activeTab, setActiveTab] = useState<"annotated" | "original">("annotated");
  const [selectedAnn, setSelectedAnn] = useState<ImageAnnotation | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const getCategoryColor = (category: ImageAnnotation["category"], certainty: ImageAnnotation["certaintyType"]) => {
    if (certainty === "safety_concern" || category === "damaged_region") {
      return {
        border: "border-red-500 bg-red-500/20 text-red-500",
        badge: "bg-red-600 text-white",
      };
    }
    switch (category) {
      case "board":
      case "sensor":
      case "actuator":
        return {
          border: "border-sky-500 bg-sky-500/20 text-sky-500",
          badge: "bg-sky-600 text-white",
        };
      case "power":
        return {
          border: "border-amber-500 bg-amber-500/20 text-amber-500",
          badge: "bg-amber-600 text-white",
        };
      case "connector":
      case "wire_region":
        return {
          border: "border-indigo-500 bg-indigo-500/20 text-indigo-500",
          badge: "bg-indigo-600 text-white",
        };
      default:
        return {
          border: "border-emerald-500 bg-emerald-500/20 text-emerald-500",
          badge: "bg-emerald-600 text-white",
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
      {/* Top Bar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-sky-500" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h4>
          {annotations.length > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 rounded-full">
              {annotations.length} Component Overlays
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("annotated")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === "annotated"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Annotated View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("original")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === "original"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Original Photo
            </button>
          </div>

          {/* Zoom buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative w-full overflow-hidden bg-slate-950 rounded-xl flex items-center justify-center min-h-[320px] max-h-[500px] border border-slate-800">
        <div
          className="relative transition-transform duration-200 ease-out max-w-full"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageDataUrl}
            alt="Hardware Evidence"
            className="max-h-[460px] object-contain block mx-auto select-none"
          />

          {/* Overlay Bounding Boxes */}
          {activeTab === "annotated" &&
            annotations.map((ann) => {
              const [ymin, xmin, ymax, xmax] = ann.box2d;
              const top = ymin / 10;
              const left = xmin / 10;
              const height = (ymax - ymin) / 10;
              const width = (xmax - xmin) / 10;

              const colors = getCategoryColor(ann.category, ann.certaintyType);
              const isSelected = selectedAnn?.id === ann.id;

              return (
                <div
                  key={ann.id}
                  onClick={() => setSelectedAnn(ann)}
                  className={`absolute border-2 cursor-pointer transition-all ${colors.border} ${
                    isSelected ? "ring-4 ring-white/80 z-20 shadow-lg scale-[1.02]" : "z-10 hover:opacity-90"
                  }`}
                  style={{
                    top: `${top}%`,
                    left: `${left}%`,
                    height: `${height}%`,
                    width: `${width}%`,
                  }}
                  title={`${ann.label}: ${ann.observation}`}
                >
                  <span
                    className={`absolute -top-6 left-0 px-1.5 py-0.5 text-[10px] font-bold rounded shadow ${colors.badge} whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]`}
                  >
                    {ann.label}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Annotation Detail Cards / Drawer */}
      {annotations.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-sky-500" /> Detected Component Findings (Click marker or card)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {annotations.map((ann) => {
              const isSelected = selectedAnn?.id === ann.id;
              return (
                <div
                  key={ann.id}
                  onClick={() => setSelectedAnn(ann)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {ann.label}
                    </span>
                    <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {ann.category}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-snug">
                    {ann.observation}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500">
                    <Info className="w-3 h-3 text-sky-500" />
                    <span>Certainty: <strong className="capitalize">{ann.certaintyType.replace("_", " ")}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
