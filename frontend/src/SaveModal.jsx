import React, { useState, useEffect } from 'react';
import { X, Save, Check, Sparkles, FolderHeart } from 'lucide-react';
import { saveCircuitToLocal } from './circuitStorage';

export default function SaveModal({ isOpen, onClose, circuitName, gates, onSaveSuccess, onOpenSavedList }) {
  const [name, setName] = useState(circuitName || '');
  const [description, setDescription] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(circuitName || `Circuit ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      setDescription('');
      setSaved(false);
    }
  }, [isOpen, circuitName]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const record = saveCircuitToLocal({
        name: name.trim(),
        description: description.trim(),
        gates
      });
      setSaved(true);
      if (onSaveSuccess) onSaveSuccess(record);

      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch (err) {
      alert('Could not save to local storage: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-8 seeing-shadow border border-[#E4E4E7] relative gate-enter"
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

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#F6EEE8] text-[#B75D29] flex items-center justify-center border border-[#B75D29]/20 shadow-sm">
            <Save size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-serif text-[#2A2A2A]">Save Circuit</h3>
            <p className="text-sm text-[#71717A]">
              Store in your browser's local storage
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Circuit Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-1.5">
              Circuit Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Entanglement Experiment"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E4E4E7] focus:border-[#B75D29] focus:ring-2 focus:ring-[#B75D29]/20 outline-none text-[#2A2A2A] text-sm font-medium transition-all"
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes on the circuit or expected statevector..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#E4E4E7] focus:border-[#B75D29] focus:ring-2 focus:ring-[#B75D29]/20 outline-none text-[#2A2A2A] text-sm transition-all resize-none"
            />
          </div>

          {/* Gates Preview Chips */}
          <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E4E4E7]">
            <div className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Circuit Summary</span>
              <span>{gates.length} Gates</span>
            </div>
            {gates.length === 0 ? (
              <p className="text-xs text-[#71717A] italic">Empty circuit</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {gates.map((g, idx) => (
                  <span
                    key={g.id || idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-[#B75D29]/30 text-[#B75D29] font-mono text-xs rounded-md shadow-xs"
                  >
                    <span className="font-bold">{g.type.toUpperCase()}</span>
                    <span className="text-[10px] text-[#71717A]">
                      {g.type === 'cx' || g.type === 'swap' ? `q${g.control}→q${g.target}` : `q${g.qubit}`}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={saved || !name.trim()}
              className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer ${
                saved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-[#B75D29] to-[#9A4C20] hover:from-[#A65324] hover:to-[#8B431C] text-white shadow-[#B75D29]/20 disabled:opacity-50'
              }`}
            >
              {saved ? (
                <>
                  <Check size={18} />
                  Saved Successfully!
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save to Local Storage
                </>
              )}
            </button>

            {onOpenSavedList && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSavedList();
                }}
                className="w-full py-2.5 text-xs text-[#71717A] hover:text-[#B75D29] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FolderHeart size={14} />
                Browse all saved circuits
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
