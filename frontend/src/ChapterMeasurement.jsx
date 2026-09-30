import React from 'react';
import WorkbenchBackground from './WorkbenchBackground';

export default function ChapterMeasurement() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans relative">
      <WorkbenchBackground />
      <div className="relative z-10 pt-24 pb-20 max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-serif font-bold text-[#2A2A2A] mb-6">Measurement</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E4E4E7] text-[#4A4A4A] leading-relaxed space-y-4 text-lg">
          <p>
            In quantum mechanics, observing a system inherently changes it. This is known as <strong>Measurement</strong> or wave function collapse.
          </p>
          <p>
            While a qubit remains isolated, it evolves predictably according to the Schrödinger equation, maintaining delicate superpositions and entanglements. However, the moment a macroscopic measurement device interacts with the qubit to read its state, the superposition violently collapses.
          </p>
          <p>
            The qubit is forced to choose a definitive classical state (0 or 1). The probability of choosing either state depends entirely on the probability amplitudes of its superposition just before the measurement occurred.
          </p>
        </div>
      </div>
    </div>
  );
}
