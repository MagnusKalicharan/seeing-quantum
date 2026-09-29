import React from 'react';
import GateGlossary from './GateGlossary';
import WorkbenchBackground from './WorkbenchBackground';

export default function ChapterGates({ onBack }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans relative">
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
      <div className="relative z-10 pt-24 pb-20">
        <GateGlossary />
      </div>
    </div>
  );
}
