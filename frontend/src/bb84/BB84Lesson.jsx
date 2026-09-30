import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  Pause,
  Play,
  RotateCcw,
  Shield,
  ShieldOff,
} from 'lucide-react';
import WorkbenchBackground from '../WorkbenchBackground';
import { Ket } from '../QuantumMath';
import { runBB84, basisSymbol, stateKetLabel } from './bb84Simulator';
import { buildBB84Steps, forwardHint, forwardLabel } from './bb84LessonSteps';
import BB84ChannelVisual, { BasisRow, BitRow } from './BB84ChannelVisual';

const NUM_PHOTONS = 5;

export default function BB84Lesson({ onBack }) {
  const [eveEnabled, setEveEnabled] = useState(false);
  const [seed, setSeed] = useState(() => Date.now());
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef(null);

  const run = useMemo(
    () => runBB84({ numPhotons: NUM_PHOTONS, eveEnabled, seed }),
    [eveEnabled, seed]
  );

  const steps = useMemo(() => buildBB84Steps(eveEnabled), [eveEnabled]);
  const safeIndex = Math.min(stepIndex, steps.length - 1);
  const step = steps[safeIndex];
  const nextStep = safeIndex < steps.length - 1 ? steps[safeIndex + 1] : null;
  const atLast = safeIndex >= steps.length - 1;

  const reset = useCallback(() => {
    setStepIndex(0);
    setIsPlaying(false);
    setSeed(Date.now());
  }, []);

  const toggleEve = () => {
    setEveEnabled((e) => !e);
    setStepIndex(0);
    setIsPlaying(false);
    setSeed(Date.now());
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0));

  useEffect(() => {
    if (!isPlaying) {
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
    }, 3200);
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, [isPlaying, steps.length]);

  const aliceBits = run.photons.map((p) => p.aliceBit);
  const bobBits = run.photons.map((p) => p.bobBit);
  const aliceBases = run.photons.map((p) => p.aliceBasis);
  const bobBases = run.photons.map((p) => p.bobBasis);

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
            Chapter 6 · Quantum cryptography
          </p>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#2A2A2A]">
            BB84 Key Distribution
          </h1>
          <p className="text-sm text-[#71717A] mt-2 max-w-lg mx-auto">
            Watch Alice and Bob build a shared key — and see why Eve leaves fingerprints.
          </p>
        </header>

        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={toggleEve}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
              eveEnabled
                ? 'bg-red-50 border-red-300 text-red-800'
                : 'bg-white border-[#E4E4E7] text-[#71717A]'
            }`}
          >
            {eveEnabled ? (
              <ShieldOff className="w-4 h-4" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            {eveEnabled ? 'Eve is listening (tap to remove)' : 'No Eve (tap to add eavesdropper)'}
          </button>
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 sm:p-6 seeing-shadow space-y-5">
          <div className="flex justify-between items-center text-xs text-[#71717A] font-mono">
            <span>
              Step {safeIndex + 1} / {steps.length}
            </span>
            <span className="text-[#B75D29]">{step.channel} channel</span>
          </div>

          <h2 className="text-xl font-serif text-[#2A2A2A]">{step.title}</h2>
          <p className="text-sm text-[#4A4A4A]">
            <span className="font-semibold text-[#B75D29]">What: </span>
            {step.what}
          </p>
          <p className="text-sm text-[#4A4A4A]">
            <span className="font-semibold text-[#71717A]">Why: </span>
            {step.why}
          </p>

          <BB84ChannelVisual
            stepType={step.type}
            photons={run.photons}
            eveEnabled={eveEnabled}
          />

          {step.type === 'alice_bits' && (
            <BitRow label="Alice" values={aliceBits} photons={run.photons} />
          )}

          {step.type === 'alice_bases' && (
            <BasisRow label="Alice" bases={aliceBases} photons={run.photons} />
          )}

          {step.type === 'encode' && (
            <div className="space-y-2">
              {run.photons.map((p) => (
                <div
                  key={p.index}
                  className="flex flex-wrap items-center gap-2 text-sm bg-[#FAFAFA] rounded-lg px-3 py-2 border border-[#E4E4E7]"
                >
                  <span className="font-mono text-[#71717A]">bit {p.aliceBit}</span>
                  <span className="font-mono text-[#B75D29]">{basisSymbol(p.aliceBasis)}</span>
                  <span className="text-[#71717A]">→</span>
                  <Ket value={stateKetLabel(p.aliceBit, p.aliceBasis)} />
                </div>
              ))}
            </div>
          )}

          {step.type === 'eve' && (
            <div className="space-y-2 text-sm">
              {run.photons.map((p) => (
                <div
                  key={p.index}
                  className="flex flex-wrap gap-2 items-center px-3 py-2 rounded-lg border border-red-200 bg-red-50/50"
                >
                  <span className="text-red-800 font-medium">Eve</span>
                  <span className="font-mono">{basisSymbol(p.eveBasis)}</span>
                  <span className="text-[#71717A]">measured → {p.eveMeasuredBit}</span>
                  <span className="text-[#71717A]">resent</span>
                  <Ket value={p.eveResentKet} />
                </div>
              ))}
            </div>
          )}

          {step.type === 'bob_bases' && (
            <BasisRow label="Bob" bases={bobBases} photons={run.photons} />
          )}

          {(step.type === 'bob_measure' || step.type === 'public_bases') && (
            <div className="space-y-3 overflow-x-auto">
              <BasisRow label="Alice" bases={aliceBases} photons={run.photons} />
              <BasisRow label="Bob" bases={bobBases} photons={run.photons} />
              <BitRow label="Alice" values={aliceBits} photons={run.photons} />
              <BitRow label="Bob" values={bobBits} photons={run.photons} />
              <p className="text-xs text-[#71717A] pt-2">
                Same basis: Bob matches Alice (unless Eve added noise). Different basis:
                Bob&apos;s bit looks random — not &quot;wrong&quot; in a deterministic sense.
              </p>
            </div>
          )}

          {step.type === 'public_bases' && (
            <BasisRow
              label="Match?"
              bases={aliceBases}
              photons={run.photons}
              highlightMatch
            />
          )}

          {step.type === 'sift' && (
            <div className="space-y-3">
              <BitRow
                label="Keep"
                values={aliceBits}
                photons={run.photons}
                discardIndices={run.siftedIndices}
              />
              <p className="text-xs text-[#71717A]">
                We keep only indices where Alice and Bob used the same basis (
                {run.siftedIndices.length} of {NUM_PHOTONS}).
              </p>
              <div className="flex flex-wrap gap-1">
                {run.siftedIndices.map((i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs font-mono"
                  >
                    {run.photons[i].aliceBit}
                  </span>
                ))}
              </div>
            </div>
          )}

          {step.type === 'error_check' && (
            <div className="space-y-3 text-sm">
              <p>
                Sampled positions (revealed publicly):{' '}
                {run.errorSampleIndices.map((i) => (
                  <span key={i} className="font-mono mx-1">
                    #{i + 1}
                  </span>
                ))}
              </p>
              <p>
                Mismatches in sample:{' '}
                <strong className={run.sampleErrors > 0 ? 'text-red-600' : 'text-emerald-600'}>
                  {run.sampleErrors} / {run.errorSampleIndices.length}
                </strong>{' '}
                (≈ {(run.sampleErrorRate * 100).toFixed(0)}% error)
              </p>
              <p className="text-xs text-[#71717A]">
                {eveEnabled
                  ? 'With Eve, expect more errors — not a single-shot proof, but a statistical warning.'
                  : 'Without Eve, errors should be low (ideal channel).'}
              </p>
            </div>
          )}

          {step.type === 'final_key' && (
            <div className="text-center space-y-4 py-4">
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
                <span>Alice 🔒</span>
                <span className="text-[#71717A]">—</span>
                <span className="px-3 py-2 bg-[#F6EEE8] border border-[#B75D29]/30 rounded-xl font-mono tracking-widest">
                  {run.sharedKeyAlice.join(' ') || '—'}
                </span>
                <span className="text-[#71717A]">—</span>
                <span>🔒 Bob</span>
              </div>
              {eveEnabled && (
                <p className="text-xs text-red-700">
                  Eve does not hold this key — she only saw disturbed qubits on the quantum link.
                </p>
              )}
              <p className="text-xs text-[#71717A]">
                Keys match:{' '}
                {run.sharedKeyAlice.join('') === run.sharedKeyBob.join('')
                  ? 'yes (remaining sifted bits agree)'
                  : 'no — error rate too high; abort in real BB84'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E4E4E7] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-2">
          <p className="text-xs text-center text-[#71717A]">
            {forwardHint(nextStep) || (atLast ? 'Protocol complete — reset to try new random bits.' : '')}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-[#E4E4E7]"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              type="button"
              onClick={goPrev}
              disabled={safeIndex === 0}
              className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-[#E4E4E7] disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
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
                  <Play className="w-3.5 h-3.5" /> Play
                </>
              )}
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={atLast}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-[#B75D29] text-white disabled:opacity-40"
            >
              {forwardLabel(step, nextStep) ?? 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
