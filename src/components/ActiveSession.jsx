import { useState, useEffect } from 'react';
import { uid, typeTag, formatTime } from '../utils/helpers';
import { useTimer } from '../hooks/useTimer';

export default function ActiveSession({ day, onFinish, prs, setPrs }) {
  const timer = useTimer();
  const [sets, setSets] = useState(() =>
    day.exercises.map(ex => Array.from({ length: ex.sets }, () => ({
      id: uid(), weight: ex.lastWeight || '', reps: '', done: false,
    })))
  );
  const [newPrs, setNewPrs] = useState([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { timer.start(); }, []);

  const doneSets = sets.flat().filter(s => s.done).length;
  const totalSets = sets.flat().length;

  const updateSet = (exIdx, setIdx, field, val) => {
    setSets(prev => {
      const n = prev.map(s => [...s]);
      n[exIdx][setIdx] = { ...n[exIdx][setIdx], [field]: val };
      return n;
    });
  };

  const toggleDone = (exIdx, setIdx) => {
    setSets(prev => {
      const n = prev.map(s => [...s]);
      const s = n[exIdx][setIdx];
      const nowDone = !s.done;
      n[exIdx][setIdx] = { ...s, done: nowDone };
      if (nowDone && s.weight) {
        const ex = day.exercises[exIdx];
        const w = Number(s.weight);
        const prevPr = prs[ex.name] || 0;
        if (w > prevPr) {
          setPrs(p => ({ ...p, [ex.name]: w }));
          setNewPrs(np => np.includes(ex.name) ? np : [...np, ex.name]);
        }
      }
      return n;
    });
  };

  const addSet = (exIdx) => {
    setSets(prev => {
      const n = prev.map(s => [...s]);
      const last = n[exIdx][n[exIdx].length - 1];
      n[exIdx].push({ id: uid(), weight: last?.weight || '', reps: '', done: false });
      return n;
    });
  };

  const handleFinish = () => {
    timer.stop();
    const log = {
      id: uid(),
      dayName: day.name,
      type: day.type,
      date: new Date().toISOString(),
      duration: timer.elapsed,
      totalSets: doneSets,
      exercises: day.exercises.map((ex, i) => ({
        name: ex.name,
        sets: sets[i].filter(s => s.done).map(s => ({ weight: s.weight, reps: s.reps })),
      })),
    };
    onFinish(log);
  };

  return (
    <div className="app">
      <div className="session-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="session-title">
              {day.name} <span className={`day-tag ${typeTag(day.type)}`}>{day.type}</span>
            </div>
            <div className="session-meta">{doneSets} of {totalSets} sets done</div>
          </div>
          <div className="timer-pill">{formatTime(timer.elapsed)}</div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="content" style={{ paddingTop: 12 }}>
        {day.exercises.map((ex, exIdx) => {
          const allDone = sets[exIdx].every(s => s.done);
          const isPr = newPrs.includes(ex.name);
          return (
            <div key={ex.id} className={`exercise-card ${allDone ? 'done-card' : ''}`}>
              <div className="ex-header">
                <div>
                  <div className="ex-title">{ex.name}</div>
                  <div className="ex-scheme">{ex.sets}×{ex.reps} · Last: {ex.lastWeight ? ex.lastWeight + ' lbs' : 'BW'}</div>
                </div>
                {isPr && <span className="ex-badge pr">🏆 PR</span>}
                {allDone && !isPr && <span className="ex-badge">Done</span>}
              </div>
              <div className="sets-table">
                <div className="sets-header">
                  <div>Set</div><div>Weight</div><div>Reps</div><div></div>
                </div>
                {sets[exIdx].map((s, si) => (
                  <div key={s.id} className="set-row">
                    <div className="set-num">{si + 1}</div>
                    <input
                      className={`set-input ${s.weight ? 'filled' : ''}`}
                      type="number" placeholder="lbs" value={s.weight}
                      onChange={e => updateSet(exIdx, si, 'weight', e.target.value)}
                    />
                    <input
                      className={`set-input ${s.reps ? 'filled' : ''}`}
                      type="number" placeholder="reps" value={s.reps}
                      onChange={e => updateSet(exIdx, si, 'reps', e.target.value)}
                    />
                    <button className={`set-check ${s.done ? 'checked' : ''}`} onClick={() => toggleDone(exIdx, si)}>
                      {s.done ? '✓' : ''}
                    </button>
                  </div>
                ))}
                <button className="add-set-btn" onClick={() => addSet(exIdx)}>+ set</button>
              </div>
            </div>
          );
        })}
        <div style={{ height: 80 }} />
      </div>
      <button className="finish-btn" onClick={handleFinish}>Finish session</button>
    </div>
  );
}
