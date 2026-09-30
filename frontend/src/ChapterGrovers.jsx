import React, { lazy, Suspense, useState } from 'react';
import GroverModeSwitch from './grover/GroverModeSwitch';

const GroverScrollyExperience = lazy(() => import('./grover/GroverScrollyExperience'));
const GroverLesson = lazy(() => import('./grover/GroverLesson'));

function GroverLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-[#71717A] text-sm">
      Loading Grover experience…
    </div>
  );
}

/**
 * Chapter 5 — two isolated experiences:
 * - Animation: original scrolly + Three.js / sandbox
 * - Interactive lesson: simulation-driven step-through
 */
export default function ChapterGrovers({ onBack }) {
  const [mode, setMode] = useState('animation');

  return (
    <>
      <GroverModeSwitch mode={mode} onModeChange={setMode} />

      <Suspense fallback={<GroverLoading />}>
        {mode === 'animation' ? (
          <GroverScrollyExperience key="grover-animation" onBack={onBack} />
        ) : (
          <GroverLesson key="grover-interactive" onBack={onBack} />
        )}
      </Suspense>
    </>
  );
}
