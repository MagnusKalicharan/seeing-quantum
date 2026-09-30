import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Pause, Play, RotateCcw, Target } from 'lucide-react';
import WorkbenchBackground from '../WorkbenchBackground';
import { BasisKet, MathBlock } from '../QuantumMath';
import GroverAmplitudeChart from './GroverAmplitudeChart';
import GroverProbabilityChart from './GroverProbabilityChart';
import GroverCircuitStrip from './GroverCircuitStrip';
import GroverStateRow from './GroverStateRow';
import GroverProgressRail from './GroverProgressRail';
import GroverDiffusionCompare from './GroverDiffusionCompare';
import {
  buildGroverTimeline,
  indexToStateLabel,
  numStates,
  sampleMeasurement,
} from './groverSimulator';
import {
  LESSON_TIER,
  filterStepsForTier,
  resolveForwardLabel,
  forwardActionHint,
} from './groverLessonUi';

function useStepCopy(step, tier) {
  if (tier === LESSON_TIER.BEGINNER && step.beginnerWhat) {
    return {
      title: step.beginnerTitle || step.title,
      what: step.beginnerWhat,
      why: step.beginnerWhy,
      changed: step.beginnerChanged,
    };
  }
  return {
    title: step.title,
    what: step.what,
    why: step.why,
    changed: step.changed,
  };
}

