import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ArrowLeft } from 'lucide-react';
import WorkbenchBackground from './WorkbenchBackground';

const ACTS = [
  {
    id: 1,
    title: 'Act 1: Quantization of Spin',
    question: 'A beam of particles is fired through a magnetic field oriented along the Z-axis. What will the landing pattern look like?',
    options: ['A continuous spread (smear)', 'Exactly two distinct clusters'],
    correct: 1, // index of option
    setup: { magnets: [{ pos: 0, axis: 'Z' }], blockDown: false }
  },
  {
    id: 2,
    title: 'Act 2: A Different Basis',
    question: 'We filter out the down-spins. The remaining particles are definitely Z-up. We now pass them through a second magnet oriented along the X-axis. What happens?',
    options: ['They all go X-up', 'They ignore the X magnet', 'They split 50/50 X-up and X-down'],
    correct: 2,
    setup: { magnets: [{ pos: -4, axis: 'Z' }, { pos: 2, axis: 'X' }], blockDown: true }
  },
  {
    id: 3,
    title: 'Act 3: The Impossible Filter',
    question: 'We now take ONLY the X-up particles from Act 2, and pass them through a THIRD magnet, back on the Z-axis. Remember, these were filtered as Z-up in Act 1. What happens?',
    options: ['They all go Z-up (they remember)', 'They split 50/50 Z-up and Z-down'],
    correct: 1,
    setup: { magnets: [{ pos: -6, axis: 'Z' }, { pos: 0, axis: 'X' }, { pos: 6, axis: 'Z' }], blockDown: true, blockXDown: true }
  }
];

