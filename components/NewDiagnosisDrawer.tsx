"use client";
import { useEffect, useState, useRef } from "react";
import { PresetConfig } from "@/lib/presets";

export default function NewDiagnosisDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [board, setBoard] = useState("Arduino UNO Rev3");
  const [component, setComponent] = useState("HC-SR04 Ultrasonic Sensor");
  const [powerSource, setPowerSource] = useState("USB");
  const [problemCategory, setProblemCategory] = useState("General Hardware Issue");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    };

    const handlePreset = (e: any) => {
      const preset: PresetConfig = e.detail?.preset;
      if (preset) {
        if (preset.board) setBoard(preset.board);
        if (preset.component) setComponent(preset.component);
        setProblemCategory(preset.problemCategory);
        setActualBehavior(preset.actualBehaviorSuggestion);
      }
      setIsOpen(true);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    };

    const handlePhotoUploaded = (e: any) => {
      if (e.detail?.file) {
        setAttachedImageName(e.detail.file.name);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("open-diagnosis", handleOpen);
    document.addEventListener("open-diagnosis-with-preset", handlePreset);
    document.addEventListener("photo-uploaded", handlePhotoUploaded);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("open-diagnosis", handleOpen);
      document.removeEventListener("open-diagnosis-with-preset", handlePreset);
      document.removeEventListener("photo-uploaded", handlePhotoUploaded);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSubmit = () => {
    setIsOpen(false);
    const formValues = {
      board,
      component,
      powerSource,
      problemCategory,
      expectedBehavior,
      actualBehavior,
      errorMessage,
      notes,
      evidenceType: attachedImageName ? "photo" : "text_only",
    };

    document.dispatchEvent(
      new CustomEvent("start-analysis", {
        detail: { formValues },
      })
    );
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-text/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Sheet */}
      <aside 
        aria-label="New Diagnosis Drawer"
        className={`fixed right-0 top-0 h-full w-full sm:w-[500px] bg-surface shadow-[-10px_0_30px_rgba(163,177,198,0.2)] z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 className="font-sans font-semibold text-text text-lg">New Diagnosis</h2>
            <p className="text-text-muted font-sans font-medium text-sm mt-1">Provide details to start troubleshooting</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            aria-label="Close diagnosis drawer"
            className="p-2 rounded-full hover:bg-surface-sunken transition-colors text-text-muted"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
          {/* Step 1 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-primary-container text-primary font-sans font-medium text-sm flex items-center justify-center">1</div>
              <h3 className="font-sans font-semibold text-text">Tell us about your setup</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block font-sans font-medium text-sm text-text-muted mb-2">Microcontroller Board</label>
                <div className="relative">
                  <select 
                    ref={firstInputRef}
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="w-full bg-surface-sunken shadow-neu-pressed rounded-lg py-3 pl-4 pr-10 appearance-none font-sans text-text focus:outline-none focus:ring-2 focus:ring-primary border-transparent"
                  >
                    <option>Arduino UNO Rev3</option>
                    <option>Arduino Mega 2560</option>
                    <option>ESP32 DevKit V1</option>
                    <option>Raspberry Pi Pico</option>
                    <option>STM32 Nucleo</option>
                    <option>Other Custom Board</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-text-muted pointer-events-none">expand_more</span>
                </div>
              </div>
              
              <div>
                <label className="block font-sans font-medium text-sm text-text-muted mb-2">Primary Component</label>
                <div className="relative">
                  <select 
                    value={component}
                    onChange={(e) => setComponent(e.target.value)}
                    className="w-full bg-surface-sunken shadow-neu-pressed rounded-lg py-3 pl-4 pr-10 appearance-none font-sans text-text focus:outline-none focus:ring-2 focus:ring-primary border-transparent"
                  >
                    <option>HC-SR04 Ultrasonic Sensor</option>
                    <option>SG90 Micro Servo</option>
                    <option>L298N Motor Driver</option>
                    <option>16x2 I2C LCD Display</option>
                    <option>DHT11 / DHT22 Temp Sensor</option>
                    <option>MPU6050 Gyro/Accelerometer</option>
                    <option>Other / Custom Circuit</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-text-muted pointer-events-none">expand_more</span>
                </div>
              </div>

              <div>
                <label className="block font-sans font-medium text-sm text-text-muted mb-2">Power Source</label>
                <div className="flex gap-3">
                  {['USB', 'Battery', 'External'].map((src) => (
                    <label key={src} className="flex-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="power" 
                        className="peer sr-only" 
                        checked={powerSource === src}
                        onChange={() => setPowerSource(src)}
                      />
                      <div className="py-2 px-4 rounded-lg border border-border text-center font-sans font-medium text-sm peer-checked:bg-primary-container peer-checked:text-primary peer-checked:border-primary-container transition-all shadow-neu-raised peer-checked:shadow-neu-pressed">
                        {src}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Step 2 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-surface-sunken text-text font-sans font-medium text-sm flex items-center justify-center">2</div>
              <h3 className="font-sans font-semibold text-text">Describe the problem</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block font-sans font-medium text-sm text-text-muted mb-2">Problem Category</label>
                <input 
                  type="text"
                  value={problemCategory}
                  onChange={(e) => setProblemCategory(e.target.value)}
                  className="w-full bg-surface-sunken shadow-neu-pressed rounded-lg p-3 font-sans text-text focus:outline-none focus:ring-2 focus:ring-primary border-transparent"
                  placeholder="e.g. Board Power Issue, Sensor Read Timeout"
                />
              </div>

              <div>
                <label className="block font-sans font-medium text-sm text-text-muted mb-2">Expected Behavior</label>
                <textarea 
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  className="w-full bg-surface-sunken shadow-neu-pressed rounded-lg p-3 font-sans text-text focus:outline-none focus:ring-2 focus:ring-primary border-transparent h-20 resize-none" 
                  placeholder="What should the circuit do? (e.g. Servo rotates to 90 degrees)"
                ></textarea>
              </div>

              <div>
                <label className="block font-sans font-medium text-sm text-text-muted mb-2">Actual Behavior</label>
                <textarea 
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  className="w-full bg-surface-sunken shadow-neu-pressed rounded-lg p-3 font-sans text-text focus:outline-none focus:ring-2 focus:ring-primary border-transparent h-24 resize-none" 
                  placeholder="What is it actually doing? (e.g. Servo twitches and board resets)"
                ></textarea>
              </div>

              <div>
                <label className="block font-sans font-medium text-sm text-text-muted mb-2">Error Message / Code (Optional)</label>
                <input 
                  type="text"
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  className="w-full bg-surface-sunken shadow-neu-pressed rounded-lg p-3 font-sans text-text focus:outline-none focus:ring-2 focus:ring-primary border-transparent"
                  placeholder="e.g. Brownout detector was triggered / Failed to communicate"
                />
              </div>

              <div>
                <label className="block font-sans font-medium text-sm text-text-muted mb-2">Additional Notes (Optional)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-surface-sunken shadow-neu-pressed rounded-lg p-3 font-sans text-text focus:outline-none focus:ring-2 focus:ring-primary border-transparent h-16 resize-none" 
                  placeholder="Any extra wiring notes, voltage levels, or code snippet details"
                ></textarea>
              </div>
            </div>
          </section>

          {/* Step 3 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-surface-sunken text-text font-sans font-medium text-sm flex items-center justify-center">3</div>
              <h3 className="font-sans font-semibold text-text">Visual evidence (Optional)</h3>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => document.dispatchEvent(new CustomEvent('open-photo-upload'))}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-border bg-surface-sunken hover:bg-border/50 transition-colors h-28"
                >
                  <span className="material-symbols-outlined text-primary">add_a_photo</span>
                  <span className="font-sans font-medium text-xs text-text-muted">Upload Circuit Photo</span>
                </button>
                <button 
                  type="button"
                  onClick={() => document.dispatchEvent(new CustomEvent('open-photo-upload'))}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-border bg-surface-sunken hover:bg-border/50 transition-colors h-28"
                >
                  <span className="material-symbols-outlined text-primary">screenshot_monitor</span>
                  <span className="font-sans font-medium text-xs text-text-muted">IDE / Diagram Photo</span>
                </button>
              </div>

              {attachedImageName && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary-container text-primary text-xs font-medium border border-primary/20">
                  <div className="flex items-center gap-2 truncate">
                    <span className="material-symbols-outlined text-base">image</span>
                    <span className="truncate">{attachedImageName}</span>
                  </div>
                  <button 
                    onClick={() => setAttachedImageName(null)}
                    className="text-text-muted hover:text-error"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="p-6 border-t border-border bg-surface flex gap-4">
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 py-3 px-6 rounded-xl bg-surface-sunken text-primary font-sans font-semibold shadow-neu-raised hover:bg-border/50 transition-all"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            className="flex-[2] py-3 px-6 rounded-xl bg-primary text-surface font-sans font-semibold shadow-neu-raised hover:bg-primary-hover transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">memory</span>
            Start AI Analysis
          </button>
        </footer>
      </aside>
    </>
  );
}

