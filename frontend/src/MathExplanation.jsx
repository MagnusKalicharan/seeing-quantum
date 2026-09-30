import React from 'react';
import { GATE_METADATA } from './gateData';
import { Ket, QuantumText } from './QuantumMath';

const formatComplex = (c) => {
  const re = Math.abs(c.re) < 1e-4 ? 0 : c.re;
  const im = Math.abs(c.im) < 1e-4 ? 0 : c.im;
  
  if (re === 0 && im === 0) return '0';
  if (im === 0) return Number(re.toFixed(3)).toString();
  if (re === 0) return Number(im.toFixed(3)).toString() + 'i';
  
  const sign = im < 0 ? '-' : '+';
  return `${Number(re.toFixed(3))} ${sign} ${Number(Math.abs(im).toFixed(3))}i`;
};

export const MatrixRender = ({ matrix }) => (
  <div className="flex border-l-2 border-r-2 border-[#D4D4D8] px-2 py-1 rounded-sm font-mono text-sm items-center bg-white">
    <div className="flex flex-col gap-3">
      {matrix.map((row, i) => (
        <div key={i} className="flex gap-4">
          {row.map((val, j) => (
            <span key={j} className="w-28 text-center text-[#2A2A2A] whitespace-nowrap">
              {formatComplex(val)}
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const VectorRender = ({ vector }) => (
  <div className="flex border-l-2 border-r-2 border-[#D4D4D8] px-2 py-1 rounded-sm font-mono text-sm items-center bg-[#F6EEE8]/30">
    <div className="flex flex-col gap-3">
      {vector.map((val, i) => (
        <div key={i} className="flex">
          <span className="w-28 text-center text-[#B75D29] font-medium whitespace-nowrap">
            {formatComplex(val)}
          </span>
        </div>
      ))}
    </div>
  </div>
);

function gateMetaKey(gateString) {
  const raw = (gateString || '').split(' ')[0].toUpperCase();
  if (raw === 'CNOT') return 'CX';
  return raw;
}

const GateExplanation = ({ gateString }) => {
  if (!gateString || gateString.includes('Initial')) {
    return (
      <div className="text-center text-[#71717A] text-sm">
        The system begins in the default ground state <Ket value="00" />, where there is a 100% probability of measuring both qubits as 0.
      </div>
    );
  }
  
  const type = gateMetaKey(gateString);
  const meta = GATE_METADATA[type];
  
  if (!meta) {
    return <div className="text-center text-[#71717A] text-sm">The 4x4 unitary matrix for the {gateString} operation is multiplied by the current 4x1 statevector to produce the new state.</div>;
  }

  return (
    <div className="text-left mt-6 bg-[#FAFAFA] p-6 rounded-xl border border-[#E4E4E7] max-w-3xl mx-auto">
      <h4 className="font-serif text-lg text-[#B75D29] mb-2">{meta.name}</h4>
      <p className="text-[#2A2A2A] text-sm mb-4"><QuantumText>{meta.desc}</QuantumText></p>
      
      <div className="text-xs text-[#71717A] space-y-2 border-t border-[#E4E4E7] pt-4">
        <p><strong>The Matrix:</strong> The 4x4 unitary matrix shown above represents the {meta.name} operating on the entire 2-qubit system. Because the gate is only applied to specific qubits, the matrix is mathematically derived using the tensor product (Kronecker product) of the 2x2 {meta.name} matrix and the 2x2 Identity matrix.</p>
        <p>
          <strong>State Evolution:</strong> By multiplying this 4x4 matrix with the 4x1 statevector column, we are calculating the linear combination of probability amplitudes. Every element in the resulting statevector dictates the new probability and phase of the corresponding basis state (
          <Ket value="00" />, <Ket value="01" />, <Ket value="10" />, <Ket value="11" />
          ).
        </p>
      </div>
    </div>
  );
};

export default function MathExplanation({ steps }) {
  if (!steps || steps.length <= 1) return null;
  
  // Only show the most recent live operation
  const step = steps[steps.length - 1];
  const prevStep = steps[steps.length - 2];

  return (
    <div className="flex flex-col max-w-5xl mx-auto py-8">
        <div className="bg-white p-8 rounded-3xl border border-[#E4E4E7]/50 seeing-shadow">
          <h3 className="font-serif text-xl text-[#2A2A2A] mb-8 border-b border-[#E4E4E7] pb-3 text-center">
            Live Operation Trace: <QuantumText as="span">{step.gate}</QuantumText>
          </h3>
          
          <div className="flex flex-wrap items-center justify-center gap-6 overflow-x-auto pb-4">
            {step.operator && (
              <>
                <MatrixRender matrix={step.operator} />
                <span className="font-serif text-2xl text-[#71717A]">&times;</span>
                <VectorRender vector={prevStep.statevector} />
                <span className="font-serif text-2xl text-[#71717A]">=</span>
              </>
            )}
            
            <VectorRender vector={step.statevector} />
          </div>

          <GateExplanation gateString={step.gate} />
        </div>
    </div>
  );
}
