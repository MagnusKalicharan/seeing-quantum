/**
 * Client-side Quantum Statevector Simulator Fallback
 * Simulates 2-qubit quantum circuits entirely in the browser
 * Matches Qiskit conventions and backend/main.py data structures.
 */

// Complex number utilities: { re, im }
const C = {
  add: (a, b) => ({ re: a.re + b.re, im: a.im + b.im }),
  sub: (a, b) => ({ re: a.re - b.re, im: a.im - b.im }),
  mul: (a, b) => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  }),
  mag2: (a) => a.re * a.re + a.im * a.im
};

const INV_SQRT2 = 1 / Math.SQRT2;

// 1-qubit gate matrices (2x2 complex)
const SINGLE_QUBIT_GATES = {
  h: [
    [{ re: INV_SQRT2, im: 0 }, { re: INV_SQRT2, im: 0 }],
    [{ re: INV_SQRT2, im: 0 }, { re: -INV_SQRT2, im: 0 }]
  ],
  x: [
    [{ re: 0, im: 0 }, { re: 1, im: 0 }],
    [{ re: 1, im: 0 }, { re: 0, im: 0 }]
  ],
  y: [
    [{ re: 0, im: 0 }, { re: 0, im: -1 }],
    [{ re: 0, im: 1 }, { re: 0, im: 0 }]
  ],
  z: [
    [{ re: 1, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: -1, im: 0 }]
  ],
  s: [
    [{ re: 1, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: 0, im: 1 }]
  ],
  t: [
    [{ re: 1, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: INV_SQRT2, im: INV_SQRT2 }]
  ]
};

// Kronecker tensor product of two 2x2 complex matrices -> 4x4
function tensor2x2(A, B) {
  const res = Array.from({ length: 4 }, () => Array(4).fill(null));
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      for (let k = 0; k < 2; k++) {
        for (let l = 0; l < 2; l++) {
          res[i * 2 + k][j * 2 + l] = C.mul(A[i][j], B[k][l]);
        }
      }
    }
  }
  return res;
}

const IDENTITY = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 1, im: 0 }]
];

// Matrix multiplication 4x4 on 4x1 vector
function applyMatrix(M, sv) {
  const out = [];
  for (let r = 0; r < 4; r++) {
    let sum = { re: 0, im: 0 };
    for (let c = 0; c < 4; c++) {
      sum = C.add(sum, C.mul(M[r][c], sv[c]));
    }
    out.push(sum);
  }
  return out;
}

// Build 4x4 unitary operator for a gate on 2 qubits
function build4x4Operator(gate) {
  const type = (gate.type || '').toLowerCase();

  if (type === 'cx' || type === 'cnot') {
    const ctrl = gate.control ?? 0;
    const tgt = gate.target ?? 1;
    // Standard 4x4 CX matrix in basis |00>, |01>, |10>, |11> (bit 1 is q1, bit 0 is q0)
    const M = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => ({ re: 0, im: 0 }))
    );
    for (let i = 0; i < 4; i++) {
      const q0 = i & 1;
      const q1 = (i >> 1) & 1;
      let newQ0 = q0;
      let newQ1 = q1;
      if (ctrl === 0 && q0 === 1) {
        newQ1 = 1 - q1; // flip q1
      } else if (ctrl === 1 && q1 === 1) {
        newQ0 = 1 - q0; // flip q0
      }
      const outIdx = (newQ1 << 1) | newQ0;
      M[outIdx][i] = { re: 1, im: 0 };
    }
    return M;
  }

  if (type === 'swap') {
    // |00>->|00>, |01>->|10>, |10>->|01>, |11>->|11>
    return [
      [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
      [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }],
      [{ re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
      [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }]
    ];
  }

  // Single qubit gate:
  const U = SINGLE_QUBIT_GATES[type] || IDENTITY;
  const q = gate.qubit ?? 0;
  // If q == 0: Op = I (for q1) ⊗ U (for q0)
  // If q == 1: Op = U (for q1) ⊗ I (for q0)
  if (q === 0) {
    return tensor2x2(IDENTITY, U);
  } else {
    return tensor2x2(U, IDENTITY);
  }
}

// Compute expectation value <ψ| P |ψ>
function expectationValue(P, sv) {
  const P_sv = applyMatrix(P, sv);
  let expRe = 0;
  for (let i = 0; i < 4; i++) {
    // sv[i]* · P_sv[i]
    // (a - ib)(c + id) = (ac + bd) + i(ad - bc)
    expRe += sv[i].re * P_sv[i].re + sv[i].im * P_sv[i].im;
  }
  return expRe;
}

export function simulateClientSide(gates) {
  const num_qubits = 2;
  // Initial state |00>
  let sv = [
    { re: 1, im: 0 },
    { re: 0, im: 0 },
    { re: 0, im: 0 },
    { re: 0, im: 0 }
  ];

  const math_steps = [
    {
      step: 0,
      gate: 'Initial State |00⟩', // parsed by QuantumText in UI
      operator: null,
      statevector: sv.map(c => ({ re: c.re, im: c.im }))
    }
  ];

  gates.forEach((g, idx) => {
    const op = build4x4Operator(g);
    sv = applyMatrix(op, sv);

    let gateName = (g.type || '').toUpperCase();
    if (g.type === 'cx' || g.type === 'swap') {
      gateName += ` (${g.control ?? 0}, ${g.target ?? 1})`;
    } else {
      gateName += ` (q${g.qubit ?? 0})`;
    }

    math_steps.push({
      step: idx + 1,
      gate: gateName,
      operator: op.map(row => row.map(cell => ({ re: cell.re, im: cell.im }))),
      statevector: sv.map(c => ({ re: c.re, im: c.im }))
    });
  });

  const amplitudes = [];
  const probabilities = [];

  for (let i = 0; i < 4; i++) {
    const bitStr = (i >> 1).toString() + (i & 1).toString(); // "00", "01", "10", "11"
    const prob = C.mag2(sv[i]);
    amplitudes.push({
      state: bitStr,
      real: sv[i].re,
      imag: sv[i].im
    });
    probabilities.push({
      state: bitStr,
      probability: prob
    });
  }

  // Bloch vectors for q0 and q1
  // Pauli operators 2x2
  const px = SINGLE_QUBIT_GATES.x;
  const py = SINGLE_QUBIT_GATES.y;
  const pz = SINGLE_QUBIT_GATES.z;

  const X0 = tensor2x2(IDENTITY, px);
  const Y0 = tensor2x2(IDENTITY, py);
  const Z0 = tensor2x2(IDENTITY, pz);

  const X1 = tensor2x2(px, IDENTITY);
  const Y1 = tensor2x2(py, IDENTITY);
  const Z1 = tensor2x2(pz, IDENTITY);

  const bloch_vectors = [
    {
      qubit: 0,
      x: expectationValue(X0, sv),
      y: expectationValue(Y0, sv),
      z: expectationValue(Z0, sv)
    },
    {
      qubit: 1,
      x: expectationValue(X1, sv),
      y: expectationValue(Y1, sv),
      z: expectationValue(Z1, sv)
    }
  ];

  return {
    amplitudes,
    probabilities,
    bloch_vectors,
    math_steps
  };
}
