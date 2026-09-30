export const DEMO_MESSAGE = 'HELLO';

export const TIMELINE_LABELS = [
  'Message',
  'Bases',
  'Encode',
  'Send',
  'Eve',
  'Measure',
  'Compare',
  'Sift',
  'Verify',
  'Key',
];

export function buildCinematicScenes(eveEnabled) {
  const scenes = [
    {
      id: 'message',
      timeline: 0,
      title: 'A secret message',
      what: 'Alice wants to send "HELLO" to Bob without an eavesdropper learning it.',
      why: 'Classical wires can be tapped; she needs a quantum link plus a way to notice intrusion.',
      result: 'The message becomes a stream of 0s and 1s — but not sent classically yet.',
    },
    {
      id: 'bases',
      timeline: 1,
      title: 'Random measurement bases',
      what: 'For each bit, Alice randomly chooses how she will encode: rectilinear (+) or diagonal (×).',
      why: 'Random bases are what let Alice and Bob later detect an eavesdropper statistically.',
      result: 'Each photon gets a basis label — encoding comes next.',
    },
    {
      id: 'encode',
      timeline: 2,
      title: 'Hide bits inside photons',
      what: 'Alice encodes each classical bit into a polarization state using that photon’s basis.',
      why: 'Each photon carries one bit in a quantum form Eve cannot copy perfectly.',
      result: 'Bit → basis → |0⟩, |1⟩, |+⟩, or |−⟩ (polarization arrow is a guide).',
    },
    {
      id: 'transmit',
      timeline: 3,
      title: 'Quantum channel',
      what: 'Photons travel one by one from Alice toward Bob.',
      why: 'This is the quantum link — separate from the public classical channel used later.',
      result: 'Individual photons remain identifiable as they move.',
    },
  ];

  if (eveEnabled) {
    scenes.push({
      id: 'eve',
      timeline: 4,
      title: 'Eve intercepts',
      what: 'Eve measures each photon in a random basis and sends a fresh photon to Bob.',
      why: 'She does not know Alice’s basis; wrong guesses disturb the state.',
      result: 'Alice → Eve → Bob replaces a direct quantum path.',
    });
  }

  scenes.push(
    {
      id: 'measure',
      timeline: eveEnabled ? 5 : 4,
      title: 'Bob measures',
      what: 'Bob picks a random basis per photon and records 0 or 1.',
      why: 'Matching Alice’s basis recovers her bit; mismatched bases look random (~50/50).',
      result: 'Outcomes come from the simulator — not scripted wrong answers.',
    },
    {
      id: 'compare',
      timeline: eveEnabled ? 6 : 5,
      title: 'Public basis talk',
      what: 'Alice and Bob broadcast their basis choices only — never the bits.',
      why: 'Eve can hear this classical chat but it does not reveal the key directly.',
      result: 'Matching columns highlight; mismatches dim.',
    },
    {
      id: 'sift',
      timeline: eveEnabled ? 7 : 6,
      title: 'Sifting the key',
      what: 'Mismatched bases are discarded; surviving bits align into a sifted string.',
      why: 'Only same-basis measurements can contribute to the shared key.',
      result: 'Photons that agree visually merge into the sifted key.',
    },
    {
      id: 'verify',
      timeline: eveEnabled ? 8 : 7,
      title: 'Detecting Eve',
      what: 'They sacrifice a random sample of sifted bits to estimate the error rate.',
      why: 'Extra errors suggest Eve (or noise) — statistical, not one-shot magic.',
      result: 'Sample mismatches glow when Eve was active.',
    },
    {
      id: 'finale',
      timeline: eveEnabled ? 9 : 8,
      title: 'Shared secret',
      what: 'Alice and Bob hold the same remaining bits — a key born from quantum photons.',
      why: 'Quantum disturbance lets them reject compromised runs in real BB84.',
      result: 'HELLO’s journey ends in a shared key Eve does not possess.',
    }
  );

  return scenes;
}

export function sceneForwardLabel(scene, nextScene) {
  if (!nextScene) return 'Finish';
  if (scene?.id === 'transmit' && nextScene.id === 'eve') return 'Eve intercepts →';
  if (scene?.id === 'transmit' && nextScene.id === 'measure') return 'Measure at Bob →';
  const labels = {
    message: 'Pick random bases →',
    bases: 'Encode polarization →',
    encode: 'Send on quantum channel →',
    eve: 'Continue to Bob →',
    measure: 'Measure at Bob →',
    compare: 'Compare bases →',
    sift: 'Sift the key →',
    verify: 'Check for Eve →',
    finale: 'See shared key →',
  };
  return labels[scene?.id] ?? 'Next →';
}
