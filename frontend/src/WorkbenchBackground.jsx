import React, { useEffect, useRef } from 'react';

export default function WorkbenchBackground() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Slow drifting wave lines — represent quantum field fluctuations
    const WAVES = Array.from({ length: 6 }, (_, i) => ({
      y: (i + 1) / 7,          // fractional vertical position
      phase: (i * Math.PI) / 3,
      speed: 0.12 + i * 0.03,
      amplitude: 18 + i * 6,
      freq: 2.5 + i * 0.4,
    }));

    // Faint floating dots — represent qubits
    const DOTS = Array.from({ length: 22 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.003 + Math.random() * 0.005,
      drift: (Math.random() - 0.5) * 0.00012,
    }));

    let startTime = null;

    function draw(ts) {
      if (!startTime) startTime = ts;
      const t = (ts - startTime) / 1000;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // --- Wave lines ---
      WAVES.forEach((w) => {
        const cy = w.y * H;
        ctx.beginPath();
        for (let px = 0; px <= W; px += 3) {
          const x = px;
          const y = cy + Math.sin((px / W) * Math.PI * 2 * w.freq + w.phase + t * w.speed) * w.amplitude;
          if (px === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(183,93,41,0.13)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // --- Floating dots ---
      DOTS.forEach((d) => {
        d.x += d.drift;
        d.phase += d.speed;
        if (d.x < -0.05) d.x = 1.05;
        if (d.x > 1.05)  d.x = -0.05;

        const pulse = 0.5 + 0.5 * Math.sin(d.phase);
        ctx.beginPath();
        ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(183,93,41,${0.18 * pulse})`;
        ctx.fill();
      });

      // --- Faint grid ---
      const COLS = 14, ROWS = 9;
      for (let col = 0; col <= COLS; col++) {
        const x = (col / COLS) * W;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.strokeStyle = 'rgba(183,93,41,0.055)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      for (let row = 0; row <= ROWS; row++) {
        const y = (row / ROWS) * H;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.strokeStyle = 'rgba(183,93,41,0.055)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

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
      className="fixed inset-0 w-full h-full pointer-events-none workbench-canvas-layer"
      style={{ zIndex: 0, opacity: 0.85 }}
    />
  );
}
