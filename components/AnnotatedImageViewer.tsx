"use client";

import React, { useState } from "react";
import { ImageAnnotation } from "@/lib/types";
import { ZoomIn, ZoomOut, RotateCcw, Tag } from "lucide-react";

interface AnnotatedImageViewerProps {
  imageUrl: string;
  annotations: ImageAnnotation[];
  title?: string;
}

export function AnnotatedImageViewer({
  imageUrl,
  annotations = [],
  title = "Evidence Image Component Overlays",
}: AnnotatedImageViewerProps) {
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"annotated" | "original">("annotated");

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleZoomReset = () => setZoom(1);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "hazard":
      case "damage":
        return {
          box: "border-red-500 bg-red-500/10",
          badge: "bg-red-600 text-white",
        };
      case "component":
      case "ic":
        return {
          box: "border-sky-500 bg-sky-500/10",
          badge: "bg-sky-600 text-white",
        };
      case "connector":
      case "pin":
      case "header":
        return {
          box: "border-amber-500 bg-amber-500/10",
          badge: "bg-amber-600 text-white",
        };
      case "trace":
      case "wire":
        return {
          box: "border-purple-500 bg-purple-500/10",
          badge: "bg-purple-600 text-white",
        };
      default:
        return {
          box: "border-emerald-500 bg-emerald-500/10",
          badge: "bg-emerald-600 text-white",
        };
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-4 shadow-neu-raised">
      {/* Top Bar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-bold text-text">{title}</h4>
          {annotations.length > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-primary-container text-primary rounded-full">
              {annotations.length} Component Overlays
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex p-1 bg-surface-sunken border border-border rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("annotated")}
              className={`px-3 py-1 rounded-lg transition-all min-h-[36px] cursor-pointer ${
                activeTab === "annotated"
                  ? "bg-surface text-primary shadow-neu-pressed font-bold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Annotated View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("original")}
              className={`px-3 py-1 rounded-lg transition-all min-h-[36px] cursor-pointer ${
                activeTab === "original"
                  ? "bg-surface text-primary shadow-neu-pressed font-bold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Original Photo
            </button>
          </div>

          {/* Zoom buttons */}
          <div className="flex items-center gap-1 bg-surface-sunken border border-border rounded-xl p-1 text-text-muted">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-surface rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-surface rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="p-1.5 hover:bg-surface rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Image Canvas Container */}
      <div className="relative overflow-auto max-h-[500px] border border-border rounded-xl bg-surface-sunken p-2 flex items-center justify-center custom-scrollbar">
        <div
          className="relative inline-block transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
        >
          {/* Base Photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[440px] w-auto object-contain rounded-lg shadow-sm"
          />

          {/* Overlay Bounding Boxes */}
          {activeTab === "annotated" &&
            annotations.map((ann) => {
              const [ymin, xmin, ymax, xmax] = ann.box2d;
              const top = `${(ymin / 1000) * 100}%`;
              const left = `${(xmin / 1000) * 100}%`;
              const width = `${((xmax - xmin) / 1000) * 100}%`;
              const height = `${((ymax - ymin) / 1000) * 100}%`;

              const styles = getCategoryStyles(ann.category);
              const isSelected = selectedAnnId === ann.id;

              return (
                <div
                  key={ann.id}
                  onClick={() => setSelectedAnnId(isSelected ? null : ann.id)}
                  style={{ top, left, width, height }}
                  className={`absolute border-2 rounded transition-all cursor-pointer group ${styles.box} ${
                    isSelected ? "ring-4 ring-primary ring-offset-1 z-20" : "hover:border-white z-10"
                  }`}
                >
                  <span
                    className={`absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-bold rounded shadow ${styles.badge} whitespace-nowrap`}
                  >
                    {ann.label}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Annotations List Footer */}
      {annotations.length > 0 && activeTab === "annotated" && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="text-xs font-semibold text-text uppercase tracking-wider">
            Detected Components & Observations
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
            {annotations.map((ann) => {
              const isSelected = selectedAnnId === ann.id;
              const styles = getCategoryStyles(ann.category);
              return (
                <div
                  key={ann.id}
                  onClick={() => setSelectedAnnId(isSelected ? null : ann.id)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary-container text-primary shadow-neu-pressed font-semibold"
                      : "border-border bg-surface-sunken hover:bg-surface-dim text-text"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 font-bold">
                    <span className="truncate">{ann.label}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase ${styles.badge}`}>
                      {ann.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-snug line-clamp-2">
                    {ann.observation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
