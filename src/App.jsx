import { useState, useEffect } from 'react';
import { load, save } from './utils/helpers';
import { DEFAULT_PROGRAM } from './data/program';
import TodayTab from './components/TodayTab';
import ProgramTab from './components/ProgramTab';
import ProgressTab from './components/ProgressTab';
import ActiveSession from './components/ActiveSession';
import CustomBuilder from './components/CustomBuilder';

export default function App() {
  const [tab, setTab] = useState('today');
  const [program, setProgram] = useState(() => {
    const saved = load('lift_program', null);
    if (!saved || Array.isArray(saved)) return DEFAULT_PROGRAM;
    return saved;
  });
  const [history,          setHistory]          = useState(() => load('lift_history', []));
  const [prs,              setPrs]              = useState(() => load('lift_prs', {}));
  const [activeSession,    setActiveSession]    = useState(null);
  const [sessionMinimized, setSessionMinimized] = useState(false);
  const [buildingCustom,   setBuildingCustom]   = useState(false);

  useEffect(() => { save('lift_program', program); }, [program]);
  useEffect(() => { save('lift_history', history); }, [history]);
  useEffect(() => { save('lift_prs',     prs);     }, [prs]);

  const handleStart = (day) => {
    setActiveSession(day);
    setSessionMinimized(false);
    setBuildingCustom(false);
  };

  const handleBuildCustom = () => setBuildingCustom(true);

  const handleMinimize = () => {
    setSessionMinimized(true);
    setTab('today');
  };

  const handleResume = () => setSessionMinimized(false);

  const handleDiscard = () => {
    setActiveSession(null);
    setSessionMinimized(false);
  };

  const handleFinish = (log) => {
    setHistory(h => [...h, log]);
    setActiveSession(null);
    setSessionMinimized(false);
    setTab('progress');
  };

  const tabs = [
    { id: 'today',    label: 'Today',    icon: '⚡' },
    { id: 'program',  label: 'Program',  icon: '📋' },
    { id: 'progress', label: 'Progress', icon: '📈' },
  ];

  // Determine which fullscreen view wins (at most one at a time)
  const showSession  = !!activeSession;
  const showBuilder  = !activeSession && buildingCustom;
  const showTabShell = (!activeSession || sessionMinimized) && !buildingCustom;

  return (
    <>
      {/* ActiveSession — mounted whenever a session exists to preserve state */}
      {showSession && (
        <div style={sessionMinimized ? { display: 'none' } : { flex: 1, minHeight: 0 }}>
          <ActiveSession
            day={activeSession}
            onFinish={handleFinish}
            onMinimize={handleMinimize}
            onDiscard={handleDiscard}
            prs={prs}
            setPrs={setPrs}
          />
        </div>
      )}

      {/* Custom workout builder */}
      {showBuilder && (
        <div style={{ flex: 1, minHeight: 0 }}>
          <CustomBuilder
            onStart={(exercises) => handleStart({ name: 'Custom', type: 'Custom', exercises })}
            onCancel={() => setBuildingCustom(false)}
          />
        </div>
      )}

      {/* Tab shell */}
      {showTabShell && (
        <div className="app">
          {tab === 'today' && (
            <TodayTab
              program={program}
              onStart={handleStart}
              onBuildCustom={handleBuildCustom}
              minimizedSession={sessionMinimized ? activeSession : null}
              onResume={handleResume}
            />
          )}
          {tab === 'program'  && <ProgramTab  program={program} setProgram={setProgram} />}
          {tab === 'progress' && <ProgressTab history={history} prs={prs} />}

          <div className="tab-bar">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span className="tab-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
