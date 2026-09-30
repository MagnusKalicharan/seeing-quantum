import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import WorkbenchBackground from './WorkbenchBackground';
import { MathBlock, QuantumText } from './QuantumMath';

// ─── Physics sampling ────────────────────────────────────────────────────────
function sampleLanding(detectorOn) {
  const MAX_ITER = 5000;
  for (let i = 0; i < MAX_ITER; i++) {
    const x = (Math.random() - 0.5) * 2.0;
    let p;
    if (!detectorOn) {
      p = Math.exp(-(x * x) / (2 * 0.5 * 0.5)) * Math.pow(Math.cos(6 * x), 2);
    } else {
      const s = 0.13;
      p = (Math.exp(-Math.pow(x - 0.55, 2) / (2 * s * s)) +
           Math.exp(-Math.pow(x + 0.55, 2) / (2 * s * s))) / 2.0;
    }
    if (Math.random() < p) return x;
  }
  return 0;
}

// ─── Easing helpers ───────────────────────────────────────────────────────────
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// ─── 2D readout canvas ────────────────────────────────────────────────────────
function ReadoutPanel({ dots, detectorOn, fading }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const HIST_H = 48;
    const DOT_Y0 = HIST_H + 8;
    const DOT_AREA = H - DOT_Y0 - 18;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0A0A12';
    ctx.fillRect(0, 0, W, H);

    const toCanvasX = x => ((x + 1) / 2) * W;

    const BINS = 40;
    const counts = new Array(BINS).fill(0);
    dots.forEach(({ x }) => {
      const bin = Math.floor(((x + 1) / 2) * BINS);
      if (bin >= 0 && bin < BINS) counts[bin]++;
    });
    const maxCount = Math.max(1, ...counts);
    const barColor = detectorOn ? 'rgba(255,160,60,' : 'rgba(100,170,255,';

    counts.forEach((c, i) => {
      const bx = (i / BINS) * W;
      const bw = W / BINS - 0.5;
      const bh = (c / maxCount) * HIST_H;
      ctx.fillStyle = barColor + (0.2 + 0.7 * (c / maxCount)) + ')';
      ctx.fillRect(bx, HIST_H - bh, bw, bh);
    });

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, HIST_H); ctx.lineTo(W, HIST_H); ctx.stroke();

    ctx.strokeStyle = 'rgba(255,200,100,0.2)';
    ctx.setLineDash([3, 4]);
    [-0.55, 0.55].forEach(sx => {
      const cx = toCanvasX(sx);
      ctx.beginPath(); ctx.moveTo(cx, HIST_H); ctx.lineTo(cx, H - 16); ctx.stroke();
    });
    ctx.setLineDash([]);

    dots.forEach(({ x, yFrac }) => {
      const cx = toCanvasX(x);
      const cy = DOT_Y0 + DOT_AREA / 2 + (yFrac || 0) * DOT_AREA;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = detectorOn ? 'rgba(255,160,60,0.85)' : 'rgba(110,180,255,0.85)';
      ctx.fill();
    });

    ctx.font = '9px "Fira Code", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.textAlign = 'center';
    ctx.fillText('DETECTION SCREEN  •  ' + dots.length + ' events', W / 2, H - 4);
  }, [dots, detectorOn]);

  return (
    <canvas
      ref={canvasRef}
      width={340} height={260}
      className="rounded-xl border border-white/10 transition-opacity duration-300"
      style={{ background: '#0A0A12', opacity: fading ? 0 : 1 }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const STAGES = { PREDICT: 'predict', EXPERIMENT: 'experiment', VERDICT: 'verdict' };

const NARRATION = {
  predict: 'You are about to fire particles at a wall with two slits, one at a time. Before anything happens: what pattern do you expect to build up on the screen?',
  wave: 'Each particle was fired alone — nothing else present to interfere with. And yet stripes built up, not two bands. Each particle behaved as if it explored both slits at once, interfering with itself. This is superposition.',
  particle: 'The moment a detector finds out which slit each particle used, the stripes vanished and two plain bands appeared — the classical pattern. This is not about anyone looking. It is about information. The instant which-path information exists, superposition is destroyed. This is decoherence.',
  bridge: 'A qubit works the same way. It can hold a genuine combination of |0⟩ and |1⟩ right up until you measure it. What you just watched happen to a photon is the same physics that makes a qubit useful for computation.',
};

const TAG_CAPTION = 'The instant the detector interacts with a particle, it becomes tagged with which-path information. The other path is no longer possible — watch it vanish every time.';

export default function DoubleSlit({ onBack, onNavigate }) {
  const mountRef = useRef(null);
  const readoutDotsRef = useRef([]);
  const [readoutDots, setReadoutDots] = useState([]);
  const [detectorOn, setDetectorOn] = useState(false);
  const [stage, setStage] = useState(STAGES.PREDICT);
  const [prediction, setPrediction] = useState(null);
  const [particleCount, setParticleCount] = useState(0);
  const [autoFiring, setAutoFiring] = useState(false);
  const [narration, setNarration] = useState(NARRATION.predict);
  const [showVerdict, setShowVerdict] = useState(false);
  const [showTagCaption, setShowTagCaption] = useState(false);
  const [firstDetOnFire, setFirstDetOnFire] = useState(true);
  const [isMorphing, setIsMorphing] = useState(false);
  const [morphPhase, setMorphPhase] = useState(0);   // 0=ready, 1-6=steps, 7=done
  const [readoutFading, setReadoutFading] = useState(false);

  const autoFireRef = useRef(false);
  const detectorOnRef = useRef(false);
  const sceneRef = useRef({});
  const morphRef = useRef(null);       // Three.js objects for morph
  const morphPhaseRef = useRef(0);     // RAF-readable mirror of morphPhase
  const morphAnimRef = useRef(null);   // current lerped values (mutated by RAF each frame)
  const firstDetOnFireRef = useRef(true);

  useEffect(() => { detectorOnRef.current = detectorOn; }, [detectorOn]);
  // Keep morphPhaseRef in sync with morphPhase state so RAF can read it without stale closure
  useEffect(() => { morphPhaseRef.current = morphPhase; }, [morphPhase]);

  // ─── Three.js setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    const W = el.clientWidth, H = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.setClearColor(0x080810, 1);
    el.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(4, 3.5, 7);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080810, 0.05);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffeedd, 1.2);
    dir.position.set(5, 8, 5);
    scene.add(dir);

    // ── Source ──
    const srcGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const srcMat = new THREE.MeshStandardMaterial({ color: 0xffd580, emissive: 0xffaa00, emissiveIntensity: 2 });
    const source = new THREE.Mesh(srcGeo, srcMat);
    source.position.set(-5, 0, 0);
    scene.add(source);
    const glowGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.15 });
    source.add(new THREE.Mesh(glowGeo, glowMat));

    // ── Barrier wall ──
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x334466, metalness: 0.3, roughness: 0.7 });
    const wallH = 3, wallD = 0.25;
    const slitY = 0.28;
    const slitW = 0.28;

    const wallMeshes = [];
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(wallD, wallH / 2 - slitY, 2), wallMat);
    topWall.position.set(0, wallH / 4 + slitY, 0);
    scene.add(topWall); wallMeshes.push(topWall);

    const botWall = new THREE.Mesh(new THREE.BoxGeometry(wallD, wallH / 2 - slitY, 2), wallMat);
    botWall.position.set(0, -(wallH / 4 + slitY), 0);
    scene.add(botWall); wallMeshes.push(botWall);

    const midL = new THREE.Mesh(new THREE.BoxGeometry(wallD, slitY * 2, 2 / 2 - slitW), wallMat);
    midL.position.set(0, 0, -(slitW + (2 / 2 - slitW) / 2));
    scene.add(midL); wallMeshes.push(midL);

    const midR = new THREE.Mesh(new THREE.BoxGeometry(wallD, slitY * 2, 2 / 2 - slitW), wallMat);
    midR.position.set(0, 0, slitW + (2 / 2 - slitW) / 2);
    scene.add(midR); wallMeshes.push(midR);

    const slitEdgeMat = new THREE.MeshBasicMaterial({ color: 0x88aaff, transparent: true, opacity: 0.5 });
    [-1, 1].forEach(sign => {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(wallD + 0.05, 0.03, slitW * 2), slitEdgeMat);
      edge.position.set(0, sign * slitY, 0);
      scene.add(edge); wallMeshes.push(edge);
    });

    // ── Detection screen ──
    const screenGeo = new THREE.PlaneGeometry(3, 3);
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.rotation.y = Math.PI / 2;
    screen.position.set(5, 0, 0);
    scene.add(screen);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334466, metalness: 0.5, transparent: true, opacity: 1 });
    const frameMeshes = [];
    [[-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5]].forEach(([z, y]) => {
      const fGeo = z !== 0 ? new THREE.BoxGeometry(0.08, 3, 0.08) : new THREE.BoxGeometry(0.08, 0.08, 3);
      const f = new THREE.Mesh(fGeo, frameMat);
      f.position.set(5, y || 0, z || 0);
      scene.add(f);
      frameMeshes.push(f);
    });

    // ── Detector plane (thin glowing sheet just past the wall) ──
    const detPlaneMat = new THREE.MeshBasicMaterial({
      color: 0x44ff88, transparent: true, opacity: 0, side: THREE.DoubleSide
    });
    const detPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 3), detPlaneMat);
    detPlane.rotation.y = Math.PI / 2;
    detPlane.position.set(0.4, 0, 0); // just after the wall
    scene.add(detPlane);

    // ── Particle group + screen dots ──
    const particles = new THREE.Group();
    scene.add(particles);
    const screenDots = new THREE.Group();
    scene.add(screenDots);

    // ── Detector indicator ──
    const detGeo = new THREE.BoxGeometry(0.2, 0.2, 0.6);
    const detMat = new THREE.MeshStandardMaterial({ color: 0x334466, emissive: 0x004400, emissiveIntensity: 1, transparent: true, opacity: 1 });
    const detector = new THREE.Mesh(detGeo, detMat);
    detector.position.set(-0.1, slitY * 1.5, 0);
    scene.add(detector);
    const detLight = new THREE.PointLight(0x00ff44, 0, 1.5);
    detLight.position.set(-0.1, slitY * 1.5, 0);
    scene.add(detLight);

    // bgMeshes = everything except the wall that needs to disappear during morph
    const bgMeshes = [source, screen, detector, ...frameMeshes];
    bgMeshes.forEach(m => { 
      m.traverse(child => {
        if (child.material) { 
          child.material.transparent = true; 
          child.material._origOpacity = child.material.opacity ?? 1;
          if (child.material.emissiveIntensity !== undefined) {
            child.material._origEmissive = child.material.emissiveIntensity;
          }
        }
      });
    });

    sceneRef.current = {
      scene, renderer, camera, controls, particles, screenDots,
      detector, detMat, detLight, source, slitY, detPlane, detPlaneMat,
      wallMeshes, screenMat, bgMeshes,
    };

    // ── Animation loop ──
    let rafId;
    const clock = new THREE.Clock();

    // Phase targets for morph — indexed by morphPhase value
    // bgOp fades out the source, screen, detector and frames — leaving only the sphere
    const PHASE_TARGETS = [
      { cam:{x:4,y:3.5,z:7}, wallOp:1, bgOp:1, sphOp:0, wireOp:0, sphX:2, sphRotX:0.4, labelOp:0, arrowOp:0 },
      { cam:{x:3.7,y:3.2,z:6.5}, wallOp:1, bgOp:1, sphOp:0, wireOp:0, sphX:2, sphRotX:0.4, labelOp:0, arrowOp:0 },
      { cam:{x:3.7,y:3.2,z:6.5}, wallOp:0, bgOp:0, sphOp:0.7, wireOp:0.45, sphX:2, sphRotX:0.4, labelOp:0, arrowOp:0 },
      { cam:{x:0,y:2,z:5}, wallOp:0, bgOp:0, sphOp:0.7, wireOp:0.45, sphX:0, sphRotX:0, labelOp:0, arrowOp:0 },
      { cam:{x:0,y:2,z:5}, wallOp:0, bgOp:0, sphOp:0.7, wireOp:0.45, sphX:0, sphRotX:0, labelOp:1, arrowOp:0 },
      { cam:{x:0,y:2,z:5}, wallOp:0, bgOp:0, sphOp:0.7, wireOp:0.45, sphX:0, sphRotX:0, labelOp:1, arrowOp:1 },
      { cam:{x:0,y:2,z:5}, wallOp:0, bgOp:0, sphOp:0.7, wireOp:0.45, sphX:0, sphRotX:0, labelOp:1, arrowOp:1 },
    ];

    function animate() {
      rafId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      controls.update();

      // ── Phase-based morph: lerp current values toward phase target ────────
      const m = morphRef.current;
      const anim = morphAnimRef.current;
      if (m && anim) {
        const phase = Math.min(morphPhaseRef.current, PHASE_TARGETS.length - 1);
        const tgt = PHASE_TARGETS[phase];
        const k = 1 - Math.pow(0.008, dt); // frame-rate independent lerp, ~99% in 0.75s

        // Lerp all scalar/vector values
        anim.wallOp   = THREE.MathUtils.lerp(anim.wallOp,   tgt.wallOp,   k);
        anim.bgOp     = THREE.MathUtils.lerp(anim.bgOp,     tgt.bgOp,     k);
        anim.sphOp    = THREE.MathUtils.lerp(anim.sphOp,    tgt.sphOp,    k);
        anim.wireOp   = THREE.MathUtils.lerp(anim.wireOp,   tgt.wireOp,   k);
        anim.sphX     = THREE.MathUtils.lerp(anim.sphX,     tgt.sphX,     k);
        anim.sphRotX  = THREE.MathUtils.lerp(anim.sphRotX,  tgt.sphRotX,  k);
        anim.labelOp  = THREE.MathUtils.lerp(anim.labelOp,  tgt.labelOp,  k);
        anim.arrowOp  = THREE.MathUtils.lerp(anim.arrowOp,  tgt.arrowOp,  k);
        anim.camX     = THREE.MathUtils.lerp(anim.camX,     tgt.cam.x,    k);
        anim.camY     = THREE.MathUtils.lerp(anim.camY,     tgt.cam.y,    k);
        anim.camZ     = THREE.MathUtils.lerp(anim.camZ,     tgt.cam.z,    k);

        // Apply to Three.js objects
        camera.position.set(anim.camX, anim.camY, anim.camZ);
        camera.lookAt(0, 0, 0);

        // Helper to recursively fade an object
        const fadeObj = (obj, op) => {
          obj.visible = op > 0.01;
          obj.traverse(child => {
            if (child.material) {
              child.material.opacity = (child.material._origOpacity ?? 1) * op;
              if (child.material.emissiveIntensity !== undefined) {
                child.material.emissiveIntensity = (child.material._origEmissive ?? 0) * op;
              }
            }
          });
        };

        // Wall fades out
        m.wallMeshes.forEach(w => fadeObj(w, anim.wallOp));

        // Source, screen, detector, frames fade out
        if (m.bgMeshes) {
          m.bgMeshes.forEach(bg => fadeObj(bg, anim.bgOp));
        }
        
        // DetLight fades out
        if (sceneRef.current.detLight) {
          sceneRef.current.detLight.intensity = (detectorOnRef.current ? 1.5 : 0) * anim.bgOp;
        }

        // Hide accumulated screen dots
        if (sceneRef.current.screenDots) {
          fadeObj(sceneRef.current.screenDots, anim.bgOp);
        }

        // Hide flying particles
        if (sceneRef.current.particles) {
          fadeObj(sceneRef.current.particles, anim.bgOp);
        }

        if (m.blochSphere) {
          m.blochSphere.material.opacity = anim.sphOp;
          m.blochSphere.position.x = anim.sphX;
          m.blochSphere.rotation.x = anim.sphRotX;
          m.blochWire.material.opacity = anim.wireOp;
        }

        if (m.labelMeshes) m.labelMeshes.forEach(l => { l.material.opacity = anim.labelOp; });

        if (m.arrow) {
          m.arrow.children.forEach(c => { if (c.material) c.material.opacity = anim.arrowOp; });
        }

        renderer.render(scene, camera);
        return;
      }

      // ── Normal particle animation ────────────────────────────────────────
      const toRemove = [];
      particles.children.forEach(p => {
        if (!p.userData) return;
        p.userData.t += dt / p.userData.dur;
        const t = Math.min(p.userData.t, 1);
        const eased = easeOutCubic(t);

        if (p.userData.mode === 'wave') {
          if (t < 0.75) {
            const progress = t / 0.75;
            const easedP = 1 - Math.pow(1 - progress, 2);
            p.position.x = THREE.MathUtils.lerp(-5, 5, easedP);
            const maxScale = 2.5 + easedP * 1.5;
            const scaleY = easedP < 0.4 ? maxScale * (easedP / 0.4) : maxScale;
            p.scale.set(1, scaleY, maxScale);
            p.material.opacity = 0.18 + 0.08 * Math.sin(easedP * Math.PI);
            p.visible = true;
          } else {
            const collapseT = (t - 0.75) / 0.25;
            const colEased = Math.pow(collapseT, 0.5);
            p.position.x = 5;
            p.scale.set(1 - colEased, (1 - colEased) * 0.3, (1 - colEased) * 0.3);
            p.material.opacity = 0.3 * (1 - colEased);
            if (p.userData.landingDot) {
              p.userData.landingDot.material.emissiveIntensity = 3 * (1 - colEased) + 0.6;
            }
          }

        } else if (p.userData.mode === 'det-ghost') {
          // ── Beat 1: two ghost paths traveling together ──
          const BEAT1_END = 0.35; // normalized time when paths hit detector plane
          if (t < BEAT1_END) {
            const tp = t / BEAT1_END;
            // Both ghosts travel from source (-5) to detector plane (0.4)
            const xPos = THREE.MathUtils.lerp(-5, 0.4, easeOutCubic(tp));
            p.userData.ghostA.position.x = xPos;
            p.userData.ghostB.position.x = xPos;
            p.userData.ghostA.material.opacity = 0.22 * easeOutCubic(tp);
            p.userData.ghostB.material.opacity = 0.22 * easeOutCubic(tp);
          } else if (!p.userData.tagSpawned) {
            // ── Beat 2: tag snaps on, wrong ghost abruptly vanishes ──
            p.userData.tagSpawned = true;

            // Flash detector plane
            const { detPlaneMat } = sceneRef.current;
            if (detPlaneMat) {
              detPlaneMat.opacity = 0.6;
              setTimeout(() => { if (detPlaneMat) detPlaneMat.opacity = 0; }, 120);
            }

            // Pop the tag ring onto the real path
            const tagGeo = new THREE.TorusGeometry(0.12, 0.025, 8, 24);
            const tagMat = new THREE.MeshBasicMaterial({ color: 0x88ff44, transparent: true, opacity: 0 });
            const tag = new THREE.Mesh(tagGeo, tagMat);
            tag.rotation.y = Math.PI / 2;
            tag.position.set(0.4, 0, p.userData.realSlitZ);
            scene.add(tag);
            p.userData.tag = tag;
            p.userData.tagBirthT = t;

            // Immediately kill the fake ghost (abrupt, not eased)
            const fakeGhost = p.userData.whichSlit === 1 ? p.userData.ghostA : p.userData.ghostB;
            scene.remove(fakeGhost);

            // Keep real ghost visible momentarily
            const realGhost = p.userData.whichSlit === 1 ? p.userData.ghostB : p.userData.ghostA;
            p.userData.realGhost = realGhost;
          } else {
            // Animate tag overshoot pop
            const tagAge = (t - p.userData.tagBirthT) / 0.1;
            if (p.userData.tag && tagAge < 1) {
              const s = tagAge < 0.5
                ? THREE.MathUtils.lerp(0, 1.3, tagAge / 0.5)   // overshoot up
                : THREE.MathUtils.lerp(1.3, 1.0, (tagAge - 0.5) / 0.5); // settle
              p.userData.tag.scale.setScalar(s);
              p.userData.tag.material.opacity = Math.min(tagAge * 2, 1) * 0.9;
            }

            // Fade real ghost quickly too after brief delay
            if (p.userData.realGhost && tagAge > 0.3) {
              const fo = 1 - Math.min((tagAge - 0.3) / 0.4, 1);
              p.userData.realGhost.material.opacity = 0.22 * fo;
              if (fo <= 0) {
                scene.remove(p.userData.realGhost);
                p.userData.realGhost = null;
              }
            }

            // ── Beat 3: solid trail from detector plane to screen ──
            if (!p.userData.trailSpawned && tagAge > 0.15) {
              p.userData.trailSpawned = true;
              const trailGeo = new THREE.CylinderGeometry(0.025, 0.025, 1, 6);
              const trailMat = new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.85 });
              const trail = new THREE.Mesh(trailGeo, trailMat);
              trail.rotation.z = Math.PI / 2;
              trail.position.set(0.4, 0, p.userData.realSlitZ);

              const headGeo = new THREE.SphereGeometry(0.08, 8, 8);
              const headMat = new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.9 });
              const head = new THREE.Mesh(headGeo, headMat);
              head.position.copy(trail.position);
              scene.add(head);

              trail.userData = {
                t: 0, dur: p.userData.dur * (1 - p.userData.tagBirthT),
                mode: 'particle', glowHead: head,
                startX: 0.4,
              };
              particles.add(trail);
              p.userData.subTrail = trail;
            }
          }

        } else if (p.userData.mode === 'particle') {
          // Standard solid trail (used in beat 3 sub-trails)
          const startX = p.userData.startX ?? -5;
          const xPos = THREE.MathUtils.lerp(startX, 5, eased);
          p.position.x = xPos;
          if (p.userData.glowHead) {
            p.userData.glowHead.position.x = xPos;
          }
          p.scale.x = eased * 10;
          p.material.opacity = 0.8 * (1 - Math.pow(eased, 3));
        }

        if (t >= 1) toRemove.push(p);
      });

      toRemove.forEach(p => {
        if (p.userData.glowHead) scene.remove(p.userData.glowHead);
        if (p.userData.tag) scene.remove(p.userData.tag);
        if (p.userData.ghostA) scene.remove(p.userData.ghostA);
        if (p.userData.ghostB) scene.remove(p.userData.ghostB);
        if (p.userData.realGhost) scene.remove(p.userData.realGhost);
        particles.remove(p);
      });

      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      const nW = el.clientWidth, nH = el.clientHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // Update detector visual
  useEffect(() => {
    const { detMat, detLight } = sceneRef.current;
    if (!detMat) return;
    detMat.emissive.setHex(detectorOn ? 0x44ff44 : 0x004400);
    detMat.emissiveIntensity = detectorOn ? 3 : 0.5;
    if (detLight) detLight.intensity = detectorOn ? 1.5 : 0;
  }, [detectorOn]);

  // ─── Fire one particle ──────────────────────────────────────────────────────
  const fireParticle = useCallback(() => {
    const { particles, screenDots, scene, slitY } = sceneRef.current;
    if (!particles) return;

    const isDetOn = detectorOnRef.current;
    const x = sampleLanding(isDetOn);
    const z = x * 1.4;
    const y = (Math.random() - 0.5) * 2.2;

    // Persistent dot on 3D screen
    const dotGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const dotMat = new THREE.MeshStandardMaterial({
      color: isDetOn ? 0xffaa33 : 0x88bbff,
      emissive: isDetOn ? 0xffaa33 : 0x4488ff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 1,
    });
    dotMat._origOpacity = 1;
    dotMat._origEmissive = 0.6;
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(5, y, z);
    screenDots.add(dot);

    if (!isDetOn) {
      // Wave mode
      const waveGeo = new THREE.TorusGeometry(0.5, 0.08, 8, 48);
      const waveMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
      const wave = new THREE.Mesh(waveGeo, waveMat);
      wave.rotation.z = Math.PI / 2;
      wave.position.set(-5, 0, 0);
      wave.userData = { t: 0, dur: 1.1, mode: 'wave', landingDot: dot };
      particles.add(wave);

    } else {
      // ── Detector-ON: 3-beat tag sequence ──
      if (firstDetOnFireRef.current) {
        firstDetOnFireRef.current = false;
        setFirstDetOnFire(false);
        setShowTagCaption(true);
      }

      // Which slit is causally consistent with the sampled x position?
      const whichSlit = x > 0 ? 1 : -1; // +1 = right slit (z positive), -1 = left
      const realSlitZ = whichSlit * slitY * 0.6;
      const fakeSlitZ = -whichSlit * slitY * 0.6;

      // Ghost A = left slit path, Ghost B = right slit path
      const mkGhost = (sz) => {
        const g = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.8, 6),
          new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0 })
        );
        g.rotation.z = Math.PI / 2;
        g.position.set(-5, 0, sz);
        scene.add(g);
        return g;
      };

      const ghostA = mkGhost(fakeSlitZ);  // fake path
      const ghostB = mkGhost(realSlitZ);  // real path

      // A carrier object that drives both ghosts and holds state
      const carrier = new THREE.Object3D();
      carrier.userData = {
        t: 0, dur: 1.0, mode: 'det-ghost',
        ghostA, ghostB,
        whichSlit,       // +1 = ghostB is real, -1 = ghostA is real
        realSlitZ, fakeSlitZ,
        tagSpawned: false,
        trailSpawned: false,
        tagBirthT: 0,
        tag: null, realGhost: null,
      };
      particles.add(carrier);
    }

    const yFrac = (Math.random() - 0.5) * 0.85;
    readoutDotsRef.current = [...readoutDotsRef.current, { x, age: 0, yFrac }].map(d => ({ ...d, age: d.age + 1 }));
    setReadoutDots([...readoutDotsRef.current]);
    setParticleCount(c => {
      const next = c + 1;
      if (next >= 70) {
        setShowVerdict(true);
        setStage(STAGES.VERDICT);
        setAutoFiring(false);
        const actual = isDetOn ? 'bands' : 'stripes';
        setNarration(actual === 'stripes' ? NARRATION.wave : NARRATION.particle);
      }
      return next;
    });
  }, [prediction]);

  // ─── Auto-fire ─────────────────────────────────────────────────────────────
  useEffect(() => { autoFireRef.current = autoFiring; }, [autoFiring]);
  useEffect(() => {
    if (!autoFiring || stage === STAGES.VERDICT) return;
    const interval = setInterval(() => {
      if (!autoFireRef.current) return;
      fireParticle();
    }, 220);
    return () => clearInterval(interval);
  }, [autoFiring, fireParticle, stage]);

  // ─── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    const { screenDots, particles } = sceneRef.current;
    if (screenDots) while (screenDots.children.length) screenDots.remove(screenDots.children[0]);
    if (particles) while (particles.children.length) particles.remove(particles.children[0]);
    readoutDotsRef.current = [];
    setReadoutDots([]);
    setParticleCount(0);
    setAutoFiring(false);
    setShowVerdict(false);
    setStage(STAGES.PREDICT);
    setPrediction(null);
    setNarration(NARRATION.predict);
    firstDetOnFireRef.current = true;
    setFirstDetOnFire(true);
    setShowTagCaption(false);
  };

  const handleDetectorToggle = () => {
    setAutoFiring(false);
    setDetectorOn(d => !d);
    reset();
  };

  const handlePredict = (p) => {
    setPrediction(p);
    setStage(STAGES.EXPERIMENT);
    setNarration('');
  };

  // ─── Bridge-to-qubits morph ─────────────────────────────────────────────────
  const startMorph = useCallback(() => {
    const { scene, camera, wallMeshes, screenMat } = sceneRef.current;
    if (!scene) return;

    // Prefers-reduced-motion check
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setIsMorphing(true);
    setAutoFiring(false);
    setReadoutFading(true);

    if (reduced) {
      // Skip animation, cut straight to Bloch sphere state then navigate
      setTimeout(() => { if (onNavigate) onNavigate('qubit'); }, 300);
      return;
    }

    // ── Build Bloch sphere (invisible to start) ──
    const blochMat = new THREE.MeshStandardMaterial({
      color: 0x2244aa, transparent: true, opacity: 0, wireframe: false, side: THREE.DoubleSide, depthWrite: false,
    });
    const blochSphere = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), blochMat);
    // Start position: top pole aligns with slit A (z≈+0.28), bottom pole with slit B
    blochSphere.position.set(2, 0, 0);
    blochSphere.rotation.x = 0.4; // slight tilt so poles meet slit positions
    scene.add(blochSphere);

    // Wireframe latitude/longitude lines
    const wireMat = new THREE.LineBasicMaterial({ color: 0x4466cc, transparent: true, opacity: 0 });
    const blochWireGeo = new THREE.EdgesGeometry(new THREE.SphereGeometry(1.52, 12, 8));
    const blochWire = new THREE.LineSegments(blochWireGeo, wireMat);
    blochSphere.add(blochWire);

    // ── Pole labels via canvas textures ──
    const makePoleLabel = (text) => {
      const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64;
      const ctx2 = cv.getContext('2d');
      ctx2.fillStyle = 'rgba(0,0,0,0)';
      ctx2.fillRect(0, 0, 128, 64);
      ctx2.font = 'bold 36px serif';
      ctx2.fillStyle = '#ffddbb';
      ctx2.textAlign = 'center';
      ctx2.fillText(text, 64, 44);
      const tex = new THREE.CanvasTexture(cv);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), mat);
      return mesh;
    };
    const label0 = makePoleLabel('|0⟩');
    const label1 = makePoleLabel('|1⟩');
    label0.position.set(0, 1.9, 0);
    label1.position.set(0, -1.9, 0);
    blochSphere.add(label0);
    blochSphere.add(label1);

    // ── State vector arrow ──
    const arrowDir = new THREE.Vector3(0.6, 0.7, 0.4).normalize();
    const arrowLen = 1.4;
    const arrowColor = 0xff8833;
    const arrowHelper = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(0, 0, 0), arrowLen, arrowColor, 0.25, 0.15);
    // Make arrow transparent initially
    arrowHelper.line.material = new THREE.LineBasicMaterial({ color: arrowColor, transparent: true, opacity: 0, depthTest: false });
    arrowHelper.cone.material = new THREE.MeshBasicMaterial({ color: arrowColor, transparent: true, opacity: 0, depthTest: false });
    blochSphere.add(arrowHelper);


    // Store original wall opacities and initialize morph objects ref
    wallMeshes.forEach(w => { if (w.material) w.material._origOpacity = w.material.opacity ?? 1; });

    morphRef.current = {
      blochSphere, blochWire, arrow: arrowHelper,
      labelMeshes: [label0, label1],
      wallMeshes,
      bgMeshes: sceneRef.current.bgMeshes ?? [],
    };

    // Initialize animated values to current scene state (all bg visible, sphere invisible)
    morphAnimRef.current = {
      wallOp: 1, bgOp: 1, sphOp: 0, wireOp: 0,
      sphX: 2, sphRotX: 0.4,
      labelOp: 0, arrowOp: 0,
      camX: camera.position.x, camY: camera.position.y, camZ: camera.position.z,
    };

    // Start at phase 1 — user clicks Next to advance
    setMorphPhase(1);
  }, [onNavigate]);

  const canFire = (stage === STAGES.EXPERIMENT || showVerdict) && !isMorphing;

  return (
    <div className={`min-h-screen transition-colors duration-1000 font-sans flex flex-col ${isMorphing ? 'bg-[#080810]' : 'bg-[#FAFAFA]'} text-[#2A2A2A]`}>
      <WorkbenchBackground />

      {/* ── Top nav bar ─────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-8 py-4 border-b border-[#E4E4E7] bg-white/90 backdrop-blur-sm z-30 relative seeing-shadow transition-opacity duration-1000 ${isMorphing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
          <span className="text-xs font-mono text-[#B75D29] uppercase tracking-widest">Chapter 2</span>
          <h1 className="text-lg font-serif text-[#2A2A2A]">Wave-Particle Duality</h1>
        </div>

        <div className="flex items-center gap-3 bg-[#F4F4F5] px-4 py-2 rounded-full border border-[#E4E4E7]">
          <span className="text-xs text-[#71717A] font-mono uppercase tracking-wider">Which-path detector</span>
          <button
            onClick={handleDetectorToggle}
            disabled={isMorphing}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${detectorOn ? 'bg-green-500' : 'bg-[#D4D4D8]'} disabled:opacity-40`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${detectorOn ? 'left-6' : 'left-1'}`} />
          </button>
          <span className={`text-xs font-mono font-bold ${detectorOn ? 'text-green-600' : 'text-[#A1A1AA]'}`}>
            {detectorOn ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* ── Experiment area ──────────────────────────────────────────────── */}
      <div className="flex overflow-hidden" style={{ height: '540px' }}>

        {/* 3D Viewport */}
        <div ref={mountRef} className="flex-1 relative" style={{ minHeight: 0 }}>
          <div className={`absolute top-4 left-4 z-10 space-y-0.5 pointer-events-none transition-opacity duration-1000 ${isMorphing ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest bg-black/30 px-2 py-1 rounded">3D Apparatus · Drag to rotate</div>
          </div>
          <div className={`absolute bottom-4 left-4 z-10 flex gap-5 pointer-events-none transition-opacity duration-1000 ${isMorphing ? 'opacity-0' : 'opacity-100'}`}>
            {[['Source', '#ffcc44'], ['Barrier', '#4e6a99'], ['Screen', '#88bbff']].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded">
                <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                <span className="text-[10px] font-mono text-white/50">{l}</span>
              </div>
            ))}
          </div>

          {/* Detector-tag caption */}
          {showTagCaption && !isMorphing && (
            <div className="absolute bottom-14 left-4 right-4 z-10 pointer-events-none">
              <div className="bg-black/50 backdrop-blur-sm text-white/75 text-[10px] font-mono px-3 py-2 rounded-lg leading-relaxed border border-green-500/20 max-w-sm">
                ⬤ {TAG_CAPTION}
              </div>
            </div>
          )}

        </div>

        {/* Right panel / Morph Step Panel */}
        <div className={`w-[380px] flex-shrink-0 flex flex-col overflow-y-auto transition-all duration-1000 ${
          isMorphing 
            ? 'bg-[#080810] border-transparent justify-center p-6' 
            : 'bg-white border-l border-[#E4E4E7]'
        }`}>
          {/* ── Morph overlay — phase stepper ────────────────────────────── */}
          {isMorphing ? (() => {
            const MORPH_PHASES = [
              null, // 0 unused
              { title: 'Step 1 of 5 — Perspective Shift', body: 'The camera is moving in slightly. Take a moment to look at the full apparatus: source on the left, wall with two slits in the middle, detection screen on the right.' },
              { title: 'Step 2 of 5 — The Wall Dissolves', body: 'Watch the barrier wall fade out. In its place, a Bloch sphere is appearing. This sphere is the standard diagram physicists use to represent a single qubit.' },
              { title: 'Step 3 of 5 — Centering', body: 'The sphere is moving to its canonical position. Notice how the poles of the sphere are exactly where the two slits were — top and bottom.' },
              { title: 'Step 4 of 5 — The Labels', body: 'The top pole is labelled |0⟩ — it represents one measurement outcome. The bottom pole is |1⟩ — the other outcome. These are your two slits, renamed.' },
              { title: 'Step 5 of 5 — Superposition', body: 'This orange arrow is the qubit\'s state vector. It points between the poles — meaning the qubit is in superposition, holding both outcomes at once. Just like a particle that hasn\'t yet hit the detector.' },
              { title: 'You are ready', body: 'The double-slit experiment and a qubit are the same physics. Two possible outcomes, superposition between them, and a measurement that collapses it to one. Continue to explore the Bloch sphere interactively.' },
            ];
            const info = MORPH_PHASES[Math.min(morphPhase, MORPH_PHASES.length - 1)];
            const isLast = morphPhase >= MORPH_PHASES.length - 1;
            if (!info) return null;
            return (
              <div className="bg-[#1A1A1A] text-white rounded-2xl w-full border border-white/10 shadow-2xl overflow-hidden" style={{ animation: 'fadeIn 0.8s ease' }}>
                {/* Progress bar */}
                <div className="h-1 bg-white/10">
                  <div
                    className="h-full bg-[#B75D29] transition-all duration-500"
                    style={{ width: `${((morphPhase - 1) / (MORPH_PHASES.length - 2)) * 100}%` }}
                  />
                </div>

                <div className="p-6">
                  <div className="text-sm font-mono text-[#B75D29] uppercase tracking-widest mb-3">{info.title}</div>
                  <p className="text-lg text-white/95 leading-relaxed mb-8"><QuantumText>{info.body}</QuantumText></p>

                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-xs font-mono text-white/40">Observe<br/>scene</span>
                    <div className="flex gap-2">
                      {morphPhase > 1 && (
                        <button onClick={() => setMorphPhase(p => p - 1)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-full font-medium text-sm transition-colors">
                          ←
                        </button>
                      )}
                      {isLast ? (
                        <button onClick={() => onNavigate && onNavigate('qubit')} className="bg-[#B75D29] hover:bg-[#9A4C20] text-white px-5 py-2.5 rounded-full font-medium text-sm transition-colors shadow-lg">
                          Finish →
                        </button>
                      ) : (
                        <button onClick={() => setMorphPhase(p => p + 1)} className="bg-white/15 hover:bg-white/25 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-colors border border-white/20">
                          Next →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : (
            <>
              <div className="p-4 border-b border-[#E4E4E7]">
                <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest mb-2">Detection Screen Readout</div>
                <ReadoutPanel dots={readoutDots} detectorOn={detectorOn} fading={readoutFading} />
                <div className="mt-2 flex justify-between text-[10px] font-mono text-[#A1A1AA]">
              <span>{detectorOn ? '⬤ Detector ON — particle mode' : '◎ Detector OFF — wave mode'}</span>
              <span className="text-[#B75D29] font-bold">{particleCount} events</span>
            </div>
          </div>

          {stage === STAGES.PREDICT && (
            <div className="p-4 border-b border-[#E4E4E7] space-y-3">
              <div className="text-[10px] font-mono text-[#B75D29] uppercase tracking-widest">Step 1 — Predict</div>
              <p className="text-xs text-[#71717A] leading-relaxed">{NARRATION.predict}</p>
              <div className="space-y-2">
                <button onClick={() => handlePredict('bands')} className="w-full py-3 px-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] hover:border-[#B75D29] hover:bg-[#F6EEE8] text-left text-sm transition-all">
                  <span className="font-medium text-[#2A2A2A]">Two clean bands</span>
                  <div className="text-xs text-[#71717A] mt-0.5">Like two shadows of the slits</div>
                </button>
                <button onClick={() => handlePredict('stripes')} className="w-full py-3 px-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] hover:border-[#B75D29] hover:bg-[#F6EEE8] text-left text-sm transition-all">
                  <span className="font-medium text-[#2A2A2A]">Many interference stripes</span>
                  <div className="text-xs text-[#71717A] mt-0.5">Alternating bright and dark bands</div>
                </button>
              </div>
            </div>
          )}

          {canFire && (
            <div className="p-4 border-b border-[#E4E4E7] space-y-2">
              <div className="text-[10px] font-mono text-[#B75D29] uppercase tracking-widest mb-1">
                {showVerdict ? 'Fire More Particles' : 'Step 2 — Fire Particles'}
              </div>
              <div className="flex gap-2">
                <button onClick={fireParticle} className="flex-1 py-2.5 rounded-xl bg-[#B75D29] hover:bg-[#9A4C20] text-white text-sm font-medium transition-colors shadow-sm">
                  Fire One
                </button>
                <button
                  onClick={() => setAutoFiring(a => !a)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                    autoFiring
                      ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                      : 'bg-[#F4F4F5] border-[#E4E4E7] text-[#2A2A2A] hover:bg-[#EAEAEA]'
                  }`}
                >
                  {autoFiring ? '⏹ Stop' : '▶ Auto-fire'}
                </button>
              </div>
              <button onClick={reset} className="w-full py-1.5 rounded-xl border border-[#E4E4E7] text-[#A1A1AA] hover:text-[#71717A] hover:border-[#D4D4D8] text-xs font-mono transition-colors">
                Reset Run
              </button>
            </div>
          )}

          {(stage === STAGES.EXPERIMENT || showVerdict) && (
            <div className="px-4 py-3 border-b border-[#E4E4E7]">
              <div className="flex justify-between text-[10px] font-mono text-[#A1A1AA] mb-1.5">
                <span>Events accumulated</span><span className="text-[#2A2A2A] font-bold">{particleCount}</span>
              </div>
              <div className="w-full h-1.5 bg-[#F4F4F5] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (particleCount / Math.max(particleCount, 70)) * 100)}%`,
                    background: detectorOn ? '#f97316' : '#60a5fa'
                  }}
                />
              </div>
            </div>
          )}

          {showVerdict && !isMorphing && (
            <div className="p-4 border-b border-[#E4E4E7] space-y-3">
              <div className="text-[10px] font-mono text-[#B75D29] uppercase tracking-widest">Verdict</div>
              <div className={`p-3 rounded-xl text-sm font-medium ${
                prediction === (detectorOn ? 'bands' : 'stripes')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-[#F6EEE8] text-[#B75D29] border border-[#B75D29]/30'
              }`}>
                {prediction === (detectorOn ? 'bands' : 'stripes')
                  ? '✓ Your prediction was correct!'
                  : '✗ The result surprised you — that is the point.'}
              </div>
              <button
                onClick={() => setNarration(detectorOn ? NARRATION.particle : NARRATION.wave)}
                className="w-full py-2.5 rounded-xl bg-[#F6EEE8] hover:bg-[#EDDECC] text-[#B75D29] text-sm font-medium border border-[#B75D29]/20 transition-colors"
              >
                Show explanation →
              </button>
              <button
                onClick={startMorph}
                className="w-full py-2.5 rounded-xl bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white text-sm font-medium border border-[#2A2A2A] transition-colors flex items-center justify-center gap-2"
              >
                <span>Bridge to qubits</span>
                <span className="text-[#B75D29]">→</span>
              </button>
            </div>
          )}

          {narration && !isMorphing && (
            <div className="p-4 flex-1 bg-[#FAFAFA]">
              <div className="text-[10px] font-mono text-[#B75D29] uppercase tracking-widest mb-2">Explanation</div>
              <p className="text-xs text-[#2A2A2A] leading-relaxed">{narration}</p>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* ── Full explanation section ─────────────────────────────────────── */}
      <div className="border-t border-[#E4E4E7] relative z-10">
        <div className="max-w-4xl mx-auto px-8 py-16 space-y-16">
          <div className="text-center">
            <span className="text-xs font-mono text-[#B75D29] uppercase tracking-widest">Chapter 2 — Deep Dive</span>
            <h2 className="text-4xl font-serif text-[#2A2A2A] mt-3 mb-4">The Double-Slit Experiment</h2>
            <p className="text-[#71717A] text-lg max-w-2xl mx-auto leading-relaxed">
              Arguably the most important experiment in the history of quantum mechanics — and you just ran it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <h3 className="text-2xl font-serif text-[#B75D29]">A Brief History</h3>
              <p className="text-[#2A2A2A] leading-relaxed">
                In <strong>1801</strong>, Thomas Young shone light through two narrow slits and observed an interference pattern on a screen — proving that light behaves like a wave. For over a century, this settled the debate: light is a wave.
              </p>
              <p className="text-[#2A2A2A] leading-relaxed">
                Then in <strong>1905</strong>, Einstein showed that light also comes in discrete packets called photons — explaining the photoelectric effect. Light was both a wave <em>and</em> a particle? This was the puzzle that launched quantum mechanics.
              </p>
              <p className="text-[#2A2A2A] leading-relaxed">
                The most astonishing version was performed with <strong>single electrons fired one at a time</strong>. Even with no other electron to interfere with, the same striped pattern built up — exactly what you witnessed in the simulation above.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-serif text-[#B75D29]">What Is Superposition?</h3>
              <p className="text-[#2A2A2A] leading-relaxed">
                The interference pattern only makes sense if each single particle is in a <strong>superposition</strong> — a genuine combination of "went through slit A" and "went through slit B" — at the same time. Not "secretly one of them, we just don't know which." A real combination of both.
              </p>
              <div className="bg-[#F6EEE8] border border-[#B75D29]/20 rounded-2xl p-5">
                <MathBlock className="text-[#B75D29]">{`|\\psi\\rangle = \\alpha|\\text{slit A}\\rangle + \\beta|\\text{slit B}\\rangle`}</MathBlock>
                <p className="text-xs text-[#71717A] text-center mt-2">The particle&apos;s state — a sum of both paths</p>
              </div>
              <p className="text-[#2A2A2A] leading-relaxed">
                Both amplitudes α and β propagate through space, interfere with each other at the screen, and the result is the fringe pattern. The particle &quot;explores&quot; both paths as a wave, then lands as a single dot.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10 pt-6 border-t border-[#E4E4E7]">
            <div className="space-y-4">
              <h3 className="text-2xl font-serif text-[#B75D29]">What Is Decoherence?</h3>
              <p className="text-[#2A2A2A] leading-relaxed">
                When you switched the detector ON, the stripes disappeared and two plain bands replaced them — the classical pattern. No magic, no consciousness required.
              </p>
              <p className="text-[#2A2A2A] leading-relaxed">
                The detector works by <em>entangling</em> the particle with something in the environment. Once the environment carries which-path information — even if nobody reads it — the superposition is destroyed. The two paths are no longer coherent and cannot interfere. This is called <strong>decoherence</strong>.
              </p>
              <p className="text-[#2A2A2A] leading-relaxed">
                The key insight: it is not about anyone looking. It is about <strong>information</strong>. If any physical system — a detector, an air molecule, anything — records which slit was used, the fringes vanish.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-serif text-[#B75D29]">The Bridge to Qubits</h3>
              <p className="text-[#2A2A2A] leading-relaxed">
                <QuantumText>
                  A qubit is exactly the same physics, in miniature. Instead of a particle choosing between two slits, a qubit holds a combination of |0⟩ and |1⟩ — not one secretly, but both simultaneously.
                </QuantumText>
              </p>
              <div className="bg-[#F6EEE8] border border-[#B75D29]/20 rounded-2xl p-5">
                <MathBlock className="text-[#B75D29]">{`|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle`}</MathBlock>
                <p className="text-xs text-[#71717A] text-center mt-2">A qubit in superposition</p>
              </div>
              <p className="text-[#2A2A2A] leading-relaxed">
                Quantum algorithms exploit this by routing computations through many paths simultaneously — then engineering constructive interference at the correct answer, and destructive interference everywhere else. The double-slit experiment is not just an analogy. It is the same underlying phenomenon.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
