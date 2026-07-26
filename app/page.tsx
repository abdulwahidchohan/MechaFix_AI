"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import Dashboard from "@/components/Dashboard";
import NewDiagnosisDrawer from "@/components/NewDiagnosisDrawer";
import PhotoUploadModal from "@/components/PhotoUploadModal";
import ProcessingView from "@/components/ProcessingView";
import ReportView from "@/components/ReportView";
import ActiveProjectsView from "@/components/ActiveProjectsView";
import RepairHistoryView from "@/components/RepairHistoryView";
import SafetyProtocolsView from "@/components/SafetyProtocolsView";
import DocumentationView from "@/components/DocumentationView";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";

export default function Home() {
  const { user } = useAuth();

  const [viewState, setViewState] = useState<string>("dashboard");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    const handlePhotoUploaded = (e: any) => {
      if (e.detail?.file) {
        setImageFile(e.detail.file);
      }
    };

    const handleStartAnalysis = async (e: any) => {
      const formValues = e.detail?.formValues || {};

      setViewState("processing");

      try {
        let idToken = "guest_user";
        if (auth.currentUser) {
          try {
            idToken = await auth.currentUser.getIdToken(true);
          } catch (e) {
            idToken = "guest_user";
          }
        }

        const response = await fetch("/api/gemini/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            ...formValues,
          }),
        });

        const rawText = await response.text();
        let result: any;
        try {
          result = JSON.parse(rawText);
        } catch (e) {
          throw new Error(!response.ok ? `Server Error (HTTP ${response.status}: ${response.statusText || "Server error"}). Please ensure Vercel Environment Variables are set.` : "Invalid response format from server.");
        }

        if (result.success) {
          const rec = result.record || { data: result.data };
          setAnalysisResult(rec);
          setViewState("report");

          try {
            const existingStr = localStorage.getItem("mechafix_local_diagnoses") || "[]";
            const existing = JSON.parse(existingStr);
            const filtered = Array.isArray(existing) ? existing.filter((d: any) => d.id !== rec.id) : [];
            const updated = [rec, ...filtered].slice(0, 20);
            localStorage.setItem("mechafix_local_diagnoses", JSON.stringify(updated));
          } catch (e) {}
        } else {
          console.error(result.error);
          alert(`Analysis Error: ${result.error}`);
          setViewState("dashboard");
        }
      } catch (err: any) {
        console.error(err);
        alert(`Request Error: ${err.message || "Failed to submit analysis"}`);
        setViewState("dashboard");
      }
    };

    document.addEventListener("photo-uploaded", handlePhotoUploaded);
    document.addEventListener("start-analysis", handleStartAnalysis);

    return () => {
      document.removeEventListener("photo-uploaded", handlePhotoUploaded);
      document.removeEventListener("start-analysis", handleStartAnalysis);
    };
  }, [imageFile]);

  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [viewState]);

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      <Sidebar currentView={viewState} onViewChange={setViewState} />
      <div className="flex-1 flex flex-col md:ml-[280px] w-full md:max-w-[calc(100%-280px)] h-screen overflow-hidden bg-background">
        <TopNav />
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          {viewState === "dashboard" && <Dashboard />}
          {viewState === "processing" && <ProcessingView imageFile={imageFile} />}
          {viewState === "report" && (
            <ReportView
              result={analysisResult}
              reset={() => {
                setViewState("dashboard");
                setImageFile(null);
              }}
            />
          )}
          {viewState === "active-projects" && (
            <ActiveProjectsView
              onViewReport={(result) => {
                setAnalysisResult(result);
                setViewState("report");
              }}
            />
          )}
          {viewState === "repair-history" && (
            <RepairHistoryView
              onViewReport={(result) => {
                setAnalysisResult(result);
                setViewState("report");
              }}
            />
          )}
          {viewState === "safety-protocols" && <SafetyProtocolsView />}
          {viewState === "documentation" && <DocumentationView />}
        </main>
      </div>

      <NewDiagnosisDrawer />
      <PhotoUploadModal />
    </div>
  );
}
