import { useState, useEffect } from 'react';
import { uid, typeTag, formatTime, FULL_DAYS } from '../utils/helpers';
import { useTimer } from '../hooks/useTimer';

// Per-exercise state based on how many of its sets are checked
function exState(setRows) {
  const done = setRows.filter(s => s.done).length;
  if (done === 0) return 'idle';
  if (done === setRows.length) return 'done';
  return 'active';
}

export default function ActiveSession({ day, onFinish, prs, setPrs }) {
  const timer = useTimer();
  const [sets, setSets] = useState(() =>
    day.exercises.map(ex => Array.from({ length: ex.sets }, () => ({
      id: uid(), weight: ex.lastWeight || '', reps: '', done: false,
    })))
  );
  const [newPrs, setNewPrs] = useState([]);
  const [pickingDay, setPickingDay] = useState(false);
  const [pendingLog, setPendingLog] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { timer.start(); }, []);

  const exStates = sets.map(exState);
  const doneExs  = exStates.filter(s => s === 'done').length;
  const totalExs = day.exercises.length;
  const progressPct = totalExs > 0 ? (doneExs / totalExs) * 100 : 0;

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

  const handleFinishClick = () => {
    timer.stop();
    const doneSets = sets.flat().filter(s => s.done).length;
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
    setPendingLog(log);
    setPickingDay(true);
  };

  const confirmDay = (dayTag) => {
    onFinish({ ...pendingLog, dayTag });
  };

  return (
    <div className="app">
      {/* Day-tag picker — shown after Finish is tapped */}
      {pickingDay && (
        <div className="sheet-overlay">
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-title">Tag this session</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
              Which day was this workout for?
            </div>
            <div className="day-pick-grid">
              {FULL_DAYS.map(d => (
                <button key={d} className="day-pick-btn" onClick={() => confirmDay(d)}>
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
            <button
              style={{ marginTop: 14, width: '100%', padding: '12px', fontSize: 13, color: 'var(--text-3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
              onClick={() => confirmDay(null)}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Session header */}
      <div className="session-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="session-title">
              {day.name} <span className={`day-tag ${typeTag(day.type)}`}>{day.type}</span>
            </div>
            <div className="session-meta">
              {totalExs > 0
                ? `${doneExs} of ${totalExs} exercises done`
                : 'Custom session'}
            </div>
          </div>
          <div className="timer-pill">{formatTime(timer.elapsed)}</div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Exercise cards */}
      <div className="content" style={{ paddingTop: 12 }}>
        {day.exercises.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
            Custom session — tap Finish when you're done.
          </div>
        )}

        {day.exercises.map((ex, exIdx) => {
          const state   = exStates[exIdx];
          const isDone  = state === 'done';
          const isActive= state === 'active';
          const isPr    = newPrs.includes(ex.name);

          return (
            <div
              key={ex.id}
              className={`exercise-card ${isDone ? 'ex-done' : ''} ${isActive ? 'ex-active' : ''}`}
            >
              <div className="ex-header">
                <div>
                  <div className="ex-title">{ex.name}</div>
                  <div className="ex-scheme">{ex.sets}×{ex.reps} · Last: {ex.lastWeight ? ex.lastWeight + ' lbs' : 'BW'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isPr    && <span className="ex-badge pr">PR</span>}
                  {isDone  && <span className="ex-badge ex-done-badge">✓ Done</span>}
                </div>
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

      <button className="finish-btn" onClick={handleFinishClick}>Finish session</button>
    </div>
  );
}
