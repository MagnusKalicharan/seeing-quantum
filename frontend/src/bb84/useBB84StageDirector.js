import { useEffect, useLayoutEffect, useRef } from 'react';
import { sceneUsesMotion } from './bb84SceneTiming';
import {
  killPhotonTweens,
  placePhotonsStatic,
  runEveMotion,
  runTransmitMotion,
} from './bb84StageMotion';

/**
 * Photon motion / placement once per scene entry. Resize only nudges static scenes.
 */
export default function useBB84StageDirector({
  sceneId,
  runSeed,
  photonCount,
  eveEnabled,
  reducedMotion,
  anchors,
  photonRefs,
  timelineRef,
  motionGenRef,
  isAutoplayRef,
  onMotionFinished,
  setEveMotionLeg,
}) {
  const anchorsRef = useRef(anchors);
  const onMotionFinishedRef = useRef(onMotionFinished);

  useEffect(() => {
    anchorsRef.current = anchors;
  }, [anchors]);

  useEffect(() => {
    onMotionFinishedRef.current = onMotionFinished;
  }, [onMotionFinished]);

  const prevSceneIdRef = useRef(sceneId);

  useLayoutEffect(() => {
    const gen = ++motionGenRef.current;
    const prevScene = prevSceneIdRef.current;

    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
    const refsAtStart = photonRefs.current.slice();
    killPhotonTweens(refsAtStart);

    const startMotion = () => {
      if (gen !== motionGenRef.current) return;

      const a = anchorsRef.current;
      const refs = photonRefs.current.filter(Boolean);
      if (!a || refs.length < photonCount) return false;

      const finishMotion = () => {
        if (gen !== motionGenRef.current) return;
        onMotionFinishedRef.current(isAutoplayRef.current, sceneId);
      };

      if (sceneId === 'transmit') {
        timelineRef.current = runTransmitMotion({
          refs,
          anchors: a,
          total: photonCount,
          eveEnabled,
          reducedMotion,
          onComplete: finishMotion,
        });
        return true;
      }

      if (sceneId === 'eve') {
        setEveMotionLeg('idle');
        timelineRef.current = runEveMotion({
          refs,
          anchors: a,
          total: photonCount,
          reducedMotion,
          onAtEve: () => {
            if (gen === motionGenRef.current) setEveMotionLeg('atEve');
          },
          onSecondLegStart: () => {
            if (gen === motionGenRef.current) setEveMotionLeg('toBob');
          },
          onComplete: finishMotion,
        });
        return true;
      }

      return false;
    };

    const placeStatic = () => {
      const a = anchorsRef.current;
      if (!a || ['message', 'finale'].includes(sceneId)) return;

      const fromMotion = ['transmit', 'eve'].includes(prevScene);
      const softMeasure = sceneId === 'measure' && fromMotion;
      const animateClassical =
        sceneId === 'compare' && (prevScene === 'measure' || prevScene === 'eve');

      placePhotonsStatic(photonRefs.current, a, sceneId, photonCount, {
        soft: softMeasure,
        animate: animateClassical,
      });
    };

    if (sceneUsesMotion(sceneId)) {
      let attempts = 0;
      const tryStart = () => {
        if (gen !== motionGenRef.current) return;
        if (startMotion()) return;
        if (attempts < 15) {
          attempts += 1;
          requestAnimationFrame(tryStart);
        }
      };
      tryStart();
    } else {
      placeStatic();
    }

    prevSceneIdRef.current = sceneId;

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
      killPhotonTweens(refsAtStart);
    };
  }, [
    sceneId,
    runSeed,
    photonCount,
    eveEnabled,
    reducedMotion,
    photonRefs,
    timelineRef,
    motionGenRef,
    isAutoplayRef,
    setEveMotionLeg,
  ]);

  useLayoutEffect(() => {
    if (!anchors || sceneUsesMotion(sceneId)) return;
    if (['message', 'finale'].includes(sceneId)) return;
    if (photonRefs.current.filter(Boolean).length === 0) return;

    placePhotonsStatic(photonRefs.current, anchors, sceneId, photonCount, { soft: true });
  }, [anchors, sceneId, photonCount, photonRefs]);
}
