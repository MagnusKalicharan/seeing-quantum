import React from 'react';
import { TIMELINE_LABELS } from './bb84Scenes';

const LABEL_TO_SCENE = {
  Message: 'message',
  Bases: 'bases',
  Encode: 'encode',
  Send: 'transmit',
  Eve: 'eve',
  Measure: 'measure',
  Compare: 'compare',
  Sift: 'sift',
  Verify: 'verify',
  Key: 'finale',
};

export default function BB84ProgressRail({ sceneId, eveEnabled, scenes }) {
  const labels = TIMELINE_LABELS.filter((l) => l !== 'Eve' || eveEnabled);
  const currentIndex = scenes.findIndex((s) => s.id === sceneId);

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-center gap-1 min-w-max mx-auto justify-center px-2">
        {labels.map((label, i) => {
          const targetScene = LABEL_TO_SCENE[label];
          const stepIndex = scenes.findIndex((s) => s.id === targetScene);
          const done = currentIndex > stepIndex && stepIndex >= 0;
          const active = sceneId === targetScene;

          return (
            <React.Fragment key={label}>
              {i > 0 && (
                <div
                  className={`h-px w-4 sm:w-6 shrink-0 ${done ? 'bg-[#B75D29]' : 'bg-[#E4E4E7]'}`}
                />
              )}
              <div
                className={`px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] uppercase tracking-wider border shrink-0 ${
                  active
                    ? 'bg-[#F6EEE8] border-[#B75D29] text-[#9A4C20] font-semibold'
                    : done
                      ? 'bg-white border-[#B75D29]/40 text-[#9A4C20]'
                      : 'bg-white border-[#E4E4E7] text-[#A1A1AA]'
                }`}
              >
                {label}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
