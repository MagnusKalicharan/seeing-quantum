import React, { useMemo } from 'react';
import { BasisKet } from '../QuantumMath';
import { amplitudesToTable } from './groverSimulator';

/**
 * Before / after diffusion for beginners (same simulator data).
 */
export default function GroverDiffusionCompare({
  beforeStateVector,
  afterAmplitudes,
  targetState,
  numQubits,
}) {
  const beforeTable = useMemo(
    () => amplitudesToTable(beforeStateVector, numQubits),
    [beforeStateVector, numQubits]
  );

  const targetBefore = beforeTable.find((a) => a.state === targetState)?.probability ?? 0;
  const targetAfter =
    afterAmplitudes.find((a) => a.state === targetState)?.probability ?? 0;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="rounded-xl border border-[#E4E4E7] p-4 bg-[#FAFAFA]">
        <p className="text-xs font-medium text-[#71717A] mb-3 uppercase tracking-wide">
          Before diffusion
        </p>
        <ul className="space-y-2 text-sm">
          {beforeTable.map((a) => (
            <li key={a.state} className="flex justify-between items-center">
              <BasisKet bits={a.state} />
              <span className="font-mono text-[#71717A]">
                {(a.probability * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-[#B75D29]/40 p-4 bg-[#F6EEE8]/40">
        <p className="text-xs font-medium text-[#B75D29] mb-3 uppercase tracking-wide">
          After diffusion
        </p>
        <ul className="space-y-2 text-sm">
          {afterAmplitudes.map((a) => (
            <li key={a.state} className="flex justify-between items-center">
              <BasisKet bits={a.state} />
              <span
                className={`font-mono ${
                  a.state === targetState
                    ? 'text-[#B75D29] font-bold'
                    : 'text-[#71717A]'
                }`}
              >
                {(a.probability * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[#2A2A2A] mt-4 pt-3 border-t border-[#B75D29]/20">
          Target <BasisKet bits={targetState} />:{' '}
          <strong>
            {(targetBefore * 100).toFixed(0)}% → {(targetAfter * 100).toFixed(0)}%
          </strong>
        </p>
      </div>
    </div>
  );
}
