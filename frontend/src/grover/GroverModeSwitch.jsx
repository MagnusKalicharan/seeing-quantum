import React from 'react';
import { Clapperboard, GraduationCap } from 'lucide-react';

/**
 * Shared mode toggle — mounted by ChapterGrovers so animation vs lesson stay isolated.
 */
export default function GroverModeSwitch({ mode, onModeChange }) {
  return (
    <div
      className="fixed top-6 right-6 z-[100] flex rounded-full border border-[#E4E4E7] bg-white/95 shadow-lg p-1 gap-0.5"
      role="tablist"
      aria-label="Grover experience mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'animation'}
        onClick={() => onModeChange('animation')}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
          mode === 'animation'
            ? 'bg-[#080810] text-white'
            : 'text-[#71717A] hover:text-[#2A2A2A] hover:bg-[#F4F4F5]'
        }`}
      >
        <Clapperboard className="w-3.5 h-3.5" />
        Animation
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'interactive'}
        onClick={() => onModeChange('interactive')}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
          mode === 'interactive'
            ? 'bg-[#B75D29] text-white'
            : 'text-[#71717A] hover:text-[#2A2A2A] hover:bg-[#F4F4F5]'
        }`}
      >
        <GraduationCap className="w-3.5 h-3.5" />
        Interactive lesson
      </button>
    </div>
  );
}
