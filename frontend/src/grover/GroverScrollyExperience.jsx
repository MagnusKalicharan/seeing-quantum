import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import * as d3 from 'd3';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import WorkbenchBackground from '../WorkbenchBackground';

/** Original scrollytelling + Three.js / D3 Grover animation (Chapter 5). */
export default function GroverScrollyExperience({ onBack }) {
  const mountRef = useRef(null);
  const d3CanvasRef = useRef(null);
  const d3WrapperRef = useRef(null);
  const sandboxD3Ref = useRef(null);
  const rightPanelRef = useRef(null);
  
  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);
  const step4Ref = useRef(null);
  const step5Ref = useRef(null);
  const step6Ref = useRef(null);
  const step7Ref = useRef(null);
  const step8Ref = useRef(null);

  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const isJumpingRef = useRef(false);
  const getD = (ms) => isJumpingRef.current ? 0 : ms;
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  
  const [activeStep, setActiveStep] = useState(1);
  const [selectedKey, setSelectedKey] = useState(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isDiffusing, setIsDiffusing] = useState(false);
  const [rotationProgress, setRotationProgress] = useState(0);
  
  // Sandbox ↓State
  const [isOracleNext, setIsOracleNext] = useState(true);
  const [sandboxProbability, setSandboxProbability] = useState(3.12);
  const [sandboxLoops, setSandboxLoops] = useState(0);
  const [sandboxStatus, setSandboxStatus] = useState('idle'); // idle, win, lose
  const sandboxTargetRef = useRef(0);
  const amplitudesRef = useRef(new Array(32).fill(1/Math.sqrt(32)));
  const sandboxAngleRef = useRef(Math.asin(1/Math.sqrt(32)));
  
  const activeStepRef = useRef(1);
  const selectedBarRef = useRef(null);
  const yScaleRef = useRef(null);

  const triggerAnimationRef = useRef(null);
  const fireHadamardAnim = useRef(null);
  const resetHadamardAnim = useRef(null);
  
  const triggerD3HadamardRef = useRef(null);
  const resetD3OracleRef = useRef(null);
  const triggerOracleAnimRef = useRef(null);
  const resetOracleAnimRef = useRef(null);
  const performD3SelectionRef = useRef(null);
  
  const triggerD3MeasurementRef = useRef(null);
  const restoreD3MeasurementRef = useRef(null);
  const triggerCollapseAnimRef = useRef(null);
  const restoreCollapseAnimRef = useRef(null);
  
  const triggerD3DiffuserRef = useRef(null);
  const resetD3DiffuserRef = useRef(null);
  const triggerThreeDiffuserRef = useRef(null);
  const resetThreeDiffuserRef = useRef(null);
  
  const triggerD3GeometricRef = useRef(null);
  const resetD3GeometricRef = useRef(null);
  const triggerThreeGeometricRef = useRef(null);
  const resetThreeGeometricRef = useRef(null);
  const updateThreeRotationRef = useRef(null);
  
  const initSandboxRef = useRef(null);
  const triggerSandboxOracleRef = useRef(null);
  const triggerSandboxDiffuserRef = useRef(null);
  const triggerSandboxWinRef = useRef(null);
  
  const masterTimeline = useRef(null);
  const oracleTimeline = useRef(null);
  const measureTimeline = useRef(null);
  const diffuserTimeline = useRef(null);
  const geometricTimeline = useRef(null);

  useEffect(() => {
      // Inject KaTeX
      if (!document.getElementById('katex-css')) {
          const link = document.createElement('link');
          link.id = 'katex-css';
          link.rel = 'stylesheet';
          link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
          document.head.appendChild(link);
          
          const script = document.createElement('script');
          script.id = 'katex-js';
          script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
          script.onload = () => {
              const autoRender = document.createElement('script');
              autoRender.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js';
              autoRender.onload = () => {
                  window.renderMathInElement(document.body, {
                      delimiters: [
                          {left: '$$', right: '$$', display: true},
                          {left: '$', right: '$', display: false}
                      ]
                  });
              };
              document.head.appendChild(autoRender);
          };
          document.head.appendChild(script);
      } else if (window.renderMathInElement) {
          window.renderMathInElement(document.body, {
              delimiters: [
                  {left: '$$', right: '$$', display: true},
                  {left: '$', right: '$', display: false}
              ]
          });
      }
  }, [activeStep]);
  const [targetKeyIndex, setTargetKeyIndex] = useState(7);
  useEffect(() => {
      setTargetKeyIndex(Math.floor(Math.random() * 5) + 3);
  }, []);

  useEffect(() => { 
      activeStepRef.current = activeStep; 
  }, [activeStep]);

  // --- THREE.JS SCENE ---
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. SETUP SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810); 

    const aspect = container.clientWidth / container.clientHeight;
    const d = 8;
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 100);
    camera.position.set(15, 12, 15);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // POST-PROCESSING (Bloom)
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(container.clientWidth, container.clientHeight), 
        1.5, 0.4, 0.85
    );
    bloomPass.threshold = 0.2;
    bloomPass.strength = 0.6; bloomPass.threshold = 0.5;
    bloomPass.radius = 0.5;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // 2. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 3. BUILD THE SCENE OBJECTS
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a14, roughness: 1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const vaultGroup = new THREE.Group();
    vaultGroup.position.set(-4, 0, -3);
    scene.add(vaultGroup);

    const vaultGeo = new THREE.BoxGeometry(5, 7, 2);
    const vaultMat = new THREE.MeshStandardMaterial({ color: 0x1f1f25, roughness: 0.7, metalness: 0.3 });
    const vault = new THREE.Mesh(vaultGeo, vaultMat);
    vault.position.y = 3.5;
    vault.castShadow = true;
    vault.receiveShadow = true;
    vaultGroup.add(vault);

    const ledGeo = new THREE.BoxGeometry(1.5, 0.6, 0.2);
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x111111, emissiveIntensity: 2 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 5.5, 1.05);
    vaultGroup.add(led);

    const keyholeGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 16);
    keyholeGeo.rotateX(Math.PI / 2);
    const keyholeMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
    const keyhole = new THREE.Mesh(keyholeGeo, keyholeMat);
    keyhole.position.set(0, 3, 1.05);
    vaultGroup.add(keyhole);

    const tableGeo = new THREE.BoxGeometry(8, 0.4, 2);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.9 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(2, 2, 3.5);
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);

    const keys = [];
    const keyGeo = new THREE.BoxGeometry(0.2, 0.2, 0.8);
    for (let i = 0; i < 8; i++) {
        const keyMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.8, roughness: 0.2 });
        const key = new THREE.Mesh(keyGeo, keyMat);
        key.position.set(-1 + i * 0.85, 2.3, 3.5);
        key.castShadow = true;
        scene.add(key);
        keys.push(key);
    }

    const armGroup = new THREE.Group();
    scene.add(armGroup);

    const baseGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.5, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.5 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.25;
    armGroup.add(base);

    const shoulderGroup = new THREE.Group();
    shoulderGroup.position.y = 0.5;
    base.add(shoulderGroup);

    const jointGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16);
    jointGeo.rotateZ(Math.PI / 2);
    const shoulderJoint = new THREE.Mesh(jointGeo, baseMat);
    shoulderGroup.add(shoulderJoint);

    const lowerArmGeo = new THREE.BoxGeometry(0.3, 3.5, 0.3);
    lowerArmGeo.translate(0, 1.75, 0);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xB75D29, roughness: 0.4 });
    const lowerArm = new THREE.Mesh(lowerArmGeo, armMat);
    shoulderGroup.add(lowerArm);

    const elbowGroup = new THREE.Group();
    elbowGroup.position.y = 3.5;
    lowerArm.add(elbowGroup);

    const elbowJoint = new THREE.Mesh(jointGeo, baseMat);
    elbowGroup.add(elbowJoint);

    const upperArmGeo = new THREE.BoxGeometry(0.25, 2.5, 0.25);
    upperArmGeo.translate(0, 1.25, 0);
    const upperArm = new THREE.Mesh(upperArmGeo, armMat);
    elbowGroup.add(upperArm);

    const endEffectorGroup = new THREE.Group();
    endEffectorGroup.position.y = 2.5;
    upperArm.add(endEffectorGroup);

    const handGeo = new THREE.BoxGeometry(0.5, 0.2, 0.5);
    const hand = new THREE.Mesh(handGeo, baseMat);
    endEffectorGroup.add(hand);

    shoulderGroup.rotation.y = 0;
    lowerArm.rotation.x = Math.PI / 8;
    elbowGroup.rotation.x = -Math.PI / 3;

    // --- STEP 2, 3, 5 QUANTUM OBJECTS ---
    const laserGeo = new THREE.CylinderGeometry(0.1, 0.1, 20, 32);
    laserGeo.rotateX(Math.PI / 2);
    const laserGlowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0 });
    const laser = new THREE.Mesh(laserGeo, laserGlowMat);
    laser.position.set(10, 2.3, 3.5);
    scene.add(laser);

    const blobGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const blobMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0, wireframe: true });
    const blob = new THREE.Mesh(blobGeo, blobMat);
    blob.position.set(2, 2.3, 3.5);
    blob.scale.set(0, 0, 0);
    scene.add(blob);
    
    const redCoreGeo = new THREE.SphereGeometry(1.1, 32, 32);
    const redCoreMat = new THREE.MeshBasicMaterial({ color: 0xff0033, transparent: true, opacity: 0 });
    const redCore = new THREE.Mesh(redCoreGeo, redCoreMat);
    redCore.position.set(2, 2.3, 3.5);
    redCore.scale.set(0, 0, 0);
    scene.add(redCore);
    
    const shockwaveGeo = new THREE.TorusGeometry(1.5, 0.05, 16, 100);
    const shockwaveMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const shockwave = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwave.position.set(2, 2.3, 3.5);
    shockwave.rotation.x = Math.PI / 2;
    shockwave.scale.set(0.1, 0.1, 0.1);
    scene.add(shockwave);
    
    // --- STEP 6 GEOMETRIC OBJECTS ---
    const geometricGroup = new THREE.Group();
    geometricGroup.quaternion.copy(camera.quaternion); 
    geometricGroup.position.set(0, 4, 3.5);
    geometricGroup.scale.set(0, 0, 0); 
    scene.add(geometricGroup);
    
    const xAxisGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.5,0,0), new THREE.Vector3(4,0,0)]);
    const yAxisGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-0.5,0), new THREE.Vector3(0,4,0)]);
    const axisMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    geometricGroup.add(new THREE.Line(xAxisGeo, axisMat));
    geometricGroup.add(new THREE.Line(yAxisGeo, axisMat));
    
    const circleGeo = new THREE.BufferGeometry();
    const circlePts = [];
    for(let i=0; i<=64; i++){
        const a = (i/64) * Math.PI * 2;
        circlePts.push(new THREE.Vector3(Math.cos(a)*3.5, Math.sin(a)*3.5, 0));
    }
    circleGeo.setFromPoints(circlePts);
    const circleMat = new THREE.LineDashedMaterial({ color: 0x888888, dashSize: 0.2, gapSize: 0.2, transparent: true, opacity: 0.3 });
    const circle = new THREE.Line(circleGeo, circleMat);
    circle.computeLineDistances();
    geometricGroup.add(circle);
    
    const thetaAngle = Math.asin(1 / Math.sqrt(8)); 
    const sLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0,0,0), 
        new THREE.Vector3(Math.cos(thetaAngle)*3.8, Math.sin(thetaAngle)*3.8, 0)
    ]);
    const sLineMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.4 });
    const sLine = new THREE.Line(sLineGeo, sLineMat);
    geometricGroup.add(sLine);
    
    const dir = new THREE.Vector3(Math.cos(thetaAngle), Math.sin(thetaAngle), 0);
    const origin = new THREE.Vector3(0, 0, 0);
    const length = 3.5;
    const hex = 0x00ffff;
    const stateArrow = new THREE.ArrowHelper(dir, origin, length, hex, 0.5, 0.15);
    geometricGroup.add(stateArrow);
    
    const arc1Curve = new THREE.EllipseCurve(0, 0, 1.5, 1.5, -thetaAngle, thetaAngle, false, 0);
    const arc1Geo = new THREE.BufferGeometry().setFromPoints(arc1Curve.getPoints(32));
    const arc1Mat = new THREE.LineBasicMaterial({ color: 0xffaaaa, transparent: true, opacity: 0 });
    geometricGroup.add(new THREE.Line(arc1Geo, arc1Mat));
    
    const arc2Curve = new THREE.EllipseCurve(0, 0, 2.0, 2.0, -thetaAngle, 3*thetaAngle, false, 0);
    const arc2Geo = new THREE.BufferGeometry().setFromPoints(arc2Curve.getPoints(32));
    const arc2Mat = new THREE.LineBasicMaterial({ color: 0xaaffaa, transparent: true, opacity: 0 });
    geometricGroup.add(new THREE.Line(arc2Geo, arc2Mat));

    function createTextSprite(text, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.font = 'bold 54px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 64);
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0 });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(2, 1, 1);
        return sprite;
    }
    
    const labelR = createTextSprite('|r>', '#cccccc');
    labelR.position.set(3.5, -0.3, 0);
    geometricGroup.add(labelR);
    
    const labelW = createTextSprite('|w>', '#cccccc');
    labelW.position.set(0, 3.5, 0);
    geometricGroup.add(labelW);
    
    const labelS = createTextSprite('|s>', '#999999');
    labelS.position.set(Math.cos(thetaAngle)*3.7, Math.sin(thetaAngle)*3.7 + 0.3, 0);
    geometricGroup.add(labelS);
    
    const labelTheta1 = createTextSprite('-θ', '#ff6666');
    labelTheta1.position.set(1.7, -0.4, 0); 
    geometricGroup.add(labelTheta1);
    
    const labelTheta2 = createTextSprite('+2θ', '#66ff66');
    labelTheta2.position.set(1.0, 1.8, 0); 
    geometricGroup.add(labelTheta2);

    // --- STEP 7 SANDBOX WIN PARTICLES ---
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 300;
    const posArray = new Float32Array(particlesCount * 3);
    const velArray = [];
    for(let i=0; i<particlesCount; i++) {
        posArray[i*3] = 0; posArray[i*3+1] = 0; posArray[i*3+2] = 0;
        velArray.push(new THREE.Vector3((Math.random()-0.5)*2, (Math.random()-0.5)*2, 0).normalize().multiplyScalar(0.1 + Math.random()*0.2));
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({ size: 0.1, color: 0x00ffff, transparent: true, opacity: 0 });
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    geometricGroup.add(particleSystem);

    triggerSandboxWinRef.current = () => {
        particlesMat.opacity = 1;
        const positions = particlesGeo.attributes.position.array;
        
        const obj = { progress: 0 };
        gsap.to(obj, { progress: 1, duration: 2, ease: "power2.out", onUpdate: () => {
            for(let i=0; i<particlesCount; i++) {
                positions[i*3] += velArray[i].x;
                positions[i*3+1] += velArray[i].y;
            }
            particlesGeo.attributes.position.needsUpdate = true;
            particlesMat.opacity = 1 - obj.progress;
        }, onComplete: () => {
            for(let i=0; i<particlesCount; i++) {
                positions[i*3] = 0; positions[i*3+1] = 0;
            }
            particlesGeo.attributes.position.needsUpdate = true;
        }});
    };

    // --- CLASSICAL ANIMATION API ---
    triggerAnimationRef.current = (keyIndex, targetIdx, onComplete) => {
        const key = keys[keyIndex];
        const isCorrect = (keyIndex === targetIdx);
        
        if (masterTimeline.current) masterTimeline.current.kill();
        const tl = gsap.timeline({ onComplete });
        masterTimeline.current = tl;

        tl.to(armGroup.position, { x: key.position.x, duration: 0.8, ease: "power2.inOut" }, 0);
        tl.to(shoulderGroup.rotation, { y: 0, duration: 0.8, ease: "power2.inOut" }, 0);
        tl.to(lowerArm.rotation, { x: Math.PI / 4, duration: 0.8, ease: "power2.inOut" }, 0);
        tl.to(elbowGroup.rotation, { x: -Math.PI / 3, duration: 0.8, ease: "power2.inOut" }, 0);

        tl.to(lowerArm.rotation, { x: Math.PI / 3, duration: 0.3, ease: "power1.inOut" });
        tl.to(elbowGroup.rotation, { x: -Math.PI / 2.2, duration: 0.3, ease: "power1.inOut" }, "<");
        
        tl.call(() => {
            endEffectorGroup.attach(key);
            gsap.to(key.position, { x: 0, y: -0.1, z: 0, duration: 0.1 });
            gsap.to(key.rotation, { x: 0, y: 0, z: 0, duration: 0.1 });
        });

        tl.to(lowerArm.rotation, { x: Math.PI / 6, duration: 0.4, ease: "power1.inOut" });
        tl.to(elbowGroup.rotation, { x: -Math.PI / 4, duration: 0.4, ease: "power1.inOut" }, "<");

        tl.to(armGroup.position, { x: -4, z: 0.5, duration: 1.2, ease: "power2.inOut" });
        tl.to(shoulderGroup.rotation, { y: Math.PI, duration: 1.2, ease: "power2.inOut" }, "<");
        tl.to(lowerArm.rotation, { x: -0.06, duration: 1.2, ease: "power2.inOut" }, "<");
        tl.to(elbowGroup.rotation, { x: 2.16, duration: 1.2, ease: "power2.inOut" }, "<");
        tl.to(key.rotation, { x: -2.10, duration: 1.2, ease: "power2.inOut" }, "<");
        tl.to(armGroup.position, { z: -0.1, duration: 0.3, ease: "power1.inOut" });

        if (isCorrect) {
            tl.call(() => {
                ledMat.emissive.setHex(0x22c55e);
                ledMat.color.setHex(0x22c55e);
            });
            tl.to({}, { duration: 1 });
            tl.call(() => vaultGroup.attach(key));
            
            tl.to(armGroup.position, { z: 0.5, duration: 0.4, ease: "power1.inOut" });
            tl.to(armGroup.position, { x: -1, z: 0, duration: 1, ease: "power2.inOut" });
            tl.to(shoulderGroup.rotation, { y: -Math.PI/4, duration: 1, ease: "power2.inOut" }, "<");
            tl.to(lowerArm.rotation, { x: -Math.PI/6, duration: 1, ease: "power2.inOut" }, "<");
            tl.to(elbowGroup.rotation, { x: -Math.PI/6, duration: 1, ease: "power2.inOut" }, "<");
            tl.to(vault.position, { z: -0.5, duration: 1, ease: "power2.inOut" }, "-=0.5");
        } else {
            tl.call(() => {
                ledMat.emissive.setHex(0xef4444);
                ledMat.color.setHex(0xef4444);
            });
            tl.to({}, { duration: 0.5 }); 
            tl.call(() => {
                ledMat.emissive.setHex(0x111111);
                ledMat.color.setHex(0x111111);
            });

            tl.to(armGroup.position, { z: 0.5, duration: 0.3, ease: "power1.inOut" });
            tl.to(armGroup.position, { x: 3, z: 0, duration: 1, ease: "power2.inOut" });
            tl.to(shoulderGroup.rotation, { y: Math.PI / 2, duration: 1, ease: "power2.inOut" }, "<");
            tl.to(lowerArm.rotation, { x: Math.PI / 6, duration: 1, ease: "power2.inOut" }, "<");
            tl.to(elbowGroup.rotation, { x: -Math.PI / 4, duration: 1, ease: "power2.inOut" }, "<");

            tl.call(() => {
                scene.attach(key);
                const dropX = 3 + Math.random() * 1.5;
                const dropZ = 1 + Math.random() * 1.5;
                gsap.to(key.position, { x: dropX, y: 0.1, z: dropZ, duration: 0.5, ease: "bounce.out" });
                gsap.to(key.rotation, { x: Math.random() * Math.PI, y: Math.random() * Math.PI, duration: 0.5 });
            });

            tl.to(armGroup.position, { x: 0, z: 0, duration: 0.8, ease: "power2.inOut" });
            tl.to(shoulderGroup.rotation, { y: 0, duration: 0.8, ease: "power2.inOut" }, "<");
            tl.to(lowerArm.rotation, { x: Math.PI / 8, duration: 0.8, ease: "power2.inOut" }, "<");
            tl.to(elbowGroup.rotation, { x: -Math.PI / 3, duration: 0.8, ease: "power2.inOut" }, "<");
        }
    };

    fireHadamardAnim.current = () => {
        setIsAutoPlaying(false);
        if (masterTimeline.current) masterTimeline.current.kill();
        const tl = gsap.timeline();
        masterTimeline.current = tl;
        
        const silver = new THREE.Color(0xd4d4d8);
        keys.forEach((k, i) => {
            scene.attach(k);
            tl.to(k.material.color, { r: silver.r, g: silver.g, b: silver.b, duration: 0 }, 0);
            tl.to(k.material.emissive, { r: 0, g: 0, b: 0, duration: 0 }, 0);
            tl.to(k.material, { emissiveIntensity: 0, duration: 0 }, 0);
            tl.to(k.position, { x: -1 + i * 0.85, y: 2.3, z: 3.5, duration: 1, ease: "power2.inOut" }, 0);
            tl.to(k.rotation, { x: 0, y: 0, z: 0, duration: 1, ease: "power2.inOut" }, 0);
            tl.to(k.scale, { x: 1, y: 1, z: 1, duration: 1, ease: "power2.inOut" }, 0);
        });
        tl.to(vault.position, { z: 0, duration: 1, ease: "power2.inOut" }, 0);
        
        tl.to(redCore.scale, { x: 0, y: 0, z: 0, duration: 0 }, 0);
        tl.to(redCoreMat, { opacity: 0, duration: 0 }, 0);

        tl.to(armGroup.position, { x: 8, z: 0, duration: 1, ease: "power2.inOut" }, 0);
        tl.to(shoulderGroup.rotation, { y: 0, duration: 1 }, 0);
        tl.to(lowerArm.rotation, { x: Math.PI / 8, duration: 1 }, 0);
        tl.to(elbowGroup.rotation, { x: -Math.PI / 3, duration: 1 }, 0);
        
        tl.to(laserGlowMat, { opacity: 0.8, duration: 0.3 }, 1.2);
        tl.to(laser.position, { x: -4, duration: 1.5, ease: "linear" }, 1.5);
        
        const cyan = new THREE.Color(0x00ffff);
        keys.forEach((k, i) => {
            const hitTime = 1.9 + ((7 - i) * 0.12);
            tl.to(k.material.emissive, { r: cyan.r, g: cyan.g, b: cyan.b, duration: 0.2 }, hitTime);
            tl.to(k.material, { emissiveIntensity: 0.8, duration: 0.2 }, hitTime);
        });
        
        tl.to(laserGlowMat, { opacity: 0, duration: 0.2 }, 3.0);
        
        keys.forEach((k, i) => {
            const mergeStart = 3.2 + (Math.random() * 0.1); 
            tl.to(k.position, { x: 2, y: 2.3, z: 3.5, duration: 0.8, ease: "power2.in" }, mergeStart);
            tl.to(k.rotation, { x: Math.PI * 4, y: Math.PI * 2, duration: 0.8, ease: "power1.inOut" }, mergeStart);
            tl.to(k.scale, { x: 0.1, y: 0.1, z: 0.1, duration: 0.8, ease: "power2.in" }, mergeStart);
        });
        
        tl.to(blob.scale, { x: 1, y: 1, z: 1, duration: 1.5, ease: "elastic.out(1, 0.5)" }, 3.8);
        tl.to(blobMat, { opacity: 0.6, duration: 1.5 }, 3.8);
        
        tl.call(() => {
            if (triggerD3HadamardRef.current) triggerD3HadamardRef.current();
        }, [], 4.5);
    };

    resetHadamardAnim.current = () => {
        if (masterTimeline.current) masterTimeline.current.kill();
        const tl = gsap.timeline();
        masterTimeline.current = tl;
        
        tl.to(blob.scale, { x: 0, y: 0, z: 0, duration: 0.5 }, 0);
        tl.to(blobMat, { opacity: 0, duration: 0.5 }, 0);
        tl.to(laserGlowMat, { opacity: 0, duration: 0 }, 0);
        tl.set(laser.position, { x: 10 });
        
        const silver = new THREE.Color(0xd4d4d8);
        keys.forEach((k, i) => {
            scene.attach(k);
            tl.to(k.material.color, { r: silver.r, g: silver.g, b: silver.b, duration: 0.1 }, 0);
            tl.to(k.material.emissive, { r: 0, g: 0, b: 0, duration: 0.1 }, 0);
            tl.to(k.material, { emissiveIntensity: 0, duration: 0.1 }, 0);
            
            tl.to(k.position, { x: -1 + i * 0.85, y: 2.3, z: 3.5, duration: 0.1 }, 0);
            tl.to(k.rotation, { x: 0, y: 0, z: 0, duration: 0.1 }, 0);
            tl.to(k.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(1.5)" }, 0.2 + (i * 0.05));
        });
        
        tl.to(armGroup.position, { x: 0, duration: 1, ease: "power2.inOut" }, 0.5);
    };

    // --- STEP 3 ORACLE PHYSICS ---
    triggerOracleAnimRef.current = () => {
        if (oracleTimeline.current) oracleTimeline.current.kill();
        const tl = gsap.timeline();
        oracleTimeline.current = tl;
        
        tl.to(blobMat, { opacity: 0.2, duration: 0.3 }, 0); 
        
        tl.to(redCore.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: "back.out(1.5)" }, 0);
        tl.to(redCoreMat, { opacity: 0.9, duration: 0.2 }, 0);
        tl.to(redCore.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.inOut" }, 0.4);
    };

    resetOracleAnimRef.current = () => {
        if (oracleTimeline.current) oracleTimeline.current.kill();
        const tl = gsap.timeline();
        oracleTimeline.current = tl;
        
        tl.to(redCore.scale, { x: 0, y: 0, z: 0, duration: 0.4, ease: "back.in(1.5)" }, 0);
        tl.to(redCoreMat, { opacity: 0, duration: 0.3 }, 0.1);
        tl.to(redCoreMat.color, { r: 1, g: 0, b: 0.2, duration: 0 }, 0); // reset back to red #ff0033
        
        tl.to(blob.scale, { x: 1, y: 1, z: 1, duration: 0.4 }, 0.1);
        tl.to(blobMat, { opacity: 0.6, duration: 0.4 }, 0.1);
    };

    // --- STEP 4 MEASUREMENT PHYSICS ---
    triggerCollapseAnimRef.current = () => {
        if (measureTimeline.current) measureTimeline.current.kill();
        const tl = gsap.timeline();
        measureTimeline.current = tl;
        
        tl.to(blob.scale, { x: 0, y: 0, z: 0, duration: 0.2, ease: "back.in(2)" }, 0);
        tl.to(redCore.scale, { x: 0, y: 0, z: 0, duration: 0.2, ease: "back.in(2)" }, 0);
        tl.to(blobMat, { opacity: 0, duration: 0.2 }, 0);
        tl.to(redCoreMat, { opacity: 0, duration: 0.2 }, 0);
        
        keys.forEach((k) => {
            tl.to(k.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "back.out(2)" }, 0.1);
        });
        
        tl.call(() => {
            ledMat.emissive.setHex(0xff0033);
            ledMat.color.setHex(0xff0033);
        }, [], 0.1);
    };

    restoreCollapseAnimRef.current = () => {
        if (measureTimeline.current) measureTimeline.current.kill();
        const tl = gsap.timeline();
        measureTimeline.current = tl;
        
        keys.forEach((k) => {
            tl.to(k.scale, { x: 0, y: 0, z: 0, duration: 0.4, ease: "power2.in" }, 0);
        });
        
        tl.call(() => {
            ledMat.emissive.setHex(0x111111);
            ledMat.color.setHex(0x111111);
        }, [], 0.2);
        
        tl.to(blob.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }, 0.4);
        tl.to(blobMat, { opacity: 0.6, duration: 0.8 }, 0.4);
        
        if (selectedBarRef.current !== null) {
            tl.to(redCore.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.6, ease: "elastic.out(1, 0.5)" }, 0.6);
            tl.to(redCoreMat, { opacity: 0.9, duration: 0.6 }, 0.6);
            tl.to(blobMat, { opacity: 0.2, duration: 0.4 }, 0.6); 
        }
    };
    
    // --- STEP 5 DIFFUSER PHYSICS ---
    triggerThreeDiffuserRef.current = () => {
        if (diffuserTimeline.current) diffuserTimeline.current.kill();
        const tl = gsap.timeline();
        diffuserTimeline.current = tl;
        
        tl.set(shockwave.scale, { x: 0.1, y: 0.1, z: 0.1 }, 1.4);
        tl.to(shockwave.scale, { x: 3, y: 3, z: 3, duration: 1.2, ease: "power2.out" }, 1.4);
        tl.to(shockwaveMat, { opacity: 0.6, duration: 0.2 }, 1.4);
        tl.to(shockwaveMat, { opacity: 0, duration: 1.0 }, 1.6);
        
        tl.to(redCore.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 1.0, ease: "elastic.out(1, 0.5)" }, 1.4);
        tl.to(redCoreMat.color, { r: 0, g: 1, b: 1, duration: 0.6 }, 1.4); 
        
        tl.to(blob.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 1.0, ease: "elastic.out(1, 0.5)" }, 1.4);
        tl.to(blobMat, { opacity: 0.9, duration: 1.0 }, 1.4);
    };
    
    resetThreeDiffuserRef.current = () => {
        if (diffuserTimeline.current) diffuserTimeline.current.kill();
        
        gsap.set(shockwave.scale, { x: 0.1, y: 0.1, z: 0.1 });
        gsap.set(shockwaveMat, { opacity: 0 });
        
        gsap.to(redCore.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.3 });
        gsap.to(redCoreMat.color, { r: 1, g: 0, b: 0.2, duration: 0.3 }); 
        
        gsap.to(blob.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
        gsap.to(blobMat, { opacity: 0.2, duration: 0.3 });
    };
    
    // --- STEP 6 GEOMETRIC PHYSICS ---
    triggerThreeGeometricRef.current = () => {
        if (geometricTimeline.current) geometricTimeline.current.kill();
        const tl = gsap.timeline();
        geometricTimeline.current = tl;
        
        const toHide = [blob.scale, redCore.scale, armGroup.scale, vaultGroup.scale, table.scale];
        keys.forEach(k => toHide.push(k.scale));
        
        tl.to(toHide, { x: 0, y: 0, z: 0, duration: 1, ease: "power2.inOut" }, 0);
        tl.to(geometricGroup.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 1.5, ease: "elastic.out(1, 0.7)" }, 1);
        tl.to(geometricGroup.position, { x: 0, y: 4, duration: 1 }, 0); // Ensure centered
        
        tl.call(() => {
            const theta = Math.asin(1 / Math.sqrt(8));
            sLineGeo.setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(Math.cos(theta)*3.8, Math.sin(theta)*3.8, 0)]);
            labelS.position.set(Math.cos(theta)*3.7, Math.sin(theta)*3.7 + 0.3, 0);
            
            arc1Mat.opacity = 0;
            arc2Mat.opacity = 0;
            labelR.material.opacity = 0.8;
            labelW.material.opacity = 0.8;
            labelS.material.opacity = 0.8;
            labelTheta1.material.opacity = 0;
            labelTheta2.material.opacity = 0;
            setRotationProgress(0); 
            if (updateThreeRotationRef.current) updateThreeRotationRef.current(0);
        }, [], 1);
    };
    
    resetThreeGeometricRef.current = () => {
        if (geometricTimeline.current) geometricTimeline.current.kill();
        const tl = gsap.timeline();
        geometricTimeline.current = tl;
        
        tl.to(geometricGroup.scale, { x: 0, y: 0, z: 0, duration: 0.8, ease: "power2.in" }, 0);
        tl.to(geometricGroup.position, { x: 0, y: 4, duration: 1 }, 0); // Ensure centered
        
        const toShow = [armGroup.scale, vaultGroup.scale, table.scale];
        keys.forEach(k => toShow.push(k.scale));
        tl.to(toShow, { x: 1, y: 1, z: 1, duration: 1, ease: "power2.out" }, 0.8);
        
        tl.to(blob.scale, { x: 1, y: 1, z: 1, duration: 1 }, 0.8);
        if (selectedBarRef.current !== null) {
            tl.to(redCore.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 1 }, 0.8);
        }
    };
    
    updateThreeRotationRef.current = (val) => {
        const p = val / 100;
        let currentAngle;
        const theta = Math.asin(1 / Math.sqrt(8));
        
        if (p <= 0.5) {
            const t = p * 2;
            currentAngle = theta * (1 - t) + (-theta) * t;
            arc1Mat.opacity = t;
            arc2Mat.opacity = 0;
            labelTheta1.material.opacity = t;
            labelTheta2.material.opacity = 0;
        } else {
            const t = (p - 0.5) * 2;
            currentAngle = (-theta) * (1 - t) + (3 * theta) * t;
            arc1Mat.opacity = 1;
            arc2Mat.opacity = t;
            labelTheta1.material.opacity = 1;
            labelTheta2.material.opacity = t;
        }
        stateArrow.setDirection(new THREE.Vector3(Math.cos(currentAngle), Math.sin(currentAngle), 0));
    };

    // --- STEP 7 SANDBOX THREEJS ---
    triggerSandboxOracleRef.current = () => {
        const currentAngle = sandboxAngleRef.current;
        const newAngle = -currentAngle;
        sandboxAngleRef.current = newAngle;
        
        const obj = { a: currentAngle };
        gsap.to(obj, { a: newAngle, duration: 0.4, onUpdate: () => {
            stateArrow.setDirection(new THREE.Vector3(Math.cos(obj.a), Math.sin(obj.a), 0));
        }});
    };
    
    triggerSandboxDiffuserRef.current = () => {
        const currentAngle = sandboxAngleRef.current;
        const theta32 = Math.asin(1/Math.sqrt(32));
        const newAngle = 2 * theta32 - currentAngle;
        sandboxAngleRef.current = newAngle;
        
        const obj = { a: currentAngle };
        gsap.to(obj, { a: newAngle, duration: 0.8, ease: "elastic.out(1, 0.5)", onUpdate: () => {
            stateArrow.setDirection(new THREE.Vector3(Math.cos(obj.a), Math.sin(obj.a), 0));
        }});
    };


    // --- RENDER LOOP ---
    let rafId;
    function animate() {
        rafId = requestAnimationFrame(animate);
        composer.render();
    }
    animate();

    const handleResize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const newAspect = width / height;
        camera.left = -d * newAspect;
        camera.right = d * newAspect;
        camera.top = d;
        camera.bottom = -d;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        composer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', handleResize);
        if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }
        renderer.dispose();
    };
  }, []);

  // Sync Slider to Three.js
  useEffect(() => {
      if (updateThreeRotationRef.current && activeStep === 6) {
          updateThreeRotationRef.current(rotationProgress);
      }
  }, [rotationProgress, activeStep]);
  
  // (Removed wheel listener)

  // --- HORIZONTAL D3 BAR GRAPH SETUP (Steps 1-6) ---
  useEffect(() => {
    if (!d3CanvasRef.current) return;
    const svg = d3.select(d3CanvasRef.current);
    svg.selectAll("*").remove();

    const container = d3CanvasRef.current.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const margin = { top: 40, right: 65, bottom: 20, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand()
                .domain(d3.range(8))
                .range([0, innerHeight])
                .padding(0.3);
                
    yScaleRef.current = y;

    const x = d3.scaleLinear()
                .domain([-1, 1])
                .range([0, innerWidth]);

    g.append('line')
     .attr('class', 'axis-line')
     .attr('x1', x(0))
     .attr('x2', x(0))
     .attr('y1', 0)
     .attr('y2', innerHeight)
     .attr('stroke', 'rgba(255, 255, 255, 0.4)')
     .attr('stroke-width', 1)
     .attr('stroke-dasharray', '4,4');

    g.append('line')
      .attr('class', 'mean-line')
      .attr('x1', x(0.265)).attr('x2', x(0.265))
      .attr('y1', 0).attr('y2', innerHeight)
      .attr('stroke', '#cccccc').attr('stroke-dasharray', '4,4')
      .style('opacity', 0);
      
    g.append('text')
      .attr('class', 'mean-label')
      .attr('x', x(0.265) + 5).attr('y', 10)
      .attr('fill', '#cccccc')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .text('Mean (μ)')
      .style('opacity', 0);

    svg.append('text')
     .attr('class', 'title-text')
     .attr('x', margin.left + innerWidth / 2)
     .attr('y', 20)
     .attr('fill', '#00ffff')
     .attr('text-anchor', 'middle')
     .style('font-family', 'monospace')
     .style('font-size', '10px')
     .style('letter-spacing', '1px')
     .text('AMPLITUDES');

    g.selectAll('.state-label')
     .data(d3.range(8))
     .enter()
     .append('text')
     .attr('class', 'state-label')
     .attr('x', -8)
     .attr('y', d => y(d) + y.bandwidth() / 2)
     .attr('fill', 'rgba(255, 255, 255, 0.7)')
     .attr('text-anchor', 'end')
     .attr('alignment-baseline', 'middle')
     .style('font-family', 'monospace')
     .style('font-size', '10px')
     .text(d => `|${d.toString(2).padStart(3, '0')}>`);

    const bars = g.selectAll('.amp-bar')
     .data(d3.range(8))
     .enter()
     .append('rect')
     .attr('class', 'amp-bar')
     .attr('y', d => y(d))
     .attr('x', x(0)) 
     .attr('height', y.bandwidth())
     .attr('width', 0) 
     .attr('fill', '#00ffff')
     .attr('rx', 2)
     .style('filter', 'drop-shadow(0px 0px 6px rgba(0,255,255,0.7))');

    const labels = g.selectAll('.amp-value')
     .data(d3.range(8))
     .enter()
     .append('text')
     .attr('class', 'amp-value')
     .attr('y', d => y(d) + y.bandwidth() / 2)
     .attr('x', x(0) + 5) 
     .attr('fill', '#00ffff')
     .attr('text-anchor', 'start')
     .attr('alignment-baseline', 'middle')
     .style('font-family', 'monospace')
     .style('font-size', '9px')
     .style('opacity', 0)
     .text('0.000');
     
    const probs = g.selectAll('.prob-label')
     .data(d3.range(8))
     .enter()
     .append('text')
     .attr('class', 'prob-label')
     .attr('y', d => y(d) + y.bandwidth() / 2)
     .attr('x', innerWidth + 5) 
     .attr('fill', '#cccccc')
     .attr('text-anchor', 'start')
     .attr('alignment-baseline', 'middle')
     .style('font-family', 'monospace')
     .style('font-size', '8px')
     .style('opacity', 0)
     .text('P=12.5%');
     
    // --- Step 3 Interaction Logic ---
    performD3SelectionRef.current = (d) => {
        setSelectedKey(d);
        
        if (selectedBarRef.current !== null && selectedBarRef.current !== d) {
            const prevBar = svg.selectAll('.amp-bar').filter(bd => bd === selectedBarRef.current);
            const prevLabel = svg.selectAll('.amp-value').filter(bd => bd === selectedBarRef.current);
            
            prevBar.transition().duration(getD(800)).ease(d3.easeCubicInOut)
                   .attr('x', x(0))
                   .attr('width', x(0.353) - x(0))
                   .attr('fill', '#00ffff')
                   .style('filter', 'drop-shadow(0px 0px 6px rgba(0,255,255,0.7))');
                   
            prevLabel.transition().duration(getD(800)).ease(d3.easeCubicInOut)
                     .attr('x', x(0.353) + 5)
                     .attr('text-anchor', 'start')
                     .text('+0.353')
                     .attr('fill', '#00ffff');
        }
        
        selectedBarRef.current = d;
        
        svg.selectAll('.amp-bar').filter(bd => bd === d).transition().duration(getD(800)).ease(d3.easeCubicInOut)
              .attr('x', x(-0.353))
              .attr('width', x(0) - x(-0.353))
              .attr('fill', '#ff0033')
              .style('filter', 'drop-shadow(0px 0px 12px rgba(255,0,51,0.8))');
              
        svg.selectAll('.amp-value').filter(bd => bd === d)
                .transition().duration(getD(800)).ease(d3.easeCubicInOut)
                .attr('x', x(-0.353) - 5)
                .attr('text-anchor', 'end')
                .text('-0.353')
                .attr('fill', '#ff0033');
                
        if (triggerOracleAnimRef.current) triggerOracleAnimRef.current();
    };
     
    bars.on('mouseenter', function(event, d) {
        if (activeStepRef.current !== 3) return;
        const isSelected = selectedBarRef.current === d;
        d3.select(this)
          .style('cursor', 'pointer')
          .transition().duration(getD(200))
          .style('opacity', 1)
          .style('filter', 'drop-shadow(0px 0px 12px rgba(255,255,255,0.8))')
          .attr('fill', isSelected ? '#ff0033' : '#cccccc');
    })
    .on('mouseleave', function(event, d) {
        if (activeStepRef.current !== 3) return;
        const isSelected = selectedBarRef.current === d;
        d3.select(this)
          .transition().duration(getD(200))
          .style('opacity', isSelected ? 1 : 0.9)
          .style('filter', isSelected ? 'drop-shadow(0px 0px 12px rgba(255,0,51,0.8))' : 'drop-shadow(0px 0px 6px rgba(0,255,255,0.7))')
          .attr('fill', isSelected ? '#ff0033' : '#00ffff');
    })
    .on('click', function(event, d) {
        if (activeStepRef.current !== 3) return;
        if (selectedBarRef.current === d) return;
        if (performD3SelectionRef.current) performD3SelectionRef.current(d);
    });

    triggerD3HadamardRef.current = () => {
        bars.transition()
            .duration(getD(1500))
            .ease(d3.easeCubicInOut)
            .attr('x', x(0))
            .attr('width', x(0.353) - x(0))
            .attr('fill', '#00ffff');
            
        labels.transition()
            .duration(getD(1500))
            .ease(d3.easeCubicInOut)
            .style('opacity', 1)
            .attr('x', x(0.353) + 5)
            .attr('text-anchor', 'start')
            .text('+0.353')
            .attr('fill', '#00ffff');
            
        selectedBarRef.current = null;
        setSelectedKey(null);
    };
    
    resetD3OracleRef.current = () => {
        if (selectedBarRef.current !== null) {
            const prevBar = svg.selectAll('.amp-bar').filter(bd => bd === selectedBarRef.current);
            const prevLabel = svg.selectAll('.amp-value').filter(bd => bd === selectedBarRef.current);
            
            prevBar.transition().duration(getD(800)).ease(d3.easeCubicInOut)
                   .attr('x', x(0))
                   .attr('width', x(0.353) - x(0))
                   .attr('fill', '#00ffff')
                   .style('filter', 'drop-shadow(0px 0px 6px rgba(0,255,255,0.7))');
                   
            prevLabel.transition().duration(getD(800)).ease(d3.easeCubicInOut)
                     .attr('x', x(0.353) + 5)
                     .attr('text-anchor', 'start')
                     .text('+0.353')
                     .attr('fill', '#00ffff');
                     
            selectedBarRef.current = null;
            setSelectedKey(null);
        }
    };
    
    triggerD3MeasurementRef.current = () => {
        let target = selectedBarRef.current;
        let randomCyan = Math.floor(Math.random() * 8);
        if (target !== null) {
            while (randomCyan === target) randomCyan = Math.floor(Math.random() * 8);
        }
        
        bars.transition().duration(getD(200)).ease(d3.easeQuadOut)
            .attr('x', x(0))
            .attr('width', 0)
            .attr('fill', '#00ffff');
        labels.transition().duration(getD(200)).ease(d3.easeQuadOut)
            .attr('x', x(0) + 5)
            .text('0.000')
            .attr('fill', '#00ffff');
        probs.transition().duration(getD(200))
            .text('P=0%');
            
        bars.filter(d => d === randomCyan)
            .transition().duration(getD(200)).ease(d3.easeQuadOut)
            .attr('x', x(0))
            .attr('width', x(1.0) - x(0))
            .attr('fill', '#00ffff');
        labels.filter(d => d === randomCyan)
            .transition().duration(getD(200)).ease(d3.easeQuadOut)
            .attr('x', x(1.0) + 5)
            .text('+1.000');
        probs.filter(d => d === randomCyan)
            .transition().duration(getD(200))
            .text('P=100%');
    };
    
    restoreD3MeasurementRef.current = () => {
        const target = selectedBarRef.current;
        bars.transition().duration(getD(800)).ease(d3.easeCubicInOut)
            .attr('x', d => d === target ? x(-0.353) : x(0))
            .attr('width', d => d === target ? x(0) - x(-0.353) : x(0.353) - x(0))
            .attr('fill', d => d === target ? '#ff0033' : '#00ffff');
            
        labels.transition().duration(getD(800)).ease(d3.easeCubicInOut)
            .attr('x', d => d === target ? x(-0.353) - 5 : x(0.353) + 5)
            .attr('text-anchor', d => d === target ? 'end' : 'start')
            .text(d => d === target ? '-0.353' : '+0.353')
            .attr('fill', d => d === target ? '#ff0033' : '#00ffff');
            
        probs.transition().duration(getD(800)).text('P=12.5%');
    };

    triggerD3DiffuserRef.current = () => {
        const target = selectedBarRef.current;
        if (target === null) return; 
        
        svg.select('.mean-line').transition().duration(getD(800)).style('opacity', 1);
        svg.select('.mean-label').transition().duration(getD(800)).style('opacity', 1);
        
        bars.transition().delay(getD(1400)).duration(getD(1200)).ease(d3.easeCubicOut)
           .tween("attr", function(d) {
               const vStart = d === target ? -0.353 : 0.353;
               const vEnd = d === target ? 0.883 : 0.177;
               const i = d3.interpolate(vStart, vEnd);
               const isTarget = d === target;
               const c = d3.interpolateRgb('#ff0033', '#00ffff');
               
               return function(t) {
                   const v = i(t);
                   d3.select(this)
                     .attr('x', Math.min(x(0), x(v)))
                     .attr('width', Math.abs(x(v) - x(0)));
                     
                   if (isTarget) {
                       d3.select(this).attr('fill', c(t))
                         .style('filter', `drop-shadow(0px 0px 12px ${c(t)})`);
                   }
               };
           });
           
        labels.transition().delay(getD(1400)).duration(getD(1200)).ease(d3.easeCubicOut)
           .tween("text", function(d) {
               const vStart = d === target ? -0.353 : 0.353;
               const vEnd = d === target ? 0.883 : 0.177;
               const i = d3.interpolate(vStart, vEnd);
               const isTarget = d === target;
               const c = d3.interpolateRgb('#ff0033', '#00ffff');
               
               return function(t) {
                   const v = i(t);
                   d3.select(this)
                     .attr('x', v < 0 ? x(v) - 5 : x(v) + 5)
                     .attr('text-anchor', v < 0 ? 'end' : 'start')
                     .text((v > 0 ? '+' : '') + v.toFixed(3));
                     
                   if (isTarget) {
                       d3.select(this).attr('fill', c(t));
                   }
               };
           });
           
        setTimeout(() => { setIsDiffusing(false); }, 2600);
    };
    
    resetD3DiffuserRef.current = () => {
        const target = selectedBarRef.current;
        svg.select('.mean-line').interrupt().style('opacity', 0);
        svg.select('.mean-label').interrupt().style('opacity', 0);
        
        if (target !== null) {
            bars.interrupt()
                .attr('x', d => d === target ? x(-0.353) : x(0))
                .attr('width', d => d === target ? x(0) - x(-0.353) : x(0.353) - x(0))
                .attr('fill', d => d === target ? '#ff0033' : '#00ffff')
                .style('filter', d => d === target ? 'drop-shadow(0px 0px 12px #ff0033)' : 'drop-shadow(0px 0px 6px rgba(0,255,255,0.7))');
                
            labels.interrupt()
                .attr('x', d => d === target ? x(-0.353) - 5 : x(0.353) + 5)
                .attr('text-anchor', d => d === target ? 'end' : 'start')
                .attr('fill', d => d === target ? '#ff0033' : '#00ffff')
                .text(d => d === target ? '-0.353' : '+0.353');
        }
    };
    
    triggerD3GeometricRef.current = () => {
        const target = selectedBarRef.current;
        svg.selectAll('.mean-line, .mean-label, .prob-label, .state-label, .amp-value, .title-text, .axis-line')
           .transition().duration(getD(500)).style('opacity', 0);
           
        bars.transition().duration(getD(1000)).ease(d3.easeCubicInOut)
            .attr('y', innerHeight / 2)
            .attr('height', 4)
            .style('transform-origin', `${x(0)}px ${innerHeight/2}px`);
            
        if (target !== null) {
            bars.filter(d => d === target)
                .transition().delay(getD(1000)).duration(getD(800)).ease(d3.easeBackOut)
                .attr('transform', `rotate(-90)`);
        }
        
        if (d3WrapperRef.current) {
            gsap.to(d3WrapperRef.current, { opacity: 0, duration: 1, delay: 2 });
        }
    };
    
    resetD3GeometricRef.current = () => {
        if (d3WrapperRef.current) {
            gsap.killTweensOf(d3WrapperRef.current);
            gsap.to(d3WrapperRef.current, { opacity: 1, duration: 0.5 });
        }
        bars.interrupt().attr('transform', null).attr('y', d => yScaleRef.current(d)).attr('height', yScaleRef.current.bandwidth());
        svg.selectAll('.state-label, .amp-value, .title-text, .axis-line').interrupt().style('opacity', 1);
        svg.selectAll('.mean-line, .mean-label').interrupt().style('opacity', 0);
    };

  }, []);

  // --- VERTICAL D3 64-BAR GRAPH SETUP (Step 7 Sandbox) ---
  useEffect(() => {
    if (!sandboxD3Ref.current) return;
    const svg = d3.select(sandboxD3Ref.current);
    
    initSandboxRef.current = () => {
        svg.selectAll("*").remove();
        
        const width = sandboxD3Ref.current.clientWidth;
        const height = sandboxD3Ref.current.clientHeight;
        const margin = { top: 20, right: 10, bottom: 20, left: 30 };
        const innerW = width - margin.left - margin.right;
        const innerH = height - margin.top - margin.bottom;

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().domain(d3.range(32)).range([0, innerW]).padding(0.1);
        const y = d3.scaleLinear().domain([-1.0, 1.0]).range([innerH, 0]);

        // 0 Axis
        g.append('line')
         .attr('x1', 0).attr('x2', innerW)
         .attr('y1', y(0)).attr('y2', y(0))
         .attr('stroke', 'rgba(255, 255, 255, 0.5)');
         
        // Mean Line (dynamic)
        const a0 = 1/Math.sqrt(32);
        g.append('line')
         .attr('class', 'sandbox-mean-line')
         .attr('x1', 0).attr('x2', innerW)
         .attr('y1', y(a0)).attr('y2', y(a0))
         .attr('stroke', '#cccccc').attr('stroke-dasharray', '4,4')
         .style('opacity', 0);

        amplitudesRef.current = new Array(32).fill(a0);
        sandboxTargetRef.current = Math.floor(Math.random() * 32);
        sandboxAngleRef.current = Math.asin(a0);
        setSandboxProbability(Math.pow(a0, 2) * 100);
        setSandboxLoops(0);
        setSandboxStatus('idle');
        setIsOracleNext(true);

        g.selectAll('.sb-bar').data(d3.range(32)).enter().append('rect')
         .attr('class', 'sb-bar')
         .attr('x', d => x(d))
         .attr('width', x.bandwidth())
         .attr('y', y(a0))
         .attr('height', Math.abs(y(a0) - y(0)))
         .attr('fill', '#00ffff')
         .attr('rx', 1);
    };
    
    initSandboxRef.current();

  }, []);

  // Sandbox ↓D3 Handlers
  const handleSandboxOracle = () => {
      setIsOracleNext(false);
      const amps = amplitudesRef.current;
      const target = sandboxTargetRef.current;
      amps[target] = -amps[target];
      
      const svg = d3.select(sandboxD3Ref.current);
      const y = d3.scaleLinear().domain([-1.0, 1.0]).range([sandboxD3Ref.current.clientHeight - 40, 0]);
      
      svg.selectAll('.sb-bar')
        .filter(d => d === target)
        .transition().duration(getD(400))
        .attr('y', Math.min(y(0), y(amps[target])))
        .attr('height', Math.abs(y(amps[target]) - y(0)))
        .attr('fill', '#ff0033')
        .style('filter', 'drop-shadow(0px 0px 8px #ff0033)');
        
      if (triggerSandboxOracleRef.current) triggerSandboxOracleRef.current();
  };

  const handleSandboxDiffuser = () => {
      setIsOracleNext(true);
      const amps = amplitudesRef.current;
      const sum = amps.reduce((a,b) => a+b, 0);
      const mean = sum / 32;
      
      for(let i=0; i<32; i++){
          amps[i] = 2 * mean - amps[i];
      }
      
      const newProb = Math.pow(amps[sandboxTargetRef.current], 2) * 100;
      setSandboxProbability(newProb);
      setSandboxLoops(l => l + 1);
      
      const svg = d3.select(sandboxD3Ref.current);
      const y = d3.scaleLinear().domain([-1.0, 1.0]).range([sandboxD3Ref.current.clientHeight - 40, 0]);
      
      svg.select('.sandbox-mean-line')
         .style('opacity', 1)
         .attr('y1', y(mean)).attr('y2', y(mean))
         .transition().duration(getD(800)).style('opacity', 0);
      
      svg.selectAll('.sb-bar')
        .transition().duration(getD(800)).ease(d3.easeElastic)
        .attr('y', d => Math.min(y(0), y(amps[d])))
        .attr('height', d => Math.abs(y(amps[d]) - y(0)))
        .attr('fill', '#00ffff')
        .style('filter', 'none');
        
      if (triggerSandboxDiffuserRef.current) triggerSandboxDiffuserRef.current();
  };

  const handleSandboxMeasure = () => {
      if (sandboxProbability > 95) {
          setSandboxStatus('win');
          if (triggerSandboxWinRef.current) triggerSandboxWinRef.current();
      } else {
          setSandboxStatus('lose');
      }
  };

  useEffect(() => {
      if (!d3CanvasRef.current) return;
      const svg = d3.select(d3CanvasRef.current);
      if (activeStep === 4) {
          svg.selectAll('.prob-label').transition().duration(getD(500)).style('opacity', 0.8);
      } else {
          svg.selectAll('.prob-label').transition().duration(getD(500)).style('opacity', 0);
      }
  }, [activeStep]);


  // --- SCROLL OBSERVER ---
  useEffect(() => {
      const observer = new IntersectionObserver((entries) => {
          let intersectingId = null;
          entries.forEach(entry => {
              if (entry.isIntersecting) {
                  intersectingId = entry.target.id;
              }
          });

          if (intersectingId) {
              let newStep = activeStepRef.current;
              if (intersectingId === 'step-1') newStep = 1;
              if (intersectingId === 'step-2-hadamard') newStep = 2;
              if (intersectingId === 'step-3-oracle') newStep = 3;
              if (intersectingId === 'step-4-measure') newStep = 4;
              if (intersectingId === 'step-5-diffuser') newStep = 5;
              if (intersectingId === 'step-6-geometry') newStep = 6;
              if (intersectingId === 'step-7-sandbox') newStep = 7;
              if (intersectingId === 'step-8-deep-dive') newStep = 8;
              if (newStep !== activeStepRef.current) {
                  isJumpingRef.current = Math.abs(newStep - activeStepRef.current) > 1;
                  gsap.globalTimeline.timeScale(isJumpingRef.current ? 1000 : 1);
                  let current = activeStepRef.current;
                  if (current < newStep) {
                      while (current < newStep) {
                          if (current === 1) {
                              if (fireHadamardAnim.current) fireHadamardAnim.current();
                          } else if (current === 3) {
                              if (selectedBarRef.current === null && performD3SelectionRef.current) performD3SelectionRef.current(7);
                          } else if (current === 4) {
                              setIsDiffusing(true);
                              if (triggerD3DiffuserRef.current) triggerD3DiffuserRef.current();
                              if (triggerThreeDiffuserRef.current) triggerThreeDiffuserRef.current();
                          } else if (current === 5) {
                              if (triggerD3GeometricRef.current) triggerD3GeometricRef.current();
                              if (triggerThreeGeometricRef.current) triggerThreeGeometricRef.current();
                          } else if (current === 6) {
                              if (initSandboxRef.current) initSandboxRef.current();
                              if (updateThreeRotationRef.current) updateThreeRotationRef.current(0);
                              // resize handled by useEffect
                          }
                          current++;
                      }
                  } else if (current > newStep) {
                      while (current > newStep) {
                          if (current === 7) {
                              // resize handled by useEffect
                          } else if (current === 6) {
                              if (resetD3GeometricRef.current) resetD3GeometricRef.current();
                              if (resetThreeGeometricRef.current) resetThreeGeometricRef.current();
                          } else if (current === 5) {
                              setIsDiffusing(false);
                              if (resetD3DiffuserRef.current) resetD3DiffuserRef.current();
                              if (resetThreeDiffuserRef.current) resetThreeDiffuserRef.current();
                          } else if (current === 3) {
                              if (resetOracleAnimRef.current) resetOracleAnimRef.current();
                              if (resetD3OracleRef.current) resetD3OracleRef.current();
                              setSelectedKey(null);
                          } else if (current === 2) {
                              if (resetHadamardAnim.current) resetHadamardAnim.current();
                              if (resetD3OracleRef.current) resetD3OracleRef.current();
                          }
                          current--;
                      }
                  }
                  
                  setActiveStep(newStep);
                  isJumpingRef.current = false;
                  gsap.globalTimeline.timeScale(1);
              }
          }
      }, { threshold: 0.5 });
      
      if (step1Ref.current) observer.observe(step1Ref.current);
      if (step2Ref.current) observer.observe(step2Ref.current);
      if (step3Ref.current) observer.observe(step3Ref.current);
      if (step4Ref.current) observer.observe(step4Ref.current);
      if (step5Ref.current) observer.observe(step5Ref.current);
      if (step6Ref.current) observer.observe(step6Ref.current);
      if (step7Ref.current) observer.observe(step7Ref.current);
      if (step8Ref.current) observer.observe(step8Ref.current);
      
      return () => observer.disconnect();
  }, []);

  const handleTryKey = () => {
      if (currentKeyIndex >= 8 || isAnimating || isUnlocked || activeStep > 1) return;
      setIsAnimating(true);
      
      triggerAnimationRef.current(currentKeyIndex, targetKeyIndex, () => {
          setIsAnimating(false);
          if (currentKeyIndex === targetKeyIndex) {
              setIsUnlocked(true);
              setIsAutoPlaying(false);
          } else {
              setCurrentKeyIndex(prev => prev + 1);
          }
      });
  };

  useEffect(() => {
      if (isAutoPlaying && !isAnimating && !isUnlocked && currentKeyIndex < 8 && activeStep === 1) {
          const timer = setTimeout(() => {
              handleTryKey();
          }, 400);
          return () => clearTimeout(timer);
      }
  }, [isAutoPlaying, isAnimating, isUnlocked, currentKeyIndex, activeStep]);

  const handleMeasureClick = () => {
      if (activeStep !== 4 || isMeasuring) return;
      setIsMeasuring(true);
      
      if (triggerD3MeasurementRef.current) triggerD3MeasurementRef.current();
      if (triggerCollapseAnimRef.current) triggerCollapseAnimRef.current();
      
      setTimeout(() => {
          if (restoreD3MeasurementRef.current) restoreD3MeasurementRef.current();
          if (restoreCollapseAnimRef.current) restoreCollapseAnimRef.current();
          setIsMeasuring(false);
      }, 2500);
  };
  
  const replayDiffuser = () => {
      if (isDiffusing || activeStep !== 5) return;
      setIsDiffusing(true);
      
      if (resetD3DiffuserRef.current) resetD3DiffuserRef.current();
      if (resetThreeDiffuserRef.current) resetThreeDiffuserRef.current();
      
      setTimeout(() => {
          if (triggerD3DiffuserRef.current) triggerD3DiffuserRef.current();
          if (triggerThreeDiffuserRef.current) triggerThreeDiffuserRef.current();
      }, 500);
  };

  useEffect(() => {
      const timer = setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
      }, 50);
      return () => clearTimeout(timer);
  }, [activeStep]);

  return (
    <div className="h-screen bg-transparent text-[#2A2A2A] font-sans flex flex-col relative overflow-hidden">
      <WorkbenchBackground />
      
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
          <span className="text-xs font-mono text-[#B75D29] uppercase tracking-widest">Chapter 5</span>
          <h1 className="text-lg font-serif text-[#2A2A2A]">Grover's Algorithm</h1>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden z-10 relative">
        <div className="flex-1 relative bg-[#080810] transition-all duration-1000">
          <div ref={mountRef} className="absolute inset-0 z-0" />
          
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest bg-black/30 px-2 py-1 rounded">
                {activeStep === 7 ? '32-Qubit Sandbox' : (activeStep === 6 ? 'Geometric Representation' : '3D Simulation')}
            </div>
          </div>
          
          <button
              onClick={handleMeasureClick}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-10 py-4 bg-transparent border-4 border-white/80 text-white font-bold tracking-[0.2em] text-2xl rounded-xl hover:bg-white hover:text-black hover:scale-105 transition-all duration-300 z-30 shadow-[0_0_40px_rgba(255,255,255,0.3)] backdrop-blur-sm ${
                  activeStep === 4 && !isMeasuring ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
              }`}
          >
              MEASURE
          </button>
          
          <div className={`absolute top-[25%] left-1/2 -translate-x-1/2 bg-[#ff0033]/90 text-white px-8 py-4 rounded-xl font-mono text-sm tracking-widest shadow-[0_0_40px_rgba(255,0,51,0.8)] border border-[#ff0033] transition-all duration-300 z-40 whitespace-nowrap ${
              isMeasuring ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
          }`}>
              ACCESS DENIED: MEASURED WRONG KEY
          </div>

          {/* D3 8-Bar Overlay (Steps 1-6) */}
          <div 
             ref={d3WrapperRef}
             className={`absolute bottom-6 right-6 w-[280px] h-[340px] bg-black/60 backdrop-blur-md border border-[#333] rounded-xl z-10 ${
                 activeStep >= 2 && activeStep <= 6 ? 'pointer-events-auto' : 'opacity-0 pointer-events-none'
             }`}
          >
             <svg ref={d3CanvasRef} className="w-full h-full" />
             
             <div className={`absolute -top-12 left-1/2 -translate-x-1/2 bg-[#00ffff] text-black px-3 py-1.5 rounded text-xs font-bold shadow-[0_0_12px_rgba(0,255,255,0.6)] whitespace-nowrap transition-all duration-500 pointer-events-none ${
                activeStep === 3 && selectedKey === null ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
             }`}>
                Select your secret key!
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#00ffff]" />
             </div>
          </div>
          
          {/* STEP 7 SPLIT-SCREEN SANDBOX HUD */}
          <div className={`absolute inset-0 flex flex-col transition-opacity duration-1000 ${activeStep === 7 ? 'opacity-100 z-40 pointer-events-auto' : 'opacity-0 -z-10 pointer-events-none'}`}>
              
              <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                  <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Target Probability</div>
                  <div className={`text-5xl font-light font-mono ${sandboxStatus === 'win' ? 'text-[#00ffff]' : (sandboxStatus === 'lose' ? 'text-[#ff0033]' : 'text-white')}`}>
                      {sandboxProbability.toFixed(2)}%
                  </div>
                  <div className="text-xs font-mono text-white/40 mt-1">Grover Loops: {sandboxLoops} / 4</div>
              </div>
              
              <div className="absolute top-1/2 left-8 -translate-y-1/2 w-[340px] h-[280px] bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col pointer-events-none">
                  <div className="text-[9px] font-mono text-white/50 uppercase tracking-widest mb-2">32-Qubit Amplitude Simulator</div>
                  <div className="flex-1 w-full relative">
                      <svg ref={sandboxD3Ref} className="absolute inset-0 w-full h-full" />
                  </div>
              </div>
              
              {sandboxStatus === 'win' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00ffff]/20 border border-[#00ffff] p-6 rounded-2xl backdrop-blur-md text-center pointer-events-auto shadow-[0_0_50px_rgba(0,255,255,0.4)]">
                      <h2 className="text-2xl font-bold text-white mb-2">VAULT UNLOCKED!</h2>
                      <p className="text-[#00ffff] font-mono text-xs mb-4">Quantum Loops: {sandboxLoops} | Classical Average: 16</p>
                      <button onClick={() => { if(initSandboxRef.current) initSandboxRef.current(); }} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-[#00ffff] transition-colors text-sm">
                          PLAY AGAIN
                      </button>
                  </div>
              )}
              
              {sandboxStatus === 'lose' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#ff0033]/20 border border-[#ff0033] p-6 rounded-2xl backdrop-blur-md text-center pointer-events-auto shadow-[0_0_50px_rgba(255,0,51,0.4)]">
                      <h2 className="text-2xl font-bold text-white mb-2">ACCESS DENIED</h2>
                      <p className="text-[#ffaaaa] font-mono text-xs mb-4">Wave Collapsed. Measure exactly at the peak (&gt;95%).</p>
                      <button onClick={() => { if(initSandboxRef.current) initSandboxRef.current(); }} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-[#ff0033] hover:text-white transition-colors text-sm">
                          RETRY
                      </button>
                  </div>
              )}

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-auto items-center">
                  <button 
                      onClick={handleSandboxOracle}
                      disabled={!isOracleNext || sandboxStatus !== 'idle'}
                      className={`px-4 py-3 text-xs font-bold tracking-widest uppercase rounded-xl transition-all border-2 ${!isOracleNext || sandboxStatus !== 'idle' ? 'bg-transparent border-white/20 text-white/30 cursor-not-allowed' : 'bg-transparent border-[#ff0033] text-[#ff0033] hover:bg-[#ff0033] hover:text-white shadow-[0_0_20px_rgba(255,0,51,0.2)]'}`}
                  >
                      Oracle (-θ)
                  </button>
                  
                  <button 
                      onClick={handleSandboxDiffuser}
                      disabled={isOracleNext || sandboxStatus !== 'idle'}
                      className={`px-4 py-3 text-xs font-bold tracking-widest uppercase rounded-xl transition-all border-2 ${isOracleNext || sandboxStatus !== 'idle' ? 'bg-transparent border-white/20 text-white/30 cursor-not-allowed' : 'bg-transparent border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[0_0_20px_rgba(0,255,255,0.2)]'}`}
                  >
                      Diffuser (+2θ)
                  </button>
                  
                  <div className="h-8 w-px bg-white/20 mx-1" />
                  
                  <button 
                      onClick={handleSandboxMeasure}
                      disabled={sandboxStatus !== 'idle'}
                      className={`px-4 py-3 text-xs font-bold tracking-widest uppercase rounded-xl transition-all bg-white text-black hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.4)] ${sandboxStatus !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                      MEASURE
                  </button>
                  
                  <button 
                      onClick={() => { if(initSandboxRef.current) initSandboxRef.current(); }}
                      className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                      Reset
                  </button>
              </div>
          </div>
        </div>

        <div ref={rightPanelRef} className={`bg-white border-l border-[#E4E4E7] flex flex-col relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.03)] overflow-y-auto scroll-smooth transition-all duration-1000 ${activeStep >= 8 ? '!w-full absolute inset-0' : 'w-[440px]'}`}>
          
          <section id="step-1" ref={step1Ref} className="min-h-[100vh] flex flex-col p-6 pt-12 pb-24 relative">
            
            <h2 className="text-3xl font-serif text-[#1A1A1A] font-medium tracking-tight mb-6">The Classical Baseline</h2>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              Imagine a vault with <span className="font-medium text-[#2A2A2A]">8 possible keys</span>. A classical computer has to check them one by one.
            </p>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-12">
              In the worst case scenario, it takes <span className="font-medium text-[#2A2A2A]">7 wrong guesses</span> to find the correct one. Because classical logic has no way to "look ahead", it is essentially testing blindly.
            </p>
            
            <div className="p-5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-xs text-[#A1A1AA] font-mono uppercase tracking-wide">
                    Status: {isUnlocked ? 'Vault Unlocked' : (isAutoPlaying ? 'Auto-Searching...' : 'Awaiting Input')}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleTryKey}
                  disabled={isAnimating || isUnlocked || isAutoPlaying || activeStep > 1}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all shadow-sm ${
                    isAnimating || isUnlocked || isAutoPlaying || activeStep > 1
                      ? 'bg-[#F4F4F5] text-[#A1A1AA] cursor-not-allowed border border-[#E4E4E7]'
                      : 'bg-[#B75D29] hover:bg-[#9A4C20] text-white'
                  }`}
                >
                  {isUnlocked ? 'Vault Unlocked!' : `Try Key ${currentKeyIndex + 1}`}
                </button>

                {!isUnlocked && (
                  <button
                    onClick={() => setIsAutoPlaying(prev => !prev)}
                    disabled={activeStep > 1}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all shadow-sm border ${
                      isAutoPlaying 
                        ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white border-transparent' 
                        : (activeStep > 1 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white hover:bg-[#F4F4F5] text-[#2A2A2A] border-[#E4E4E7]')
                    }`}
                  >
                    {isAutoPlaying ? 'Stop Auto' : 'Auto Play'}
                  </button>
                )}
              </div>
            </div>

            <div className="absolute bottom-10 left-0 right-0 text-center text-[#A1A1AA] text-xs font-mono uppercase tracking-widest animate-pulse">
                Scroll to Continue ↓ 
            </div>
          </section>

          <section id="step-2-hadamard" ref={step2Ref} className="min-h-[100vh] flex flex-col p-6 py-24 bg-[#FAFAFA] border-t border-[#E4E4E7]">
            
            <h2 className="text-3xl font-serif text-[#1A1A1A] font-medium tracking-tight mb-6">The Hadamard Wash</h2>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              Unlike a robot arm testing physical keys, quantum computers map these keys to quantum states (qubits).
            </p>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              By passing our qubits through a <span className="font-medium text-[#2A2A2A]">Hadamard Gate</span>, we blast them into a uniform superposition. Instead of existing as one definite key, the system checks all 8 possibilities simultaneously as a single probability wave.
            </p>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              Notice the visualization on the left. All 8 states now have an identical probability amplitude of <span className="font-mono text-[#B75D29] bg-[#B75D29]/10 px-1 py-0.5 rounded">+0.353</span> (<span className="italic">1 / √8</span>). 
            </p>
          </section>

          <section id="step-3-oracle" ref={step3Ref} className="min-h-[100vh] flex flex-col p-6 py-24 bg-white border-t border-[#E4E4E7] relative">
            
            <h2 className="text-3xl font-serif text-[#1A1A1A] font-medium tracking-tight mb-6">The Oracle's Mark</h2>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              The Oracle acts like a mathematical filter. Because we are in a superposition, we can apply the Oracle to <span className="italic">all keys at the exact same time</span>.
            </p>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              <strong>Pick your secret key from the chart on the left.</strong>
            </p>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              The Oracle recognizes its shape and flips its quantum phase to negative. The overall probability stays the same (since probability is the square of amplitude), but this inverted phase creates a tiny destructive interference footprint we can exploit.
            </p>
          </section>

          <section id="step-4-measure" ref={step4Ref} className="min-h-[100vh] flex flex-col p-6 py-24 bg-[#FAFAFA] border-t border-[#E4E4E7] relative">
            
            <h2 className="text-3xl font-serif text-[#1A1A1A] font-medium tracking-tight mb-6">The Measurement Trap</h2>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              But here is the catch: quantum measurement instantly destroys the wave. 
            </p>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              Because probability is the <strong>amplitude squared</strong> (<span className="italic">P = |α|²</span>), a negative amplitude doesn't actually help us yet. If we measure right now, the probability of finding the red key is <strong>exactly the same</strong> as finding a blue one (12.5%).
            </p>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              Click the glowing <strong>MEASURE</strong> button on the left to force a wave collapse and see what happens.
            </p>
          </section>
          
          <section id="step-5-diffuser" ref={step5Ref} className="min-h-[100vh] flex flex-col p-6 py-24 bg-white border-t border-[#E4E4E7] relative">
            
            <h2 className="text-3xl font-serif text-[#1A1A1A] font-medium tracking-tight mb-6">The Diffuser</h2>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6 italic">
              (Inversion About the Mean)
            </p>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              To amplify the right answer, Grover's algorithm uses a Diffuser. It calculates the average amplitude of the entire system, and then physically reflects every state over that average line. 
            </p>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-8">
              Watch how the math forces the wrong answers to shrink and the right answer to grow exponentially.
            </p>
            
            <button
                onClick={replayDiffuser}
                disabled={isDiffusing || activeStep !== 5}
                className={`w-full py-4 px-4 rounded-xl text-[17px] font-bold tracking-widest uppercase transition-all shadow-md ${
                    isDiffusing || activeStep !== 5
                      ? 'bg-[#F4F4F5] text-[#A1A1AA] cursor-not-allowed border border-[#E4E4E7]'
                      : 'bg-[#00ffff] hover:bg-[#00e6e6] text-[#080810]'
                }`}
            >
                {isDiffusing ? 'Diffusing...' : 'Replay Diffuser'}
            </button>
          </section>
          
          <section id="step-6-geometry" ref={step6Ref} className="min-h-[100vh] flex flex-col p-6 py-24 bg-[#FAFAFA] border-t border-[#E4E4E7] relative">
            
            <h2 className="text-3xl font-serif text-[#1A1A1A] font-medium tracking-tight mb-6">Dimensional Compression</h2>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              Looking at 8 distinct bars bouncing up and down can feel chaotic. 
            </p>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              But notice something mathematically beautiful: because the Oracle and Diffuser treat all wrong answers identically, they always move as a single synchronized block.
            </p>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              We can compress the entire messy chart into just two dimensions. All 7 wrong answers merge into the horizontal <span className="font-mono bg-gray-200 px-1 rounded text-xs">|r⟩</span> axis, and our 1 correct answer becomes the vertical <span className="font-mono bg-gray-200 px-1 rounded text-xs">|w⟩</span> axis.
            </p>
            <p className="text-[17px] text-[#2A2A2A] font-medium leading-relaxed mb-8">
              Grover's algorithm is just a single vector rotating by 2θ on a flat circle!
            </p>
            
            <div className={`mt-4 bg-[#1A1A1A] border border-[#333] p-6 rounded-xl shadow-lg transition-opacity duration-500 ${activeStep === 6 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="h-[1px] w-8 bg-[#00ffff]/30"></div>
                    <label className="text-xs font-bold text-[#00ffff] uppercase tracking-widest text-center">
                        SCRUB THE ROTATION
                    </label>
                    <div className="h-[1px] w-8 bg-[#00ffff]/30"></div>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={rotationProgress} 
                    onChange={(e) => setRotationProgress(parseInt(e.target.value))}
                    className="w-full accent-[#00ffff] hover:accent-white transition-all h-2 bg-[#333] rounded-lg appearance-none cursor-pointer shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                />
                <div className="flex justify-between mt-4 text-xs font-mono text-gray-400">
                    <span className="text-[#aaaaaa]">Start (|s&gt;)</span>
                    <span className="text-[#ff0033]">Oracle (-θ)</span>
                    <span className="text-[#00ffff]">Diffuser (+2θ)</span>
                </div>
            </div>
            
            <div className="absolute bottom-10 left-0 right-0 text-center text-[#A1A1AA] text-xs font-mono uppercase tracking-widest animate-pulse">
                Scroll to Enter Sandbox ↓ 
            </div>
          </section>
          
          <section id="step-7-sandbox" ref={step7Ref} className="min-h-[100vh] flex flex-col p-6 py-24 bg-white border-t border-[#E4E4E7] relative">
            
            <h2 className="text-3xl font-serif text-[#1A1A1A] font-medium tracking-tight mb-6">The Sandbox ↓Finale</h2>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              Welcome to the full 32-qubit Grover's Algorithm sandbox. Here you have a vault with 32 possible keys, but only one is correct.
            </p>
            <p className="text-[17px] text-[#4A4A4A] leading-relaxed mb-6">
              Your goal is to increase the probability of finding the target key to above 95% before measuring.
            </p>
            <div className="p-5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl space-y-3 mb-6">
              <h3 className="text-[17px] font-bold text-[#2A2A2A]">How to Perform Grover's:</h3>
              <ol className="list-decimal pl-4 text-xs text-[#71717A] space-y-2">
                <li>Click <strong>[Oracle (-θ)]</strong> to mark the secret key, flipping its quantum phase downwards.</li>
                <li>Click <strong>[Diffuser (+2θ)]</strong> to fold the probabilities around the average, shrinking the wrong answers and growing the target.</li>
                <li>Repeat this cycle. Notice how the target probability climbs rapidly!</li>
                <li>But be carefulif you loop too many times, the wave collapses in on itself and you'll miss the target.</li>
                <li>When the probability hits peak amplitude (&gt;95%), click <strong>[MEASURE]</strong> to unlock the vault.</li>
              </ol>
            </div>
          </section>

          <section id="step-8-deep-dive" ref={step8Ref} className="min-h-[100vh] bg-[#FAFAFA] relative border-t border-[#E4E4E7] transition-all duration-1000 z-30 flex flex-col items-center">
              {/* Background Pattern */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-30" style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='40' viewBox='0 0 120 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 Q 30 40, 60 20 T 120 20' stroke='rgba(210, 180, 140, 0.4)' fill='none' stroke-width='1'/%3E%3Cpath d='M0 20 Q 30 0, 60 20 T 120 20' stroke='rgba(210, 180, 140, 0.4)' fill='none' stroke-width='1'/%3E%3C/svg%3E")`, 
                  backgroundSize: '120px 40px' 
              }}></div>
              
              <div className="max-w-[1000px] w-full mx-auto relative z-10 px-8 py-24 font-serif">
                  
                  {/* HERO HEADER */}
                  <div className="text-center mb-16">
                      <div className="text-xs font-sans text-[#B75D29] font-bold tracking-[0.2em] uppercase mb-4">Chapter 3  Deep Dive</div>
                      <h1 className="text-4xl md:text-5xl lg:text-6xl text-[#2A2A2A] mb-6 leading-tight">The Mathematics of <br/>Grover's Algorithm</h1>
                      <p className="text-lg md:text-xl text-[#71717A] font-sans font-light max-w-2xl mx-auto">The algorithm that broke symmetric cryptography  and how the linear algebra actually works.</p>
                      <div className="w-24 h-px bg-[#B75D29]/30 mx-auto mt-12"></div>
                  </div>

                  {/* GRID CONTENT */}
                  <div className="grid grid-cols-1 gap-16 font-sans text-[#4A4A4A] leading-[1.8] text-lg">
                      
                      {/* Section A: History */}
                      <section>
                          <h2 className="text-3xl font-serif text-[#1A1A1A] font-medium tracking-tight mb-6 font-bold">A Brief History</h2>
                          <p className="mb-4">
                              Published in 1996 by Lov Grover, this algorithm achieved something classical computer scientists thought was impossible: it searched an unstructured database in {"$O(\\sqrt{N})$"} time.
                          </p>
                          <p>
                              A common misconception is that Grover's algorithm searches a physical "database" like a phonebook. In reality, quantum computers don't have hard drives containing list items. Instead, the algorithm is used for <strong>inverting functions</strong>. For example, if you have a cryptographic hash (like SHA-256), a classical computer must guess inputs one by one until it finds the matching hash. Grover's algorithm allows a quantum computer to find the input exponentially faster.
                          </p>
                      </section>

                      {/* Section B: The 4 Steps */}
                      <section>
                          <h2 className="text-3xl font-serif text-[#1A1A1A] font-medium tracking-tight mb-6 font-bold">The 4 Fundamental Steps</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-white p-6 rounded-xl border border-[#E4E4E7] shadow-sm">
                                  <div className="text-[#B75D29] font-bold font-mono mb-2">01 / Initialization</div>
                                  <p className="text-sm">We begin by applying Hadamard gates to all qubits initialized in the {"$|0\\rangle$"} state. This creates a uniform superposition {"$|s\\rangle$"} where every possible answer has an equal, positive amplitude.</p>
                              </div>
                              <div className="bg-white p-6 rounded-xl border border-[#E4E4E7] shadow-sm">
                                  <div className="text-[#B75D29] font-bold font-mono mb-2">02 / The Oracle ({"$U_\\omega$"})</div>
                                  <p className="text-sm">The mathematical filter. It identifies the target state {"$|\\omega\\rangle$"} and flips its phase by 180 degrees (multiplying its amplitude by -1). All wrong answers remain unchanged.</p>
                              </div>
                              <div className="bg-white p-6 rounded-xl border border-[#E4E4E7] shadow-sm">
                                  <div className="text-[#B75D29] font-bold font-mono mb-2">03 / The Diffuser ({"$U_s$"})</div>
                                  <p className="text-sm">Also known as the inversion about the mean. It calculates the average amplitude of the system and physically reflects every state over that line. This shrinks wrong answers and amplifies the target.</p>
                              </div>
                              <div className="bg-white p-6 rounded-xl border border-[#E4E4E7] shadow-sm">
                                  <div className="text-[#B75D29] font-bold font-mono mb-2">04 / Measurement</div>
                                  <p className="text-sm">Because steps 2 and 3 rotated our quantum vector close to 90 degrees, measuring the qubits forces the wave to collapse on the correct target with a probability near 100%.</p>
                              </div>
                          </div>
                      </section>

                      {/* Section C: Circuit */}
                      <section>
                          <h2 className="text-3xl font-serif text-[#1A1A1A] font-medium tracking-tight mb-6 font-bold">The 3-Qubit Circuit Diagram</h2>
                          <div className="overflow-x-auto bg-white p-8 rounded-xl border border-[#E4E4E7] shadow-sm flex items-center justify-center min-w-[600px]">
                              {/* Circuit Container */}
                              <div className="relative flex flex-col gap-8 font-mono text-xs w-[600px]">
                                  {/* Wires */}
                                  <div className="absolute left-6 right-6 top-[15px] h-px bg-gray-300 z-0"></div>
                                  <div className="absolute left-6 right-6 top-[63px] h-px bg-gray-300 z-0"></div>
                                  <div className="absolute left-6 right-6 top-[111px] h-px bg-gray-300 z-0"></div>

                                  {/* Wire 1 */}
                                  <div className="flex items-center relative z-10 justify-between">
                                      <span className="w-6 text-gray-400">q0</span>
                                      <div className="w-8 h-8 bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center rounded">H</div>
                                      <div className="w-8 h-8 flex items-center justify-center relative"><div className="w-3 h-3 bg-black rounded-full relative z-10"></div></div>
                                      <div className="w-8 h-8 bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center rounded">H</div>
                                      <div className="w-8 h-8 bg-green-100 text-green-800 border border-green-300 flex items-center justify-center rounded">X</div>
                                      <div className="w-8 h-8 flex items-center justify-center relative"><div className="w-3 h-3 bg-black rounded-full relative z-10"></div></div>
                                      <div className="w-8 h-8 bg-green-100 text-green-800 border border-green-300 flex items-center justify-center rounded">X</div>
                                      <div className="w-8 h-8 bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center rounded">H</div>
                                  </div>
                                  
                                  {/* Wire 2 */}
                                  <div className="flex items-center relative z-10 justify-between">
                                      <span className="w-6 text-gray-400">q1</span>
                                      <div className="w-8 h-8 bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center rounded">H</div>
                                      <div className="w-8 h-8 flex items-center justify-center relative"><div className="w-3 h-3 bg-black rounded-full relative z-10"></div><div className="absolute bottom-4 top-[-48px] w-px bg-black z-0"></div></div>
                                      <div className="w-8 h-8 bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center rounded">H</div>
                                      <div className="w-8 h-8 bg-green-100 text-green-800 border border-green-300 flex items-center justify-center rounded">X</div>
                                      <div className="w-8 h-8 flex items-center justify-center relative"><div className="w-3 h-3 bg-black rounded-full relative z-10"></div><div className="absolute bottom-4 top-[-48px] w-px bg-black z-0"></div></div>
                                      <div className="w-8 h-8 bg-green-100 text-green-800 border border-green-300 flex items-center justify-center rounded">X</div>
                                      <div className="w-8 h-8 bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center rounded">H</div>
                                  </div>

                                  {/* Wire 3 */}
                                  <div className="flex items-center relative z-10 justify-between">
                                      <span className="w-6 text-gray-400">q2</span>
                                      <div className="w-8 h-8 bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center rounded">H</div>
                                      <div className="w-8 h-8 flex items-center justify-center relative"><div className="w-8 h-8 bg-purple-100 text-purple-800 border border-purple-300 flex items-center justify-center rounded relative z-10">Z</div><div className="absolute bottom-4 top-[-48px] w-px bg-black z-0"></div></div>
                                      <div className="w-8 h-8 bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center rounded">H</div>
                                      <div className="w-8 h-8 bg-green-100 text-green-800 border border-green-300 flex items-center justify-center rounded">X</div>
                                      <div className="w-8 h-8 flex items-center justify-center relative"><div className="w-8 h-8 bg-purple-100 text-purple-800 border border-purple-300 flex items-center justify-center rounded relative z-10">Z</div><div className="absolute bottom-4 top-[-48px] w-px bg-black z-0"></div></div>
                                      <div className="w-8 h-8 bg-green-100 text-green-800 border border-green-300 flex items-center justify-center rounded">X</div>
                                      <div className="w-8 h-8 bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center rounded">H</div>
                                  </div>
                                  
                                  {/* Dashed boxes */}
                                  <div className="absolute left-[80px] w-12 top-[-10px] bottom-[-10px] border-2 border-dashed border-gray-300 rounded pointer-events-none"></div>
                                  <div className="absolute left-[130px] w-12 top-[-10px] bottom-[-10px] border-2 border-dashed border-purple-300 rounded pointer-events-none"></div>
                                  <div className="absolute left-[190px] right-[10px] top-[-10px] bottom-[-10px] border-2 border-dashed border-orange-300 rounded pointer-events-none"></div>
                                  <div className="absolute left-[80px] -top-6 text-[10px] text-gray-400">Init</div>
                                  <div className="absolute left-[130px] -top-6 text-[10px] text-purple-500">Oracle</div>
                                  <div className="absolute left-[190px] -top-6 text-[10px] text-orange-500">Diffuser</div>
                              </div>
                          </div>
                      </section>

                      {/* Section D: Math */}
                      <section>
                          <h2 className="text-3xl font-serif text-[#1A1A1A] font-medium tracking-tight mb-6 font-bold">The Linear Algebra</h2>
                          <p className="mb-6">
                              The mathematical magic of Grover's Algorithm lies entirely in the interaction of two unitary matrices: the Oracle ({"$U_\\omega$"}) and the Diffuser ({"$U_s$"}).
                          </p>
                          <div className="bg-white p-8 rounded-xl border border-[#E4E4E7] shadow-sm mb-8 overflow-x-auto text-center">
                              <p className="font-serif text-[#71717A] text-sm mb-2 text-left">The Oracle Matrix:</p>
                              <div className="text-2xl my-4">{"$U_\\omega = I - 2|\\omega\\rangle\\langle\\omega|$"}</div>
                              <p className="text-[17px] mt-4 text-left text-[#4A4A4A]">Where {"$|\\omega\\rangle$"} is the secret target state. This matrix reflects the state vector about the hyperplane orthogonal to {"$|\\omega\\rangle$"}.</p>
                          </div>
                          
                          <div className="bg-white p-8 rounded-xl border border-[#E4E4E7] shadow-sm mb-8 overflow-x-auto text-center">
                              <p className="font-serif text-[#71717A] text-sm mb-2 text-left">The Diffuser Matrix:</p>
                              <div className="text-2xl my-4">{"$U_s = 2|s\\rangle\\langle s| - I$"}</div>
                              <p className="text-[17px] mt-4 text-left text-[#4A4A4A]">Where {"$|s\\rangle$"} is the uniform superposition. This matrix reflects the state vector about the {"$|s\\rangle$"} axis.</p>
                          </div>
                          
                          <p>
                              When we apply {"$U_s U_\\omega$"} together, the product of these two reflections results in a pure <strong>rotation</strong> by an angle {"$2\\theta$"} in the two-dimensional sub-space spanned by the target state {"$|\\omega\\rangle$"} and the non-target states. This geometric rotation proves that we are moving closer to the target probability exactly quadratically faster than a classical loop!
                          </p>
                      </section>

                      {/* Section E: Example */}
                      <section>
                          <h2 className="text-3xl font-serif text-[#1A1A1A] font-medium tracking-tight mb-6 font-bold">A Real 3-Qubit Example</h2>
                          <p className="mb-6">
                              Let's plug in real numbers for a 3-qubit system ({"$N = 8$"}). Initially, the amplitude of every state is {"$1/\\sqrt{8} \\approx 0.353$"}. Suppose the secret target key is {"$|101\\rangle$"}.
                          </p>
                          <div className="grid grid-cols-1 gap-6 text-[17px]">
                              <div className="bg-white p-6 rounded-xl border border-[#E4E4E7] shadow-sm">
                                  <h3 className="font-bold text-[#B75D29] mb-2 font-mono">01 / Initial Superposition</h3>
                                  <p className="font-mono bg-[#FAFAFA] p-3 rounded text-[15px] overflow-x-auto text-[#4A4A4A] border border-[#E4E4E7]">|ψ₁⟩ = 0.353|000⟩ + 0.353|001⟩ + ... + <span className="font-bold text-black">0.353|101⟩</span> + ... + 0.353|111⟩</p>
                              </div>
                              <div className="bg-white p-6 rounded-xl border border-[#E4E4E7] shadow-sm">
                                  <h3 className="font-bold text-[#B75D29] mb-2 font-mono">02 / Apply Oracle</h3>
                                  <p className="mb-2">The Oracle flips the sign of the target state ({"$|101\\rangle$"}):</p>
                                  <p className="font-mono bg-[#FAFAFA] p-3 rounded text-[15px] overflow-x-auto text-[#4A4A4A] border border-[#E4E4E7]">|ψ₁⟩ = 0.353|000⟩ + 0.353|001⟩ + ... <span className="font-bold text-[#ff0033]">- 0.353|101⟩</span> + ... + 0.353|111⟩</p>
                              </div>
                              <div className="bg-white p-6 rounded-xl border border-[#E4E4E7] shadow-sm">
                                  <h3 className="font-bold text-[#B75D29] mb-2 font-mono">03 / Calculate the Mean</h3>
                                  <p className="mb-2">The average amplitude ({"$\\mu$"}) of all 8 states is calculated:</p>
                                  <div className="text-center font-mono my-4 text-[#2A2A2A] text-lg bg-[#FAFAFA] p-4 rounded border border-[#E4E4E7]">{"$\\mu = \\frac{7(0.353) + 1(-0.353)}{8} \\approx 0.265$"}</div>
                              </div>
                              <div className="bg-white p-6 rounded-xl border border-[#E4E4E7] shadow-sm">
                                  <h3 className="font-bold text-[#B75D29] mb-2 font-mono">04 / Apply Diffuser (Inversion About Mean)</h3>
                                  <p className="mb-3">We apply the geometric reflection formula: <code className="bg-[#FAFAFA] px-2 py-1 rounded border border-[#E4E4E7] text-[#2A2A2A]">New = 2μ - Old</code></p>
                                  <ul className="list-disc pl-5 mb-4 text-[#71717A] space-y-2">
                                      <li>For the 7 wrong answers: <code className="bg-[#FAFAFA] px-1 rounded">2(0.265) - 0.353 ≈ 0.177</code></li>
                                      <li>For the 1 target answer: <code className="bg-[#FAFAFA] px-1 rounded">2(0.265) - (-0.353) ≈ 0.883</code></li>
                                  </ul>
                                  <p className="font-mono bg-[#FAFAFA] p-3 rounded text-[15px] overflow-x-auto text-[#4A4A4A] border border-[#E4E4E7]">|ψ₂⟩ = 0.177|000⟩ + 0.177|001⟩ + ... + <span className="font-bold text-[#00ffff] bg-black px-1">0.883|101⟩</span> + ... + 0.177|111⟩</p>
                                  <div className="mt-6 p-4 bg-[#F6EEE8] border border-[#B75D29]/20 rounded text-[#B75D29] font-bold text-center">
                                      The probability of measuring the target jumped from 12.5% to {"$(0.883)^2 \\approx 78\\%$"} in a single step!
                                  </div>
                              </div>
                          </div>
                      </section>
                  </div>
              </div>
          </section>

        </div>

      </div>
    </div>
  );
}
