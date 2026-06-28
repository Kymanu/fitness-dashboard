import { useState, useEffect } from 'react';
import { load, save } from './utils/helpers';
import { DEFAULT_PROGRAM } from './data/program';
import TodayTab from './components/TodayTab';
import ProgramTab from './components/ProgramTab';
import ProgressTab from './components/ProgressTab';
import ActiveSession from './components/ActiveSession';

export default function App() {
  const [tab, setTab] = useState('today');
  const [program, setProgram] = useState(() => load('lift_program', DEFAULT_PROGRAM));
  const [history, setHistory] = useState(() => load('lift_history', []));
  const [prs, setPrs] = useState(() => load('lift_prs', {}));
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => { save('lift_program', program); }, [program]);
  useEffect(() => { save('lift_history', history); }, [history]);
  useEffect(() => { save('lift_prs', prs); }, [prs]);

  const handleStart = (day) => setActiveSession(day);
  const handleFinish = (log) => {
    setHistory(h => [...h, log]);
    setActiveSession(null);
    setTab('progress');
  };

  if (activeSession) {
    return <ActiveSession day={activeSession} onFinish={handleFinish} prs={prs} setPrs={setPrs} />;
  }

  const tabs = [
    { id: 'today', label: 'Today', icon: '⚡' },
    { id: 'program', label: 'Program', icon: '📋' },
    { id: 'progress', label: 'Progress', icon: '📈' },
  ];

  return (
    <div className="app">
      {tab === 'today' && <TodayTab program={program} onStart={handleStart} />}
      {tab === 'program' && <ProgramTab program={program} setProgram={setProgram} />}
      {tab === 'progress' && <ProgressTab history={history} prs={prs} />}

      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
