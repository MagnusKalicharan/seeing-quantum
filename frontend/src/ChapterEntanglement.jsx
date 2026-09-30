import React from 'react';
import WorkbenchBackground from './WorkbenchBackground';

export default function ChapterEntanglement() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans relative">
      <WorkbenchBackground />
      <div className="relative z-10 pt-24 pb-20 max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-serif font-bold text-[#2A2A2A] mb-6">Entanglement</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E4E4E7] text-[#4A4A4A] leading-relaxed space-y-4 text-lg">
          <p>
            When two qubits interact, they can become <strong>entangled</strong>. This means their quantum states are permanently linked, and they can no longer be described independently of one another.
          </p>
          <p>
            Albert Einstein famously called this "spooky action at a distance." If you take two entangled qubits and separate them by lightyears, measuring one will instantaneously determine the state of the other!
          </p>
          <p>
            In our quantum circuits, entanglement is typically created by putting a qubit into superposition with an H gate, and then using it as the control for a CNOT (CX) gate on a second qubit. This creates what is known as a Bell State.
          </p>
        </div>
      </div>
    </div>
  );
}
