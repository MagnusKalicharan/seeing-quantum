/**
 * Quantum AI Tutor Client Connector
 * Bridges the React frontend with the Ollama + RAG backend,
 * provides live circuit serialization, and handles challenge verification.
 */

import { simulateClientSide } from './clientSimulator';
import { basisKetPlain } from './quantumNotation';
import { API_BASE } from './apiConfig';

export const TUTOR_TOPICS = [
  { id: 'superposition', title: 'Superposition & Hadamard', icon: '🌀', prompt: 'Explain quantum superposition and how the Hadamard (H) gate works.' },
  { id: 'entanglement', title: 'Bell State & Entanglement', icon: '🔗', prompt: 'How does entanglement work in a Bell State circuit (H + CX)?' },
  { id: 'bloch', title: 'Bloch Sphere & Rotations', icon: '🌐', prompt: 'How do I read a Bloch Sphere and what do the X, Y, Z axes mean?' },
  { id: 'phase', title: 'Quantum Phase (Z, S, T)', icon: '📐', prompt: 'What is quantum phase and what is the difference between Z, S, and T gates?' },
  { id: 'measurement', title: 'Measurement & Probabilities', icon: '🎯', prompt: 'How does quantum measurement collapse statevectors into probabilities?' },
  { id: 'cnot', title: 'CNOT & Two-Qubit Gates', icon: '🔀', prompt: 'How does the CNOT (CX) gate create conditional quantum logic?' }
];

export const TUTOR_CHALLENGES = [
  {
    id: 'bell_state',
    title: 'Create a Bell State',
    goal: 'Build |Φ+⟩ = (|00⟩ + |11⟩)/√2 with equal 50% chance of |00⟩ and |11⟩',
    hint: 'Apply H on qubit 0, then a CNOT with control: q0, target: q1.',
    verify: (gates, sim) => {
      if (!sim || !sim.probabilities) return { passed: false, message: 'Circuit not yet simulated.' };
      const p00 = sim.probabilities.find(p => p.state === '00')?.probability || 0;
      const p11 = sim.probabilities.find(p => p.state === '11')?.probability || 0;
      const p01 = sim.probabilities.find(p => p.state === '01')?.probability || 0;
      const p10 = sim.probabilities.find(p => p.state === '10')?.probability || 0;
      if (Math.abs(p00 - 0.5) < 0.05 && Math.abs(p11 - 0.5) < 0.05 && p01 < 0.01 && p10 < 0.01) {
        return { passed: true, message: '🎉 Excellent! You successfully created the maximally entangled Bell pair |Φ+⟩!' };
      }
      return { passed: false, message: `Current probabilities: |00⟩=${(p00*100).toFixed(1)}%, |11⟩=${(p11*100).toFixed(1)}%. Try H(q0) then CX(q0 -> q1).` };
    }
  },
  {
    id: 'flip_qubit',
    title: 'Bit flip on qubit 0',
    goal: 'Flip qubit 0 to |1⟩ while qubit 1 stays |0⟩ (basis label |q₁q₀⟩ = |01⟩)',
    hint: 'Apply an X (Pauli-X) gate on qubit 0 (top wire).',
    verify: (gates, sim) => {
      if (!sim || !sim.probabilities) return { passed: false, message: 'Run the circuit to verify.' };
      const p01 = sim.probabilities.find(p => p.state === '01')?.probability || 0;
      const p10 = sim.probabilities.find(p => p.state === '10')?.probability || 0;
      const p00 = sim.probabilities.find(p => p.state === '00')?.probability || 0;
      const p11 = sim.probabilities.find(p => p.state === '11')?.probability || 0;
      // States use Qiskit / little-endian bit order: |q₁q₀⟩.
      if (p01 > 0.95 && p10 < 0.05 && p00 < 0.05 && p11 < 0.05) {
        return { passed: true, message: `🎉 Perfect! The state is ${basisKetPlain('01')} — qubit 0 is |1⟩ and qubit 1 is |0⟩.` };
      }
      if (p10 > 0.95) {
        return { passed: false, message: `You have ${basisKetPlain('10')} (X on qubit 1). Apply X on qubit 0 (top wire) for ${basisKetPlain('01')}.` };
      }
      return { passed: false, message: `Target ${basisKetPlain('01')}. Place an X gate on qubit 0 (top wire).` };
    }
  },
  {
    id: 'superposition_equal',
    title: '4-State Equal Superposition',
    goal: 'Create an equal 25% superposition across all states |00⟩, |01⟩, |10⟩, |11⟩',
    hint: 'Apply a Hadamard gate (H) on both qubit 0 and qubit 1.',
    verify: (gates, sim) => {
      if (!sim || !sim.probabilities) return { passed: false, message: 'Simulate to verify.' };
      const isAll25 = sim.probabilities.every(p => Math.abs(p.probability - 0.25) < 0.05);
      if (isAll25) {
        return { passed: true, message: '🎉 Awesome! You created |++⟩, an equal superposition of all 4 computational basis states!' };
      }
      return { passed: false, message: 'Try placing an H gate on wire 0 and another H gate on wire 1.' };
    }
  }
];

