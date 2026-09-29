import React, { useEffect, useRef } from 'react';

const ACCENT = '#B75D29';
const ACCENT_LIGHT = 'rgba(183,93,41,0.15)';
const WIRE_COLOR = 'rgba(180,160,140,0.5)';
const TEXT_DARK = '#2A2A2A';
const GATE_LABELS = ['H', 'X', 'CNOT', 'T', 'S', 'Z', 'Y', 'H', 'CNOT', 'T'];

function QuantumCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const NUM_QUBITS = 5;
    const GATE_SIZE = 32;
    const PHASE_SPEED = 0.6;

    // Each qubit wire has its own wave phase & gates
    const wires = Array.from({ length: NUM_QUBITS }, (_, i) => ({
      y: 0, // computed each frame
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.3,
      amplitude: 10 + Math.random() * 14,
      gates: []
    }));

    // Spawn gates periodically
    const gatePool = [];
    let lastGateTime = 0;
    const GATE_INTERVAL = 900; // ms

    let startTime = null;

    function spawnGate(now) {
      const wireIdx = Math.floor(Math.random() * NUM_QUBITS);
      const label = GATE_LABELS[Math.floor(Math.random() * GATE_LABELS.length)];
      gatePool.push({
        wire: wireIdx,
        label,
        x: canvas.width + GATE_SIZE,
        born: now,
        alpha: 0,
      });
    }

    function drawWaveFunction(ctx, x0, x1, cy, phase, amplitude, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const grad = ctx.createLinearGradient(x0, 0, x1, 0);
      grad.addColorStop(0, 'rgba(183,93,41,0)');
      grad.addColorStop(0.2, `rgba(183,93,41,${alpha * 0.6})`);
      grad.addColorStop(0.8, `rgba(183,93,41,${alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(183,93,41,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const steps = 200;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = x0 + t * (x1 - x0);
        const y = cy + Math.sin(t * Math.PI * 6 + phase) * amplitude
                     * Math.sin(t * Math.PI); // envelope
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawGate(ctx, x, cy, label, alpha) {
      const w = label === 'CNOT' ? 46 : GATE_SIZE;
      const h = GATE_SIZE;
      ctx.save();
      ctx.globalAlpha = alpha;

      // Shadow
      ctx.shadowColor = ACCENT;
      ctx.shadowBlur = 10 * alpha;

      // Box
      ctx.beginPath();
      ctx.roundRect(x - w / 2, cy - h / 2, w, h, 6);
      ctx.fillStyle = '#FFF7F2';
      ctx.fill();
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.shadowBlur = 0;
      ctx.fillStyle = ACCENT;
      ctx.font = `bold ${label === 'CNOT' ? 11 : 13}px 'Fira Code', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, cy);

      ctx.restore();
    }

    function drawProbabilityBars(ctx, now) {
      const barW = 80;
      const barH = 14;
      const x = canvas.width - 130;
      const startY = (canvas.height - NUM_QUBITS * (barH + 10)) / 2;
      const states = ['|00⟩', '|01⟩', '|10⟩', '|11⟩'];
      const t = now / 1000;

      ctx.save();
      ctx.font = '11px "Fira Code", monospace';
      ctx.textBaseline = 'middle';

      states.forEach((s, i) => {
        const prob = 0.1 + 0.4 * Math.abs(Math.sin(t * 0.5 + i * 1.2));
        const y = startY + i * 34;

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#E4E4E7';
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 4);
        ctx.fill();

        ctx.globalAlpha = 0.9;
        const barGrad = ctx.createLinearGradient(x, 0, x + barW * prob, 0);
        barGrad.addColorStop(0, ACCENT);
        barGrad.addColorStop(1, '#F5A05A');
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW * prob, barH, 4);
        ctx.fill();

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = TEXT_DARK;
        ctx.textAlign = 'right';
        ctx.fillText(s, x - 8, y + barH / 2);

        ctx.textAlign = 'left';
        ctx.fillText(`${(prob * 100).toFixed(0)}%`, x + barW + 6, y + barH / 2);
      });

      ctx.restore();
    }

    function draw(timestamp) {
      if (!startTime) startTime = timestamp;
      const now = timestamp - startTime;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      const WIRE_START = 80;
      const WIRE_END = W - 200;
      const WIRE_SPACING = H / (NUM_QUBITS + 1);

      // Draw qubit labels + wires + wavefunctions
      wires.forEach((wire, i) => {
        wire.y = WIRE_SPACING * (i + 1);
        wire.phase += wire.speed * 0.016;

        // Wire line
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = WIRE_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(WIRE_START, wire.y);
        ctx.lineTo(WIRE_END, wire.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Wave function
        drawWaveFunction(ctx, WIRE_START + 10, WIRE_END - 10, wire.y, wire.phase, wire.amplitude, 0.6);

        // Qubit label
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.font = "italic 14px 'Lora', Georgia, serif";
        ctx.fillStyle = TEXT_DARK;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`|ψ${i}⟩`, WIRE_START - 8, wire.y);
        ctx.restore();
      });

      // Spawn & draw gates
      if (now - lastGateTime > GATE_INTERVAL) {
        spawnGate(now);
        lastGateTime = now;
      }

      const speed = 90; // px per second
      for (let i = gatePool.length - 1; i >= 0; i--) {
        const g = gatePool[i];
        const elapsed = (now - g.born) / 1000;
        g.x = (canvas.width + GATE_SIZE) - elapsed * speed;

        const fadeIn = Math.min(1, elapsed / 0.3);
        const fadeOut = g.x < WIRE_START + 60 ? Math.max(0, (g.x - WIRE_START) / 60) : 1;
        g.alpha = fadeIn * fadeOut;

        const wireY = wires[g.wire].y;
        drawGate(ctx, g.x, wireY, g.label, g.alpha);

        if (g.x < WIRE_START - GATE_SIZE) {
          gatePool.splice(i, 1);
        }
      }

      // Probability bars on the right
      drawProbabilityBars(ctx, now);

      // Decorative circuit label
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.font = "700 11px 'Fira Code', monospace";
      ctx.fillStyle = ACCENT;
      ctx.letterSpacing = '3px';
      ctx.fillText('QUANTUM CIRCUIT', WIRE_START, 28);
      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}

