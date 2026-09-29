from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector, Pauli
from qiskit_aer import AerSimulator
import numpy as np

app = FastAPI()

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

simulator = AerSimulator()

class GateInput(BaseModel):
    type: str
    qubit: Optional[int] = None
    control: Optional[int] = None
    target: Optional[int] = None

class CircuitInput(BaseModel):
    gates: List[GateInput]
    num_qubits: Optional[int] = None

@app.post("/simulate")
def simulate(circuit_input: CircuitInput):
    # Determine number of qubits if not provided
    num_qubits = circuit_input.num_qubits
    if num_qubits is None:
        max_q = -1
        for gate in circuit_input.gates:
            if gate.qubit is not None and gate.qubit > max_q:
                max_q = gate.qubit
            if gate.control is not None and gate.control > max_q:
                max_q = gate.control
            if gate.target is not None and gate.target > max_q:
                max_q = gate.target
        num_qubits = max(2, max_q + 1) # Default to at least 2 qubits
        
    qc = QuantumCircuit(num_qubits)
    
    # Apply gates
    for gate in circuit_input.gates:
        gtype = gate.type.lower()
        if gtype == "h":
            qc.h(gate.qubit)
        elif gtype == "x":
            qc.x(gate.qubit)
        elif gtype == "y":
            qc.y(gate.qubit)
        elif gtype == "z":
            qc.z(gate.qubit)
        elif gtype == "s":
            qc.s(gate.qubit)
        elif gtype == "t":
            qc.t(gate.qubit)
        elif gtype in ["cx", "cnot"]:
            qc.cx(gate.control, gate.target)
        elif gtype == "swap":
            qc.swap(gate.control, gate.target)
            
    # Save statevector to get amplitudes
    qc.save_statevector()
    
    # Run the circuit on Qiskit Aer
    result = simulator.run(qc).result()
    statevector = result.get_statevector()
    
    # We want amplitudes (complex numbers -> dict of real/imag) and probabilities
    amplitudes = []
    probabilities = []
    
    state_array = np.array(statevector)
    probs = np.abs(state_array)**2
    
    # Ensure formatting string correctly handles number of qubits
    format_str = f"0{num_qubits}b"
    
    for i, amp in enumerate(state_array):
        amplitudes.append({
            "state": format(i, format_str),
            "real": float(amp.real),
            "imag": float(amp.imag)
        })
        probabilities.append({
            "state": format(i, format_str),
            "probability": float(probs[i])
        })
        
    # Compute Bloch vectors for each qubit using expectation values
    sv_obj = Statevector(statevector)
    bloch_vectors = []
    for q in range(num_qubits):
        def pauli_str(op):
            # Pauli strings are right-to-left: index 0 is the rightmost character
            res = ['I'] * num_qubits
            res[num_qubits - 1 - q] = op
            return "".join(res)
            
        x = sv_obj.expectation_value(Pauli(pauli_str('X'))).real
        y = sv_obj.expectation_value(Pauli(pauli_str('Y'))).real
        z = sv_obj.expectation_value(Pauli(pauli_str('Z'))).real
        
        bloch_vectors.append({
            "qubit": q,
            "x": float(x),
            "y": float(y),
            "z": float(z)
        })
        
    # Step-by-step Math Trace
    state = Statevector.from_int(0, 2**num_qubits)
    math_steps = [{
        "step": 0,
        "gate": "Initial State |00⟩",
        "operator": None,
        "statevector": [{"re": float(c.real), "im": float(c.imag)} for c in np.asarray(state)]
    }]
    
    for i, g in enumerate(circuit_input.gates):
        step_qc = QuantumCircuit(num_qubits)
        if g.type == 'cx':
            step_qc.cx(g.control, g.target)
        elif g.type == 'swap':
            step_qc.swap(g.control, g.target)
        elif g.type == 'h':
            step_qc.h(g.qubit)
        elif g.type == 'x':
            step_qc.x(g.qubit)
        elif g.type == 'y':
            step_qc.y(g.qubit)
        elif g.type == 'z':
            step_qc.z(g.qubit)
        elif g.type == 's':
            step_qc.s(g.qubit)
        elif g.type == 't':
            step_qc.t(g.qubit)
            
        from qiskit.quantum_info import Operator
        op = Operator(step_qc)
        state = state.evolve(step_qc)
        
        gate_name = g.type.upper()
        if g.type in ['cx', 'swap']:
            gate_name += f" ({g.control}, {g.target})"
        else:
            gate_name += f" (q{g.qubit})"
            
        math_steps.append({
            "step": i + 1,
            "gate": gate_name,
            "operator": [[{"re": float(c.real), "im": float(c.imag)} for c in row] for row in op.data],
            "statevector": [{"re": float(c.real), "im": float(c.imag)} for c in np.asarray(state)]
        })
        
    return {
        "amplitudes": amplitudes,
        "probabilities": probabilities,
        "bloch_vectors": bloch_vectors,
        "math_steps": math_steps
    }
