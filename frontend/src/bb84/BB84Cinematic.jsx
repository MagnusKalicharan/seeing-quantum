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
import {
  messageToBits,
  runBB84,
  basisSymbol,
  stateKetLabel,
} from './bb84Simulator';
import {
  DEMO_MESSAGE,
  buildCinematicScenes,
  sceneForwardLabel,
} from './bb84Scenes';
import BB84Photon from './BB84Photon';
import BB84ProgressRail from './BB84ProgressRail';
import usePrefersReducedMotion from './usePrefersReducedMotion';
import useBB84Autoplay from './useBB84Autoplay';
import useBB84StageDirector from './useBB84StageDirector';
import { measureStageAnchors } from './bb84StageGeometry';
import { killPhotonTweens } from './bb84StageMotion';
import { photonDisplayState } from './bb84PhotonVisual';
import BB84StageChannels from './BB84StageChannels';
import { scenePresence } from './bb84ScenePresence';

const NUM_PHOTONS = 6;

function Actor({ name, subtitle, innerRef, accent }) {
  return (
    <div ref={innerRef} className="flex flex-col items-center shrink-0">
      <div
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center text-xl font-serif bg-white seeing-shadow ${
          accent === 'eve'
            ? 'border-red-300 text-red-800'
            : 'border-[#E4E4E7] text-[#2A2A2A]'
        }`}
      >
        {name[0]}
      </div>
      <span className="text-sm text-[#2A2A2A] mt-2 font-medium">{name}</span>
      <span className="text-[10px] text-[#71717A] uppercase tracking-wider">{subtitle}</span>
    </div>
  );
}

export default function BB84Cinematic({ onBack }) {
  const [eveEnabled, setEveEnabled] = useState(false);
  const [seed, setSeed] = useState(() => Date.now());
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [selectedPhoton, setSelectedPhoton] = useState(null);
  const [eveMotionLeg, setEveMotionLeg] = useState('idle');
  const [anchors, setAnchors] = useState(null);

  const photonRefs = useRef([]);
  const stageRef = useRef(null);
  const aliceRef = useRef(null);
  const bobRef = useRef(null);
  const eveRef = useRef(null);
  const quantumRef = useRef(null);
  const classicalRef = useRef(null);
  const isAutoplayRef = useRef(false);
  const motionGenRef = useRef(0);
  const timelineRef = useRef(null);

  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    isAutoplayRef.current = isAutoplay;
  }, [isAutoplay]);

  const messageBits = useMemo(
    () => messageToBits(DEMO_MESSAGE, NUM_PHOTONS),
    []
  );
  const demoBinaryPreview = useMemo(() => {
    const full = messageToBits(DEMO_MESSAGE, 16)
      .join('')
      .replace(/(.{8})/g, '$1 ')
      .trim();
    return full.length > 20 ? `${full.slice(0, 20)}…` : full;
  }, []);

  const run = useMemo(
    () =>
      runBB84({
        numPhotons: NUM_PHOTONS,
        eveEnabled,
        seed,
        aliceBits: messageBits,
      }),
    [eveEnabled, seed, messageBits]
  );

  const scenes = useMemo(() => buildCinematicScenes(eveEnabled), [eveEnabled]);

  const safeScene = Math.min(sceneIndex, scenes.length - 1);
  const scene = scenes[safeScene];
  const nextScene = safeScene < scenes.length - 1 ? scenes[safeScene + 1] : null;
  const atLast = safeScene >= scenes.length - 1;

  const reset = useCallback(() => {
    motionGenRef.current += 1;
    if (timelineRef.current) timelineRef.current.kill();
    killPhotonTweens(photonRefs.current);
    setSceneIndex(0);
    setIsAutoplay(false);
    setSelectedPhoton(null);
    setEveMotionLeg('idle');
    setSeed(Date.now());
  }, []);

  const toggleEve = () => {
    motionGenRef.current += 1;
    if (timelineRef.current) timelineRef.current.kill();
    killPhotonTweens(photonRefs.current);
    setEveEnabled((e) => !e);
    setSceneIndex(0);
    setIsAutoplay(false);
    setSelectedPhoton(null);
    setEveMotionLeg('idle');
    setSeed(Date.now());
  };

  const goNext = useCallback(
    () => setSceneIndex((i) => Math.min(i + 1, scenes.length - 1)),
    [scenes.length]
  );
  const goPrev = useCallback(() => {
    motionGenRef.current += 1;
    if (timelineRef.current) timelineRef.current.kill();
    killPhotonTweens(photonRefs.current);
    setSceneIndex((i) => Math.max(i - 1, 0));
    setSelectedPhoton(null);
    setEveMotionLeg('idle');
  }, []);

  const { clearDwell, notifyMotionComplete } = useBB84Autoplay({
    isAutoplay,
    setIsAutoplay,
    sceneId: scene.id,
    atLast,
    goNext,
    reducedMotion,
  });

  useEffect(() => {
    setSelectedPhoton(null);
  }, [scene.id]);

  useBB84StageDirector({
    sceneId: scene.id,
    runSeed: run.seed,
    photonCount: run.photons.length,
    eveEnabled,
    reducedMotion,
    anchors,
    photonRefs,
    timelineRef,
    motionGenRef,
    isAutoplayRef,
    onMotionFinished: notifyMotionComplete,
    setEveMotionLeg,
  });

  const remeasure = useCallback(() => {
    const next = measureStageAnchors(stageRef.current, {
      aliceEl: aliceRef.current,
      bobEl: bobRef.current,
      eveEl: eveEnabled ? eveRef.current : null,
      quantumEl: quantumRef.current,
      classicalEl: classicalRef.current,
    });
    setAnchors(next);
  }, [eveEnabled]);

  useEffect(() => {
    remeasure();
    const stage = stageRef.current;
    if (!stage) return undefined;
    const ro = new ResizeObserver(() => remeasure());
    ro.observe(stage);
    return () => ro.disconnect();
  }, [remeasure, eveEnabled]);

  useEffect(() => {
    if (!['message', 'finale'].includes(scene.id)) {
      requestAnimationFrame(() => {
        remeasure();
        requestAnimationFrame(() => remeasure());
      });
    }
  }, [scene.id, remeasure]);

  useEffect(
    () => () => {
      clearDwell();
      if (timelineRef.current) timelineRef.current.kill();
      killPhotonTweens(photonRefs.current);
    },
    [clearDwell]
  );

  const photon =
    selectedPhoton != null ? run.photons[selectedPhoton] : null;

  const showStagePhotons = !['message', 'finale'].includes(scene.id);
  const quantumActive = ['bases', 'encode', 'transmit', 'eve', 'measure'].includes(scene.id);
  const classicalVisible = ['compare', 'sift', 'verify'].includes(scene.id);
  const classicalActive = ['compare', 'sift', 'verify'].includes(scene.id);
  const showQuantumFlow = ['transmit', 'eve'].includes(scene.id) && !reducedMotion;
  const showClassicalFlow = scene.id === 'compare' && !reducedMotion;

  const presence = scenePresence(scene.id, { eveMotionLeg, eveEnabled });

  const stageHint = useMemo(() => {
    const hints = {
      bases: 'Alice chooses + or × independently for each photon.',
      encode: 'Alice encodes each bit into a polarization state.',
      transmit: 'Photons travel through the quantum channel — one pulse per bit.',
      eve: 'Eve measures and resends; wrong bases disturb the state.',
      measure: 'Bob picks a random basis per photon at the analyzer.',
      compare: 'Public classical channel: bases only, never the secret bits.',
      sift: 'Keep same-basis photons; discard the rest.',
      verify: 'Sample a few bits to estimate whether Eve was listening.',
    };
    return hints[scene.id] ?? '';
  }, [scene.id]);

  const toggleAutoplay = () => {
    if (atLast) {
      reset();
      setIsAutoplay(true);
      return;
    }
    setIsAutoplay((p) => !p);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans relative flex flex-col">
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

      <div className="relative z-10 flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 sm:px-6 pt-20 pb-40">
        <header className="text-center mb-4">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#B75D29] mb-2">
            Chapter 6 · BB84
          </p>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#2A2A2A] mb-2">
            Quantum secret message
          </h1>
          <p className="text-sm text-[#71717A] max-w-lg mx-auto">
            Watch {NUM_PHOTONS} photons carry bits from &ldquo;{DEMO_MESSAGE}&rdquo; — powered by the
            simulator.
          </p>
        </header>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <button
            type="button"
            onClick={toggleEve}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border ${
              eveEnabled
                ? 'bg-red-50 border-red-300 text-red-800'
                : 'bg-white border-[#E4E4E7] text-[#71717A]'
            }`}
          >
            {eveEnabled ? (
              <ShieldOff className="w-3.5 h-3.5" />
            ) : (
              <Shield className="w-3.5 h-3.5" />
            )}
            Eve {eveEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="mb-4 p-3 bg-white border border-[#E4E4E7] rounded-2xl seeing-shadow">
          <BB84ProgressRail sceneId={scene.id} eveEnabled={eveEnabled} scenes={scenes} />
        </div>

        <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1">
          <div
            ref={stageRef}
            className="flex-1 relative min-h-[360px] lg:min-h-[420px] bg-white border border-[#E4E4E7] rounded-2xl seeing-shadow overflow-hidden"
          >
            {scene.id === 'message' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <p className="text-4xl sm:text-5xl font-serif text-[#2A2A2A] mb-3 tracking-wide">
                  {DEMO_MESSAGE}
                </p>
                <p className="text-[#71717A] text-sm mb-2">becomes classical bits</p>
                <p className="font-mono text-xs sm:text-sm text-[#9A4C20] bg-[#F6EEE8] px-4 py-2 rounded-lg border border-[#E4E4E7]">
                  {demoBinaryPreview}
                </p>
                <p className="text-xs text-[#71717A] mt-4 max-w-md">
                  We follow {NUM_PHOTONS} photons — one quantum pulse per bit.
                </p>
                <div className="flex justify-between w-full max-w-md mt-8 px-2">
                  <Actor name="Alice" subtitle="Sender" />
                  {eveEnabled && <Actor name="Eve" subtitle="Eavesdropper" accent="eve" />}
                  <Actor name="Bob" subtitle="Receiver" />
                </div>
              </div>
            )}

            {scene.id !== 'message' && scene.id !== 'finale' && (
              <>
                <div className="absolute top-6 left-[3%] sm:left-[4%]">
                  <Actor name="Alice" subtitle="Sender" innerRef={aliceRef} />
                </div>
                {eveEnabled && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2">
                    <Actor name="Eve" subtitle="Intercept" innerRef={eveRef} accent="eve" />
                  </div>
                )}
                <div className="absolute top-6 right-[6%] sm:right-[8%]">
                  <Actor name="Bob" subtitle="Receiver" innerRef={bobRef} />
                </div>

                <BB84StageChannels
                  quantumRef={quantumRef}
                  classicalRef={classicalRef}
                  quantumActive={quantumActive}
                  classicalVisible={classicalVisible}
                  classicalActive={classicalActive}
                  showQuantumFlow={showQuantumFlow}
                  showClassicalFlow={showClassicalFlow}
                />

                {presence && (
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-[#FAFAFA] border border-[#E4E4E7] text-[10px] text-[#71717A] shadow-sm max-w-[92%] text-center">
                    <span className="text-[#2A2A2A] font-medium">{presence.where}</span>
                    <span className="text-[#A1A1AA] mx-1">·</span>
                    {presence.detail}
                  </div>
                )}

                {scene.id === 'measure' && (
                  <div className="absolute right-[5%] top-[38%] text-[10px] text-[#71717A] max-w-[90px] text-center">
                    Polarization analyzer → detector
                  </div>
                )}

                {stageHint && (
                  <p className="absolute top-3 left-0 right-0 text-center text-[11px] text-[#71717A] px-4">
                    {stageHint}
                  </p>
                )}

                {showStagePhotons &&
                  anchors &&
                  run.photons.map((p, i) => {
                    const discard = scene.id === 'sift' && !p.basesMatch;
                    const leg = scene.id === 'eve' ? eveMotionLeg : 'idle';
                    const display = photonDisplayState(p, scene.id, leg);
                    return (
                      <div
                        key={`${run.seed}-${p.index}`}
                        ref={(el) => {
                          photonRefs.current[i] = el;
                        }}
                        className="absolute pointer-events-auto will-change-[left,top] z-[15]"
                        style={{ zIndex: 15 + i, width: 48, height: 48 }}
                      >
                        <BB84Photon
                          photon={p}
                          display={display}
                          selected={selectedPhoton === i}
                          onSelect={setSelectedPhoton}
                          dimmed={discard}
                          compact={['transmit', 'eve'].includes(scene.id)}
                          showLabel={!['transmit', 'eve'].includes(scene.id) || selectedPhoton === i}
                        />
                      </div>
                    );
                  })}

                {scene.id === 'bases' && (
                  <div className="absolute bottom-3 left-2 right-2 flex flex-wrap gap-2 justify-center">
                    {run.photons.map((p) => (
                      <div
                        key={p.index}
                        className="text-[10px] bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-2 py-1 font-mono"
                      >
                        #{p.index + 1} bit {p.aliceBit} → basis{' '}
                        <span className="text-[#B75D29]">{basisSymbol(p.aliceBasis)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {scene.id === 'encode' && (
                  <div className="absolute bottom-3 left-2 right-2 flex flex-wrap gap-2 justify-center">
                    {run.photons.map((p) => (
                      <div
                        key={p.index}
                        className="text-[10px] bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-2 py-1 flex items-center gap-1"
                      >
                        <span className="font-mono text-[#2A2A2A]">{p.aliceBit}</span>
                        <span className="text-[#B75D29]">{basisSymbol(p.aliceBasis)}</span>
                        <span className="text-[#A1A1AA]">→</span>
                        <Ket value={stateKetLabel(p.aliceBit, p.aliceBasis)} />
                      </div>
                    ))}
                  </div>
                )}

                {scene.id === 'eve' && (
                  <div className="absolute bottom-3 left-2 right-2 text-[10px] text-red-800/90 text-center space-y-1">
                    <p className="font-medium">Per photon: measure → collapse → resend</p>
                    {run.photons.slice(0, 2).map((p) => (
                      <p key={p.index} className="font-mono text-[#71717A]">
                        <Ket value={p.sentKet} /> → Eve {basisSymbol(p.eveBasis)} →{' '}
                        {p.eveMeasuredBit} → <Ket value={p.eveResentKet} />
                      </p>
                    ))}
                    {run.photons.length > 2 && (
                      <p className="text-[#A1A1AA]">… and {run.photons.length - 2} more</p>
                    )}
                  </div>
                )}

                {scene.id === 'compare' && (
                  <div className="absolute bottom-3 left-2 right-2 text-[10px] overflow-x-auto space-y-2 px-1">
                    <div className="flex gap-1 items-center justify-center">
                      <span className="w-10 text-[#71717A]">Alice</span>
                      {run.photons.map((p) => (
                        <span
                          key={p.index}
                          className={`w-8 h-8 flex items-center justify-center rounded font-mono border ${
                            p.basesMatch
                              ? 'bg-[#F0FDF4] border-emerald-300 text-emerald-900'
                              : 'bg-[#FAFAFA] border-[#E4E4E7] opacity-50 line-through'
                          }`}
                        >
                          {basisSymbol(p.aliceBasis)}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1 items-center justify-center">
                      <span className="w-10 text-[#71717A]">Bob</span>
                      {run.photons.map((p) => (
                        <span
                          key={p.index}
                          className={`w-8 h-8 flex items-center justify-center rounded font-mono border ${
                            p.basesMatch
                              ? 'bg-[#F0FDF4] border-emerald-300 text-emerald-900'
                              : 'bg-[#FAFAFA] border-[#E4E4E7] opacity-50 line-through'
                          }`}
                        >
                          {basisSymbol(p.bobBasis)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {scene.id === 'sift' && (
                  <div className="absolute bottom-10 left-0 right-0 text-center">
                    <p className="text-xs text-emerald-700 uppercase tracking-widest mb-2 font-medium">
                      Sifted key
                    </p>
                    <p className="font-mono text-xl sm:text-2xl text-[#2A2A2A] tracking-[0.25em]">
                      {run.siftedAlice.join(' ')}
                    </p>
                  </div>
                )}

                {scene.id === 'verify' && (
                  <div className="absolute bottom-4 left-2 right-2 text-center text-sm">
                    {run.errorSampleIndices.map((i) => {
                      const p = run.photons[i];
                      const err = p.aliceBit !== p.bobBit;
                      return (
                        <span key={i} className="mx-1 font-mono text-xs">
                          #{i + 1}: A{p.aliceBit} B{p.bobBit}{' '}
                          {err ? (
                            <span className="text-red-600">≠</span>
                          ) : (
                            <span className="text-emerald-600">✓</span>
                          )}
                        </span>
                      );
                    })}
                    <p className="text-xs text-[#71717A] mt-2">
                      Sample error ≈ {(run.sampleErrorRate * 100).toFixed(0)}%
                      {eveEnabled ? ' — often higher with Eve' : ' — low without Eve'}
                    </p>
                  </div>
                )}

                {scene.id === 'measure' && (
                  <div className="absolute bottom-3 left-2 right-2 text-[10px] text-[#71717A]">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {run.photons.map((p) => (
                        <span
                          key={p.index}
                          className={`px-2 py-1 rounded border bg-white ${
                            p.basesMatch
                              ? p.bobBit === p.aliceBit
                                ? 'border-emerald-300 text-emerald-800'
                                : 'border-red-300 text-red-800'
                              : 'border-[#E4E4E7] text-[#71717A]'
                          }`}
                        >
                          #{p.index + 1} Bob {basisSymbol(p.bobBasis)} → {p.bobBit}
                          {!p.basesMatch && ' (random)'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {scene.id === 'finale' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-10">
                <p className="text-xs uppercase tracking-widest text-[#71717A] mb-2">
                  Shared secret key
                </p>
                <p className="font-mono text-2xl sm:text-3xl text-[#2A2A2A] tracking-widest mb-4">
                  {run.sharedKeyAlice.join('')}
                </p>
                <div className="flex items-center gap-3 text-sm text-[#2A2A2A] mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#F6EEE8] border border-[#E4E4E7]">
                    Alice
                  </span>
                  <span className="text-[#A1A1AA]">↔</span>
                  <span className="px-3 py-1 rounded-full bg-[#F6EEE8] border border-[#E4E4E7]">
                    Bob
                  </span>
                </div>
                <p className="text-sm text-[#71717A] max-w-md mb-4">
                  Quantum mechanics lets Alice and Bob detect disturbances caused by an eavesdropper.
                </p>
                <p className="text-3xl font-serif text-[#2A2A2A]">{DEMO_MESSAGE}</p>
                <p className="text-xs text-[#A1A1AA] mt-2">encoded · transmitted · key established</p>
                {eveEnabled && (
                  <p className="text-xs text-red-700 mt-3">Eve does not hold the final key.</p>
                )}
              </div>
            )}
          </div>

          <div className="w-full lg:w-[320px] shrink-0 flex flex-col bg-white border border-[#E4E4E7] rounded-2xl seeing-shadow p-4 sm:p-5 overflow-y-auto">
            <h2 className="text-xl font-serif text-[#2A2A2A] mb-3">{scene.title}</h2>
            <div className="space-y-3 text-sm text-[#4A4A4A]">
              <p>
                <span className="text-[#B75D29] font-semibold">What happened? </span>
                {scene.what}
              </p>
              <p>
                <span className="text-[#71717A] font-semibold">Why? </span>
                {scene.why}
              </p>
              <p>
                <span className="text-[#71717A] font-semibold">What changed? </span>
                {scene.result}
              </p>
            </div>

            {photon && (
              <div className="mt-4 p-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] text-xs space-y-1.5 text-[#2A2A2A]">
                <p className="text-[#B75D29] font-medium">Photon #{photon.index + 1}</p>
                <p>
                  Alice bit {photon.aliceBit} · basis {basisSymbol(photon.aliceBasis)} ·{' '}
                  <Ket value={photon.sentKet} />
                </p>
                <p className="text-[#71717A]">{photon.polarization?.name}</p>
                {eveEnabled && photon.eveResentKet && (
                  <p>
                    Eve {basisSymbol(photon.eveBasis)} → resend <Ket value={photon.eveResentKet} />
                  </p>
                )}
                <p>
                  Bob {basisSymbol(photon.bobBasis)} → {photon.bobBit}
                  {!photon.basesMatch && ' (different basis → probabilistic)'}
                </p>
              </div>
            )}

            {!photon && showStagePhotons && (
              <p className="text-[11px] text-[#A1A1AA] mt-4">
                Tap a photon to see bit, basis, polarization, and measurement.
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E4E4E7] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-2">
          <p className="text-xs text-center text-[#71717A]">
            {isAutoplay ? 'Autoplay — pause anytime or step manually' : sceneForwardLabel(scene, nextScene)}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-[#E4E4E7] text-[#71717A]"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restart
            </button>
            <button
              type="button"
              onClick={goPrev}
              disabled={safeScene === 0}
              className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-[#E4E4E7] disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              type="button"
              onClick={toggleAutoplay}
              className={`flex items-center gap-1 px-3 py-2 text-xs rounded-lg border font-medium ${
                isAutoplay
                  ? 'border-[#B75D29] bg-[#F6EEE8] text-[#9A4C20]'
                  : 'border-[#E4E4E7] text-[#2A2A2A]'
              }`}
            >
              {isAutoplay ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Autoplay
                </>
              )}
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={atLast}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-[#B75D29] text-white hover:bg-[#9A4C20] disabled:opacity-40"
            >
              {sceneForwardLabel(scene, nextScene)}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
