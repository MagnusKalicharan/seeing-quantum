import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, Lock, Edit3, Shield, Globe, Sparkles } from 'lucide-react';
import { buildShareLink, copyTextToClipboard } from './circuitStorage';

export default function ShareModal({ isOpen, onClose, circuitName, gates }) {
  const [accessMode, setAccessMode] = useState('readonly'); // 'readonly' | 'write'
  const [name, setName] = useState(circuitName || 'Quantum Circuit');
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    setName(circuitName || 'Quantum Circuit');
  }, [circuitName, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const url = buildShareLink(name, gates, accessMode);
      setShareUrl(url);
      setCopied(false);
    }
  }, [isOpen, name, gates, accessMode]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyTextToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenLink = () => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full p-8 seeing-shadow border border-[#E4E4E7] relative gate-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#71717A] hover:text-[#2A2A2A] flex items-center justify-center transition-colors"
          title="Close"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#F6EEE8] text-[#B75D29] flex items-center justify-center border border-[#B75D29]/20 shadow-sm">
            <Globe size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-serif text-[#2A2A2A]">Share Circuit</h3>
            <p className="text-sm text-[#71717A]">
              Create an instant shareable link with access control permissions
            </p>
          </div>
        </div>

        {/* Circuit Title Field */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-1.5">
            Circuit Title
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Entanglement & Bell State"
            className="w-full px-4 py-2.5 rounded-xl border border-[#E4E4E7] focus:border-[#B75D29] focus:ring-2 focus:ring-[#B75D29]/20 outline-none text-[#2A2A2A] text-sm font-medium transition-all"
          />
        </div>

        {/* Access Permissions Choice: Read-Only vs Write-Only / Editable */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2.5">
            Access Permissions
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Read-Only Option */}
            <div
              onClick={() => setAccessMode('readonly')}
              className={`cursor-pointer rounded-2xl p-4 border transition-all relative ${
                accessMode === 'readonly'
                  ? 'border-[#B75D29] bg-[#FFF7F2] shadow-sm ring-1 ring-[#B75D29]'
                  : 'border-[#E4E4E7] bg-white hover:border-[#D4D4D8]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-medium text-[#2A2A2A] text-sm">
                  <Lock size={16} className={accessMode === 'readonly' ? 'text-[#B75D29]' : 'text-[#71717A]'} />
                  <span>Read-Only</span>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  accessMode === 'readonly' ? 'bg-[#B75D29] text-white' : 'bg-[#F4F4F5] text-[#71717A]'
                }`}>
                  Viewer
                </span>
              </div>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Recipients can simulate & observe probabilities and 3D Bloch states. Circuit gates are locked against accidental edits.
              </p>
            </div>

            {/* Write-Only / Editable Option */}
            <div
              onClick={() => setAccessMode('write')}
              className={`cursor-pointer rounded-2xl p-4 border transition-all relative ${
                accessMode === 'write'
                  ? 'border-[#B75D29] bg-[#FFF7F2] shadow-sm ring-1 ring-[#B75D29]'
                  : 'border-[#E4E4E7] bg-white hover:border-[#D4D4D8]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-medium text-[#2A2A2A] text-sm">
                  <Edit3 size={16} className={accessMode === 'write' ? 'text-[#B75D29]' : 'text-[#71717A]'} />
                  <span>Write / Editable</span>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  accessMode === 'write' ? 'bg-[#B75D29] text-white' : 'bg-[#F4F4F5] text-[#71717A]'
                }`}>
                  Editor
                </span>
              </div>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Recipients can freely modify, add, or delete gates and simulate different circuit states in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Generated Shareable Link Field */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-1.5 flex justify-between items-center">
            <span>Shareable URL</span>
            <span className="text-[11px] normal-case text-[#B75D29] font-normal flex items-center gap-1">
              <Sparkles size={12} />
              Self-contained link (no sign-in required)
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 bg-[#F4F4F5] text-[#2A2A2A] text-xs font-mono px-3.5 py-3 rounded-xl border border-[#E4E4E7] focus:outline-none select-all truncate"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-5 py-3 rounded-xl font-medium text-sm transition-all shadow-sm active:scale-95 shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-gradient-to-r from-[#B75D29] to-[#9A4C20] hover:from-[#A65324] hover:to-[#8B431C] text-white shadow-[#B75D29]/20'
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer info & test preview */}
        <div className="pt-4 border-t border-[#E4E4E7] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#71717A] flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{gates.length} {gates.length === 1 ? 'gate' : 'gates'} encoded • 2 Qubits</span>
          </div>

          <button
            onClick={handleOpenLink}
            className="flex items-center gap-1.5 text-xs text-[#B75D29] hover:text-[#8C461F] font-medium hover:underline cursor-pointer"
          >
            <span>Open preview in new tab</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
