import React from 'react';

/** Quantum vs classical channel visuals — matches app light theme. */
export default function BB84StageChannels({
  quantumRef,
  classicalRef,
  quantumActive,
  classicalVisible,
  classicalActive,
  showQuantumFlow,
  showClassicalFlow,
}) {
  return (
    <>
      <div
        ref={quantumRef}
        className={`absolute left-[5%] right-[5%] top-[46%] h-3 rounded-full transition-all duration-500 z-[5] ${
          quantumActive
            ? 'opacity-100 shadow-[0_0_12px_rgba(183,93,41,0.25)]'
            : 'opacity-35'
        } bg-gradient-to-r from-[#F6EEE8] via-[#E9D5FF]/70 to-[#DBEAFE]/80 border ${
          quantumActive ? 'border-[#B75D29]/50' : 'border-[#E4E4E7]'
        }`}
      />
      {showQuantumFlow && (
        <div
          className="absolute left-[10%] right-[10%] top-[45%] flex justify-between pointer-events-none text-[#B75D29]"
          aria-hidden
        >
          <span className="text-lg animate-pulse">→</span>
          <span className="text-lg animate-pulse [animation-delay:200ms]">→</span>
          <span className="text-lg animate-pulse [animation-delay:400ms]">→</span>
        </div>
      )}

      <span
        className={`absolute left-[8%] top-[41%] text-[9px] uppercase tracking-widest font-medium ${
          quantumActive ? 'text-[#B75D29]' : 'text-[#A1A1AA]'
        }`}
      >
        Quantum channel · photons
      </span>

      <div
        ref={classicalRef}
        className={`absolute left-[8%] right-[8%] top-[68%] h-0 border-t-2 border-dashed transition-all duration-500 ${
          classicalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none invisible'
        } ${classicalActive ? 'border-[#B75D29]/60' : 'border-[#E4E4E7]'}`}
        aria-hidden={!classicalVisible}
      />
      {showClassicalFlow && classicalVisible && (
        <div
          className="absolute left-[12%] right-[12%] top-[60%] flex justify-center gap-6 pointer-events-none text-[#71717A] text-xs font-medium"
          aria-hidden
        >
          <span>Alice bases</span>
          <span className="text-[#B75D29]">⇄</span>
          <span>Bob bases</span>
        </div>
      )}

      <span
        className={`absolute left-[8%] top-[64%] text-[9px] uppercase tracking-widest transition-all duration-500 ${
          classicalVisible ? 'opacity-100 visible' : 'opacity-0 invisible h-0 overflow-hidden'
        } ${classicalActive ? 'text-[#B75D29] font-medium' : 'text-[#A1A1AA]'}`}
      >
        Classical channel · public bases
      </span>
    </>
  );
}
