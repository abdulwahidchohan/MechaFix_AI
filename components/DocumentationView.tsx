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
          Data Security & Privacy
        </h3>
        <p className="font-sans text-text-muted leading-relaxed">
          Your diagnostic data is securely stored and scoped entirely to your user profile. We utilize Firebase Authentication and Firestore Security Rules to ensure that your active projects and repair history are encrypted at rest and accessible only by you.
        </p>
      </div>
    </div>
  );
}
