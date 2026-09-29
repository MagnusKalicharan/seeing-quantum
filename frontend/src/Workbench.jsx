import React, { useState, useEffect } from 'react';
import { 
  Play, Code, LayoutGrid, Trash2, X, Save, Folder, Download, Share2, 
  Lock, Edit3, Copy, Check, Sparkles 
} from 'lucide-react';
import Visualization from './Visualization';
import GateTooltip from './GateTooltip';
import BlochSphere from './BlochSphere';
import MathExplanation from './MathExplanation';
import WorkbenchBackground from './WorkbenchBackground';
import ShareModal from './ShareModal';
import SaveModal from './SaveModal';
import SavedCircuitsModal from './SavedCircuitsModal';
import ExportImportModal from './ExportImportModal';
import { saveDraft, loadDraft } from './circuitStorage';
import { simulateClientSide } from './clientSimulator';

const GATE_TYPES = ['H', 'X', 'Y', 'Z', 'S', 'T', 'CX', 'SWAP'];

export default function Workbench({ onBack, initialSharedCircuit = null, initialAccessMode = 'write' }) {
  const [gates, setGates] = useState(() => {
    if (initialSharedCircuit?.gates) return initialSharedCircuit.gates;
    const draft = loadDraft();
    return draft?.gates?.length ? draft.gates : [];
  });

  const [circuitName, setCircuitName] = useState(() => {
    if (initialSharedCircuit?.name) return initialSharedCircuit.name;
    const draft = loadDraft();
    return draft?.name || 'Quantum Circuit';
  });

  const [circuitId, setCircuitId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(() => initialAccessMode === 'readonly');
  const [isEditingName, setIsEditingName] = useState(false);

  const [codeView, setCodeView] = useState('');
  const [mode, setMode] = useState('visual'); // visual | code
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoveredPaletteGate, setHoveredPaletteGate] = useState(null);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'save' | 'library' | 'export' | 'share' | null
  const [targetCircuitForModal, setTargetCircuitForModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // If initialSharedCircuit changes (e.g., navigated with new shared link)
  useEffect(() => {
    if (initialSharedCircuit) {
      setGates(initialSharedCircuit.gates || []);
      setCircuitName(initialSharedCircuit.name || 'Shared Circuit');
      setIsReadOnly(initialAccessMode === 'readonly');
      setCircuitId(null);
    }
  }, [initialSharedCircuit, initialAccessMode]);

  // Auto-save draft when gates or name changes (only in editable mode)
  useEffect(() => {
    if (!isReadOnly) {
      saveDraft(gates, circuitName);
    }
  }, [gates, circuitName, isReadOnly]);

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
    if (isReadOnly) return;
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
    if (isReadOnly) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('gateType', gateType);
  };

  const handleDrop = (e, qubitIdx) => {
    if (isReadOnly) return;
    e.preventDefault();
    const gateType = e.dataTransfer.getData('gateType')?.toLowerCase();
    
    if (gateType === 'cx' || gateType === 'swap') {
      setGates([...gates, { id: Date.now(), type: gateType, control: qubitIdx, target: (qubitIdx + 1) % 2 }]);
    } else if (gateType) {
      setGates([...gates, { id: Date.now(), type: gateType, qubit: qubitIdx }]);
    }
  };

  const removeGate = (id) => {
    if (isReadOnly) return;
    setGates(gates.filter(g => g.id !== id));
  };

  const clearCircuit = () => {
    if (isReadOnly) return;
    setGates([]);
    setSimulationResult(null);
    showToast('Circuit cleared', 'info');
  };

  const runSimulation = async () => {
    if (mode === 'code' && !isReadOnly) {
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
      
      try {
        const res = await fetch('http://127.0.0.1:8000/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          setSimulationResult(data);
          return;
        }
      } catch {
        // Fallback to high-performance client simulator if backend is offline
        const clientData = simulateClientSide(gates);
        setSimulationResult(clientData);
        return;
      }

      // If backend responded with non-200, try client simulator
      const clientData = simulateClientSide(gates);
      setSimulationResult(clientData);
    } catch (err) {
      console.error(err);
      setSimulationResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Duplicate / unlock read-only circuit into an editable copy
  const handleDuplicateToEdit = () => {
    setIsReadOnly(false);
    setCircuitName(prev => `${prev} (Copy)`);
    setCircuitId(null);
    showToast('Unlocked editable copy! You can now freely edit gates.', 'success');
  };

  // Circuit loaded from Library
  const handleLoadCircuit = (circuit) => {
    setGates(circuit.gates || []);
    setCircuitName(circuit.name || 'Loaded Circuit');
    setCircuitId(circuit.id || null);
    setIsReadOnly(false);
    showToast(`Loaded "${circuit.name}"`, 'success');
  };

  // Circuit imported from JSON
  const handleImportCircuit = (parsed) => {
    setGates(parsed.gates || []);
    setCircuitName(parsed.name || 'Imported Circuit');
    setCircuitId(null);
    setIsReadOnly(false);
    showToast(`Imported "${parsed.name}" (${parsed.gates.length} gates)`, 'success');
  };

  // Saved successfully
  const handleSaveSuccess = (record) => {
    setCircuitName(record.name);
    setCircuitId(record.id);
    showToast(`Saved "${record.name}" to local storage`, 'success');
  };

  // Trigger modal with custom circuit if requested from library
  const handleShareFromLibrary = (circuit) => {
    setTargetCircuitForModal(circuit);
    setActiveModal('share');
  };

  const handleExportFromLibrary = (circuit) => {
    setTargetCircuitForModal(circuit);
    setActiveModal('export');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#2A2A2A] font-sans relative flex">
      {/* Quantum background animation */}
      <WorkbenchBackground />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2A2A2A] text-white px-5 py-2.5 rounded-full shadow-xl text-xs font-medium flex items-center gap-2 animate-fade-in border border-white/10">
          <Check size={14} className="text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Workbench Area */}
      <div className="flex-1 relative z-10 p-6 md:p-8 h-screen overflow-y-auto custom-scrollbar">

        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-6 left-8 flex items-center gap-2 text-[#71717A] hover:text-[#B75D29] font-medium transition-colors bg-white/80 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm z-50 border border-[#E4E4E7] cursor-pointer"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            Back
          </button>
        )}
        
        <div className="max-w-[1240px] mx-auto space-y-8 pt-4">
          
          {/* Header & Circuit Title */}
          <div className="text-center pt-4 pb-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6EEE8] text-[#B75D29] text-xs font-medium mb-3 border border-[#B75D29]/20">
              <Sparkles size={12} />
              <span>Seeing Quantum Workbench</span>
            </div>

            <div className="flex items-center justify-center gap-3 mb-2">
              {isEditingName && !isReadOnly ? (
                <input
                  type="text"
                  autoFocus
                  value={circuitName}
                  onChange={(e) => setCircuitName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  className="text-3xl md:text-4xl font-serif text-center bg-white border border-[#B75D29] rounded-xl px-4 py-1 outline-none text-[#2A2A2A] shadow-xs"
                />
              ) : (
                <div 
                  onClick={() => !isReadOnly && setIsEditingName(true)}
                  className={`group flex items-center gap-2.5 justify-center ${!isReadOnly ? 'cursor-pointer' : ''}`}
                  title={!isReadOnly ? 'Click to rename circuit' : ''}
                >
                  <h1 className="text-4xl md:text-5xl font-serif bg-clip-text text-transparent bg-gradient-to-r from-[#2A2A2A] via-[#B75D29] to-[#2A2A2A]">
                    {circuitName}
                  </h1>
                  {!isReadOnly && (
                    <Edit3 size={18} className="text-[#A1A1AA] group-hover:text-[#B75D29] transition-colors" />
                  )}
                  {isReadOnly && (
                    <span className="flex items-center gap-1 text-[11px] font-sans font-medium px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-300">
                      <Lock size={11} />
                      Read-Only
                    </span>
                  )}
                </div>
              )}
            </div>

            <p className="text-[#71717A] max-w-2xl mx-auto text-base leading-relaxed">
              Drag and drop quantum logic gates to compose circuits. Save your creations locally, export them, or generate shareable links.
            </p>
          </div>

          {/* Read-Only Notice Banner */}
          {isReadOnly && (
            <div className="bg-[#FFF8F3] border border-[#B75D29]/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs gate-enter">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#B75D29] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Lock size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#2A2A2A]">Viewing Shared Circuit in Read-Only Mode</span>
                    <span className="text-[10px] uppercase font-bold bg-[#B75D29]/15 text-[#B75D29] px-2 py-0.5 rounded-full">
                      Protected
                    </span>
                  </div>
                  <p className="text-xs text-[#71717A]">
                    Circuit gates and code are locked against accidental changes. You can simulate probabilities or duplicate an editable copy.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDuplicateToEdit}
                className="flex items-center gap-2 bg-[#B75D29] hover:bg-[#9A4C20] text-white px-5 py-2.5 rounded-xl text-xs font-medium transition-all shadow-md shadow-[#B75D29]/20 hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
              >
                <Copy size={14} />
                <span>Duplicate to Edit</span>
              </button>
            </div>
          )}

          {/* Control Bar: Simulate, Clear, Save, Library, Export, Share */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Run Simulation */}
            <button 
              onClick={runSimulation}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-[#B75D29] to-[#9A4C20] hover:from-[#A65324] hover:to-[#8B431C] text-white px-7 py-2.5 rounded-full font-medium text-sm transition-all shadow-md shadow-[#B75D29]/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Play size={16} fill="currentColor" />
              {loading ? 'Simulating...' : 'Simulate Circuit'}
            </button>

            {/* Clear Circuit */}
            <button 
              onClick={clearCircuit}
              disabled={isReadOnly || gates.length === 0}
              title={isReadOnly ? 'Clear is disabled in Read-Only mode' : 'Clear all gates'}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-[#E4E4E7] text-[#71717A] hover:text-red-600 hover:border-red-200 px-4 py-2.5 rounded-full font-medium text-sm transition-all shadow-2xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 size={16} />
              Clear
            </button>

            <div className="hidden md:block w-[1px] h-6 bg-[#E4E4E7] mx-1" />

            {/* Save to Local Storage */}
            <button
              onClick={() => setActiveModal('save')}
              className="flex items-center gap-1.5 bg-white hover:bg-[#FFFBF8] border border-[#E4E4E7] hover:border-[#B75D29]/40 text-[#2A2A2A] px-5 py-2.5 rounded-full font-medium text-sm transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Save circuit to local browser storage"
            >
              <Save size={16} className="text-[#B75D29]" />
              Save
            </button>

            {/* Saved Library */}
            <button
              onClick={() => setActiveModal('library')}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-[#E4E4E7] hover:border-[#B75D29]/40 text-[#71717A] hover:text-[#2A2A2A] px-4 py-2.5 rounded-full font-medium text-sm transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Open saved circuits library & presets"
            >
              <Folder size={16} />
              Library
            </button>

            {/* Export / Import */}
            <button
              onClick={() => {
                setTargetCircuitForModal(null);
                setActiveModal('export');
              }}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-[#E4E4E7] hover:border-[#B75D29]/40 text-[#71717A] hover:text-[#2A2A2A] px-4 py-2.5 rounded-full font-medium text-sm transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Export as JSON, Python, QASM or import file"
            >
              <Download size={16} />
              Export
            </button>

            {/* Share Link */}
            <button
              onClick={() => {
                setTargetCircuitForModal(null);
                setActiveModal('share');
              }}
              className="flex items-center gap-2 bg-[#2A2A2A] hover:bg-[#18181B] text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all shadow-md shadow-black/10 active:scale-95 cursor-pointer"
              title="Generate shareable link (Read-Only or Write access)"
            >
              <Share2 size={16} className="text-[#B75D29]" />
              Share Link
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Toolbar / Gate Palette */}
            <div className={`bg-white rounded-3xl p-6 seeing-shadow border border-[#E4E4E7]/50 xl:col-span-2 relative ${isReadOnly ? 'opacity-70' : ''}`}>
              <div className="border-b border-[#E4E4E7] pb-3 mb-5 flex items-center justify-between">
                <h2 className="text-base font-serif text-[#2A2A2A]">Gate Palette</h2>
                {isReadOnly ? (
                  <span className="flex items-center gap-1 text-[10px] text-amber-700 font-medium px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200">
                    <Lock size={10} /> Locked
                  </span>
                ) : (
                  <span className="text-[10px] text-[#71717A] font-mono">2-Qubit</span>
                )}
              </div>

              {isReadOnly && (
                <div className="mb-4 p-2 bg-[#FFF7F2] rounded-xl border border-[#B75D29]/20 text-[11px] text-[#B75D29] text-center">
                  Palette locked in read-only mode
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                {GATE_TYPES.map(gate => (
                  <div
                    key={gate}
                    draggable={!isReadOnly}
                    onDragStart={(e) => handleDragStart(e, gate)}
                    onMouseEnter={() => setHoveredPaletteGate(gate)}
                    onMouseLeave={() => setHoveredPaletteGate(null)}
                    className={`relative h-12 bg-[#F6EEE8] rounded-xl border border-[#B75D29]/30 flex items-center justify-center transition-all shadow-[inset_0_-2px_4px_rgba(183,93,41,0.05)] ${
                      isReadOnly 
                        ? 'cursor-not-allowed opacity-60' 
                        : 'hover:border-[#B75D29] cursor-grab active:cursor-grabbing hover:scale-[1.05] hover:z-50 z-10'
                    }`}
                  >
                    <span className="font-mono font-medium text-lg text-[#B75D29]">{gate}</span>
                    {hoveredPaletteGate === gate && <GateTooltip gateType={gate} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Editor Area */}
            <div className="xl:col-span-6 bg-white rounded-3xl p-8 seeing-shadow border border-[#E4E4E7]/50 flex flex-col">
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-serif text-[#2A2A2A]">Circuit Composer</h2>
                  {gates.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#F4F4F5] text-[#71717A] font-mono">
                      {gates.length} {gates.length === 1 ? 'gate' : 'gates'}
                    </span>
                  )}
                </div>

                <div className="flex bg-[#F4F4F5] rounded-full p-1 border border-[#E4E4E7]">
                  <button
                    onClick={() => setMode('visual')}
                    className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${mode === 'visual' ? 'bg-white text-[#2A2A2A] shadow-sm' : 'text-[#71717A] hover:text-[#2A2A2A]'}`}
                  >
                    <LayoutGrid size={16} /> Visual
                  </button>
                  <button
                    onClick={() => setMode('code')}
                    className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${mode === 'code' ? 'bg-white text-[#2A2A2A] shadow-sm' : 'text-[#71717A] hover:text-[#2A2A2A]'}`}
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
                        <div className="w-16 font-serif text-[#71717A] text-lg select-none">
                          |0⟩_{qubit}
                        </div>
                        
                        {/* Wire */}
                        <div 
                          className="flex-1 h-[2px] wire-line relative flex items-center px-4 gap-3 transition-colors"
                          onDragOver={(e) => { 
                            if (!isReadOnly) {
                              e.preventDefault(); 
                              e.currentTarget.style.opacity = '0.7'; 
                            }
                          }}
                          onDragLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                          onDrop={(e) => { 
                            e.currentTarget.style.opacity = '1'; 
                            handleDrop(e, qubit); 
                          }}
                        >
                          {/* Gates on this wire */}
                          {gates.filter(g => g.qubit === qubit || g.control === qubit || g.target === qubit).map((g) => (
                            <div 
                              key={g.id} 
                              onClick={() => !isReadOnly && removeGate(g.id)}
                              className={`gate-enter w-12 h-12 bg-white border border-[#B75D29] rounded-md flex flex-col items-center justify-center shadow-sm relative z-10 transition-transform ${
                                isReadOnly
                                  ? 'cursor-default'
                                  : 'cursor-pointer hover:bg-red-50 hover:border-red-400 group hover:scale-[1.05]'
                              }`}
                              title={isReadOnly ? `${g.type.toUpperCase()} Gate (Read-only)` : 'Click to remove'}
                            >
                              <span className={`font-mono font-medium text-[#B75D29] ${!isReadOnly ? 'group-hover:text-red-500' : ''}`}>
                                {g.type.toUpperCase()}
                              </span>
                              {(g.type === 'cx' || g.type === 'swap') && (
                                <div className="absolute text-[9px] font-sans -top-6 bg-[#F4F4F5] px-2 py-0.5 rounded-full border border-[#E4E4E7] text-[#71717A]">
                                  {g.control === qubit ? 'CTRL' : 'TGT'}
                                </div>
                              )}
                              
                              {/* Hover overlay for delete (only if not read-only) */}
                              {!isReadOnly && (
                                <div className="absolute inset-0 bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <X size={16} className="text-red-500 absolute -top-2 -right-2 bg-white rounded-full border border-red-200" />
                                </div>
                              )}
                              
                              {/* Vertical line connecting multi-qubit gates */}
                              {(g.type === 'cx' || g.type === 'swap') && g.control === qubit && (
                                <div className="absolute w-[1px] bg-[#B75D29] top-full h-[56px] -z-10" />
                              )}
                              {(g.type === 'cx' || g.type === 'swap') && g.target === qubit && (
                                <div className="absolute w-[1px] bg-[#B75D29] bottom-full h-[56px] -z-10" />
                              )}
                            </div>
                          ))}

                          {/* Drop zone visual hint */}
                          {!isReadOnly && (
                            <div className="flex-1 h-full min-h-[48px] rounded-md border border-dashed border-transparent transition-colors" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative h-full">
                    {isReadOnly && (
                      <div className="absolute top-3 right-4 z-20 flex items-center gap-1 text-[11px] bg-[#F4F4F5] px-2.5 py-1 rounded-full text-[#71717A] border border-[#E4E4E7]">
                        <Lock size={12} /> Read-Only Qiskit Code
                      </div>
                    )}
                    <textarea
                      readOnly={isReadOnly}
                      value={codeView}
                      onChange={(e) => setCodeView(e.target.value)}
                      onBlur={(e) => parseCodeAndSetGates(e.target.value)}
                      className={`w-full h-full min-h-[250px] bg-transparent p-8 font-mono text-[#2A2A2A] focus:outline-none resize-none ${
                        isReadOnly ? 'cursor-default select-all' : ''
                      }`}
                      placeholder="from qiskit import QuantumCircuit&#10;&#10;qc = QuantumCircuit(2)&#10;qc.h(0)&#10;qc.cx(0, 1)"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-[#71717A] mt-4 px-1">
                <span>
                  {isReadOnly ? 'Circuit is locked in Read-Only mode' : 'Tip: Click on a placed gate to remove it'}
                </span>
                {circuitId && (
                  <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <Check size={12} /> Saved in local storage
                  </span>
                )}
              </div>
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
      </div>

      {/* Save Modal */}
      <SaveModal
        isOpen={activeModal === 'save'}
        onClose={() => setActiveModal(null)}
        circuitName={circuitName}
        gates={gates}
        onSaveSuccess={handleSaveSuccess}
        onOpenSavedList={() => setActiveModal('library')}
      />

      {/* Library / Saved Circuits Modal */}
      <SavedCircuitsModal
        isOpen={activeModal === 'library'}
        onClose={() => setActiveModal(null)}
        onLoadCircuit={handleLoadCircuit}
        onShareCircuit={handleShareFromLibrary}
        onExportCircuit={handleExportFromLibrary}
      />

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={activeModal === 'export'}
        onClose={() => {
          setActiveModal(null);
          setTargetCircuitForModal(null);
        }}
        circuitName={targetCircuitForModal?.name || circuitName}
        gates={targetCircuitForModal?.gates || gates}
        onImportCircuit={handleImportCircuit}
      />

      {/* Share Link Modal */}
      <ShareModal
        isOpen={activeModal === 'share'}
        onClose={() => {
          setActiveModal(null);
          setTargetCircuitForModal(null);
        }}
        circuitName={targetCircuitForModal?.name || circuitName}
        gates={targetCircuitForModal?.gates || gates}
      />
    </div>
  );
}
