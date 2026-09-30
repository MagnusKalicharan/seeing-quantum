import React, { useState, useRef } from 'react';
import { X, Download, Upload, FileCode, FileJson, Atom, Copy, Check, AlertCircle } from 'lucide-react';
import {
  exportCircuitAsJSON,
  exportCircuitAsPython,
  exportCircuitAsQASM,
  generateQiskitCode,
  parseImportedJSON,
  copyTextToClipboard
} from './circuitStorage';

export default function ExportImportModal({
  isOpen,
  onClose,
  circuitName,
  gates,
  onImportCircuit
}) {
  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'import'
  const [copyStatus, setCopyStatus] = useState(null); // 'python' | 'json' | null
  const [importError, setImportError] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    exportCircuitAsJSON(circuitName, gates);
  };

  const handleExportPython = () => {
    exportCircuitAsPython(circuitName, gates);
  };

  const handleExportQASM = () => {
    exportCircuitAsQASM(circuitName, gates);
  };

  const handleCopyPython = async () => {
    const code = generateQiskitCode(circuitName, gates);
    const ok = await copyTextToClipboard(code);
    if (ok) {
      setCopyStatus('python');
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  const handleCopyJSON = async () => {
    const jsonStr = JSON.stringify({ name: circuitName, gates }, null, 2);
    const ok = await copyTextToClipboard(jsonStr);
    if (ok) {
      setCopyStatus('json');
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const parsed = parseImportedJSON(text);
        setImportPreview(parsed);
        setImportError(null);
      } catch (err) {
        setImportError(err.message || 'Failed to read circuit file.');
        setImportPreview(null);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (importPreview && onImportCircuit) {
      onImportCircuit(importPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full p-8 seeing-shadow border border-[#E4E4E7] relative gate-enter max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#71717A] hover:text-[#2A2A2A] flex items-center justify-center transition-colors cursor-pointer"
          title="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-[#F6EEE8] text-[#B75D29] flex items-center justify-center border border-[#B75D29]/20 shadow-sm">
            {activeTab === 'export' ? <Download size={22} /> : <Upload size={22} />}
          </div>
          <div>
            <h3 className="text-2xl font-serif text-[#2A2A2A]">Export & Import</h3>
            <p className="text-sm text-[#71717A]">
              Save circuit files locally or load previous projects
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#F4F4F5] p-1 rounded-xl border border-[#E4E4E7] mb-6 shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white text-[#2A2A2A] shadow-xs'
                : 'text-[#71717A] hover:text-[#2A2A2A]'
            }`}
          >
            <Download size={14} />
            Export Circuit
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white text-[#2A2A2A] shadow-xs'
                : 'text-[#71717A] hover:text-[#2A2A2A]'
            }`}
          >
            <Upload size={14} />
            Import from File
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="text-xs text-[#71717A] mb-1">
                Choose the export format for <strong className="text-[#2A2A2A]">"{circuitName || 'Quantum Circuit'}"</strong> ({gates.length} gates):
              </div>

              {/* JSON Format Card */}
              <div className="p-4 rounded-2xl border border-[#E4E4E7] hover:border-[#B75D29]/50 transition-all bg-[#FAFAFA] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                    <FileJson size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#2A2A2A]">Circuit JSON (.json)</h4>
                    <p className="text-xs text-[#71717A]">Native project file for backup & re-importing</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJSON}
                    className="p-2 text-xs rounded-xl border border-[#E4E4E7] bg-white hover:text-[#B75D29] transition-colors"
                    title="Copy JSON text"
                  >
                    {copyStatus === 'json' ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="px-3 py-2 bg-white hover:bg-[#F6EEE8] text-[#B75D29] border border-[#B75D29]/30 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </div>

              {/* Qiskit Python Card */}
              <div className="p-4 rounded-2xl border border-[#E4E4E7] hover:border-[#B75D29]/50 transition-all bg-[#FAFAFA] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                    <FileCode size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#2A2A2A]">Qiskit Python (.py)</h4>
                    <p className="text-xs text-[#71717A]">Runnable script with simulation & measurement</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPython}
                    className="p-2 text-xs rounded-xl border border-[#E4E4E7] bg-white hover:text-[#B75D29] transition-colors"
                    title="Copy Python script"
                  >
                    {copyStatus === 'python' ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  </button>
                  <button
                    onClick={handleExportPython}
                    className="px-3 py-2 bg-white hover:bg-[#F6EEE8] text-[#B75D29] border border-[#B75D29]/30 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </div>

              {/* OpenQASM Card */}
              <div className="p-4 rounded-2xl border border-[#E4E4E7] hover:border-[#B75D29]/50 transition-all bg-[#FAFAFA] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                    <Atom size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#2A2A2A]">OpenQASM 2.0 (.qasm)</h4>
                    <p className="text-xs text-[#71717A]">Standard quantum intermediate representation</p>
                  </div>
                </div>
                <div>
                  <button
                    onClick={handleExportQASM}
                    className="px-3 py-2 bg-white hover:bg-[#F6EEE8] text-[#B75D29] border border-[#B75D29]/30 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Import Tab */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E4E4E7] hover:border-[#B75D29] rounded-2xl p-8 text-center bg-[#FAFAFA] hover:bg-[#FFFBF8] transition-all cursor-pointer group"
              >
                <Upload size={36} className="mx-auto text-[#A1A1AA] group-hover:text-[#B75D29] mb-3 transition-colors stroke-[1.5]" />
                <h4 className="text-sm font-medium text-[#2A2A2A] mb-1">
                  Click to browse or drop a .json circuit file
                </h4>
                <p className="text-xs text-[#71717A]">
                  Supports Seeing Quantum circuit JSON exports
                </p>
              </div>

              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importPreview && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-800">
                      Circuit File Ready to Load
                    </span>
                    <span className="text-xs text-emerald-700 font-mono">
                      {importPreview.gates.length} gates
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#2A2A2A] mb-3">
                    "{importPreview.name}"
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {importPreview.gates.map((g, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-white border border-emerald-300 text-[10px] font-mono rounded text-emerald-900"
                      >
                        {g.type.toUpperCase()}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={handleApplyImport}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors shadow-xs cursor-pointer"
                  >
                    Load this Circuit into Workbench
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
