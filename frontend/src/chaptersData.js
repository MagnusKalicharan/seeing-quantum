export const CHAPTERS = [
  {
    id: 1,
    title: "The Quantum Coin Flip",
    subtitle: "Superposition",
    content: "In classical physics, a coin is either heads (0) or tails (1). In quantum mechanics, a qubit can be in a superposition of both states simultaneously.\n\nDrag a **Hadamard (H) gate** onto Qubit 0. This puts the qubit into a perfect superposition. Notice how the probability distribution splits 50/50, and the Bloch sphere arrow points exactly along the equator."
  },
  {
    id: 2,
    title: "Spooky Action",
    subtitle: "Entanglement",
    content: "Entanglement links two qubits so that their fates are permanently connected, no matter how far apart they are.\n\nFirst, put Qubit 0 into superposition using an **H gate**. Then, apply a **CNOT (CX) gate** using Qubit 0 as the control and Qubit 1 as the target. You've just created a Bell State! Measuring one qubit instantly determines the state of the other. Notice the probabilities are only |00⟩ and |11⟩."
  },
  {
    id: 3,
    title: "Constructive Interference",
    subtitle: "Phase & Reversibility",
    content: "Quantum operations are completely reversible. If you apply an H gate to a qubit in superposition, what happens?\n\nPlace an **H gate** on Qubit 0. The state is 50/50. Now place a **second H gate** right after it on the same wire. The waves interfere constructively and destructively, completely reversing the superposition and returning the qubit to |0⟩ with 100% certainty!"
  },
  {
    id: 4,
    title: "The Phase Flip",
    subtitle: "Z and S Gates",
    content: "While X flips the probability of measuring 0 or 1, the Z and S gates rotate the qubit around the Z-axis, changing its *phase* without changing its classical probability.\n\nTry putting Qubit 0 in superposition with an H gate, then apply a **Z gate**. The probability remains exactly 50/50, but look at the Bloch sphere—the state vector has rotated to the opposite side! This phase difference is critical for quantum algorithms."
  }
];
