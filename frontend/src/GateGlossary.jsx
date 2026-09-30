import React from 'react';
import { GATE_METADATA } from './gateData';
import BlochSphere from './BlochSphere';
import { MatrixRender, VectorRender } from './MathExplanation';
import { QuantumText } from './QuantumMath';

const GLOSSARY_GATES = ['H', 'X', 'Y', 'Z', 'S', 'T', 'CX', 'SWAP'];

// Helper to convert real numbers to the complex object format expected by VectorRender/MatrixRender
const C = (re, im=0) => ({ re, im });

const GATE_VISUALS = {
  'H': { text: "Applied to |0⟩", vectors: [{ label: "State: |+⟩", x: 1, y: 0, z: 0 }], 
         math: { mat: [[C(0.707), C(0.707)], [C(0.707), C(-0.707)]], vecIn: [C(1), C(0)], vecOut: [C(0.707), C(0.707)] } },
  'X': { text: "Applied to |0⟩", vectors: [{ label: "State: |1⟩", x: 0, y: 0, z: -1 }],
         math: { mat: [[C(0), C(1)], [C(1), C(0)]], vecIn: [C(1), C(0)], vecOut: [C(0), C(1)] } },
  'Y': { text: "Applied to |0⟩", vectors: [{ label: "State: i|1⟩", x: 0, y: 0, z: -1 }],
         math: { mat: [[C(0), C(0,-1)], [C(0,1), C(0)]], vecIn: [C(1), C(0)], vecOut: [C(0), C(0,1)] } },
  'Z': { text: "Applied to |+⟩ (X-axis)", vectors: [{ label: "State: |-⟩", x: -1, y: 0, z: 0 }],
         math: { mat: [[C(1), C(0)], [C(0), C(-1)]], vecIn: [C(0.707), C(0)], vecOut: [C(0.707), C(-0.707)] } },
  'S': { text: "Applied to |+⟩", vectors: [{ label: "State: |i⟩", x: 0, y: 1, z: 0 }],
         math: { mat: [[C(1), C(0)], [C(0), C(0,1)]], vecIn: [C(0.707), C(0)], vecOut: [C(0.707), C(0,0.707)] } },
  'T': { text: "Applied to |+⟩", vectors: [{ label: "State: T|+⟩", x: 0.707, y: 0.707, z: 0 }],
         math: { mat: [[C(1), C(0)], [C(0), C(0.707, 0.707)]], vecIn: [C(0.707), C(0)], vecOut: [C(0.707), C(0.5, 0.5)] } },
  'CX': { text: "Control=|1⟩, Target=|0⟩ → |11⟩", vectors: [
    { label: "Control", x: 0, y: 0, z: -1 }, 
    { label: "Target", x: 0, y: 0, z: -1 }
  ], math: null },
  'SWAP': { text: "|01⟩ → |10⟩", vectors: [
    { label: "Qubit 0", x: 0, y: 0, z: -1 }, 
    { label: "Qubit 1", x: 0, y: 0, z: 1 }
  ], math: null }
};

const ComplexCircle = ({ mag, phase }) => {
  if (mag === 0) {
    return <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200" />;
  }
  const scale = mag;
  return (
    <div className="w-8 h-8 flex items-center justify-center">
      <div 
        className="rounded-full bg-[#FCEB3B] border border-[#F5B041] relative shadow-sm"
        style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}
      >
        <div 
          className="absolute bg-black"
          style={{ 
            width: '50%', height: '1.5px', top: '50%', left: '50%', 
            transformOrigin: '0% 50%', transform: `translateY(-50%) rotate(${-phase}deg)`
          }}
        />
      </div>
    </div>
  );
};

export default function GateGlossary() {
  return (
    <div className="pt-16 border-t border-[#E4E4E7]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-serif mb-2 text-center text-[#2A2A2A]">Quantum Gate Glossary</h2>
        <p className="text-center text-[#71717A] mb-16 max-w-2xl mx-auto">
          A comprehensive reference of all available quantum logic gates, their generalized unitary matrices, and their geometric effects on the Bloch sphere.
        </p>
        
        <div className="space-y-16">
          {GLOSSARY_GATES.map(gate => {
            const meta = GATE_METADATA[gate];
            const visual = GATE_VISUALS[gate];
            
            return (
              <div key={gate} className="bg-white rounded-3xl p-10 border border-[#E4E4E7]/50 seeing-shadow flex flex-col xl:flex-row gap-12 items-center">
                
                {/* Left Side: Math & Explanation */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4 border-b border-[#E4E4E7] pb-4">
                    <div className="w-16 h-16 bg-[#F6EEE8] rounded-xl border border-[#B75D29]/30 flex items-center justify-center font-mono text-3xl text-[#B75D29]">
                      {gate}
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl text-[#2A2A2A]">{meta.name}</h3>
                      <p className="text-[#71717A]">{meta.rotation} • Global Phase: {meta.globalPhase || '0'}</p>
                    </div>
                  </div>
                  
                  <p className="text-[#2A2A2A] text-lg leading-relaxed">
                    <QuantumText>{meta.desc}</QuantumText>
                  </p>
                  
                  {meta.matrix && (
                    <div className="bg-[#FAFAFA] p-6 rounded-2xl border border-[#E4E4E7]">
                      <h4 className="text-sm font-semibold text-[#71717A] mb-4 uppercase tracking-wider">Visual Matrix</h4>
                      <div className="flex gap-4 items-center">
                        <div className="flex flex-col gap-2 border-l-2 border-r-2 border-[#D4D4D8] px-3 py-2 rounded-sm">
                          <div className="flex gap-2">
                            <ComplexCircle {...meta.matrix[0][0]} />
                            <ComplexCircle {...meta.matrix[0][1]} />
                          </div>
                          <div className="flex gap-2">
                            <ComplexCircle {...meta.matrix[1][0]} />
                            <ComplexCircle {...meta.matrix[1][1]} />
                          </div>
                        </div>
                        <div className="flex flex-col justify-center gap-5 text-sm text-[#71717A] font-mono">
                          <span><QuantumText>{meta.labels[0]}</QuantumText></span>
                          <span><QuantumText>{meta.labels[1]}</QuantumText></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right Side: Bloch Sphere & 1-Qubit Math */}
                <div className="w-full xl:w-[600px] bg-[#FAFAFA] rounded-3xl border border-[#E4E4E7] p-8 flex flex-col items-center justify-center gap-8">
                  
                  <div className="w-full text-center">
                    <div className="flex justify-center gap-4">
                      {visual.vectors.map((v, idx) => (
                        <div key={idx} className="w-48">
                           <BlochSphere qubit={v.label} x={v.x} y={v.y} z={v.z} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {visual.math && (
                    <div className="w-full text-center border-t border-[#E4E4E7] pt-6">
                       <h4 className="text-sm font-semibold text-[#71717A] mb-4 uppercase tracking-wider">
                         1-Qubit Transformation Math
                       </h4>
                       <div className="flex flex-wrap justify-center items-center gap-4 scale-90 origin-top">
                          <MatrixRender matrix={visual.math.mat} />
                          <span className="font-serif text-xl text-[#71717A]">&times;</span>
                          <VectorRender vector={visual.math.vecIn} />
                          <span className="font-serif text-xl text-[#71717A]">=</span>
                          <VectorRender vector={visual.math.vecOut} />
                       </div>
                    </div>
                  )}

                </div>
                
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
