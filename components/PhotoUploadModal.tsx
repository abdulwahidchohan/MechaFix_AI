"use client";
import { useEffect, useState, useRef, useCallback } from "react";

export default function PhotoUploadModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Camera stream state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleClose = useCallback(() => {
    stopCamera();
    setUploadError(null);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setCameraError(null);
      setUploadError(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("open-photo-upload", handleOpen);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("open-photo-upload", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
      stopCamera();
    };
  }, [isOpen, handleClose]);

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setUploadError(null);
  };

  const handleFileSelected = (file: File) => {
    setUploadError(null);
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setUploadError("Unsupported image format. Please upload JPG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Image exceeds maximum allowed limit of 5 MB.");
      return;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to native mobile input
        cameraInputRef.current?.click();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.warn("Camera access failed, invoking mobile capture fallback:", err);
      setCameraError("Camera stream unavailable. Switching to device camera app...");
      cameraInputRef.current?.click();
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `circuit_capture_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          handleFileSelected(file);
          stopCamera();
        }
      }, "image/jpeg", 0.9);
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      document.dispatchEvent(
        new CustomEvent("photo-uploaded", { detail: { file: selectedFile } })
      );
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-text/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 z-[60]">
      <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div>
            <h2 className="font-sans font-bold text-2xl text-text hidden md:block">
              Add a clear circuit photo
            </h2>
            <h2 className="font-sans font-semibold text-xl text-text md:hidden">
              Photo Upload
            </h2>
            <p className="font-sans text-text-muted mt-1 max-w-md text-sm">
              A clear photo helps MechaFix separate visible evidence from possible causes.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="shadow-neu-raised w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:text-primary transition-colors shrink-0"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {isCameraActive ? (
            <div className="space-y-4">
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-border">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-5 py-2.5 rounded-xl bg-surface-sunken text-text font-sans font-semibold border border-border hover:bg-border/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={captureFrame}
                  className="px-6 py-2.5 rounded-xl bg-primary text-surface font-sans font-semibold shadow-neu-raised hover:bg-primary-hover transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">camera</span>
                  Capture Photo
                </button>
              </div>
            </div>
          ) : (
            <>
              {uploadError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm shrink-0">error</span>
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={startCamera}
                  className="shadow-neu-raised rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-center group bg-surface border border-border hover:border-primary/50 transition-all"
                >
                  <div className="w-14 h-14 rounded-full shadow-neu-pressed bg-surface-sunken flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">photo_camera</span>
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-text">Take a photo</h3>
                    <p className="font-sans font-medium text-sm text-text-muted mt-1">Live camera preview</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="shadow-neu-raised rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-center group bg-surface border border-border hover:border-primary/50 transition-all"
                >
                  <div className="w-14 h-14 rounded-full shadow-neu-pressed bg-surface-sunken flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">upload_file</span>
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-text">Upload an image</h3>
                    <p className="font-sans font-medium text-sm text-text-muted mt-1">Browse device files</p>
                  </div>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />

                <input
                  type="file"
                  ref={cameraInputRef}
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                />
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl text-xs font-medium border border-amber-500/20">
                  {cameraError}
                </div>
              )}

              {previewUrl ? (
                <div className="shadow-neu-pressed rounded-xl p-4 flex flex-col items-center border border-primary/30 bg-surface-sunken space-y-3">
                  <div className="relative w-full max-h-48 overflow-hidden rounded-lg flex items-center justify-center bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Selected Circuit Preview"
                      className="max-h-48 object-contain rounded-lg"
                    />
                  </div>
                  <div className="flex items-center justify-between w-full text-xs text-text font-medium">
                    <span className="truncate">{selectedFile?.name}</span>
                    <button
                      type="button"
                      onClick={clearPreview}
                      className="text-error hover:underline ml-2 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="shadow-neu-pressed rounded-xl p-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-border hover:border-primary hover:bg-surface-sunken transition-all cursor-pointer min-h-[140px]"
                >
                  <span className="material-symbols-outlined text-border text-[40px] mb-2">cloud_upload</span>
                  <p className="font-sans font-semibold text-text mb-1">Drag and drop photo here</p>
                  <p className="font-sans font-medium text-xs text-text-muted">JPG, PNG or HEIC up to 10MB</p>
                </div>
              )}

              <div className="bg-surface-sunken border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3 text-primary">
                  <span className="material-symbols-outlined">lightbulb</span>
                  <h4 className="font-sans font-semibold text-text text-sm">Photo Guide for Best Results</h4>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <li className="flex items-center gap-2 text-text-muted">
                    <span className="material-symbols-outlined text-error text-sm">power_off</span>
                    Disconnect power before photographing
                  </li>
                  <li className="flex items-center gap-2 text-text-muted">
                    <span className="material-symbols-outlined text-primary text-sm">wb_sunny</span>
                    Ensure bright, non-glare lighting
                  </li>
                  <li className="flex items-center gap-2 text-text-muted">
                    <span className="material-symbols-outlined text-primary text-sm">filter_center_focus</span>
                    Shoot directly from top-down
                  </li>
                  <li className="flex items-center gap-2 text-text-muted">
                    <span className="material-symbols-outlined text-primary text-sm">subtitles</span>
                    Keep IC labels and traces sharp
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2.5 rounded-lg font-sans font-semibold text-text-muted hover:bg-surface-sunken transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedFile}
            onClick={handleConfirm}
            className={`px-6 py-2.5 rounded-lg font-sans font-semibold flex items-center gap-2 ${
              selectedFile
                ? "bg-primary text-surface hover:bg-primary-hover shadow-neu-raised"
                : "bg-surface-sunken text-border cursor-not-allowed"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            Confirm Photo
          </button>
        </div>
      </div>
    </div>
  );
}

