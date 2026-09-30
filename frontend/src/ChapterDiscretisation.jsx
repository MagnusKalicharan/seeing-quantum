import React from 'react';
import WorkbenchBackground from './WorkbenchBackground';

export default function ChapterDiscretisation() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans relative">
      <WorkbenchBackground />
      <div className="relative z-10 pt-24 pb-20 max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-serif font-bold text-[#2A2A2A] mb-6">Discretisation</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E4E4E7] text-[#4A4A4A] leading-relaxed space-y-4 text-lg">
          <p>
            In classical physics, we are used to things varying continuously. A car can travel at 30 mph, 31 mph, or any speed in between. However, in the quantum realm, certain properties are <strong>discrete</strong>.
          </p>
          <p>
            The word "quantum" itself comes from the Latin word for "how much," referring to these discrete chunks or packets of energy. For example, electrons orbiting a nucleus can only occupy specific energy levels, never the space in between. When they jump between levels, they emit or absorb a precise, discrete amount of energy—a photon.
          </p>
          <p>
            This principle of discretisation is the fundamental basis for the <strong>qubit</strong>, which mathematically operates in a space defined by two discrete basis states: |0⟩ and |1⟩.
          </p>
        </div>
      </div>
    </div>
  );
}
