import { useState, useRef } from 'react';
import { uid } from '../utils/helpers';

export default function CustomBuilder({ onStart, onCancel }) {
  const [exercises,  setExercises]  = useState([]);
  const [draftName,  setDraftName]  = useState('');
  const [draftSets,  setDraftSets]  = useState('3');
  const [draftReps,  setDraftReps]  = useState('');
  const nameRef = useRef(null);

  const addExercise = () => {
    const name = draftName.trim();
    if (!name) return;
    setExercises(prev => [...prev, {
      id: uid(),
      name,
      sets: Math.max(1, parseInt(draftSets, 10) || 3),
      reps: draftReps.trim() || '8–12',
      lastWeight: '',
    }]);
    setDraftName('');
    nameRef.current?.focus();
  };

  const removeExercise = (id) => setExercises(prev => prev.filter(e => e.id !== id));

  const canStart = exercises.length > 0;
  const exCount  = exercises.length;

  return (
    <div className="app">
      <div className="builder-header">
        <button className="session-back-btn" onClick={onCancel}>‹</button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>
            Build workout
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
            {exCount === 0
              ? 'Add exercises below'
              : `${exCount} exercise${exCount !== 1 ? 's' : ''} added`}
          </div>
        </div>
      </div>

      <div className="content" style={{ paddingTop: 8 }}>
        {exercises.length > 0 && (
          <>
            <div className="section-title">Your workout</div>
            {exercises.map(ex => (
              <div key={ex.id} className="builder-ex-card">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="builder-ex-name">{ex.name}</div>
                  <div className="builder-ex-scheme">{ex.sets} sets · {ex.reps} reps</div>
                </div>
                <button className="builder-remove-btn" onClick={() => removeExercise(ex.id)}>
                  ×
                </button>
              </div>
            ))}
          </>
        )}

        <div className="section-title">Add exercise</div>
        <div className="builder-add-form">
          <div className="field-label">Exercise name</div>
          <input
            ref={nameRef}
            className="field-input"
            placeholder="e.g. DB Bicep Curl"
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addExercise(); }}
            autoComplete="off"
            autoCapitalize="words"
          />
          <div className="field-row">
            <div>
              <div className="field-label">Sets</div>
              <input
                className="field-input"
                type="number"
                min="1"
                value={draftSets}
                onChange={e => setDraftSets(e.target.value)}
              />
            </div>
            <div>
              <div className="field-label">Reps</div>
              <input
                className="field-input"
                placeholder="e.g. 8–12"
                value={draftReps}
                onChange={e => setDraftReps(e.target.value)}
              />
            </div>
          </div>
          <button
            className="builder-add-btn"
            onClick={addExercise}
            disabled={!draftName.trim()}
          >
            + Add to workout
          </button>
        </div>

        <div style={{ height: 100 }} />
      </div>

      <button
        className="finish-btn"
        disabled={!canStart}
        onClick={() => onStart(exercises)}
      >
        {canStart
          ? `Start session · ${exCount} exercise${exCount !== 1 ? 's' : ''}`
          : 'Add exercises to start'}
      </button>
    </div>
  );
}