export default function Home({ onNavigate }) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#FAFAFA]">
      {/* Ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF7F2] via-[#FAFAFA] to-[#FAFAFA] pointer-events-none" />

      {/* Quantum Circuit Animation */}
      <div className="absolute inset-0 z-0">
        <QuantumCanvas />
      </div>

      {/* Center Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center space-y-6 max-w-3xl px-6 pointer-events-auto">

          <h1 className="text-7xl md:text-8xl font-serif text-[#2A2A2A] tracking-tight leading-none mb-6">
            Seeing<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#B75D29] to-[#8C461F]">Quantum.</span>
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-12 text-left w-full max-w-6xl mx-auto">
            
            {/* New Foundation Modules */}
            <button onClick={() => onNavigate('staircase')} className="group bg-white/80 backdrop-blur-md border border-[#E4E4E7] p-6 rounded-2xl hover:border-[#B75D29] hover:shadow-lg transition-all text-left relative overflow-hidden">
              <div className="text-xs font-mono text-[#B75D29] mb-2 uppercase tracking-widest">Foundation 1</div>
              <h3 className="text-lg font-serif text-[#2A2A2A] mb-2">Quantisation</h3>
              <p className="text-xs text-[#71717A] leading-relaxed">Discover quantization by firing photons at an atom's discrete energy levels.</p>
            </button>

            <button onClick={() => onNavigate('filter')} className="group bg-white/80 backdrop-blur-md border border-[#E4E4E7] p-6 rounded-2xl hover:border-[#B75D29] hover:shadow-lg transition-all text-left relative overflow-hidden">
              <div className="text-xs font-mono text-[#B75D29] mb-2 uppercase tracking-widest">Foundation 2</div>
              <h3 className="text-lg font-serif text-[#2A2A2A] mb-2">The Impossible Filter</h3>
              <p className="text-xs text-[#71717A] leading-relaxed">Send particles through sequential magnets to witness superposition and uncertainty.</p>
            </button>

            <button onClick={() => onNavigate('doubleSlit')} className="group bg-white/80 backdrop-blur-md border border-[#E4E4E7] p-6 rounded-2xl hover:border-[#B75D29] hover:shadow-lg transition-all text-left relative overflow-hidden">
              <div className="text-xs font-mono text-[#B75D29] mb-2 uppercase tracking-widest">Chapter 1</div>
              <h3 className="text-lg font-serif text-[#2A2A2A] mb-2">Wave-Particle Duality</h3>
              <p className="text-xs text-[#71717A] leading-relaxed">A 3D interactive double-slit experiment. Discover superposition and decoherence firsthand.</p>
            </button>

            <button onClick={() => onNavigate('qubit')} className="group bg-white/80 backdrop-blur-md border border-[#E4E4E7] p-6 rounded-2xl hover:border-[#B75D29] hover:shadow-lg transition-all text-left relative overflow-hidden">
              <div className="text-xs font-mono text-[#B75D29] mb-2 uppercase tracking-widest">Chapter 2</div>
              <h3 className="text-lg font-serif text-[#2A2A2A] mb-2">The Qubit</h3>
              <p className="text-xs text-[#71717A] leading-relaxed">Kets, statevectors, and the Bloch sphere — the fundamental language of quantum computation.</p>
            </button>

            <button onClick={() => onNavigate('gates')} className="group bg-white/80 backdrop-blur-md border border-[#E4E4E7] p-6 rounded-2xl hover:border-[#B75D29] hover:shadow-lg transition-all text-left relative overflow-hidden">
              <div className="text-xs font-mono text-[#B75D29] mb-2 uppercase tracking-widest">Chapter 3</div>
              <h3 className="text-lg font-serif text-[#2A2A2A] mb-2">Quantum Gates</h3>
              <p className="text-xs text-[#71717A] leading-relaxed">Explore how we manipulate qubits. Visualize rotations, phase shifts, and generalized unitary matrices.</p>
            </button>

            <button onClick={() => onNavigate('workbench')} className="group bg-gradient-to-br from-[#B75D29] to-[#8C461F] p-6 rounded-2xl shadow-lg shadow-[#B75D29]/20 hover:scale-[1.02] transition-transform text-left relative overflow-hidden">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <div className="text-xs font-mono text-white/80 mb-2 uppercase tracking-widest relative z-10">Chapter 4</div>
              <h3 className="text-lg font-serif text-white mb-2 relative z-10">Circuit Simulator</h3>
              <p className="text-xs text-white/80 leading-relaxed relative z-10">Build complete quantum circuits, observe entanglement, and trace multi-qubit probability distributions.</p>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
