/** Lesson step metadata for BB84 UI. */

export function buildBB84Steps(eveEnabled) {
  const core = [
    {
      id: 'alice_bits',
      type: 'alice_bits',
      title: 'Alice picks random bits',
      what: 'Alice chooses a secret string of 0s and 1s at random.',
      why: 'The key must be unpredictable to anyone listening.',
      channel: 'none',
    },
    {
      id: 'alice_bases',
      type: 'alice_bases',
      title: 'Alice picks random bases',
      what: 'For each bit she randomly picks + (rectilinear) or × (diagonal).',
      why: '+ uses |0⟩/|1⟩; × uses |+⟩/|−⟩ — mixing them is what makes BB84 work.',
      channel: 'none',
    },
    {
      id: 'encode',
      type: 'encode',
      title: 'Alice encodes qubits',
      what: 'Each bit becomes a qubit in the chosen basis.',
      why: 'The quantum states travel on the quantum channel — not classical bits.',
      channel: 'quantum',
    },
    {
      id: 'transmit',
      type: 'transmit',
      title: 'Qubits travel to Bob',
      what: 'Photons/qubits move along the quantum link from Alice to Bob.',
      why: 'This is the only quantum part of the story; Eve can tap here.',
      channel: 'quantum',
    },
  ];

  if (eveEnabled) {
    core.push({
      id: 'eve',
      type: 'eve',
      title: 'Eve intercepts (optional attack)',
      what: 'Eve measures each qubit in a random basis and sends a new qubit to Bob.',
      why: 'She never learns Alice’s bases; wrong-basis measurements randomize her resend.',
      channel: 'quantum',
    });
  }

  core.push(
    {
      id: 'bob_bases',
      type: 'bob_bases',
      title: 'Bob picks random bases',
      what: 'Bob independently chooses + or × for each incoming qubit — he does not know Alice’s choices.',
      why: 'Only later will they compare bases on the public channel.',
      channel: 'none',
    },
    {
      id: 'bob_measure',
      type: 'bob_measure',
      title: 'Bob measures',
      what: 'Bob gets a classical 0/1 from each measurement.',
      why: 'Matching bases → same bit as Alice (no Eve). Different bases → random 50/50 outcomes.',
      channel: 'quantum',
    },
    {
      id: 'public_bases',
      type: 'public_bases',
      title: 'Public basis comparison',
      what: 'Alice and Bob broadcast their basis choices — not the bit values.',
      why: 'This classical step is public; eavesdroppers can hear it, but it reveals no key bits directly.',
      channel: 'classical',
    },
    {
      id: 'sift',
      type: 'sift',
      title: 'Sifting',
      what: 'They discard positions where bases differ and keep the rest.',
      why: 'On matching bases, Bob’s results should match Alice’s bits (low noise without Eve).',
      channel: 'classical',
    },
    {
      id: 'error_check',
      type: 'error_check',
      title: 'Error-rate check',
      what: 'They compare a random sample of sifted bits publicly and count mismatches.',
      why: 'Extra errors suggest Eve (or noise). Those sample bits are sacrificed.',
      channel: 'classical',
    },
    {
      id: 'final_key',
      type: 'final_key',
      title: 'Shared secret key',
      what: 'Remaining sifted bits (minus the test sample) form the shared key.',
      why: 'If the error rate is low enough, Alice and Bob keep the key; Eve lacks full information.',
      channel: 'classical',
    }
  );

  return core;
}

export function forwardLabel(step, nextStep) {
  if (!nextStep) return null;
  const map = {
    alice_bases: 'Choose bases →',
    encode: 'Encode qubits →',
    transmit: 'Send qubits →',
    eve: 'Continue to Bob →',
    bob_bases: 'Bob chooses bases →',
    bob_measure: 'Measure qubits →',
    public_bases: 'Compare bases publicly →',
    sift: 'Sift the key →',
    error_check: 'Check error rate →',
    final_key: 'Finish →',
  };
  return map[step?.type] ?? 'Next step →';
}

export function forwardHint(nextStep) {
  if (!nextStep) return '';
  switch (nextStep.type) {
    case 'alice_bases':
      return 'Alice will assign + or × to each bit.';
    case 'encode':
      return 'Watch each bit become |0⟩, |1⟩, |+⟩, or |−⟩.';
    case 'transmit':
      return 'Qubits animate along the quantum channel.';
    case 'eve':
      return 'See how Eve disturbs states when she guesses wrong.';
    case 'bob_bases':
      return 'Bob’s bases are independent of Alice’s.';
    case 'bob_measure':
      return 'Compare same vs different basis outcomes.';
    case 'public_bases':
      return 'Only basis symbols go on the classical public line.';
    case 'sift':
      return 'Mismatched columns will drop away.';
    case 'error_check':
      return 'Sampled bits are revealed to estimate Eve’s presence.';
    case 'final_key':
      return 'See the shared key both parties hold.';
    default:
      return '';
  }
}
