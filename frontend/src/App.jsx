import React, { useState, useEffect } from 'react';
import Home from './Home';
import Workbench from './Workbench';
import ChapterQubit from './ChapterQubit';
import ChapterGates from './ChapterGates';
import DoubleSlit from './DoubleSlit';
import ModuleStaircase from './ModuleStaircase';
import ModuleFilter from './ModuleFilter';
import FloatingTutorButton from './FloatingTutorButton';
import { getSharedCircuitFromUrl } from './circuitStorage';

export default function App() {
  const [page, setPage] = useState('home');
  const [sharedData, setSharedData] = useState(null);

  useEffect(() => {
    // Check if URL contains shared circuit data (either in query string or hash)
    const shared = getSharedCircuitFromUrl();
    if (shared) {
      setSharedData(shared);
      setPage('workbench');
    }
  }, []);

  const handleBackToHome = () => {
    // Clear shared query params from URL when navigating back to home
    if (window.location.search || window.location.hash) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setSharedData(null);
    setPage('home');
  };

  return (
    <>
      {page === 'home' && <Home onNavigate={setPage} />}
      {page === 'staircase' && <ModuleStaircase onBack={() => setPage('home')} />}
      {page === 'filter' && <ModuleFilter onBack={() => setPage('home')} />}
      {page === 'qubit' && <ChapterQubit onBack={() => setPage('home')} />}
      {page === 'gates' && <ChapterGates onBack={() => setPage('home')} />}
      {page === 'doubleSlit' && <DoubleSlit onBack={() => setPage('home')} onNavigate={setPage} />}
      {page === 'workbench' && (
        <Workbench 
          onBack={handleBackToHome} 
          initialSharedCircuit={sharedData?.circuit}
          initialAccessMode={sharedData?.accessMode || 'write'}
        />
      )}

      {/* Global AI Quantum Tutor floating button accessible on any chapter & page */}
      <FloatingTutorButton />
    </>
  );
}
