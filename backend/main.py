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

from rag_engine import QuantumKnowledgeBase

knowledge_base = QuantumKnowledgeBase()

class TutorRequest(BaseModel):
    message: str
    circuit_context: Optional[dict] = None
    model: Optional[str] = "llama3" # e.g. llama3, mistral, phi3, gemma, qwen
    history: Optional[List[dict]] = []

@app.get("/books")
async def list_books():
    """List loaded quantum books/materials and reload if changed."""
    knowledge_base.load_books()
    return {
        "books": knowledge_base.get_books_list(),
        "total_chunks": len(knowledge_base.documents)
    }

@app.get("/ollama/status")
async def check_ollama_status():
    """Check if local Ollama daemon is running and get available models."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get("http://localhost:11434/api/tags")
            if res.status_code == 200:
                data = res.json()
                models = [m.get("name") for m in data.get("models", [])]
                return {
                    "available": True, 
                    "models": models,
                    "books": knowledge_base.get_books_list(),
                    "total_chunks": len(knowledge_base.documents)
                }
    except Exception as e:
        return {"available": False, "error": str(e), "models": []}
    return {"available": False, "models": []}

@app.post("/tutor")
async def tutor_chat(req: TutorRequest):
    """
    Quantum AI Tutor Endpoint powered by local Ollama + RAG Book Knowledge.
    Injects live circuit state, retrieved textbook excerpts, and pedagogical instructions.
    """
    import httpx
    
    # System prompt shaping the personality of the "Seeing Quantum" tutor
    system_instruction = (
        "You are 'Seeing Quantum Tutor', an expert quantum computing pedagogical AI assistant. "
        "Your mission is to make quantum mechanics intuitive, visual, and mathematical yet friendly. "
        "Keep your explanations clear, structured, and interactive. Use Markdown, LaTeX ($...$ and $$...$$), "
        "bullet points, and analogies where appropriate (e.g. Bloch sphere as a globe, superposition as spinning coins). "
        "When relevant textbook context is provided, cite and use it to enhance your answer. "
        "When the user is asking about their current circuit, refer directly to their circuit's gates and statevector."
    )

    # 1. Retrieve relevant excerpts from the user's books/notes
    book_snippets = knowledge_base.search(req.message, top_k=2)
    rag_context = ""
    if book_snippets:
        rag_context = "\n\n[RELEVANT TEXTBOOK / COURSE EXCERPTS]:\n" + "\n---\n".join(
            [f"From '{doc['source']}':\n{doc['chunk']}" for doc in book_snippets]
        ) + "\n"

    # 2. Build circuit context string if circuit context was provided
    circuit_ctx_str = ""
    if req.circuit_context:
        gates = req.circuit_context.get("gates", [])
        active_state = req.circuit_context.get("activeState", "|00>")
        probs = req.circuit_context.get("probabilities", [])
        
        circuit_ctx_str = f"\n\n[CURRENT USER WORKBENCH CIRCUIT]:\n- Number of Gates: {len(gates)}\n- Gates: {gates}\n- Active Statevector: {active_state}\n"
        if probs:
            prob_str = ", ".join([f"|{p.get('state')}>: {p.get('probability', 0)*100:.1f}%" for p in probs])
            circuit_ctx_str += f"- Measurement Probabilities: {prob_str}\n"

    user_prompt = f"{req.message}{circuit_ctx_str}{rag_context}"

    messages = [{"role": "system", "content": system_instruction}]
    
    # Append recent conversation history
    if req.history:
        for h in req.history[-6:]: # keep last 6 turns
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
            
    messages.append({"role": "user", "content": user_prompt})

    # Call Ollama /api/chat
    ollama_model = req.model or "llama3"
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            payload = {
                "model": ollama_model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": 0.6,
                    "top_p": 0.9
                }
            }
            res = await client.post("http://localhost:11434/api/chat", json=payload)
            if res.status_code == 200:
                data = res.json()
                reply_text = data.get("message", {}).get("content", "")
                return {
                    "reply": reply_text,
                    "model": ollama_model,
                    "source": "ollama",
                    "sources_used": [b["source"] for b in book_snippets]
                }
            else:
                return {
                    "error": f"Ollama returned status {res.status_code}",
                    "source": "error"
                }
    except Exception as e:
        return {
            "error": f"Could not connect to Ollama (http://localhost:11434): {str(e)}",
            "source": "offline"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)


