/**
 * Photon positions from measured quantum-channel geometry (stage-local px).
 */

export const PHOTON_RADIUS = 24;

const PHOTON_DIAMETER = 48;
const MIN_GAP = 6;

/** Along-quantum-bar span [t0, t1] for each station (0 = Alice end, 1 = Bob end). */
const STATION_SPAN = {
  alice: [0.08, 0.42],
  eve: [0.38, 0.62],
  bob: [0.58, 0.92],
};

export function measureStageAnchors(stageEl, { aliceEl, bobEl, eveEl, quantumEl, classicalEl }) {
  if (!stageEl || !aliceEl || !bobEl || !quantumEl) return null;

  const stage = stageEl.getBoundingClientRect();
  const toLocal = (rect) => ({
    x: rect.left + rect.width / 2 - stage.left,
    y: rect.top + rect.height / 2 - stage.top,
  });

  const alice = toLocal(aliceEl.getBoundingClientRect());
  const bob = toLocal(bobEl.getBoundingClientRect());

  const quantum = quantumEl.getBoundingClientRect();
  const channelY = quantum.top + quantum.height / 2 - stage.top;
  const quantumLeft = quantum.left - stage.left;
  const quantumRight = quantum.right - stage.left;
  const quantumWidth = Math.max(0, quantumRight - quantumLeft);

  let eve = null;
  if (eveEl) {
    eve = toLocal(eveEl.getBoundingClientRect());
  }

  let classicalY = channelY + 80;
  if (classicalEl) {
    const c = classicalEl.getBoundingClientRect();
    if (c.height > 0) {
      classicalY = c.top + c.height / 2 - stage.top;
    } else {
      classicalY = c.top - stage.top;
    }
  }

  return {
    alice,
    bob,
    eve,
    channelY,
    classicalY,
    quantumLeft,
    quantumRight,
    quantumWidth,
    stageWidth: stage.width,
    stageHeight: stage.height,
  };
}

export function photonRowSpacing(anchors, total, station = 'alice') {
  if (!anchors || total <= 1) return 0;
  const span = STATION_SPAN[station] ?? STATION_SPAN.alice;
  const pxSpan = (span[1] - span[0]) * anchors.quantumWidth;
  const minNeeded = (PHOTON_DIAMETER + MIN_GAP) * (total - 1);
  if (pxSpan >= minNeeded) return PHOTON_DIAMETER + MIN_GAP;
  return Math.max(PHOTON_DIAMETER + 2, pxSpan / (total - 1));
}

/** X center for photon index — spread inside the station span (avoids overlap at Alice). */
export function quantumRowCenterX(anchors, station, index, total) {
  const [t0, t1] = STATION_SPAN[station] ?? STATION_SPAN.alice;
  const w = anchors.quantumWidth;
  const leftX = anchors.quantumLeft + t0 * w;
  const rightX = anchors.quantumLeft + t1 * w;
  const usable = rightX - leftX;
  const spacing = photonRowSpacing(anchors, total, station);
  const rowWidth = (total - 1) * spacing;
  const startX = leftX + Math.max(0, (usable - rowWidth) / 2);
  if (total <= 1) return leftX + usable / 2;
  return startX + index * spacing;
}

/** Classical row (basis compare only) — separate Y, spread on same X logic as quantum. */
export function classicalRowCenterX(anchors, index, total) {
  const [t0, t1] = STATION_SPAN.eve;
  const w = anchors.quantumWidth;
  const leftX = anchors.quantumLeft + t0 * w;
  const rightX = anchors.quantumLeft + t1 * w;
  const usable = rightX - leftX;
  const spacing = photonRowSpacing(anchors, total, 'eve');
  const rowWidth = (total - 1) * spacing;
  const startX = leftX + Math.max(0, (usable - rowWidth) / 2);
  if (total <= 1) return leftX + usable / 2;
  return startX + index * spacing;
}

/** Photon center (x, y). Quantum stations share channelY; classical uses classicalY. */
export function photonCenter(anchors, column, index, total) {
  if (column === 'classical') {
    return {
      x: classicalRowCenterX(anchors, index, total),
      y: anchors.classicalY,
    };
  }
  const station = column === 'eve' ? 'eve' : column;
  return {
    x: quantumRowCenterX(anchors, station, index, total),
    y: anchors.channelY,
  };
}

/** Center point for absolute positioning (use with translate -50%, -50%). */
export function photonSlot(anchors, column, index, total) {
  return photonCenter(anchors, column, index, total);
}

export function sceneToColumn(sceneId) {
  if (['bases', 'encode', 'transmit'].includes(sceneId)) return 'alice';
  if (sceneId === 'measure') return 'bob';
  if (sceneId === 'eve') return 'eve';
  if (['compare', 'sift', 'verify'].includes(sceneId)) return 'classical';
  return 'alice';
}

export function transmitDestColumn(eveEnabled, anchors) {
  return eveEnabled && anchors?.eve ? 'eve' : 'bob';
}
