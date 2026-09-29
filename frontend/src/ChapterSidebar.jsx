import React, { useState } from 'react';
import { CHAPTERS } from './chaptersData';
import { BookOpen, CheckCircle2, ChevronRight, Play } from 'lucide-react';

export default function ChapterSidebar({ onRunExample }) {
  const [activeChapter, setActiveChapter] = useState(1);

  return (
    <div className="w-[360px] h-screen sticky top-0 bg-white/95 backdrop-blur-xl border-r border-[#E4E4E7] shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col z-20">
      
      {/* Sidebar Header */}
      <div className="p-6 border-b border-[#E4E4E7] bg-[#FAFAFA]/50">
        <div className="flex items-center gap-3 mb-2 text-[#B75D29]">
          <BookOpen size={20} />
          <h2 className="font-serif font-medium text-lg">Interactive Textbook</h2>
        </div>
        <p className="text-xs text-[#71717A] leading-relaxed">
          Follow these guided lessons to build your intuition for quantum mechanics.
        </p>
      </div>

      {/* Chapter List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {CHAPTERS.map((chap) => {
          const isActive = activeChapter === chap.id;
          
          return (
            <div 
              key={chap.id}
              onClick={() => setActiveChapter(chap.id)}
              className={`rounded-2xl transition-all cursor-pointer border ${
                isActive 
                  ? 'bg-white border-[#B75D29] shadow-md shadow-[#B75D29]/10' 
                  : 'bg-[#FAFAFA] border-transparent hover:border-[#E4E4E7] hover:bg-white'
              }`}
            >
              {/* Chapter Header */}
              <div className="p-4 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-serif text-sm transition-colors ${
                  isActive ? 'bg-[#B75D29] text-white' : 'bg-[#E4E4E7] text-[#71717A]'
                }`}>
                  {chap.id}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider mb-0.5">{chap.subtitle}</div>
                  <h3 className={`font-serif text-sm font-medium ${isActive ? 'text-[#2A2A2A]' : 'text-[#71717A]'}`}>
                    {chap.title}
                  </h3>
                </div>
              </div>

              {/* Chapter Content (Expanded) */}
              <div className={`overflow-hidden transition-all duration-300 ${isActive ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-5 pb-5 pt-1 border-t border-[#FAFAFA]">
                  <div className="text-sm text-[#2A2A2A] leading-relaxed space-y-3 whitespace-pre-wrap">
                    {/* Render bold text simply */}
                    {chap.content.split('**').map((text, i) => 
                      i % 2 === 1 ? <strong key={i} className="text-[#B75D29] font-medium">{text}</strong> : text
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
