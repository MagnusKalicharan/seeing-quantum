import React from 'react';
import { Ket } from '../QuantumMath';
import { basisSymbol } from './bb84Simulator';

/**
 * Single photon — polarization arrow is an educational guide, not a classical ray.
 * Circle is centered in the 48×48 slot; labels sit below without shifting the channel alignment.
 */
export default function BB84Photon({
  photon,
  display,
  selected,
  onSelect,
  showLabel = true,
  dimmed = false,
  showIdentity = true,
  compact = false,
}) {
  const phase = display?.phase ?? 'encoded';
  const angle = display?.polarization?.angle ?? photon.polarization?.angle ?? 0;
  const ket = display?.ket ?? photon.sentKet ?? '0';
  const onBases = phase === 'bases';

  return (
    <button
      type="button"
      onClick={() => onSelect?.(photon.index)}
      className={`relative w-12 h-12 flex items-center justify-center transition-opacity duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B75D29] rounded-full ${
        dimmed ? 'opacity-40' : 'opacity-100'
      } ${selected ? 'scale-110' : ''} ${compact ? 'drop-shadow-md' : ''}`}
      title="Inspect photon"
    >
      {showIdentity && (
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#71717A] bg-white px-1 rounded border border-[#E4E4E7] whitespace-nowrap z-10">
          #{photon.index + 1}
        </span>
      )}
      <div
        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center shadow-sm shrink-0 ${
          selected
            ? 'border-[#B75D29] bg-[#F6EEE8]'
            : onBases
              ? 'border-[#E4E4E7] bg-white'
              : 'border-[#F59E0B] bg-[#FFFBEB] ring-2 ring-white'
        }`}
      >
        {onBases ? (
          <span className="text-lg font-mono text-[#B75D29]">{basisSymbol(photon.aliceBasis)}</span>
        ) : (
          <svg viewBox="0 0 40 40" className="w-9 h-9 sm:w-10 sm:h-10" aria-hidden>
            <line
              x1="20"
              y1="20"
              x2={20 + 14 * Math.cos((angle * Math.PI) / 180)}
              y2={20 - 14 * Math.sin((angle * Math.PI) / 180)}
              stroke="#B75D29"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="20" cy="20" r="3" fill="#D97706" />
          </svg>
        )}
      </div>
      {showLabel && !compact && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 text-[9px] text-center text-[#2A2A2A] leading-tight whitespace-nowrap pointer-events-none">
          {onBases ? (
            <span className="font-mono text-[#71717A]">
              {photon.aliceBit}
              {basisSymbol(photon.aliceBasis)}
            </span>
          ) : (
            <>
              <Ket value={ket} />
              <div className="text-[#71717A] font-mono">
                {photon.aliceBit}
                {basisSymbol(photon.aliceBasis)}
              </div>
            </>
          )}
        </div>
      )}
    </button>
  );
}
