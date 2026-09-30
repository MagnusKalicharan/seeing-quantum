/**
 * BB84 quantum key distribution — state preparation, measurement, Eve attack.
 * Bases: '+' = Z (|0⟩,|1⟩), 'x' = X (|+⟩,|−⟩).
 */

export function createRng(seed = Date.now()) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function prepareAmplitudes(bit, basis) {
  const s = 1 / Math.SQRT2;
  if (basis === '+') {
    return bit === 0
      ? { re0: 1, im0: 0, re1: 0, im1: 0 }
      : { re0: 0, im0: 0, re1: 1, im1: 0 };
  }
  return bit === 0
    ? { re0: s, im0: 0, re1: s, im1: 0 }
    : { re0: s, im0: 0, re1: -s, im1: 0 };
}

function probBit0InBasis(state, basis) {
  if (basis === '+') {
    return state.re0 * state.re0 + state.im0 * state.im0;
  }
  const ampPlus = (state.re0 + state.re1) / Math.SQRT2;
  return ampPlus * ampPlus;
}

/** Measure in Z or X BB84 convention; returns 0 or 1. */
export function measureInBasis(state, basis, rng) {
  const p0 = probBit0InBasis(state, basis);
  return rng() < p0 ? 0 : 1;
}

export function stateKetLabel(bit, basis) {
  if (basis === '+') return bit === 0 ? '0' : '1';
  return bit === 0 ? '+' : '−';
}

export function basisSymbol(basis) {
  return basis === '+' ? '+' : '×';
}

/** Bits from message ASCII (for demo key from "HELLO", etc.). */
export function messageToBits(message, count) {
  const bits = [];
  for (const ch of message) {
    const byte = ch.charCodeAt(0).toString(2).padStart(8, '0');
    for (const b of byte) bits.push(Number(b));
    if (bits.length >= count) break;
  }
  while (bits.length < count) bits.push(0);
  return bits.slice(0, count);
}

/** Educational polarization angle (degrees) for visualization — not a classical ray model. */
export function polarizationVisual(bit, basis) {
  const ket = stateKetLabel(bit, basis);
  const map = {
    0: { angle: 0, name: 'Horizontal (|0⟩)' },
    1: { angle: 90, name: 'Vertical (|1⟩)' },
    '+': { angle: 45, name: 'Diagonal (|+⟩)' },
    '−': { angle: -45, name: 'Anti-diagonal (|−⟩)' },
  };
  return { ket, ...map[ket] };
}

/**
 * Run full BB84 for n photons.
 * @param {number[]} [aliceBits] — fixed Alice bits (e.g. from message); random if omitted.
 */
export function runBB84({ numPhotons = 5, eveEnabled = false, seed, aliceBits } = {}) {
  const rng = createRng(seed ?? Date.now());

  const photons = [];

  for (let i = 0; i < numPhotons; i++) {
    const aliceBit =
      aliceBits && aliceBits[i] != null
        ? aliceBits[i]
        : rng() < 0.5
          ? 0
          : 1;
    const aliceBasis = rng() < 0.5 ? '+' : 'x';
    const bobBasis = rng() < 0.5 ? '+' : 'x';
    const eveBasis = eveEnabled ? (rng() < 0.5 ? '+' : 'x') : null;

    let state = prepareAmplitudes(aliceBit, aliceBasis);
    const sentKet = stateKetLabel(aliceBit, aliceBasis);

    let eveMeasuredBit = null;
    let eveResentKet = null;
    if (eveEnabled) {
      eveMeasuredBit = measureInBasis(state, eveBasis, rng);
      state = prepareAmplitudes(eveMeasuredBit, eveBasis);
      eveResentKet = stateKetLabel(eveMeasuredBit, eveBasis);
    }

    const bobBit = measureInBasis(state, bobBasis, rng);
    const basesMatch = aliceBasis === bobBasis;
    const wouldBeCorrect = basesMatch && bobBit === aliceBit;

    const pol = polarizationVisual(aliceBit, aliceBasis);
    photons.push({
      index: i,
      aliceBit,
      aliceBasis,
      bobBasis,
      eveBasis,
      sentKet,
      eveMeasuredBit,
      eveResentKet,
      bobBit,
      basesMatch,
      wouldBeCorrect,
      wrongBasisRandom: !basesMatch,
      polarization: pol,
    });
  }

  const siftedIndices = photons
    .map((p, i) => (p.basesMatch ? i : -1))
    .filter((i) => i >= 0);

  const siftedAlice = siftedIndices.map((i) => photons[i].aliceBit);
  const siftedBob = siftedIndices.map((i) => photons[i].bobBit);

  let errorsInSift = 0;
  siftedIndices.forEach((i) => {
    if (photons[i].aliceBit !== photons[i].bobBit) errorsInSift += 1;
  });

  const sampleSize =
    siftedIndices.length >= 2
      ? Math.max(1, Math.floor(siftedIndices.length / 2))
      : siftedIndices.length;

  const shuffled = [...siftedIndices].sort(() => rng() - 0.5);
  const errorSampleIndices = shuffled.slice(0, sampleSize);
  let sampleErrors = 0;
  errorSampleIndices.forEach((i) => {
    if (photons[i].aliceBit !== photons[i].bobBit) sampleErrors += 1;
  });

  const errorRate = siftedIndices.length
    ? errorsInSift / siftedIndices.length
    : 0;
  const sampleErrorRate = errorSampleIndices.length
    ? sampleErrors / errorSampleIndices.length
    : 0;

  const keyIndices = siftedIndices.filter((i) => !errorSampleIndices.includes(i));
  const sharedKeyAlice = keyIndices.map((i) => photons[i].aliceBit);
  const sharedKeyBob = keyIndices.map((i) => photons[i].bobBit);

  return {
    numPhotons,
    eveEnabled,
    seed,
    messageBits: aliceBits,
    photons,
    siftedIndices,
    siftedAlice,
    siftedBob,
    errorsInSift,
    errorRate,
    errorSampleIndices,
    sampleErrors,
    sampleErrorRate,
    sharedKeyAlice,
    sharedKeyBob,
    keyIndices,
  };
}
