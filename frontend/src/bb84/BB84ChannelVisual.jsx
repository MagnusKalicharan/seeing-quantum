import React from 'react';
import { Ket } from '../QuantumMath';
import { basisSymbol } from './bb84Simulator';

function Person({ name, role, color }) {
  return (
    <div className="flex flex-col items-center shrink-0 w-20 sm:w-24">
      <div
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg font-serif border-2 ${color}`}
      >
        {name[0]}
      </div>
      <span className="text-xs font-medium text-[#2A2A2A] mt-2">{name}</span>
      <span className="text-[10px] text-[#71717A]">{role}</span>
    </div>
  );
}

function Photon({ ket, progress, visible }) {
  if (!visible) return null;
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out flex flex-col items-center"
      style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
    >
      <div className="w-8 h-8 rounded-full bg-[#B75D29]/20 border-2 border-[#B75D29] shadow-[0_0_12px_rgba(183,93,41,0.4)] flex items-center justify-center">
        <span className="text-[10px] font-serif text-[#9A4C20]">
          <Ket value={ket} />
        </span>
      </div>
    </div>
  );
}

/**
 * Alice — quantum/classical channel — Bob (+ optional Eve).
 * progress 0 = Alice, 50 = mid, 100 = Bob.
 */
export default function BB84ChannelVisual({
  stepType,
  photons,
  eveEnabled,
  activePhotonIndex = null,
}) {
  const showQuantum =
    ['encode', 'transmit', 'eve', 'bob_measure'].includes(stepType) ||
    stepType === 'bob_bases';
  const showClassical = ['public_bases', 'sift', 'error_check', 'final_key'].includes(
    stepType
  );

  let photonProgress = (i) => 8;
  if (stepType === 'encode') photonProgress = () => 8;
  else if (stepType === 'transmit') photonProgress = (i) => 25 + (i / Math.max(1, photons.length)) * 35;
  else if (stepType === 'eve') photonProgress = () => 45;
  else if (stepType === 'bob_bases' || stepType === 'bob_measure')
    photonProgress = () => 88;

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl border border-[#E4E4E7] bg-gradient-to-b from-[#FAFAFA] to-white p-4 sm:p-6 min-h-[140px]">
        <div className="flex items-center justify-between gap-2 relative z-10">
          <Person name="Alice" role="Sender" color="border-[#B75D29] bg-[#F6EEE8]" />
          {eveEnabled && (
            <Person name="Eve" role="Intercept" color="border-red-400 bg-red-50" />
          )}
          <Person name="Bob" role="Receiver" color="border-[#1D4ED8] bg-[#EFF6FF]" />
        </div>

        {showQuantum && (
          <div className="relative mt-6 h-10 mx-4 sm:mx-12">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-gradient-to-r from-[#B75D29] via-[#9333EA] to-[#1D4ED8] rounded-full opacity-60" />
            <span className="absolute -top-5 left-0 text-[9px] uppercase tracking-wider text-[#B75D29] font-mono">
              Quantum channel
            </span>
            {photons.map((p, i) => (
              <Photon
                key={p.index}
                ket={p.eveResentKet ?? p.sentKet}
                progress={photonProgress(i)}
                visible={activePhotonIndex == null || activePhotonIndex === i}
              />
            ))}
          </div>
        )}

        {showClassical && (
          <div className="relative mt-4 h-8 mx-4 sm:mx-12">
            <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 border-t-2 border-dashed border-[#71717A] rounded" />
            <span className="absolute -top-4 left-0 text-[9px] uppercase tracking-wider text-[#71717A] font-mono">
              Classical public channel
            </span>
          </div>
        )}
      </div>

      {stepType === 'alice_bases' && (
        <p className="text-xs text-center text-[#71717A]">
          <span className="font-mono text-[#B75D29]">+</span> = rectilinear (
          <Ket value="0" /> / <Ket value="1" />
          ) · <span className="font-mono text-[#B75D29]">×</span> = diagonal (
          <Ket value="+" /> / <Ket value="−" />
          )
        </p>
      )}
    </div>
  );
}

export function BasisRow({ label, bases, photons, highlightMatch = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-[#71717A] w-14 shrink-0">{label}</span>
      {photons.map((p, i) => {
        const sym = basisSymbol(bases[i] ?? p.aliceBasis);
        const match =
          highlightMatch && p.aliceBasis === p.bobBasis;
        const mismatch = highlightMatch && !p.basesMatch;
        return (
          <span
            key={i}
            className={`w-9 h-9 flex items-center justify-center rounded-lg font-mono text-sm border ${
              match
                ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                : mismatch
                  ? 'bg-[#FAFAFA] border-[#E4E4E7] text-[#A1A1AA] line-through opacity-60'
                  : 'bg-white border-[#E4E4E7]'
            }`}
          >
            {sym}
          </span>
        );
      })}
    </div>
  );
}

export function BitRow({ label, values, photons, discardIndices = null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-[#71717A] w-14 shrink-0">{label}</span>
      {photons.map((p, i) => {
        const v = values[i];
        const discarded = discardIndices && !discardIndices.includes(i);
        const err = p.basesMatch && p.aliceBit !== p.bobBit;
        return (
          <span
            key={i}
            className={`w-9 h-9 flex items-center justify-center rounded-lg font-mono text-sm border ${
              discarded
                ? 'opacity-30 line-through border-[#E4E4E7]'
                : err
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'bg-white border-[#E4E4E7]'
            }`}
          >
            {v}
          </span>
        );
      })}
    </div>
  );
}