/**
 * Format circuit state summary for the tutor prompt context
 */
export function analyzeCircuit(gates) {
  if (!gates || gates.length === 0) {
    return {
      gateCount: 0,
      hasEntanglement: false,
      hasSuperposition: false,
      activeState: basisKetPlain('00'),
      probabilities: [
        { state: '00', probability: 1 },
        { state: '01', probability: 0 },
        { state: '10', probability: 0 },
        { state: '11', probability: 0 }
      ]
    };
  }

  const sim = simulateClientSide(gates);
  let stateStr = '';
  if (sim.amplitudes) {
    const activeStates = sim.amplitudes
      .filter(a => (a.real * a.real + a.imag * a.imag) > 0.001)
      .map(a => {
        let amp = '';
        const r = a.real.toFixed(2);
        const im = a.imag.toFixed(2);
        if (Math.abs(a.imag) < 0.01) amp = `${r}`;
        else if (Math.abs(a.real) < 0.01) amp = `${im}i`;
        else amp = `(${r} + ${im}i)`;
        return `${amp}${basisKetPlain(a.state)}`;
      });
    stateStr = activeStates.join(' + ');
  }

  return {
    gateCount: gates.length,
    activeState: stateStr || basisKetPlain('00'),
    probabilities: sim.probabilities,
    bloch: sim.bloch_vectors,
    mathSteps: sim.math_steps
  };
}

/**
 * Check if local Ollama backend service is running and fetch models
 */
export async function checkOllamaBackend() {
  try {
    const res = await fetch(`${API_BASE}/ollama/status`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // Backend offline
  }
  return { available: false, models: [] };
}

/**
 * Ask Ollama via Backend API with circuit context & RAG book excerpts
 */
export async function queryOllamaTutor(userInput, currentGates = [], model = 'llama3', history = []) {
  const analysis = analyzeCircuit(currentGates);
  
  try {
    const res = await fetch(`${API_BASE}/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userInput,
        circuit_context: {
          gates: currentGates,
          activeState: analysis.activeState,
          probabilities: analysis.probabilities
        },
        model: model,
        history: history
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) {
        return {
          text: data.reply,
          source: 'ollama',
          model: data.model || model,
          sourcesUsed: data.sources_used || [],
          suggestions: ['Explain my current circuit', 'How does the Hadamard gate work?', 'What is a Bell State?']
        };
      } else if (data.error) {
        return {
          text: `⚠️ **Ollama Error:** ${data.error}\n\n*Check if model \`${model}\` is downloaded in Ollama (\`ollama list\`).*`,
          source: 'error',
          suggestions: ['Explain my current circuit', 'How does Hadamard (H) work?']
        };
      }
    }
  } catch (e) {
    console.warn('Ollama tutor backend call failed, using graceful message:', e);
  }

  // Graceful response when backend is disconnected
  return {
    text: `⚠️ **Backend / Ollama is not connected**\n\nTo chat with the AI model:\n1. Start Ollama: \`ollama run llama3\`\n2. Start backend server: \`python backend/main.py\`\n\n*In the meantime, you can explore the **Core Concepts**, **Interactive Challenges**, or **Live Circuit State** tabs above!*`,
    source: 'offline',
    suggestions: ['How does Hadamard (H) work?', 'What is Entanglement?', 'Give me a challenge']
  };
}

