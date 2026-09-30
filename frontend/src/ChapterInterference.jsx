import React from 'react';
import WorkbenchBackground from './WorkbenchBackground';

export default function ChapterInterference() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans relative">
      <WorkbenchBackground />
      <div className="relative z-10 pt-24 pb-20 max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-serif font-bold text-[#2A2A2A] mb-6">Interference</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E4E4E7] text-[#4A4A4A] leading-relaxed space-y-4 text-lg">
          <p>
            Because quantum states are represented as waves of probability, they can interact with each other in a phenomenon known as <strong>interference</strong>.
          </p>
          <p>
            Just like water waves, if the peaks of two quantum probability waves align, they amplify each other (constructive interference), making that outcome more likely. If a peak aligns with a trough, they cancel each other out (destructive interference), making that outcome impossible.
          </p>
          <p>
            Quantum algorithms—like Grover's search or Shor's factoring algorithm—rely heavily on this principle. They carefully orchestrate interference so that the wrong answers destructively cancel out, while the correct answer constructively amplifies until it is almost guaranteed to be measured!
          </p>
        </div>
      </div>
    </div>
  );
}