export default function GroverLesson({ onBack }) {
  const [tier, setTier] = useState(LESSON_TIER.BEGINNER);
  const [numQubits, setNumQubits] = useState(2);
  const [targetIndex, setTargetIndex] = useState(1);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [measureOutcome, setMeasureOutcome] = useState(null);
  const [showMath, setShowMath] = useState(false);
  const playRef = useRef(null);

  const N = numStates(numQubits);
  const safeTargetIndex = targetIndex >= N ? 0 : targetIndex;
  const isBeginner = tier === LESSON_TIER.BEGINNER;

  const timeline = useMemo(
    () =>
      buildGroverTimeline(numQubits, safeTargetIndex, {
        beginner: isBeginner,
      }),
    [numQubits, safeTargetIndex, isBeginner]
  );

  const steps = useMemo(
    () => filterStepsForTier(timeline.steps, tier),
    [timeline.steps, tier]
  );

  const safeStepIndex = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const step = steps[safeStepIndex] ?? steps[0];
  const copy = useStepCopy(step, tier);
  const totalIterations = timeline.iterations;
  const atLastStep = safeStepIndex >= steps.length - 1;
  const nextStep = atLastStep ? null : steps[safeStepIndex + 1];

  const resetLesson = useCallback(() => {
    setStepIndex(0);
    setMeasureOutcome(null);
    setIsPlaying(false);
    setShowMath(false);
  }, []);

  const changeQubits = (n) => {
    setNumQubits(n);
    resetLesson();
  };

  const changeTarget = (idx) => {
    setTargetIndex(idx);
    resetLesson();
  };

  const changeTier = (t) => {
    setTier(t);
    resetLesson();
    if (t === LESSON_TIER.BEGINNER && numQubits > 3) setNumQubits(2);
  };

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    setMeasureOutcome(null);
  }, [steps.length]);

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
    setMeasureOutcome(null);
  }, []);

  useEffect(() => {
    if (!isPlaying || !isBeginner) {
      if (playRef.current) clearInterval(playRef.current);
      return undefined;
    }
    playRef.current = setInterval(() => {
      setStepIndex((i) => {
        if (i >= steps.length - 1) {
          setIsPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 2800);
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, [isPlaying, steps.length, isBeginner]);

  const handleMeasure = () => {
    if (step.type !== 'measure') return;
    const idx = sampleMeasurement(step.stateVector);
    setMeasureOutcome(idx);
  };

  const primaryLabel =
    step.type === 'measure' && atLastStep
      ? 'Measure the qubits →'
      : resolveForwardLabel(step, nextStep, atLastStep);

  const actionHint = forwardActionHint(step, nextStep, atLastStep);

  const showProbVisual =
    step.type !== 'problem' || !isBeginner;
  const showAmplitudeExplore =
    !isBeginner &&
    ['oracle', 'diffuser', 'measure', 'speedup'].includes(step.type);
  const showPhaseOnRow = step.type === 'oracle';

  const qubitOptions = isBeginner ? [2, 3] : [2, 3, 4];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans relative">
      <WorkbenchBackground />

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 text-[#71717A] hover:text-[#B75D29] font-medium bg-white/90 px-4 py-2 rounded-full shadow-sm border border-[#E4E4E7]"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      )}

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-36">
        <header className="text-center mb-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#B75D29] mb-2">
            Grover · Interactive lesson
          </p>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#2A2A2A] mb-2">
            Search with amplitude amplification
          </h1>
          <p className="text-[#71717A] text-sm max-w-lg mx-auto">
            One button per stage. Watch the target state become more likely — powered by the real simulator.
          </p>
        </header>

        {/* Tier + setup */}
        <div className="flex flex-col gap-3 mb-6 p-4 bg-white border border-[#E4E4E7] rounded-2xl seeing-shadow">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => changeTier(LESSON_TIER.BEGINNER)}
              className={`px-4 py-2 rounded-full text-xs font-medium border ${
                isBeginner
                  ? 'bg-[#B75D29] text-white border-[#9A4C20]'
                  : 'bg-white text-[#71717A] border-[#E4E4E7]'
              }`}
            >
              Beginner
            </button>
            <button
              type="button"
              onClick={() => changeTier(LESSON_TIER.EXPLORE)}
              className={`px-4 py-2 rounded-full text-xs font-medium border ${
                !isBeginner
                  ? 'bg-[#2A2A2A] text-white border-[#1A1A1A]'
                  : 'bg-white text-[#71717A] border-[#E4E4E7]'
              }`}
            >
              Explore
            </button>
          </div>

          <div className="flex flex-wrap gap-3 justify-center items-center text-sm">
            <label className="flex items-center gap-2">
              <span className="text-[#71717A]">Search space</span>
              <select
                value={numQubits}
                onChange={(e) => changeQubits(Number(e.target.value))}
                className="border border-[#E4E4E7] rounded-lg px-2 py-1.5 bg-white"
              >
                {qubitOptions.map((n) => (
                  <option key={n} value={n}>
                    {numStates(n)} states ({n} qubits)
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#B75D29]" />
              <span className="text-[#71717A]">Marked item</span>
              <select
                value={safeTargetIndex}
                onChange={(e) => changeTarget(Number(e.target.value))}
                className="border border-[#E4E4E7] rounded-lg px-2 py-1.5 font-mono bg-white"
              >
                {Array.from({ length: N }, (_, i) => (
                  <option key={i} value={i}>
                    {indexToStateLabel(i, numQubits)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isBeginner && N <= 8 && (
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              {Array.from({ length: N }, (_, i) => {
                const label = indexToStateLabel(i, numQubits);
                const active = i === safeTargetIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => changeTarget(i)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono border ${
                      active
                        ? 'bg-[#B75D29] text-white border-[#9A4C20]'
                        : 'bg-[#FAFAFA] border-[#E4E4E7] text-[#71717A]'
                    }`}
                  >
                    <BasisKet bits={label} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-6">
          <GroverProgressRail steps={steps} currentIndex={safeStepIndex} />
        </div>

        {/* Main card */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 sm:p-6 seeing-shadow space-y-5">
          <h2 className="text-xl font-serif text-[#2A2A2A]">{copy.title}</h2>

          <div className="space-y-3 text-sm text-[#4A4A4A]">
            <p>
              <span className="text-[#B75D29] font-semibold">What happened? </span>
              {copy.what}
            </p>
            <p>
              <span className="text-[#71717A] font-semibold">Why? </span>
              {copy.why}
            </p>
            <p>
              <span className="text-[#71717A] font-semibold">What changed? </span>
              {copy.changed}
            </p>
          </div>

          {step.type === 'problem' && (
            <div className="pt-2">
              <p className="text-xs text-[#71717A] mb-3 text-center">
                The highlighted state is the one the oracle will mark (you can change it above).
              </p>
              <GroverStateRow
                amplitudes={step.amplitudes}
                targetState={step.targetLabel}
              />
            </div>
          )}

          {step.type === 'hadamard' && (
            <div className="pt-2">
              {!isBeginner && (
                <GroverCircuitStrip
                  numQubits={numQubits}
                  highlightOp="H"
                  iteration={null}
                  totalIterations={totalIterations}
                />
              )}
              <GroverStateRow
                amplitudes={step.amplitudes}
                targetState={step.targetLabel}
              />
            </div>
          )}

          {step.type === 'oracle' && (
            <div className="space-y-4 pt-2">
              {!isBeginner && (
                <GroverCircuitStrip
                  numQubits={numQubits}
                  highlightOp="O"
                  iteration={step.iteration}
                  totalIterations={totalIterations}
                />
              )}
              {isBeginner && (
                <p className="text-xs text-center text-[#B75D29] bg-[#F6EEE8] rounded-lg py-2 px-3">
                  The oracle does not reveal the answer — it only flips the target&apos;s phase (sign).
                </p>
              )}
              <GroverStateRow
                amplitudes={step.amplitudes}
                targetState={step.targetLabel}
                showPhase={showPhaseOnRow}
              />
              {showAmplitudeExplore && (
                <GroverAmplitudeChart
                  amplitudes={step.amplitudes}
                  targetState={step.targetLabel}
                />
              )}
            </div>
          )}

          {step.type === 'diffuser' && (
            <div className="space-y-4 pt-2">
              {!isBeginner && (
                <GroverCircuitStrip
                  numQubits={numQubits}
                  highlightOp="D"
                  iteration={step.iteration}
                  totalIterations={totalIterations}
                />
              )}
              {step.beforeDiffuser && (
                <GroverDiffusionCompare
                  beforeStateVector={step.beforeDiffuser}
                  afterAmplitudes={step.amplitudes}
                  targetState={step.targetLabel}
                  numQubits={numQubits}
                />
              )}
              <GroverStateRow
                amplitudes={step.amplitudes}
                targetState={step.targetLabel}
              />
              {showAmplitudeExplore && (
                <>
                  <GroverAmplitudeChart
                    amplitudes={step.amplitudes}
                    targetState={step.targetLabel}
                    meanAmplitude={step.meanAmplitude}
                  />
                  <GroverProbabilityChart
                    probabilities={step.probabilities}
                    targetState={step.targetLabel}
                  />
                </>
              )}
            </div>
          )}

          {(step.type === 'measure' || step.type === 'speedup') && showProbVisual && (
            <div className="pt-2 space-y-4">
              {!isBeginner && step.type === 'measure' && (
                <GroverCircuitStrip
                  numQubits={numQubits}
                  highlightOp="M"
                  iteration={null}
                  totalIterations={totalIterations}
                />
              )}
              <GroverStateRow
                amplitudes={step.amplitudes}
                targetState={step.targetLabel}
              />
              {!isBeginner && (
                <GroverProbabilityChart
                  probabilities={step.probabilities}
                  targetState={step.targetLabel}
                />
              )}
            </div>
          )}

          {!isBeginner && step.math && (
            <details className="border border-[#E4E4E7] rounded-xl overflow-hidden">
              <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-[#71717A] bg-[#FAFAFA]">
                Mathematics
              </summary>
              <div className="p-3 overflow-x-auto">
                <MathBlock>{step.math}</MathBlock>
              </div>
            </details>
          )}

          {isBeginner && step.math && !showMath && (
            <button
              type="button"
              onClick={() => setShowMath(true)}
              className="text-xs text-[#B75D29] hover:underline"
            >
              Show the math (optional)
            </button>
          )}
          {isBeginner && showMath && step.math && (
            <div className="rounded-xl border border-[#E4E4E7] p-3 overflow-x-auto bg-[#FAFAFA]">
              <MathBlock>{step.math}</MathBlock>
              <button
                type="button"
                onClick={() => setShowMath(false)}
                className="text-xs text-[#71717A] mt-2 hover:underline"
              >
                Hide math
              </button>
            </div>
          )}

          {measureOutcome != null && step.type === 'measure' && (
            <div className="text-center p-4 rounded-xl bg-[#F0FDF4] border border-emerald-200">
              <p className="text-sm text-[#2A2A2A]">
                Measurement result:{' '}
                <BasisKet bits={indexToStateLabel(measureOutcome, numQubits)} />
              </p>
              {measureOutcome === safeTargetIndex ? (
                <p className="text-emerald-700 font-medium text-sm mt-1">
                  You found the marked item.
                </p>
              ) : (
                <p className="text-[#71717A] text-sm mt-1">
                  Randomness can still pick a wrong state — try again or reset.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E4E4E7] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-2">
          <p className="text-xs text-center text-[#71717A]">{actionHint}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={resetLesson}
              className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-[#E4E4E7] text-[#71717A]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={goPrev}
              disabled={safeStepIndex === 0}
              className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-[#E4E4E7] disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </button>

            {!isBeginner && (
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-[#E4E4E7]"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Auto
                  </>
                )}
              </button>
            )}

            {step.type === 'measure' && atLastStep ? (
              <button
                type="button"
                onClick={handleMeasure}
                disabled={measureOutcome != null}
                className="px-5 py-2.5 text-sm font-medium rounded-xl bg-[#2A2A2A] text-white hover:bg-[#1A1A1A] disabled:opacity-50"
              >
                {primaryLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={atLastStep}
                className="px-5 py-2.5 text-sm font-medium rounded-xl bg-[#B75D29] text-white hover:bg-[#9A4C20] disabled:opacity-40"
              >
                {primaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
