"use client";

import { useState, useEffect } from "react";
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
  const { user, authError } = useAuth();

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

      if (!auth.currentUser) {
        alert("Please sign in first to run an AI diagnosis.");
        return;
      }

      setViewState("processing");

      try {
        const idToken = await auth.currentUser.getIdToken(true);

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

        const result = await response.json();
        if (result.success) {
          setAnalysisResult(result.record || { data: result.data });
          setViewState("report");
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

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {authError && (
        <div className="fixed top-20 right-4 z-[80] max-w-sm rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 shadow-xl backdrop-blur-md">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] mt-0.5">warning</span>
            <span>{authError}</span>
          </div>
        </div>
      )}

      <Sidebar currentView={viewState} onViewChange={setViewState} />
      <div className="flex-1 flex flex-col md:ml-[280px] w-full md:max-w-[calc(100%-280px)] h-screen overflow-hidden bg-background">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
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
