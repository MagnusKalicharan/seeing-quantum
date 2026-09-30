import { useCallback, useEffect, useRef } from 'react';
import { postMotionDwellMs, sceneDwellMs, sceneUsesMotion } from './bb84SceneTiming';

/**
 * Schedules scene advances while autoplay is on. Motion scenes call `notifyMotionComplete` only.
 */
export default function useBB84Autoplay({
  isAutoplay,
  setIsAutoplay,
  sceneId,
  atLast,
  goNext,
  reducedMotion,
}) {
  const dwellRef = useRef(null);
  const goNextRef = useRef(goNext);

  useEffect(() => {
    goNextRef.current = goNext;
  }, [goNext]);

  const clearDwell = useCallback(() => {
    if (dwellRef.current) {
      clearTimeout(dwellRef.current);
      dwellRef.current = null;
    }
  }, []);

  useEffect(() => clearDwell, [clearDwell]);

  useEffect(() => {
    clearDwell();
    if (!isAutoplay) return undefined;
    if (atLast) {
      setIsAutoplay(false);
      return undefined;
    }
    if (sceneUsesMotion(sceneId)) {
      return undefined;
    }
    const ms = sceneDwellMs(sceneId, { reducedMotion });
    if (ms <= 0) return undefined;
    dwellRef.current = setTimeout(() => {
      dwellRef.current = null;
      goNextRef.current();
    }, ms);
    return clearDwell;
  }, [isAutoplay, sceneId, atLast, reducedMotion, setIsAutoplay, clearDwell]);

  const notifyMotionComplete = useCallback(
    (autoplayActive, motionSceneId) => {
      clearDwell();
      if (!autoplayActive) return;
      const id = motionSceneId ?? sceneId;
      const post = postMotionDwellMs(id, { reducedMotion });
      dwellRef.current = setTimeout(() => {
        dwellRef.current = null;
        goNextRef.current();
      }, post);
    },
    [clearDwell, reducedMotion, sceneId]
  );

  return { clearDwell, notifyMotionComplete };
}
