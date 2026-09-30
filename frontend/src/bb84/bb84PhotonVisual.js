import { polarizationVisual } from './bb84Simulator';

const KET_POL = {
  0: { angle: 0, name: 'Horizontal (|0⟩)', ket: '0' },
  1: { angle: 90, name: 'Vertical (|1⟩)', ket: '1' },
  '+': { angle: 45, name: 'Diagonal (|+⟩)', ket: '+' },
  '−': { angle: -45, name: 'Anti-diagonal (|−⟩)', ket: '−' },
};

export function polarizationFromKet(ket) {
  return KET_POL[ket] ?? KET_POL[0];
}

/** Which ket / polarization to show for a photon on a given story beat. */
export function photonDisplayState(photon, sceneId, motionLeg = 'idle') {
  const bitBasis = `${photon.aliceBit} · ${photon.aliceBasis === '+' ? '+' : '×'}`;

  if (sceneId === 'bases') {
    return {
      ket: null,
      polarization: null,
      phase: 'bases',
      caption: `Bit ${photon.aliceBit} · basis ${photon.aliceBasis === '+' ? '+' : '×'}`,
      bitBasis,
    };
  }

  if (sceneId === 'eve' && motionLeg === 'toBob' && photon.eveResentKet) {
    const ket = photon.eveResentKet;
    return {
      ket,
      polarization: polarizationFromKet(ket),
      caption: `Eve resends · ${ket}`,
      bitBasis,
    };
  }

  if (sceneId === 'measure' || sceneId === 'compare' || sceneId === 'sift' || sceneId === 'verify') {
    const travelKet = photon.eveResentKet != null ? photon.eveResentKet : photon.sentKet;
    const pol = polarizationFromKet(travelKet);
    return {
      ket: travelKet,
      polarization: pol,
      caption: sceneId === 'measure' ? `Bob → ${photon.bobBit}` : bitBasis,
      bitBasis,
    };
  }

  return {
    ket: photon.sentKet,
    polarization: photon.polarization ?? polarizationVisual(photon.aliceBit, photon.aliceBasis),
    phase: 'encoded',
    caption: bitBasis,
    bitBasis,
  };
}
