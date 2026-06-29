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
  const [history, setHistory] = useState(() => load('lift_history', []));
  const [prs,     setPrs]     = useState(() => load('lift_prs', {}));

  // Session state — check for a persisted session at startup
  const [activeSession,    setActiveSession]    = useState(() => load('lift_session_day', null));
  // Always start minimized if restoring from localStorage so fresh loads show the Train grid.
  // sessionMinimized only becomes false when user explicitly taps Resume or starts a new session.
  const [sessionMinimized, setSessionMinimized] = useState(() => !!load('lift_session_day', null));
  const [buildingCustom,   setBuildingCustom]   = useState(false);
  const [sessionRestored,  setSessionRestored]  = useState(() => !!load('lift_session_day', null));
  const [sessionKey,       setSessionKey]       = useState('restored');

  // Read once at mount; only used when sessionRestored === true
  const [initSets]    = useState(() => load('lift_session_sets', null));
  const [initElapsed] = useState(() => load('lift_session_elapsed', 0));

  useEffect(() => { save('lift_program', program); }, [program]);
  useEffect(() => { save('lift_history', history); }, [history]);
  useEffect(() => { save('lift_prs',     prs);     }, [prs]);

  // Persist the active session day object whenever it changes
  useEffect(() => {
    if (activeSession) save('lift_session_day', activeSession);
  }, [activeSession]);

  const clearPersistedSession = () => {
    localStorage.removeItem('lift_session_day');
    localStorage.removeItem('lift_session_sets');
    localStorage.removeItem('lift_session_elapsed');
  };

  const handleStart = (day) => {
    setSessionKey((day.type || 'custom') + '_' + Date.now());
    setSessionRestored(false);
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
    clearPersistedSession();
    setActiveSession(null);
    setSessionMinimized(false);
  };

  const handleFinish = (log) => {
    clearPersistedSession();
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

  const showSession  = !!activeSession;
  const showBuilder  = !activeSession && buildingCustom;
  const showTabShell = (!activeSession || sessionMinimized) && !buildingCustom;

  return (
    <>
      {showSession && (
        <div style={sessionMinimized ? { display: 'none' } : { flex: 1, minHeight: 0 }}>
          <ActiveSession
            key={sessionKey}
            day={activeSession}
            onFinish={handleFinish}
            onMinimize={handleMinimize}
            onDiscard={handleDiscard}
            prs={prs}
            setPrs={setPrs}
            initialSets={sessionRestored ? initSets : null}
            initialElapsed={sessionRestored ? initElapsed : 0}
          />
        </div>
      )}

      {showBuilder && (
        <div style={{ flex: 1, minHeight: 0 }}>
          <CustomBuilder
            onStart={(exercises) => handleStart({ name: 'Custom', type: 'Custom', exercises })}
            onCancel={() => setBuildingCustom(false)}
          />
        </div>
      )}

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
