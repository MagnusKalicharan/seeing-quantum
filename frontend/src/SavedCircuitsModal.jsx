import React, { useState, useEffect } from 'react';
import { X, Folder, Trash2, Play, Share2, Download, Search, Sparkles, Clock, Calendar } from 'lucide-react';
import { getSavedCircuits, deleteSavedCircuit, STARTER_TEMPLATES } from './circuitStorage';

export default function SavedCircuitsModal({
  isOpen,
  onClose,
  onLoadCircuit,
  onShareCircuit,
  onExportCircuit
}) {
  const [circuits, setCircuits] = useState([]);
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' | 'templates'
  const [searchQuery, setSearchQuery] = useState('');

  const refreshList = () => {
    setCircuits(getSavedCircuits());
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (e, id, name) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${name}" from your saved circuits?`)) {
      deleteSavedCircuit(id);
      refreshList();
    }
  };

  const handleLoad = (circuit) => {
    onLoadCircuit(circuit);
    onClose();
  };

  const handleShare = (e, circuit) => {
    e.stopPropagation();
    onShareCircuit(circuit);
  };

  const handleExport = (e, circuit) => {
    e.stopPropagation();
    onExportCircuit(circuit);
  };

  const currentList = activeTab === 'saved' ? circuits : STARTER_TEMPLATES;
  const filteredList = currentList.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesName = c.name?.toLowerCase().includes(q);
    const matchesDesc = c.description?.toLowerCase().includes(q);
    const matchesGates = c.gates?.some(g => g.type.toLowerCase().includes(q));
    return matchesName || matchesDesc || matchesGates;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full p-8 seeing-shadow border border-[#E4E4E7] relative gate-enter max-h-[85vh] flex flex-col"
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
            <Folder size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-serif text-[#2A2A2A]">Circuit Library</h3>
            <p className="text-sm text-[#71717A]">
              Load, manage, and inspect your saved circuits or starter presets
            </p>
          </div>
        </div>

        {/* Tab & Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 shrink-0">
          <div className="flex bg-[#F4F4F5] p-1 rounded-xl border border-[#E4E4E7]">
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'saved'
                  ? 'bg-white text-[#2A2A2A] shadow-xs'
                  : 'text-[#71717A] hover:text-[#2A2A2A]'
              }`}
            >
              My Saved ({circuits.length})
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-white text-[#2A2A2A] shadow-xs'
                  : 'text-[#71717A] hover:text-[#2A2A2A]'
              }`}
            >
              <Sparkles size={12} className="text-[#B75D29]" />
              Templates ({STARTER_TEMPLATES.length})
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circuits or gates..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E4E4E7] focus:border-[#B75D29] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Circuits List Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-[#E4E4E7] rounded-2xl bg-[#FAFAFA]">
              <Folder size={36} className="mx-auto text-[#A1A1AA] mb-3 stroke-[1.5]" />
              <h4 className="text-base font-serif text-[#2A2A2A] mb-1">
                {activeTab === 'saved' ? 'No saved circuits yet' : 'No templates match your query'}
              </h4>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto mb-4">
                {activeTab === 'saved'
                  ? 'Build your quantum circuit on the workbench and click "Save" to keep it stored in your browser.'
                  : 'Try searching for other gate types like H, CX, or SWAP.'}
              </p>
            </div>
          ) : (
            filteredList.map((circuit) => {
              const dateStr = circuit.updatedAt || circuit.createdAt;
              const formattedDate = dateStr
                ? new Date(dateStr).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : null;

              return (
                <div
                  key={circuit.id}
                  onClick={() => handleLoad(circuit)}
                  className="group bg-white hover:bg-[#FFFBF8] p-4 rounded-2xl border border-[#E4E4E7] hover:border-[#B75D29] transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-serif font-medium text-base text-[#2A2A2A] group-hover:text-[#B75D29] transition-colors truncate">
                        {circuit.name}
                      </h4>
                      {circuit.isTemplate && (
                        <span className="text-[10px] bg-[#F6EEE8] text-[#B75D29] font-medium px-2 py-0.5 rounded-full border border-[#B75D29]/20">
                          Template
                        </span>
                      )}
                    </div>

                    {circuit.description && (
                      <p className="text-xs text-[#71717A] mb-2 line-clamp-1">
                        {circuit.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
                      <span className="font-medium text-[#2A2A2A]">
                        {circuit.gates?.length || 0} gates
                      </span>
                      <span>•</span>
                      {/* Gate badges */}
                      <div className="flex items-center gap-1">
                        {circuit.gates?.slice(0, 6).map((g, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.2 bg-[#F4F4F5] border border-[#E4E4E7] text-[10px] font-mono rounded text-[#2A2A2A]"
                          >
                            {g.type.toUpperCase()}
                          </span>
                        ))}
                        {circuit.gates?.length > 6 && (
                          <span className="text-[10px] text-[#71717A]">
                            +{circuit.gates.length - 6}
                          </span>
                        )}
                      </div>

                      {formattedDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[11px] text-[#A1A1AA]">
                            <Clock size={11} />
                            {formattedDate}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions for this item */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleLoad(circuit)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#B75D29] hover:bg-[#9A4C20] text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                      title="Load into Workbench"
                    >
                      <Play size={12} fill="currentColor" />
                      Load
                    </button>

                    <button
                      onClick={(e) => handleShare(e, circuit)}
                      className="p-1.5 rounded-lg border border-[#E4E4E7] hover:border-[#B75D29] hover:text-[#B75D29] text-[#71717A] bg-white transition-colors"
                      title="Share link for this circuit"
                    >
                      <Share2 size={14} />
                    </button>

                    <button
                      onClick={(e) => handleExport(e, circuit)}
                      className="p-1.5 rounded-lg border border-[#E4E4E7] hover:border-[#B75D29] hover:text-[#B75D29] text-[#71717A] bg-white transition-colors"
                      title="Export circuit"
                    >
                      <Download size={14} />
                    </button>

                    {!circuit.isTemplate && (
                      <button
                        onClick={(e) => handleDelete(e, circuit.id, circuit.name)}
                        className="p-1.5 rounded-lg border border-[#E4E4E7] hover:border-red-300 hover:text-red-500 text-[#71717A] bg-white transition-colors"
                        title="Delete from saved"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
