import { useState, useEffect } from 'react';
import { load, save } from './utils/helpers';
import { DEFAULT_PROGRAM } from './data/program';
import TodayTab from './components/TodayTab';
import ProgramTab from './components/ProgramTab';
import ProgressTab from './components/ProgressTab';
import ActiveSession from './components/ActiveSession';

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

  useEffect(() => { save('lift_program', program); }, [program]);
  useEffect(() => { save('lift_history', history); }, [history]);
  useEffect(() => { save('lift_prs',     prs);     }, [prs]);

  const handleStart = (day) => {
    setActiveSession(day);
    setSessionMinimized(false);
  };

  const handleMinimize = () => {
    setSessionMinimized(true);
    setTab('today');
  };

  const handleResume = () => {
    setSessionMinimized(false);
  };

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

  return (
    <>
      {/* ActiveSession stays mounted whenever a session exists so React
          preserves all set/timer state. Hidden via display:none when minimized. */}
      {activeSession && (
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

      {/* Tab shell — visible when there is no active session, or it is minimized */}
      {(!activeSession || sessionMinimized) && (
        <div className="app">
          {tab === 'today' && (
            <TodayTab
              program={program}
              onStart={handleStart}
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
