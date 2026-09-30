import React, { useState } from 'react';
import BlochSphere from './BlochSphere';
import { VectorRender } from './MathExplanation';
import WorkbenchBackground from './WorkbenchBackground';
import { Ket, MathBlock, QuantumText } from './QuantumMath';

export default function ChapterQubit({ onBack }) {
  const [interactiveState, setInteractiveState] = useState('0'); // '0', '1', '+', '-'

  const states = {
    '0': { ket: '0', x: 0, y: 0, z: 1, vec: [{re: 1, im: 0}, {re: 0, im: 0}], desc: "The ground state. Corresponds to a classical 0." },
    '1': { ket: '1', x: 0, y: 0, z: -1, vec: [{re: 0, im: 0}, {re: 1, im: 0}], desc: "The excited state. Corresponds to a classical 1." },
    '+': { ket: '+', x: 1, y: 0, z: 0, vec: [{re: 0.707, im: 0}, {re: 0.707, im: 0}], desc: "An equal superposition. 50% chance of 0, 50% chance of 1." },
    '-': { ket: '-', x: -1, y: 0, z: 0, vec: [{re: 0.707, im: 0}, {re: -0.707, im: 0}], desc: "An equal superposition with a 180-degree phase shift." }
  };

  const current = states[interactiveState];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-[#2A2A2A] relative">
      <WorkbenchBackground />
      {onBack && (
        <button 
          onClick={onBack}
          className="fixed top-8 left-8 flex items-center gap-2 text-[#71717A] hover:text-[#B75D29] font-medium transition-colors bg-white/80 px-4 py-2 rounded-full shadow-sm backdrop-blur-sm z-50 border border-[#E4E4E7]"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          Back to Home
        </button>
      )}

      <div className="relative z-10 max-w-[900px] mx-auto pt-24 pb-32 px-8">
        <h1 className="text-5xl font-serif mb-6 text-center text-[#2A2A2A]">The Qubit</h1>
        <p className="text-xl text-[#71717A] text-center mb-16 font-light">The fundamental building block of quantum computation.</p>

        <div className="space-y-20">
          
          <section className="space-y-6 text-lg leading-relaxed">
            <h2 className="text-3xl font-serif text-[#B75D29]">Kets & Statevectors</h2>
            <p>
              In classical computing, a bit is a binary piece of information that can only be 0 or 1.
              In quantum computing, we use a <strong>qubit</strong>. To mathematically represent the state of a qubit, we use a notation called Dirac notation (or "bra-ket" notation).
            </p>
            <p>
              The basic states are written as <strong><Ket value="0" /></strong> (ket-zero) and <strong><Ket value="1" /></strong> (ket-one). 
              Unlike a classical bit, a qubit can be in a linear combination—or <strong>superposition</strong>—of both states at the same time:
            </p>
            <div className="bg-white p-6 rounded-2xl border border-[#E4E4E7] shadow-sm">
              <MathBlock>{'|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle'}</MathBlock>
            </div>
            <p>
              Here, α and β are complex numbers called <strong>probability amplitudes</strong>. 
              The absolute square of these amplitudes (|α|² and |β|²) gives the exact probability of measuring the qubit as 0 or 1. Because probabilities must add up to 100%, we know that |α|² + |β|² = 1.
            </p>
            <p>
              We can write this state as a 2D column vector, called a <strong>statevector</strong>.
            </p>
          </section>

          <section className="space-y-6 text-lg leading-relaxed">
            <h2 className="text-3xl font-serif text-[#B75D29]">The Bloch Sphere</h2>
            <p>
              Because the math of probability amplitudes is constrained (|α|² + |β|² = 1), we can perfectly map any possible state of a single qubit onto the surface of a 3D sphere. This is called the <strong>Bloch Sphere</strong>.
            </p>
            <p>
              The north pole represents the state <Ket value="0" />, and the south pole represents <Ket value="1" />. Any point on the equator represents a perfect 50/50 superposition.
            </p>
            
            <div className="bg-white rounded-3xl p-8 border border-[#E4E4E7] shadow-[0_8px_30px_rgba(0,0,0,0.04)] mt-8">
              <h3 className="font-serif text-xl mb-6 text-center">Interactive Qubit State</h3>
              
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-6 w-full">
                  <div className="flex gap-2">
                    {Object.keys(states).map(k => (
                      <button
                        key={k}
                        onClick={() => setInteractiveState(k)}
                        className={`flex-1 py-3 rounded-xl text-lg transition-all ${
                          interactiveState === k 
                            ? 'bg-[#B75D29] text-white shadow-md shadow-[#B75D29]/20' 
                            : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'
                        }`}
                      >
                        <Ket value={states[k].ket} />
                      </button>
                    ))}
                  </div>
                  
                  <div className="bg-[#FAFAFA] p-6 rounded-2xl border border-[#E4E4E7] min-h-[140px] flex flex-col justify-center">
                    <p className="text-[#2A2A2A] mb-4">{current.desc}</p>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[#71717A] text-sm">Statevector:</span>
                      <div className="scale-90 origin-left">
                        <VectorRender vector={current.vec} />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="w-64 h-64 flex-shrink-0">
                  <BlochSphere qubit="Interactive" x={current.x} y={current.y} z={current.z} />
                </div>
              </div>
            </div>
            <p className="text-sm text-[#71717A] text-center mt-4">
              Try clicking the states above to see how the mathematical statevector maps directly to the geometric Bloch sphere representation.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
