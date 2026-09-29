import React, { useState } from 'react';
import Home from './Home';
import Workbench from './Workbench';
import ChapterQubit from './ChapterQubit';
import ChapterGates from './ChapterGates';
import DoubleSlit from './DoubleSlit';
import ModuleStaircase from './ModuleStaircase';
import ModuleFilter from './ModuleFilter';

export default function App() {
  const [page, setPage] = useState('home');

  return (
    <>
      {page === 'home' && <Home onNavigate={setPage} />}
      {page === 'staircase' && <ModuleStaircase onBack={() => setPage('home')} />}
      {page === 'filter' && <ModuleFilter onBack={() => setPage('home')} />}
      {page === 'qubit' && <ChapterQubit onBack={() => setPage('home')} />}
      {page === 'gates' && <ChapterGates onBack={() => setPage('home')} />}
      {page === 'doubleSlit' && <DoubleSlit onBack={() => setPage('home')} onNavigate={setPage} />}
      {page === 'workbench' && <Workbench onBack={() => setPage('home')} />}
    </>
  );
}
