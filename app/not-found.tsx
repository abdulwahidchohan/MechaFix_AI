import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-surface p-8 rounded-3xl border border-border shadow-neu-raised space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
          <span className="material-symbols-outlined text-4xl">search_off</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold font-sans text-text mb-2">Page Not Found</h1>
          <p className="text-sm font-sans text-text-muted">
            The diagnostic view or requested resource does not exist. Your saved diagnosis records remain safe in your workspace.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-surface font-sans font-semibold text-sm shadow-neu-raised hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-xl">home</span>
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
