import React, { useState, useEffect } from 'react';
import { Play, Code, LayoutGrid, Trash2, X } from 'lucide-react';
import Visualization from './Visualization';
import GateTooltip from './GateTooltip';
import BlochSphere from './BlochSphere';
import MathExplanation from './MathExplanation';
import GateGlossary from './GateGlossary';
import WorkbenchBackground from './WorkbenchBackground';

const GATE_TYPES = ['H', 'X', 'Y', 'Z', 'S', 'T', 'CX', 'SWAP'];

export default function Workbench({ onBack }) {
  const [gates, setGates] = useState([]);
  const [codeView, setCodeView] = useState('');
  const [mode, setMode] = useState('visual'); // visual | code
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoveredPaletteGate, setHoveredPaletteGate] = useState(null);

  // Auto-simulate when gates change
  useEffect(() => {
    runSimulation();
  }, [gates]);

  // Sync state to code view when visual changes
  useEffect(() => {
    if (mode === 'visual') {
      let code = 'from qiskit import QuantumCircuit\n\n';
      code += 'qc = QuantumCircuit(2)\n';
      gates.forEach(g => {
        if (g.type === 'cx' || g.type === 'swap') {
          code += `qc.${g.type.toLowerCase()}(${g.control}, ${g.target})\n`;
        } else {
          code += `qc.${g.type.toLowerCase()}(${g.qubit})\n`;
        }
      });
      setCodeView(code);
    }
  }, [gates, mode]);

  const parseCodeAndSetGates = (codeStr) => {
    const lines = codeStr.split('\n');
    const newGates = [];
    let idCounter = 1;
    
    const gateRegex = /qc\.([a-z]+)\(([^)]+)\)/i;
    
    for (const line of lines) {
      const match = line.match(gateRegex);
      if (match) {
        const type = match[1].toLowerCase();
        const args = match[2].split(',').map(s => parseInt(s.trim()));
        
        if (['cx', 'swap'].includes(type) && args.length === 2) {
          newGates.push({ id: idCounter++, type, control: args[0], target: args[1] });
        } else if (['h', 'x', 'y', 'z', 's', 't'].includes(type) && args.length === 1 && !isNaN(args[0])) {
          newGates.push({ id: idCounter++, type, qubit: args[0] });
        }
      }
    }
    setGates(newGates);
  };

  const handleDragStart = (e, gateType) => {
    e.dataTransfer.setData('gateType', gateType);
  };

  const handleDrop = (e, qubitIdx) => {
    e.preventDefault();
    const gateType = e.dataTransfer.getData('gateType').toLowerCase();
    
    if (gateType === 'cx' || gateType === 'swap') {
      setGates([...gates, { id: Date.now(), type: gateType, control: qubitIdx, target: (qubitIdx + 1) % 2 }]);
    } else if (gateType) {
      setGates([...gates, { id: Date.now(), type: gateType, qubit: qubitIdx }]);
    }
  };

  const removeGate = (id) => {
    setGates(gates.filter(g => g.id !== id));
  };

  const clearCircuit = () => {
    setGates([]);
    setSimulationResult(null);
  };

  const runSimulation = async () => {
    if (mode === 'code') {
      parseCodeAndSetGates(codeView);
    }
    setLoading(true);
    try {
      const payload = {
        gates: gates.map(g => {
          if (g.type === 'cx' || g.type === 'swap') return { type: g.type, control: g.control, target: g.target };
          return { type: g.type, qubit: g.qubit };
        })
      };
      
      const res = await fetch('http://127.0.0.1:8000/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setSimulationResult(data);
    } catch (err) {
      console.error(err);
      setSimulationResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#2A2A2A] font-sans relative flex">
      {/* Subtle quantum background animation */}
      <WorkbenchBackground />

      {/* Main Workbench Area */}
      <div className="flex-1 relative z-10 p-8 h-screen overflow-y-auto custom-scrollbar">

      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-6 left-8 flex items-center gap-2 text-[#71717A] hover:text-[#B75D29] font-medium transition-colors bg-white/80 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm z-50 border border-[#E4E4E7]"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          Back
        </button>
      )}
      
      <div className="max-w-[1200px] mx-auto space-y-10 pt-4">
        
        {/* Header */}
        <div className="text-center pt-6 pb-2">
          <h1 className="text-5xl font-serif mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#2A2A2A] via-[#B75D29] to-[#2A2A2A]">Quantum Probability</h1>
          <p className="text-[#71717A] max-w-2xl mx-auto text-lg leading-relaxed">
            Drag and drop quantum logic gates to build a circuit. Observe how quantum interference and entanglement shape the final probability distribution.
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
            <button 
              onClick={runSimulation}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-[#B75D29] to-[#9A4C20] hover:from-[#A65324] hover:to-[#8B431C] text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg shadow-[#B75D29]/20 active:scale-95 disabled:opacity-50"
            >
              <Play size={18} fill="currentColor" />
              {loading ? 'Simulating...' : 'Simulate Circuit'}
            </button>
            <button 
              onClick={clearCircuit}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#E4E4E7] text-[#71717A] px-6 py-3 rounded-full font-medium transition-all shadow-sm active:scale-95"
            >
              <Trash2 size={18} />
              Clear
            </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Toolbar */}
          <div className="bg-white rounded-3xl p-6 seeing-shadow border border-[#E4E4E7]/50 xl:col-span-2">
            <h2 className="text-lg font-serif mb-6 text-[#2A2A2A] border-b border-[#E4E4E7] pb-2 text-center">Gate Palette</h2>
            <div className="grid grid-cols-2 gap-4">
              {GATE_TYPES.map(gate => (
                <div
                  key={gate}
                  draggable
                  onDragStart={(e) => handleDragStart(e, gate)}
                  onMouseEnter={() => setHoveredPaletteGate(gate)}
                  onMouseLeave={() => setHoveredPaletteGate(null)}
                  className="relative h-12 bg-[#F6EEE8] rounded-md border border-[#B75D29]/30 hover:border-[#B75D29] flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform hover:scale-[1.05] hover:z-50 z-10 shadow-[inset_0_-2px_4px_rgba(183,93,41,0.05)]"
                >
                  <span className="font-mono font-medium text-lg text-[#B75D29]">{gate}</span>
                  {hoveredPaletteGate === gate && <GateTooltip gateType={gate} />}
                </div>
              ))}
            </div>
          </div>

          {/* Editor Area */}
          <div className="xl:col-span-6 bg-white rounded-3xl p-8 seeing-shadow border border-[#E4E4E7]/50 flex flex-col">
            
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-serif text-[#2A2A2A]">Circuit Composer</h2>
              <div className="flex bg-[#F4F4F5] rounded-full p-1 border border-[#E4E4E7]">
                <button
                  onClick={() => setMode('visual')}
                  className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'visual' ? 'bg-white text-[#2A2A2A] shadow-sm' : 'text-[#71717A] hover:text-[#2A2A2A]'}`}
                >
                  <LayoutGrid size={16} /> Visual
                </button>
                <button
                  onClick={() => setMode('code')}
                  className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'code' ? 'bg-white text-[#2A2A2A] shadow-sm' : 'text-[#71717A] hover:text-[#2A2A2A]'}`}
                >
                  <Code size={16} /> Code
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#FAFAFA] rounded-2xl border border-[#E4E4E7] overflow-hidden relative">
              {mode === 'visual' ? (
                <div className="p-8 flex flex-col gap-14 min-h-[250px]">
                  {[0, 1].map(qubit => (
                    <div key={qubit} className="relative flex items-center h-12">
                      {/* Qubit Label */}
                      <div className="w-16 font-serif text-[#71717A] text-lg">
                        |0⟩_{qubit}
                      </div>
                      
                      {/* Wire */}
                      <div 
                        className="flex-1 h-[2px] wire-line relative flex items-center px-4 gap-3 transition-colors"
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.opacity = '0.7'; }}
                        onDragLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onDrop={(e) => { e.currentTarget.style.opacity = '1'; handleDrop(e, qubit); }}
                      >
                        {/* Gates on this wire */}
                        {gates.filter(g => g.qubit === qubit || g.control === qubit || g.target === qubit).map((g) => (
                          <div 
                            key={g.id} 
                            onClick={() => removeGate(g.id)}
                            className="gate-enter w-12 h-12 bg-white border border-[#B75D29] rounded-md flex flex-col items-center justify-center shadow-sm cursor-pointer hover:bg-red-50 hover:border-red-400 group relative z-10 transition-transform hover:scale-[1.05]"
                            title="Click to remove"
                          >
                            <span className="font-mono font-medium text-[#B75D29] group-hover:text-red-500">
                              {g.type.toUpperCase()}
                            </span>
                            {(g.type === 'cx' || g.type === 'swap') && (
                              <div className="absolute text-[9px] font-sans -top-6 bg-[#F4F4F5] px-2 py-0.5 rounded-full border border-[#E4E4E7] text-[#71717A]">
                                {g.control === qubit ? 'CTRL' : 'TGT'}
                              </div>
                            )}
                            {/* Hover overlay for delete */}
                            <div className="absolute inset-0 bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <X size={16} className="text-red-500 absolute -top-2 -right-2 bg-white rounded-full border border-red-200" />
                            </div>
                            
                            {/* Vertical line connecting multi-qubit gates */}
                            {(g.type === 'cx' || g.type === 'swap') && g.control === qubit && (
                              <div className="absolute w-[1px] bg-[#B75D29] top-full h-[56px] -z-10 group-hover:bg-red-400" />
                            )}
                            {(g.type === 'cx' || g.type === 'swap') && g.target === qubit && (
                              <div className="absolute w-[1px] bg-[#B75D29] bottom-full h-[56px] -z-10 group-hover:bg-red-400" />
                            )}
                          </div>
                        ))}

                        {/* Drop zone visual hint */}
                        <div className="flex-1 h-full min-h-[48px] rounded-md border border-dashed border-transparent transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <textarea
                  value={codeView}
                  onChange={(e) => setCodeView(e.target.value)}
                  onBlur={(e) => parseCodeAndSetGates(e.target.value)}
                  className="w-full h-full min-h-[250px] bg-transparent p-8 font-mono text-[#2A2A2A] focus:outline-none resize-none"
                  placeholder="from qiskit import QuantumCircuit&#10;&#10;qc = QuantumCircuit(2)&#10;qc.h(0)&#10;qc.cx(0, 1)"
                />
              )}
            </div>
            
            <p className="text-xs text-center text-[#71717A] mt-4">
              Tip: Click on a placed gate to remove it.
            </p>
          </div>
          
          {/* Chart Area */}
          <div className="xl:col-span-4 bg-white rounded-3xl p-6 seeing-shadow border border-[#E4E4E7]/50 flex flex-col justify-center min-h-[350px]">
            <h2 className="text-lg font-serif mb-2 text-center text-[#2A2A2A]">Measurement Probabilities</h2>
            {simulationResult && !simulationResult.error ? (
              <div className="flex-1 flex flex-col justify-center">
                 <Visualization data={simulationResult} />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#71717A] text-sm text-center px-8 border border-dashed border-[#E4E4E7] rounded-xl mt-4">
                Run a simulation to see the theoretical probability distribution
              </div>
            )}
          </div>
        </div>

        {/* Results Area (Bloch Spheres) */}
        {simulationResult && !simulationResult.error && simulationResult.bloch_vectors && (
          <div className="pt-12 border-t border-[#E4E4E7] gate-enter">
            <h2 className="text-3xl font-serif mb-2 text-center text-[#2A2A2A]">Qubit States</h2>
            <p className="text-center text-[#71717A] mb-12">Interactive 3D Bloch sphere representation (drag to rotate)</p>
            
            <div className="flex flex-wrap justify-center gap-16 mb-16">
              {simulationResult.bloch_vectors.map((bv) => (
                <div key={bv.qubit} className="w-80">
                  <BlochSphere qubit={`Qubit ${bv.qubit}`} x={bv.x} y={bv.y} z={bv.z} />
                </div>
              ))}
            </div>

            <div className="pt-16 border-t border-[#E4E4E7]">
              <h2 className="text-3xl font-serif mb-2 text-center text-[#2A2A2A]">Step-by-step Math Trace</h2>
              <p className="text-center text-[#71717A] mb-8 max-w-2xl mx-auto">See how the quantum statevector evolves exactly via matrix multiplication for each gate applied.</p>
              <MathExplanation steps={simulationResult.math_steps} />
            </div>
          </div>
        )}
        
        {simulationResult && simulationResult.error && (
          <div className="p-6 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-center">
            Error simulating circuit: {simulationResult.error}
          </div>
        )}
        
      </div>
      </div>{/* end z-10 wrapper */}
    </div>
  );
}
