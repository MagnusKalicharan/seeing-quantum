import React, { useEffect, useRef } from 'react';

function ScatteringBalls() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Ball setup
    const numBalls = 90;
    const colors = ['#B75D29', '#E4E4E7', '#F5A05A', '#2A2A2A', '#04AA6D'];
    const balls = [];

    for (let i = 0; i < numBalls; i++) {
      balls.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < numBalls; i++) {
        let b = balls[i];

        // Normal movement
        b.x += b.vx;
        b.y += b.vy;

        // Bounce off walls
        if (b.x < 0 || b.x > canvas.width) b.vx *= -1;
        if (b.y < 0 || b.y > canvas.height) b.vy *= -1;

        // Mouse interaction (Scattering)
        let dx = mouse.x - b.x;
        let dy = mouse.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let maxDist = 180;

        if (dist < maxDist) {
          let force = (maxDist - dist) / maxDist;
          let angle = Math.atan2(dy, dx);
          let targetX = b.x - Math.cos(angle) * force * 10;
          let targetY = b.y - Math.sin(angle) * force * 10;
          
          b.vx += (targetX - b.x) * 0.1;
          b.vy += (targetY - b.y) * 0.1;
        }

        // Friction
        b.vx *= 0.99;
        b.vy *= 0.99;

        // Maintain min speed
        let speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed < 0.6) {
          b.vx *= 1.1;
          b.vy *= 1.1;
        }

        // Draw ball
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.closePath();
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />;
}

export default function Home({ onStart }) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#FAFAFA] flex flex-col items-center justify-center font-sans">
      <ScatteringBalls />
      
      <div className="relative z-10 text-center px-6 pointer-events-auto flex flex-col items-center">
        <h1 className="text-7xl md:text-9xl font-serif text-[#2A2A2A] tracking-tight leading-none mb-6 select-none">
          Seeing<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#B75D29] to-[#8C461F]">Quantum.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-[#71717A] max-w-2xl mx-auto font-sans mb-12 select-none">
          An interactive, visual journey through quantum mechanics and computing. Explore entanglement, superposition, and quantum algorithms through play.
        </p>
        
        <button 
          onClick={onStart}
          className="bg-[#2A2A2A] hover:bg-black text-white text-xl font-bold py-4 px-12 rounded-full transition-all hover:scale-105 shadow-2xl flex items-center gap-2 group"
        >
          Start your journey
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      <div className="absolute bottom-8 z-10 text-[#71717A] font-mono text-sm tracking-widest uppercase select-none">
        A project by <span className="font-bold text-[#B75D29]">MAD-PALs</span>
      </div>
    </div>
  );
}