export default function ModuleFilter({ onBack }) {
  const [actIdx, setActIdx] = useState(0);
  const [stage, setStage] = useState('predict'); // predict, fire, reveal
  const [prediction, setPrediction] = useState(null);
  const act = ACTS[actIdx];

  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const particlesRef = useRef([]);

  // Init Three.js
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);

    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(0, 8, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffeedd, 1);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    // Groups
    const magnetsGroup = new THREE.Group();
    scene.add(magnetsGroup);
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);
    const screensGroup = new THREE.Group();
    scene.add(screensGroup);

    sceneRef.current = { scene, camera, renderer, controls, magnetsGroup, particlesGroup, screensGroup };

    let rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      
      // Update particles
      const toRemove = [];
      particlesRef.current.forEach(p => {
        p.t += 0.015;
        if (p.t >= 1) {
          toRemove.push(p);
          // Add landing dot
          if (p.mesh.parent && p.t <= 1.1 && !p.blocked) {
             const dotGeo = new THREE.SphereGeometry(0.1, 8, 8);
             const dotMat = new THREE.MeshBasicMaterial({ color: 0x88ccff });
             const dot = new THREE.Mesh(dotGeo, dotMat);
             dot.position.copy(p.mesh.position);
             screensGroup.add(dot);
             p.blocked = true; // prevent multiple dots
          }
        } else {
          // Path logic
          // x goes from startX to endX
          const currentX = THREE.MathUtils.lerp(-10, 10, p.t);
          p.mesh.position.x = currentX;

          // Magnet deflections
          let currentZ = 0;
          let currentY = 0;
          let blocked = false;

          // Track state
          let stateZ = p.initialZ;
          let stateX = p.initialX;

          ACTS[actIdx].setup.magnets.forEach((mag, i) => {
             // If particle passed this magnet
             if (currentX > mag.pos) {
                // Collapse state based on magnet axis
                if (mag.axis === 'Z') {
                  // If it doesn't have a definite Z, collapse it
                  if (stateZ === 0) {
                     // randomly collapse (seeded by particle id to be deterministic)
                     stateZ = (p.id % 2 === 0) ? 1 : -1;
                     stateX = 0; // erase X
                  }
                  currentY = stateZ * 2;
                } else if (mag.axis === 'X') {
                  if (stateX === 0) {
                     stateX = (p.id % 3 === 0) ? 1 : -1; // random
                     stateZ = 0; // erase Z
                  }
                  currentZ = stateX * 2;
                }

                // Blockers
                if (mag.axis === 'Z' && ACTS[actIdx].setup.blockDown && stateZ === -1) {
                   if (currentX > mag.pos + 2) blocked = true;
                }
                if (mag.axis === 'X' && ACTS[actIdx].setup.blockXDown && stateX === -1) {
                   if (currentX > mag.pos + 2) blocked = true;
                }
             }
          });

          if (blocked) {
            p.mesh.visible = false;
          } else {
            // Smoothly lerp towards target Y/Z to simulate gradual deflection
            p.mesh.position.y = THREE.MathUtils.lerp(p.mesh.position.y, currentY, 0.2);
            p.mesh.position.z = THREE.MathUtils.lerp(p.mesh.position.z, currentZ, 0.2);
          }
        }
      });

      toRemove.forEach(p => {
        particlesGroup.remove(p.mesh);
        particlesRef.current = particlesRef.current.filter(x => x !== p);
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [actIdx]);

  // Rebuild scene for current act
  useEffect(() => {
    const { magnetsGroup, screensGroup, particlesGroup } = sceneRef.current;
    if (!magnetsGroup) return;

    // Clear old
    while (magnetsGroup.children.length) magnetsGroup.remove(magnetsGroup.children[0]);
    while (screensGroup.children.length) screensGroup.remove(screensGroup.children[0]);
    while (particlesGroup.children.length) particlesGroup.remove(particlesGroup.children[0]);
    particlesRef.current = [];

    // Build magnets
    ACTS[actIdx].setup.magnets.forEach((mag, i) => {
      const isZ = mag.axis === 'Z';
      
      const boxGeo = new THREE.BoxGeometry(1.5, isZ ? 6 : 1.5, isZ ? 1.5 : 6);
      const boxMat = new THREE.MeshStandardMaterial({ 
        color: isZ ? 0xcc4444 : 0x44cc44, 
        transparent: true, 
        opacity: 0.6 
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(mag.pos, 0, 0);
      
      // Label
      const createLabel = (text, y, z) => {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.font = 'bold 64px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 64);
        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(mag.pos, y, z);
        sprite.scale.set(1.5, 1.5, 1.5);
        return sprite;
      };

      if (isZ) {
        magnetsGroup.add(createLabel('N', 3.5, 0));
        magnetsGroup.add(createLabel('S', -3.5, 0));
      } else {
        magnetsGroup.add(createLabel('N', 0, 3.5));
        magnetsGroup.add(createLabel('S', 0, -3.5));
      }
      
      magnetsGroup.add(box);

      // Blockers
      if (isZ && ACTS[actIdx].setup.blockDown) {
        const blocker = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 2), new THREE.MeshBasicMaterial({ color: 0x222222 }));
        blocker.position.set(mag.pos + 2, -1.5, 0);
        magnetsGroup.add(blocker);
      }
      if (!isZ && ACTS[actIdx].setup.blockXDown) {
        const blocker = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 3), new THREE.MeshBasicMaterial({ color: 0x222222 }));
        blocker.position.set(mag.pos + 2, 0, -1.5);
        magnetsGroup.add(blocker);
      }
    });

    // Screen at end
    const screenGeo = new THREE.BoxGeometry(0.2, 8, 8);
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x334455, transparent: true, opacity: 0.8 });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(10, 0, 0);
    magnetsGroup.add(screenMesh);

  }, [actIdx]);

  const fireBatch = () => {
    setStage('fire');
    const { particlesGroup } = sceneRef.current;
    
    let count = 0;
    const interval = setInterval(() => {
      if (count >= 30) {
        clearInterval(interval);
        setTimeout(() => setStage('reveal'), 2000);
        return;
      }
      
      const geo = new THREE.SphereGeometry(0.15, 8, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x4488ff, emissiveIntensity: 0.8 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(-10, 0, 0);
      particlesGroup.add(mesh);

      particlesRef.current.push({
        id: Math.floor(Math.random() * 100000),
        mesh,
        t: 0,
        initialZ: 0, // 0 = undefined, 1 = up, -1 = down
        initialX: 0
      });
      
      count++;
    }, 100); // staggered firing
  };

  const getRevealText = () => {
    if (actIdx === 0) return "There's no in-between. Just like the atom's energy levels, spin only comes in fixed, discrete outcomes. It's quantized.";
    if (actIdx === 1) return "These particles were definitely Z-up a moment ago. Measured on a different axis, that same state is a genuine 50/50 combination — not secretly one value you didn't know, but an actual combination that only becomes definite at the moment of measurement.";
    if (actIdx === 2) return "Measuring along X didn't just reveal a new fact — it erased the old one. Z and X can't both be known at once. This is the uncertainty principle, not as an abstract formula, but as something that just happened in front of you.";
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
          <span className="text-xs font-mono text-[#B75D29] uppercase tracking-widest">Foundation 2</span>
          <h1 className="text-lg font-serif text-[#2A2A2A]">The Impossible Filter</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden z-10 relative">
        
        {/* 3D Viewport */}
        <div ref={mountRef} className="flex-1 relative bg-[#080810] flex items-center justify-center overflow-hidden">
          <div className="absolute top-4 left-4 text-white/50 font-mono text-[10px] uppercase tracking-widest">
            3D Apparatus · Drag to rotate
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[420px] bg-white border-l border-[#E4E4E7] flex flex-col overflow-y-auto">
          <div className="p-8 space-y-6">
            <div>
              <div className="text-[10px] font-mono text-[#B75D29] uppercase tracking-widest mb-2">{act.title}</div>
              <h2 className="text-lg font-serif text-[#2A2A2A] leading-snug mb-4">{act.question}</h2>
            </div>

            {stage === 'predict' && (
              <div className="space-y-3">
                {act.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setPrediction(i)}
                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all ${
                      prediction === i 
                        ? 'border-[#B75D29] bg-[#FFF7F2] text-[#B75D29] font-medium' 
                        : 'border-[#E4E4E7] hover:border-[#A1A1AA] text-[#71717A]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}

                <button
                  disabled={prediction === null}
                  onClick={fireBatch}
                  className="w-full mt-4 py-3 bg-[#2A2A2A] disabled:bg-[#E4E4E7] text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Fire Particles
                </button>
              </div>
            )}

            {stage === 'fire' && (
              <div className="py-8 text-center text-[#B75D29] font-mono text-sm animate-pulse">
                Firing sequence in progress...
              </div>
            )}

            {stage === 'reveal' && (
              <div className="space-y-6 animate-[fadeIn_0.5s_ease]">
                <div className={`p-4 rounded-xl border text-sm font-medium ${
                  prediction === act.correct 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-[#FFF7F2] text-[#B75D29] border-[#B75D29]/30'
                }`}>
                  {prediction === act.correct ? '✓ Good intuition.' : '✗ Not quite — but that is the point.'}
                </div>
                
                <p className="text-[#2A2A2A] leading-relaxed">
                  {getRevealText()}
                </p>

                {actIdx < 2 ? (
                  <button
                    onClick={() => {
                      setActIdx(a => a + 1);
                      setStage('predict');
                      setPrediction(null);
                    }}
                    className="w-full py-3 bg-[#B75D29] hover:bg-[#9A4C20] text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Proceed to {ACTS[actIdx+1].title} →
                  </button>
                ) : (
                  <div className="p-5 bg-[#FAFAFA] rounded-xl border border-[#E4E4E7] mt-8">
                    <h4 className="text-sm font-bold text-[#2A2A2A] mb-2">Bridge to Qubits</h4>
                    <p className="text-xs text-[#71717A] leading-relaxed mb-4">
                      A spin-1/2 particle like this is the simplest real 2-level quantum system there is — which makes it one of the most direct physical examples of a qubit. Everything you just saw — discrete outcomes, superposition in a different basis, and measurement disturbing prior information — is exactly the physics your circuit builder is simulating mathematically from here on.
                    </p>
                    <button
                      onClick={onBack}
                      className="w-full py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
      
    </div>
  );
}
