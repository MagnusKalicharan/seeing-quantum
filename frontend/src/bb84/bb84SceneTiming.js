/** Dwell time after static scenes before autoplay advances (ms). Motion scenes wait on GSAP instead. */
export function sceneDwellMs(sceneId, { reducedMotion = false } = {}) {
  const scale = reducedMotion ? 0.45 : 1;
  const table = {
    message: 4500,
    bases: 4500,
    encode: 5600,
    measure: 5200,
    compare: 4800,
    sift: 4800,
    verify: 5000,
    finale: 0,
  };
  return Math.round((table[sceneId] ?? 3200) * scale);
}

export function motionDuration(sceneId, { reducedMotion = false } = {}) {
  if (reducedMotion) return { leg: 0.15, stagger: 0.04, pauseAtEve: 0.2 };
  if (sceneId === 'eve') {
    return { leg: 0.9, stagger: 0.16, pauseAtEve: 0.85 };
  }
  return { leg: 1.1, stagger: 0.22, pauseAtEve: 0 };
}

export function sceneUsesMotion(sceneId) {
  return sceneId === 'transmit' || sceneId === 'eve';
}

/** Pause after photon motion finishes before autoplay advances. */
export function postMotionDwellMs(sceneId, { reducedMotion = false } = {}) {
  const scale = reducedMotion ? 0.45 : 1;
  const table = { transmit: 2200, eve: 2600 };
  return Math.round((table[sceneId] ?? 1200) * scale);
}
