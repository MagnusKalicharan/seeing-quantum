import gsap from 'gsap';
import { motionDuration } from './bb84SceneTiming';
import {
  PHOTON_RADIUS,
  photonSlot,
  sceneToColumn,
  transmitDestColumn,
} from './bb84StageGeometry';

export function killPhotonTweens(refs) {
  refs.filter(Boolean).forEach((el) => gsap.killTweensOf(el));
}

function applyPhotonSlot(el, slot, index, { opacity = 1 } = {}) {
  gsap.set(el, {
    left: slot.x,
    top: slot.y,
    xPercent: -50,
    yPercent: -50,
    opacity,
    zIndex: 10 + index,
  });
}

function near(a, b, eps = 5) {
  return Math.abs(a - b) <= eps;
}

function slotForScene(anchors, sceneId, index, total) {
  const column = sceneToColumn(sceneId);
  return photonSlot(anchors, column, index, total);
}

export function placePhotonsStatic(refs, anchors, sceneId, total, { soft = false, animate = false } = {}) {
  if (!anchors) return;
  refs.forEach((el, i) => {
    if (!el) return;
    const slot = slotForScene(anchors, sceneId, i, total);

    if (soft) {
      const curL = Number(gsap.getProperty(el, 'left')) || 0;
      const curT = Number(gsap.getProperty(el, 'top')) || 0;
      if (near(curL, slot.x) && near(curT, slot.y)) return;
    }

    gsap.killTweensOf(el);
    if (animate && !soft) {
      gsap.to(el, {
        left: slot.x,
        top: slot.y,
        xPercent: -50,
        yPercent: -50,
        opacity: 1,
        zIndex: 10 + i,
        duration: 0.6,
        ease: 'power2.inOut',
        overwrite: 'auto',
      });
    } else {
      applyPhotonSlot(el, slot, i);
    }
  });
}

/** Alice → Eve/Bob along quantum channel (fixed channelY). */
export function runTransmitMotion({
  refs,
  anchors,
  total,
  eveEnabled,
  reducedMotion,
  onComplete,
}) {
  killPhotonTweens(refs);
  if (!anchors || refs.length === 0) {
    onComplete?.();
    return null;
  }

  const { leg, stagger } = motionDuration('transmit', { reducedMotion });
  const destCol = transmitDestColumn(eveEnabled, anchors);
  const tl = gsap.timeline({ onComplete: () => onComplete?.() });

  refs.forEach((el, i) => {
    if (!el) return;
    const from = photonSlot(anchors, 'alice', i, total);
    const to = photonSlot(anchors, destCol, i, total);

    applyPhotonSlot(el, from, i);
    tl.to(
      el,
      {
        left: to.x,
        top: to.y,
        xPercent: -50,
        yPercent: -50,
        duration: leg,
        ease: reducedMotion ? 'none' : 'power2.inOut',
      },
      i * stagger
    );
  });

  return tl;
}

/** Eve → Bob on quantum channel. */
export function runEveMotion({
  refs,
  anchors,
  total,
  reducedMotion,
  onComplete,
  onAtEve,
  onSecondLegStart,
}) {
  killPhotonTweens(refs);
  if (!anchors?.eve || refs.length === 0) {
    onComplete?.();
    return null;
  }

  const { leg, stagger, pauseAtEve } = motionDuration('eve', { reducedMotion });
  const tl = gsap.timeline({ onComplete: () => onComplete?.() });

  refs.forEach((el, i) => {
    if (!el) return;
    const eveSlot = photonSlot(anchors, 'eve', i, total);
    const curL = Number(gsap.getProperty(el, 'left')) || 0;
    const curT = Number(gsap.getProperty(el, 'top')) || 0;
    if (!near(curL, eveSlot.x, 12) || !near(curT, eveSlot.y, 8)) {
      applyPhotonSlot(el, eveSlot, i);
    } else {
      gsap.set(el, { xPercent: -50, yPercent: -50, zIndex: 10 + i, opacity: 1 });
    }
  });

  tl.add(() => onAtEve?.(), 0);

  let secondLegAt = pauseAtEve;
  refs.forEach((el, i) => {
    if (!el) return;
    const to = photonSlot(anchors, 'bob', i, total);
    const offset = pauseAtEve + i * stagger;
    if (i === 0) secondLegAt = offset;
    tl.to(
      el,
      {
        left: to.x,
        top: to.y,
        xPercent: -50,
        yPercent: -50,
        duration: leg,
        ease: reducedMotion ? 'none' : 'power2.inOut',
      },
      offset
    );
  });

  tl.add(() => onSecondLegStart?.(), secondLegAt);

  return tl;
}

export function estimateMotionMs(sceneId, photonCount, { reducedMotion = false } = {}) {
  const { leg, stagger, pauseAtEve } = motionDuration(sceneId, { reducedMotion });
  const n = Math.max(1, photonCount);
  if (sceneId === 'transmit') {
    return Math.ceil(((n - 1) * stagger + leg) * 1000);
  }
  if (sceneId === 'eve') {
    return Math.ceil((pauseAtEve + (n - 1) * stagger + leg) * 1000);
  }
  return 0;
}

export { PHOTON_RADIUS };
