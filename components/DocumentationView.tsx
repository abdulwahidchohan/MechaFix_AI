"use client";

export default function DocumentationView() {
  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans text-3xl font-bold text-text">Documentation</h2>
          <p className="font-sans text-sm text-text-muted mt-1">System architecture and usage instructions.</p>
        </div>
      </div>

      <div className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border">
        <h3 className="font-sans font-semibold text-lg text-text flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">book</span>
          Usage Instructions
        </h3>
        <p className="font-sans text-text-muted leading-relaxed mb-4">
          To begin a diagnostic session, click &quot;New Diagnosis&quot; in the sidebar. You will be prompted to select your microcontroller board, primary component, and power source. Describe the expected and actual behaviors, then upload a clear, top-down photo of your circuit.
        </p>
        <p className="font-sans text-text-muted leading-relaxed">
          The AI will analyze your inputs alongside the photo to identify components, potential causes of failure, and provide step-by-step troubleshooting instructions.
        </p>
      </div>
      
      <div className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border">
        <h3 className="font-sans font-semibold text-lg text-text flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">security</span>
          Data Security & Privacy Policy
        </h3>
        <p className="font-sans text-text-muted leading-relaxed mb-3">
          MechaFix AI uses Google Sign-In to identify users and securely isolate diagnostic sessions.
          Diagnosis records are stored in Cloud Firestore scoped exclusively to your authenticated UID.
        </p>
        <div className="space-y-2 text-xs font-sans text-text-muted border-t border-border pt-3">
          <p className="font-semibold text-text">Processed Information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hardware setup metadata (board, component, problem category, power source)</li>
            <li>Uploaded circuit images (processed in memory for analysis, not stored as raw blobs in Firestore)</li>
            <li>Follow-up diagnostic messages and manually logged multimeter measurements</li>
          </ul>
          <p className="font-semibold text-text pt-2">Integrated Third-Party Services:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Firebase Authentication (User Identity Management)</li>
            <li>Google Cloud Firestore (Per-User Document Storage)</li>
            <li>Google Gemini API (Server-Side Diagnostic Reasoning & Multimodal Analysis)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
