import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Menu, BookOpen, Layers, Cpu, Grid, Home as HomeIcon, PlayCircle } from 'lucide-react';
import Home from './Home';
import Workbench from './Workbench';
import ChapterQubit from './ChapterQubit';
import ChapterGates from './ChapterGates';
import DoubleSlit from './DoubleSlit';
import ModuleStaircase from './ModuleStaircase';
import ModuleFilter from './ModuleFilter';
import FloatingTutorButton from './FloatingTutorButton';
import { getSharedCircuitFromUrl } from './circuitStorage';
import ChapterGrovers from './ChapterGrovers';
const ChapterBB84 = lazy(() => import('./ChapterBB84'));
import ChapterDiscretisation from './ChapterDiscretisation';
import ChapterSuperposition from './ChapterSuperposition';
import ChapterInterference from './ChapterInterference';
import ChapterEntanglement from './ChapterEntanglement';
import ChapterMeasurement from './ChapterMeasurement';

export default function App() {
  const [page, setPage] = useState(() => (getSharedCircuitFromUrl() ? 'workbench' : 'home'));
  const [sharedData, setSharedData] = useState(() => getSharedCircuitFromUrl());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (page === 'home') {
    // When clicking Start Journey, go straight to the first chapter
    return <Home onStart={() => setPage('staircase')} />;
  }

  const handleSidebarClick = (id) => {
    setPage(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const NavItem = ({ id, label, icon: Icon, isAnimation }) => {
    const active = page === id;
    return (
      <button
        onClick={() => handleSidebarClick(id)}
        className={`w-full text-left flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${active
            ? 'bg-[#EAF2FA] text-[#20609C] border-l-4 border-[#20609C] font-semibold'
            : 'text-gray-600 hover:bg-gray-100 border-l-4 border-transparent font-medium'
          }`}
      >
        {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#20609C]' : 'text-gray-500'}`} />}
        <span className="text-base flex-1">{label}</span>
        {isAnimation && <PlayCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
      </button>
    );
  };

  const SidebarHeader = ({ title }) => (
    <div className="px-6 py-2 mt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-white font-sans text-gray-800 overflow-hidden">
      {/* Top Header - W3Schools style */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-[#282A35] text-white shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-600 rounded transition-colors text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-xl cursor-pointer tracking-tight" onClick={() => setPage('home')}>
            Seeing Quantum
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4">

          <button className="hover:bg-gray-700 px-3 py-1 rounded text-sm font-semibold">Log in</button>
          <button className="bg-[#20609C] text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-700">Sign Up</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <aside
          className={`absolute md:relative z-40 h-full border-r border-gray-200 bg-[#F8F9FA] overflow-y-auto transition-all duration-300 ease-in-out flex-shrink-0 shadow-sm ${sidebarOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full md:block md:-translate-x-full'
            }`}
        >
          <nav className="flex-1 py-4 w-[280px]">
            <NavItem id="home" label="Back to Home" icon={HomeIcon} />
            <SidebarHeader title="Foundations" />
            <NavItem id="staircase" label="Quantisation" icon={BookOpen} isAnimation />
            <NavItem id="doubleSlit" label="Wave-Particle Duality" icon={BookOpen} isAnimation />
            <NavItem id="interference" label="Interference" icon={BookOpen} />
            <NavItem id="superposition" label="Superposition" icon={Grid} />
            <NavItem id="qubit" label="The Qubit" icon={Grid} isAnimation />
            <NavItem id="measurement" label="Measurement" icon={BookOpen} />
            <NavItem id="filter" label="Stern-Gerlach Experiment" icon={BookOpen} isAnimation />
            <NavItem id="entanglement" label="Entanglement" icon={Grid} />
            <NavItem id="gates" label="Quantum Gates" icon={Grid} isAnimation />

            <SidebarHeader title="Algorithms" />
            <NavItem id="grovers" label="Grover's Algorithm" icon={Layers} isAnimation />
            <NavItem id="bb84" label="BB84 Protocol" icon={Layers} isAnimation />

            <SidebarHeader title="Simulator" />
            <NavItem id="workbench" label="Circuit Simulator" icon={Cpu} />
          </nav>
        </aside>

        {/* Mobile backdrop for sidebar */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 bg-black/20 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative bg-white flex flex-col">
          <div className="flex-1 overflow-y-auto relative">
            {page === 'staircase' && <ModuleStaircase />}
            {page === 'filter' && <ModuleFilter />}
            {page === 'qubit' && <ChapterQubit />}
            {page === 'gates' && <ChapterGates />}
            {page === 'superposition' && <ChapterSuperposition />}
            {page === 'interference' && <ChapterInterference />}
            {page === 'entanglement' && <ChapterEntanglement />}
            {page === 'measurement' && <ChapterMeasurement />}
            {page === 'doubleSlit' && <DoubleSlit onNavigate={setPage} />}
            {page === 'grovers' && <ChapterGrovers />}
            {page === 'bb84' && (
              <Suspense fallback={<div className="h-full flex items-center justify-center text-[#71717A]">Loading BB84…</div>}>
                <ChapterBB84 />
              </Suspense>
            )}
            {page === 'workbench' && (
              <Workbench
                initialSharedCircuit={sharedData?.circuit}
                initialAccessMode={sharedData?.accessMode || 'write'}
              />
            )}
          </div>

          {page !== 'workbench' && <FloatingTutorButton />}
        </main>
      </div>
    </div>
  );
}
