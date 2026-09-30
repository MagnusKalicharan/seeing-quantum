import React from 'react';
import { BasisKet } from '../QuantumMath';

/**
 * Beginner-friendly row of basis states with probability bars.
 */
export default function GroverStateRow({
  amplitudes,
  targetState,
  showPhase = false,
  compact = false,
}) {
  const maxProb = Math.max(0.01, ...amplitudes.map((a) => a.probability));

  return (
    <div
      className={`grid gap-3 ${compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`}
    >
      {amplitudes.map((a) => {
        const isTarget = a.state === targetState;
        const heightPct = (a.probability / maxProb) * 100;
        const negative = a.re < -0.001;

        return (
          <div
            key={a.state}
            className={`rounded-xl border p-3 flex flex-col items-center ${
              isTarget
                ? 'border-[#B75D29] bg-[#F6EEE8]/80 ring-2 ring-[#B75D29]/25'
                : 'border-[#E4E4E7] bg-white'
            }`}
          >
            <BasisKet bits={a.state} />
            {isTarget && (
              <span className="text-[9px] uppercase tracking-wider text-[#B75D29] mt-0.5">
                target
              </span>
            )}
            <div className="w-full h-16 mt-2 flex items-end justify-center bg-[#FAFAFA] rounded-lg border border-[#E4E4E7]/80 px-2 pb-1">
              <div
                className={`w-8 rounded-t transition-all duration-700 ease-out ${
                  isTarget ? 'bg-[#B75D29]' : 'bg-[#D4D4D8]'
                }`}
                style={{ height: `${Math.max(4, heightPct)}%` }}
              />
            </div>
            <p className="text-xs font-medium text-[#2A2A2A] mt-2">
              {(a.probability * 100).toFixed(0)}% chance
            </p>
            {showPhase && (
              <p
                className={`text-[10px] font-mono mt-0.5 ${
                  negative ? 'text-blue-600' : 'text-[#71717A]'
                }`}
              >
                amp {a.re >= 0 ? '+' : ''}
                {a.re.toFixed(2)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
