import React, { useEffect, useRef } from 'react';

const CourseCard = ({ title, description, imageColor, onClick }) => (
  <div
    onClick={onClick}
    className="flex bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer mb-5 hover:-translate-y-1"
  >
    <div className={`w-1/3 min-w-[180px] flex items-center justify-center p-4 border-r border-gray-200 ${imageColor}`}>
      <div className="w-full h-32 bg-white/50 backdrop-blur-sm rounded border border-white/50 flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
        <div className="w-12 h-12 bg-white rounded-full shadow-md mb-2 opacity-90 z-10" />
        <div className="w-16 h-2 bg-blue-300 rounded-full opacity-80 z-10" />
      </div>
    </div>
    <div className="w-2/3 p-6 flex flex-col justify-center">
      <h2 className="text-[19px] font-bold text-[#20609C] mb-2">{title}</h2>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function Course({ onNavigate, activeSection, onSectionChange }) {
  const containerRef = useRef(null);
  const foundationRef = useRef(null);
  const algorithmRef = useRef(null);
  const circuitRef = useRef(null);

  // Prevent scroll events from fighting manual clicks
  const isScrollingManually = useRef(false);

  useEffect(() => {
    if (!isScrollingManually.current) {
      if (activeSection === 'foundations' && foundationRef.current) {
        foundationRef.current.scrollIntoView({ behavior: 'smooth' });
      } else if (activeSection === 'algorithms' && algorithmRef.current) {
        algorithmRef.current.scrollIntoView({ behavior: 'smooth' });
      } else if (activeSection === 'circuit' && circuitRef.current) {
        circuitRef.current.scrollIntoView({ behavior: 'smooth' });
      }

      isScrollingManually.current = true;
      setTimeout(() => { isScrollingManually.current = false; }, 800);
    }
  }, [activeSection]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (isScrollingManually.current) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          onSectionChange(entry.target.id);
        }
      });
    }, { rootMargin: '-10% 0px -70% 0px' });

    if (foundationRef.current) observer.observe(foundationRef.current);
    if (algorithmRef.current) observer.observe(algorithmRef.current);
    if (circuitRef.current) observer.observe(circuitRef.current);

    return () => observer.disconnect();
  }, [onSectionChange]);

  return (
    <div className="w-full h-full overflow-y-auto bg-white font-sans text-gray-800 p-8 md:p-14 pb-32" ref={containerRef}>
      <div className="max-w-4xl mx-auto">

        {/* Foundations Section */}
        <div id="foundations" ref={foundationRef} className="mb-20 scroll-mt-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">01. Foundations</h1>
          <p className="text-gray-600 mb-8 pb-6 border-b border-gray-200 text-sm">
            Core concepts of quantum mechanics. Explore discrete energy, wave-particle duality, and basic qubits.
          </p>

          <div className="space-y-5">
            <CourseCard
              title="Quantisation"
              description="Interactive visualization of discrete energy levels. Fire photons at an atom and observe how energy states change."
              imageColor="bg-blue-50"
              onClick={() => onNavigate('staircase')}
            />

            <CourseCard
              title="Wave-Particle Duality"
              description="Explore a 3D simulation of the double-slit experiment over time. See how measurement forces wave decoherence."
              imageColor="bg-purple-50"
              onClick={() => onNavigate('doubleSlit')}
            />
            <CourseCard
              title="Interference"
              description="See how quantum probability waves can constructively and destructively interfere."
              imageColor="bg-purple-50"
              onClick={() => onNavigate('interference')}
            />
            <CourseCard
              title="Superposition"
              description="Explore how quantum systems can exist in a combination of multiple states simultaneously."
              imageColor="bg-orange-50"
              onClick={() => onNavigate('superposition')}
            />
            <CourseCard
              title="The Qubit"
              description="Interactive Bloch Sphere visualization. Understand kets, statevectors, and quantum probability amplitudes."
              imageColor="bg-orange-50"
              onClick={() => onNavigate('qubit')}
            />
            <CourseCard
              title="Measurement"
              description="Learn how observing a quantum system forces its wavefunction to collapse into a single state."
              imageColor="bg-red-50"
              onClick={() => onNavigate('measurement')}
            />
            <CourseCard
              title="Stern-Gerlach Experiment"
              description="Visualize the addition of sequential Stern-Gerlach magnets to understand quantum superposition and the uncertainty principle."
              imageColor="bg-green-50"
              onClick={() => onNavigate('filter')}
            />
            <CourseCard
              title="Entanglement"
              description="Discover the spooky action at a distance where multiple qubits become intrinsically linked."
              imageColor="bg-indigo-50"
              onClick={() => onNavigate('entanglement')}
            />
            <CourseCard
              title="Quantum Gates"
              description="Observe how X, Y, Z, and Hadamard gates perform unitary rotations on single qubits in real-time."
              imageColor="bg-teal-50"
              onClick={() => onNavigate('gates')}
            />
          </div>
        </div>

        {/* Algorithms Section */}
        <div id="algorithms" ref={algorithmRef} className="mb-20 scroll-mt-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">02. Algorithms</h1>
          <p className="text-gray-600 mb-8 pb-6 border-b border-gray-200 text-sm">
            Discover the power of quantum computing through famous quantum algorithms and cryptography.
          </p>

          <div className="space-y-5">
            <CourseCard
              title="Grover's Algorithm"
              description="Explore unstructured search. Cinematic scrollytelling animation demonstrating amplitude amplification."
              imageColor="bg-indigo-50"
              onClick={() => onNavigate('grovers')}
            />
            <CourseCard
              title="BB84 Key Distribution"
              description="Watch 'HELLO' become photons on a quantum channel in this interactive cryptography protocol simulation."
              imageColor="bg-yellow-50"
              onClick={() => onNavigate('bb84')}
            />
          </div>
        </div>

        {/* Circuit Section */}
        <div id="circuit" ref={circuitRef} className="mb-10 scroll-mt-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">03. Circuit Simulator</h1>
          <p className="text-gray-600 mb-8 pb-6 border-b border-gray-200 text-sm">
            Put everything together in a fully functional drag-and-drop quantum workbench.
          </p>

          <div className="space-y-5">
            <CourseCard
              title="Open the Workbench"
              description="A drag-and-drop workbench to build multi-qubit circuits. Trace state evolution and observe entanglement."
              imageColor="bg-red-50"
              onClick={() => onNavigate('workbench')}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
