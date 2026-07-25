"use client";

import { useEffect, useState, useRef } from "react";
import { PresetConfig } from "@/lib/presets";
import { MultiImageEvidencePicker, SelectedImageItem } from "@/components/MultiImageEvidencePicker";

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
  const [selectedImages, setSelectedImages] = useState<SelectedImageItem[]>([]);

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("open-diagnosis", handleOpen);
    document.addEventListener("open-diagnosis-with-preset", handlePreset);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("open-diagnosis", handleOpen);
      document.removeEventListener("open-diagnosis-with-preset", handlePreset);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSubmit = () => {
    setIsOpen(false);

    const imagesPayload = selectedImages.map((img) => ({
      data: img.data,
      mimeType: img.mimeType,
      evidenceType: img.evidenceType,
    }));

    const formValues = {
      board,
      component,
      powerSource,
      problemCategory,
      expectedBehavior,
      actualBehavior,
      errorMessage,
      notes,
      images: imagesPayload,
      evidenceType: imagesPayload.length > 0 ? "multi_photo" : "text_only",
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
        className={`fixed right-0 top-0 h-full w-full sm:w-[560px] bg-surface shadow-[-10px_0_30px_rgba(163,177,198,0.2)] z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 className="font-sans font-semibold text-text text-lg">New Diagnosis</h2>
            <p className="text-text-muted font-sans font-medium text-sm mt-1">Provide details to start state machine troubleshooting</p>
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
                <label htmlFor="diag-board" className="block font-sans font-semibold text-sm text-text mb-1">
                  Microcontroller Board <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <select
                    id="diag-board"
                    ref={firstInputRef}
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    aria-describedby="diag-board-hint"
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
                <p id="diag-board-hint" className="text-xs text-text-muted mt-1">Select the target dev board model.</p>
              </div>

              <div>
                <label htmlFor="diag-component" className="block font-sans font-semibold text-sm text-text mb-1">
                  Primary Component <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <select
                    id="diag-component"
                    value={component}
                    onChange={(e) => setComponent(e.target.value)}
                    aria-describedby="diag-component-hint"
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
                <p id="diag-component-hint" className="text-xs text-text-muted mt-1">Component under test or causing failure.</p>
              </div>

              <div>
                <span className="block font-sans font-semibold text-sm text-text mb-2">
                  Power Source <span className="text-rose-500" aria-hidden="true">*</span>
                </span>
                <div className="flex gap-3" role="radiogroup" aria-label="Power Source">
                  {["USB", "Battery", "External"].map((src) => (
                    <label key={src} className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="power"
                        className="peer sr-only"
                        checked={powerSource === src}
                        onChange={() => setPowerSource(src)}
                      />
                      <div className="py-2.5 px-4 rounded-lg border border-border text-center font-sans font-semibold text-sm peer-checked:bg-primary-container peer-checked:text-primary peer-checked:border-primary-container transition-all shadow-neu-raised peer-checked:shadow-neu-pressed min-h-[44px] flex items-center justify-center">
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
                <label htmlFor="diag-category" className="block font-sans font-semibold text-sm text-text mb-1">
                  Problem Category <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="diag-category"
                  type="text"
                  required
                  value={problemCategory}
                  onChange={(e) => setProblemCategory(e.target.value)}
                  aria-describedby="diag-category-hint"
                  className="w-full bg-surface-sunken shadow-neu-pressed rounded-lg p-3 font-sans text-text focus:outline-none focus:ring-2 focus:ring-primary border-transparent"
                  placeholder="e.g. Board Power Issue, Sensor Read Timeout"
                />
                <p id="diag-category-hint" className="text-xs text-text-muted mt-1">High-level issue classification.</p>
              </div>

              <div>
                <label htmlFor="diag-expected" className="block font-sans font-semibold text-sm text-text mb-1">
                  Expected Behavior <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="diag-expected"
                  required
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  aria-describedby="diag-expected-hint"
                  className="w-full bg-surface-sunken shadow-neu-pressed rounded-lg p-3 font-sans text-text focus:outline-none focus:ring-2 focus:ring-primary border-transparent h-20 resize-none"
                  placeholder="Describe what the circuit should do when working correctly."
                ></textarea>
                <p id="diag-expected-hint" className="text-xs text-text-muted mt-1">Detail the expected normal output or state.</p>
              </div>

              <div>
                <label htmlFor="diag-actual" className="block font-sans font-semibold text-sm text-text mb-1">
                  Actual Behavior <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="diag-actual"
                  required
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  aria-describedby="diag-actual-hint"
                  className="w-full bg-surface-sunken shadow-neu-pressed rounded-lg p-3 font-sans text-text focus:outline-none focus:ring-2 focus:ring-primary border-transparent h-24 resize-none"
                  placeholder="Describe what happens when the circuit is powered."
                ></textarea>
                <p id="diag-actual-hint" className="text-xs text-text-muted mt-1">Describe symptoms, LED states, or readings observed.</p>
              </div>

              <div>
                <label htmlFor="diag-error" className="block font-sans font-semibold text-sm text-text mb-1">
                  Error Message / Console Log <span className="text-xs font-normal text-text-muted">(Optional)</span>
                </label>
                <input
                  id="diag-error"
                  type="text"
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  aria-describedby="diag-error-hint"
                  className="w-full bg-surface-sunken shadow-neu-pressed rounded-lg p-3 font-sans text-text focus:outline-none focus:ring-2 focus:ring-primary border-transparent"
                  placeholder="e.g. Brownout detector was triggered / Failed to communicate"
                />
                <p id="diag-error-hint" className="text-xs text-text-muted mt-1">Compiler or serial monitor output if applicable.</p>
              </div>

              <div>
                <label htmlFor="diag-notes" className="block font-sans font-semibold text-sm text-text mb-1">
                  Additional Notes <span className="text-xs font-normal text-text-muted">(Optional)</span>
                </label>
                <textarea
                  id="diag-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  aria-describedby="diag-notes-hint"
                  className="w-full bg-surface-sunken shadow-neu-pressed rounded-lg p-3 font-sans text-text focus:outline-none focus:ring-2 focus:ring-primary border-transparent h-16 resize-none"
                  placeholder="Any extra wiring notes, voltage levels, or code snippet details"
                ></textarea>
                <p id="diag-notes-hint" className="text-xs text-text-muted mt-1">Breadboard wire colors, ambient temperatures, or recent modifications.</p>
              </div>
            </div>
          </section>

          {/* Step 3: Multiple Evidence Attachments */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-surface-sunken text-text font-sans font-medium text-sm flex items-center justify-center">3</div>
              <h3 className="font-sans font-semibold text-text">Attach Multiple Image Evidence</h3>
            </div>
            <MultiImageEvidencePicker
              images={selectedImages}
              onChange={setSelectedImages}
              maxImages={5}
            />
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
            Start AI Diagnosis
          </button>
        </footer>
      </aside>
    </>
  );
}
