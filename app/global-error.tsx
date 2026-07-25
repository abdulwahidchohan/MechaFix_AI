"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F4F6FA] flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-200 shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">System Error</h2>
            <p className="text-sm text-gray-600">
              A critical application error occurred. Your saved diagnosis records were not removed.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-sm shadow-md hover:bg-indigo-700 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
