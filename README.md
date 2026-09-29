# Seeing Quantum 🌌

An interactive, web-based educational platform designed to make quantum mechanics and quantum computing highly visual and intuitive. From fundamental physics principles to simulating a full quantum circuit, this platform bridges the gap between abstract math and interactive intuition.

## 🚀 Features

*   **Foundation 1: Quantisation (Bohr Model)**  
    Fire photons at a dynamically animated Bohr model atom. Teaches discrete energy levels, absorption, and spontaneous emission through a gamified interface.
*   **Foundation 2: The Impossible Filter**  
    A 3D simulation of sequential Stern-Gerlach experiments demonstrating spin quantization, superposition in different bases, and the Heisenberg Uncertainty Principle.
*   **Chapter 1: Wave-Particle Duality**  
    A full 3D interactive double-slit experiment showing superposition, wave interference, and how the act of measurement forces decoherence.
*   **Chapter 2: The Qubit & Bloch Sphere**  
    Visualize kets, statevectors, and phase angles in real-time on a 3D Bloch sphere.
*   **Chapter 3: Quantum Gates**  
    Explore how single-qubit gates (X, Y, Z, H, S, T) manipulate states and perform 3D unitary rotations on the Bloch sphere.
*   **Chapter 4: Quantum Circuit Simulator**  
    A drag-and-drop workbench to build multi-qubit circuits, trace state evolution, observe entanglement (like Bell states), and calculate probability distributions.

## 🛠️ Tech Stack

**Frontend:**
*   [React](https://reactjs.org/) (UI Framework)
*   [Vite](https://vitejs.dev/) (Build tool)
*   [Three.js](https://threejs.org/) (3D graphics & simulations)
*   [Tailwind CSS](https://tailwindcss.com/) (Styling)
*   [Lucide React](https://lucide.dev/) (Icons)

**Backend:**
*   [FastAPI](https://fastapi.tiangolo.com/) (Python API)
*   [Uvicorn](https://www.uvicorn.org/) (ASGI server)
*   [NumPy](https://numpy.org/) (Quantum state and tensor calculations)

## 💻 Running Locally

### Prerequisites
1. **Node.js** (v16 or higher)
2. **Python** (3.8 or higher)

### 1. Start the Backend
The backend handles the heavy linear algebra for the quantum circuit simulations.
```bash
cd backend
# Create a virtual environment (recommended)
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install the required Python packages
pip install fastapi uvicorn numpy pydantic

# Run the server
uvicorn main:app --reload --port 8000
```
The backend API will run on `http://localhost:8000`.

### 2. Start the Frontend
Open a **new terminal window** and run the following:
```bash
cd frontend

# Install the required Node packages
npm install

# (Note: Important packages installed include: three, @react-three/fiber, @react-three/drei, lucide-react, react-beautiful-dnd)

# Start the development server
npm run dev
```
The frontend will typically run on `http://localhost:5173`. Open this URL in your browser to explore the platform!

## 📜 License
MIT License
