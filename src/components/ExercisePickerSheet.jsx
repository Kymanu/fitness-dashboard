import { useState } from 'react';
import { uid } from '../utils/helpers';
import { EXERCISE_LIBRARY, CATEGORIES } from '../data/exercises';

export default function ExercisePickerSheet({ templateName, onAdd, onClose }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [exercise, setExercise] = useState(EXERCISE_LIBRARY[CATEGORIES[0]][0]);
  const [sets,     setSets]     = useState('3');
  const [reps,     setReps]     = useState('');

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setExercise(EXERCISE_LIBRARY[cat][0]);
  };

  const handleAdd = () => {
    onAdd({
      id: uid(),
      name: exercise,
      sets: Math.max(1, parseInt(sets, 10) || 3),
      reps: reps.trim() || '8–12',
      lastWeight: '',
    });
  };

  return (
    <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
            Add to {templateName}
          </div>
          <button onClick={onClose} style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, padding: '4px 10px', background: 'var(--accent-bg)', borderRadius: 6 }}>
            Done
          </button>
        </div>

        <div className="field-label">Muscle group</div>
        <div className="cat-pills">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-pill ${category === cat ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="field-label" style={{ marginTop: 14 }}>Exercise</div>
        <div className="builder-select-wrap">
          <select
            className="builder-select"
            value={exercise}
            onChange={e => setExercise(e.target.value)}
          >
            {EXERCISE_LIBRARY[category].map(ex => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>

        <div className="field-row" style={{ marginTop: 12 }}>
          <div>
            <div className="field-label">Sets</div>
            <input
              className="field-input"
              type="number"
              min="1"
              value={sets}
              onChange={e => setSets(e.target.value)}
            />
          </div>
          <div>
            <div className="field-label">Reps</div>
            <input
              className="field-input"
              placeholder="e.g. 8–12"
              value={reps}
              onChange={e => setReps(e.target.value)}
            />
          </div>
        </div>

        <button className="builder-add-btn" style={{ marginTop: 12 }} onClick={handleAdd}>
          + Add exercise
        </button>
      </div>
    </div>
  );
}
