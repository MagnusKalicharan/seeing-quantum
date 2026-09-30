import React from 'react';
import { QubitKet } from '../QuantumMath';

const OP_STYLES = {
  none: 'border-[#E4E4E7] bg-white text-[#71717A]',
  H: 'border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]',
  O: 'border-[#C4B5FD] bg-[#F5F3FF] text-[#6D28D9]',
  D: 'border-[#FDBA74] bg-[#FFF7ED] text-[#C2410C]',
  M: 'border-[#86EFAC] bg-[#F0FDF4] text-[#15803D]',
};

export default function GroverCircuitStrip({
  numQubits,
  highlightOp,
  iteration,
  totalIterations,
}) {
  const wires = Array.from({ length: numQubits }, (_, q) => q);

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4 seeing-shadow">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-serif text-[#2A2A2A]">Grover circuit (conceptual)</h3>
        {iteration != null && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
            Iteration {iteration + 1} / {totalIterations}
          </span>
        )}
      </div>

      <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'H', label: 'H⊗n', op: 'H' },
          { key: 'O', label: 'Oracle Uω', op: 'O' },
          { key: 'D', label: 'Diffuser Us', op: 'D' },
          { key: 'M', label: 'Measure', op: 'M' },
        ].map(({ key, label, op }) => (
          <div
            key={key}
            className={`shrink-0 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              highlightOp === op ? OP_STYLES[op] : OP_STYLES.none
            } ${highlightOp === op ? 'ring-2 ring-[#B75D29]/30' : ''}`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="space-y-3 relative">
        {wires.map((q) => (
          <div key={q} className="flex items-center gap-3 relative">
            <span className="w-16 text-xs text-[#71717A] font-mono">
              q{q} <QubitKet qubitIndex={q} />
            </span>
            <div className="flex-1 h-px bg-[#D4D4D8] relative">
              {highlightOp === 'H' && (
                <span className="absolute left-[12%] -top-3 px-2 py-0.5 text-[10px] rounded bg-[#EFF6FF] border border-[#93C5FD] text-[#1D4ED8]">
                  H
                </span>
              )}
              {highlightOp === 'O' && (
                <span className="absolute left-[38%] -top-3 px-2 py-0.5 text-[10px] rounded bg-[#F5F3FF] border border-[#C4B5FD] text-[#6D28D9]">
                  {q === 0 ? 'O' : '·'}
                </span>
              )}
              {highlightOp === 'D' && (
                <span className="absolute left-[62%] -top-3 px-2 py-0.5 text-[10px] rounded bg-[#FFF7ED] border border-[#FDBA74] text-[#C2410C]">
                  D
                </span>
              )}
              {highlightOp === 'M' && (
                <span className="absolute right-[8%] -top-3 px-2 py-0.5 text-[10px] rounded bg-[#F0FDF4] border border-[#86EFAC] text-[#15803D]">
                  ⨂
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
