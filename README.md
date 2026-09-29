# Seeing Quantum 🌌

An interactive, web-based educational platform designed to make quantum mechanics and quantum computing highly visual and intuitive. From fundamental physics principles to simulating full quantum circuits with an AI Tutor powered by local LLMs (Ollama) and textbook RAG.

---

## 🚀 Features

*   **🤖 AI Quantum Tutor (Ollama + RAG)**  
    Interactive tutor powered by local LLMs (e.g. `llama3`, `mistral`, `phi3`). Aware of your active workbench circuit, provides step-by-step statevector breakdowns, checks math, and cites custom quantum textbooks.
*   **Foundation 1: Quantisation (Bohr Model)**  
    Fire photons at a dynamically animated Bohr model atom. Teaches discrete energy levels, absorption, and spontaneous emission through a gamified interface.
*   **Foundation 2: The Impossible Filter**  
    A 3D simulation of sequential Stern-Gerlach experiments demonstrating spin quantization, superposition in different bases, and the Heisenberg Uncertainty Principle.
*   **Chapter 1: Wave-Particle Duality**  
    A full 3D interactive double-slit experiment showing superposition, wave interference, and how measurement forces decoherence.
*   **Chapter 2: The Qubit & Bloch Sphere**  
    Visualize kets, statevectors, and phase angles in real-time on a 3D Bloch sphere.
*   **Chapter 3: Quantum Gates**  
    Explore how single-qubit gates (X, Y, Z, H, S, T) manipulate states and perform 3D unitary rotations on the Bloch sphere.
*   **Chapter 4: Quantum Circuit Simulator**  
    A drag-and-drop workbench to build multi-qubit circuits, trace state evolution, observe entanglement (like Bell states), and calculate probability distributions.

---

## 🏗️ Architecture & AI Pipeline

```
┌─────────────────────────────────────────────────────────┐
│              Seeing Quantum Web Frontend                │
│    (React + Three.js + Tailwind CSS + Vite @ :5173)     │
└──────────────┬────────────────────────────┬─────────────┘
               │ Simulation Requests        │ Chat & Circuit Context
               ▼                            ▼
┌─────────────────────────────────────────────────────────┐
│                 FastAPI Backend (@ :8000)               │
│  - Qiskit & Statevector Simulator                       │
│  - /tutor context builder & history manager             │
│  - /ollama/status model discovery                       │
└──────────────┬────────────────────────────┬─────────────┘
               │ Retrieves Excerpts         │ Injects Prompt & State
               ▼                            ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│  RAG Knowledge Engine        │   │        Ollama Service        │
│  - backend/data/books/       │   │   (Local LLM @ :11434)       │
│  - PDF/TXT/MD Parser (pypdf) │   │   - llama3 / mistral / phi3  │
└──────────────────────────────┘   └──────────────────────────────┘
```

---

## 🛠️ Tech Stack

**Frontend:**
*   [React](https://reactjs.org/) (UI Framework)
*   [Vite](https://vitejs.dev/) (Build tool)
*   [Three.js](https://threejs.org/) & [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) (3D graphics)
*   [Tailwind CSS](https://tailwindcss.com/) (Styling & Design System)
*   [Lucide React](https://lucide.dev/) (Icons)

**Backend & AI Engine:**
*   [FastAPI](https://fastapi.tiangolo.com/) & [Uvicorn](https://www.uvicorn.org/) (Python REST API)
*   [Qiskit](https://qiskit.org/) & [Qiskit Aer](https://github.com/Qiskit/qiskit-aer) (Quantum state simulation)
*   [Ollama](https://ollama.com/) (Local Large Language Model server)
*   [pypdf](https://pypdf.readthedocs.io/) (Textbook RAG Ingestion)
*   [HTTPX](https://www.python-httpx.org/) (Async AI Proxy)

---

## 💻 Running Locally

### Prerequisites
1. **Node.js** (v18 or higher)
2. **Python** (v3.10 or higher)
3. **[Ollama](https://ollama.com/)** (for local AI tutor)

---

### Step 1: Start Ollama & Pull a Model
Ensure the Ollama daemon is running and pull your preferred model:

```bash
# Pull and start Llama 3 (or mistral / phi3)
ollama run llama3
```
> Ollama will listen on `http://localhost:11434`.

---

### Step 2: (Optional) Add Textbooks to the Knowledge Base
To have the AI Tutor cite your textbooks, papers, or lecture notes:
1. Place `.pdf`, `.txt`, or `.md` files into:
   ```
   backend/data/books/
   ```
2. The backend automatically reads and indexes them into semantic chunks on startup.

---

### Step 3: Start the Backend Server

```bash
cd backend

# Create & activate a virtual environment
python -m venv .venv

# Windows (PowerShell):
.\.venv\Scripts\activate

# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python main.py
```
> The API will be running on `http://localhost:8000`.

---

### Step 4: Start the Frontend Dev Server

Open a **new terminal window**:

```bash
cd frontend

# Install Node dependencies
npm install

# Start development server
npm run dev
```
> Open `http://localhost:5173` in your browser.

---

## 🎓 Using the AI Quantum Tutor

1. **Global Tutor Button**: Click **"Ask AI Tutor"** on the bottom right of any page or chapter.
2. **Model Switcher**: Switch between any local models you have installed (`llama3`, `mistral`, `phi3`) in the header dropdown.
3. **Circuit-Aware Q&A**: In the Workbench, add gates ($H$, $X$, $CX$, etc.) and ask:
   > *"Explain what statevector my current circuit creates."*  
   The tutor automatically injects your live circuit into its context and breaks down the math step-by-step.
4. **Interactive Verification**: Try the **Interactive Challenges** tab to build Bell States and test your circuit with automatic verification.

---

## 📜 License
MIT License
