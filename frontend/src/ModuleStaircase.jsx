import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Target, Zap } from 'lucide-react';

import WorkbenchBackground from './WorkbenchBackground';

const LEVELS = {
  1: { e: -13.6, r: 45 },
  2: { e: -3.4, r: 95 },
  3: { e: -1.51, r: 145 },
  4: { e: -0.85, r: 195 },
};

export default function ModuleStaircase({ onBack }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);


  const [currentN, setCurrentN] = useState(1);
  const [isIonized, setIsIonized] = useState(false);
  const [sliderValue, setSliderValue] = useState(10.2);
  const [targetState, setTargetState] = useState('2');
  const [message, setMessage] = useState("Energy isn't a dial you can set anywhere — try to find the exact energies this atom will actually accept.");

  // Mutable refs for the animation loop to avoid stale closures and React re-renders
  const atomRef = useRef({
    n: 1,
    radius: 45,
    angle: 0,
    ionized: false,
    x: 0, y: 0,
    vx: 0, vy: 0,
    decayTimer: 0
  });
  const photonsRef = useRef([]);
  const emissionsRef = useRef([]);

  // Setup Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let rafId;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2 + 20; // shifted slightly right
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      const atom = atomRef.current;

      // 1. Draw Orbits
      ctx.lineWidth = 1.5;
      [1, 2, 3, 4].forEach(n => {
        const isCurrent = n === atom.n && !atom.ionized;
        ctx.strokeStyle = isCurrent ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)';
        ctx.setLineDash(isCurrent ? [] : [4, 6]);
        ctx.beginPath();
        ctx.arc(cx, cy, LEVELS[n].r, 0, Math.PI * 2);
        ctx.stroke();

        // Orbit Labels
        if (n === 1 || n === 4) {
           ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
           ctx.font = '10px monospace';
           ctx.fillText(`n=${n}`, cx + LEVELS[n].r + 4, cy - 4);
        }
      });
      ctx.setLineDash([]);

      // 2. Draw Nucleus
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. Atom Physics & Electron
      atom.angle += 0.02;
      const targetR = atom.ionized ? atom.radius : LEVELS[atom.n].r;
      
      if (!atom.ionized) {
        atom.radius += (targetR - atom.radius) * 0.1;
        atom.x = cx + Math.cos(atom.angle) * atom.radius;
        atom.y = cy + Math.sin(atom.angle) * atom.radius;

        // Decay logic
        if (atom.n > 1) {
          atom.decayTimer -= 16;
          if (atom.decayTimer <= 0) {
            atom.n = 1;
            emissionsRef.current.push({ x: atom.x, y: atom.y, angle: Math.random() * Math.PI * 2 });
            handleEvent('decay');
          }
        }
      } else {
        // Flying away
        atom.x += atom.vx;
        atom.y += atom.vy;
      }

      // Draw Electron
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#38bdf8';
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 4. Update & Draw Incoming Photons
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#facc15';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      
      for (let i = photonsRef.current.length - 1; i >= 0; i--) {
        let p = photonsRef.current[i];
        if (!p.absorbed) p.x += 8;
        p.y = cy + Math.sin(p.x * 0.1) * 6; // wave motion

        // Collision Check at the orbit edge (or nucleus if n=1)
        if (p.x >= cx - atom.radius && !p.absorbed) {
          const currentE = atom.ionized ? 0 : LEVELS[atom.n].e;
          
          if (!atom.ionized) {
            if (p.energy >= Math.abs(currentE) - 0.05) {
              // Ionization!
              p.absorbed = true;
              atom.ionized = true;
              atom.vx = 8; 
              atom.vy = -3;
              handleEvent('ionize');
            } else {
              // Check gap matches
              let matched = -1;
              for (let n = atom.n + 1; n <= 4; n++) {
                if (Math.abs(p.energy - (LEVELS[n].e - currentE)) <= 0.15) {
                  matched = n;
                  break;
                }
              }
              if (matched !== -1) {
                p.absorbed = true;
                atom.n = matched;
                atom.decayTimer = 3000; // 3 seconds before spontaneous emission
                handleEvent('absorb', matched);
              }
            }
          }
        }

        // Miss Check (passed the center)
        if (p.x >= cx && !p.absorbed && !p.missTriggered) {
          p.missTriggered = true;
          handleEvent('miss');
        }

        // Draw Photon
        if (!p.absorbed) {
          ctx.beginPath();
          ctx.moveTo(p.x - 20, cy + Math.sin((p.x - 20) * 0.1) * 6);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cleanup
        if (p.x > w + 100 || p.absorbed) {
          photonsRef.current.splice(i, 1);
        }
      }

      // 5. Update & Draw Emissions
      ctx.shadowColor = '#38bdf8';
      ctx.strokeStyle = '#38bdf8';
      for (let i = emissionsRef.current.length - 1; i >= 0; i--) {
        let em = emissionsRef.current[i];
        em.x += Math.cos(em.angle) * 6;
        em.y += Math.sin(em.angle) * 6;
        
        ctx.beginPath();
        ctx.moveTo(em.x - Math.cos(em.angle)*20, em.y - Math.sin(em.angle)*20);
        ctx.lineTo(em.x, em.y);
        ctx.stroke();
        
        if (em.x < -100 || em.x > w + 100 || em.y < -100 || em.y > h + 100) {
          emissionsRef.current.splice(i, 1);
        }
      }
      ctx.shadowBlur = 0;

      rafId = requestAnimationFrame(draw);
    };
    
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Events from Canvas bubbling to React UI
  const handleEvent = useCallback((type, data) => {
    if (type === 'miss') {
      setMessage("The photon passed right through! The energy didn't match any allowed gap from the current state.");
    } else if (type === 'absorb') {
      setCurrentN(data);
      setMessage(`Absorption! The energy perfectly matched the gap to orbit n=${data}. The electron jumped up!`);
    } else if (type === 'ionize') {
      setIsIonized(true);
      setMessage("Ionization! You provided enough energy to overcome the nucleus's binding energy completely. The electron is free.");
    } else if (type === 'decay') {
      setCurrentN(1);
      setMessage("Spontaneous emission! The electron couldn't stay excited forever and dropped back to the ground state, emitting a photon.");
    }
  }, []);

  const firePhoton = () => {
    if (isIonized) return;
    photonsRef.current.push({
      x: -50,
      energy: Number(sliderValue),
      absorbed: false,
      missTriggered: false
    });
  };

  const calculateExactEnergy = () => {
    if (isIonized) return;
    const currentE = LEVELS[currentN].e;
    
    if (targetState === 'ion') {
      setSliderValue(Math.abs(currentE).toFixed(1));
    } else {
      const targetN = Number(targetState);
      if (targetN <= currentN) {
        alert("You must select a state higher than the current state to absorb a photon!");
        return;
      }
      const gap = LEVELS[targetN].e - currentE;
      setSliderValue(gap.toFixed(1));
    }
  };

  const resetAtom = () => {
    atomRef.current.n = 1;
    atomRef.current.ionized = false;
    atomRef.current.radius = LEVELS[1].r;
    setIsIonized(false);
    setCurrentN(1);
    setMessage("A new electron was captured into the ground state (n=1).");
  };

  return (
    <div className="min-h-screen bg-transparent text-[#2A2A2A] font-sans flex flex-col relative">
      <WorkbenchBackground />
      
      {/* ── Top nav bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-[#E4E4E7] bg-white/90 backdrop-blur-sm z-30 relative seeing-shadow">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-[#71717A] hover:text-[#B75D29] font-medium transition-colors bg-[#F4F4F5] px-3 py-1.5 rounded-full text-sm border border-[#E4E4E7]">
              <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Back to Home
            </button>
          )}
          <div className="h-5 w-px bg-[#E4E4E7]" />
          <span className="text-xs font-mono text-[#B75D29] uppercase tracking-widest">Foundation 1</span>
          <h1 className="text-lg font-serif text-[#2A2A2A]">Quantisation</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden z-10 relative">
        
        {/* Left: Experiment Canvas */}
        <div className="flex-1 relative bg-[#080810]" ref={containerRef}>
          <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
          <div className="absolute top-6 left-6 text-white/50 font-mono text-[10px] uppercase tracking-widest">
            Bohr Model Simulation
          </div>
        </div>

        {/* Right: Controls & Narrative */}
        <div className="w-[420px] bg-white border-l border-[#E4E4E7] flex flex-col overflow-y-auto">
          <div className="p-8 space-y-8">
            
            {/* Atom Status */}
            <div className="p-5 bg-[#FAFAFA] rounded-xl border border-[#E4E4E7] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest mb-1">Electron State</div>
                <div className="text-xl font-serif text-[#2A2A2A]">
                  {isIonized ? 'Free (Ionized)' : `n = ${currentN}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest mb-1">Energy</div>
                <div className="text-xl font-mono text-[#B75D29]">
                  {isIonized ? '0.00 eV' : `${LEVELS[currentN].e.toFixed(2)} eV`}
                </div>
              </div>
            </div>

            {/* Fire Controls */}
            <div>
              <div className="text-[10px] font-mono text-[#B75D29] uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap size={14} /> Fire Photon
              </div>
              <div className="flex justify-between text-sm font-medium text-[#2A2A2A] mb-4">
                <span>Energy</span>
                <span className="text-[#B75D29] font-mono">{Number(sliderValue).toFixed(1)} eV</span>
              </div>
              <input 
                type="range" 
                min="0" max="15" step="0.1"
                value={sliderValue} 
                onChange={e => setSliderValue(e.target.value)}
                disabled={isIonized}
                className="w-full accent-[#B75D29] cursor-pointer disabled:opacity-50"
              />
              
              <button 
                onClick={firePhoton}
                disabled={isIonized}
                className="mt-6 w-full py-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] disabled:bg-[#E4E4E7] text-white rounded-xl text-sm font-medium transition-colors"
              >
                Fire Photon
              </button>
            </div>

            {/* Hint Calculator */}
            <div className="p-5 bg-[#FFF7F2] rounded-xl border border-[#B75D29]/20 space-y-4">
              <div className="text-[10px] font-mono text-[#B75D29] uppercase tracking-widest flex items-center gap-2">
                <Target size={14} /> Transition Calculator
              </div>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Want to reach a specific state? Calculate the exact energy gap required from the current state.
              </p>
              
              <div className="flex gap-3">
                <select 
                  value={targetState} 
                  onChange={e => setTargetState(e.target.value)}
                  disabled={isIonized}
                  className="flex-1 bg-white border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm text-[#2A2A2A] outline-none focus:border-[#B75D29]"
                >
                  <option value="2">State n = 2</option>
                  <option value="3">State n = 3</option>
                  <option value="4">State n = 4</option>
                  <option value="ion">Ionize (Leave Atom)</option>
                </select>
                <button 
                  onClick={calculateExactEnergy}
                  disabled={isIonized}
                  className="px-4 py-2 bg-white hover:bg-[#FAFAFA] disabled:opacity-50 border border-[#E4E4E7] text-[#B75D29] rounded-lg text-sm font-medium transition-colors"
                >
                  Calculate
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-[#E4E4E7]">
              <div className="text-[10px] font-mono text-[#B75D29] uppercase tracking-widest mb-3">Observation</div>
              <p className="text-sm text-[#2A2A2A] leading-relaxed min-h-[60px]">
                {message}
              </p>
              
              {isIonized && (
                <button 
                  onClick={resetAtom}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#2A2A2A] rounded-xl text-sm font-medium transition-colors"
                >
                  <RotateCcw size={16} /> Reset Atom
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
