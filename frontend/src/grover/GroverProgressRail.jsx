import React from 'react';
import { progressLabelForStep, progressShortLabel } from './groverLessonUi';

export default function GroverProgressRail({ steps, currentIndex }) {
  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-center gap-1 min-w-max mx-auto justify-center px-2">
        {steps.map((rs, i) => {
          const done = currentIndex > i;
          const active = currentIndex === i;
          const label = progressLabelForStep(rs);

          return (
            <React.Fragment key={rs.id}>
              {i > 0 && (
                <div
                  className={`h-px w-4 sm:w-8 shrink-0 ${
                    done ? 'bg-[#B75D29]' : 'bg-[#E4E4E7]'
                  }`}
                />
              )}
              <div
                className={`flex flex-col items-center shrink-0 ${
                  active ? 'scale-105' : ''
                } transition-transform`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 ${
                    active
                      ? 'bg-[#B75D29] border-[#9A4C20] text-white'
                      : done
                        ? 'bg-[#F6EEE8] border-[#B75D29] text-[#9A4C20]'
                        : 'bg-white border-[#E4E4E7] text-[#A1A1AA]'
                  }`}
                  title={label}
                >
                  {progressShortLabel(rs) === '·' ? i + 1 : progressShortLabel(rs)}
                </div>
                <span
                  className={`text-[9px] sm:text-[10px] mt-1 max-w-[4.5rem] text-center leading-tight ${
                    active ? 'text-[#B75D29] font-semibold' : 'text-[#71717A]'
                  }`}
                >
                  {label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
