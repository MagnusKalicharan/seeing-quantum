/**
 * Exact state-vector Grover simulation (Qiskit bit order |q_{n-1}…q_0⟩).
 * Used by the interactive Grover lesson — not decorative approximations.
 */

const C = {
  add: (a, b) => ({ re: a.re + b.re, im: a.im + b.im }),
  sub: (a, b) => ({ re: a.re - b.re, im: a.im - b.im }),
  scale: (a, s) => ({ re: a.re * s, im: a.im * s }),
  mag2: (a) => a.re * a.re + a.im * a.im,
};

export function numStates(numQubits) {
  return 2 ** numQubits;
}

/** Basis label for index i (MSB = qubit n−1). */
export function indexToStateLabel(i, numQubits) {
  return i.toString(2).padStart(numQubits, '0');
}

export function createZeroState(numQubits) {
  const N = numStates(numQubits);
  return Array.from({ length: N }, (_, i) =>
    i === 0 ? { re: 1, im: 0 } : { re: 0, im: 0 }
  );
}

export function cloneState(state) {
  return state.map((c) => ({ re: c.re, im: c.im }));
}

export function applyHadamardOnQubit(state, qubit, _numQubits) {
  const N = state.length;
  const next = state.map(() => ({ re: 0, im: 0 }));
  const flip = 1 << qubit;
  const h = 1 / Math.sqrt(2);

  for (let i = 0; i < N; i++) {
    if ((i & flip) !== 0) continue;
    const j = i ^ flip;
    const a0 = state[i];
    const a1 = state[j];
    next[i] = C.add(C.scale(a0, h), C.scale(a1, h));
    next[j] = C.sub(C.scale(a0, h), C.scale(a1, h));
  }
  return next;
}

export function applyHadamardAll(state, numQubits) {
  let s = state;
  for (let q = 0; q < numQubits; q++) {
    s = applyHadamardOnQubit(s, q, numQubits);
  }
  return s;
}

export function applyOracle(state, targetIndex) {
  const next = cloneState(state);
  next[targetIndex] = C.scale(next[targetIndex], -1);
  return next;
}

/** Grover diffuser U_s = 2|s⟩⟨s| − I. */
export function applyDiffuser(state, numQubits) {
  const N = numStates(numQubits);
  let sum = { re: 0, im: 0 };
  for (const a of state) sum = C.add(sum, a);
  const coeff = 2 / N;
  return state.map((a) => C.sub(C.scale(sum, coeff), a));
}

export function amplitudesToTable(state, numQubits) {
  const N = state.length;
  return Array.from({ length: N }, (_, i) => {
    const c = state[i];
    const prob = C.mag2(c);
    return {
      index: i,
      state: indexToStateLabel(i, numQubits),
      re: c.re,
      im: c.im,
      probability: prob,
    };
  });
}

export function meanAmplitudeReal(state) {
  let sumRe = 0;
  for (const a of state) sumRe += a.re;
  return sumRe / state.length;
}

/** Optimal iteration count ≈ ⌊π/4 · √N⌋ (at least 1 when N > 1). */
export function recommendedGroverIterations(numQubits) {
  const N = numStates(numQubits);
  if (N <= 2) return 1;
  return Math.max(1, Math.round((Math.PI / 4) * Math.sqrt(N)));
}

export function sampleMeasurement(state) {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < state.length; i++) {
    acc += C.mag2(state[i]);
    if (r <= acc) return i;
  }
  return state.length - 1;
}

/**
 * Build ordered lesson steps with full state after each operation.
 */
