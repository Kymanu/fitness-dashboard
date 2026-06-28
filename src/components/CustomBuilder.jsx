import { useState } from 'react';
import { uid } from '../utils/helpers';
import { EXERCISE_LIBRARY, CATEGORIES } from '../data/exercises';

export default function CustomBuilder({ onStart, onCancel }) {
  const [exercises,     setExercises]     = useState([]);
  const [draftCategory, setDraftCategory] = useState(CATEGORIES[0]);
  const [draftExercise, setDraftExercise] = useState(EXERCISE_LIBRARY[CATEGORIES[0]][0]);
  const [draftSets,     setDraftSets]     = useState('3');
  const [draftReps,     setDraftReps]     = useState('');

  const handleCategoryChange = (cat) => {
    setDraftCategory(cat);
    setDraftExercise(EXERCISE_LIBRARY[cat][0]);
  };

  const addExercise = () => {
    setExercises(prev => [...prev, {
      id: uid(),
      name: draftExercise,
      sets: Math.max(1, parseInt(draftSets, 10) || 3),
      reps: draftReps.trim() || '8–12',
      lastWeight: '',
    }]);
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
              ? 'Pick exercises below'
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
                <button className="builder-remove-btn" onClick={() => removeExercise(ex.id)}>×</button>
              </div>
            ))}
          </>
        )}

        <div className="section-title">Add exercise</div>
        <div className="builder-add-form">

          {/* Category pills */}
          <div className="field-label">Muscle group</div>
          <div className="cat-pills">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`cat-pill ${draftCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Exercise select — re-renders when category changes */}
          <div className="field-label" style={{ marginTop: 14 }}>Exercise</div>
          <div className="builder-select-wrap">
            <select
              className="builder-select"
              value={draftExercise}
              onChange={e => setDraftExercise(e.target.value)}
            >
              {EXERCISE_LIBRARY[draftCategory].map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>

          {/* Sets + Reps */}
          <div className="field-row" style={{ marginTop: 12 }}>
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

          <button className="builder-add-btn" onClick={addExercise} style={{ marginTop: 12 }}>
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
