import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, MessageSquare, X } from 'lucide-react';
import QuantumTutorModal from './QuantumTutorModal';

export default function FloatingTutorButton({ currentGates = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnreadTip, setHasUnreadTip] = useState(true);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        {hasUnreadTip && !isOpen && (
          <div className="hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-md border border-[#B75D29]/30 text-[#2A2A2A] px-3.5 py-1.5 rounded-full shadow-lg text-xs animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-[#B75D29]" />
            <span>Need help understanding quantum mechanics?</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setHasUnreadTip(false);
              }}
              className="text-[#71717A] hover:text-[#2A2A2A] ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(true);
            setHasUnreadTip(false);
          }}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#B75D29] to-[#9A4C20] hover:from-[#A65324] hover:to-[#8B431C] text-white px-4 py-3 rounded-full shadow-xl shadow-[#B75D29]/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 cursor-pointer"
          title="Open AI Quantum Tutor"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse" />
          </div>
          <span className="font-medium text-xs sm:text-sm tracking-wide">
            Ask AI Tutor
          </span>
        </button>
      </div>

      {/* Tutor Modal */}
      <QuantumTutorModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentGates={currentGates}
      />
    </>
  );
}
