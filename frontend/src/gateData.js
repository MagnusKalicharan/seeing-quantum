export const GATE_METADATA = {
  'H': { 
    name: 'Hadamard Gate', 
    desc: 'Creates a superposition. Maps basis states to equal superpositions.', 
    matrix: [
      [{ mag: 0.707, phase: 0 }, { mag: 0.707, phase: 0 }],
      [{ mag: 0.707, phase: 0 }, { mag: 0.707, phase: 180 }]
    ],
    labels: ['transforms |0⟩ into |+⟩', 'transforms |1⟩ into |-⟩'],
    rotation: '180° around X+Z',
    globalPhase: null
  },
  'X': { 
    name: 'Pauli X Gate', 
    desc: 'The NOT gate. Toggles between |0⟩ and |1⟩.', 
    matrix: [
      [{ mag: 0, phase: 0 }, { mag: 1, phase: 0 }],
      [{ mag: 1, phase: 0 }, { mag: 0, phase: 0 }]
    ],
    labels: ['transforms |0⟩ into |1⟩', 'transforms |1⟩ into |0⟩'],
    rotation: '180° around X',
    globalPhase: null
  },
  'Y': { 
    name: 'Pauli Y Gate', 
    desc: 'Rotates around Y axis. Maps |0⟩ to i|1⟩ and |1⟩ to -i|0⟩.', 
    matrix: [
      [{ mag: 0, phase: 0 }, { mag: 1, phase: 270 }], // -i
      [{ mag: 1, phase: 90 }, { mag: 0, phase: 0 }]  // i
    ],
    labels: ['transforms |0⟩ into i|1⟩', 'transforms |1⟩ into -i|0⟩'],
    rotation: '180° around Y',
    globalPhase: 'exp(90°i)'
  },
  'Z': { 
    name: 'Pauli Z Gate', 
    desc: 'The phase flip gate. Negates phases when the qubit is ON.', 
    matrix: [
      [{ mag: 1, phase: 0 }, { mag: 0, phase: 0 }],
      [{ mag: 0, phase: 0 }, { mag: 1, phase: 180 }] // -1
    ],
    labels: ["doesn't affect |0⟩", 'phases |1⟩ by 180°'],
    rotation: '180° around Z',
    globalPhase: 'exp(90°i)'
  },
  'S': { 
    name: 'S Gate', 
    desc: 'Quarter turn phase gate. Applies a 90° phase to |1⟩.', 
    matrix: [
      [{ mag: 1, phase: 0 }, { mag: 0, phase: 0 }],
      [{ mag: 0, phase: 0 }, { mag: 1, phase: 90 }] // i
    ],
    labels: ["doesn't affect |0⟩", 'phases |1⟩ by 90°'],
    rotation: '90° around Z',
    globalPhase: 'exp(45°i)'
  },
  'T': { 
    name: 'T Gate', 
    desc: 'Eighth turn phase gate. Applies a 45° phase to |1⟩.', 
    matrix: [
      [{ mag: 1, phase: 0 }, { mag: 0, phase: 0 }],
      [{ mag: 0, phase: 0 }, { mag: 1, phase: 45 }] // e^(i pi/4)
    ],
    labels: ["doesn't affect |0⟩", 'phases |1⟩ by 45°'],
    rotation: '45° around Z',
    globalPhase: 'exp(22.5°i)'
  },
  'CX': { 
    name: 'Controlled-NOT (CNOT)', 
    desc: 'Flips the target qubit if the control qubit is ON.', 
    matrix: null, // multi-qubit
    labels: [],
    rotation: 'Entangling gate',
    globalPhase: null
  },
  'SWAP': { 
    name: 'SWAP Gate', 
    desc: 'Swaps the states of two qubits.', 
    matrix: null, // multi-qubit
    labels: [],
    rotation: 'Entangling gate',
    globalPhase: null
  }
};
