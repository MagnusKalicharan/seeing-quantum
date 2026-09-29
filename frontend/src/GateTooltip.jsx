import React, { useState, useEffect } from 'react';
import { GATE_METADATA } from './gateData';

// Renders a complex amplitude circle — all same size for uniformity.
// Zero amplitude = empty light gray. Non-zero = yellow with phase line.
// Magnitude is conveyed via opacity of the yellow fill.
const ComplexCircle = ({ mag, phase }) => {
  const [currentPhase, setCurrentPhase] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPhase(phase), 50);
    return () => clearTimeout(timer);
  }, [phase]);

  if (mag === 0) {
    return (
      <div className="w-6 h-6 rounded-full bg-[#F0EFED] border border-[#D4D4D8]" />
    );
  }

  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center">
      <div
        className="w-full h-full rounded-full border border-[#F5B041] relative"
        style={{ backgroundColor: `rgba(252,235,59,${0.4 + mag * 0.6})` }}
      >
        <div
          className="absolute bg-[#8C5A00]"
          style={{
            width: '48%',
            height: '1.5px',
            top: '50%',
            left: '50%',
            transformOrigin: '0% 50%',
            transform: `translateY(-50%) rotate(${-currentPhase}deg)`,
            transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />
      </div>
    </div>
  );
};

export default function GateTooltip({ gateType }) {
  const meta = GATE_METADATA[gateType];
  if (!meta) return null;

  return (
    <div className="animate-tooltip absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-[#B75D29] rounded-sm shadow-xl p-3 z-50 pointer-events-none">
      <h3 className="font-sans font-medium text-[#B75D29] text-sm mb-1">{meta.name}</h3>
      <p className="text-xs text-[#2A2A2A] mb-3 leading-tight">{meta.desc}</p>
      
      {meta.matrix && (
        <div className="mb-3">
          <div className="text-[10px] text-[#71717A] mb-1">As matrix:</div>
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 border-l-2 border-r-2 border-[#D4D4D8] px-1 rounded-sm">
              <div className="flex gap-1">
                <ComplexCircle {...meta.matrix[0][0]} />
                <ComplexCircle {...meta.matrix[0][1]} />
              </div>
              <div className="flex gap-1">
                <ComplexCircle {...meta.matrix[1][0]} />
                <ComplexCircle {...meta.matrix[1][1]} />
              </div>
            </div>
            <div className="flex flex-col justify-center gap-3 text-[10px] text-[#71717A] py-1">
              <span>{meta.labels[0]}</span>
              <span>{meta.labels[1]}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-[10px] text-[#71717A]">
        <div>As rotation:</div>
        <div className="flex items-center gap-2 mt-1">
          {/* Simple Bloch sphere icon placeholder */}
          <div className="w-8 h-8 rounded-full border border-gray-300 relative flex items-center justify-center text-gray-300">
             <div className="w-full h-[1px] bg-gray-300 absolute" />
             <div className="w-[1px] h-full bg-gray-300 absolute" />
             <div className="w-full h-full rounded-full border border-gray-300 absolute scale-y-50" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#2A2A2A] leading-tight font-medium">{meta.rotation}</span>
            {meta.globalPhase && (
              <span className="text-[#71717A] mt-1 scale-90 origin-left">global phase: {meta.globalPhase}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