export function buildGroverTimeline(numQubits, targetIndex, options = {}) {
  const { beginner = true } = options;
  const N = numStates(numQubits);
  const targetLabel = indexToStateLabel(targetIndex, numQubits);
  const iterations = recommendedGroverIterations(numQubits);
  const steps = [];
  const pct = (p) => `${(p * 100).toFixed(0)}%`;

  const push = (step) => {
    const table = amplitudesToTable(step.stateVector, numQubits);
    steps.push({
      ...step,
      numQubits,
      targetIndex,
      targetLabel,
      amplitudes: table,
      probabilities: table.map(({ state, probability }) => ({ state, probability })),
      targetProbability: table[targetIndex].probability,
    });
  };

  let sv = createZeroState(numQubits);

  const stateList =
    N <= 8
      ? Array.from({ length: N }, (_, i) => indexToStateLabel(i, numQubits)).join(', ')
      : `${N} states`;

  push({
    id: 'problem',
    type: 'problem',
    iteration: null,
    highlightOp: 'none',
    title: beginner ? 'Find the marked item' : 'The search problem',
    what: beginner
      ? `One of these states is the answer — we do not know which yet (except the oracle will use ${targetLabel}).`
      : `We have ${N} equally likely labels (a ${numQubits}-qubit register). One hidden target ${targetLabel} must be found.`,
    why: beginner
      ? 'Grover search checks all labels at once instead of guessing one by one.'
      : 'Classically you might need O(N) queries in the worst case. Grover uses amplitude amplification to do better.',
    changed: beginner
      ? 'The register starts in |0…0⟩; the marked state is highlighted for you.'
      : 'Nothing quantum yet — we start in the ground state.',
    math: `|\\psi\\rangle = ${ketLabel(numQubits, '0')}`,
    stateVector: cloneState(sv),
    beginnerTitle: 'Find the marked item',
    beginnerWhat: `These are the ${N} possibilities: ${stateList}. Exactly one is the target.`,
    beginnerWhy: 'Classical search might try them one at a time; quantum search prepares all of them together.',
    beginnerChanged: 'Nothing has run yet — look for the highlighted answer state.',
  });

  if (!beginner) {
    push({
      id: 'init',
      type: 'init',
      iteration: null,
      highlightOp: 'none',
      title: 'Initialize the register',
      what: 'All qubits are prepared in |0⟩ before any Grover operation.',
      why: 'Grover assumes a known starting state so the first step can create uniform superposition.',
      changed: 'State is still deterministic; measurement would always yield all zeros.',
      math: `|\\psi\\rangle = ${ketLabel(numQubits, '0')}`,
      stateVector: cloneState(sv),
    });
  }

  sv = applyHadamardAll(sv, numQubits);
  const uniformAmp = 1 / Math.sqrt(N);
  const uniformProb = 1 / N;
  push({
    id: 'hadamard',
    type: 'hadamard',
    iteration: null,
    highlightOp: 'H',
    title: beginner ? 'Put everything into superposition' : 'Equal superposition (Hadamard layer)',
    what: beginner
      ? 'Hadamard gates mix all states so each has the same chance.'
      : `Apply $H^{\\otimes ${numQubits}}$ so every basis state shares the same amplitude ${uniformAmp.toFixed(3)}.`,
    why: beginner
      ? 'The oracle needs every label “in play” at the same time.'
      : 'The algorithm needs all candidates present at once so the oracle can mark the target in parallel.',
    changed: beginner
      ? `Each bar should read ${pct(uniformProb)} — equal chance for every state.`
      : 'Amplitudes equalized; each probability is 1/N.',
    math: `|\\psi\\rangle = \\frac{1}{\\sqrt{${N}}}\\sum_{x=0}^{${N - 1}} |x\\rangle`,
    stateVector: cloneState(sv),
    beginnerWhat: 'Now every state has an equal chance of being the answer.',
    beginnerWhy: 'This is superposition: all options exist in the same quantum register.',
    beginnerChanged: `Each probability is ${pct(uniformProb)}.`,
  });

  for (let k = 0; k < iterations; k++) {
    const beforeOracle = cloneState(sv);
    sv = applyOracle(sv, targetIndex);
    const probBeforeOracle = C.mag2(beforeOracle[targetIndex]);
    push({
      id: `oracle-${k}`,
      type: 'oracle',
      iteration: k,
      highlightOp: 'O',
      title: beginner ? 'Mark the answer (Oracle)' : `Oracle — iteration ${k + 1}`,
      what: beginner
        ? `The oracle marks ${targetLabel} by flipping the sign of its amplitude.`
        : `Phase-flip the target ${targetLabel}: amplitude becomes negative, others unchanged.`,
      why: beginner
        ? 'It still does not tell you the answer out loud — it only tags the target for later interference.'
        : 'The oracle does NOT measure or “find” the answer — it only marks the target with a −1 phase.',
      changed: beginner
        ? 'Probabilities stay equal; only the target’s amplitude turns negative (Explore view).'
        : 'Probabilities unchanged (|−α|² = |α|²); phases differ — setup for interference.',
      math: `U_\\omega = I - 2|\\omega\\rangle\\langle\\omega|,\\quad \\omega = ${targetLabel}`,
      stateVector: cloneState(sv),
      beforeOracle,
      beginnerWhat: 'The oracle knows the target and flips its phase (a hidden mark).',
      beginnerWhy: 'This is not measurement — the answer is not revealed yet.',
      beginnerChanged: `Chance for ${targetLabel} is still ${pct(probBeforeOracle)}; the mark is in the phase.`,
    });

    const meanBefore = meanAmplitudeReal(sv);
    const beforeDiffuser = cloneState(sv);
    sv = applyDiffuser(sv, numQubits);
    const targetProbAfter = C.mag2(sv[targetIndex]);
    push({
      id: `diffuser-${k}`,
      type: 'diffuser',
      iteration: k,
      highlightOp: 'D',
      title: beginner ? 'Make the marked state bigger' : `Diffusion (inversion about the mean) — iteration ${k + 1}`,
      what: beginner
        ? 'Diffusion boosts the target’s amplitude and pushes the others down.'
        : `Reflect every amplitude about the mean $\\bar\\alpha \\approx ${meanBefore.toFixed(4)}$. Target grows, others shrink.`,
      why: beginner
        ? 'Together with the oracle, this is amplitude amplification.'
        : 'Combining oracle + diffuser rotates the state toward |ω⟩ — amplitude amplification.',
      changed: beginner
        ? `Target ${targetLabel} is now about ${pct(targetProbAfter)} likely.`
        : `Target probability is now ${(targetProbAfter * 100).toFixed(1)}%.`,
      math: `\\alpha_i' = 2\\bar\\alpha - \\alpha_i,\\quad U_s = 2|s\\rangle\\langle s| - I`,
      stateVector: cloneState(sv),
      meanAmplitude: meanBefore,
      beforeDiffuser,
      beginnerWhat: 'The diffusion operator increases the target’s amplitude and reduces the others.',
      beginnerWhy: 'This is the step where the marked state actually becomes more likely.',
      beginnerChanged: `Watch ${targetLabel} grow in the chart — now ${pct(targetProbAfter)}.`,
    });
  }

  if (!beginner) {
    push({
      id: 'speedup',
      type: 'speedup',
      iteration: null,
      highlightOp: 'none',
      title: 'Why √N iterations?',
      what: `Each Grover round rotates by about $2\\theta$ where $\\sin\\theta = 1/\\sqrt{${N}}$. After ${iterations} rounds we are near |ω⟩.`,
      why: 'Classical search is O(N); Grover gives O(√N) — quadratic speedup for unstructured search.',
      changed: 'You can step back to compare distributions after each round.',
      math: `k \\approx \\frac{\\pi}{4}\\sqrt{N} \\approx ${iterations}`,
      stateVector: cloneState(sv),
    });
  }

  const finalTargetProb = C.mag2(sv[targetIndex]);
  push({
    id: 'measure',
    type: 'measure',
    iteration: null,
    highlightOp: 'M',
    title: beginner ? 'Get the answer' : 'Measurement',
    what: beginner
      ? 'Measurement picks one state, weighted by these probabilities.'
      : 'Measuring collapses the superposition: outcome x appears with probability |α_x|².',
    why: beginner
      ? 'That is how we turn quantum amplitudes into a classical search result.'
      : 'This is how quantum search returns a classical index — one shot samples the amplified target.',
    changed: beginner
      ? `${targetLabel} should be the most likely outcome (${pct(finalTargetProb)}).`
      : 'Press Measure to sample from the current distribution (or use the peak if near-certain).',
    math: `P(x) = |\\langle x|\\psi\\rangle|^2`,
    stateVector: cloneState(sv),
    beginnerWhat: 'Measurement converts the quantum state into one classical answer.',
    beginnerWhy: 'You read the register once; the target should appear most often.',
    beginnerChanged: `Ready to measure — target chance ${pct(finalTargetProb)}.`,
  });

  return { steps, iterations, N, targetLabel };
}

function ketLabel(n, bits) {
  if (typeof bits === 'string' && bits.length === n) {
    return `|${bits}\\rangle`;
  }
  return `|${'0'.repeat(n)}\\rangle`;
}
