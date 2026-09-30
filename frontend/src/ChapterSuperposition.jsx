import React from 'react';
import WorkbenchBackground from './WorkbenchBackground';

export default function ChapterSuperposition() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans relative">
      <WorkbenchBackground />
      <div className="relative z-10 pt-24 pb-20 max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-serif font-bold text-[#2A2A2A] mb-6">Superposition</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E4E4E7] text-[#4A4A4A] leading-relaxed space-y-4 text-lg">
          <p>
            Unlike classical bits which must be exactly 0 or exactly 1, a quantum bit (qubit) can exist in a <strong>superposition</strong> of both states simultaneously.
          </p>
          <p>
            This doesn't mean the qubit's value is unknown to us; rather, the qubit truly holds both possibilities at once. It explores multiple paths or states simultaneously until an interaction forces it to choose.
          </p>
          <p>
            In a quantum circuit, the <strong>Hadamard (H) gate</strong> is the most common way to put a qubit into a perfect, equal superposition. When measured, a qubit in this state will yield 0 half the time and 1 half the time, completely randomly.
          </p>
        </div>
      </div>
    </div>
  );
}
